# BeautyPro — Relatório das últimas implementações (fotos / estabilidade)

## 1. CSP + compressão + Storage + sync tolerante
- CSP: `img-src` com `data:`, `blob:` e host Supabase
- Compressão: createImageBitmap → FileReader → blob (fallback)
- Upload Supabase Storage (bucket `fotos`); campo `foto_url` no sync
- Sync REST: retry sem `foto_url` se a coluna ainda não existir (não parte clientes/profissionais)
- SQL: `SUPABASE_FOTOS.sql` (colunas + bucket + RLS)

## 2. UI não bloqueada no upload + plano em cache
- Gravação local imediata; upload em background com timeout (~12s)
- Toast deixa de ficar preso em “otimizar”
- Plano: cache `bp_plano_cache` + default no boot (reduz flash trial→premium)

## 3. Isolamento de imagens (anti-vazamento entre registos)
- Após `await`, só actualiza preview se o modal for a mesma entidade (`stillClienteContext` / `stillProfContext`)
- Preview com `data-foto-for={id}`
- Listas: avatar só se `entity id` + `src` coincidirem; actualiza se a foto mudou
- Removido `setInterval` que injectava avatar por nome no modal (causa de leak visual)
- Toast: reflow forçado para feedback imediato

## 4. Desempenho das fotos (esta entrega)
- Avatar: 160px, JPEG ~0,62 (mais leve)
- Após `foto_url` remoto: remove base64 local (`foto: null`) → menos IDB/memória
- `patchRowAvatar`: actualiza só a linha, sem `renderClientes`/`renderProfissionais` completo
- Galeria: thumb 240px local; original 720px só no upload; com URL remota não guarda data URL no localStorage
- Grid da galeria usa `url || thumb`

## Ficheiros principais neste zip
`app.bundle.js`, `media-galeria.js`, `avatars-listas.js`, `core-utils.js`, `core-state.js`, `sync-rest.js`, `index.html`, `SUPABASE_FOTOS.sql`, + módulos de suporte já alinhados

## Supabase (obrigatório para multi-dispositivo)
Executar `SUPABASE_FOTOS.sql` no SQL Editor (coluna `foto_url` + bucket `fotos` + policies).
