Offline boot: entrada instantanea com cache local; login so apos Sair


---

## Etapa 4 — Intervenção cirúrgica (mapa de vestígios)

Referencial: ZIP oficial BeautyPro. Princípio: preservar → corrigir → reforçar → documentar.
Build: `node build-bundle.js` (ORDER inalterada). SW: `belezapro-shell-v20260809-et4`.

### Plano (resumo de estados)

| ID | Prioridade | Estado |
|----|------------|--------|
| ET4-P0-01 Isolamento RLS cloud | P0 | BLOQUEADO — DEPENDÊNCIA EXTERNA (Supabase) |
| ET4-P0-02 IA Authorization JWT | P0 | IMPLEMENTADO (cliente) + PENDENTE VERIFICAÇÃO EXTERNA (Edge) |
| ET4-P0-03 RBAC operacional | P0 | IMPLEMENTADO (cliente; não substitui RLS) |
| ET4-P0-04 salaoId em dbPut | P0 | IMPLEMENTADO (reforço) |
| ET4-P0-05 Anon key no cliente | P0 | DOCUMENTADO (esperado; proteção = RLS) |
| ET4-P1-01 updateUI / abas | P1 | VALIDADO — já re-render na troca de aba (`detalhes-acessibilidade.js`) |
| ET4-P1-02 init BP* idempotente | P1 | IMPLEMENTADO |
| ET4-P1-03 soft vs hard delete | P1 | AUDITADO — caminhos existentes preservados |
| ET4-P1-04 DUPLICADO_BLOQUEADO | P1 | IMPLEMENTADO |
| ET4-P1-05 limites profissionais ativos | P1 | IMPLEMENTADO (cliente) + enforcement server EXTERNO |
| ET4-P1-07 serviço sem profissionais | P1 | DOCUMENTADO — contrato atual: lista vazia = toda a equipa |
| ET4-P2-01 Service Worker cache | P2 | IMPLEMENTADO (bump versão) |
| EXT-01…05 SQL/RLS/Edge/schema | — | DEPENDÊNCIA EXTERNA — não executado nesta etapa |

---

### Vestígios por intervenção

#### ET4-P0-02 — IA com JWT de sessão

- **Pedido:** reforçar autorização da chamada à Edge Function IA.
- **Problema:** `perguntarIA` enviava sempre `Authorization: Bearer SUPABASE_ANON_KEY`.
- **Implementado:** preferir `getAuthHeaders()` (JWT de utilizador + apikey); se `SESSION_EXPIRED`, fallback local sem consumir cota remota; ANON apenas se não houver JWT, com log de aviso.
- **Arquivo:** `ia-module.js`
- **Localização:** `async function perguntarIA` → bloco `fetch(IA_EDGE_URL)` (headers dinâmicos `iaHeaders` / `iaAuthMode`).
- **Antes:** sempre ANON.
- **Depois:** user-jwt quando sessão válida; fallback documentado.
- **Motivo:** least privilege / OWASP API auth.
- **Dependências:** `getAuthHeaders` em `auth-supabase.js`; Edge `ia-query` deve aceitar JWT (**verificação externa**).
- **Risco:** se Edge só aceitar ANON, path online pode falhar → fallback local existente.
- **Teste:** revisão estática + `node -c`; browser/Edge **PENDENTE DE VALIDAÇÃO**.
- **Estado:** IMPLEMENTADO (cliente)

#### ET4-P0-03 — RBAC operacional (não só DOM)

- **Pedido:** impedir operações sensíveis além de esconder botões.
- **Problema:** `aplicarPermissoes` só manipula `data-role` no DOM.
- **Implementado:** `bpPode` / `bpExigirRole` + guards em CRUD e fecho de caixa.
- **Arquivos / localização:**
  - `ui-events-navegacao.js` → `bpPode`, `bpExigirRole` (após `normalizarRole`; expostos em `window`)
  - `crud-operations.js` → `addProfissional`, `desassociarProfissional`, `deleteProfissional`, `addServico`, `deleteServico`
  - `eventos-caixa-vendas.js` → `confirmarFechoCaixa`
  - `detalhes-acessibilidade.js` → `abrirFechoCaixa`
