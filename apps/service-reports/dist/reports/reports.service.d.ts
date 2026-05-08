export declare class ReportsService {
    private readonly logger;
    validateAgainstXsd(reportId: string): Promise<{
        reportId: string;
        isValid: boolean;
        errorsCount: number;
    }>;
    generateFinalXml(reportId: string): Promise<{
        reportId: string;
        fileName: string;
        url: string;
    }>;
    generateExcel(reportId: string): Promise<{
        message: string;
    }>;
}
