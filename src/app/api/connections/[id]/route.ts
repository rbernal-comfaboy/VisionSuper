import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

// DELETE /api/connections/[id] - Eliminar una conexión
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
    const connectionId = parseInt(id, 10);

    // Verificar si la conexión tiene mapeos asociados para evitar fallos de clave foránea
    const mappingsCount = await prisma.reportMapping.count({
      where: { connectionId },
    });

    if (mappingsCount > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar la conexión porque tiene mapeos de reportes asociados. Elimine los mapeos primero." },
        { status: 400 }
      );
    }

    await prisma.connection.delete({
      where: { id: connectionId },
    });

    return NextResponse.json({ success: true, message: "Conexión eliminada correctamente." });
  } catch (error) {
    console.error("❌ Error en DELETE api/connections/[id]:", error);
    return NextResponse.json({ error: "Error al eliminar la conexión." }, { status: 500 });
  }
}
