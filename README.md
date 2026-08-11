# BeautyPro — README


### Varredura pós-implementação — Caixa (2026-08-11)

#### Problemas encontrados e corrigidos
1. **Fecho / imprimir** sem guard se `state.movimentos` for null → crash. **Corrigido:** `Array.isArray` fallback `[]`.
2. **Entendi:** só listener directo; timing frágil. **Corrigido:** delegação em captura + `type=button`.
3. **Despesa:** `getElementById(...).addEventListener` sem null-check. **Corrigido.**
4. **Avatar foto na lista:** sem CSS `object-fit` → foto cortada/errada. **Corrigido** em `kpis-caixa-listas.css`.
5. **Botões:** `max-height: 40px` para resistir a overrides do design-system.

#### Duplicação
- Confirmado: **um** `addMovimento` despesa em `eventos-caixa-vendas.js`; finance só `enhanceDespesaModal`.

#### Segunda varredura: PASSED

---

## Etapa Caixa + botões (2026-08-11) — Pontos 8 e 11 + paridade WA/Fechar

### Implementado
- **Entendi** (`modal-cliente-nao-encontrado`): bind reforçado + fallback de fecho.
- **Despesa**: single-flight (`bpSaving`); hook duplicado em `finance-fase1-extra.js` desactivado (só enhance).
- **Fecho**: painel `bp-fecho-panel` sem inline excessivo; lógica de totais intacta.
- **Lista movimentos / localizar**: avatar do cliente (foto → inicial → bolinha); despesas mantêm bolinha vermelha; clique venda intacto.
- **Botões**: WA / Ligar / Fechar / Editar a **40px** em `#modal-cliente` e `#modal-prof`.

### Ficheiros
`eventos-caixa-vendas.js`, `ui-render-clientes-caixa-equipa.js`, `detalhes-acessibilidade.js`, `finance-fase1-extra.js`, `componentes-base.css`, `kpis-caixa-listas.css`, `index.html`, `app.bundle.js`

---


### Correcção CSS (2026-08-11)
- Estilos da etapa Cliente estavam em `style.css`, **não referenciado** pelo `index.html`.
- **Movidos** para `componentes-base.css` (carregado pelo index).
- Regra: **nunca** entregar CSS/JS que o `index.html` / `build-bundle.js` não carreguem.

## Etapa Cliente (2026-08-11) — Pontos 3, 4, 5, 6 (parcial), 7 (parcial)

### Pedido
3. Remover filtros Todos / Mais frequentes / Menos frequentes (poluição).
4. Placeholder «Localizar cliente» com animação (escreve, pausa, apaga, próxima frase) na aba Cliente e no histórico (Caixa).
5. Estados vazios de Visitas / Total gasto / Última visita estruturados e legíveis.
6. WhatsApp com ícone e identidade visual; Ligar com identidade própria; botões Editar/Cancelar mais compactos no modal cliente.
7. Imagens: mecanismo para a foto permanecer visível offline (parcial nesta etapa: não apagar data URL local após upload).

### Encontrado
- Chips `.filtro-frequencia` em `index.html` + sort em `renderClientes` + handlers em `eventos-caixa-vendas.js`.
- Placeholders estáticos.
- Stats do perfil: `0` / `0 Kz` / texto longo sem hierarquia de empty state.
- WhatsApp/Ligar: `btn-primary` / `btn-secondary` genéricos, só texto.
- Após upload bem-sucedido, `media-galeria.js` fazia `foto: null` e ficava só `foto_url` (falha offline).

