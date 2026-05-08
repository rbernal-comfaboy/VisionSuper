# Diseño UX: Dashboard de Aprobadores (Mobile-First)

Este documento define la experiencia de usuario para los niveles de **Revisoría** y **Aprobadores Finales** (Dirección) en VisionSUPER.

## 1. Concepto de "Semáforo de Cumplimiento"
La pantalla principal mostrará una cuadrícula de tarjetas (cards) representando los capítulos de la circular activos para el periodo.

| Color | Significado | Acción Sugerida |
| --- | --- | --- |
| 🔴 **Rojo** | Vencido o con errores de validación. | Revisar log de errores. |
| 🟡 **Amarillo** | Pendiente de aprobación en su nivel. | Revisar y Aprobar/Rechazar. |
| 🟢 **Verde** | Aprobado y listo para envío. | Descargar XML oficial. |

## 2. Vista de Detalle (Móvil)
Cuando un Aprobador hace clic en un reporte amarillo:

1.  **Resumen Ejecutivo**: Muestra totales generales (ej. "Total Aportes: $XXX.XXX").
2.  **Verificación**: Botón prominente de **"Descargar Espejo Excel"**. Esto permite al directivo abrir el archivo en su móvil y validar cifras rápidamente.
3.  **Historial**: Línea de tiempo de quién preparó y quién revisó previamente.

## 3. Flujo de Acción (Firma Digital)
En la parte inferior de la pantalla móvil, se presentan dos acciones fijas:

*   **[Botón Rojo] Rechazar**: Abre un cuadro de texto obligatorio para indicar el motivo del rechazo. Notifica al preparador inmediatamente.
*   **[Botón Verde] Aprobar y Firmar**: 
    *   Dispara el proceso de firma digital XAdES sobre el XML.
    *   Solicita una confirmación secundaria (biometría del móvil o código PIN).

## 4. Notificaciones Push / Email
El aprobador recibirá un mensaje con un enlace directo:
*"El reporte Capítulo II (Estadística) - Periodo 01-2026 está listo para su firma. [Click para Revisar]"*.

## 5. Accesibilidad
*   Fuentes grandes y contrastadas.
*   Botones de acción con tamaño mínimo de 48px para evitar errores de clic táctil.
*   Modo Oscuro soportado para revisiones fuera del horario de oficina.
