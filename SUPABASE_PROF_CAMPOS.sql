-- Campos completos do profissional para sync multi-dispositivo
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS idade integer;
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS data_contratual text;
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS numero_bi text;
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS morada text;
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS contacto text;
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS taxa_comissao numeric DEFAULT 0;
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS meta_mensal numeric DEFAULT 0;
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS especialidade text;
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS ativo boolean DEFAULT true;
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS data_desativacao timestamptz;
ALTER TABLE public.profissionais ADD COLUMN IF NOT EXISTS foto_url text;

SELECT column_name FROM information_schema.columns
WHERE table_name = 'profissionais' AND table_schema = 'public'
ORDER BY column_name;
