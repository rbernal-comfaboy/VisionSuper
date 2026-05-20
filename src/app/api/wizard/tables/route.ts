import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Client } from 'pg';
import * as xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { connectionId } = await request.json();

    if (!connectionId) {
      return NextResponse.json({ success: false, message: 'Falta el ID de conexión' }, { status: 400 });
    }

    const connection = await prisma.connection.findUnique({ where: { id: Number(connectionId) } });
    if (!connection) {
      return NextResponse.json({ success: false, message: 'Conexión no encontrada' }, { status: 404 });
    }

    const engine = connection.engine;
    let tables: { name: string; schema: string; type: string }[] = [];

    // ── Mock ──────────────────────────────────────────────────────────────────
    if (connection.isMock) {
      tables = [
        { schema: 'dbo', name: 'cajas_presupuesto', type: 'TABLE' },
        { schema: 'dbo', name: 'core_empresas', type: 'TABLE' },
        { schema: 'dbo', name: 'ledger_aportes', type: 'TABLE' },
        { schema: 'dbo', name: 'catalogo_conceptos', type: 'TABLE' },
        { schema: 'dbo', name: 'periodos_fiscales', type: 'TABLE' },
        { schema: 'rpt', name: 'v_resumen_presupuesto', type: 'VIEW' },
        { schema: 'rpt', name: 'v_aportes_empresas', type: 'VIEW' },
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

      const result = await pool.request().query(`
        SELECT 
          TABLE_SCHEMA AS [schema],
          TABLE_NAME   AS [name],
          TABLE_TYPE   AS [type]
        FROM INFORMATION_SCHEMA.TABLES
        ORDER BY TABLE_SCHEMA, TABLE_NAME
      `);
      await pool.close();

      tables = result.recordset.map((r: any) => ({
        schema: r.schema,
        name: r.name,
        type: r.type === 'VIEW' ? 'VIEW' : 'TABLE',
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
      const res = await client.query(`
        SELECT table_schema AS schema, table_name AS name,
               CASE table_type WHEN 'VIEW' THEN 'VIEW' ELSE 'TABLE' END AS type
        FROM information_schema.tables
        WHERE table_schema NOT IN ('pg_catalog','information_schema')
        ORDER BY table_schema, table_name
      `);
      await client.end();
      tables = res.rows;
    }

    // ── Excel ─────────────────────────────────────────────────────────────────
    else if (engine === 'EXCEL') {
      const filePath = path.resolve(process.cwd(), connection.database || '');
      if (fs.existsSync(filePath)) {
        const workbook = xlsx.readFile(filePath);
        tables = workbook.SheetNames.map((s) => ({ schema: 'sheet', name: s, type: 'SHEET' }));
      }
    }

    // ── CSV / TXT / JSON ──────────────────────────────────────────────────────
    else if (['CSV', 'TXT', 'JSON'].includes(engine)) {
      const fileName = path.basename(connection.database || 'archivo');
      tables = [{ schema: 'file', name: fileName, type: 'FILE' }];
    }

    // ── Google Sheets ─────────────────────────────────────────────────────────
    else if (engine === 'GOOGLE_SHEETS') {
      tables = [{ schema: 'sheet', name: 'Hoja1', type: 'SHEET' }];
    }

    else {
      return NextResponse.json({ success: false, message: `Motor '${engine}' no soportado para introspección de tablas.` }, { status: 400 });
    }

    return NextResponse.json({ success: true, tables });
  } catch (error: any) {
    console.error('❌ Error en /api/wizard/tables:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
