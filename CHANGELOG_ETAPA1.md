# CHANGELOG — Etapa 1: Carregamento e Splash

**Data:** 2026-08-12  
**Repo:** PedroBenza/Belezapro

## Alterações

1. **Splash controlado** (`bp_splash_seen`)
   - `#splash-screen` só na primeira execução.
   - Recarregamento com sessão activa: splash não aparece.
   - `bpControlSplashOnBoot()` + `hideSplash()` grava a flag.

2. **Checkmark pós-boot**
   - Overlay `#bp-checkmark-overlay` (SVG, sem emoji).
   - `showCheckmark()` / `hideCheckmark()` em `core-utils.js`.
   - Após boot online bem-sucedido: "Sincronizado" ~1s.
   - Offline: ícone nuvem + "Offline".

3. **Badge de plano sem flash**
   - `#plano-badge` inicia oculto (`data-bp-plano-ready="0"`).
   - `renderPlanoInfo()` marca `data-bp-plano-ready="1"` quando o plano está definido.

4. **Boot overlay**
   - Spinner existente mantido.
   - Timeout 15s e acções "Tentar novamente" / "Continuar offline" preservados.
   - Offline no arranque: texto "Modo offline — dados disponíveis".

## Ficheiros

- `index.html` — checkmark overlay; badge oculto
- `main.js` — splash + closeBoot + checkmark
- `core-utils.js` — showCheckmark / hideCheckmark
- `ia-module.js` — hideSplash + bpControlSplashOnBoot
- `ui-render-dashboard-agenda.js` — plano-badge ready
- `design-system-final.css` — estilos checkmark / badge
- `app.bundle.js` / `sw.js` — regenerados
