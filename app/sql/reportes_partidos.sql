-- Supabase (PostgreSQL) schema for AI Football Assistant
-- Table: reportes_partidos
-- Stores structured data extracted from referee match cards (cédulas)

CREATE TABLE IF NOT EXISTS public.reportes_partidos (
    id BIGSERIAL PRIMARY KEY,
    equipo_local VARCHAR(100) NOT NULL,
    equipo_visitante VARCHAR(100) NOT NULL,
    goles_local INTEGER NOT NULL,
    goles_visitante INTEGER NOT NULL,
    tarjetas_rojas INTEGER NOT NULL,
    incidencias JSONB,               -- array of strings, optional
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger to update updated_at on modification
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp ON public.reportes_partidos;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.reportes_partidos
FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
