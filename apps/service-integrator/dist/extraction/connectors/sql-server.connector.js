"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SQLServerConnector = void 0;
const tedious_1 = require("tedious");
const common_1 = require("@nestjs/common");
class SQLServerConnector {
    constructor() {
        this.logger = new common_1.Logger(SQLServerConnector.name);
    }
    async connect(config) {
        const tediousConfig = {
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
            this.connection = new tedious_1.Connection(tediousConfig);
            this.connection.on('connect', (err) => {
                if (err) {
                    this.logger.error('Error conectando a SQL Server', err);
                    reject(err);
                }
                else {
                    this.logger.log('Conectado a SQL Server exitosamente');
                    resolve();
                }
            });
            this.connection.connect();
        });
    }
    async extract(query) {
        return new Promise((resolve, reject) => {
            const request = new tedious_1.Request(query, (err, rowCount, rows) => {
                if (err) {
                    this.logger.error('Error ejecutando query en SQL Server', err);
                    reject(err);
                }
                else {
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
    async testConnection() {
        try {
            await this.extract('SELECT 1');
            return true;
        }
        catch {
            return false;
        }
    }
    async disconnect() {
        if (this.connection) {
            this.connection.close();
            this.logger.log('Conexión a SQL Server cerrada');
        }
    }
}
exports.SQLServerConnector = SQLServerConnector;
//# sourceMappingURL=sql-server.connector.js.map