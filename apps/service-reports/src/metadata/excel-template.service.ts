import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { ColumnMetadata } from './xsd-parser.service';

@Injectable()
export class ExcelTemplateService {
  /**
   * Genera un archivo Excel basado en los metadatos de las columnas
   * @param columns Lista de metadatos de columnas
   * @returns Buffer del archivo Excel
   */
  async generateTemplate(columns: ColumnMetadata[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Carga de Datos');

    // 1. Configurar Encabezados
    const headerRow = worksheet.getRow(1);
    columns.forEach((col, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = col.name;
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '1A237E' } // Azul Institucional
      };
      
      // Añadir comentario con el tipo y obligatoriedad
      cell.note = `Tipo: ${col.type}\nObligatorio: ${col.required ? 'SÍ' : 'NO'}`;
    });

    // 2. Aplicar validación de datos básica (Ejemplo)
    worksheet.dataValidations.add('A2:Z1000', {
      type: 'whole',
      operator: 'between',
      allowBlank: true,
      showErrorMessage: true,
      errorTitle: 'Error de Formato',
      error: 'El valor ingresado no cumple con la restricción del campo.'
    });

    // 3. Proteger la hoja (opcional)
    // await worksheet.protect('comfaboy2026', {});

    return (await workbook.xlsx.writeBuffer()) as Buffer;
  }
}
