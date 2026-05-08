# Diseño: Motor de Workflow y Aprobación (VisionSUPER)

Este documento detalla el funcionamiento del sistema de aprobación dinámico para los reportes de COMFABOY.

## 1. Plantillas de Workflow (Templates)
En lugar de un flujo rígido, VisionSUPER permite definir "Plantillas" reutilizables. Cada plantilla define una secuencia de pasos.

| Tabla | Descripción |
| --- | --- |
| `workflow_templates` | Nombre de la plantilla (ej: "Aprobación Financiera"). |
| `workflow_steps` | Define el orden, rol responsable y acción requerida (Preparar, Revisar, Aprobar). |

## 2. El Reporte Multiformato (Mirroring)
Durante todo el ciclo de vida del workflow, el reporte estará disponible en tres formatos sincronizados:
*   **XLSX / CSV**: Para validación analítica por parte de los revisores.
*   **PDF**: Para visualización rápida y firma de acta interna.
*   **XML**: El entregable final para la SSSF.

## 3. Flujo de Estados y Notificaciones

### Fase 1: Consolidación (Manual + DB)
*   **Acción**: El sistema extrae de Informix y los responsables de unidades de negocio suben sus Excels.
*   **Notificación**: Se alerta al "Preparador" que la información está lista para consolidar.

### Fase 2: Revisión Técnica
*   **Acción**: Contabilidad o Revisoría Fiscal descarga el **XLSX** para verificar cifras.
*   **Estado**: `EN_REVISION`.

### Fase 3: Aprobación y Firma
*   **Acción**: El Director Administrativo recibe un correo, revisa el **PDF** y otorga la **Firma Digital**.
*   **Estado**: `APROBADO`.

## 4. Firma Electrónica / Digital
*   **XML (XAdES)**: Firma obligatoria para el archivo XML de la Super.
*   **Soporte**: El sistema permitirá cargar certificados digitales (.p12) para realizar la firma en el servidor.

## 5. Trazabilidad (Auditoría)
Cada "Aprobación" o "Rechazo" en el workflow genera un registro en la tabla de `auditoria` con:
*   Usuario, Fecha, Comentario de aprobación y Versión del archivo aprobada.
