-- BeautyPro — Fotos (perfil + galeria) — executar no SQL Editor do Supabase
-- 1) Colunas de URL (não guardar base64 na tabela)
ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS foto_url text;

ALTER TABLE public.profissionais
  ADD COLUMN IF NOT EXISTS foto_url text;

-- 2) Bucket público de leitura (upload autenticado)
-- No Dashboard: Storage → New bucket → nome: fotos → Public bucket: ON
-- Ou via SQL (API storage):

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

-- 3) Políticas RLS no Storage
-- Leitura pública dos objectos do bucket
DROP POLICY IF EXISTS "fotos_public_read" ON storage.objects;
CREATE POLICY "fotos_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'fotos');

-- Upload/update/delete só autenticado (path começa pelo salao_id do profile)
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

-- Nota: se a tabela profiles usar outro nome de coluna (ex. salaoId),
-- ajuste as policies em conformidade.
