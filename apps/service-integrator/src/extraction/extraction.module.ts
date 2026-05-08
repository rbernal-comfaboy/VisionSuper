import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ExtractionController } from './extraction.controller';
import { ExtractionService } from './extraction.service';
import { ExcelIngesterService } from './services/excel-ingester.service';

@Module({
  imports: [
    MulterModule.register({
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
      },
    }),
  ],
  controllers: [ExtractionController],
  providers: [ExtractionService, ExcelIngesterService],
})
export class ExtractionModule {}
