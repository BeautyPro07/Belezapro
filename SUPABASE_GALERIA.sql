-- Galeria CRM — metadados multi-dispositivo
CREATE TABLE IF NOT EXISTS public.galeria_fotos (
  id uuid PRIMARY KEY,
  salao_id uuid NOT NULL,
  profissional_id text,
  profissional_nome text,
  caption text,
  data text,
  url text,
  ts timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_galeria_salao ON public.galeria_fotos (salao_id);
CREATE INDEX IF NOT EXISTS idx_galeria_prof ON public.galeria_fotos (salao_id, profissional_id);

ALTER TABLE public.galeria_fotos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bp_galeria_select ON public.galeria_fotos;
DROP POLICY IF EXISTS bp_galeria_write ON public.galeria_fotos;

CREATE POLICY bp_galeria_select ON public.galeria_fotos FOR SELECT TO authenticated
USING (salao_id IN (SELECT salao_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY bp_galeria_write ON public.galeria_fotos FOR ALL TO authenticated
USING (salao_id IN (SELECT salao_id FROM public.profiles WHERE user_id = auth.uid()))
WITH CHECK (salao_id IN (SELECT salao_id FROM public.profiles WHERE user_id = auth.uid()));

-- Diagnóstico
SELECT count(*) AS n FROM public.galeria_fotos;
