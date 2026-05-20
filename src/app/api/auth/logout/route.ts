import { NextResponse } from "next/server";
import { destroySession } from "@/lib/session";

export async function POST() {
  try {
    await destroySession();
    return NextResponse.json({ success: true, message: "Sesión cerrada correctamente." });
  } catch (error) {
    console.error("❌ Error en API Logout:", error);
    return NextResponse.json(
      { error: "Ocurrió un error inesperado al cerrar sesión." },
      { status: 500 }
    );
  }
}
