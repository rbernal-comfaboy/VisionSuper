"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var LifecycleService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LifecycleService = void 0;
const common_1 = require("@nestjs/common");
let LifecycleService = LifecycleService_1 = class LifecycleService {
    constructor() {
        this.logger = new common_1.Logger(LifecycleService_1.name);
    }
    async getActiveVersion(reportCode, reportDate) {
        this.logger.log(`Buscando versión activa para ${reportCode} en fecha ${reportDate.toISOString()}`);
        return 1;
    }
    async registerNewVersion(reportCode, metadata) {
        this.logger.log(`Registrando nueva versión para el reporte ${reportCode}`);
    }
    async deactivateReport(reportCode) {
        this.logger.log(`Desactivando reporte ${reportCode} por cambio normativo.`);
    }
};
exports.LifecycleService = LifecycleService;
exports.LifecycleService = LifecycleService = LifecycleService_1 = __decorate([
    (0, common_1.Injectable)()
], LifecycleService);
//# sourceMappingURL=lifecycle.service.js.map