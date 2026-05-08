# Requerimientos del Sistema: VisorSuper (COMFABOY)

Este documento detalla los requerimientos para el desarrollo de la aplicación **VisorSuper**, una plataforma diseñada para gestionar la creación, control, aprobación y entrega de información de **COMFABOY** a la **Superintendencia de Subsidio Familiar (SSSF)**, cumpliendo con la Circular Externa 2025-00008 y su Anexo Técnico.

## 2. Objetivos del Sistema
*   **Centralizar** la gestión de la información reportada a la SSSF.
*   **Automatizar** la generación de archivos en formato XML (según XSD oficial) y Excel.
*   **Controlar** los accesos mediante integración con Google Workspace.
*   **Garantizar** la calidad de la información mediante flujos de validación y aprobación.
*   **Gestionar** múltiples fuentes de datos internas para consolidar los reportes.

## 3. Alcance Funcional

### 3.1. Gestión de Accesos y Seguridad
*   **Autenticación**: Integración con Google Identity Services (OAuth2 / SSO).
*   **Roles de Usuario**: Administrador, Preparador, Revisor, Aprobador.

### 3.2. Gestión de Fuentes de Datos
*   Conexión a bases de datos internas (Informix, SQL Server, MySQL, Postgres).
*   Carga manual mediante plantillas de Excel.

### 3.4. Flujo de Aprobación
1.  **Preparación**: Extracción de datos.
2.  **Validación**: Contra XSD y reglas de negocio.
3.  **Revisión**: Por parte de Contabilidad/Revisoria.
4.  **Aprobación**: Firma de la Dirección Administrativa.
5.  **Generación**: XML oficial con nomenclatura estricta.