### Alterado
| Ficheiro | Mudança |
|----------|---------|
| `index.html` | Removidos 3 botões de frequência; attrs `bp-placeholder-rotating` nos inputs de pesquisa |
| `ui-render-clientes-caixa-equipa.js` | Lista só por nome + pesquisa (sem sort por frequência) |
| `eventos-caixa-vendas.js` | Handlers de frequência removidos |
| `eventos-cadastros.js` | `bpBtnWhatsAppHtml` / `bpBtnLigarHtml`; `bpStartPlaceholderRotation`; stats `bp-cli-stat is-empty` |
| `media-galeria.js` | Após upload: mantém `foto` (data URL) + grava `foto_url` (cache offline) |
| `style.css` | Estilos WA (#25D366), Ligar (#1a73e8), stats empty, modal cliente compacto |
| `app.bundle.js` | Rebuild |

### Removido
- UI e lógica dos filtros de frequência de clientes (ponto 3).
- `foto: null` no patch pós-upload (ponto 7 parcial).

### Preservado
- Pesquisa por nome/telefone/notas.
- Pipeline BPMedia / avatars.
- Notificações e SMS intocados.
- Agenda WhatsApp (pode alinhar-se numa etapa seguinte do ponto 6).

### Verificação
| Ponto | Estado |
|-------|--------|
| 3 | Implementado |
| 4 | Implementado (Cliente + Caixa localizar) |
| 5 | Implementado |
| 6 | Parcial (vista cliente + ficha profissional; agenda noutro passo se necessário) |
| 7 | Parcial (cache local data URL preservado; SW/cache HTTP de foto_url ainda pode falhar se nunca houve data URL) |

---


### Varredura pós-implementação (2026-08-11) — Cliente

#### Problemas encontrados e corrigidos
1. **Stats em grelha**: `display:grid` no JS sem `grid-template-columns` → podia empilhar numa coluna. **Corrigido:** `repeat(3, minmax(0,1fr))` em `style.css`.
2. **`hidden` no stats**: só `hidden=false` por vezes insuficiente. **Corrigido:** `removeAttribute('hidden')`.
3. **Placeholder e a11y**: animação sem respeito a `prefers-reduced-motion`. **Corrigido:** placeholder estático se reduced motion; clear timeout se o input sair do DOM.
4. **Helpers globais**: `bpBtnWhatsAppHtml` / `bpBtnLigarHtml` expostos em `window` para uso consistente.

#### Segunda varredura — checklist automático
- Sem botões `.filtro-frequencia` no HTML
- Sem sort por frequência em `renderClientes`
- Placeholders animados em search-cliente e caixa-localizar-input
- WA/Ligar com helpers (sem btn-primary genérico no fluxo de ficha)
- Empty stats com copy estruturado
- Upload de foto **não** faz `foto: null`
- Bundle regenerado + `node --check` OK

#### Confrontação requisitos
| Ponto | Cumprido | Notas |
|-------|----------|-------|
| 3 | Sim | Filtros removidos |
| 4 | Sim | Typewriter + erase; reduced motion |
| 5 | Sim | Cards is-empty + legendas |
| 6 | Parcial | Ficha cliente + profissional; Agenda ainda genérico (fora do núcleo desta etapa) |
| 7 | Parcial | Cache data URL mantido; clientes *só* com foto_url legada offline continuam limitados |

#### Não inventado / não tocado
- Notificações e SMS
- Lógica de pesquisa nome/telefone
- Soft-delete / RBAC

---

## Etapa Equipa (2026-08-11) — Pontos 1 e 2 dos 19 requisitos

### Pedido
1. **Profissional** não pode ser criado/guardado sem: serviço (especialidade), comissão (taxa), número (contacto 9 dígitos) e morada.
2. **Data contratual** obrigatória com formato válido; se inválida/vazia/impossível, informar e orientar o formato correcto (utilizador digita; sem valor por defeito implícito inválido).

### Encontrado no ZIP (antes)
- `eventos-cadastros.js` (`#modal-prof-save`): nome, idade e data vazia já bloqueavam; **especialidade era opcional (R29)**; contacto só validado se preenchido; morada e taxa não obrigatórias (`taxa` NaN → 0).
- `crud-operations.js` `addProfissional`: R29 permitia `especialidade` vazia; toast a pedir associação posterior.
- `updateProfissional`: validava especialidade só se enviada; não reforçava contacto/morada/taxa.
- `index.html`: labels de morada/contacto/taxa sem `*`; separador «Dados adicionais (opcional)»; data já era `input type="text"` com placeholder de formato.

### Alterado

#### `eventos-cadastros.js`
- **Adicionado** `bpValidarDataContratual(raw)`:
  - vazio → mensagem de obrigatoriedade + formatos `AAAA-MM-DD` / `DD/MM/AAAA`;
  - formato errado → orientação explícita;
  - data impossível (ex. 31/02) ou fora de 1950–2100 → rejeição;
  - sucesso → normaliza para ISO `YYYY-MM-DD`.
- **Substituída** a validação só-de-vazio da data contratual por chamada a `bpValidarDataContratual`.
- **Removida** a lógica R29 «especialidade opcional» no submit do formulário.
- **Adicionadas** validações obrigatórias antes de montar `dados`:
  - serviço/especialidade;
  - morada não vazia;
  - contacto exactamente 9 dígitos;
  - taxa de comissão preenchida e ∈ [0, 100].
- Feedback via `bpNotifyFormError` (campo + mensagem) quando disponível.

#### `crud-operations.js`
- **`addProfissional`**: especialidade **obrigatória** + `bpValidarEspecialidadeProfissional`; contacto 9 dígitos; morada; taxa 0–100. Toast de sucesso unificado («Profissional adicionado.»).
- **`updateProfissional`**: rejeita especialidade vazia; reforço de contacto, morada e taxa quando esses campos vêm em `data`.

#### `index.html`
- Labels: `Morada *`, `Contacto (9 dígitos) *`, `Taxa de comissão (%) *`.
- Separador: «Dados de contacto e identificação» (removido «opcional» enganador).
- Data contratual: mantido input de texto com placeholder de formato (sem default automático de data).

#### `app.bundle.js`
- Regenerado com `node build-bundle.js` (inclui as alterações acima).

### Código removido / substituído e porquê
- R29 permissivo no formulário e em `addProfissional` → **substituído** por obrigatoriedade de serviço, alinhado ao requisito dos 19 pontos (prevalece sobre a regra antiga do código).
- `taxa_comissao: isNaN(taxa) ? 0 : taxa` no submit → **substituído** por rejeição se vazio/NaN (0 só se o utilizador indicar 0).
- Mensagem «Associe um serviço…» no add sem especialidade → **removida** (já não se grava sem serviço).

### Lógica implementada (resumo)
```
Guardar profissional
  → validar nome, idade
  → validar data contratual (formato + calendário) → ISO
  → criar serviço se "__criar"
  → exigir especialidade, morada, contacto 9 dig, taxa 0–100
  → addProfissional / updateProfissional (mesmas regras de defesa)
```

### Preservado
- Fluxo «Criar seu serviço» no modal.
- BI continua opcional (com validação se preenchido).
- Meta mensal continua opcional.
- RBAC admin em add/update.
- Limite de plano de profissionais.
- Notificações e SMS: **não alterados**.

### Ficheiros afectados
- `eventos-cadastros.js`
- `crud-operations.js`
- `index.html`
- `app.bundle.js`
- `README.md` (este registo)

### Verificação face ao pedido
| Requisito | Cumprido |
|-----------|----------|
| Sem serviço → não guarda | Sim (UI + `addProfissional`/`updateProfissional`) |
| Sem comissão (taxa) → não guarda | Sim |
| Sem número (contacto) → não guarda | Sim |
| Sem morada → não guarda | Sim |
| Data vazia/ inválida / impossível → mensagem + formato | Sim |
| Utilizador digita a data (sem default inválido) | Sim (`type="text"`) |

### Riscos / notas
- Profissionais **já existentes** incompletos no IDB não são apagados; ao **editar/guardar** passam a ter de completar os campos.
- Taxa `0` é válida (comissão zero explícita); campo vazio não é.

---


### Varredura pós-implementação (2026-08-11) — Equipa

#### Problemas encontrados e corrigidos
1. **Crítico — `const dataContratual` + reatribuição** (`dataContratual = dataChk.value`): em runtime lançava `TypeError: Assignment to constant variable` **depois** de validar a data com sucesso, impedindo Guardar. **Corrigido:** `let dataContratual`.
2. **Taxa pré-preenchida com `0`** (`index.html` `value="0"` + novo formulário `fid === 'prof-taxa' ? '0'`): permitia gravar «comissão» sem o utilizador a indicar conscientemente. **Corrigido:** campo vazio no HTML e no «Novo profissional»; validação continua a exigir valor explícito 0–100.
3. **Duplo clique em Guardar:** risco de dois `addProfissional`. **Corrigido:** flag `data-bp-saving` + `disabled` com `try/finally`.
4. **Idade fora do intervalo do input (16–99):** só bloqueava vazio/NaN. **Corrigido:** validação 16–99 no submit.
5. **`updateProfissional` sem validar data contratual** quando o campo vinha no payload. **Corrigido:** usa `bpValidarDataContratual` e normaliza ISO.

#### Segunda varredura (após correcção)
- `node --check` em `eventos-cadastros.js`, `crud-operations.js`, `app.bundle.js`: OK.
- Testes unitários de `bpValidarDataContratual`: vazio, ISO, DD/MM/AAAA, 31/02, mês 13, bissexto, ano &lt; 1950 — todos conformes.
- Confirmação: sem `value="0"` em taxa; open form limpa taxa; sem reassign a const.
- Bundle regenerado.

#### Requisitos vs código (fecho)
| Requisito | Estado após varredura |
|-----------|------------------------|
| Sem serviço → não guarda | UI + `addProfissional` + `updateProfissional` |
| Sem comissão consciente → não guarda | Taxa vazia rejeitada; sem default 0 |
| Sem contacto 9 dígitos → não guarda | UI + CRUD |
| Sem morada → não guarda | UI + CRUD |
| Data inválida/vazia/impossível → mensagem + formato | `bpValidarDataContratual` |
| Utilizador digita data | `type="text"`, sem default |

---


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


---

## Etapa 4.12 — Transição de abas Opção A (crossfade)

### Modelo
- Crossfade **~150 ms** (out 120 ms / in 150 ms), estilo tab bar WhatsApp/Material.
- **Sem** slide horizontal → elimina faísca da aba anterior.
- `.main-content` com fundo opaco `var(--bg-soft)`.
- `prefers-reduced-motion`: troca instantânea.
- Limpeza de classes legadas `bp-tab-in/out-*`.

### Ficheiros tocados (cirúrgico)
- `layout-nav-tabs.css` — só bloco TABS
- `detalhes-acessibilidade.js` — só `bpSwitchTabPane`
- bundle + SW `belezapro-shell-v20260810-et4p12`

### Não alterado
Handlers de role, render por aba, tooltip, offline modal, sync, confirm, etc.


---

## Etapa 4.13 — Transição abas foto-a-foto (~160ms)

- Slide horizontal sincronizado (páginas adjacentes).
- Avançar: antiga ← esquerda, nova da direita; recuar: inverso.
- Duração **0.16s**; stacking absoluto; fundo opaco; sem crossfade.
- `main-content.bp-tab-animating` trava scroll durante a animação.
- SW: `belezapro-shell-v20260810-et4p13`


---

## Etapa 4.14 — Resumo + modal venda (UI)

- Removido card **Saldo em caixa (hoje)** do dashboard (HTML + CSS hide).
- **Próximos atendimentos**: título `h2.dash-section-title` (serif 1.125rem), meta alinhada.
- Modal venda: subtítulo → «Realiza a venda em poucos passos — serviço e pagamento abaixo.»
- Select cliente: «Cliente cadastrado» (em vez de «Cliente avulso (sem ficha)»).
- Transição de abas: mantida a versão foto-a-foto (v13).
- SW: `belezapro-shell-v20260810-et4p14`


---

## Etapa 4.14b — Auditoria da v14 + correcções

### Falhas factuais encontradas
1. Tipografia «Próximos atendimentos»: seletor fraco (h2 podia herdar estilos globais).
2. Slide de abas: 1.º frame podia flashar (altura 0 / transform sem rAF).
3. Mensagem vazia da lista de atendimentos inconsistente.

### Corrigido
- CSS `#tab-dashboard h2.dash-section-title` com especificidade alta.
- `bpSwitchTabPane`: double rAF + transform inicial + minHeight estável.
- Empty state: «Sem atendimentos pendentes».
- Saldo caixa: continua ausente no resumo (HTML + CSS).
- Textos venda (Cliente cadastrado / subtítulo): mantidos como pedido.


---

## Etapa 5.1 — Motor de validação de venda (regras R01–R06, R08–R15, R17–R21)

### Implementado
- `bpValidarOperacaoVenda` em `crud-operations.js` (camada de negócio).
- `registarVenda` rejeita payload inválido (não grava Avulso/Não atribuído/default Numerário).
- **Cobrar** valida antes de processar; foco no campo; dados preservados.
- Modal de validação via `mostrarErro` (título + corpo); destaque `.bp-field-invalid`.
- Removido serviço personalizado (`__custom`) do fluxo de venda.
- Pagamento: opção vazia obrigatória + lista R13 (incl. Split); sem default silencioso.
- Profissionais filtrados só após serviço; só habilitados ao serviço.
- Anti reentrada no botão Cobrar (`disabled` / `aria-busy`).

### Fora desta etapa (etapa 2+)
- R24 modal de confirmação pré-persistência
- Agenda alinhada / clientes telefone R46 / etc.


## Etapa 5.1b — Blindagem após varredura

### Falhas encontradas e corrigidas
1. **addToCart** sufixava o nome com preço → validação R17 falhava em itens legítimos → nome de catálogo preservado.
2. **Finalizar atendimento** marcava realizado + toast de sucesso mesmo se `registarVenda` falhasse → valida antes; só atualiza agenda se idVenda OK.
3. **Clientes inactivos** no select de venda → filtrados.
4. **Finalizar pagamento** com Outro / default Numerário → alinhado a R12/R13.
5. **Transferência Bancária** normalizada para Transferência no motor.
6. **setButtonLoading** + `aria-busy` para anti-duplo clique.
7. Quantidade no carrinho forçada a inteiro ≥ 1.


---

## Etapa 5.2 — R24 confirmação + Agenda alinhada + subtítulo

- Subtítulo modal venda: «Registe a venda e mantenha as suas operações organizadas.»
- **R24:** após validação OK, modal «Confirmar venda?» com resumo; só depois `registarVenda`.
- Agenda: sem serviço personalizado; profissionais filtrados por serviço; validação R37–R41 no save; conflito já bloqueava (R42).
- Finalizar atendimento continua a usar `bpValidarOperacaoVenda` (etapa 1).


## Etapa 5.2b — Varredura e blindagem

### Problemas encontrados e corrigidos
1. Escape podia fechar o modal de venda por baixo do confirm (querySelector .open).
2. Confirm sem handler Escape próprio (ficava preso).
3. z-index do confirm igual ao da venda → risco de empilhamento.
4. R24 ausente no **Finalizar atendimento**.
5. `confirmou = true` se showConfirmModal falhasse → bypass de R24.
6. Split no finance ainda com «Transferência Bancária» / fora da lista R13.
7. Constante central `BP_METODOS_PAGAMENTO` (R13).

### Confirmado OK
- Subtítulo pedido
- R24 Cobrar com resumo e sem persistir até confirmar
- Agenda R37–R41 + filtro profissionais + sem Outro
- Conflito R42 já em add/updateAgendamento


---

## Etapa 5.3 — Clientes, Equip a/Serviços, integridade

### Clientes (R45–R47)
- `bpValidarTelefoneCliente`: 9 dígitos, começa por 9, obrigatório
- UI modal cliente + cliente rápido
- Camada `addCliente` / `updateCliente`
- Duplicado: mensagem R47 (sobrenome)

### Equipa (R29)
- Profissional pode ser criado sem especialidade
- Sem especialidade não é ligado a serviço (não aparece em filtros de venda/agenda)
- Se especialidade indicada, deve ser serviço activo válido

### Serviços (R33–R34)
- `addServico` / `updateServico`: preço > 0 na camada de negócio
- Profissionais associados já obrigatórios

### Offline / integridade (R51–R58)
- Já coberto na etapa 1: `registarVenda` valida antes de `dbPut` (não enfileira inválido)


## Etapa 5.3b — Varredura e blindagem

### Falha crítica corrigida
- `bpValidarTelefoneCliente` **não existia** no ficheiro (insert falhou na 5.3).
- A UI chamava a função e, no fallback, devolvia sempre `ok: false` → **impossível criar cliente**.
- `addCliente` não aplicava R46/R47 na camada de negócio.

### Corrigido agora
1. Função `bpValidarTelefoneCliente` + export window
2. `addCliente` com telefone obrigatório e mensagem R47
3. `bpClientesActivos` + filtros na agenda (R48)
4. Bloqueio de cliente inactivo no save da agenda

### Confirmado
- R29 especialidade opcional na UI
- R33/R34 preço e profissionais no serviço

---

## Entrega final — feedback de formulários + R50 + Supabase

### Causa estrutural (notificações “atrasadas”)
Toast com z-index 1900 atrás dos modais (2000+). Corrigido para 2500.
`bpNotifyFormError` padroniza toast + foco + aria-invalid em Cliente, Equipa, Serviços, Agenda.

### R50
UI cancelar venda; sync de status/estorno; KPIs ignoram canceladas; SQL em SUPABASE_R50_CANCEL_CLIENTES.sql.
Ver `passo a passo.md`.

## Correção final — view/form + notificações orientadoras

### Causa estrutural
`.bp-view-panel { display: block }` anulava o atributo HTML `[hidden]`, deixando **ficha + formulário** visíveis ao mesmo tempo (Cliente/Equipa/Serviços).

### Correcções
1. CSS: `[hidden] { display: none !important }` em view e form panels
2. `setClienteModalMode` / `setProfModalMode` / `setServicoModalMode` forçam `style.display`
3. Novo cliente/profissional limpa campos e estado pendente de foto
4. `bpNotifyFormError` + `mostrarErro(..., onClose, { okLabel: 'Entendi' })` — mensagem primeiro; foco no campo **depois** de Entendi
5. Venda: `bpNotificarValidacaoVenda` segue o mesmo padrão
6. SQL `SUPABASE_R50_E_CLIENTES.sql` + sync de status/cancelamento
7. `passo-a-passo.md` com instalação e testes

## Varredura final UI (finalb)

### Problemas encontrados nesta passagem
1. Escape com `modal-erro` aberto: o handler antigo **ignorava** o erro e podia fechar o modal de baixo (cliente/venda) ou não fazer nada.
2. `mostrarErro` sem `#modal-erro` no DOM: `onClose` (foco no campo) **nunca** corria.
3. CTA de validação sem destaque visual consistente.

### Corrigido
- Escape fecha `modal-erro` via `_bpFinish` → dispara «Entendi»/onClose → foco no campo
- `mostrarErro` chama `onClose` se o modal não existir
- CTA «Entendi» como botão primário + foco no CTA ao abrir
- Confirmação: CSS view/form `[hidden]`, modos set*ModalMode, bpNotifyFormError em cascata

### Segunda varredura
- node -c OK em core-utils, eventos-cadastros, vendas-modais, crud-operations
- Bundle regenerado

## UI cirúrgica — foco, botões, Confirmar venda, detalhe Caixa

### Sem alterações a notificações/SMS
O sistema `bpNotifyFormError` / `mostrarErro` / toasts **não** foi modificado.

### 1. Foco do campo
- Causa: `border` dourado + `outline` global + `box-shadow` 3px → duas linhas grossas
- Agora: **1 linha** de 1px dourada; outline/box-shadow removidos em `.input-field`

### 2. Botões
- Default: 48→40px; sm: 40→32px; fonte ligeiramente menor
- Filtros Clientes e acções de modal alinhados

### 3. Confirmar venda
- Textos preservados
- `summaryLayout`: linhas Cliente/Profissional/Itens/Total/Pagamento em bloco tipo ficha
- Nota final abaixo do bloco

### 4. Detalhe Caixa
- Grelha de itens: colunas mais largas; Qtd / Unit. / Total com `nowrap`
- Hierarquia tipográfica (qty/unit secundários, total forte)

### 5. Cancelar venda
- Largura 100% na fila abaixo de Fechar / Imprimir

## Varredura UI compact (ui1b)

### Problemas encontrados
1. `componentes-base.css` ainda tinha foco sem `outline: none !important` (risco residual de anel duplo).
2. `showConfirmModal` summary: possível conflito `white-space: pre-line` no `#confirm-message`.
3. Escape HTML incompleto no resumo (`<` apenas).
4. SyntaxError: `}` extra após o bloco summary (introduzido na correcção).
5. Grelha de itens podia ser sobrescrita por regras de cor posteriores — reforço `.bp-view-dl--itens`.

### Corrigido
- Foco unificado em componentes-base + design-system + premium
- Summary: classe `confirm-message--summary`, white-space normal, escape completo
- `}` extra removido; `node -c` OK
- Notificações (`bpNotifyFormError` / `mostrarErro`) **intactas**

## Varredura UI (ui1c) — causa residual do foco duplo

### Causa estrutural ainda activa
`impressao-acessibilidade.css` (carregado em todos os ecrãs) forçava:
- `outline: 2px solid gold !important`
- `border-color: gold !important` em `*:focus-visible`

Isto somava-se à borda dourada do `.input-field:focus` → **duas linhas grossas**.

### Correção
- Formulários: sem outline; só borda 1px
- Botões/links: outline 1px fino
- Removido `border-color !important` no foco global
- Confirmar venda: `white-space: normal !important` no modo summary
- CTAs do confirm a 36px

### Notificações
Sem alterações a `bpNotifyFormError` / `mostrarErro`.

## Sync pendentes com rede + polish Caixa/Confirmar (2026-08-11)

### Causa dos «N pendentes» com internet
1. Upserts a falhar com **PGRST204** (colunas ausentes no Supabase, ex. R50 / historicamente `cliente_id`).
2. Ops ficavam em **backoff** (`nextRetry`) ou `failed` — o evento `online` só reabria `failed`, não o backoff.
3. Sem flush periódico enquanto a fila não estava vazia.

### Correções
- `sync-rest.js`: detecção PGRST204 → recordar coluna → strip → retry (até 2 colunas).
- `movimentos`: nunca `cliente_id`; R50 só se a coluna não estiver na lista de ausentes.
- `bpRetryFailedSync`: limpa `failed` + `attempts` + `nextRetry` e faz flush.
- Evento `online` + `visibilitychange` + intervalo 25s com rede e fila não vazia.
- Toque no indicador: feedback se ficou vazio ou ainda há restantes.

### UI
- Detalhe Caixa: hierarquia tipográfica, badge pagamento, grelha itens, botões 40px.
- Confirmar venda: mesmo idioma visual do detalhe (resumo em ficha), sem Cancelar venda.

### SQL (se ainda não aplicado)
Executar `SUPABASE_R50_E_CLIENTES.sql` no Supabase para colunas de cancelamento.

## Regra obrigatória — Fila de sincronização (dados)

**Nunca descartar operações de sync por teto de tentativas de rede.**  
Cada `upsert`/`delete` enfileirado permanece na fila até sucesso remoto (ou rejeição lógica explícita: duplicado, limite de plano).  
Backoff (máx. 60 s) só protege a rede; **não** implica perda de dados.  
Flush automático: evento `online`, regresso ao foreground, intervalo 25 s.  

Implementação: `sync-queue.js` → `flushSyncQueue` (sem `MAX_ATTEMPTS` a marcar falha de rede).

## Etapa 1 Resumo — 13 / 14 / 16

| Ponto | Correção | Ficheiros |
|-------|----------|-----------|
| 13 | De/Até/Aplicar mais compactos (28px) | `plano-filtros-grafico.css` |
| 14 | Histórico do modal faturamento usa `getIntervaloDashAtual()`; fotos cliente; valor sem empilhar | `detalhes-acessibilidade.js`, `kpis-caixa-listas.css` |
| 16 | “Próximos atendimentos” tipografia mais discreta | `kpis-caixa-listas.css` |

Lógica do filtro de período do dashboard **não** alterada.

### Varredura Etapa 1 (pós-implementação)
- Modal faturamento: excluídos movimentos `cancelado` (alinhado aos KPIs).
- Fila: `LIMITE_PLANO_ATINGIDO` deixa de remover a op da fila (backoff + retenção).
- Total do modal: barra flex `nowrap` + `tabular-nums` anti-quebra.

## Etapa 2 Resumo — gráfico (18)
- Dia (intervalo 1 dia): série **por hora** (evita 1 barra única).
- `state.chartPeriodo` alinhado a `dashPeriodo` ao mudar o filtro do topo.
- Popover de período `position:fixed` ancorado ao ícone (`_bpPlacePeriodoSheetNear`).
- Ficheiros: `chart-module.js`, `ui-render-dashboard-agenda.js`, `plano-filtros-grafico.css`.

### Varredura Etapa 2
- Popover: `chart-filter-toggle` usa `_bpPlacePeriodoSheetNear` (sem posição divergente).
- Clique fora: ignora ícone KPI e toggle do gráfico.
- Insights já ocultos sem dados (sem alteração extra).

## Etapa 3 — Cabeçalho / boot / sync UX
- Overlay bloqueante com spinner (15s) → mensagem + Tentar novamente / Continuar offline.
- Nome do salão: sem texto «Carregando...»; header alinhado.
- Modal agendamentos (KPI): filtra pelo **mesmo intervalo** dos KPIs (`getIntervaloDashAtual`).
- Popover de período: `position:fixed` e **acompanha scroll** do âncora (ícone/filtro).

### Varredura completa etapas 1–3
- Auth pull: falha rápida → `bpBootShowFail` (não só aos 15s).
- Offline durante boot → fecha overlay.
- Tombstone na fila: upsert de id eliminado sai da fila de forma explícita.
- Intervalos inicio>fim corrigidos nos modais KPI.

### Fix overlay boot (visível)
Causa: o spinner só era chamado no ramo `carregarDoSupabase`, mas o arranque usa **`bpSilentPull`**.  
Correcção: overlay envolve `bpSilentPull` / `carregarDoSupabase` nos dois caminhos de boot online.

### Fix timing overlay boot
- Abre no `DOMContentLoaded` (se online + salão em cache) e no início de `checkSession`.
- Removido `setTimeout(300/400)` antes do pull.
- Fecha só após `bpSilentPull` / falha / Continuar offline / ir para login.
