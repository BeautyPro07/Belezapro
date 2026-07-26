# CHANGELOG — Sprint F / P2

## Implementado

### Listeners
- `initChartControls` liga-se **uma única vez** (evita handlers duplicados a cada `updateUI`)

### Troca de salão
- Limpeza alargada de preferências: filtros clientes, chart, hist caixa, carrinho, last venda
- Reset de `histPeriodo`, `filtroClientes`, `chartPeriodo` no state

### Hierarquia de CTAs
- **Dashboard / Caixa:** barra de venda visível; FAB de agendar oculto
- **Agenda:** FAB de agendar visível; barra de venda oculta
- Elimina dois CTAs primários na mesma vista

### Já em P0/P1
- Store + subscribe, debounce UI, listas progressivas, stats O(n), XSS, logErroSilencioso

## Fora de âmbito desta etapa (Supabase no fim / P3)
- RLS
- Sequência de recibos no servidor
- ES modules + Vite
- Encriptação localStorage
- Playwright E2E
- CRDT / merge campo-a-campo avançado

## CACHE
beautypro-shell-v19
