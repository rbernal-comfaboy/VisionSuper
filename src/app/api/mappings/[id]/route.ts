import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

// DELETE /api/mappings/[id] - Eliminar un mapeo
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado. Solo administradores." }, { status: 403 });
    }

    const { id } = await params;
    const mappingId = parseInt(id, 10);

    // Verificar si el mapeo tiene reportes extraídos asociados
    const reportsCount = await prisma.report.count({
      where: { mappingId },
    });

    if (reportsCount > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar este mapeo porque ya existen reportes históricos o en revisión que dependen de él. Se debe conservar para auditoría." },
        { status: 400 }
      );
    }

    await prisma.reportMapping.delete({
      where: { id: mappingId },
    });

    return NextResponse.json({ success: true, message: "Mapeo de reporte eliminado correctamente." });
  } catch (error) {
    console.error("❌ Error en DELETE api/mappings/[id]:", error);
    return NextResponse.json({ error: "Error al eliminar el mapeo." }, { status: 500 });
  }
}
