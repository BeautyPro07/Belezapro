# EDGE_IA_SEGURANCA.md — Requisitos para `ia-query`

**Contexto:** O cliente BeautyPro (a partir de `fix(isolamento)`) **não** envia `salaoId` nem `plano` no body. Envia apenas `pergunta`, `contexto`, `historico`, `instrucoes`. Autenticação: **JWT de utilizador** (`Authorization: Bearer <access_token>`). **Não** há fallback ANON no cliente.

## Requisitos obrigatórios na Edge Function

1. **Rejeitar** pedidos sem JWT válido de utilizador autenticado (HTTP 401).
2. **Não** aceitar a chave anon como identidade do utilizador para esta rota.
3. Derivar `salao_id` **unicamente** via:
   ```
   auth.uid() → public.profiles.user_id → profiles.salao_id
   ```
4. Derivar o **plano** via:
   ```
   salao_id → public.salao_config.plano
   ```
   (não confiar em campos do body, mesmo que existam por versões antigas do cliente).
5. Aplicar limites de cota IA (`PLANOS`) no servidor com base nesse plano.
6. Opcionalmente **auditar** (log) se o body contiver `salaoId`/`plano` divergentes do JWT — não os usar para autorização.
7. Responder **429** quando o limite diário do salão for atingido (o cliente trata 429 com upgrade modal).

## Checklist de deploy

- [ ] Código da Edge actualizado e redeploy em Supabase Functions
- [ ] Teste: pedido sem Authorization → 401
- [ ] Teste: JWT salão trial → bloqueio conforme plano
- [ ] Teste: JWT salão premium → cota ilimitada (se aplicável)
- [ ] RLS activo em `ia_uso_diario` e `salao_config` (ver GUIA_RLS_SUPABASE.md)

## Body actual do cliente (contrato)

```json
{
  "pergunta": "string",
  "contexto": "string",
  "historico": [],
  "instrucoes": "string"
}
```
