export declare class ExtractionService {
    private readonly logger;
    startExtraction(payload: any): Promise<{
        jobId: string;
        message: string;
    }>;
    getJobStatus(jobId: string): Promise<{
        jobId: string;
        status: string;
        progress: number;
    }>;
}
