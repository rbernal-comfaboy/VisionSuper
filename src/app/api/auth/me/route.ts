import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { authenticated: false, error: "No autenticado." },
        { status: 401 }
      );
    }

    // Buscar al usuario actualizado para obtener cambios de roles u área
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { area: true },
    });

    if (!user) {
      return NextResponse.json(
        { authenticated: false, error: "Usuario no encontrado." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        area: user.area ? { id: user.area.id, name: user.area.name } : null,
      },
    });
  } catch (error) {
    console.error("❌ Error en API Me:", error);
    return NextResponse.json(
      { error: "Ocurrió un error inesperado al verificar la sesión." },
      { status: 500 }
    );
  }
}
