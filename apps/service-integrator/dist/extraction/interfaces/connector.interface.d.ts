export interface ConnectionConfig {
    host: string;
    port: number;
    database: string;
    username: string;
    password?: string;
    domain?: string;
    options?: any;
}
export interface IDataConnector {
    connect(config: ConnectionConfig): Promise<void>;
    extract(query: string): Promise<any[]>;
    testConnection(): Promise<boolean>;
    disconnect(): Promise<void>;
}
