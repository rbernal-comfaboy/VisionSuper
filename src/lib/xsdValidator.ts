interface FieldRule {
  type: "string" | "integer";
  maxLength?: number;
  totalDigits?: number;
  required: boolean;
  min?: number;
  description: string;
}

type ReportSchema = Record<string, FieldRule>;

// Pre-compiled rules compiled directly from the official 2-001A and 2-002A XSD files
const SCHEMAS: Record<string, ReportSchema> = {
  "2-001A": {
    TIP_IDENTIFICACION: {
      type: "integer",
      totalDigits: 2,
      required: true,
      min: 1,
      description: "Tipo de identificación (código de 2 dígitos, ej. 1 para NIT, 2 para CC).",
    },
    NUM_IDENTIFICACION: {
      type: "string",
      maxLength: 16,
      required: true,
      description: "Número de identificación de la empresa (máx. 16 caracteres, sin guiones ni puntos).",
    },
    NOM_EMPRESA: {
      type: "string",
      maxLength: 200,
      required: true,
      description: "Razón social o nombre completo de la empresa (máx. 200 caracteres).",
    },
    COD_MUNICIPIO_DANE: {
      type: "string",
      maxLength: 5,
      required: true,
      description: "Código de municipio DANE (5 caracteres, ej. 11001 para Bogotá).",
    },
    DIR_CORRESPONDECIA: {
      type: "string",
      maxLength: 100,
      required: true,
      description: "Dirección de correspondencia de la empresa (máx. 100 caracteres).",
    },
    EST_VINCULACION: {
      type: "integer",
      totalDigits: 1,
      required: true,
      description: "Estado de vinculación (1 dígito, ej. 1 para Activo, 2 para Inactivo).",
    },
    TIP_APORTANTE: {
      type: "integer",
      totalDigits: 1,
      required: true,
      description: "Tipo de aportante (1 dígito).",
    },
    TIP_SECTOR: {
      type: "integer",
      totalDigits: 1,
      required: true,
      description: "Tipo de sector (1 dígito: 1 para Privado, 2 para Público).",
    },
    ACT_ECONOMICA: {
      type: "string",
      maxLength: 4,
      required: true,
      description: "Código de actividad económica CIIU (máx. 4 caracteres).",
    },
    SIT_EMPRESA_LEY_1429: {
      type: "integer",
      totalDigits: 1,
      required: true,
      description: "Situación de la empresa ante la Ley 1429 (1 dígito).",
    },
    PRO_PAGO_LEY_1429: {
      type: "integer",
      totalDigits: 1,
      required: true,
      description: "Proporción de pago Ley 1429 (1 dígito).",
    },
    SIT_EMPRESA_LEY_590: {
      type: "integer",
      totalDigits: 1,
      required: true,
      description: "Situación de la empresa ante la Ley 590 (1 dígito).",
    },
    PRO_PAGO_LEY_590: {
      type: "integer",
      totalDigits: 1,
      required: true,
      description: "Proporción de pago Ley 590 (1 dígito).",
    },
    APO_TOTAL_MENSUAL: {
      type: "integer",
      totalDigits: 18,
      required: true,
      min: 0,
      description: "Aporte total mensual en pesos (máx. 18 dígitos, debe ser no negativo).",
    },
    INT_PAGADOS_MORA: {
      type: "integer",
      totalDigits: 18,
      required: true,
      min: 0,
      description: "Intereses pagados en mora en pesos (máx. 18 dígitos).",
    },
    VAL_REINTEGROS: {
      type: "integer",
      totalDigits: 18,
      required: true,
      min: 0,
      description: "Valor de reintegros en pesos (máx. 18 dígitos).",
    },
  },
  "2-002A": {
    nit_caja: {
      type: "string",
      maxLength: 16,
      required: true,
      description: "NIT de la Caja de Compensación Familiar (máx. 16 caracteres).",
    },
    periodo: {
      type: "string",
      maxLength: 6,
      required: true,
      description: "Periodo reportado (formato AAAAMM, ej. 202505).",
    },
    codigo_concepto: {
      type: "string",
      maxLength: 10,
      required: true,
      description: "Código de concepto contable/presupuestal (máx. 10 caracteres).",
    },
    descripcion: {
      type: "string",
      maxLength: 200,
      required: true,
      description: "Descripción del concepto (máx. 200 caracteres).",
    },
    valor_presupuesto: {
      type: "integer",
      totalDigits: 18,
      required: true,
      min: 0,
      description: "Valor presupuestado en pesos (máx. 18 dígitos).",
    },
    valor_ejecutado: {
      type: "integer",
      totalDigits: 18,
      required: true,
      min: 0,
      description: "Valor ejecutado en pesos (máx. 18 dígitos, debe ser no negativo).",
    },
  },
};

