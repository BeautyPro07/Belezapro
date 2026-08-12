# GUIA RLS SUPABASE — BLOQUEADOR P0 Multi-Salão

Sem estas políticas, qualquer utilizador autenticado pode aceder a dados de outros salões.

## Pré-requisitos
1. Todas as tabelas têm coluna `salao_id` (uuid).
2. Tabela `saloes` ou equivalente com `id` e `owner_id` / membros.
3. Utilizador autenticado via Supabase Auth.

## SQL — Activar RLS e políticas (executar no SQL Editor)

```sql
-- Activar RLS
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE fechos_caixa ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_salao ENABLE ROW LEVEL SECURITY;

-- Função auxiliar: salões a que o user tem acesso
-- Ajuste conforme o seu modelo (owners / membros)
CREATE OR REPLACE FUNCTION public.user_salao_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM saloes WHERE owner_id = auth.uid()
  UNION
  SELECT salao_id FROM salao_membros WHERE user_id = auth.uid();
$$;

-- Políticas padrão (SELECT / INSERT / UPDATE / DELETE)
-- Repetir o padrão para cada tabela listada acima.

-- CLIENTES
DROP POLICY IF EXISTS clientes_select ON clientes;
CREATE POLICY clientes_select ON clientes FOR SELECT
  USING (salao_id IN (SELECT public.user_salao_ids()));

DROP POLICY IF EXISTS clientes_insert ON clientes;
CREATE POLICY clientes_insert ON clientes FOR INSERT
  WITH CHECK (salao_id IN (SELECT public.user_salao_ids()));

DROP POLICY IF EXISTS clientes_update ON clientes;
CREATE POLICY clientes_update ON clientes FOR UPDATE
  USING (salao_id IN (SELECT public.user_salao_ids()))
  WITH CHECK (salao_id IN (SELECT public.user_salao_ids()));

DROP POLICY IF EXISTS clientes_delete ON clientes;
CREATE POLICY clientes_delete ON clientes FOR DELETE
  USING (salao_id IN (SELECT public.user_salao_ids()));

-- PROFISSIONAIS (mesmo padrão)
DROP POLICY IF EXISTS profissionais_select ON profissionais;
CREATE POLICY profissionais_select ON profissionais FOR SELECT
  USING (salao_id IN (SELECT public.user_salao_ids()));
DROP POLICY IF EXISTS profissionais_insert ON profissionais;
CREATE POLICY profissionais_insert ON profissionais FOR INSERT
  WITH CHECK (salao_id IN (SELECT public.user_salao_ids()));
DROP POLICY IF EXISTS profissionais_update ON profissionais;
CREATE POLICY profissionais_update ON profissionais FOR UPDATE
  USING (salao_id IN (SELECT public.user_salao_ids()))
  WITH CHECK (salao_id IN (SELECT public.user_salao_ids()));
DROP POLICY IF EXISTS profissionais_delete ON profissionais;
CREATE POLICY profissionais_delete ON profissionais FOR DELETE
  USING (salao_id IN (SELECT public.user_salao_ids()));

-- SERVICOS
DROP POLICY IF EXISTS servicos_select ON servicos;
CREATE POLICY servicos_select ON servicos FOR SELECT
  USING (salao_id IN (SELECT public.user_salao_ids()));
DROP POLICY IF EXISTS servicos_insert ON servicos;
CREATE POLICY servicos_insert ON servicos FOR INSERT
  WITH CHECK (salao_id IN (SELECT public.user_salao_ids()));
DROP POLICY IF EXISTS servicos_update ON servicos;
CREATE POLICY servicos_update ON servicos FOR UPDATE
  USING (salao_id IN (SELECT public.user_salao_ids()))
  WITH CHECK (salao_id IN (SELECT public.user_salao_ids()));
DROP POLICY IF EXISTS servicos_delete ON servicos;
CREATE POLICY servicos_delete ON servicos FOR DELETE
  USING (salao_id IN (SELECT public.user_salao_ids()));

-- AGENDAMENTOS
DROP POLICY IF EXISTS agendamentos_select ON agendamentos;
CREATE POLICY agendamentos_select ON agendamentos FOR SELECT
  USING (salao_id IN (SELECT public.user_salao_ids()));
DROP POLICY IF EXISTS agendamentos_insert ON agendamentos;
CREATE POLICY agendamentos_insert ON agendamentos FOR INSERT
  WITH CHECK (salao_id IN (SELECT public.user_salao_ids()));
DROP POLICY IF EXISTS agendamentos_update ON agendamentos;
CREATE POLICY agendamentos_update ON agendamentos FOR UPDATE
  USING (salao_id IN (SELECT public.user_salao_ids()))
  WITH CHECK (salao_id IN (SELECT public.user_salao_ids()));
DROP POLICY IF EXISTS agendamentos_delete ON agendamentos;
CREATE POLICY agendamentos_delete ON agendamentos FOR DELETE
  USING (salao_id IN (SELECT public.user_salao_ids()));

-- MOVIMENTOS
DROP POLICY IF EXISTS movimentos_select ON movimentos;
CREATE POLICY movimentos_select ON movimentos FOR SELECT
  USING (salao_id IN (SELECT public.user_salao_ids()));
DROP POLICY IF EXISTS movimentos_insert ON movimentos;
CREATE POLICY movimentos_insert ON movimentos FOR INSERT
  WITH CHECK (salao_id IN (SELECT public.user_salao_ids()));
DROP POLICY IF EXISTS movimentos_update ON movimentos;
CREATE POLICY movimentos_update ON movimentos FOR UPDATE
  USING (salao_id IN (SELECT public.user_salao_ids()))
  WITH CHECK (salao_id IN (SELECT public.user_salao_ids()));
DROP POLICY IF EXISTS movimentos_delete ON movimentos;
CREATE POLICY movimentos_delete ON movimentos FOR DELETE
  USING (salao_id IN (SELECT public.user_salao_ids()));

-- VENDAS (se tabela separada)
DROP POLICY IF EXISTS vendas_select ON vendas;
CREATE POLICY vendas_select ON vendas FOR SELECT
  USING (salao_id IN (SELECT public.user_salao_ids()));
DROP POLICY IF EXISTS vendas_insert ON vendas;
CREATE POLICY vendas_insert ON vendas FOR INSERT
  WITH CHECK (salao_id IN (SELECT public.user_salao_ids()));
DROP POLICY IF EXISTS vendas_update ON vendas;
CREATE POLICY vendas_update ON vendas FOR UPDATE
  USING (salao_id IN (SELECT public.user_salao_ids()))
  WITH CHECK (salao_id IN (SELECT public.user_salao_ids()));
DROP POLICY IF EXISTS vendas_delete ON vendas;
CREATE POLICY vendas_delete ON vendas FOR DELETE
  USING (salao_id IN (SELECT public.user_salao_ids()));

-- FECHOS_CAIXA
DROP POLICY IF EXISTS fechos_select ON fechos_caixa;
CREATE POLICY fechos_select ON fechos_caixa FOR SELECT
  USING (salao_id IN (SELECT public.user_salao_ids()));
DROP POLICY IF EXISTS fechos_insert ON fechos_caixa;
CREATE POLICY fechos_insert ON fechos_caixa FOR INSERT
  WITH CHECK (salao_id IN (SELECT public.user_salao_ids()));
DROP POLICY IF EXISTS fechos_update ON fechos_caixa;
CREATE POLICY fechos_update ON fechos_caixa FOR UPDATE
  USING (salao_id IN (SELECT public.user_salao_ids()))
  WITH CHECK (salao_id IN (SELECT public.user_salao_ids()));
DROP POLICY IF EXISTS fechos_delete ON fechos_caixa;
CREATE POLICY fechos_delete ON fechos_caixa FOR DELETE
  USING (salao_id IN (SELECT public.user_salao_ids()));
```

