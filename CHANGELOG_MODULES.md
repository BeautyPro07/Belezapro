# CHANGELOG — Modules / Entry único

## O que foi feito
- `app.bundle.js`: concatenação de todos os módulos na **ordem de dependências**
- `build-bundle.js`: regenera o bundle com `node build-bundle.js`
- `index.html` carrega **apenas** `app.bundle.js` (entry único)
- Ficheiros fonte individuais **mantidos** no repo (debug / edição)
- `MODULOS_ESM_VITE.md`: plano para ESM real + Vite

## O que não foi feito (de propósito)
- `type="module"` em cada ficheiro: isolava `state`/`activeTab` e partia a app
- Vite: requer `npm install` (sem rede neste ambiente)

## CACHE
beautypro-shell-v22
