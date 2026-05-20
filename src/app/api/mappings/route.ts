import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

// GET /api/mappings - Obtener todos los mapeos configurados
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const mappings = await prisma.reportMapping.findMany({
      include: { connection: true, dataSource: true },
      orderBy: { id: "asc" },
    });

    return NextResponse.json(mappings);
  } catch (error) {
    console.error("❌ Error en GET api/mappings:", error);
    return NextResponse.json({ error: "Error en el servidor." }, { status: 500 });
  }
}

// POST /api/mappings - Crear un nuevo mapeo de reporte
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado. Solo administradores." }, { status: 403 });
    }

    const body = await req.json();
    const { name, reportCode, sqlQuery, fieldMappings, connectionId } = body;

    if (!name || !reportCode || !sqlQuery || !connectionId || !fieldMappings) {
      return NextResponse.json({ error: "Todos los campos son obligatorios." }, { status: 400 });
    }

    const mapping = await prisma.reportMapping.create({
      data: {
        name,
        reportCode,
        sqlQuery,
        fieldMappings: typeof fieldMappings === "string" ? fieldMappings : JSON.stringify(fieldMappings),
        connectionId: parseInt(connectionId, 10),
      },
    });

    return NextResponse.json(mapping);
  } catch (error) {
    console.error("❌ Error en POST api/mappings:", error);
    return NextResponse.json({ error: "Error al crear el mapeo." }, { status: 500 });
  }
}
