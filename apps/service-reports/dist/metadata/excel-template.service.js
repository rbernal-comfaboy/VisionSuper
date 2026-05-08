"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExcelTemplateService = void 0;
const common_1 = require("@nestjs/common");
const ExcelJS = require("exceljs");
let ExcelTemplateService = class ExcelTemplateService {
    async generateTemplate(columns) {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Carga de Datos');
        const headerRow = worksheet.getRow(1);
        columns.forEach((col, index) => {
            const cell = headerRow.getCell(index + 1);
            cell.value = col.name;
            cell.font = { bold: true, color: { argb: 'FFFFFF' } };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: '1A237E' }
            };
            cell.note = `Tipo: ${col.type}\nObligatorio: ${col.required ? 'SÍ' : 'NO'}`;
            const column = worksheet.getColumn(index + 1);
            column.dataValidation = {
                type: 'whole',
                operator: 'between',
                allowBlank: true,
                showErrorMessage: true,
                errorTitle: 'Error de Formato',
                error: 'El valor ingresado no cumple con la restricción del campo.'
            };
        });
        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }
};
exports.ExcelTemplateService = ExcelTemplateService;
exports.ExcelTemplateService = ExcelTemplateService = __decorate([
    (0, common_1.Injectable)()
], ExcelTemplateService);
//# sourceMappingURL=excel-template.service.js.map