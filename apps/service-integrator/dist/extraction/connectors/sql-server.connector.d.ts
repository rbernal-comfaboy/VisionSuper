import { IDataConnector, ConnectionConfig } from '../interfaces/connector.interface';
export declare class SQLServerConnector implements IDataConnector {
    private connection;
    private readonly logger;
    connect(config: ConnectionConfig): Promise<void>;
    extract(query: string): Promise<any[]>;
    testConnection(): Promise<boolean>;
    disconnect(): Promise<void>;
}
