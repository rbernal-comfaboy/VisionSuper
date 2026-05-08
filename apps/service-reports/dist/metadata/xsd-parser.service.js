"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var XsdParserService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.XsdParserService = void 0;
const common_1 = require("@nestjs/common");
const xmldom_1 = require("@xmldom/xmldom");
const xpath = require("xpath");
const fs = require("fs");
let XsdParserService = XsdParserService_1 = class XsdParserService {
    constructor() {
        this.logger = new common_1.Logger(XsdParserService_1.name);
    }
    async parseXsd(xsdPath) {
        try {
            const xsdContent = fs.readFileSync(xsdPath, 'utf8');
            const doc = new xmldom_1.DOMParser().parseFromString(xsdContent);
            const select = xpath.useNamespaces({ 'xs': 'http://www.w3.org/2001/XMLSchema' });
            const elementNodes = select('//xs:element', doc);
            const metadata = elementNodes.map(node => {
                const name = node.getAttribute('name');
                const type = node.getAttribute('type');
                const minOccurs = node.getAttribute('minOccurs');
                return {
                    name: name || 'unknown',
                    type: type || 'xs:string',
                    required: minOccurs !== '0',
                    restrictions: this.extractRestrictions(node, select)
                };
            });
            return metadata.filter(m => m.name !== 'unknown');
        }
        catch (error) {
            this.logger.error(`Error parseando XSD (JS Mode): ${xsdPath}`, error.stack);
            throw error;
        }
    }
    extractRestrictions(node, select) {
        const restrictions = {};
        const restrictionNode = select('.//xs:restriction', node);
        if (restrictionNode.length > 0) {
            const res = restrictionNode[0];
            restrictions.base = res.getAttribute('base');
            const maxLength = select('./xs:maxLength/@value', res, true);
            if (maxLength)
                restrictions.maxLength = parseInt(maxLength.value);
            const pattern = select('./xs:pattern/@value', res, true);
            if (pattern)
                restrictions.pattern = pattern.value;
        }
        return restrictions;
    }
};
exports.XsdParserService = XsdParserService;
exports.XsdParserService = XsdParserService = XsdParserService_1 = __decorate([
    (0, common_1.Injectable)()
], XsdParserService);
//# sourceMappingURL=xsd-parser.service.js.map