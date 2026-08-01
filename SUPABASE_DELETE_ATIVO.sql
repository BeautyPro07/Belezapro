-- BeautyPro: soft-delete profissionais/servicos + deletes reais onde possível
-- Correr no SQL Editor. Idempotente.

-- Colunas obrigatórias
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS ativo boolean DEFAULT true;
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS data_desativacao timestamptz;
ALTER TABLE public.servicos ADD COLUMN IF NOT EXISTS ativo boolean DEFAULT true;

-- Normalizar NULL → activo
UPDATE public.profissionais SET ativo = true WHERE ativo IS NULL;
UPDATE public.servicos SET ativo = true WHERE ativo IS NULL;

CREATE INDEX IF NOT EXISTS idx_profissionais_salao_ativo ON public.profissionais (salao_id, ativo);
CREATE INDEX IF NOT EXISTS idx_servicos_salao_ativo ON public.servicos (salao_id, ativo);

-- Permitir PATCH de ativo a utilizadores do salão (RLS já deve cobrir UPDATE)
-- Diagnóstico: profissionais ainda activos que deveriam estar destituídos
-- (preencher manualmente se souber os ids)

-- Opcional: desactivar em massa por lista de ids
-- UPDATE public.profissionais SET ativo = false, data_desativacao = now(), updated_at = now()
-- WHERE salao_id = 'SEU_SALAO_ID' AND id IN ('id1','id2');

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('profissionais','servicos')
  AND column_name IN ('ativo','data_desativacao');
