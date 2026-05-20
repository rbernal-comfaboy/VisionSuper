import { Client } from "pg";
import * as xlsx from "xlsx";
import Papa from "papaparse";
import fs from "fs";
import path from "path";interface ConnectionDetails {
  engine: string;
  host: string | null;
  port: number | null;
  username: string | null;
  password: string | null;
  database: string | null;
  isMock: boolean;
}

/**
 * Executes a query on an external database or returns mock data for simulation.
 */
export async function extractData(
  connection: ConnectionDetails,
  sqlQuery: string,
  reportCode: string,
  dataSource?: any
): Promise<any[]> {
  let rows: any[] = [];

  // Verificar si la consulta es un plan federado Looker-style en formato JSON
  if (sqlQuery.trim().startsWith("{")) {
    try {
      const plan = JSON.parse(sqlQuery);
      if (plan.federated) {
        console.log("🔗 [Plan Federado] Procesando extracción federada Looker-style...");
        rows = await extractFederatedData(plan, reportCode);
      }
    } catch (err) {
      console.warn("⚠️ Advertencia: Error parseando sqlQuery como plan federado, se intentará ejecución regular:", err);
    }
  }

  // Si no se asignó por federación, ejecutar extracción normal
  if (rows.length === 0) {
    if (connection.isMock) {
      console.log(`🧪 Simulando extracción de datos para el reporte ${reportCode}...`);
      rows = getMockDataForReport(reportCode, sqlQuery);
    } else if (connection.engine === "POSTGRESQL") {
      console.log(`🔌 Conectándose a base de datos externa PostgreSQL: ${connection.database}...`);
      const client = new Client({
        host: connection.host || "localhost",
        port: connection.port || 5432,
        user: connection.username || "postgres",
        password: connection.password || "",
        database: connection.database || "",
      });

      try {
        await client.connect();
        const res = await client.query(sqlQuery);
        await client.end();
        rows = res.rows;
      } catch (error: any) {
        console.error("❌ Error de extracción PostgreSQL real:", error);
        throw new Error(`Error de conexión/extracción en base de datos externa: ${error.message}`);
      }
    } else if (connection.engine === "EXCEL") {
      console.log(`📊 Leyendo archivo Excel: ${connection.database}...`);
      if (connection.database) {
        try {
          const filePath = path.resolve(process.cwd(), connection.database);
          if (fs.existsSync(filePath)) {
            const workbook = xlsx.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            rows = xlsx.utils.sheet_to_json(worksheet);
          } else {
            console.error(`Archivo Excel no encontrado: ${filePath}`);
            throw new Error(`Archivo Excel no encontrado: ${filePath}`);
          }
        } catch (error: any) {
          console.error("❌ Error leyendo Excel:", error);
          throw new Error(`Error de lectura Excel: ${error.message}`);
        }
      }
    } else if (connection.engine === "GOOGLE_SHEETS") {
      console.log(`🌐 Descargando Google Sheets CSV...`);
      if (connection.database) {
        try {
          // Si el ID es un link completo o solo ID, extraemos el ID
          let sheetId = connection.database;
          if (sheetId.includes("spreadsheets/d/")) {
            sheetId = sheetId.split("spreadsheets/d/")[1].split("/")[0];
          }
          const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
          const response = await fetch(csvUrl);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const csvText = await response.text();
          const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
          rows = parsed.data;
        } catch (error: any) {
          console.error("❌ Error leyendo Google Sheets:", error);
          throw new Error(`Error de lectura Google Sheets: ${error.message}`);
        }
      }
    } else {
      throw new Error(
        `El motor de base de datos '${connection.engine}' real no está soportado en esta versión. Utilice el modo de simulación, PostgreSQL, EXCEL o GOOGLE_SHEETS.`
      );
    }
  }

  // 3. Procesar campos calculados si existe una fuente de datos semántica asociada
  if (dataSource && dataSource.fieldsJson) {
    try {
      const fields = typeof dataSource.fieldsJson === "string" 
        ? JSON.parse(dataSource.fieldsJson) 
        : dataSource.fieldsJson;

      if (Array.isArray(fields)) {
        const calculatedFields = fields.filter((f: any) => f.isCalculated && f.formula);
        
        if (calculatedFields.length > 0) {
          console.log(`🧮 [Campos Calculados Semánticos] Procesando ${calculatedFields.length} fórmulas en memoria...`);
          
          const safeEval = (expression: string): number => {
            const sanitized = expression.replace(/[^0-9.\s+\-*/()]/g, "");
            try {
              const val = new Function(`return (${sanitized})`)();
              return isNaN(val) ? 0 : val;
            } catch {
              return 0;
            }
          };

          rows = rows.map((row: any) => {
            const newRow = { ...row };
            calculatedFields.forEach((cf: any) => {
              let expr = cf.formula;
              // Ordenar campos por longitud para evitar colisiones de sub-strings al reemplazar
              const sortedFields = [...fields].sort((a, b) => b.id.length - a.id.length);
              sortedFields.forEach((f: any) => {
                if (expr.includes(f.id)) {
                  // Obtener valor, asegurando que sea numérico
                  const rawVal = newRow[f.id] !== undefined ? newRow[f.id] : 0;
                  const numVal = typeof rawVal === "number" ? rawVal : parseFloat(rawVal) || 0;
                  const regex = new RegExp(`\\b${f.id}\\b`, "g");
                  expr = expr.replace(regex, String(numVal));
                }
              });
              newRow[cf.id] = safeEval(expr);
            });
            return newRow;
          });
        }
      }
    } catch (err) {
      console.error("❌ Error calculando campos semánticos en memoria:", err);
    }
  }

  return rows;
}

