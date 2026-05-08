# VisionSUPER: Manual Maestro de Ingeniería y Especificación Total (V2.1)

Este documento es la **Única Fuente de Verdad** técnica para la plataforma VisionSUPER de COMFABOY. Contiene la consolidación de todos los requerimientos normativos, arquitectónicos y funcionales detectados durante la fase de análisis profundo.

---

## 1. ARQUITECTURA DE SOFTWARE Y STACK TECNOLÓGICO

### 1.1. Ecosistema de Microservicios Desacoplados
El sistema opera bajo una arquitectura orientada a servicios (SOA) en contenedores Docker:
- **Frontend (web-angular)**: Desplegado en un contenedor Nginx optimizado para Single Page Applications (SPA).
- **Identity Service (Supabase)**: Auth centralizado (GoTrue) con soporte para Google OAuth 2.0 / LDAP.
- **Ingestion & ETL Service (service-integrator)**: Motor de extracción para Informix y SQL Server, y procesador de ingesta de archivos Excel.
- **Reporting & Compliance Service (service-reports)**: Generador multiformato (XML, XLSX, CSV), validador XSD y módulo de firma digital.

### 1.2. Infraestructura y Despliegue
- **Base de Datos**: PostgreSQL 15 (Supabase Self-Hosted) para staging, logs y auditoría.
- **Proxy Inverso**: Nginx Proxy Manager o Traefik para gestión de certificados SSL y terminación TLS.
- **Storage**: Repositorio en Supabase para archivos XML generados y evidencias PDF.
- **Seguridad**: Cifrado AES-256-GCM para almacenamiento de credenciales externas.

---

## 2. GESTIÓN DINÁMICA DE METADATOS Y REPORTES

### 2.1. Motor de Metadatos (XSD-Driven)
VisionSUPER interpreta la normativa dinámicamente:
- **XSD Dynamic Parser**: El sistema procesa los archivos `.xsd` oficiales para autoconfigurar las reglas de validación.
- **Auto-Generación de UI**: Formularios y plantillas Excel generados en tiempo real.

### 2.2. Ciclo de Vida Adaptativo (+150 Reportes)
- **Estructuras Versionadas**: Soporte para cambios en la circular sin romper históricos.
- **Motor de Periodicidad**: Cálculo automático de vencimientos y alertas preventivas.

---

## 3. INGESTA HÍBRIDA Y CONSOLIDACIÓN DE DATOS

### 3.1. Estrategia de Ingesta Dual
- **Conectores Automáticos**: Extracción directa de bases de datos productivas (Informix/SQL).
- **Ingesta Manual**: Procesamiento de archivos Excel de las unidades de negocio.

### 3.2. Área de Staging y Conciliación
- **Staging de Alto Volumen**: Capacidad de millones de registros con trazabilidad total.
- **Prevalencia Manual**: El ajuste humano sobreescribe el automático con log de auditoría.

### 3.3. DESCUBRIMIENTO Y MAPEO DE DATOS (LOOKER-STYLE)
VisionSUPER integra la potencia de una herramienta de Business Intelligence para gestionar la complejidad de las fuentes de datos de COMFABOY:
1. **Galería Visual de Conectores**: Interfaz intuitiva tipo "mosaico" donde el administrador elige su fuente (SQL, Informix, Excel o Google Sheets) con validación de credenciales en tiempo real.
2. **Mapeador Vivo (Drag & Drop)**: Permite arrastrar campos de la fuente al destino (XSD) visualizando instantáneamente una muestra de datos reales para verificar la coherencia del mapeo.
3. **Fórmulas de Transformación**: Motor de cálculo que permite limpiar datos, cambiar formatos de fecha o concatenar strings (ej. UPPER, TRIM, DATE_FORMAT) sin escribir código SQL.
4. **Mapeo Inteligente (Smart Mapping AI)**: Sistema de sugerencias que vincula automáticamente campos de la base de datos con elementos del XSD basándose en semántica y patrones de datos.
5. **Monitor de Salud de Conexión**: Alerta proactiva que detecta si una tabla origen fue modificada o eliminada, notificando la ruptura del puente de datos antes de que falle el reporte.

---

## 4. INTELIGENCIA NORMATIVA Y CALIDAD DE DATOS

### 4.1. Garantía de Calidad Normativa
- **Validación Cruzada Inter-Capítulo**: Consistencia lógica entre diferentes reportes.
- **Detector de Varianza**: Alertas por cambios estadísticos inusuales vs mes anterior.
- **Catálogos Maestros**: Tablas DANE, CIIU y catálogos oficiales integrados.
- **Reportes en Cero**: Generación automatizada de archivos vacíos según la norma.

### 4.2. Interoperabilidad SIMON (SSSF)
- **Nomenclatura Blindada**: Generación automática `NIT_COR_PER_VER.xml`.
- **Sanitización XML**: Limpieza de caracteres especiales y codificación UTF-8.
- **Aritmética Normativa**: Reglas de redondeo y truncamiento según el anexo técnico.

---

## 5. AUDITORÍA, COLABORACIÓN Y RESILIENCIA

### 5.1. Estrategias de Auditoría Avanzada
- **Auditoría Forense (Cell-Level)**: Log de cambios por cada celda: Quién, cuándo, valor anterior/nuevo.
- **Bóveda de Papeles de Trabajo**: Repositorio de evidencias y documentos de soporte.

### 5.2. Inteligencia de Cumplimiento
- **Pre-flight Check (Simulador)**: Chequeo masivo preventivo antes de la firma.
- **Contextual Chat**: Hilos de comunicación interna por cada reporte.
- **Gestión de Suplencias**: Delegación temporal de firma digital con registro.

---

## 6. GOBERNANZA Y TRANSFORMACIÓN DIGITAL (AI & BI)

### 6.1. MOTOR DE VISUALIZACIÓN Y DASHBOARDS (LOOKER-STYLE)
VisionSUPER evoluciona a una plataforma de BI para la alta gerencia de COMFABOY:
1. **Lienzo de Diseño (Drag & Drop)**: Interfaz para crear tableros personalizados arrastrando componentes visuales.
2. **Biblioteca de Componentes**: Scorecards, gráficos de barras, series temporales y semáforos de cumplimiento normativo.
3. **Filtros de Datos Globales**: Segmentación dinámica de los tableros por Periodo, Unidad de Negocio y Capítulo.
4. **Exportación y Agendamiento**: Descarga de reportes visuales en PDF y envío automatizado de KPIs por correo electrónico.

### 6.2. Automatización Avanzada con IA
- **Resumen Ejecutivo IA**: Generación automática de narrativas de negocio.
- **Firma Biométrica Móvil**: FaceID/TouchID para aprobación desde el celular.
- **Clasificación AI de Evidencias**: OCR para etiquetado automático de soportes.
- **Offline-First Mode**: Carga de datos sin conexión para sedes remotas.

---
*Fin del Manual Maestro de Ingeniería - Versión Total Consolidada V2.1 - 2026-05-08*
