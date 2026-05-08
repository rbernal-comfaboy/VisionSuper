import { Connection, Request, ConnectionConfig as TediousConfig } from 'tedious';
import { IDataConnector, ConnectionConfig } from '../interfaces/connector.interface';
import { Logger } from '@nestjs/common';

export class SQLServerConnector implements IDataConnector {
  private connection: Connection;
  private readonly logger = new Logger(SQLServerConnector.name);

  async connect(config: ConnectionConfig): Promise<void> {
    const tediousConfig: TediousConfig = {
      server: config.host,
      authentication: {
        type: 'default',
        options: {
          userName: config.username,
          password: config.password,
        },
      },
      options: {
        port: config.port,
        database: config.database,
        encrypt: true,
        trustServerCertificate: true,
        rowCollectionOnRequestCompletion: true,
      },
    };

    return new Promise((resolve, reject) => {
      this.connection = new Connection(tediousConfig);

      this.connection.on('connect', (err) => {
        if (err) {
          this.logger.error('Error conectando a SQL Server', err);
          reject(err);
        } else {
          this.logger.log('Conectado a SQL Server exitosamente');
          resolve();
        }
      });

      this.connection.connect();
    });
  }

  async extract(query: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const request = new Request(query, (err, rowCount, rows) => {
        if (err) {
          this.logger.error('Error ejecutando query en SQL Server', err);
          reject(err);
        } else {
          // Transformar filas de tedious a objetos JSON planos
          const results = rows.map((row) => {
            const obj = {};
            row.forEach((column) => {
              obj[column.metadata.colName] = column.value;
            });
            return obj;
          });
          resolve(results);
        }
      });

      this.connection.execSql(request);
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.extract('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      this.connection.close();
      this.logger.log('Conexión a SQL Server cerrada');
    }
  }
}
