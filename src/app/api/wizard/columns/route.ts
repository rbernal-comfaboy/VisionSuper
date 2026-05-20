import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Client } from 'pg';

export async function POST(request: Request) {
  try {
    const { connectionId, tableName, tableSchema } = await request.json();

    if (!connectionId || !tableName) {
      return NextResponse.json({ success: false, message: 'Faltan parámetros' }, { status: 400 });
    }

    const connection = await prisma.connection.findUnique({ where: { id: Number(connectionId) } });
    if (!connection) {
      return NextResponse.json({ success: false, message: 'Conexión no encontrada' }, { status: 404 });
    }

    const engine = connection.engine;
    let columns: { name: string; dataType: string; nullable: boolean }[] = [];

    // ── Mock ──────────────────────────────────────────────────────────────────
    if (connection.isMock) {
      const mockSchemas: Record<string, { name: string; dataType: string; nullable: boolean }[]> = {
        cajas_presupuesto: [
          { name: 'nit_caja', dataType: 'varchar', nullable: false },
          { name: 'periodo', dataType: 'varchar', nullable: false },
          { name: 'codigo_concepto', dataType: 'varchar', nullable: false },
          { name: 'descripcion', dataType: 'varchar', nullable: true },
          { name: 'valor_presupuesto', dataType: 'decimal', nullable: true },
          { name: 'valor_ejecutado', dataType: 'decimal', nullable: true },
        ],
        core_empresas: [
          { name: 'tipo_doc', dataType: 'int', nullable: false },
          { name: 'numero_doc', dataType: 'varchar', nullable: false },
          { name: 'razon_social', dataType: 'varchar', nullable: true },
          { name: 'dane_municipio', dataType: 'varchar', nullable: true },
          { name: 'estado', dataType: 'int', nullable: true },
        ],
        ledger_aportes: [
          { name: 'nit_empresa', dataType: 'varchar', nullable: false },
          { name: 'total_aportado', dataType: 'decimal', nullable: true },
          { name: 'periodo', dataType: 'varchar', nullable: false },
        ],
      };
      columns = mockSchemas[tableName] || [
        { name: 'id', dataType: 'int', nullable: false },
        { name: 'descripcion', dataType: 'varchar', nullable: true },
        { name: 'valor', dataType: 'decimal', nullable: true },
      ];
    }

    // ── SQL Server ────────────────────────────────────────────────────────────
    else if (engine === 'SQLSERVER') {
      const mssql = await import('mssql');
      const pool = await mssql.default.connect({
        server: connection.host || 'localhost',
        port: connection.port || 1433,
        user: connection.username || '',
        password: connection.password || '',
        database: connection.database || '',
        options: { encrypt: false, trustServerCertificate: true },
        connectionTimeout: 10000,
        requestTimeout: 15000,
      });

      const schema = tableSchema || 'dbo';
      const result = await pool.request()
        .input('table', mssql.default.VarChar, tableName)
        .input('schema', mssql.default.VarChar, schema)
        .query(`
          SELECT 
            COLUMN_NAME  AS name,
            DATA_TYPE    AS dataType,
            IS_NULLABLE  AS nullable
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_NAME = @table AND TABLE_SCHEMA = @schema
          ORDER BY ORDINAL_POSITION
        `);
      await pool.close();

      columns = result.recordset.map((r: any) => ({
        name: r.name,
        dataType: r.dataType,
        nullable: r.nullable === 'YES',
      }));
    }

    // ── PostgreSQL ────────────────────────────────────────────────────────────
    else if (engine === 'POSTGRESQL') {
      const client = new Client({
        host: connection.host || 'localhost',
        port: connection.port || 5432,
        user: connection.username || 'postgres',
        password: connection.password || '',
        database: connection.database || '',
      });
      await client.connect();
      const res = await client.query(
        `SELECT column_name AS name, data_type AS "dataType",
                (is_nullable = 'YES') AS nullable
         FROM information_schema.columns
         WHERE table_name = $1 AND table_schema = $2
         ORDER BY ordinal_position`,
        [tableName, tableSchema || 'public']
      );
      await client.end();
      columns = res.rows;
    }

    else {
      return NextResponse.json({ success: false, message: `Motor '${engine}' no soportado para introspección de columnas.` }, { status: 400 });
    }

    return NextResponse.json({ success: true, columns });
  } catch (error: any) {
    console.error('❌ Error en /api/wizard/columns:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
