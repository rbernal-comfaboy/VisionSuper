# Estrategia de Conectores: VisionSUPER (service-integrator)

Dada la heterogeneidad de las fuentes de información de COMFABOY, el microservicio **`service-integrator`** implementa un **Patrón de Adaptador (Adapter Pattern)** en NestJS para centralizar la extracción de datos.

## 1. Arquitectura de Conectores

El sistema utiliza una interfaz común para todos los conectores, lo que permite que el motor de validación y staging sea agnóstico a la fuente de origen.

```typescript
interface IDataConnector {
  connect(config: ConnectionConfig): Promise<void>;
  extract(query: string): Promise<any[]>;
  testConnection(): Promise<boolean>;
  disconnect(): Promise<void>;
}
```

### 1.1. Conectores Soportados
*   **Relacionales**:
    *   **Informix**: Utilizando drivers nativos o ODBC.
    *   **SQL Server**: Librería `tedious`.
    *   **MySQL**: Librería `mysql2`.
    *   **PostgreSQL**: Librería `pg`.
*   **Archivos**:
    *   **Excel**: Procesamiento mediante `exceljs`. Los archivos se suben primero a Supabase Storage y luego NestJS los procesa en segundo plano.

## 2. Flujo de Extracción Multifuente

1.  **Selección**: El usuario elige la fuente de datos (previamente configurada en `fuentes_datos`) desde la interfaz de Angular.
2.  **Mapeo**: Se define un "Mapeador" (Mapping) que traduce las columnas de la fuente original a los campos requeridos por la estructura de la SSSF.
3.  **Ejecución**:
    *   NestJS instancia el adaptador correspondiente.
    *   Realiza la consulta o lectura del archivo.
    *   Transforma los datos al formato JSON estándar de Staging.
4.  **Carga**: Los datos se insertan masivamente en la tabla `staging_items` de PostgreSQL.

## 3. Seguridad de las Credenciales

*   **Cifrado**: Las cadenas de conexión y contraseñas almacenadas en `public.fuentes_datos.config` deben estar cifradas en reposo utilizando **AES-256**.
*   **Variables de Entorno**: La llave de cifrado maestra reside únicamente en las variables de entorno del contenedor de NestJS, nunca en la base de datos.

## 4. Manejo de Erroos y Reintentos
*   **Timeout**: Cada extracción tiene un tiempo límite configurable para evitar el bloqueo del Middleware.
*   **Logs de Extracción**: Cada intento se registra indicando: Fuente, Registros Extraídos, Tiempo de Ejecución y Errores encontrados.
