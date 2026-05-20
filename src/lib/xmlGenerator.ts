interface ReportMeta {
  rootTag: string;
  rowTag: string;
}

const REPORT_METADATA: Record<string, ReportMeta> = {
  "2-001A": {
    rootTag: "EMPRESAS_Y_APORTANTES_2017C01",
    rowTag: "T_EMPRESAS_Y_APORTANTES_2017C01",
  },
  "2-002A": {
    rootTag: "EJECUCION_PRESUPUESTAL_2025C02",
    rowTag: "T_EJECUCION_PRESUPUESTAL_2025C02",
  },
};

/**
 * Escapes characters that are invalid inside XML elements to prevent XML injection.
 */
function escapeXml(unsafe: any): string {
  if (unsafe === null || unsafe === undefined) return "";
  const str = String(unsafe);
  return str.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}

/**
 * Compiles a dataset of rows into a beautifully formatted XML string.
 * Uses the exact schema tag structure required by the Superintendencia.
 */
export function generateXml(reportCode: string, rows: any[]): string {
  const meta = REPORT_METADATA[reportCode];
  
  // Nombres de etiquetas por defecto si no son reportes piloto
  const rootTag = meta ? meta.rootTag : `REPORTE_${reportCode.replace("-", "_")}`;
  const rowTag = meta ? meta.rowTag : `T_REPORTE_${reportCode.replace("-", "_")}`;

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += `<${rootTag}>\n`;

  rows.forEach((row) => {
    xml += `\t<${rowTag}>\n`;
    
    // Generar cada clave/valor de la fila
    Object.keys(row).forEach((key) => {
      // Ignorar metadatos internos de control si existen
      if (key === "id" || key === "_row_error" || key === "createdAt" || key === "updatedAt") {
        return;
      }
      
      const val = row[key];
      xml += `\t\t<${key}>${escapeXml(val)}</${key}>\n`;
    });

    xml += `\t</${rowTag}>\n`;
  });

  xml += `</${rootTag}>\n`;
  return xml;
}