## Verificação
1. Login como user A do salão 1 → só vê dados do salão 1.
2. DevTools: `fetch` REST sem filtro `salao_id` deve devolver vazio / 0 rows.
3. User B de outro salão não consegue ler/escrever o salão 1.

## Nota sobre modelo de membros
Se não tiver `salao_membros`, use apenas:
`SELECT id FROM saloes WHERE owner_id = auth.uid()`

---

## Verificação obrigatória — IA e planos (isolamento multi-tenant)

Após aplicar `SUPABASE_ETAPA4_6_COMPLETO.sql`, confirme no **SQL Editor**:

```sql
-- RLS activo?
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname IN ('ia_uso_diario', 'salao_config');

-- Policies
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE tablename IN ('ia_uso_diario', 'salao_config');
```

**Critério de aceitação:**

1. `relrowsecurity = true` em ambas as tabelas.
2. Policies `ia_uso_*` e `salao_config_*` presentes, filtrando por  
   `salao_id IN (SELECT salao_id FROM profiles WHERE user_id = auth.uid())`.
3. Com JWT de utilizador do salão A, um `SELECT` com `salao_id` do salão B deve devolver **0 linhas**.

Se RLS estiver desactivado, o frontend **não** garante isolamento de contadores/planos no servidor.

### Edge Function `ia-query`

Ver `EDGE_IA_SEGURANCA.md`. A Edge **deve** rejeitar pedidos sem JWT de utilizador e **nunca** confiar em `plano` / `salaoId` do body.
