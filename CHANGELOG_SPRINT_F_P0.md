# CHANGELOG — Sprint F / P0 (Constituição Técnica 26 Jul 2026)

## Implementado no código

### P0 — Segurança e estabilidade
1. **logErroSilencioso** definida em `core-utils.js` — sync-queue deixa de quebrar com ReferenceError.
2. **Sanitização XSS** reforçada: `escHtml` aplicado em interpolações de nomes/clientes/serviços/descrições em:
   - ui-render-clientes-caixa-equipa.js
   - ui-render-dashboard-agenda.js
   - eventos-cadastros.js
   - eventos-caixa-vendas.js
   - vendas-modais.js
3. **Modal de sucesso de venda removido** — substituído por toast + updateUI (`mostrarConfirmacaoVenda`).
4. **Contador de recibos** por salão no dispositivo (`bp_recibo_counter_<salaoId>`) + prefixo curto — reduz colisões entre salões no mesmo browser. Unicidade multi-dispositivo documentada no guia (sequência Supabase).

### Design / tokens
5. Paleta alinhada à identidade SW v12 (gold #D4AF37).
6. **--text-muted** mantido em `#6B6560` (excepção documentada: WCAG AA ≥4.5:1; #8C857A falhava contraste).
7. Botões xs/lg/xl colapsados para altura padrão no design-system-final.

### Manual (depende do dashboard Supabase)
8. **RLS** — SQL completo em `GUIA_RLS_SUPABASE.md`. BLOQUEADOR para multi-salão. Não aplicável a partir do cliente.

## Pendente P1 (próxima passagem)
- Migrar mutações CRUD para core-store (pushToList / setState)
- subscribe nos renders principais
- Virtualização de listas
- Sequência de recibos no Supabase
- ES modules

## CACHE
- Service Worker: beautypro-shell-v17
