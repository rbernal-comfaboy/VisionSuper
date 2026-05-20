import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, description, connectionId, baseConfigJson, fieldsJson } = body;

    const existing = await prisma.dataSource.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!existing) {
      return NextResponse.json({ error: "La fuente de datos no existe." }, { status: 404 });
    }

    const updated = await prisma.dataSource.update({
      where: { id: parseInt(id, 10) },
      data: {
        name: name !== undefined ? name : existing.name,
        description: description !== undefined ? description : existing.description,
        connectionId: connectionId !== undefined ? parseInt(connectionId, 10) : existing.connectionId,
        baseConfigJson: baseConfigJson !== undefined 
          ? (typeof baseConfigJson === "string" ? baseConfigJson : JSON.stringify(baseConfigJson)) 
          : existing.baseConfigJson,
        fieldsJson: fieldsJson !== undefined 
          ? (typeof fieldsJson === "string" ? fieldsJson : JSON.stringify(fieldsJson)) 
          : existing.fieldsJson,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("❌ Error en PUT api/datasources/[id]:", error);
    return NextResponse.json({ error: "Error al actualizar la fuente de datos." }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado. Solo administradores pueden eliminar." }, { status: 403 });
    }

    const { id } = await params;

    await prisma.dataSource.delete({
      where: { id: parseInt(id, 10) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Error en DELETE api/datasources/[id]:", error);
    return NextResponse.json({ error: "Error al eliminar la fuente de datos." }, { status: 500 });
  }
}
