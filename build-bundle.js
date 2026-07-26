#!/usr/bin/env node
/**
 * Concatena os módulos JS na ordem de dependências → app.bundle.js
 * Uso: node build-bundle.js
 * (Passo intermédio antes de Vite/ESM completo)
 */
const fs = require('fs');
const path = require('path');
const ORDER = ['core-constants.js', 'core-utils.js', 'tests-pure.js', 'core-state.js', 'core-store.js', 'db-indexeddb.js', 'auth-supabase.js', 'sync-queue.js', 'sync-rest.js', 'plano-limites.js', 'crud-operations.js', 'ui-render-dashboard-agenda.js', 'ui-render-clientes-caixa-equipa.js', 'chart-module.js', 'vendas-modais.js', 'detalhes-acessibilidade.js', 'ui-events-navegacao.js', 'eventos-cadastros.js', 'eventos-caixa-vendas.js', 'eventos-globais.js', 'ia-module.js', 'main.js'];
const root = __dirname;
let out = '/* BeautyPro app.bundle.js — gerado por build-bundle.js */\n"use strict";\n';
for (const fn of ORDER) {
  const src = fs.readFileSync(path.join(root, fn), 'utf8');
  out += `\n/* ===== FILE: ${fn} ===== */\n` + src + (src.endsWith('\n') ? '' : '\n');
}
fs.writeFileSync(path.join(root, 'app.bundle.js'), out);
console.log('Wrote app.bundle.js', out.length, 'chars');
