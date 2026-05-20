import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

// GET /api/areas - Obtener listado de áreas de la Caja de Compensación
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const areas = await prisma.area.findMany({
      orderBy: { id: "asc" },
    });

    return NextResponse.json(areas);
  } catch (error) {
    console.error("❌ Error en GET api/areas:", error);
    return NextResponse.json({ error: "Error al cargar las áreas." }, { status: 500 });
  }
}
