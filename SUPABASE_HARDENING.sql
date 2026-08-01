-- BeautyPro — SQL de auditoria e reforço (correr no SQL Editor)
-- Seguro: verifica + reforça RLS. Não apaga dados.

-- 1) Colunas foto_url
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS foto_url text;
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS foto_url text;

-- 2) Soft-delete: garantir coluna ativo
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS ativo boolean DEFAULT true;
ALTER TABLE public.servicos ADD COLUMN IF NOT EXISTS ativo boolean DEFAULT true;
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS data_desativacao timestamptz;

-- 3) Índices úteis
CREATE INDEX IF NOT EXISTS idx_clientes_salao ON public.clientes (salao_id);
CREATE INDEX IF NOT EXISTS idx_profissionais_salao ON public.profissionais (salao_id);
CREATE INDEX IF NOT EXISTS idx_servicos_salao ON public.servicos (salao_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_salao ON public.agendamentos (salao_id);
CREATE INDEX IF NOT EXISTS idx_movimentos_salao ON public.movimentos (salao_id);

-- 4) Bucket fotos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('fotos', 'fotos', true, 2097152, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 2097152;

-- 5) RLS tabelas principais (ajuste se policies já existirem com outros nomes)
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentos ENABLE ROW LEVEL SECURITY;

-- Policy padrão: isolação por salao_id via profiles
-- (DROP + CREATE para nomes estáveis BeautyPro)
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['clientes','profissionais','servicos','agendamentos','movimentos']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS bp_select_%s ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS bp_write_%s ON public.%I', t, t);
    EXECUTE format(
      'CREATE POLICY bp_select_%s ON public.%I FOR SELECT TO authenticated
       USING (salao_id IN (SELECT salao_id FROM public.profiles WHERE user_id = auth.uid()))', t, t);
    EXECUTE format(
      'CREATE POLICY bp_write_%s ON public.%I FOR ALL TO authenticated
       USING (salao_id IN (SELECT salao_id FROM public.profiles WHERE user_id = auth.uid()))
       WITH CHECK (salao_id IN (SELECT salao_id FROM public.profiles WHERE user_id = auth.uid()))', t, t);
  END LOOP;
END $$;

-- 6) Storage policies
DROP POLICY IF EXISTS "fotos_public_read" ON storage.objects;
CREATE POLICY "fotos_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'fotos');

DROP POLICY IF EXISTS "fotos_auth_insert" ON storage.objects;
CREATE POLICY "fotos_auth_insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'fotos'
  AND (storage.foldername(name))[1] IN (
    SELECT salao_id::text FROM public.profiles WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "fotos_auth_update" ON storage.objects;
CREATE POLICY "fotos_auth_update" ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'fotos'
  AND (storage.foldername(name))[1] IN (
    SELECT salao_id::text FROM public.profiles WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "fotos_auth_delete" ON storage.objects;
CREATE POLICY "fotos_auth_delete" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'fotos'
  AND (storage.foldername(name))[1] IN (
    SELECT salao_id::text FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- 7) Diagnóstico rápido (resultado para análise)
SELECT 'clientes.foto_url' AS check, EXISTS (
  SELECT 1 FROM information_schema.columns WHERE table_name='clientes' AND column_name='foto_url'
) AS ok
UNION ALL
SELECT 'profissionais.ativo', EXISTS (
  SELECT 1 FROM information_schema.columns WHERE table_name='profissionais' AND column_name='ativo'
)
UNION ALL
SELECT 'bucket fotos', EXISTS (SELECT 1 FROM storage.buckets WHERE id='fotos');
