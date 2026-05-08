import { Injectable, Logger } from '@nestjs/common';
import { DOMParser } from '@xmldom/xmldom';
import * as xpath from 'xpath';
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

  async parseXsd(xsdPath: string): Promise<ColumnMetadata[]> {
    try {
      const xsdContent = fs.readFileSync(xsdPath, 'utf8');
      const doc = new DOMParser().parseFromString(xsdContent);
      
      const select = xpath.useNamespaces({ 'xs': 'http://www.w3.org/2001/XMLSchema' });
      const elementNodes = select('//xs:element', doc) as Element[];

      const metadata: ColumnMetadata[] = elementNodes.map(node => {
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
    } catch (error) {
      this.logger.error(`Error parseando XSD (JS Mode): ${xsdPath}`, error.stack);
      throw error;
    }
  }

  private extractRestrictions(node: Element, select: xpath.XPathSelect): any {
    const restrictions: any = {};
    const restrictionNode = select('.//xs:restriction', node) as Element[];

    if (restrictionNode.length > 0) {
      const res = restrictionNode[0];
      restrictions.base = res.getAttribute('base');

      const maxLength = select('./xs:maxLength/@value', res, true) as Attr;
      if (maxLength) restrictions.maxLength = parseInt(maxLength.value);

      const pattern = select('./xs:pattern/@value', res, true) as Attr;
      if (pattern) restrictions.pattern = pattern.value;
    }

    return restrictions;
  }
}
