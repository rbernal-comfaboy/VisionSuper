"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ExtractionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtractionService = void 0;
const common_1 = require("@nestjs/common");
let ExtractionService = ExtractionService_1 = class ExtractionService {
    constructor() {
        this.logger = new common_1.Logger(ExtractionService_1.name);
    }
    async startExtraction(payload) {
        const { fuenteId, capitulo, periodo } = payload;
        this.logger.log(`Iniciando extracción para Fuente: ${fuenteId}, Capítulo: ${capitulo}`);
        return {
            jobId: Math.random().toString(36).substring(7),
            message: 'Extracción iniciada correctamente',
        };
    }
    async getJobStatus(jobId) {
        return {
            jobId,
            status: 'PROCESSING',
            progress: 45,
        };
    }
};
exports.ExtractionService = ExtractionService;
exports.ExtractionService = ExtractionService = ExtractionService_1 = __decorate([
    (0, common_1.Injectable)()
], ExtractionService);
//# sourceMappingURL=extraction.service.js.map