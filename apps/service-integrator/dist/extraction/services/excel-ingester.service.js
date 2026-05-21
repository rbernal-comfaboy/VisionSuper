"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ExcelIngesterService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExcelIngesterService = void 0;
const common_1 = require("@nestjs/common");
const ExcelJS = require("exceljs");
let ExcelIngesterService = ExcelIngesterService_1 = class ExcelIngesterService {
    constructor() {
        this.logger = new common_1.Logger(ExcelIngesterService_1.name);
    }
    async processExcel(fileBuffer, reportId, unitId) {
        this.logger.log(`Procesando Excel para Reporte: ${reportId}, Unidad: ${unitId}`);
        const workbook = new ExcelJS.Workbook();
        const buffer = Buffer.isBuffer(fileBuffer) ? fileBuffer : Buffer.from(fileBuffer);
        await workbook.xlsx.load(buffer);
        const worksheet = workbook.getWorksheet(1);
        const records = [];
        if (!worksheet) {
            throw new Error('No se encontró la hoja de trabajo en el Excel');
        }
        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            if (rowNumber === 1)
                return;
            const record = { reportId, unitId, data: row.values };
            records.push(record);
        });
        return records;
    }
};
exports.ExcelIngesterService = ExcelIngesterService;
exports.ExcelIngesterService = ExcelIngesterService = ExcelIngesterService_1 = __decorate([
    (0, common_1.Injectable)()
], ExcelIngesterService);
//# sourceMappingURL=excel-ingester.service.js.map