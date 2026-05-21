import { Injectable, Logger } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ExcelIngesterService {
  private readonly logger = new Logger(ExcelIngesterService.name);

  async processExcel(fileBuffer: any, reportId: string, unitId: string): Promise<any[]> {
    this.logger.log(`Procesando Excel para Reporte: ${reportId}, Unidad: ${unitId}`);
    
    const workbook = new ExcelJS.Workbook();
    // Asegurar que sea un Buffer compatible y usar casting a any para evitar error de TS
    const buffer = Buffer.isBuffer(fileBuffer) ? fileBuffer : Buffer.from(fileBuffer);
    await workbook.xlsx.load(buffer as any);
    
    const worksheet = workbook.getWorksheet(1);
    const records = [];

    if (!worksheet) {
      throw new Error('No se encontró la hoja de trabajo en el Excel');
    }

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return;
      const record: any = { reportId, unitId, data: row.values };
      records.push(record);
    });

    return records;
  }
}
