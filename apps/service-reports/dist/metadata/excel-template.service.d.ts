import { ColumnMetadata } from './xsd-parser.service';
export declare class ExcelTemplateService {
    generateTemplate(columns: ColumnMetadata[]): Promise<Buffer>;
}