- **Antes:** operador podia invocar funções se contornasse a UI.
- **Depois:** role insuficiente → toast + return (fail-safe via `normalizarRole` → operador).
- **Motivo:** defense in depth no cliente (RLS continua obrigatório no server).
- **Estado:** IMPLEMENTADO

#### ET4-P0-04 — Reforço salaoId no override dbPut

- **Arquivo:** `sync-queue.js` → override `dbPut`
- **Antes:** `if (!tabela || !state.config.salaoId) return item`
- **Depois:** verificação explícita de `state.config`; warn estruturado se tabela de domínio sem `salaoId` (sync remoto omitido; local preservado).
- **Estado:** IMPLEMENTADO

#### ET4-P1-04 — DUPLICADO_BLOQUEADO na fila

- **Arquivo:** `sync-queue.js` → `flushSyncQueue` catch
- **Antes:** erro genérico podia reencolar / retentar.
- **Depois:** `DUPLICADO_BLOQUEADO` tratado como não-retriable (como limite de plano); local mantido; log.
- **Estado:** IMPLEMENTADO

#### ET4-P1-05 — Limite de profissionais só ativos

- **Arquivo:** `plano-limites.js` → `verificarLimite('profissionais')`
- **Antes:** `state.profissionais.length` (inclui destituídos).
- **Depois:** `getProfissionaisAtivos()` ou filtro `ativo`.
- **Nota:** enforcement server continua **DEPENDÊNCIA EXTERNA**.
- **Estado:** IMPLEMENTADO (cliente)

#### ET4-P1-02 — Init BP* idempotente

- **Arquivos:** `finance-fase1-extra.js`, `ops-crm-comercial.js`, `gestao-fase78.js`, `equipa-fase3.js`, `marketing-fase2.js`, `media-galeria.js`
- **Localização:** `function init()` — flag `window.__bp*InitDone`; reentradas re-executam ensure de menus/hooks sem rebind cego de listeners (`dataset.bpHooked` onde já existia).
- **Estado:** IMPLEMENTADO

#### ET4-P1-01 — UI abas

- **Evidência:** `detalhes-acessibilidade.js` navegação entre abas já chama `renderAgendaFull` / `renderClientes` / `renderCaixa` / `renderDashboard` / equipa / IA.
- **Estado:** VALIDADO (sem alteração necessária)

#### ET4-P2-01 — Service Worker

- **Arquivo:** `sw.js` → `CACHE_NAME = 'belezapro-shell-v20260809-et4'`
- **Motivo:** invalidar shell antigo após novo `app.bundle.js`.
- **Estado:** IMPLEMENTADO

---

### Dependências externas (não aplicadas nesta etapa)

1. **EXT-01 RLS** — policies por `salao_id` em: clientes, agendamentos, movimentos, profissionais, servicos, fechos_caixa, profiles, saloes.
2. **EXT-02 Schema** — colunas `foto_url`, `ativo`, `data_desativacao`, campos de comissão (scripts SQL no ZIP são referência, não prova de aplicação).
3. **EXT-03 Edge `ia-query`** — validar JWT de utilizador, `salaoId`, plano e rate limit.
4. **EXT-04 Limites de plano no server** — triggers/constraints se desejado.
5. **EXT-05 Storage** — bucket/policies de fotos.

---

### Não feito deliberadamente

- Alteração de SQL/schema/RLS no cloud
- Migração Vite/ESM / mudança de ORDER
- Remoção de `style.css` / `app.js` legados
- Mudança da regra de negócio “serviço sem profissionais = toda a equipa”
- Unificação de `cartItems` com `state`

---

### Validação desta entrega

- `node -c` nos módulos alterados: OK
- `node build-bundle.js`: 38 módulos, bundle regenerado
- Marcadores ET4 presentes no bundle
- Testes browser / multi-dispositivo / Supabase real: **PENDENTE DE VALIDAÇÃO**

