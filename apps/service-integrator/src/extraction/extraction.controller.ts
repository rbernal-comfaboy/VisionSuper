import { Controller, Post, Get, Body, Param, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ExtractionService } from './extraction.service';
import { ExcelIngesterService } from './services/excel-ingester.service';

@Controller('extraction')
export class ExtractionController {
  constructor(
    private readonly extractionService: ExtractionService,
    private readonly excelIngesterService: ExcelIngesterService,
  ) {}

  @Post('trigger')
  async triggerExtraction(@Body() body: any) {
    return this.extractionService.startExtraction(body);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadExcel(
    @UploadedFile() file: any,
    @Body('reportId') reportId: string,
    @Body('unitId') unitId: string,
  ) {
    // Sincronizado con la nueva firma del servicio
    const data = await this.excelIngesterService.processExcel(file.buffer, reportId, unitId);
    
    return {
      success: true,
      rowsProcessed: data.length,
      message: 'Archivo procesado y cargado en staging.',
    };
  }

  @Get('status/:jobId')
  async getStatus(@Param('jobId') jobId: string) {
    return this.extractionService.getJobStatus(jobId);
  }
}
