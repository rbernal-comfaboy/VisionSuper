import { Injectable, Logger } from '@nestjs/common';

export interface ReportVersion {
  reportCode: string;
  versionNumber: number;
  validFrom: Date;
  validTo?: Date;
  isActive: boolean;
}

@Injectable()
export class LifecycleService {
  private readonly logger = new Logger(LifecycleService.name);

  /**
   * Obtiene la versión de estructura activa para un código de reporte y fecha específica
   * @param reportCode Código del reporte (ej: 2-001A)
   * @param reportDate Fecha para la cual se solicita el reporte
   */
  async getActiveVersion(reportCode: string, reportDate: Date): Promise<number> {
    this.logger.log(`Buscando versión activa para ${reportCode} en fecha ${reportDate.toISOString()}`);
    
    // Lógica para consultar en Supabase (public.versiones_estructura_reporte)
    // Simulamos la respuesta: siempre devuelve la versión más reciente por ahora
    return 1; 
  }

  /**
   * Registra una nueva versión de estructura tras subir un XSD
   */
  async registerNewVersion(reportCode: string, metadata: any[]): Promise<void> {
    this.logger.log(`Registrando nueva versión para el reporte ${reportCode}`);
    // Lógica para insertar en versiones_estructura_reporte y report_columns
  }

  /**
   * Inactiva un reporte si la circular ya no lo exige
   */
  async deactivateReport(reportCode: string): Promise<void> {
    this.logger.log(`Desactivando reporte ${reportCode} por cambio normativo.`);
  }
}
