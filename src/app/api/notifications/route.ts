import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

// GET /api/notifications - Obtener notificaciones del usuario logueado
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const whereClause: any = {
      userId: session.userId,
    };

    if (unreadOnly) {
      whereClause.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("❌ Error en GET api/notifications:", error);
    return NextResponse.json({ error: "Error en el servidor al cargar notificaciones." }, { status: 500 });
  }
}

// PUT /api/notifications - Marcar notificaciones como leídas
export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const body = await req.json();
    const { id } = body; // Opcional: id de una notificación específica

    if (id) {
      const updated = await prisma.notification.update({
        where: {
          id: parseInt(id, 10),
          userId: session.userId,
        },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true, notification: updated });
    } else {
      // Marcar todas como leídas
      const result = await prisma.notification.updateMany({
        where: {
          userId: session.userId,
          isRead: false,
        },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true, count: result.count });
    }
  } catch (error) {
    console.error("❌ Error en PUT api/notifications:", error);
    return NextResponse.json({ error: "Error al actualizar notificaciones." }, { status: 500 });
  }
}

// POST /api/notifications - Crear una nueva notificación (Para uso del backend/sistemas de eventos)
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const body = await req.json();
    const { userId, content, type, link } = body;

    if (!userId || !content || !type) {
      return NextResponse.json({ error: "Parámetros incompletos." }, { status: 400 });
    }

    const notification = await prisma.notification.create({
      data: {
        userId: parseInt(userId, 10),
        content,
        type,
        link,
      },
    });

    return NextResponse.json(notification);
  } catch (error) {
    console.error("❌ Error en POST api/notifications:", error);
    return NextResponse.json({ error: "Error al crear notificación." }, { status: 500 });
  }
}
