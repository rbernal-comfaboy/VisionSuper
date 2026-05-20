import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { extractData } from "@/lib/dbConnector";

// GET /api/reports - Obtener todos los reportes historicos o activos
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const reports = await prisma.report.findMany({
      include: {
        area: true,
        mapping: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error("❌ Error en GET api/reports:", error);
    return NextResponse.json({ error: "Error en el servidor al cargar reportes." }, { status: 500 });
  }
}

// POST /api/reports - Ejecutar extracción y guardar como borrador
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const body = await req.json();
    const { mappingId, areaId } = body;

    if (!mappingId || !areaId) {
      return NextResponse.json({ error: "Mapeo y Área de destino son requeridos." }, { status: 400 });
    }

    // 1. Obtener la plantilla de mapeo y su conexión o fuente de datos asociada
    const mapping = await prisma.reportMapping.findUnique({
      where: { id: parseInt(mappingId, 10) },
      include: { 
        connection: true,
        dataSource: {
          include: {
            connection: true
          }
        }
      },
    });

    if (!mapping) {
      return NextResponse.json({ error: "El mapeo seleccionado no existe." }, { status: 404 });
    }

    // 2. Determinar la conexión y consulta a utilizar
    let targetConnection = mapping.connection;
    let targetSqlQuery = mapping.sqlQuery || "";
    const dataSource = mapping.dataSource;

    if (dataSource) {
      targetConnection = dataSource.connection;
      if (!targetSqlQuery) {
        try {
          const config = JSON.parse(dataSource.baseConfigJson || "{}");
          if (config.type === "TABLE") {
            targetSqlQuery = `SELECT * FROM ${config.queryOrTable}`;
          } else if (config.type === "CUSTOM_SQL") {
            targetSqlQuery = config.queryOrTable || "";
          }
        } catch (e) {
          console.error("❌ Error al parsear baseConfigJson de DataSource:", e);
        }
      }
    }

    if (!targetConnection) {
      return NextResponse.json({ error: "No se encontró una conexión válida de base de datos." }, { status: 400 });
    }

    // 3. Ejecutar extracción dinámica (conectándose a la BD real o mockeando datos)
    let extractedRows: any[] = [];
    try {
      extractedRows = await extractData(
        targetConnection as any,
        targetSqlQuery,
        mapping.reportCode,
        dataSource
      );
    } catch (err: any) {
      console.error("❌ Error en extracción de datos:", err);
      return NextResponse.json({ error: `Fallo en el origen de datos: ${err.message}` }, { status: 400 });
    }

    // 3. Guardar el reporte extraído localmente en la base de datos en estado borrador (DRAFT)
    const report = await prisma.report.create({
      data: {
        reportCode: mapping.reportCode,
        mappingId: mapping.id,
        status: "DRAFT",
        dataJson: JSON.stringify(extractedRows),
        areaId: parseInt(areaId, 10),
        creatorId: session.userId,
        creatorName: session.name,
      },
    });

    return NextResponse.json(report);
  } catch (error: any) {
    console.error("❌ Error en POST api/reports:", error);
    return NextResponse.json({ error: "Error inesperado al iniciar la extracción de datos." }, { status: 500 });
  }
}
