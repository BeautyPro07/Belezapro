/* BeautyPro app.bundle.js — gerado por build-bundle.js; ordem de dependências explícita */
"use strict";

/* ===== FILE: core-constants.js ===== */

// ====================================================================
//  CORE — CONSTANTES (extraído do app.js na Fase A da modularização)
// ====================================================================
const SUPABASE_URL      = 'https://xbudnftutemakjbgxayf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhidWRuZnR1dGVtYWtqYmd4YXlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3NDI1OTMsImV4cCI6MjA5ODMxODU5M30.wJekXdH7z9qcIoF4WsvWST8ro9VsskLGQgcivNx6fYo';

const WHATSAPP_NUMBER   = '953980750';
const IA_EDGE_URL = SUPABASE_URL + '/functions/v1/ia-query';

const STORE_TO_TABLE = {
  clientes:      'clientes',
  agendamentos:  'agendamentos',
  movimentos:    'movimentos',
  profissionais: 'profissionais',
  servicos:      'servicos',
  fechos_caixa:  'fechos_caixa',   // ← ADICIONADO
  config:        null,
};

const SYNC_QUEUE_KEY = 'bp_sync_queue';

const PLANOS = {
  trial: { label: 'Plano Gratuito', badgeClass: 'plano-trial', agendamentos: 60, clientes: 30, profissionais: 1,
    iaDia: 0 },
  starter: { label: 'Starter', badgeClass: 'plano-starter', agendamentos: 200, clientes: 150, profissionais: 2,
    iaDia: 0 },
  pro: { label: 'Pro', badgeClass: 'plano-pro', agendamentos: Infinity, clientes: Infinity, profissionais: 8,
    iaDia: 5 },
  premium: { label: 'Premium', badgeClass: 'plano-premium', agendamentos: Infinity, clientes: Infinity,
    profissionais: Infinity, iaDia: Infinity }
};

const PROF_DEFAULT = [
  { id: '34787d59-2187-4953-978c-16cd85813f22', nome: 'Ana', especialidade: 'Coloração' },
  { id: '33ea5d65-c6ba-4be0-a5e0-037052eb1950', nome: 'Carlos', especialidade: 'Corte' },
  { id: '61ec734c-1177-465a-8613-437c4ad5c9b2', nome: 'Marta', especialidade: 'Manicure / Pedicure' },
];

const SERVICOS_DEFAULT = [
  { id: '5334ca54-26e8-43ce-a606-59a424522517', nome: 'Corte de Cabelo', precoBase: 3000, profissionais: ['Ana', 'Carlos'] },
  { id: '1c07da53-9b30-4e6e-b007-b2bc654183ce', nome: 'Coloração', precoBase: 8000, profissionais: ['Ana'] },
  { id: '10497abb-032a-491f-ad1c-ae3d654b37b1', nome: 'Manicure', precoBase: 2000, profissionais: ['Marta'] },
  { id: '4aea339f-bc33-4cfa-8fa8-2243de16b4c3', nome: 'Pedicure', precoBase: 2500, profissionais: ['Marta'] },
  { id: 'a831b14c-f915-46e0-b7a6-f6eea4d8e2bc', nome: 'Maquilhagem', precoBase: 5000, profissionais: ['Ana'] },
  { id: '700ca860-bcf9-4b33-823d-15b92ef132f0', nome: 'Barba', precoBase: 1500, profissionais: ['Carlos'] },
  { id: '7547642b-eeaf-4110-b046-da80b30bf0ba', nome: 'Penteado', precoBase: 4000, profissionais: ['Ana', 'Marta'] },
  { id: '1a81fd9a-8778-44a5-bd3e-11b3a261e1ce', nome: 'Tratamento Capilar', precoBase: 6000, profissionais: ['Ana', 'Carlos'] },
];

const RBAC_ROLES = ['admin', 'gerente', 'operador'];



/* ===== FILE: core-utils.js ===== */

// ====================================================================
//  CORE — UTILITÁRIOS (extraído do app.js na Fase A da modularização)
// ====================================================================
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)));
let reciboCounter = parseInt(localStorage.getItem('bp_recibo_counter') || '0', 10);

function nextReciboNum() {
  // Contador local por salão (evita colisão entre salões no mesmo dispositivo).
  // Unicidade multi-dispositivo requer sequência no Supabase (ver GUIA).
  const salaoKey = (typeof state !== 'undefined' && state.config && state.config.salaoId)
    ? String(state.config.salaoId).slice(0, 8)
    : 'local';
  const storageKey = 'bp_recibo_counter_' + salaoKey;
  let n = parseInt(localStorage.getItem(storageKey) || localStorage.getItem('bp_recibo_counter') || '0', 10);
  n++;
  localStorage.setItem(storageKey, String(n));
  reciboCounter = n;
  const prefix = salaoKey !== 'local' ? salaoKey.slice(-4).toUpperCase() + '-' : '';
  return prefix + String(n).padStart(4, '0');
}

function hoje() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

const horaAgora = () => new Date().toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' });

const fmtKz = v => {
  const n = Math.round(Number(v) || 0);
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' Kz';
};

const escHtml = s => String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;',
  "'": '&#39;' })[m] || m);

/** Log de erros não críticos (fila sync, localStorage). Nunca lança. */
function logErroSilencioso(contexto, err) {
  try {
    const msg = (err && (err.message || String(err))) || 'erro desconhecido';
    console.warn('[BeautyPro]', contexto + ':', msg);
  } catch (_) {}
}



let toastTimer;

function toast(msg, type) {
  const el = document.getElementById('toast');
  if (!el) return;
  const icons = { success: '', error: '', warning: '' };
  el.textContent = (icons[type] || '') + msg;
  el.className = 'toast' + (type ? ' ' + type : '');
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

function animateKpi(id, txt) {
  const el = document.getElementById(id);
  if (!el) { return; }
  if (el.textContent === txt) { return; }
  el.textContent = txt;
  el.classList.remove('kpi-pulse');
  void el.offsetWidth;
  el.classList.add('kpi-pulse');
  setTimeout(() => el.classList.remove('kpi-pulse'), 500);
}

function addRipple(el, e) {
  // Efeito de toque desativado a pedido — feedback visual agora é
  // só a opacidade discreta definida em :active (ver CSS).
  return;
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}

function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('open');
}

function setButtonLoading(button, isLoading) {
  if (!button) return;
  if (isLoading) { button.classList.add('is-loading');
    button.disabled = true; } else { button.classList.remove('is-loading');
    button.disabled = false; }
}

// ====================================================================
//  MODAL DE CONFIRMAÇÃO CENTRADO (Fase 1)
// ====================================================================
function showConfirmModal(title, message, danger = true) {
  return new Promise((resolve) => {
    const overlay = document.getElementById('modal-confirm');
    const titleEl = document.getElementById('confirm-title');
    const msgEl = document.getElementById('confirm-message');
    const okBtn = document.getElementById('confirm-ok-btn');
    const cancelBtn = document.getElementById('confirm-cancel-btn');
    if (!overlay || !titleEl || !msgEl || !okBtn || !cancelBtn) { resolve(confirm(message || title)); return; }
    titleEl.textContent = title || 'Tem a certeza?';
    msgEl.textContent = message || 'Esta acção não pode ser desfeita.';
    if (danger) { okBtn.className = 'btn btn-danger';
      okBtn.textContent = 'Confirmar'; } else { okBtn.className = 'btn btn-primary';
      okBtn.textContent = 'Sim'; }
    const newOk = () => { closeModal('modal-confirm');
      resolve(true); };
    const newCancel = () => { closeModal('modal-confirm');
      resolve(false); };
    okBtn.onclick = newOk;
    cancelBtn.onclick = newCancel;
    overlay.onclick = (e) => { if (e.target === overlay) { closeModal('modal-confirm');
        resolve(false); } };
    openModal('modal-confirm');
    setTimeout(() => { cancelBtn.focus(); }, 150);
  });
}

// ====================================================================
//  MODAL DE ERRO (Fase 7)
// ====================================================================
function mostrarErro(mensagem, acaoTentar = null) {
  const modal = document.getElementById('modal-erro');
  const msgEl = document.getElementById('erro-message');
  const tentarBtn = document.getElementById('erro-tentar-btn');
  const cancelarBtn = document.getElementById('erro-cancelar-btn');
  if (!modal) return;
  msgEl.textContent = mensagem || 'Ocorreu um erro ao processar a operação. Tente novamente.';
  const newTentar = () => { closeModal('modal-erro'); if (typeof acaoTentar === 'function') acaoTentar(); };
  const newCancelar = () => { closeModal('modal-erro'); };
  tentarBtn.onclick = newTentar;
  cancelarBtn.onclick = newCancelar;
  modal.onclick = (e) => { if (e.target === modal) closeModal('modal-erro'); };
  openModal('modal-erro');
}


/** Observabilidade cliente: contexto estruturado para debug (P2) */
function logContexto(acao, extra) {
  try {
    const ctx = {
      acao,
      tab: (typeof activeTab !== 'undefined' ? activeTab : null),
      salao: (state && state.config && state.config.salaoId) ? String(state.config.salaoId).slice(0, 8) : null,
      online: navigator.onLine,
      ts: new Date().toISOString(),
      ...(extra || {})
    };
    console.info('[BeautyPro:ctx]', ctx);
    return ctx;
  } catch (_) { return null; }
}

function reportarErro(acao, err, extra) {
  try {
    const msg = err && (err.message || String(err));
    logContexto(acao, { nivel: 'error', erro: msg, ...(extra || {}) });
    console.error('[BeautyPro]', acao, err);
  } catch (_) {}
}

/**
 * Armazenamento com ofuscação básica (P2). Não substitui RLS nem HTTPS.
 * Protege leitura casual de extensão; não é criptografia forte.
 */
function storageSetSecure(key, value) {
  try {
    const raw = typeof value === 'string' ? value : JSON.stringify(value);
    const encoded = btoa(unescape(encodeURIComponent(raw)));
    localStorage.setItem(key, 'bp1:' + encoded);
  } catch (e) {
    try { localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value)); } catch (_) {}
  }
}
function storageGetSecure(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    if (v == null) return fallback;
    if (v.startsWith('bp1:')) {
      return decodeURIComponent(escape(atob(v.slice(4))));
    }
    return v;
  } catch (_) {
    return fallback;
  }
}


/* ===== FILE: tests-pure.js ===== */

/**
 * Testes unitários das funções puras — executar no browser:
 *   window.runPureTests()
 * ou: node-less via inclusão em index só em ?test=1
 */
function runPureTests() {
  const results = [];
  const assert = (name, cond) => {
    results.push({ name, ok: !!cond });
    if (!cond) console.error('FAIL', name);
    else console.info('OK', name);
  };

  // escHtml
  if (typeof escHtml === 'function') {
    assert('escHtml escapes <', escHtml('<script>') === '&lt;script&gt;');
    assert('escHtml escapes &', escHtml('a&b') === 'a&amp;b');
    assert('escHtml escapes quote', escHtml('"x"').includes('&quot;'));
  } else {
    assert('escHtml exists', false);
  }

  // fmtKz
  if (typeof fmtKz === 'function') {
    assert('fmtKz 1000', fmtKz(1000).includes('1.000'));
    assert('fmtKz 0', fmtKz(0).includes('0'));
  }

  // uuid shape
  if (typeof uuid === 'function') {
    const id = uuid();
    assert('uuid length', id && id.length >= 32);
  }

  // hoje ISO date
  if (typeof hoje === 'function') {
    assert('hoje format', /^\d{4}-\d{2}-\d{2}$/.test(hoje()));
  }

  // nextReciboNum increments
  if (typeof nextReciboNum === 'function') {
    const a = nextReciboNum();
    const b = nextReciboNum();
    assert('recibo increments', a !== b);
  }

  const failed = results.filter(r => !r.ok).length;
  console.info('[PureTests] ' + (results.length - failed) + '/' + results.length + ' passou');
  return { total: results.length, failed, results };
}

window.runPureTests = runPureTests;


/* ===== FILE: core-state.js ===== */

// ====================================================================
//  CORE — ESTADO GLOBAL (extraído do app.js na Fase B da modularização)
//  Fase D: integrado com core-store.js (subscribe / setState / batch)
// ====================================================================
let state = {
  config: {
    storeName: 'Glamour Beauty',
    fundo: 0,
    plano: 'trial',
    trialInicio: null,
    salaoId: null,
    userRole: null,
    userId: null,
  },
  clientes: [],
  agendamentos: [],
  movimentos: [],
  profissionais: [],
  servicos: [],
  fechos_caixa: [],
  agendaDataAtual: (typeof hoje === 'function' ? hoje() : new Date().toISOString().slice(0, 10)),
  histPeriodo: 'hoje',
  // NOTA: o carrinho de vendas vive em cartItems (vendas-modais.js) + localStorage.
  // A chave "carrinho" foi removida para eliminar estado morto/duplicado.
  filtroClientes: 'todos',
  chartPeriodo: 'semana',
  chartOffset: 0,
  chartMostrarValores: false,

  // Filtro do Dashboard
  dashPeriodo: localStorage.getItem('bp_dash_periodo') || 'dia',
  dashOffset: parseInt(localStorage.getItem('bp_dash_offset')) || 0,
  dashCustomInicio: localStorage.getItem('bp_dash_custom_inicio') || null,
  dashCustomFim: localStorage.getItem('bp_dash_custom_fim') || null,
};

// Restaura a última aba visitada neste dispositivo
let activeTab = localStorage.getItem('bp_active_tab') || 'dashboard';


/* ===== FILE: core-store.js ===== */

// ====================================================================
//  CORE — STORE SIMPLES (Fase D — Evolução Arquitectural)
//  Padrão mínimo de gerenciamento de estado com subscribe/setState.
//  Mantém 100% de compatibilidade com o `state` global existente.
//  Não quebra nenhum código que leia/escreva em `state` directamente.
// ====================================================================

const _listeners = new Set();
let _batchDepth = 0;
let _pendingNotify = false;

/**
 * Notifica todos os subscribers (com batching simples).
 */
function _notify() {
  if (_batchDepth > 0) {
    _pendingNotify = true;
    return;
  }
  _pendingNotify = false;
  _listeners.forEach(fn => {
    try { fn(state); } catch (e) { console.warn('[Store] listener error:', e); }
  });
}

/**
 * Executa várias mutações e notifica só no final.
 */
function batch(fn) {
  _batchDepth++;
  try {
    fn();
  } finally {
    _batchDepth--;
    if (_batchDepth === 0 && _pendingNotify) _notify();
  }
}

/**
 * Substitui parcialmente o estado e notifica.
 * Uso: setState({ clientes: novosClientes }) ou setState(s => ({ ... }))
 */
function setState(partialOrFn) {
  const partial = typeof partialOrFn === 'function' ? partialOrFn(state) : partialOrFn;
  if (!partial || typeof partial !== 'object') return;
  Object.keys(partial).forEach(key => {
    state[key] = partial[key];
  });
  _notify();
}

/**
 * Atualiza uma chave aninhada de config de forma segura.
 */
function setConfig(partial) {
  state.config = { ...state.config, ...partial };
  _notify();
}

/**
 * Substitui uma lista inteira (clientes, agendamentos, etc.) e notifica.
 */
function setList(nomeLista, novaLista) {
  if (!Array.isArray(novaLista)) return;
  state[nomeLista] = novaLista;
  _notify();
}

/**
 * Adiciona item a uma lista e notifica.
 */
function pushToList(nomeLista, item) {
  if (!Array.isArray(state[nomeLista])) state[nomeLista] = [];
  state[nomeLista].push(item);
  _notify();
}

/**
 * Remove item de uma lista por id e notifica.
 */
function removeFromList(nomeLista, id) {
  if (!Array.isArray(state[nomeLista])) return;
  state[nomeLista] = state[nomeLista].filter(item => item.id !== id);
  _notify();
}

/**
 * Atualiza um item dentro de uma lista por id.
 */
function updateInList(nomeLista, id, data) {
  if (!Array.isArray(state[nomeLista])) return;
  const idx = state[nomeLista].findIndex(item => item.id === id);
  if (idx === -1) return;
  state[nomeLista][idx] = { ...state[nomeLista][idx], ...data };
  _notify();
}

function getState() {
  return state;
}

function subscribe(listener) {
  if (typeof listener !== 'function') return () => {};
  _listeners.add(listener);
  return () => _listeners.delete(listener);
}

// Expor globalmente para compatibilidade e uso futuro
window.BeautyStore = {
  getState,
  setState,
  setConfig,
  setList,
  pushToList,
  removeFromList,
  updateInList,
  subscribe,
  batch,
};


/* ===== FILE: db-indexeddb.js ===== */

// ====================================================================
//  DB — INDEXEDDB + FALLBACK LOCALSTORAGE (extraído do app.js na Fase B
//  da modularização)
// ====================================================================
let db = null;
const STORES = ['config', 'clientes', 'agendamentos', 'movimentos', 'profissionais', 'servicos', 'fechos_caixa'];

function openDB() {
  return new Promise((res, rej) => {
    try {
      const req = indexedDB.open('BelezaProDB', 8);
      req.onupgradeneeded = e => {
        const d = e.target.result;
        STORES.forEach(s => { if (!d.objectStoreNames.contains(s)) d.createObjectStore(s, { keyPath: 'id' }); });
      };
      req.onsuccess = e => { db = e.target.result;
        res(db); };
      req.onerror = e => rej(e.target.error);
    } catch (err) { rej(err); }
  });
}

async function dbGetAll(store) {
  try {
    if (db) {
      const tx = db.transaction(store, 'readonly');
      const r = tx.objectStore(store).getAll();
      return await new Promise((res, rej) => { r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error); });
    }
  } catch (e) { /* cai no fallback abaixo */ }
  try { const d = localStorage.getItem('bp_' + store); return d ? JSON.parse(d) : []; } catch (e) { return []; }
}

let dbPut = async function(store, item) {
  if (!item.id) item.id = uuid();
  item.updated_at = new Date().toISOString(); // sempre gera novo timestamp na escrita local
  try {
    if (db) {
      const tx = db.transaction(store, 'readwrite');
      const r = tx.objectStore(store).put(item);
      await new Promise((res, rej) => { r.onsuccess = res;
        r.onerror = rej; });
      return item;
    }
  } catch (e) {}
  try {
    const items = await dbGetAll(store);
    const idx = items.findIndex(i => i.id === item.id);
    if (idx !== -1) items[idx] = item;
    else items.push(item);
    localStorage.setItem('bp_' + store, JSON.stringify(items));
    return item;
  } catch (e) { return item; }
};
// Função de escrita local pura (NUNCA dispara sync)
async function dbPutLocal(store, item) {
  if (!item.id) item.id = uuid();
  // Só gera timestamp se não existir (preserva o vindo do servidor)
  if (!item.updated_at) {
    item.updated_at = new Date().toISOString();
  }
  try {
    if (db) {
      const tx = db.transaction(store, 'readwrite');
      const r = tx.objectStore(store).put(item);
      await new Promise((res, rej) => { r.onsuccess = res; r.onerror = rej; });
      return item;
    }
  } catch (e) { /* silencioso, fallback para localStorage */ }
  try {
    const items = await dbGetAll(store);
    const idx = items.findIndex(i => i.id === item.id);
    if (idx !== -1) items[idx] = item;
    else items.push(item);
    localStorage.setItem('bp_' + store, JSON.stringify(items));
    return item;
  } catch (e) { return item; }
}

let dbDelete = async function(store, id) {
  try {
    if (db) {
      const tx = db.transaction(store, 'readwrite');
      const r = tx.objectStore(store).delete(id);
      await new Promise((res, rej) => { r.onsuccess = res;
        r.onerror = rej; });
      return;
    }
  } catch (e) {}
  try {
    const items = await dbGetAll(store);
    localStorage.setItem('bp_' + store, JSON.stringify(items.filter(i => i.id !== id)));
  } catch (e) {}
};

async function dbClear(store) {
  try {
    if (db) {
      const tx = db.transaction(store, 'readwrite');
      await new Promise((res, rej) => { const r = tx.objectStore(store).clear();
        r.onsuccess = res; r.onerror = rej; });
      return;
    }
  } catch (e) {}
  try { localStorage.removeItem('bp_' + store); } catch (e) {}
}



/* ===== FILE: auth-supabase.js ===== */

// ====================================================================
//  SUPABASE — CONFIGURAÇÃO (SUPABASE_URL/ANON_KEY movidas para core-constants.js)
//  (extraído do app.js na Fase B da modularização)
// ====================================================================
const { createClient } = supabase; // supabase global from CDN
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ====================================================================
//  SUPABASE AUTH — LOGIN E SESSÃO
// ====================================================================
// ====================================================================
//  ITEM 3.1 — Escuta activa de alterações de estado de autenticação
//  Reage a expiração/revogação de sessão em tempo real, não apenas
//  no arranque. Distingue explicitamente de um logout voluntário
//  (que já dispara o seu próprio toast no handler do botão "Sair").
// ====================================================================
let logoutVoluntarioEmCurso = false;
supabaseClient.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' && !logoutVoluntarioEmCurso) {
    // Sessão perdida sem ter sido o utilizador a pedir — expirou ou foi revogada.
    document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
    document.getElementById('app-view').style.display = 'none';
    document.getElementById('login-view').style.display = 'flex';
    toast('A sua sessão expirou. Inicie sessão novamente.', 'error');
  }
  logoutVoluntarioEmCurso = false;
});

/** Timeout de rede no boot — nunca bloquear a UI offline-first. */
function bpWithTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT_' + (label || 'op'))), ms))
  ]);
}

function bpHideSplashNow() {
  try {
    const splash = document.getElementById('splash-screen');
    if (splash && splash.style.display !== 'none') {
      splash.style.opacity = '0';
      setTimeout(function () { splash.style.display = 'none'; }, 280);
    }
  } catch (_) {}
}

async function bpLoadSalaoIdLocal() {
  try {
    if (typeof dbGetAll !== 'function') return null;
    const configs = await dbGetAll('config');
    const row = (configs || []).find(c => c.key === 'salaoId' || c.id === 'salaoId');
    return row && row.value ? row.value : null;
  } catch (_) { return null; }
}

/**
 * Boot offline-first:
 * 1) Sessão local com timeout curto
 * 2) Abrir app com dados IndexedDB
 * 3) Rede (perfil/config/pull) em background — sem bloquear
 */
async function checkSession() {
  try {
    let session = null;
    try {
      const res = await bpWithTimeout(
        supabaseClient.auth.getSession(),
        2500,
        'getSession'
      );
      session = res && res.data ? res.data.session : null;
    } catch (e) {
      console.warn('[boot] getSession timeout/offline — a usar cache local', e && e.message);
      session = null;
      try {
        const { data } = await supabaseClient.auth.getSession();
        session = data && data.session;
      } catch (_) {}
    }

    // Sem sessão de rede: tentar salão local (último login)
    if (!session) {
      const localSalao = await bpLoadSalaoIdLocal();
      if (localSalao) {
        state.config.salaoId = localSalao;
        document.getElementById('login-view').style.display = 'none';
        document.getElementById('app-view').style.display = 'flex';
        try { await loadState(false); } catch (e) { console.warn('[boot] loadState local', e); }
        if (typeof ativarAbaAtiva === 'function') ativarAbaAtiva();
        if (typeof aplicarPermissoes === 'function') aplicarPermissoes();
        bpHideSplashNow();
        if (typeof atualizarIndicadorSync === 'function') atualizarIndicadorSync();
        // Tentar revalidar sessão em background se online
        if (navigator.onLine) {
          setTimeout(function () {
            if (typeof bpSilentPull === 'function') bpSilentPull(true);
          }, 2000);
        }
        return;
      }
      bpHideSplashNow();
      return; // fica no login
    }

    // Com sessão: mostrar app IMEDIATAMENTE com dados locais
    document.getElementById('login-view').style.display = 'none';
    document.getElementById('app-view').style.display = 'flex';

    let profile = null;
    let profileError = null;
    if (navigator.onLine) {
      try {
        const pr = await bpWithTimeout(
          supabaseClient.from('profiles').select('salao_id, role, nome').eq('user_id', session.user.id).single(),
          3000,
          'profile'
        );
        profile = pr.data;
        profileError = pr.error;
      } catch (e) {
        console.warn('[boot] profile timeout — cache local', e && e.message);
      }
    }

    if (profile && !profileError) {
      state.config.salaoId = profile.salao_id;
      state.config.storeName = profile.nome || state.config.storeName || 'Salão';
      state.config.userRole = profile.role;
      if (typeof saveConfig === 'function') {
        try { await saveConfig(); } catch (_) {}
      }
    } else {
      // Offline ou timeout: usar salão já gravado
      const localSalao = await bpLoadSalaoIdLocal();
      if (localSalao) state.config.salaoId = localSalao;
      if (!state.config.salaoId) {
        toast('Sem dados locais do salão. Conecte-se uma vez para sincronizar.', 'warning');
      }
    }

    let trocouDeSalao = false;
    try {
      if (typeof detetarTrocaDeSalao === 'function' && state.config.salaoId) {
        trocouDeSalao = await detetarTrocaDeSalao(state.config.salaoId);
      }
    } catch (_) {}

    if (typeof aplicarPermissoes === 'function') aplicarPermissoes();

    // Dados locais primeiro (rápido)
    try { await loadState(trocouDeSalao); } catch (e) { console.warn('[boot] loadState', e); }
    if (typeof ativarAbaAtiva === 'function') ativarAbaAtiva();
    bpHideSplashNow();
    if (typeof atualizarIndicadorSync === 'function') atualizarIndicadorSync();

    // Rede em BACKGROUND — não bloqueia abertura
    if (navigator.onLine) {
      setTimeout(function () {
        Promise.resolve()
          .then(function () { return typeof sincronizarConfigDoServidor === 'function' ? sincronizarConfigDoServidor() : null; })
          .then(function () { return typeof bpSilentPull === 'function' ? bpSilentPull(true) : (typeof carregarDoSupabase === 'function' ? carregarDoSupabase() : null); })
          .then(function () {
            if (typeof updateUI === 'function') updateUI();
            if (typeof atualizarIndicadorSync === 'function') atualizarIndicadorSync();
          })
          .catch(function (err) { console.warn('[boot] background sync', err); });
      }, 400);
    }

    if (typeof carregarHistoricoIA === 'function') {
      setTimeout(function () { try { carregarHistoricoIA(); } catch (_) {} }, 1500);
    }
    if (typeof aplicarPermissoes === 'function') aplicarPermissoes();

    if (!localStorage.getItem('bp_onboarding_seen')) {
      const splash = document.getElementById('splash-screen');
      if (splash) {
        splash.style.opacity = '0';
        setTimeout(function () { splash.style.display = 'none'; }, 400);
      }
      const onbEl = document.getElementById('onboarding-screen');
      if (onbEl) {
        onbEl.style.display = 'flex';
        onbEl.style.pointerEvents = 'none';
        setTimeout(function () { onbEl.style.pointerEvents = 'auto'; }, 400);
      }
      if (typeof showOnboardingSlide === 'function') showOnboardingSlide(0);
    }
  } catch (err) {
    console.error('Erro na verificação de sessão:', err);
    if (typeof Sentry !== 'undefined' && Sentry.captureException) {
      Sentry.captureException(err, { tags: { action: 'checkSession' } });
    }
    // Último recurso offline: dados locais
    try {
      const localSalao = await bpLoadSalaoIdLocal();
      if (localSalao) {
        state.config.salaoId = localSalao;
        document.getElementById('login-view').style.display = 'none';
        document.getElementById('app-view').style.display = 'flex';
        await loadState(false);
        if (typeof ativarAbaAtiva === 'function') ativarAbaAtiva();
        bpHideSplashNow();
        return;
      }
    } catch (_) {}
    document.getElementById('login-view').style.display = 'flex';
    document.getElementById('app-view').style.display = 'none';
    bpHideSplashNow();
  }
}

