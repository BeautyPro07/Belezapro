#!/usr/bin/env node
/**
 * Concatena os módulos JS na ordem de dependências → app.bundle.js
 * Uso: node build-bundle.js
 * (Passo intermédio antes de Vite/ESM completo)
 *
 * Ordem (Fase 1.4):
 *   1. Core + UI + eventos + main
 *   2. Features de domínio (finance → ops → equipa → gestão → marketing)
 *   3. UI polish (menu, avatars, media, agenda, desktop)
 *   4. Security / sync hardening (último)
 *
 * Fora do bundle (correcto):
 *   - sw.js / sw.template.js (Service Worker)
 *   - app-entry.js (entrada ESM futura — type=module)
 *   - build-bundle.js / build.js (tooling)
 */
const fs = require('fs');
const path = require('path');

const ORDER = [
  // --- Core ---
  'core-constants.js',
  'core-utils.js',
  'tests-pure.js',
  'core-state.js',
  'core-store.js',
  'db-indexeddb.js',
  'auth-supabase.js',
  'supabase-resilience.js',
  'sync-queue.js',
  'sync-rest.js',
  'plano-limites.js',
  'crud-operations.js',
  // --- UI render + fluxos ---
  'ui-render-dashboard-agenda.js',
  'ui-render-clientes-caixa-equipa.js',
  'analise-temporal.js',
  'chart-module.js',
  'vendas-modais.js',
  'detalhes-acessibilidade.js',
  'ui-events-navegacao.js',
  'eventos-cadastros.js',
  'eventos-caixa-vendas.js',
  'eventos-globais.js',
  'ia-module.js',
  'expirar-agendamento.js',
  'main.js',
  // --- Features domínio (deps: state, crud, utils) ---
  'finance-comissoes.js',       // helpers comissão/meta
  'finance-fase1-extra.js',     // BPFinance · usa cartItems (vendas-modais)
  'ops-crm-comercial.js',       // BPOps · antes de gestão
  'equipa-fase3.js',            // BPEquipa · antes de gestão
  'gestao-fase78.js',           // BPGestao · usa BPOps + BPEquipa
  'marketing-fase2.js',         // BPMarketing
  // --- UI polish / media ---
  'menu-accordion.js',
  'avatars-realistas.js',       // BPAvatars · antes de media/listas
  'media-galeria.js',           // BPMedia · usa BPAvatars
  'agenda-polish.js',           // patches renderAgendaItem
  'avatars-listas.js',          // wraps renderClientes/Profissionais
  'desktop-shell.js',
  'desktop-enterprise.js',           // shell ≥1024px
  // --- Hardening (último) ---
  'security-hardening.js',
];

const root = __dirname;
let out = '/* BeautyPro app.bundle.js — gerado por build-bundle.js; ordem de dependências explícita */\n"use strict";\n';
const missing = [];
for (const fn of ORDER) {
  const fp = path.join(root, fn);
  if (!fs.existsSync(fp)) {
    missing.push(fn);
    continue;
  }
  const src = fs.readFileSync(fp, 'utf8');
  out += `\n/* ===== FILE: ${fn} ===== */\n` + src + (src.endsWith('\n') ? '' : '\n');
}
if (missing.length) {
  console.error('Ficheiros em falta no ORDER:', missing.join(', '));
  process.exit(1);
}
fs.writeFileSync(path.join(root, 'app.bundle.js'), out);
console.log('Wrote app.bundle.js', out.length, 'chars,', ORDER.length, 'modules');
