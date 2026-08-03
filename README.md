# Blindagem de cliques + sem app.js legado

## Alterações
1. eventos-globais: capture→bubble; finalizar por delegação; guard anti-duplo; ripple removido
2. desktop-enterprise: multi-select em bubble (só Ctrl/Shift)
3. desktop-shell: detalhe agenda via data-agenda-id (já antes)
4. index.html: só app.bundle.js
5. app.js → stub; código antigo em app.js.legacy (não carregar)

## Deploy
Substituir ficheiros na raiz. Hard refresh + limpar SW se necessário.
NÃO incluir app.js.legacy no HTML.
