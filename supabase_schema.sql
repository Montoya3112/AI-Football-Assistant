-- 1. Tabla de Reportes Arbitrales--
CREATE TABLE IF NOT EXISTS public.reportes_partidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipo_local TEXT NOT NULL,
    equipo_visitante TEXT NOT NULL,
    goles_local INT DEFAULT 0,
    goles_visitante INT DEFAULT 0,
    fecha DATE,
    estadio TEXT,
    arbitro TEXT,
    tarjetas_amarillas JSONB DEFAULT '[]'::jsonb,
    tarjetas_rojas JSONB DEFAULT '[]'::jsonb,
    incidencias JSONB DEFAULT '[]'::jsonb,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de Usuarios Registrados
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    verificado BOOLEAN DEFAULT FALSE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Habilitar Seguridad a Nivel de Fila (RLS)
ALTER TABLE public.reportes_partidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Acceso Público / Invitados y Usuarios Autenticados
CREATE POLICY "Permitir lectura y escritura de reportes" 
ON public.reportes_partidos 
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Permitir gestión de usuarios" 
ON public.usuarios 
FOR ALL 
USING (true) 
WITH CHECK (true);
