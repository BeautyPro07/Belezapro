# CHANGELOG — Correções (flash login, countdown, Visto, boot overlay)

## 1. Flash de login
- Gate CSS no `<head>`: `html.bp-has-session #login-view { display:none !important }`
- Script síncrono: `bp-has-session` + `bp-booting` antes do paint
- `main.js`: removido `login-view.style.display = 'flex'` forçado no arranque
- CSS extra: sobrescreve `.view.active` no login com sessão

## 2. Countdown
- `bpUpdateExpiryMessage`: frase completa a cada 1s
- Nome em `--gold-dark`; tempo em `--red`

## 3. Visto
- Botão `#expirar-visto` label "Visto" (mesmo comportamento que Ignorar)

## 4. Ordem botões
- WhatsApp → Ligar → Visto

## 5. Overlay boot
- `finally` após `checkSession` remove `bp-booting` e chama `bpHideBootOverlay`
- Safety 20s mantido
- Offline fecha após dados locais (auth)


## 2026-08-13 — Flash definitivo + modal texto/animação

### Causa do flash
Gate CSS/script estavam **depois** dos `<link>` e do CDN Supabase. O parser bloqueava no CDN; o gate corria tarde demais relativamente ao paint com CSS `.view.active { display:flex }`.

### Correção
- Gate script+CSS como **primeiro** conteúdo de `<head>`
- Selectors cobrem `#login-view.view.active` com `!important`
- Offline/position off-screen extra

### Modal
- Título: `Atenção: perdendo um cliente`
- Mensagem: "...marcado como não realizado em {tempo}. Entre em contacto... ou combinar um novo horário com a cliente."
- Ondas no ícone Ligar (`.bp-call-anim`) quando há telefone
