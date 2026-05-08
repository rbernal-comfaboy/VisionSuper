# Diseño: Control de Versiones y Rectificaciones (VisionSUPER)

Este módulo gestiona la evolución de los reportes enviados a la Superintendencia, permitiendo corregir errores mediante "Rectificaciones" sin perder el historial del envío original.

## 1. El Ciclo de Vida de una Versión
Cada reporte en VisionSUPER puede tener múltiples versiones asociadas.

| Estado | Descripción |
| --- | --- |
| `V1 - ORIGINAL` | El primer envío oficial realizado. Una vez enviado, se congela. |
| `V2 - RECTIFICACIÓN` | Creado si la Super detecta un error o si COMFABOY decide corregir. |
| `BORRADOR` | Versión en preparación que aún no ha sido oficializada. |

## 2. Diferenciador de Versiones (Visual Diff)
Para facilitar el trabajo del Revisor y Aprobador, el sistema incluirá una herramienta que compara la versión actual con la anterior:
*   **Celdas Resaltadas**: Marca en color diferente los valores que cambiaron.
*   **Resumen de Cambios**: Una lista tipo log (ej: *"El campo Salario Base cambió de $1.000.000 a $1.200.000"*).

## 3. Justificación Normativa
De acuerdo con la normativa de auditoría, cada rectificación debe estar motivada.
*   **Campo Obligatorio**: Antes de aprobar una rectificación, el Preparador debe ingresar una "Justificación del Cambio".
*   **Metadata en XML**: Si el XSD lo permite, se incluirá el indicador de que es un archivo de reemplazo.

## 4. Repositorio Histórico (Vault)
*   **Almacenamiento**: Todos los archivos XML, XLSX y PDF de versiones anteriores se guardan en el Storage de Supabase.
*   **Acceso**: Los administradores pueden descargar cualquier versión histórica para atender visitas de la Superintendencia o auditorías externas.

## 5. Firma Digital en Rectificaciones
Si la firma digital es requerida, cada nueva versión rectificada deberá ser firmada nuevamente por el Director, invalidando legalmente la firma de la versión anterior.
