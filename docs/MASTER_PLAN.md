# VisionSUPER: Documento Maestro de Arquitectura y Requerimientos

Este documento es la **Única Fuente de Verdad** para el sistema VisionSUPER de **COMFABOY**. 

---

## 1. Introducción y Objetivos
VisionSUPER centraliza la extracción, consolidación y entrega de información a la **SSSF** (Circular 2025-00008).

### Objetivos Clave (Refinados):
*   **Consolidación Híbrida**: Integración de datos desde aplicaciones (Informix, SQL) y cargas manuales de Excels de unidades de negocio.
*   **Reportes Espejo**: Generación simultánea en XML, XLSX y CSV para facilitar la validación humana.
*   **Workflow Dinámico**: Motor de aprobación basado en plantillas personalizables por capítulo.
*   **Gestión Dinámica de Reportes**: Motor basado en metadatos XSD para manejar +150 estructuras y cambios en la circular sin re-programación.
*   **Interoperabilidad SIMON**: Protocolos de nomenclatura, redondeo normativo y gestión de radicados para la SSSF.
*   **Firma Digital (Opcional)**: Soporte legal mediante firmas electrónicas XAdES.

---

## 2. Arquitectura de Negocio (El Proceso)

1.  **Ingesta Híbrida**: 
    *   `service-integrator` extrae de bases de datos centralizadas (Informix/SQL).
    *   Usuarios de Unidades de Negocio suben archivos Excel con su información específica.
    *   **Conciliación**: El sistema aplica reglas de prevalencia (Manual sobre Automático) para permitir ajustes humanos.
2.  **Consolidación**: El sistema une las piezas en el área de **Staging**, garantizando trazabilidad por origen.
3.  **Verificación**: Los revisores descargan el espejo en **XLSX** para validar contra sus fuentes locales.
4.  **Aprobación**: Flujo multinivel con notificaciones automáticas por email.
5.  **Cierre**: Firma digital del **XML** y descarga para reporte en SIMON.

---

## 3. Componentes Técnicos (Monorepo)

*   **`web-angular`**: Portal responsivo para carga de archivos, dashboard de semáforos y consola de aprobación móvil.
*   **`service-integrator`**: Microservicio de conectores (SQL, Informix) y procesador de Excels masivos.
*   **`service-reports`**: Motor de validación XSD, transcodificador de formatos (XML/XLSX/CSV) y módulo de firma digital.
*   **`Supabase`**: Base de datos de staging, bóveda de credenciales cifradas y motor de autenticación Google.

---

## 4. Estrategia de Seguridad y Auditoría

*   **Trazabilidad**: Auditoría inalterable de cada paso del workflow.
*   **Firma Digital**: Integración de estándares XAdES para el XML final.
*   **Responsividad**: Aplicación accesible en móviles para aprobadores de alto nivel.

---
*Actualizado y Unificado el 2026-05-08.*
