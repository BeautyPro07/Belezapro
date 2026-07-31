# BeautyPro — Fundação (Fase 1)

Documento de decisões. Não é marketing; é contrato de engenharia.

## Runtime

- **Um bundle:** `app.bundle.js` gerado por `node build-bundle.js` (35 módulos).
- **HTML carrega:** Sentry + Supabase CDN + `app.bundle.js`.
- **Fora do bundle:** `sw.js` (Service Worker), `app-entry.js` (ESM futuro), tooling.

## Design tokens

- Fonte única: `base-variaveis.css`.
- CSS de produto: só `var(--token)`. Hex permitido em tokens e em `@media print`.
- Superfícies desktop: `--surface-canvas`, `--surface-canvas-deep`.

## Componentes

- Botões: **apenas** `design-system-final.css`.
- Escala: default 48px, `btn-sm` 40px. Sem `btn-xs/lg/xl`.
- `!important`: proibido em features salvo print e overrides legítimos de layout desktop↔mobile.

## Estado

| Camada | O quê | Onde |
|--------|--------|------|
| Domínio | clientes, agenda, movimentos, config… | `state` + `BeautyStore` (`setState` / `subscribe`) |
| Sessão UI efémera (fotos em modal) | editing id, pending dataURL | `BPMedia.session` |
| Runtime pontual | lastMenuTrigger, lastSupabasePull | `window.BPRuntime` |
| Namespaces de feature | APIs públicas | `window.BP*` (`BPFinance`, `BPGestao`, `BPOps`, …) |

**Regra:** não criar `window._bp*` nem `window._*`.  
Estado de domínio novo → `BeautyStore.setState`.  
Estado de modal temporário → objecto de sessão do módulo (`BPMedia.session`), não a store (evita re-render global).

## Monetização / CSP

- Zero `onclick` inline nos CTAs de plano.
- `data-upgrade-plano` + `bindUpgradeButtons` + `abrirWhatsAppVenda` (fallback clipboard).

## Build

```bash
node build-bundle.js   # após editar qualquer módulo do ORDER
```

Ordem de dependências documentada em `build-bundle.js`.