### Artefactos runtime a publicar em conjunto

Fontes alteradas + `app.bundle.js` + `sw.js` + este README.


---

## Etapa 4.2 — Continuação da intervenção cirúrgica

SW: `belezapro-shell-v20260809-et4p2`. ORDER inalterada. Bundle regenerado.

### Vestígios

#### ET4.2-P0-RBAC-DESPESA-FUNDO
- **Arquivo:** `eventos-caixa-vendas.js`
- **Localização:** handlers `add-despesa-btn`, `modal-despesa-save`, `ajustar-fundo-btn`, `modal-fundo-save`
- **Antes:** só `data-role` no HTML
- **Depois:** `bpExigirRole(['admin','gerente'])` antes de abrir/gravar
- **Estado:** IMPLEMENTADO

#### ET4.2-P0-RBAC-CRUD-EQUIPA
- **Arquivo:** `crud-operations.js`
- **Localização:** `updateProfissional`, `updateServico`
- **Depois:** só `admin` pode editar
- **Estado:** IMPLEMENTADO

#### ET4.2-P0-RBAC-CANCELAR-VENDA
- **Arquivo:** `crud-operations.js` → `cancelarVenda`
- **Depois:** `admin` ou `gerente`
- **Estado:** IMPLEMENTADO

#### ET4.2-P0-RBAC-IA
- **Arquivo:** `ia-module.js` → `perguntarIA` (após respostas locais, antes do contexto online)
- **Depois:** online exige `admin`/`gerente`
- **Estado:** IMPLEMENTADO

#### ET4.2-P1-03-SOFT-SERVICO
- **Arquivo:** `crud-operations.js` → `deleteServico` / novo `desativarServico`; `eventos-globais.js` texto do confirm; `ui-render-clientes-caixa-equipa.js` selects de agenda
- **Antes:** hard delete local + contingência
- **Depois:** soft-delete (`ativo:false`) + `supabaseDeactivate` / fila; serviços inativos fora dos selects de agenda
- **Estado:** IMPLEMENTADO

#### ET4.2-P1-SYNC-RETRY
- **Arquivo:** `sync-queue.js` após `window.bpRetryFailedSync`
- **Depois:** clique em `#sync-status-container` → retry falhas + flush
- **Estado:** IMPLEMENTADO

#### ET4.2-P0-AUTH-REFRESH
- **Arquivo:** `auth-supabase.js` → `onAuthStateChange`
- **Depois:** em `TOKEN_REFRESHED` / `USER_UPDATED` / `SIGNED_IN` chama `aplicarPermissoes` + indicador sync
- **Estado:** IMPLEMENTADO

#### ET4.2-P2-SW
- **Arquivo:** `sw.js` → `CACHE_NAME = belezapro-shell-v20260809-et4p2`
- **Estado:** IMPLEMENTADO

### Ainda bloqueado / externo
- RLS, schema, Edge `ia-query` enforcement, limites server (sem alteração)

### Validação
- `node -c` módulos tocados + `build-bundle.js` OK
- Browser multi-role / multi-dispositivo: PENDENTE DE VALIDAÇÃO


---

## Etapa 4.3 — Continuidade cirúrgica

SW: `belezapro-shell-v20260809-et4p3`.

### Vestígios

#### ET4.3-TOAST-SUCESSO-FALSO
- **Problema:** após RBAC (4.1/4.2), handlers de modal podiam mostrar "actualizado" mesmo quando `update*` devolvia `null`.
- **Arquivos:** `eventos-cadastros.js` (cliente, profissional, serviço); `crud-operations.js` → `updateServico` passa a devolver o item ou `null`.
- **Estado:** IMPLEMENTADO

#### ET4.3-LOGOUT-INIT-FLAGS
- **Problema:** flags `window.__bp*InitDone` sobreviviam conceptualmente a troca de conta no mesmo document lifecycle; no logout com reload, limpeza explícita evita estado residual se o reload falhar parcialmente.
- **Arquivo:** `eventos-cadastros.js` → handler `#logout-btn`
- **Também:** `auth-supabase.js` → `bpClearSessionLocal` remove `bp_user_role`
- **Estado:** IMPLEMENTADO

