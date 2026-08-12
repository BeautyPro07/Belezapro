# CHANGELOG — Etapa 2: Alerta de expiração de agendamento

**Data:** 2026-08-12

## Funcionalidade

Alerta proativo 5 minutos antes de um agendamento com status `agendado` expirar.

## Comportamento

- Verificação a cada 30s (`bpCheckExpiringAppointments`)
- Modal `#modal-expirar`: Ligar / WhatsApp / Ignorar
- `bp_alert_visto_{id}` em localStorage ao Ignorar
- Reset do visto em `updateAgendamento` se data/hora mudarem
- Offline-first (dados locais)
- SVG apenas (sem emoji)

## Ficheiros

- `expirar-agendamento.js` (novo)
- `index.html` — modal
- `crud-operations.js` — reset visto
- `ui-render-dashboard-agenda.js` — check após render agenda
- `main.js` — `bpStartExpiringWatcher`
- `design-system-final.css` — estilos
- `build-bundle.js` — ordem de módulos
- `app.bundle.js` / `sw.js`

## Varredura (2026-08-12)

Correções pós-auditoria:

- `_bpExpiringBusy` efectivamente usado (release após rAF).
- Não abrir o alerta se a app estiver no login ou se outro modal estiver aberto.
- Revalidar agendamento enquanto o modal está aberto (fecha se status/hora deixarem de ser válidos).
- Bind dos botões com `dataset.bpBound` para evitar listeners duplicados.
- Telefone: normalização para `wa.me` e desactivação real (`disabled` + `aria-disabled`).
