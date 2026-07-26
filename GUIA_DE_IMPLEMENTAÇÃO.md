# GUIA DE IMPLEMENTAÇÃO — O que depende de ti

Este documento lista **tudo o que não foi possível alterar automaticamente** porque requer acesso ao teu projeto Supabase, variáveis de ambiente, ou decisões de infraestrutura.

Segue os passos **pela ordem indicada**.

---

## 1. Row Level Security (RLS) no Supabase — PRIORIDADE MÁXIMA

### Porque é crítico
Actualmente as permissões (`admin`, `gerente`, `operador`) são aplicadas apenas no frontend. Qualquer utilizador autenticado pode, via DevTools, chamar funções de escrita ou alterar o próprio role.

### Passo a passo

1. Abre o **Supabase Dashboard** → o teu projecto BeautyPro.
2. Vai a **Authentication → Policies** (ou **Table Editor** → cada tabela → **RLS**).
3. Activa RLS em **todas** as tabelas:
   - `clientes`
   - `agendamentos`
   - `movimentos`
   - `profissionais`
   - `servicos`
   - `fechos_caixa`
   - `profiles` (se existir)
   - qualquer outra tabela do salão

4. Cria políticas mínimas (exemplo para `clientes`):

```sql
-- Permitir SELECT apenas do próprio salão
CREATE POLICY "clientes_select_own_salao"
ON clientes FOR SELECT
USING (salao_id = (SELECT salao_id FROM profiles WHERE id = auth.uid()));

-- Permitir INSERT apenas do próprio salão
CREATE POLICY "clientes_insert_own_salao"
ON clientes FOR INSERT
WITH CHECK (salao_id = (SELECT salao_id FROM profiles WHERE id = auth.uid()));

-- Permitir UPDATE apenas do próprio salão
CREATE POLICY "clientes_update_own_salao"
ON clientes FOR UPDATE
USING (salao_id = (SELECT salao_id FROM profiles WHERE id = auth.uid()));

-- Permitir DELETE apenas do próprio salão
CREATE POLICY "clientes_delete_own_salao"
ON clientes FOR DELETE
USING (salao_id = (SELECT salao_id FROM profiles WHERE id = auth.uid()));
```

Repete o padrão para as restantes tabelas (substituindo o nome da tabela).

5. Para roles mais granulares (ex: operador não pode apagar profissionais), adiciona condições com base no campo `role` da tabela `profiles`.

6. Testa com dois utilizadores de salões diferentes e confirma que um não vê os dados do outro.

### Verificação final
- Um utilizador do Salão A não consegue fazer SELECT/INSERT em dados do Salão B.
- O role `operador` não consegue executar acções restritas (se tiveres políticas por role).

---

## 2. Edge Function da IA (`ia-query`)

### Recomendação de segurança
- Garante que a Edge Function valida o JWT e o `salaoId` do utilizador autenticado.
- Nunca confies apenas no `salaoId` enviado no body.
- Aplica rate-limit por utilizador/salão no backend (além do contador localStorage).

### Onde alterar
Supabase Dashboard → Edge Functions → `ia-query` → código da função.

---

## 3. Variáveis de ambiente / Secrets

No código actual as chaves estão hardcoded em `core-constants.js` (normal para SPA com anon key).  
Se no futuro quiseres proteger mais:

- Usa variáveis de ambiente no teu hosting (Vercel / Netlify / Cloudflare Pages).
- Nunca commits a service_role key.

---

## 4. Deploy e Service Worker

Após substituires os ficheiros:

1. Faz upload de **todos** os ficheiros actualizados (incluindo `core-store.js`).
2. Força o browser a actualizar o Service Worker:
   - DevTools → Application → Service Workers → Unregister
   - Ou incrementa a versão (já está em v9).
3. Testa em modo offline.

---

## 5. SQL útil extra (opcional mas recomendado)

```sql
-- Índice para performance de queries por salão + data
CREATE INDEX IF NOT EXISTS idx_movimentos_salao_data ON movimentos (salao_id, data);
CREATE INDEX IF NOT EXISTS idx_agendamentos_salao_data ON agendamentos (salao_id, data);
CREATE INDEX IF NOT EXISTS idx_clientes_salao ON clientes (salao_id);
```

---

## 6. Checklist final (depois de aplicares os passos acima)

- [ ] RLS activo em todas as tabelas
- [ ] Políticas de SELECT/INSERT/UPDATE/DELETE testadas
- [ ] Edge Function valida JWT + salao_id
- [ ] Ficheiros novos (`core-store.js`) no servidor
- [ ] Service Worker actualizado (v9)
- [ ] Teste de login + CRUD + delete + troca de salão
- [ ] Teste offline → online (fila de sync)

---

## Contacto / Dúvidas

Se algo falhar após seguir este guia, verifica primeiro a consola do browser e os logs do Supabase (Logs → API / Edge Functions).
