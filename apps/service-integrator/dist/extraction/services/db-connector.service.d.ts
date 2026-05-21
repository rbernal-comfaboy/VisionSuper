import { EncryptionService } from '../../common/encryption.service';
export interface ConnectionConfig {
    type: 'sqlserver' | 'informix' | 'mysql' | 'postgres';
    host: string;
    port: number;
    database: string;
    username: string;
    passwordEncrypted: string;
}
export declare class DbConnectorService {
    private encryptionService;
    private readonly logger;
    constructor(encryptionService: EncryptionService);
    executeQuery(config: ConnectionConfig, query: string): Promise<any[]>;
    testConnection(config: ConnectionConfig): Promise<boolean>;
}
