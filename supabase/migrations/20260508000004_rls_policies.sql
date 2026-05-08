-- ==========================================
-- VISION SUPER: Políticas de Seguridad RLS
-- ==========================================

-- 1. Habilitar RLS en las tablas core
ALTER TABLE public.unidades_negocio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permisos_usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staging_items ENABLE ROW LEVEL SECURITY;

-- 2. Política: Los usuarios solo ven su propio perfil de permisos
CREATE POLICY "Usuarios ven sus propios permisos"
ON public.permisos_usuario
FOR SELECT
USING (usuario_id = auth.uid());

-- 3. Política: Aislamiento por Unidad de Negocio (Staging)
-- Un usuario solo ve items de staging si pertenecen a su Unidad de Negocio asignada
CREATE POLICY "Aislamiento por Unidad de Negocio"
ON public.staging_items
FOR ALL
USING (
    unidad_id IN (
        SELECT unidad_id FROM public.permisos_usuario 
        WHERE usuario_id = auth.uid()
    )
);

-- 4. Política: Los Administradores ven TODO
CREATE POLICY "Admin ve todo en permisos"
ON public.permisos_usuario
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.perfiles 
        WHERE id = auth.uid() AND rol = 'ADMIN'
    )
);

CREATE POLICY "Admin ve todo en staging"
ON public.staging_items
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.perfiles 
        WHERE id = auth.uid() AND rol = 'ADMIN'
    )
);
