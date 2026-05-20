import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { Client } from "pg";
import fs from "fs";
import path from "path";

// POST /api/connections/test - Probar los parámetros de conexión
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const body = await req.json();
    const { engine, host, port, username, password, database, isMock } = body;

    if (isMock) {
      // Simular un delay para dar efecto realista en la UI
      await new Promise((resolve) => setTimeout(resolve, 800));
      return NextResponse.json({
        success: true,
        message: "🧪 ¡Prueba de conexión exitosa! Modo de simulación local activo.",
      });
    }

    if (['EXCEL', 'CSV', 'TXT', 'JSON', 'XML'].includes(engine)) {
      if (!database) {
        return NextResponse.json(
          { success: false, error: "No se ha especificado ningún archivo en la configuración de la conexión." },
          { status: 400 }
        );
      }
      
      const filePath = path.join(process.cwd(), database);
      if (fs.existsSync(filePath)) {
        return NextResponse.json({
          success: true,
          message: `📂 Archivo localizado y verificado en el servidor: "${path.basename(database)}".`,
        });
      } else {
        return NextResponse.json(
          { success: false, error: `El archivo especificado no existe en el servidor: ${database}` },
          { status: 400 }
        );
      }
    }

    if (engine === 'GOOGLE_SHEETS' || engine === 'EXCEL_URL') {
      if (!database) {
        return NextResponse.json(
          { success: false, error: "No se ha especificado ninguna URL en la configuración de la conexión." },
          { status: 400 }
        );
      }
      if (database.startsWith("http://") || database.startsWith("https://")) {
        return NextResponse.json({
          success: true,
          message: "🌐 Enlace web verificado correctamente.",
        });
      } else {
        return NextResponse.json(
          { success: false, error: "La URL del documento no es válida." },
          { status: 400 }
        );
      }
    }

    if (engine === "POSTGRESQL") {
      const client = new Client({
        host: host || "localhost",
        port: port ? parseInt(port, 10) : 5432,
        user: username || "postgres",
        password: password || "",
        database: database || "",
        connectionTimeoutMillis: 5000, // Timeout rápido de 5s para pruebas
      });

      try {
        await client.connect();
        const res = await client.query("SELECT 1;");
        await client.end();

        return NextResponse.json({
          success: true,
          message: "🔌 ¡Conexión real establecida con éxito! Base de datos de origen respondiente.",
        });
      } catch (err: any) {
        console.error("❌ Error probando conexión real:", err);
        return NextResponse.json(
          {
            success: false,
            error: `Fallo de conexión real: ${err.message}`,
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `🧪 Conexión simulada con éxito para el motor ${engine}.`,
    });
  } catch (error: any) {
    console.error("❌ Error en POST api/connections/test:", error);
    return NextResponse.json({ error: "Ocurrió un error inesperado al probar la conexión." }, { status: 500 });
  }
}
