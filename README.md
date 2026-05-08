# VisionSUPER - COMFABOY

Plataforma integral para la gestión, validación y entrega de información a la Superintendencia de Subsidio Familiar (SSSF).

## 🚀 Arquitectura
El sistema utiliza una arquitectura de **Monorepo** basada en microservicios y contenedores Docker:
- **`web-angular`**: Interfaz de usuario responsiva (Angular 17+).
- **`service-integrator`**: Ingesta de datos desde múltiples fuentes (Informix, SQL, Excel).
- **`service-reports`**: Lógica de negocio, validación XSD y generación de XML.
- **`api-gateway`**: Proxy inverso y ruteo centralizado (Nginx).

## 🛠️ Requisitos Previos
- [Docker](https://docs.docker.com/get-docker/) y [Docker Compose](https://docs.docker.com/compose/install/)
- [Node.js](https://nodejs.org/) (v20 o superior)
- [Git](https://git-scm.com/)

## 📦 Instalación Local

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/tu-organizacion/visor-super.git
    cd visor-super
    ```

2.  **Configurar variables de entorno:**
    ```bash
    cp .env.example .env
    # Edita el archivo .env con tus credenciales
    ```

3.  **Levantar la infraestructura:**
    ```bash
    docker compose up -d
    ```

4.  **Acceder a la aplicación:**
    - Frontend: `http://localhost`
    - Supabase Studio: `http://localhost:54323` (si se usa Supabase Local)

## 🚢 Despliegue (CI/CD)
Este proyecto utiliza **GitHub Actions** para el despliegue continuo. Cada vez que se realiza un push a la rama `main`, el sistema:
1.  Construye las imágenes Docker.
2.  Las sube a GitHub Container Registry (GHCR).
3.  Despliega automáticamente en el servidor de producción vía SSH.

## 📄 Documentación Detallada
Toda la documentación técnica unificada se encuentra en la carpeta **`/docs`**:
- [Master Plan de Arquitectura](docs/MASTER_PLAN.md)
- [Estrategia de Conectores](docs/CONNECTOR_STRATEGY.md)
- [Diseño Responsivo](docs/UI_DESIGN_GUIDELINES.md)

---
© 2026 COMFABOY - División de Tecnologías de Información
