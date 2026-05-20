import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

// GET /api/connections - Obtener todas las conexiones
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const connections = await prisma.connection.findMany({
      orderBy: { id: "asc" },
    });

    return NextResponse.json(connections);
  } catch (error) {
    console.error("❌ Error en GET api/connections:", error);
    return NextResponse.json({ error: "Error en el servidor." }, { status: 500 });
  }
}

// POST /api/connections - Crear nueva conexión
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const body = await req.json();
    const { name, engine, host, port, username, password, database, isMock } = body;

    if (!name || !engine) {
      return NextResponse.json({ error: "Nombre y Motor son campos requeridos." }, { status: 400 });
    }

    const connection = await prisma.connection.create({
      data: {
        name,
        engine,
        host: isMock ? null : host,
        port: isMock ? null : port ? parseInt(port, 10) : null,
        username: isMock ? null : username,
        password: isMock ? null : password,
        database: isMock ? null : database,
        isMock: !!isMock,
      },
    });

    return NextResponse.json(connection);
  } catch (error) {
    console.error("❌ Error en POST api/connections:", error);
    return NextResponse.json({ error: "Error al crear la conexión." }, { status: 500 });
  }
}
