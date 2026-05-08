-- ==========================================
-- VISION SUPER: Gestión de Identidad y Roles
-- ==========================================

-- 1. Tabla de Perfiles Extendidos
CREATE TABLE public.perfiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    nombre_completo TEXT,
    avatar_url TEXT,
    rol TEXT DEFAULT 'PREPARADOR' CHECK (rol IN ('ADMIN', 'PREPARADOR', 'REVISOR', 'APROBADOR')),
    unidad_negocio TEXT, -- ej. 'VIVIENDA', 'EDUCACION', 'FINANCIERA'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Trigger para crear perfil automáticamente al registrarse en Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.perfiles (id, email, nombre_completo, avatar_url)
    VALUES (
        NEW.id, 
        NEW.email, 
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Políticas de RLS para Perfiles
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver su propio perfil"
    ON public.perfiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Admins pueden ver todos los perfiles"
    ON public.perfiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.perfiles
            WHERE id = auth.uid() AND rol = 'ADMIN'
        )
    );

-- 4. Seed de Roles (Comentario: Los roles se manejan vía CHECK constraint por simplicidad, 
-- pero se pueden mover a una tabla public.roles si se requiere dinamismo extremo).
