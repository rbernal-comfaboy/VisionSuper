export declare class SanitizerService {
    sanitizeText(text: string): string;
    formatNumeric(value: number, decimals?: number, method?: 'round' | 'truncate'): string;
    generateFileName(nit: string, reportCode: string, period: string, version: string): string;
}
