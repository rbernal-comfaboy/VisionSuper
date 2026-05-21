"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DbConnectorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DbConnectorService = void 0;
const common_1 = require("@nestjs/common");
const encryption_service_1 = require("../../common/encryption.service");
let DbConnectorService = DbConnectorService_1 = class DbConnectorService {
    constructor(encryptionService) {
        this.encryptionService = encryptionService;
        this.logger = new common_1.Logger(DbConnectorService_1.name);
    }
    async executeQuery(config, query) {
        const password = this.encryptionService.decrypt(config.passwordEncrypted);
        this.logger.log(`Conectando a ${config.type} en ${config.host}:${config.port}...`);
        return [
            { id: 1, dato: 'Ejemplo desde ' + config.type, fecha: new Date() }
        ];
    }
    async testConnection(config) {
        try {
            this.logger.log(`Probando conexión a ${config.host}...`);
            return true;
        }
        catch (error) {
            this.logger.error('Error en prueba de conexión', error.stack);
            return false;
        }
    }
};
exports.DbConnectorService = DbConnectorService;
exports.DbConnectorService = DbConnectorService = DbConnectorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [encryption_service_1.EncryptionService])
], DbConnectorService);
//# sourceMappingURL=db-connector.service.js.map