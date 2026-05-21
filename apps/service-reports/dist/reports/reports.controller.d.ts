import { ReportsService } from './reports.service';
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    validateReport(reportId: string): Promise<{
        reportId: string;
        isValid: boolean;
        errorsCount: number;
    }>;
    generateXml(reportId: string): Promise<{
        reportId: string;
        fileName: string;
        url: string;
    }>;
    downloadExcel(reportId: string): Promise<{
        message: string;
    }>;
}
