import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const dataSources = await prisma.dataSource.findMany({
      include: { connection: true },
      orderBy: { id: "asc" },
    });

    return NextResponse.json(dataSources);
  } catch (error) {
    console.error("❌ Error en GET api/datasources:", error);
    return NextResponse.json({ error: "Error en el servidor." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, connectionId, baseConfigJson, fieldsJson } = body;

    if (!name || !connectionId) {
      return NextResponse.json({ error: "Nombre y Conexión son campos requeridos." }, { status: 400 });
    }

    const dataSource = await prisma.dataSource.create({
      data: {
        name,
        description,
        connectionId: parseInt(connectionId, 10),
        baseConfigJson: typeof baseConfigJson === "string" ? baseConfigJson : JSON.stringify(baseConfigJson || {}),
        fieldsJson: typeof fieldsJson === "string" ? fieldsJson : JSON.stringify(fieldsJson || []),
      },
    });

    return NextResponse.json(dataSource);
  } catch (error) {
    console.error("❌ Error en POST api/datasources:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error al crear la fuente de datos." }, { status: 500 });
  }
}
