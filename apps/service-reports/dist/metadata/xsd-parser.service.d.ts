export interface ColumnMetadata {
    name: string;
    type: string;
    required: boolean;
    restrictions?: any;
}
export declare class XsdParserService {
    private readonly logger;
    parseXsd(xsdPath: string): Promise<ColumnMetadata[]>;
    private extractRestrictions;
}