#### ET4.3-CANCEL-AGENDA-RBAC
- **Arquivo:** `eventos-globais.js` → `data-action="cancelar-agenda"`; `crud-operations.js` → `updateAgendamento` quando `status: 'cancelado'`
- **Estado:** IMPLEMENTADO

### Validação
- `node -c` + `build-bundle.js` OK
- Browser: PENDENTE DE VALIDAÇÃO

### Externo (inalterado)
- RLS / SQL / Edge


---

## Etapa 4.4 — Isolamento residual e robustez de fila

SW: `belezapro-shell-v20260809-et4p4`.

### Vestígios

#### ET4.4-CART-SALAO
- **Problema:** carrinho em `localStorage` chave global `bp_cart_items` — risco de misturar itens entre salões no mesmo browser.
- **Arquivo:** `vendas-modais.js` → `cartStorageKey()`, `saveCartToStorage`, `loadCartFromStorage`, `clearCartStorageAll`
- **Arquivo:** `crud-operations.js` → `loadState(trocouDeSalao)` limpa chaves `bp_cart_items*`
- **Antes:** uma chave global
- **Depois:** `bp_cart_items_<salaoId>` + migração do legado + limpeza na troca de salão
- **Estado:** IMPLEMENTADO

#### ET4.4-DELETE-CLIENTE-RBAC
- **Arquivo:** `crud-operations.js` → `deleteCliente`
- **Depois:** `bpExigirRole(['admin','gerente'])`
- **Estado:** IMPLEMENTADO

#### ET4.4-DBDELETE-SALAO
- **Arquivo:** `sync-queue.js` → override `dbDelete`
- **Depois:** sem `salaoId`, só local + warn (alinhado a `dbPut`)
- **Estado:** IMPLEMENTADO

#### ET4.4-QUEUE-CAP
- **Arquivo:** `sync-queue.js` → `addToSyncQueue`
- **Depois:** máximo 500 ops na fila (proteção quota/DoS local)
- **Estado:** IMPLEMENTADO

### Validação
- `node -c` + bundle OK
- Browser: PENDENTE DE VALIDAÇÃO

### Externo
- RLS / SQL / Edge — inalterado


---

## Etapa 4.5 — Fila ilimitada, recibos sincronizados, regra serviço↔profissional

SW: `belezapro-shell-v20260809-et4p5`.

### Vestígios

#### ET4.5-QUEUE-ILIMITADA
- **Arquivo:** `sync-queue.js` → `addToSyncQueue`
- **Antes (4.4):** teto 500 ops (descartava antigas)
- **Depois:** **sem teto** — nunca descarta operações da fila
- **Estado:** IMPLEMENTADO

#### ET4.5-RECIBO-SYNC
- **Arquivos:** `core-utils.js` (`nextReciboNum`, `bpSyncReciboCounter`, push/pull), `auth-supabase.js` (após plano), `sync-rest.js` (após merge movimentos)
- **Comportamento:**
  1. Contador por salão em localStorage
  2. Reconcilia com `max(reciboNum)` dos movimentos locais
  3. Tenta ler/escrever `salao_config.recibo_counter` no Supabase
  4. Cada venda grava `reciboNum` no movimento (já sincronizado via fila REST)
- **SQL futuro (quando autorizar):** garantir coluna `recibo_counter integer` em `salao_config` + RLS de update por salão. Sem a coluna, push/pull falham em silêncio e a sequência continua local + movimentos.
- **Estado:** IMPLEMENTADO (cliente); coluna SQL pendente

#### ET4.5-SERVICO-PROF-OBRIGATORIO
- **Arquivos:** `crud-operations.js`, `eventos-cadastros.js`, `ui-render-clientes-caixa-equipa.js`, `vendas-modais.js`
- **Regras:**
  - Serviço **não** pode ser criado/editado sem ≥1 profissional
  - **Proibido** interpretar lista vazia como “toda a equipa”
  - Selects de agenda/venda: sem associação → lista vazia de profissionais
  - Profissional **exige** especialidade = serviço activo; ao gravar, liga-se ao serviço
  - Criar serviço a partir do modal de profissional: exige nome do profissional preenchido (`pendingNomes`)
