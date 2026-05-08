# VisionSUPER: Documento Maestro de Arquitectura y Requerimientos

Este documento es la **Única Fuente de Verdad** para el sistema VisionSUPER de **COMFABOY**. Centraliza requerimientos de negocio, diseño técnico y estrategias de despliegue.

---

## 1. Introducción y Objetivos
VisionSUPER es la plataforma de cumplimiento normativo diseñada para centralizar la extracción, validación, aprobación y entrega de información a la **Superintendencia de Subsidio Familiar (SSSF)** (Circular 2025-00008).

### Objetivos Principales:
*   **Centralización**: Consolidar datos de múltiples fuentes (**Informix, SQL Server, MySQL, Postgres, Excel**).
*   **Automatización**: Generación de archivos XML firmados digitalmente (XSD oficial) y reportes en Excel.
*   **Calidad**: Validación estructural y de negocio en tiempo real.
*   **Control**: Trazabilidad completa de cada acción y flujo de aprobación por niveles.

---

## 2. Arquitectura del Sistema (Monorepo)

El sistema utiliza una arquitectura de microservicios y BaaS (Backend as a Service) auto-alojado:

*   **`web-angular`**: Interfaz de usuario en Angular 17+ con Angular Material. Dashboard de cumplimiento con semáforos de periodicidad.
*   **`service-integrator`**: Ingesta de datos heterogéneos. Conecta a Informix (VPN) y procesa Excels masivos.
*   **`service-reports`**: Motor de validación XSD, lógica de negocio y generación de XML firmados (estándar XAdES).
*   **`api-gateway`**: Punto de entrada único vía Nginx para ruteo y terminación SSL.
*   **`Supabase (Self-Hosted)`**: 
    *   **PostgreSQL**: Staging de datos y logs de auditoría.
    *   **GoTrue**: Autenticación restringida a dominio **@comfaboy.com.co** vía Google OAuth.
    *   **Storage**: Repositorio de XMLs finales y anexos PDF.

---

## 3. Modelo de Datos y Staging

VisionSUPER desacopla las fuentes de producción mediante un área de **Staging** flexible:

1.  **Tablas Core**: Gestión de capítulos (II al VIII), usuarios, roles y fuentes de datos configurables.
2.  **Staging Items**: Almacenamiento en `JSONB` para los datos extraídos antes de ser validados.
3.  **Auditoría Detallada**: Registro inalterable de quién, qué y cuándo se modificó la información (Cumplimiento SSSF 3.1).

---

## 4. Estrategia de Integración (Extract-Map-Load)

*   **Patrón Adaptador**: Conectores agnósticos para diferentes motores de DB.
*   **Mapeador Dinámico**: Interfaz para vincular columnas de origen con campos de la circular sin programar.
*   **Validación Cruzada**: Verificación de consistencia entre capítulos (ej. aportes en Cap II vs balance en Cap III).

---

## 5. Flujo de Trabajo (Workflow)

1.  **Preparador**: Carga datos, corrige errores de validación.
2.  **Revisor**: Auditoría por Contaduría / Revisoría Fiscal.
3.  **Aprobador**: Firma final del Director Administrativo.
4.  **Entrega**: Disponibilidad del XML para cargue en portal SIMON.

---

## 6. Infraestructura y Seguridad

*   **Despliegue**: Docker Compose en Ubuntu Server (4-8 Cores, 8-16 GB RAM).
*   **Diseño Responsivo (Mobile-First)**: La interfaz está optimizada para dispositivos móviles y tablets, permitiendo a los Directores revisar y aprobar reportes desde cualquier lugar.
*   **Seguridad**: 
    *   Row Level Security (RLS) en Postgres.
    *   Cifrado AES-256 para credenciales de bases de datos externas.
    *   VPN (WireGuard/Tailscale) para acceso administrativo.
    *   SSL obligatorio en puerto 443.

---
*Documento actualizado y unificado el 2026-05-08.*
