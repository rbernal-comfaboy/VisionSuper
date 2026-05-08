import { Controller, Post, Get, Param } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('validation/validate/:reportId')
  async validateReport(@Param('reportId') reportId: string) {
    return this.reportsService.validateAgainstXsd(reportId);
  }

  @Post('files/generate-xml/:reportId')
  async generateXml(@Param('reportId') reportId: string) {
    return this.reportsService.generateFinalXml(reportId);
  }

  @Get('files/download-excel/:reportId')
  async downloadExcel(@Param('reportId') reportId: string) {
    return this.reportsService.generateExcel(reportId);
  }
}
