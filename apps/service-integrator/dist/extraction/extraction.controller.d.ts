import { ExtractionService } from './extraction.service';
import { ExcelIngesterService } from './services/excel-ingester.service';
export declare class ExtractionController {
    private readonly extractionService;
    private readonly excelIngesterService;
    constructor(extractionService: ExtractionService, excelIngesterService: ExcelIngesterService);
    triggerExtraction(body: any): Promise<{
        jobId: string;
        message: string;
    }>;
    uploadExcel(file: any, reportId: string, unitId: string): Promise<{
        success: boolean;
        rowsProcessed: number;
        message: string;
    }>;
    getStatus(jobId: string): Promise<{
        jobId: string;
        status: string;
        progress: number;
    }>;
}