/**
 * Procesa la extracción federada de datos uniendo múltiples fuentes en memoria
 */
async function extractFederatedData(plan: any, reportCode: string): Promise<any[]> {
  const { prisma } = require("./db");
  const sourcesData: Record<string, any[]> = {};

  // 1. Extraer datos de cada fuente asíncronamente
  for (const src of plan.sources) {
    const conn = await prisma.connection.findUnique({
      where: { id: src.connectionId },
    });
    if (!conn) {
      throw new Error(`Conexión federada con ID ${src.connectionId} no encontrada.`);
    }

    // Ejecutar extracción recursiva para esta fuente
    console.log(`   - Ejecutando sub-consulta federada para alias '${src.alias}' en la conexión: ${conn.name}`);
    const rows = await extractData(conn, src.query, reportCode);
    sourcesData[src.alias] = rows;
  }

  // 2. Realizar la unión en memoria (Join)
  const joinConf = plan.join;
  if (!joinConf) {
    // Si no hay unión especificada, retornar el primer dataset
    return Object.values(sourcesData)[0] || [];
  }

  const [leftAlias, leftField] = joinConf.left.split(".");
  const [rightAlias, rightField] = joinConf.right.split(".");

  const leftRows = sourcesData[leftAlias] || [];
  const rightRows = sourcesData[rightAlias] || [];

  console.log(`🤝 [Join en Memoria] Cruzando alias '${leftAlias}' con '${rightAlias}' usando llave: ${leftField} = ${rightField}`);

  // Indexar la tabla derecha para un cruce eficiente
  const rightIndex: Record<string, any> = {};
  rightRows.forEach((row) => {
    const key = String(row[rightField] || "").trim();
    if (key) {
      rightIndex[key] = row;
    }
  });

  // Combinar los registros
  const mergedRows: any[] = [];
  leftRows.forEach((leftRow) => {
    const key = String(leftRow[leftField] || "").trim();
    const matchingRightRow = rightIndex[key] || {};

    // Combinar campos (dando prioridad al valor de la izquierda en caso de colisión)
    const merged = { ...matchingRightRow, ...leftRow };
    mergedRows.push(merged);
  });

  console.log(`✅ [Join completado] Dataset unificado con ${mergedRows.length} registros combinados.`);
  return mergedRows;
}

/**
 * Genera conjuntos de datos simulados realistas con ERRORES de consistencia intencionales
 * para demostrar el funcionamiento del resaltador visual de la tabla interactiva.
 */