export interface ValidationError {
  field: string;
  value: any;
  message: string;
}

/**
 * Valida una celda individual contra las restricciones del esquema.
 */
export function validateCell(
  reportCode: string,
  fieldXsdTag: string,
  value: any
): { isValid: boolean; message?: string } {
  const schema = SCHEMAS[reportCode];
  if (!schema) return { isValid: true }; // Si no hay esquema de piloto, asumimos válido

  const rule = schema[fieldXsdTag];
  if (!rule) return { isValid: true }; // Campo no configurado en reglas

  // 1. Validar obligatoriedad
  if (value === null || value === undefined || value === "") {
    if (rule.required) {
      return { isValid: false, message: "Este campo es requerido y no puede estar vacío." };
    }
    return { isValid: true };
  }

  const stringValue = String(value).trim();

  // 2. Validar tipo
  if (rule.type === "integer") {
    // Verificar si es numérico entero
    if (!/^-?\d+$/.test(stringValue)) {
      return { isValid: false, message: "Debe ser un número entero válido sin letras ni símbolos." };
    }

    const intValue = parseInt(stringValue, 10);

    // Validar mínimo (ej. no negativos en aportes)
    if (rule.min !== undefined && intValue < rule.min) {
      return { isValid: false, message: `El valor no puede ser menor a ${rule.min}.` };
    }

    // Validar cantidad de dígitos (totalDigits)
    if (rule.totalDigits) {
      // Eliminar el signo negativo para contar dígitos
      const absoluteDigits = stringValue.replace("-", "").length;
      if (absoluteDigits > rule.totalDigits) {
        return {
          isValid: false,
          message: `El número supera la cantidad máxima de dígitos permitidos (${rule.totalDigits}).`,
        };
      }
    }
  } else if (rule.type === "string") {
    // Validar longitud máxima (maxLength)
    if (rule.maxLength && stringValue.length > rule.maxLength) {
      return {
        isValid: false,
        message: `El texto supera la longitud máxima permitida de ${rule.maxLength} caracteres (tiene ${stringValue.length}).`,
      };
    }
  }

  return { isValid: true };
}

/**
 * Valida un conjunto completo de filas y devuelve un mapa detallado de errores para el frontend.
 * Formato de retorno: { [rowIndex]: { [fieldXsdTag]: "Mensaje de error" } }
 */
export function validateDataset(
  reportCode: string,
  rows: any[],
  mappings: Record<string, string> // Mapea { "XSD_TAG": "COLUMNA_SQL" }
): Record<number, Record<string, string>> {
  const errors: Record<number, Record<string, string>> = {};

  const schema = SCHEMAS[reportCode];
  if (!schema) return errors;

  rows.forEach((row, index) => {
    const rowErrors: Record<string, string> = {};

    // Validar cada etiqueta del esquema XSD
    Object.keys(schema).forEach((xsdTag) => {
      // Obtener qué columna SQL corresponde a esta etiqueta
      const sqlColumn = mappings[xsdTag];
      if (!sqlColumn) return;

      const cellValue = row[sqlColumn] !== undefined ? row[sqlColumn] : row[xsdTag];
      const validation = validateCell(reportCode, xsdTag, cellValue);

      if (!validation.isValid && validation.message) {
        rowErrors[xsdTag] = validation.message;
      }
    });

    if (Object.keys(rowErrors).length > 0) {
      errors[index] = rowErrors;
    }
  });

  return errors;
}

/**
 * Obtiene la descripción o regla de un campo para mostrar en la interfaz.
 */
export function getFieldMetadata(reportCode: string, fieldXsdTag: string): FieldRule | null {
  const schema = SCHEMAS[reportCode];
  if (!schema) return null;
  return schema[fieldXsdTag] || null;
}
