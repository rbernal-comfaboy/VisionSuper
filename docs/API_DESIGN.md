# Diseño de API: VisionSUPER

VisionSUPER utiliza una arquitectura híbrida: **Supabase SDK** para operaciones CRUD directas desde el frontend (cuando es seguro) y **NestJS** para procesos de negocio complejos (Integración Informix, Validación XSD, Firma XML).

## 1. Endpoints de `service-integrator` (Ingesta)

### 1.1. Gestión de Extracción (`/api/v1/extraction`)
*   `POST /trigger`: Inicia la extracción desde una fuente externa (Informix, SQL, etc.).
*   `GET /status/:jobId`: Consulta el progreso de la extracción/carga.

## 2. Endpoints de `service-reports` (Lógica de Negocio)

### 2.1. Validación XSD (`/api/v1/validation`)
*   `POST /validate/:reportId`: Ejecuta la validación de los datos en staging contra el esquema XSD.

### 2.2. Generación de Archivos (`/api/v1/files`)
*   `POST /generate-xml/:reportId`: Crea el XML final.
*   `GET /download-excel/:reportId`: Genera reporte en Excel.

## 2. Supabase (PostgREST / Real-time)

El frontend consumirá directamente a través del cliente `@supabase/supabase-js`:
*   **Dashboard**: `SELECT * FROM reportes` con suscripción Real-time para ver cambios de estado.
*   **Visualización de Datos**: Consultas a `staging_items` filtrando por `reporte_id`.
*   **Gestión de Usuarios**: Acceso a perfiles y roles.

## 3. Seguridad y Autenticación

*   **JWT**: Todas las peticiones a NestJS deben incluir el encabezado `Authorization: Bearer <SUPABASE_JWT>`.
*   **Validación de Token**: NestJS validará el JWT contra la clave secreta de Supabase para identificar al usuario y su rol.
*   **RLS (Row Level Security)**: En PostgreSQL, se aplicarán políticas para asegurar que los "Preparadores" solo vean sus propios reportes (si aplica) y los "Aprobadores" tengan acceso global.

## 4. Manejo de Errores
Estandarización de respuestas de error:
```json
{
  "statusCode": 400,
  "message": "Error de validación XSD",
  "errors": [
    { "line": 45, "column": 12, "error": "El campo 'Salario' no cumple con el formato decimal." }
  ],
  "timestamp": "2026-05-08T10:00:00Z"
}
```