- **Estado:** IMPLEMENTADO

### Nota produto
Primeiro serviço num salão vazio: criar via modal de profissional (nome já preenchido) ou criar serviço com profissional já existente. Não há atalho “serviço sem equipa”.

### Externo ainda pendente
RLS, schema `recibo_counter`, testes manuais.


---

## Etapa 4.6 — Fila 600+, recibos, IA, fotos offline + pacote Supabase

SW: `belezapro-shell-v20260809-et4p6`.

### Cliente
- Flush em lotes de 25, progresso gravado, sem teto de fila
- Recibo: mapeamento `recibo_num` + sync contador
- IA: push/pull uso diário
- Fotos: fila persistente + flush online

### Entregar ao operador humano
- `missão a fazer.md` — passo a passo
- `SUPABASE_ETAPA4_6_COMPLETO.sql` — executar no SQL Editor


---

## Etapa 4.7 — Tooltip do gráfico confinado ao Resumo

### Problema
Tooltip `#chart-tooltip` com `z-index: 9999` e `pointer-events: auto` (`.is-rich`) interceptava toques na bottom-nav e abria `modal-chart-drill` («Detalhe do dia») ao tentar ir a Caixa/Equipa/IA.

### Correções
- `bpHideChartTooltip` / `bpChartIsDashboardActive` / `bpConfineChartTooltipPosition` em `chart-module.js`
- `abrirChartDrill` e `showTooltipFor` só no dashboard
- Capture em `touchstart`/`click` na bottom-nav esconde tooltip
- Handler `.nav-item` esconde tooltip + fecha drill ao sair do Resumo
- CSS: `z-index: 400` (< nav 500)
- SW: `belezapro-shell-v20260809-et4p7`


---

## Etapa 4.8 — Fatia 1: Notificações profissionais (toast + modais info/erro/sair)

### Solicitado
Padronizar feedback: toast discreto, duração por tipo, z-index abaixo do modal; modal «Cliente não encontrado» leve; «Sair da conta»; erro contextual; botões dourados compactos (não barra full-width).

### Implementado
1. **`toast(msg, type, opts?)`** (`core-utils.js`): success/info 2,5s; warning 3,5s; error 5s; `role` status/alert.
2. **Toast CSS** (`modais-toast-fab.css` + `design-system-final.css`): superfície neutra, barra lateral semântica, max-width 360/420, `z-index: 1900` (< modal 2000), sem fundo verde/vermelho saturado.
3. **`showConfirmModal`**: labels Cancelar + Eliminar/Continuar; opts `{ confirmLabel, cancelLabel }`; checkbox `keep-logged` oculto.
4. **Logout**: «Sair da conta?» / «Vais terminar a sessão neste dispositivo.» / Cancelar | Sair.
5. **`#modal-cliente-nao-encontrado`**: «Não encontrámos nenhum cliente com esse nome.» + botão **Fechar** compacto (não OK full-width).
6. **`mostrarErro` / `#modal-erro`**: título «Não foi possível concluir»; Fechar | Tentar novamente; sem ícone «!».
7. SW: `belezapro-shell-v20260809-et4p8`

### Comportamento anterior → novo
- Toast 2,8s único, fundo colorido saturado, z-index 3000 → duração por tipo, neutro, z-index 1900.
- Cliente não encontrado: texto longo + OK barra → texto curto + Fechar compacto.
- Sair: «Sim» → «Sair» com copy de sessão.

### Não incluído nesta fatia
- 182 rewrites toast; inline validation; remoção de todos os `confirm()` nativos; família destrutiva completa (fatias 2–3).


---

## Etapa 4.8b — Ajuste de peso (50% modal / 30% copy / 20% tipografia)

