import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { validateDataset } from "@/lib/xsdValidator";
import { generateXml } from "@/lib/xmlGenerator";

// GET /api/reports/[id] - Obtener detalle de reporte con validaciones en tiempo real
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const { id } = await params;
    const reportId = parseInt(id, 10);

    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        area: true,
        mapping: true,
        approvals: {
          include: { user: true },
        },
        comments: {
          include: { user: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Reporte no encontrado." }, { status: 404 });
    }

    // 1. Decodificar el conjunto de datos
    const rows = JSON.parse(report.dataJson || "[]");

    // 2. Ejecutar motor de validación contra el esquema XSD si hay un mapeo asociado
    let errors: Record<number, Record<string, string>> = {};
    if (report.mapping) {
      const fieldMappings = JSON.parse(report.mapping.fieldMappings || "{}");
      errors = validateDataset(report.reportCode, rows, fieldMappings);
    }

    return NextResponse.json({
      report,
      rows,
      errors,
    });
  } catch (error) {
    console.error("❌ Error en GET api/reports/[id]:", error);
    return NextResponse.json({ error: "Error al cargar los detalles del reporte." }, { status: 500 });
  }
}

// PUT /api/reports/[id] - Editar celdas del reporte o procesar el flujo de aprobación
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const { id } = await params;
    const reportId = parseInt(id, 10);
    const body = await req.json();
    const { rows, action, comment } = body;

    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        area: true,
        mapping: true,
        approvals: true,
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Reporte no encontrado." }, { status: 404 });
    }

    // --- ACCIÓN A: Actualización de datos (Edición rápida de celdas) ---
    if (rows) {
      if (report.status !== "DRAFT" && report.status !== "REJECTED" && session.role !== "ADMIN") {
        return NextResponse.json(
          { error: "No se puede editar este reporte porque ya se encuentra en revisión o está aprobado." },
          { status: 400 }
        );
      }

      const updatedReport = await prisma.report.update({
        where: { id: reportId },
        data: {
          dataJson: JSON.stringify(rows),
        },
      });

      return NextResponse.json({ success: true, report: updatedReport });
    }

    // --- ACCIÓN B: Flujo de Aprobación (Máquina de estados) ---
    if (action) {
      // 1. ANALISTA ENVÍA A REVISIÓN
      if (action === "submit") {
        if (session.role !== "ANALYST" && session.role !== "ADMIN") {
          return NextResponse.json({ error: "Solo los analistas o administradores pueden enviar reportes a revisión." }, { status: 403 });
        }

        // Realizar validación final estricta de XSD antes de permitir envío (OPCIONAL, pero aconsejado)
        // En nuestro flujo, se permite enviar a revisión, pero el Revisor verá si tiene errores aún.
        const updated = await prisma.report.update({
          where: { id: reportId },
          data: { status: "PENDING_APPROVAL" },
        });

        // Crear comentario automático de sistema
        await prisma.comment.create({
          data: {
            reportId,
            userId: session.userId,
            content: "📤 Reporte enviado a revisión para aprobación del área.",
          },
        });

        // Obtener revisores del área
        const areaApprovers = await prisma.user.findMany({
          where: {
            areaId: report.areaId,
            role: "APPROVER",
          },
        });

        // Crear notificaciones para cada revisor del área
        for (const approver of areaApprovers) {
          await prisma.notification.create({
            data: {
              userId: approver.id,
              content: `📥 Firma Requerida: El Analista ${session.name} ha enviado el reporte '${report.reportCode} - ${report.area.name}' para revisión.`,
              type: "INFO",
              link: `/reports/${reportId}`,
            },
          });
        }

        return NextResponse.json({ success: true, report: updated });
      }

      // 2. REVISOR RECHAZA REPORTE
      if (action === "reject") {
        if (session.role !== "APPROVER" && session.role !== "ADMIN") {
          return NextResponse.json({ error: "Solo los aprobadores del área o administradores pueden rechazar reportes." }, { status: 403 });
        }

        if (!comment || !comment.trim()) {
          return NextResponse.json({ error: "Debe proveer una observación/comentario obligatorio al rechazar." }, { status: 400 });
        }

        // Eliminar aprobaciones previas al retroceder a borrador
        await prisma.approval.deleteMany({
          where: { reportId },
        });

        const updated = await prisma.report.update({
          where: { id: reportId },
          data: { status: "REJECTED" },
        });

        await prisma.comment.create({
          data: {
            reportId,
            userId: session.userId,
            content: `❌ Rechazado con observaciones: ${comment}`,
          },
        });

        // Notificar al creador del reporte
        await prisma.notification.create({
          data: {
            userId: report.creatorId,
            content: `❌ Reporte Rechazado: El Revisor ${session.name} ha rechazado tu reporte '${report.reportCode}' con la nota: "${comment}"`,
            type: "REJECTION",
            link: `/reports/${reportId}`,
          },
        });

        return NextResponse.json({ success: true, report: updated });
      }

      // 3. REVISOR CONFIERE APROBACIÓN
      if (action === "approve") {
        if (session.role !== "APPROVER" && session.role !== "ADMIN") {
          return NextResponse.json({ error: "Solo los aprobadores del área pueden firmar el reporte." }, { status: 403 });
        }

        if (report.status !== "PENDING_APPROVAL") {
          return NextResponse.json({ error: "El reporte no está en estado de revisión pendiente." }, { status: 400 });
        }

        // Validar si el usuario ya firmó este reporte
        const alreadyApproved = report.approvals.some((a) => a.userId === session.userId);
        if (alreadyApproved) {
          return NextResponse.json({ error: "Usted ya ha firmado/aprobado este reporte previamente." }, { status: 400 });
        }

        // Guardar firma de aprobación
        await prisma.approval.create({
          data: {
            reportId,
            userId: session.userId,
          },
        });

        // Contar cuántos revisores en total tiene esta área para determinar si se requiere aprobación de multi-firma
        const totalApproversInArea = await prisma.user.count({
          where: {
            areaId: report.areaId,
            role: "APPROVER",
          },
        });

        // Obtener el número actual de firmas otorgadas
        const currentApprovalsCount = await prisma.approval.count({
          where: { reportId },
        });

        // Si todos los revisores asignados al área han firmado (o al menos 1 en áreas chicas)
        // O si hay multi-firmas requeridas (ej. 2 aprobaciones para Financiera)
        const approvalsRequired = Math.max(1, totalApproversInArea); // Requiere todas las firmas registradas en su área
        const isFullyApproved = currentApprovalsCount >= approvalsRequired;

        let updated;
        if (isFullyApproved) {
          // Si el reporte se aprueba completamente, compilamos el XML definitivo y lo sellamos
          const parsedRows = JSON.parse(report.dataJson || "[]");
          const generatedXml = generateXml(report.reportCode, parsedRows);

          updated = await prisma.report.update({
            where: { id: reportId },
            data: {
              status: "APPROVED",
              generatedXml,
            },
          });

          await prisma.comment.create({
            data: {
              reportId,
              userId: session.userId,
              content: `🎉 Aprobación final concedida. XML oficial regulatorio generado y listo para descarga.`,
            },
          });

          // Notificar al creador del reporte
          await prisma.notification.create({
            data: {
              userId: report.creatorId,
              content: `🎉 Reporte Aprobado: Tu reporte '${report.reportCode}' ha sido aprobado y el XML final está listo para descarga.`,
              type: "SUCCESS",
              link: `/reports/${reportId}`,
            },
          });
        } else {
          // Aprobación parcial (Falta otra firma de área)
          updated = await prisma.report.findUnique({ where: { id: reportId } });
          
          await prisma.comment.create({
            data: {
              reportId,
              userId: session.userId,
              content: `✍️ Reporte firmado y aprobado de forma parcial (${currentApprovalsCount}/${approvalsRequired} aprobaciones).`,
            },
          });

          // Notificar al creador del reporte
          await prisma.notification.create({
            data: {
              userId: report.creatorId,
              content: `✍️ Aprobación Parcial: El Revisor ${session.name} ha firmado tu reporte '${report.reportCode}' (${currentApprovalsCount}/${approvalsRequired} firmas).`,
              type: "INFO",
              link: `/reports/${reportId}`,
            },
          });
        }

        return NextResponse.json({ success: true, report: updated, isFullyApproved });
      }
    }

    return NextResponse.json({ error: "Parámetros inválidos." }, { status: 400 });
  } catch (error: any) {
    console.error("❌ Error en PUT api/reports/[id]:", error);
    return NextResponse.json({ error: "Error procesando la actualización del reporte." }, { status: 500 });
  }
}
