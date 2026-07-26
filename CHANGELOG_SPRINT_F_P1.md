# CHANGELOG — Sprint F / P1 (Store + Performance)

## Implementado

### Store reactivo
- `initStoreBindings()` — `BeautyStore.subscribe` → `updateUI` (debounced 16ms)
- Mutações CRUD já usavam `pushToList` / `updateInList` / `removeFromList`; agora a UI reage automaticamente ao notify
- `updateUI` com debounce evita múltiplos paints no mesmo tick

### Performance listas
- `getEstatisticasCliente` — mapa O(n) com cache por tamanho das listas (elimina O(n²) por cliente)
- Lista de **clientes**: render progressivo (60 + “Mostrar mais”)
- Lista de **movimentos**: render progressivo (80 + “Mostrar mais”)

### Já coberto em P0 (mantido)
- logErroSilencioso, escHtml, toast venda, recibos por salão, GUIA_RLS

## Pendente (P2 / Supabase no fim)
- Sequência de recibos no servidor
- ES modules + bundler
- Virtualização por IntersectionObserver (melhoria sobre “Mostrar mais”)
- RLS (manual)

## CACHE
beautypro-shell-v18