### Memória de produto
- Sem limite artificial de caracteres: a mensagem deve comunicar, orientar e indicar a próxima ação com empatia.
- Referência de copy: o espírito de «Cliente não encontrado» (explica + orienta).
- O que era amador: botão full-width, tipografia fraca, hierarquia pobre — não a extensão do texto.

### Implementado
**Copy (30%)**
- Cliente não encontrado: «Não encontrámos nenhum cliente com esse nome. Confirma a ortografia ou regista o cliente antes de continuar a venda.» CTA: **Entendi**
- Erro default: orientação a tentar de novo / ligação
- Sair: reforço de que os dados do salão permanecem guardados

**Modal (50%)**
- Sheet ~360px, padding equilibrado, sombra discreta, overlay centrado + blur
- Ações alinhadas à direita; botões **compactos** (min-height 36px, padding 8×16), não barra dourada
- Primário dourado contido; secundário outline; destrutivo vermelho controlado

**Tipografia / organização (20%)**
- Título 1.125rem / 600 / tracking −0.02em
- Mensagem 0.9375rem / 400 / line-height 1.5 / cor secundária
- Espaço título→mensagem→ações definido; texto sempre à esquerda

SW: `belezapro-shell-v20260809-et4p8b`


---

## Etapa 4.9 — Fase 1c + Fase 2 (confirm nativos)

### Fase 1 — detalhes
- **Cliente não encontrado:** copy da referência: «Não encontrei o cliente. Verifica se o nome está correcto ou se o cliente que procura está cadastrado.» CTA **Entendi**.
- **Sair da conta:** variant `quiet` — tipografia limpa, botão Sair neutro (sem dourado dominante).
- **Offline / sincronização:** mensagens profissionais sem jargão técnico (sem “IndexedDB”, “servidor instável” genérico de eng).

### Fase 2 — `confirm()` nativo → `showConfirmModal`
| Antes | Depois |
|-------|--------|
| Limpar carrinho | Modal destrutivo «Limpar carrinho?» |
| Atualizar preço no carrinho | Modal «Atualizar preço?» |
| Remover item (qty) | Modal destrutivo «Remover item?» |
| Remover foto | Modal destrutivo «Remover foto?» |
| Limpar chat equipa | Modal destrutivo «Limpar mensagens?» |
| Restaurar backup | Modal destrutivo «Restaurar backup?» |

Único `confirm()` restante: fallback se o DOM do modal não existir (`core-utils.js`).

SW: `belezapro-shell-v20260809-et4p9`

---

## Etapa 4.9b — Eliminação de avisos de rede ao utilizador

- **Removido:** toasts de saúde do serviço («ligação ao servidor» / sincronização lenta) em `supabase-resilience.js` (mantém apenas log interno).
- **Removido:** banner **Modo offline** (`#offline-banner`) — nunca mostrado; CSS `display:none !important`.
- Indicador de sync no header: sem label «Offline» vazio; mostra só pendências quando existirem.
- Offline-first e fila de sync **continuam a funcionar** em silêncio.

SW: `belezapro-shell-v20260809-et4p9b`


---

## Etapa 4.10a — Fase 1 do sistema de comunicação (relatório + validações)

### Diálogo interno (viola / não viola)
1. **Sair vermelho** — não altera texto validado; só `confirmTone: 'danger'`. OK.
2. **Offline centrado + Entendi** — pedido do utilizador; modal informativo T06-like; uma vez/sessão; some após CTA. OK.
3. **Banner topo offline** — continua oculto (não permanente intrusivo). OK.
4. **Header «Offline»** — status de sistema no indicador de sync. OK.
5. **Expressões validadas** — intactas (cliente não encontrado, sair copy, confirms fase 2). OK.
6. **«A sincronizar…»** — tipo `info`, não `success` (Processing ≠ Success). OK.
7. **Toast** — durações e superfície neutra já alinhadas; z-index < modal. OK.

