import { Injectable, Logger } from '@nestjs/common';
import * as libxml from 'libxmljs2';
import * as fs from 'fs';

export interface ColumnMetadata {
  name: string;
  type: string;
  required: boolean;
  restrictions?: any;
}

@Injectable()
export class XsdParserService {
  private readonly logger = new Logger(XsdParserService.name);

  /**
   * Parsea un archivo XSD y extrae la definición de las columnas
   * @param xsdPath Ruta física del archivo XSD
   */
  async parseXsd(xsdPath: string): Promise<ColumnMetadata[]> {
    try {
      const xsdContent = fs.readFileSync(xsdPath, 'utf8');
      const xmlDoc = libxml.parseXml(xsdContent);
      
      const namespaces = { 'xs': 'http://www.w3.org/2001/XMLSchema' };
      const elements = xmlDoc.find('//xs:element', namespaces);

      const metadata: ColumnMetadata[] = elements.map(el => {
        const name = el.attr('name')?.value();
        const type = el.attr('type')?.value();
        const minOccurs = el.attr('minOccurs')?.value();

        return {
          name: name || 'unknown',
          type: type || 'xs:string',
          required: minOccurs !== '0',
          restrictions: this.extractRestrictions(el)
        };
      });

      return metadata.filter(m => m.name !== 'unknown');
    } catch (error) {
      this.logger.error(`Error parseando XSD: ${xsdPath}`, error.stack);
      throw error;
    }
  }

  private extractRestrictions(element: libxml.Element): any {
    const restrictions: any = {};
    const namespaces = { 'xs': 'http://www.w3.org/2001/XMLSchema' };
    
    // Buscar xs:simpleType dentro del elemento
    const simpleType = element.get('.//xs:simpleType/xs:restriction', namespaces);
    if (simpleType) {
      const base = simpleType.attr('base')?.value();
      restrictions.base = base;

      // Extraer facetas comunes
      const maxLength = simpleType.get('./xs:maxLength', namespaces);
      if (maxLength) restrictions.maxLength = parseInt(maxLength.attr('value')?.value() || '0');

      const pattern = simpleType.get('./xs:pattern', namespaces);
      if (pattern) restrictions.pattern = pattern.attr('value')?.value();

      const totalDigits = simpleType.get('./xs:totalDigits', namespaces);
      if (totalDigits) restrictions.totalDigits = parseInt(totalDigits.attr('value')?.value() || '0');

      const fractionDigits = simpleType.get('./xs:fractionDigits', namespaces);
      if (fractionDigits) restrictions.fractionDigits = parseInt(fractionDigits.attr('value')?.value() || '0');
    }

    return restrictions;
  }
}