function getMockDataForReport(reportCode: string, sqlQuery: string = ""): any[] {
  const query = sqlQuery.toLowerCase();

  if (reportCode === "2-001A") {
    // Si la consulta es específica para aportes en el plan federado
    if (query.includes("ledger_aportes") || query.includes("total_aportado")) {
      return [
        { nit_empresa: "860001234", total_aportado: 45000000 },
        { nit_empresa: "900123456", total_aportado: 12500000 },
        { nit_empresa: "86000011122233344455", total_aportado: 8900000 },
        { nit_empresa: "1018456123", total_aportado: -50000 },
        { nit_empresa: "52456789", total_aportado: 1200000 }
      ];
    }

    // Si la consulta es específica para core en el plan federado
    if (query.includes("core_empresas") || query.includes("razon_social")) {
      return [
        { tipo_doc: 1, numero_doc: "860001234", razon_social: "COLSUBSIDIO S.A.S.", dane_municipio: "11001", direccion: "Calle 26 # 62-47", estado: 1, tipo_aportante: 1, sector: 1, codigo_actividad: "8411", ley_1429: 0, pago_1429: 0, ley_590: 0, pago_590: 0, intereses_mora: 0, reintegros: 0 },
        { tipo_doc: 1, numero_doc: "900123456", razon_social: "", dane_municipio: "05001", direccion: "Avenida El Poblado # 10-15", estado: 1, tipo_aportante: 1, sector: 1, codigo_actividad: "6201", ley_1429: 0, pago_1429: 0, ley_590: 0, pago_590: 0, intereses_mora: 0, reintegros: 0 },
        { tipo_doc: 1, numero_doc: "86000011122233344455", razon_social: "CONSTRUCCIONES EL ROBLE LTDA", dane_municipio: "76001", direccion: "Carrera 5 # 12-30", estado: 1, tipo_aportante: 2, sector: 1, codigo_actividad: "4111", ley_1429: 1, pago_1429: 1, ley_590: 0, pago_590: 0, intereses_mora: 120000, reintegros: 0 },
        { tipo_doc: 99, numero_doc: "1018456123", razon_social: "JUAN CARLOS PEREZ GOMEZ", dane_municipio: "11001", direccion: "Calle 100 # 15-20", estado: 1, tipo_aportante: 1, sector: 2, codigo_actividad: "0000", ley_1429: 0, pago_1429: 0, ley_590: 0, pago_590: 0, intereses_mora: 0, reintegros: 0 },
        { tipo_doc: 2, numero_doc: "52456789", razon_social: "PANADERIA Y PASTELERIA EL COMETA", dane_municipio: "68001", direccion: "Calle 35 # 18-12", estado: 2, tipo_aportante: 1, sector: 1, codigo_actividad: "1071", ley_1429: 0, pago_1429: 0, ley_590: 0, pago_590: 0, intereses_mora: 0, reintegros: 0 }
      ];
    }

    // Por defecto retornar listado completo unido
    return [
      {
        tipo_doc: 1,
        numero_doc: "860001234",
        razon_social: "COLSUBSIDIO S.A.S.",
        dane_municipio: "11001",
        direccion: "Calle 26 # 62-47",
        estado: 1,
        tipo_aportante: 1,
        sector: 1,
        codigo_actividad: "8411",
        ley_1429: 0,
        pago_1429: 0,
        ley_590: 0,
        pago_590: 0,
        total_aportado: 45000000,
        intereses_mora: 0,
        reintegros: 0,
      },
      {
        tipo_doc: 1,
        numero_doc: "900123456",
        razon_social: "",
        dane_municipio: "05001",
        direccion: "Avenida El Poblado # 10-15",
        estado: 1,
        tipo_aportante: 1,
        sector: 1,
        codigo_actividad: "6201",
        ley_1429: 0,
        pago_1429: 0,
        ley_590: 0,
        pago_590: 0,
        total_aportado: 12500000,
        intereses_mora: 0,
        reintegros: 0,
      },
      {
        tipo_doc: 1,
        numero_doc: "86000011122233344455",
        razon_social: "CONSTRUCCIONES EL ROBLE LTDA",
        dane_municipio: "76001",
        direccion: "Carrera 5 # 12-30",
        estado: 1,
        tipo_aportante: 2,
        sector: 1,
        codigo_actividad: "4111",
        ley_1429: 1,
        pago_1429: 1,
        ley_590: 0,
        pago_590: 0,
        total_aportado: 8900000,
        intereses_mora: 120000,
        reintegros: 0,
      },
      {
        tipo_doc: 99,
        numero_doc: "1018456123",
        razon_social: "JUAN CARLOS PEREZ GOMEZ",
        dane_municipio: "11001",
        direccion: "Calle 100 # 15-20",
        estado: 1,
        tipo_aportante: 1,
        sector: 2,
        codigo_actividad: "0000",
        ley_1429: 0,
        pago_1429: 0,
        ley_590: 0,
        pago_590: 0,
        total_aportado: -50000,
        intereses_mora: 0,
        reintegros: 0,
      },
      {
        tipo_doc: 2,
        numero_doc: "52456789",
        razon_social: "PANADERIA Y PASTELERIA EL COMETA",
        dane_municipio: "68001",
        direccion: "Calle 35 # 18-12",
        estado: 2,
        tipo_aportante: 1,
        sector: 1,
        codigo_actividad: "1071",
        ley_1429: 0,
        pago_1429: 0,
        ley_590: 0,
        pago_590: 0,
        total_aportado: 1200000,
        intereses_mora: 0,
        reintegros: 0,
      },
    ];
  }

  if (reportCode === "2-002A") {
    return [
      {
        nit_caja: "860007333",
        periodo: "202505",
        codigo_concepto: "1010",
        descripcion: "Sueldos y Salarios Basicos",
        valor_presupuesto: 5000000000,
        valor_ejecutado: 4800000000,
      },
      {
        nit_caja: "860007333",
        periodo: "202505",
        codigo_concepto: "1020",
        descripcion: "Subsidio Familiar en Dinero",
        valor_presupuesto: 12000000000,
        valor_ejecutado: -150000000,
      },
    ];
  }

  return [];
}