### Implementado nesta fatia
- `showConfirmModal`: `confirmTone: 'danger'` em variant quiet → botão **Sair** vermelho controlado.
- `#modal-offline-info`: centro, copy profissional, CTA **Entendi**; `sessionStorage bp_offline_info_ack`; sem fechar por backdrop/ESC.
- Header sync: label Offline quando sem rede.
- SW: `belezapro-shell-v20260809-et4p10a`

### Fora desta fatia (Fase 2)
- Reescrita das 182 toasts / inline validation em massa
- Empty states / upgrade copy completa
- Fila de prioridade multi-toast avançada


---

## Etapa 4.10a — Fase 1 (relatório + expressões validadas)

### Diálogo interno (viola o relatório?)
| Alteração | Viola? | Motivo |
|-----------|--------|--------|
| Offline centrado + Entendi | Não | T11 adaptado: condição operacional, leitura obrigatória, CTA com verbo, depois desaparece |
| Sem banner permanente no topo | Não | Relatório: não intrusivo permanente |
| Header «Sem rede» | Não | Status de sistema, não toast de emergência |
| Sair vermelho (`confirmTone: danger`) | Não | T08/sessão: cor semântica no CTA, não fundo saturado no modal |
| Expressões validadas intactas | Não | Autoridade do produto sobre propostas genéricas |
| Sem toasts de «servidor instável» | Não | Já eliminados; header limpo |

### Implementado nesta fatia
1. **Modal offline** `#modal-offline-info` — centro, copy profissional, **Entendi**, `sessionStorage` até voltar online.
2. Backdrop/ESC **não** fecham sem Entendi.
3. **Sair** com botão vermelho (`variant: quiet` + `confirmTone: 'danger'`).
4. Header: **Sem rede** / **Sem rede · N pend.**
5. Expressões validadas (cliente não encontrado, sair texto, etc.) **inalteradas**.

### Fase 2 (ainda não)
- Tipologias T01–T16 completas nas 182 strings
- Validation inline
- Processing só em status


---

## Etapa 4.10b — Fase 2 (tipologias + copy operacional)

### Diálogo interno
| Mudança | Viola relatório? | Viola expressões validadas? |
|---------|------------------|----------------------------|
| Success curto («Cliente adicionado.») | Não (T01) | Não (não eram as frases de modal validadas) |
| Validation → warning + tom «Introduz…» | Não (T02 direção; inline fica para refinamento de DOM) | Não |
| «A sincronizar…» tipo info, não success | Não (T09) | Não |
| Permissões em warning | Não (T03) | Não |
| Modais validados | — | **Intactos** |

### Exemplos aplicados
- Cliente adicionado. · Profissional adicionado. · Serviço criado. · Venda registada. · Caixa fechado.
- Introduz o nome. · Preenche os campos obrigatórios. · Selecciona um profissional.
- Não tens permissão para esta ação. · Não tens acesso a esta área.
- Remoções offline com orientação de sync.

### Não nesta fatia
- Inline DOM em todos os campos (requer markup por formulário)
- Reescrita 100% das 182 (restam strings de nicho BP*)


---

## Etapa 4.11 — Fixes runtime + transição de abas

### Causas (factuais)
1. **`body is not defined`**: em `media-galeria.js`, o `setTimeout` de lazy-load ficou **fora** de `renderGaleria` após o refactor do confirm de foto → `body` fora de scope.
2. **`focus` null**: `cancelBtn.focus()` / `previousFocusedElement.focus()` sem guarda.
3. **Pendentes com internet**: `toSupabaseFormat('movimentos')` enviava **`cliente_id`**; schema remoto não tem a coluna → **PGRST204** → upsert falha → fila não esvazia.
4. **Abas**: animação `fadeUp` vertical amadora → slide horizontal por índice de aba.

### Correções
- `media-galeria.js`: setTimeout dentro de `renderGaleria`
- `sync-rest.js`: remover `cliente_id` do payload de movimentos
- focus null-safe em `core-utils.js` e `detalhes-acessibilidade.js`
- `bpSwitchTabPane` + CSS `bp-tab-in/out-left/right`
- SW: `belezapro-shell-v20260809-et4p11`
