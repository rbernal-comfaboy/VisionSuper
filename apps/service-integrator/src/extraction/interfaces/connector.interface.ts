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
  /**
   * Establece la conexión con la fuente de datos
   */
  connect(config: ConnectionConfig): Promise<void>;

  /**
   * Ejecuta una consulta y retorna los resultados como un arreglo de objetos
   */
  extract(query: string): Promise<any[]>;

  /**
   * Verifica si la conexión es válida
   */
  testConnection(): Promise<boolean>;

  /**
   * Cierra la conexión de forma segura
   */
  disconnect(): Promise<void>;
}
