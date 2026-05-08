-- ==========================================
-- VISION SUPER: Esquema Inicial de Base de Datos
-- ==========================================

-- 1. Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tablas Maestras (Esquema Public)

-- Catálogo de Capítulos de la Circular SSSF
CREATE TABLE public.capitulos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo TEXT UNIQUE NOT NULL, -- ej. 'II', 'III'
    nombre TEXT NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Definición de Estructuras (Secciones dentro de un capítulo)
CREATE TABLE public.estructuras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    capitulo_id UUID REFERENCES public.capitulos(id),
    nombre TEXT NOT NULL, -- ej. 'Empresas', 'Afiliados'
    xsd_path TEXT,        -- Ruta interna al esquema XSD
    config_mapeo JSONB,   -- Configuración por defecto
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fuentes de Datos Externas
CREATE TABLE public.fuentes_datos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    tipo TEXT NOT NULL, -- 'INFORMIX', 'SQLSERVER', 'MYSQL', 'POSTGRES', 'EXCEL'
    config JSONB NOT NULL, -- Credenciales cifradas, host, puerto, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gestión de Reportes (Encabezado de Envío)
CREATE TABLE public.reportes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nomenclatura TEXT UNIQUE, -- ej. 'CCF0232-001A012026'
    periodo TEXT NOT NULL,    -- '012026'
    anio INTEGER NOT NULL,
    capitulo_id UUID REFERENCES public.capitulos(id),
    fuente_id UUID REFERENCES public.fuentes_datos(id),
    estado TEXT DEFAULT 'BORRADOR' CHECK (estado IN ('BORRADOR', 'VALIDADO', 'REVISADO', 'APROBADO', 'ENVIADO')),
    preparado_por UUID, -- Referencia a auth.users
    aprobado_por UUID,  -- Referencia a auth.users
    fecha_aprobacion TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Área de Staging (Datos de Negocio)

CREATE TABLE public.staging_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporte_id UUID REFERENCES public.reportes(id) ON DELETE CASCADE,
    datos_crudos JSONB NOT NULL, -- Fila original de la fuente
    datos_mapeados JSONB,        -- Fila transformada lista para XSD
    es_valido BOOLEAN DEFAULT FALSE,
    errores JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Trazabilidad (Auditoría)

CREATE TABLE public.auditoria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporte_id UUID REFERENCES public.reportes(id),
    usuario_id UUID, -- Referencia a auth.users
    accion TEXT NOT NULL, -- 'CAMBIO_ESTADO', 'IMPORTACION', 'EDICION'
    detalle TEXT,
    data_anterior JSONB,
    data_nueva JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_reportes_updated_at BEFORE UPDATE ON public.reportes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 6. RLS (Row Level Security) - Básica
ALTER TABLE public.reportes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados pueden ver reportes" ON public.reportes
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Solo administradores pueden crear fuentes" ON public.fuentes_datos
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
