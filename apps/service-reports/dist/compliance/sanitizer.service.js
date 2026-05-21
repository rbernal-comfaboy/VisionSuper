"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SanitizerService = void 0;
const common_1 = require("@nestjs/common");
let SanitizerService = class SanitizerService {
    sanitizeText(text) {
        if (!text)
            return '';
        return text
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/ñ/g, 'n')
            .replace(/Ñ/g, 'N')
            .replace(/[^\x20-\x7E]/g, '')
            .toUpperCase();
    }
    formatNumeric(value, decimals = 0, method = 'truncate') {
        if (method === 'truncate') {
            const factor = Math.pow(10, decimals);
            return (Math.floor(value * factor) / factor).toFixed(decimals);
        }
        return value.toFixed(decimals);
    }
    generateFileName(nit, reportCode, period, version) {
        return `${nit}_${reportCode.replace('-', '')}_${period}_${version}.xml`;
    }
};
exports.SanitizerService = SanitizerService;
exports.SanitizerService = SanitizerService = __decorate([
    (0, common_1.Injectable)()
], SanitizerService);
//# sourceMappingURL=sanitizer.service.js.map