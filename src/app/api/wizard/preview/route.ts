import { NextResponse } from 'next/server';
import * as xlsx from 'xlsx';
import Papa from 'papaparse';
import fs from 'fs';
import path from 'path';
import iconv from 'iconv-lite';
import { prisma } from '@/lib/db';
import { Client } from 'pg';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Accept connectionId (preferred) or legacy engine/database params
    const { connectionId, engine: engineParam, database: databaseParam, query: customQuery } = body;

    let engine = engineParam;
    let database = databaseParam;
    let connectionRecord: any = null;

    // If connectionId is provided, look up real credentials from DB
    if (connectionId) {
      connectionRecord = await prisma.connection.findUnique({ where: { id: Number(connectionId) } });
      if (!connectionRecord) {
        return NextResponse.json({ success: false, message: 'Conexión no encontrada' }, { status: 404 });
      }
      engine = connectionRecord.engine;
      database = connectionRecord.database;
    }

    if (!engine && !database) {
      return NextResponse.json({ success: false, message: 'Falta la base de datos o archivo' }, { status: 400 });
    }

    let rows: any[] = [];
    let columns: string[] = [];

    // ── SQL Server (Real) ─────────────────────────────────────────────────────
    if (engine === 'SQLSERVER' && connectionRecord && !connectionRecord.isMock) {
      const mssql = await import('mssql');
      const pool = await mssql.default.connect({
        server: connectionRecord.host || 'localhost',
        port: connectionRecord.port || 1433,
        user: connectionRecord.username || '',
        password: connectionRecord.password || '',
        database: connectionRecord.database || '',
        options: { encrypt: false, trustServerCertificate: true },
        connectionTimeout: 10000,
        requestTimeout: 20000,
      });

      // Build preview query: use custom SQL or TOP 5 from table
      let previewSQL = customQuery?.trim();
      if (!previewSQL) {
        // fallback: just show a schema overview
        previewSQL = `SELECT TOP 5 * FROM INFORMATION_SCHEMA.TABLES ORDER BY TABLE_NAME`;
      } else if (!previewSQL.toLowerCase().includes('top') && !previewSQL.toLowerCase().includes('limit')) {
        // Wrap in TOP 5 to avoid full table scans
        previewSQL = previewSQL.replace(/^SELECT\s+/i, 'SELECT TOP 5 ');
      }

      try {
        const result = await pool.request().query(previewSQL);
        await pool.close();
        rows = result.recordset || [];
        if (rows.length > 0) columns = Object.keys(rows[0]);
      } catch (err: any) {
        await pool.close().catch(() => {});
        return NextResponse.json({ success: false, message: `Error SQL Server: ${err.message}` }, { status: 400 });
      }
    }

    // ── PostgreSQL (Real) ────────────────────────────────────────────────────
    else if (engine === 'POSTGRESQL' && connectionRecord && !connectionRecord.isMock) {
      const client = new Client({
        host: connectionRecord.host || 'localhost',
        port: connectionRecord.port || 5432,
        user: connectionRecord.username || 'postgres',
        password: connectionRecord.password || '',
        database: connectionRecord.database || '',
      });

      let previewSQL = customQuery?.trim();
      if (!previewSQL) {
        previewSQL = `SELECT table_name FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog','information_schema') LIMIT 5`;
      } else if (!previewSQL.toLowerCase().includes('limit')) {
        previewSQL = `${previewSQL} LIMIT 5`;
      }

      try {
        await client.connect();
        const res = await client.query(previewSQL);
        await client.end();
        rows = res.rows;
        if (rows.length > 0) columns = Object.keys(rows[0]);
      } catch (err: any) {
        await client.end().catch(() => {});
        return NextResponse.json({ success: false, message: `Error PostgreSQL: ${err.message}` }, { status: 400 });
      }
    }

    // ── Excel ────────────────────────────────────────────────────────────────
    else if (engine === 'EXCEL') {
      const filePath = path.resolve(process.cwd(), database);
      if (fs.existsSync(filePath)) {
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        rows = xlsx.utils.sheet_to_json(worksheet, { defval: '' });
        if (rows.length > 0) columns = Object.keys(rows[0]);
      } else {
        return NextResponse.json({ success: false, message: 'Archivo Excel no encontrado' }, { status: 404 });
      }
    }

    // ── CSV / TXT ────────────────────────────────────────────────────────────
    else if (engine === 'CSV' || engine === 'TXT') {
      const filePath = path.resolve(process.cwd(), database);
      if (fs.existsSync(filePath)) {
        const buffer = fs.readFileSync(filePath);
        let text = buffer.toString('utf8');
        if (text.includes('\uFFFD')) {
          text = iconv.decode(buffer, 'latin1');
        }
        const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
        rows = parsed.data as any[];
        if (parsed.meta && parsed.meta.fields) columns = parsed.meta.fields;
        else if (rows.length > 0) columns = Object.keys(rows[0]);
      } else {
        return NextResponse.json({ success: false, message: 'Archivo no encontrado' }, { status: 404 });
      }
    }

    // ── JSON ─────────────────────────────────────────────────────────────────
    else if (engine === 'JSON') {
      const filePath = path.resolve(process.cwd(), database);
      if (fs.existsSync(filePath)) {
        try {
          const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          rows = Array.isArray(parsed) ? parsed : [parsed];
          if (rows.length > 0) columns = Object.keys(rows[0]);
        } catch {
          return NextResponse.json({ success: false, message: 'JSON inválido' }, { status: 400 });
        }
      }
    }

    // ── Google Sheets ────────────────────────────────────────────────────────
    else if (engine === 'GOOGLE_SHEETS') {
      let sheetId = database;
      if (sheetId.includes('spreadsheets/d/')) {
        sheetId = sheetId.split('spreadsheets/d/')[1].split('/')[0];
      }
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
      const response = await fetch(csvUrl);
      if (!response.ok) return NextResponse.json({ success: false, message: 'Error descargando Google Sheets' }, { status: 400 });
      const csvText = await response.text();
      const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
      rows = parsed.data as any[];
      if (parsed.meta && parsed.meta.fields) columns = parsed.meta.fields;
      else if (rows.length > 0) columns = Object.keys(rows[0]);
    }

    // ── Mock / Fallback ──────────────────────────────────────────────────────
    else {
      rows = [
        { id: 1, descripcion: 'Dato de Prueba 1', monto: 1500.50, fecha: '2025-01-01' },
        { id: 2, descripcion: 'Dato de Prueba 2', monto: 2300.00, fecha: '2025-01-02' },
      ];
      columns = ['id', 'descripcion', 'monto', 'fecha'];
    }

    // ── Inferir capa semántica ───────────────────────────────────────────────
    const semanticFields = columns.map((col) => {
      const sampleValue = rows[0] ? rows[0][col] : null;
      let type = 'TEXT';
      let isDimension = true;
      let isMeasure = false;

      if (sampleValue !== null && sampleValue !== '') {
        if (!isNaN(Number(sampleValue))) {
          type = 'NUMBER';
          isDimension = false;
          isMeasure = true;
        }
      }

      return { id: col, name: col, type, isDimension, isMeasure, isCalculated: false, formula: '' };
    });

    return NextResponse.json({
      success: true,
      columns,
      previewData: rows.slice(0, 5),
      semanticFields,
    });

  } catch (error: any) {
    console.error('❌ Error en vista previa:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