async function getAuthHeaders() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session || !session.access_token) {
    throw new Error('SESSION_EXPIRED');
  }
  return {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${session.access_token}`
  };
}

async function garantirSalaoRemoto() {
  if (!state.config.salaoId) return;
  try {
    const authHeaders = await getAuthHeaders();
    const resp = await fetch(
      `${SUPABASE_URL}/rest/v1/saloes?id=eq.${encodeURIComponent(state.config.salaoId)}`,
      { headers: authHeaders }
    );
    const rows = await resp.json();
    if (rows.length === 0) {
      await fetch(`${SUPABASE_URL}/rest/v1/saloes`, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          ...authHeaders,
          'Prefer':        'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          id:   state.config.salaoId,
          nome: state.config.storeName,
        }),
      });
    }
  } catch (err) {
    if (err.message === 'SESSION_EXPIRED') {
      await supabaseClient.auth.signOut();
      return;
    }
  }
}

async function sincronizarConfigDoServidor() {
  if (!state.config.salaoId || !navigator.onLine) return;
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const accessToken = session?.access_token;
    if (!accessToken) return;
    const authHeaders = {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${accessToken}`,
    };
    const resp = await fetch(
      `${SUPABASE_URL}/rest/v1/salao_config?salao_id=eq.${state.config.salaoId}&select=plano,trial_inicio`,
      { headers: authHeaders }
    );
    if (!resp.ok) return;
    const rows = await resp.json();
    if (rows.length > 0) {
      state.config.plano       = rows[0].plano || 'trial';
      state.config.trialInicio = rows[0].trial_inicio || state.config.trialInicio;
      await saveConfig();
    } else {
      await fetch(`${SUPABASE_URL}/rest/v1/salao_config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
          'Prefer': 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          salao_id: state.config.salaoId,
          plano: state.config.plano || 'trial',
          trial_inicio: state.config.trialInicio || new Date().toISOString(),
        }),
      });
    }
  } catch (err) {
    console.error('Falha ao sincronizar configuração do salão:', err);
  }
}

// Login
document.getElementById('login-btn').addEventListener('click', async function() {
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value.trim();
  if (!email || !password) { toast('Preencha email e password', 'error'); return; }
  setButtonLoading(this, true);
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    document.getElementById('login-view').style.display = 'none';
    document.getElementById('app-view').style.display  = 'flex';
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('salao_id, role, nome')
      .eq('user_id', data.user.id)
      .single();
    if (profileError) {
      toast('Perfil não encontrado. Contacte o administrador.', 'error');
      document.getElementById('login-view').style.display = 'flex';
      document.getElementById('app-view').style.display  = 'none';
      return;
    }
    state.config.salaoId   = profile.salao_id;
    state.config.storeName = profile.nome || 'Salão';
    state.config.userRole  = profile.role;
    const trocouDeSalao = await detetarTrocaDeSalao(profile.salao_id);
    aplicarPermissoes();
    await sincronizarConfigDoServidor();
    await loadState(trocouDeSalao);
    if (typeof ativarAbaAtiva === 'function') ativarAbaAtiva();
    if (navigator.onLine) {
      atualizarIndicadorSync();
    }
    toast('Bem-vindo(a), ' + profile.nome + '!', 'success');
    if (typeof carregarHistoricoIA === 'function') carregarHistoricoIA();
    aplicarPermissoes();
    // Onboarding (Fase 2)
    if (!localStorage.getItem('bp_onboarding_seen')) {
      // ============================================================
      // CORREÇÃO: remover splash manualmente
      // ============================================================
      const splash = document.getElementById('splash-screen');
      if (splash) { splash.style.display = 'none'; }
      const onbEl = document.getElementById('onboarding-screen');
      onbEl.style.display = 'flex';
      // Bloqueia toques nos primeiros 500ms
      onbEl.style.pointerEvents = 'none';
      setTimeout(() => { onbEl.style.pointerEvents = 'auto'; }, 500);
      showOnboardingSlide(0);
    }
    aplicarAcessibilidade();
  } catch (err) {
    if (typeof Sentry !== 'undefined' && Sentry.captureException) {
      Sentry.captureException(err, { tags: { action: 'login' }, extra: { email } });
    }
    toast('Erro ao entrar: ' + (err.message || 'Verifique as suas credenciais'), 'error');
  } finally {
    setButtonLoading(this, false);
  }
});



/* ===== FILE: sync-queue.js ===== */

// ====================================================================
//  FILA DE SINCRONIZAÇÃO (extraído do app.js na Fase B da modularização)
// ====================================================================

// ================================================================
//  LISTA NEGRA DE ELIMINADOS (evita reimportação)
// ================================================================
const DELETED_KEY = 'bp_deleted_items';

function getDeletedItems() {
  try { return JSON.parse(localStorage.getItem(DELETED_KEY) || '[]'); }
  catch (e) { logErroSilencioso('getDeletedItems', e); return []; }
}

function saveDeletedItems(items) {
  try { localStorage.setItem(DELETED_KEY, JSON.stringify(items)); }
  catch (e) { logErroSilencioso('saveDeletedItems', e); }
}

function addDeletedItem(id, tabela) {
  const items = getDeletedItems();
  if (!items.find(i => i.id === id && i.tabela === tabela)) {
    items.push({ id, tabela, ts: Date.now() });
    saveDeletedItems(items);
  }
}

function removeDeletedItem(id, tabela) {
  const items = getDeletedItems().filter(i => !(i.id === id && i.tabela === tabela));
  saveDeletedItems(items);
}

function getSyncQueue() {
  try {
    let raw = localStorage.getItem(SYNC_QUEUE_KEY) || '[]';
    if (typeof storageGetSecure === 'function' && raw.startsWith('bp1:')) {
      raw = storageGetSecure(SYNC_QUEUE_KEY, '[]');
    }
    return JSON.parse(raw || '[]');
  } catch (e) { logErroSilencioso('getSyncQueue', e); return []; }
}

function saveSyncQueue(q) {
  try {
    const str = JSON.stringify(q);
    if (typeof storageSetSecure === 'function') storageSetSecure(SYNC_QUEUE_KEY, str);
    else localStorage.setItem(SYNC_QUEUE_KEY, str);
  } catch (e) { logErroSilencioso('saveSyncQueue', e); }
}

function atualizarIndicadorSync() {
  const dot  = document.getElementById('sync-dot');
  const text = document.getElementById('sync-text');
  if (!dot || !text) return;
  if (!navigator.onLine) { dot.classList.remove('online'); text.textContent = 'Offline'; return; }
  const fila = getSyncQueue();
  const pendentes = fila.filter(op => op.failed !== true).length;
  const falhados = fila.length - pendentes;
  dot.classList.add('online');
  text.textContent = pendentes > 0
    ? `Online (${pendentes} pendente${pendentes > 1 ? 's' : ''})`
    : (falhados > 0 ? `Online (${falhados} com falha)` : 'Online');
}

function addToSyncQueue(tabela, operacao, payload) {
  const q = getSyncQueue().filter(item => !(item.tabela === tabela && item.payload?.id === payload?.id));
  q.push({ id: uuid(), tabela, operacao, payload, ts: Date.now(), attempts: 0 });
  saveSyncQueue(q);
}

async function flushSyncQueue() {
  const q = getSyncQueue();
  if (q.length === 0) return;

  const MAX_ATTEMPTS = 5;
  const restantes = [];
  let interrompido = false;
  const itensFalhos = [];

  for (let i = 0; i < q.length; i++) {
    const op = q[i];

    if (op.failed === true) {
      restantes.push(op);
      continue;
    }

    if (interrompido) {
      restantes.push(op);
      continue;
    }

    // Respeitar o backoff exponencial
    if (op.nextRetry && Date.now() < op.nextRetry) {
      restantes.push(op);
      continue;
    }

    try {
      if (op.operacao === 'delete') {
        await supabaseDelete(op.tabela, op.payload.id);
        removeDeletedItem(op.payload.id, op.tabela);
      } else {
        await supabaseUpsert(op.tabela, op.payload);
      }
    } catch (err) {
      // ================================================================
      //  TRATAMENTO PARA LIMITE DE PLANO (não retentar)
      // ================================================================
      if (err.message === 'LIMITE_PLANO_ATINGIDO') {
        toast('Operação bloqueada: limite do plano atingido.', 'error');
        // Não colocar de volta na fila – descartar definitivamente
        continue;
      }

      if (err.message === 'SESSION_EXPIRED') {
        restantes.push(op);
        for (let j = i + 1; j < q.length; j++) {
          restantes.push(q[j]);
        }
        saveSyncQueue(restantes);
        await supabaseClient.auth.signOut();
        interrompido = true;
        break;
      }

      op.attempts = (op.attempts || 0) + 1;

      if (op.attempts >= MAX_ATTEMPTS) {
        op.failed = true;
        itensFalhos.push(op.id || 'item');
        restantes.push(op);
      } else {
        const delay = Math.min(Math.pow(2, op.attempts) * 1000, 60000) + Math.random() * 1000;
        op.nextRetry = Date.now() + delay;
        restantes.push(op);
      }
    }
  }

  if (!interrompido) {
    saveSyncQueue(restantes);
  }

  if (itensFalhos.length > 0) {
    const msg = `Falha ao sincronizar ${itensFalhos.length} operação(ões) após ${MAX_ATTEMPTS} tentativas. Contacte o suporte.`;
    toast(msg, 'error');
  }
}

// ====================================================================
//  OVERRIDE PARA SUPABASE (mantido)
// ====================================================================
const _dbPutOriginal    = dbPut;
const _dbDeleteOriginal = dbDelete;

dbPut = async function(store, item) {
  // Escrever localmente primeiro (offline-first)
  await _dbPutOriginal(store, item);

  const tabela = STORE_TO_TABLE[store];
  if (!tabela || !state.config.salaoId) return item;

  if (navigator.onLine) {
    try {
      await supabaseUpsert(tabela, item);
    } catch (err) {
      // Se for erro de limite de plano, reverter a escrita local e relançar
      if (err.message === 'LIMITE_PLANO_ATINGIDO') {
        await _dbDeleteOriginal(store, item.id);
        // Remover do estado local (será feito pelo chamador)
        throw err;
      }
      // Outros erros: enfileirar para tentar depois
      addToSyncQueue(tabela, 'upsert', item);
    }
  } else {
    addToSyncQueue(tabela, 'upsert', item);
  }
  return item;
};

dbDelete = async function(store, id) {
  // Adiciona à lista negra ANTES de eliminar localmente
  const tabela = STORE_TO_TABLE[store];
  if (tabela) {
    addDeletedItem(id, tabela);
  }

  await _dbDeleteOriginal(store, id);

  if (!tabela || !state.config.salaoId) return;
  if (navigator.onLine) {
    try { await supabaseDelete(tabela, id); }
    catch { addToSyncQueue(tabela, 'delete', { id }); }
  } else {
    addToSyncQueue(tabela, 'delete', { id });
  }
};



/* ===== FILE: sync-rest.js ===== */

// ====================================================================
//  sync-rest.js — Comunicação com Supabase e merge de dados
//  CORREÇÕES APLICADAS:
//    - Adicionado profissional_id nos mapeamentos to/from Supabase
//    - Tratamento de erros robusto (nunca exibe "Error {}")
//    - Leitura do corpo da resposta em caso de erro HTTP
//    - Fallback de mensagem para qualquer tipo de exceção
//    - POLÍTICAS FORTES: prevenção de duplicados por nome no merge e upsert
//    - Verificação de existência antes de upsert
//    - Logs estruturados para auditoria
//    - CORREÇÃO CRÍTICA: eliminações propagadas entre dispositivos
//      (item local sem upsert pendente não é reintroduzido)
//    - CORREÇÃO ADICIONAL: preservar itens locais recentes (até 5 segundos)
//      para evitar desaparecimento temporário de vendas durante merge concorrente
// ====================================================================

// ====================================================================
//  VALIDAÇÃO DE UUID (para evitar envio de valores inválidos)
// ====================================================================
function isValidUUID(uuid) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
}

// ====================================================================
//  VALIDAÇÃO DE DUPLICADOS NO SUPABASE (consulta prévia)
// ====================================================================
async function existeRegistroDuplicado(tabela, nome, salaoId, idIgnorar = null) {
  try {
    const authHeaders = await getAuthHeaders();
    const url = `${SUPABASE_URL}/rest/v1/${tabela}?salao_id=eq.${encodeURIComponent(salaoId)}&select=id,nome&nome=ilike.${encodeURIComponent(nome)}`;
    const resp = await fetch(url, { headers: authHeaders });
    if (!resp.ok) return false;
    const rows = await resp.json();
    if (idIgnorar) {
      return rows.some(r => r.id !== idIgnorar);
    }
    return rows.length > 0;
  } catch (_) {
    return false;
  }
}

// ====================================================================
//  FUNÇÕES REST ALTERADAS – COM TRATAMENTO DE ERROS ROBUSTO
// ====================================================================

async function supabaseUpsert(tabela, item) {
  try {
    const authHeaders = await getAuthHeaders();
    const salaoId = state.config.salaoId;
    if (!salaoId) throw new Error('Salão não identificado. Faça logout e login novamente.');

    // ================================================================
    // POLÍTICA FORTE: Verificar duplicados por nome antes de upsert
    // Aplica-se apenas a tabelas com campo 'nome' (profissionais, servicos, clientes)
    // ================================================================
    if (['profissionais', 'servicos', 'clientes'].includes(tabela) && item.nome) {
      const existe = await existeRegistroDuplicado(tabela, item.nome, salaoId, item.id);
      if (existe) {
        console.warn(`[sync-rest] Upsert bloqueado: ${tabela} com nome "${item.nome}" já existe neste salão.`);
        throw new Error('DUPLICADO_BLOQUEADO');
      }
    }

    const payload = toSupabaseFormat(tabela, item);
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/${tabela}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify(payload),
    });
    if (resp.status === 401) {
      throw new Error('SESSION_EXPIRED');
    }
    if (!resp.ok) {
      let errorBody = '';
      try {
        errorBody = await resp.text();
      } catch (_) {
        errorBody = '(corpo da resposta não disponível)';
      }
      throw new Error(`Supabase upsert ${tabela}: ${resp.status} - ${errorBody}`);
    }
  } catch (err) {
    if (err.message === 'SESSION_EXPIRED') throw err;
    if (err.message === 'DUPLICADO_BLOQUEADO') {
      console.warn(`[sync-rest] Upsert ignorado para ${tabela} devido a duplicado.`);
      return;
    }
    const errorMsg = err.message || String(err) || 'Erro desconhecido';
    if (errorMsg.includes('LIMITE_PLANO_ATINGIDO')) {
      if (typeof mostrarModalUpgrade === 'function') {
        mostrarModalUpgrade('Limite do plano atingido. Faça upgrade para continuar.');
      }
      throw new Error('LIMITE_PLANO_ATINGIDO');
    }
    console.error(`[sync-rest] Falha ao fazer upsert em ${tabela} (id: ${item?.id || 'desconhecido'}):`, errorMsg);
    throw new Error(`Falha na sincronização de ${tabela}: ${errorMsg}`);
  }
}

async function supabaseDelete(tabela, id) {
  try {
    const authHeaders = await getAuthHeaders();
    const salaoId = state.config.salaoId;
    if (!salaoId) {
      throw new Error('Salão não identificado. Faça logout e login novamente.');
    }

    const resp = await fetch(
      `${SUPABASE_URL}/rest/v1/${tabela}?id=eq.${encodeURIComponent(id)}&salao_id=eq.${encodeURIComponent(salaoId)}`,
      {
        method: 'DELETE',
        headers: authHeaders,
      }
    );
    if (resp.status === 401) {
      throw new Error('SESSION_EXPIRED');
    }
    if (!resp.ok) {
      let errorBody = '';
      try {
        errorBody = await resp.text();
      } catch (_) {
        errorBody = '(corpo da resposta não disponível)';
      }
      throw new Error(`Supabase delete ${tabela}: ${resp.status} - ${errorBody}`);
    }

    // Verificação: confirmar que o registo foi realmente eliminado
    const checkResp = await fetch(
      `${SUPABASE_URL}/rest/v1/${tabela}?id=eq.${encodeURIComponent(id)}&salao_id=eq.${encodeURIComponent(salaoId)}`,
      { headers: authHeaders }
    );
    if (checkResp.ok) {
      const data = await checkResp.json();
      if (data && data.length > 0) {
        throw new Error(`DELETE não eliminou o registo ${id} na tabela ${tabela}. RLS pode estar a bloquear a operação.`);
      }
    }
  } catch (err) {
    if (err.message === 'SESSION_EXPIRED') throw err;
    const errorMsg = err.message || String(err) || 'Erro desconhecido';
    console.error(`[sync-rest] Falha ao deletar em ${tabela} (id: ${id}):`, errorMsg);
    throw new Error(`Falha na exclusão de ${tabela}: ${errorMsg}`);
  }
}

async function supabaseGetAll(tabela, salaoId) {
  try {
    const authHeaders = await getAuthHeaders();
    const resp = await fetch(
      `${SUPABASE_URL}/rest/v1/${tabela}?salao_id=eq.${encodeURIComponent(salaoId)}&order=created_at.asc`,
      {
        headers: authHeaders,
      }
    );
    if (resp.status === 401) {
      throw new Error('SESSION_EXPIRED');
    }
    if (!resp.ok) {
      let errorBody = '';
      try {
        errorBody = await resp.text();
      } catch (_) {
        errorBody = '(corpo da resposta não disponível)';
      }
      throw new Error(`Supabase getAll ${tabela}: ${resp.status} - ${errorBody}`);
    }
    const rows = await resp.json();
    return rows.map(r => fromSupabaseFormat(tabela, r));
  } catch (err) {
    if (err.message === 'SESSION_EXPIRED') throw err;
    const errorMsg = err.message || String(err) || 'Erro desconhecido';
    console.error(`[sync-rest] Falha ao buscar ${tabela} do Supabase:`, errorMsg);
    throw new Error(`Falha ao carregar ${tabela}: ${errorMsg}`);
  }
}

// ====================================================================
//  TRANSFORMAÇÃO PARA O FORMATO DO SUPABASE
// ====================================================================
function toSupabaseFormat(tabela, item) {
  const salaoId = state.config.salaoId;
  if (!salaoId) {
    console.error('[toSupabaseFormat] state.config.salaoId é nulo!', { tabela, item });
    throw new Error('Salão não identificado. Faça logout e login novamente.');
  }

  if (!item.updated_at) {
    item.updated_at = new Date().toISOString();
  }

  switch (tabela) {
    case 'movimentos':
      return {
        id: item.id,
        salao_id: salaoId,
        tipo: item.tipo,
        descricao: item.descricao || '',
        valor: Math.round(item.valor || 0),
        cliente: item.cliente || 'Anónimo',
        profissional_id: isValidUUID(item.profissional_id) ? item.profissional_id : null,
        profissional: item.profissional || '',
        itens: item.itens || [],
        metodo_pagamento: item.metodoPagamento || 'Numerário',
        data: item.data,
        hora: item.hora,
        updated_at: item.updated_at,
      };
    case 'agendamentos':
      return {
        id: item.id,
        salao_id: salaoId,
        cliente: item.cliente || '',
        servico: item.servico || '',
        profissional_id: isValidUUID(item.profissional_id) ? item.profissional_id : null,
        profissional: item.profissional || '',
        data: item.data,
        hora: item.hora || '00:00',
        preco: Math.round(item.preco || 0),
        status: item.status || 'agendado',
        agendado_por: item.agendadoPor || null,
        updated_at: item.updated_at,
      };
    case 'clientes':
      return {
        id: item.id,
        salao_id: salaoId,
        nome: item.nome || '',
        telefone: item.telefone || null,
        notas: item.notas || null,
        ultima_visita: item.ultimaVisita || null,
        total_visitas: item.visitas || 0,
        updated_at: item.updated_at,
      };
    case 'profissionais':
      return {
        id: item.id,
        salao_id: salaoId,
        nome: item.nome || '',
        especialidade: item.especialidade || null,
        ativo: item.ativo !== false,
        updated_at: item.updated_at,
      };
    case 'servicos':
      return {
        id: item.id,
        salao_id: salaoId,
        nome: item.nome || '',
        preco_base: Math.round(item.precoBase || 0),
        profissionais: item.profissionais || [],
        ativo: item.ativo !== false,
        updated_at: item.updated_at,
      };
    default:
      return { ...item, salao_id: salaoId, updated_at: item.updated_at };
  }
}

// ====================================================================
//  TRANSFORMAÇÃO DO FORMATO DO SUPABASE PARA O INTERNO
// ====================================================================
function fromSupabaseFormat(tabela, row) {
  switch (tabela) {
    case 'movimentos':
      return {
        id:              row.id,
        tipo:            row.tipo,
        descricao:       row.descricao,
        valor:           row.valor,
        cliente:         row.cliente,
        profissional_id: row.profissional_id || null,
        profissional:    row.profissional || '',
        itens:           row.itens || [],
        metodoPagamento: row.metodo_pagamento,
        data:            row.data,
        hora:            row.hora,
        updated_at:      row.updated_at,
      };
    case 'agendamentos':
      return {
        id:           row.id,
        cliente:      row.cliente,
        servico:      row.servico,
        profissional_id: row.profissional_id || null,
        profissional: row.profissional || '',
        data:         row.data,
        hora:         row.hora,
        preco:        row.preco,
        status:       row.status,
        agendadoPor:  row.agendado_por,
        updated_at:   row.updated_at,
      };
    case 'clientes':
      return {
        id:           row.id,
        nome:         row.nome,
        telefone:     row.telefone,
        notas:        row.notas,
        ultimaVisita: row.ultima_visita,
        visitas:      row.total_visitas,
        updated_at:   row.updated_at,
      };
    case 'profissionais':
      return {
        id:            row.id,
        nome:          row.nome,
        especialidade: row.especialidade,
        ativo:         row.ativo,
        updated_at:    row.updated_at,
      };
    case 'servicos':
      return {
        id:            row.id,
        nome:          row.nome,
        precoBase:     row.preco_base,
        profissionais: row.profissionais || [],
        ativo:         row.ativo,
        updated_at:    row.updated_at,
      };
    default:
      return row;
  }
}

// ====================================================================
//  CARREGAMENTO DO SUPABASE COM MERGE CAMPO A CAMPO (ROBUSTO)
// ====================================================================
async function carregarDoSupabase() {
  if (!navigator.onLine || !state.config.salaoId) return false;

  try {
    const [clientesRemotos, agendamentosRemotos, movimentosRemotos, profsRemotos, servicosRemotos] = await Promise.all([
      supabaseGetAll('clientes',      state.config.salaoId),
      supabaseGetAll('agendamentos',  state.config.salaoId),
      supabaseGetAll('movimentos',    state.config.salaoId),
      supabaseGetAll('profissionais', state.config.salaoId),
      supabaseGetAll('servicos',      state.config.salaoId),
    ]);

    const mergeTable = (itensLocais, itensRemotos, tabela) => {
      const mapLocal = new Map();
      itensLocais.forEach(item => mapLocal.set(item.id, item));

      // ================================================================
      // LISTA NEGRA: itens eliminados permanentemente (nunca reimportar)
      // ================================================================
      const deletedIds = new Set(
        (typeof getDeletedItems === 'function' ? getDeletedItems() : [])
          .filter(i => i.tabela === tabela)
          .map(i => i.id)
      );

      const idsComDeletePendente = new Set(
        getSyncQueue()
          .filter(op => op.tabela === tabela && op.operacao === 'delete')
          .map(op => op.payload?.id)
      );

      // ================================================================
      // CORREÇÃO CRÍTICA (eliminações não propagavam entre dispositivos):
      // um item que existe só localmente pode significar duas coisas muito
      // diferentes: a) criado/editado aqui e ainda não chegou ao servidor
      // (está na fila de upsert) → preservar; b) já existiu no servidor
      // mas foi eliminado (por este ou por outro dispositivo) → não
      // preservar. Sem isto, a lista negra/fila de delete (que são por
      // dispositivo) nunca chegavam ao dispositivo B, e o item eliminado
      // era sempre reintroduzido.
      // ================================================================
      const idsComUpsertPendente = new Set(
        getSyncQueue()
          .filter(op => op.tabela === tabela && op.operacao === 'upsert')
          .map(op => op.payload?.id)
      );

      // ================================================================
      // POLÍTICA FORTE: Mapa de nomes para detetar duplicados
      // ================================================================
      const nomesExistentes = new Map();
      for (const item of itensLocais) {
        if (item.nome) {
          const chave = item.nome.trim().toLowerCase();
          nomesExistentes.set(chave, item.id);
        }
      }

      const mergeCampoACampo = (maisRecente, maisAntigo) => {
        const merged = { ...maisRecente };
        for (const campo in maisAntigo) {
          if (merged[campo] === undefined || merged[campo] === null) {
            merged[campo] = maisAntigo[campo];
          }
        }
        return merged;
      };

      const resultado = [];
      const itensParaSync = [];

      for (const remoto of itensRemotos) {
        // Ignorar itens com delete pendente ou na lista negra
        if (idsComDeletePendente.has(remoto.id)) {
          mapLocal.delete(remoto.id);
          continue;
        }
        if (deletedIds.has(remoto.id)) {
          continue;
        }

        const local = mapLocal.get(remoto.id);

        // ================================================================
        // POLÍTICA FORTE: Verificar duplicados por nome (para tabelas com nome)
        // ================================================================
        if (['profissionais', 'servicos', 'clientes'].includes(tabela) && remoto.nome) {
          const chave = remoto.nome.trim().toLowerCase();
          const idExistente = nomesExistentes.get(chave);
          // Se já existe um item com o mesmo nome e é diferente do atual, ignorar o remoto
          if (idExistente && idExistente !== remoto.id) {
            continue;
          }
          // Registrar este nome para futuras iterações
          nomesExistentes.set(chave, remoto.id);
        }

        if (!local) {
          resultado.push(remoto);
        } else {
          const localTs = local.updated_at || '1970-01-01T00:00:00.000Z';
          const remotoTs = remoto.updated_at || '1970-01-01T00:00:00.000Z';
          if (remotoTs > localTs) {
            const merged = mergeCampoACampo(remoto, local);
            resultado.push(merged);
            if (JSON.stringify(merged) !== JSON.stringify(remoto)) itensParaSync.push(merged);
          } else if (localTs > remotoTs) {
            const merged = mergeCampoACampo(local, remoto);
            resultado.push(merged);
            itensParaSync.push(merged);
          } else {
            resultado.push(local);
          }
          mapLocal.delete(remoto.id);
        }
      }

      // ================================================================
      // CORREÇÃO ADICIONAL: preservar itens locais recentes (até 5 segundos)
      // mesmo que ainda não estejam na fila de upsert, para evitar
      // desaparecimento temporário durante merge concorrente.
      // ================================================================
      const AGORA = Date.now();
      for (const [id, local] of mapLocal) {
        // Preservar se houver upsert pendente
        if (idsComUpsertPendente.has(id)) {
          resultado.push(local);
          itensParaSync.push(local);
          continue;
        }
        // Preservar se for muito recente (criação local ainda não enfileirada)
        const localTs = new Date(local.updated_at || '1970-01-01').getTime();
        if (localTs > AGORA - 5000) { // menos de 5 segundos
          resultado.push(local);
          itensParaSync.push(local);
          continue;
        }
        // Caso contrário, descartar (lista negra, delete pendente ou sem operação)
        if (deletedIds.has(id) || idsComDeletePendente.has(id)) {
          continue;
        }
        // Verificar se o nome local conflita com algum nome remoto já processado
        if (local.nome) {
          const chave = local.nome.trim().toLowerCase();
          if (nomesExistentes.has(chave) && nomesExistentes.get(chave) !== id) {
            console.warn(`[mergeTable] Ignorando ${tabela} local "${local.nome}" porque já existe remoto com mesmo nome.`);
            continue;
          }
        }
        // Último caso: item local não tem operação pendente, não é recente, não está na lista negra
        // → pode ser reintroduzido (comportamento anterior)
        resultado.push(local);
        itensParaSync.push(local);
      }

      return resultado;
    };

    state.clientes      = mergeTable(state.clientes, clientesRemotos, 'clientes');
    state.agendamentos  = mergeTable(state.agendamentos, agendamentosRemotos, 'agendamentos');
    state.movimentos    = mergeTable(state.movimentos, movimentosRemotos, 'movimentos');
    state.profissionais = mergeTable(state.profissionais, profsRemotos, 'profissionais');
    state.servicos      = mergeTable(state.servicos, servicosRemotos, 'servicos');

    // Persiste localmente SEM disparar sync
    for (const c of state.clientes)      await dbPutLocal('clientes',      c);
    for (const a of state.agendamentos)  await dbPutLocal('agendamentos',  a);
    for (const m of state.movimentos)    await dbPutLocal('movimentos',    m);
    for (const p of state.profissionais) await dbPutLocal('profissionais', p);
    for (const s of state.servicos)      await dbPutLocal('servicos',      s);

    return true;
  } catch (err) {
    if (err.message === 'SESSION_EXPIRED') {
      console.warn('[carregarDoSupabase] Sessão expirada, a sincronização será retomada após login.');
      return false;
    }
    const errorMsg = err.message || String(err) || 'Erro desconhecido';
    console.error('[carregarDoSupabase] Erro ao carregar dados do Supabase:', errorMsg);
    return false;
  }
}



/* ===== FILE: plano-limites.js ===== */

// ====================================================================
//  plano-limites.js — extraído do app.js (Fase C da modularização)
//  Conteúdo: Planos, trial e limites de uso (getPlanoAtual, getLimites, isTrialAtivo, verificarLimite, upgradePara)
//  Linhas originais: 1-80
//  Carregar depois de core-*.js, db-indexeddb.js, sync-*.js, auth-supabase.js
// ====================================================================
// ====================================================================
//  UTILITÁRIOS — movidos para core-utils.js (Fase A da modularização)
//  SUPABASE (client, auth listener, checkSession, getAuthHeaders,
//  garantirSalaoRemoto, sincronizarConfigDoServidor, login) — movidos
//  para auth-supabase.js (Fase B da modularização)
// ====================================================================

// Constantes movidas para core-constants.js: WHATSAPP_NUMBER, IA_EDGE_URL,
// STORE_TO_TABLE, SYNC_QUEUE_KEY
// getSyncQueue/saveSyncQueue/atualizarIndicadorSync/addToSyncQueue
// movidos para sync-queue.js (Fase B da modularização)

// getAuthHeaders movido para auth-supabase.js (Fase B da modularização)

// supabaseUpsert/supabaseDelete/supabaseGetAll/toSupabaseFormat/
// fromSupabaseFormat/carregarDoSupabase movidos para sync-rest.js
// (Fase B da modularização)

// ====================================================================
//  PLANOS E LIMITES
// ====================================================================
// PLANOS movido para core-constants.js

function getPlanoAtual() { return state.config.plano || 'trial'; }

function getLimites(plano) { return PLANOS[plano] || PLANOS.trial; }

function getDiasTrialRestantes() {
  if (!state.config.trialInicio) return 14;
  const raw = String(state.config.trialInicio);
  const inicio = (raw.includes('T') || raw.includes(' '))
    ? new Date(raw.replace(' ', 'T'))
    : new Date(raw + 'T00:00:00');
  if (isNaN(inicio.getTime())) return 14;
  const agora = new Date();
  const diff = Math.floor((agora - inicio) / (1000 * 60 * 60 * 24));
  return Math.max(0, 14 - diff);
}

function isTrialAtivo() {
  const p = getPlanoAtual();
  if (p !== 'trial') return false;
  return getDiasTrialRestantes() > 0;
}

function verificarLimite(tipo) {
  const plano = getPlanoAtual();
  const limite = getLimites(plano)[tipo];
  if (limite === Infinity) return true;
  let total = 0;
  switch (tipo) {
    case 'agendamentos':
      total = state.agendamentos.length;
      break;
    case 'clientes':
      total = state.clientes.length;
      break;
    case 'profissionais':
      total = state.profissionais.length;
      break;
  }
  if (total >= limite) {
    mostrarModalUpgrade(`Limite de ${tipo} atingido (${limite}). Faça upgrade para continuar.`);
    return false;
  }
  return true;
}

function mostrarModalUpgrade(mensagem) {
  if (!mensagem) mensagem = 'Atingiu o limite do seu plano actual. Escolha um plano para continuar.';
  document.getElementById('upgrade-mensagem').textContent = mensagem;
  openModal('modal-upgrade');
}

function upgradePara(plano) {
  const msg =
    `Olá, quero assinar o plano ${plano} do BeautyPro. Salão: ${state.config.storeName} | Plano actual: ${getPlanoAtual()}`;
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
  closeModal('modal-upgrade');
}
// Expor globalmente para os botões onclick no HTML
window.upgradePara = upgradePara;



/* ===== FILE: crud-operations.js ===== */

// ====================================================================
//  crud-operations.js — Fase C + Fase D (melhorias de robustez)
//  Carregar depois de core-*.js, core-store.js, db-indexeddb.js,
//  sync-*.js, auth-supabase.js, plano-limites.js
// ====================================================================

// ====================================================================
//  VALIDAÇÃO DE DUPLICADOS (local)
// ====================================================================
function existeNomeDuplicado(tabela, nome, idIgnorar = null) {
  const lista = state[tabela] || [];
  const nomeNormalizado = (nome || '').trim().toLowerCase();
  if (!nomeNormalizado) return false;
  return lista.some(item =>
    item.nome && item.nome.trim().toLowerCase() === nomeNormalizado &&
    (idIgnorar ? item.id !== idIgnorar : true)
  );
}

async function detetarTrocaDeSalao(novoSalaoId) {
  const configs = await dbGetAll('config');
  const salaoIdCache = configs.find(c => c.key === 'salaoId');
  const anterior = salaoIdCache ? salaoIdCache.value : null;
  return !!(anterior && novoSalaoId && anterior !== novoSalaoId);
}

async function loadState(trocouDeSalao = false) {
  const configs = await dbGetAll('config');

  const cfg = configs.find(c => c.key === 'storeName');
  const fund = configs.find(c => c.key === 'fundo');
  const plano = configs.find(c => c.key === 'plano');
  const trialInicio = configs.find(c => c.key === 'trialInicio');

  // Mutação directa mantida por compatibilidade; Store notifica se existir
  state.config.storeName = cfg ? cfg.value : 'Glamour Beauty';
  state.config.fundo = fund ? Number(fund.value) : 0;
  state.config.plano = plano ? plano.value : 'trial';
  state.config.trialInicio = trialInicio ? trialInicio.value : null;

  let clientes, agendamentos, movimentos, profs, servicos, fechos;
  if (trocouDeSalao) {
    await Promise.all(['clientes', 'agendamentos', 'movimentos', 'profissionais', 'servicos', 'fechos_caixa'].map(dbClear));
    localStorage.removeItem(SYNC_QUEUE_KEY);
    try { localStorage.removeItem('bp_deleted_items'); } catch (_) {}
    // Preferências e resíduos do salão anterior (P2)
    ['bp_filtro_clientes','bp_chart_periodo','bp_chart_offset','bp_chart_mostrar_valores',
     'bp_hist_periodo','bp_caixa_data_exata','bp_carrinho','bp_last_venda_id'].forEach(k => {
      try { localStorage.removeItem(k); } catch (_) {}
    });
    try { sessionStorage.removeItem('bp_last_venda_id'); } catch (_) {}
    state.histPeriodo = 'hoje';
    state.filtroClientes = 'todos';
    state.chartPeriodo = 'semana';
    state.chartOffset = 0;
    clientes = []; agendamentos = []; movimentos = []; profs = []; servicos = []; fechos = [];
    console.warn('[BeautyPro] Troca de salão detetada — dados locais, fila e preferências limpos.');
  } else {
    const [clientesData, agendamentosData, movimentosData, profsData, servicosData, fechosData] = await Promise.all([
      dbGetAll('clientes'),
      dbGetAll('agendamentos'),
      dbGetAll('movimentos'),
      dbGetAll('profissionais'),
      dbGetAll('servicos'),
      dbGetAll('fechos_caixa'),
    ]);
    clientes = clientesData;
    agendamentos = agendamentosData;
    movimentos = movimentosData;
    profs = profsData;
    servicos = servicosData;
    fechos = fechosData;
  }

  const safe = (arr) => Array.isArray(arr) ? arr : [];
  state.clientes = safe(clientes);
  state.agendamentos = safe(agendamentos);
  state.movimentos = safe(movimentos);
  state.profissionais = safe(profs);
  state.servicos = safe(servicos);
  state.fechos_caixa = safe(fechos);

  const chartPeriodo = localStorage.getItem('bp_chart_periodo') || 'semana';
  const chartOffset = parseInt(localStorage.getItem('bp_chart_offset')) || 0;
  const chartMostrarValores = localStorage.getItem('bp_chart_mostrar_valores') === 'true';
  const filtroClientes = localStorage.getItem('bp_filtro_clientes') || 'todos';
  state.filtroClientes = filtroClientes;
  state.chartPeriodo = chartPeriodo;
  state.chartOffset = chartOffset;
  state.chartMostrarValores = chartMostrarValores;

  if (!state.config.trialInicio) {
    state.config.trialInicio = hoje();
    state.config.plano = 'trial';
    await dbPut('config', { id: 'trialInicio', key: 'trialInicio', value: state.config.trialInicio });
    await dbPut('config', { id: 'plano', key: 'plano', value: 'trial' });
  }

  if (state.profissionais.length === 0) {
    console.log('[loadState] Nenhum profissional encontrado. Criação automática desativada.');
  }
  if (state.servicos.length === 0) {
    console.log('[loadState] Nenhum serviço encontrado. Criação automática desativada.');
  }

  if (state.config.salaoId && navigator.onLine) {
    await garantirSalaoRemoto();
    const carregouRemoto = await carregarDoSupabase();
    if (carregouRemoto) await flushSyncQueue();
  }

  // Notificar Store se disponível
  if (window.BeautyStore && typeof window.BeautyStore.setState === 'function') {
    window.BeautyStore.setState({ ...state });
  }

  updateUI();
  if (typeof renderBadges === 'function') renderBadges();
}

async function saveConfig() {
  await dbPut('config', { id: 'storeName', key: 'storeName', value: state.config.storeName });
  await dbPut('config', { id: 'fundo', key: 'fundo', value: state.config.fundo });
  await dbPut('config', { id: 'plano', key: 'plano', value: state.config.plano });
  await dbPut('config', { id: 'trialInicio', key: 'trialInicio', value: state.config.trialInicio });
  if (state.config.salaoId) {
    await dbPut('config', { id: 'salaoId', key: 'salaoId', value: state.config.salaoId });
  }
}

// ====================================================================
//  HELPER — DELETE OPTIMISTA COM ROLLBACK
// ====================================================================
async function _deleteComRollback(tabela, id, nomeEntidade) {
  // 1. Guardar snapshot para possível rollback
  const lista = state[tabela] || [];
  const itemOriginal = lista.find(item => item.id === id);
  if (!itemOriginal) {
    toast(`${nomeEntidade} não encontrado(a).`, 'warning');
    return false;
  }

  // 2. Remoção optimista local
  await dbDelete(tabela, id);
  if (window.BeautyStore && window.BeautyStore.removeFromList) {
    window.BeautyStore.removeFromList(tabela, id);
  } else {
    state[tabela] = state[tabela].filter(item => item.id !== id);
  }
  updateUI();
  if (typeof renderBadges === 'function') renderBadges();

  // 3. Tentar sincronizar
  if (navigator.onLine && state.config.salaoId) {
    try {
      await flushSyncQueue();
      await carregarDoSupabase();
      updateUI();
      if (typeof renderBadges === 'function') renderBadges();
      toast(`${nomeEntidade} eliminado(a) e sincronizado(a)!`, 'success');
      return true;
    } catch (e) {
      console.warn(`[delete ${tabela}] Falha ao sincronizar:`, e);
      // Não fazemos rollback automático do item (já está na fila de sync).
      // O utilizador vê a mensagem de aviso e o item continua eliminado localmente.
      toast(`${nomeEntidade} eliminado(a) localmente. A sincronização falhou — será tentada novamente.`, 'warning');
      return true;
    }
  } else {
    toast(`${nomeEntidade} eliminado(a) (offline). Será sincronizado quando online.`, 'warning');
    return true;
  }
}

// ====================================================================
//  CRUD — CLIENTE
// ====================================================================
async function addCliente(c) {
  if (!verificarLimite('clientes')) return null;
  const nome = (c.nome || '').trim();
  if (!nome) { toast('Nome é obrigatório', 'error'); return null; }

  if (existeNomeDuplicado('clientes', nome)) {
    toast('Já existe um cliente com este nome.', 'error');
    return null;
  }

  const n = { ...c, id: uuid(), nome };
  try {
    await dbPut('clientes', n);
    if (window.BeautyStore && window.BeautyStore.pushToList) {
      window.BeautyStore.pushToList('clientes', n);
    } else {
      state.clientes.push(n);
      updateUI();
    }
    toast('Cliente adicionado à lista', 'success');
    return n;
  } catch (err) {
    if (err.message === 'LIMITE_PLANO_ATINGIDO') {
      mostrarModalUpgrade('Limite de clientes atingido. Faça upgrade para continuar.');
      return null;
    }
    throw err;
  }
}

async function updateCliente(id, data) {
  if (data.nome) {
    const nome = data.nome.trim();
    if (existeNomeDuplicado('clientes', nome, id)) {
      toast('Já existe um cliente com este nome.', 'error');
      return;
    }
  }
  if (window.BeautyStore && window.BeautyStore.updateInList) {
    window.BeautyStore.updateInList('clientes', id, data);
  } else {
    const i = state.clientes.findIndex(c => c.id === id);
    if (i === -1) return;
    state.clientes[i] = { ...state.clientes[i], ...data };
  }
  const item = state.clientes.find(c => c.id === id);
  if (item) await dbPut('clientes', item);
  if (!(window.BeautyStore && window.BeautyStore.subscribe)) updateUI();
}

async function deleteCliente(id) {
  return _deleteComRollback('clientes', id, 'Cliente');
}

// ====================================================================
//  CRUD — AGENDAMENTO
// ====================================================================
async function addAgendamento(ag) {
  const dtStr = ag.data + 'T' + (ag.hora || '00:00') + ':00';
  const agDatetime = new Date(dtStr);
  const agora = new Date();
  if (agDatetime < agora) {
    toast('Não é possível agendar para datas ou horários passados.', 'error');
    return null;
  }
  if (!verificarLimite('agendamentos')) return null;
  if (!ag.profissional_id || String(ag.profissional_id).trim() === '') {
    toast('Selecione um profissional antes de agendar.', 'error');
    return null;
  }

  const n = {
    ...ag,
    id: uuid(),
    data: ag.data || hoje(),
    hora: ag.hora || horaAgora(),
    status: 'agendado',
    profissional_id: ag.profissional_id || null,
    profissional: ag.profissional || ''
  };
  try {
    await dbPut('agendamentos', n);
    if (window.BeautyStore && window.BeautyStore.pushToList) {
      window.BeautyStore.pushToList('agendamentos', n);
    } else {
      state.agendamentos.push(n);
      updateUI();
    }
    if (typeof renderBadges === 'function') renderBadges();
    toast('Agendamento marcado', 'success');
    return n;
  } catch (err) {
    if (err.message === 'LIMITE_PLANO_ATINGIDO') {
      mostrarModalUpgrade('Limite de agendamentos atingido. Faça upgrade para continuar.');
      return null;
    }
    throw err;
  }
}

async function updateAgendamento(id, data) {
  if (window.BeautyStore && window.BeautyStore.updateInList) {
    window.BeautyStore.updateInList('agendamentos', id, data);
  } else {
    const i = state.agendamentos.findIndex(a => a.id === id);
    if (i === -1) return;
    state.agendamentos[i] = { ...state.agendamentos[i], ...data };
  }
  const item = state.agendamentos.find(a => a.id === id);
  if (item) await dbPut('agendamentos', item);
  if (!(window.BeautyStore && window.BeautyStore.subscribe)) updateUI();
  if (typeof renderBadges === 'function') renderBadges();
}

async function deleteAgendamento(id) {
  return _deleteComRollback('agendamentos', id, 'Agendamento');
}

// ====================================================================
//  CRUD — PROFISSIONAL
// ====================================================================
async function addProfissional(p) {
  if (!verificarLimite('profissionais')) return null;
  const nome = (p.nome || '').trim();
  if (!nome) { toast('Nome é obrigatório', 'error'); return null; }

  if (existeNomeDuplicado('profissionais', nome)) {
    toast('Já existe um profissional com este nome.', 'error');
    return null;
  }

  const n = { ...p, id: uuid(), nome };
  try {
    await dbPut('profissionais', n);
    if (window.BeautyStore && window.BeautyStore.pushToList) {
      window.BeautyStore.pushToList('profissionais', n);
    } else {
      state.profissionais.push(n);
      updateUI();
    }
    toast('Profissional adicionado à equipa', 'success');
    return n;
  } catch (err) {
    if (err.message === 'LIMITE_PLANO_ATINGIDO') {
      mostrarModalUpgrade('Limite de profissionais atingido. Faça upgrade para continuar.');
      return null;
    }
    throw err;
  }
}

async function updateProfissional(id, data) {
  if (data.nome) {
    const nome = data.nome.trim();
    if (existeNomeDuplicado('profissionais', nome, id)) {
      toast('Já existe um profissional com este nome.', 'error');
      return;
    }
  }
  if (window.BeautyStore && window.BeautyStore.updateInList) {
    window.BeautyStore.updateInList('profissionais', id, data);
  } else {
    const i = state.profissionais.findIndex(p => p.id === id);
    if (i === -1) return;
    state.profissionais[i] = { ...state.profissionais[i], ...data };
  }
  const item = state.profissionais.find(p => p.id === id);
  if (item) await dbPut('profissionais', item);
  if (!(window.BeautyStore && window.BeautyStore.subscribe)) updateUI();
}

async function deleteProfissional(id) {
  return _deleteComRollback('profissionais', id, 'Profissional');
}

// ====================================================================
//  CRUD — SERVIÇO
// ====================================================================
async function addServico(s) {
  const nome = (s.nome || '').trim();
  if (!nome) { toast('Nome é obrigatório', 'error'); return null; }

  if (existeNomeDuplicado('servicos', nome)) {
    toast('Já existe um serviço com este nome.', 'error');
    return null;
  }

  const n = { ...s, id: uuid(), nome };
  await dbPut('servicos', n);
  if (window.BeautyStore && window.BeautyStore.pushToList) {
    window.BeautyStore.pushToList('servicos', n);
  } else {
    state.servicos.push(n);
    updateUI();
  }
  toast('Serviço criado e disponível', 'success');
  return n;
}

async function updateServico(id, data) {
  if (data.nome) {
    const nome = data.nome.trim();
    if (existeNomeDuplicado('servicos', nome, id)) {
      toast('Já existe um serviço com este nome.', 'error');
      return;
    }
  }
  if (window.BeautyStore && window.BeautyStore.updateInList) {
    window.BeautyStore.updateInList('servicos', id, data);
  } else {
    const i = state.servicos.findIndex(s => s.id === id);
    if (i === -1) return;
    state.servicos[i] = { ...state.servicos[i], ...data };
  }
  const item = state.servicos.find(s => s.id === id);
  if (item) await dbPut('servicos', item);
  if (!(window.BeautyStore && window.BeautyStore.subscribe)) updateUI();
}

async function deleteServico(id) {
  return _deleteComRollback('servicos', id, 'Serviço');
}

function getServicoById(id) {
  return state.servicos.find(s => s.id === id);
}

function getServicoByNome(nome) {
  return state.servicos.find(s => s.nome === nome);
}

function getProfissionaisPorServico(nomeServico) {
  const servico = state.servicos.find(s => s.nome === nomeServico);
  if (servico && servico.profissionais && servico.profissionais.length > 0) {
    return servico.profissionais;
  }
  return state.profissionais.map(p => p.nome);
}

// ====================================================================
//  VENDA / MOVIMENTO
// ====================================================================
async function registarVenda(dados) {
  try {
    if (!dados.cliente || String(dados.cliente).trim() === '') {
      toast('Selecione ou crie um cliente antes de registar a venda.', 'error');
      return null;
    }

    if (!dados.profissional_id || String(dados.profissional_id).trim() === '') {
      toast('Selecione um profissional antes de registar a venda.', 'error');
      return null;
    }

    if (!dados.itens || !Array.isArray(dados.itens) || dados.itens.length === 0) {
      toast('Adicione pelo menos um serviço à venda.', 'error');
      return null;
    }

    const total = dados.itens.reduce((acc, i) => acc + (Number(i.subtotal) || 0), 0);
    if (total <= 0) {
      toast('O valor total da venda tem de ser superior a zero.', 'error');
      return null;
    }

    const descricao = dados.itens.map(i => i.nome).join(', ');
    const id = uuid();
    let comissaoGerada = 0;
    try {
      if (typeof getTaxaComissao === 'function' && typeof calcularComissao === 'function') {
        comissaoGerada = calcularComissao(total, getTaxaComissao(dados.profissional_id));
      }
    } catch (e) {}
    const mov = {
      id,
      tipo: 'venda',
      descricao,
      valor: total,
      cliente: dados.cliente,
      profissional_id: dados.profissional_id || null,
      profissional: dados.profissional || 'Não atribuído',
      itens: dados.itens.map(i => ({
        nome: i.nome,
        quantidade: Number(i.quantidade) || 1,
        precoUnit: Number(i.precoUnit) || Number(i.subtotal) || 0,
        subtotal: Number(i.subtotal) || 0
      })),
      metodoPagamento: dados.metodoPagamento || 'Numerário',
      comissao_gerada: comissaoGerada,
      data: hoje(),
      hora: horaAgora(),
      reciboNum: (typeof nextReciboNum === 'function' ? nextReciboNum() : '0001'),
      salao_id: state.config.salaoId || null,
      updated_at: new Date().toISOString()
    };

    // Escrita local primeiro — nunca falha a venda por causa da rede
    await dbPut('movimentos', mov);
    if (window.BeautyStore && window.BeautyStore.pushToList) {
      window.BeautyStore.pushToList('movimentos', mov);
    } else {
      state.movimentos.push(mov);
      updateUI();
    }
    if (typeof renderBadges === 'function') renderBadges();
    return id;
  } catch (err) {
    console.error('[registarVenda] Erro:', err);
    // Se for limite de plano, mensagem específica
    if (err && err.message === 'LIMITE_PLANO_ATINGIDO') {
      mostrarModalUpgrade('Limite do plano atingido. Faça upgrade para continuar.');
      return null;
    }
    toast('Não foi possível registar a venda localmente. Tente novamente.', 'error');
    return null;
  }
}

async function addMovimento(mov) {
  const n = { ...mov, id: uuid(), data: hoje(), hora: horaAgora() };
  await dbPut('movimentos', n);
  if (window.BeautyStore && window.BeautyStore.pushToList) {
    window.BeautyStore.pushToList('movimentos', n);
  } else {
    state.movimentos.push(n);
    updateUI();
  }
  return n;
}


/* ===== FILE: ui-render-dashboard-agenda.js ===== */

// ====================================================================
//  ui-render-dashboard-agenda.js — extraído do app.js (Fase C da modularização)
//  Conteúdo: Renderização do Resumo (dashboard) e Agenda
//  Linhas originais: 383-610
//  Carregar depois de core-*.js, db-indexeddb.js, sync-*.js, auth-supabase.js
//  CORREÇÕES APLICADAS (Filtro Agenda, Expiração, Badge, Dia Exato):
//    1. Filtro da Agenda: Hoje, Semana, Mês, Todos, Dia Exato com persistência.
//    2. Expiração automática: agendamentos com data/hora passada ficam "Não realizado".
//    3. Badge da Agenda: conta todos os agendamentos disponíveis (status "agendado" com data/hora >= agora).
//    4. Eventos do filtro unificados com classes CSS e suporte a Dia Exato.
//    5. Sincronização unificada com debounce.
//    6. Navegação por setas adaptada ao filtro atual (hoje e dia exato).
// ====================================================================

// ------------------------------------------------------------
//  AUXILIAR: busca nome do profissional a partir do ID
// ------------------------------------------------------------
function getProfissionalNome(profissionalId) {
  if (!profissionalId) return 'Não atribuído';
  const prof = state.profissionais.find(p => p.id === profissionalId);
  return prof ? prof.nome : 'Não atribuído';
}

// ====================================================================
//  RENDERIZAÇÃO
// ====================================================================
let _updateUITimer = null;
let _storeSubscribed = false;

function updateUI() {
  // Debounce: várias mutações no mesmo tick → um único paint
  if (_updateUITimer) clearTimeout(_updateUITimer);
  _updateUITimer = setTimeout(_updateUINow, 16);
}

function _updateUINow() {
  _updateUITimer = null;
  renderDashboard();
  if (activeTab === 'agenda') renderAgendaFull();
  if (activeTab === 'clientes') renderClientes();
  if (activeTab === 'caixa') renderCaixa();
  if (activeTab === 'equipa') { renderProfissionais(); renderServicos(); }
  renderBadges();
  renderPlanoInfo();
  if (activeTab === 'dashboard') renderizarGrafico();
  populateVendaSelects();
  populateAgendaSelects();
  setupPrecoAutomatico('agenda-servico', 'agenda-preco');
  setupPrecoAutomatico('ci-servico-sel', 'ci-valor');
  initChartControls();
  aplicarAcessibilidade();

  const storeDisplay = document.getElementById('store-name-display');
  if (storeDisplay && state.config.storeName) {
    storeDisplay.textContent = state.config.storeName;
    storeDisplay.title = 'Duplo clique para gerir profissionais';
  }

  atualizarVisibilidadeAtalhos();
}

/** Liga o Store aos renders — mutações via BeautyStore disparam UI automaticamente */
function initStoreBindings() {
  if (_storeSubscribed) return;
  if (!window.BeautyStore || typeof window.BeautyStore.subscribe !== 'function') return;
  window.BeautyStore.subscribe(function onStoreChange() {
    updateUI();
  });
  _storeSubscribed = true;
}


function atualizarVisibilidadeAtalhos() {
  // Hierarquia: no Dashboard só a barra de venda (CTA primário);
  // FAB de agendar só na Agenda (evita 2 primários na mesma vista).
  const fabEl = document.getElementById('fab-agendar');
  if (fabEl) {
    fabEl.style.display = (activeTab === 'agenda') ? 'flex' : 'none';
  }
  const bannerEl = document.getElementById('nova-venda-hero-btn');
  if (bannerEl) {
    bannerEl.style.display = (activeTab === 'dashboard' || activeTab === 'caixa') ? 'flex' : 'none';
  }
  const vendaCta = document.getElementById('venda-cta-bar') || document.querySelector('.venda-cta-bar');
  if (vendaCta) {
    vendaCta.style.display = (activeTab === 'dashboard' || activeTab === 'caixa') ? '' : 'none';
  }
}

function renderPlanoInfo() {
  const plano = getPlanoAtual();
  const info = PLANOS[plano];
  const badge = document.getElementById('plano-badge');
  const label = plano === 'trial' ? 'Plano Gratuito' : info.label.toUpperCase();
  badge.textContent = label;
  badge.className = 'plano-badge ' + info.badgeClass;
  const countdown = document.getElementById('trial-countdown');
  if (plano === 'trial' && isTrialAtivo()) {
    const dias = getDiasTrialRestantes();
    countdown.style.display = 'inline-block';
    countdown.textContent = `Restam ${dias} dias`;
    countdown.style.color = '';
  } else if (plano === 'trial' && !isTrialAtivo()) {
    countdown.style.display = 'inline-block';
    countdown.textContent = 'Trial expirado';
    countdown.style.color = '#B33A4A';
  } else {
    countdown.style.display = 'none';
    countdown.style.color = '';
  }
  const iaInfo = document.getElementById('ia-plano-info');
  if (iaInfo) {
    const limite = info.iaDia;
    iaInfo.textContent = limite > 0 ? `${info.label}: ${limite} perguntas/dia` : 'IA não disponível neste plano';
  }
  const cont = document.getElementById('ia-contador');
  if (cont) {
    if (info.iaDia === 0) {
      cont.textContent = '0';
    } else {
      const chave = 'ia_perguntas_' + (state.config.salaoId || 'local') + '_' + hoje();
      cont.textContent = parseInt(localStorage.getItem(chave) || '0');
    }
  }
}

// ====================================================================
//  FILTRO DASHBOARD — funções auxiliares (já existentes)
// ====================================================================
function formatarDataISO(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function formatarDataCurta(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' });
}

function calcularIntervaloPeriodo(tipo, offset) {
  const base = new Date(hoje() + 'T00:00:00');
  let inicio, fim, label;
  if (tipo === 'custom') {
    inicio = state.dashCustomInicio || hoje();
    fim = state.dashCustomFim || hoje();
    label = 'Personalizado';
  } else if (tipo === 'semana') {
    const diaSemana = (base.getDay() + 6) % 7;
    const segunda = new Date(base);
    segunda.setDate(segunda.getDate() - diaSemana - offset * 7);
    const domingo = new Date(segunda);
    domingo.setDate(domingo.getDate() + 6);
    inicio = formatarDataISO(segunda);
    fim = formatarDataISO(domingo);
    label = offset === 0 ? 'Esta semana' : 'Semana de ' + formatarDataCurta(inicio);
  } else if (tipo === '7dias') {
    const fimD = new Date(base);
    fimD.setDate(fimD.getDate() - offset * 7);
    const iniD = new Date(fimD);
    iniD.setDate(iniD.getDate() - 6);
    inicio = formatarDataISO(iniD);
    fim = formatarDataISO(fimD);
    label = 'Últimos 7 dias';
  } else if (tipo === 'mes') {
    const ano = base.getFullYear();
    const mes = base.getMonth() - offset;
    const primeiro = new Date(ano, mes, 1);
    const ultimo = new Date(ano, mes + 1, 0);
    inicio = formatarDataISO(primeiro);
    fim = formatarDataISO(ultimo);
    label = offset === 0 ? 'Este mês' : 'Mês anterior';
  } else if (tipo === '30dias') {
    const fimD = new Date(base);
    fimD.setDate(fimD.getDate() - offset * 30);
    const iniD = new Date(fimD);
    iniD.setDate(iniD.getDate() - 29);
    inicio = formatarDataISO(iniD);
    fim = formatarDataISO(fimD);
    label = 'Últimos 30 dias';
  } else if (tipo === 'ano') {
    const ano = base.getFullYear() - offset;
    inicio = ano + '-01-01';
    fim = ano + '-12-31';
    label = offset === 0 ? 'Este ano' : String(ano);
  } else {
    // tipo === 'dia'
    const d = new Date(base);
    d.setDate(d.getDate() - offset);
    const iso = formatarDataISO(d);
    inicio = fim = iso;
    if (offset === 0) label = 'Hoje';
    else if (offset === 1) label = 'Ontem';
    else label = formatarDataCurta(iso);
  }
  return { inicio, fim, label };
}

function getIntervaloDashAtual() {
  return calcularIntervaloPeriodo(state.dashPeriodo, state.dashOffset);
}

// ====================================================================
//  RENDER DASHBOARD (mantém sparkline funcional)
// ====================================================================
function renderDashboard() {
  const intervalo = getIntervaloDashAtual();
  const agPeriodo = state.agendamentos.filter(a => a.data >= intervalo.inicio && a.data <= intervalo.fim);
  const vendasPeriodo = state.movimentos.filter(m => m.data >= intervalo.inicio && m.data <= intervalo.fim && m.tipo === 'venda');
  const totalRev = vendasPeriodo.reduce((s, v) => s + v.valor, 0);
  const totalVendas = vendasPeriodo.length;
  const ticket = totalVendas > 0 ? totalRev / totalVendas : 0;
  const realizados = agPeriodo.filter(a => a.status === 'realizado').length;

  const todayEl = document.getElementById('today-date');
  if (todayEl) todayEl.textContent = intervalo.label;

  animateKpi('kpi-revenue', fmtKz(totalRev));
  const revenueCount = document.getElementById('kpi-revenue-count');
  if (revenueCount) revenueCount.textContent = totalVendas + ' serviços';

  animateKpi('kpi-agendamentos', String(agPeriodo.length));
  const agStatus = document.getElementById('kpi-agendamentos-status');
  if (agStatus) agStatus.textContent = realizados + ' realizados';

  animateKpi('kpi-ticket', fmtKz(ticket));
  const ticketSub = document.getElementById('kpi-ticket-sub');
  if (ticketSub) ticketSub.textContent = 'por cliente';

  // ================================================================
  //  SPARKLINE + % INTELIGENTE (ligado ao filtro do dashboard)
  //  1) Pontos = ticket médio de cada dia do intervalo actual
  //  2) % = ticket médio do período actual vs período anterior equivalente
  // ================================================================
  const canvas = document.getElementById('ticket-sparkline');
  if (canvas) {
    canvas.style.display = 'block';
    canvas.style.visibility = 'visible';
    canvas.style.opacity = '1';
    const parent = canvas.parentElement;
    const rect = parent ? parent.getBoundingClientRect() : { width: 84 };
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = Math.max(rect.width || 84, 60);
    const cssHeight = 28;
    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);
    canvas.style.width = cssWidth + 'px';
    canvas.style.height = cssHeight + 'px';
  }

  // Construir série de ticket médio dia-a-dia dentro do intervalo do filtro
  const serieTicket = [];
  const dInicio = new Date(intervalo.inicio + 'T00:00:00');
  const dFim = new Date(intervalo.fim + 'T00:00:00');
  const msDia = 86400000;
  const diasNoPeriodo = Math.max(1, Math.round((dFim - dInicio) / msDia) + 1);
  // Limitar a 31 pontos para performance visual
  const passo = diasNoPeriodo > 31 ? Math.ceil(diasNoPeriodo / 31) : 1;
  for (let i = 0; i < diasNoPeriodo; i += passo) {
    const d = new Date(dInicio.getTime() + i * msDia);
    const ds = d.toISOString().split('T')[0];
    const vendasDia = state.movimentos.filter(m => m.data === ds && m.tipo === 'venda');
    const totalDia = vendasDia.reduce((s, v) => s + v.valor, 0);
    const qtdDia = vendasDia.length;
    serieTicket.push(qtdDia > 0 ? totalDia / qtdDia : 0);
  }
  // Garantir pelo menos 2 pontos
  if (serieTicket.length < 2) {
    serieTicket.push(serieTicket[0] || 0);
  }

  if (typeof desenharSparkline === 'function') {
    setTimeout(() => {
      try { desenharSparkline('ticket-sparkline', serieTicket, '#D4AF37'); }
      catch (e) { console.warn('[Sparkline]', e); }
    }, 40);
  }

  // % = ticket médio do período actual vs período anterior de mesma duração
  const duracaoMs = (dFim - dInicio) + msDia;
  const prevFim = new Date(dInicio.getTime() - msDia);
  const prevInicio = new Date(prevFim.getTime() - duracaoMs + msDia);
  const prevInicioStr = prevInicio.toISOString().split('T')[0];
  const prevFimStr = prevFim.toISOString().split('T')[0];
  const vendasPrev = state.movimentos.filter(m => m.tipo === 'venda' && m.data >= prevInicioStr && m.data <= prevFimStr);
  const totalPrev = vendasPrev.reduce((s, v) => s + v.valor, 0);
  const ticketPrev = vendasPrev.length > 0 ? totalPrev / vendasPrev.length : 0;

  let variacao = 0;
  if (ticketPrev > 0 && isFinite(ticket) && isFinite(ticketPrev)) {
    variacao = ((ticket - ticketPrev) / ticketPrev) * 100;
  } else if (ticket > 0 && ticketPrev === 0) {
    variacao = 100;
  }
  if (!isFinite(variacao) || isNaN(variacao)) variacao = 0;

  const subiu = variacao >= 0;
  const sinal = subiu ? '↑' : '↓';
  const percentEl = document.getElementById('ticket-trend-percent');
  if (percentEl) {
    percentEl.className = subiu ? 'trend-up' : 'trend-down';
    // Uma casa decimal (ex: 10.7%)
    const absVar = Math.abs(variacao);
    const texto = absVar >= 10 ? absVar.toFixed(1) : absVar.toFixed(1);
    percentEl.innerHTML = `<span class="trend-arrow">${sinal}</span> ${texto}%`;
    percentEl.style.display = 'inline-flex';
  }

  const trendPeriodEl = document.getElementById('ticket-trend-period');
  if (trendPeriodEl) trendPeriodEl.textContent = intervalo.label;

  // Próximos atendimentos — apenas HOJE e status "agendado" (após expirar os passados)
  atualizarAgendamentosExpirados();
  const hojeStr2 = hoje();
  const agora = new Date();
  const agHoje = (state.agendamentos || []).filter(a => a.data === hojeStr2);
  // Pendentes reais: status agendado E data/hora ainda no futuro (ou agora)
  const proximos = agHoje
    .filter(a => {
      if (a.status !== 'agendado') return false;
      const agDate = new Date(a.data + 'T' + (a.hora || '00:00') + ':00');
      return agDate >= agora;
    })
    .sort((a, b) => a.hora.localeCompare(b.hora))
    .slice(0, 6);
  const cont = document.getElementById('agenda-today-list');
  if (!cont) return;
  if (proximos.length === 0) {
    const temRealizados = agHoje.some(a => a.status === 'realizado');
    const temExpirados = agHoje.some(a => a.status === 'nao_realizado');
    let mensagemVazio = 'Nenhum atendimento pendente hoje';
    if (temRealizados && !temExpirados) mensagemVazio = 'Todos os atendimentos de hoje foram realizados';
    else if (temExpirados && !temRealizados) mensagemVazio = 'Sem atendimentos pendentes';
    cont.innerHTML = `<div class="empty-state"><p>${mensagemVazio}</p></div>`;
  } else {
    cont.innerHTML = proximos.map(a => {
      const nomeProf = getProfissionalNome(a.profissional_id);
      return `
        <div class="list-item">
          <div class="avatar">${(a.cliente || '?').charAt(0).toUpperCase()}</div>
          <div class="info">
            <div class="title" style="color:var(--gold-dark);font-weight:700;">${escHtml(a.servico)}</div>
            <div class="sub">${escHtml(a.cliente)} · ${a.hora} · ${escHtml(nomeProf)}</div>
          </div>
          <div class="action" style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
            <span class="pill pill-warning" style="font-size:.6rem;">Pendente</span>
            <span style="font-weight:700;font-size:.8rem;">${fmtKz(a.preco)}</span>
          </div>
        </div>
      `;
    }).join('');
  }
  const countEl = document.getElementById('agenda-count');
  if (countEl) {
    const n = proximos.length;
    countEl.textContent = n === 0 ? '0 pendentes' : (n === 1 ? '1 pendente' : n + ' pendentes');
  }

  const h = new Date().getHours();
  const greetEl = document.getElementById('greeting');
  if (greetEl) {
    greetEl.textContent = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  }
}

// ====================================================================
//  EVENTOS — Filtro de Período do Dashboard (ícone + popover)
//  CORREÇÃO (causa raiz do "filtro não funciona" / "sparkline estática"):
//  o botão #dash-filter-icon e as opções .dash-periodo-opcao já existiam
//  no HTML, e o motor (calcularIntervaloPeriodo) e o CSS do popover
//  também já existiam — mas não havia NENHUM addEventListener a ligá-los.
//  state.dashPeriodo/dashOffset nunca podiam mudar, por isso o KPI, o
//  sparkline (que já dependia corretamente de intervalo.fim) e o rótulo
//  ficavam sempre presos no valor por defeito. Não foi preciso mudar o
//  motor de cálculo nem o CSS — só faltava este bloco.
// ====================================================================
document.getElementById('dash-filter-icon')?.addEventListener('click', function(e) {
  e.stopPropagation();
  document.querySelectorAll('.dash-periodo-opcao').forEach(btn => {
    const ativa = btn.dataset.periodo === state.dashPeriodo &&
      (btn.dataset.periodo !== 'dia' || Number(btn.dataset.offset || 0) === state.dashOffset);
    btn.classList.toggle('active', ativa);
  });
  const customWrap = document.getElementById('dash-periodo-custom');
  if (state.dashPeriodo === 'custom') {
    if (customWrap) customWrap.style.display = 'flex';
    const iniInput = document.getElementById('dash-custom-inicio');
    const fimInput = document.getElementById('dash-custom-fim');
    if (iniInput) iniInput.value = state.dashCustomInicio || hoje();
    if (fimInput) fimInput.value = state.dashCustomFim || hoje();
  } else if (customWrap) {
    customWrap.style.display = 'none';
  }
  const overlay = document.getElementById('modal-periodo-dashboard');
  if (overlay.classList.contains('open')) closeModal('modal-periodo-dashboard');
  else openModal('modal-periodo-dashboard');
});

document.querySelectorAll('.dash-periodo-opcao').forEach(btn => {
  btn.addEventListener('click', function(e) {
    e.stopPropagation();
    const tipo = this.dataset.periodo;
    if (tipo === 'custom') {
      document.querySelectorAll('.dash-periodo-opcao').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      const customWrap = document.getElementById('dash-periodo-custom');
      if (customWrap) customWrap.style.display = 'flex';
      const iniInput = document.getElementById('dash-custom-inicio');
      const fimInput = document.getElementById('dash-custom-fim');
      if (iniInput) iniInput.value = state.dashCustomInicio || hoje();
      if (fimInput) fimInput.value = state.dashCustomFim || hoje();
      return;
    }
    state.dashPeriodo = tipo;
    state.dashOffset = Number(this.dataset.offset) || 0;
    localStorage.setItem('bp_dash_periodo', state.dashPeriodo);
    localStorage.setItem('bp_dash_offset', String(state.dashOffset));
    closeModal('modal-periodo-dashboard');
    renderDashboard();
  });
});

document.getElementById('dash-custom-aplicar')?.addEventListener('click', function(e) {
  e.stopPropagation();
  const ini = document.getElementById('dash-custom-inicio').value;
  const fim = document.getElementById('dash-custom-fim').value;
  if (!ini || !fim) { toast('Selecione as duas datas', 'error'); return; }
  if (ini > fim) { toast('A data inicial deve ser anterior à data final', 'error'); return; }
  state.dashPeriodo = 'custom';
  state.dashCustomInicio = ini;
  state.dashCustomFim = fim;
  localStorage.setItem('bp_dash_periodo', 'custom');
  localStorage.setItem('bp_dash_custom_inicio', ini);
  localStorage.setItem('bp_dash_custom_fim', fim);
  closeModal('modal-periodo-dashboard');
  renderDashboard();
});

// Fechar o popover ao tocar fora dele (mesmo padrão já usado no menu hambúrguer)
document.addEventListener('click', function(e) {
  const overlay = document.getElementById('modal-periodo-dashboard');
  const icon = document.getElementById('dash-filter-icon');
  if (overlay && overlay.classList.contains('open') && !overlay.contains(e.target) && e.target !== icon && !icon?.contains(e.target)) {
    closeModal('modal-periodo-dashboard');
  }
});

// ====================================================================
//  AGENDA — com filtro, expiração, badge e dia exato
// ====================================================================

// Estado do filtro da agenda
const agendaFilterKey = 'bp_agenda_filter';
let agendaFilter = localStorage.getItem(agendaFilterKey) || 'hoje';

// Função para verificar se um agendamento expirou
function agendamentoExpirado(ag) {
  const now = new Date();
  const agDate = new Date(ag.data + 'T' + (ag.hora || '00:00') + ':00');
  return agDate < now;
}

// Função para atualizar status de agendamentos expirados
function atualizarAgendamentosExpirados() {
  let atualizado = false;
  for (const ag of state.agendamentos) {
    if (ag.status === 'agendado' && agendamentoExpirado(ag)) {
      ag.status = 'nao_realizado';
      ag.updated_at = new Date().toISOString();
      dbPut('agendamentos', ag); // atualiza localmente
      atualizado = true;
    }
  }
  if (atualizado) {
    if (activeTab === 'agenda') renderAgendaFull();
    renderBadges();
  }
}

// Função para obter agendamentos filtrados (com suporte a dia exato)
function getAgendamentosFiltrados() {
  // Primeiro, atualizar expirados
  atualizarAgendamentosExpirados();

  const hojeStr = hoje();

  // Se o filtro for 'dia', usar a data exata
  if (agendaFilter === 'dia') {
    const dataExata = localStorage.getItem('bp_agenda_data_exata') || hojeStr;
    return state.agendamentos.filter(a => a.data === dataExata && a.status !== 'cancelado');
  }

  // Vistas por estado (qualquer data, sem excepção de nenhum dia)
  if (agendaFilter === 'realizados') {
    return state.agendamentos.filter(a => a.status === 'realizado');
  }
  if (agendaFilter === 'cancelados' || agendaFilter === 'nao_realizado') {
    // "Não realizados" = expirados + cancelados (tudo o que não chegou a ser feito)
    return state.agendamentos.filter(a => a.status === 'nao_realizado' || a.status === 'cancelado');
  }

switch (agendaFilter) {
    case 'hoje':
  const dataHoje = state.agendaDataAtual || hojeStr;
  return state.agendamentos.filter(a => a.data === dataHoje && a.status !== 'cancelado');
    case 'semana': {
      const d = new Date(hojeStr + 'T00:00:00');
      const diaSemana = d.getDay(); // 0=domingo
      const inicioSemana = new Date(d);
      inicioSemana.setDate(d.getDate() - diaSemana);
      const fimSemana = new Date(inicioSemana);
      fimSemana.setDate(inicioSemana.getDate() + 6);
      const inicio = formatarDataISO(inicioSemana);
      const fim = formatarDataISO(fimSemana);
      return state.agendamentos.filter(a => a.data >= inicio && a.data <= fim && a.status !== 'cancelado');
    }
    case 'mes': {
      const d = new Date(hojeStr + 'T00:00:00');
      const mes = d.getMonth();
      const ano = d.getFullYear();
      const ultimoDia = new Date(ano, mes + 1, 0).getDate();
      const inicio = `${ano}-${String(mes+1).padStart(2,'0')}-01`;
      const fim = `${ano}-${String(mes+1).padStart(2,'0')}-${String(ultimoDia).padStart(2,'0')}`;
      return state.agendamentos.filter(a => a.data >= inicio && a.data <= fim && a.status !== 'cancelado');
    }
    case 'todos':
    default:
      return state.agendamentos.filter(a => a.status !== 'cancelado');
  }
}

function renderAgendaFull() {
  const svgCalendario = window.svgCalendario || `<svg width="80" height="80" viewBox="0 0 80 80" fill="none" stroke="var(--neutral-300)" stroke-width="1.5"><rect x="16" y="20" width="48" height="48" rx="4"/><line x1="16" y1="32" x2="64" y2="32"/><line x1="28" y1="16" x2="28" y2="24"/><line x1="52" y1="16" x2="52" y2="24"/><circle cx="40" cy="44" r="6"/></svg>`;

  const cont = document.getElementById('agenda-full-list');
  if (!state.agendamentos || !Array.isArray(state.agendamentos)) {
    if (cont) cont.innerHTML = '<div class="empty-state">A carregar agendamentos...</div>';
    return;
  }

  // Atualizar expirados antes de renderizar
  atualizarAgendamentosExpirados();

  // Obter agendamentos filtrados
  const agsFiltrados = getAgendamentosFiltrados();
  const ags = agsFiltrados.sort((a, b) => a.data.localeCompare(b.data) || a.hora.localeCompare(b.hora));

// Atualizar label da data
const label = document.getElementById('agenda-date-label');
if (label) {
  const hojeStr = hoje();
  if (agendaFilter === 'dia') {
    const dataExata = localStorage.getItem('bp_agenda_data_exata') || hojeStr;
    label.textContent = new Date(dataExata + 'T00:00:00').toLocaleDateString('pt-AO', { day: '2-digit', month: 'long', year: 'numeric' });
  } else if (agendaFilter === 'hoje') {
    const dataAtual = state.agendaDataAtual || hojeStr;
    label.textContent = dataAtual === hojeStr ? 'Hoje' : new Date(dataAtual + 'T00:00:00').toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' });
  } else if (agendaFilter === 'semana') {
    label.textContent = 'Esta semana';
  } else if (agendaFilter === 'mes') {
    label.textContent = 'Este mês';
  } else if (agendaFilter === 'realizados') {
    label.textContent = 'Realizados';
  } else if (agendaFilter === 'cancelados') {
    label.textContent = 'Cancelados';
  } else {
    label.textContent = 'Todos';
  }
}
  if (!cont) return;

  if (ags.length === 0) {
    cont.innerHTML = `<div class="empty-state">${svgCalendario}<p>Sem agendamentos neste período</p></div>`;
    return;
  }

  // Agrupar por data se o filtro não for "hoje" nem "dia"
  const agrupar = (agendaFilter !== 'hoje' && agendaFilter !== 'dia');
  let html = '';
  if (agrupar) {
    const grupos = {};
    ags.forEach(a => {
      if (!grupos[a.data]) grupos[a.data] = [];
      grupos[a.data].push(a);
    });
    const datas = Object.keys(grupos).sort();
    datas.forEach(data => {
      const dataLabel = data === hoje() ? 'Hoje' : new Date(data + 'T00:00:00').toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' });
      html += `<div style="font-weight:600;font-size:.8rem;color:var(--text-secondary);padding:8px 0 4px;">${dataLabel}</div>`;
      html += grupos[data].map(a => renderAgendaItem(a)).join('');
    });
  } else {
    html = ags.map(a => renderAgendaItem(a)).join('');
  }
  cont.innerHTML = html;

  // Listeners para "Finalizar" (apenas os que não estão expirados)
  cont.querySelectorAll('[data-action="finalizar"]').forEach(btn => {
    btn.addEventListener('click', function() {
      const id = this.dataset.id;
      if (id) abrirFinalizarAtendimento(id);
    });
  });
}

function renderAgendaItem(a) {
  const isRealizado = a.status === 'realizado';
  const isCancelado = a.status === 'cancelado';
  const isExpirado = a.status === 'nao_realizado';
  const podeFinalizar = a.status === 'agendado' && !agendamentoExpirado(a);
  const podeCancelar = a.status === 'agendado';
  const nomeProf = getProfissionalNome(a.profissional_id);

  // Verificar novamente se expirou (por segurança)
  if (a.status === 'agendado' && agendamentoExpirado(a)) {
    a.status = 'nao_realizado';
    dbPut('agendamentos', a);
  }

  // Texto sem emojis, mais profissional
  let statusLabel = '';
  let statusClass = '';

  if (isRealizado) {
    statusLabel = 'Realizado';
    statusClass = 'pill-success';
  } else if (isCancelado) {
    statusLabel = 'Cancelado';
    statusClass = 'pill-gray';
  } else if (isExpirado) {
    statusLabel = 'Não realizado';
    statusClass = 'pill-danger';
  } else {
    statusLabel = 'Agendado';
    statusClass = 'pill-warning';
  }

  return `
    <div class="timeline-item">
      <div class="time">${a.hora}</div>
      <div class="event">
        <div class="service">${escHtml(a.servico)}</div>
        <div class="client">${escHtml(a.cliente)}</div>
        <div class="meta">
          <span>${escHtml(nomeProf)}</span>
          <span class="pill" style="font-weight:700;">${fmtKz(a.preco)}</span>
          <span class="pill ${statusClass}" style="font-size:.75rem;padding:4px 12px;border-radius:4px;">${statusLabel}</span>
        </div>
        ${(podeFinalizar || podeCancelar) ? `
        <div class="timeline-actions">
          ${podeFinalizar ? `<button class="btn btn-sm btn-success" data-id="${a.id}" data-action="finalizar">Finalizar atendimento</button>` : ''}
          ${podeCancelar ? `<button class="btn btn-sm btn-secondary btn-icon-only" data-id="${a.id}" data-action="cancelar-agenda" data-role="admin,gerente" aria-label="Cancelar agendamento" title="Cancelar agendamento">✕</button>` : ''}
        </div>` : ''}
      </div>
    </div>
  `;
}
function abrirFinalizarAtendimento(id) {
  const ag = state.agendamentos.find(a => a.id === id);
  if (!ag) return;
  if (ag.status === 'realizado' || ag.status === 'nao_realizado' || ag.status === 'cancelado') {
    toast('Este atendimento já foi finalizado, cancelado ou expirou.', 'warning');
    return;
  }
  const nomeProf = getProfissionalNome(ag.profissional_id);
  document.getElementById('finalizar-ag-id').value = ag.id;
  document.getElementById('finalizar-info').innerHTML =
    `<strong>${escHtml(ag.servico)}</strong><br>${escHtml(ag.cliente)} · ${ag.hora} · ${escHtml(nomeProf)} · ${fmtKz(ag.preco)}`;
  document.getElementById('finalizar-pagamento').value = 'Numerário';
  openModal('modal-finalizar');
}

function mudarAgenda(delta) {
  // Navegação adaptada ao filtro atual
  if (agendaFilter === 'hoje') {
    const atual = new Date(state.agendaDataAtual || hoje());
    atual.setDate(atual.getDate() + delta);
    state.agendaDataAtual = atual.toISOString().split('T')[0];
    renderAgendaFull();
  } else if (agendaFilter === 'dia') {
    // Navegar por dias no modo "Dia Exato"
    const dataAtual = localStorage.getItem('bp_agenda_data_exata') || hoje();
    const d = new Date(dataAtual + 'T00:00:00');
    d.setDate(d.getDate() + delta);
    const novaData = formatarDataISO(d);
    localStorage.setItem('bp_agenda_data_exata', novaData);
    renderAgendaFull();
  }
  // Nos modos "semana", "mes", "todos" as setas não têm efeito
}

// ====================================================================
//  BADGE DA AGENDA (contar todos os disponíveis)
// ====================================================================
function renderBadges() {
  // Primeiro, atualizar expirados
  atualizarAgendamentosExpirados();

  // Contar agendamentos disponíveis (status "agendado" e data/hora >= agora)
  const agora = new Date();
  const disponiveis = state.agendamentos.filter(a => {
    if (a.status !== 'agendado') return false;
    const agDate = new Date(a.data + 'T' + (a.hora || '00:00') + ':00');
    return agDate >= agora;
  });
  const count = disponiveis.length;

  const badge = document.getElementById('agenda-badge');
  if (badge) {
    if (count > 0) {
      badge.textContent = count > 9 ? '9+' : count;
      badge.classList.add('show');
    } else {
      badge.classList.remove('show');
    }
  }
}

// ====================================================================
//  EVENTOS — Filtro da Agenda
// ====================================================================

// Restaurar filtro
agendaFilter = localStorage.getItem(agendaFilterKey) || 'hoje';

// Marcar opção ativa no popover (usando classes CSS)
function atualizarFiltroAgendaUI() {
  document.querySelectorAll('.agenda-periodo-filter').forEach(btn => {
    const periodo = btn.dataset.periodo;
    btn.classList.toggle('active', periodo === agendaFilter);
  });
}

// Fechar popover (função auxiliar)
function fecharPopover() {
  const popover = document.getElementById('agenda-filter-popover');
  if (popover) popover.style.display = 'none';
}

// Toggle do popover
document.getElementById('agenda-filter-icon')?.addEventListener('click', function(e) {
  e.stopPropagation();
  const popover = document.getElementById('agenda-filter-popover');
  if (!popover) return;
  const isOpen = popover.style.display === 'block';
  popover.style.display = isOpen ? 'none' : 'block';
  if (!isOpen) {
    atualizarFiltroAgendaUI();
  }
});

// Fechar popover ao clicar fora
document.addEventListener('click', function(e) {
  const popover = document.getElementById('agenda-filter-popover');
  const btn = document.getElementById('agenda-filter-icon');
  if (popover && popover.style.display === 'block') {
    if (!popover.contains(e.target) && e.target !== btn) {
      fecharPopover();
    }
  }
});

// Listeners para todos os botões de filtro (incluindo Dia Exato)
document.querySelectorAll('.agenda-periodo-filter').forEach(btn => {
  btn.addEventListener('click', function(e) {
    e.stopPropagation();
    const periodo = this.dataset.periodo;

    // Dia Exato: abrir seletor de data
    if (periodo === 'dia') {
      const input = document.getElementById('agenda-data-exata');
      if (input) {
        input.click();
      }
      return; // não fecha popover nem muda o filtro ainda
    }

    // Outros períodos (hoje, semana, mes, todos)
    agendaFilter = periodo;
    localStorage.setItem(agendaFilterKey, periodo);

    // Resetar data atual quando voltar a "hoje"
    if (periodo === 'hoje') {
      state.agendaDataAtual = hoje();
    }

    // Limpar data exata se não for "dia"
    localStorage.removeItem('bp_agenda_data_exata');

    atualizarFiltroAgendaUI();
    fecharPopover();
    renderAgendaFull();
    renderBadges();
  });
});

// Input de data para Dia Exato
document.getElementById('agenda-data-exata')?.addEventListener('change', function() {
  const data = this.value;
  if (data) {
    agendaFilter = 'dia';
    localStorage.setItem(agendaFilterKey, 'dia');
    localStorage.setItem('bp_agenda_data_exata', data);
    atualizarFiltroAgendaUI();
    fecharPopover();
    renderAgendaFull();
    renderBadges();
  }
});

// ====================================================================
//  SINCRONIZAÇÃO (unificada com debounce)
// ====================================================================
let syncTimeout = null;

function syncAgenda() {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    if (document.visibilityState === 'visible') {
      atualizarAgendamentosExpirados();
      if (activeTab === 'agenda') renderAgendaFull();
      renderBadges();
    }
  }, 200);
}

// Verificar expirados a cada 60 segundos
setInterval(syncAgenda, 60000);

// Verificar quando a app volta ao foco
document.addEventListener('visibilitychange', syncAgenda);



/* ===== FILE: ui-render-clientes-caixa-equipa.js ===== */

// ====================================================================
//  ui-render-clientes-caixa-equipa.js — extraído do app.js (Fase C da modularização)
//  Conteúdo: Renderização de Clientes, Caixa, Profissionais e Serviços
//  Linhas originais: 611-910
//  Carregar depois de core-*.js, db-indexeddb.js, sync-*.js, auth-supabase.js
// ====================================================================

// ====================================================================
//  ESTATÍSTICAS DO CLIENTE (partilhado entre a lista e o modal de perfil)
// ====================================================================
// Cache O(1) por render — invalidado quando mudam tamanhos das listas
let _statsCache = { key: '', map: null };

function _buildStatsMap() {
  const map = {};
  (state.agendamentos || []).forEach(a => {
    if (a.status === 'cancelado' || !a.cliente) return;
    if (!map[a.cliente]) map[a.cliente] = { visitas: 0, totalGasto: 0, datas: [] };
    map[a.cliente].visitas++;
    if (a.data) map[a.cliente].datas.push(a.data);
  });
  (state.movimentos || []).forEach(m => {
    if (m.tipo !== 'venda' || !m.cliente) return;
    if (!map[m.cliente]) map[m.cliente] = { visitas: 0, totalGasto: 0, datas: [] };
    map[m.cliente].visitas++;
    map[m.cliente].totalGasto += Number(m.valor) || 0;
    if (m.data) map[m.cliente].datas.push(m.data);
  });
  Object.keys(map).forEach(k => {
    map[k].datas.sort();
    map[k].ultimaVisita = map[k].datas.length ? map[k].datas[map[k].datas.length - 1] : null;
    delete map[k].datas;
  });
  return map;
}

function getEstatisticasCliente(nomeCliente) {
  const key = (state.agendamentos || []).length + ':' + (state.movimentos || []).length;
  if (!_statsCache.map || _statsCache.key !== key) {
    _statsCache = { key, map: _buildStatsMap() };
  }
  return _statsCache.map[nomeCliente] || { visitas: 0, totalGasto: 0, ultimaVisita: null };
}

function formatarUltimaVisita(iso) {
  if (!iso) return 'Sem visitas registadas';
  const dias = Math.floor((new Date(hoje() + 'T00:00:00') - new Date(iso + 'T00:00:00')) / 86400000);
  if (dias === 0) return 'Hoje';
  if (dias === 1) return 'Ontem';
  if (dias < 30) return `Há ${dias} dias`;
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', year: 'numeric' });
}


/** Insere HTML de linhas via DocumentFragment (menos reflow que innerHTML repetido) */
function appendRowsHtml(container, htmlStrings) {
  if (!container || !htmlStrings || !htmlStrings.length) return;
  const frag = document.createDocumentFragment();
  const wrap = document.createElement('div');
  wrap.innerHTML = htmlStrings.join('');
  while (wrap.firstChild) frag.appendChild(wrap.firstChild);
  container.appendChild(frag);
}

/** Sentinel IntersectionObserver para "carregar mais" */
function observeLoadMore(sentinel, onVisible) {
  if (!sentinel || typeof IntersectionObserver === 'undefined') return null;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) onVisible();
    });
  }, { root: null, rootMargin: '120px', threshold: 0 });
  io.observe(sentinel);
  return io;
}

function renderClientes() {
  const cont0 = document.getElementById('clientes-list');
  if (!state.clientes || !Array.isArray(state.clientes)) {
    if (cont0) cont0.innerHTML = '<div class="empty-state">A carregar clientes...</div>';
    return;
  }
  const search = document.getElementById('search-cliente')?.value.toLowerCase() || '';
  const filtro = state.filtroClientes || 'todos';
  const freqMap = {};
  (state.agendamentos || []).filter(a => a.status !== 'cancelado').forEach(a => { freqMap[a.cliente] = (freqMap[a.cliente] || 0) + 1; });
  (state.movimentos || []).filter(m => m.tipo === 'venda').forEach(v => { freqMap[v.cliente] = (freqMap[v.cliente] || 0) + 1; });

  let filtered = state.clientes.filter(c => c.nome.toLowerCase().includes(search));
  if (filtro === 'mais') filtered.sort((a, b) => (freqMap[b.nome] || 0) - (freqMap[a.nome] || 0));
  else if (filtro === 'menos') filtered.sort((a, b) => (freqMap[a.nome] || 0) - (freqMap[b.nome] || 0));

  const cont = document.getElementById('clientes-list');
  if (filtered.length === 0) {
    cont.innerHTML = `<div class="empty-state">${svgPessoa}<p>${search ? 'Nenhum resultado' : 'Nenhum cliente ainda'}</p></div>`;
    return;
  }

  // Progressive render: primeiros 60 itens, resto sob demanda (P1 performance)
  const INITIAL = 60;
  const rowHtml = (c) => {
    const { visitas, totalGasto, ultimaVisita } = getEstatisticasCliente(c.nome);
    const clienteNovo = visitas === 0;
    return `
      <div class="list-item cliente-item" data-cliente-id="${c.id}" style="cursor:pointer;">
        <div class="avatar">${(c.nome||'?').charAt(0).toUpperCase()}</div>
        <div class="info">
          <div class="title">${escHtml(c.nome)}</div>
          <div class="sub">${escHtml(c.telefone || 'Sem contacto')}${c.notas ? ' · ' + escHtml(c.notas) : ''}</div>
          <div class="cliente-stats">
            <span class="cliente-stat">${visitas} ${visitas === 1 ? 'visita' : 'visitas'}</span>
            ${totalGasto > 0 ? `<span class="cliente-stat cliente-stat--gasto">${fmtKz(totalGasto)} gastos</span>` : ''}
            ${clienteNovo ? `<span class="cliente-stat cliente-stat--novo">Novo</span>` : `<span class="cliente-stat">${formatarUltimaVisita(ultimaVisita)}</span>`}
          </div>
        </div>
        <div class="actions">
          <button class="row-menu-btn" data-action="row-menu" data-tipo="cliente" data-id="${c.id}" aria-label="Mais ações" aria-haspopup="menu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
          </button>
        </div>
      </div>`;
  };
  const first = filtered.slice(0, INITIAL);
  cont.innerHTML = first.map(rowHtml).join('');
  if (filtered.length > INITIAL) {
    const more = document.createElement('div');
    more.className = 'list-load-more';
    more.style.cssText = 'padding:12px;text-align:center;';
    more.innerHTML = '<button type="button" class="btn btn-secondary btn-sm" id="clientes-load-more">Mostrar mais (' + (filtered.length - INITIAL) + ')</button><div id="clientes-io-sentinel" style="height:1px;" aria-hidden="true"></div>';
    cont.appendChild(more);
    const btn = more.querySelector('#clientes-load-more');
    if (btn) {
      let offset = INITIAL;
      btn.onclick = () => {
        const next = filtered.slice(offset, offset + INITIAL);
        offset += next.length;
        const htmls = next.map(rowHtml);
        if (typeof appendRowsHtml === 'function') appendRowsHtml(cont, htmls);
        else next.forEach(c => cont.insertAdjacentHTML('beforeend', rowHtml(c)));
        cont.appendChild(more);
        if (offset >= filtered.length) more.remove();
        else btn.textContent = 'Mostrar mais (' + (filtered.length - offset) + ')';
        if (typeof bindClienteRowEvents === 'function') bindClienteRowEvents(cont);
      };
      const sent = more.querySelector('#clientes-io-sentinel');
      if (sent && typeof observeLoadMore === 'function') {
        observeLoadMore(sent, function() {
          if (btn && document.body.contains(btn)) btn.click();
        });
      }
    }
  }

}

function renderCaixa() {
  if (!state.movimentos || !Array.isArray(state.movimentos)) {
    const cont0 = document.getElementById('movimentos-list');
    if (cont0) cont0.innerHTML = '<div class="empty-state">A carregar movimentos...</div>';
    return;
  }
  const hojeStr = hoje();
  const entradas = state.movimentos.filter(m => m.data === hojeStr && m.tipo === 'venda').reduce((s, m) => s + m.valor, 0);
  const despesas = state.movimentos.filter(m => m.data === hojeStr && m.tipo === 'despesa').reduce((s, m) => s + m.valor, 0);
  document.getElementById('caixa-saldo').textContent = fmtKz(state.config.fundo + entradas - despesas);
  document.getElementById('caixa-fundo').textContent = fmtKz(state.config.fundo);
  // Variação do faturamento de hoje face a ontem
  const dOntem = new Date();
  dOntem.setDate(dOntem.getDate() - 1);
  const ontemStr = dOntem.getFullYear() + '-' + String(dOntem.getMonth() + 1).padStart(2, '0') + '-' + String(dOntem.getDate()).padStart(2, '0');
  const totalOntem = state.movimentos.filter(m => m.data === ontemStr && m.tipo === 'venda').reduce((s, m) => s + m.valor, 0);
  const variacaoEl = document.getElementById('caixa-variacao');
  if (variacaoEl) {
    let variacao = 0;
    if (totalOntem > 0) {
      variacao = ((entradas - totalOntem) / totalOntem) * 100;
    } else if (entradas > 0) {
      variacao = 100;
    }
    const subiu = variacao >= 0;
    variacaoEl.textContent = `${subiu ? '↑' : '↓'} ${Math.abs(Math.round(variacao))}%`;
    variacaoEl.style.color = subiu ? 'var(--green)' : 'var(--red)';
  }

  const periodo = state.histPeriodo || 'hoje';
  const movs = getMovimentosPeriodo(periodo).sort((a, b) => b.data.localeCompare(a.data) || b.hora.localeCompare(a.hora));
  const titEl = document.getElementById('hist-titulo');
  if (titEl) titEl.textContent = (typeof tituloPeriodoCaixa === 'function' ? tituloPeriodoCaixa(periodo) : 'Movimentos');

  const cont = document.getElementById('movimentos-list');
  if (movs.length === 0) { cont.innerHTML = `<div class="empty-state">${svgCarteira}<p>Sem movimentos neste período</p></div>`; return; }
  const MOV_INITIAL = 80;
  const movRow = (m) => {
    const isV = m.tipo === 'venda';
    const nomeProf = typeof getProfissionalNome === 'function' ? getProfissionalNome(m.profissional_id) : '';
    return `
      <div class="list-item${isV ? ' list-item-venda' : ''}" data-id="${m.id}" data-tipo="${m.tipo}" style="padding-right:${isV ? '32px' : '16px'};">
        <div class="avatar" style="background:${isV ? '#E6F4EC' : '#FDE8E8'};color:${isV ? 'var(--green)' : 'var(--red)'};font-size:0;" aria-hidden="true"><span style="display:block;width:8px;height:8px;border-radius:50%;background:currentColor;margin:auto;"></span></div>
        <div class="info">
          <div class="title">${escHtml(m.descricao||'')}</div>
          <div class="sub">${m.data} · ${m.hora || ''}${m.cliente ? ' · ' + escHtml(m.cliente) : ''}${nomeProf ? ' · ' + escHtml(nomeProf) : ''}</div>
        </div>
        <div class="action" style="color:${isV ? 'var(--green)' : 'var(--red)'};">${isV ? '+' : '−'}${fmtKz(m.valor)}</div>
      </div>`;
  };
  const movFirst = movs.slice(0, MOV_INITIAL);
  cont.innerHTML = movFirst.map(movRow).join('');
  if (movs.length > MOV_INITIAL) {
    const more = document.createElement('div');
    more.style.cssText = 'padding:12px;text-align:center;';
    more.innerHTML = '<button type="button" class="btn btn-secondary btn-sm" id="movs-load-more">Mostrar mais (' + (movs.length - MOV_INITIAL) + ')</button><div id="movs-io-sentinel" style="height:1px;" aria-hidden="true"></div>';
    cont.appendChild(more);
    let off = MOV_INITIAL;
    const movBtn = more.querySelector('#movs-load-more');
    const movSent = more.querySelector('#movs-io-sentinel');
    const loadMoreMovs = function() {
      const next = movs.slice(off, off + MOV_INITIAL);
      off += next.length;
      if (typeof appendRowsHtml === 'function') appendRowsHtml(cont, next.map(movRow)); else next.forEach(m => cont.insertAdjacentHTML('beforeend', movRow(m)));
      cont.appendChild(more);
      if (off >= movs.length) more.remove();
      else this.textContent = 'Mostrar mais (' + (movs.length - off) + ')';
      cont.querySelectorAll('.list-item-venda').forEach(el => {
        el.onclick = () => { if (typeof abrirDetalheVenda === 'function') abrirDetalheVenda(el.dataset.id); };
      });
    };
    if (movBtn) movBtn.onclick = loadMoreMovs;
    if (movSent && typeof observeLoadMore === 'function') observeLoadMore(movSent, function() { if (movBtn && document.body.contains(movBtn)) loadMoreMovs(); });
  }
  cont.querySelectorAll('.list-item-venda').forEach(el => {
    el.onclick = () => { if (typeof abrirDetalheVenda === 'function') abrirDetalheVenda(el.dataset.id); };
  });


  cont.querySelectorAll('.list-item').forEach(el => {
    el.addEventListener('click', e => {
      if (el.dataset.tipo === 'venda') { addRipple(el, e);
        abrirDetalheVenda(el.dataset.id); } else toast('Detalhes disponíveis apenas para vendas', 'warning');
    });
  });
}

function getMovimentosPeriodo(periodo) {
  const hojeStr = hoje();
  const now = new Date();
  const iso = (d) => d.toISOString().split('T')[0];
  return state.movimentos.filter(m => {
    if (periodo === 'hoje') return m.data === hojeStr;
    if (periodo === 'ontem') {
      const d = new Date(now); d.setDate(d.getDate() - 1);
      return m.data === iso(d);
    }
    if (periodo === '7dias') {
      const d7 = new Date(now); d7.setDate(d7.getDate() - 6);
      return m.data >= iso(d7);
    }
    if (periodo === '30dias') {
      const d30 = new Date(now); d30.setDate(d30.getDate() - 29);
      return m.data >= iso(d30);
    }
    if (periodo === 'semana') {
      const d = new Date(hojeStr + 'T00:00:00');
      const dia = d.getDay();
      const inicio = new Date(d); inicio.setDate(d.getDate() - dia);
      return m.data >= iso(inicio) && m.data <= hojeStr;
    }
    if (periodo === 'mes') {
      const mes = String(now.getMonth() + 1).padStart(2, '0');
      return m.data.startsWith(now.getFullYear() + '-' + mes);
    }
    if (periodo === 'ano') {
      return m.data.startsWith(String(now.getFullYear()));
    }
    if (periodo === 'dia') {
      const dataExata = localStorage.getItem('bp_caixa_data_exata') || hojeStr;
      return m.data === dataExata;
    }
    if (periodo === 'tudo') return true;
    return true;
  });
}

function tituloPeriodoCaixa(periodo) {
  const map = {
    hoje: 'Movimentos de Hoje',
    ontem: 'Movimentos de Ontem',
    semana: 'Movimentos desta Semana',
    '7dias': 'Últimos 7 dias',
    '30dias': 'Últimos 30 dias',
    mes: 'Movimentos deste Mês',
    ano: 'Movimentos deste Ano',
    dia: 'Movimentos do dia seleccionado',
    tudo: 'Histórico Completo'
  };
  return map[periodo] || 'Movimentos';
}

function renderProfissionais() {
  const cont = document.getElementById('profissionais-list');
  if (!cont) return;
  const plano = getPlanoAtual();
  const aviso = document.getElementById('plano-aviso');
  if (aviso) aviso.style.display = (plano === 'trial' || plano === 'starter') ? 'block' : 'none';

  if (state.profissionais.length === 0) {
    cont.innerHTML = `<div class="empty-state">${svgPessoas}<p>Adicione o primeiro profissional</p></div>`;
    return;
  }
  const profissionaisOrdenados = [...state.profissionais].sort((a, b) => a.nome.localeCompare(b.nome));
  cont.innerHTML = profissionaisOrdenados.map(p => {
    let taxa = 0, saldo = 0, barra = '';
    try {
      taxa = Number(p.taxa_comissao) || 0;
      if (typeof getSaldoComissao === 'function') saldo = getSaldoComissao(p.id) || 0;
      if (typeof renderBarraMeta === 'function') barra = renderBarraMeta(p.id) || '';
    } catch (e) {}
    return `
    <div class="list-item" data-prof-id="${p.id}" style="cursor:pointer;">
      <div class="avatar">${p.nome.charAt(0).toUpperCase()}</div>
      <div class="info">
        <div class="title">${escHtml(p.nome)}</div>
        <div class="sub">${escHtml(p.especialidade || 'Sem especialidade definida')}</div>
        <div class="cliente-stats">
          ${p.idade ? `<span class="cliente-stat">${p.idade} anos</span>` : ''}
          ${p.contacto ? `<span class="cliente-stat">${escHtml(p.contacto)}</span>` : ''}
          ${taxa > 0 ? `<span class="cliente-stat">Comissão ${taxa}%</span>` : ''}
        </div>
        ${taxa > 0 || saldo > 0 ? `<div style="font-size:.68rem;color:var(--text-secondary);margin-top:4px;">Comissão acumulada: <strong style="color:var(--gold-dark,var(--gold));">${fmtKz(saldo)}</strong></div>` : ''}
        ${barra}
      </div>
      <div class="actions">
        <button class="row-menu-btn" data-action="row-menu" data-tipo="profissional" data-id="${p.id}" data-role="admin" aria-label="Mais ações" aria-haspopup="menu">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.75"/><circle cx="12" cy="12" r="1.75"/><circle cx="12" cy="19" r="1.75"/></svg>
        </button>
      </div>
    </div>
  `;
  }).join('');
}

function renderServicos() {
  const container = document.getElementById('servicos-list');
  if (!container) return;
  if (state.servicos.length === 0) {
    container.innerHTML = `<div class="empty-state">${svgTesoura}<p>Nenhum serviço cadastrado</p></div>`;
    return;
  }
  const servicosOrdenados = [...state.servicos].sort((a, b) => a.nome.localeCompare(b.nome));
  container.innerHTML = servicosOrdenados.map(s => {
    const profs = s.profissionais && s.profissionais.length > 0 ? s.profissionais.join(', ') : 'Todos os profissionais disponíveis';
    return `
      <div class="list-item" style="cursor:default;">
        <div class="avatar" style="background:var(--gold-light);color:var(--gold-dark);font-size:0;" aria-hidden="true"><span style="display:block;width:8px;height:8px;border-radius:50%;background:currentColor;margin:auto;"></span></div>
        <div class="info">
          <div class="title">${escHtml(s.nome)}</div>
          <div class="sub">${fmtKz(s.precoBase)} · ${escHtml(profs)}</div>
        </div>
        <div class="actions">
          <button class="row-menu-btn" data-action="row-menu" data-tipo="servico" data-id="${s.id}" data-role="admin" aria-label="Mais ações" aria-haspopup="menu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.75"/><circle cx="12" cy="12" r="1.75"/><circle cx="12" cy="19" r="1.75"/></svg>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// renderBadges: a única declaração válida está em ui-render-dashboard-agenda.js
// (conta agendamentos futuros/pendentes em todos os dias, não só hoje). Esta
// cópia antiga foi removida — carregava depois e estava a ganhar sempre,
// travando o indicador num valor desatualizado.

// ====================================================================
//  SETUP DE PRECIFICAÇÃO E SELECTS
// ====================================================================
function setupPrecoAutomatico(selectId, inputPrecoId) {
  const select = document.getElementById(selectId);
  const inputPreco = document.getElementById(inputPrecoId);
  if (!select || !inputPreco) return;
  if (select._precoHandler) select.removeEventListener('change', select._precoHandler);
  const handler = () => {
    const nome = select.value;
    if (!nome || nome === 'Outro' || nome === '__custom') {
      inputPreco.value = '';
      inputPreco.disabled = false;
      inputPreco.style.opacity = '1';
      return;
    }
    const serv = state.servicos.find(s => s.nome === nome);
    if (serv) {
      inputPreco.value = serv.precoBase;
      inputPreco.disabled = true;
      inputPreco.style.opacity = '0.7';
    } else {
      inputPreco.value = '';
      inputPreco.disabled = false;
      inputPreco.style.opacity = '1';
    }
  };
  select._precoHandler = handler;
  select.addEventListener('change', handler);
  handler();
}

function populateAgendaSelects() {
  const profSel = document.getElementById('agenda-profissional');
  const servSel = document.getElementById('agenda-servico');
  if (!profSel || !servSel) return;

  // Verificar se há serviços
  if (state.servicos.length === 0) {
    servSel.innerHTML = '<option value="">Nenhum serviço disponível</option>';
    profSel.innerHTML = '<option value="">Nenhum profissional disponível</option>';
    return;
  }

  const prevServico = servSel.value;
  servSel.innerHTML = state.servicos.map(s =>
    `<option value="${escHtml(s.nome)}">${escHtml(s.nome)}</option>`
  ).join('') + '<option value="Outro">Outro / Personalizado</option>';
  if (prevServico) servSel.value = prevServico;

  const filtrarProfsAgenda = (servicoNome) => {
    // Se não houver profissionais, mostrar opção vazia
    if (state.profissionais.length === 0) {
      profSel.innerHTML = '<option value="">Nenhum profissional disponível</option>';
      return;
    }

    let profs;
    if (!servicoNome || servicoNome === 'Outro') {
      profs = state.profissionais.map(p => ({ id: p.id, nome: p.nome }));
    } else {
      const serv = state.servicos.find(s => s.nome === servicoNome);
      const nomes = serv && serv.profissionais && serv.profissionais.length > 0
        ? serv.profissionais
        : state.profissionais.map(p => p.nome);
      profs = state.profissionais
        .filter(p => nomes.includes(p.nome))
        .map(p => ({ id: p.id, nome: p.nome }));
    }
    const prevProfId = profSel.value;
    profSel.innerHTML = profs.map(p =>
      `<option value="${p.id}">${escHtml(p.nome)}</option>`
    ).join('');
    if (profs.some(p => p.id === prevProfId)) profSel.value = prevProfId;
  };

  filtrarProfsAgenda(servSel.value);
  if (servSel._filterHandler) servSel.removeEventListener('change', servSel._filterHandler);
  servSel._filterHandler = function() { filtrarProfsAgenda(this.value); };
  servSel.addEventListener('change', servSel._filterHandler);
}

function populateVendaSelects() {
  const profSel = document.getElementById('venda-profissional');
  const catSel = document.getElementById('ci-servico-sel');
  if (!profSel || !catSel) return;

  // Verificar se há serviços
  if (state.servicos.length === 0) {
    catSel.innerHTML = '<option value="">Nenhum serviço disponível</option>';
    profSel.innerHTML = '<option value="">Nenhum profissional disponível</option>';
    return;
  }

  catSel.selectedIndex = -1;

  catSel.innerHTML = `<option value="">Selecionar serviço</option>` +
    state.servicos.map(s =>
      `<option value="${escHtml(s.nome)}" data-preco="${s.precoBase}">${escHtml(s.nome)}</option>`
    ).join('') +
    '<option value="__custom" data-preco="">Outro (personalizado)</option>';

  const filtrarProfsVenda = (servicoNome) => {
    // Se não houver profissionais, mostrar opção vazia
    if (state.profissionais.length === 0) {
      profSel.innerHTML = '<option value="">Nenhum profissional disponível</option>';
      return;
    }

    let profs;
    if (!servicoNome || servicoNome === '__custom') {
      profs = state.profissionais.map(p => ({ id: p.id, nome: p.nome }));
    } else {
      const serv = state.servicos.find(s => s.nome === servicoNome);
      const nomes = serv && serv.profissionais && serv.profissionais.length > 0
        ? serv.profissionais
        : state.profissionais.map(p => p.nome);
      profs = state.profissionais
        .filter(p => nomes.includes(p.nome))
        .map(p => ({ id: p.id, nome: p.nome }));
    }
    profSel.innerHTML = `<option value="">Selecionar profissional</option>` +
      profs.map(p =>
        `<option value="${p.id}">${escHtml(p.nome)}</option>`
      ).join('');
  };

  if (catSel._filterHandler) catSel.removeEventListener('change', catSel._filterHandler);
  catSel._filterHandler = function() {
    filtrarProfsVenda(this.value);
    const opt = this.options[this.selectedIndex];
    const ciValor = document.getElementById('ci-valor');
    if (this.value === '__custom') {
      if (ciValor) { ciValor.value = ''; ciValor.disabled = false; ciValor.style.opacity = '1'; }
    } else if (opt && opt.dataset.preco) {
      if (ciValor) { ciValor.value = opt.dataset.preco; ciValor.disabled = true; ciValor.style.opacity = '0.7'; }
    } else {
      if (ciValor) { ciValor.value = ''; ciValor.disabled = false; ciValor.style.opacity = '1'; }
    }
  };
  catSel.addEventListener('change', catSel._filterHandler);
}



/* ===== FILE: chart-module.js ===== */

// ====================================================================
//  chart-module.js — extraído do app.js (Fase C da modularização)
//  Conteúdo: Gráfico semanal (swipe, renderização) e controlos do gráfico
//  Linhas originais: 911-1142
//  Carregar depois de core-*.js, db-indexeddb.js, sync-*.js, auth-supabase.js
// ====================================================================

// ====================================================================
//  GRÁFICO
// ====================================================================
let _chartSwipeStartX = null;
let _chartSwipeStartY = null;

function renderizarGrafico() {
  const canvas = document.getElementById('weekly-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const parentWidth = canvas.parentElement.getBoundingClientRect().width || 400;
  const width = Math.max(parentWidth, 200);
  const height = 160;
  canvas.width = width;
  canvas.height = height;
  ctx.clearRect(0, 0, width, height);

  const periodo = state.chartPeriodo || 'semana';
  const offset = state.chartOffset || 0;
  const mostrarValores = state.chartMostrarValores || false;

  const diasArr = [];
  let labels = [];
  let dados = [];
  let maxVal = 1;

  if (periodo === 'hora') {
    for (let h = 0; h < 12; h++) {
      const d = new Date();
      d.setDate(d.getDate() - offset);
      const ds = d.toISOString().split('T')[0];
      const hr = String(h * 2).padStart(2, '0');
      diasArr.push({ label: hr + 'h', data: ds, hora: hr });
    }
    labels = diasArr.map(d => d.label);
    dados = diasArr.map(d => {
      const hr = parseInt(d.hora);
      const total = state.movimentos.filter(m =>
        m.data === d.data && m.tipo === 'venda' && m.hora &&
        parseInt(m.hora.split(':')[0]) >= hr && parseInt(m.hora.split(':')[0]) < hr + 2
      ).reduce((s, v) => s + v.valor, 0);
      if (total > maxVal) maxVal = total;
      return total;
    });
  } else if (periodo === 'dia' || periodo === 'semana') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i - offset * 7);
      const ds = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('pt-AO', { weekday: 'short' }).replace('.', '');
      diasArr.push({ label, data: ds });
    }
    labels = diasArr.map(d => d.label);
    dados = diasArr.map(d => {
      const total = state.movimentos.filter(m => m.data === d.data && m.tipo === 'venda').reduce((s, v) => s + v.valor, 0);
      if (total > maxVal) maxVal = total;
      return total;
    });
  } else if (periodo === 'mes') {
    for (let i = 6; i >= 0; i--) {
      const dStart = new Date();
      dStart.setDate(dStart.getDate() - (i * 4 + 3) - offset * 30);
      const dEnd = new Date();
      dEnd.setDate(dEnd.getDate() - i * 4 - offset * 30);
      const label = dEnd.toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' }).replace('.', '');
      const startStr = dStart.toISOString().split('T')[0];
      const endStr = dEnd.toISOString().split('T')[0];
      diasArr.push({ label, startData: startStr, endData: endStr });
    }
    labels = diasArr.map(d => d.label);
    dados = diasArr.map(d => {
      const total = state.movimentos.filter(m =>
        m.tipo === 'venda' && m.data >= d.startData && m.data <= d.endData
      ).reduce((s, v) => s + v.valor, 0);
      if (total > maxVal) maxVal = total;
      return total;
    });
  }

  maxVal = Math.max(maxVal, 1);

  const barW = (width - 40) / labels.length - 4;
  const startX = 20;
  const baseY = height - 20;

  for (let i = 0; i < labels.length; i++) {
    const x = startX + i * (barW + 4);
    const barH = Math.max(4, (dados[i] / maxVal) * (height - 40));
    const y = baseY - barH;
    const radius = 4;

    const grad = ctx.createLinearGradient(0, y, 0, baseY);
    if (dados[i] > 0) {
      grad.addColorStop(0, '#D4AF37');
      grad.addColorStop(1, '#A7872B');
    } else {
      grad.addColorStop(0, '#DCD5C9');
      grad.addColorStop(1, '#DCD5C9');
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + barW - radius, y);
    ctx.arcTo(x + barW, y, x + barW, y + radius, radius);
    ctx.lineTo(x + barW, baseY);
    ctx.lineTo(x, baseY);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = (i === labels.length - 1 && offset === 0) ? '#1C1A18' : '#8c8980';
    ctx.font = (i === labels.length - 1 && offset === 0) ? 'bold 9px Inter' : '9px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(labels[i], x + barW / 2, baseY + 4);

    if (mostrarValores && dados[i] > 0) {
      ctx.fillStyle = '#1C1A18';
      ctx.font = 'bold 9px Inter';
      ctx.textBaseline = 'bottom';
      ctx.fillText(fmtKz(dados[i]).replace(' Kz', ''), x + barW / 2, y - 2);
    }
  }

  const labelEl = document.getElementById('chart-period-label');
  if (labelEl) {
    const periodoLabels = {
      hora:   offset === 0 ? 'Hoje por hora'    : `Há ${offset} dias (hora)`,
      dia:    offset === 0 ? 'Últimos 7 dias'   : `Semana −${offset}`,
      semana: offset === 0 ? 'Últimos 7 dias'   : `Semana −${offset}`,
      mes:    offset === 0 ? 'Últimos 30 dias'  : `Período −${offset}`
    };
    labelEl.textContent = periodoLabels[periodo] || 'Últimos 7 dias';
  }

  const tooltip = document.getElementById('chart-tooltip');
  if (!tooltip) return;

  const handleHover = (clientX, clientY) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const mouseX = (clientX - rect.left) * scaleX;
    let idx = -1;
    for (let i = 0; i < labels.length; i++) {
      const x = startX + i * (barW + 4);
      if (mouseX >= x && mouseX <= x + barW) { idx = i; break; }
    }
    if (idx !== -1 && dados[idx] > 0) {
      tooltip.style.left = (clientX + 10) + 'px';
      tooltip.style.top  = (clientY - 30) + 'px';
      tooltip.textContent = `${labels[idx]}: ${fmtKz(dados[idx])}`;
      tooltip.style.opacity = '1';
    } else {
      tooltip.style.opacity = '0';
    }
  };

  canvas.onmousemove  = e => handleHover(e.clientX, e.clientY);
  canvas.onmouseleave = () => { tooltip.style.opacity = '0'; };

  canvas.ontouchstart = e => {
    if (e.touches.length > 0) {
      _chartSwipeStartX = e.touches[0].clientX;
      _chartSwipeStartY = e.touches[0].clientY;
      handleHover(e.touches[0].clientX, e.touches[0].clientY);
    }
  };
  canvas.ontouchmove = e => {
    if (e.touches.length > 0) handleHover(e.touches[0].clientX, e.touches[0].clientY);
  };
  canvas.ontouchend = e => {
    tooltip.style.opacity = '0';
    if (_chartSwipeStartX !== null && e.changedTouches.length > 0) {
      const dx = e.changedTouches[0].clientX - _chartSwipeStartX;
      const dy = e.changedTouches[0].clientY - _chartSwipeStartY;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) state.chartOffset += 1;
        else if (state.chartOffset > 0) state.chartOffset -= 1;
        localStorage.setItem('bp_chart_offset', String(state.chartOffset));
        renderizarGrafico();
      }
    }
    _chartSwipeStartX = null;
    _chartSwipeStartY = null;
  };
}

