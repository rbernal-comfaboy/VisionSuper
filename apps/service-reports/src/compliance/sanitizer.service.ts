import { Injectable } from '@nestjs/common';

@Injectable()
export class SanitizerService {
  /**
   * Limpia caracteres especiales para evitar errores en el XML de la Super
   * @param text Texto a sanitizar
   */
  sanitizeText(text: string): string {
    if (!text) return '';
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Quita tildes
      .replace(/ñ/g, 'n')
      .replace(/Ñ/g, 'N')
      .replace(/[^\x20-\x7E]/g, '') // Solo caracteres ASCII imprimibles
      .toUpperCase();
  }

  /**
   * Aplica reglas de redondeo o truncamiento normativo
   * @param value Valor numérico
   * @param decimals Cantidad de decimales permitidos
   * @param method 'round' o 'truncate'
   */
  formatNumeric(value: number, decimals: number = 0, method: 'round' | 'truncate' = 'truncate'): string {
    if (method === 'truncate') {
      const factor = Math.pow(10, decimals);
      return (Math.floor(value * factor) / factor).toFixed(decimals);
    }
    return value.toFixed(decimals);
  }

  /**
   * Genera el nombre de archivo normativo para la SSSF
   */
  generateFileName(nit: string, reportCode: string, period: string, version: string): string {
    return `${nit}_${reportCode.replace('-', '')}_${period}_${version}.xml`;
  }
}
