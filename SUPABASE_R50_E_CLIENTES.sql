-- BeautyPro — SQL complementar (R48 clientes.ativo + R50 cancelamento de vendas)
-- Executar no SQL Editor do Supabase (após backup).
-- Seguro: só ADD COLUMN IF NOT EXISTS + índices.

-- 1) Clientes activos (R48)
ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS ativo boolean DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_clientes_salao_ativo
  ON public.clientes (salao_id, ativo);

-- 2) Cancelamento / estorno de vendas (R50)
ALTER TABLE public.movimentos
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'activo',
  ADD COLUMN IF NOT EXISTS comissao_estornada numeric,
  ADD COLUMN IF NOT EXISTS cancelado_em date,
  ADD COLUMN IF NOT EXISTS cancelado_motivo text;

-- Backfill suave
UPDATE public.movimentos SET status = 'activo' WHERE status IS NULL;

CREATE INDEX IF NOT EXISTS idx_movimentos_salao_status
  ON public.movimentos (salao_id, status);

-- 3) Verificação rápida
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('clientes', 'movimentos')
  AND column_name IN ('ativo', 'status', 'comissao_estornada', 'cancelado_em', 'cancelado_motivo')
ORDER BY table_name, column_name;
