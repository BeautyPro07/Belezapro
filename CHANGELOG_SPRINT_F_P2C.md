# CHANGELOG — Etapa seguinte (sem testes / sem Supabase)

## Feito
- **Sem double-render**: mutações com BeautyStore já não chamam `updateUI()` em duplicado (subscribe debounced trata do paint)
- **Movimentos**: DocumentFragment + IntersectionObserver no sentinel (como clientes)
- Mantido: sync throttle, pure tests (para usares no fim), ofuscação fila, chart single-bind, CTA hierarchy

## Ainda fora (fim / sprint dedicado)
- Vite + ES modules
- Playwright E2E
- RLS / recibos servidor (Supabase)
- Criptografia forte localStorage

## CACHE
beautypro-shell-v21
