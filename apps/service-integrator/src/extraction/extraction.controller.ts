import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ExtractionService } from './extraction.service';

@Controller()
export class ExtractionController {
  constructor(private readonly extractionService: ExtractionService) {}

  @Post('trigger')
  async triggerExtraction(@Body() body: any) {
    return this.extractionService.startExtraction(body);
  }

  @Get('status/:jobId')
  async getStatus(@Param('jobId') jobId: string) {
    return this.extractionService.getJobStatus(jobId);
  }
}
