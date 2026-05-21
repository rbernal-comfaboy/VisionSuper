export interface ReportVersion {
    reportCode: string;
    versionNumber: number;
    validFrom: Date;
    validTo?: Date;
    isActive: boolean;
}
export declare class LifecycleService {
    private readonly logger;
    getActiveVersion(reportCode: string, reportDate: Date): Promise<number>;
    registerNewVersion(reportCode: string, metadata: any[]): Promise<void>;
    deactivateReport(reportCode: string): Promise<void>;
}
