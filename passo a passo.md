# BeautyPro — Passo a passo (última entrega)

## 1. O que foi corrigido nesta entrega

### A. Validação e notificações (causa estrutural)
- **Causa:** o toast tinha `z-index: 1900` e os modais `2000+`. A mensagem **era emitida**, mas ficava **atrás** do modal. Só se via ao fechar.
- **Correcção:** toast em `z-index: 2500` (visível com modal aberto).
- **Helper:** `bpNotifyFormError(mensagem, idCampo)` → toast + foco + `aria-invalid` no campo.
- Formulários alinhados: Cliente, Cliente rápido, Equipa, Serviços, Agenda.

### B. R50 — Cancelar venda
- Botão **Cancelar venda** no detalhe (admin/gerente).
- Confirmação + motivo obrigatório.
- Soft-cancel: `status=cancelado`, comissão estornada; registo mantém-se.
- Caixa e dashboard **não contam** vendas canceladas no saldo/KPIs.
- Sync envia `status`, `comissao_estornada`, `cancelado_em`, `cancelado_motivo`.

### C. Supabase
- Ficheiro `SUPABASE_R50_CANCEL_CLIENTES.sql` (colunas + `clientes.ativo`).

---

## 2. Instalação no dispositivo (app)

1. Extrair o ZIP sobre a pasta do BeautyPro (substituir ficheiros).
2. Hard refresh / limpar cache do Service Worker, ou reabrir a PWA.
3. Confirmar no console (opcional): SW `belezapro-shell-v20260810-final`.
4. Testar:
   - Abrir **Serviços** → Guardar sem profissional → deve ver a mensagem **sem fechar** o modal.
   - **Equipa** → Guardar sem idade → mensagem imediata + foco no campo.
   - **Clientes** → telefone vazio ou inválido → mensagem imediata.
   - **Venda** → detalhe → Cancelar venda (se admin/gerente) → motivo → some dos totais do caixa.

---

## 3. Supabase (obrigatório para sync de cancelamento)

1. Abrir o projecto no [Supabase](https://supabase.com) → **SQL Editor**.
2. Colar e executar **todo** o ficheiro `SUPABASE_R50_CANCEL_CLIENTES.sql`.
3. Verificar o SELECT final: colunas `status`, `comissao_estornada`, `cancelado_em`, `cancelado_motivo`, `ativo`.
4. (Já existente no projecto) Confirmar que `SUPABASE_HARDENING.sql` / RLS por `salao_id` está aplicado.
5. Fazer uma venda de teste → cancelar online → confirmar na tabela `movimentos` que `status = cancelado`.

**Nota:** se o upsert falhar com “column not found”, o SQL ainda não foi aplicado. Não é falha do frontend.

---

## 4. CHECK opcional (profissional obrigatório no servidor)

Só depois de migrar vendas legadas sem `profissional_id`. Está comentado no SQL.

---

## 5. O que NÃO foi alterado de propósito

- R07 Produtos e R16 Desconto (fora de âmbito).
- Arquitectura offline-first, BeautyStore, sync-queue, soft-delete de profissionais/serviços.

---

## 6. Checklist rápido QA

| Teste | Esperado |
|-------|----------|
| Modal serviço, Guardar sem pro | Toast visível **sobre** o modal |
| Modal equipa, sem idade | Toast + foco em idade |
| Modal cliente, tel inválido | Toast + foco em telefone |
| Cobrar com dados OK | Confirmação R24 → grava |
| Cancelar venda | Motivo → status cancelado → saldo sem essa venda |
| Offline + cancelar | Grava local; sincroniza quando houver rede **e** SQL aplicado |

---

## 7. Ficheiros desta entrega

- `core-utils.js`, `eventos-cadastros.js`, `modais-toast-fab.css`, `design-system-final.css`
- `index.html`, `vendas-modais.js`, `eventos-caixa-vendas.js`, `crud-operations.js`
- `sync-rest.js`, `ui-render-clientes-caixa-equipa.js`, `ui-render-dashboard-agenda.js`
- `app.bundle.js`, `sw.js`, `README.md`
- `SUPABASE_R50_CANCEL_CLIENTES.sql`, `passo a passo.md`
