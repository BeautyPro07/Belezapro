# CHANGELOG — Sprint F / Continuação (prioridades cliente)

## Feito

### Performance / Sync
- Pull Supabase com **throttle 40s** quando não há fila pendente (intervalo base 15s mantido para processar fila)
- Listas: DocumentFragment + IntersectionObserver no sentinel de clientes
- Stats clientes já em O(n) (P1)

### Qualidade
- `logContexto` / `reportarErro` — observabilidade estruturada
- `runPureTests()` — testes das funções puras (escHtml, fmtKz, uuid, hoje, recibo)
- `runTests` da IA **não** corre automaticamente
- Chamadas a `addRipple` removidas dos handlers globais
- `initChartControls` single-bind (P2)

### Defesa local
- `storageSetSecure` / `storageGetSecure` (ofuscação base64) na fila de sync
  - Nota: não é criptografia forte; RLS continua obrigatório no servidor

### A11y
- Focus trap já existente mantido; helpers de lista com aria-hidden no sentinel

## Não feito nesta passagem (risco de regressão / scope)
- **Migração completa ES modules + Vite**: exige reestruturação de todos os scripts, rebuild do SW e validação offline longa. Recomendado sprint dedicado.
- **Playwright E2E**: requer ambiente Node/CI do utilizador.
- Criptografia forte do localStorage (Web Crypto + chave de sessão): impacto em migração de dados existentes.

## CACHE
beautypro-shell-v20
