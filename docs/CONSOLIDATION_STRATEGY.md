# Diseño: Estrategia de Consolidación Híbrida (VisionSUPER)

Este documento describe cómo el sistema unifica datos de múltiples fuentes (Bases de Datos y Excels Manuales) para generar un reporte consolidado único.

## 1. El Concepto de Ingesta Dual
Para cada reporte (ej. Capítulo II), VisionSUPER permite que los datos lleguen por dos vías:
*   **Vía Automática**: Extracción programada desde Informix / SQL Server (Gestada por `service-integrator`).
*   **Vía Manual**: Carga de archivos Excel por parte de los responsables de las Unidades de Negocio (Gestada por `web-angular`).

## 2. Estructura de Staging con Atribución de Origen
Para mantener la trazabilidad, cada registro en `staging_items` incluirá metadatos de su origen:
*   `source_type`: `AUTOMATIC` | `MANUAL`.
*   `source_id`: ID de la base de datos o nombre del archivo Excel.
*   `unit_id`: Unidad de Negocio responsable (ej. "Vivienda", "Educación").

## 3. Lógica de Conciliación y Prevalencia
Cuando existen múltiples fuentes para un mismo reporte, el sistema aplica las siguientes reglas:

### A. Sumatoria (Agregación)
Para reportes estadísticos o financieros donde cada unidad aporta una parte (ej: Número de afiliados por categoría), el sistema simplemente suma o concatena los registros de todas las fuentes.

### B. Prevalencia (Sobrescritura)
Si un dato específico (ej: Total de Activos) viene tanto de una base de datos como de un ajuste manual en Excel:
*   **Regla**: El ajuste manual (MANUAL) siempre tendrá prevalencia sobre el dato automático (AUTOMATIC), asumiendo que el usuario humano realizó una corrección necesaria.

## 4. Flujo de Consolidación
1.  **Apertura de Reporte**: El sistema crea el encabezado del reporte.
2.  **Carga Colectiva**: Se disparan las extracciones y se habilitan los botones de carga para las unidades.
3.  **Cálculo de Totales**: El sistema procesa todos los `staging_items` y genera una vista previa consolidada.
4.  **Validación de Diferencias**: Si la suma de las partes no coincide con el balance general (Cap III), el sistema marca una alerta de inconsistencia.

## 5. El "Espejo" de Validación
Una vez consolidado, el sistema genera el **XLSX de Verificación**. Este archivo contiene una pestaña adicional con el "Detalle de Origen", indicando de qué base de datos o de qué Excel vino cada cifra.
