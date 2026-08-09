-- =============================================================================
-- BeautyPro — ETAPA 4.6 — Schema + RLS + Storage (executar no SQL Editor)
-- Ordem: 1) este ficheiro  2) verificar Storage bucket  3) redeploy Edge se preciso
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Contador de recibos + espelho IA em salao_config
-- -----------------------------------------------------------------------------
ALTER TABLE public.salao_config
  ADD COLUMN IF NOT EXISTS recibo_counter integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ia_perguntas_hoje integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ia_perguntas_dia date,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

COMMENT ON COLUMN public.salao_config.recibo_counter IS 'Último número de sequência de recibo do salão (multi-dispositivo)';
COMMENT ON COLUMN public.salao_config.ia_perguntas_hoje IS 'Contador de perguntas IA no dia ia_perguntas_dia';

-- -----------------------------------------------------------------------------
-- 2) Uso diário de IA (fonte de verdade multi-dispositivo)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ia_uso_diario (
  salao_id uuid NOT NULL,
  dia date NOT NULL,
  perguntas integer NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (salao_id, dia)
);

CREATE INDEX IF NOT EXISTS idx_ia_uso_salao_dia ON public.ia_uso_diario (salao_id, dia DESC);

ALTER TABLE public.ia_uso_diario ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ia_uso_select_own ON public.ia_uso_diario;
CREATE POLICY ia_uso_select_own ON public.ia_uso_diario
  FOR SELECT TO authenticated
  USING (
    salao_id IN (SELECT salao_id FROM public.profiles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS ia_uso_upsert_own ON public.ia_uso_diario;
CREATE POLICY ia_uso_upsert_own ON public.ia_uso_diario
  FOR ALL TO authenticated
  USING (
    salao_id IN (SELECT salao_id FROM public.profiles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    salao_id IN (SELECT salao_id FROM public.profiles WHERE user_id = auth.uid())
  );

-- -----------------------------------------------------------------------------
-- 3) Movimentos: garantir coluna recibo (se ainda não existir)
-- -----------------------------------------------------------------------------
ALTER TABLE public.movimentos
  ADD COLUMN IF NOT EXISTS recibo_num text;

CREATE INDEX IF NOT EXISTS idx_movimentos_recibo
  ON public.movimentos (salao_id, recibo_num);

-- -----------------------------------------------------------------------------
-- 4) Fotos — colunas URL (não base64 nas tabelas)
-- -----------------------------------------------------------------------------
ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS foto_url text;

ALTER TABLE public.profissionais
  ADD COLUMN IF NOT EXISTS foto_url text;

-- -----------------------------------------------------------------------------
-- 5) Galeria CRM (metadados)
-- -----------------------------------------------------------------------------
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

ALTER TABLE public.galeria_fotos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS galeria_select_own ON public.galeria_fotos;
CREATE POLICY galeria_select_own ON public.galeria_fotos
  FOR SELECT TO authenticated
  USING (salao_id IN (SELECT salao_id FROM public.profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS galeria_write_own ON public.galeria_fotos;
CREATE POLICY galeria_write_own ON public.galeria_fotos
  FOR ALL TO authenticated
  USING (salao_id IN (SELECT salao_id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (salao_id IN (SELECT salao_id FROM public.profiles WHERE user_id = auth.uid()));

-- -----------------------------------------------------------------------------
-- 6) Storage bucket fotos
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'fotos',
  'fotos',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

DROP POLICY IF EXISTS "fotos_public_read" ON storage.objects;
CREATE POLICY "fotos_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'fotos');

DROP POLICY IF EXISTS "fotos_auth_insert" ON storage.objects;
CREATE POLICY "fotos_auth_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'fotos'
    AND (storage.foldername(name))[1] IN (
      SELECT salao_id::text FROM public.profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "fotos_auth_update" ON storage.objects;
CREATE POLICY "fotos_auth_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'fotos'
    AND (storage.foldername(name))[1] IN (
      SELECT salao_id::text FROM public.profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "fotos_auth_delete" ON storage.objects;
CREATE POLICY "fotos_auth_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'fotos'
    AND (storage.foldername(name))[1] IN (
      SELECT salao_id::text FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- 7) RLS salao_config (se ainda não existir policy de update)
-- -----------------------------------------------------------------------------
ALTER TABLE public.salao_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS salao_config_select_own ON public.salao_config;
CREATE POLICY salao_config_select_own ON public.salao_config
  FOR SELECT TO authenticated
  USING (salao_id IN (SELECT salao_id FROM public.profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS salao_config_update_own ON public.salao_config;
CREATE POLICY salao_config_update_own ON public.salao_config
  FOR ALL TO authenticated
  USING (salao_id IN (SELECT salao_id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (salao_id IN (SELECT salao_id FROM public.profiles WHERE user_id = auth.uid()));

-- Fim ETAPA 4.6 SQL