let _chartControlsBound = false;
function initChartControls() {
  if (_chartControlsBound) return;
  _chartControlsBound = true;
  document.querySelectorAll('.chart-filter').forEach(btn => {
    btn.addEventListener('click', function() {
      const periodo = this.dataset.periodo;
      state.chartPeriodo = periodo;
      localStorage.setItem('bp_chart_periodo', periodo);
      state.chartOffset = 0;
      localStorage.setItem('bp_chart_offset', '0');
      document.querySelectorAll('.chart-filter').forEach(b => {
        b.classList.remove('btn-primary');
        b.classList.add('btn-secondary');
      });
      this.classList.remove('btn-secondary');
      this.classList.add('btn-primary');
      renderizarGrafico();
    });
  });

  const prevBtn = document.getElementById('chart-prev');
  const nextBtn = document.getElementById('chart-next');
  if (prevBtn) prevBtn.onclick = () => { state.chartOffset += 1; localStorage.setItem('bp_chart_offset', String(state.chartOffset)); renderizarGrafico(); };
  if (nextBtn) nextBtn.onclick = () => { if (state.chartOffset > 0) { state.chartOffset -= 1; localStorage.setItem('bp_chart_offset', String(state.chartOffset)); renderizarGrafico(); } };

  const eyeToggle = document.getElementById('chart-eye-toggle');
  if (eyeToggle) {
    eyeToggle.addEventListener('click', function() {
      state.chartMostrarValores = !state.chartMostrarValores;
      localStorage.setItem('bp_chart_mostrar_valores', String(state.chartMostrarValores));
      const svg = this.querySelector('svg');
      if (svg) {
        if (state.chartMostrarValores) {
          svg.innerHTML = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
        } else {
          svg.innerHTML = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`;
        }
      }
      renderizarGrafico();
    });
  }
}
// ====================================================================
//  DETALHE VENDA E IMPRESSÃO
// ====================================================================


/* ===== FILE: vendas-modais.js ===== */

// ====================================================================
//  vendas-modais.js — extraído do app.js (Fase C da modularização)
//  Conteúdo: Sparkline, detalhe/recibo de venda, carrinho inteligente (agrupamento, +/- , persistência)
//  Linhas originais: 1143-1410
//  Carregar depois de core-*.js, db-indexeddb.js, sync-*.js, auth-supabase.js
// ====================================================================

let vendaAtual = null;

// ====================================================================
//  SPARKLINE — CORRIGIDA (funcional, robusta, com fallback)
// ====================================================================
function desenharSparkline(canvasId, dados, cor = '#D4AF37') {
  try {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      // Fallback: se o canvas não existir, cria um temporário
      console.warn('[Sparkline] Canvas não encontrado:', canvasId);
      return;
    }

    // Se o canvas não estiver visível (display:none), força um tamanho mínimo
    const rect = canvas.getBoundingClientRect();
    const cssWidth = rect.width || 84;
    const cssHeight = rect.height || 28;
    
    // Redimensionar com devicePixelRatio
    const dpr = window.devicePixelRatio || 1;
    const bufferW = Math.round(cssWidth * dpr);
    const bufferH = Math.round(cssHeight * dpr);
    
    if (canvas.width !== bufferW || canvas.height !== bufferH) {
      canvas.width = bufferW;
      canvas.height = bufferH;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const width = cssWidth;
    const height = cssHeight;

    ctx.clearRect(0, 0, width, height);

    // Se não há dados válidos
    if (!dados || !Array.isArray(dados) || dados.length < 2) {
      ctx.beginPath();
      ctx.moveTo(0, height - 4);
      ctx.lineTo(width, height - 4);
      ctx.strokeStyle = cor;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.15;
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#5C564E';
      ctx.font = '6px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('Sem dados', width/2, height - 2);
      return;
    }

    // Verifica se todos os valores são zero
    const todosZero = dados.every(v => v === 0);
    if (todosZero) {
      ctx.beginPath();
      ctx.moveTo(0, height - 4);
      ctx.lineTo(width, height - 4);
      ctx.strokeStyle = cor;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.25;
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = cor;
      ctx.font = '6px Inter';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText('0 Kz', width - 2, height - 2);
      return;
    }

    const min = Math.min(...dados, 0);
    const max = Math.max(...dados, 10);
    const range = max - min || 1;
    const padding = 3;
    const usableHeight = height - padding * 2;

    // Linha
    ctx.beginPath();
    for (let i = 0; i < dados.length; i++) {
      const x = (i / (dados.length - 1)) * width;
      const y = height - padding - ((dados[i] - min) / range) * usableHeight;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.strokeStyle = cor;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();

    // Ponto final
    const lastX = width;
    const lastY = height - padding - ((dados[dados.length - 1] - min) / range) * usableHeight;
    ctx.beginPath();
    ctx.arc(lastX, lastY, 2, 0, Math.PI * 2);
    ctx.fillStyle = cor;
    ctx.fill();

    // Seta
    if (dados.length >= 2) {
      const ultimoValor = dados[dados.length - 1];
      const penultimoValor = dados[dados.length - 2];
      const direcao = ultimoValor >= penultimoValor ? 1 : -1;
      const xSeta = lastX;
      const ySeta = lastY;
      const tamanhoSeta = 5;
      ctx.beginPath();
      if (direcao > 0) {
        ctx.moveTo(xSeta - tamanhoSeta, ySeta + tamanhoSeta);
        ctx.lineTo(xSeta, ySeta - tamanhoSeta);
        ctx.lineTo(xSeta + tamanhoSeta, ySeta + tamanhoSeta);
      } else {
        ctx.moveTo(xSeta - tamanhoSeta, ySeta - tamanhoSeta);
        ctx.lineTo(xSeta, ySeta + tamanhoSeta);
        ctx.lineTo(xSeta + tamanhoSeta, ySeta - tamanhoSeta);
      }
      ctx.closePath();
      ctx.fillStyle = cor;
      ctx.fill();
    }
  } catch (e) {
    // Fallback silencioso: se algo falhar, a sparkline não quebra a UI
    console.warn('[Sparkline] Erro ao desenhar:', e);
  }
}

// ====================================================================
//  DETALHE / RECIBO DE VENDA
// ====================================================================
function abrirDetalheVenda(id) {
  const venda = state.movimentos.find(m => m.id === id && m.tipo === 'venda');
  if (!venda) { toast('Venda não encontrada', 'error'); return; }
  vendaAtual = venda;
  const itensHtml = venda.itens && venda.itens.length > 0 ?
    `<div class="detalhe-itens-header"><span>Descrição</span><span style="text-align:right">Qtd</span><span style="text-align:right">P.Unit</span><span style="text-align:right">Total</span></div>
     ${venda.itens.map(item => `
      <div class="detalhe-item-row">
        <span class="desc">${escHtml(item.nome)}</span>
        <span class="qty">${item.quantidade}</span>
        <span class="pu">${fmtKz(item.precoUnit || item.subtotal)}</span>
        <span class="sub">${fmtKz(item.subtotal)}</span>
      </div>`).join('')}` :
    `<div style="color:var(--text-muted);font-size:.85rem;padding:8px 0;">Sem itens detalhados</div>`;
  const mp = venda.metodoPagamento || 'Numerário';
  const mpIcon = { 'Numerário': '', 'Multicaixa Express': '', 'Transferência Bancária': '', 'Cartão': '' } [mp] || '';
  const nomeProf = getProfissionalNome(venda.profissional_id);
  document.getElementById('detalhe-venda-conteudo').innerHTML = `
    <div class="detalhe-meta">
      <div class="detalhe-meta-row"><span class="label">Cliente</span><span class="val">${escHtml(venda.cliente || 'Anónimo')}</span></div>
      <div class="detalhe-meta-row"><span class="label">Profissional</span><span class="val">${escHtml(nomeProf)}</span></div>
      <div class="detalhe-meta-row"><span class="label">Data / Hora</span><span class="val">${venda.data} · ${venda.hora}</span></div>
      <div class="detalhe-meta-row"><span class="label">Pagamento</span><span class="val"><span class="pagamento-badge">${escHtml(mp)}</span></span></div>
      ${Number(venda.comissao_gerada) > 0 ? ('<div class="detalhe-meta-row"><span class="label">Comissão</span><span class="val" style="color:var(--gold-dark,var(--gold));font-weight:600;">' + fmtKz(venda.comissao_gerada) + '</span></div>') : ''}
    </div>
    <div>${itensHtml}</div>
    <div class="detalhe-total"><span class="label">Total</span><span class="val">${fmtKz(venda.valor)}</span></div>`;
  document.getElementById('detalhe-venda-titulo').textContent = 'Venda #' + String(venda.id).slice(0, 8).toUpperCase();
  openModal('modal-detalhe-venda');
}

function imprimirRecibo(venda) {
  if (!venda) { toast('Nenhuma venda seleccionada', 'error'); return; }
  const el = document.getElementById('recibo-print');
  if (!el) {
    toast('Erro: elemento de impressão não encontrado', 'error');
    return;
  }
  const storeName = state.config.storeName || 'BeautyPro';
  const num = venda.reciboNum || nextReciboNum();
  const itensHtml = venda.itens && venda.itens.length > 0 ?
    `<div class="r-th"><span class="r-th-desc">SERVICO</span><span class="r-th-qty">QT</span><span class="r-th-sub">TOTAL</span></div>
     ${venda.itens.map(i => `<div class="r-item"><span class="r-item-name">${escHtml(i.nome)}</span><span class="r-item-qty">x${i.quantidade}</span><span class="r-item-sub">${fmtKz(i.subtotal)}</span></div>`).join('')}` :
    '<div style="font-size:7pt;">Sem itens</div>';
  const nomeProf = getProfissionalNome(venda.profissional_id);
  el.innerHTML = `
    <div class="r-store">${escHtml(storeName)}</div>
    <div class="r-sub">Luanda, Angola</div>
    <div class="r-num">Recibo N.º ${num}</div>
    <div class="r-num">${venda.data} &nbsp; ${venda.hora}</div>
    <hr class="r-div">
    <div class="r-meta"><b>CLIENTE: </b>${escHtml(venda.cliente || 'Anonimo')}</div>
    <div class="r-meta"><b>PROF.: </b>${escHtml(nomeProf)}</div>
    <hr class="r-div">
    ${itensHtml}
    <hr class="r-div">
    <div class="r-total">TOTAL: ${fmtKz(venda.valor)}</div>
    <div class="r-pag">Pag.: ${escHtml(venda.metodoPagamento || 'Numerario')}</div>
    <hr class="r-div">
    <div class="r-footer"><strong>Obrigado pela preferencia!</strong>Volte sempre ao ${escHtml(storeName)}</div>`;
  requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
}

// ====================================================================
//  CARRINHO INTELIGENTE (agrupamento, +/- , persistência) — SEM PROFISSIONAL POR ITEM
// ====================================================================
let cartItems = [];
const CART_STORAGE_KEY = 'bp_cart_items';

// --- Persistência ---
function saveCartToStorage() {
  try { localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems)); } catch (e) {}
}

function loadCartFromStorage() {
  try {
    const data = localStorage.getItem(CART_STORAGE_KEY);
    if (data) {
      cartItems = JSON.parse(data);
      renderCart();
    }
  } catch (e) { cartItems = []; }
}

// --- Renderização do carrinho com botões + / - e total detalhado ---
function renderCart() {
  const list = document.getElementById('cart-items-list');
  const totalArea = document.getElementById('cart-total-area');
  if (!list) return;

  if (cartItems.length === 0) {
    list.innerHTML = '<div style="text-align:center;padding:16px;color:var(--text-muted);font-size:.85rem;">Carrinho vazio — adicione serviços acima</div>';
    if (totalArea) totalArea.innerHTML = '';
    return;
  }

  list.innerHTML = cartItems.map((item, idx) => `
    <div class="cart-item-row" data-idx="${idx}">
      <span class="ci-name">${escHtml(item.nome)}</span>
      <span class="ci-qty-controls">
        <button class="qty-btn" data-idx="${idx}" data-action="decrement">−</button>
        <span class="qty-number">${item.quantidade}</span>
        <button class="qty-btn" data-idx="${idx}" data-action="increment">+</button>
      </span>
      <span class="ci-val">${fmtKz(item.subtotal)}</span>
      <button class="ci-del" data-idx="${idx}" aria-label="Remover item">✕</button>
    </div>
  `).join('');

  const total = cartItems.reduce((s, i) => s + i.subtotal, 0);
  const totalItems = cartItems.reduce((s, i) => s + i.quantidade, 0);
  if (totalArea) {
    totalArea.innerHTML = `
      <div class="cart-total-row">
        <span class="ct-label">Subtotal (${totalItems} itens)</span>
        <span class="ct-val">${fmtKz(total)}</span>
      </div>
    `;
  }

  saveCartToStorage();
}

// --- Ajustar quantidade ---
function adjustQuantity(idx, delta) {
  if (idx < 0 || idx >= cartItems.length) return;
  const item = cartItems[idx];
  const newQty = item.quantidade + delta;
  if (newQty <= 0) {
    cartItems.splice(idx, 1);
  } else {
    item.quantidade = newQty;
    item.subtotal = item.quantidade * item.precoUnit;
  }
  renderCart();
}

// --- Remover item (com confirmação) ---
function removeItemFromCart(idx) {
  if (idx < 0 || idx >= cartItems.length) return;
  const item = cartItems[idx];
  if (item.quantidade > 1) {
    const choice = confirm(`"${escHtml(item.nome||"")}" tem ${item.quantidade} unidades. Deseja remover todas?`);
    if (choice) {
      cartItems.splice(idx, 1);
    } else {
      adjustQuantity(idx, -(item.quantidade - 1));
    }
  } else {
    cartItems.splice(idx, 1);
  }
  renderCart();
}

// --- Função central de adição ao carrinho (sem profissional) ---
function addToCart(nome, valor) {
  const existingIndex = cartItems.findIndex(item => item.nome === nome);
  if (existingIndex !== -1) {
    const existing = cartItems[existingIndex];
    if (existing.precoUnit !== valor) {
      const choice = confirm(
        `"${escHtml(nome||"")}" já está no carrinho com preço ${fmtKz(existing.precoUnit)}.\n` +
        `Deseja atualizar para ${fmtKz(valor)}? (Cancelar = manter os dois separados)`
      );
      if (choice) {
        existing.precoUnit = valor;
        existing.subtotal = existing.quantidade * valor;
        renderCart();
        toast('Preço do item actualizado', 'success');
        return;
      } else {
        cartItems.push({
          nome: `${escHtml(nome||"")} (${fmtKz(valor)})`,
          quantidade: 1,
          precoUnit: valor,
          subtotal: valor
        });
        renderCart();
        toast('Adicionado como item separado.', 'success');
        return;
      }
    }
    existing.quantidade += 1;
    existing.subtotal = existing.quantidade * existing.precoUnit;
    renderCart();
    toast('Serviço adicionado ao carrinho', 'success');
    return;
  }

  cartItems.push({
    nome,
    quantidade: 1,
    precoUnit: valor,
    subtotal: valor
  });
  renderCart();
  toast('Serviço adicionado ao carrinho', 'success');
}

// --- Event listeners (delegação para botões do carrinho) ---
document.addEventListener('click', function(e) {
  const qtyBtn = e.target.closest('.qty-btn');
  if (qtyBtn) {
    e.preventDefault();
    const idx = parseInt(qtyBtn.dataset.idx);
    const action = qtyBtn.dataset.action;
    if (action === 'increment') adjustQuantity(idx, 1);
    else if (action === 'decrement') adjustQuantity(idx, -1);
    return;
  }

  const delBtn = e.target.closest('.ci-del');
  if (delBtn) {
    e.preventDefault();
    const idx = parseInt(delBtn.dataset.idx);
    removeItemFromCart(idx);
    return;
  }
});

// --- Função de abertura do modal (restaurar carrinho) ---
function openVendaModal() {
  loadCartFromStorage();
  const clientSel = document.getElementById('venda-cliente');
  if (clientSel) {
    clientSel.innerHTML = (state.clientes || []).map(c =>
      `<option value="${escHtml(c.nome)}">${escHtml(c.nome)}</option>`
    ).join('');
  }
  populateVendaSelects();
  renderCart();
  openModal('modal-venda');
}

// --- Limpar carrinho (após venda ou cancelamento) ---
function clearCart() {
  cartItems = [];
  localStorage.removeItem(CART_STORAGE_KEY);
  renderCart();
}

// --- Expor funções globalmente (para outros ficheiros) ---
window.addToCart = addToCart;
window.clearCart = clearCart;
window.loadCartFromStorage = loadCartFromStorage;
window.saveCartToStorage = saveCartToStorage;

// ====================================================================
//  SERVIÇO MODAL
// ====================================================================
function renderServicoProfissionais(selected = []) {
  const container = document.getElementById('servico-profissionais-container');
  if (!container) return;
  if (!state.profissionais.length) {
    container.innerHTML = '<span style="color:var(--text-muted);font-size:.75rem;">Nenhum profissional cadastrado</span>';
    return;
  }
  container.innerHTML = state.profissionais.map(p => `
    <label style="display:flex;align-items:center;gap:4px;font-size:.75rem;background:var(--bg-soft);padding:4px 10px;border-radius:30px;border:1px solid var(--border-soft);cursor:pointer;">
      <input type="checkbox" value="${escHtml(p.nome)}" ${escHtml(selected.includes(p.nome) ? 'checked' : ''||"")}>
      ${escHtml(p.nome)}
    </label>
  `).join('');
}

function getSelectedProfissionais() {
  const container = document.getElementById('servico-profissionais-container');
  if (!container) return [];
  const checks = container.querySelectorAll('input[type="checkbox"]:checked');
  return Array.from(checks).map(cb => cb.value);
}

function openServicoModal(id = null) {
  const title = document.getElementById('servico-modal-title');
  const nomeInput = document.getElementById('servico-nome');
  const precoInput = document.getElementById('servico-preco');
  const idInput = document.getElementById('servico-id');
  if (id) {
    const serv = state.servicos.find(s => s.id === id);
    if (!serv) return;
    title.textContent = 'Editar Serviço';
    nomeInput.value = serv.nome;
    precoInput.value = serv.precoBase;
    idInput.value = id;
    renderServicoProfissionais(serv.profissionais || []);
  } else {
    title.textContent = 'Novo Serviço';
    nomeInput.value = '';
    precoInput.value = '';
    idInput.value = '';
    renderServicoProfissionais([]);
  }
  openModal('modal-servico');
}



/* ===== FILE: detalhes-acessibilidade.js ===== */

// ====================================================================
// detalhes-acessibilidade.js — extraído do app.js (Fase C da modularização)
// Conteúdo: Modais de detalhe (faturamento, agendamentos, fecho de caixa), acessibilidade/focus trap, estado offline da IA, navegação por abas
// Linhas originais: 1411-1628
// Carregar depois de core-*.js, db-indexeddb.js, sync-*.js, auth-supabase.js
// ====================================================================

// ====================================================================
// KPIS DETALHE
// ====================================================================
function abrirDetalheFaturamento() {
 const list = document.getElementById('revenue-detail-list');
 const totalSpan = document.getElementById('revenue-detail-total');
 if (!state.movimentos || !Array.isArray(state.movimentos)) {
  if (list) list.innerHTML = '<div class="empty-state"><p>A carregar...</p></div>';
  if (totalSpan) totalSpan.textContent = '0 Kz';
  openModal('modal-revenue-detail');
  return;
 }
 const hojeStr = hoje();
 const vendasHoje = state.movimentos.filter(m => m.data === hojeStr && m.tipo === 'venda');
 if (vendasHoje.length === 0) {
  list.innerHTML = '<div class="empty-state"><p>Nenhuma venda hoje</p></div>';
  totalSpan.textContent = '0 Kz';
 } else {
  list.innerHTML = vendasHoje.map(v => `
   <div class="list-item" style="cursor:default;">
    <div class="avatar" style="background:#E6F4EC;color:var(--green);"></div>
    <div class="info">
     <div class="title">${escHtml(v.cliente || 'Anónimo')}</div>
     <div class="sub">${escHtml(v.descricao)} · ${v.hora}</div>
    </div>
    <div class="action">${fmtKz(v.valor)}</div>
   </div>
  `).join('');
  const total = vendasHoje.reduce((s, v) => s + v.valor, 0);
  totalSpan.textContent = fmtKz(total);
 }
 openModal('modal-revenue-detail');
}

let agendaDetailFiltro = 'pendentes';

function abrirDetalheAgendamentos(filtro = 'pendentes') {
 agendaDetailFiltro = filtro;
 const list = document.getElementById('agenda-detail-list');
 const btnPend = document.getElementById('agenda-detail-pendentes');
 const btnReal = document.getElementById('agenda-detail-realizados');
 if (!state.agendamentos || !Array.isArray(state.agendamentos)) {
  if (list) list.innerHTML = '<div class="empty-state"><p>A carregar...</p></div>';
  openModal('modal-agenda-detail');
  return;
 }
 const hojeStr = hoje();
 const ags = state.agendamentos.filter(a => a.data === hojeStr);
 if (btnPend) btnPend.className = 'btn btn-sm ' + (filtro === 'pendentes' ? 'btn-primary' : 'btn-secondary');
 if (btnReal) btnReal.className = 'btn btn-sm ' + (filtro === 'realizados' ? 'btn-primary' : 'btn-secondary');
 const filtrados = filtro === 'pendentes' ? ags.filter(a => a.status !== 'realizado' && a.status !== 'cancelado') : ags.filter(a => a.status === 'realizado');
 if (filtrados.length === 0) {
  list.innerHTML = `<div class="empty-state"><p>Nenhum agendamento ${filtro === 'pendentes' ? 'pendente' : 'realizado'} hoje</p></div>`;
 } else {
  list.innerHTML = filtrados.map(a => {
   const nomeProf = getProfissionalNome(a.profissional_id);
   return `
    <div class="list-item" style="cursor:default;">
     <div class="avatar" style="background:var(--gold-light);color:var(--gold-dark);"></div>
     <div class="info">
      <div class="title" style="color:var(--gold-dark);">${escHtml(a.servico)}</div>
      <div class="sub">${escHtml(a.cliente)} · ${a.hora} · ${escHtml(nomeProf)}</div>
     </div>
     <div class="action">${fmtKz(a.preco)}</div>
    </div>
   `;
  }).join('');
 }
 openModal('modal-agenda-detail');
}

function abrirFechoCaixa() {
 const hojeStr = hoje();
 const movs = state.movimentos.filter(m => m.data === hojeStr);
 const vendas = movs.filter(m => m.tipo === 'venda');
 const despesas = movs.filter(m => m.tipo === 'despesa');
 const totalVendas = vendas.reduce((s, v) => s + v.valor, 0);
 const totalDespesas = despesas.reduce((s, d) => s + d.valor, 0);
 const saldoFinal = state.config.fundo + totalVendas - totalDespesas;
 const byPag = {};
 vendas.forEach(v => { const k = v.metodoPagamento || 'Numerário';
  byPag[k] = (byPag[k] || 0) + v.valor; });
 const pagHtml = Object.entries(byPag).map(([k, v]) =>
  `<div class="fecho-row"><span class="fr-label">${escHtml(k)}</span><span class="fr-val">${fmtKz(v)}</span></div>`
  ).join('');
 document.getElementById('fecho-conteudo').innerHTML = `
  <div style="font-size:.75rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px;">${new Date().toLocaleDateString('pt-AO', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
  <div class="fecho-row"><span class="fr-label">Fundo de abertura</span><span class="fr-val">${fmtKz(state.config.fundo)}</span></div>
  <div class="fecho-row"><span class="fr-label">Total de vendas (${vendas.length})</span><span class="fr-val" style="color:var(--green)">+${fmtKz(totalVendas)}</span></div>
  <div class="fecho-row"><span class="fr-label">Total de despesas (${despesas.length})</span><span class="fr-val" style="color:var(--red)">-${fmtKz(totalDespesas)}</span></div>
  <div style="margin:8px 0 4px;font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);">Por método de pagamento</div>
  ${pagHtml || '<div class="fecho-row"><span class="fr-label">—</span><span class="fr-val">0 Kz</span></div>'}
  <div class="fecho-row total-row"><span class="fr-label">Saldo Final em Caixa</span><span class="fr-val">${fmtKz(saldoFinal)}</span></div>`;
 openModal('modal-fecho');
}

// ====================================================================
// ACESSIBILIDADE E FOCUS TRAPPING
// ====================================================================
function aplicarAcessibilidade() {
 document.querySelectorAll('.ci-del').forEach(el => { if (!el.hasAttribute('aria-label')) el.setAttribute('aria-label', 'Remover item'); });
 document.querySelectorAll('.nav-item').forEach((el, index) => {
  if (!el.hasAttribute('role')) el.setAttribute('role', 'tab');
  if (!el.hasAttribute('aria-selected')) el.setAttribute('aria-selected', el.classList.contains('active') ? 'true' : 'false');
  const tabId = el.dataset.tab;
  if (tabId) el.setAttribute('aria-controls', 'tab-' + tabId);
 });
 const nav = document.querySelector('.bottom-nav');
 if (nav && !nav.hasAttribute('role')) nav.setAttribute('role', 'tablist');
 document.querySelectorAll('.modal-overlay').forEach(modal => {
  if (!modal.hasAttribute('role')) modal.setAttribute('role', 'dialog');
  if (!modal.hasAttribute('aria-modal')) modal.setAttribute('aria-modal', 'true');
  const title = modal.querySelector('.modal-title');
  if (title && title.id) modal.setAttribute('aria-labelledby', title.id);
 });
 const liveAreas = ['agenda-full-list', 'clientes-list', 'movimentos-list', 'agenda-today-list'];
 liveAreas.forEach(id => {
  const el = document.getElementById(id);
  if (el && !el.hasAttribute('aria-live')) { el.setAttribute('aria-live', 'polite');
   el.setAttribute('aria-atomic', 'true'); }
 });
}

let previousFocusedElement = null;

function trapFocus(modal) {
 const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
 if (focusableElements.length === 0) return;
 const firstElement = focusableElements[0];
 const lastElement = focusableElements[focusableElements.length - 1];
 modal.addEventListener('keydown', function(e) {
  if (e.key === 'Tab') {
   if (e.shiftKey) {
    if (document.activeElement === firstElement) { e.preventDefault();
     lastElement.focus(); }
   } else {
    if (document.activeElement === lastElement) { e.preventDefault();
     firstElement.focus(); }
   }
  }
 });
}
const originalOpenModal = window.openModal;
if (originalOpenModal) {
 window.openModal = function(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  previousFocusedElement = document.activeElement;
  originalOpenModal(id);
  trapFocus(modal);
  const firstFocusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  if (firstFocusable) setTimeout(() => firstFocusable.focus(), 100);
 };
}
const originalCloseModal = window.closeModal;
if (originalCloseModal) {
 window.closeModal = function(id) {
  originalCloseModal(id);
  if (previousFocusedElement) { setTimeout(() => { previousFocusedElement.focus();
    previousFocusedElement = null; }, 200); }
 };
}

// ====================================================================
// IA OFFLINE E SVGs
// ====================================================================
function atualizarIAOffline() {
 const overlay = document.getElementById('ia-offline-overlay');
 if (!overlay) return;
 const isOnline = navigator.onLine;
 overlay.style.display = isOnline ? 'none' : 'flex';
}

const svgCalendario = `<svg width="80" height="80" viewBox="0 0 80 80" fill="none" stroke="var(--neutral-300)" stroke-width="1.5"><rect x="16" y="20" width="48" height="48" rx="4"/><line x1="16" y1="32" x2="64" y2="32"/><line x1="28" y1="16" x2="28" y2="24"/><line x1="52" y1="16" x2="52" y2="24"/><circle cx="40" cy="44" r="6"/></svg>`;
const svgCarteira = `<svg width="80" height="80" viewBox="0 0 80 80" fill="none" stroke="var(--neutral-300)" stroke-width="1.5"><rect x="12" y="28" width="56" height="36" rx="4"/><path d="M12 36h8a8 8 0 0 1 0 16h-8"/><circle cx="48" cy="46" r="4"/></svg>`;
const svgPessoas = `<svg width="80" height="80" viewBox="0 0 80 80" fill="none" stroke="var(--neutral-300)" stroke-width="1.5"><circle cx="30" cy="24" r="12"/><circle cx="50" cy="24" r="10"/><path d="M10 64c0-12 6-20 20-20s20 8 20 20"/><path d="M56 64c0-8 4-14 14-14s14 6 14 14"/></svg>`;
const svgTesoura = `<svg width="80" height="80" viewBox="0 0 80 80" fill="none" stroke="var(--neutral-300)" stroke-width="1.5"><circle cx="28" cy="36" r="8"/><circle cx="52" cy="36" r="8"/><path d="M20 44 L60 24 M20 24 L60 44"/></svg>`;
const svgPessoa = `<svg width="80" height="80" viewBox="0 0 80 80" fill="none" stroke="var(--neutral-300)" stroke-width="1.5"><circle cx="40" cy="30" r="16"/><path d="M12 68c0-12 8-20 28-20s28 8 28 20"/></svg>`;

// ====================================================================
// NAVEGAÇÃO ENTRE ABAS
// ====================================================================
document.querySelectorAll('.nav-item').forEach(btn => {
 btn.addEventListener('click', function() {
  const tab = this.dataset.tab;
  if (this.dataset.role) {
   const permitido = this.dataset.role.split(',').map(r => r.trim()).includes(normalizarRole(state.config.userRole));
   if (!permitido) {
    toast('Não tem permissão para aceder a essa área.', 'error');
    return;
   }
  }
  activeTab = tab;
  localStorage.setItem('bp_active_tab', tab);
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  this.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.setAttribute('aria-selected', 'false'));
  this.setAttribute('aria-selected', 'true');
  if (tab === 'agenda') renderAgendaFull();
  if (tab === 'clientes') renderClientes();
  if (tab === 'caixa') renderCaixa();
  if (tab === 'dashboard') renderDashboard();
  if (tab === 'equipa') { renderProfissionais(); renderServicos(); }
  if (tab === 'ia') {
   document.getElementById('ia-contador').textContent = parseInt(localStorage.getItem('ia_perguntas_' + hoje()) ||
    '0');
   renderPlanoInfo();
   atualizarIAOffline();
   renderIAResumo();
  }
  aplicarAcessibilidade();
  aplicarPermissoes();
  atualizarVisibilidadeAtalhos();
 });
});


/* ===== FILE: ui-events-navegacao.js ===== */

// ====================================================================
//  ui-events-navegacao.js — extraído do app.js (Fase C da modularização)
//  Conteúdo: Ativação de abas e sistema de permissões por papel
//  Linhas originais: 1629-1683
//  Carregar depois de core-*.js, db-indexeddb.js, sync-*.js, auth-supabase.js
// ====================================================================

function ativarAbaAtiva() {
  const pane = document.getElementById('tab-' + activeTab);
  if (!pane) return;
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  pane.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.remove('active');
    n.setAttribute('aria-selected', 'false');
  });
  const navBtn = document.querySelector('.nav-item[data-tab="' + activeTab + '"]');
  if (navBtn) {
    navBtn.classList.add('active');
    navBtn.setAttribute('aria-selected', 'true');
  }
}

// ====================================================================
//  RBAC
// ====================================================================
function normalizarRole(role) {
  if (RBAC_ROLES.includes(role)) return role;
  if (role) console.warn('[RBAC] role desconhecido recebido do perfil ("' + role + '") — a aplicar acesso mínimo (operador).');
  return 'operador';
}

function aplicarPermissoes() {
  const role = normalizarRole(state.config.userRole);
  state.config.userRole = role;

  document.querySelectorAll('[data-role]').forEach(el => {
    const allowed = el.dataset.role.split(',').map(r => r.trim());
    const permitido = allowed.includes(role);
    if (el.dataset.roleMode === 'disable') {
      el.disabled = !permitido;
      el.style.opacity = permitido ? '' : '0.45';
      el.style.pointerEvents = permitido ? '' : 'none';
      el.title = permitido ? '' : 'Acção não disponível para o seu papel de utilizador';
    } else {
      el.style.display = permitido ? '' : 'none';
    }
  });

  const equipaNav = document.querySelector('.nav-item[data-tab="equipa"]');
  const tabEquipaAtiva = document.getElementById('tab-equipa')?.classList.contains('active');
  if (equipaNav && equipaNav.style.display === 'none' && tabEquipaAtiva) {
    equipaNav.parentElement?.querySelector('.nav-item[data-tab="dashboard"]')?.click();
    toast('Não tem permissão para aceder a essa área.', 'error');
  }
}

// ====================================================================
//  EVENT LISTENERS
// ====================================================================
// (Login handler movido para auth-supabase.js)


/* ===== FILE: eventos-cadastros.js ===== */

// ====================================================================
//  eventos-cadastros.js — extraído do app.js (Fase C da modularização)
//  Conteúdo: Eventos: login/menu/logout, nova venda, agenda, clientes e profissionais
//  Linhas originais: 1684-1876
//  Carregar depois de core-*.js, db-indexeddb.js, sync-*.js, auth-supabase.js
// ====================================================================
document.getElementById('signup-link')?.addEventListener('click', (e) => {
  e.preventDefault();
  toast('Peça ao administrador para criar a sua conta.', 'warning');
});

// Menu hambúrguer do header (substitui o antigo botão de logout direto)
document.getElementById('menu-btn')?.addEventListener('click', function(e) {
  e.stopPropagation();
  const dropdown = document.getElementById('menu-dropdown');
  const aberto = dropdown.style.display === 'block';
  dropdown.style.display = aberto ? 'none' : 'block';
  this.setAttribute('aria-expanded', aberto ? 'false' : 'true');
});
document.addEventListener('click', function(e) {
  const dropdown = document.getElementById('menu-dropdown');
  const menuBtn = document.getElementById('menu-btn');
  if (dropdown && dropdown.style.display === 'block' && !dropdown.contains(e.target) && e.target !== menuBtn) {
    dropdown.style.display = 'none';
    menuBtn?.setAttribute('aria-expanded', 'false');
  }
});

document.getElementById('logout-btn')?.addEventListener('click', async function() {
  document.getElementById('menu-dropdown').style.display = 'none';
  logoutVoluntarioEmCurso = true;
  const confirmed = await showConfirmModal('Sair da aplicação', 'Tem a certeza que quer sair?', false);
  if (!confirmed) logoutVoluntarioEmCurso = false;
  if (confirmed) {
    await supabaseClient.auth.signOut();
    location.reload();
  }
});

document.getElementById('nova-venda-hero-btn').addEventListener('click', openVendaModal);

document.getElementById('fab-agendar').addEventListener('click', () => {
  const sel = document.getElementById('agenda-cliente');
  sel.innerHTML = '<option value="">Selecionar cliente</option>' + state.clientes.map(c =>
    `<option value="${escHtml(c.nome)}">${escHtml(c.nome)}</option>`).join('');
  populateAgendaSelects();
  const now = new Date();
  const isoNow = now.toISOString().slice(0, 16);
  const dtInput = document.getElementById('agenda-datetime');
  dtInput.value = isoNow;
  dtInput.min = isoNow;
  openModal('modal-agenda');
});

// CORREÇÃO: modal-agenda-save separa ID e nome do profissional
document.getElementById('modal-agenda-save').addEventListener('click', async () => {
  const cliente = document.getElementById('agenda-cliente').value;
  const servico = document.getElementById('agenda-servico').value;
  const profissionalId = document.getElementById('agenda-profissional').value;
  const datetime = document.getElementById('agenda-datetime').value;
  const preco = parseFloat(document.getElementById('agenda-preco').value);
  if (!cliente || !servico || !datetime) { toast('Preencha todos os campos obrigatórios', 'error'); return; }
  if (isNaN(preco) || preco <= 0) { toast('Insira um preço válido', 'error'); return; }
  const data = datetime.split('T')[0];
  const hora = datetime.split('T')[1].slice(0, 5);
  // Buscar o nome do profissional a partir do ID
  const profObj = state.profissionais.find(p => p.id === profissionalId);
  const profissionalNome = profObj ? profObj.nome : '';
  const result = await addAgendamento({
    cliente,
    servico,
    profissional: profissionalNome,
    profissional_id: profissionalId,
    data,
    hora,
    preco
  });
  if (result) { closeModal('modal-agenda'); }
});

document.getElementById('modal-agenda-cancel').addEventListener('click', () => closeModal('modal-agenda'));

// Cliente rápido
document.getElementById('agenda-add-cliente-rapido').addEventListener('click', () => {
  closeModal('modal-agenda');
  document.getElementById('cliente-rapido-nome').value = '';
  document.getElementById('cliente-rapido-telefone').value = '';
  openModal('modal-cliente-rapido');
});

document.getElementById('modal-cliente-rapido-save').addEventListener('click', async () => {
  const nome = document.getElementById('cliente-rapido-nome').value.trim();
  const telefone = document.getElementById('cliente-rapido-telefone').value.trim();
  if (!nome) { toast('Nome é obrigatório', 'error'); return; }
  const result = await addCliente({ nome, telefone, notas: '' });
  if (result) {
    closeModal('modal-cliente-rapido');
    openModal('modal-agenda');
    const sel = document.getElementById('agenda-cliente');
    sel.innerHTML = '<option value="">Selecionar cliente</option>' + state.clientes.map(c =>
      `<option value="${escHtml(c.nome)}">${escHtml(c.nome)}</option>`).join('');
    sel.value = nome;
  }
});

document.getElementById('modal-cliente-rapido-cancel').addEventListener('click', () => {
  closeModal('modal-cliente-rapido');
  openModal('modal-agenda');
});

// CRUD Cliente
let editClienteId = null;

function openEditCliente(id) {
  const c = state.clientes.find(c => c.id === id);
  if (!c) return;
  editClienteId = id;
  document.getElementById('cliente-modal-title').textContent = 'Editar Cliente';
  document.getElementById('cliente-nome').value = c.nome;
  document.getElementById('cliente-telefone').value = c.telefone || '';
  document.getElementById('cliente-notas').value = c.notas || '';
  document.getElementById('cliente-id').value = id;
  const statsEl = document.getElementById('cliente-perfil-stats');
  if (statsEl && typeof getEstatisticasCliente === 'function') {
    const { visitas, totalGasto, ultimaVisita } = getEstatisticasCliente(c.nome);
    statsEl.innerHTML = `
      <div><div class="stat-valor">${visitas}</div><div class="stat-legenda">${visitas === 1 ? 'Visita' : 'Visitas'}</div></div>
      <div><div class="stat-valor">${fmtKz(totalGasto)}</div><div class="stat-legenda">Total gasto</div></div>
      <div><div class="stat-valor">${formatarUltimaVisita(ultimaVisita)}</div><div class="stat-legenda">Última visita</div></div>
    `;
    statsEl.style.display = 'grid';
  }
  openModal('modal-cliente');
}

document.getElementById('add-cliente-btn').addEventListener('click', () => {
  editClienteId = null;
  document.getElementById('cliente-modal-title').textContent = 'Novo Cliente';
  ['cliente-nome', 'cliente-telefone', 'cliente-notas', 'cliente-id'].forEach(id => document.getElementById(id).value = '');
  const statsEl = document.getElementById('cliente-perfil-stats');
  if (statsEl) statsEl.style.display = 'none';
  openModal('modal-cliente');
});

document.getElementById('modal-cliente-save').addEventListener('click', async () => {
  const nome = document.getElementById('cliente-nome').value.trim();
  let telefone = document.getElementById('cliente-telefone').value.trim();
  const notas = document.getElementById('cliente-notas').value.trim();
  const id = document.getElementById('cliente-id').value;
  if (!nome) { toast('Nome é obrigatório', 'error'); return; }
  const telDigits = telefone.replace(/\D/g, '');
  if (telDigits && telDigits.length !== 9) {
    toast('Contacto deve ter exactamente 9 dígitos, ou deixe em branco.', 'error');
    return;
  }
  telefone = telDigits;
  if (id) { 
    await updateCliente(id, { nome, telefone, notas });
    toast('Dados do cliente actualizados', 'success');
    closeModal('modal-cliente');
  } else { 
    const result = await addCliente({ nome, telefone, notas });
    if (result) {
      closeModal('modal-cliente');
    }
  }
});

document.getElementById('modal-cliente-cancel').addEventListener('click', () => closeModal('modal-cliente'));

// CRUD Profissional
let editProfId = null;

function popularEspecialidadesProf(selected) {
  const sel = document.getElementById('prof-esp');
  if (!sel) return;
  const servicos = (state.servicos || []).slice().sort((a,b) => a.nome.localeCompare(b.nome));
  let html = '<option value="">Seleccionar serviço / especialidade</option>';
  html += '<option value="__criar">Criar seu serviço</option>';
  servicos.forEach(s => {
    html += `<option value="${escHtml(s.nome)}">${escHtml(s.nome)}</option>`;
  });
  sel.innerHTML = html;
  if (selected) sel.value = selected;
  const box = document.getElementById('prof-criar-servico-box');
  if (box) box.style.display = 'none';
}

function openEditProf(id) {
  const p = state.profissionais.find(x => x.id === id);
  if (!p) return;
  editProfId = id;
  document.getElementById('prof-modal-title').textContent = 'Editar Profissional';
  document.getElementById('prof-nome').value = p.nome || '';
  document.getElementById('prof-idade').value = p.idade || '';
  const dataEl = document.getElementById('prof-data-contratual');
  if (dataEl) dataEl.value = p.dataContratual || p.dataNascimento || '';
  document.getElementById('prof-bi').value = p.numeroBI || '';
  document.getElementById('prof-morada').value = p.morada || '';
  document.getElementById('prof-contacto').value = p.contacto || '';
  const taxaEl = document.getElementById('prof-taxa');
  const metaEl = document.getElementById('prof-meta');
  if (taxaEl) taxaEl.value = p.taxa_comissao != null ? p.taxa_comissao : 0;
  if (metaEl) metaEl.value = p.meta_mensal != null ? p.meta_mensal : '';
  popularEspecialidadesProf(p.especialidade || '');
  document.getElementById('prof-id').value = id;
  // modo edição
  ['prof-nome','prof-idade','prof-data-contratual','prof-bi','prof-morada','prof-contacto','prof-esp','prof-taxa','prof-meta'].forEach(fid => {
    const el = document.getElementById(fid);
    if (el) { el.disabled = false; el.readOnly = false; el.style.opacity = '1'; }
  });
  const saveBtn = document.getElementById('modal-prof-save');
  if (saveBtn) saveBtn.style.display = '';
  openModal('modal-prof');
}

function abrirDetalheProfView(id) {
  const p = state.profissionais.find(x => x.id === id);
  if (!p) return;
  editProfId = id;
  document.getElementById('prof-modal-title').textContent = 'Perfil do Profissional';
  document.getElementById('prof-nome').value = p.nome || '';
  document.getElementById('prof-idade').value = p.idade || '';
  const dataEl = document.getElementById('prof-data-contratual');
  if (dataEl) dataEl.value = p.dataContratual || p.dataNascimento || '';
  document.getElementById('prof-bi').value = p.numeroBI || '';
  document.getElementById('prof-morada').value = p.morada || '';
  document.getElementById('prof-contacto').value = p.contacto || '';
  const taxaElV = document.getElementById('prof-taxa');
  const metaElV = document.getElementById('prof-meta');
  if (taxaElV) taxaElV.value = p.taxa_comissao != null ? p.taxa_comissao : 0;
  if (metaElV) metaElV.value = p.meta_mensal != null ? p.meta_mensal : '';
  popularEspecialidadesProf(p.especialidade || '');
  document.getElementById('prof-id').value = id;
  ['prof-nome','prof-idade','prof-data-contratual','prof-bi','prof-morada','prof-contacto','prof-esp','prof-taxa','prof-meta'].forEach(fid => {
    const el = document.getElementById(fid);
    if (el) { el.disabled = true; el.style.opacity = '0.85'; }
  });
  const saveBtn = document.getElementById('modal-prof-save');
  if (saveBtn) saveBtn.style.display = 'none';
  const box = document.getElementById('prof-criar-servico-box');
  if (box) box.style.display = 'none';
  openModal('modal-prof');
}

document.getElementById('prof-esp')?.addEventListener('change', function() {
  const box = document.getElementById('prof-criar-servico-box');
  if (box) box.style.display = this.value === '__criar' ? 'block' : 'none';
});

document.getElementById('prof-criar-servico-btn')?.addEventListener('click', async function() {
  const nome = (document.getElementById('prof-novo-servico-nome')?.value || '').trim();
  const preco = parseFloat(document.getElementById('prof-novo-servico-preco')?.value);
  if (!nome || !preco || preco <= 0) {
    toast('Indique o nome e o preço do novo serviço.', 'error');
    return;
  }
  if (existeNomeDuplicado('servicos', nome)) {
    toast('Já existe um serviço com este nome.', 'error');
    return;
  }
  const profNome = (document.getElementById('prof-nome')?.value || '').trim();
  const n = await addServico({ nome, precoBase: preco, profissionais: profNome ? [profNome] : [] });
  if (n) {
    popularEspecialidadesProf(nome);
    document.getElementById('prof-esp').value = nome;
    document.getElementById('prof-criar-servico-box').style.display = 'none';
    document.getElementById('prof-novo-servico-nome').value = '';
    document.getElementById('prof-novo-servico-preco').value = '';
    // Modal limpo de confirmação
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay open';
    overlay.id = 'modal-servico-criado-temp';
    overlay.innerHTML = `<div class="modal-confirm-sheet" style="text-align:left;">
      <div class="confirm-title" style="margin-bottom:12px;">Serviço criado</div>
      <div class="confirm-message" style="text-align:left;line-height:1.5;">O serviço foi ajustado e associado ao profissional. Podes ajustar ou editar a qualquer momento na aba Equipa.</div>
      <div class="confirm-actions" style="margin-top:20px;"><button type="button" class="btn btn-primary btn-block" id="svc-criado-ok">OK</button></div>
    </div>`;
    document.body.appendChild(overlay);
    document.getElementById('svc-criado-ok').onclick = () => overlay.remove();
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  }
});

document.getElementById('add-prof-btn')?.addEventListener('click', () => {
  editProfId = null;
  document.getElementById('prof-modal-title').textContent = 'Novo Profissional';
  ['prof-nome', 'prof-idade', 'prof-data-contratual', 'prof-bi', 'prof-morada', 'prof-contacto', 'prof-id', 'prof-taxa', 'prof-meta'].forEach(fid => {
    const el = document.getElementById(fid);
    if (el) {
      el.value = (fid === 'prof-taxa') ? '0' : '';
      el.disabled = false; el.readOnly = false; el.style.opacity = '1';
    }
  });
  popularEspecialidadesProf('');
  const saveBtn = document.getElementById('modal-prof-save');
  if (saveBtn) saveBtn.style.display = '';
  openModal('modal-prof');
});

document.getElementById('modal-prof-save')?.addEventListener('click', async () => {
  const nome = (document.getElementById('prof-nome')?.value || '').trim();
  const idade = document.getElementById('prof-idade')?.value;
  const dataContratual = (document.getElementById('prof-data-contratual')?.value || '').trim();
  const espSelect = document.getElementById('prof-esp')?.value || '';
  const especialidade = espSelect === '__criar' ? '' : espSelect;
  const numeroBI = (document.getElementById('prof-bi')?.value || '').trim().toUpperCase();
  const morada = (document.getElementById('prof-morada')?.value || '').trim();
  const contacto = (document.getElementById('prof-contacto')?.value || '').replace(/\D/g, '');
  const id = document.getElementById('prof-id')?.value;

  if (!nome) { toast('Nome é obrigatório', 'error'); return; }
  if (!idade || isNaN(parseInt(idade, 10))) { toast('Idade é obrigatória', 'error'); return; }
  if (!dataContratual) { toast('Data contratual é obrigatória', 'error'); return; }
  if (!especialidade) { toast('Seleccione uma especialidade (serviço)', 'error'); return; }
  if (numeroBI && typeof validarBI === 'function' && !validarBI(numeroBI)) {
    toast('Número do BI incompleto ou em formato inválido. Preencha correctamente ou deixe em branco.', 'error');
    return;
  }
  if (contacto && contacto.length !== 9) {
    toast('Contacto deve ter exactamente 9 dígitos, ou deixe em branco.', 'error');
    return;
  }

  const taxaRaw = document.getElementById('prof-taxa') ? document.getElementById('prof-taxa').value : '0';
  const metaRaw = document.getElementById('prof-meta') ? document.getElementById('prof-meta').value : '';
  const taxaComissao = Math.min(100, Math.max(0, parseFloat(taxaRaw) || 0));
  let metaMensal = null;
  if (metaRaw !== '' && metaRaw != null) {
    const nMeta = parseInt(metaRaw, 10);
    if (!isNaN(nMeta) && nMeta >= 0) metaMensal = nMeta;
  }
  const dados = {
    nome,
    idade: parseInt(idade, 10),
    dataContratual,
    especialidade,
    numeroBI: numeroBI || '',
    morada,
    contacto: contacto || '',
    taxa_comissao: taxaComissao,
    meta_mensal: metaMensal
  };

  if (id) {
    await updateProfissional(id, dados);
    toast('Dados do profissional actualizados', 'success');
    closeModal('modal-prof');
  } else {
    const result = await addProfissional(dados);
    if (result) closeModal('modal-prof');
  }
});

document.getElementById('modal-prof-cancel')?.addEventListener('click', () => {
  ['prof-nome','prof-idade','prof-data-contratual','prof-bi','prof-morada','prof-contacto','prof-esp','prof-taxa','prof-meta'].forEach(fid => {
    const el = document.getElementById(fid);
    if (el) { el.disabled = false; el.style.opacity = '1'; }
  });
  const saveBtn = document.getElementById('modal-prof-save');
  if (saveBtn) saveBtn.style.display = '';
  closeModal('modal-prof');
});

// Clique na linha do profissional → detalhe só leitura
document.addEventListener('click', function(e) {
  const row = e.target.closest('.list-item[data-prof-id]');
  if (!row) return;
  if (e.target.closest('.row-menu-btn') || e.target.closest('.row-menu')) return;
  const id = row.dataset.profId;
  if (id) abrirDetalheProfView(id);
});

// CRUD Serviço
document.getElementById('add-servico-btn').addEventListener('click', () => openServicoModal());

document.getElementById('modal-servico-save').addEventListener('click', async () => {
  const nome = document.getElementById('servico-nome').value.trim();
  const precoBase = parseFloat(document.getElementById('servico-preco').value);
  const id = document.getElementById('servico-id').value;
  const profissionais = getSelectedProfissionais();
  if (!nome || isNaN(precoBase) || precoBase <= 0) { toast('Preencha nome e preço válido', 'error'); return; }
  if (!profissionais || profissionais.length === 0) {
    toast('Selecione pelo menos um profissional para este serviço', 'error');
    return;
  }
  if (id) { await updateServico(id, { nome, precoBase, profissionais });
    toast('Serviço actualizado', 'success'); } else { await addServico({ nome, precoBase, profissionais }); }
  closeModal('modal-servico');
  updateUI();
});

document.getElementById('modal-servico-cancel').addEventListener('click', () => closeModal('modal-servico'));
// ====================================================================
//  FASE E — Ver detalhe do cliente (só visualização ao clicar na linha)
// ====================================================================
function abrirDetalheClienteView(id) {
  const c = state.clientes.find(x => x.id === id);
  if (!c) return;
  const stats = typeof getEstatisticasCliente === 'function'
    ? getEstatisticasCliente(c.nome)
    : { visitas: 0, totalGasto: 0, ultimaVisita: null };

  // Reutiliza modal-cliente em modo leitura
  editClienteId = id;
  document.getElementById('cliente-modal-title').textContent = 'Perfil do Cliente';
  document.getElementById('cliente-nome').value = c.nome;
  document.getElementById('cliente-telefone').value = c.telefone || '';
  document.getElementById('cliente-notas').value = c.notas || '';
  document.getElementById('cliente-id').value = id;

  // Bloquear edição
  ['cliente-nome', 'cliente-telefone', 'cliente-notas'].forEach(fid => {
    const el = document.getElementById(fid);
    if (el) { el.readOnly = true; el.style.opacity = '0.85'; }
  });
  const saveBtn = document.getElementById('modal-cliente-save');
  if (saveBtn) saveBtn.style.display = 'none';

  const statsEl = document.getElementById('cliente-perfil-stats');
  if (statsEl) {
    statsEl.innerHTML = `
      <div><div class="stat-valor">${stats.visitas}</div><div class="stat-legenda">${stats.visitas === 1 ? 'Visita' : 'Visitas'}</div></div>
      <div><div class="stat-valor">${fmtKz(stats.totalGasto)}</div><div class="stat-legenda">Total gasto</div></div>
      <div><div class="stat-valor">${typeof formatarUltimaVisita === 'function' ? formatarUltimaVisita(stats.ultimaVisita) : '—'}</div><div class="stat-legenda">Última visita</div></div>
    `;
    statsEl.style.display = 'grid';
  }
  openModal('modal-cliente');
}

// Ao fechar, reactivar campos
document.getElementById('modal-cliente-cancel')?.addEventListener('click', () => {
  ['cliente-nome', 'cliente-telefone', 'cliente-notas'].forEach(fid => {
    const el = document.getElementById(fid);
    if (el) { el.readOnly = false; el.style.opacity = '1'; }
  });
  const saveBtn = document.getElementById('modal-cliente-save');
  if (saveBtn) saveBtn.style.display = '';
});

// Clique na linha do cliente (não no menu)
document.addEventListener('click', function(e) {
  const row = e.target.closest('.cliente-item[data-cliente-id]');
  if (!row) return;
  if (e.target.closest('.row-menu-btn') || e.target.closest('.row-menu')) return;
  const id = row.dataset.clienteId;
  if (id) abrirDetalheClienteView(id);
});

// Validação telefone 9 dígitos (Angola)
function validarTelefoneAO(tel) {
  const digits = String(tel || '').replace(/\D/g, '');
  return digits.length === 0 || digits.length === 9;
}

function validarBI(bi) {
  const v = String(bi || '').trim().toUpperCase();
  if (!v) return true; // opcional
  // Formato angolano simplificado: 9 dígitos + 2 letras + 3 dígitos (ex: 001234567LA048)
  // Aceita também sequências alfanuméricas completas >= 10 chars
  return /^[0-9]{9}[A-Z]{2}[0-9]{3}$/.test(v) || /^[0-9A-Z]{10,20}$/.test(v);
}


/* ===== FILE: eventos-caixa-vendas.js ===== */

// ====================================================================
//  eventos-caixa-vendas.js — extraído do app.js (Fase C da modularização)
//  Conteúdo: Eventos: despesa, fundo, carrinho/venda, confirmação de venda, fecho de caixa, detalhes e KPIs
//  Linhas originais: 1877-2109
//  Carregar depois de core-*.js, db-indexeddb.js, sync-*.js, auth-supabase.js
//  CORREÇÃO: adicionado profissional_id e renderBadges() no modal-finalizar-save
// ====================================================================

// Despesa
document.getElementById('add-despesa-btn').addEventListener('click', () => openModal('modal-despesa'));
document.getElementById('modal-despesa-save').addEventListener('click', async () => {
  const desc = document.getElementById('desp-desc').value.trim();
  const valor = parseFloat(document.getElementById('desp-valor').value);
  if (!desc || !valor || valor <= 0) { toast('Preencha descrição e valor válido', 'error'); return; }
  await addMovimento({ tipo: 'despesa', descricao: desc, valor });
  closeModal('modal-despesa');
  document.getElementById('desp-desc').value = '';
  document.getElementById('desp-valor').value = '';
  toast('Despesa registada no caixa', 'success');
});
document.getElementById('modal-despesa-cancel').addEventListener('click', () => closeModal('modal-despesa'));

// Fundo
document.getElementById('ajustar-fundo-btn').addEventListener('click', () => {
  document.getElementById('fundo-valor').value = state.config.fundo;
  openModal('modal-fundo');
});
document.getElementById('modal-fundo-save').addEventListener('click', async () => {
  const v = parseFloat(document.getElementById('fundo-valor').value);
  if (isNaN(v) || v < 0) { toast('Valor inválido', 'error'); return; }
  state.config.fundo = v;
  await saveConfig();
  closeModal('modal-fundo');
  toast('Fundo de caixa actualizado', 'success');
  updateUI();
});
document.getElementById('modal-fundo-cancel').addEventListener('click', () => closeModal('modal-fundo'));

// Venda – Adicionar item ao carrinho (profissional único/global)
document.getElementById('btn-add-item').addEventListener('click', () => {
  // VALIDAÇÃO: profissional obrigatório (global)
  const profissionalId = document.getElementById('venda-profissional').value;
  if (!profissionalId || profissionalId.trim() === '') {
    toast('Selecione um profissional antes de adicionar ao carrinho.', 'error');
    return;
  }

  const catSel = document.getElementById('ci-servico-sel');
  const ciValor = document.getElementById('ci-valor');
  let nome = catSel.value;
  if (nome === '__custom') { 
    nome = prompt('Nome do serviço / produto:'); 
    if (!nome || !nome.trim()) return;
    nome = nome.trim(); 
  }
  const wasDisabled = ciValor.disabled;
  ciValor.disabled = false;
  const valor = parseFloat(ciValor.value);
  if (wasDisabled) ciValor.disabled = true;
  if (!nome || !valor || valor <= 0) { 
    toast('Preencha serviço e valor válido', 'error'); 
    return; 
  }

  // Usar a função central addToCart (definida em vendas-modais.js) - sem profissional por item
  if (typeof window.addToCart === 'function') {
    window.addToCart(nome, valor);
  } else {
    // Fallback
    const existingIndex = cartItems.findIndex(item => item.nome === nome);
    if (existingIndex !== -1) {
      cartItems[existingIndex].quantidade += 1;
      cartItems[existingIndex].subtotal = cartItems[existingIndex].quantidade * cartItems[existingIndex].precoUnit;
    } else {
      cartItems.push({ nome, quantidade: 1, precoUnit: valor, subtotal: valor });
    }
    renderCart();
  }
});

// CORREÇÃO: modal-venda-save com profissional único
const vendaSaveBtn = document.getElementById('modal-venda-save');
if (vendaSaveBtn) {
  vendaSaveBtn.onclick = async function(e) {
    if (cartItems.length === 0) { toast('Adicione pelo menos um serviço', 'error'); return; }
    const cliente = document.getElementById('venda-cliente').value || 'Anónimo';
    const profissionalId = document.getElementById('venda-profissional').value;
    let metodoPagamento = document.getElementById('venda-pagamento').value;
    let pagamentos = null;

    // F13 — pagamento dividido
    if (metodoPagamento === '__split__') {
      const split = (window.BPFinance && window.BPFinance.lerPagamentosSplit)
        ? window.BPFinance.lerPagamentosSplit()
        : null;
      const totalCart = cartItems.reduce((s, i) => s + (Number(i.subtotal) || 0), 0);
      if (!split || !split.list.length) {
        toast('Indique os valores do pagamento dividido.', 'error');
        return;
      }
      if (Math.abs(split.sum - totalCart) > 1) {
        toast('A soma dos pagamentos (' + Math.round(split.sum) + ' Kz) deve igualar o total (' + Math.round(totalCart) + ' Kz).', 'error');
        return;
      }
      pagamentos = split.list;
      metodoPagamento = split.list.map(p => p.metodo).join(' + ');
    }
    
    // Buscar o nome do profissional
    const profObj = state.profissionais.find(p => p.id === profissionalId);
    const profissionalNome = profObj ? profObj.nome : '';
    
    // Validação antecipada do profissional
    if (!profissionalId || String(profissionalId).trim() === '') {
      toast('Selecione um profissional antes de registar a venda.', 'error');
      return;
    }

    setButtonLoading(this, true);
    try {
      const idVenda = await registarVenda({
        cliente,
        profissional: profissionalNome,
        profissional_id: profissionalId,
        itens: [...cartItems],
        metodoPagamento,
        pagamentos
      });
      if (idVenda) {
        closeModal('modal-venda');
        if (typeof window.clearCart === 'function') {
          window.clearCart();
        } else {
          cartItems = [];
          renderCart();
        }
        mostrarConfirmacaoVenda(idVenda);
      }
      // se idVenda for null, registarVenda já mostrou o toast de validação
    } catch (err) {
      console.error('[modal-venda-save]', err);
      // Não bloquear a UX com modal de erro genérico se a venda local já foi tentada
      toast('Ocorreu um problema ao registar a venda. Verifique os dados e tente novamente.', 'error');
    } finally {
      setButtonLoading(this, false);
    }
  };
}

// Cancelar venda – limpar carrinho com confirmação e fechar modal
document.getElementById('modal-venda-cancel').addEventListener('click', () => {
  if (cartItems.length > 0) {
    const confirmCancel = confirm('Tem a certeza que deseja cancelar? O carrinho será limpo.');
    if (!confirmCancel) return;
  }
  if (typeof window.clearCart === 'function') {
    window.clearCart();
  } else {
    cartItems = [];
    renderCart();
  }
  closeModal('modal-venda');
});

document.getElementById('venda-add-cliente-rapido').addEventListener('click', () => {
  closeModal('modal-venda');
  document.getElementById('cliente-rapido-nome').value = '';
  document.getElementById('cliente-rapido-telefone').value = '';
  openModal('modal-cliente-rapido');
});

// Tela de sucesso da venda
let ultimaVendaId = null;

const PAGAMENTO_ICONES = {
  'Numerário': 'Numerário',
  'Multicaixa Express': 'Multicaixa Express',
  'Transferência Bancária': 'Transferência Bancária',
  'Cartão': 'Cartão',
  'Outro': 'Outro',
};

function mostrarConfirmacaoVenda(vendaId) {
  // Constituição: sem modal de sucesso de venda — toast + actualização UI
  const venda = (state.vendas || []).find(v => v.id === vendaId)
    || (state.movimentos || []).find(m => m.id === vendaId);
  const valor = venda ? (venda.total || venda.valor || 0) : 0;
  toast('Venda registada · ' + (typeof fmtKz === 'function' ? fmtKz(valor) : valor + ' Kz'), 'success');
  if (typeof updateUI === 'function') updateUI();
  // Guardar id para impressão rápida se o utilizador abrir detalhe
  try { sessionStorage.setItem('bp_last_venda_id', vendaId); } catch (_) {}
}


// ====================================================================
// CORREÇÃO: Finalizar atendimento (adicionado profissional_id e renderBadges)
// ====================================================================
document.getElementById('modal-finalizar-save').addEventListener('click', async () => {
  const id = document.getElementById('finalizar-ag-id').value;
  const ag = state.agendamentos.find(a => a.id === id);
  if (!ag) return;
  if (ag.status !== 'agendado') {
    toast('Este atendimento já não está disponível para finalizar (foi cancelado, expirou ou já foi realizado).', 'warning');
    closeModal('modal-finalizar');
    return;
  }
  const metodo = document.getElementById('finalizar-pagamento').value;
  
  // Atualizar status do agendamento para realizado
  await updateAgendamento(id, { status: 'realizado' });
  
  // Registar a venda com profissional_id
  const itens = [{ nome: ag.servico, quantidade: 1, precoUnit: ag.preco, subtotal: ag.preco }];
  await registarVenda({ 
    cliente: ag.cliente, 
    profissional: ag.profissional, 
    profissional_id: ag.profissional_id, // <- CORREÇÃO
    itens, 
    metodoPagamento: metodo 
  });
  
  closeModal('modal-finalizar');
  toast('Atendimento finalizado e venda registada!', 'success');
  
  // Atualizar UI e badge
  updateUI();
  renderBadges(); // <- CORREÇÃO
});

document.getElementById('modal-finalizar-cancel').addEventListener('click', () => closeModal('modal-finalizar'));

// ====================================================================
//  CONFIRMAR FECHO DE CAIXA (persistência)
// ====================================================================
async function confirmarFechoCaixa() {
  const hojeStr = hoje();
  const movs = state.movimentos.filter(m => m.data === hojeStr);
  const vendas = movs.filter(m => m.tipo === 'venda');
  const despesas = movs.filter(m => m.tipo === 'despesa');

  // Verificar se já existe fecho para hoje
  if (state.fechos_caixa && state.fechos_caixa.some(f => f.data === hojeStr)) {
    toast('Já existe um fecho de caixa registado para hoje.', 'warning');
    return;
  }

  const detalhePagamento = {};
  vendas.forEach(v => {
    const mp = v.metodoPagamento || 'Numerário';
    detalhePagamento[mp] = (detalhePagamento[mp] || 0) + v.valor;
  });

  const totalVendas = vendas.reduce((s, v) => s + v.valor, 0);
  const totalDespesas = despesas.reduce((s, d) => s + d.valor, 0);
  const saldoFinal = state.config.fundo + totalVendas - totalDespesas;

  const registro = {
    id: uuid(),
    salao_id: state.config.salaoId,
    data: hojeStr,
    fundo_abertura: state.config.fundo,
    total_vendas: totalVendas,
    total_despesas: totalDespesas,
    saldo_final: saldoFinal,
    detalhe_pagamento: detalhePagamento,
    fechado_por: state.config.userId || null,
  };

  await dbPut('fechos_caixa', registro);
  // Atualizar o estado local
  state.fechos_caixa.push(registro);
  toast('Caixa fechado e registado com sucesso!', 'success');
  closeModal('modal-fecho');
  updateUI();
}

// ====================================================================
//  FECHO DE CAIXA (listeners)
// ====================================================================
document.getElementById('fecho-caixa-btn').addEventListener('click', abrirFechoCaixa);
document.getElementById('modal-fecho-fechar').addEventListener('click', () => closeModal('modal-fecho'));
document.getElementById('btn-imprimir-fecho').addEventListener('click', () => {
  const hojeStr = hoje();
  const vendas = state.movimentos.filter(m => m.data === hojeStr && m.tipo === 'venda');
  const despesas = state.movimentos.filter(m => m.data === hojeStr && m.tipo === 'despesa');
  const tv = vendas.reduce((s, v) => s + v.valor, 0);
  const td = despesas.reduce((s, d) => s + d.valor, 0);
  const byPag = {};
  vendas.forEach(v => { const k = v.metodoPagamento || 'Numerário';
    byPag[k] = (byPag[k] || 0) + v.valor; });
  document.getElementById('recibo-print').innerHTML = `
    <div class="r-store">${escHtml(state.config.storeName)}</div>
    <div class="r-sub">FECHO DE CAIXA</div>
    <div class="r-num">${hojeStr}</div>
    <hr class="r-div">
    <div class="r-meta"><b>Fundo abertura: </b>${fmtKz(state.config.fundo)}</div>
    <div class="r-meta"><b>Total vendas (${vendas.length}): </b>${fmtKz(tv)}</div>
    <div class="r-meta"><b>Total despesas (${despesas.length}): </b>${fmtKz(td)}</div>
    <hr class="r-div">
    ${Object.entries(byPag).map(([k, v]) => `<div class="r-meta">${escHtml(k)}: ${fmtKz(v)}</div>`).join('')}
    <hr class="r-div">
    <div class="r-total">SALDO: ${fmtKz(state.config.fundo + tv - td)}</div>
    <div class="r-footer"><strong>BeautyPro</strong>Fechado ${new Date().toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })}</div>`;
  requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
});

// NOVO: Listener para o botão "Confirmar Fecho"
document.getElementById('confirmar-fecho-btn')?.addEventListener('click', confirmarFechoCaixa);

// Detalhe venda
document.getElementById('modal-detalhe-fechar').addEventListener('click', () => closeModal('modal-detalhe-venda'));
document.getElementById('btn-imprimir-recibo').addEventListener('click', () => {
  if (vendaAtual) imprimirRecibo(vendaAtual);
  else toast('Nenhuma venda para imprimir', 'error');
});

// KPIs clicáveis
document.getElementById('kpi-revenue-card').addEventListener('click', abrirDetalheFaturamento);
document.getElementById('kpi-agenda-card').addEventListener('click', () => abrirDetalheAgendamentos('pendentes'));

document.getElementById('modal-revenue-close').addEventListener('click', () => closeModal('modal-revenue-detail'));
document.getElementById('modal-agenda-close').addEventListener('click', () => closeModal('modal-agenda-detail'));

document.getElementById('agenda-detail-pendentes').addEventListener('click', () => abrirDetalheAgendamentos('pendentes'));
document.getElementById('agenda-detail-realizados').addEventListener('click', () => abrirDetalheAgendamentos('realizados'));

// hist-chip substituído pelo popover caixa-filter (Fase E)


// Filtro clientes
document.querySelectorAll('.filtro-frequencia').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.filtro-frequencia').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    state.filtroClientes = this.dataset.filtro;
    localStorage.setItem('bp_filtro_clientes', state.filtroClientes);
    renderClientes();
  });
});

// Agenda navegação
// ====================================================================
//  FASE E — Filtro Caixa (popover) + Localizar cliente
// ====================================================================
(function initCaixaFiltro() {
  const icon = document.getElementById('caixa-filter-icon');
  const pop = document.getElementById('caixa-filter-popover');
  if (!icon || !pop) return;

  icon.addEventListener('click', function(e) {
    e.stopPropagation();
    const open = pop.style.display === 'block';
    pop.style.display = open ? 'none' : 'block';
    document.querySelectorAll('.caixa-periodo-filter').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.periodo === (state.histPeriodo || 'hoje'));
    });
  });

  document.addEventListener('click', function(e) {
    if (pop.style.display === 'block' && !pop.contains(e.target) && e.target !== icon && !icon.contains(e.target)) {
      pop.style.display = 'none';
    }
  });

  document.querySelectorAll('.caixa-periodo-filter').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const periodo = this.dataset.periodo;
      if (periodo === 'dia') {
        const input = document.getElementById('caixa-data-exata');
        if (input) {
          input.onchange = function() {
            if (this.value) {
              localStorage.setItem('bp_caixa_data_exata', this.value);
              state.histPeriodo = 'dia';
              pop.style.display = 'none';
              renderCaixa();
            }
          };
          input.click();
        }
        return;
      }
      state.histPeriodo = periodo;
      localStorage.setItem('bp_hist_periodo', periodo);
      pop.style.display = 'none';
      renderCaixa();
    });
  });
})();

(function initCaixaLocalizar() {
  const btn = document.getElementById('caixa-localizar-btn');
  const pop = document.getElementById('caixa-localizar-popover');
  const buscaBox = document.getElementById('caixa-localizar-busca');
  const input = document.getElementById('caixa-localizar-input');
  const go = document.getElementById('caixa-localizar-go');
  if (!btn || !pop) return;

  let periodoLoc = null;

  btn.addEventListener('click', function(e) {
    e.stopPropagation();
    const open = pop.style.display === 'block';
    pop.style.display = open ? 'none' : 'block';
    if (buscaBox) buscaBox.style.display = 'none';
    periodoLoc = null;
    document.querySelectorAll('.caixa-loc-periodo').forEach(b => b.classList.remove('active'));
  });

  document.addEventListener('click', function(e) {
    if (pop.style.display === 'block' && !pop.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
      pop.style.display = 'none';
    }
  });

  document.querySelectorAll('.caixa-loc-periodo').forEach(b => {
    b.addEventListener('click', function(e) {
      e.stopPropagation();
      periodoLoc = this.dataset.periodo;
      document.querySelectorAll('.caixa-loc-periodo').forEach(x => x.classList.remove('active'));
      this.classList.add('active');
      if (buscaBox) buscaBox.style.display = 'block';
      if (input) { input.value = ''; input.focus(); }
    });
  });

  function procurar() {
    if (!periodoLoc) {
      toast('Seleccione primeiro o período.', 'warning');
      return;
    }
    const nome = (input && input.value || '').trim().toLowerCase();
    if (!nome) {
      toast('Introduza o nome do cliente.', 'warning');
      return;
    }
    const movs = getMovimentosPeriodo(periodoLoc).filter(m =>
      m.tipo === 'venda' && m.cliente && m.cliente.toLowerCase().includes(nome)
    );
    if (movs.length === 0) {
      pop.style.display = 'none';
      openModal('modal-cliente-nao-encontrado');
      return;
    }
    // Mostrar só estes movimentos e actualizar título
    state.histPeriodo = periodoLoc;
    const cont = document.getElementById('movimentos-list');
    const tit = document.getElementById('hist-titulo');
    if (tit) tit.textContent = 'Histórico: ' + movs[0].cliente;
    if (cont) {
      cont.innerHTML = movs.sort((a,b) => b.data.localeCompare(a.data) || b.hora.localeCompare(a.hora)).map(m => {
        const nomeProf = typeof getProfissionalNome === 'function' ? getProfissionalNome(m.profissional_id) : '';
        return `<div class="list-item list-item-venda" data-id="${m.id}" data-tipo="venda" style="padding-right:32px;">
          <div class="avatar" style="background:#E6F4EC;color:var(--green);font-size:0;" aria-hidden="true"><span style="display:block;width:8px;height:8px;border-radius:50%;background:currentColor;margin:auto;"></span></div>
          <div class="info">
            <div class="title">${escHtml(m.descricao)}</div>
            <div class="sub">${m.data} · ${m.hora} · ${escHtml(m.cliente || '')} · ${escHtml(m.metodoPagamento || '')}</div>
          </div>
          <div class="action" style="color:var(--green);">+${fmtKz(m.valor)}</div>
        </div>`;
      }).join('');
      cont.querySelectorAll('.list-item-venda').forEach(el => {
        el.addEventListener('click', e => { abrirDetalheVenda(el.dataset.id); });
      });
    }
    pop.style.display = 'none';
  }

  if (go) go.addEventListener('click', procurar);
  if (input) input.addEventListener('keydown', e => { if (e.key === 'Enter') procurar(); });
})();

document.getElementById('modal-cliente-nao-encontrado-ok')?.addEventListener('click', () => {
  closeModal('modal-cliente-nao-encontrado');
});


/* ===== FILE: eventos-globais.js ===== */

// ====================================================================
//  eventos-globais.js — extraído do app.js (Fase C da modularização)
//  Conteúdo: Eventos: navegação da agenda, menu de linha, online/offline, overlays de modal
//  Linhas originais: 2110-2317
//  Carregar depois de core-*.js, db-indexeddb.js, sync-*.js, auth-supabase.js
// ====================================================================
const originalMudarAgenda = window.mudarAgenda;
if (originalMudarAgenda) {
  window.mudarAgenda = function(delta) {
    const container = document.getElementById('agenda-full-list');
    if (!container) { originalMudarAgenda(delta); return; }
    container.classList.add('agenda-slide-out');
    setTimeout(() => {
      originalMudarAgenda(delta);
      container.classList.remove('agenda-slide-out');
      container.classList.add('agenda-slide-in');
      setTimeout(() => container.classList.remove('agenda-slide-in'), 300);
    }, 150);
  };
}

document.getElementById('agenda-prev').addEventListener('click', () => mudarAgenda(-1));
document.getElementById('agenda-next').addEventListener('click', () => mudarAgenda(1));

// Duplo clique no nome do salão
document.getElementById('store-name-display')?.addEventListener('dblclick', () => {
  const equipaNav = document.querySelector('.nav-item[data-tab="equipa"]');
  if (equipaNav && equipaNav.style.display !== 'none') equipaNav.click();
});

// Ripple global
document.addEventListener('click', function(e) {
  const target = e.target.closest('.btn, .list-item, .card, .kpi-card, .nav-item, .venda-cta-bar, .fab, .prof-card');
  if (target && !target.closest('.btn.is-loading')) {
    /* ripple desactivado */
  }
});

// ====================================================================
//  MENU DE ACÇÕES DA LINHA (⋮)
// ====================================================================
function abrirMenuLinha(anchorEl, tipo, id) {
  const menu = document.getElementById('row-menu');
  const editLabel = document.getElementById('row-menu-edit-label');
  const delBtn = document.getElementById('row-menu-delete');
  const papel = normalizarRole(state.config.userRole);

  const config = {
    cliente:      { editLabel: 'Ajustar perfil', delAction: 'del-cliente', podeEliminar: papel === 'admin' || papel === 'gerente' },
    profissional: { editLabel: 'Ajustar',         delAction: 'del-p',       podeEliminar: papel === 'admin' },
    servico:      { editLabel: 'Ajustar',         delAction: 'del-servico', podeEliminar: papel === 'admin' },
  }[tipo];
  if (!config) return;

  if (menu.classList.contains('is-open') && menu.dataset.id === id && menu.dataset.tipo === tipo) {
    fecharMenuLinha();
    return;
  }

  editLabel.textContent = config.editLabel;
  menu.dataset.tipo = tipo;
  menu.dataset.id = id;
  delBtn.dataset.action = config.delAction;
  delBtn.dataset.id = id;
  delBtn.style.display = config.podeEliminar ? 'flex' : 'none';

  document.querySelectorAll('.row-menu-btn.is-open').forEach(b => b.classList.remove('is-open'));
  anchorEl.classList.add('is-open');

  menu.style.display = 'flex';
  const rect = anchorEl.getBoundingClientRect();
  const menuWidth = menu.offsetWidth || 168;
  const menuHeight = menu.offsetHeight || 90;
  let left = rect.right - menuWidth;
  if (left < 8) left = 8;
  let top = rect.bottom + 6;
  if (top + menuHeight > window.innerHeight - 8) top = rect.top - menuHeight - 6;
  menu.style.left = left + 'px';
  menu.style.top = top + 'px';
  requestAnimationFrame(() => menu.classList.add('is-open'));
  window._lastMenuTrigger = anchorEl;
  const firstItem = menu.querySelector('.row-menu-item:not([style*="display: none"])');
  if (firstItem) setTimeout(() => firstItem.focus(), 50);
}

function fecharMenuLinha() {
  const menu = document.getElementById('row-menu');
  if (!menu.classList.contains('is-open')) return;
  menu.classList.remove('is-open');
  document.querySelectorAll('.row-menu-btn.is-open').forEach(b => b.classList.remove('is-open'));
  setTimeout(() => {
    if (!menu.classList.contains('is-open')) menu.style.display = 'none';
    if (window._lastMenuTrigger) {
      window._lastMenuTrigger.focus();
      window._lastMenuTrigger = null;
    }
  }, 150);
}

document.addEventListener('click', (e) => {
  if (e.target.closest('#row-menu') || e.target.closest('[data-action="row-menu"]')) return;
  fecharMenuLinha();
});

document.getElementById('row-menu-edit').addEventListener('click', () => {
  const menu = document.getElementById('row-menu');
  const tipo = menu.dataset.tipo;
  const id = menu.dataset.id;
  if (tipo === 'cliente') openEditCliente(id);
  else if (tipo === 'profissional') openEditProf(id);
  else if (tipo === 'servico') openServicoModal(id);
});
// Confirm nativo substituído
document.addEventListener('click', async function(e) {
  const rowMenuBtn = e.target.closest('[data-action="row-menu"]');
  if (rowMenuBtn) {
    e.preventDefault();
    e.stopPropagation();
    abrirMenuLinha(rowMenuBtn, rowMenuBtn.dataset.tipo, rowMenuBtn.dataset.id);
    return;
  }

  if (e.target.closest('.row-menu-item')) {
    fecharMenuLinha();
  }

  const target = e.target.closest('[data-action="cancelar-agenda"]');
  if (target) {
    e.preventDefault();
    e.stopPropagation();
    const id = target.dataset.id;
    const ag = state.agendamentos.find(a => a.id === id);
    if (!ag) return;
    const confirmed = await showConfirmModal('Cancelar Agendamento?', `Tem a certeza que quer cancelar o agendamento de ${ag.cliente} para ${ag.servico}? Esta acção não pode ser desfeita.`, true);
    if (confirmed) {
      // CORREÇÃO: antes eliminava-se o agendamento por completo
      // (deleteAgendamento), o que impedia qualquer vista de
      // "Cancelados" e zerava sempre as métricas de cancelamento já
      // calculadas em ia-module.js. Agora fica marcado como cancelado,
      // continua a existir (histórico), só deixa de contar como
      // pendente/realizado.
      await updateAgendamento(id, { status: 'cancelado' });
      toast('Agendamento cancelado', 'warning');
    }
    return;
  }

  const delProf = e.target.closest('[data-action="del-p"]');
  if (delProf) {
    e.preventDefault();
    e.stopPropagation();
    if (normalizarRole(state.config.userRole) !== 'admin') {
      toast('Não tem permissão para executar esta acção.', 'error');
      return;
    }
    const id = delProf.dataset.id;
    const prof = state.profissionais.find(p => p.id === id);
    if (!prof) return;
    const confirmed = await showConfirmModal('Remover Profissional?', `Tem a certeza que quer remover ${prof.nome}? Esta acção não pode ser desfeita.`, true);
    if (confirmed) await deleteProfissional(id);
    return;
  }

  const delServ = e.target.closest('[data-action="del-servico"]');
  if (delServ) {
    e.preventDefault();
    e.stopPropagation();
    if (normalizarRole(state.config.userRole) !== 'admin') {
      toast('Não tem permissão para executar esta acção.', 'error');
      return;
    }
    const id = delServ.dataset.id;
    const serv = state.servicos.find(s => s.id === id);
    if (!serv) return;
    const confirmed = await showConfirmModal('Eliminar Serviço?', `Tem a certeza que quer eliminar "${serv.nome}"? Esta acção não pode ser desfeita.`, true);
    if (confirmed) await deleteServico(id);
    return;
  }

  const delCliente = e.target.closest('[data-action="del-cliente"]');
  if (delCliente) {
    e.preventDefault();
    e.stopPropagation();
    const papel = normalizarRole(state.config.userRole);
    if (papel !== 'admin' && papel !== 'gerente') {
      toast('Não tem permissão para executar esta acção.', 'error');
      return;
    }
    const id = delCliente.dataset.id;
    const cli = state.clientes.find(c => c.id === id);
    if (!cli) return;
    const confirmed = await showConfirmModal('Eliminar Cliente?', `Tem a certeza que quer eliminar "${cli.nome}"? Esta acção não pode ser desfeita.`, true);
    if (confirmed) await deleteCliente(id);
    return;
  }
}, true);

// ONLINE/OFFLINE
window.addEventListener('online', () => {
  const container = document.getElementById('sync-status-container');
  if (container) container.style.display = 'none';
  document.getElementById('sync-dot')?.classList.add('online');
  document.getElementById('offline-banner')?.classList.remove('show');
  atualizarIAOffline();
  flushSyncQueue().then(atualizarIndicadorSync);
});

window.addEventListener('offline', () => {
  const container = document.getElementById('sync-status-container');
  if (container) container.style.display = 'flex';
  document.getElementById('sync-dot')?.classList.remove('online');
  document.getElementById('offline-banner')?.classList.add('show');
  atualizarIAOffline();
});

// Fechar modais ao clicar no overlay
document.querySelectorAll('.modal-overlay').forEach(el => {
  el.addEventListener('click', (e) => { if (e.target === el) closeModal(el.id); });
});

// ====================================================================
//  IA – buildContextoIA (CORRIGIDO: usa profissional_id)


/* ===== FILE: ia-module.js ===== */

// ====================================================================
//  ia-module.js — extraído do app.js (Fase C da modularização)
//  Conteúdo: Contexto e lógica da Benza AI: resumo, insights, perguntas/respostas, histórico, onboarding, splash e testes
//  Linhas originais: 2318-2796
//  Carregar depois de core-*.js, db-indexeddb.js, sync-*.js, auth-supabase.js
// ====================================================================
// ====================================================================
function buildContextoIA() {
  if (!state.movimentos || !Array.isArray(state.movimentos) || !state.agendamentos || !Array.isArray(state.agendamentos)) {
    return { erro: 'Dados ainda não carregados. Tente novamente em instantes.' };
  }
  const hojeStr = hoje();
  const vendasHoje = state.movimentos.filter(m => m.data === hojeStr && m.tipo === 'venda');
  const despHoje = state.movimentos.filter(m => m.data === hojeStr && m.tipo === 'despesa');
  const agHoje = state.agendamentos.filter(a => a.data === hojeStr);
  const d30 = new Date();
  d30.setDate(d30.getDate() - 29);
  const d30str = d30.toISOString().split('T')[0];
  const vendas30 = state.movimentos.filter(m => m.data >= d30str && m.tipo === 'venda');

  // CORRIGIDO: agrupa por profissional_id
  const byProf = {};
  vendas30.forEach(v => {
    if (v.profissional_id) {
      const nome = getProfissionalNome(v.profissional_id);
      byProf[nome] = (byProf[nome] || 0) + v.valor;
    }
  });

  const byServ = {};
  vendas30.forEach(v => { if (v.itens) v.itens.forEach(i => { byServ[i.nome] = (byServ[i.nome] || 0) + (i.quantidade || 1); }); });
  const totalVendas30 = vendas30.reduce((s, v) => s + v.valor, 0);
  const ticketMedio = vendas30.length > 0 ? Math.round(totalVendas30 / vendas30.length) : 0;
  const totalVendasHoje = vendasHoje.reduce((s, v) => s + v.valor, 0);
  const totalDespHoje = despHoje.reduce((s, d) => s + d.valor, 0);
  const clientesUnicos = new Set(vendasHoje.map(v => v.cliente)).size;

  const hojeD = new Date(hojeStr + 'T00:00:00');
  const iniSemanaAtual = new Date(hojeD); iniSemanaAtual.setDate(hojeD.getDate() - 6);
  const iniSemanaAtualStr = iniSemanaAtual.toISOString().split('T')[0];
  const iniSemanaAnterior = new Date(hojeD); iniSemanaAnterior.setDate(hojeD.getDate() - 13);
  const iniSemanaAnteriorStr = iniSemanaAnterior.toISOString().split('T')[0];
  const fimSemanaAnterior = new Date(hojeD); fimSemanaAnterior.setDate(hojeD.getDate() - 7);
  const fimSemanaAnteriorStr = fimSemanaAnterior.toISOString().split('T')[0];
  const vendasSemanaAtual = state.movimentos.filter(m => m.tipo === 'venda' && m.data >= iniSemanaAtualStr && m.data <= hojeStr);
  const vendasSemanaAnterior = state.movimentos.filter(m => m.tipo === 'venda' && m.data >= iniSemanaAnteriorStr && m.data <= fimSemanaAnteriorStr);
  const totalSemanaAtual = vendasSemanaAtual.reduce((s, v) => s + v.valor, 0);
  const totalSemanaAnterior = vendasSemanaAnterior.reduce((s, v) => s + v.valor, 0);

  const fim7 = new Date(hojeD); fim7.setDate(hojeD.getDate() + 7);
  const fim7Str = fim7.toISOString().split('T')[0];
  const ag7dias = state.agendamentos.filter(a => a.data >= hojeStr && a.data <= fim7Str && a.status !== 'cancelado');

  const ag30 = state.agendamentos.filter(a => a.data >= d30str && a.data <= hojeStr);
  const ag30Cancelados = ag30.filter(a => a.status === 'cancelado').length;
  const taxaCancelamento = ag30.length > 0 ? Math.round((ag30Cancelados / ag30.length) * 100) : 0;

  const servicosOrdenados = Object.entries(byServ).sort((a, b) => a[1] - b[1]);
  const servicoMenosVendido = servicosOrdenados[0];

  const gastoPorCliente = {};
  const ultimaCompraPorCliente = {};
  state.movimentos.filter(m => m.tipo === 'venda' && m.cliente).forEach(v => {
    gastoPorCliente[v.cliente] = (gastoPorCliente[v.cliente] || 0) + v.valor;
    if (!ultimaCompraPorCliente[v.cliente] || v.data > ultimaCompraPorCliente[v.cliente]) ultimaCompraPorCliente[v.cliente] = v.data;
  });
  const clientesOrdenados = Object.entries(gastoPorCliente).sort((a, b) => b[1] - a[1]);
  const totalClientesComCompra = clientesOrdenados.length;
  const top30Clientes = clientesOrdenados.slice(0, 30).map(([nome, total]) => {
    const ultima = ultimaCompraPorCliente[nome];
    const dias = ultima ? Math.floor((hojeD - new Date(ultima + 'T00:00:00')) / (1000 * 60 * 60 * 24)) : null;
    return `- ${nome}: ${total} Kz gastos, última visita há ${dias !== null ? dias + ' dias' : 'desconhecido'}`;
  });

  const planoAtual = getPlanoAtual();
  const diasTrial = planoAtual === 'trial' ? getDiasTrialRestantes() : null;

  return `SALÃO: ${state.config.storeName}
    DATA: ${hojeStr}
    PLANO ATUAL: ${planoAtual}${diasTrial !== null ? ` (restam ${diasTrial} dias de teste gratuito)` : ''}
    CONTACTO DO ADMINISTRADOR (WhatsApp, só oferecer se o cliente reportar um problema com a plataforma): ${WHATSAPP_NUMBER}

    HOJE:
    - Faturamento: ${totalVendasHoje} Kz
    - Vendas: ${vendasHoje.length}
    - Despesas: ${totalDespHoje} Kz
    - Agendamentos: ${agHoje.length} (${agHoje.filter(a => a.status === 'realizado').length} realizados)
    - Clientes atendidos: ${clientesUnicos}

    ÚLTIMOS 30 DIAS:
    - Total faturado: ${totalVendas30} Kz
    - Total vendas: ${vendas30.length}
    - Ticket médio: ${ticketMedio} Kz
    - Taxa de cancelamento de agendamentos: ${taxaCancelamento}%

    ESTA SEMANA vs SEMANA ANTERIOR:
    - Esta semana: ${totalSemanaAtual} Kz
    - Semana anterior: ${totalSemanaAnterior} Kz
    - Variação: ${totalSemanaAnterior > 0 ? Math.round(((totalSemanaAtual - totalSemanaAnterior) / totalSemanaAnterior) * 100) : 0}%

    PRÓXIMOS 7 DIAS:
    - Agendamentos previstos: ${ag7dias.length}

    POR PROFISSIONAL (30 dias):
    ${Object.entries(byProf).map(([k, v]) => `- ${k}: ${v} Kz`).join('\n') || '- Sem dados'}

    SERVIÇOS MAIS VENDIDOS (30 dias):
    ${Object.entries(byServ).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => `- ${k}: ${v}x`).join('\n') || '- Sem dados'}

    SERVIÇO MENOS VENDIDO (30 dias): ${servicoMenosVendido ? `${servicoMenosVendido[0]} (${servicoMenosVendido[1]}x)` : 'Sem dados'}

    CLIENTES:
    - Total cadastrados: ${state.clientes.length}
    - Com agendamento hoje: ${new Set(agHoje.map(a => a.cliente)).size}
    - Top clientes por valor gasto (histórico completo)${totalClientesComCompra > 30 ? `, mostrando 30 de ${totalClientesComCompra}` : ''}:
    ${top30Clientes.join('\n') || '- Sem dados de compras ainda'}

    PROFISSIONAIS ACTIVOS: ${state.profissionais.map(p => p.nome).join(', ') || 'Nenhum'}`;
}

// ====================================================================
//  IA – perguntarIA, nome, histórico
// ====================================================================
let iaHistorico = [];

function renderIAResumo() {
  if (!state.movimentos || !Array.isArray(state.movimentos) || !state.agendamentos || !Array.isArray(state.agendamentos)) return;
  const hojeStr = hoje();
  const hojeD = new Date(hojeStr + 'T00:00:00');
  const vendasHoje = state.movimentos.filter(m => m.data === hojeStr && m.tipo === 'venda');
  const totalHoje = vendasHoje.reduce((s, v) => s + v.valor, 0);
  const agHoje = state.agendamentos.filter(a => a.data === hojeStr);
  const pendentesHoje = agHoje.filter(a => a.status !== 'realizado' && a.status !== 'cancelado').length;
  const clientesHoje = new Set(vendasHoje.map(v => v.cliente)).size;

  const elFat = document.getElementById('ia-resumo-fat');
  if (elFat) elFat.textContent = fmtKz(totalHoje);
  const dias7 = [];
  for (let i = 1; i <= 7; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    dias7.push(state.movimentos.filter(m => m.data === ds && m.tipo === 'venda').reduce((s, v) => s + v.valor, 0));
  }
  const media7 = dias7.reduce((s, v) => s + v, 0) / 7;
  const fatTrendEl = document.getElementById('ia-resumo-fat-trend');
  if (fatTrendEl) {
    if (media7 > 0) {
      const variacaoFat = Math.round(((totalHoje - media7) / media7) * 100);
      fatTrendEl.innerHTML = `<span style="color:${variacaoFat >= 0 ? 'var(--green)' : 'var(--red)'}">${variacaoFat >= 0 ? '↑' : '↓'} ${Math.abs(variacaoFat)}%</span> vs média 7 dias`;
    } else {
      fatTrendEl.textContent = 'comparado com ontem';
    }
  }

  const elCli = document.getElementById('ia-resumo-clientes');
  if (elCli) elCli.textContent = String((state.clientes || []).length);
  const elCliSub = document.getElementById('ia-resumo-clientes-sub');
  if (elCliSub) elCliSub.textContent = clientesHoje + (clientesHoje === 1 ? ' atendido hoje' : ' atendidos hoje');

  const elAg = document.getElementById('ia-resumo-ag');
  if (elAg) elAg.textContent = String(agHoje.length);
  const elAgSub = document.getElementById('ia-resumo-ag-sub');
  if (elAgSub) elAgSub.textContent = pendentesHoje + (pendentesHoje === 1 ? ' pendente' : ' pendentes');

  // ---- Insights automáticos (todos calculados a partir de dados reais já existentes) ----
  const insights = [];

  const ticketHoje = vendasHoje.length > 0 ? totalHoje / vendasHoje.length : 0;
  const ticketsDias7 = [];
  for (let i = 1; i <= 7; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    const vd = state.movimentos.filter(m => m.data === ds && m.tipo === 'venda');
    if (vd.length > 0) ticketsDias7.push(vd.reduce((s, v) => s + v.valor, 0) / vd.length);
  }
  if (ticketHoje > 0 && ticketsDias7.length > 0) {
    const mediaTicket7 = ticketsDias7.reduce((s, v) => s + v, 0) / ticketsDias7.length;
    if (mediaTicket7 > 0) {
      const variacaoTicket = Math.round(((ticketHoje - mediaTicket7) / mediaTicket7) * 100);
      insights.push({ icone: 'trend', cor: variacaoTicket >= 0 ? 'var(--green)' : 'var(--red)',
        texto: `Hoje o seu ticket médio ${variacaoTicket >= 0 ? 'aumentou' : 'diminuiu'} <strong>${Math.abs(variacaoTicket)}%</strong> em relação à média dos últimos 7 dias.` });
    }
  }

  const ultimaCompraPorCliente = {};
  state.movimentos.filter(m => m.tipo === 'venda' && m.cliente).forEach(v => {
    if (!ultimaCompraPorCliente[v.cliente] || v.data > ultimaCompraPorCliente[v.cliente]) ultimaCompraPorCliente[v.cliente] = v.data;
  });
  const inativos = Object.entries(ultimaCompraPorCliente).filter(([nome, data]) => Math.floor((hojeD - new Date(data + 'T00:00:00')) / 86400000) > 30).length;
  if (inativos > 0) {
    insights.push({ icone: 'user', cor: 'var(--text-secondary)',
      texto: inativos === 1 ? `Existe <strong>1 cliente</strong> que não regressa há mais de 30 dias.` : `Existem <strong>${inativos} clientes</strong> que não regressam há mais de 30 dias.` });
  }

  const iniSemana = new Date(hojeD); iniSemana.setDate(hojeD.getDate() - 6);
  const iniSemanaStr = iniSemana.toISOString().split('T')[0];
  const vendasSemana = state.movimentos.filter(m => m.tipo === 'venda' && m.data >= iniSemanaStr && m.data <= hojeStr);
  const receitaPorServico = {};
  let receitaSemanaTotal = 0;
  vendasSemana.forEach(v => {
    receitaSemanaTotal += v.valor;
    if (v.itens && Array.isArray(v.itens)) v.itens.forEach(it => { receitaPorServico[it.nome] = (receitaPorServico[it.nome] || 0) + (it.subtotal || 0); });
  });
  const servicosOrdenadosReceita = Object.entries(receitaPorServico).sort((a, b) => b[1] - a[1]);
  if (servicosOrdenadosReceita.length > 0 && receitaSemanaTotal > 0) {
    const [nomeServico, receitaServico] = servicosOrdenadosReceita[0];
    const pct = Math.round((receitaServico / receitaSemanaTotal) * 100);
    insights.push({ icone: 'star', cor: 'var(--gold-dark)', texto: `O serviço "<strong>${escHtml(nomeServico)}</strong>" representa <strong>${pct}%</strong> da receita desta semana.` });
  }

  const saldos30 = [];
  for (let i = 0; i <= 29; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    const v = state.movimentos.filter(m => m.data === ds && m.tipo === 'venda').reduce((s, x) => s + x.valor, 0);
    const de = state.movimentos.filter(m => m.data === ds && m.tipo === 'despesa').reduce((s, x) => s + x.valor, 0);
    saldos30.push(v - de);
  }
  const saldoHoje30 = saldos30[0];
  const media30 = saldos30.slice(1).reduce((s, v) => s + v, 0) / 29;
  if (saldos30.some(s => s !== 0)) {
    insights.push({ icone: 'wallet', cor: saldoHoje30 >= media30 ? 'var(--green)' : 'var(--red)',
      texto: `O caixa de hoje está <strong>${saldoHoje30 >= media30 ? 'acima' : 'abaixo'}</strong> da média dos últimos 30 dias.` });
  }

  const amanha = new Date(hojeD); amanha.setDate(hojeD.getDate() + 1);
  const amanhaStr = amanha.toISOString().split('T')[0];
  const agAmanha = state.agendamentos.filter(a => a.data === amanhaStr && a.status !== 'cancelado');
  insights.push({ icone: 'calendar', cor: 'var(--text-secondary)',
    texto: agAmanha.length > 0 ? `Amanhã tem <strong>${agAmanha.length} ${agAmanha.length === 1 ? 'agendamento' : 'agendamentos'}</strong> marcados.` : `Ainda não há agendamentos para amanhã.` });

  const iconesSvg = {
    trend: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9"/></svg>',
    wallet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'
  };
  const listaEl = document.getElementById('ia-insights-list');
  if (listaEl) {
    const bgPorCor = { 'var(--green)': 'var(--green-50)', 'var(--red)': 'var(--red-50)', 'var(--gold-dark)': 'var(--gold-50)', 'var(--text-secondary)': 'var(--neutral-75)' };
    listaEl.innerHTML = insights.map(ins => `<div class="ia-insight-row"><span class="ia-insight-icone" style="color:${ins.cor};background:${bgPorCor[ins.cor] || 'var(--neutral-75)'}">${iconesSvg[ins.icone]}</span><span>${ins.texto}</span></div>`).join('')
      || '<div class="ia-insight-row"><span>Ainda sem dados suficientes para gerar insights.</span></div>';
  }
}

async function perguntarIA(pergunta) {
  const plano = getPlanoAtual();
  const iaDia = PLANOS[plano].iaDia;
  if (iaDia === 0) {
    mostrarModalUpgrade('O Agente IA está disponível no plano Pro (5 perguntas/dia) e Premium (ilimitado).');
    return null;
  }

  // ================================================================
  //  CORREÇÃO: chaveData definida antes de ser usada
  // ================================================================
  const chaveData = 'ia_perguntas_' + (state.config.salaoId || 'local') + '_' + hoje();
  const usadas = parseInt(localStorage.getItem(chaveData) || '0');

  if (iaDia !== Infinity && usadas >= iaDia) {
    if (plano === 'pro') {
      mostrarModalUpgrade('Atingiste o limite de 5 perguntas/dia do plano Pro. Faz upgrade para Premium para perguntas ilimitadas.');
    } else {
      toast('Limite de perguntas atingido.', 'warning');
    }
    return null;
  }

  const contexto = buildContextoIA();
  if (contexto && contexto.erro) {
    toast(contexto.erro, 'warning');
    return null;
  }

  try {
    const resp = await fetch(IA_EDGE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        pergunta,
        contexto,
        plano,
        salaoId: state.config.salaoId || 'local',
        historico: iaHistorico
      })
    });

    if (!resp.ok) {
      if (resp.status === 429) {
        mostrarModalUpgrade('Limite de perguntas atingido. Faz upgrade para continuar.');
        return null;
      }
      if (resp.status === 503) {
        return '⚠️ Agente IA temporariamente indisponível. Tenta dentro de momentos.';
      }
      return '⚠️ Erro ao contactar o agente IA. Contacta o suporte BeautyPro.';
    }

    const data = await resp.json();
    localStorage.setItem(chaveData, String(usadas + 1));
    document.getElementById('ia-contador').textContent = String(usadas + 1);

    const resposta = data.resposta || 'Não consegui responder. Tenta de novo.';
    iaHistorico.push({ pergunta, resposta });
    if (iaHistorico.length > 6) iaHistorico = iaHistorico.slice(-6);
    return resposta;
  } catch (e) {
    return 'Sem ligação à internet. O agente IA necessita de conexão para responder.';
  }
}
const IA_NOME_KEY = 'bp_ia_nome';
// CORREÇÃO (relatório Benza AI): nome fixado — deixa de ler o localStorage / permitir renomear.
function getNomeIA() { return 'Benza'; }
document.getElementById('ia-renomear-btn').addEventListener('click', () => {
  const atual = getNomeIA();
  const novo = prompt('Como queres chamar o teu assistente de IA?', atual === 'Agente IA' ? '' : atual);
  if (novo && novo.trim()) {
    localStorage.setItem(IA_NOME_KEY, novo.trim());
  }
});

function formatarTempoRelativoIA(ts) {
  if (!ts) return '';
  const diffSeg = Math.floor((Date.now() - ts) / 1000);
  if (diffSeg < 10) return 'agora mesmo';
  if (diffSeg < 60) return `há ${diffSeg} segundos`;
  const diffMin = Math.floor(diffSeg / 60);
  if (diffMin < 60) return `há ${diffMin} ${diffMin === 1 ? 'minuto' : 'minutos'}`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `há ${diffH} ${diffH === 1 ? 'hora' : 'horas'}`;
  return `há ${Math.floor(diffH / 24)} dias`;
}
function montarMsgUsuarioIA(pergunta) { return `<div class="ia-msg-user">${escHtml(pergunta)}</div>`; }
function montarMsgBotIA(resposta, ts) {
  const tempo = formatarTempoRelativoIA(ts);
  return `<div class="ia-msg-bot">
    <div class="ia-msg-bot-header"><span class="ia-msg-bot-nome">Benza</span>${tempo ? `<span class="ia-msg-bot-tempo">${tempo}</span>` : ''}</div>
    <div class="ia-msg-bot-corpo">${escHtml(resposta)}</div>
    <div class="ia-msg-bot-acoes">
      <button class="ia-feedback-btn" data-fb="util" title="Útil">👍 Útil</button>
      <button class="ia-feedback-btn" data-fb="naoajudou" title="Não ajudou">👎 Não ajudou</button>
      <button class="ia-feedback-btn ia-copiar-btn" title="Copiar">📋 Copiar</button>
    </div>
    <div class="ia-followup-row">
      <button class="ia-followup-chip" data-pergunta="Quais clientes estão inativos?">Clientes inativos</button>
      <button class="ia-followup-chip" data-pergunta="Como está o fluxo de caixa?">Fluxo de caixa</button>
      <button class="ia-followup-chip" data-pergunta="Como está a minha agenda?">Agenda</button>
    </div>
  </div>`;
}
function atualizarEstadoVazioIA() {
  const vazio = document.getElementById('ia-chat-empty');
  const chat = document.getElementById('ia-chat');
  if (vazio && chat) vazio.style.display = chat.children.length > 0 ? 'none' : '';
}
const IA_HIST_KEY = () => 'bp_ia_chat_' + (state.config.salaoId || 'local');
function carregarHistoricoIA() {
  try {
    const guardado = JSON.parse(localStorage.getItem(IA_HIST_KEY()) || '[]');
    iaHistorico = guardado.slice(-6);
    const chat = document.getElementById('ia-chat');
    if (guardado.length > 0 && chat) {
      chat.innerHTML = guardado.map(t => montarMsgUsuarioIA(t.pergunta) + montarMsgBotIA(t.resposta, t.ts)).join('');
      chat.scrollTop = chat.scrollHeight;
    }
    atualizarEstadoVazioIA();
  } catch (e) { iaHistorico = []; }
}
function guardarHistoricoIA() {
  try { localStorage.setItem(IA_HIST_KEY(), JSON.stringify(iaHistorico)); } catch (e) {}
}
carregarHistoricoIA();

document.getElementById('ia-enviar').addEventListener('click', async () => {
  const input = document.getElementById('ia-input');
  const pergunta = input.value.trim();
  if (!pergunta) return;
  const chat = document.getElementById('ia-chat');
  chat.innerHTML += montarMsgUsuarioIA(pergunta);
  atualizarEstadoVazioIA();
  const pensando = document.createElement('div');
  pensando.className = 'ia-msg-bot';
  pensando.id = 'ia-pensando';
  pensando.innerHTML = `<div class="ia-msg-bot-header"><span class="ia-msg-bot-nome">Benza</span></div><span class="ia-dots">Benza está a analisar<span>.</span><span>.</span><span>.</span></span>`;
  chat.appendChild(pensando);
  chat.scrollTop = chat.scrollHeight;
  input.value = '';
  const resposta = await perguntarIA(pergunta);
  document.getElementById('ia-pensando')?.remove();
  if (resposta) {
    const ts = Date.now();
    chat.innerHTML += montarMsgBotIA(resposta, ts);
    chat.scrollTop = chat.scrollHeight;
    if (iaHistorico.length > 0) iaHistorico[iaHistorico.length - 1].ts = ts;
    guardarHistoricoIA();
  }
  document.getElementById('ia-contador').textContent = parseInt(localStorage.getItem('ia_perguntas_' + hoje()) || '0');
});

document.getElementById('ia-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('ia-enviar').click();
});

// Sugestões rápidas e chips de continuação (delegação de eventos — cobre também os que são criados depois de cada resposta)
document.addEventListener('click', (e) => {
  const card = e.target.closest('.ia-sugestao-card, .ia-followup-chip');
  if (card && card.dataset.pergunta) {
    const input = document.getElementById('ia-input');
    if (input) { input.value = card.dataset.pergunta; document.getElementById('ia-enviar').click(); }
  }
  const fb = e.target.closest('.ia-feedback-btn');
  if (fb) {
    if (fb.classList.contains('ia-copiar-btn')) {
      const texto = fb.closest('.ia-msg-bot')?.querySelector('.ia-msg-bot-corpo')?.textContent || '';
      navigator.clipboard?.writeText(texto).then(() => toast('Texto copiado', 'success')).catch(() => {});
    } else {
      toast('Feedback registado', 'success');
      fb.parentElement.querySelectorAll('.ia-feedback-btn').forEach(b => b.disabled = true);
      fb.style.opacity = '1';
      fb.style.fontWeight = '700';
    }
  }
});

document.getElementById('ia-offline-retry')?.addEventListener('click', () => {
  if (navigator.onLine) { atualizarIAOffline();
    toast('Conexão restabelecida!', 'success'); } else { toast('Ainda sem ligação', 'warning'); }
});

// Upgrade modal
document.getElementById('modal-upgrade-contato').addEventListener('click', () => {
  const msg =
    `Olá, quero assinar um plano do BeautyPro. Salão: ${state.config.storeName} | Plano actual: ${getPlanoAtual()}`;
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
  closeModal('modal-upgrade');
});

// Pesquisa clientes
let searchTimer;
document.getElementById('search-cliente').addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => renderClientes(), 300);
});

// Onboarding
let onboardingIndex = 0;
const onboardingSlides = document.querySelectorAll('.onboarding-slide');
const onboardingDots = document.querySelectorAll('.onboarding-dot');
const nextBtn = document.getElementById('onboarding-next');
const skipBtn = document.getElementById('onboarding-skip');

function showOnboardingSlide(index) {
  onboardingSlides.forEach((s, i) => {
    s.classList.toggle('active', i === index);
    s.style.display = i === index ? 'flex' : 'none';
  });
  onboardingDots.forEach((d, i) => {
    if (i === index) { d.style.width = '24px';
      d.style.background = 'var(--gold)'; } else { d.style.width = '6px';
      d.style.background = 'var(--border-soft)'; }
  });
  if (index === 2) { nextBtn.textContent = 'Começar agora';
    nextBtn.className = 'btn btn-primary'; } else { nextBtn.textContent = 'Próximo'; }
}

function closeOnboarding() {
  document.getElementById('onboarding-screen').style.display = 'none';
  localStorage.setItem('bp_onboarding_seen', 'true');
}

if (nextBtn) {
  nextBtn.addEventListener('click', () => {
    if (onboardingIndex === 2) closeOnboarding();
    else { onboardingIndex++;
      showOnboardingSlide(onboardingIndex); }
  });
}
if (skipBtn) skipBtn.addEventListener('click', closeOnboarding);

function hideSplash() {
  const splash = document.getElementById('splash-screen');
  if (!splash) return;
  splash.style.opacity = '0';
  setTimeout(() => { splash.style.display = 'none'; }, 600);
}

// Testes automatizados
function runTests() {
  console.log('🧪 Iniciando testes automatizados...');
  console.group('📦 Funções puras');
  console.assert(fmtKz(0) === '0 Kz', 'fmtKz(0)');
  console.assert(fmtKz(1000) === '1.000 Kz', 'fmtKz(1000)');
  console.assert(fmtKz(1234567) === '1.234.567 Kz', 'fmtKz(1234567)');
  console.assert(escHtml('<script>') === '&lt;script&gt;', 'escHtml');
  console.assert(escHtml('a & b') === 'a &amp; b', 'escHtml &');
  const id = uuid();
  console.assert(id.length > 10 && id.includes('-'), 'uuid');
  console.assert(/^\d{4}-\d{2}-\d{2}$/.test(hoje()), 'hoje');
  console.assert(/^\d{2}:\d{2}$/.test(horaAgora()), 'horaAgora');
  console.groupEnd();
  console.group('🧠 Lógica de negócio (mocks)');
  console.log('✅ Testes concluídos (mock)');
  console.groupEnd();
  console.log('✅ Todos os testes concluídos!');
}

if (localStorage.getItem('bp_run_tests') === 'true') {
  // runTests sob demanda: window.runBeautyProTests()
  localStorage.removeItem('bp_run_tests');
}
window.runBeautyProTests = runTests;



/* ===== FILE: main.js ===== */

// ====================================================================
//  INICIALIZAÇÃO (extraído do app.js na Fase A da modularização)
//  Carregado por último — depende de tudo o resto já estar definido.
//
//  DEPENDÊNCIAS EXTERNAS (globais, sem import/export; ver
//  BelezaPro_PLANO_TECNICO para o porquê):
//    - state                     → core-state.js
//    - openDB()                  → db-indexeddb.js
//    - checkSession()            → auth-supabase.js
//    - hideSplash()              → ia-module.js
//    - atualizarIAOffline()      → detalhes-acessibilidade.js
//    - aplicarAcessibilidade()   → detalhes-acessibilidade.js
//    - toast()                   → core-utils.js
//
//  CORREÇÃO (Fase C — divisão do app.js em 12 módulos): esta lista
//  referia todas as 6 dependências a "app.js"; 3 delas (state, openDB,
//  checkSession) nunca estiveram lá — já estava desatualizada antes
//  da divisão. As outras 3 estavam certas e ficaram obsoletas agora.
//  Se qualquer uma destas for movida ou renomeada no futuro, atualizar
//  esta lista.
// ====================================================================
document.addEventListener('DOMContentLoaded', async function init() {
  // Garantir estado inicial da UI
  document.getElementById('login-view').style.display = 'flex';
  document.getElementById('app-view').style.display = 'none';

  // Ponto 1 — indicador Online/Offline atualizado já aqui, ANTES de
  // qualquer chamada de rede (openDB/checkSession). atualizarIndicadorSync()
  // só depende de navigator.onLine (instantâneo) e da fila local em
  // localStorage (instantâneo) — não precisa de sessão nem de perfil.
  // O HTML tem "Offline" fixo por defeito (index.html), por isso sem esta
  // chamada antecipada o texto ficava errado durante todo o checkSession().
  if (typeof atualizarIndicadorSync === 'function') atualizarIndicadorSync();
  if (typeof initStoreBindings === 'function') initStoreBindings();

  // ============================================================
  // CORREÇÃO: Limpar fila de sincronização antiga para evitar
  // reenvio de operações que possam recriar duplicados
  // ============================================================
  const SYNC_QUEUE_KEY = 'bp_sync_queue';
  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY);
    if (raw) {
      const queue = JSON.parse(raw);
      // Remove operações para profissionais e serviços (já limpos no Supabase)
      const filtered = queue.filter(op => op.tabela !== 'profissionais' && op.tabela !== 'servicos');
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(filtered));
    }
  } catch (_) {
    // Ignora erros de parsing
  }

  // Abrir IndexedDB local (offline-first)
  // Item 2.4: qualquer falha aqui é comunicada de forma clara — nunca
  // silenciosa — e nunca deixa o utilizador perante um ecrã sem saída.
  let dbDisponivel = true;
  try {
    await openDB();
  } catch (e) {
    dbDisponivel = false;
    console.error('Erro ao abrir a base de dados local:', e);
    toast('Não foi possível carregar os dados do dispositivo. Tente recarregar a aplicação.', 'error');
  }

  // Restaurar filtros/chart antes de qualquer renderização
  const filtro = localStorage.getItem('bp_filtro_clientes') || 'todos';
  state.filtroClientes = filtro;
  document.querySelectorAll('.filtro-frequencia').forEach(b => {
    b.classList.remove('active');
    if (b.dataset.filtro === filtro) b.classList.add('active');
  });

  const periodo = localStorage.getItem('bp_chart_periodo') || 'semana';
  document.querySelectorAll('.chart-filter').forEach(b => {
    b.classList.remove('btn-primary');
    b.classList.add('btn-secondary');
    if (b.dataset.periodo === periodo) { b.classList.remove('btn-secondary');
      b.classList.add('btn-primary'); }
  });

  // Verificar sessão Supabase — se existir, entra directamente
  // (se a base de dados local não abriu, ainda tentamos: sem sessão,
  // o utilizador fica no ecrã de login, que não depende do IndexedDB)
  await checkSession();
  if (!dbDisponivel) {
    // Reforça a mensagem já dada acima, para o caso de o toast anterior
    // ter sido perdido durante a transição de ecrãs.
    setTimeout(() => toast('Dados locais indisponíveis neste dispositivo. Algumas funcionalidades offline podem não funcionar até recarregar.', 'error'), 1400);
  }

  // Splash (removida após verificação de sessão)
  setTimeout(function () {
    if (typeof hideSplash === 'function') hideSplash();
    if (typeof bpHideSplashNow === 'function') bpHideSplashNow();
  }, 400);

  // Timeout de emergência: se splash persistir além de 3s, força remoção
  setTimeout(function() {
    var splash = document.getElementById('splash-screen');
    if (splash && splash.style.display !== 'none') {
      splash.style.opacity = '0';
      setTimeout(function () { splash.style.display = 'none'; }, 200);
      console.log('Splash removida por timeout de emergência');
    }
  }, 5000);

  // IA offline
  setTimeout(atualizarIAOffline, 500);

  // Acessibilidade
  setTimeout(aplicarAcessibilidade, 600);

  console.log('BeautyPro inicializado com sucesso!');

  // Sync periódico adaptativo (P2): 45s em idle; 15s se houver fila pendente
  setInterval(() => {
    if (!(navigator.onLine && document.visibilityState === 'visible' && state?.config?.salaoId)) return;
    const fila = (typeof getSyncQueue === 'function') ? getSyncQueue() : [];
    const pendentes = fila.filter(op => op.failed !== true).length;
    // Skip pull pesado se nada pendente e último pull < 40s (throttle)
    const now = Date.now();
    if (pendentes === 0 && window._lastSupabasePull && (now - window._lastSupabasePull) < 40000) {
      return;
    }
    carregarDoSupabase().then(atualizado => {
      window._lastSupabasePull = Date.now();
      if (atualizado) {
        updateUI();
        if (typeof renderBadges === 'function') renderBadges();
      }
    }).catch(() => {});
  }, 15000);

  // Ponto 3 — Forçar pull quando a app volta ao foco (visível)
  // Isto garante que ao trocar de app e voltar, os dados são atualizados
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible' && navigator.onLine && state?.config?.salaoId) {
      console.log('[Sync] App visível, a sincronizar...');
      try {
        const atualizado = await carregarDoSupabase();
        if (atualizado) {
          updateUI();
          renderBadges(); // ← ADICIONADO: atualiza badge após sincronização ao voltar ao foco
          console.log('[Sync] Dados atualizados após retorno ao foco.');
        }
      } catch (e) {
        console.warn('[Sync] Falha ao sincronizar ao voltar ao foco:', e);
      }
    }
  });

  // Passo 4 (revisão) — FAB encolhe/esmaece durante scroll ativo, para
  // nunca bloquear de forma permanente um botão de ação (Ajustar/Excluir)
  // de uma linha que passe por baixo dele. Volta ao normal 250ms depois
  // do scroll parar. addEventListener com { passive: true } — só lê a
  // posição de scroll, nunca a bloqueia, sem custo de performance.
  const mainContent = document.querySelector('.main-content');
  const fabEl = document.getElementById('fab-agendar');
  if (mainContent && fabEl) {
    let fabScrollTimeout = null;
    mainContent.addEventListener('scroll', () => {
      fabEl.classList.add('fab-scrolling');
      clearTimeout(fabScrollTimeout);
      fabScrollTimeout = setTimeout(() => {
        fabEl.classList.remove('fab-scrolling');
      }, 250);
    }, { passive: true });
  }

  // ============================================================
  //  CORREÇÃO: HEADER FIXO – ajuste automático do padding-top
  //  para que o conteúdo nunca fique por baixo do header
  //  (com fallback para garantir que funciona mesmo se o header
  //  ainda não estiver completamente renderizado)
  // ============================================================
  function ajustarPaddingHeader() {
    const header = document.querySelector('.app-header');
    const main = document.querySelector('.main-content');
    if (header && main) {
      const altura = header.offsetHeight;
      if (altura > 0) {
        main.style.paddingTop = altura + 'px';
      } else {
        // Fallback: tentar novamente após 100ms se a altura for 0
        setTimeout(ajustarPaddingHeader, 100);
      }
    }
  }

  // Aplicar com um pequeno atraso para garantir que o DOM está completamente montado
  setTimeout(ajustarPaddingHeader, 50);

  // Reaplicar sempre que a janela for redimensionada
  window.addEventListener('resize', ajustarPaddingHeader);

  // Reaplicar também quando o conteúdo for carregado (ex: após login)
  // Usamos MutationObserver para detetar mudanças no header (ex: nome do salão)
  const headerObserver = new MutationObserver(() => {
    ajustarPaddingHeader();
  });
  const headerEl = document.querySelector('.app-header');
  if (headerEl) {
    headerObserver.observe(headerEl, { childList: true, subtree: true, characterData: true });
  }
});

// PWA: registar o service worker (cache do app shell para offline real)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch((e) => {
      console.warn('[PWA] Falha ao registar service worker:', e);
    });
  });
}

