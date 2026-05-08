# Documento de Infraestructura: VisionSUPER (COMFABOY)

Este documento describe la arquitectura técnica, el flujo de datos y las especificaciones de infraestructura para la plataforma **VisionSUPER**, diseñada para la gestión de reportes a la Superintendencia de Subsidio Familiar (SSSF).

## 1. Arquitectura de Componentes (Stack Tecnológico)

La solución se basa en una arquitectura de microservicios contenerizados mediante **Docker**, garantizando portabilidad y facilidad de despliegue.

*   **Frontend**: Angular (v17+)
    *   Desplegado en un contenedor Nginx optimizado para Single Page Applications (SPA).
    *   Interfaz moderna y responsiva para Dashboard y formularios.
*   **BaaS (Gestión de Datos)**: Supabase Self-Hosted
    *   **PostgreSQL**: Base de datos principal para staging de datos, logs y auditoría.
    *   **GoTrue**: Gestión de autenticación con soporte para Google OAuth.
    *   **PostgREST**: Exposición automática de APIs REST para las tablas de staging.
    *   **Storage**: Repositorio para archivos XML generados y anexos PDF.
*   **Backend de Procesamiento (Microservicios NestJS)**:
    *   **`service-integrator`**: Encargado de la ingesta de datos. Conecta a fuentes externas (**Informix, SQL Server, MySQL, PostgreSQL**) y procesa archivos **Excel**.
    *   **`service-reports`**: Encargado de la lógica de negocio. Realiza validaciones **XSD**, generación de archivos **XML/Excel** y procesos de firma digital.
*   **Proxy Inverso**: Nginx Proxy Manager o Traefik
    *   Gestión de certificados SSL (Let's Encrypt) y terminación de TLS.

## 2. Diagrama de Flujo de Datos

El flujo asegura la integridad de la información desde su origen hasta la entrega final:

1.  **Extracción**: NestJS consulta el **Informix** de producción mediante un túnel seguro o red privada.
2.  **Staging (Carga)**: Los datos extraídos se transforman y se guardan en la base de datos **PostgreSQL** de Supabase para que los "Preparadores" puedan visualizarlos y editarlos en el dashboard.
3.  **Validación**: Al solicitar la validación, NestJS procesa los datos de Postgres contra los esquemas **XSD** oficiales de la SSSF, devolviendo errores detallados en caso de inconsistencias.
4.  **Aprobación y Firma**: Tras la aprobación del Director Administrativo, NestJS genera el XML final, aplica la firma (si se requiere) y lo guarda en el **Storage de Supabase**.
5.  **Notificación**: Se notifica al usuario la disponibilidad del reporte final.

## 3. Detalles de Implementación (Infraestructura)

### A. Especificaciones del Servidor (VPS o VM)
Para el stack completo de Supabase Self-Hosted y las aplicaciones de negocio:

| Componente | Especificación Mínima | Recomendado |
| :--- | :--- | :--- |
| **CPU** | 4 Cores | 8 Cores |
| **RAM** | 8 GB | 16 GB |
| **SSD** | 100 GB | 250 GB+ |
| **SO** | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |

### B. Configuración de Docker (Orquestación)
El despliegue se organiza en tres capas de `docker-compose` para facilitar el mantenimiento:

1.  **`docker-compose.supabase.yml`**: Servicios de base de datos, auth, API y storage.
2.  **`docker-compose.app.yml`**: Frontend Angular y Backend NestJS (Middleware).
3.  **`docker-compose.proxy.yml`**: Nginx Proxy Manager para tráfico externo y HTTPS.

## 4. Estrategia de Seguridad y Backups

### A. Seguridad
*   **Aislamiento de Red**: Solo el puerto 443 (HTTPS) está expuesto. La comunicación entre NestJS, Postgres e Informix ocurre en redes internas aisladas de Docker.
*   **VPN de Gestión**: El acceso a Supabase Studio y administración de base de datos se restringe a conexiones vía VPN (WireGuard o Tailscale).
*   **Autenticación**: MFA obligatorio mediante Google Workspace para roles críticos.

### B. Backups
*   **Base de Datos**: Dump diario de PostgreSQL automatizado hacia almacenamiento externo (S3 Compatible o servidor de backup institucional).
*   **Archivos**: Sincronización horaria del storage de XMLs con una ubicación de almacenamiento en frío (Cold Storage).
*   **Logs**: Retención de logs de auditoría por un mínimo de 5 años según normatividad.
