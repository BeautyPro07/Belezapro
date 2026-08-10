-- =====================================================================
-- BeautyPro — R48 / R50 — Colunas de cancelamento + clientes.ativo
-- Executar no SQL Editor do Supabase (projecto real).
-- Seguro: ADD COLUMN IF NOT EXISTS; não apaga dados.
-- =====================================================================

-- 1) Cancelamento / estorno de vendas (movimentos)
ALTER TABLE public.movimentos
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'activo',
  ADD COLUMN IF NOT EXISTS comissao_estornada numeric,
  ADD COLUMN IF NOT EXISTS cancelado_em date,
  ADD COLUMN IF NOT EXISTS cancelado_motivo text;

COMMENT ON COLUMN public.movimentos.status IS 'activo | cancelado';
COMMENT ON COLUMN public.movimentos.comissao_estornada IS 'Comissão estornada no cancelamento';
COMMENT ON COLUMN public.movimentos.cancelado_motivo IS 'Motivo obrigatório no frontend (R50)';

-- Backfill
UPDATE public.movimentos SET status = 'activo' WHERE status IS NULL;

-- 2) Cliente activo / inactivo (R48)
ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS ativo boolean DEFAULT true;

UPDATE public.clientes SET ativo = true WHERE ativo IS NULL;

CREATE INDEX IF NOT EXISTS idx_clientes_salao_ativo
  ON public.clientes (salao_id, ativo);

CREATE INDEX IF NOT EXISTS idx_movimentos_status
  ON public.movimentos (salao_id, status);

-- 3) (Opcional, APÓS limpar legados) — descomente só quando não houver
--    vendas antigas sem profissional_id:
-- ALTER TABLE public.movimentos DROP CONSTRAINT IF EXISTS movimentos_venda_tem_profissional;
-- ALTER TABLE public.movimentos ADD CONSTRAINT movimentos_venda_tem_profissional
--   CHECK (tipo IS DISTINCT FROM 'venda' OR profissional_id IS NOT NULL);

-- Verificação
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('movimentos', 'clientes')
  AND column_name IN ('status','comissao_estornada','cancelado_em','cancelado_motivo','ativo')
ORDER BY table_name, column_name;
