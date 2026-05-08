-- ==========================================
-- VISION SUPER: Esquema de Permisos Granulares
-- ==========================================

-- 1. Catálogo de Unidades de Negocio (U.N.)
CREATE TABLE public.unidades_negocio (
    id TEXT PRIMARY KEY, -- ej. 'VIVIENDA', 'EDUCACION', 'RECREACION'
    nombre TEXT NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Catálogo de Capítulos de la Circular
CREATE TABLE public.capitulos_circular (
    id TEXT PRIMARY KEY, -- ej. 'CAP_II', 'CAP_III', 'CAP_V'
    nombre TEXT NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Mapeo de Usuarios a U.N. y Capítulos (Permisos)
CREATE TABLE public.permisos_usuario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    unidad_id TEXT REFERENCES public.unidades_negocio(id),
    capitulo_id TEXT REFERENCES public.capitulos_circular(id),
    puede_cargar BOOLEAN DEFAULT TRUE,
    puede_revisar BOOLEAN DEFAULT FALSE,
    puede_aprobar BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(usuario_id, unidad_id, capitulo_id)
);

-- 4. Seed inicial de Unidades de Negocio de COMFABOY
INSERT INTO public.unidades_negocio (id, nombre, descripcion) VALUES
('VIV', 'Vivienda', 'Gestión de subsidios y proyectos de vivienda'),
('EDU', 'Educación', 'Servicios educativos y capacitación'),
('REC', 'Recreación', 'Parques, hoteles y centros vacacionales'),
('CRE', 'Crédito', 'Microcrédito y servicios financieros'),
('MER', 'Mercadeo', 'Supermercados y droguerías');

-- 5. Seed inicial de Capítulos
INSERT INTO public.capitulos_circular (id, nombre, descripcion) VALUES
('CAP_II', 'Capítulo II - Estadística', 'Reportes de población y servicios'),
('CAP_III', 'Capítulo III - Financiero', 'Estados financieros y presupuestales'),
('CAP_IV', 'Capítulo IV - Administrativo', 'Gestión de talento humano y recursos'),
('CAP_V', 'Capítulo V - Infraestructura', 'Proyectos de inversión y obras');
