"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ReportsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
let ReportsService = ReportsService_1 = class ReportsService {
    constructor() {
        this.logger = new common_1.Logger(ReportsService_1.name);
    }
    async validateAgainstXsd(reportId) {
        this.logger.log(`Validando reporte: ${reportId}`);
        return {
            reportId,
            isValid: true,
            errorsCount: 0,
        };
    }
    async generateFinalXml(reportId) {
        this.logger.log(`Generando XML final para reporte: ${reportId}`);
        return {
            reportId,
            fileName: `CCF0232-001A012026.xml`,
            url: 'https://supabase.co/storage/v1/object/public/reports/CCF0232-001A012026.xml',
        };
    }
    async generateExcel(reportId) {
        this.logger.log(`Generando Excel para reporte: ${reportId}`);
        return {
            message: 'Excel generado correctamente',
        };
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = ReportsService_1 = __decorate([
    (0, common_1.Injectable)()
], ReportsService);
//# sourceMappingURL=reports.service.js.map