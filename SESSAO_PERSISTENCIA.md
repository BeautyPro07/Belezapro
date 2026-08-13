# Sessão e persistência BeautyPro

## Referências
- OWASP Session Management Cheat Sheet
- OWASP ASVS V3 Session Management
- NIST SP 800-63B (session cookies / timeouts)
- MDN Session management
- Offline-first: IndexedDB outbox (PWA patterns / Firebase local persistence)

## 3 soluções unificadas aplicadas

### S1 — Identidade de sessão local com integridade (flags + meta JSON)
- `bp_session_active` + `bp_salao_id_cache` (gate de paint no `<head>`)
- `bp_session_meta` dual-write (localStorage + sessionStorage)
- `bp_logged_out` como kill-switch explícito (logout voluntário)

### S2 — Persistência de negócio offline-first
- IndexedDB primário (`db-indexeddb.js`)
- Mirror `bp_*` em localStorage para private mode / quota
- Fila `bp_sync_queue` (outbox) + DLQ
- `bpProbePersistence()` no boot

### S3 — Ciclo de vida alinhado ao servidor (Supabase JWT)
- Tokens geridos pelo cliente Supabase (storage do SDK)
- `bpTouchSessionLocal` em TOKEN_REFRESHED / SIGNED_IN
- SIGNED_OUT offline **não** expulsa se `bpHasLocalSession()`
- Logout voluntário chama `bpClearSessionLocal`

## Mapeamento das 6 falhas de sequência

| # | Falha | Mitigação aplicada |
|---|--------|-------------------|
| 1 | Flags de sessão ausentes | `bpMarkSessionLocal` + meta recovery no gate |
| 2 | localStorage falha | Dual-write sessionStorage + mirrors IDB |
| 3 | CSS/script gate | Classe `bp-has-session` + `!important` |
| 4 | Flash login antes do bundle | Script síncrono no `<head>` |
| 5 | SIGNED_OUT offline | Ignorado se sessão local válida |
| 6 | Overlay fecha cedo | Classe mantém login oculto até shell estável |
