-- ==========================================
-- VISION SUPER: Motor de Workflow y Plantillas
-- ==========================================

-- 1. Catálogo de Plantillas de Workflow
CREATE TABLE public.workflow_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Pasos de la Plantilla
CREATE TABLE public.workflow_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID REFERENCES public.workflow_templates(id) ON DELETE CASCADE,
    orden INTEGER NOT NULL,
    nombre_paso TEXT NOT NULL, -- ej. 'Revisión Contable', 'Aprobación Dirección'
    rol_requerido TEXT NOT NULL, -- 'PREPARADOR', 'REVISOR', 'APROBADOR'
    notificar_email BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(template_id, orden)
);

-- 3. Instancia de Workflow por Reporte
CREATE TABLE public.reporte_workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporte_id UUID REFERENCES public.reportes(id) ON DELETE CASCADE,
    step_id UUID REFERENCES public.workflow_steps(id),
    estado TEXT DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'APROBADO', 'RECHAZADO')),
    usuario_accion UUID, -- Referencia a auth.users
    comentarios TEXT,
    fecha_accion TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Modificar la tabla de Reportes para vincular con Workflow
ALTER TABLE public.reportes ADD COLUMN workflow_template_id UUID REFERENCES public.workflow_templates(id);
ALTER TABLE public.reportes ADD COLUMN current_step_id UUID REFERENCES public.workflow_steps(id);

-- 5. Función para avanzar el workflow (Template)
CREATE OR REPLACE FUNCTION public.avanzar_workflow_reporte()
RETURNS TRIGGER AS $$
BEGIN
    -- Lógica para mover el reporte al siguiente paso basado en el orden de la plantilla
    -- Esto se disparará cuando un paso se marque como 'APROBADO'
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Seed de una plantilla básica para COMFABOY
INSERT INTO public.workflow_templates (nombre, descripcion)
VALUES ('Flujo Estándar Circular 2025', 'Preparación, Revisión de Contaduría y Aprobación de Dirección');

-- Pasos para la plantilla estándar
WITH template AS (SELECT id FROM public.workflow_templates WHERE nombre = 'Flujo Estándar Circular 2025' LIMIT 1)
INSERT INTO public.workflow_steps (template_id, orden, nombre_paso, rol_requerido)
SELECT id, 1, 'Consolidación de Datos', 'PREPARADOR' FROM template
UNION ALL
SELECT id, 2, 'Revisión Técnica / Contable', 'REVISOR' FROM template
UNION ALL
SELECT id, 3, 'Aprobación y Firma Digital', 'APROBADOR' FROM template;
