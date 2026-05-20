import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/crypto";
import { createSession } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Correo electrónico y contraseña son obligatorios." },
        { status: 400 }
      );
    }

    // Buscar al usuario e incluir su área asociada
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { area: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Credenciales incorrectas." },
        { status: 401 }
      );
    }

    // Verificar contraseña
    const isPasswordCorrect = verifyPassword(password, user.passwordHash);

    if (!isPasswordCorrect) {
      return NextResponse.json(
        { error: "Credenciales incorrectas." },
        { status: 401 }
      );
    }

    // Crear sesión encriptada en la cookie
    const sessionData = {
      userId: user.id,
      email: user.email,
      role: user.role,
      areaId: user.areaId,
      name: user.name,
    };

    await createSession(sessionData);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        area: user.area ? { id: user.area.id, name: user.area.name } : null,
      },
    });
  } catch (error) {
    console.error("❌ Error en API Login:", error);
    return NextResponse.json(
      { error: "Ocurrió un error inesperado en el servidor." },
      { status: 500 }
    );
  }
}
