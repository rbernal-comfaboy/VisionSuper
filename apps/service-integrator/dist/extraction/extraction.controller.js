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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtractionController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const extraction_service_1 = require("./extraction.service");
const excel_ingester_service_1 = require("./services/excel-ingester.service");
let ExtractionController = class ExtractionController {
    constructor(extractionService, excelIngesterService) {
        this.extractionService = extractionService;
        this.excelIngesterService = excelIngesterService;
    }
    async triggerExtraction(body) {
        return this.extractionService.startExtraction(body);
    }
    async uploadExcel(file, reportId, unitId) {
        const data = await this.excelIngesterService.processExcel(file.buffer, reportId, unitId);
        return {
            success: true,
            rowsProcessed: data.length,
            message: 'Archivo procesado y cargado en staging.',
        };
    }
    async getStatus(jobId) {
        return this.extractionService.getJobStatus(jobId);
    }
};
exports.ExtractionController = ExtractionController;
__decorate([
    (0, common_1.Post)('trigger'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ExtractionController.prototype, "triggerExtraction", null);
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)('reportId')),
    __param(2, (0, common_1.Body)('unitId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ExtractionController.prototype, "uploadExcel", null);
__decorate([
    (0, common_1.Get)('status/:jobId'),
    __param(0, (0, common_1.Param)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ExtractionController.prototype, "getStatus", null);
exports.ExtractionController = ExtractionController = __decorate([
    (0, common_1.Controller)('extraction'),
    __metadata("design:paramtypes", [extraction_service_1.ExtractionService,
        excel_ingester_service_1.ExcelIngesterService])
], ExtractionController);
//# sourceMappingURL=extraction.controller.js.map