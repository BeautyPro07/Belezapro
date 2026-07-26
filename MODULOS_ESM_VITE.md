# Rumo a ES Modules + Vite

## Estado actual
- Código organizado em ficheiros por responsabilidade (já modularizado).
- `app.bundle.js` + `build-bundle.js`: **entry único** com ordem de dependências explícita (sem quebrar scope global).
- `index.html` carrega o bundle (ou os scripts individuais em desenvolvimento).

## Por que não ESM nativo de um dia para o outro
Funções e `state` / `activeTab` são partilhados por dezenas de ficheiros via scope global.
`type="module"` isola o scope: `state` num ficheiro não é o mesmo noutro sem `import`/`export` live bindings.
Migrar exige:
1. `export let state` / setters para `activeTab`
2. `import { state, ... } from '...'` em cada consumidor
3. Testes de regressão offline + SW

## Plano Vite (quando tiver rede/Node)
```bash
npm create vite@latest belezapro-app -- --template vanilla
# mover src/, mapear entry para main.js
# npm i && npm run build
# publicar dist/ + actualizar SW para precache dist assets
```

## Desenvolvimento
- **Produção / PWA:** um script `app.bundle.js`
- **Debug:** podes voltar aos `<script src="...">` individuais no HTML
