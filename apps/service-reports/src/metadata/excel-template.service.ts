import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { ColumnMetadata } from './xsd-parser.service';

@Injectable()
export class ExcelTemplateService {
  async generateTemplate(columns: ColumnMetadata[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Carga de Datos');

    const headerRow = worksheet.getRow(1);
    columns.forEach((col, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = col.name;
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '1A237E' }
      };
      cell.note = `Tipo: ${col.type}\nObligatorio: ${col.required ? 'SÍ' : 'NO'}`;

      // Aplicar validación directamente a la columna
      const column = worksheet.getColumn(index + 1);
      column.dataValidation = {
        type: 'whole',
        operator: 'between',
        allowBlank: true,
        showErrorMessage: true,
        errorTitle: 'Error de Formato',
        error: 'El valor ingresado no cumple con la restricción del campo.'
      };
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
