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

/** R13 — lista central de métodos de pagamento (venda / finalizar / split). */
var BP_METODOS_PAGAMENTO = [
  { value: 'Numerário', label: 'Numerário' },
  { value: 'Multicaixa Express', label: 'Multicaixa Express' },
  { value: 'Transferência', label: 'Transferência' },
  { value: 'Cartão', label: 'Cartão' },
  { value: '__split__', label: 'Split' }
];
if (typeof window !== 'undefined') window.BP_METODOS_PAGAMENTO = BP_METODOS_PAGAMENTO;

/* ===== FILE: core-utils.js ===== */
// ====================================================================
//  CORE — UTILITÁRIOS (extraído do app.js na Fase A da modularização)
// ====================================================================
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)));
let reciboCounter = parseInt(localStorage.getItem('bp_recibo_counter') || '0', 10);

function bpReciboStorageKey() {
  const salaoKey = (typeof state !== 'undefined' && state.config && state.config.salaoId)
    ? String(state.config.salaoId).slice(0, 8)
    : 'local';
  return { salaoKey: salaoKey, storageKey: 'bp_recibo_counter_' + salaoKey };
}

/** Extrai sequência numérica do final de um recibo (ex. ABCD-0012 → 12). */
function bpParseReciboSeq(val) {
  const m = String(val || '').match(/(\d+)\s*$/);
  return m ? parseInt(m[1], 10) : 0;
}

function bpGetLocalReciboSeq() {
  const keys = bpReciboStorageKey();
  let n = parseInt(localStorage.getItem(keys.storageKey) || localStorage.getItem('bp_recibo_counter') || '0', 10);
  if (isNaN(n) || n < 0) n = 0;
  return n;
}

function bpSetLocalReciboSeq(n) {
  const keys = bpReciboStorageKey();
  const v = Math.max(0, parseInt(n, 10) || 0);
  try { localStorage.setItem(keys.storageKey, String(v)); } catch (_) {}
  try { localStorage.setItem('bp_recibo_counter', String(v)); } catch (_) {}
  reciboCounter = v;
  try {
    if (typeof state !== 'undefined' && state.config) state.config.reciboCounter = v;
  } catch (_) {}
  return v;
}

/**
 * ET4.5: reconcilia contador com movimentos locais + remoto (max).
 * Garante que multi-dispositivo sobe o piso do contador.
 */
function bpReconcileReciboCounterFromMovimentos() {
  let maxSeq = bpGetLocalReciboSeq();
  try {
    const list = (typeof state !== 'undefined' && state.movimentos) ? state.movimentos : [];
    for (let i = 0; i < list.length; i++) {
      const m = list[i];
      if (!m) continue;
      if (m.tipo && m.tipo !== 'venda') continue;
      const s = bpParseReciboSeq(m.reciboNum);
      if (s > maxSeq) maxSeq = s;
    }
  } catch (_) {}
  if (maxSeq > bpGetLocalReciboSeq()) bpSetLocalReciboSeq(maxSeq);
  return maxSeq;
}

/**
 * Tenta persistir o contador em salao_config.recibo_counter (se a coluna existir).
 * Se o schema ainda não tiver a coluna, falha em silêncio — o contador continua
 * nos movimentos (reciboNum) e no localStorage até a migração SQL.
 */
async function bpPushReciboCounterToSupabase(n) {
  try {
    if (!navigator.onLine) return false;
    if (typeof state === 'undefined' || !state.config || !state.config.salaoId) return false;
    if (typeof supabaseClient === 'undefined' || !supabaseClient) return false;
    const { data: { session } } = await supabaseClient.auth.getSession();
    const accessToken = session && session.access_token;
    if (!accessToken || typeof SUPABASE_URL === 'undefined') return false;
    const headers = {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + accessToken,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=minimal'
    };
    const body = {
      salao_id: state.config.salaoId,
      recibo_counter: n,
      updated_at: new Date().toISOString()
    };
    // PATCH se linha existir; fallback POST merge
    let resp = await fetch(
      SUPABASE_URL + '/rest/v1/salao_config?salao_id=eq.' + encodeURIComponent(state.config.salaoId),
      { method: 'PATCH', headers: headers, body: JSON.stringify({ recibo_counter: n, updated_at: body.updated_at }) }
    );
    if (resp.status === 404 || resp.status === 400 || resp.status === 409) {
      resp = await fetch(SUPABASE_URL + '/rest/v1/salao_config', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
      });
    }
    return resp.ok;
  } catch (e) {
    if (typeof logErroSilencioso === 'function') logErroSilencioso('bpPushReciboCounter', e);
    return false;
  }
}

async function bpPullReciboCounterFromSupabase() {
  try {
    if (!navigator.onLine) return null;
    if (typeof state === 'undefined' || !state.config || !state.config.salaoId) return null;
    if (typeof supabaseClient === 'undefined' || !supabaseClient) return null;
    const { data: { session } } = await supabaseClient.auth.getSession();
    const accessToken = session && session.access_token;
    if (!accessToken || typeof SUPABASE_URL === 'undefined') return null;
    const resp = await fetch(
      SUPABASE_URL + '/rest/v1/salao_config?salao_id=eq.' + encodeURIComponent(state.config.salaoId) + '&select=recibo_counter',
      { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + accessToken } }
    );
    if (!resp.ok) return null;
    const rows = await resp.json();
    if (!rows || !rows.length) return null;
    const remote = parseInt(rows[0].recibo_counter, 10);
    return isNaN(remote) ? null : remote;
  } catch (e) {
    return null;
  }
}

/** Sobe o contador local para max(local, movimentos, remoto) e empurra se necessário. */
async function bpSyncReciboCounter() {
  let local = bpReconcileReciboCounterFromMovimentos();
  const remote = await bpPullReciboCounterFromSupabase();
  if (remote != null && remote > local) {
    local = bpSetLocalReciboSeq(remote);
  }
  // Empurrar se local >= remoto (inclui empate após venda)
  if (navigator.onLine) {
    try { await bpPushReciboCounterToSupabase(local); } catch (_) {}
  }
  return local;
}

function nextReciboNum() {
  // ET4.5: sequência por salão; reconcilia com movimentos; tenta sync Supabase
  bpReconcileReciboCounterFromMovimentos();
  const keys = bpReciboStorageKey();
  let n = bpGetLocalReciboSeq() + 1;
  bpSetLocalReciboSeq(n);
  // Fire-and-forget push (não bloqueia a venda)
  try {
    if (typeof bpPushReciboCounterToSupabase === 'function') {
      Promise.resolve(bpPushReciboCounterToSupabase(n)).catch(function () {});
    }
  } catch (_) {}
  const prefix = keys.salaoKey !== 'local' ? keys.salaoKey.slice(-4).toUpperCase() + '-' : '';
  return prefix + String(n).padStart(4, '0');
}

if (typeof window !== 'undefined') {
  window.nextReciboNum = nextReciboNum;
  window.bpSyncReciboCounter = bpSyncReciboCounter;
  window.bpReconcileReciboCounterFromMovimentos = bpReconcileReciboCounterFromMovimentos;
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

/**
 * ET4.8 — toast profissional (duração por tipo; z-index abaixo do modal).
 * type: success | error | warning | info | (default)
 * opts.duration ms opcional
 */
function toast(msg, type, opts) {
  const el = document.getElementById('toast');
  if (!el) return;
  clearTimeout(toastTimer);
  el.classList.remove('show');
  const text = String(msg == null ? '' : msg);
  el.textContent = text;
  const t = type || '';
  el.className = 'toast' + (t ? ' ' + t : '');
  el.setAttribute('role', t === 'error' ? 'alert' : 'status');
  el.setAttribute('aria-live', t === 'error' ? 'assertive' : 'polite');
  void el.offsetWidth;
  el.classList.add('show');
  var dur = 2500;
  if (opts && opts.duration != null) dur = Number(opts.duration) || 2500;
  else if (t === 'error') dur = 5000;
  else if (t === 'warning') dur = 3500;
  else if (t === 'info') dur = 2500;
  else if (t === 'success') dur = 2500;
  else dur = 2500;
  toastTimer = setTimeout(function () { el.classList.remove('show'); }, dur);
}


/**
 * Feedback de validação: modal orientador → «Entendi» → foco no campo.
 * Não bloqueia em silêncio; o utilizador lê a orientação e só depois é levado ao campo.
 */
function bpFocarCampoForm(fieldId) {
  if (!fieldId) return;
  try {
    var el = document.getElementById(fieldId);
    if (!el) return;
    el.setAttribute('aria-invalid', 'true');
    el.classList.add('bp-field-invalid');
    if (typeof el.focus === 'function') el.focus();
    if (typeof el.scrollIntoView === 'function') {
      try { el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (_) {}
    }
    clearTimeout(el._bpInvalidTimer);
    el._bpInvalidTimer = setTimeout(function () {
      try {
        el.removeAttribute('aria-invalid');
        el.classList.remove('bp-field-invalid');
      } catch (_) {}
    }, 6000);
  } catch (_) {}
}

function bpNotifyFormError(message, fieldId, type) {
  var msg = String(message || 'Verifique os campos obrigatórios e tente novamente.');
  var title = 'Quase lá';
  var goField = function () {
    setTimeout(function () { bpFocarCampoForm(fieldId); }, 80);
  };
  // Modal centrado com CTA «Entendi»; ao fechar, foca o campo
  if (typeof mostrarErro === 'function' && document.getElementById('modal-erro')) {
    mostrarErro(msg, null, title, goField, { okLabel: 'Entendi' });
    return;
  }
  if (typeof showConfirmModal === 'function') {
    showConfirmModal(title, msg, false, {
      confirmLabel: 'Entendi',
      cancelLabel: 'Voltar',
      variant: 'default'
    }).then(function () { goField(); }).catch(function () { goField(); });
    return;
  }
  if (typeof toast === 'function') toast(msg, type || 'warning', { duration: 4000 });
  goField();
}
if (typeof window !== 'undefined') {
  window.bpNotifyFormError = bpNotifyFormError;
  window.bpFocarCampoForm = bpFocarCampoForm;
}

function animateKpi(id, txt) {
  if (typeof window !== 'undefined' && window.__bpQuietUI) {
    var elQ = document.getElementById(id);
    if (elQ) elQ.textContent = txt;
    return;
  }

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
  if (!el) return;
  el.classList.remove('open', 'is-open');
  el.style.display = '';
  el.style.pointerEvents = '';
  try { el.hidden = true; } catch (_) {}
  try { el.setAttribute('hidden', ''); } catch (_) {}
  try { el.setAttribute('aria-hidden', 'true'); } catch (_) {}
  document.body.classList.remove('bp-modal-open');
}

function openModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  try { el.hidden = false; } catch (_) {}
  try { el.removeAttribute('hidden'); } catch (_) {}
  try { el.setAttribute('aria-hidden', 'false'); } catch (_) {}
  el.classList.add('open');
  el.style.display = 'flex';
  document.body.classList.add('bp-modal-open');
}

// Fechar ao tocar no backdrop (só o próprio overlay, não o sheet)
document.addEventListener('click', function (e) {
  const t = e.target;
  if (!t || !t.classList || !t.classList.contains('modal-overlay')) return;
  if (!t.classList.contains('open')) return;
  if (t.id === 'modal-confirm' || t.id === 'modal-erro' || t.id === 'modal-offline-info') return;
  closeModal(t.id);
}, true);
document.addEventListener('keydown', function (e) {
  if (e.key !== 'Escape') return;
  // Empilhamento: fechar primeiro o modal de topo (erro / confirm / offline)
  var erroEl = document.getElementById('modal-erro');
  if (erroEl && erroEl.classList.contains('open')) {
    // mostrarErro regista _bpFinish no overlay
    if (typeof erroEl._bpFinish === 'function') {
      try { erroEl._bpFinish(false); } catch (_) { closeModal('modal-erro'); }
    } else {
      closeModal('modal-erro');
    }
    e.preventDefault();
    return;
  }
  var confirmEl = document.getElementById('modal-confirm');
  if (confirmEl && confirmEl.classList.contains('open')) return; // showConfirmModal trata Escape
  var offEl = document.getElementById('modal-offline-info');
  if (offEl && offEl.classList.contains('open')) return;
  const open = document.querySelector('.modal-overlay.open');
  if (!open) return;
  closeModal(open.id);
});

function setButtonLoading(button, isLoading) {
  if (!button) return;
  if (isLoading) {
    button.classList.add('is-loading');
    button.disabled = true;
    try { button.setAttribute('aria-busy', 'true'); } catch (_) {}
  } else {
    button.classList.remove('is-loading');
    button.disabled = false;
    try { button.removeAttribute('aria-busy'); } catch (_) {}
  }
}

// ====================================================================
//  MODAL DE CONFIRMAÇÃO CENTRADO (Fase 1)
// ====================================================================
/**
 * ET4.8 — confirmação.
 * danger=true → destrutivo (CTA = opts.confirmLabel || "Eliminar")
 * danger=false → simples (CTA = opts.confirmLabel || "Continuar")
 * opts: { confirmLabel, cancelLabel, variant }
 */
function showConfirmModal(title, message, danger = true, opts) {
  return new Promise((resolve) => {
    const overlay = document.getElementById('modal-confirm');
    const titleEl = document.getElementById('confirm-title');
    const msgEl = document.getElementById('confirm-message');
    const okBtn = document.getElementById('confirm-ok-btn');
    const cancelBtn = document.getElementById('confirm-cancel-btn');
    if (!overlay || !titleEl || !msgEl || !okBtn || !cancelBtn) { resolve(confirm(message || title)); return; }
    opts = opts || {};
    const variant = opts.variant || (danger ? 'destructive' : 'default');
    titleEl.textContent = title || 'Tem a certeza?';
    try { msgEl.classList.remove('confirm-message--summary'); } catch (_) {}
    try { msgEl.style.whiteSpace = ''; } catch (_) {}
    if (opts.summaryLayout && message) {
      var _esc = function (s) {
        return String(s == null ? '' : s)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');
      };
      var lines = String(message).split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
      var rows = [];
      var notes = [];
      lines.forEach(function (line) {
        var idx = line.indexOf(':');
        if (idx > 0 && idx < 24) {
          var lab = line.slice(0, idx).trim();
          var val = line.slice(idx + 1).trim();
          rows.push(
            '<div class="bp-confirm-summary-row">' +
            '<span class="bp-confirm-summary-label">' + _esc(lab) + '</span>' +
            '<span class="bp-confirm-summary-value">' + _esc(val) + '</span></div>'
          );
        } else {
          notes.push(_esc(line));
        }
      });
      try { msgEl.classList.add('confirm-message--summary'); msgEl.style.whiteSpace = 'normal'; } catch (_) {}
      msgEl.innerHTML =
        (rows.length ? '<div class="bp-confirm-summary">' + rows.join('') + '</div>' : '') +
        (notes.length ? '<p class="bp-confirm-summary-note">' + notes.join(' ') + '</p>' : '');
    } else {
      msgEl.textContent = message || 'Esta acção não pode ser desfeita.';
    }
    cancelBtn.textContent = opts.cancelLabel || 'Cancelar';
    cancelBtn.className = 'btn btn-secondary btn-modal-compact';
    if (variant === 'destructive' || danger) {
      okBtn.className = 'btn btn-danger btn-modal-compact';
      okBtn.textContent = opts.confirmLabel || 'Eliminar';
    } else if (variant === 'quiet') {
      // Quiet = tipografia limpa; CTA pode ser vermelho (ex. Sair) via confirmTone
      var quietTone = opts.confirmTone || 'neutral';
      if (quietTone === 'danger') {
        okBtn.className = 'btn btn-danger btn-modal-compact';
      } else {
        okBtn.className = 'btn btn-modal-compact btn-modal-quiet';
      }
      okBtn.textContent = opts.confirmLabel || 'Continuar';
    } else {
      okBtn.className = 'btn btn-primary btn-modal-compact';
      okBtn.textContent = opts.confirmLabel || 'Continuar';
    }
    try {
      overlay.classList.toggle('modal-confirm--quiet', variant === 'quiet');
      overlay.classList.toggle('modal-confirm--destructive', variant === 'destructive' || !!danger);
    } catch (_) {}
    try {
      const lab = overlay.querySelector('label');
      if (lab && lab.querySelector('#keep-logged')) lab.style.display = 'none';
    } catch (_) {}
    var settled = false;
    var finish = function (val) {
      if (settled) return;
      settled = true;
      try { document.removeEventListener('keydown', onEsc, true); } catch (_) {}
      closeModal('modal-confirm');
      resolve(val);
    };
    var onEsc = function (e) {
      if (e.key !== 'Escape') return;
      if (!overlay.classList.contains('open')) return;
      e.preventDefault();
      e.stopPropagation();
      finish(false);
    };
    const newOk2 = function () { finish(true); };
    const newCancel2 = function () { finish(false); };
    okBtn.onclick = newOk2;
    cancelBtn.onclick = newCancel2;
    overlay.onclick = function (e) {
      if (e.target === overlay) finish(false);
    };
    document.addEventListener('keydown', onEsc, true);
    openModal('modal-confirm');
    setTimeout(function () {
      try {
        if (okBtn && typeof okBtn.focus === 'function') okBtn.focus();
      } catch (_) {}
    }, 150);
  });
}

// ====================================================================
//  MODAL DE ERRO (Fase 7)
// ====================================================================
function mostrarErro(mensagem, acaoTentar = null, titulo, onClose, opts) {
  const modal = document.getElementById('modal-erro');
  const msgEl = document.getElementById('erro-message');
  const titleEl = document.getElementById('erro-title');
  const tentarBtn = document.getElementById('erro-tentar-btn');
  const cancelarBtn = document.getElementById('erro-cancelar-btn');
  if (!modal) {
    if (typeof onClose === 'function') {
      try { onClose(); } catch (_) {}
    }
    return;
  }
  opts = opts || {};
  if (titleEl) titleEl.textContent = titulo || 'Não foi possível concluir';
  if (msgEl) msgEl.textContent = mensagem || 'Algo impediu esta operação. Podes tentar de novo; se o problema continuar, verifica a ligação ou tenta mais tarde.';
  var okText = opts.okLabel || 'Fechar';
  if (cancelarBtn) {
    cancelarBtn.textContent = okText;
    // Validação: um único CTA visível e legível
    try {
      cancelarBtn.className = 'btn btn-primary btn-modal-compact';
    } catch (_) {}
  }
  if (tentarBtn) {
    tentarBtn.textContent = 'Tentar novamente';
    tentarBtn.style.display = typeof acaoTentar === 'function' ? '' : 'none';
  }
  var settled = false;
  var finish = function (runTry) {
    if (settled) return;
    settled = true;
    try { modal._bpFinish = null; } catch (_) {}
    closeModal('modal-erro');
    if (runTry && typeof acaoTentar === 'function') {
      try { acaoTentar(); } catch (_) {}
    } else if (typeof onClose === 'function') {
      try { onClose(); } catch (_) {}
    }
  };
  try { modal._bpFinish = finish; } catch (_) {}
  if (tentarBtn) tentarBtn.onclick = function () { finish(true); };
  if (cancelarBtn) cancelarBtn.onclick = function () { finish(false); };
  modal.onclick = function (e) { if (e.target === modal) finish(false); };
  openModal('modal-erro');
  setTimeout(function () {
    try {
      if (cancelarBtn && typeof cancelarBtn.focus === 'function') cancelarBtn.focus();
    } catch (_) {}
  }, 120);
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


// ====================================================================
//  MODAIS DO MENU ☰ — shell profissional partilhada (SaaS-grade)
// ====================================================================
function ensureBpSheetModal(id, title, eyebrow, subtitle, opts) {
  opts = opts || {};
  var el = document.getElementById(id);
  if (el) {
    var tEl = el.querySelector('.bp-sheet-title');
    var eEl = el.querySelector('.bp-sheet-eyebrow');
    var sEl = el.querySelector('.bp-sheet-subtitle');
    if (tEl && title) tEl.textContent = title;
    if (eEl && eyebrow) eEl.textContent = eyebrow;
    if (sEl) {
      if (subtitle) {
        sEl.textContent = subtitle;
        sEl.hidden = false;
      } else {
        sEl.textContent = '';
        sEl.hidden = true;
      }
    }
    return el;
  }

  el = document.createElement('div');
  el.id = id;
  el.className = 'modal-overlay';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-labelledby', id + '-title');

  var eye = eyebrow || 'BeautyPro';
  var sub = subtitle || '';
  var closeLabel = opts.closeLabel || 'Fechar';
  var primaryHtml = opts.primaryHtml || '';

  el.innerHTML =
    '<div class="bp-sheet modal-sheet">' +
      '<div class="bp-sheet-handle handle" aria-hidden="true"></div>' +
      '<div class="bp-sheet-header">' +
        '<div class="bp-sheet-eyebrow">' + (typeof escHtml === 'function' ? escHtml(eye) : eye) + '</div>' +
        '<h2 class="bp-sheet-title modal-title" id="' + id + '-title">' + (typeof escHtml === 'function' ? escHtml(title) : title) + '</h2>' +
        '<p class="bp-sheet-subtitle"' + (sub ? '' : ' hidden') + '>' + (typeof escHtml === 'function' ? escHtml(sub) : sub) + '</p>' +
      '</div>' +
      '<div class="bp-sheet-body" id="' + id + '-body"></div>' +
      '<div class="bp-sheet-footer modal-actions">' +
        '<button type="button" class="btn btn-secondary" data-close="' + id + '">' + closeLabel + '</button>' +
        primaryHtml +
      '</div>' +
    '</div>';

  document.body.appendChild(el);

  el.addEventListener('click', function (e) {
    if (e.target === el || e.target.getAttribute('data-close') === id) {
      if (typeof closeModal === 'function') closeModal(id);
      else el.classList.remove('open');
    }
  });

  return el;
}

function openBpSheetModal(id) {
  if (typeof openModal === 'function') openModal(id);
  else {
    var el = document.getElementById(id);
    if (el) el.classList.add('open');
  }
}

if (typeof window !== 'undefined') {
  window.ensureBpSheetModal = ensureBpSheetModal;
  window.openBpSheetModal = openBpSheetModal;
}


/** JSON.stringify com limite de tamanho (evitar QuotaExceeded). */
function safeStringify(obj, maxBytes) {
  maxBytes = maxBytes || (4.5 * 1024 * 1024);
  try {
    var s = JSON.stringify(obj);
    if (s.length <= maxBytes) return s;
    return JSON.stringify({ _truncated: true, length: s.length });
  } catch (e) {
    return 'null';
  }
}
if (typeof window !== 'undefined') window.safeStringify = safeStringify;


/** Etapa 1 — overlay checkmark / offline após boot */
function showCheckmark(opts) {
  /* Funcionalidade eliminada — sem modal de sucesso */
  return Promise.resolve();
}
function hideCheckmark() {
  var el = document.getElementById('bp-checkmark-overlay');
  if (el) {
    el.hidden = true;
    el.style.display = 'none';
  }
  return Promise.resolve();
}

if (typeof window !== 'undefined') {
  window.showCheckmark = showCheckmark;
  window.hideCheckmark = hideCheckmark;
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
    plano: (function () {
    try {
      var sid = localStorage.getItem('bp_salao_id_cache');
      if (sid) {
        var ns = localStorage.getItem('bp_plano_cache_' + sid);
        if (ns) return ns;
      }
      return 'trial';
    } catch (_) { return 'trial'; }
  })(),
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
//  DB — INDEXEDDB + CACHE LOCAL ROBUSTO (write-through + fallback)
//  - IndexedDB = fonte primária
//  - localStorage `bp_${store}` = espelho para recuperação / private mode
//  - Cache em memória de curta duração para leituras repetidas no mesmo ciclo
// ====================================================================
let db = null;
const STORES = ['config', 'clientes', 'agendamentos', 'movimentos', 'profissionais', 'servicos', 'fechos_caixa'];

/** Memória: evita getAll repetidos no mesmo tick de UI */
const _memCache = Object.create(null);
const MEM_TTL_MS = 800;

function _lsKey(store) {
  return 'bp_' + store;
}

function _memInvalidate(store) {
  if (store) delete _memCache[store];
  else Object.keys(_memCache).forEach(function (k) { delete _memCache[k]; });
}

function _memGet(store) {
  const e = _memCache[store];
  if (!e) return null;
  if (Date.now() - e.ts > MEM_TTL_MS) {
    delete _memCache[store];
    return null;
  }
  return e.data;
}

function _memSet(store, data) {
  _memCache[store] = { ts: Date.now(), data: Array.isArray(data) ? data : [] };
}

function _readLSMirror(store) {
  try {
    const raw = localStorage.getItem(_lsKey(store));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function _writeLSMirror(store, items) {
  try {
    localStorage.setItem(_lsKey(store), JSON.stringify(Array.isArray(items) ? items : []));
    return true;
  } catch (e) {
    // Quota ou modo privado: tentar espelho mínimo (últimos 200) para stores grandes
    try {
      const arr = Array.isArray(items) ? items : [];
      if (arr.length > 200) {
        localStorage.setItem(_lsKey(store), JSON.stringify(arr.slice(-200)));
        return true;
      }
    } catch (e2) {}
    return false;
  }
}

function _mirrorUpsert(store, item) {
  if (!item || item.id == null) return;
  const items = _readLSMirror(store);
  const idx = items.findIndex(function (i) { return i && i.id === item.id; });
  if (idx !== -1) items[idx] = item;
  else items.push(item);
  _writeLSMirror(store, items);
}

function _mirrorDelete(store, id) {
  const items = _readLSMirror(store).filter(function (i) { return i && i.id !== id; });
  _writeLSMirror(store, items);
}

/** Rehidrata IndexedDB a partir do espelho (quando IDB está vazio e LS tem dados). */
async function _rehydrateStoreFromMirror(store, mirror) {
  if (!db || !mirror || !mirror.length) return;
  try {
    const tx = db.transaction(store, 'readwrite');
    const os = tx.objectStore(store);
    for (let i = 0; i < mirror.length; i++) {
      const it = mirror[i];
      if (it && it.id != null) os.put(it);
    }
    await new Promise(function (res, rej) {
      tx.oncomplete = res;
      tx.onerror = function () { rej(tx.error); };
      tx.onabort = function () { rej(tx.error); };
    });
  } catch (e) {
    console.warn('[BPCache] rehydrate failed:', store, e);
  }
}

function openDB() {
  return new Promise(function (res, rej) {
    try {
      const req = indexedDB.open('BelezaProDB', 8);
      req.onupgradeneeded = function (e) {
        const d = e.target.result;
        STORES.forEach(function (s) {
          if (!d.objectStoreNames.contains(s)) d.createObjectStore(s, { keyPath: 'id' });
        });
      };
      req.onsuccess = function (e) {
        db = e.target.result;
        db.onversionchange = function () {
          try { db.close(); } catch (err) {}
          db = null;
        };
        res(db);
      };
      req.onerror = function (e) { rej(e.target.error); };
    } catch (err) {
      rej(err);
    }
  });
}

async function dbGetAll(store) {
  const cached = _memGet(store);
  if (cached) return cached.slice();

  let fromIdb = null;
  try {
    if (db) {
      const tx = db.transaction(store, 'readonly');
      const r = tx.objectStore(store).getAll();
      fromIdb = await new Promise(function (res, rej) {
        r.onsuccess = function () { res(r.result || []); };
        r.onerror = function () { rej(r.error); };
      });
    }
  } catch (e) {
    fromIdb = null;
  }

  const mirror = _readLSMirror(store);

  // IDB ok e com dados
  if (Array.isArray(fromIdb) && fromIdb.length > 0) {
    // Write-through: manter espelho alinhado (recuperação futura)
    _writeLSMirror(store, fromIdb);
    _memSet(store, fromIdb);
    return fromIdb.slice();
  }

  // IDB vazio ou indisponível, mas há espelho → recuperar
  if (mirror.length > 0) {
    if (db && Array.isArray(fromIdb) && fromIdb.length === 0) {
      await _rehydrateStoreFromMirror(store, mirror);
    }
    _memSet(store, mirror);
    return mirror.slice();
  }

  // Ambos vazios
  const empty = Array.isArray(fromIdb) ? fromIdb : [];
  _memSet(store, empty);
  return empty.slice();
}

let dbPut = async function (store, item) {
  if (!item.id) item.id = typeof uuid === 'function' ? uuid() : String(Date.now());
  item.updated_at = new Date().toISOString();

  let idbOk = false;
  try {
    if (db) {
      const tx = db.transaction(store, 'readwrite');
      const r = tx.objectStore(store).put(item);
      await new Promise(function (res, rej) {
        r.onsuccess = res;
        r.onerror = function () { rej(r.error); };
      });
      idbOk = true;
    }
  } catch (e) {
    idbOk = false;
  }

  // Sempre espelhar (write-through) — robustez se IDB for limpo ou falhar depois
  _mirrorUpsert(store, item);
  _memInvalidate(store);

  return item;
};

// Escrita local pura (NUNCA dispara sync) — usada pelo pull remoto
async function dbPutLocal(store, item) {
  if (!item.id) item.id = typeof uuid === 'function' ? uuid() : String(Date.now());
  if (!item.updated_at) item.updated_at = new Date().toISOString();

  try {
    if (db) {
      const tx = db.transaction(store, 'readwrite');
      const r = tx.objectStore(store).put(item);
      await new Promise(function (res, rej) {
        r.onsuccess = res;
        r.onerror = function () { rej(r.error); };
      });
    }
  } catch (e) { /* fallback só espelho */ }

  _mirrorUpsert(store, item);
  _memInvalidate(store);
  return item;
};

let dbDelete = async function (store, id) {
  try {
    if (db) {
      const tx = db.transaction(store, 'readwrite');
      const r = tx.objectStore(store).delete(id);
      await new Promise(function (res, rej) {
        r.onsuccess = res;
        r.onerror = function () { rej(r.error); };
      });
    }
  } catch (e) {}

  _mirrorDelete(store, id);
  _memInvalidate(store);
};

async function dbClear(store) {
  try {
    if (db) {
      const tx = db.transaction(store, 'readwrite');
      await new Promise(function (res, rej) {
        const r = tx.objectStore(store).clear();
        r.onsuccess = res;
        r.onerror = function () { rej(r.error); };
      });
    }
  } catch (e) {}

  try { localStorage.removeItem(_lsKey(store)); } catch (e) {}
  _memInvalidate(store);
}

/** Diagnóstico / testes */
function bpCacheStats() {
  const out = {};
  STORES.forEach(function (s) {
    const mir = _readLSMirror(s);
    out[s] = {
      mirrorCount: mir.length,
      memCached: !!_memCache[s]
    };
  });
  out.idbOpen = !!db;
  return out;
}

if (typeof window !== 'undefined') {
  window.bpCacheStats = bpCacheStats;
  window.BPCache = {
    stats: bpCacheStats,
    invalidate: _memInvalidate,
    stores: STORES.slice()
  };
}


/** Health-check de persistência (IndexedDB + mirror LS) — NIST/PWA offline-first */
function bpProbePersistence() {
  return new Promise(function (resolve) {
    var result = { idb: false, ls: false, mirrors: 0 };
    try {
      localStorage.setItem('bp_persist_probe', '1');
      result.ls = localStorage.getItem('bp_persist_probe') === '1';
      localStorage.removeItem('bp_persist_probe');
    } catch (_) { result.ls = false; }
    try {
      var keys = ['config', 'clientes', 'agendamentos', 'movimentos', 'profissionais', 'servicos'];
      for (var i = 0; i < keys.length; i++) {
        if (localStorage.getItem('bp_' + keys[i])) result.mirrors++;
      }
    } catch (_) {}
    try {
      if (typeof openDB === 'function') {
        Promise.resolve(openDB()).then(function () {
          result.idb = true;
          resolve(result);
        }).catch(function () { resolve(result); });
      } else {
        resolve(result);
      }
    } catch (_) {
      resolve(result);
    }
  });
}
if (typeof window !== 'undefined') {
  window.bpProbePersistence = bpProbePersistence;
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

/** Sessão local persistente — entrada offline sem re-login. */
/**
 * Sessão local robusta (OWASP Session Mgmt + offline-first SaaS)
 * - Flags legadas mantidas para o gate no <head>
 * - Meta JSON dual-write (localStorage + sessionStorage)
 * - Integridade: salao_id obrigatório, logout explícito (bp_logged_out)
 * - Renovação em TOKEN_REFRESHED / operações
 * Referências: OWASP Session Management Cheat Sheet, NIST SP 800-63B
 */
var BP_SESSION_META_KEY = 'bp_session_meta';
var BP_SESSION_META_SS = 'bp_session_meta_ss';

function _bpSessionUaHint() {
  try {
    var ua = String(navigator.userAgent || '');
    var h = 0;
    for (var i = 0; i < ua.length; i++) h = ((h << 5) - h + ua.charCodeAt(i)) | 0;
    return String(h);
  } catch (_) {
    return '0';
  }
}

function _bpWriteSessionMeta(meta) {
  var raw = JSON.stringify(meta);
  try { localStorage.setItem(BP_SESSION_META_KEY, raw); } catch (_) {}
  try { sessionStorage.setItem(BP_SESSION_META_SS, raw); } catch (_) {}
}

function _bpReadSessionMeta() {
  var raw = null;
  try { raw = localStorage.getItem(BP_SESSION_META_KEY); } catch (_) {}
  if (!raw) {
    try { raw = sessionStorage.getItem(BP_SESSION_META_SS); } catch (_) {}
  }
  if (!raw) return null;
  try {
    var o = JSON.parse(raw);
    return o && typeof o === 'object' ? o : null;
  } catch (_) {
    return null;
  }
}

function bpMarkSessionLocal(salaoId) {
  try {
    var sid = salaoId != null ? String(salaoId).trim() : '';
    if (!sid) {
      try { sid = String(localStorage.getItem('bp_salao_id_cache') || '').trim(); } catch (_) {}
    }
    if (!sid) {
      // Sem salão não há sessão local válida (evita bp-has-session órfão)
      return;
    }
    localStorage.setItem('bp_salao_id_cache', sid);
    localStorage.setItem('bp_session_active', '1');
    localStorage.removeItem('bp_logged_out');
    var role = '';
    try { role = localStorage.getItem('bp_user_role') || ''; } catch (_) {}
    var meta = {
      v: 1,
      salaoId: sid,
      role: role,
      markedAt: Date.now(),
      ua: _bpSessionUaHint()
    };
    _bpWriteSessionMeta(meta);
    try { document.documentElement.classList.add('bp-has-session'); } catch (_) {}
  } catch (_) {}
}

function bpTouchSessionLocal() {
  try {
    if (!bpHasLocalSession()) return;
    var meta = _bpReadSessionMeta() || {};
    meta.v = 1;
    meta.markedAt = Date.now();
    try { meta.salaoId = meta.salaoId || localStorage.getItem('bp_salao_id_cache') || ''; } catch (_) {}
    try { meta.role = meta.role || localStorage.getItem('bp_user_role') || ''; } catch (_) {}
    meta.ua = _bpSessionUaHint();
    _bpWriteSessionMeta(meta);
    localStorage.setItem('bp_session_active', '1');
  } catch (_) {}
}

function bpClearSessionLocal() {
  try {
    localStorage.setItem('bp_logged_out', '1');
    localStorage.removeItem('bp_session_active');
    localStorage.removeItem('bp_salao_id_cache');
    localStorage.removeItem('bp_user_role');
    localStorage.removeItem('bp_plano_cache');
    localStorage.removeItem(BP_SESSION_META_KEY);
    try { sessionStorage.removeItem(BP_SESSION_META_SS); } catch (_) {}
    var toRm = [];
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && (k.indexOf('bp_plano_cache_') === 0 || k.indexOf('bp_ia_historico_') === 0 || k.indexOf('bp_ia_chat_') === 0 || k.indexOf('ia_perguntas_') === 0 || k.indexOf('bp_ia_perguntas_') === 0)) toRm.push(k);
    }
    toRm.forEach(function (k) { try { localStorage.removeItem(k); } catch (_) {} });
    try { document.documentElement.classList.remove('bp-has-session'); } catch (_) {}
  } catch (_) {}
}

function bpHasLocalSession() {
  try {
    if (localStorage.getItem('bp_logged_out') === '1') return false;
    var active = localStorage.getItem('bp_session_active') === '1';
    var salao = localStorage.getItem('bp_salao_id_cache');
    if (active && salao) return true;
    // Recuperação: meta dual-write (se flags parciais falharam)
    var meta = _bpReadSessionMeta();
    if (meta && meta.salaoId) {
      try {
        localStorage.setItem('bp_salao_id_cache', String(meta.salaoId));
        localStorage.setItem('bp_session_active', '1');
        if (meta.role) localStorage.setItem('bp_user_role', String(meta.role));
      } catch (_) {}
      return true;
    }
  } catch (_) {}
  return false;
}

function bpShowAppShell() {
  try {
    document.documentElement.classList.add('bp-has-session');
    var login = document.getElementById('login-view');
    var app = document.getElementById('app-view');
    if (login) {
      login.style.display = 'none';
      login.classList.remove('active');
    }
    if (app) app.style.display = 'flex';
  } catch (_) {}
  bpHideSplashNow();
}

function bpShowLoginShell() {
  try {
    document.documentElement.classList.remove('bp-has-session');
    var login = document.getElementById('login-view');
    var app = document.getElementById('app-view');
    if (app) app.style.display = 'none';
    if (login) {
      login.style.display = 'flex';
      login.classList.add('active');
    }
  } catch (_) {}
  bpHideSplashNow();
}

supabaseClient.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' && !logoutVoluntarioEmCurso) {
    // Offline OU ainda com sessão local válida: não expulsar (offline-first)
    if (bpHasLocalSession()) {
      console.warn('[auth] SIGNED_OUT ignorado — sessão local válida');
      try { if (typeof bpTouchSessionLocal === 'function') bpTouchSessionLocal(); } catch (_) {}
      return;
    }
    document.querySelectorAll('.modal-overlay.active, .modal-overlay.open').forEach(function (m) {
      m.classList.remove('active');
      m.classList.remove('open');
    });
    bpShowLoginShell();
    if (typeof toast === 'function') toast('A sessão expirou. Inicia sessão novamente.', 'error');
  }
  // ET4.2-P0-auth: refrescar permissões quando a sessão muda (sem expulsar offline-first)
  if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED' || event === 'SIGNED_IN') {
    try {
      if (typeof bpTouchSessionLocal === 'function') bpTouchSessionLocal();
      if (typeof aplicarPermissoes === 'function') aplicarPermissoes();
      if (typeof atualizarIndicadorSync === 'function') atualizarIndicadorSync();
    } catch (_) {}
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

(function bpApplyRoleCacheEarly() {
  try {
    const r = localStorage.getItem('bp_user_role');
    if (r && typeof state !== 'undefined' && state.config && (!state.config.userRole || state.config.userRole === 'operador')) {
      if (typeof RBAC_ROLES === 'undefined' || RBAC_ROLES.includes(r)) state.config.userRole = r;
    }
  } catch (_) {}
})();
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
  // 1) Entrada INSTANTÂNEA com cache local (sem esperar rede)
  var cachedSalao = null;
  try { cachedSalao = localStorage.getItem('bp_salao_id_cache'); } catch (_) {}
  if (!cachedSalao) {
    try { cachedSalao = await bpLoadSalaoIdLocal(); } catch (_) {}
  }
  var forceLogin = false;
  try { forceLogin = localStorage.getItem('bp_logged_out') === '1'; } catch (_) {}

  if (!forceLogin && cachedSalao) {
    state.config.salaoId = cachedSalao;
    try {
      var role = localStorage.getItem('bp_user_role');
      if (role) state.config.userRole = role;
    } catch (_) {}

    /* Overlay ANTES da UI: utilizador nunca vê a app "já sincronizada" sem o modal */
    var bootOnline = (typeof navigator !== 'undefined' && navigator.onLine);
    if (bootOnline) {
      try { if (typeof bpShowBootOverlay === 'function') bpShowBootOverlay(); } catch (_) {}
    }

    bpShowAppShell();
    bpMarkSessionLocal(cachedSalao);

    // Dados locais sob o overlay (se online)
    try {
      await loadState(false);
    } catch (e) {
      console.warn('[boot] loadState local', e);
    }
    try {
      if (typeof ativarAbaAtiva === 'function') ativarAbaAtiva();
      if (typeof aplicarPermissoes === 'function') aplicarPermissoes();
      if (typeof atualizarIndicadorSync === 'function') atualizarIndicadorSync();
      if (typeof updateUI === 'function') updateUI();
    } catch (_) {}

    // Rede imediata — overlay já está aberto; sem setTimeout artificial
    if (bootOnline) {
      Promise.resolve()
        .then(function () {
          return bpWithTimeout(supabaseClient.auth.getSession(), 1500, 'getSession_bg');
        })
        .then(function (res) {
          var session = res && res.data ? res.data.session : null;
          if (!session) return null;
          return bpWithTimeout(
            supabaseClient.from('profiles').select('salao_id, role, nome').eq('user_id', session.user.id).single(),
            2000,
            'profile_bg'
          );
        })
        .then(function (pr) {
          if (!pr || !pr.data) return;
          var profile = pr.data;
          if (profile.salao_id) {
            state.config.salaoId = profile.salao_id;
            bpMarkSessionLocal(profile.salao_id);
          }
          if (profile.role) {
            state.config.userRole = profile.role;
            try { localStorage.setItem('bp_user_role', profile.role); } catch (_) {}
          }
          if (profile.nome) state.config.storeName = profile.nome || state.config.storeName;
          if (typeof saveConfig === 'function') return saveConfig();
        })
        .then(function () {
          if (typeof sincronizarConfigDoServidor === 'function') return sincronizarConfigDoServidor();
        })
        .then(function () {
          var pullP = null;
          if (typeof bpSilentPull === 'function') pullP = bpSilentPull(true);
          else if (typeof carregarDoSupabase === 'function') pullP = carregarDoSupabase();
          if (!pullP) return null;
          return pullP;
        })
        .then(function () {
          try { if (typeof bpHideBootOverlay === 'function') bpHideBootOverlay(); } catch (_) {}
          try { window.__bpQuietUI = true; } catch (_) {}
          if (typeof updateUI === 'function') updateUI();
          if (typeof atualizarIndicadorSync === 'function') atualizarIndicadorSync();
          try { setTimeout(function () { window.__bpQuietUI = false; }, 1500); } catch (_) {}
          try { if (typeof bpCheckExpiringAppointments === 'function') bpCheckExpiringAppointments(); } catch (_) {}
        })
        .catch(function (err) {
          console.warn('[boot] sync online', err && err.message);
          try { if (typeof bpBootShowFail === 'function') bpBootShowFail(); } catch (_) {}
          /* Mesmo em falha: não deixar overlay eterno — fail UI ou fechar em 2s */
          setTimeout(function () {
            try {
              if (document.documentElement.classList.contains('bp-booting')) {
                if (typeof bpHideBootOverlay === 'function') bpHideBootOverlay();
              }
            } catch (_) {}
          }, 2000);
        });
    } else {
      /* Offline com cache: fechar overlay imediatamente após dados locais */
      try { if (typeof bpHideBootOverlay === 'function') bpHideBootOverlay(); } catch (_) {}
    }

    return;
  }

  // 2) Sem cache local: só aqui tentamos rede (timeout curto)
  try {
    var session = null;
    if (navigator.onLine) {
      try {
        var res = await bpWithTimeout(supabaseClient.auth.getSession(), 1800, 'getSession');
        session = res && res.data ? res.data.session : null;
      } catch (e) {
        console.warn('[boot] getSession falhou/timeout', e && e.message);
        session = null;
      }
    }

    if (!session) {
      // Offline e sem cache = login; online sem sessão = login
      bpShowLoginShell();
      return;
    }

    bpShowAppShell();
    if (navigator.onLine) {
      try { if (typeof bpShowBootOverlay === 'function') bpShowBootOverlay(); } catch (_) {}
    }

    var profile = null;
    try {
      var pr = await bpWithTimeout(
        supabaseClient.from('profiles').select('salao_id, role, nome').eq('user_id', session.user.id).single(),
        2500,
        'profile'
      );
      profile = pr && pr.data;
    } catch (e) {
      console.warn('[boot] profile', e && e.message);
    }

    if (profile && profile.salao_id) {
      state.config.salaoId = profile.salao_id;
      state.config.storeName = profile.nome || state.config.storeName || 'Salão';
      state.config.userRole = profile.role;
      try { if (profile.role) localStorage.setItem('bp_user_role', profile.role); } catch (_) {}
      bpMarkSessionLocal(profile.salao_id);
      if (typeof saveConfig === 'function') {
        try { await saveConfig(); } catch (_) {}
      }
    } else {
      var localSalao = cachedSalao || (await bpLoadSalaoIdLocal());
      if (localSalao) {
        state.config.salaoId = localSalao;
        bpMarkSessionLocal(localSalao);
      }
    }

    var trocouDeSalao = false;
    try {
      if (typeof detetarTrocaDeSalao === 'function' && state.config.salaoId) {
        trocouDeSalao = await detetarTrocaDeSalao(state.config.salaoId);
      }
    } catch (_) {}

    if (typeof aplicarPermissoes === 'function') aplicarPermissoes();
    try { await loadState(trocouDeSalao); } catch (e) { console.warn('[boot] loadState', e); }
    if (typeof ativarAbaAtiva === 'function') ativarAbaAtiva();
    if (typeof atualizarIndicadorSync === 'function') atualizarIndicadorSync();

    if (navigator.onLine) {
      Promise.resolve()
        .then(function () { return typeof sincronizarConfigDoServidor === 'function' ? sincronizarConfigDoServidor() : null; })
        .then(function () {
          var pullP = null;
          if (typeof bpSilentPull === 'function') pullP = bpSilentPull(true);
          else if (typeof carregarDoSupabase === 'function') pullP = carregarDoSupabase();
          return pullP;
        })
        .then(function () {
          try { if (typeof bpHideBootOverlay === 'function') bpHideBootOverlay(); } catch (_) {}
          if (typeof updateUI === 'function') updateUI();
        })
        .catch(function (err) {
          console.warn('[boot] pull inicial', err && err.message);
          try { if (typeof bpBootShowFail === 'function') bpBootShowFail(); } catch (_) {}
        });
    } else {
      try { if (typeof bpHideBootOverlay === 'function') bpHideBootOverlay(); } catch (_) {}
    }
  } catch (err) {
    console.error('[boot] checkSession', err);
    // Último recurso: cache local mesmo com erro
    try {
      var fallback = null;
      try { fallback = localStorage.getItem('bp_salao_id_cache'); } catch (_) {}
      if (!fallback) fallback = await bpLoadSalaoIdLocal();
      if (fallback && !forceLogin) {
        state.config.salaoId = fallback;
        bpShowAppShell();
        try { await loadState(false); } catch (_) {}
        if (typeof ativarAbaAtiva === 'function') ativarAbaAtiva();
        return;
      }
    } catch (_) {}
    bpShowLoginShell();
  }
}


async function getAuthHeaders() {
  // 1) Sessão actual
  let session = null;
  try {
    const res = await supabaseClient.auth.getSession();
    session = res && res.data ? res.data.session : null;
  } catch (_) {
    session = null;
  }

  // 2) Se não há token, tenta renovar (evita "sessão expirada" em cada pedido)
  if (!session || !session.access_token) {
    try {
      const refreshed = await supabaseClient.auth.refreshSession();
      session = refreshed && refreshed.data ? refreshed.data.session : null;
      if (session && session.access_token) {
        try {
          if (typeof bpTouchSessionLocal === 'function') bpTouchSessionLocal();
        } catch (_) {}
      }
    } catch (_) {
      session = null;
    }
  }

  // 3) Token próximo de expirar (< 60s) → renovar proactivamente
  if (session && session.access_token && session.expires_at) {
    var expiresAtMs = Number(session.expires_at) * 1000;
    if (isFinite(expiresAtMs) && expiresAtMs - Date.now() < 60 * 1000) {
      try {
        const refreshed = await supabaseClient.auth.refreshSession();
        var s2 = refreshed && refreshed.data ? refreshed.data.session : null;
        if (s2 && s2.access_token) {
          session = s2;
          try {
            if (typeof bpTouchSessionLocal === 'function') bpTouchSessionLocal();
          } catch (_) {}
        }
      } catch (_) {}
    }
  }

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
      var planoAnterior = state.config.plano;
      var trialAnterior = state.config.trialInicio;
      state.config.plano       = rows[0].plano || 'trial';
      state.config.trialInicio = rows[0].trial_inicio || state.config.trialInicio;
      try {
        if (state.config.salaoId) {
          localStorage.setItem('bp_plano_cache_' + state.config.salaoId, state.config.plano);
        }
        localStorage.removeItem('bp_plano_cache'); // legacy global
      } catch (_) {}
      await saveConfig();
      if (state.config.plano !== planoAnterior || state.config.trialInicio !== trialAnterior) {
        if (typeof renderPlanoInfo === 'function') renderPlanoInfo();
      }
      // ET4.5: reconciliar contador de recibos com servidor + movimentos
      try {
        if (typeof bpSyncReciboCounter === 'function') await bpSyncReciboCounter();
      } catch (_) {}
      try {
        if (typeof bpPullIAUsoFromSupabase === 'function') await bpPullIAUsoFromSupabase();
      } catch (_) {}
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
  if (!email || !password) { toast('Introduz o email e a palavra-passe.', 'warning'); return; }
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
    bpMarkSessionLocal(profile.salao_id);
    try { if (profile.role) localStorage.setItem('bp_user_role', profile.role); } catch (_) {}
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
      try { if (typeof hideSplash === 'function') hideSplash(); } catch (_) {}
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
if (typeof window !== 'undefined') {
  window.bpMarkSessionLocal = bpMarkSessionLocal;
  window.bpClearSessionLocal = bpClearSessionLocal;
  window.bpHasLocalSession = bpHasLocalSession;
  window.bpTouchSessionLocal = bpTouchSessionLocal;
}

/* ===== FILE: supabase-resilience.js ===== */
/**
 * supabase-resilience.js
 * Retry HTTP (backoff + jitter), timeout, latência e saúde do serviço Supabase.
 * Só transporte — sem regras de negócio.
 *
 * --- Exemplos de chamada ---
 *
 * // 1) Stats de latência (consola ou UI)
 * const s = bpGetSupabaseLatencyStats();
 * // → { n, avg, p95, fail, lastMs }
 *
 * // 2) Saúde agregada
 * const h = bpGetServiceHealth();
 * // → { level: 'ok'|'degraded'|'critical'|'unknown', label, stats, reasons: [] }
 *
 * // 3) Fetch manual com retry
 * const resp = await bpFetchSupabase(
 *   `${SUPABASE_URL}/rest/v1/movimentos?select=id`,
 *   { headers: await getAuthHeaders() },
 *   { label: 'movimentos-probe', retries: 2, timeoutMs: 10000 }
 * );
 *
 * // 4) Retry genérico em qualquer async
 * await bpRetryExponential(async () => {
 *   const r = await fetch(url, opts);
 *   if (!r.ok) { const e = new Error('HTTP ' + r.status); e.status = r.status; throw e; }
 *   return r.json();
 * }, { retries: 3, label: 'custom-job' });
 *
 * // 5) Arrancar monitor (já chamado uma vez no boot se main invocar bpStartHealthMonitor)
 * bpStartHealthMonitor({ intervalMs: 30000 });
 */
(function (global) {
  'use strict';

  var LAT_MAX = 48;

  /** Limiares de saúde (ms / rácios). Ajustáveis via bpConfigureHealthThresholds. */
  var THRESHOLDS = {
    warnAvgMs: 2500,
    warnP95Ms: 4000,
    critAvgMs: 5000,
    critP95Ms: 8000,
    warnFailRatio: 0.25,
    critFailRatio: 0.5,
    minSamples: 3
  };

  var _latencies = [];
  var _lastHealthLevel = 'unknown';
  var _monitorTimer = null;
  var _alertCooldownUntil = 0;

  function bpConfigureHealthThresholds(partial) {
    if (!partial || typeof partial !== 'object') return Object.assign({}, THRESHOLDS);
    Object.keys(partial).forEach(function (k) {
      if (THRESHOLDS[k] != null && typeof partial[k] === 'number') THRESHOLDS[k] = partial[k];
    });
    return Object.assign({}, THRESHOLDS);
  }

  function bpLogError(contexto, err, extra) {
    try {
      var msg = err && err.message ? err.message : String(err || 'erro');
      var payload = {
        ts: new Date().toISOString(),
        contexto: contexto || 'supabase',
        message: msg,
        status: err && err.status != null ? err.status : undefined,
        extra: extra || undefined
      };
      if (typeof console !== 'undefined' && console.error) {
        console.error('[BeautyPro]', payload.contexto, payload.message, payload);
      }
      global.__bpLastSupabaseError = payload;
    } catch (_) {}
  }

  function _recordLatency(ms, ok, meta) {
    try {
      _latencies.push({
        ms: Math.max(0, Math.round(ms)),
        ok: !!ok,
        t: Date.now(),
        meta: meta || null
      });
      if (_latencies.length > LAT_MAX) _latencies.shift();
    } catch (_) {}
  }

  function bpGetSupabaseLatencyStats() {
    if (!_latencies.length) {
      return { n: 0, avg: 0, p95: 0, fail: 0, lastMs: 0, failRatio: 0 };
    }
    var ms = _latencies.map(function (x) { return x.ms; }).sort(function (a, b) { return a - b; });
    var fail = _latencies.filter(function (x) { return !x.ok; }).length;
    var sum = ms.reduce(function (a, b) { return a + b; }, 0);
    var p95 = ms[Math.min(ms.length - 1, Math.floor(ms.length * 0.95))];
    var last = _latencies[_latencies.length - 1];
    return {
      n: ms.length,
      avg: Math.round(sum / ms.length),
      p95: p95,
      fail: fail,
      lastMs: last ? last.ms : 0,
      failRatio: Math.round((fail / ms.length) * 100) / 100
    };
  }

  /**
   * Avalia saúde do serviço com base na janela de latência.
   * level: unknown | ok | degraded | critical
   */
  function bpGetServiceHealth() {
    var stats = bpGetSupabaseLatencyStats();
    var reasons = [];
    var level = 'unknown';

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return {
        level: 'critical',
        label: 'Sem rede',
        stats: stats,
        reasons: ['navigator.offline']
      };
    }

    if (stats.n < THRESHOLDS.minSamples) {
      return {
        level: 'unknown',
        label: 'A calibrar',
        stats: stats,
        reasons: ['amostras_insuficientes']
      };
    }

    level = 'ok';
    if (stats.failRatio >= THRESHOLDS.critFailRatio) {
      level = 'critical';
      reasons.push('falhas_' + Math.round(stats.failRatio * 100) + '%');
    } else if (stats.failRatio >= THRESHOLDS.warnFailRatio) {
      level = 'degraded';
      reasons.push('falhas_' + Math.round(stats.failRatio * 100) + '%');
    }

    if (stats.p95 >= THRESHOLDS.critP95Ms || stats.avg >= THRESHOLDS.critAvgMs) {
      level = 'critical';
      reasons.push('latencia_p95_' + stats.p95 + 'ms');
    } else if (stats.p95 >= THRESHOLDS.warnP95Ms || stats.avg >= THRESHOLDS.warnAvgMs) {
      if (level !== 'critical') level = 'degraded';
      reasons.push('latencia_avg_' + stats.avg + 'ms');
    }

    var label =
      level === 'ok' ? 'Serviço OK' :
      level === 'degraded' ? 'Serviço lento' :
      level === 'critical' ? 'Serviço instável' : 'A calibrar';

    return { level: level, label: label, stats: stats, reasons: reasons };
  }

  /** Emite alerta suave só quando o nível piora (cooldown 60s). */
  function bpNotifyHealthIfNeeded(health) {
    if (!health || !health.level) return;
    var rank = { unknown: 0, ok: 1, degraded: 2, critical: 3 };
    var prev = rank[_lastHealthLevel] != null ? rank[_lastHealthLevel] : 0;
    var next = rank[health.level] != null ? rank[health.level] : 0;
    var worsened = next > prev && next >= 2;
    _lastHealthLevel = health.level;

    try {
      var container = document.getElementById('sync-status-container');
      if (container) {
        container.setAttribute('data-service-health', health.level);
        if (health.level === 'degraded' || health.level === 'critical') {
          container.classList.add('is-visible');
        }
      }
    } catch (_) {}

    // ET4.9b: sem avisos ao utilizador sobre «ligação ao servidor» / saúde do serviço.
    // A sincronização continua em silêncio; apenas log interno se necessário.
    if (!worsened) return;
    try {
      bpLogError('service-health', new Error(health.label || 'health'), {
        level: health.level,
        reasons: health.reasons,
        stats: health.stats
      });
    } catch (_) {}
  }

  function bpStartHealthMonitor(opts) {
    opts = opts || {};
    var intervalMs = opts.intervalMs != null ? opts.intervalMs : 30000;
    if (_monitorTimer) {
      try { clearInterval(_monitorTimer); } catch (_) {}
      _monitorTimer = null;
    }
    var tick = function () {
      try {
        var h = bpGetServiceHealth();
        bpNotifyHealthIfNeeded(h);
        global.__bpServiceHealth = h;
      } catch (_) {}
    };
    tick();
    _monitorTimer = setInterval(tick, intervalMs);
    return true;
  }

  function bpStopHealthMonitor() {
    if (_monitorTimer) {
      try { clearInterval(_monitorTimer); } catch (_) {}
      _monitorTimer = null;
    }
  }

  function _sleep(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  function _isRetryable(err) {
    if (!err) return false;
    if (err.name === 'AbortError' || err.name === 'TypeError') return true;
    var s = err.status;
    if (s === 429 || s === 408) return true;
    if (s >= 500 && s <= 599) return true;
    return false;
  }

  async function bpRetryExponential(fn, opts) {
    opts = opts || {};
    var retries = opts.retries != null ? opts.retries : 3;
    var baseMs = opts.baseMs != null ? opts.baseMs : 400;
    var maxMs = opts.maxMs != null ? opts.maxMs : 8000;
    var label = opts.label || 'bpRetry';
    var lastErr = null;
    for (var attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fn(attempt);
      } catch (err) {
        lastErr = err;
        var retryable = _isRetryable(err);
        if (!retryable || attempt >= retries) {
          bpLogError(label, err, { attempt: attempt, retryable: retryable });
          throw err;
        }
        var delay = Math.min(maxMs, baseMs * Math.pow(2, attempt)) + Math.random() * 200;
        await _sleep(delay);
      }
    }
    throw lastErr;
  }

  async function bpFetchSupabase(url, options, meta) {
    meta = meta || {};
    options = options || {};
    var timeoutMs = meta.timeoutMs != null ? meta.timeoutMs : 12000;
    var retries = meta.retries != null ? meta.retries : 2;
    var label = meta.label || 'bpFetchSupabase';

    return bpRetryExponential(async function () {
      var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      var timer = null;
      var started = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      try {
        if (ctrl) {
          timer = setTimeout(function () {
            try { ctrl.abort(); } catch (_) {}
          }, timeoutMs);
        }
        var opts = {};
        for (var k in options) {
          if (Object.prototype.hasOwnProperty.call(options, k)) opts[k] = options[k];
        }
        if (ctrl) opts.signal = ctrl.signal;

        var resp = await fetch(url, opts);
        var ms = Math.round(((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()) - started);
        var softOk = resp.ok || (resp.status >= 400 && resp.status < 500 && resp.status !== 429);
        _recordLatency(ms, softOk, { label: label, status: resp.status });

        if (resp.status === 429 || (resp.status >= 500 && resp.status <= 599)) {
          var e = new Error('HTTP ' + resp.status);
          e.status = resp.status;
          e.response = resp;
          throw e;
        }
        return resp;
      } catch (err) {
        var ms2 = Math.round(((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()) - started);
        _recordLatency(ms2, false, { label: label, error: err && err.name });
        if (err && err.name === 'AbortError') {
          var te = new Error('Timeout Supabase (' + timeoutMs + 'ms)');
          te.status = 408;
          te.name = 'AbortError';
          throw te;
        }
        throw err;
      } finally {
        if (timer) clearTimeout(timer);
      }
    }, { retries: retries, baseMs: 500, maxMs: 10000, label: label });
  }

  global.bpLogError = bpLogError;
  global.bpRetryExponential = bpRetryExponential;
  global.bpFetchSupabase = bpFetchSupabase;
  global.bpGetSupabaseLatencyStats = bpGetSupabaseLatencyStats;
  global.bpGetServiceHealth = bpGetServiceHealth;
  global.bpNotifyHealthIfNeeded = bpNotifyHealthIfNeeded;
  global.bpStartHealthMonitor = bpStartHealthMonitor;
  global.bpStopHealthMonitor = bpStopHealthMonitor;
  global.bpConfigureHealthThresholds = bpConfigureHealthThresholds;
})(typeof window !== 'undefined' ? window : globalThis);

/* ===== FILE: sync-queue.js ===== */
// ====================================================================
//  FILA DE SINCRONIZAÇÃO (extraído do app.js na Fase B da modularização)
// ====================================================================

// ================================================================
//  LISTA NEGRA DE ELIMINADOS (evita reimportação)
// ================================================================

const DELETED_KEY = 'bp_deleted_items';
const DLQ_KEY = 'bp_dlq';
const MAX_SYNC_ATTEMPTS = 5;
const QUEUE_SOFT_WARN = 1000;
const QUEUE_HARD_BLOCK = 5000;
const LS_WARN_BYTES = Math.floor(4.5 * 1024 * 1024);

/** Remove data URLs e campos binários — fila só metadados (P0). */
function slimPayload(payload) {
  if (payload == null || typeof payload !== 'object') return payload;
  if (Array.isArray(payload)) {
    return payload.map(function (x) { return slimPayload(x); });
  }
  var out = {};
  var keys = Object.keys(payload);
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    var v = payload[k];
    if (v == null) { out[k] = v; continue; }
    if (typeof v === 'string') {
      if (v.indexOf('data:') === 0) continue; // base64 / data URL
      if (v.length > 12000 && /^[A-Za-z0-9+/=\\s]+$/.test(v.slice(0, 80))) continue; // blob textual enorme
      out[k] = v;
      continue;
    }
    if (typeof v === 'object') {
      if (k === 'foto' || k === 'imagem' || k === 'foto_base64' || k === 'image') continue;
      out[k] = slimPayload(v);
      continue;
    }
    out[k] = v;
  }
  return out;
}

function getDlq() {
  try {
    var raw = JSON.parse(localStorage.getItem(DLQ_KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch (e) { return []; }
}

function saveDlq(items) {
  try {
    localStorage.setItem(DLQ_KEY, JSON.stringify((items || []).slice(-200)));
  } catch (e) {
    if (typeof logErroSilencioso === 'function') logErroSilencioso('saveDlq', e);
  }
}

function moveOpToDlq(op, reason) {
  var dlq = getDlq();
  dlq.push({
    id: op && op.id,
    tabela: op && op.tabela,
    operacao: op && op.operacao,
    payload: op && op.payload,
    ts: Date.now(),
    attempts: op && op.attempts,
    error: reason || (op && op.lastError) || 'max_attempts',
    originalTs: op && op.ts
  });
  saveDlq(dlq);
}

function bpGetDlqCount() {
  return getDlq().length;
}
if (typeof window !== 'undefined') {
  window.slimPayload = slimPayload;
  window.bpGetDlqCount = bpGetDlqCount;
  window.getDlq = getDlq;
}


function getDeletedItems() {
  try {
    const raw = JSON.parse(localStorage.getItem(DELETED_KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch (e) { logErroSilencioso('getDeletedItems', e); return []; }
}

function saveDeletedItems(items) {
  try { localStorage.setItem(DELETED_KEY, JSON.stringify(items)); }
  catch (e) { logErroSilencioso('saveDeletedItems', e); }
}

function addDeletedItem(id, tabela) {
  if (!id || !tabela) return;
  const items = pruneDeletedItems(getDeletedItems());
  const existing = items.find(i => i.id === id && i.tabela === tabela);
  if (existing) {
    existing.ts = Date.now();
  } else {
    items.push({ id, tabela, ts: Date.now() });
  }
  // Cap de segurança (DoS local / storage overflow)
  const MAX_TOMBSTONES = 2000;
  saveDeletedItems(items.slice(-MAX_TOMBSTONES));
}

function touchDeletedItem(id, tabela) {
  addDeletedItem(id, tabela);
}

function isDeletedItem(id, tabela) {
  if (!id) return false;
  return pruneDeletedItems(getDeletedItems()).some(i => i.id === id && (!tabela || i.tabela === tabela));
}

/** Tombstones expiram após 30 dias (ISO / práticas de sync offline). */
function pruneDeletedItems(items) {
  const TTL = 30 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  return (items || []).filter(i => i && i.id && (now - (i.ts || 0)) < TTL);
}

function removeDeletedItem(id, tabela) {
  // Remoção explícita apenas em cenários de undelete administrativo.
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
  q = (q || []).map(function (op) {
    if (!op || typeof op !== 'object') return op;
    var copy = Object.assign({}, op);
    if (copy.payload) copy.payload = slimPayload(copy.payload);
    return copy;
  });
  try {
    var str = JSON.stringify(q);
    if (typeof LS_WARN_BYTES !== 'undefined' && str.length > LS_WARN_BYTES) {
      try { console.warn('[sync] Fila > 4.5MB (' + str.length + ' bytes). A comprimir payloads.'); } catch (_) {}
      q = q.map(function (op) {
        if (!op) return op;
        var o = Object.assign({}, op);
        o.payload = slimPayload(o.payload);
        if (o.payload && typeof o.payload === 'object') {
          var p = Object.assign({}, o.payload);
          delete p.itens;
          delete p.notas;
          o.payload = p;
        }
        return o;
      });
      str = JSON.stringify(q);
    }
    if (typeof storageSetSecure === 'function') storageSetSecure(SYNC_QUEUE_KEY, str);
    else localStorage.setItem(SYNC_QUEUE_KEY, str);
    try { sessionStorage.setItem(SYNC_QUEUE_KEY + '_len', String((q && q.length) || 0)); } catch (_) {}
  } catch (e) {
    if (typeof logErroSilencioso === 'function') logErroSilencioso('saveSyncQueue', e);
    try {
      var minimal = (q || []).map(function (op) {
        return {
          id: op && op.id,
          tabela: op && op.tabela,
          operacao: op && op.operacao,
          ts: op && op.ts,
          attempts: op && op.attempts,
          failed: op && op.failed,
          nextRetry: op && op.nextRetry,
          lastError: op && op.lastError,
          payload: slimPayload(op && op.payload ? { id: op.payload.id } : null)
        };
      });
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(minimal));
    } catch (e2) {
      if (typeof logErroSilencioso === 'function') logErroSilencioso('saveSyncQueue.fallback', e2);
      if (typeof toast === 'function') {
        toast('Armazenamento do dispositivo quase cheio. Liberte espaço — a fila tem ' + ((q && q.length) || 0) + ' ops.', 'warning');
      }
    }
  }
}


function actualizarBannerOffline() {
  // Banner topo continua desactivado (relatório: não intrusivo permanente).
  const banner = document.getElementById('offline-banner');
  if (banner) {
    banner.classList.remove('show');
    banner.style.display = 'none';
    banner.setAttribute('aria-hidden', 'true');
  }
  // ET4.10: aviso offline centrado, uma vez por sessão, CTA Entendi.
  try {
    if (typeof bpMaybeShowOfflineInfoModal === 'function') bpMaybeShowOfflineInfoModal();
  } catch (_) {}
}

/** Offline info modal — centro, obrigatório ler, depois desaparece (sessionStorage). */
function bpMaybeShowOfflineInfoModal() {
  try {
    if (typeof navigator === 'undefined' || navigator.onLine) return;
    if (sessionStorage.getItem('bp_offline_info_ack') === '1') return;
    var modal = document.getElementById('modal-offline-info');
    if (!modal) return;
    if (modal.classList.contains('open')) return;
    modal.hidden = false;
    if (typeof openModal === 'function') openModal('modal-offline-info');
    else {
      modal.classList.add('open');
      modal.style.display = 'flex';
    }
  } catch (_) {}
}

function bpAckOfflineInfoModal() {
  try { sessionStorage.setItem('bp_offline_info_ack', '1'); } catch (_) {}
  try {
    if (typeof closeModal === 'function') closeModal('modal-offline-info');
    else {
      var modal = document.getElementById('modal-offline-info');
      if (modal) {
        modal.classList.remove('open');
        modal.style.display = 'none';
        modal.hidden = true;
      }
    }
  } catch (_) {}
}

if (typeof window !== 'undefined') {
  window.bpMaybeShowOfflineInfoModal = bpMaybeShowOfflineInfoModal;
  window.bpAckOfflineInfoModal = bpAckOfflineInfoModal;
}

(function bpBindOfflineInfoModal() {
  function bind() {
    var ok = document.getElementById('modal-offline-info-ok');
    if (!ok || ok.dataset.bpBound) return;
    ok.dataset.bpBound = '1';
    ok.addEventListener('click', function () {
      if (typeof bpAckOfflineInfoModal === 'function') bpAckOfflineInfoModal();
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
  // Uma vez por sessão de separador: se ainda não leu, mostra ao ficar offline.
  window.addEventListener('offline', function () {
    setTimeout(function () {
      if (typeof bpMaybeShowOfflineInfoModal === 'function') bpMaybeShowOfflineInfoModal();
    }, 200);
  });
  // Arranque já offline
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(function () {
        if (typeof actualizarBannerOffline === 'function') actualizarBannerOffline();
      }, 400);
    });
  } else {
    setTimeout(function () {
      if (typeof actualizarBannerOffline === 'function') actualizarBannerOffline();
    }, 400);
  }
})();


function atualizarIndicadorSync() {
  const text = document.getElementById('sync-text');
  const container = document.getElementById('sync-status-container');
  const fila = (typeof getSyncQueue === 'function') ? getSyncQueue() : [];
  const now = Date.now();
  const ready = fila.filter(function (op) {
    return op && op.failed !== true && (!op.nextRetry || op.nextRetry <= now);
  }).length;
  const backoff = fila.filter(function (op) {
    return op && op.failed !== true && op.nextRetry && op.nextRetry > now;
  }).length;
  const pendentes = ready + backoff;
  const falhados = fila.filter(function (op) { return op && op.failed === true; }).length;
  const dlqN = (typeof bpGetDlqCount === 'function') ? bpGetDlqCount() : 0;
  const offline = (typeof navigator !== 'undefined' && !navigator.onLine);

  let stateKey = 'ok';
  let label = '';
  if (offline) {
    stateKey = 'offline';
    label = pendentes > 0 ? ('Sem rede · ' + pendentes + ' pend.') : 'Sem rede';
  } else if (pendentes > 0) {
    stateKey = 'pending';
    if (backoff > 0 && ready === 0) {
      label = pendentes + ' em espera';
    } else {
      label = pendentes === 1 ? '1 pendente' : (pendentes + ' pendentes');
    }
  } else if (dlqN > 0 || falhados > 0) {
    stateKey = 'error';
    var nFail = dlqN + falhados;
    label = nFail === 1 ? '1 falhada' : (nFail + ' falhadas');
  } else if (typeof bpGetServiceHealth === 'function') {
    try {
      var health = bpGetServiceHealth();
      if (typeof bpNotifyHealthIfNeeded === 'function') bpNotifyHealthIfNeeded(health);
    } catch (_) {}
  }

  const show = stateKey !== 'ok';
  if (text) text.textContent = label;
  if (container) {
    container.classList.toggle('is-visible', show);
    container.style.display = show ? 'flex' : 'none';
    container.setAttribute('data-state', stateKey);
    container.setAttribute('aria-hidden', show ? 'false' : 'true');
    if (show) container.setAttribute('title', label);
    else container.removeAttribute('title');
  }
  // Evento único para outros módulos (sem DOM scraping)
  try {
    window.dispatchEvent(new CustomEvent('bp:sync-state', { detail: { state: stateKey, pendentes: pendentes, falhados: falhados, offline: offline } }));
  } catch (_) {}

  if (typeof actualizarBannerOffline === 'function') actualizarBannerOffline();
}

/** Alias estável — única API pública de UI de sync */
function setSyncUi() { atualizarIndicadorSync(); }
if (typeof window !== 'undefined') {
  window.setSyncUi = setSyncUi;
  window.atualizarIndicadorSync = atualizarIndicadorSync;
}

function addToSyncQueue(tabela, operacao, payload) {
  payload = slimPayload(payload);
  var entityId = payload && payload.id;
  if (operacao !== 'delete' && entityId && typeof isDeletedItem === 'function' && isDeletedItem(entityId, tabela)) {
    try { console.info('[sync] upsert ignorado — tombstone activo', tabela, entityId); } catch (_) {}
    return;
  }
  var q = getSyncQueue();
  if (entityId) {
    var hasDelete = q.some(function (item) {
      return item && item.tabela === tabela && item.operacao === 'delete' &&
        item.payload && item.payload.id === entityId;
    });
    if (hasDelete && operacao !== 'delete') {
      try { console.info('[sync] upsert ignorado — delete já na fila', tabela, entityId); } catch (_) {}
      return;
    }
    q = q.filter(function (item) {
      return !(item && item.tabela === tabela && item.payload && item.payload.id === entityId);
    });
  }
  if (typeof QUEUE_HARD_BLOCK !== 'undefined' && q.length >= QUEUE_HARD_BLOCK) {
    if (typeof toast === 'function') {
      toast('Fila de sincronização demasiado grande. Aguarde a sincronização antes de novas alterações.', 'error');
    }
    try { console.error('[sync] Fila >= HARD_BLOCK — bloqueio de novas ops'); } catch (_) {}
    if (navigator.onLine && typeof flushSyncQueue === 'function') {
      try { flushSyncQueue(); } catch (_) {}
    }
    return;
  }
  if (typeof QUEUE_SOFT_WARN !== 'undefined' && q.length >= QUEUE_SOFT_WARN) {
    try { console.warn('[sync] Fila grande:', q.length, 'ops'); } catch (_) {}
  }
  q.push({
    id: typeof uuid === 'function' ? uuid() : String(Date.now()) + '-' + Math.random().toString(36).slice(2, 8),
    tabela: tabela,
    operacao: operacao,
    payload: payload,
    ts: Date.now(),
    attempts: 0,
    failed: false,
    nextRetry: 0,
    lastError: null
  });
  saveSyncQueue(q);
  if (typeof atualizarIndicadorSync === 'function') atualizarIndicadorSync();
}


async function flushSyncQueue() {
  if (!navigator.onLine) return flushSyncQueue._lastPromise || Promise.resolve();
  if (flushSyncQueue._promise) return flushSyncQueue._promise;
  flushSyncQueue._promise = (async function flushInternal() {
    const BATCH_SIZE = 25;
    const YIELD_MS = 30;
    const MAX_ATTEMPTS = (typeof MAX_SYNC_ATTEMPTS !== 'undefined') ? MAX_SYNC_ATTEMPTS : 5;
    try {
      let q = getSyncQueue();
      if (!q.length) return;

      // Se só há backoff: após 30s no backoff, forçar ready (P1)
      var now = Date.now();
      var hasReady = q.some(function (op) {
        return op && op.failed !== true && (!op.nextRetry || op.nextRetry <= now);
      });
      if (!hasReady) {
        var inBackoff = q.filter(function (op) {
          return op && op.failed !== true && op.nextRetry && op.nextRetry > now;
        });
        if (inBackoff.length) {
          inBackoff.forEach(function (op) {
            var waited = now - (op.nextRetry - (op._backoffSpan || 0));
            // Se nextRetry está no futuro há >30s desde a última falha, promover
            if (op.nextRetry - now < 0) return;
            var age = now - (op.tsLastFail || op.ts || 0);
            if (age >= 30000 || (op.nextRetry - now) > 30000) {
              op.nextRetry = 0;
            }
          });
          // Promoção mais simples e fiável: se o flush é pedido e o backoff mais antigo > 30s
          var minRetry = Math.min.apply(null, inBackoff.map(function (op) { return op.nextRetry || 0; }));
          if (minRetry && (now - (minRetry - 60000)) >= 0) {
            // se qualquer nextRetry já passou de 30s de atraso máximo, zerar todos os ready-stuck
          }
          var oldestFail = Math.min.apply(null, inBackoff.map(function (op) { return op.tsLastFail || op.ts || now; }));
          if (now - oldestFail >= 30000) {
            inBackoff.forEach(function (op) { op.nextRetry = 0; });
            saveSyncQueue(q);
            q = getSyncQueue();
          }
        }
      }

      const itensFalhos = [];
      let processed = 0;
      let interrompido = false;
      let sessionExpired = false;

      while (q.length && navigator.onLine && !interrompido && !sessionExpired) {
        const batch = [];
        const defer = [];
        now = Date.now();
        for (let i = 0; i < q.length; i++) {
          const op = q[i];
          if (!op) continue;
          if (op.failed === true) {
            // failed legado → DLQ
            moveOpToDlq(op, op.lastError || 'failed_flag');
            continue;
          }
          if (op.nextRetry && now < op.nextRetry) {
            defer.push(op);
            continue;
          }
          if (batch.length < BATCH_SIZE) batch.push(op);
          else defer.push(op);
        }

        if (!batch.length) {
          saveSyncQueue(defer);
          break;
        }

        const restantesBatch = [];
        for (let i = 0; i < batch.length; i++) {
          if (!navigator.onLine) {
            interrompido = true;
            restantesBatch.push.apply(restantesBatch, batch.slice(i));
            break;
          }
          const op = batch[i];
          try {
            if (op.operacao === 'delete') {
              await supabaseDelete(op.tabela, op.payload.id);
              if (typeof removeDeletedItem === 'function') {
                removeDeletedItem(op.payload.id, op.tabela);
              }
            } else {
              if (typeof isDeletedItem === 'function' && isDeletedItem(op.payload && op.payload.id, op.tabela)) {
                processed++;
                continue;
              }
              const payload = op.payload || {};
              const isDeact = payload.ativo === false || payload.ativo === 0 || payload.ativo === 'false';
              if (isDeact && (op.tabela === 'profissionais' || op.tabela === 'servicos') && typeof supabaseDeactivate === 'function') {
                await supabaseDeactivate(op.tabela, payload.id, {
                  data_desativacao: payload.data_desativacao || null,
                  updated_at: payload.updated_at || new Date().toISOString()
                });
              } else {
                await supabaseUpsert(op.tabela, slimPayload(op.payload));
              }
            }
            processed++;
          } catch (err) {
            var msg = (err && err.message) ? String(err.message) : String(err || '');
            op.lastError = msg.slice(0, 300);
            op.tsLastFail = Date.now();

            if (msg === 'SESSION_EXPIRED') {
              sessionExpired = true;
              restantesBatch.push(op);
              restantesBatch.push.apply(restantesBatch, batch.slice(i + 1));
              break;
            }
            if (msg === 'LIMITE_PLANO_ATINGIDO') {
              if (typeof toast === 'function') toast('Operação bloqueada: limite do plano atingido. Fica na fila até o plano permitir.', 'error');
              op.failed = false;
              op.attempts = (op.attempts || 0) + 1;
              var d1 = Math.min(300000, 60000 + (op.attempts * 15000));
              op.nextRetry = Date.now() + d1 + Math.random() * 1000;
              op._backoffSpan = d1;
              restantesBatch.push(op);
              continue;
            }
            if (msg === 'DUPLICADO_BLOQUEADO' || msg.indexOf('DUPLICADO') >= 0) {
              if (typeof logErroSilencioso === 'function') logErroSilencioso('flushSyncQueue.duplicado', err);
              moveOpToDlq(op, msg);
              itensFalhos.push(op.id || 'item');
              continue;
            }

            op.attempts = (op.attempts || 0) + 1;
            op.failed = false;
            if (op.attempts >= MAX_ATTEMPTS) {
              moveOpToDlq(op, msg);
              itensFalhos.push(op.id || 'item');
              continue;
            }
            var delay = Math.min(60000, Math.pow(2, Math.min(op.attempts, 6)) * 1000) + Math.random() * 1000;
            op.nextRetry = Date.now() + delay;
            op._backoffSpan = delay;
            restantesBatch.push(op);
          }
        }

        q = restantesBatch.concat(defer);
        saveSyncQueue(q);
        if (typeof atualizarIndicadorSync === 'function') atualizarIndicadorSync();
        await new Promise(function (r) { setTimeout(r, YIELD_MS); });
      }

      if (sessionExpired) {
        if (typeof toast === 'function') toast('Sessão expirada. Faça login novamente.', 'error');
        try {
          if (typeof supabaseClient !== 'undefined' && supabaseClient.auth && supabaseClient.auth.signOut) {
            await supabaseClient.auth.signOut();
          }
        } catch (_) {}
        try {
          if (typeof bpClearSessionLocal === 'function') bpClearSessionLocal();
        } catch (_) {}
        try {
          if (typeof bpShowLoginShell === 'function') bpShowLoginShell();
          else {
            var lv = document.getElementById('login-view');
            var av = document.getElementById('app-view');
            if (lv) lv.style.display = 'flex';
            if (av) av.style.display = 'none';
          }
        } catch (_) {}
      }

      if (itensFalhos.length > 0 && typeof toast === 'function') {
        toast('Algumas operações falharam repetidamente (' + itensFalhos.length + '). Veja «operações falhadas».', 'warning');
      }
      if (processed > 0) {
        try { console.info('[sync] flush processou', processed, 'ops; restam', getSyncQueue().length, 'dlq', getDlq().length); } catch (_) {}
      }
      if (typeof atualizarIndicadorSync === 'function') atualizarIndicadorSync();
      // Após sync de metadados, processar uploads de foto se existir
      if (typeof bpFlushFotoUploadQueue === 'function' && navigator.onLine) {
        try { await bpFlushFotoUploadQueue(); } catch (_) {}
      }
    } finally {
      flushSyncQueue._promise = null;
    }
  })();
  flushSyncQueue._lastPromise = flushSyncQueue._promise;
  return flushSyncQueue._promise;
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
  // ET4-P0-04: sem salaoId não há sync remoto (isolamento multi-tenant)
  if (!tabela || !state.config || !state.config.salaoId) {
    if (tabela && (!state.config || !state.config.salaoId)) {
      try { console.warn('[sync-queue] dbPut sem salaoId — apenas local:', store, item && item.id); } catch (_) {}
    }
    return item;
  }

  if (navigator.onLine) {
    try {
      await supabaseUpsert(tabela, slimPayload(item));
      const rest = getSyncQueue().filter(function (op) {
        return !(op.tabela === tabela && op.payload && op.payload.id === item.id);
      });
      if (rest.length !== getSyncQueue().length) saveSyncQueue(rest);
    } catch (err) {
      if (err.message === 'LIMITE_PLANO_ATINGIDO') {
        await _dbDeleteOriginal(store, item.id);
        throw err;
      }
      addToSyncQueue(tabela, 'upsert', item);
    }
  } else {
    addToSyncQueue(tabela, 'upsert', item);
  }
  if (typeof atualizarIndicadorSync === 'function') atualizarIndicadorSync();
  return item;
};

dbDelete = async function(store, id) {
  // Adiciona à lista negra ANTES de eliminar localmente
  const tabela = STORE_TO_TABLE[store];
  if (tabela) {
    addDeletedItem(id, tabela);
  }

  await _dbDeleteOriginal(store, id);

  // ET4.4: alinhado a dbPut — sem salaoId não há delete remoto
  if (!tabela || !state.config || !state.config.salaoId) {
    if (tabela) {
      try { console.warn('[sync-queue] dbDelete sem salaoId — apenas local:', store, id); } catch (_) {}
    }
    return;
  }
  if (navigator.onLine) {
    try { await supabaseDelete(tabela, id); }
    catch { addToSyncQueue(tabela, 'delete', { id }); }
  } else {
    addToSyncQueue(tabela, 'delete', { id });
  }
};

/** Contingência: reabrir ops failed e limpar backoff (nextRetry). */
async function bpRetryFailedSync() {
  const q = getSyncQueue();
  let changed = false;
  for (const op of q) {
    if (!op) continue;
    if (op.failed || op.nextRetry || (op.attempts && op.attempts > 0)) {
      op.failed = false;
      op.attempts = 0;
      op.nextRetry = 0;
      op.tsLastFail = 0;
      changed = true;
    }
  }
  if (changed) saveSyncQueue(q);
  if (typeof flushSyncQueue === 'function') await flushSyncQueue();
  if (typeof atualizarIndicadorSync === 'function') atualizarIndicadorSync();
}

/** Reprocessar DLQ → fila principal (após utilizador corrigir causa). */
async function bpReprocessDlq() {
  var dlq = getDlq();
  if (!dlq.length) {
    if (typeof toast === 'function') toast('Não há operações falhadas.', 'info');
    return;
  }
  var q = getSyncQueue();
  dlq.forEach(function (item) {
    q.push({
      id: item.id || (typeof uuid === 'function' ? uuid() : String(Date.now())),
      tabela: item.tabela,
      operacao: item.operacao,
      payload: slimPayload(item.payload),
      ts: Date.now(),
      attempts: 0,
      failed: false,
      nextRetry: 0,
      lastError: null
    });
  });
  saveSyncQueue(q);
  saveDlq([]);
  if (typeof toast === 'function') toast('A reprocessar ' + dlq.length + ' operação(ões) falhada(s)…', 'info');
  if (typeof flushSyncQueue === 'function') await flushSyncQueue();
  if (typeof atualizarIndicadorSync === 'function') atualizarIndicadorSync();
}
if (typeof window !== 'undefined') window.bpReprocessDlq = bpReprocessDlq;

if (typeof window !== 'undefined') {
  window.bpRetryFailedSync = bpRetryFailedSync;
  // Toque no indicador: reabre tudo e faz flush
  (function bindSyncRetryClick() {
    function bind() {
      var el = document.getElementById('sync-status-container');
      if (!el || el.dataset.bpSyncRetryBound) return;
      el.dataset.bpSyncRetryBound = '1';
      el.style.cursor = 'pointer';
      el.setAttribute('role', 'button');
      el.title = 'Toque para sincronizar agora';
      el.addEventListener('contextmenu', function (ev) {
        ev.preventDefault();
        if (typeof bpOpenDlqModal === 'function') bpOpenDlqModal();
      });
      el.addEventListener('click', function () {
        if (!navigator.onLine) {
          if (typeof toast === 'function') toast('Sem ligação à internet neste momento. As alterações serão enviadas quando voltares a ter rede.', 'warning');
          return;
        }
        if (typeof toast === 'function') toast('A sincronizar alterações…', 'info');
        Promise.resolve()
          .then(function () { return bpRetryFailedSync(); })
          .then(function () {
            var rest = (typeof getSyncQueue === 'function') ? getSyncQueue().length : 0;
            var dlq = (typeof bpGetDlqCount === 'function') ? bpGetDlqCount() : 0;
            if (typeof toast === 'function') {
              if (rest === 0 && dlq === 0) toast('Tudo sincronizado.', 'success');
              else if (rest === 0 && dlq > 0) toast(dlq + ' operação(ões) falhada(s). Toque longo no indicador ou use «Reprocessar falhadas».', 'warning');
              else toast('Ainda restam ' + rest + ' operação(ões). Toque de novo ou verifique a ligação.', 'warning');
            }
          })
          .catch(function (e) {
            if (typeof logErroSilencioso === 'function') logErroSilencioso('syncRetryClick', e);
          });
      });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
    else bind();
    setTimeout(bind, 800);
  })();

  // Rede recuperada → limpar backoff e flush imediato
  window.addEventListener('online', function () {
    try { sessionStorage.removeItem('bp_offline_info_ack'); } catch (_) {}
    setTimeout(function () {
      if (typeof bpRetryFailedSync === 'function') bpRetryFailedSync();
    }, 600);
  });

  // App volta ao primeiro plano com rede → flush
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) return;
    if (!navigator.onLine) return;
    setTimeout(function () {
      if (typeof getSyncQueue === 'function' && getSyncQueue().length && typeof flushSyncQueue === 'function') {
        flushSyncQueue();
      }
    }, 400);
  });

  // Enquanto houver pendentes e rede, tentar de 25 em 25s (não só no evento online)
  setInterval(function () {
    if (!navigator.onLine) return;
    if (typeof getSyncQueue !== 'function') return;
    var q = getSyncQueue();
    if (!q || !q.length) return;
    if (typeof flushSyncQueue === 'function') flushSyncQueue();
  }, 25000);
}


function bpOpenDlqModal() {
  var dlq = getDlq();
  var body = '';
  if (!dlq.length) {
    body = '<p class="bp-dash-next-empty">Não há operações falhadas.</p>';
  } else {
    body = dlq.slice(-30).map(function (item) {
      return '<div class="bp-dash-lista-item"><div><div>' +
        (item.tabela || '') + ' · ' + (item.operacao || '') +
        '</div><div class="bp-dash-next-meta">' +
        String(item.error || '').slice(0, 120) +
        '</div></div></div>';
    }).join('');
  }
  var existing = document.getElementById('modal-sync-dlq');
  if (!existing) {
    var wrap = document.createElement('div');
    wrap.id = 'modal-sync-dlq';
    wrap.className = 'modal-overlay';
    wrap.setAttribute('role', 'dialog');
    wrap.innerHTML =
      '<div class="modal-sheet">' +
      '<div class="handle"></div>' +
      '<div class="modal-title">Operações falhadas</div>' +
      '<div id="modal-sync-dlq-body" class="bp-dash-lista-body"></div>' +
      '<button type="button" class="btn btn-primary btn-block" id="modal-sync-dlq-retry">Reprocessar falhadas</button>' +
      '<button type="button" class="btn btn-secondary btn-block mt-2" data-close="modal-sync-dlq">Fechar</button>' +
      '</div>';
    document.body.appendChild(wrap);
    wrap.addEventListener('click', function (e) {
      if (e.target === wrap || (e.target.getAttribute && e.target.getAttribute('data-close') === 'modal-sync-dlq')) {
        if (typeof closeModal === 'function') closeModal('modal-sync-dlq');
        else { wrap.classList.remove('open'); wrap.style.display = 'none'; }
      }
    });
    document.getElementById('modal-sync-dlq-retry').addEventListener('click', function () {
      if (typeof closeModal === 'function') closeModal('modal-sync-dlq');
      if (typeof bpReprocessDlq === 'function') bpReprocessDlq();
    });
  }
  var b = document.getElementById('modal-sync-dlq-body');
  if (b) b.innerHTML = body;
  if (typeof openModal === 'function') openModal('modal-sync-dlq');
  else {
    var m = document.getElementById('modal-sync-dlq');
    m.classList.add('open');
    m.style.display = 'flex';
  }
}
if (typeof window !== 'undefined') window.bpOpenDlqModal = bpOpenDlqModal;

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
//  TOLERÂNCIA: coluna foto_url pode ainda não existir no Supabase
//  null = desconhecido | true = confirmada | false = ausente no schema
// ====================================================================
let _bpSchemaFotoUrl = (function () {
  try {
    const v = localStorage.getItem('bp_schema_foto_url');
    if (v === '0') return false;
    if (v === '1') return true;
  } catch (_) {}
  return null;
})();

function _bpSetSchemaFotoUrl(ok) {
  _bpSchemaFotoUrl = !!ok;
  try { localStorage.setItem('bp_schema_foto_url', ok ? '1' : '0'); } catch (_) {}
}

function _bpIsFotoUrlSchemaError(msg) {
  const s = String(msg || '').toLowerCase();
  if (!s) return false;
  if (s.includes('foto_url')) return true;
  // PostgREST: PGRST204 — column not in schema cache
  if (s.includes('pgrst204')) return true;
  if (s.includes('schema cache') && s.includes('column')) return true;
  if (s.includes('could not find') && s.includes('column')) return true;
  if (s.includes('unexpected') && s.includes('foto')) return true;
  return false;
}


// ====================================================================
//  TOLERÂNCIA: colunas ausentes no schema (PGRST204) — strip + retry
// ====================================================================
function _bpExtractMissingColumn(msg) {
  var s = String(msg || '');
  var m = s.match(/Could not find the '([^']+)' column/i);
  if (m) return m[1];
  m = s.match(/column\s+"([^"]+)"\s+of\s+relation/i);
  if (m) return m[1];
  return null;
}

function _bpGetMissingCols(tabela) {
  try {
    var raw = localStorage.getItem('bp_schema_missing_' + tabela);
    if (!raw) return [];
    var arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (_) { return []; }
}

function _bpRememberMissingCol(tabela, col) {
  if (!tabela || !col) return;
  try {
    var arr = _bpGetMissingCols(tabela);
    if (arr.indexOf(col) < 0) {
      arr.push(col);
      localStorage.setItem('bp_schema_missing_' + tabela, JSON.stringify(arr));
    }
  } catch (_) {}
}

function _bpStripKnownMissing(tabela, payload) {
  if (!payload || typeof payload !== 'object') return payload;
  var cols = _bpGetMissingCols(tabela);
  if (!cols.length) return payload;
  var out = Object.assign({}, payload);
  cols.forEach(function (c) { delete out[c]; });
  return out;
}

function _bpStripFotoUrl(payload) {
  if (!payload || typeof payload !== 'object') return payload;
  const out = Object.assign({}, payload);
  delete out.foto_url;
  return out;
}

function _bpAttachFotoUrl(payload, item) {
  if (!payload || typeof payload !== 'object') return payload;
  if (_bpSchemaFotoUrl === false) return payload;
  // Só enviar quando há URL (evita forçar null em massa antes da coluna existir).
  // Para limpar foto no servidor: foto_url explicitamente '' ou null no item com flag.
  if (item && Object.prototype.hasOwnProperty.call(item, 'foto_url')) {
    payload.foto_url = item.foto_url || null;
  }
  return payload;
}

// ====================================================================
//  VALIDAÇÃO DE DUPLICADOS NO SUPABASE (consulta prévia)
// ====================================================================
async function existeRegistroDuplicado(tabela, nome, salaoId, idIgnorar = null) {
  try {
    const authHeaders = await getAuthHeaders();
    const url = `${SUPABASE_URL}/rest/v1/${tabela}?salao_id=eq.${encodeURIComponent(salaoId)}&select=id,nome&nome=ilike.${encodeURIComponent(nome)}`;
    const resp = await _bpRestFetch(url, { headers: authHeaders });
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


/** Transporte resilient — usa bpFetchSupabase se existir. */
async function _bpRestFetch(url, options, label) {
  if (typeof bpFetchSupabase === 'function') {
    return bpFetchSupabase(url, options || {}, { label: label || 'sync-rest', retries: 2, timeoutMs: 12000 });
  }
  return fetch(url, options || {});
}

async function supabaseUpsert(tabela, item) {
  try {
    const authHeaders = await getAuthHeaders();
    const salaoId = state.config.salaoId;
    if (!salaoId) throw new Error('Salão não identificado. Faça logout e login novamente.');

    // ================================================================
    // POLÍTICA FORTE: Verificar duplicados por nome antes de upsert
    // Aplica-se apenas a tabelas com campo 'nome' (profissionais, servicos, clientes)
    // ================================================================
    // Não bloquear por nome quando é desactivação (ativo=false) ou o id é o mesmo
    if (['profissionais', 'servicos', 'clientes'].includes(tabela) && item.nome && item.ativo !== false) {
      const existe = await existeRegistroDuplicado(tabela, item.nome, salaoId, item.id);
      if (existe) {
        console.warn(`[sync-rest] Upsert bloqueado: ${tabela} com nome "${item.nome}" já existe neste salão.`);
        throw new Error('DUPLICADO_BLOQUEADO');
      }
    }

    let payload = toSupabaseFormat(tabela, item);
    payload = _bpStripKnownMissing(tabela, payload);
    // Se já sabemos que a coluna não existe, nunca enviar foto_url
    if (_bpSchemaFotoUrl === false && payload && Object.prototype.hasOwnProperty.call(payload, 'foto_url')) {
      payload = _bpStripFotoUrl(payload);
    }

    async function postPayload(bodyObj) {
      const resp = await _bpRestFetch(`${SUPABASE_URL}/rest/v1/${tabela}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
          'Prefer': 'resolution=merge-duplicates',
        },
        body: JSON.stringify(bodyObj),
      });
      return resp;
    }

    let resp = await postPayload(payload);
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
      // Tolerância: coluna foto_url em falta → retry uma vez sem o campo
      const hadFotoUrl = payload && Object.prototype.hasOwnProperty.call(payload, 'foto_url');
      if (hadFotoUrl && _bpIsFotoUrlSchemaError(errorBody)) {
        console.warn('[sync-rest] Coluna foto_url indisponível no schema — a sincronizar sem ela. Execute SUPABASE_FOTOS.sql quando possível.');
        _bpSetSchemaFotoUrl(false);
        payload = _bpStripFotoUrl(payload);
        resp = await postPayload(payload);
        if (resp.status === 401) throw new Error('SESSION_EXPIRED');
        if (!resp.ok) {
          let errorBody2 = '';
          try { errorBody2 = await resp.text(); } catch (_) { errorBody2 = errorBody; }
          throw new Error(`Supabase upsert ${tabela}: ${resp.status} - ${errorBody2}`);
        }
        return;
      }
      throw new Error(`Supabase upsert ${tabela}: ${resp.status} - ${errorBody}`);
    }
    // Sucesso com foto_url → confirmar schema
    if (payload && Object.prototype.hasOwnProperty.call(payload, 'foto_url') && _bpSchemaFotoUrl !== true) {
      _bpSetSchemaFotoUrl(true);
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
    // Última rede de segurança: erro de schema no catch (rede/parse)
    if (_bpIsFotoUrlSchemaError(errorMsg) && item && (tabela === 'clientes' || tabela === 'profissionais')) {
      try {
        console.warn('[sync-rest] Retry de emergência sem foto_url após erro de schema.');
        _bpSetSchemaFotoUrl(false);
        const authHeaders2 = await getAuthHeaders();
        const payload2 = _bpStripFotoUrl(toSupabaseFormat(tabela, item));
        const resp2 = await _bpRestFetch(`${SUPABASE_URL}/rest/v1/${tabela}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders2,
            'Prefer': 'resolution=merge-duplicates',
          },
          body: JSON.stringify(payload2),
        });
        if (resp2.status === 401) throw new Error('SESSION_EXPIRED');
        if (resp2.ok) return;
      } catch (e2) {
        if (e2.message === 'SESSION_EXPIRED') throw e2;
      }
    }
    // PGRST204: coluna ausente — recordar, remover e reintentar uma vez
    var missingCol = _bpExtractMissingColumn(errorMsg);
    if (missingCol && item) {
      try {
        _bpRememberMissingCol(tabela, missingCol);
        console.warn('[sync-rest] Coluna ausente no schema: ' + tabela + '.' + missingCol + ' — a sincronizar sem ela.');
        var authHeaders3 = await getAuthHeaders();
        var payload3 = _bpStripKnownMissing(tabela, toSupabaseFormat(tabela, item));
        delete payload3[missingCol];
        var resp3 = await _bpRestFetch(`${SUPABASE_URL}/rest/v1/${tabela}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders3,
            'Prefer': 'resolution=merge-duplicates',
          },
          body: JSON.stringify(payload3),
        });
        if (resp3.status === 401) throw new Error('SESSION_EXPIRED');
        if (resp3.ok) return;
        // Pode faltar outra coluna — extrair e tentar mais uma vez
        var body3 = '';
        try { body3 = await resp3.text(); } catch (_) {}
        var missing2 = _bpExtractMissingColumn(body3);
        if (missing2) {
          _bpRememberMissingCol(tabela, missing2);
          delete payload3[missing2];
          var resp4 = await _bpRestFetch(`${SUPABASE_URL}/rest/v1/${tabela}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...authHeaders3,
              'Prefer': 'resolution=merge-duplicates',
            },
            body: JSON.stringify(payload3),
          });
          if (resp4.status === 401) throw new Error('SESSION_EXPIRED');
          if (resp4.ok) return;
        }
      } catch (e3) {
        if (e3 && e3.message === 'SESSION_EXPIRED') throw e3;
      }
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

    const resp = await _bpRestFetch(
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
    const checkResp = await _bpRestFetch(
      `${SUPABASE_URL}/rest/v1/${tabela}?id=eq.${encodeURIComponent(id)}&salao_id=eq.${encodeURIComponent(salaoId)}`,
      { headers: authHeaders }
    );
    if (checkResp.ok) {
      const data = await checkResp.json();
      if (data && data.length > 0) {
        throw new Error(`DELETE não eliminou o registo ${id} na tabela ${tabela}. RLS pode estar a bloquear a operação.`);
      }
    }
    return true;
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
    const resp = await _bpRestFetch(
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
    case 'movimentos': {
      // Nunca enviar cliente_id (PGRST204 histórico). R50 só se schema permitir.
      var mov = {
        id: item.id,
        salao_id: salaoId,
        tipo: item.tipo,
        descricao: item.descricao || '',
        valor: Math.round(item.valor || 0),
        cliente: item.cliente || 'Anónimo',
        profissional_id: isValidUUID(item.profissional_id) ? item.profissional_id : null,
        profissional: item.profissional || '',
        itens: item.itens || [],
        metodo_pagamento: item.metodoPagamento || item.metodo_pagamento || null,
        recibo_num: item.reciboNum || item.recibo_num || null,
        comissao_gerada: item.comissao_gerada != null ? Number(item.comissao_gerada) : null,
        data: item.data,
        hora: item.hora,
        updated_at: item.updated_at,
      };
      var missMov = _bpGetMissingCols('movimentos');
      function _okCol(c) { return missMov.indexOf(c) < 0; }
      if (_okCol('status')) mov.status = item.status || 'activo';
      if (_okCol('comissao_estornada') && item.comissao_estornada != null) mov.comissao_estornada = Number(item.comissao_estornada);
      if (_okCol('cancelado_em') && item.cancelado_em) mov.cancelado_em = item.cancelado_em;
      if (_okCol('cancelado_motivo') && item.cancelado_motivo) mov.cancelado_motivo = item.cancelado_motivo;
      return mov;
    }
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
      return _bpAttachFotoUrl({
        id: item.id,
        salao_id: salaoId,
        nome: item.nome || '',
        telefone: item.telefone || null,
        notas: item.notas || null,
        ultima_visita: item.ultimaVisita || null,
        total_visitas: item.visitas || 0,
        updated_at: item.updated_at,
      }, item);
    case 'profissionais':
      return _bpAttachFotoUrl({
        id: item.id,
        salao_id: salaoId,
        nome: item.nome || '',
        especialidade: item.especialidade || null,
        idade: item.idade != null ? Number(item.idade) : null,
        data_contratual: item.dataContratual || item.data_contratual || null,
        numero_bi: item.numeroBI || item.numero_bi || null,
        morada: item.morada || null,
        contacto: item.contacto || null,
        taxa_comissao: item.taxa_comissao != null ? Number(item.taxa_comissao) : (item.taxa != null ? Number(item.taxa) : 0),
        meta_mensal: item.meta_mensal != null ? Number(item.meta_mensal) : (item.meta != null ? Number(item.meta) : 0),
        ativo: item.ativo !== false && item.ativo !== 0 && item.ativo !== 'false',
        data_desativacao: item.data_desativacao || null,
        updated_at: item.updated_at,
      }, item);
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
        cliente_id:      row.cliente_id || null,
        profissional_id: row.profissional_id || null,
        profissional:    row.profissional || '',
        itens:           row.itens || [],
        metodoPagamento: row.metodo_pagamento,
        reciboNum:       row.recibo_num || row.reciboNum || null,
        comissao_gerada: row.comissao_gerada != null ? Number(row.comissao_gerada) : 0,
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
        foto_url:     row.foto_url || null,
        updated_at:   row.updated_at,
      };
    case 'profissionais':
      return {
        id:            row.id,
        nome:          row.nome,
        especialidade: row.especialidade || '',
        idade:         row.idade != null ? Number(row.idade) : null,
        dataContratual: row.data_contratual || row.dataContratual || '',
        numeroBI:      row.numero_bi || row.numeroBI || '',
        morada:        row.morada || '',
        contacto:      row.contacto || '',
        taxa_comissao: row.taxa_comissao != null ? Number(row.taxa_comissao) : 0,
        meta_mensal:   row.meta_mensal != null ? Number(row.meta_mensal) : 0,
        ativo:         row.ativo !== false && row.ativo !== 0 && row.ativo !== 'false',
        data_desativacao: row.data_desativacao || null,
        foto_url:      row.foto_url || null,
        // NÃO anular foto local — resolveFotoSrc usa foto data: depois foto_url
        updated_at:    row.updated_at,
      };
    case 'servicos':
      return {
        id:            row.id,
        nome:          row.nome,
        precoBase:     row.preco_base,
        profissionais: row.profissionais || [],
        ativo:         row.ativo !== false && row.ativo !== 0,
        updated_at:    row.updated_at,
      };
    default:
      return row;
  }
}

// ====================================================================
//  CARREGAMENTO DO SUPABASE COM MERGE CAMPO A CAMPO (ROBUSTO)
// ====================================================================

/** Soft-delete remoto garantido: PATCH ativo=false + verificação GET. */
async function supabaseDeactivate(tabela, id, extra) {
  const authHeaders = await getAuthHeaders();
  const salaoId = state.config.salaoId;
  if (!salaoId) throw new Error('Salão não identificado. Faça logout e login novamente.');
  const body = Object.assign({
    ativo: false,
    updated_at: new Date().toISOString()
  }, extra || {});
  if (tabela === 'profissionais' && !body.data_desativacao) {
    body.data_desativacao = new Date().toISOString();
  }
  const resp = await _bpRestFetch(
    `${SUPABASE_URL}/rest/v1/${tabela}?id=eq.${encodeURIComponent(id)}&salao_id=eq.${encodeURIComponent(salaoId)}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(body)
    }
  );
  if (resp.status === 401) throw new Error('SESSION_EXPIRED');
  if (!resp.ok) {
    let errorBody = '';
    try { errorBody = await resp.text(); } catch (_) { errorBody = ''; }
    throw new Error(`Supabase deactivate ${tabela}: ${resp.status} - ${errorBody}`);
  }
  // Verificar
  const check = await _bpRestFetch(
    `${SUPABASE_URL}/rest/v1/${tabela}?id=eq.${encodeURIComponent(id)}&salao_id=eq.${encodeURIComponent(salaoId)}&select=id,ativo`,
    { headers: authHeaders }
  );
  if (check.ok) {
    const rows = await check.json();
    if (rows && rows[0] && rows[0].ativo !== false && rows[0].ativo !== 0) {
      throw new Error(`Deactivate não aplicou ativo=false em ${tabela}/${id}`);
    }
  }
  return true;
}

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
          .filter(i => i && i.tabela === tabela && i.id)
          .filter(i => {
            // respeitar TTL 30d se prune disponível
            if (typeof pruneDeletedItems === 'function') return true;
            return true;
          })
          .map(i => i.id)
      );
      // Aplicar prune global periodicamente
      if (typeof pruneDeletedItems === 'function' && typeof saveDeletedItems === 'function') {
        try { saveDeletedItems(pruneDeletedItems(getDeletedItems())); } catch (_) {}
      }

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
        // Foto: nunca perder data URL local se o remoto só trouxe foto_url (ou null)
        if (maisAntigo && typeof maisAntigo.foto === 'string' && maisAntigo.foto.indexOf('data:') === 0) {
          if (!merged.foto || merged.foto === null) merged.foto = maisAntigo.foto;
        }
        if (maisAntigo && maisAntigo.foto_url && !merged.foto_url) {
          merged.foto_url = maisAntigo.foto_url;
        }
        return merged;
      };

      const resultado = [];
      const itensParaSync = [];

      for (const remoto of itensRemotos) {
        // Ignorar itens com delete pendente ou na lista negra
        if (deletedIds.has(remoto.id) || idsComDeletePendente.has(remoto.id)) {
          // Remoto ainda existe mas foi apagado localmente → reforçar DELETE na fila
          if (deletedIds.has(remoto.id) && !idsComDeletePendente.has(remoto.id) && typeof addToSyncQueue === 'function') {
            try { addToSyncQueue(tabela, 'delete', { id: remoto.id }); } catch (_) {}
          }
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
          // Remoto inactivo: manter no estado (histórico) mas listas filtram
          resultado.push(remoto);
        } else {
          // Contingência: se qualquer lado está inactivo, o resultado fica inactivo
          const localInactivo = local.ativo === false || local.ativo === 0 || local.ativo === 'false';
          const remotoInactivo = remoto.ativo === false || remoto.ativo === 0 || remoto.ativo === 'false';
          if (localInactivo || remotoInactivo) {
            const base = localInactivo ? { ...remoto, ...local } : { ...local, ...remoto };
            base.ativo = false;
            if (local.data_desativacao || remoto.data_desativacao) {
              base.data_desativacao = local.data_desativacao || remoto.data_desativacao;
            }
            // updated_at o mais recente
            const lt = local.updated_at || '';
            const rt = remoto.updated_at || '';
            base.updated_at = lt > rt ? lt : rt;
            resultado.push(base);
            // Se remoto ainda activo, forçar PATCH no próximo flush
            if (!remotoInactivo && typeof addToSyncQueue === 'function') {
              try { addToSyncQueue(tabela, 'upsert', base); } catch (_) {}
            }
            mapLocal.delete(remoto.id);
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
        // Último caso: só local, sem fila, não recente → NÃO reintroduzir nem re-upsert
        // (evita ressurreição de deletes e lixo offline)
        continue;
      }

      return resultado;
    };

    const mergedClientes = mergeTable(state.clientes, clientesRemotos, 'clientes');
    const mergedAgendamentos = mergeTable(state.agendamentos, agendamentosRemotos, 'agendamentos');
    const mergedMovimentos = mergeTable(state.movimentos, movimentosRemotos, 'movimentos');
    const mergedProfissionais = mergeTable(state.profissionais, profsRemotos, 'profissionais');
    const mergedServicos = mergeTable(state.servicos, servicosRemotos, 'servicos');
    if (window.BeautyStore && window.BeautyStore.setList) {
      const applyLists = function () {
        window.BeautyStore.setList('clientes', mergedClientes);
        window.BeautyStore.setList('agendamentos', mergedAgendamentos);
        window.BeautyStore.setList('movimentos', mergedMovimentos);
        window.BeautyStore.setList('profissionais', mergedProfissionais);
        window.BeautyStore.setList('servicos', mergedServicos);
      };
      if (window.BeautyStore.batch) window.BeautyStore.batch(applyLists);
      else applyLists();
    } else {
      state.clientes = mergedClientes;
      state.agendamentos = mergedAgendamentos;
      state.movimentos = mergedMovimentos;
      state.profissionais = mergedProfissionais;
      state.servicos = mergedServicos;
    }

    // Fingerprint antes/depois para evitar updateUI sem mudanças
    const fpBefore = window._bpDataFp || '';
    const fpAfter = [
      (state.clientes||[]).length,
      (state.agendamentos||[]).length,
      (state.movimentos||[]).length,
      (state.profissionais||[]).map(p => p.id+':'+(p.ativo===false?'0':'1')).join(','),
      (state.servicos||[]).map(s => s.id+':'+(s.ativo===false?'0':'1')).join(',')
    ].join('|');

    for (const c of state.clientes)      await dbPutLocal('clientes',      c);
    for (const a of state.agendamentos)  await dbPutLocal('agendamentos',  a);
    for (const m of state.movimentos)    await dbPutLocal('movimentos',    m);
    // ET4.5: após pull, alinhar sequência de recibos ao max local/remoto
    try { if (typeof bpSyncReciboCounter === 'function') await bpSyncReciboCounter(); } catch (_) {}
    for (const p of state.profissionais) await dbPutLocal('profissionais', p);
    for (const s of state.servicos)      await dbPutLocal('servicos',      s);

    /* Plano em tempo quase real: salao_config NÃO estava no pull periódico.
       Sem isto, state.config.plano só mudava no login/reload. */
    var planoAntes = state.config && state.config.plano;
    try {
      if (typeof sincronizarConfigDoServidor === 'function') {
        await sincronizarConfigDoServidor();
      }
    } catch (eCfg) {
      try { console.warn('[carregarDoSupabase] salao_config', eCfg && eCfg.message); } catch (_) {}
    }
    var planoMudou = !!(state.config && state.config.plano !== planoAntes);
    if (planoMudou) {
      try { if (typeof renderPlanoInfo === 'function') renderPlanoInfo(); } catch (_) {}
      try { if (typeof aplicarPermissoes === 'function') aplicarPermissoes(); } catch (_) {}
    }

    window._bpDataFp = fpAfter + '|plano:' + String((state.config && state.config.plano) || '');
    return (fpAfter !== fpBefore) || planoMudou;
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
      // ET4-P1-05: contar apenas ativos (soft-delete não consome limite)
      if (typeof getProfissionaisAtivos === 'function') {
        total = getProfissionaisAtivos().length;
      } else {
        total = (state.profissionais || []).filter(function (p) {
          return p && p.ativo !== false && p.ativo !== 0 && p.ativo !== 'false';
        }).length;
      }
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
  const el = document.getElementById('upgrade-mensagem');
  if (el) el.textContent = mensagem;
  openModal('modal-upgrade');
}

/** Copia texto para a área de transferência com fallback para ambientes sem Clipboard API. */
async function copiarTextoSeguro(texto) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
  } catch (_) { /* continua para fallback */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = texto;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return !!ok;
  } catch (_) {
    return false;
  }
}

/**
 * Abre WhatsApp com mensagem pré-preenchida.
 * Se popup for bloqueado ou falhar, copia a mensagem e informa via toast.
 * @returns {Promise<{ok: boolean, metodo: 'window'|'clipboard'|'manual'}>}
 */
async function abrirWhatsAppVenda(mensagem) {
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensagem)}`;
  let win = null;
  try {
    win = window.open(url, '_blank', 'noopener,noreferrer');
  } catch (_) { /* ignore */ }

  if (!win || win.closed) {
    const copiado = await copiarTextoSeguro(mensagem);
    if (copiado) {
      if (typeof toast === 'function') {
        toast('Não foi possível abrir o WhatsApp. Mensagem copiada — cole na conversa.', 'warning');
      }
      return { ok: true, metodo: 'clipboard' };
    }
    if (typeof toast === 'function') {
      toast('Abra o WhatsApp e envie a mensagem de adesão manualmente.', 'error');
    }
    return { ok: false, metodo: 'manual' };
  }
  return { ok: true, metodo: 'window' };
}

async function upgradePara(plano) {
  if (!plano) {
    if (typeof toast === 'function') toast('Plano inválido', 'error');
    return;
  }
  const salao = (typeof state !== 'undefined' && state.config && state.config.storeName) ? state.config.storeName : '—';
  const actual = (typeof getPlanoAtual === 'function') ? getPlanoAtual() : '—';
  const msg =
    `Olá, quero assinar o plano ${plano} do BeautyPro. Salão: ${salao} | Plano actual: ${actual}`;
  await abrirWhatsAppVenda(msg);
  closeModal('modal-upgrade');
}

/** Liga os botões data-upgrade-plano (CSP-safe; sem onclick inline). */
function bindUpgradeButtons() {
  document.querySelectorAll('[data-upgrade-plano]').forEach((btn) => {
    if (btn.dataset.bpUpgradeBound) return;
    btn.dataset.bpUpgradeBound = '1';
    btn.addEventListener('click', () => {
      const plano = btn.getAttribute('data-upgrade-plano');
      if (plano) upgradePara(plano);
    });
  });

  const contato = document.getElementById('modal-upgrade-contato');
  if (contato && !contato.dataset.bpUpgradeBound) {
    contato.dataset.bpUpgradeBound = '1';
    contato.addEventListener('click', async () => {
      const salao = (typeof state !== 'undefined' && state.config && state.config.storeName) ? state.config.storeName : '—';
      const actual = (typeof getPlanoAtual === 'function') ? getPlanoAtual() : '—';
      const msg =
        `Olá, quero assinar um plano do BeautyPro. Salão: ${salao} | Plano actual: ${actual}`;
      await abrirWhatsAppVenda(msg);
      closeModal('modal-upgrade');
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bindUpgradeButtons);
} else {
  bindUpgradeButtons();
}

// API pública (chamadas programáticas / compatibilidade)
window.upgradePara = upgradePara;
window.abrirWhatsAppVenda = abrirWhatsAppVenda;

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
  state.config.plano = plano ? plano.value : (function () {
    try {
      var sid = null;
      try {
        var row = (configs || []).find(function (c) { return c && (c.key === 'salaoId' || c.id === 'salaoId'); });
        sid = row && row.value;
      } catch (_) {}
      if (!sid) {
        try { sid = localStorage.getItem('bp_salao_id_cache'); } catch (_) {}
      }
      if (sid) {
        var ns = localStorage.getItem('bp_plano_cache_' + sid);
        if (ns) return ns;
      }
      // legacy fallback só se ainda existir
      return localStorage.getItem('bp_plano_cache') || 'trial';
    } catch (_) { return 'trial'; }
  })();
  state.config.trialInicio = trialInicio ? trialInicio.value : null;

  let clientes, agendamentos, movimentos, profs, servicos, fechos;
  if (trocouDeSalao) {
    var anteriorSalaoId = null;
    try {
      var _sidRow = (configs || []).find(function (c) { return c && (c.key === 'salaoId' || c.id === 'salaoId'); });
      anteriorSalaoId = _sidRow ? _sidRow.value : null;
    } catch (_) {}
    await Promise.all(['clientes', 'agendamentos', 'movimentos', 'profissionais', 'servicos', 'fechos_caixa'].map(dbClear));
    localStorage.removeItem(SYNC_QUEUE_KEY);
    try { localStorage.removeItem('bp_deleted_items'); } catch (_) {}
    // Isolamento multi-tenant: plano, contadores IA, histórico do salão anterior
    try {
      localStorage.removeItem('bp_plano_cache');
      if (anteriorSalaoId) {
        localStorage.removeItem('bp_plano_cache_' + anteriorSalaoId);
        localStorage.removeItem('bp_ia_historico_' + anteriorSalaoId);
        localStorage.removeItem('bp_ia_chat_' + anteriorSalaoId);
        var _rm = [];
        for (var _i = 0; _i < localStorage.length; _i++) {
          var _k = localStorage.key(_i);
          if (_k && _k.indexOf('ia_perguntas_' + anteriorSalaoId + '_') === 0) _rm.push(_k);
        }
        _rm.forEach(function (k) { try { localStorage.removeItem(k); } catch (_) {} });
      } else {
        // Sem id anterior: limpar todos os namespaces de plano/IA conhecidos
        var _rm2 = [];
        for (var _j = 0; _j < localStorage.length; _j++) {
          var _k2 = localStorage.key(_j);
          if (_k2 && (
            _k2.indexOf('bp_plano_cache_') === 0 ||
            _k2.indexOf('bp_ia_historico_') === 0 ||
            _k2.indexOf('bp_ia_chat_') === 0 ||
            _k2.indexOf('ia_perguntas_') === 0
          )) _rm2.push(_k2);
        }
        _rm2.forEach(function (k) { try { localStorage.removeItem(k); } catch (_) {} });
      }
    } catch (_) {}
    try {
      if (typeof window !== 'undefined') {
        if (typeof iaHistorico !== 'undefined') iaHistorico = [];
        window.iaHistorico = [];
      }
    } catch (_) {}
    // Preferências e resíduos do salão anterior (P2)
    ['bp_filtro_clientes','bp_chart_periodo','bp_chart_offset','bp_chart_mostrar_valores',
     'bp_hist_periodo','bp_caixa_data_exata','bp_carrinho','bp_last_venda_id','bp_cart_items'].forEach(k => {
      try { localStorage.removeItem(k); } catch (_) {}
    });
    try {
      if (typeof clearCartStorageAll === 'function') clearCartStorageAll();
      else {
        for (var i = localStorage.length - 1; i >= 0; i--) {
          var ck = localStorage.key(i);
          if (ck && ck.indexOf('bp_cart_items') === 0) localStorage.removeItem(ck);
        }
      }
    } catch (_) {}
    try { sessionStorage.removeItem('bp_last_venda_id'); } catch (_) {}
    state.histPeriodo = 'hoje';
    state.filtroClientes = 'todos';
    state.chartPeriodo = 'semana';
    state.chartOffset = 0;
    clientes = []; agendamentos = []; movimentos = []; profs = []; servicos = []; fechos = [];
    // Purity: não herdar plano do IDB do salão anterior
    try {
      var _novoSid = state.config && state.config.salaoId;
      var _planoNovo = 'trial';
      if (_novoSid) {
        var _nsP = localStorage.getItem('bp_plano_cache_' + _novoSid);
        if (_nsP) _planoNovo = _nsP;
      }
      state.config.plano = _planoNovo;
      if (typeof dbPut === 'function') {
        Promise.resolve(dbPut('config', { id: 'plano', key: 'plano', value: _planoNovo })).catch(function () {});
      }
    } catch (_) {
      state.config.plano = 'trial';
    }
    try {
      if (typeof bpResetIaHistorico === 'function') bpResetIaHistorico();
      else {
        if (typeof iaHistorico !== 'undefined') iaHistorico = [];
        if (typeof window !== 'undefined') window.iaHistorico = [];
      }
      if (typeof carregarHistoricoIA === 'function') carregarHistoricoIA();
    } catch (_) {}
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
  try {
    if (typeof bpCheckExpiringAppointments === 'function') {
      setTimeout(function () { bpCheckExpiringAppointments(); }, 600);
    }
  } catch (_) {}
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
  try {
    if (state.config.plano && state.config.salaoId) {
      localStorage.setItem('bp_plano_cache_' + state.config.salaoId, state.config.plano);
    }
    localStorage.removeItem('bp_plano_cache');
  } catch (_) {}
  await dbPut('config', { id: 'trialInicio', key: 'trialInicio', value: state.config.trialInicio });
  if (state.config.salaoId) {
    await dbPut('config', { id: 'salaoId', key: 'salaoId', value: state.config.salaoId });
  }
}

// ====================================================================
//  HELPER — DELETE OPTIMISTA COM ROLLBACK
// ====================================================================
async function _deleteComRollback(tabela, id, nomeEntidade) {
  const lista = state[tabela] || [];
  const itemOriginal = lista.find(item => item.id === id);
  if (!itemOriginal) {
    toast((nomeEntidade || 'Registo') + ' não encontrado(a).', 'warning');
    return false;
  }

  // Serviços: preferir soft-delete remoto se hard DELETE falhar (FK/histórico)
  const trySoftServico = (tabela === 'servicos');

  await dbDelete(tabela, id);
  if (window.BeautyStore && window.BeautyStore.removeFromList) {
    window.BeautyStore.removeFromList(tabela, id);
  } else {
    state[tabela] = state[tabela].filter(item => item.id !== id);
  }
  updateUI();
  if (typeof renderBadges === 'function') renderBadges();

  if (navigator.onLine && state.config && state.config.salaoId) {
    try {
      if (typeof flushSyncQueue === 'function') await flushSyncQueue();
      // Contingência: se serviço e ainda existir no servidor, desactivar
      if (trySoftServico && typeof supabaseDeactivate === 'function') {
        try {
          // Se hard delete na fila falhou, PATCH ativo=false mantém histórico limpo na UI
          await supabaseDeactivate('servicos', id, { updated_at: new Date().toISOString() });
        } catch (_) {
          /* hard delete pode já ter removido — ignorar */
        }
      }
      if (typeof atualizarIndicadorSync === 'function') atualizarIndicadorSync();
      toast((nomeEntidade || 'Registo') + ' removido(a).', 'success');
      return true;
    } catch (e) {
      console.warn(`[delete ${tabela}] Falha ao sincronizar:`, e);
      if (trySoftServico && typeof addToSyncQueue === 'function') {
        const soft = Object.assign({}, itemOriginal, { ativo: false, updated_at: new Date().toISOString() });
        addToSyncQueue('servicos', 'upsert', soft);
      }
      toast((nomeEntidade || 'Registo') + ' removido(a) neste dispositivo. Será sincronizado quando houver rede.', 'warning');
      return true;
    }
  } else {
    toast((nomeEntidade || 'Registo') + ' removido(a) neste dispositivo. Será sincronizado quando houver rede.', 'warning');
    return true;
  }
}

// ====================================================================
//  CRUD — CLIENTE
// ====================================================================

// ====================================================================
//  FIDELIDADE — pontos e níveis (1 ponto / 1000 Kz)
// ====================================================================
var BP_PONTOS_POR_KZ = 1000;

function calcularPontosVenda(valor) {
  var v = Number(valor) || 0;
  if (v <= 0) return 0;
  return Math.floor(v / BP_PONTOS_POR_KZ);
}

function getClienteTier(pontos) {
  var p = Number(pontos) || 0;
  if (p >= 300) return { id: 'ouro', label: 'Ouro', min: 300 };
  if (p >= 100) return { id: 'prata', label: 'Prata', min: 100 };
  return { id: 'bronze', label: 'Bronze', min: 0 };
}

async function creditarPontosCliente(clienteId, pontos) {
  if (!clienteId || !pontos || pontos <= 0) return null;
  var c = (state.clientes || []).find(function (x) { return x.id === clienteId; });
  if (!c) return null;
  var next = (Number(c.pontos) || 0) + pontos;
  // update directo para não disparar rename / side-effects pesados
  var data = { pontos: next, updated_at: new Date().toISOString() };
  if (window.BeautyStore && window.BeautyStore.updateInList) {
    window.BeautyStore.updateInList('clientes', clienteId, data);
  } else {
    var i = state.clientes.findIndex(function (x) { return x.id === clienteId; });
    if (i === -1) return null;
    state.clientes[i] = Object.assign({}, state.clientes[i], data);
  }
  var item = (state.clientes || []).find(function (x) { return x.id === clienteId; });
  if (item) {
    try { await dbPut('clientes', item); } catch (e) {}
  }
  return next;
}


/** R46 — telefone obrigatório: exactamente 9 dígitos e começa por 9. */
function bpValidarTelefoneCliente(tel) {
  var digits = String(tel == null ? '' : tel).replace(/\D/g, '');
  if (!digits || digits.length !== 9 || digits.charAt(0) !== '9') {
    return {
      ok: false,
      message: 'O contacto deve ter 9 dígitos e começar por 9 (ex.: 923456789). Corrija o número para continuar.'
    };
  }
  return { ok: true, telefone: digits };
}
if (typeof window !== 'undefined') {
  window.bpValidarTelefoneCliente = bpValidarTelefoneCliente;
}

/** R48 — clientes utilizáveis em novas operações. */
function bpClientesActivos() {
  return (typeof state !== 'undefined' && state.clientes ? state.clientes : []).filter(function (c) {
    if (!c || !c.nome) return false;
    if (c.ativo === false || c.ativo === 0 || c.ativo === 'false') return false;
    return true;
  });
}
if (typeof window !== 'undefined') window.bpClientesActivos = bpClientesActivos;

async function addCliente(c) {
  if (!verificarLimite('clientes')) return null;
  const nome = (c.nome || '').trim();
  if (!nome) { toast('Introduz o nome.', 'warning'); return null; }

  // R46 — telefone obrigatório (camada de negócio)
  var telCheck = typeof bpValidarTelefoneCliente === 'function'
    ? bpValidarTelefoneCliente(c && c.telefone)
    : { ok: false, message: 'O contacto deve ter 9 dígitos e começar por 9 (ex.: 923456789). Corrija o número para continuar.' };
  if (!telCheck.ok) {
    toast(telCheck.message || 'Informe um número de telefone válido com 9 dígitos e iniciado por 9.', 'warning');
    return null;
  }

  // R47
  if (existeNomeDuplicado('clientes', nome)) {
    toast('Já existe um cliente com este nome. Adicione o sobrenome ou outros dados para identificar corretamente o cliente.', 'error');
    return null;
  }

  const n = { ...c, id: uuid(), nome, telefone: telCheck.telefone, pontos: Number(c.pontos) || 0 };
  try {
    await dbPut('clientes', n);
    if (window.BeautyStore && window.BeautyStore.pushToList) {
      window.BeautyStore.pushToList('clientes', n);
    } else {
      state.clientes.push(n);
      updateUI();
    }
    toast('Cliente adicionado.', 'success');
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
  const actual = (state.clientes || []).find(c => c.id === id);
  if (!actual) return null;

  if (data && Object.prototype.hasOwnProperty.call(data, 'telefone')) {
    var telU = typeof bpValidarTelefoneCliente === 'function'
      ? bpValidarTelefoneCliente(data.telefone)
      : { ok: false };
    if (!telU.ok) {
      toast((telU && telU.message) || 'Informe um número de telefone válido com 9 dígitos e iniciado por 9.', 'warning');
      return null;
    }
    data = Object.assign({}, data, { telefone: telU.telefone });
  }

  if (data.nome) {
    const nome = data.nome.trim();
    data = { ...data, nome };
    if (existeNomeDuplicado('clientes', nome, id)) {
      toast('Já existe um cliente com este nome. Adicione o sobrenome ou outros dados para identificar corretamente o cliente.', 'error');
      return null;
    }
  }

  const oldNome = actual.nome;
  const newNome = data.nome != null ? data.nome : oldNome;
  const renamed = data.nome != null && String(data.nome) !== String(oldNome);

  if (window.BeautyStore && window.BeautyStore.updateInList) {
    window.BeautyStore.updateInList('clientes', id, data);
  } else {
    const i = state.clientes.findIndex(c => c.id === id);
    if (i === -1) return null;
    state.clientes[i] = { ...state.clientes[i], ...data };
  }
  const item = state.clientes.find(c => c.id === id);
  if (item) await dbPut('clientes', item);

  // Propagar rename para histórico ligado (id ou nome legado) — mantém stats coerentes
  if (renamed && newNome) {
    const patchList = async (storeKey) => {
      const list = state[storeKey] || [];
      for (let i = 0; i < list.length; i++) {
        const row = list[i];
        const byId = row.cliente_id && String(row.cliente_id) === String(id);
        const byName = row.cliente && String(row.cliente) === String(oldNome);
        if (!byId && !byName) continue;
        const next = { ...row, cliente: newNome, cliente_id: id };
        if (window.BeautyStore && window.BeautyStore.updateInList) {
          window.BeautyStore.updateInList(storeKey, row.id, next);
        } else {
          list[i] = next;
        }
        try { await dbPut(storeKey, next); } catch (e) {}
      }
    };
    await patchList('movimentos');
    await patchList('agendamentos');
    // invalidar cache de stats se existir
    try { if (typeof _statsCache !== 'undefined') _statsCache = { key: '', map: null }; } catch (e) {}
  }

  if (!(window.BeautyStore && window.BeautyStore.subscribe)) updateUI();
  return item;
}

async function deleteCliente(id) {
  // ET4.4: RBAC operacional (UI já restringe admin/gerente)
  if (typeof bpExigirRole === 'function' && !bpExigirRole(['admin', 'gerente'], 'Não tem permissão para eliminar clientes.')) {
    return false;
  }
  return _deleteComRollback('clientes', id, 'Cliente');
}

// ====================================================================
//  CRUD — AGENDAMENTO
// ====================================================================

/** Duração do serviço em minutos (default 60 se não configurado). */
function getServicoDuracaoMin(servicoNome) {
  const s = (state.servicos || []).find(x => x.nome === servicoNome);
  if (!s) return 60;
  const d = Number(s.duracao || s.duracaoMin || s.minutos || 0);
  return d > 0 ? d : 60;
}

function _parseAgDateTime(data, hora) {
  const h = String(hora || '00:00').slice(0, 5);
  const dt = new Date(String(data) + 'T' + h + ':00');
  return isNaN(dt.getTime()) ? null : dt;
}

/**
 * Conflito = mesmo profissional, mesmo dia, intervalo sobreposto, status agendado.
 * @returns {object|null} o agendamento conflituoso ou null
 */
function temConflitoAgendamento({ profissional_id, data, hora, servico, excludeId, duracaoMin }) {
  if (!profissional_id || !data || !hora) return null;
  const dur = duracaoMin || getServicoDuracaoMin(servico);
  const start = _parseAgDateTime(data, hora);
  if (!start) return null;
  const end = new Date(start.getTime() + dur * 60000);

  for (const a of state.agendamentos || []) {
    if (excludeId && a.id === excludeId) continue;
    if (String(a.profissional_id) !== String(profissional_id)) continue;
    if (a.data !== data) continue;
    const st = String(a.status || a.estado || 'agendado').toLowerCase();
    if (st !== 'agendado') continue;
    const aStart = _parseAgDateTime(a.data, a.hora);
    if (!aStart) continue;
    const aDur = getServicoDuracaoMin(a.servico);
    const aEnd = new Date(aStart.getTime() + aDur * 60000);
    if (start < aEnd && end > aStart) return a;
  }
  return null;
}

async function addAgendamento(ag) {
  const data = ag.data || (typeof hoje === 'function' ? hoje() : '');
  const hora = String(ag.hora || (typeof horaAgora === 'function' ? horaAgora() : '00:00')).slice(0, 5);
  const agDatetime = _parseAgDateTime(data, hora);
  if (!agDatetime) {
    toast('Data ou hora inválida.', 'error');
    return null;
  }
  if (agDatetime < new Date()) {
    toast('Não é possível agendar para datas ou horários passados.', 'error');
    return null;
  }
  if (!verificarLimite('agendamentos')) return null;
  if (!ag.profissional_id || String(ag.profissional_id).trim() === '') {
    toast('Selecciona um profissional antes de agendar.', 'warning');
    return null;
  }

  const conflito = temConflitoAgendamento({
    profissional_id: ag.profissional_id,
    data,
    hora,
    servico: ag.servico,
    excludeId: null
  });
  if (conflito) {
    const h = String(conflito.hora || '').slice(0, 5);
    toast(
      'Conflito: ' + (conflito.cliente || 'cliente') + ' já tem ' + (conflito.servico || 'serviço') +
      ' com este profissional às ' + h + '.',
      'error'
    );
    return null;
  }

  const n = {
    ...ag,
    id: uuid(),
    data,
    hora,
    status: 'agendado',
    profissional_id: ag.profissional_id || null,
    profissional: ag.profissional || '',
    updated_at: new Date().toISOString()
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
    toast('Agendamento marcado.', 'success');
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
  const actual = (state.agendamentos || []).find(a => a.id === id);
  if (!actual) return null;
  // ET4.3-cancel: cancelar via status exige admin/gerente
  if (data && String(data.status || '').toLowerCase() === 'cancelado') {
    if (typeof bpExigirRole === 'function' && !bpExigirRole(['admin', 'gerente'], 'Não tem permissão para cancelar agendamentos.')) {
      return null;
    }
  }

  const merged = { ...actual, ...data };
  const st = String(merged.status || 'agendado').toLowerCase();
  if (st === 'agendado' && (data.data || data.hora || data.profissional_id || data.servico)) {
    const conflito = temConflitoAgendamento({
      profissional_id: merged.profissional_id,
      data: merged.data,
      hora: merged.hora,
      servico: merged.servico,
      excludeId: id
    });
    if (conflito) {
      const h = String(conflito.hora || '').slice(0, 5);
      toast(
        'Conflito: ' + (conflito.cliente || 'cliente') + ' já tem ' + (conflito.servico || 'serviço') +
        ' com este profissional às ' + h + '.',
        'error'
      );
      return null;
    }
    if (data.data || data.hora) {
      const dt = _parseAgDateTime(merged.data, merged.hora);
      if (dt && dt < new Date()) {
        toast('Não é possível reagendar para o passado.', 'error');
        return null;
      }
    }
  }

  // Etapa 2: data/hora alterada → reset alerta "visto"
  try {
    if (data && (Object.prototype.hasOwnProperty.call(data, 'data') || Object.prototype.hasOwnProperty.call(data, 'hora'))) {
      var dataMudou = data.data != null && String(data.data) !== String(actual.data || '');
      var horaMudou = data.hora != null && String(data.hora).slice(0, 5) !== String(actual.hora || '').slice(0, 5);
      if (dataMudou || horaMudou) {
        if (typeof bpClearAlertVisto === 'function') bpClearAlertVisto(id);
        else {
          try { localStorage.removeItem('bp_alert_visto_' + id); } catch (_) {}
        }
      }
    }
  } catch (_) {}

  merged.updated_at = new Date().toISOString();
  if (window.BeautyStore && window.BeautyStore.updateInList) {
    window.BeautyStore.updateInList('agendamentos', id, merged);
  } else {
    const i = state.agendamentos.findIndex(a => a.id === id);
    if (i === -1) return null;
    state.agendamentos[i] = merged;
  }
  const item = state.agendamentos.find(a => a.id === id);
  if (item) await dbPut('agendamentos', item);
  if (!(window.BeautyStore && window.BeautyStore.subscribe)) updateUI();
  if (typeof renderBadges === 'function') renderBadges();
  return item;
}

async function deleteAgendamento(id) {
  return _deleteComRollback('agendamentos', id, 'Agendamento');
}

// ====================================================================
//  CRUD — PROFISSIONAL
// ====================================================================

/** ET4.5: serviço exige ≥1 profissional válido (activo) ou nome pendente (criação conjunta). */
function bpValidarProfissionaisDoServico(lista, opts) {
  opts = opts || {};
  const pending = (opts.pendingNomes || []).map(function (x) { return String(x || '').trim(); }).filter(Boolean);
  const arr = Array.isArray(lista) ? lista : [];
  if (!arr.length) {
    return { ok: false, msg: 'Seleccione pelo menos um profissional para o serviço.' };
  }
  const activos = typeof getProfissionaisAtivos === 'function'
    ? getProfissionaisAtivos()
    : (state.profissionais || []).filter(function (p) {
        return typeof isProfissionalAtivo === 'function' ? isProfissionalAtivo(p) : (p && p.ativo !== false);
      });
  const valid = arr.filter(function (ref) {
    const r = String(ref || '').trim();
    if (!r) return false;
    if (pending.indexOf(r) !== -1) return true;
    return activos.some(function (p) {
      return String(p.id) === r || String(p.nome) === r;
    });
  });
  if (!valid.length) {
    return { ok: false, msg: 'Associe pelo menos um profissional activo ao serviço.' };
  }
  return { ok: true, profissionais: valid };
}

/** ET4.5: profissional exige especialidade = serviço activo existente. */
function bpValidarEspecialidadeProfissional(esp) {
  const nome = String(esp || '').trim();
  if (!nome) {
    return { ok: false, msg: 'O profissional tem de ter pelo menos um serviço (especialidade).' };
  }
  const activos = typeof getServicosAtivos === 'function'
    ? getServicosAtivos()
    : (state.servicos || []).filter(function (s) {
        return typeof isServicoAtivo === 'function' ? isServicoAtivo(s) : (s && s.ativo !== false);
      });
  const hit = activos.find(function (s) { return String(s.nome) === nome || String(s.id) === nome; });
  if (!hit) {
    return { ok: false, msg: 'Especialidade inválida: escolha um serviço activo existente.' };
  }
  return { ok: true, servico: hit };
}

/** Liga profissional ao array profissionais do serviço. */
async function bpLigarProfissionalAoServico(prof, servicoNome) {
  if (!prof || !servicoNome) return;
  const s = (state.servicos || []).find(function (x) {
    return String(x.nome) === String(servicoNome) || String(x.id) === String(servicoNome);
  });
  if (!s) return;
  const arr = Array.isArray(s.profissionais) ? s.profissionais.slice() : [];
  const refs = [prof.nome, prof.id].filter(Boolean).map(String);
  const already = arr.some(function (x) { return refs.indexOf(String(x)) !== -1; });
  if (already) return;
  arr.push(prof.nome || prof.id);
  const patch = { profissionais: arr, updated_at: new Date().toISOString() };
  if (window.BeautyStore && window.BeautyStore.updateInList) {
    window.BeautyStore.updateInList('servicos', s.id, patch);
  } else {
    const i = state.servicos.findIndex(function (x) { return x.id === s.id; });
    if (i !== -1) state.servicos[i] = Object.assign({}, state.servicos[i], patch);
  }
  const item = (state.servicos || []).find(function (x) { return x.id === s.id; });
  if (item) {
    try { await dbPut('servicos', item); } catch (_) {}
  }
}

async function addProfissional(p) {
  if (!verificarLimite('profissionais')) return null;
  if (typeof bpExigirRole === 'function' && !bpExigirRole(['admin'], 'Apenas administradores podem adicionar profissionais.')) return null;
  const nome = (p.nome || '').trim();
  if (!nome) { toast('Introduz o nome.', 'warning'); return null; }

  // Ponto 1 (Equipa): serviço obrigatório — especialidade deve ser serviço activo
  var espRaw = String(p.especialidade || '').trim();
  if (!espRaw) {
    toast('O profissional tem de ter pelo menos um serviço (especialidade) associado.', 'error');
    return null;
  }
  {
    const espCheck = bpValidarEspecialidadeProfissional(espRaw);
    if (!espCheck.ok) {
      toast(espCheck.msg || 'Especialidade inválida: escolha um serviço activo existente.', 'error');
      return null;
    }
    espRaw = String((espCheck.servico && espCheck.servico.nome) || espRaw);
  }
  // Contacto, morada e comissão (reforço se chamada fora do formulário)
  var contactoAdd = String(p.contacto || '').replace(/\D/g, '');
  if (!contactoAdd || contactoAdd.length !== 9) {
    toast('Contacto obrigatório: exactamente 9 dígitos.', 'error');
    return null;
  }
  if (!String(p.morada || '').trim()) {
    toast('A morada do profissional é obrigatória.', 'error');
    return null;
  }
  var taxaAdd = p.taxa_comissao != null ? Number(p.taxa_comissao) : NaN;
  if (isNaN(taxaAdd) || taxaAdd < 0 || taxaAdd > 100) {
    toast('Taxa de comissão obrigatória (0 a 100%).', 'error');
    return null;
  }

  if (existeNomeDuplicado('profissionais', nome)) {
    toast('Já existe um profissional com este nome.', 'error');
    return null;
  }

  const n = { ...p, id: uuid(), nome, especialidade: espRaw, ativo: p.ativo !== false };
  try {
    await dbPut('profissionais', n);
    if (window.BeautyStore && window.BeautyStore.pushToList) {
      window.BeautyStore.pushToList('profissionais', n);
    } else {
      state.profissionais.push(n);
      updateUI();
    }
    if (espRaw) {
      try { await bpLigarProfissionalAoServico(n, espRaw); } catch (_) {}
    }
    toast('Profissional adicionado.', 'success');
    return n;
  } catch (err) {
    if (err.message === 'LIMITE_PLANO_ATINGIDO') {
      mostrarModalUpgrade('Limite de profissionais atingido. Faça upgrade para continuar.');
      return null;
    }
    throw err;
  }
}


function isProfissionalAtivo(p) {
  if (!p) return false;
  return p.ativo !== false && p.ativo !== 0 && p.ativo !== 'false';
}

function isServicoAtivo(s) {
  if (!s) return false;
  return s.ativo !== false && s.ativo !== 0 && s.ativo !== 'false';
}

function getProfissionaisAtivos() {
  return (state.profissionais || []).filter(isProfissionalAtivo);
}

function getServicosAtivos() {
  return (state.servicos || []).filter(isServicoAtivo);
}
if (typeof window !== 'undefined') {
  window.getProfissionaisAtivos = getProfissionaisAtivos;
  window.getServicosAtivos = getServicosAtivos;
}

/**
 * Soft-delete: destituir profissional sem DELETE remoto (evita 409 FK).
 * Remove associações em serviços; desactiva serviços que ficam sem equipa.
 */
async function desassociarProfissional(id) {
  const p = (state.profissionais || []).find(function (x) { return x.id === id; });
  if (typeof bpExigirRole === 'function' && !bpExigirRole(['admin'], 'Apenas administradores podem destituir profissionais.')) return null;
  if (!p) {
    if (typeof toast === 'function') toast('Profissional não encontrado', 'error');
    return null;
  }
  if (!isProfissionalAtivo(p)) {
    if (typeof toast === 'function') toast('Este profissional já está destituído', 'warning');
    return null;
  }

  const patch = {
    ativo: false,
    data_desativacao: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // UPDATE local + fila (não DELETE — crítico para multi-dispositivo)
  if (window.BeautyStore && window.BeautyStore.updateInList) {
    window.BeautyStore.updateInList('profissionais', id, patch);
  } else {
    const i = state.profissionais.findIndex(function (x) { return x.id === id; });
    if (i === -1) return null;
    state.profissionais[i] = Object.assign({}, state.profissionais[i], patch);
  }
  const item = (state.profissionais || []).find(function (x) { return x.id === id; });
  if (item) {
    try {
      await dbPut('profissionais', item);
      // Contingência 1: PATCH directo no Supabase (fonte de verdade multi-dispositivo)
      var remotoOk = false;
      if (navigator.onLine && typeof supabaseDeactivate === 'function') {
        try {
          await supabaseDeactivate('profissionais', id, {
            data_desativacao: item.data_desativacao,
            updated_at: item.updated_at
          });
          remotoOk = true;
        } catch (eRemoto) {
          console.warn('[desassociarProfissional] PATCH remoto falhou, fila de contingência', eRemoto);
        }
      }
      // Contingência 2: fila upsert se PATCH falhou ou offline
      if (!remotoOk && typeof addToSyncQueue === 'function') {
        addToSyncQueue('profissionais', 'upsert', item);
        if (navigator.onLine && typeof flushSyncQueue === 'function') {
          try { await flushSyncQueue(); } catch (eFlush) {
            console.warn('[desassociarProfissional] flush', eFlush);
          }
        }
      }
    } catch (e) {
      console.error('[desassociarProfissional]', e);
    }
  }

  const nome = p.nome || '';
  const servicosAfetados = [];
  const servicosDesativados = [];

  for (const s of (state.servicos || []).slice()) {
    const arr = Array.isArray(s.profissionais) ? s.profissionais.slice() : [];
    if (!arr.length) continue;
    const next = arr.filter(function (x) {
      return x !== nome && String(x) !== String(id);
    });
    if (next.length === arr.length) continue;

    const sPatch = { profissionais: next };
    if (next.length === 0) {
      sPatch.ativo = false;
      servicosDesativados.push(s.nome || 'Serviço');
    } else {
      servicosAfetados.push(s.nome || 'Serviço');
    }

    if (window.BeautyStore && window.BeautyStore.updateInList) {
      window.BeautyStore.updateInList('servicos', s.id, sPatch);
    } else {
      const si = state.servicos.findIndex(function (x) { return x.id === s.id; });
      if (si !== -1) state.servicos[si] = Object.assign({}, state.servicos[si], sPatch);
    }
    const updated = (state.servicos || []).find(function (x) { return x.id === s.id; });
    if (updated) {
      try { await dbPut('servicos', updated); } catch (e) {}
    }
  }

  if (!(window.BeautyStore && window.BeautyStore.subscribe) && typeof updateUI === 'function') {
    updateUI();
  }

  return {
    profissional: item || Object.assign({}, p, patch),
    servicosAfetados: servicosAfetados,
    servicosDesativados: servicosDesativados
  };
}

async function updateProfissional(id, data) {
  const actual = (state.profissionais || []).find(p => p.id === id);
  if (typeof bpExigirRole === 'function' && !bpExigirRole(['admin'], 'Apenas administradores podem editar profissionais.')) return null;
  if (!actual) return null;

  if (data.especialidade != null) {
    if (!String(data.especialidade || '').trim()) {
      toast('O profissional tem de ter um serviço (especialidade) associado.', 'error');
      return null;
    }
    const espCheck = typeof bpValidarEspecialidadeProfissional === 'function'
      ? bpValidarEspecialidadeProfissional(data.especialidade)
      : { ok: !!(data.especialidade && String(data.especialidade).trim()), msg: 'Especialidade obrigatória' };
    if (!espCheck.ok) {
      toast(espCheck.msg || 'O profissional tem de ter um serviço associado.', 'error');
      return null;
    }
  }
  if (data.contacto != null) {
    var dig = String(data.contacto || '').replace(/\D/g, '');
    if (!dig || dig.length !== 9) {
      toast('Contacto obrigatório: exactamente 9 dígitos.', 'error');
      return null;
    }
    data = Object.assign({}, data, { contacto: dig });
  }
  if (data.morada != null && !String(data.morada || '').trim()) {
    toast('A morada do profissional é obrigatória.', 'error');
    return null;
  }
  if (data.taxa_comissao != null) {
    var tUp = Number(data.taxa_comissao);
    if (isNaN(tUp) || tUp < 0 || tUp > 100) {
      toast('Taxa de comissão obrigatória (0 a 100%).', 'error');
      return null;
    }
  }
  if (data.dataContratual != null) {
    var dChk = typeof bpValidarDataContratual === 'function'
      ? bpValidarDataContratual(data.dataContratual)
      : { ok: !!String(data.dataContratual || '').trim(), value: data.dataContratual };
    if (!dChk.ok) {
      toast((dChk && dChk.message) || 'Data contratual inválida.', 'error');
      return null;
    }
    data = Object.assign({}, data, { dataContratual: dChk.value || data.dataContratual });
  }

  if (data.nome) {
    const nome = data.nome.trim();
    data = { ...data, nome };
    if (existeNomeDuplicado('profissionais', nome, id)) {
      toast('Já existe um profissional com este nome.', 'error');
      return null;
    }
  }
  const oldNome = actual.nome;
  const newNome = data.nome != null ? data.nome : oldNome;
  const renamed = data.nome != null && String(data.nome) !== String(oldNome);

  if (window.BeautyStore && window.BeautyStore.updateInList) {
    window.BeautyStore.updateInList('profissionais', id, data);
  } else {
    const i = state.profissionais.findIndex(p => p.id === id);
    if (i === -1) return null;
    state.profissionais[i] = { ...state.profissionais[i], ...data };
  }
  const item = state.profissionais.find(p => p.id === id);
  if (item) await dbPut('profissionais', item);
  if (item && data && data.especialidade) {
    try { await bpLigarProfissionalAoServico(item, data.especialidade); } catch (_) {}
  }

  // Rename: actualizar nomes em serviços ligados (array legado de nomes)
  if (renamed && oldNome && newNome) {
    for (const s of (state.servicos || [])) {
      const arr = s.profissionais || [];
      if (!arr.length) continue;
      let changed = false;
      const next = arr.map(function (x) {
        if (x === oldNome || x === id) { changed = true; return newNome; }
        return x;
      });
      if (!changed) continue;
      const updated = { ...s, profissionais: next };
      if (window.BeautyStore && window.BeautyStore.updateInList) {
        window.BeautyStore.updateInList('servicos', s.id, updated);
      } else {
        const si = state.servicos.findIndex(x => x.id === s.id);
        if (si !== -1) state.servicos[si] = updated;
      }
      try { await dbPut('servicos', updated); } catch (e) {}
    }
    // Nome em movimentos legados sem quebrar id
    for (const m of (state.movimentos || [])) {
      if (String(m.profissional_id) !== String(id)) continue;
      if (m.profissional === newNome) continue;
      const updated = { ...m, profissional: newNome };
      if (window.BeautyStore && window.BeautyStore.updateInList) {
        window.BeautyStore.updateInList('movimentos', m.id, updated);
      } else {
        const mi = state.movimentos.findIndex(x => x.id === m.id);
        if (mi !== -1) state.movimentos[mi] = updated;
      }
      try { await dbPut('movimentos', updated); } catch (e) {}
    }
  }

  if (!(window.BeautyStore && window.BeautyStore.subscribe)) updateUI();
  return item;
}

async function deleteProfissional(id) {
  if (typeof bpExigirRole === 'function' && !bpExigirRole(['admin'], 'Apenas administradores podem eliminar profissionais.')) return false;
  return _deleteComRollback('profissionais', id, 'Profissional');
}

// ====================================================================
//  CRUD — SERVIÇO
// ====================================================================
async function addServico(s, opts) {
  opts = opts || {};
  if (typeof bpExigirRole === 'function' && !bpExigirRole(['admin'], 'Apenas administradores podem criar serviços.')) return null;
  const nome = (s.nome || '').trim();
  if (!nome) { toast('Introduz o nome.', 'warning'); return null; }

  // R33 — preço obrigatório > 0
  var precoBase = Number(s.precoBase);
  if (!Number.isFinite(precoBase) || precoBase <= 0) {
    toast('Informe um preço válido superior a zero.', 'warning');
    return null;
  }

  // R34 — serviço sem profissionais — proibido
  const profCheck = typeof bpValidarProfissionaisDoServico === 'function'
    ? bpValidarProfissionaisDoServico(s.profissionais, opts)
    : { ok: Array.isArray(s.profissionais) && s.profissionais.length > 0, msg: 'Seleccione profissionais', profissionais: s.profissionais };
  if (!profCheck.ok) {
    toast(profCheck.msg || 'Associa pelo menos um profissional a este serviço.', 'error');
    return null;
  }

  if (existeNomeDuplicado('servicos', nome)) {
    toast('Já existe um serviço com este nome.', 'error');
    return null;
  }

  const n = { ...s, id: uuid(), nome, precoBase: precoBase, profissionais: profCheck.profissionais || s.profissionais };
  await dbPut('servicos', n);
  if (window.BeautyStore && window.BeautyStore.pushToList) {
    window.BeautyStore.pushToList('servicos', n);
  } else {
    state.servicos.push(n);
    updateUI();
  }
  toast('Serviço criado.', 'success');
  return n;
}

async function updateServico(id, data) {
  if (typeof bpExigirRole === 'function' && !bpExigirRole(['admin'], 'Apenas administradores podem editar serviços.')) return null;
  if (data && Object.prototype.hasOwnProperty.call(data, 'precoBase')) {
    var pb = Number(data.precoBase);
    if (!Number.isFinite(pb) || pb <= 0) {
      toast('Informe um preço válido superior a zero.', 'warning');
      return null;
    }
    data = Object.assign({}, data, { precoBase: pb });
  }
  if (data && Object.prototype.hasOwnProperty.call(data, 'profissionais')) {
    const profCheck = typeof bpValidarProfissionaisDoServico === 'function'
      ? bpValidarProfissionaisDoServico(data.profissionais)
      : { ok: Array.isArray(data.profissionais) && data.profissionais.length > 0, msg: 'Seleccione profissionais', profissionais: data.profissionais };
    if (!profCheck.ok) {
      toast(profCheck.msg || 'O serviço tem de ter pelo menos um profissional.', 'error');
      return null;
    }
    data = Object.assign({}, data, { profissionais: profCheck.profissionais || data.profissionais });
  }
  if (data.nome) {
    const nome = data.nome.trim();
    if (existeNomeDuplicado('servicos', nome, id)) {
      toast('Já existe um serviço com este nome.', 'error');
      return null;
    }
  }
  if (window.BeautyStore && window.BeautyStore.updateInList) {
    window.BeautyStore.updateInList('servicos', id, data);
  } else {
    const i = state.servicos.findIndex(s => s.id === id);
    if (i === -1) return null;
    state.servicos[i] = { ...state.servicos[i], ...data };
  }
  const item = state.servicos.find(s => s.id === id);
  if (item) await dbPut('servicos', item);
  if (!(window.BeautyStore && window.BeautyStore.subscribe)) updateUI();
  return item || null;
}

async function deleteServico(id) {
  // ET4.2-P1-03: soft-delete (ativo=false) — alinhado a profissionais; preserva histórico multi-dispositivo
  if (typeof bpExigirRole === 'function' && !bpExigirRole(['admin'], 'Apenas administradores podem desactivar serviços.')) return false;
  return desativarServico(id);
}

/** Soft-delete de serviço (mesmo contrato que desassociarProfissional). */
async function desativarServico(id) {
  const s = (state.servicos || []).find(function (x) { return x.id === id; });
  if (!s) {
    if (typeof toast === 'function') toast('Serviço não encontrado', 'error');
    return false;
  }
  if (!isServicoAtivo(s)) {
    if (typeof toast === 'function') toast('Este serviço já está desactivado', 'warning');
    return false;
  }
  const patch = {
    ativo: false,
    updated_at: new Date().toISOString()
  };
  if (window.BeautyStore && window.BeautyStore.updateInList) {
    window.BeautyStore.updateInList('servicos', id, patch);
  } else {
    const i = state.servicos.findIndex(function (x) { return x.id === id; });
    if (i !== -1) state.servicos[i] = Object.assign({}, state.servicos[i], patch);
  }
  const item = (state.servicos || []).find(function (x) { return x.id === id; });
  let remotoOk = false;
  try {
    if (item) await dbPut('servicos', item);
  } catch (e) {
    console.error('[desativarServico]', e);
  }
  try {
    if (navigator.onLine && typeof supabaseDeactivate === 'function' && state.config && state.config.salaoId) {
      try {
        await supabaseDeactivate('servicos', id, { updated_at: patch.updated_at });
        remotoOk = true;
      } catch (eRemoto) {
        console.warn('[desativarServico] PATCH remoto falhou, fila de contingência', eRemoto);
      }
    }
    if (!remotoOk && typeof addToSyncQueue === 'function' && item) {
      addToSyncQueue('servicos', 'upsert', item);
      if (navigator.onLine && typeof flushSyncQueue === 'function') {
        try { await flushSyncQueue(); } catch (eFlush) {
          console.warn('[desativarServico] flush', eFlush);
        }
      }
    }
  } catch (e) {
    console.error('[desativarServico] sync', e);
  }
  if (typeof updateUI === 'function') updateUI();
  if (typeof toast === 'function') toast('Serviço desactivado.', 'success');
  return true;
}


function getServicoById(id) {
  return state.servicos.find(s => s.id === id);
}

function getServicoByNome(nome) {
  return state.servicos.find(s => s.nome === nome);
}

function getProfissionaisPorServico(nomeServico) {
  // ET4.5: sem associação explícita → lista vazia (nunca "toda a equipa")
  const servico = (state.servicos || []).find(s => s.nome === nomeServico);
  if (servico && Array.isArray(servico.profissionais) && servico.profissionais.length > 0) {
    return servico.profissionais.slice();
  }
  return [];
}

// ====================================================================
//  VENDA / MOVIMENTO
// ====================================================================

/**
 * ETAPA1 — Motor central de validação de venda (R01–R06, R08–R15, R17, R54–R58).
 * Retorna { ok, code, field, title, message, total, itens, clienteNome, ... }
 * Não persiste. Não depende só da UI.
 */
function bpValidarOperacaoVenda(dados) {
  dados = dados || {};
  var itensIn = Array.isArray(dados.itens) ? dados.itens : [];
  if (!itensIn.length) {
    return {
      ok: false,
      code: 'R05',
      field: 'ci-servico-sel',
      title: 'Itens da venda',
      message: 'Adicione pelo menos um serviço ou produto antes de continuar.'
    };
  }

  var itensNorm = [];
  for (var i = 0; i < itensIn.length; i++) {
    var it = itensIn[i] || {};
    var nome = String(it.nome || '').trim();
    if (!nome || nome === '__custom' || nome === 'Outro') {
      return {
        ok: false,
        code: 'R17',
        field: 'ci-servico-sel',
        title: 'Serviço',
        message: 'Seleccione um serviço do catálogo. Serviços personalizados não são permitidos na venda.'
      };
    }
    var qty = Number(it.quantidade);
    if (!Number.isFinite(qty) || qty < 1 || Math.floor(qty) !== qty) {
      return {
        ok: false,
        code: 'R08',
        field: 'cart-items-list',
        title: 'Quantidade',
        message: 'A quantidade deve ser um número inteiro igual ou superior a 1.'
      };
    }
    var precoUnit = Number(it.precoUnit != null ? it.precoUnit : (Number(it.subtotal) / qty));
    if (!Number.isFinite(precoUnit) || precoUnit <= 0) {
      return {
        ok: false,
        code: 'R09',
        field: 'ci-valor',
        title: 'Preço',
        message: 'Informe um preço válido superior a zero.'
      };
    }
    var subtotal = Math.round(precoUnit * qty * 100) / 100;
    var serv = null;
    try {
      if (typeof getServicoByNome === 'function') serv = getServicoByNome(nome);
      if (!serv && typeof state !== 'undefined') {
        serv = (state.servicos || []).find(function (s) {
          return s && (String(s.nome) === nome || String(s.id) === nome);
        });
      }
    } catch (_) {}
    if (!serv) {
      return {
        ok: false,
        code: 'R17',
        field: 'ci-servico-sel',
        title: 'Serviço',
        message: 'Seleccione um serviço do catálogo. Serviços personalizados não são permitidos na venda.'
      };
    }
    var servAtivo = typeof isServicoAtivo === 'function' ? isServicoAtivo(serv) : (serv.ativo !== false);
    if (!servAtivo) {
      return {
        ok: false,
        code: 'R06',
        field: 'ci-servico-sel',
        title: 'Serviço',
        message: 'Este serviço não está disponível para novas vendas.'
      };
    }
    itensNorm.push({
      nome: String(serv.nome || nome),
      quantidade: qty,
      precoUnit: precoUnit,
      subtotal: subtotal,
      servico_id: serv.id || null
    });
  }

  var clienteNome = String(dados.cliente || '').trim();
  if (!clienteNome || clienteNome === 'Avulso' || clienteNome === 'Anónimo') {
    return {
      ok: false,
      code: 'R01',
      field: 'venda-cliente',
      title: 'Cliente',
      message: 'Selecione um cliente para continuar.'
    };
  }
  var clienteHit = null;
  try {
    if (typeof state !== 'undefined') {
      clienteHit = (state.clientes || []).find(function (c) {
        return c && (String(c.nome) === clienteNome || String(c.id) === clienteNome);
      });
    }
  } catch (_) {}
  if (!clienteHit) {
    return {
      ok: false,
      code: 'R01',
      field: 'venda-cliente',
      title: 'Cliente',
      message: 'Selecione um cliente para continuar.'
    };
  }
  if (clienteHit.ativo === false || clienteHit.ativo === 0 || clienteHit.ativo === 'false') {
    return {
      ok: false,
      code: 'R48',
      field: 'venda-cliente',
      title: 'Cliente',
      message: 'Este cliente não está activo. Escolha outro cliente para continuar.'
    };
  }

  var profId = dados.profissional_id != null ? String(dados.profissional_id).trim() : '';
  if (!profId) {
    return {
      ok: false,
      code: 'R02',
      field: 'venda-profissional',
      title: 'Profissional',
      message: 'Selecione o profissional responsável pela venda para continuar.'
    };
  }
  var prof = null;
  try {
    if (typeof state !== 'undefined') {
      prof = (state.profissionais || []).find(function (p) {
        return p && String(p.id) === profId;
      });
    }
  } catch (_) {}
  if (!prof) {
    return {
      ok: false,
      code: 'R02',
      field: 'venda-profissional',
      title: 'Profissional',
      message: 'Selecione o profissional responsável pela venda para continuar.'
    };
  }
  var profAtivo = typeof isProfissionalAtivo === 'function' ? isProfissionalAtivo(prof) : (prof.ativo !== false);
  if (!profAtivo) {
    return {
      ok: false,
      code: 'R04',
      field: 'venda-profissional',
      title: 'Profissional',
      message: 'Este profissional não está activo. Escolha um profissional disponível.'
    };
  }

  for (var j = 0; j < itensNorm.length; j++) {
    var nomeS = itensNorm[j].nome;
    var serv2 = null;
    try {
      if (typeof getServicoByNome === 'function') serv2 = getServicoByNome(nomeS);
      if (!serv2 && typeof state !== 'undefined') {
        serv2 = (state.servicos || []).find(function (s) {
          return s && String(s.nome) === nomeS;
        });
      }
    } catch (_) {}
    var lista = (serv2 && Array.isArray(serv2.profissionais)) ? serv2.profissionais : [];
    if (!lista.length) {
      return {
        ok: false,
        code: 'R35',
        field: 'venda-profissional',
        title: 'Profissional',
        message: 'Este serviço não possui um profissional disponível. Associe um profissional ao serviço antes de continuar.'
      };
    }
    var habilitado = lista.some(function (ref) {
      var r = String(ref || '');
      return r === String(prof.id) || r === String(prof.nome || '');
    });
    if (!habilitado) {
      return {
        ok: false,
        code: 'R03',
        field: 'venda-profissional',
        title: 'Profissional',
        message: 'Este profissional não está habilitado para o serviço selecionado. Escolha um profissional disponível para este serviço.'
      };
    }
  }

  var total = 0;
  for (var k = 0; k < itensNorm.length; k++) {
    total += Number(itensNorm[k].subtotal) || 0;
  }
  total = Math.round(total * 100) / 100;
  if (!Number.isFinite(total) || total <= 0) {
    return {
      ok: false,
      code: 'R11',
      field: 'cart-total-area',
      title: 'Total',
      message: 'O total da venda é inválido. Verifique os serviços, quantidades e valores antes de continuar.'
    };
  }

  var metodo = String(dados.metodoPagamento != null ? dados.metodoPagamento : '').trim();
  if (metodo === 'Transferência Bancária') metodo = 'Transferência';
  if (metodo === 'Outro' || metodo === 'outro') metodo = '';
  var metodosOk = {
    'Numerário': true,
    'Multicaixa Express': true,
    'Transferência': true,
    'Cartão': true,
    'Split': true,
    '__split__': true
  };
  if (!metodo || !metodosOk[metodo]) {
    return {
      ok: false,
      code: 'R12',
      field: 'venda-pagamento',
      title: 'Pagamento',
      message: 'Selecione o método de pagamento para continuar.'
    };
  }

  var pagamentos = Array.isArray(dados.pagamentos) ? dados.pagamentos : null;
  if (metodo === '__split__' || metodo === 'Split') {
    if (!pagamentos || !pagamentos.length) {
      return {
        ok: false,
        code: 'R14',
        field: 'venda-pagamento',
        title: 'Pagamento dividido',
        message: 'Os valores dos pagamentos divididos devem corresponder exatamente ao total da venda.'
      };
    }
    var soma = 0;
    for (var p = 0; p < pagamentos.length; p++) {
      var v = Number(pagamentos[p] && (pagamentos[p].valor != null ? pagamentos[p].valor : pagamentos[p]));
      if (!Number.isFinite(v) || v <= 0) {
        return {
          ok: false,
          code: 'R15',
          field: 'venda-pagamento',
          title: 'Pagamento',
          message: 'Informe um valor de pagamento superior a zero.'
        };
      }
      soma += v;
    }
    soma = Math.round(soma * 100) / 100;
    if (Math.abs(soma - total) > 0.009) {
      return {
        ok: false,
        code: 'R14',
        field: 'venda-pagamento',
        title: 'Pagamento dividido',
        message: 'Os valores dos pagamentos divididos devem corresponder exatamente ao total da venda.'
      };
    }
  }

  return {
    ok: true,
    code: 'OK',
    total: total,
    itens: itensNorm,
    clienteNome: String(clienteHit.nome || clienteNome),
    cliente_id: clienteHit.id || dados.cliente_id || null,
    profissional_id: String(prof.id),
    profissionalNome: String(prof.nome || ''),
    metodoPagamento: metodo === '__split__' ? 'Split' : metodo,
    pagamentos: pagamentos
  };
}

function bpFocarCampoVenda(fieldId) {
  if (!fieldId) return;
  try {
    var el = document.getElementById(fieldId);
    if (!el) return;
    try { el.classList.add('bp-field-invalid'); } catch (_) {}
    setTimeout(function () {
      try { el.focus(); } catch (_) {}
      try {
        if (el.scrollIntoView) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      } catch (_) {}
    }, 80);
    setTimeout(function () {
      try { el.classList.remove('bp-field-invalid'); } catch (_) {}
    }, 4000);
  } catch (_) {}
}

/** Feedback de validação da venda: modal → Entendi → foco no campo. */
function bpNotificarValidacaoVenda(result) {
  if (!result || result.ok) return;
  var title = result.title || 'Quase lá';
  var msg = result.message || 'Verifique os dados da venda e tente novamente.';
  var field = result.field;
  var after = function () {
    if (typeof bpFocarCampoVenda === 'function') bpFocarCampoVenda(field);
  };
  try {
    if (typeof mostrarErro === 'function') {
      mostrarErro(msg, null, title, after, { okLabel: 'Entendi' });
    } else if (typeof bpNotifyFormError === 'function') {
      bpNotifyFormError(msg, field);
    } else if (typeof toast === 'function') {
      toast(msg, 'warning');
      after();
    }
  } catch (_) {
    after();
  }
}

if (typeof window !== 'undefined') {
  window.bpValidarOperacaoVenda = bpValidarOperacaoVenda;
  window.bpNotificarValidacaoVenda = bpNotificarValidacaoVenda;
  window.bpFocarCampoVenda = bpFocarCampoVenda;
}


async function registarVenda(dados) {
  try {
    // Camada de negócio: mesmas regras da UI (R60/R65)
    var vcheck = typeof bpValidarOperacaoVenda === 'function'
      ? bpValidarOperacaoVenda(dados)
      : { ok: false, message: 'Validação indisponível.' };
    if (!vcheck || !vcheck.ok) {
      if (typeof bpNotificarValidacaoVenda === 'function') bpNotificarValidacaoVenda(vcheck);
      else if (typeof toast === 'function' && vcheck) toast(vcheck.message || 'Dados da venda incompletos.', 'warning');
      return null;
    }

    const clienteNome = vcheck.clienteNome;
    let clienteId = vcheck.cliente_id || null;
    const total = vcheck.total;
    const itensOk = vcheck.itens;
    const descricao = itensOk.map(function (i) { return i.nome; }).join(', ');
    const id = uuid();
    // Comissão sobre valor líquido (total da venda); taxa do profissional
    let comissao = 0;
    if (vcheck.profissional_id) {
      try {
        var _taxa = (typeof getTaxaComissao === 'function')
          ? Number(getTaxaComissao(vcheck.profissional_id)) || 0
          : 0;
        if (typeof calcularComissao === 'function') {
          comissao = Number(calcularComissao(total, _taxa)) || 0;
        } else if (_taxa > 0) {
          comissao = Math.round((total * _taxa) / 100 * 100) / 100;
        }
      } catch (e) { comissao = 0; }
    }

    const mov = {
      id,
      tipo: 'venda',
      descricao,
      valor: total,
      cliente: clienteNome,
      cliente_id: clienteId || null,
      profissional_id: vcheck.profissional_id,
      profissional: vcheck.profissionalNome,
      comissao_gerada: comissao,
      itens: itensOk.map(function (i) {
        return {
          nome: i.nome,
          quantidade: i.quantidade,
          precoUnit: i.precoUnit,
          subtotal: i.subtotal
        };
      }),
      metodoPagamento: vcheck.metodoPagamento,
      pagamentos: vcheck.pagamentos,
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

    // Fidelidade: creditar pontos se há ficha de cliente
    if (clienteId) {
      var pts = calcularPontosVenda(total);
      if (pts > 0) {
        try { await creditarPontosCliente(clienteId, pts); } catch (ePts) {}
      }
    }

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

/**
 * Cancela uma venda e estorna a comissão (offline-first).
 * Marca movimento status=cancelado e zera comissao_gerada (guarda valor em comissao_estornada).
 */
async function cancelarVenda(movimentoId, motivo) {
  if (typeof bpExigirRole === 'function' && !bpExigirRole(['admin', 'gerente'], 'Não tem permissão para cancelar vendas.')) return false;
  try {
    if (!movimentoId || typeof state === 'undefined') return false;
    const mov = (state.movimentos || []).find(function (m) { return m.id === movimentoId; });
    if (!mov || mov.tipo !== 'venda') {
      if (typeof toast === 'function') toast('Venda não encontrada', 'error');
      return false;
    }
    if (mov.status === 'cancelado') {
      if (typeof toast === 'function') toast('Venda já estava cancelada', 'warning');
      return false;
    }
    const estorno = Number(mov.comissao_gerada) || 0;
    const updated = Object.assign({}, mov, {
      status: 'cancelado',
      comissao_estornada: estorno,
      comissao_gerada: 0,
      cancelado_em: (typeof hoje === 'function' ? hoje() : new Date().toISOString().slice(0, 10)),
      cancelado_motivo: motivo || '',
      updated_at: new Date().toISOString()
    });
    if (window.BeautyStore && window.BeautyStore.updateInList) {
      window.BeautyStore.updateInList('movimentos', movimentoId, updated);
    } else {
      const mi = state.movimentos.findIndex(function (x) { return x.id === movimentoId; });
      if (mi !== -1) state.movimentos[mi] = updated;
    }
    try { await dbPut('movimentos', updated); } catch (e) {}
    if (typeof toast === 'function') toast('Venda cancelada' + (estorno ? ' · comissão estornada' : ''), 'warning');
    if (typeof updateUI === 'function') updateUI();
    return true;
  } catch (err) {
    if (typeof logContexto === 'function') logContexto('cancelarVenda', err);
    if (typeof toast === 'function') toast('Erro ao cancelar venda', 'error');
    return false;
  }
}
if (typeof window !== 'undefined') window.cancelarVenda = cancelarVenda;

/** True se o movimento é venda e não está cancelada (R50 / KPIs). */
function bpVendaActiva(m) {
  if (!m || m.tipo !== 'venda') return false;
  return String(m.status || 'activo').toLowerCase() !== 'cancelado';
}
if (typeof window !== 'undefined') window.bpVendaActiva = bpVendaActiva;

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
  if (!badge) return;
  const label = plano === 'trial' ? 'Plano Gratuito' : info.label.toUpperCase();
  badge.textContent = label;
  badge.className = 'plano-badge ' + info.badgeClass;
  badge.setAttribute('data-bp-plano-ready', '1');
  badge.style.visibility = 'visible';
  badge.setAttribute('aria-hidden', 'false');
  const countdown = document.getElementById('trial-countdown');
  if (plano === 'trial' && isTrialAtivo()) {
    const dias = getDiasTrialRestantes();
    countdown.style.display = 'inline-block';
    countdown.textContent = `Restam ${dias} dias`;
    countdown.style.color = '';
  } else if (plano === 'trial' && !isTrialAtivo()) {
    countdown.style.display = 'inline-block';
    countdown.textContent = 'Trial expirado';
    countdown.style.color = 'var(--red)';
  } else {
    countdown.style.display = 'none';
    countdown.style.color = '';
  }
  const iaInfo = document.getElementById('ia-plano-info');
  if (iaInfo) {
    const limite = info.iaDia;
    iaInfo.textContent = limite > 0 ? `${info.label}: ${limite} perguntas/dia` : 'IA não disponível neste plano';
  }
  if (typeof actualizarContadorIA === 'function') {
    actualizarContadorIA();
  } else {
    const cont = document.getElementById('ia-contador');
    if (cont) {
      if (info.iaDia === 0) cont.textContent = '0';
      else {
        const chave = 'ia_perguntas_' + ((state.config && state.config.salaoId) || 'local') + '_' + hoje();
        cont.textContent = String(parseInt(localStorage.getItem(chave) || '0', 10) || 0);
      }
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
  } else if (tipo === '90dias') {
    const fimD = new Date(base);
    fimD.setDate(fimD.getDate() - offset * 90);
    const iniD = new Date(fimD);
    iniD.setDate(iniD.getDate() - 89);
    inicio = formatarDataISO(iniD);
    fim = formatarDataISO(fimD);
    label = 'Últimos 90 dias';
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

/** Sincroniza rótulos de período (KPI + gráfico) a partir do intervalo activo. */
function _bpSyncPeriodLabels(label) {
  try {
    var lab = (label || '').trim();
    if (!lab && typeof getIntervaloDashAtual === 'function') {
      var iv = getIntervaloDashAtual();
      lab = (iv && iv.label) ? String(iv.label) : '';
    }
    if (!lab) return;
    var todayEl = document.getElementById('today-date');
    if (todayEl) todayEl.textContent = lab;
    var chartLab = document.getElementById('chart-period-label');
    if (chartLab) chartLab.textContent = lab;
  } catch (_) {}
}



// ====================================================================
//  RENDER DASHBOARD — modelo de verdade unificado (Fase A1+A2)
//  Um período (dashPeriodo) alimenta KPIs, sparkline e gráfico.
// ====================================================================
function _statusAg(a) {
  return String(a.status || a.estado || 'agendado').toLowerCase();
}

function _somaVendas(lista) {
  return (lista || []).reduce((s, v) => s + (Number(v.valor) || 0), 0);
}

function renderDashboard() {
  const intervalo = getIntervaloDashAtual();
  const movs = state.movimentos || [];
  const ags = state.agendamentos || [];

  const vendasPeriodo = movs.filter(m =>
    m.tipo === 'venda' && String(m.status || '').toLowerCase() !== 'cancelado' && m.data >= intervalo.inicio && m.data <= intervalo.fim
  );
  const totalRev = _somaVendas(vendasPeriodo);
  const totalVendas = vendasPeriodo.length;
  const ticket = totalVendas > 0 ? totalRev / totalVendas : 0;

  // Agenda no período: estados explícitos (não misturar cancelados no "sucesso")
  const agPeriodo = ags.filter(a => a.data >= intervalo.inicio && a.data <= intervalo.fim);
  const realizados = agPeriodo.filter(a => _statusAg(a) === 'realizado').length;
  const cancelados = agPeriodo.filter(a => _statusAg(a) === 'cancelado').length;
  const naoRealizados = agPeriodo.filter(a => {
    const st = _statusAg(a);
    return st === 'nao_realizado' || st === 'nao-realizado' || st === 'expirado';
  }).length;
  const pendentesPeriodo = agPeriodo.filter(a => _statusAg(a) === 'agendado').length;
  const agAtivos = agPeriodo.length - cancelados; // marcados válidos (exclui cancelados)

  const todayEl = document.getElementById('today-date');
  if (todayEl) todayEl.textContent = intervalo.label;
  try { _bpSyncPeriodLabels(intervalo.label); } catch (_) {}

  animateKpi('kpi-revenue', fmtKz(totalRev));
  const revenueCount = document.getElementById('kpi-revenue-count');
  if (revenueCount) {
    revenueCount.textContent = totalVendas === 1 ? '1 venda' : totalVendas + ' vendas';
  }

  // Número principal = marcações válidas no período; sub = breakdown honesto
  animateKpi('kpi-agendamentos', String(Math.max(0, agAtivos)));
  const agStatus = document.getElementById('kpi-agendamentos-status');
  if (agStatus) {
    const parts = [realizados + ' realizados'];
    if (pendentesPeriodo) parts.push(pendentesPeriodo + ' pend.');
    if (naoRealizados) parts.push(naoRealizados + ' falhados');
    if (cancelados) parts.push(cancelados + ' cancel.');
    agStatus.textContent = parts.join(' · ');
  }

  animateKpi('kpi-ticket', fmtKz(ticket));
  const ticketSub = document.getElementById('kpi-ticket-sub');
  if (ticketSub) ticketSub.textContent = 'por venda';

  // --- Sparkline: receita diária no intervalo (mesma unidade do KPI primário) ---
  const canvas = document.getElementById('ticket-sparkline');
  if (canvas) {
    canvas.style.display = 'block';
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

  const serieReceita = [];
  const dInicio = new Date(intervalo.inicio + 'T00:00:00');
  const dFim = new Date(intervalo.fim + 'T00:00:00');
  const msDia = 86400000;
  const diasNoPeriodo = Math.max(1, Math.round((dFim - dInicio) / msDia) + 1);
  const passo = diasNoPeriodo > 31 ? Math.ceil(diasNoPeriodo / 31) : 1;
  for (let i = 0; i < diasNoPeriodo; i += passo) {
    const d = new Date(dInicio.getTime() + i * msDia);
    const ds = formatarDataISO(d);
    const totalDia = _somaVendas(movs.filter(m => m.tipo === 'venda' && m.data === ds));
    serieReceita.push(totalDia);
  }
  if (serieReceita.length < 2) serieReceita.push(serieReceita[0] || 0);

  const goldColor = (typeof getComputedStyle === 'function')
    ? (getComputedStyle(document.documentElement).getPropertyValue('--gold').trim() || '#D4AF37')
    : '#D4AF37';
  if (typeof desenharSparkline === 'function') {
    setTimeout(() => {
      try { desenharSparkline('ticket-sparkline', serieReceita, goldColor); }
      catch (e) { console.warn('[Sparkline]', e); }
    }, 40);
  }

  // % variação: receita do período vs período anterior de igual duração (não ticket)
  const duracaoMs = (dFim - dInicio) + msDia;
  const prevFim = new Date(dInicio.getTime() - msDia);
  const prevInicio = new Date(prevFim.getTime() - duracaoMs + msDia);
  const prevInicioStr = formatarDataISO(prevInicio);
  const prevFimStr = formatarDataISO(prevFim);
  const totalPrev = _somaVendas(movs.filter(m =>
    m.tipo === 'venda' && m.data >= prevInicioStr && m.data <= prevFimStr
  ));

  const percentEl = document.getElementById('ticket-trend-percent');
  if (percentEl) {
    if (totalPrev > 0 && isFinite(totalRev)) {
      const variacao = ((totalRev - totalPrev) / totalPrev) * 100;
      const subiu = variacao >= 0;
      percentEl.className = subiu ? 'trend-up' : 'trend-down';
      const _absVar = Math.abs(variacao);
      let _pctTxt;
      if (!_absVar) {
        _pctTxt = '0';
      } else {
        _pctTxt = _absVar.toFixed(1).replace(/\.0$/, '');
      }
      percentEl.innerHTML = `<span class="trend-arrow">${subiu ? '↑' : '↓'}</span> ${_pctTxt}%`;
      percentEl.style.display = 'inline-flex';
      percentEl.setAttribute('title', 'Receita vs período anterior equivalente');
    } else if (totalRev > 0 && totalPrev === 0) {
      percentEl.className = 'trend-up';
      percentEl.innerHTML = `<span class="trend-arrow">↑</span> novo`;
      percentEl.style.display = 'inline-flex';
      percentEl.setAttribute('title', 'Sem vendas no período anterior');
    } else {
      percentEl.className = 'trend-up';
      percentEl.textContent = '—';
      percentEl.style.display = 'inline-flex';
      percentEl.removeAttribute('title');
    }
  }
  const trendPeriodEl = document.getElementById('ticket-trend-period');
  if (trendPeriodEl) trendPeriodEl.textContent = 'vs período anterior';

  // --- Meta mensal (BPFinance) + saldo de caixa (admin) ---
  const metaWrap = document.getElementById('dash-meta-wrap');
  if (metaWrap) {
    let prog = null;
    try {
      if (window.BPFinance && typeof BPFinance.getProgressoMetaSalao === 'function') {
        prog = BPFinance.getProgressoMetaSalao();
      }
    } catch (_) {}
    if (prog && prog.meta > 0) {
      metaWrap.hidden = false;
      const fill = document.getElementById('dash-meta-fill');
      const label = document.getElementById('dash-meta-label');
      if (fill) fill.style.width = Math.min(100, prog.pct) + '%';
      if (label) {
        label.textContent = fmtKz(prog.volume) + ' / ' + fmtKz(prog.meta) + ' · ' + prog.pct + '%' +
          (prog.atingida ? ' · Meta atingida' : '');
      }
    } else {
      metaWrap.hidden = true;
    }
  }
  const caixaEl = document.getElementById('dash-caixa-saldo');
  if (caixaEl) {
    const hojeStr = hoje();
    const entradas = _somaVendas(movs.filter(m => m.tipo === 'venda' && m.data === hojeStr && String(m.status || '').toLowerCase() !== 'cancelado'));
    const saidas = movs.filter(m => m.tipo === 'despesa' && m.data === hojeStr)
      .reduce((s, m) => s + (Number(m.valor) || 0), 0);
    const saldo = (Number(state.config && state.config.fundo) || 0) + entradas - saidas;
    caixaEl.textContent = fmtKz(saldo);
  }

  // Próximos atendimentos — só HOJE, status agendado, hora >= agora
  if (typeof atualizarAgendamentosExpirados === 'function') atualizarAgendamentosExpirados();
  const hojeStr2 = hoje();
  const agora = new Date();
  const agHoje = ags.filter(a => a.data === hojeStr2);
  const proximos = agHoje
    .filter(a => {
      if (_statusAg(a) !== 'agendado') return false;
      const hora = String(a.hora || '00:00').slice(0, 5);
      const agDate = new Date(a.data + 'T' + hora + ':00');
      return !isNaN(agDate.getTime()) && agDate >= agora;
    })
    .sort((a, b) => String(a.hora || '').localeCompare(String(b.hora || '')))
    .slice(0, 6);

  const cont = document.getElementById('agenda-today-list');
  if (cont) {
    if (proximos.length === 0) {
      const temRealizados = agHoje.some(a => _statusAg(a) === 'realizado');
      const temExpirados = agHoje.some(a => {
        const st = _statusAg(a);
        return st === 'nao_realizado' || st === 'nao-realizado';
      });
      let mensagemVazio = 'Sem atendimentos pendentes';
      if (temRealizados && !temExpirados) mensagemVazio = 'Todos os atendimentos de hoje foram realizados';
      else if (temExpirados && !temRealizados) mensagemVazio = 'Sem atendimentos pendentes';
      cont.innerHTML = `<div class="empty-state"><p>${mensagemVazio}</p></div>`;
    } else {
      cont.innerHTML = proximos.map(a => {
        const nomeProf = getProfissionalNome(a.profissional_id);
        const inicial = (a.cliente || '?').charAt(0).toUpperCase();
        let avHtml = `<div class="avatar">${escHtml(inicial)}</div>`;
        try {
          const cli = (state.clientes || []).find(c => c.nome === a.cliente || c.id === a.cliente_id);
          const fotoSrc = cli && (window.BPMedia && BPMedia.resolveFotoSrc
            ? BPMedia.resolveFotoSrc(cli)
            : (cli.foto || cli.foto_url));
          if (fotoSrc) {
            avHtml = `<div class="avatar bp-avatar-img"><img src="${fotoSrc}" alt="" loading="lazy" decoding="async"></div>`;
          } else if (window.BPAvatars && typeof BPAvatars.avatarDataUrl === 'function') {
            avHtml = `<div class="avatar bp-avatar-img"><img src="${BPAvatars.avatarDataUrl(a.cliente || '')}" alt="" loading="lazy" decoding="async"></div>`;
          }
        } catch (_) {}
        return `
          <div class="list-item bp-ag-card" data-agenda-id="${a.id}" style="cursor:pointer;">
            ${avHtml}
            <div class="info">
              <div class="title dash-next-title">${escHtml(a.servico || 'Serviço')}</div>
              <div class="sub">${escHtml(a.cliente || 'Cliente')} · ${escHtml(String(a.hora || '').slice(0, 5))} · ${escHtml(nomeProf)}</div>
            </div>
            <div class="action dash-next-action">
              <span class="pill pill-warning">Pendente</span>
              <span class="dash-next-price">${fmtKz(a.preco)}</span>
            </div>
          </div>`;
      }).join('');
    }
  }
  const countEl = document.getElementById('agenda-count');
  if (countEl) {
    const n = proximos.length;
    countEl.textContent = n === 0 ? '0 pendentes' : (n === 1 ? '1 pendente' : n + ' pendentes');
  }

  const h = new Date().getHours();
  
  try { if (typeof initKpiTemporalUi === 'function') initKpiTemporalUi(); if (typeof actualizarKpiMiniChart === 'function') actualizarKpiMiniChart(); } catch (eK) { console.warn('[kpi-temporal]', eK); }
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
function _bpPlacePeriodoSheetNear(anchorEl) {
  try {
    var sheet = document.querySelector('#modal-periodo-dashboard .modal-sheet');
    if (!sheet) return;
    var btn = anchorEl || window.__bpPeriodoAnchor || document.getElementById('dash-filter-icon') || document.getElementById('chart-filter-toggle');
    if (!btn || !btn.getBoundingClientRect) {
      sheet.style.top = '64px';
      sheet.style.left = '12px';
      return;
    }
    window.__bpPeriodoAnchor = btn;
    var r = btn.getBoundingClientRect();
    var w = Math.min(260, window.innerWidth * 0.88);
    var left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8));
    var top = Math.min(Math.max(8, r.bottom + 6), window.innerHeight - 140);
    sheet.style.position = 'fixed';
    sheet.style.top = Math.round(top) + 'px';
    sheet.style.left = Math.round(left) + 'px';
    sheet.style.width = Math.round(w) + 'px';
    sheet.style.right = 'auto';
    sheet.style.zIndex = '1200';
  } catch (_) {}
}
if (typeof window !== 'undefined') window._bpPlacePeriodoSheetNear = _bpPlacePeriodoSheetNear;
(function bpBindPeriodoSheetFollow() {
  function reposition() {
    var overlay = document.getElementById('modal-periodo-dashboard');
    if (!overlay || !overlay.classList.contains('open')) return;
    if (typeof _bpPlacePeriodoSheetNear === 'function') _bpPlacePeriodoSheetNear(window.__bpPeriodoAnchor);
  }
  window.addEventListener('scroll', reposition, true);
  window.addEventListener('resize', reposition);
  var main = document.querySelector('.main-content');
  if (main) main.addEventListener('scroll', reposition, { passive: true });
})();


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
  else {
    openModal('modal-periodo-dashboard');
    window.__bpPeriodoAnchor = document.getElementById('dash-filter-icon');
    _bpPlacePeriodoSheetNear(window.__bpPeriodoAnchor);
    setTimeout(function () { window.__bpPeriodoAnchor = document.getElementById('dash-filter-icon');
    _bpPlacePeriodoSheetNear(window.__bpPeriodoAnchor); }, 30);
  }
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
    /* Gráfico no mesmo período dos KPIs (dia → série horária no render) */
    state.chartPeriodo = tipo;
    try { localStorage.setItem('bp_chart_periodo', state.chartPeriodo); } catch (_) {}
    closeModal('modal-periodo-dashboard');
    try { _bpSyncPeriodLabels((this.textContent || '').trim()); } catch (_) {}
    try { if (typeof _bpHaptic === 'function') _bpHaptic('select'); } catch (_) {}
    try { if (typeof _bpSetChartFilterActive === 'function') _bpSetChartFilterActive(tipo); } catch (_) {}
    renderDashboard();
    if (typeof renderizarGrafico === 'function') renderizarGrafico();
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
  try { if (typeof _bpHaptic === 'function') _bpHaptic('success'); } catch (_) {}
  try {
    var _civ = (typeof calcularIntervaloPeriodo === 'function')
      ? calcularIntervaloPeriodo('custom', 0)
      : null;
    _bpSyncPeriodLabels(_civ && _civ.label ? _civ.label : (ini + ' — ' + fim));
  } catch (_) {}
  state.chartPeriodo = (ini === fim) ? 'dia' : 'semana';
  try { localStorage.setItem('bp_chart_periodo', state.chartPeriodo); } catch (_) {}
  renderDashboard();
  if (typeof renderizarGrafico === 'function') renderizarGrafico();
});

// Fechar o popover ao tocar fora dele (mesmo padrão já usado no menu hambúrguer)
document.addEventListener('click', function(e) {
  const overlay = document.getElementById('modal-periodo-dashboard');
  const icon = document.getElementById('dash-filter-icon');
  const chartToggle = document.getElementById('chart-filter-toggle');
  if (!overlay || !overlay.classList.contains('open')) return;
  if (overlay.contains(e.target)) return;
  if (icon && (e.target === icon || icon.contains(e.target))) return;
  if (chartToggle && (e.target === chartToggle || chartToggle.contains(e.target))) return;
  closeModal('modal-periodo-dashboard');
});

// ====================================================================
//  AGENDA — com filtro, expiração, badge e dia exato
// ====================================================================

// Estado do filtro da agenda
const agendaFilterKey = 'bp_agenda_filter';
let agendaFilter = localStorage.getItem(agendaFilterKey) || 'hoje';

// Função para verificar se um agendamento expirou
function agendamentoExpirado(ag) {
  if (!ag || !ag.data) return false;
  const hora = String(ag.hora || '00:00').slice(0, 5);
  const agDate = new Date(ag.data + 'T' + hora + ':00');
  if (isNaN(agDate.getTime())) return false;
  return agDate < new Date();
}

// Atualiza expirados sem reentrar em render (evita loop render → expirar → render)
let _expirandoAgenda = false;
function atualizarAgendamentosExpirados() {
  if (_expirandoAgenda || !state.agendamentos) return;
  _expirandoAgenda = true;
  let atualizado = false;
  try {
    for (const ag of state.agendamentos) {
      if (_statusAg(ag) === 'agendado' && agendamentoExpirado(ag)) {
        ag.status = 'nao_realizado';
        ag.updated_at = new Date().toISOString();
        if (typeof dbPut === 'function') dbPut('agendamentos', ag);
        atualizado = true;
      }
    }
  } finally {
    _expirandoAgenda = false;
  }
  // NÃO chama renderAgendaFull aqui — o caller já renderiza
  if (atualizado && typeof renderBadges === 'function') {
    // badge only; avoid recursive full render
    try {
      const agora = new Date();
      const disponiveis = state.agendamentos.filter(a => {
        if (_statusAg(a) !== 'agendado') return false;
        const hora = String(a.hora || '00:00').slice(0, 5);
        const agDate = new Date(a.data + 'T' + hora + ':00');
        return !isNaN(agDate.getTime()) && agDate >= agora;
      });
      const badge = document.getElementById('agenda-badge');
      if (badge) {
        const count = disponiveis.length;
        if (count > 0) {
          badge.textContent = count > 9 ? '9+' : String(count);
          badge.classList.add('show');
        } else {
          badge.classList.remove('show');
        }
      }
    } catch (_) {}
  }
}

// Função para obter agendamentos filtrados (com suporte a dia exato)
function getAgendamentosFiltrados() {
  atualizarAgendamentosExpirados();

  const hojeStr = hoje();
  const list = state.agendamentos || [];

  if (agendaFilter === 'dia') {
    const dataExata = localStorage.getItem('bp_agenda_data_exata') || hojeStr;
    return list.filter(a => a.data === dataExata && _statusAg(a) !== 'cancelado');
  }

  if (agendaFilter === 'realizados') {
    return list.filter(a => _statusAg(a) === 'realizado');
  }
  if (agendaFilter === 'cancelados') {
    return list.filter(a => _statusAg(a) === 'cancelado');
  }
  if (agendaFilter === 'nao_realizado') {
    return list.filter(a => {
      const st = _statusAg(a);
      return st === 'nao_realizado' || st === 'nao-realizado' || st === 'expirado';
    });
  }
  if (agendaFilter === 'pendentes') {
    const hojeP = hojeStr;
    return list.filter(a => {
      const st = _statusAg(a);
      return st === 'agendado' && a.data >= hojeP;
    }).sort((a, b) => {
      if (a.data !== b.data) return String(a.data).localeCompare(String(b.data));
      return String(a.hora || '').localeCompare(String(b.hora || ''));
    });
  }
  if (agendaFilter === '90dias') {
    const d90 = new Date(hojeStr + 'T00:00:00');
    d90.setDate(d90.getDate() - 89);
    const inicio90 = formatarDataISO(d90);
    return list.filter(a => a.data >= inicio90 && a.data <= hojeStr && _statusAg(a) !== 'cancelado');
  }

  switch (agendaFilter) {
    case 'hoje': {
      const dataHoje = state.agendaDataAtual || hojeStr;
      return list.filter(a => a.data === dataHoje && _statusAg(a) !== 'cancelado');
    }
    case 'semana': {
      // Segunda → domingo (igual ao dashboard / mercado AO)
      const d = new Date(hojeStr + 'T00:00:00');
      const diaSemana = (d.getDay() + 6) % 7;
      const inicioSemana = new Date(d);
      inicioSemana.setDate(d.getDate() - diaSemana);
      const fimSemana = new Date(inicioSemana);
      fimSemana.setDate(inicioSemana.getDate() + 6);
      const inicio = formatarDataISO(inicioSemana);
      const fim = formatarDataISO(fimSemana);
      return list.filter(a => a.data >= inicio && a.data <= fim && _statusAg(a) !== 'cancelado');
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
  } else if (agendaFilter === 'nao_realizado') {
    label.textContent = 'Não realizados';
  } else if (agendaFilter === 'pendentes') {
    label.textContent = 'Pendentes';
  } else if (agendaFilter === '90dias') {
    label.textContent = 'Últimos 90 dias';
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
  const agrupar = (agendaFilter !== 'hoje' && agendaFilter !== 'dia' && agendaFilter !== 'pendentes');
  let html = '';
  const hojeStrR = hoje();
  // Ponto 12: pendentes de HOJE em destaque (apenas quando o dia visível é hoje)
  const isViewingHoje = (agendaFilter === 'hoje' && (state.agendaDataAtual || hojeStrR) === hojeStrR)
    || (agendaFilter === 'dia' && (localStorage.getItem('bp_agenda_data_exata') || hojeStrR) === hojeStrR);
  if (isViewingHoje && (agendaFilter === 'hoje' || agendaFilter === 'dia')) {
    const porRealizar = ags.filter(a => _statusAg(a) === 'agendado');
    const resto = ags.filter(a => _statusAg(a) !== 'agendado');
    if (porRealizar.length) {
      html += '<div class="bp-ag-section-title"><span class="bp-ag-pulse-dot" aria-hidden="true"></span>Agendamentos por realizar hoje</div>';
      html += porRealizar.map(a => renderAgendaItem(a, { pulse: true })).join('');
    }
    if (resto.length) {
      if (porRealizar.length) html += '<div class="bp-ag-section-title bp-ag-section-title--muted">Outros de hoje</div>';
      html += resto.map(a => renderAgendaItem(a)).join('');
    }
  } else if (agrupar) {
    const grupos = {};
    ags.forEach(a => {
      if (!grupos[a.data]) grupos[a.data] = [];
      grupos[a.data].push(a);
    });
    const datas = Object.keys(grupos).sort();
    datas.forEach(data => {
      const dataLabel = data === hoje() ? 'Hoje' : new Date(data + 'T00:00:00').toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' });
      html += `<div class="bp-ag-date-label">${dataLabel}</div>`;
      html += grupos[data].map(a => renderAgendaItem(a, data === hojeStrR ? { pulse: _statusAg(a) === 'agendado' } : null)).join('');
    });
  } else {
    html = ags.map(a => renderAgendaItem(a, { pulse: agendaFilter === 'pendentes' && _statusAg(a) === 'agendado' })).join('');
  }
  cont.innerHTML = html;

  // Bolinha no filtro Pendentes
  try {
    const pendBtn = document.getElementById('agenda-filter-pendentes');
    if (pendBtn) {
      const nPend = (state.agendamentos || []).filter(a => _statusAg(a) === 'agendado' && a.data >= hojeStrR).length;
      pendBtn.classList.toggle('has-pending', nPend > 0);
      pendBtn.setAttribute('data-count', String(nPend));
    }
  } catch (_) {}

  // Listeners para "Finalizar" (apenas os que não estão expirados)
  cont.querySelectorAll('[data-action="finalizar"]').forEach(btn => {
    btn.addEventListener('click', function() {
      const id = this.dataset.id;
      if (id) abrirFinalizarAtendimento(id);
    });
  });

  try {
    if (typeof bpCheckExpiringAppointments === 'function') bpCheckExpiringAppointments();
  } catch (_) {}
}

function renderAgendaItem(a, opts) {
  // Leitura apenas — expiração é responsabilidade de atualizarAgendamentosExpirados
  const st = _statusAg(a);
  const isRealizado = st === 'realizado';
  const isCancelado = st === 'cancelado';
  const isExpirado = st === 'nao_realizado' || st === 'nao-realizado' || st === 'expirado';
  const isAgendado = st === 'agendado';
  const podeFinalizar = isAgendado && !agendamentoExpirado(a);
  const podeCancelar = isAgendado;
  const nomeProf = getProfissionalNome(a.profissional_id);

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

  // Fallback se polish não estiver activo — mesma hierarquia de acções
  if (window.BPAgendaUI && typeof BPAgendaUI.renderAgendaItemPro === 'function') {
    return BPAgendaUI.renderAgendaItemPro(a, opts);
  }
  const hora = String(a.hora || '').slice(0, 5);
  const pulseCls = (opts && opts.pulse) ? ' bp-ag-card--pulse' : '';
  return `
    <div class="list-item bp-ag-card${pulseCls}" data-agenda-id="${a.id}">
      <div class="avatar bp-ag-avatar">${escHtml((a.cliente || '?').charAt(0).toUpperCase())}</div>
      <div class="info bp-ag-info">
        <div class="bp-ag-top">
          <span class="bp-ag-time">${escHtml(hora)}</span>
          <span class="bp-ag-status ${statusClass === 'pill-success' ? 'bp-ag-st-ok' : statusClass === 'pill-danger' ? 'bp-ag-st-no' : statusClass === 'pill-gray' ? 'bp-ag-st-off' : 'bp-ag-st-agendado'}">${statusLabel}</span>
        </div>
        <div class="title">${escHtml(a.servico || 'Serviço')}</div>
        <div class="sub">${escHtml(a.cliente || 'Cliente')}</div>
        <div class="bp-ag-meta">
          <span class="bp-ag-prof">${escHtml(nomeProf)}</span>
          <span class="bp-ag-price">${fmtKz(a.preco)}</span>
        </div>
        ${(podeFinalizar || podeCancelar) ? `
        <div class="bp-ag-actions" style="--bp-ag-cols:2">
          ${podeFinalizar ? `<button type="button" class="btn btn-sm btn-primary bp-ag-btn" data-id="${a.id}" data-action="finalizar">Finalizar</button>` : ''}
          ${podeCancelar ? `<button type="button" class="btn btn-sm btn-secondary bp-ag-btn bp-ag-btn-muted" data-id="${a.id}" data-action="cancelar-agenda" data-role="admin,gerente">Cancelar</button>` : ''}
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
  atualizarAgendamentosExpirados();
  const agora = new Date();
  const disponiveis = (state.agendamentos || []).filter(a => {
    if (_statusAg(a) !== 'agendado') return false;
    const hora = String(a.hora || '00:00').slice(0, 5);
    const agDate = new Date(a.data + 'T' + hora + ':00');
    return !isNaN(agDate.getTime()) && agDate >= agora;
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
  document.querySelectorAll('#agenda-filter-popover .agenda-periodo-filter').forEach(btn => {
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

// Listeners só dos filtros da AGENDA (não misturar com caixa)
document.querySelectorAll('#agenda-filter-popover .agenda-periodo-filter').forEach(btn => {
  btn.addEventListener('click', function(e) {
    e.stopPropagation();
    const periodo = this.dataset.periodo;

    // Dia exacto: mostrar input e abrir date picker (mobile-friendly)
    if (periodo === 'dia') {
      // Só reagir a botões da agenda (não caixa)
      if (this.classList.contains('caixa-periodo-filter') || this.classList.contains('caixa-loc-periodo')) {
        return;
      }
      const input = document.getElementById('agenda-data-exata');
      if (!input) {
        toast('Selector de data indisponível', 'error');
        return;
      }
      // Tornar interativo (estava opacity:0;pointer-events:none)
      input.style.cssText = 'display:block;position:static;opacity:1;pointer-events:auto;width:100%;height:auto;margin:8px 0 0;padding:10px;border-radius:8px;border:1px solid var(--border-soft);background:var(--card-white,#fff);font-size:16px;';
      const pop = document.getElementById('agenda-filter-popover');
      if (pop && input.parentElement !== pop) {
        pop.appendChild(input);
      }
      if (!input.value) input.value = (typeof hoje === 'function' ? hoje() : '');
      input.focus();
      try {
        if (typeof input.showPicker === 'function') input.showPicker();
        else input.click();
      } catch (_) {
        try { input.click(); } catch (__) {}
      }
      // Se o utilizador já tinha data, aplicar logo
      if (input.value) {
        agendaFilter = 'dia';
        localStorage.setItem(agendaFilterKey, 'dia');
        localStorage.setItem('bp_agenda_data_exata', input.value);
        atualizarFiltroAgendaUI();
        // manter popover aberto até change ou segundo toque — mas render já
        renderAgendaFull();
        renderBadges();
      }
      return;
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
    state.agendaDataAtual = data;
    atualizarFiltroAgendaUI();
    fecharPopover();
    renderAgendaFull();
    renderBadges();
  }
});
document.getElementById('agenda-data-exata')?.addEventListener('input', function() {
  if (this.value) this.dispatchEvent(new Event('change'));
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

// ====================================================================
//  KPI mini-chart + espaço temporal (7d / 30d / mês / ano)
// ====================================================================
function _kpiSerieReceita(intervalo) {
  const movs = state.movimentos || [];
  const inicio = new Date((intervalo.inicio || hoje()) + 'T00:00:00');
  const fim = new Date((intervalo.fim || hoje()) + 'T00:00:00');
  const ms = 86400000;
  const dias = Math.max(1, Math.round((fim - inicio) / ms) + 1);
  const passo = dias > 31 ? Math.ceil(dias / 31) : 1;
  const serie = [];
  for (let i = 0; i < dias; i += passo) {
    const d = new Date(inicio.getTime() + i * ms);
    const ds = formatarDataISO(d);
    const total = movs.filter(m => m.tipo === 'venda' && m.data === ds)
      .reduce((s, v) => s + (Number(v.valor) || 0), 0);
    serie.push(total);
  }
  return serie;
}

function _desenharKpiSpark(canvasId, serie) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  const gold = (getComputedStyle(document.documentElement).getPropertyValue('--gold') || '#c9a227').trim();
  if (!serie || !serie.length) {
    ctx.strokeStyle = gold;
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.moveTo(4, h / 2);
    ctx.lineTo(w - 4, h / 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    return;
  }
  const max = Math.max.apply(null, serie.concat([1]));
  const pad = 3;
  ctx.beginPath();
  serie.forEach(function (v, i) {
    const x = pad + (i / Math.max(serie.length - 1, 1)) * (w - pad * 2);
    const y = h - pad - (v / max) * (h - pad * 2);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = gold;
  ctx.lineWidth = 1.75;
  ctx.lineJoin = 'round';
  ctx.stroke();
  // fill suave
  const lastX = pad + ((serie.length - 1) / Math.max(serie.length - 1, 1)) * (w - pad * 2);
  ctx.lineTo(lastX, h - pad);
  ctx.lineTo(pad, h - pad);
  ctx.closePath();
  ctx.fillStyle = gold;
  ctx.globalAlpha = 0.12;
  ctx.fill();
  ctx.globalAlpha = 1;
}

function _kpiTemporalLabels() {
  return { '7dias': '7 dias', '30dias': '30 dias', mes: 'Mês', ano: 'Ano' };
}

function actualizarKpiMiniChart() {
  const intervalo = getIntervaloDashAtual();
  const serie = _kpiSerieReceita(intervalo);
  _desenharKpiSpark('kpi-mini-chart', serie);
  const lab = document.getElementById('kpi-mini-chart-label');
  const map = _kpiTemporalLabels();
  const text = map[state.dashPeriodo] || (intervalo.label || 'Período');
  if (lab) lab.textContent = text;
  const hint = document.getElementById('kpi-temporal-hint');
  if (hint) hint.textContent = (intervalo.label || text) + ' · toque para alterar';
}

let _kpiTemporalDraft = null;
function abrirKpiTemporalSheet() {
  _kpiTemporalDraft = state.dashPeriodo;
  // Se período actual não é um dos 4, default 7dias no UI (sem aplicar ainda)
  const opts = ['7dias', '30dias', 'mes', 'ano'];
  if (opts.indexOf(_kpiTemporalDraft) < 0) _kpiTemporalDraft = '7dias';
  document.querySelectorAll('.kpi-temporal-opt').forEach(function (b) {
    b.classList.toggle('is-active', b.dataset.periodo === _kpiTemporalDraft);
  });
  _refreshKpiTemporalPreview(_kpiTemporalDraft);
  if (typeof openModal === 'function') openModal('modal-kpi-temporal');
  else {
    const el = document.getElementById('modal-kpi-temporal');
    if (el) { el.classList.add('open'); el.style.display = 'flex'; }
  }
}

function _refreshKpiTemporalPreview(periodo) {
  const intervalo = calcularIntervaloPeriodo(periodo, 0);
  const movs = (state.movimentos || []).filter(function (m) {
    return m.tipo === 'venda' && String(m.status || '').toLowerCase() !== 'cancelado' && m.data >= intervalo.inicio && m.data <= intervalo.fim;
  });
  const rev = _somaVendas(movs);
  const rangeEl = document.getElementById('kpi-temporal-range');
  const revEl = document.getElementById('kpi-temporal-rev');
  const nEl = document.getElementById('kpi-temporal-n');
  if (rangeEl) rangeEl.textContent = (intervalo.label || '') + ' · ' + formatarDataCurta(intervalo.inicio) + ' – ' + formatarDataCurta(intervalo.fim);
  if (revEl) revEl.textContent = typeof fmtKz === 'function' ? fmtKz(rev) : String(rev);
  if (nEl) nEl.textContent = String(movs.length);
  _desenharKpiSpark('kpi-temporal-chart', _kpiSerieReceita(intervalo));
}

function aplicarKpiTemporal(periodo) {
  if (!periodo) return;
  state.dashPeriodo = periodo;
  state.dashOffset = 0;
  try {
    localStorage.setItem('bp_dash_periodo', periodo);
    localStorage.setItem('bp_dash_offset', '0');
  } catch (_) {}
  // Gráfico principal partilha o intervalo do dash (getIntervaloDashAtual)
  if (periodo === 'hora') {
    state.chartPeriodo = 'hora';
  } else {
    state.chartPeriodo = (periodo === '7dias') ? 'semana' : ((periodo === '30dias') ? 'mes' : periodo);
  }
  try { localStorage.setItem('bp_chart_periodo', state.chartPeriodo); } catch (_) {}
  if (typeof _bpSetChartFilterActive === 'function') {
    try { _bpSetChartFilterActive(state.chartPeriodo === 'semana' && periodo === '7dias' ? 'semana' : (periodo === '30dias' ? 'mes' : state.chartPeriodo)); } catch (_) {}
  }
  if (typeof closeModal === 'function') closeModal('modal-kpi-temporal');
  else {
    var el = document.getElementById('modal-kpi-temporal');
    if (el) { el.classList.remove('open'); el.style.display = ''; }
  }
  if (typeof renderDashboard === 'function') renderDashboard();
  if (typeof renderizarGrafico === 'function') renderizarGrafico();
  actualizarKpiMiniChart();
}

function initKpiTemporalUi() {
  if (window.__bpKpiTemporalInit) {
    actualizarKpiMiniChart();
    return;
  }
  window.__bpKpiTemporalInit = true;
  const btn = document.getElementById('kpi-mini-chart-btn');
  if (btn && !btn.dataset.bound) {
    btn.dataset.bound = '1';
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      abrirKpiTemporalSheet();
    });
  }
  document.querySelectorAll('.kpi-temporal-opt').forEach(function (b) {
    if (b.dataset.bound) return;
    b.dataset.bound = '1';
    b.addEventListener('click', function () {
      _kpiTemporalDraft = this.dataset.periodo;
      document.querySelectorAll('.kpi-temporal-opt').forEach(function (x) {
        x.classList.toggle('is-active', x === b);
      });
      _refreshKpiTemporalPreview(_kpiTemporalDraft);
    });
  });
  const apply = document.getElementById('kpi-temporal-apply');
  if (apply && !apply.dataset.bound) {
    apply.dataset.bound = '1';
    apply.addEventListener('click', function () {
      aplicarKpiTemporal(_kpiTemporalDraft || '7dias');
    });
  }
  const modal = document.getElementById('modal-kpi-temporal');
  if (modal && !modal.dataset.bound) {
    modal.dataset.bound = '1';
    modal.addEventListener('click', function (e) {
      if (e.target === modal || e.target.getAttribute('data-close') === 'modal-kpi-temporal') {
        if (typeof closeModal === 'function') closeModal('modal-kpi-temporal');
      }
    });
  }
  actualizarKpiMiniChart();
}


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

function _normNomeCli(s) {
  return String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Agrega por cliente_id (preferência) e por nome normalizado (legado). */
function _buildStatsMap() {
  const byId = {};
  const byName = {};

  function touch(bucket, key, patch) {
    if (!key) return;
    if (!bucket[key]) bucket[key] = { visitas: 0, totalGasto: 0, datas: [] };
    const row = bucket[key];
    if (patch.visita) row.visitas++;
    if (patch.gasto) row.totalGasto += patch.gasto;
    if (patch.data) row.datas.push(patch.data);
  }

  (state.agendamentos || []).forEach(a => {
    const st = String(a.status || a.estado || '').toLowerCase();
    if (st === 'cancelado') return;
    const nome = a.cliente;
    if (!nome && !a.cliente_id) return;
    // Visita conta agenda realizada ou ainda agendada (presença no salão)
    const conta = st === 'realizado' || st === 'agendado' || !st;
    if (!conta) return;
    const patch = { visita: true, data: a.data || null };
    if (a.cliente_id) touch(byId, String(a.cliente_id), patch);
    if (nome) touch(byName, _normNomeCli(nome), patch);
  });

  (state.movimentos || []).forEach(m => {
    if (m.tipo !== 'venda') return;
    const nome = m.cliente;
    if (!nome && !m.cliente_id) return;
    const patch = { visita: true, gasto: Number(m.valor) || 0, data: m.data || null };
    if (m.cliente_id) touch(byId, String(m.cliente_id), patch);
    if (nome) touch(byName, _normNomeCli(nome), patch);
  });

  function finalize(bucket) {
    Object.keys(bucket).forEach(k => {
      bucket[k].datas.sort();
      const d = bucket[k].datas;
      bucket[k].ultimaVisita = d.length ? d[d.length - 1] : null;
      delete bucket[k].datas;
    });
  }
  finalize(byId);
  finalize(byName);
  return { byId, byName };
}

/**
 * Aceita: objecto cliente | id | nome.
 * Preferência: id → merge com nome se ambos existirem (legado sem id nas vendas).
 */
function getEstatisticasCliente(ref) {
  const key = (state.agendamentos || []).length + ':' + (state.movimentos || []).length;
  if (!_statsCache.map || _statsCache.key !== key) {
    _statsCache = { key, map: _buildStatsMap() };
  }
  const empty = { visitas: 0, totalGasto: 0, ultimaVisita: null };
  if (ref == null || ref === '') return empty;

  let id = null;
  let nome = null;
  if (typeof ref === 'object') {
    id = ref.id || null;
    nome = ref.nome || null;
  } else {
    const s = String(ref);
    const asCli = (state.clientes || []).find(c => c.id === s || c.nome === s);
    if (asCli) {
      id = asCli.id;
      nome = asCli.nome;
    } else {
      nome = s;
    }
  }

  const a = id ? (_statsCache.map.byId[String(id)] || empty) : empty;
  const b = nome ? (_statsCache.map.byName[_normNomeCli(nome)] || empty) : empty;

  // Se há id, preferir id para gasto; visitas = max para não duplicar quando ambos apontam ao mesmo histórico
  if (id && a.visitas) {
    // Histórico com cliente_id: usar byId; acrescentar gasto de byName só se byId não tiver gasto (dados mistos)
    return {
      visitas: Math.max(a.visitas, b.visitas),
      totalGasto: a.totalGasto > 0 ? a.totalGasto : b.totalGasto,
      ultimaVisita: (a.ultimaVisita && b.ultimaVisita)
        ? (a.ultimaVisita > b.ultimaVisita ? a.ultimaVisita : b.ultimaVisita)
        : (a.ultimaVisita || b.ultimaVisita)
    };
  }
  return {
    visitas: b.visitas || a.visitas,
    totalGasto: b.totalGasto || a.totalGasto,
    ultimaVisita: b.ultimaVisita || a.ultimaVisita
  };
}

function resolverClienteIdPorNome(nome) {
  const n = _normNomeCli(nome);
  if (!n) return null;
  const hit = (state.clientes || []).find(c => _normNomeCli(c.nome) === n);
  return hit ? hit.id : null;
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
  const rawSearch = document.getElementById('search-cliente')?.value || '';
  const search = rawSearch.trim().toLowerCase();
  const searchDigits = rawSearch.replace(/\D/g, '');
  const filtro = state.filtroClientes || 'todos';
  let filtered = (state.clientes || []).filter(c => {
    if (!search && !searchDigits) return true;
    const nome = String(c.nome || '').toLowerCase();
    const tel = String(c.telefone || '').replace(/\D/g, '');
    if (search && nome.includes(search)) return true;
    if (searchDigits && tel.includes(searchDigits)) return true;
    if (search && String(c.notas || '').toLowerCase().includes(search)) return true;
    return false;
  });

  if (filtro === 'mais' || filtro === 'menos') {
    filtered = filtered.slice().sort((a, b) => {
      const fa = getEstatisticasCliente(a).visitas;
      const fb = getEstatisticasCliente(b).visitas;
      return filtro === 'mais' ? (fb - fa) : (fa - fb);
    });
  } else {
    filtered = filtered.slice().sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || ''), 'pt'));
  }

  const cont = document.getElementById('clientes-list');
  if (filtered.length === 0) {
    const msg = search || searchDigits
      ? 'Nenhum cliente corresponde à pesquisa'
      : 'Ainda sem clientes — adicione o primeiro';
    cont.innerHTML = `<div class="empty-state">${typeof svgPessoa !== 'undefined' ? svgPessoa : ''}<p>${msg}</p></div>`;
    return;
  }

  // Progressive render: primeiros 60 itens, resto sob demanda (P1 performance)
  const INITIAL = 60;
  const rowHtml = (c) => {
    const { visitas, totalGasto, ultimaVisita } = getEstatisticasCliente(c);
    const clienteNovo = visitas === 0;
    return `
      <div class="list-item cliente-item" data-cliente-id="${c.id}" style="cursor:pointer;">
        <div class="avatar">${(c.nome||'?').charAt(0).toUpperCase()}</div>
        <div class="info">
          <div class="title">${escHtml(c.nome)}</div>
          <div class="sub">${c.telefone ? escHtml(String(c.telefone)) : 'Sem contacto'}${c.notas ? ' · ' + escHtml(c.notas) : ''}</div>
          <div class="cliente-stats">
            <span class="cliente-stat">${visitas} ${visitas === 1 ? 'visita' : 'visitas'}</span>
            ${totalGasto > 0 ? `<span class="cliente-stat cliente-stat--gasto">${fmtKz(totalGasto)} gastos</span>` : ''}
            ${(Number(c.pontos) || 0) > 0 ? `<span class="cliente-stat">${Number(c.pontos)} pts</span>` : ''}
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
  const _num = (v) => Number(v) || 0;
  const entradas = state.movimentos
    .filter(m => m.data === hojeStr && m.tipo === 'venda' && String(m.status || '').toLowerCase() !== 'cancelado')
    .reduce((s, m) => s + _num(m.valor), 0);
  const despesas = state.movimentos
    .filter(m => m.data === hojeStr && m.tipo === 'despesa')
    .reduce((s, m) => s + _num(m.valor), 0);
  const fundo = _num(state.config && state.config.fundo);
  const saldoEl = document.getElementById('caixa-saldo');
  const fundoEl = document.getElementById('caixa-fundo');
  if (saldoEl) saldoEl.textContent = fmtKz(fundo + entradas - despesas);
  if (fundoEl) fundoEl.textContent = fmtKz(fundo);
  // Variação vendas hoje vs ontem (honesta: sem baseline → "—")
  const dOntem = new Date();
  dOntem.setDate(dOntem.getDate() - 1);
  const ontemStr = (typeof formatarDataISO === 'function')
    ? formatarDataISO(dOntem)
    : dOntem.getFullYear() + '-' + String(dOntem.getMonth() + 1).padStart(2, '0') + '-' + String(dOntem.getDate()).padStart(2, '0');
  const totalOntem = state.movimentos
    .filter(m => m.data === ontemStr && m.tipo === 'venda' && String(m.status || '').toLowerCase() !== 'cancelado')
    .reduce((s, m) => s + _num(m.valor), 0);
  const variacaoEl = document.getElementById('caixa-variacao');
  if (variacaoEl) {
    if (totalOntem > 0) {
      const variacao = ((entradas - totalOntem) / totalOntem) * 100;
      const subiu = variacao >= 0;
      variacaoEl.textContent = (subiu ? '↑ ' : '↓ ') + Math.abs(variacao).toFixed(0) + '%';
      variacaoEl.style.color = subiu ? 'var(--green)' : 'var(--red)';
    } else if (entradas > 0) {
      variacaoEl.textContent = '↑ novo';
      variacaoEl.style.color = 'var(--green)';
    } else {
      variacaoEl.textContent = '—';
      variacaoEl.style.color = 'var(--text-muted)';
    }
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
    let avatarHtml;
    if (isV) {
      let cli = null;
      try {
        if (m.cliente_id) cli = (state.clientes || []).find(function (c) { return String(c.id) === String(m.cliente_id); });
        if (!cli && m.cliente) {
          var nn = String(m.cliente).toLowerCase().trim();
          cli = (state.clientes || []).find(function (c) { return String(c.nome || '').toLowerCase().trim() === nn; });
        }
      } catch (_) { cli = null; }
      var src = null;
      if (cli) {
        if (window.BPMedia && typeof BPMedia.resolveFotoSrc === 'function') src = BPMedia.resolveFotoSrc(cli);
        else if (cli.foto) src = cli.foto;
        else if (cli.foto_url) src = cli.foto_url;
      }
      if (src) {
        avatarHtml = '<div class="avatar bp-avatar-img"><img src="' + String(src).replace(/"/g, '&quot;') + '" alt="" loading="lazy" decoding="async"></div>';
      } else if (cli && cli.nome) {
        avatarHtml = '<div class="avatar">' + escHtml(String(cli.nome).charAt(0).toUpperCase()) + '</div>';
      } else if (m.cliente) {
        avatarHtml = '<div class="avatar">' + escHtml(String(m.cliente).charAt(0).toUpperCase()) + '</div>';
      } else {
        avatarHtml = '<div class="avatar" style="background:#E6F4EC;color:var(--green);font-size:0;" aria-hidden="true"><span style="display:block;width:8px;height:8px;border-radius:50%;background:currentColor;margin:auto;"></span></div>';
      }
    } else {
      avatarHtml = '<div class="avatar" style="background:#FDE8E8;color:var(--red);font-size:0;" aria-hidden="true"><span style="display:block;width:8px;height:8px;border-radius:50%;background:currentColor;margin:auto;"></span></div>';
    }
    return `
      <div class="list-item${isV ? ' list-item-venda' : ''}" data-id="${m.id}" data-tipo="${m.tipo}" style="padding-right:${isV ? '32px' : '16px'};">
        ${avatarHtml}
        <div class="info">
          <div class="title">${escHtml(m.descricao||'')}</div>
          <div class="sub">${m.data} · ${m.hora || ''}${m.cliente ? ' · ' + escHtml(m.cliente) : ''}${nomeProf ? ' · ' + escHtml(nomeProf) : ''}${m.tipo === 'despesa' && m.categoria ? ' · ' + escHtml(m.categoria) : ''}</div>
        </div>
        <div class="action" style="color:${isV ? 'var(--green)' : 'var(--red)'};">${isV ? '+' : '−'}${fmtKz(Number(m.valor) || 0)}</div>
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
  const list = (state.movimentos && Array.isArray(state.movimentos)) ? state.movimentos : [];
  return list.filter(m => {
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
    if (periodo === '90dias') {
      const d90 = new Date(now); d90.setDate(d90.getDate() - 89);
      return m.data >= iso(d90);
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
    '90dias': 'Últimos 90 dias',
    mes: 'Movimentos deste Mês',
    ano: 'Movimentos deste Ano',
    dia: 'Movimentos do dia seleccionado',
    tudo: 'Histórico Completo'
  };
  return map[periodo] || 'Movimentos';
}

function _receitaProfMes(profId) {
  const mes = (typeof hoje === 'function' ? hoje() : '').slice(0, 7);
  if (!mes || !profId) return 0;
  return (state.movimentos || []).filter(m =>
    m.tipo === 'venda' && String(m.profissional_id) === String(profId) && String(m.data || '').startsWith(mes)
  ).reduce((s, m) => s + (Number(m.valor) || 0), 0);
}

function renderProfissionais() {
  const cont = document.getElementById('profissionais-list');
  if (!cont) return;
  const plano = typeof getPlanoAtual === 'function' ? getPlanoAtual() : 'trial';
  const aviso = document.getElementById('plano-aviso');
  if (aviso) aviso.style.display = (plano === 'trial' || plano === 'starter') ? 'block' : 'none';

  const activos = (state.profissionais || []).filter(function (p) {
    return typeof isProfissionalAtivo === 'function' ? isProfissionalAtivo(p) : (p.ativo !== false);
  });
  if (!activos.length) {
    cont.innerHTML = `<div class="empty-state">${typeof svgPessoas !== 'undefined' ? svgPessoas : ''}<p>Ainda sem profissionais — adicione o primeiro</p></div>`;
    return;
  }
  const profissionaisOrdenados = [...activos].sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || ''), 'pt'));
  cont.innerHTML = profissionaisOrdenados.map(p => {
    const receita = _receitaProfMes(p.id);
    const meta = Number(p.meta_mensal != null ? p.meta_mensal : p.meta) || 0;
    let statExtra = '';
    if (meta > 0) {
      const pct = Math.min(100, Math.round((receita / meta) * 100));
      statExtra = `<span class="cliente-stat">${pct}% meta</span>`;
    } else if (receita > 0) {
      statExtra = `<span class="cliente-stat cliente-stat--gasto">${fmtKz(receita)}</span>`;
    }
    const contacto = p.contacto ? String(p.contacto).replace(/\D/g, '') : '';
    return `
    <div class="list-item" data-prof-id="${p.id}" style="cursor:pointer;">
      <div class="avatar">${escHtml((p.nome || '?').charAt(0).toUpperCase())}</div>
      <div class="info">
        <div class="title">${escHtml(p.nome || 'Profissional')}</div>
        <div class="sub">${escHtml(p.especialidade || 'Sem especialidade')}${contacto ? ' · ' + escHtml(contacto) : ''}</div>
        <div class="cliente-stats">
          ${statExtra}
          ${p.taxa_comissao != null || p.taxa != null ? `<span class="cliente-stat">${Number(p.taxa_comissao != null ? p.taxa_comissao : p.taxa) || 0}%</span>` : ''}
          ${typeof renderBarraMeta === 'function' ? renderBarraMeta(p.id) : ''}
        </div>
      </div>
      <div class="actions">
        <button class="row-menu-btn" data-action="row-menu" data-tipo="profissional" data-id="${p.id}" data-role="admin" aria-label="Mais ações" aria-haspopup="menu">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.75"/><circle cx="12" cy="12" r="1.75"/><circle cx="12" cy="19" r="1.75"/></svg>
        </button>
      </div>
    </div>`;
  }).join('');
}

function renderServicos() {
  const container = document.getElementById('servicos-list');
  if (!container) return;
  const servicosActivos = (state.servicos || []).filter(function (s) {
    return typeof isServicoAtivo === 'function' ? isServicoAtivo(s) : (s.ativo !== false);
  });
  if (!servicosActivos.length) {
    container.innerHTML = `<div class="empty-state">${typeof svgTesoura !== 'undefined' ? svgTesoura : ''}<p>Ainda sem serviços — adicione o primeiro</p></div>`;
    return;
  }
  const servicosOrdenados = [...servicosActivos].sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || ''), 'pt'));
  container.innerHTML = servicosOrdenados.map(s => {
    const profs = (function () {
      const arr = s.profissionais || [];
      if (!arr.length) return 'Sem profissionais associados';
      return arr.map(function (x) {
        const byId = (state.profissionais || []).find(function (p) { return p.id === x; });
        if (byId) return byId.nome;
        return x;
      }).join(', ');
    })();
    return `
      <div class="list-item" data-servico-id="${s.id}" style="cursor:pointer;">
        <div class="avatar" style="background:var(--gold-light);color:var(--gold-dark);font-size:0;" aria-hidden="true"><span style="display:block;width:8px;height:8px;border-radius:50%;background:currentColor;margin:auto;"></span></div>
        <div class="info">
          <div class="title">${escHtml(s.nome)}</div>
          <div class="sub">${fmtKz(Number(s.precoBase) || 0)} · ${Number(s.duracao || s.duracaoMin || s.minutos || 60) || 60} min · ${escHtml(profs)}</div>
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

  // Verificar se há serviços ativos
  var _servActivosEmpty = (typeof getServicosAtivos === 'function')
    ? getServicosAtivos()
    : (state.servicos || []).filter(function (s) {
        return typeof isServicoAtivo === 'function' ? isServicoAtivo(s) : (s && s.ativo !== false);
      });
  if (!_servActivosEmpty.length) {
    servSel.innerHTML = '<option value="">Nenhum serviço disponível</option>';
    profSel.innerHTML = '<option value="">Nenhum profissional disponível</option>';
    return;
  }

  const prevServico = servSel.value;
  // ET4.2-P1-03: só serviços ativos nos selects de agenda/venda
  var servicosParaSelect = (typeof getServicosAtivos === 'function')
    ? getServicosAtivos()
    : (state.servicos || []).filter(function (s) {
        return typeof isServicoAtivo === 'function' ? isServicoAtivo(s) : (s && s.ativo !== false);
      });
  servSel.innerHTML = '<option value="">Seleccionar serviço</option>' + servicosParaSelect.map(s =>
    `<option value="${escHtml(s.nome)}">${escHtml(s.nome)}</option>`
  ).join('');
  if (prevServico) servSel.value = prevServico;

  const filtrarProfsAgenda = (servicoNome) => {
    // Se não houver profissionais, mostrar opção vazia
    const activos = (state.profissionais || []).filter(function (p) {
      return typeof isProfissionalAtivo === 'function' ? isProfissionalAtivo(p) : (p.ativo !== false);
    });
    if (activos.length === 0) {
      profSel.innerHTML = '<option value="">Nenhum profissional disponível</option>';
      return;
    }

    let profs;
    if (!servicoNome) {
      profs = [];
    } else {
      const serv = state.servicos.find(s => s.nome === servicoNome);
      const nomes = (serv && Array.isArray(serv.profissionais)) ? serv.profissionais : [];
      if (!nomes.length) {
        profs = [];
      } else {
        profs = activos
          .filter(p => nomes.includes(p.nome) || nomes.includes(p.id))
          .map(p => ({ id: p.id, nome: p.nome }));
      }
    }
    const prevProfId = profSel.value;
    profSel.innerHTML = '<option value="">Seleccionar profissional</option>' + profs.map(p =>
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
  const servicosActivos = (state.servicos || []).filter(function (s) {
    return typeof isServicoAtivo === 'function' ? isServicoAtivo(s) : (s.ativo !== false);
  });
  if (servicosActivos.length === 0) {
    catSel.innerHTML = '<option value="">Nenhum serviço disponível</option>';
    profSel.innerHTML = '<option value="">Nenhum profissional disponível</option>';
    return;
  }

  catSel.selectedIndex = -1;

  catSel.innerHTML = `<option value="">Selecionar serviço</option>` +
    servicosActivos.map(s =>
      `<option value="${escHtml(s.nome)}" data-preco="${s.precoBase}">${escHtml(s.nome)}</option>`
    ).join('');

  const filtrarProfsVenda = (servicoNome) => {
    // Se não houver profissionais, mostrar opção vazia
    const activos = (state.profissionais || []).filter(function (p) {
      return typeof isProfissionalAtivo === 'function' ? isProfissionalAtivo(p) : (p.ativo !== false);
    });
    if (activos.length === 0) {
      profSel.innerHTML = '<option value="">Nenhum profissional disponível</option>';
      return;
    }

    let profs;
    if (!servicoNome) {
      // R03: sem serviço seleccionado, não listar profissionais genéricos
      profs = [];
    } else {
      const serv = state.servicos.find(s => s.nome === servicoNome);
      const nomes = (serv && Array.isArray(serv.profissionais)) ? serv.profissionais : [];
      if (!nomes.length) {
        profs = [];
      } else {
        profs = activos
          .filter(p => nomes.includes(p.nome) || nomes.includes(p.id))
          .map(p => ({ id: p.id, nome: p.nome }));
      }
    }
    profSel.innerHTML = `<option value="">Seleccionar profissional</option>` +
      profs.map(p =>
        `<option value="${p.id}">${escHtml(p.nome)}</option>`
      ).join('');
  };

  if (catSel._filterHandler) catSel.removeEventListener('change', catSel._filterHandler);
  catSel._filterHandler = function() {
    filtrarProfsVenda(this.value);
    const opt = this.options[this.selectedIndex];
    const ciValor = document.getElementById('ci-valor');
    if (opt && opt.dataset.preco) {
      if (ciValor) { ciValor.value = opt.dataset.preco; ciValor.disabled = true; ciValor.style.opacity = '0.7'; }
    } else {
      if (ciValor) { ciValor.value = ''; ciValor.disabled = false; ciValor.style.opacity = '1'; }
    }
  };
  catSel.addEventListener('change', catSel._filterHandler);
}

/* ===== FILE: analise-temporal.js ===== */
// ====================================================================
//  analise-temporal.js — Modelo puro de análise do dashboard (Fase 1)
//  Sem DOM. Consome movimentos de venda e intervalos ISO.
// ====================================================================

function _atFmtISO(d) {
  if (typeof formatarDataISO === 'function') return formatarDataISO(d);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function _atParseISO(iso) {
  return new Date(String(iso) + 'T00:00:00');
}

function _atDiasEntre(inicioIso, fimIso) {
  const a = _atParseISO(inicioIso);
  const b = _atParseISO(fimIso);
  return Math.max(1, Math.round((b - a) / 86400000) + 1);
}

/** Período imediatamente anterior com a mesma duração em dias. */
function intervaloAnteriorEspelhado(intervalo) {
  if (!intervalo || !intervalo.inicio || !intervalo.fim) return null;
  const dias = _atDiasEntre(intervalo.inicio, intervalo.fim);
  const ini = _atParseISO(intervalo.inicio);
  const fimAnt = new Date(ini.getTime() - 86400000);
  const iniAnt = new Date(fimAnt.getTime() - (dias - 1) * 86400000);
  return {
    inicio: _atFmtISO(iniAnt),
    fim: _atFmtISO(fimAnt),
    label: 'Período anterior'
  };
}

function _atVendasNoIntervalo(movs, inicio, fim) {
  return (movs || []).filter(function (m) {
    return m && m.tipo === 'venda' && m.data && m.data >= inicio && m.data <= fim;
  });
}

function _atTotais(vendas) {
  var receita = 0;
  for (var i = 0; i < vendas.length; i++) receita += Number(vendas[i].valor) || 0;
  var n = vendas.length;
  return {
    receita: receita,
    nVendas: n,
    ticket: n > 0 ? receita / n : 0
  };
}

function _atLabelDia(iso, dens) {
  var d = _atParseISO(iso);
  if (dens === 'hora') return iso;
  if (dens <= 7) {
    return d.toLocaleDateString('pt-AO', { weekday: 'short' }).replace('.', '');
  }
  if (dens <= 31) {
    return d.toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' }).replace('.', '');
  }
  return d.toLocaleDateString('pt-AO', { month: 'short' }).replace('.', '');
}

/**
 * Série diária (ou por bloco de 2h se modoHora).
 * @param {{inicio:string,fim:string,label?:string}} intervalo
 * @param {Array} movs
 * @param {{modoHora?:boolean}} opts
 */
function buildSerieTemporal(intervalo, movs, opts) {
  opts = opts || {};
  var serie = [];
  if (!intervalo || !intervalo.inicio || !intervalo.fim) return serie;

  if (opts.modoHora) {
    // Dia de referência: intervalo de 1 dia, senão opts.diaRef ou fim
    var ds = opts.diaRef || intervalo.fim;
    if (intervalo.inicio && intervalo.fim && intervalo.inicio === intervalo.fim) {
      ds = intervalo.inicio;
    }
    // Dia anterior (mesmas faixas horárias)
    var dPrev = _atParseISO(ds);
    dPrev.setDate(dPrev.getDate() - 1);
    var dsPrev = _atFmtISO(dPrev);

    // Resolução 1h. janela típica de salão 7h–22h (16 barras legíveis);
    // fora disto agrega em "06h" (madrugada) e "23h" (noite) se houver dados.
    var horas = [];
    for (var h = 7; h <= 22; h++) horas.push(h);

    function vendasHora(diaIso, hora) {
      return (movs || []).filter(function (m) {
        if (!m || m.tipo !== 'venda' || m.data !== diaIso || !m.hora) return false;
        var mh = parseInt(String(m.hora).split(':')[0], 10);
        if (!isFinite(mh)) return false;
        if (hora === 7) return mh <= 7;       // 00–07 agregados no primeiro bucket
        if (hora === 22) return mh >= 22;     // 22–23 no último
        return mh === hora;
      });
    }

    for (var i = 0; i < horas.length; i++) {
      var hr = horas[i];
      var vendas = vendasHora(ds, hr);
      var t = _atTotais(vendas);
      var vendasAnt = vendasHora(dsPrev, hr);
      var tAnt = _atTotais(vendasAnt);
      var delta = t.receita - tAnt.receita;
      var pct = tAnt.receita > 0 ? (delta / tAnt.receita) * 100 : (t.receita > 0 ? 100 : null);
      serie.push({
        data: ds,
        label: String(hr).padStart(2, '0') + 'h',
        hora: hr,
        receita: t.receita,
        nVendas: t.nVendas,
        ticket: t.ticket,
        chave: ds + '-' + hr,
        anterior: {
          data: dsPrev,
          receita: tAnt.receita,
          nVendas: tAnt.nVendas,
          delta: delta,
          pct: pct
        }
      });
    }
    return serie;
  }

  var dias = _atDiasEntre(intervalo.inicio, intervalo.fim);

  // Ano / períodos longos (>90 dias): agregar por mês civil (Jan, Fev…)
  if (dias > 90) {
    var cursor = _atParseISO(intervalo.inicio);
    cursor.setDate(1);
    var limF = _atParseISO(intervalo.fim);
    while (cursor <= limF) {
      var y = cursor.getFullYear();
      var m = cursor.getMonth();
      var mesIni = new Date(y, m, 1);
      var mesFim = new Date(y, m + 1, 0);
      if (mesIni < _atParseISO(intervalo.inicio)) mesIni = _atParseISO(intervalo.inicio);
      if (mesFim > limF) mesFim = limF;
      var isoI = _atFmtISO(mesIni);
      var isoF = _atFmtISO(mesFim);
      var vendasM = _atVendasNoIntervalo(movs, isoI, isoF);
      var totM = _atTotais(vendasM);
      var labM = mesIni.toLocaleDateString('pt-AO', { month: 'short' }).replace('.', '');
      labM = labM.charAt(0).toUpperCase() + labM.slice(1);
      serie.push({
        data: isoI,
        dataFim: isoF,
        label: labM,
        receita: totM.receita,
        nVendas: totM.nVendas,
        ticket: totM.ticket,
        chave: y + '-' + String(m + 1).padStart(2, '0')
      });
      cursor = new Date(y, m + 1, 1);
    }
    return serie;
  }

  var passo = dias > 31 ? Math.ceil(dias / 31) : 1;
  var d0 = _atParseISO(intervalo.inicio);
  for (var i = 0; i < dias; i += passo) {
    var d = new Date(d0.getTime() + i * 86400000);
    var iso = _atFmtISO(d);
    var isoFim = iso;
    if (passo > 1) {
      var dF = new Date(d.getTime() + (passo - 1) * 86400000);
      var lim = _atParseISO(intervalo.fim);
      if (dF > lim) dF = lim;
      isoFim = _atFmtISO(dF);
    }
    var vendas = _atVendasNoIntervalo(movs, iso, isoFim);
    var tot = _atTotais(vendas);
    serie.push({
      data: iso,
      dataFim: isoFim,
      label: _atLabelDia(iso, dias),
      receita: tot.receita,
      nVendas: tot.nVendas,
      ticket: tot.ticket,
      chave: iso
    });
  }
  return serie;
}

function _atTendencia(pct) {
  if (pct == null || !isFinite(pct)) return null;
  if (pct >= 5) return 'crescimento';
  if (pct <= -5) return 'queda';
  return 'estavel';
}

function _atTendenciaLabel(t) {
  if (t === 'crescimento') return 'Receita em crescimento';
  if (t === 'queda') return 'Receita em queda';
  if (t === 'estavel') return 'Receita estável';
  return null;
}

/**
 * Modelo completo de análise temporal.
 */
function buildAnaliseTemporal(intervalo, movs, opts) {
  opts = opts || {};
  movs = movs || [];
  var serie = buildSerieTemporal(intervalo, movs, opts);
  var vendas = intervalo
    ? _atVendasNoIntervalo(movs, intervalo.inicio, intervalo.fim)
    : [];
  var totais = _atTotais(vendas);

  var antInt = intervaloAnteriorEspelhado(intervalo);
  var anterior = null;
  if (antInt) {
    var vendasAnt = _atVendasNoIntervalo(movs, antInt.inicio, antInt.fim);
    var totAnt = _atTotais(vendasAnt);
    // Só comparar se o período anterior tiver alguma actividade OU o actual tiver
    // (evita “0%” sem contexto quando ambos vazios)
    if (totAnt.nVendas > 0 || totais.nVendas > 0) {
      var delta = totais.receita - totAnt.receita;
      var pct = totAnt.receita > 0
        ? (delta / totAnt.receita) * 100
        : (totais.receita > 0 ? 100 : null);
      anterior = {
        intervalo: antInt,
        totais: totAnt,
        delta: delta,
        pct: pct
      };
    }
  }

  var melhor = null;
  var pior = null;
  for (var s = 0; s < serie.length; s++) {
    var pt = serie[s];
    if (!pt || pt.receita <= 0) continue;
    if (!melhor || pt.receita > melhor.receita) melhor = pt;
    if (!pior || pt.receita < pior.receita) pior = pt;
  }

  var diasComReceita = serie.filter(function (p) { return p.receita > 0; }).length;
  var mediaDiaria = diasComReceita > 0
    ? totais.receita / Math.max(diasComReceita, 1)
    : 0;
  // média sobre todos os buckets da série (para linha no gráfico)
  var mediaSerie = serie.length > 0
    ? serie.reduce(function (a, p) { return a + p.receita; }, 0) / serie.length
    : 0;

  var tendencia = anterior && anterior.pct != null ? _atTendencia(anterior.pct) : null;

  // Em modo hora: totais do dia de referência; anterior = dia civil anterior
  var diaRef = null;
  if (opts.modoHora && serie.length) {
    diaRef = serie[0].data;
    var vendasDia = _atVendasNoIntervalo(movs, diaRef, diaRef);
    totais = _atTotais(vendasDia);
    var dAnt = _atParseISO(diaRef);
    dAnt.setDate(dAnt.getDate() - 1);
    var diaAntIso = _atFmtISO(dAnt);
    var vendasDiaAnt = _atVendasNoIntervalo(movs, diaAntIso, diaAntIso);
    var totAnt = _atTotais(vendasDiaAnt);
    if (totAnt.nVendas > 0 || totais.nVendas > 0) {
      var deltaD = totais.receita - totAnt.receita;
      var pctD = totAnt.receita > 0 ? (deltaD / totAnt.receita) * 100 : (totais.receita > 0 ? 100 : null);
      anterior = {
        intervalo: { inicio: diaAntIso, fim: diaAntIso, label: 'Dia anterior' },
        totais: totAnt,
        delta: deltaD,
        pct: pctD
      };
      tendencia = pctD != null ? _atTendencia(pctD) : null;
    } else {
      anterior = null;
      tendencia = null;
    }
  }

  var insights = [];
  try {
    insights = gerarInsightsTemporais({
      intervalo: intervalo || null,
      diaRef: diaRef,
      serie: serie,
      totais: totais,
      anterior: anterior,
      extremos: { melhorDia: melhor, piorDia: pior },
      mediaDiaria: mediaDiaria,
      mediaSerie: mediaSerie,
      tendencia: tendencia,
      tendenciaLabel: _atTendenciaLabel(tendencia),
      hasData: totais.nVendas > 0 || totais.receita > 0,
      modoHora: !!opts.modoHora
    }, movs);
  } catch (_ins) { insights = []; }

  return {
    intervalo: intervalo || null,
    diaRef: diaRef,
    serie: serie,
    totais: totais,
    anterior: anterior,
    extremos: { melhorDia: melhor, piorDia: pior },
    mediaDiaria: mediaDiaria,
    mediaSerie: mediaSerie,
    tendencia: tendencia,
    tendenciaLabel: _atTendenciaLabel(tendencia),
    hasData: totais.nVendas > 0 || totais.receita > 0,
    modoHora: !!opts.modoHora,
    insights: insights
  };
}


/**
 * Insights automáticos — apenas com evidência nos dados.
 * Máx. 3 frases. Sem alarmismo.
 */
function gerarInsightsTemporais(analise, movs) {
  var out = [];
  if (!analise || !analise.hasData || !analise.serie || !analise.serie.length) return out;

  var serie = analise.serie;
  var totais = analise.totais;
  var comReceita = serie.filter(function (p) { return p.receita > 0; });
  if (comReceita.length < 1) return out;

  // 1) Concentração no melhor bucket
  var melhor = analise.extremos && analise.extremos.melhorDia;
  if (melhor && totais.receita > 0 && melhor.receita > 0) {
    var pctConc = Math.round((melhor.receita / totais.receita) * 100);
    if (pctConc >= 25 && comReceita.length >= 2) {
      if (analise.modoHora && melhor.hora != null) {
        out.push('A faixa das ' + String(melhor.hora).padStart(2, '0') + 'h concentrou ' + pctConc + '% da receita do dia.');
      } else {
        out.push((melhor.label || 'O melhor dia') + ' concentrou ' + pctConc + '% da receita do período.');
      }
    }
  }

  // 2) Ticket vs período anterior
  if (analise.anterior && analise.anterior.totais && analise.anterior.totais.nVendas > 0 && totais.nVendas > 0) {
    var t0 = analise.anterior.totais.ticket;
    var t1 = totais.ticket;
    if (t0 > 0) {
      var pctT = Math.round(((t1 - t0) / t0) * 1000) / 10;
      if (Math.abs(pctT) >= 8) {
        out.push(pctT >= 0
          ? ('O ticket médio aumentou ' + pctT + '% relativamente ao período anterior.')
          : ('O ticket médio desceu ' + Math.abs(pctT) + '% relativamente ao período anterior.'));
      }
    }
  }

  // 3) Tendência geral de receita
  if (analise.anterior && analise.anterior.pct != null && Math.abs(analise.anterior.pct) >= 8) {
    var p = Math.round(analise.anterior.pct * 10) / 10;
    if (p >= 8) out.push('A receita está ' + p + '% acima do período anterior.');
    else if (p <= -8) out.push('A receita está ' + Math.abs(p) + '% abaixo do período anterior.');
  }

  // 4) Dias acima da média (só série diária com >= 4 pontos com receita)
  if (!analise.modoHora && comReceita.length >= 4 && analise.mediaSerie > 0) {
    var acima = comReceita.filter(function (p) { return p.receita >= analise.mediaSerie; });
    if (acima.length >= 2 && acima.length <= comReceita.length - 1) {
      var nomes = acima.slice(0, 3).map(function (p) { return p.label; }).join(', ');
      out.push('Movimento acima da média em: ' + nomes + (acima.length > 3 ? '…' : '') + '.');
    }
  }

  // 5) Pico horário
  if (analise.modoHora && melhor && melhor.hora != null && comReceita.length >= 3) {
    // já pode ter concentração; se não, mencionar pico simples
    var already = out.some(function (t) { return t.indexOf('faixa') >= 0; });
    if (!already) {
      out.push('O pico de receita foi por volta das ' + String(melhor.hora).padStart(2, '0') + 'h.');
    }
  }

  // 6) Projecção fim do mês (só se estamos no mês corrente e há ritmo)
  try {
    if (!analise.modoHora && analise.intervalo && typeof hoje === 'function') {
      var h = hoje();
      var ini = analise.intervalo.inicio || '';
      var fim = analise.intervalo.fim || '';
      if (ini.slice(0, 7) === h.slice(0, 7) && fim.slice(0, 7) === h.slice(0, 7) && totais.receita > 0) {
        var diaNum = parseInt(h.slice(8, 10), 10);
        var fimMes = new Date(parseInt(h.slice(0, 4), 10), parseInt(h.slice(5, 7), 10), 0);
        var diasMes = fimMes.getDate();
        if (diaNum >= 5 && diaNum < diasMes) {
          var ritmo = totais.receita / diaNum;
          var proj = Math.round(ritmo * diasMes);
          if (proj > totais.receita) {
            out.push('Se mantiver este ritmo, a previsão aproximada para o final do mês é de ' +
              (typeof fmtKz === 'function' ? fmtKz(proj) : String(proj)) + '.');
          }
        }
      }
    }
  } catch (_) {}

  // 7) Top serviço no período (evidência em movimentos)
  if (movs && movs.length && analise.intervalo && out.length < 3) {
    var ini2 = analise.intervalo.inicio;
    var fim2 = analise.intervalo.fim;
    if (analise.modoHora && analise.diaRef) {
      ini2 = fim2 = analise.diaRef;
    }
    var map = {};
    (movs || []).forEach(function (m) {
      if (!m || m.tipo !== 'venda' || !m.data || m.data < ini2 || m.data > fim2) return;
      var nome = m.servico_nome || m.servico || m.descricao;
      if (!nome) return;
      map[nome] = (map[nome] || 0) + (Number(m.valor) || 0);
    });
    var top = Object.keys(map).map(function (k) { return { n: k, v: map[k] }; })
      .sort(function (a, b) { return b.v - a.v; })[0];
    if (top && totais.receita > 0 && top.v / totais.receita >= 0.3) {
      out.push('A maior parte da receita veio de «' + top.n + '».');
    }
  }

  // dedupe e máx 3
  var seen = {};
  var final = [];
  for (var i = 0; i < out.length && final.length < 3; i++) {
    if (seen[out[i]]) continue;
    seen[out[i]] = 1;
    final.push(out[i]);
  }
  return final;
}


if (typeof window !== 'undefined') {
  window.buildAnaliseTemporal = buildAnaliseTemporal;
  window.gerarInsightsTemporais = gerarInsightsTemporais;
  window.analiseParaExport = function (analise) {
    if (!analise) return null;
    return {
      meta: {
        label: (analise.intervalo && analise.intervalo.label) || '',
        inicio: (analise.intervalo && analise.intervalo.inicio) || '',
        fim: (analise.intervalo && analise.intervalo.fim) || '',
        modoHora: !!analise.modoHora,
        diaRef: analise.diaRef || null
      },
      totais: analise.totais,
      anterior: analise.anterior,
      serie: (analise.serie || []).map(function (p) {
        return { data: p.data, label: p.label, receita: p.receita, nVendas: p.nVendas, ticket: p.ticket, hora: p.hora };
      }),
      insights: analise.insights || []
    };
  };
  window.buildSerieTemporal = buildSerieTemporal;
  window.intervaloAnteriorEspelhado = intervaloAnteriorEspelhado;
}


/** Nome de profissional a partir do id (se helpers existirem). */
function _atNomeProf(id, mov) {
  if (typeof getProfissionalNome === 'function' && id) {
    try { return getProfissionalNome(id) || null; } catch (_) {}
  }
  if (mov && mov.profissional) return String(mov.profissional);
  return id ? String(id) : null;
}

function _atNomeServico(mov) {
  if (!mov) return null;
  return mov.servico_nome || mov.servico || mov.descricao || null;
}

/**
 * Mini-relatório de um dia (ou bucket horário).
 * @param {string} dataIso
 * @param {Array} movs
 * @param {{hora?:number, horaFim?:number}} opts  hora = filtro 1h (modo hora)
 */
function detalheDiaVendas(dataIso, movs, opts) {
  opts = opts || {};
  var vendas = (movs || []).filter(function (m) {
    if (!m || m.tipo !== 'venda' || m.data !== dataIso) return false;
    if (opts.hora != null && isFinite(opts.hora)) {
      if (!m.hora) return false;
      var mh = parseInt(String(m.hora).split(':')[0], 10);
      if (!isFinite(mh)) return false;
      var hr = Number(opts.hora);
      if (hr === 7) return mh <= 7;
      if (hr === 22) return mh >= 22;
      return mh === hr;
    }
    return true;
  });
  // ordenar por hora
  vendas = vendas.slice().sort(function (a, b) {
    return String(a.hora || '').localeCompare(String(b.hora || ''));
  });

  var totais = _atTotais(vendas);
  var byCliente = {};
  var byServico = {};
  var byProf = {};
  var byPag = {};

  for (var i = 0; i < vendas.length; i++) {
    var m = vendas[i];
    var cli = (m.cliente && String(m.cliente).trim()) || 'Avulso';
    byCliente[cli] = byCliente[cli] || { nome: cli, receita: 0, n: 0 };
    byCliente[cli].receita += Number(m.valor) || 0;
    byCliente[cli].n += 1;

    var srv = _atNomeServico(m) || 'Serviço';
    byServico[srv] = byServico[srv] || { nome: srv, receita: 0, n: 0 };
    byServico[srv].receita += Number(m.valor) || 0;
    byServico[srv].n += 1;

    var pid = m.profissional_id || m.profissional || '';
    var pnome = _atNomeProf(m.profissional_id, m) || 'Sem profissional';
    byProf[pid || pnome] = byProf[pid || pnome] || { id: pid, nome: pnome, receita: 0, n: 0 };
    byProf[pid || pnome].receita += Number(m.valor) || 0;
    byProf[pid || pnome].n += 1;

    var pag = m.metodoPagamento || m.pagamento || 'Numerário';
    byPag[pag] = byPag[pag] || { nome: pag, receita: 0, n: 0 };
    byPag[pag].receita += Number(m.valor) || 0;
    byPag[pag].n += 1;
  }

  function top(map, n) {
    return Object.keys(map).map(function (k) { return map[k]; })
      .sort(function (a, b) { return b.receita - a.receita; })
      .slice(0, n || 5);
  }

  var topProf = top(byProf, 1)[0] || null;
  var topSrv = top(byServico, 1)[0] || null;
  var topPag = top(byPag, 1)[0] || null;

  // mesmo dia da semana anterior (7 dias antes)
  var d = _atParseISO(dataIso);
  d.setDate(d.getDate() - 7);
  var isoSem = _atFmtISO(d);
  var vendasSem = _atVendasNoIntervalo(movs, isoSem, isoSem);
  var totSem = _atTotais(vendasSem);
  var vsSemana = null;
  if (totSem.nVendas > 0 || totais.nVendas > 0) {
    var delta = totais.receita - totSem.receita;
    var pct = totSem.receita > 0 ? (delta / totSem.receita) * 100 : (totais.receita > 0 ? 100 : null);
    vsSemana = { data: isoSem, totais: totSem, delta: delta, pct: pct };
  }

  return {
    data: dataIso,
    hora: opts.hora != null ? Number(opts.hora) : null,
    vendas: vendas,
    totais: totais,
    topProfissional: topProf,
    topServico: topSrv,
    topPagamento: topPag,
    porCliente: top(byCliente, 8),
    porServico: top(byServico, 8),
    porProfissional: top(byProf, 8),
    porPagamento: top(byPag, 6),
    vsMesmoDiaSemana: vsSemana
  };
}

if (typeof window !== 'undefined') {
  window.detalheDiaVendas = detalheDiaVendas;
}

/* ===== FILE: chart-module.js ===== */


function actualizarDashChartExec(analise) {
  try {
    var elRev = document.getElementById('dash-chart-exec-rev');
    var elN = document.getElementById('dash-chart-exec-n');
    var elTicket = document.getElementById('dash-chart-exec-ticket');
    var elDelta = document.getElementById('dash-chart-exec-delta');
    if (!elRev && !elN && !elTicket && !elDelta) return;

    var fmt = function (n) {
      var v = Number(n);
      if (!isFinite(v)) v = 0;
      try {
        if (typeof fmtKz === 'function') return fmtKz(v);
      } catch (_) {}
      try {
        return Math.round(v).toLocaleString('pt-AO') + ' Kz';
      } catch (_e2) {
        return Math.round(v) + ' Kz';
      }
    };

    var totais = analise && analise.totais ? analise.totais : null;
    if (!totais) {
      if (elRev) elRev.textContent = '—';
      if (elN) elN.textContent = '—';
      if (elTicket) elTicket.textContent = '—';
      if (elDelta) {
        elDelta.textContent = '—';
        elDelta.removeAttribute('data-trend');
      }
      return;
    }

    if (elRev) elRev.textContent = fmt(totais.receita);
    if (elN) elN.textContent = String(totais.nVendas != null ? totais.nVendas : 0);
    if (elTicket) elTicket.textContent = fmt(totais.ticket);

    if (elDelta) {
      var ant = analise && analise.anterior ? analise.anterior : null;
      var pct = null;
      if (ant) {
        if (ant.pct != null) pct = Number(ant.pct);
        else if (ant.totais && totais.receita != null && ant.totais.receita > 0) {
          pct = ((Number(totais.receita) - Number(ant.totais.receita)) / Number(ant.totais.receita)) * 100;
        }
      }
      if (pct == null || !isFinite(pct)) {
        elDelta.textContent = '—';
        elDelta.removeAttribute('data-trend');
      } else {
        var rounded = Math.round(pct * 10) / 10;
        elDelta.textContent = (rounded > 0 ? '+' : '') + rounded + '%';
        elDelta.setAttribute('data-trend', rounded > 0 ? 'up' : (rounded < 0 ? 'down' : 'flat'));
      }
    }
  } catch (e) {
    try { console.warn('[chart-exec]', e); } catch (_) {}
  }
}

function _bpUpdateChartHealth(analise) {
  var el = document.getElementById('dash-chart-health');
  var val = document.getElementById('dash-chart-health-value');
  var st = document.getElementById('dash-chart-status');
  if (!el || !val) return;
  if (!analise || !analise.totais || !(analise.totais.nVendas > 0 || analise.totais.receita > 0)) {
    val.textContent = 'Sem dados';
    el.setAttribute('data-level', '');
    if (st) st.textContent = '';
    return;
  }
  var pct = analise.anterior && analise.anterior.pct != null ? Number(analise.anterior.pct) : null;
  var level = 'estavel';
  var label = 'Estável';
  if (pct != null) {
    if (pct >= 15) { level = 'excelente'; label = 'Em crescimento'; }
    else if (pct >= 0) { level = 'boa'; label = 'Estável'; }
    else if (pct > -15) { level = 'boa'; label = 'Ligeira queda'; }
    else { level = 'atencao'; label = 'Atenção'; }
  }
  el.setAttribute('data-level', level);
  val.textContent = label;
  if (st) st.textContent = pct != null ? ((pct > 0 ? '+' : '') + (Math.round(pct * 10) / 10) + '%') : '';
}

// ====================================================================
//  chart-module.js — Gráfico do dashboard (Fase A1: intervalo unificado)
// ====================================================================
let _chartSwipeStartX = null;
let _chartSwipeStartY = null;
let _chartSelectedIdx = null;
let _chartViewMode = (typeof localStorage !== 'undefined' && localStorage.getItem('bp_chart_view')) || 'barras';
let _chartAnimProgress = 1;
let _chartAnimRaf = null;



function _escChart(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function _fmtChart(n) {
  return typeof fmtKz === 'function' ? fmtKz(n) : String(Math.round(Number(n) || 0));
}

/** Fase 5 — sheet de drill-down do dia/hora */

/** ET4.7 — tooltip só no Resumo; nunca roubar toques da bottom-nav */
function bpChartIsDashboardActive() {
  try {
    if (typeof activeTab !== 'undefined' && activeTab && activeTab !== 'dashboard') return false;
    var pane = document.getElementById('tab-dashboard');
    if (pane && !pane.classList.contains('active')) return false;
    return true;
  } catch (_) {
    return true;
  }
}

function bpHideChartTooltip() {
  try {
    var tip = document.getElementById('chart-tooltip');
    if (tip) {
      tip.style.opacity = '0';
      tip.style.pointerEvents = 'none';
      tip.classList.remove('is-rich');
      tip.innerHTML = '';
      tip.setAttribute('aria-hidden', 'true');
    }
    if (typeof _chartSelectedIdx !== 'undefined') _chartSelectedIdx = null;
  } catch (_) {}
}

function bpConfineChartTooltipPosition(left, top, tip) {
  // Mantém o tooltip dentro da área do gráfico / tab dashboard, acima da nav (72px+)
  try {
    var wrap = document.getElementById('dash-chart-canvas-wrap')
      || document.getElementById('tab-dashboard')
      || document.body;
    var navH = 80;
    try {
      var nav = document.querySelector('.bottom-nav');
      if (nav) navH = Math.max(72, nav.getBoundingClientRect().height + 8);
    } catch (_) {}
    var maxBottom = window.innerHeight - navH - 8;
    var tipW = (tip && tip.offsetWidth) ? tip.offsetWidth : 200;
    var tipH = (tip && tip.offsetHeight) ? tip.offsetHeight : 120;
    var L = Math.min(window.innerWidth - tipW - 8, Math.max(8, left));
    var T = Math.min(maxBottom - tipH, Math.max(8, top));
    // Se o wrap do gráfico existe, preferir ficar sobre ele
    if (wrap && wrap.getBoundingClientRect) {
      var r = wrap.getBoundingClientRect();
      if (r.width > 40 && r.height > 40) {
        L = Math.min(r.right - 12 - tipW, Math.max(r.left + 8, L));
        T = Math.min(r.bottom - 8 - Math.min(tipH, r.height * 0.9), Math.max(r.top + 8, T));
      }
    }
    return { left: L, top: T };
  } catch (_) {
    return { left: left, top: top };
  }
}

if (typeof window !== 'undefined') {
  window.bpHideChartTooltip = bpHideChartTooltip;
  window.bpChartIsDashboardActive = bpChartIsDashboardActive;
}

function abrirChartDrill(dataIso, horaOpt) {
  // Contingência: drill só faz sentido no Resumo
  if (typeof bpChartIsDashboardActive === 'function' && !bpChartIsDashboardActive()) {
    if (typeof bpHideChartTooltip === 'function') bpHideChartTooltip();
    return;
  }
  if (!dataIso || typeof detalheDiaVendas !== 'function') return;
  var det = detalheDiaVendas(dataIso, (state && state.movimentos) || [], {
    hora: horaOpt != null && isFinite(horaOpt) ? Number(horaOpt) : undefined
  });
  var title = document.getElementById('chart-drill-title');
  var sub = document.getElementById('chart-drill-sub');
  var drillBody = document.getElementById('chart-drill-body');
  if (!drillBody) return;
  if (!det || !det.totais) return;

  var dataLabel = dataIso;
  if (typeof formatarDataCurta === 'function') dataLabel = formatarDataCurta(dataIso);
  try {
    var dFull = new Date(dataIso + 'T12:00:00');
    dataLabel = dFull.toLocaleDateString('pt-AO', { weekday: 'long', day: '2-digit', month: 'long' });
  } catch (_) {}

  if (title) {
    title.textContent = (det.hora != null)
      ? ('Detalhe · ' + String(det.hora).padStart(2, '0') + 'h')
      : 'Detalhe do dia';
  }
  if (sub) {
    sub.textContent = dataLabel + (det.hora != null ? (' · ' + String(det.hora).padStart(2, '0') + 'h') : '');
  }

  function listBlock(titulo, rows, nameKey) {
    nameKey = nameKey || 'nome';
    if (!rows || !rows.length) {
      return '<div class="chart-drill-section"><div class="chart-drill-sec-head">' + _escChart(titulo) + '</div><p class="chart-drill-empty">Sem dados neste período</p></div>';
    }
    var lis = rows.map(function (r) {
      var n = r.n || 0;
      var meta = n === 1 ? '1 registo' : (n + ' registos');
      return '<li class="chart-drill-row">' +
        '<div class="chart-drill-row-main">' +
          '<span class="chart-drill-row-name">' + _escChart(r[nameKey] || r.nome || '—') + '</span>' +
          '<span class="chart-drill-row-meta">' + meta + '</span>' +
        '</div>' +
        '<strong class="chart-drill-row-val">' + _escChart(_fmtChart(r.receita)) + '</strong>' +
      '</li>';
    }).join('');
    return '<div class="chart-drill-section"><div class="chart-drill-sec-head">' + _escChart(titulo) + '</div><ul class="chart-drill-list">' + lis + '</ul></div>';
  }

  var vendasLis = (det.vendas || []).map(function (m) {
    var hora = (m.hora || '').toString().slice(0, 5);
    var srv = m.servico_nome || m.servico || m.descricao || 'Venda';
    var cli = m.cliente || 'Avulso';
    var prof = (typeof getProfissionalNome === 'function' && m.profissional_id)
      ? getProfissionalNome(m.profissional_id)
      : (m.profissional || '');
    var pay = m.metodoPagamento || m.pagamento || '';
    var meta = [cli, prof, pay].filter(Boolean).join(' · ');
    return '<li class="chart-drill-row">' +
      '<div class="chart-drill-row-main">' +
        '<span class="chart-drill-row-name">' + _escChart((hora ? hora + ' · ' : '') + srv) + '</span>' +
        (meta ? '<span class="chart-drill-row-meta">' + _escChart(meta) + '</span>' : '') +
      '</div>' +
      '<strong class="chart-drill-row-val">' + _escChart(_fmtChart(m.valor)) + '</strong>' +
    '</li>';
  }).join('');

  var vsHtml = '';
  if (det.vsMesmoDiaSemana && det.vsMesmoDiaSemana.pct != null) {
    var p = det.vsMesmoDiaSemana.pct;
    var sign = p >= 0 ? '+' : '';
    vsHtml = '<div class="chart-drill-vs">' +
      '<span>Vs mesmo dia da semana</span>' +
      '<strong class="' + (p >= 0 ? 'is-up' : 'is-down') + '">' + sign + (Math.round(p * 10) / 10) + '%</strong>' +
    '</div>';
  }

  drillBody.innerHTML =
    '<div class="chart-drill-kpis">' +
      '<div class="chart-drill-kpi"><span>Receita</span><strong>' + _escChart(_fmtChart(det.totais.receita)) + '</strong></div>' +
      '<div class="chart-drill-kpi"><span>Vendas</span><strong>' + det.totais.nVendas + '</strong></div>' +
      '<div class="chart-drill-kpi"><span>Ticket</span><strong>' + _escChart(_fmtChart(det.totais.ticket)) + '</strong></div>' +
    '</div>' +
    vsHtml +
    '<div class="chart-drill-section"><div class="chart-drill-sec-head">Vendas</div>' +
      (vendasLis
        ? '<ul class="chart-drill-list">' + vendasLis + '</ul>'
        : '<p class="chart-drill-empty">Nenhuma venda neste intervalo</p>') +
    '</div>' +
    listBlock('Clientes', det.porCliente) +
    listBlock('Serviços', det.porServico) +
    listBlock('Profissionais', det.porProfissional) +
    listBlock('Pagamentos', det.porPagamento);

  if (typeof openModal === 'function') openModal('modal-chart-drill');
  else {
    var el = document.getElementById('modal-chart-drill');
    if (el) { el.classList.add('open'); el.style.display = 'flex'; }
  }
}

function fecharChartDrill() {
  if (typeof closeModal === 'function') closeModal('modal-chart-drill');
  else {
    var el = document.getElementById('modal-chart-drill');
    if (el) { el.classList.remove('open'); el.style.display = ''; }
  }
}



function actualizarDashChartInsights(analise) {
  var ul = document.getElementById('dash-chart-insights');
  if (!ul) return;
  var list = (analise && analise.insights) || [];
  if (!list.length) {
    ul.hidden = true;
    ul.innerHTML = '';
    return;
  }
  ul.hidden = false;
  if (window._chartShowInsights) ul.classList.add('is-live');
  else ul.classList.remove('is-live');
  ul.innerHTML = list.map(function (t) {
    return '<li>' + _escChart(t) + '</li>';
  }).join('');
}

function _chartShowSkeleton(on) {
  var sk = document.getElementById('dash-chart-skeleton');
  var canvas = document.getElementById('weekly-chart');
  if (sk) {
    sk.hidden = !on;
    sk.setAttribute('aria-hidden', on ? 'false' : 'true');
  }
  if (canvas) canvas.style.opacity = on ? '0.25' : '1';
}



function exportarAnalisePdf(analise) {
  var a = analise || window.__bpUltimaAnaliseTemporal;
  var fmt = typeof fmtKz === 'function' ? fmtKz : function (n) { return Math.round(Number(n) || 0) + ' Kz'; };
  if (!a || !a.totais) {
    if (typeof toast === 'function') toast('Não há dados para exportar.', 'warning');
    return;
  }
  var label = (a.intervalo && a.intervalo.label) || (a.meta && a.meta.label) || 'Período';
  var body =
    '<h1 style="font-size:18px;margin:0 0 8px;">BeautyPro — Análise de vendas</h1>' +
    '<p style="color:#555;font-size:12px;">' + String(label).replace(/</g,'&lt;') + '</p>' +
    '<table style="width:100%;font-size:13px;border-collapse:collapse;">' +
    '<tr><td>Receita</td><td style="text-align:right;"><strong>' + fmt(a.totais.receita) + '</strong></td></tr>' +
    '<tr><td>Vendas</td><td style="text-align:right;"><strong>' + a.totais.nVendas + '</strong></td></tr>' +
    '<tr><td>Ticket</td><td style="text-align:right;"><strong>' + fmt(a.totais.ticket) + '</strong></td></tr>' +
    '</table>' +
    '<p style="margin-top:20px;font-size:10px;color:#888;">' + new Date().toLocaleString('pt-AO') + '</p>';
  var w = window.open('', '_blank', 'noopener,noreferrer,width=720,height=900');
  if (!w) {
    if (typeof toast === 'function') toast('Permita pop-ups para PDF', 'error');
    return;
  }
  w.document.open();
  w.document.write('<!DOCTYPE html><html><head><meta charset="utf-8"><title>Análise</title></head><body style="font-family:system-ui;padding:24px;">' + body +
    '<script>window.onload=function(){setTimeout(function(){window.print();},250);}<\\/script></body></html>');
  w.document.close();
}

function exportarAnaliseCsv(analise) {
  var payload = typeof analiseParaExport === 'function'
    ? analiseParaExport(analise || window.__bpUltimaAnaliseTemporal)
    : null;
  if (!payload || !payload.serie) {
    if (typeof toast === 'function') toast('Não há dados para exportar.', 'warning');
    return;
  }
  var lines = ['data,label,receita,vendas,ticket'];
  payload.serie.forEach(function (p) {
    lines.push([
      p.data || '',
      '"' + String(p.label || '').replace(/"/g, '""') + '"',
      p.receita || 0,
      p.nVendas || 0,
      Math.round((p.ticket || 0) * 100) / 100
    ].join(','));
  });
  lines.push('');
  lines.push('total_receita,' + (payload.totais && payload.totais.receita || 0));
  lines.push('total_vendas,' + (payload.totais && payload.totais.nVendas || 0));
  var blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'beautypro-analise-' + (payload.meta && payload.meta.inicio ? payload.meta.inicio : 'export') + '.csv';
  document.body.appendChild(a);
  a.click();
  setTimeout(function () {
    URL.revokeObjectURL(url);
    a.remove();
  }, 500);
  if (typeof toast === 'function') toast('CSV exportado.', 'success');
}

function renderizarGrafico() {
  const canvas = document.getElementById('weekly-chart');
  if (!canvas) return;
  const parent = canvas.parentElement;
  const tabDash = document.getElementById('tab-dashboard');
  const tabVisivel = !tabDash || tabDash.classList.contains('active');
  let parentWidth = 0;
  try {
    parentWidth = parent ? parent.getBoundingClientRect().width : 0;
  } catch (_) { parentWidth = 0; }
  /* Tab oculta ou layout ainda a 0 → adiar (evita gráfico “desaparecido”) */
  if (tabVisivel && parentWidth < 40) {
    if (!renderizarGrafico._retry) {
      renderizarGrafico._retry = true;
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          renderizarGrafico._retry = false;
          renderizarGrafico();
        });
      });
    }
    return;
  }
  if (!tabVisivel) {
    /* Guarda pedido para quando a aba Resumo voltar a abrir */
    renderizarGrafico._pending = true;
    return;
  }
  renderizarGrafico._pending = false;

  const ctx = canvas.getContext('2d');
  const width = Math.max(parentWidth || 0, 200);
  const height = 220;
  canvas.width = width;
  canvas.height = height;
  try {
    canvas.style.width = '100%';
    canvas.style.height = height + 'px';
    canvas.style.display = 'block';
    canvas.style.touchAction = 'pan-y';
  } catch (_ta) {}
  if (parent) {
    try { parent.style.minHeight = height + 'px'; } catch (_) {}
  }
  ctx.clearRect(0, 0, width, height);

  const intervalo = (typeof getIntervaloDashAtual === 'function')
    ? getIntervaloDashAtual()
    : { inicio: (typeof hoje === 'function' ? hoje() : ''), fim: (typeof hoje === 'function' ? hoje() : ''), label: 'Hoje' };
  /* Dia único: série por hora (evita 1 barra). chartPeriodo==='hora' força o mesmo. */
  var _singleDay = !!(intervalo && intervalo.inicio && intervalo.fim && intervalo.inicio === intervalo.fim);
  const modoHora = (state.chartPeriodo === 'hora') || _singleDay;
  const mostrarValores = state.chartMostrarValores || false;
  const movs = state.movimentos || [];
  const dashOff = state.dashOffset || 0;

  // Modelo único — série + totais + comparação (alinhado ao intervalo dos KPIs)
  let analise = null;
  if (typeof buildAnaliseTemporal === 'function') {
    var diaRefHora = null;
    if (modoHora) {
      if (intervalo.inicio && intervalo.inicio === intervalo.fim) diaRefHora = intervalo.inicio;
      else if (typeof hoje === 'function') diaRefHora = hoje();
      else diaRefHora = intervalo.fim;
    }
    analise = buildAnaliseTemporal(intervalo, movs, { modoHora: modoHora, diaRef: diaRefHora });
  }
  if (typeof actualizarDashChartExec === 'function') {
    try { actualizarDashChartExec(analise); } catch (eExec) { console.warn('[chart-exec]', eExec); }
  }
  try { actualizarDashChartInsights(analise); } catch (eIns) { console.warn('[chart-insights]', eIns); }


  let labels = [];
  let dados = [];
  let maxVal = 1;
  if (analise && analise.serie && analise.serie.length) {
    labels = analise.serie.map(function (p) { return p.label; });
    dados = analise.serie.map(function (p) { return Number(p.receita) || 0; });
    maxVal = 1;
    for (let i = 0; i < dados.length; i++) if (dados[i] > maxVal) maxVal = dados[i];
  }

  const hasData = !!(analise && analise.hasData) || dados.some(function (v) { return Number(v) > 0; });
  maxVal = Math.max(maxVal, 1);
  // Micro-animação de entrada (≤300ms)
  const animP = Math.max(0, Math.min(1, _chartAnimProgress));
  if (animP < 1) {
    dados = dados.map(function (v) { return v * animP; });
  }

  const emptyEl = document.getElementById('dash-chart-empty');
  if (emptyEl) {
    emptyEl.hidden = hasData;
    emptyEl.setAttribute('aria-hidden', hasData ? 'true' : 'false');
  }
  // Guardar último modelo para fases seguintes (tooltip / drill-down)
  try { window.__bpUltimaAnaliseTemporal = analise;
  try { _bpUpdateChartHealth(analise); } catch (_h) {} } catch (_) {}
  try { _chartShowSkeleton(false); } catch (_) {}


  // Tokens CSS (fallback seguro)
  const cs = (typeof getComputedStyle === 'function') ? getComputedStyle(document.documentElement) : null;
  const tok = function (name, fb) {
    try { const v = cs && cs.getPropertyValue(name); return (v && v.trim()) || fb; } catch (_) { return fb; }
  };
  const gold = tok('--gold', '#D4AF37');
  const goldDark = tok('--gold-600', tok('--gold-dark', '#A7872B'));
  const mutedBar = tok('--border-soft', '#DCD5C9');
  const textMuted = tok('--text-muted', '#8c8980');
  const textPrimary = tok('--text-primary', '#1C1A18');

  const n = Math.max(labels.length, 1);
  // Largura adaptativa: muitas barras → mais finas; poucas → cap 40px (nunca 1 barra a largura toda)
  const slot = (width - 48) / n;
  const barW = Math.min(40, Math.max(6, slot - 6));
  const gap = Math.min(8, Math.max(3, (slot - barW)));
  const groupW = n * barW + (n - 1) * gap;
  const startX = Math.max(24, (width - groupW) / 2);
  const baseY = height - 22;
  const plotH = height - 40;

  // Baseline: nítida e legível, sem engrossar
  ctx.save();
  ctx.strokeStyle = textPrimary;
  ctx.globalAlpha = 0.32;
  ctx.lineWidth = 1;
  ctx.lineCap = 'butt';
  ctx.beginPath();
  ctx.moveTo(16, baseY + 0.5);
  ctx.lineTo(width - 16, baseY + 0.5);
  ctx.stroke();
  ctx.restore();

  // Geometria de hit-test (partilhada com hover)
  const stepX = barW + gap;
  const barRects = [];

  if (!hasData) {
    labels.forEach(function (lab, i) {
      const x = startX + i * stepX + barW / 2;
      ctx.fillStyle = textMuted;
      ctx.font = '9px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      if (n <= 14) ctx.fillText(lab, x, baseY + 4);
    });
  } else {
    // Validar índice seleccionado
    if (_chartSelectedIdx != null && (_chartSelectedIdx < 0 || _chartSelectedIdx >= labels.length)) {
      _chartSelectedIdx = null;
    }
    const hasSel = _chartSelectedIdx != null;
    const viewMode = _chartViewMode || 'barras';

    // Pontos para linha/área
    const pts = [];
    for (let i = 0; i < labels.length; i++) {
      const x = startX + i * stepX + barW / 2;
      const val = Number(dados[i]) || 0;
      const y = baseY - (val > 0 ? Math.max(3, (val / maxVal) * plotH) : 0);
      pts.push({ x: x, y: y, val: val, i: i });
    }

    if (viewMode === 'linha' || viewMode === 'area') {
      ctx.save();
      if (viewMode === 'area' && pts.length) {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, baseY);
        for (let i = 0; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.lineTo(pts[pts.length - 1].x, baseY);
        ctx.closePath();
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = gold;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      ctx.beginPath();
      for (let i = 0; i < pts.length; i++) {
        if (i === 0) ctx.moveTo(pts[i].x, pts[i].y);
        else ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.strokeStyle = gold;
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();
      for (let i = 0; i < pts.length; i++) {
        if (pts[i].val <= 0) continue;
        const isSel = hasSel && i === _chartSelectedIdx;
        ctx.beginPath();
        ctx.arc(pts[i].x, pts[i].y, isSel ? 5 : 3, 0, Math.PI * 2);
        ctx.fillStyle = isSel ? textPrimary : gold;
        ctx.globalAlpha = (hasSel && !isSel) ? 0.35 : 1;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      // labels
      for (let i = 0; i < labels.length; i++) {
        const isLast = (i === labels.length - 1 && dashOff === 0);
        ctx.fillStyle = isLast ? textPrimary : textMuted;
        ctx.font = (isLast ? 'bold ' : '') + '9px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        if (n <= 16) ctx.fillText(labels[i], pts[i].x, baseY + 4);
      }
      ctx.restore();
    }

    if (viewMode === 'barras') for (let i = 0; i < labels.length; i++) {
      const x = startX + i * stepX;
      const val = Number(dados[i]) || 0;
      const barH = val > 0 ? Math.max(3, (val / maxVal) * plotH) : 0;
      const y = baseY - barH;
      const radius = Math.min(4, barW / 2);
      barRects.push({ x: x, w: barW, i: i, val: val });

      const isSel = hasSel && i === _chartSelectedIdx;
      const dim = hasSel && !isSel;
      ctx.globalAlpha = dim ? 0.32 : 1;

      if (val > 0) {
        const grad = ctx.createLinearGradient(0, y, 0, baseY);
        grad.addColorStop(0, gold);
        grad.addColorStop(1, goldDark);
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
        if (isSel) {
          ctx.strokeStyle = textPrimary;
          ctx.lineWidth = 1.25;
          ctx.stroke();
        }
      } else {
        ctx.fillStyle = mutedBar;
        ctx.fillRect(x + barW * 0.25, baseY - 2, barW * 0.5, 2);
      }

      const isLast = (i === labels.length - 1 && dashOff === 0);
      ctx.fillStyle = isLast ? textPrimary : textMuted;
      ctx.font = (isLast ? 'bold ' : '') + '9px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      if (n <= 16) ctx.fillText(labels[i], x + barW / 2, baseY + 4);

      if (mostrarValores && val > 0 && typeof fmtKz === 'function') {
        ctx.fillStyle = textPrimary;
        ctx.font = 'bold 9px system-ui, sans-serif';
        ctx.textBaseline = 'bottom';
        ctx.fillText(fmtKz(val).replace(' Kz', ''), x + barW / 2, y - 2);
      }
      ctx.globalAlpha = 1;
    }

    // Linha de média do período (Fase 3) — só se activada no menu ⋯
    var media = (analise && analise.mediaSerie) || 0;
    if (window._chartShowMedia && media > 0 && maxVal > 0) {
      var yMed = baseY - (media / maxVal) * plotH;
      ctx.save();
      // Média: preta, nítida, mesma espessura
      ctx.strokeStyle = textPrimary;
      ctx.lineWidth = 1;
      ctx.lineCap = 'butt';
      ctx.setLineDash([4, 3]);
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.moveTo(16, yMed + 0.5);
      ctx.lineTo(width - 16, yMed + 0.5);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = '600 8px system-ui, sans-serif';
      ctx.fillStyle = textPrimary;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText('Média', 18, yMed - 2);
      ctx.restore();
      try {
        var _mv = document.getElementById('dash-chart-leg-media-val');
        if (_mv && typeof fmtKz === 'function') _mv.textContent = fmtKz(media);
        else if (_mv) _mv.textContent = String(Math.round(media));
      } catch (_) {}
    } else {
      try {
        var _mv2 = document.getElementById('dash-chart-leg-media-val');
        if (_mv2 && !window._chartShowMedia) { /* leave */ }
      } catch (_) {}
    }

    // Linha de meta (só se meta mensal existir e o período for mensal/comparável)
    try {
      var metaMes = 0;
      if (typeof getMetaSalao === 'function') metaMes = Number(getMetaSalao()) || 0;
      else if (state && state.config && state.config.meta_mensal_salao) metaMes = Number(state.config.meta_mensal_salao) || 0;
      if (metaMes > 0 && !modoHora && analise && analise.serie && analise.serie.length) {
        var diasPeriodo = analise.serie.length;
        // Meta proporcional ao nº de buckets visíveis (aproximação discreta)
        var metaBucket = metaMes / Math.max(diasPeriodo, 1);
        // Só desenhar se estiver dentro da escala (senão polui)
        if (metaBucket > 0 && metaBucket <= maxVal * 1.35) {
          var yMeta = baseY - (Math.min(metaBucket, maxVal) / maxVal) * plotH;
          ctx.save();
          ctx.strokeStyle = gold;
          ctx.lineWidth = 1;
          ctx.globalAlpha = 0.45;
          ctx.setLineDash([2, 4]);
          ctx.beginPath();
          ctx.moveTo(16, yMeta + 0.5);
          ctx.lineTo(width - 16, yMeta + 0.5);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.font = '8px system-ui, sans-serif';
          ctx.fillStyle = goldDark;
          ctx.globalAlpha = 0.7;
          ctx.textAlign = 'right';
          ctx.textBaseline = 'bottom';
          ctx.fillText('Meta', width - 18, yMeta - 2);
          ctx.restore();
        }
      }
    } catch (_metaErr) {}
  }

  const labelEl = document.getElementById('chart-period-label');
  if (labelEl) {
    labelEl.textContent = modoHora
      ? (((analise && analise.diaRef) ? analise.diaRef : (intervalo.label || 'Dia')) + ' · por hora')
      : (intervalo.label || 'Período');
    if (modoHora && analise && analise.diaRef && typeof formatarDataCurta === 'function') {
      labelEl.textContent = formatarDataCurta(analise.diaRef) + ' · por hora';
    }
  }

  const tooltip = document.getElementById('chart-tooltip');
  const stepHit = barW + gap;

  function hitIndex(clientX) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / Math.max(rect.width, 1);
    const mouseX = (clientX - rect.left) * scaleX;
    for (let i = 0; i < labels.length; i++) {
      const x = startX + i * stepHit;
      // área de toque alargada (~44px lógico mínimo)
      const pad = Math.max(0, (22 - barW) / 2);
      if (mouseX >= x - pad && mouseX <= x + barW + pad) return i;
    }
    return -1;
  }

  function showTooltipFor(idx, clientX, clientY) {
    if (typeof bpChartIsDashboardActive === 'function' && !bpChartIsDashboardActive()) {
      if (typeof bpHideChartTooltip === 'function') bpHideChartTooltip();
      return;
    }

    if (!tooltip || idx < 0) return;
    const pt = analise && analise.serie && analise.serie[idx];
    const val = dados[idx] || 0;
    if (!(val > 0) && !(pt && pt.receita > 0)) {
      tooltip.style.opacity = '0';
      return;
    }

    var dataIso = pt && pt.data ? pt.data : null;
    var horaOpt = (pt && pt.hora != null) ? pt.hora : null;
    var det = null;
    if (dataIso && typeof detalheDiaVendas === 'function' && !modoHora) {
      // no modo dia/semana/mes: detalhe do dia do bucket
      det = detalheDiaVendas(dataIso, movs, {});
    } else if (dataIso && typeof detalheDiaVendas === 'function' && modoHora) {
      det = detalheDiaVendas(dataIso, movs, { hora: horaOpt });
    }

    var title = labels[idx] || '';
    if (pt && pt.data) {
      try {
        var df = new Date(pt.data + 'T12:00:00');
        title = df.toLocaleDateString('pt-AO', { weekday: 'short', day: '2-digit', month: 'short' });
        if (horaOpt != null) title += ' · ' + String(horaOpt).padStart(2, '0') + 'h';
      } catch (_) {}
    }

    var rows = '';
    var receita = pt ? pt.receita : val;
    var nV = pt ? pt.nVendas : 0;
    var ticket = pt ? pt.ticket : 0;
    rows += '<div class="ct-row"><span>Receita</span><strong>' + _escChart(_fmtChart(receita)) + '</strong></div>';
    if (nV) rows += '<div class="ct-row"><span>Vendas</span><strong>' + nV + '</strong></div>';
    if (nV) rows += '<div class="ct-row"><span>Ticket</span><strong>' + _escChart(_fmtChart(ticket)) + '</strong></div>';
    if (det && det.topProfissional) {
      rows += '<div class="ct-row"><span>Top profissional</span><strong>' + _escChart(det.topProfissional.nome) + '</strong></div>';
    }
    if (det && det.topServico) {
      rows += '<div class="ct-row"><span>Top serviço</span><strong>' + _escChart(det.topServico.nome) + '</strong></div>';
    }
    if (det && det.topPagamento) {
      rows += '<div class="ct-row"><span>Pagamento</span><strong>' + _escChart(det.topPagamento.nome) + '</strong></div>';
    }
    if (pt && pt.anterior && pt.anterior.pct != null && (pt.anterior.receita > 0 || pt.anterior.nVendas > 0)) {
      var s = pt.anterior.pct >= 0 ? '+' : '';
      rows += '<div class="ct-row"><span>vs mesma hora ontem</span><strong>' + s + (Math.round(pt.anterior.pct * 10) / 10) + '%</strong></div>';
    }
    if (det && det.vsMesmoDiaSemana && det.vsMesmoDiaSemana.pct != null && !modoHora) {
      var s2 = det.vsMesmoDiaSemana.pct >= 0 ? '+' : '';
      rows += '<div class="ct-row"><span>vs mesmo dia sem.</span><strong>' + s2 + (Math.round(det.vsMesmoDiaSemana.pct * 10) / 10) + '%</strong></div>';
    }

    var drillAttr = dataIso ? (' data-drill-data="' + _escChart(dataIso) + '"') : '';
    if (horaOpt != null) drillAttr += ' data-drill-hora="' + horaOpt + '"';

    tooltip.classList.add('is-rich');
    tooltip.innerHTML =
      '<div class="ct-title">' + _escChart(title) + '</div>' + rows +
      (dataIso
        ? '<div class="ct-actions"><button type="button" class="ct-drill-btn" id="chart-tooltip-drill"' + drillAttr + '>Ver detalhe</button></div>'
        : '');
    tooltip.style.whiteSpace = 'normal';
    // Só no dashboard; senão não mostrar
    if (typeof bpChartIsDashboardActive === 'function' && !bpChartIsDashboardActive()) {
      bpHideChartTooltip();
      return;
    }
    var left = Math.min(window.innerWidth - 200, Math.max(8, clientX + 8));
    var top = Math.max(8, clientY - 20);
    var confined = typeof bpConfineChartTooltipPosition === 'function'
      ? bpConfineChartTooltipPosition(left, top, tooltip)
      : { left: left, top: top };
    tooltip.style.left = confined.left + 'px';
    tooltip.style.top = confined.top + 'px';
    tooltip.style.opacity = '1';
    tooltip.style.pointerEvents = 'auto';
    tooltip.setAttribute('aria-hidden', 'false');

    var btn = document.getElementById('chart-tooltip-drill');
    if (btn) {
      btn.onclick = function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        // Garante que o toque não propaga para a nav
        if (ev.stopImmediatePropagation) ev.stopImmediatePropagation();
        if (typeof bpChartIsDashboardActive === 'function' && !bpChartIsDashboardActive()) {
          bpHideChartTooltip();
          return;
        }
        var d = btn.getAttribute('data-drill-data');
        var h = btn.getAttribute('data-drill-hora');
        if (typeof abrirChartDrill === 'function') {
          abrirChartDrill(d, h != null && h !== '' ? Number(h) : undefined);
        }
        bpHideChartTooltip();
      };
    }
  }

  function selectBar(idx) {
    if (idx < 0 || !(dados[idx] > 0)) {
      if (_chartSelectedIdx != null) {
        _chartSelectedIdx = null;
        if (tooltip) tooltip.style.opacity = '0';
        renderizarGrafico();
      }
      return;
    }
    _chartSelectedIdx = idx;
    renderizarGrafico();
    // tooltip mantém-se via re-bind — mostrar após paint
    requestAnimationFrame(function () {
      // posição aproximada: centro da barra
      const rect = canvas.getBoundingClientRect();
      const scale = rect.width / Math.max(canvas.width, 1);
      const cx = rect.left + (startX + idx * stepHit + barW / 2) * scale;
      const cy = rect.top + 24;
      showTooltipFor(idx, cx, cy);
    });
  }

  if (tooltip) {
    canvas.onmousemove = function (e) {
      const idx = hitIndex(e.clientX);
      if (idx !== -1 && dados[idx] > 0) showTooltipFor(idx, e.clientX, e.clientY);
      else if (_chartSelectedIdx == null) tooltip.style.opacity = '0';
    };
    canvas.onmouseleave = function () {
      if (_chartSelectedIdx == null) tooltip.style.opacity = '0';
    };
    canvas.onclick = function (e) {
      const idx = hitIndex(e.clientX);
      if (idx === _chartSelectedIdx) selectBar(-1);
      else selectBar(idx);
    };
  }

  canvas.ontouchstart = function (e) {
    if (e.touches.length > 0) {
      _chartSwipeStartX = e.touches[0].clientX;
      _chartSwipeStartY = e.touches[0].clientY;
      // não chamar preventDefault — permite scroll vertical da página
      if (tooltip) {
        const idx = hitIndex(e.touches[0].clientX);
        if (idx !== -1 && dados[idx] > 0) showTooltipFor(idx, e.touches[0].clientX, e.touches[0].clientY);
      }
    }
  };
  canvas.ontouchmove = function (e) {
    if (e.touches.length === 0) return;
    var t = e.touches[0];
    var dx = t.clientX - (_chartSwipeStartX != null ? _chartSwipeStartX : t.clientX);
    var dy = t.clientY - (_chartSwipeStartY != null ? _chartSwipeStartY : t.clientY);
    // só intercepta gesto claramente horizontal (drill/swipe); vertical = scroll livre
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 12) {
      if (e.cancelable) e.preventDefault();
    }
    if (tooltip) {
      const idx = hitIndex(t.clientX);
      if (idx !== -1 && dados[idx] > 0) showTooltipFor(idx, t.clientX, t.clientY);
      else if (_chartSelectedIdx == null) tooltip.style.opacity = '0';
    }
  };
  canvas.ontouchend = function (e) {
    if (_chartSwipeStartX !== null && e.changedTouches.length > 0) {
      const dx = e.changedTouches[0].clientX - _chartSwipeStartX;
      const dy = e.changedTouches[0].clientY - _chartSwipeStartY;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        if (tooltip) tooltip.style.opacity = '0';
        _chartSelectedIdx = null;
        if (dx < 0) state.dashOffset = (state.dashOffset || 0) + 1;
        else if ((state.dashOffset || 0) > 0) state.dashOffset -= 1;
        localStorage.setItem('bp_dash_offset', String(state.dashOffset || 0));
        if (typeof renderDashboard === 'function') renderDashboard();
        renderizarGrafico();
      } else if (Math.abs(dx) < 12 && Math.abs(dy) < 12) {
        // tap = seleccionar barra
        const idx = hitIndex(e.changedTouches[0].clientX);
        if (idx === _chartSelectedIdx) selectBar(-1);
        else selectBar(idx);
      } else if (_chartSelectedIdx == null && tooltip) {
        tooltip.style.opacity = '0';
      }
    }
    _chartSwipeStartX = null;
    _chartSwipeStartY = null;
  };
}

let _chartControlsBound = false;
function _bpSetChartFilterActive(periodo) {
  document.querySelectorAll('.dash-chart-seg .chart-filter, .chart-filter[data-periodo]').forEach(function (b) {
    const on = b.getAttribute('data-periodo') === periodo;
    b.classList.toggle('is-active', on);
    b.classList.toggle('btn-primary', on);
    b.classList.toggle('btn-secondary', !on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}
/** Olho só no modo Barras (valores nas barras). */
function _bpSyncChartEye() {
  var eye = document.getElementById('chart-eye-toggle');
  if (!eye) return;
  var mode = (typeof _chartViewMode !== 'undefined' && _chartViewMode) ? _chartViewMode : 'barras';
  var show = mode === 'barras';
  eye.hidden = !show;
  eye.setAttribute('aria-hidden', show ? 'false' : 'true');
  try { eye.style.display = show ? '' : 'none'; } catch (_) {}
}


/* Mantém o canvas legível após navegação / rotação / volta à aba Resumo */
function _bpEnsureChartResizeObserver() {
  if (_bpEnsureChartResizeObserver._done) return;
  var wrap = document.getElementById('dash-chart-canvas-wrap') || document.getElementById('weekly-chart');
  if (!wrap) return;
  var target = wrap.id === 'weekly-chart' && wrap.parentElement ? wrap.parentElement : wrap;
  _bpEnsureChartResizeObserver._done = true;
  var t = null;
  function schedule() {
    if (t) clearTimeout(t);
    t = setTimeout(function () {
      if (typeof renderizarGrafico === 'function') renderizarGrafico();
    }, 60);
  }
  if (typeof ResizeObserver !== 'undefined') {
    try {
      var ro = new ResizeObserver(function () { schedule(); });
      ro.observe(target);
    } catch (_) {}
  }
  window.addEventListener('resize', schedule);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) schedule();
  });
}
try { _bpEnsureChartResizeObserver(); } catch (_) {}
document.addEventListener('DOMContentLoaded', function () {
  try { _bpEnsureChartResizeObserver(); } catch (_) {}
});

function initChartControls() {
  if (_chartControlsBound) return;
  _chartControlsBound = true;
  // Estado inicial coerente com state
  const inicial = state.chartPeriodo || state.dashPeriodo || 'semana';
  _bpSetChartFilterActive(inicial === 'hora' ? 'hora' : (state.dashPeriodo || inicial));

  document.querySelectorAll('.dash-chart-seg .chart-filter').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const periodo = this.dataset.periodo;
      if (!periodo) return;
      if (periodo === 'hora') {
        state.chartPeriodo = 'hora';
        // Modo hora analisa um dia concreto — alinhar dash a "dia"
        state.dashPeriodo = 'dia';
        try {
          localStorage.setItem('bp_dash_periodo', 'dia');
          localStorage.setItem('bp_chart_periodo', 'hora');
        } catch (_) {}
      } else {
        state.chartPeriodo = periodo; // dia | semana | mes — alinhado ao dash
        state.dashPeriodo = periodo;
        state.dashOffset = 0;
        try {
          localStorage.setItem('bp_dash_periodo', state.dashPeriodo);
          localStorage.setItem('bp_dash_offset', '0');
        } catch (_) {}
      }
      try { localStorage.setItem('bp_chart_periodo', state.chartPeriodo); } catch (_) {}
      _bpSetChartFilterActive(periodo);
      _chartSelectedIdx = null;
      _chartShowSkeleton(true);
      _chartAnimProgress = 0;
      if (typeof renderDashboard === 'function') renderDashboard();
      if (_chartAnimRaf) cancelAnimationFrame(_chartAnimRaf);
      var t0 = performance.now();
      function step(now) {
        var t = Math.min(1, (now - t0) / 280);
        _chartAnimProgress = t * t * (3 - 2 * t); // smoothstep
        renderizarGrafico();
        if (t < 1) _chartAnimRaf = requestAnimationFrame(step);
        else {
          _chartAnimProgress = 1;
          _chartShowSkeleton(false);
        }
      }
      requestAnimationFrame(function () {
        _chartShowSkeleton(false);
        _chartAnimRaf = requestAnimationFrame(step);
      });
    });
  });

  const prevBtn = document.getElementById('chart-prev');
  const nextBtn = document.getElementById('chart-next');
  if (prevBtn) {
    prevBtn.onclick = () => {
      state.dashOffset = (state.dashOffset || 0) + 1;
      localStorage.setItem('bp_dash_offset', String(state.dashOffset));
      if (typeof renderDashboard === 'function') renderDashboard();
      renderizarGrafico();
    };
  }
  if (nextBtn) {
    nextBtn.onclick = () => {
      if ((state.dashOffset || 0) > 0) {
        state.dashOffset -= 1;
        localStorage.setItem('bp_dash_offset', String(state.dashOffset));
        if (typeof renderDashboard === 'function') renderDashboard();
        renderizarGrafico();
      }
    };
  }

  const drillModal = document.getElementById('modal-chart-drill');
  if (drillModal && !drillModal.dataset.bound) {
    drillModal.dataset.bound = '1';
    drillModal.addEventListener('click', function (e) {
      if (e.target === drillModal || e.target.getAttribute('data-close') === 'modal-chart-drill') {
        fecharChartDrill();
      }
    });
  }

  var exportBtn = document.getElementById('chart-export-csv');
  if (exportBtn && !exportBtn.dataset.bound) {
    exportBtn.dataset.bound = '1';
    exportBtn.addEventListener('click', function () {
      exportarAnaliseCsv(window.__bpUltimaAnaliseTemporal);
    });
  }

  document.querySelectorAll('.dash-chart-view-btn').forEach(function (btn) {
    if (btn.dataset.bound) return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', function () {
      try { _bpHaptic('toggle'); } catch (_) {}
      var v = this.getAttribute('data-chart-view') || 'barras';
      _chartViewMode = v;
      try { localStorage.setItem('bp_chart_view', v); } catch (_) {}
      document.querySelectorAll('.dash-chart-view-btn').forEach(function (b) {
        var on = b.getAttribute('data-chart-view') === v;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      if (typeof _bpSyncChartEye === 'function') _bpSyncChartEye();
      renderizarGrafico();
    });
  });
  // sync active view button
  document.querySelectorAll('.dash-chart-view-btn').forEach(function (b) {
    var on = b.getAttribute('data-chart-view') === (_chartViewMode || 'barras');
    b.classList.toggle('is-active', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  if (typeof _bpSyncChartEye === 'function') _bpSyncChartEye();

  const eyeToggle = document.getElementById('chart-eye-toggle');
  if (eyeToggle) {
    eyeToggle.addEventListener('click', function() {
      state.chartMostrarValores = !state.chartMostrarValores;
      localStorage.setItem('bp_chart_mostrar_valores', String(state.chartMostrarValores));
      const svg = this.querySelector('svg');
      if (svg) {
        if (state.chartMostrarValores) {
          svg.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
        } else {
          svg.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';
        }
      }
      renderizarGrafico();
    });
  }
}

/** @deprecated feedback visual — anel CSS; mantido no-op seguro */
function _bpChartPulse(el) { /* no-op */ }

function _bpInitChartChrome() {
  if (window.__bpChartChromeBound) return;
  window.__bpChartChromeBound = true;
  var card = document.querySelector('.dash-chart-card');
  var toggle = document.getElementById('chart-filter-toggle');
  if (toggle && !toggle.dataset.boundKpiModal) {
    toggle.dataset.boundKpiModal = '1';
    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      function markActive() {
        document.querySelectorAll('.dash-periodo-opcao').forEach(function (btn) {
          var ativa = btn.dataset.periodo === state.dashPeriodo &&
            (btn.dataset.periodo !== 'dia' || Number(btn.dataset.offset || 0) === Number(state.dashOffset || 0));
          btn.classList.toggle('active', ativa);
        });
      }
      function placeSheetNearFilter() {
        var btn = document.getElementById('chart-filter-toggle');
        if (typeof _bpPlacePeriodoSheetNear === 'function') {
          _bpPlacePeriodoSheetNear(btn);
          return;
        }
        try {
          var sheet = document.querySelector('#modal-periodo-dashboard .modal-sheet');
          if (!sheet || !btn) return;
          var r = btn.getBoundingClientRect();
          var w = Math.min(260, window.innerWidth * 0.88);
          var left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8));
          var top = Math.min(r.bottom + 6, window.innerHeight - 140);
          sheet.style.position = 'fixed';
          sheet.style.top = Math.round(top) + 'px';
          sheet.style.left = Math.round(left) + 'px';
          sheet.style.width = Math.round(w) + 'px';
          sheet.style.right = 'auto';
        } catch (_) {}
      }
      markActive();
      try { _bpHaptic('open'); } catch (_) {}
      if (typeof openModal === 'function') {
        openModal('modal-periodo-dashboard');
        try { window.__bpPeriodoAnchor = document.getElementById('chart-filter-toggle'); } catch (_) {}
        placeSheetNearFilter();
        setTimeout(placeSheetNearFilter, 30);
      } else {
        var kpiIcon = document.getElementById('dash-filter-icon');
        if (kpiIcon) kpiIcon.click();
      }
    });
  }
  setTimeout(function () {
    var card = document.querySelector('.dash-chart-card');
    if (card) card.classList.add('nudge-done');
  }, 8000);

  var expT = document.getElementById('chart-export-toggle');
  var expM = document.getElementById('chart-export-menu');
  if (expT && expM && !expT.dataset.bound) {
    expT.dataset.bound = '1';
    expT.addEventListener('click', function (e) {
      e.stopPropagation();
      expM.hidden = !expM.hidden;
      expT.setAttribute('aria-expanded', expM.hidden ? 'false' : 'true');
    });
  }
  var csv = document.getElementById('chart-export-csv');
  if (csv && !csv.dataset.boundPdf) {
    csv.dataset.boundPdf = '1';
    csv.addEventListener('click', function (e) {
      e.stopPropagation();
      if (expM) expM.hidden = true;
      if (typeof exportarAnaliseCsv === 'function') exportarAnaliseCsv(window.__bpUltimaAnaliseTemporal);
    });
  }
  var pdfBtn = document.getElementById('chart-export-pdf');
  if (pdfBtn && !pdfBtn.dataset.bound) {
    pdfBtn.dataset.bound = '1';
    pdfBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (expM) expM.hidden = true;
      if (typeof exportarAnalisePdf === 'function') exportarAnalisePdf(window.__bpUltimaAnaliseTemporal);
    });
  }

  var moreT = document.getElementById('chart-more-toggle');
  var moreM = document.getElementById('chart-more-menu');
  if (moreT && moreM && !moreT.dataset.bound) {
    moreT.dataset.bound = '1';
    moreT.addEventListener('click', function (e) {
      e.stopPropagation();
      moreM.hidden = !moreM.hidden;
      moreT.setAttribute('aria-expanded', moreM.hidden ? 'false' : 'true');
    });
    moreM.querySelectorAll('[data-chart-more]').forEach(function (item) {
      item.addEventListener('click', function (e) {
        e.stopPropagation();
        moreM.hidden = true;
        var act = this.getAttribute('data-chart-more');
        var leg = document.getElementById('dash-chart-legend');
        var ins = document.getElementById('dash-chart-insights');
        var mediaSpan = leg ? leg.querySelector('.dash-chart-leg-media') : null;

        // Exclusivo: só uma acção activa de cada vez
        var wasOn = this.classList.contains('is-on');
        moreM.querySelectorAll('[data-chart-more]').forEach(function (b) {
          b.classList.remove('is-on');
        });
        window._chartShowMedia = false;
        window._chartShowComparar = false;
        window._chartShowInsights = false;
        if (ins) { ins.hidden = true; ins.classList.remove('is-live'); }
        if (mediaSpan) mediaSpan.classList.remove('is-active');
        if (leg) {
          var cmp0 = document.getElementById('dash-chart-leg-cmp');
          if (cmp0) cmp0.hidden = true;
        }

        if (wasOn) {
          // desligar tudo
          try { _bpHaptic('toggle'); } catch (_) {}
          if (leg) leg.hidden = true;
          if (typeof renderizarGrafico === 'function') renderizarGrafico();
          return;
        }

        this.classList.add('is-on');
        try { _bpHaptic('select'); } catch (_) {}

        if (act === 'media') {
          window._chartShowMedia = true;
          if (leg) leg.hidden = false;
          if (mediaSpan) mediaSpan.classList.add('is-active');
          if (typeof renderizarGrafico === 'function') renderizarGrafico();
        } else if (act === 'comparar') {
          window._chartShowComparar = true;
          if (leg) {
            leg.hidden = false;
            var cmp = document.getElementById('dash-chart-leg-cmp');
            if (cmp) {
              cmp.hidden = false;
              var a = window.__bpUltimaAnaliseTemporal;
              var pct = a && a.anterior && a.anterior.pct != null ? a.anterior.pct : null;
              cmp.textContent = pct != null
                ? ((pct > 0 ? '+' : '') + (Math.round(pct * 10) / 10) + '% vs anterior')
                : 'Sem comparação';
            }
          }
          if (typeof renderizarGrafico === 'function') renderizarGrafico();
        } else if (act === 'insights') {
          window._chartShowInsights = true;
          if (ins) {
            if (typeof actualizarDashChartInsights === 'function' && window.__bpUltimaAnaliseTemporal) {
              try { actualizarDashChartInsights(window.__bpUltimaAnaliseTemporal); } catch (_) {}
            }
            ins.hidden = false;
            ins.classList.add('is-live');
          }
        }
      });
    });

  }
  document.addEventListener('click', function () {
    if (expM) expM.hidden = true;
    if (moreM) moreM.hidden = true;
  });
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { setTimeout(_bpInitChartChrome, 100); });
} else {
  setTimeout(_bpInitChartChrome, 100);
}


/* ET4.7 — nav e overlays: nunca deixar tooltip roubar toques */
(function bpChartTooltipNavGuard() {
  if (window.__bpChartTipGuard) return;
  window.__bpChartTipGuard = 1;
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    // Toque na bottom-nav ou noutro tab-pane que não o dashboard → esconder tooltip
    if (t.closest('.bottom-nav, .nav-item, [data-tab]')) {
      if (typeof bpHideChartTooltip === 'function') bpHideChartTooltip();
      return;
    }
    if (t.closest('#tab-agenda, #tab-clientes, #tab-caixa, #tab-equipa, #tab-ia')) {
      if (typeof bpHideChartTooltip === 'function') bpHideChartTooltip();
    }
  }, true);
  document.addEventListener('touchstart', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    if (t.closest('.bottom-nav, .nav-item')) {
      if (typeof bpHideChartTooltip === 'function') bpHideChartTooltip();
    }
  }, { capture: true, passive: true });
})();

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
  const nomeProf = typeof getProfissionalNome === 'function'
    ? getProfissionalNome(venda.profissional_id)
    : (venda.profissional || '—');
  const mp = venda.metodoPagamento || 'Numerário';
  const ref = String(venda.reciboNum || venda.id || '').slice(0, 8).toUpperCase();

  let itensHtml = '';
  if (venda.itens && venda.itens.length > 0) {
    itensHtml =
      '<div class="bp-view-section-title">Itens</div>' +
      '<div class="bp-view-dl bp-view-dl--itens">' +
      '<div class="detalhe-itens-header">' +
      '<span>Descrição</span><span style="text-align:right">Qtd</span><span style="text-align:right">Unit.</span><span style="text-align:right">Total</span></div>' +
      venda.itens.map(function (item) {
        var q = item.quantidade || 1;
        var unit = (item.precoUnit != null ? item.precoUnit : item.subtotal);
        var sub = item.subtotal;
        return (
          '<div class="detalhe-item-row">' +
          '<span class="desc">' + escHtml(item.nome) + '</span>' +
          '<span class="qty">' + q + '</span>' +
          '<span class="pu">' + fmtKz(unit) + '</span>' +
          '<span class="sub">' + fmtKz(sub) + '</span></div>'
        );
      }).join('') +
      '</div>';
  } else {
    itensHtml = '<p class="bp-view-value--muted" style="font-size:.85rem;margin:0 0 12px;">Sem linhas de item nesta venda.</p>';
  }

  const box = document.getElementById('detalhe-venda-conteudo');
  if (box) {
    box.innerHTML =
      '<div class="bp-view-dl">' +
      '<div class="bp-view-row"><span class="bp-view-label">Cliente</span><span class="bp-view-value">' + escHtml(venda.cliente || 'Avulso') + '</span></div>' +
      '<div class="bp-view-row"><span class="bp-view-label">Profissional</span><span class="bp-view-value">' + escHtml(nomeProf || '—') + '</span></div>' +
      '<div class="bp-view-row"><span class="bp-view-label">Quando</span><span class="bp-view-value">' + escHtml(String(venda.data || '')) + ' · ' + escHtml(String(venda.hora || '').slice(0, 5)) + '</span></div>' +
      '<div class="bp-view-row"><span class="bp-view-label">Pagamento</span><span class="bp-view-value"><span class="pagamento-badge">' + escHtml(mp) + '</span></span></div>' +
      (String(venda.status || '').toLowerCase() === 'cancelado' ? '<div class="bp-view-row"><span class="bp-view-label">Estado</span><span class="bp-view-value">Cancelada' + (venda.cancelado_motivo ? (' · ' + escHtml(venda.cancelado_motivo)) : '') + '</span></div>' : '') +
      '</div>' +
      itensHtml +
      '<div class="bp-view-total"><span class="bp-view-label">Total</span><span class="bp-view-value">' + fmtKz(Number(venda.valor) || 0) + '</span></div>';
  }
  const tit = document.getElementById('detalhe-venda-titulo');
  if (tit) tit.textContent = ref ? ('Ref. ' + ref) : 'Detalhe da venda';
  var btnCanc = document.getElementById('btn-cancelar-venda');
  if (btnCanc) {
    var jaCanc = String(venda.status || '').toLowerCase() === 'cancelado';
    var pode = typeof bpPode === 'function' ? bpPode(['admin', 'gerente']) : true;
    btnCanc.style.display = (!jaCanc && pode) ? '' : 'none';
    btnCanc.disabled = jaCanc;
  }
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

/** Microinterações do carrinho (respeita prefers-reduced-motion). */
let _cartAnim = { type: null, idx: -1, nome: null };
function _cartMotionOk() {
  try {
    return !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  } catch (e) { return true; }
}
function _pulseCartTotal() {
  if (!_cartMotionOk()) return;
  const el = document.querySelector('#cart-total-area .ct-val');
  if (!el) return;
  el.classList.remove('ct-val--pulse');
  void el.offsetWidth;
  el.classList.add('ct-val--pulse');
  setTimeout(function () { el.classList.remove('ct-val--pulse'); }, 280);
}
function _bumpEl(row, sel) {
  if (!_cartMotionOk() || !row) return;
  const el = row.querySelector(sel);
  if (!el) return;
  el.classList.remove('is-bump');
  void el.offsetWidth;
  el.classList.add('is-bump');
  setTimeout(function () { el.classList.remove('is-bump'); }, 220);
}

let cartItems = [];
// ET4.4: chave legada + chave por salão (isolamento multi-tenant no device)
const CART_STORAGE_KEY_LEGACY = 'bp_cart_items';

function cartStorageKey() {
  try {
    var sid = (typeof state !== 'undefined' && state.config && state.config.salaoId)
      ? String(state.config.salaoId) : '';
    if (sid) return 'bp_cart_items_' + sid;
  } catch (_) {}
  return CART_STORAGE_KEY_LEGACY;
}

// --- Persistência ---
function saveCartToStorage() {
  try { localStorage.setItem(cartStorageKey(), JSON.stringify(cartItems)); } catch (e) {}
}

function loadCartFromStorage() {
  try {
    var key = cartStorageKey();
    var data = localStorage.getItem(key);
    // migração única: legado global → chave do salão actual
    if (!data && key !== CART_STORAGE_KEY_LEGACY) {
      data = localStorage.getItem(CART_STORAGE_KEY_LEGACY);
      if (data) {
        try { localStorage.setItem(key, data); } catch (_) {}
        try { localStorage.removeItem(CART_STORAGE_KEY_LEGACY); } catch (_) {}
      }
    }
    if (data) {
      cartItems = JSON.parse(data);
      if (!Array.isArray(cartItems)) cartItems = [];
      renderCart();
    }
  } catch (e) { cartItems = []; }
}

function clearCartStorageAll() {
  cartItems = [];
  try { localStorage.removeItem(CART_STORAGE_KEY_LEGACY); } catch (_) {}
  try {
    var key = cartStorageKey();
    if (key) localStorage.removeItem(key);
  } catch (_) {}
  // limpar outras chaves de carrinho no device (troca de salão)
  try {
    for (var i = localStorage.length - 1; i >= 0; i--) {
      var k = localStorage.key(i);
      if (k && k.indexOf('bp_cart_items') === 0) localStorage.removeItem(k);
    }
  } catch (_) {}
}
if (typeof window !== "undefined") window.clearCartStorageAll = clearCartStorageAll;


// --- Renderização do carrinho com botões + / - e total detalhado ---
function renderCart() {
  const list = document.getElementById('cart-items-list');
  const totalArea = document.getElementById('cart-total-area');
  if (!list) return;

  if (cartItems.length === 0) {
    list.innerHTML = `
      <div class="venda-cart-empty">
        <p class="venda-cart-empty-title">Nenhum item ainda</p>
        <p class="venda-cart-empty-hint">Escolha um serviço abaixo e toque em «Adicionar à venda».</p>
      </div>`;
    if (totalArea) {
      totalArea.innerHTML = '';
      totalArea.hidden = true;
    }
    updateVendaSaveButton();
    return;
  }

  list.innerHTML = cartItems.map((item, idx) => {
    let cls = 'cart-item-row';
    if (_cartAnim.type === 'add' && (
      (_cartAnim.idx === idx) || (_cartAnim.nome && item.nome === _cartAnim.nome)
    )) cls += ' adding';
    if (_cartAnim.type === 'qty' && _cartAnim.idx === idx) cls += ' is-qty-flash';
    return `
    <div class="${cls}" data-idx="${idx}" data-nome="${escHtml(item.nome)}">
      <span class="ci-name">${escHtml(item.nome)}</span>
      <span class="ci-qty-controls">
        <button type="button" class="qty-btn" data-idx="${idx}" data-action="decrement" aria-label="Diminuir quantidade">−</button>
        <span class="qty-number">${item.quantidade}</span>
        <button type="button" class="qty-btn" data-idx="${idx}" data-action="increment" aria-label="Aumentar quantidade">+</button>
      </span>
      <span class="ci-val">${fmtKz(item.subtotal)}</span>
      <button type="button" class="ci-del" data-idx="${idx}" aria-label="Remover item">✕</button>
    </div>`;
  }).join('');
  // Limpar flags após paint + micro-bumps
  const animType = _cartAnim.type;
  const animIdx = _cartAnim.idx;
  _cartAnim = { type: null, idx: -1, nome: null };
  if (animType && _cartMotionOk()) {
    requestAnimationFrame(function () {
      const row = list.querySelector('.cart-item-row[data-idx="' + animIdx + '"]') ||
        list.querySelector('.cart-item-row.adding') ||
        list.querySelector('.cart-item-row.is-qty-flash');
      if (row && (animType === 'qty' || animType === 'add')) {
        _bumpEl(row, '.qty-number');
        _bumpEl(row, '.ci-val');
      }
      _pulseCartTotal();
      list.querySelectorAll('.cart-item-row.adding').forEach(function (r) {
        r.addEventListener('animationend', function () { r.classList.remove('adding'); }, { once: true });
      });
      list.querySelectorAll('.cart-item-row.is-qty-flash').forEach(function (r) {
        setTimeout(function () { r.classList.remove('is-qty-flash'); }, 400);
      });
    });
  } else {
    _pulseCartTotal();
  }

  const total = cartItems.reduce((s, i) => s + (Number(i.subtotal) || 0), 0);
  const totalItems = cartItems.reduce((s, i) => s + (Number(i.quantidade) || 0), 0);
  if (totalArea) {
    totalArea.hidden = false;
    totalArea.innerHTML = `
      <div class="cart-total-row">
        <span class="ct-label">${totalItems === 1 ? '1 item' : totalItems + ' itens'}</span>
        <span class="ct-val">${fmtKz(total)}</span>
      </div>
    `;
  }

  saveCartToStorage();
  updateVendaSaveButton();
}

/** CTA do rodapé: desactivado se vazio; mostra o valor a cobrar. */
function updateVendaSaveButton() {
  const btn = document.getElementById('modal-venda-save');
  if (!btn) return;
  const total = (cartItems || []).reduce((s, i) => s + (Number(i.subtotal) || 0), 0);
  const n = (cartItems || []).length;
  if (n === 0 || total <= 0) {
    btn.disabled = true;
    btn.textContent = 'Cobrar';
    btn.setAttribute('aria-disabled', 'true');
  } else {
    btn.disabled = false;
    btn.textContent = 'Cobrar · ' + (typeof fmtKz === 'function' ? fmtKz(total) : total + ' Kz');
    btn.removeAttribute('aria-disabled');
  }
}

// --- Ajustar quantidade ---
function adjustQuantity(idx, delta) {
  if (idx < 0 || idx >= cartItems.length) return;
  const item = cartItems[idx];
  const newQty = item.quantidade + delta;
  if (newQty <= 0) {
    removeItemFromCart(idx, true);
    return;
  }
  item.quantidade = Math.floor(Number(newQty)) || 1;
  if (item.quantidade < 1) item.quantidade = 1;
  item.subtotal = item.quantidade * item.precoUnit;
  _cartAnim = { type: 'qty', idx: idx, nome: item.nome };
  renderCart();
  if (typeof updateVendaSaveButton === 'function') updateVendaSaveButton();
}

// --- Remover item (com confirmação) ---
async function removeItemFromCart(idx, skipConfirm) {
  if (idx < 0 || idx >= cartItems.length) return;
  const item = cartItems[idx];
  if (!skipConfirm && item.quantidade > 1) {
    let choice = true;
    if (typeof showConfirmModal === 'function') {
      choice = await showConfirmModal(
        'Remover item?',
        '"' + (item.nome || 'Item') + '" tem ' + item.quantidade + ' unidades. Queres remover todas da venda?',
        true,
        { confirmLabel: 'Remover', cancelLabel: 'Cancelar', variant: 'destructive' }
      );
    } else {
      choice = true;
    }
    if (!choice) {
      // Deixar só 1 unidade em vez de forçar decisão binária agressiva
      item.quantidade = 1;
      item.subtotal = item.precoUnit;
      _cartAnim = { type: 'qty', idx: idx, nome: item.nome };
      renderCart();
      return;
    }
  }

  const list = document.getElementById('cart-items-list');
  const row = list && list.querySelector('.cart-item-row[data-idx="' + idx + '"]');
  const finish = function () {
    cartItems.splice(idx, 1);
    renderCart();
  };
  if (row && _cartMotionOk()) {
    row.classList.add('removing');
    let done = false;
    const once = function () {
      if (done) return;
      done = true;
      finish();
    };
    row.addEventListener('animationend', once, { once: true });
    setTimeout(once, 320); // fallback se animationend não disparar
  } else {
    finish();
  }
}

// --- Função central de adição ao carrinho (sem profissional) ---
async function addToCart(nome, valor) {
  // R17: manter o nome exacto do catálogo (nunca sufixar preço — quebrava a validação)
  nome = String(nome || '').trim();
  valor = Number(valor);
  if (!nome || !Number.isFinite(valor) || valor <= 0) {
    if (typeof toast === 'function') toast('Informe um preço válido superior a zero.', 'warning');
    return;
  }
  const existingIndex = cartItems.findIndex(function (item) {
    return item && item.nome === nome && Number(item.precoUnit) === valor;
  });
  if (existingIndex !== -1) {
    const existing = cartItems[existingIndex];
    existing.quantidade += 1;
    existing.subtotal = existing.quantidade * existing.precoUnit;
    _cartAnim = { type: 'qty', idx: existingIndex, nome: existing.nome };
    renderCart();
    return;
  }
  // Mesmo serviço, preço diferente → linha separada, nome de catálogo intacto
  const sameNameIdx = cartItems.findIndex(function (item) { return item && item.nome === nome; });
  if (sameNameIdx !== -1) {
    const existing = cartItems[sameNameIdx];
    if (Number(existing.precoUnit) !== valor) {
      let choice = false;
      if (typeof showConfirmModal === 'function') {
        choice = await showConfirmModal(
          'Atualizar preço?',
          '"' + nome + '" já está no carrinho a ' + (typeof fmtKz === 'function' ? fmtKz(existing.precoUnit) : existing.precoUnit) + '. Queres atualizar para ' + (typeof fmtKz === 'function' ? fmtKz(valor) : valor) + '? Se cancelares, os dois preços ficam como linhas separadas.',
          false,
          { confirmLabel: 'Atualizar', cancelLabel: 'Manter separados', variant: 'default' }
        );
      }
      if (choice) {
        existing.precoUnit = valor;
        existing.subtotal = existing.quantidade * valor;
        _cartAnim = { type: 'qty', idx: sameNameIdx, nome: existing.nome };
        renderCart();
        return;
      }
    }
  }
  cartItems.push({
    nome: nome,
    quantidade: 1,
    precoUnit: valor,
    subtotal: valor
  });
  _cartAnim = { type: 'add', idx: cartItems.length - 1, nome: nome };
  renderCart();
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
  try {
    loadCartFromStorage();
    const clientSel = document.getElementById('venda-cliente');
    if (clientSel) {
      const opts = ['<option value="">Seleccionar cliente</option>']
        .concat((state.clientes || []).filter(function (c) {
          if (!c || !c.nome) return false;
          if (c.ativo === false || c.ativo === 0 || c.ativo === 'false') return false;
          return true;
        }).map(function (c) {
          return '<option value="' + escHtml(c.nome) + '">' + escHtml(c.nome) + '</option>';
        }));
      clientSel.innerHTML = opts.join('');
    }
    if (typeof populateVendaSelects === 'function') populateVendaSelects();
    const pag = document.getElementById('venda-pagamento');
    if (pag) pag.value = '';
    renderCart();
    updateVendaSaveButton();
    if (typeof openModal === 'function') openModal('modal-venda');
    else {
      const modal = document.getElementById('modal-venda');
      if (modal) { modal.classList.add('open'); modal.style.display = 'flex'; }
    }
    setTimeout(function () {
      const el = document.getElementById(cartItems.length ? 'venda-pagamento' : 'ci-servico-sel');
      if (el && typeof el.focus === 'function') try { el.focus(); } catch (e) {}
    }, 120);
  } catch (err) {
    console.error('[openVendaModal]', err);
    if (typeof toast === 'function') toast('Não foi possível abrir a venda', 'error');
  }
}

// --- Limpar carrinho (após venda ou cancelamento) ---
function clearCart() {
  cartItems = [];
  localStorage.removeItem(cartStorageKey());
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
function _servicoProfSelected(selected, p) {
  const arr = selected || [];
  return arr.some(function (x) {
    return x === p.id || x === p.nome || String(x) === String(p.id);
  });
}

function renderServicoProfissionais(selected = []) {
  const container = document.getElementById('servico-profissionais-container');
  if (!container) return;
  const activos = (state.profissionais || []).filter(function (p) {
    return typeof isProfissionalAtivo === 'function' ? isProfissionalAtivo(p) : (p.ativo !== false);
  });
  if (!activos.length) {
    container.innerHTML = '<span style="color:var(--text-muted);font-size:.75rem;">Nenhum profissional activo</span>';
    return;
  }
  container.innerHTML = activos.map(p => {
    const checked = _servicoProfSelected(selected, p) ? ' checked' : '';
    return (
      '<label class="bp-chip-check">' +
      '<input type="checkbox" value="' + escHtml(p.id) + '" data-nome="' + escHtml(p.nome) + '"' + checked + '>' +
      escHtml(p.nome) +
      '</label>'
    );
  }).join('');
}

/** Preferência: guarda nomes legíveis + ids resolvíveis no futuro via data-nome */
function getSelectedProfissionais() {
  const container = document.getElementById('servico-profissionais-container');
  if (!container) return [];
  const checks = container.querySelectorAll('input[type="checkbox"]:checked');
  return Array.from(checks).map(function (cb) {
    // Guardar nome para compatibilidade com dados legados e seed
    return cb.getAttribute('data-nome') || cb.value;
  }).filter(Boolean);
}

function setServicoModalMode(mode) {
  const modal = document.getElementById('modal-servico');
  const sheet = document.getElementById('modal-servico-sheet');
  const view = document.getElementById('servico-view-panel');
  const form = document.getElementById('servico-form-panel');
  if (modal) modal.setAttribute('data-mode', mode);
  if (sheet) sheet.classList.toggle('modal-sheet--view', mode === 'view');
  if (view) {
    view.hidden = mode !== 'view';
    try { view.style.display = mode === 'view' ? '' : 'none'; } catch (_) {}
  }
  if (form) {
    form.hidden = mode !== 'edit';
    try { form.style.display = mode === 'edit' ? '' : 'none'; } catch (_) {}
  }
}

function _labelProfsServico(arr) {
  const list = arr || [];
  if (!list.length) return 'Sem profissionais associados';
  return list.map(function (x) {
    const byId = (state.profissionais || []).find(function (p) { return p.id === x; });
    return byId ? byId.nome : x;
  }).join(', ');
}

function abrirDetalheServicoView(id) {
  const s = (state.servicos || []).find(function (x) { return x.id === id; });
  if (!s) return;
  setServicoModalMode('view');
  const title = document.getElementById('servico-modal-title');
  if (title) title.textContent = 'Ficha do serviço';
  const idInput = document.getElementById('servico-id');
  if (idInput) idInput.value = id;
  const dur = Number(s.duracao || s.duracaoMin || s.minutos || 60) || 60;
  const body = document.getElementById('servico-view-body');
  if (body) {
    body.innerHTML =
      '<div class="bp-view-hero">' +
      '<div class="bp-view-hero-av" style="font-size:0.75rem;letter-spacing:0.02em;">SRV</div>' +
      '<div><div class="bp-view-hero-name">' + escHtml(s.nome || 'Serviço') + '</div>' +
      '<div class="bp-view-hero-meta">' + fmtKz(Number(s.precoBase) || 0) + ' · ' + dur + ' min</div></div></div>' +
      '<div class="bp-view-dl">' +
      '<div class="bp-view-row"><span class="bp-view-label">Nome</span><span class="bp-view-value">' + escHtml(s.nome || '—') + '</span></div>' +
      '<div class="bp-view-row"><span class="bp-view-label">Preço</span><span class="bp-view-value">' + fmtKz(Number(s.precoBase) || 0) + '</span></div>' +
      '<div class="bp-view-row"><span class="bp-view-label">Duração</span><span class="bp-view-value">' + dur + ' min</span></div>' +
      '<div class="bp-view-row"><span class="bp-view-label">Profissionais</span><span class="bp-view-value">' + escHtml(_labelProfsServico(s.profissionais)) + '</span></div>' +
      '</div>';
  }
  openModal('modal-servico');
}

function openServicoModal(id = null) {
  setServicoModalMode('edit');
  const title = document.getElementById('servico-modal-title');
  const nomeInput = document.getElementById('servico-nome');
  const precoInput = document.getElementById('servico-preco');
  const durInput = document.getElementById('servico-duracao');
  const idInput = document.getElementById('servico-id');
  if (id) {
    const serv = state.servicos.find(s => s.id === id);
    if (!serv) return;
    if (title) title.textContent = 'Editar serviço';
    if (nomeInput) nomeInput.value = serv.nome || '';
    if (precoInput) precoInput.value = serv.precoBase != null ? serv.precoBase : '';
    if (durInput) durInput.value = Number(serv.duracao || serv.duracaoMin || serv.minutos || 60) || 60;
    if (idInput) idInput.value = id;
    renderServicoProfissionais(serv.profissionais || []);
  } else {
    if (title) title.textContent = 'Novo serviço';
    if (nomeInput) nomeInput.value = '';
    if (precoInput) precoInput.value = '';
    if (durInput) durInput.value = '60';
    if (idInput) idInput.value = '';
    renderServicoProfissionais([]);
  }
  openModal('modal-servico');
}

window.abrirDetalheServicoView = abrirDetalheServicoView;
window.openServicoModal = openServicoModal;
window.setServicoModalMode = setServicoModalMode;

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
  if (!list) {
    if (typeof openModal === 'function') openModal('modal-revenue-detail');
    return;
  }
  if (!state.movimentos || !Array.isArray(state.movimentos)) {
    list.innerHTML = '<div class="empty-state"><p>A carregar...</p></div>';
    if (totalSpan) totalSpan.textContent = '0 Kz';
    if (typeof openModal === 'function') openModal('modal-revenue-detail');
    return;
  }

  /* Mesmo intervalo dos KPIs do Resumo (não fixar só "hoje") */
  var inicio;
  var fim;
  var labelPeriodo = 'Hoje';
  try {
    if (typeof getIntervaloDashAtual === 'function') {
      var iv = getIntervaloDashAtual();
      if (iv && iv.inicio && iv.fim) {
        inicio = iv.inicio;
        fim = iv.fim;
        labelPeriodo = iv.label || labelPeriodo;
      }
    }
  } catch (_) {}
  if (!inicio || !fim) {
    var hojeStr = typeof hoje === 'function' ? hoje() : new Date().toISOString().slice(0, 10);
    inicio = fim = hojeStr;
  }
  if (inicio > fim) { var _swF = inicio; inicio = fim; fim = _swF; }

  var titleEl = document.getElementById('revenue-title');
  if (titleEl) {
    titleEl.textContent = 'Faturamento · ' + labelPeriodo;
  }

  var vendas = state.movimentos.filter(function (m) {
    if (!m || m.tipo !== 'venda' || !m.data) return false;
    if (String(m.status || '').toLowerCase() === 'cancelado') return false;
    return m.data >= inicio && m.data <= fim;
  }).sort(function (a, b) {
    var d = String(b.data || '').localeCompare(String(a.data || ''));
    if (d !== 0) return d;
    return String(b.hora || '').localeCompare(String(a.hora || ''));
  });

  if (vendas.length === 0) {
    list.innerHTML = '<div class="empty-state"><p>Nenhuma venda neste período</p></div>';
    if (totalSpan) totalSpan.textContent = '0 Kz';
  } else {
    list.innerHTML = vendas.map(function (v) {
      var nome = v.cliente || 'Anónimo';
      var av = '<div class="avatar">' + (typeof escHtml === 'function' ? escHtml(String(nome).charAt(0).toUpperCase()) : '?') + '</div>';
      try {
        var cli = (state.clientes || []).find(function (c) {
          return (v.cliente_id && String(c.id) === String(v.cliente_id)) || c.nome === v.cliente;
        });
        var src = null;
        if (cli && window.BPMedia && typeof BPMedia.resolveFotoSrc === 'function') {
          src = BPMedia.resolveFotoSrc(cli);
        } else if (cli && (cli.foto || cli.foto_url)) {
          src = cli.foto || cli.foto_url;
        }
        if (src) {
          av = '<div class="avatar bp-avatar-img"><img src="' + String(src).replace(/"/g, '&quot;') + '" alt="" loading="lazy" decoding="async"></div>';
        }
      } catch (_) {}
      var dataLbl = (v.data === fim && inicio === fim)
        ? (v.hora || '')
        : ((v.data || '') + (v.hora ? ' · ' + v.hora : ''));
      var sub = (typeof escHtml === 'function' ? escHtml(v.descricao || '') : (v.descricao || ''));
      if (dataLbl) sub += (sub ? ' · ' : '') + (typeof escHtml === 'function' ? escHtml(String(dataLbl)) : dataLbl);
      var valorStr = typeof fmtKz === 'function' ? fmtKz(v.valor) : (String(v.valor || 0) + ' Kz');
      return (
        '<div class="list-item bp-revenue-row" style="cursor:default;">' + av +
        '<div class="info">' +
        '<div class="title">' + (typeof escHtml === 'function' ? escHtml(nome) : nome) + '</div>' +
        '<div class="sub">' + sub + '</div></div>' +
        '<div class="action bp-revenue-val">' + valorStr + '</div></div>'
      );
    }).join('');
    var total = vendas.reduce(function (s, v) { return s + (Number(v.valor) || 0); }, 0);
    if (totalSpan) totalSpan.textContent = typeof fmtKz === 'function' ? fmtKz(total) : (total + ' Kz');
  }
  if (typeof openModal === 'function') openModal('modal-revenue-detail');
}

let agendaDetailFiltro = 'pendentes';

function abrirDetalheAgendamentos(filtro = 'pendentes') {
  agendaDetailFiltro = filtro;
  const list = document.getElementById('agenda-detail-list');
  const btnPend = document.getElementById('agenda-detail-pendentes');
  const btnReal = document.getElementById('agenda-detail-realizados');
  const totEl = document.getElementById('agenda-detail-totals');
  if (!list) {
    if (typeof openModal === 'function') openModal('modal-agenda-detail');
    return;
  }
  if (!state.agendamentos || !Array.isArray(state.agendamentos)) {
    list.innerHTML = '<div class="empty-state"><p>A carregar...</p></div>';
    if (totEl) totEl.hidden = true;
    if (typeof openModal === 'function') openModal('modal-agenda-detail');
    return;
  }
  const hojeStr = typeof hoje === 'function' ? hoje() : new Date().toISOString().slice(0, 10);
  /* Mesmo intervalo dos KPIs do Resumo */
  var inicio = hojeStr, fim = hojeStr, labelPeriodo = 'Hoje';
  try {
    if (typeof getIntervaloDashAtual === 'function') {
      var iv = getIntervaloDashAtual();
      if (iv && iv.inicio && iv.fim) {
        inicio = iv.inicio;
        fim = iv.fim;
        labelPeriodo = iv.label || labelPeriodo;
      }
    }
  } catch (_) {}
  if (inicio > fim) { var _sw = inicio; inicio = fim; fim = _sw; }
  var titleEl = document.getElementById('agenda-detail-title');
  if (titleEl) titleEl.textContent = 'Agendamentos · ' + labelPeriodo;

  const all = state.agendamentos.slice();
  let filtrados;
  if (filtro === 'pendentes') {
    filtrados = all.filter(function (a) {
      if (!a || !a.data) return false;
      if (a.data < inicio || a.data > fim) return false;
      const st = typeof _statusAg === 'function' ? _statusAg(a) : String(a.status || '');
      return st === 'agendado';
    }).sort(function (a, b) {
      return String(a.data).localeCompare(String(b.data)) || String(a.hora || '').localeCompare(String(b.hora || ''));
    });
  } else {
    filtrados = all.filter(function (a) {
      if (!a || !a.data) return false;
      if (a.data < inicio || a.data > fim) return false;
      const st = typeof _statusAg === 'function' ? _statusAg(a) : String(a.status || '');
      return st === 'realizado';
    }).sort(function (a, b) {
      return String(b.data).localeCompare(String(a.data)) || String(b.hora || '').localeCompare(String(a.hora || ''));
    });
  }
  if (btnPend) btnPend.className = 'btn btn-sm ' + (filtro === 'pendentes' ? 'btn-primary' : 'btn-secondary');
  if (btnReal) btnReal.className = 'btn btn-sm ' + (filtro === 'realizados' ? 'btn-primary' : 'btn-secondary');
  const sum = filtrados.reduce((s, a) => s + (Number(a.preco) || 0), 0);
  if (totEl) {
    totEl.hidden = false;
    totEl.innerHTML = '<span>' + filtrados.length + ' · ' + (filtro === 'pendentes' ? 'pendentes' : 'realizados') +
      '</span><strong>' + (typeof fmtKz === 'function' ? fmtKz(sum) : (sum + ' Kz')) + '</strong>';
  }
  if (filtrados.length === 0) {
    list.innerHTML = '<div class="empty-state"><p>Nenhum agendamento ' + (filtro === 'pendentes' ? 'pendente' : 'realizado') + '</p></div>';
  } else {
    list.innerHTML = filtrados.map(a => {
      const nomeProf = typeof getProfissionalNome === 'function' ? getProfissionalNome(a.profissional_id) : '';
      let av = '<div class="avatar">' + escHtml(String(a.cliente || '?').charAt(0).toUpperCase()) + '</div>';
      try {
        const cli = (state.clientes || []).find(c => String(c.id) === String(a.cliente_id) || c.nome === a.cliente);
        let src = null;
        if (cli && window.BPMedia && BPMedia.resolveFotoSrc) src = BPMedia.resolveFotoSrc(cli);
        else if (cli && (cli.foto || cli.foto_url)) src = cli.foto || cli.foto_url;
        if (src) av = '<div class="avatar bp-avatar-img"><img src="' + String(src).replace(/"/g, '&quot;') + '" alt="" loading="lazy"></div>';
      } catch (_) {}
      const dataLbl = (a.data === fim && inicio === fim) ? (a.hora || '') : ((a.data || '') + (a.hora ? ' · ' + a.hora : ''));
      return (
        '<div class="list-item" style="cursor:default;">' + av +
        '<div class="info"><div class="title">' + escHtml(a.servico || '') + '</div>' +
        '<div class="sub">' + escHtml(a.cliente || '') + ' · ' + escHtml(String(dataLbl)) +
        (nomeProf ? ' · ' + escHtml(nomeProf) : '') + '</div></div>' +
        '<div class="action">' + (typeof fmtKz === 'function' ? fmtKz(a.preco) : a.preco) + '</div></div>'
      );
    }).join('');
  }
  if (typeof openModal === 'function') openModal('modal-agenda-detail');
}

function abrirFechoCaixa() {
  if (typeof bpExigirRole === 'function' && !bpExigirRole(['admin'], 'Apenas administradores podem fechar o caixa.')) return;
 const hojeStr = hoje();
 const movs = (state.movimentos && Array.isArray(state.movimentos) ? state.movimentos : []).filter(m => m.data === hojeStr);
 const vendas = movs.filter(m => m.tipo === 'venda');
 const despesas = movs.filter(m => m.tipo === 'despesa');
 const totalVendas = vendas.reduce((s, v) => s + (Number(v.valor) || 0), 0);
 const totalDespesas = despesas.reduce((s, d) => s + (Number(d.valor) || 0), 0);
 const saldoFinal = (Number(state.config.fundo) || 0) + totalVendas - totalDespesas;
 const byPag = {};
 vendas.forEach(v => { const k = v.metodoPagamento || 'Numerário';
  byPag[k] = (byPag[k] || 0) + (Number(v.valor) || 0); });
 const pagHtml = Object.entries(byPag).map(([k, v]) =>
  `<div class="fecho-row"><span class="fr-label">${escHtml(k)}</span><span class="fr-val">${fmtKz(v)}</span></div>`
  ).join('');
 const fechoBox = document.getElementById('fecho-conteudo');
 if (!fechoBox) return;
 fechoBox.innerHTML = `
  <div class="bp-fecho-panel">
    <div class="bp-fecho-date">${new Date().toLocaleDateString('pt-AO', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
    <div class="bp-fecho-card">
      <div class="fecho-row"><span class="fr-label">Fundo de abertura</span><span class="fr-val">${fmtKz(state.config.fundo)}</span></div>
      <div class="fecho-row"><span class="fr-label">Vendas · ${vendas.length}</span><span class="fr-val fr-val--in">+${fmtKz(totalVendas)}</span></div>
      <div class="fecho-row"><span class="fr-label">Despesas · ${despesas.length}</span><span class="fr-val fr-val--out">−${fmtKz(totalDespesas)}</span></div>
    </div>
    <div class="bp-fecho-section">Métodos de pagamento</div>
    <div class="bp-fecho-card bp-fecho-card--soft">
      ${pagHtml || '<div class="fecho-row"><span class="fr-label">Sem vendas hoje</span><span class="fr-val">0 Kz</span></div>'}
    </div>
    <div class="bp-fecho-total">
      <span class="bp-fecho-total-label">Saldo final em caixa</span>
      <span class="bp-fecho-total-val">${fmtKz(saldoFinal)}</span>
    </div>
  </div>`;
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
     if (lastElement) try { lastElement.focus(); } catch (_) {} }
   } else {
    if (document.activeElement === lastElement) { e.preventDefault();
     if (firstElement) try { firstElement.focus(); } catch (_) {} }
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
  if (firstFocusable) setTimeout(function () { try { firstFocusable.focus(); } catch (_) {} }, 100);
 };
}
const originalCloseModal = window.closeModal;
if (originalCloseModal) {
 window.closeModal = function(id) {
  originalCloseModal(id);
  if (previousFocusedElement && previousFocusedElement.focus) { setTimeout(function () { try { previousFocusedElement.focus(); } catch (_) {} previousFocusedElement = null; }, 200); }
 };
}

// ====================================================================
// IA OFFLINE E SVGs
// ====================================================================
function atualizarIAOffline() {
  var overlay = document.getElementById('ia-offline-overlay');
  if (overlay) {
    overlay.style.display = 'none';
    overlay.setAttribute('aria-hidden', 'true');
    try { overlay.remove(); } catch (_) {}
  }
}

const svgCalendario = `<svg width="80" height="80" viewBox="0 0 80 80" fill="none" stroke="var(--neutral-300)" stroke-width="1.5"><rect x="16" y="20" width="48" height="48" rx="4"/><line x1="16" y1="32" x2="64" y2="32"/><line x1="28" y1="16" x2="28" y2="24"/><line x1="52" y1="16" x2="52" y2="24"/><circle cx="40" cy="44" r="6"/></svg>`;
const svgCarteira = `<svg width="80" height="80" viewBox="0 0 80 80" fill="none" stroke="var(--neutral-300)" stroke-width="1.5"><rect x="12" y="28" width="56" height="36" rx="4"/><path d="M12 36h8a8 8 0 0 1 0 16h-8"/><circle cx="48" cy="46" r="4"/></svg>`;
const svgPessoas = `<svg width="80" height="80" viewBox="0 0 80 80" fill="none" stroke="var(--neutral-300)" stroke-width="1.5"><circle cx="30" cy="24" r="12"/><circle cx="50" cy="24" r="10"/><path d="M10 64c0-12 6-20 20-20s20 8 20 20"/><path d="M56 64c0-8 4-14 14-14s14 6 14 14"/></svg>`;
const svgTesoura = `<svg width="80" height="80" viewBox="0 0 80 80" fill="none" stroke="var(--neutral-300)" stroke-width="1.5"><circle cx="28" cy="36" r="8"/><circle cx="52" cy="36" r="8"/><path d="M20 44 L60 24 M20 24 L60 44"/></svg>`;
const svgPessoa = `<svg width="80" height="80" viewBox="0 0 80 80" fill="none" stroke="var(--neutral-300)" stroke-width="1.5"><circle cx="40" cy="30" r="16"/><path d="M12 68c0-12 8-20 28-20s28 8 28 20"/></svg>`;

// ====================================================================
// NAVEGAÇÃO ENTRE ABAS
// ====================================================================
var BP_TAB_ORDER = ['dashboard', 'agenda', 'clientes', 'caixa', 'equipa', 'ia'];
function bpTabIndex(id) {
  var i = BP_TAB_ORDER.indexOf(id);
  return i < 0 ? 0 : i;
}
/** Slide foto-a-foto ~160ms: páginas adjacentes, stacking absoluto, sem faísca. */
function bpSwitchTabPane(fromId, toId) {
  var from = fromId ? document.getElementById('tab-' + fromId) : null;
  var to = document.getElementById('tab-' + toId);
  if (!to) return;

  var reduce = false;
  try {
    reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (_) {}

  var ALL_ANIM = [
    'bp-tab-slide-from', 'bp-tab-slide-to',
    'bp-tab-from-left', 'bp-tab-from-right',
    'bp-tab-to-from-right', 'bp-tab-to-from-left',
    'bp-tab-fade-in', 'bp-tab-fade-out',
    'bp-tab-in-right', 'bp-tab-in-left', 'bp-tab-out-left', 'bp-tab-out-right'
  ];

  function clearAnim(p) {
    if (!p) return;
    ALL_ANIM.forEach(function (c) { p.classList.remove(c); });
  }

  document.querySelectorAll('.tab-pane').forEach(function (p) {
    clearAnim(p);
    if (p !== to && p !== from) p.classList.remove('active');
  });

  if (reduce || !from || from === to) {
    if (from && from !== to) from.classList.remove('active');
    clearAnim(to);
    to.classList.add('active');
    return;
  }

  // Evitar estados a meio de animação anterior
  clearAnim(from);
  clearAnim(to);

  var forward = bpTabIndex(toId) >= bpTabIndex(fromId);
  var main = document.querySelector('.main-content');
  if (main) main.classList.add('bp-tab-animating');

  // Medir altura com a aba actual (visível); evita minHeight 0 e colapso
  var h = 0;
  try {
    h = Math.max(
      (from && from.offsetHeight) || 0,
      (main && main.clientHeight) || 0,
      240
    );
    if (main) main.style.minHeight = h + 'px';
  } catch (_) {}

  var cleaned = false;
  var clean = function () {
    if (cleaned) return;
    cleaned = true;
    clearAnim(from);
    clearAnim(to);
    from.classList.remove('active');
    to.classList.add('active');
    if (main) {
      main.classList.remove('bp-tab-animating');
      try { main.style.minHeight = ''; } catch (_) {}
    }
    try { to.removeEventListener('animationend', onEnd); } catch (_) {}
  };
  var onEnd = function (e) {
    if (e && e.target !== to) return;
    clean();
  };

  // Preparar estados iniciais ANTES do paint da animação (evita faísca no 1.º frame)
  from.classList.add('bp-tab-slide-from');
  from.classList.remove('active');
  to.classList.add('active', 'bp-tab-slide-to');
  // Posição inicial sem animação
  to.style.transform = forward ? 'translate3d(100%,0,0)' : 'translate3d(-100%,0,0)';
  from.style.transform = 'translate3d(0,0,0)';

  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      to.style.transform = '';
      from.style.transform = '';
      from.classList.add(forward ? 'bp-tab-from-left' : 'bp-tab-from-right');
      to.classList.add(forward ? 'bp-tab-to-from-right' : 'bp-tab-to-from-left');
      to.addEventListener('animationend', onEnd);
      setTimeout(clean, 220);
    });
  });
}

document.querySelectorAll('.nav-item').forEach(btn => {
 btn.addEventListener('click', function(ev) {
  // ET4.7: ao mudar de aba, matar tooltip do gráfico (não rouba toques)
  try {
    if (typeof bpHideChartTooltip === 'function') bpHideChartTooltip();
  } catch (_) {}
  const tab = this.dataset.tab;
  if (this.dataset.role) {
   const permitido = this.dataset.role.split(',').map(r => r.trim()).includes(normalizarRole(state.config.userRole));
   if (!permitido) {
    toast('Não tens acesso a esta área.', 'warning');
    return;
   }
  }
  var prevTab = (typeof activeTab !== 'undefined') ? activeTab : null;
  if (prevTab === tab) return;
  activeTab = tab;
  localStorage.setItem('bp_active_tab', tab);
  bpSwitchTabPane(prevTab, tab);
  if (tab !== 'dashboard') {
    try { if (typeof bpHideChartTooltip === 'function') bpHideChartTooltip(); } catch (_) {}
    try { if (typeof fecharChartDrill === 'function') fecharChartDrill(); } catch (_) {}
  }
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  this.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.setAttribute('aria-selected', 'false'));
  this.setAttribute('aria-selected', 'true');
  if (tab === 'agenda') renderAgendaFull();
  if (tab === 'clientes') renderClientes();
  if (tab === 'caixa') renderCaixa();
  if (tab === 'dashboard') {
    renderDashboard();
    if (typeof renderizarGrafico === 'function') {
      setTimeout(function () { renderizarGrafico(); }, 40);
      setTimeout(function () { renderizarGrafico(); }, 200);
    }
  }
  if (tab === 'equipa') { renderProfissionais(); renderServicos(); }
  if (tab === 'ia') {
   if (typeof actualizarContadorIA === 'function') actualizarContadorIA();
   if (typeof renderPlanoInfo === 'function') renderPlanoInfo();
   if (typeof atualizarIAOffline === 'function') atualizarIAOffline();
   if (typeof renderIAResumo === 'function') renderIAResumo();
   if (typeof carregarHistoricoIA === 'function') carregarHistoricoIA();
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
  try { if (typeof bpHideChartTooltip === 'function') bpHideChartTooltip(); } catch (_) {}
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
  // Cache local: evita flash operador após ausência/reload antes do profile chegar
  try {
    const cached = localStorage.getItem('bp_user_role');
    if (cached && RBAC_ROLES.includes(cached)) return cached;
  } catch (_) {}
  if (role) console.warn('[RBAC] role desconhecido ("' + role + '") — acesso mínimo operador.');
  return 'operador';
}

/**
 * ET4-P0-03 — autorização operacional (não só DOM).
 * bpPode('admin') | bpPode(['admin','gerente'])
 * Fail-safe: role desconhecida → operador (acesso mínimo).
 */
function bpPode(rolesPermitidos) {
  const role = normalizarRole(
    (typeof state !== 'undefined' && state.config && state.config.userRole)
      ? state.config.userRole
      : null
  );
  let allowed = rolesPermitidos;
  if (allowed == null) return true;
  if (typeof allowed === 'string') {
    allowed = allowed.split(',').map(function (r) { return r.trim(); }).filter(Boolean);
  }
  if (!Array.isArray(allowed) || allowed.length === 0) return true;
  return allowed.indexOf(role) !== -1;
}

function bpExigirRole(rolesPermitidos, mensagem) {
  if (bpPode(rolesPermitidos)) return true;
  if (typeof toast === 'function') {
    toast(mensagem || 'Não tem permissão para esta operação.', 'error');
  }
  return false;
}

if (typeof window !== 'undefined') {
  window.bpPode = bpPode;
  window.bpExigirRole = bpExigirRole;
}

function aplicarPermissoes() {
  const role = normalizarRole(state.config.userRole);
  state.config.userRole = role;
  try {
    if (role && RBAC_ROLES.includes(role)) localStorage.setItem('bp_user_role', role);
  } catch (_) {}

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
    toast('Não tens acesso a esta área.', 'warning');
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
  var dd = document.getElementById('menu-dropdown');
  if (dd) dd.style.display = 'none';
  logoutVoluntarioEmCurso = true;
  const confirmed = await showConfirmModal('Sair da conta?', 'Vais terminar a sessão neste dispositivo. Os dados do salão continuam guardados; basta iniciares sessão outra vez para continuares.', false, { confirmLabel: 'Sair', cancelLabel: 'Cancelar', variant: 'quiet', confirmTone: 'danger' });
  if (!confirmed) {
    logoutVoluntarioEmCurso = false;
    return;
  }
  // ET4.3: limpar flags de init BP* antes do reload (troca de conta / permissões)
  try {
    ['__bpFinanceInitDone','__bpOpsInitDone','__bpGestaoInitDone','__bpEquipaInitDone','__bpMarketingInitDone','__bpMediaInitDone'].forEach(function (k) {
      try { delete window[k]; } catch (_) { window[k] = false; }
    });
  } catch (_) {}
  if (typeof bpClearSessionLocal === 'function') bpClearSessionLocal();
  try { localStorage.removeItem('bp_user_role'); } catch (_) {}
  try { await supabaseClient.auth.signOut(); } catch (_) {}
  location.reload();
});

document.getElementById('nova-venda-hero-btn').addEventListener('click', openVendaModal);

document.getElementById('fab-agendar').addEventListener('click', () => {
  const sel = document.getElementById('agenda-cliente');
  var _cliAct = typeof bpClientesActivos === 'function' ? bpClientesActivos() : (state.clientes || []).filter(function (c) {
    return c && c.nome && c.ativo !== false && c.ativo !== 0 && c.ativo !== 'false';
  });
  sel.innerHTML = '<option value="">Seleccionar cliente</option>' + _cliAct.map(function (c) {
    return '<option value="' + escHtml(c.nome) + '">' + escHtml(c.nome) + '</option>';
  }).join('');
  populateAgendaSelects();
  const now = new Date();
  const isoNow = now.toISOString().slice(0, 16);
  const dtInput = document.getElementById('agenda-datetime');
  dtInput.value = isoNow;
  dtInput.min = isoNow;
  const editEl = document.getElementById('agenda-edit-id');
  if (editEl) editEl.value = '';
  const title = document.getElementById('agenda-title');
  if (title) title.textContent = 'Novo Agendamento';
  const saveBtn = document.getElementById('modal-agenda-save');
  if (saveBtn) saveBtn.textContent = 'Agendar';
  openModal('modal-agenda');
});

// CORREÇÃO: modal-agenda-save separa ID e nome do profissional
document.getElementById('modal-agenda-save').addEventListener('click', async () => {
  const editId = (document.getElementById('agenda-edit-id') || {}).value || '';
  const cliente = (document.getElementById('agenda-cliente') || {}).value || '';
  const servico = (document.getElementById('agenda-servico') || {}).value || '';
  const profissionalId = (document.getElementById('agenda-profissional') || {}).value || '';
  const datetime = (document.getElementById('agenda-datetime') || {}).value || '';
  const preco = parseFloat((document.getElementById('agenda-preco') || {}).value);
  // R37–R40 — uma pendência de cada vez
  if (!cliente) {
    if (typeof bpNotifyFormError === 'function') bpNotifyFormError('Selecione um cliente para continuar.', 'agenda-cliente');
    else toast('Selecione um cliente para continuar.', 'warning');
    return;
  }
  var cliObj = (state.clientes || []).find(function (c) { return c && c.nome === cliente; });
  if (!cliObj || cliObj.ativo === false || cliObj.ativo === 0 || cliObj.ativo === 'false') {
    if (typeof bpNotifyFormError === 'function') bpNotifyFormError('Este cliente não está activo. Escolha outro cliente para continuar.', 'agenda-cliente');
    else toast('Este cliente não está activo. Escolha outro cliente para continuar.', 'warning');
    return;
  }
  if (!servico || servico === 'Outro') {
    if (typeof bpNotifyFormError === 'function') bpNotifyFormError('Seleccione um serviço do catálogo.', 'agenda-servico');
    else toast('Seleccione um serviço do catálogo.', 'warning');
    return;
  }
  if (!datetime || !datetime.includes('T')) {
    if (typeof bpNotifyFormError === 'function') bpNotifyFormError('Indique a data e a hora do atendimento.', 'agenda-datetime');
    else toast('Indique a data e a hora do atendimento.', 'warning');
    return;
  }
  if (!profissionalId) {
    if (typeof bpNotifyFormError === 'function') bpNotifyFormError('Seleccione um profissional.', 'agenda-profissional');
    else toast('Seleccione um profissional.', 'warning');
    return;
  }
  if (isNaN(preco) || preco <= 0) {
    if (typeof bpNotifyFormError === 'function') bpNotifyFormError('Informe um preço válido superior a zero.', 'agenda-preco');
    else toast('Informe um preço válido superior a zero.', 'warning');
    return;
  }
  const data = datetime.split('T')[0];
  const hora = datetime.split('T')[1].slice(0, 5);
  const profObj = (state.profissionais || []).find(p => p.id === profissionalId);
  if (!profObj || (typeof isProfissionalAtivo === 'function' ? !isProfissionalAtivo(profObj) : profObj.ativo === false)) {
    toast('Seleccione um profissional activo.', 'warning');
    return;
  }
  // R41 — compatibilidade serviço/profissional
  const servObj = (state.servicos || []).find(s => s && s.nome === servico);
  if (!servObj || (typeof isServicoAtivo === 'function' ? !isServicoAtivo(servObj) : servObj.ativo === false)) {
    toast('Seleccione um serviço disponível.', 'warning');
    return;
  }
  const listaP = Array.isArray(servObj.profissionais) ? servObj.profissionais : [];
  if (!listaP.length) {
    toast('Este serviço não possui um profissional disponível. Associe um profissional ao serviço antes de continuar.', 'warning');
    return;
  }
  const hab = listaP.some(function (ref) {
    var r = String(ref || '');
    return r === String(profObj.id) || r === String(profObj.nome || '');
  });
  if (!hab) {
    toast('Este profissional não está habilitado para o serviço selecionado. Escolha um profissional disponível para este serviço.', 'warning');
    return;
  }
  const profissionalNome = profObj.nome || '';
  let clienteId = null;
  if (typeof resolverClienteIdPorNome === 'function') clienteId = resolverClienteIdPorNome(cliente);
  else {
    const hit = (state.clientes || []).find(c => c.nome === cliente);
    if (hit) clienteId = hit.id;
  }
  const payload = {
    cliente,
    cliente_id: clienteId,
    servico,
    profissional: profissionalNome,
    profissional_id: profissionalId,
    data,
    hora,
    preco
  };
  let result;
  if (editId) {
    result = await updateAgendamento(editId, payload);
    if (result) {
      toast('Agendamento actualizado.', 'success');
      closeModal('modal-agenda');
      document.getElementById('agenda-edit-id').value = '';
    }
  } else {
    result = await addAgendamento(payload);
    if (result) closeModal('modal-agenda');
  }
});

/** Abre o modal de agenda em modo edição / reagendar */
function abrirReagendarAgendamento(id) {
  const ag = (state.agendamentos || []).find(a => a.id === id);
  if (!ag) return;
  const st = String(ag.status || 'agendado').toLowerCase();
  if (st !== 'agendado') {
    toast('Só é possível reagendar marcações activas.', 'warning');
    return;
  }
  populateAgendaSelects();
  const title = document.getElementById('agenda-title');
  if (title) title.textContent = 'Reagendar';
  const editEl = document.getElementById('agenda-edit-id');
  if (editEl) editEl.value = id;
  const cli = document.getElementById('agenda-cliente');
  const srv = document.getElementById('agenda-servico');
  const prof = document.getElementById('agenda-profissional');
  const dt = document.getElementById('agenda-datetime');
  const preco = document.getElementById('agenda-preco');
  if (cli) cli.value = ag.cliente || '';
  if (srv) srv.value = ag.servico || '';
  if (prof) prof.value = ag.profissional_id || '';
  if (preco) preco.value = ag.preco != null ? ag.preco : '';
  if (dt) {
    const h = String(ag.hora || '00:00').slice(0, 5);
    dt.value = (ag.data || '') + 'T' + h;
    const now = new Date();
    dt.min = now.toISOString().slice(0, 16);
  }
  const saveBtn = document.getElementById('modal-agenda-save');
  if (saveBtn) saveBtn.textContent = 'Guardar alterações';
  openModal('modal-agenda');
}
window.abrirReagendarAgendamento = abrirReagendarAgendamento;


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
  if (!nome) {
    if (typeof bpNotifyFormError === 'function') bpNotifyFormError('Introduza o nome do cliente para continuar.', 'cliente-rapido-nome');
    else toast('Introduza o nome do cliente para continuar.', 'warning');
    return;
  }
  var telR = typeof bpValidarTelefoneCliente === 'function'
    ? bpValidarTelefoneCliente(telefone)
    : { ok: false, message: 'Informe um número de telefone válido com 9 dígitos e iniciado por 9.' };
  if (!telR.ok) {
    if (typeof bpNotifyFormError === 'function') bpNotifyFormError(telR.message, 'cliente-rapido-telefone');
    else toast(telR.message, 'warning');
    return;
  }
  const result = await addCliente({ nome, telefone: telR.telefone, notas: '' });
  if (result) {
    try {
      if (window.BPMedia && BPMedia.takePendingClienteFoto) {
        var fQ = BPMedia.takePendingClienteFoto();
        if (fQ && BPMedia.setClienteFoto) await BPMedia.setClienteFoto(result.id, fQ);
      }
    } catch (_) {}
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


function setClienteModalMode(mode) {
  // mode: 'view' | 'edit'
  const modal = document.getElementById('modal-cliente');
  const sheet = document.getElementById('modal-cliente-sheet');
  const view = document.getElementById('cliente-view-panel');
  const form = document.getElementById('cliente-form-panel');
  if (modal) modal.setAttribute('data-mode', mode);
  if (sheet) {
    sheet.classList.toggle('modal-sheet--view', mode === 'view');
  }
  if (view) {
    view.hidden = mode !== 'view';
    try { view.style.display = mode === 'view' ? '' : 'none'; } catch (_) {}
  }
  if (form) {
    form.hidden = mode !== 'edit';
    try { form.style.display = mode === 'edit' ? '' : 'none'; } catch (_) {}
  }
  ['cliente-nome', 'cliente-telefone', 'cliente-notas'].forEach(function (fid) {
    const el = document.getElementById(fid);
    if (el) {
      el.readOnly = false;
      el.disabled = false;
      el.style.opacity = '';
    }
  });
}

function openEditCliente(id) {
  const c = state.clientes.find(c => c.id === id);
  if (!c) return;
  editClienteId = id;
  setClienteModalMode('edit');
  document.getElementById('cliente-modal-title').textContent = 'Editar cliente';
  document.getElementById('cliente-nome').value = c.nome || '';
  document.getElementById('cliente-telefone').value = c.telefone || '';
  document.getElementById('cliente-notas').value = c.notas || '';
  document.getElementById('cliente-id').value = id;
  openModal('modal-cliente');
}

document.getElementById('add-cliente-btn').addEventListener('click', () => {
  editClienteId = null;
  setClienteModalMode('edit');
  document.getElementById('cliente-modal-title').textContent = 'Novo cliente';
  ['cliente-nome', 'cliente-telefone', 'cliente-notas', 'cliente-id'].forEach(function (id) {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  try {
    if (window.BPMedia && typeof BPMedia.clearPendingClienteFoto === 'function') BPMedia.clearPendingClienteFoto();
  } catch (_) {}
  openModal('modal-cliente');
});

document.getElementById('modal-cliente-save').addEventListener('click', async () => {
  const nome = document.getElementById('cliente-nome').value.trim();
  let telefone = document.getElementById('cliente-telefone').value.trim();
  const notas = document.getElementById('cliente-notas').value.trim();
  const id = document.getElementById('cliente-id').value;
  if (!nome) {
    if (typeof bpNotifyFormError === 'function') bpNotifyFormError('Introduza o nome do cliente para continuar.', 'cliente-nome');
    else toast('Introduza o nome do cliente para continuar.', 'warning');
    return;
  }
  var telChk = typeof bpValidarTelefoneCliente === 'function'
    ? bpValidarTelefoneCliente(telefone)
    : { ok: false, message: 'Informe um número de telefone válido com 9 dígitos e iniciado por 9.' };
  if (!telChk.ok) {
    if (typeof bpNotifyFormError === 'function') bpNotifyFormError(telChk.message, 'cliente-telefone');
    else toast(telChk.message, 'warning');
    return;
  }
  telefone = telChk.telefone;
  if (id) {
    // ET4.3: só toast/fecha se a actualização efectivamente ocorreu
    const upd = await updateCliente(id, { nome, telefone, notas });
    if (upd) {
      toast('Cliente actualizado.', 'success');
      closeModal('modal-cliente');
    }
  } else { 
    const result = await addCliente({ nome, telefone, notas });
    if (result) {
      try {
        var fotoC = null;
        if (window.BPMedia && typeof BPMedia.takePendingClienteFoto === 'function') {
          fotoC = BPMedia.takePendingClienteFoto();
        }
        if (fotoC && typeof BPMedia.setClienteFoto === 'function') {
          await BPMedia.setClienteFoto(result.id, fotoC);
          if (typeof BPMedia.patchRowAvatar === 'function') BPMedia.patchRowAvatar('clientes', result.id);
          if (typeof BPMedia.enhanceListAvatars === 'function') BPMedia.enhanceListAvatars();
          if (typeof renderClientes === 'function') renderClientes();
        }
      } catch (eFoto) { console.warn('[cli foto save]', eFoto); }
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
  // Só serviços activos e com nome — nunca lixo / eliminados / inactivos
  const servicos = (state.servicos || [])
    .filter(function (s) {
      if (!s || !s.nome) return false;
      if (typeof isServicoAtivo === 'function') return isServicoAtivo(s);
      return s.ativo !== false && s.ativo !== 0 && s.ativo !== 'false';
    })
    .slice()
    .sort(function (a, b) { return String(a.nome).localeCompare(String(b.nome), 'pt'); });
  let html = '<option value="">Seleccionar serviço / especialidade</option>';
  html += '<option value="__criar">+ Criar novo serviço</option>';
  servicos.forEach(function (s) {
    html += '<option value="' + escHtml(s.nome) + '">' + escHtml(s.nome) + '</option>';
  });
  sel.innerHTML = html;
  const box = document.getElementById('prof-criar-servico-box');
  if (selected && selected !== '__criar') {
    // Se o serviço antigo já não existe na lista activa, ainda assim mostrar valor
    const exists = servicos.some(function (s) { return s.nome === selected; });
    if (!exists && selected) {
      sel.innerHTML = html + '<option value="' + escHtml(selected) + '">' + escHtml(selected) + ' (legado)</option>';
    }
    sel.value = selected;
    if (box) box.style.display = 'none';
  } else if (selected === '__criar') {
    sel.value = '__criar';
    if (box) box.style.display = 'block';
  } else {
    if (box) box.style.display = 'none';
  }
}

function bpToggleCriarServicoBox() {
  const sel = document.getElementById('prof-esp');
  const box = document.getElementById('prof-criar-servico-box');
  if (!sel || !box) return;
  const criar = sel.value === '__criar';
  box.style.display = criar ? 'block' : 'none';
  if (criar) {
    const nomeEl = document.getElementById('prof-novo-servico-nome');
    if (nomeEl) setTimeout(function () { try { nomeEl.focus(); } catch (_) {} }, 50);
  }
}

async function bpCriarServicoDesdeProfModal() {
  const nome = ((document.getElementById('prof-novo-servico-nome') || {}).value || '').trim();
  const preco = parseFloat((document.getElementById('prof-novo-servico-preco') || {}).value);
  if (!nome) {
    toast('Indica o nome do novo serviço.', 'warning');
    return null;
  }
  if (!preco || preco <= 0) {
    toast('Indica um preço válido.', 'warning');
    return null;
  }
  if (typeof existeNomeDuplicado === 'function' && existeNomeDuplicado('servicos', nome)) {
    toast('Já existe um serviço com este nome. Seleccione-o na lista.', 'warning');
    popularEspecialidadesProf(nome);
    return nome;
  }
  const draftProf = ((document.getElementById('prof-nome') || {}).value || '').trim();
  if (!draftProf) {
    toast('Preenche o nome do profissional antes de criar o serviço.', 'warning');
    return null;
  }
  const payload = {
    nome: nome,
    precoBase: preco,
    profissionais: [draftProf],
    ativo: true,
    duracao: 60,
    updated_at: new Date().toISOString()
  };
  let created = null;
  if (typeof addServico === 'function') {
    created = await addServico(payload, { pendingNomes: [draftProf] });
  }
  if (!created) return null;
  // Associar nome ao select e fechar box
  popularEspecialidadesProf(nome);
  const box = document.getElementById('prof-criar-servico-box');
  if (box) box.style.display = 'none';
  const nomeEl = document.getElementById('prof-novo-servico-nome');
  const precoEl = document.getElementById('prof-novo-servico-preco');
  if (nomeEl) nomeEl.value = '';
  if (precoEl) precoEl.value = '';
  toast('Serviço «' + nome + '» adicionado. Pode ajustá-lo depois na aba Serviços.', 'success');
  if (typeof renderServicos === 'function') {
    try { renderServicos(); } catch (_) {}
  }
  return nome;
}


document.getElementById('prof-esp')?.addEventListener('change', bpToggleCriarServicoBox);
document.getElementById('prof-criar-servico-btn')?.addEventListener('click', async function (e) {
  e.preventDefault();
  await bpCriarServicoDesdeProfModal();
});

function setProfModalMode(mode) {
  const modal = document.getElementById('modal-prof');
  const sheet = document.getElementById('modal-prof-sheet');
  const view = document.getElementById('prof-view-panel');
  const form = document.getElementById('prof-form-panel');
  if (modal) modal.setAttribute('data-mode', mode);
  if (sheet) sheet.classList.toggle('modal-sheet--view', mode === 'view');
  if (view) {
    view.hidden = mode !== 'view';
    try { view.style.display = mode === 'view' ? '' : 'none'; } catch (_) {}
  }
  if (form) {
    form.hidden = mode !== 'edit';
    try { form.style.display = mode === 'edit' ? '' : 'none'; } catch (_) {}
  }
  ['prof-nome','prof-idade','prof-data-contratual','prof-bi','prof-morada','prof-contacto','prof-esp','prof-taxa','prof-meta'].forEach(function (fid) {
    const el = document.getElementById(fid);
    if (el) {
      el.disabled = false;
      el.readOnly = false;
      el.style.opacity = '';
    }
  });
}

function _receitaProfissionalMes(profId) {
  const mes = (typeof hoje === 'function' ? hoje() : '').slice(0, 7);
  if (!mes || !profId) return 0;
  return (state.movimentos || []).filter(function (m) {
    return m.tipo === 'venda' && String(m.profissional_id) === String(profId) && String(m.data || '').startsWith(mes);
  }).reduce(function (s, m) { return s + (Number(m.valor) || 0); }, 0);
}


function bpFotoSrcEntidade(ent) {
  if (!ent) return null;
  if (window.BPMedia && typeof BPMedia.resolveFotoSrc === 'function') {
    var r = BPMedia.resolveFotoSrc(ent);
    if (r) return r;
  }
  if (ent.foto && String(ent.foto).indexOf('data:') === 0) return ent.foto;
  if (ent.foto_url) return ent.foto_url;
  if (ent.foto) return ent.foto;
  return null;
}
function bpViewHeroAvatarHtml(ent, fallbackChar) {
  var src = bpFotoSrcEntidade(ent);
  if (src) {
    var safe = String(src)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;');
    return '<div class="bp-view-hero-av bp-view-hero-av--img"><img src="' + safe + '" alt="" loading="lazy" decoding="async"></div>';
  }
  return '<div class="bp-view-hero-av">' + escHtml(fallbackChar || '?') + '</div>';
}

function openEditProf(id) {
  const p = state.profissionais.find(x => x.id === id);
  if (!p) return;
  editProfId = id;
  setProfModalMode('edit');
  document.getElementById('prof-modal-title').textContent = 'Editar profissional';
  document.getElementById('prof-nome').value = p.nome || '';
  document.getElementById('prof-idade').value = p.idade || '';
  const dataEl = document.getElementById('prof-data-contratual');
  if (dataEl) dataEl.value = p.dataContratual || p.dataNascimento || '';
  document.getElementById('prof-bi').value = p.numeroBI || '';
  document.getElementById('prof-morada').value = p.morada || '';
  document.getElementById('prof-contacto').value = p.contacto || '';
  const taxaEl = document.getElementById('prof-taxa');
  if (taxaEl) taxaEl.value = p.taxa_comissao != null ? p.taxa_comissao : (p.taxa || 0);
  const metaEl = document.getElementById('prof-meta');
  if (metaEl) metaEl.value = p.meta_mensal != null ? p.meta_mensal : (p.meta || '');
  popularEspecialidadesProf(p.especialidade || '');
  document.getElementById('prof-id').value = id;
  openModal('modal-prof');
}


/** Botões contacto com identidade visual (WhatsApp / Ligar) — ponto 6 */
function bpBtnWhatsAppHtml(href, label) {
  label = label || 'WhatsApp';
  var icon = '<svg class="bp-ic-wa" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17.47 14.3c-.28-.14-1.64-.81-1.9-.9-.25-.1-.44-.14-.62.14-.18.28-.71.9-.87 1.08-.16.18-.32.2-.6.07-.28-.14-1.17-.43-2.23-1.37-.82-.73-1.38-1.64-1.54-1.92-.16-.28-.02-.43.12-.57.13-.13.28-.32.42-.48.14-.16.18-.28.28-.46.09-.18.05-.35-.02-.49-.07-.14-.62-1.49-.85-2.04-.22-.53-.45-.46-.62-.47h-.53c-.18 0-.47.07-.71.35-.25.28-.93.91-.93 2.22s.96 2.58 1.09 2.76c.14.18 1.88 2.87 4.56 4.02 1.7.73 2.15.8 2.92.67.45-.08 1.64-.67 1.87-1.32.23-.65.23-1.2.16-1.32-.07-.11-.25-.18-.53-.32z"/><path fill="currentColor" d="M12.04 2C6.5 2 2.01 6.49 2.01 12.03c0 1.85.5 3.57 1.37 5.07L2 22l5.04-1.32A9.96 9.96 0 0 0 12.04 22C17.57 22 22 17.52 22 11.99 22 6.49 17.57 2 12.04 2zm0 18.15c-1.67 0-3.22-.48-4.54-1.32l-.33-.19-3.08.81.82-3-.21-.35a7.94 7.94 0 0 1-1.3-4.38c0-4.4 3.58-7.98 7.99-7.98 4.4 0 7.98 3.58 7.98 7.98 0 4.4-3.58 7.98-7.98 7.98z"/></svg>';
  return '<a class="btn btn-sm bp-btn-whatsapp" href="' + href + '" target="_blank" rel="noopener noreferrer">' + icon + '<span>' + label + '</span></a>';
}
function bpBtnLigarHtml(href, label) {
  label = label || 'Ligar';
  var icon = '<svg class="bp-ic-call" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>';
  return '<a class="btn btn-sm bp-btn-call" href="' + href + '">' + icon + '<span>' + label + '</span></a>';
}
if (typeof window !== 'undefined') {
  window.bpBtnWhatsAppHtml = bpBtnWhatsAppHtml;
  window.bpBtnLigarHtml = bpBtnLigarHtml;
}

/** Placeholder animado (typewriter + rotação) — ponto 4 */
var _bpPhTimers = {};
function bpPrefersReducedMotion() {
  try {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (_) { return false; }
}
function bpStartPlaceholderRotation(inputId, phrases) {
  var el = document.getElementById(inputId);
  if (!el || !phrases || !phrases.length) return;
  if (el.dataset.bpPhBound === '1') return;
  el.dataset.bpPhBound = '1';
  /* Acessibilidade: sem animação, placeholder estático da 1.ª frase */
  if (bpPrefersReducedMotion()) {
    el.setAttribute('placeholder', phrases[0]);
    return;
  }
  var idx = 0;
  var char = 0;
  var phase = 'type'; // type | hold | erase
  var current = phrases[0];
  function tick() {
    if (!document.body.contains(el)) {
      try { clearTimeout(_bpPhTimers[inputId]); } catch (_) {}
      return;
    }
    if (document.activeElement === el || (el.value && String(el.value).length)) {
      _bpPhTimers[inputId] = setTimeout(tick, 830);
      return;
    }
    if (phase === 'type') {
      char++;
      el.setAttribute('placeholder', current.slice(0, char));
      if (char >= current.length) {
        phase = 'hold';
        _bpPhTimers[inputId] = setTimeout(tick, 2660);
        return;
      }
      _bpPhTimers[inputId] = setTimeout(tick, 70);
      return;
    }
    if (phase === 'hold') {
      phase = 'erase';
      _bpPhTimers[inputId] = setTimeout(tick, 30);
      return;
    }
    // erase
    char--;
    if (char <= 0) {
      char = 0;
      el.setAttribute('placeholder', '');
      idx = (idx + 1) % phrases.length;
      current = phrases[idx];
      phase = 'type';
      _bpPhTimers[inputId] = setTimeout(tick, 630);
      return;
    }
    el.setAttribute('placeholder', current.slice(0, char));
    _bpPhTimers[inputId] = setTimeout(tick, 47);
  }
  _bpPhTimers[inputId] = setTimeout(tick, 1000);
}
function bpInitPlaceholderRotations() {
  bpStartPlaceholderRotation('search-cliente', [
    'Nome ou telefone...',
    'Localizar cliente...',
    'Pesquisar na lista...',
    'Nome do cliente...'
  ]);
  bpStartPlaceholderRotation('caixa-localizar-input', [
    'Nome do cliente...',
    'Localizar no histórico...',
    'Pesquisar venda por cliente...'
  ]);
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { setTimeout(bpInitPlaceholderRotations, 400); });
} else {
  setTimeout(bpInitPlaceholderRotations, 400);
}

function abrirDetalheProfView(id) {
  const p = state.profissionais.find(x => x.id === id);
  if (!p) return;
  editProfId = id;
  setProfModalMode('view');
  document.getElementById('prof-modal-title').textContent = 'Ficha do profissional';
  document.getElementById('prof-id').value = id;

  const receita = _receitaProfissionalMes(p.id);
  const meta = Number(p.meta_mensal != null ? p.meta_mensal : p.meta) || 0;
  const taxa = Number(p.taxa_comissao != null ? p.taxa_comissao : p.taxa) || 0;
  const digits = String(p.contacto || '').replace(/\D/g, '');
  let contactActions = '';
  if (digits.length === 9) {
    const wa = '244' + digits;
    const msg = encodeURIComponent('Olá ' + (p.nome || '') + ',');
    contactActions =
      '<div class="bp-view-contact-actions">' +
      bpBtnWhatsAppHtml('https://wa.me/' + wa + '?text=' + msg) +
      bpBtnLigarHtml('tel:+244' + digits) +
      '</div>';
  }

  let metaHtml = '';
  if (meta > 0) {
    const pct = Math.min(100, Math.round((receita / meta) * 100));
    metaHtml =
      '<div class="bp-view-section-title">Desempenho este mês</div>' +
      '<div class="bp-view-dl">' +
      '<div class="bp-view-row"><span class="bp-view-label">Receita</span><span class="bp-view-value">' + fmtKz(receita) + '</span></div>' +
      '<div class="bp-view-row"><span class="bp-view-label">Meta</span><span class="bp-view-value">' + fmtKz(meta) + ' · ' + pct + '%</span></div>' +
      '</div>';
  } else if (receita > 0) {
    metaHtml =
      '<div class="bp-view-section-title">Desempenho este mês</div>' +
      '<div class="bp-view-dl">' +
      '<div class="bp-view-row"><span class="bp-view-label">Receita</span><span class="bp-view-value">' + fmtKz(receita) + '</span></div>' +
      '</div>';
  }

  const body = document.getElementById('prof-view-body');
  if (body) {
    body.innerHTML =
      '<div class="bp-view-hero">' +
      bpViewHeroAvatarHtml(p, (p.nome || '?').charAt(0).toUpperCase()) +
      '<div><div class="bp-view-hero-name">' + escHtml(p.nome || 'Profissional') + '</div>' +
      '<div class="bp-view-hero-meta">' + escHtml(p.especialidade || 'Sem especialidade') + '</div></div></div>' +
      contactActions +
      '<div class="bp-view-dl">' +
      '<div class="bp-view-row"><span class="bp-view-label">Nome</span><span class="bp-view-value">' + escHtml(p.nome || '—') + '</span></div>' +
      '<div class="bp-view-row"><span class="bp-view-label">Especialidade</span><span class="bp-view-value">' + escHtml(p.especialidade || '—') + '</span></div>' +
      '<div class="bp-view-row"><span class="bp-view-label">Contacto</span><span class="bp-view-value">' + (digits ? escHtml(digits) : '—') + '</span></div>' +
      '<div class="bp-view-row"><span class="bp-view-label">Comissão</span><span class="bp-view-value">' + taxa + '%</span></div>' +
      (p.idade ? '<div class="bp-view-row"><span class="bp-view-label">Idade</span><span class="bp-view-value">' + escHtml(String(p.idade)) + ' anos</span></div>' : '') +
      (p.dataContratual || p.dataNascimento ? '<div class="bp-view-row"><span class="bp-view-label">Contrato</span><span class="bp-view-value">' + escHtml(p.dataContratual || p.dataNascimento) + '</span></div>' : '') +
      (p.morada ? '<div class="bp-view-row"><span class="bp-view-label">Morada</span><span class="bp-view-value">' + escHtml(p.morada) + '</span></div>' : '') +
      (p.numeroBI ? '<div class="bp-view-row"><span class="bp-view-label">BI</span><span class="bp-view-value">' + escHtml(p.numeroBI) + '</span></div>' : '') +
      '</div>' + metaHtml;
  }
  openModal('modal-prof');
}

document.getElementById('add-prof-btn')?.addEventListener('click', () => {
  editProfId = null;
  setProfModalMode('edit');
  document.getElementById('prof-modal-title').textContent = 'Novo profissional';
  ['prof-nome', 'prof-idade', 'prof-data-contratual', 'prof-bi', 'prof-morada', 'prof-contacto', 'prof-id', 'prof-taxa', 'prof-meta'].forEach(fid => {
    const el = document.getElementById(fid);
    if (el) el.value = '';
  });
  popularEspecialidadesProf('');
  try {
    var esp = document.getElementById('prof-esp');
    if (esp) esp.value = '';
    var box = document.getElementById('prof-criar-servico-box');
    if (box) box.style.display = 'none';
  } catch (_) {}
  try {
    if (window.BPMedia && typeof BPMedia.clearPendingProfFoto === 'function') BPMedia.clearPendingProfFoto();
  } catch (_) {}
  openModal('modal-prof');
});


/** Data contratual: obrigatória; aceita AAAA-MM-DD ou DD/MM/AAAA; devolve ISO. */
function bpValidarDataContratual(raw) {
  var s = String(raw == null ? '' : raw).trim();
  if (!s) {
    return {
      ok: false,
      message: 'A data contratual é obrigatória. Introduza a data no formato AAAA-MM-DD (ex: 2024-03-15) ou DD/MM/AAAA (ex: 15/03/2024).'
    };
  }
  var y, m, d;
  var iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  var br = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (iso) {
    y = parseInt(iso[1], 10);
    m = parseInt(iso[2], 10);
    d = parseInt(iso[3], 10);
  } else if (br) {
    d = parseInt(br[1], 10);
    m = parseInt(br[2], 10);
    y = parseInt(br[3], 10);
  } else {
    return {
      ok: false,
      message: 'Data contratual inválida. Use AAAA-MM-DD (ex: 2024-03-15) ou DD/MM/AAAA (ex: 15/03/2024).'
    };
  }
  if (y < 1950 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) {
    return {
      ok: false,
      message: 'Data contratual impossível. Verifique o dia, o mês e o ano (entre 1950 e 2100).'
    };
  }
  var dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) {
    return {
      ok: false,
      message: 'Data contratual inválida. Essa combinação de dia, mês e ano não existe no calendário.'
    };
  }
  var value = y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0');
  return { ok: true, value: value };
}
if (typeof window !== 'undefined') window.bpValidarDataContratual = bpValidarDataContratual;

document.getElementById('modal-prof-save')?.addEventListener('click', async () => {
  var saveBtn = document.getElementById('modal-prof-save');
  if (saveBtn && saveBtn.dataset.bpSaving === '1') return;
  if (saveBtn) {
    saveBtn.dataset.bpSaving = '1';
    try { saveBtn.disabled = true; } catch (_) {}
  }
  try {
  const nome = (document.getElementById('prof-nome')?.value || '').trim();
  const idade = document.getElementById('prof-idade')?.value;
  let dataContratual = (document.getElementById('prof-data-contratual')?.value || '').trim();
  let espSelect = document.getElementById('prof-esp')?.value || '';
  let especialidade = espSelect === '__criar' ? '' : espSelect;
  const numeroBI = (document.getElementById('prof-bi')?.value || '').trim().toUpperCase();
  const morada = (document.getElementById('prof-morada')?.value || '').trim();
  const contacto = (document.getElementById('prof-contacto')?.value || '').replace(/\D/g, '');
  const id = document.getElementById('prof-id')?.value;
  const taxa = parseFloat(document.getElementById('prof-taxa')?.value);
  const meta = parseFloat(document.getElementById('prof-meta')?.value);

  if (!nome) {
    if (typeof bpNotifyFormError === 'function') bpNotifyFormError('Introduza o nome do profissional para continuar.', 'prof-nome');
    else toast('Introduza o nome do profissional para continuar.', 'warning');
    return;
  }
  if (!idade || isNaN(parseInt(idade, 10))) {
    if (typeof bpNotifyFormError === 'function') bpNotifyFormError('A idade é obrigatória. Indique a idade do profissional para continuar.', 'prof-idade', 'warning');
    else toast('A idade é obrigatória. Indique a idade do profissional para continuar.', 'warning');
    return;
  }
  var idadeN = parseInt(idade, 10);
  if (idadeN < 16 || idadeN > 99) {
    if (typeof bpNotifyFormError === 'function') bpNotifyFormError('Indique uma idade válida entre 16 e 99 anos.', 'prof-idade', 'warning');
    else toast('Idade inválida (16 a 99).', 'warning');
    return;
  }
  /* Ponto 2 — data contratual: formato obrigatório + orientação */
  var dataChk = typeof bpValidarDataContratual === 'function'
    ? bpValidarDataContratual(dataContratual)
    : { ok: !!dataContratual, value: dataContratual, message: 'A data contratual é obrigatória.' };
  if (!dataChk.ok) {
    if (typeof bpNotifyFormError === 'function') bpNotifyFormError(dataChk.message, 'prof-data-contratual', 'warning');
    else toast(dataChk.message, 'warning');
    return;
  }
  dataContratual = dataChk.value;

  // Criar serviço no próprio fluxo se escolheu «Criar novo serviço»
  if (espSelect === '__criar') {
    const criado = await bpCriarServicoDesdeProfModal();
    if (!criado) return;
    especialidade = criado;
  }

  /* Ponto 1 — serviço obrigatório (anula R29 permissivo) */
  if (!especialidade || !String(especialidade).trim()) {
    if (typeof bpNotifyFormError === 'function') {
      bpNotifyFormError('Associe o profissional a um serviço (especialidade). Sem serviço não pode guardar.', 'prof-esp', 'warning');
    } else {
      toast('Associe o profissional a um serviço (especialidade).', 'warning');
    }
    return;
  }

  /* Ponto 1 — morada obrigatória */
  if (!morada) {
    if (typeof bpNotifyFormError === 'function') {
      bpNotifyFormError('A morada é obrigatória. Indique a morada do profissional para continuar.', 'prof-morada', 'warning');
    } else {
      toast('A morada é obrigatória.', 'warning');
    }
    return;
  }

  /* Ponto 1 — número/contacto obrigatório (9 dígitos) */
  if (!contacto || contacto.length !== 9) {
    if (typeof bpNotifyFormError === 'function') {
      bpNotifyFormError('O contacto é obrigatório e deve ter exactamente 9 dígitos (ex: 923456789).', 'prof-contacto', 'warning');
    } else {
      toast('Contacto obrigatório: exactamente 9 dígitos.', 'warning');
    }
    return;
  }

  /* Ponto 1 — comissão obrigatória (taxa preenchida, 0–100) */
  var taxaRaw = (document.getElementById('prof-taxa')?.value || '').trim();
  if (taxaRaw === '' || isNaN(taxa)) {
    if (typeof bpNotifyFormError === 'function') {
      bpNotifyFormError('A taxa de comissão é obrigatória. Indique um valor entre 0 e 100 (ex: 30).', 'prof-taxa', 'warning');
    } else {
      toast('A taxa de comissão é obrigatória (0 a 100).', 'warning');
    }
    return;
  }
  if (taxa < 0 || taxa > 100) {
    if (typeof bpNotifyFormError === 'function') {
      bpNotifyFormError('A taxa de comissão deve estar entre 0 e 100%.', 'prof-taxa', 'warning');
    } else {
      toast('Taxa de comissão inválida (0 a 100).', 'warning');
    }
    return;
  }

  if (numeroBI && typeof validarBI === 'function' && !validarBI(numeroBI)) {
    toast('Número do BI incompleto ou em formato inválido. Preencha correctamente ou deixe em branco.', 'error');
    return;
  }

  const dados = {
    nome,
    idade: idadeN,
    dataContratual,
    especialidade,
    numeroBI: numeroBI || '',
    morada,
    contacto: contacto,
    taxa_comissao: taxa,
    meta_mensal: isNaN(meta) ? 0 : meta
  };

  if (id) {
    const upd = await updateProfissional(id, dados);
    if (upd) {
      toast('Profissional actualizado.', 'success');
      closeModal('modal-prof');
    }
  } else {
    const result = await addProfissional(dados);
    if (result) {
      // Foto escolhida antes de guardar (criação)
      try {
        var fotoP = null;
        if (window.BPMedia && typeof BPMedia.takePendingProfFoto === 'function') {
          fotoP = BPMedia.takePendingProfFoto();
        }
        if (fotoP && typeof BPMedia.setProfFoto === 'function') {
          await BPMedia.setProfFoto(result.id, fotoP);
          if (typeof BPMedia.patchRowAvatar === 'function') BPMedia.patchRowAvatar('profissionais', result.id);
          if (typeof BPMedia.enhanceListAvatars === 'function') BPMedia.enhanceListAvatars();
          if (typeof renderProfissionais === 'function') renderProfissionais();
        }
      } catch (eFoto) { console.warn('[prof foto save]', eFoto); }
      closeModal('modal-prof');
    }
  }
  } finally {
    var saveBtn2 = document.getElementById('modal-prof-save');
    if (saveBtn2) {
      saveBtn2.dataset.bpSaving = '';
      try { saveBtn2.disabled = false; } catch (_) {}
    }
  }
});

document.getElementById('prof-view-fechar')?.addEventListener('click', () => {
  setProfModalMode('edit');
  closeModal('modal-prof');
});
document.getElementById('prof-view-editar')?.addEventListener('click', () => {
  const id = document.getElementById('prof-id')?.value || editProfId;
  if (id) openEditProf(id);
});
document.getElementById('modal-prof-cancel')?.addEventListener('click', () => {
  setProfModalMode('edit');
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
  const durRaw = parseInt(document.getElementById('servico-duracao')?.value, 10);
  const duracao = (!isNaN(durRaw) && durRaw >= 5) ? durRaw : 60;
  const id = document.getElementById('servico-id').value;
  const profissionais = typeof getSelectedProfissionais === 'function' ? getSelectedProfissionais() : [];
  if (!nome) {
    if (typeof bpNotifyFormError === 'function') bpNotifyFormError('Indique o nome do serviço para continuar.', 'servico-nome');
    else toast('Indique o nome do serviço para continuar.', 'warning');
    return;
  }
  if (isNaN(precoBase) || precoBase <= 0) {
    if (typeof bpNotifyFormError === 'function') bpNotifyFormError('Informe um preço válido superior a zero.', 'servico-preco');
    else toast('Informe um preço válido superior a zero.', 'warning');
    return;
  }
  // ET4.5: profissionais obrigatórios — proibido vazio / "toda a equipa"
  if (!profissionais || !profissionais.length) {
    if (typeof bpNotifyFormError === 'function') {
      bpNotifyFormError('Associe pelo menos um profissional a este serviço para continuar.', 'servico-profissionais-container');
    } else {
      toast('Associe pelo menos um profissional a este serviço para continuar.', 'warning');
    }
    return;
  }
  const payload = { nome, precoBase, profissionais: profissionais, duracao };
  if (id) {
    const upd = await updateServico(id, payload);
    if (!upd) return;
    toast('Serviço actualizado.', 'success');
  } else {
    const created = await addServico(payload);
    if (!created) return;
  }
  closeModal('modal-servico');
  if (typeof updateUI === 'function') updateUI();
});

document.getElementById('modal-servico-cancel')?.addEventListener('click', () => {
  if (typeof setServicoModalMode === 'function') setServicoModalMode('edit');
  closeModal('modal-servico');
});
document.getElementById('servico-view-fechar')?.addEventListener('click', () => {
  if (typeof setServicoModalMode === 'function') setServicoModalMode('edit');
  closeModal('modal-servico');
});
document.getElementById('servico-view-editar')?.addEventListener('click', () => {
  const id = document.getElementById('servico-id')?.value;
  if (id && typeof openServicoModal === 'function') openServicoModal(id);
});
document.addEventListener('click', function (e) {
  const row = e.target.closest('.list-item[data-servico-id]');
  if (!row) return;
  if (e.target.closest('.row-menu-btn') || e.target.closest('.row-menu')) return;
  const id = row.dataset.servicoId;
  if (id && typeof abrirDetalheServicoView === 'function') abrirDetalheServicoView(id);
});
// ====================================================================
//  FASE E — Ver detalhe do cliente (só visualização ao clicar na linha)
// ====================================================================
function abrirDetalheClienteView(id) {
  const c = state.clientes.find(x => x.id === id);
  if (!c) return;
  editClienteId = id;

  setClienteModalMode('view');
  document.getElementById('cliente-modal-title').textContent = 'Ficha do cliente';
  document.getElementById('cliente-id').value = id;

  const body = document.getElementById('cliente-view-body');
  if (body) {
    const digits = String(c.telefone || '').replace(/\D/g, '');
    const tel = digits || '—';
    const notas = c.notas ? escHtml(c.notas) : '<span class="bp-view-value--muted">Sem preferências</span>';
    let contactActions = '';
    if (digits.length === 9) {
      const wa = '244' + digits;
      const msg = encodeURIComponent('Olá ' + (c.nome || '') + ',');
      contactActions =
        '<div class="bp-view-contact-actions">' +
        bpBtnWhatsAppHtml('https://wa.me/' + wa + '?text=' + msg) +
        bpBtnLigarHtml('tel:+244' + digits) +
        '</div>';
    }
    var pts = Number(c.pontos) || 0;
    var tier = typeof getClienteTier === 'function' ? getClienteTier(pts) : { id: 'bronze', label: 'Bronze' };
    body.innerHTML =
      '<div class="bp-view-hero">' +
      bpViewHeroAvatarHtml(c, (c.nome || '?').charAt(0).toUpperCase()) +
      '<div><div class="bp-view-hero-name">' + escHtml(c.nome || 'Cliente') + '</div>' +
      '<div class="bp-view-hero-meta">' + (digits ? ('+244 ' + escHtml(digits)) : 'Sem contacto') +
      ' · <span class="bp-tier bp-tier--' + tier.id + '">' + escHtml(tier.label) + '</span></div></div></div>' +
      contactActions +
      '<div class="bp-view-dl">' +
      '<div class="bp-view-row"><span class="bp-view-label">Nome</span><span class="bp-view-value">' + escHtml(c.nome || '—') + '</span></div>' +
      '<div class="bp-view-row"><span class="bp-view-label">Celular</span><span class="bp-view-value">' + escHtml(tel) + '</span></div>' +
      '<div class="bp-view-row"><span class="bp-view-label">Fidelidade</span><span class="bp-view-value">' + pts + ' pts · ' + escHtml(tier.label) + '</span></div>' +
      '<div class="bp-view-row"><span class="bp-view-label">Preferências</span><span class="bp-view-value">' + notas + '</span></div>' +
      '</div>' +
      '<p class="venda-modal-sub" style="margin-top:10px;">1 ponto por cada 1.000 Kz em vendas registadas na ficha.</p>';
  }
  // Stats com objecto (id + nome)
  const stats = typeof getEstatisticasCliente === 'function'
    ? getEstatisticasCliente(c)
    : { visitas: 0, totalGasto: 0, ultimaVisita: null };
  const statsEl = document.getElementById('cliente-perfil-stats');
  if (statsEl) {
    statsEl.hidden = false;
    statsEl.removeAttribute('hidden');
    statsEl.style.display = 'grid';
    statsEl.classList.add('bp-cli-stats');
    var visitas = Number(stats.visitas) || 0;
    var gasto = Number(stats.totalGasto) || 0;
    var ult = stats.ultimaVisita;
    var visitasVal = visitas > 0 ? String(visitas) : '—';
    var visitasSub = visitas > 0
      ? (visitas === 1 ? 'Visita' : 'Visitas')
      : 'Ainda sem visitas';
    var gastoVal = gasto > 0 ? fmtKz(gasto) : '—';
    var gastoSub = gasto > 0 ? 'Total gasto' : 'Sem gastos registados';
    var ultVal = ult
      ? (typeof formatarUltimaVisita === 'function' ? formatarUltimaVisita(ult) : '—')
      : '—';
    var ultSub = ult ? 'Última visita' : 'Sem histórico ainda';
    statsEl.innerHTML =
      '<div class="bp-cli-stat' + (visitas ? '' : ' is-empty') + '">' +
        '<div class="stat-valor">' + visitasVal + '</div>' +
        '<div class="stat-legenda">' + visitasSub + '</div></div>' +
      '<div class="bp-cli-stat' + (gasto ? '' : ' is-empty') + '">' +
        '<div class="stat-valor">' + gastoVal + '</div>' +
        '<div class="stat-legenda">' + gastoSub + '</div></div>' +
      '<div class="bp-cli-stat' + (ult ? '' : ' is-empty') + '">' +
        '<div class="stat-valor">' + ultVal + '</div>' +
        '<div class="stat-legenda">' + ultSub + '</div></div>';
  }
  openModal('modal-cliente');
}

document.getElementById('cliente-view-fechar')?.addEventListener('click', function () {
  setClienteModalMode('edit');
  closeModal('modal-cliente');
});
document.getElementById('cliente-view-editar')?.addEventListener('click', function () {
  const id = document.getElementById('cliente-id')?.value || editClienteId;
  if (id) openEditCliente(id);
});
document.getElementById('modal-cliente-cancel')?.addEventListener('click', function () {
  setClienteModalMode('edit');
  closeModal('modal-cliente');
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

// Despesa — ET4.2-P0: RBAC operacional (alinhado a data-role admin,gerente)
document.getElementById('add-despesa-btn').addEventListener('click', () => {
  if (typeof bpExigirRole === 'function' && !bpExigirRole(['admin', 'gerente'], 'Não tem permissão para registar despesas.')) return;
  const d = document.getElementById('desp-desc');
  const v = document.getElementById('desp-valor');
  const c = document.getElementById('desp-categoria');
  if (d) d.value = '';
  if (v) v.value = '';
  if (c) c.value = 'operacional';
  openModal('modal-despesa');
  setTimeout(function () { if (d) try { d.focus(); } catch (e) {} }, 100);
});
var _bpDespSaveBtn = document.getElementById('modal-despesa-save');
if (_bpDespSaveBtn) _bpDespSaveBtn.addEventListener('click', async () => {
  var btn = document.getElementById('modal-despesa-save');
  if (btn && btn.dataset.bpSaving === '1') return;
  if (typeof bpExigirRole === 'function' && !bpExigirRole(['admin', 'gerente'], 'Não tem permissão para registar despesas.')) return;
  const desc = document.getElementById('desp-desc').value.trim();
  const valor = Number(document.getElementById('desp-valor').value);
  const categoria = (document.getElementById('desp-categoria') || {}).value || 'outro';
  const fornEl = document.getElementById('desp-fornecedor');
  const fornecedor = fornEl ? String(fornEl.value || '').trim() : '';
  if (!desc) { toast('Indica a descrição da despesa.', 'warning'); return; }
  if (!valor || valor <= 0 || isNaN(valor)) { toast('Indica um valor válido.', 'warning'); return; }
  if (btn) { btn.dataset.bpSaving = '1'; try { btn.disabled = true; } catch (_) {} }
  try {
    await addMovimento({
      tipo: 'despesa',
      descricao: desc,
      valor: valor,
      categoria: categoria,
      fornecedor: fornecedor || undefined
    });
    closeModal('modal-despesa');
    document.getElementById('desp-desc').value = '';
    document.getElementById('desp-valor').value = '';
    if (fornEl) fornEl.value = '';
    toast('Despesa registada.', 'success');
    if (typeof updateUI === 'function') updateUI();
  } finally {
    if (btn) { btn.dataset.bpSaving = ''; try { btn.disabled = false; } catch (_) {} }
  }
});
document.getElementById('modal-despesa-cancel').addEventListener('click', () => closeModal('modal-despesa'));

// Fundo — ET4.2-P0: RBAC admin/gerente
document.getElementById('ajustar-fundo-btn').addEventListener('click', () => {
  if (typeof bpExigirRole === 'function' && !bpExigirRole(['admin', 'gerente'], 'Não tem permissão para ajustar o fundo de caixa.')) return;
  const el = document.getElementById('fundo-valor');
  const atual = Number(state.config && state.config.fundo) || 0;
  if (el) el.value = atual;
  const sub = document.getElementById('fundo-modal-sub');
  if (sub && typeof fmtKz === 'function') {
    sub.textContent = 'Actual: ' + fmtKz(atual) + ' — define o valor de abertura do caixa.';
  }
  openModal('modal-fundo');
  setTimeout(function () { if (el) try { el.focus(); el.select(); } catch (e) {} }, 100);
});
document.getElementById('modal-fundo-save').addEventListener('click', async () => {
  if (typeof bpExigirRole === 'function' && !bpExigirRole(['admin', 'gerente'], 'Não tem permissão para ajustar o fundo de caixa.')) return;

  const v = Number(document.getElementById('fundo-valor').value);
  if (isNaN(v) || v < 0) { toast('Valor inválido', 'error'); return; }
  state.config.fundo = v;
  await saveConfig();
  closeModal('modal-fundo');
  toast('Fundo de caixa actualizado.', 'success');
  if (typeof updateUI === 'function') updateUI();
});
document.getElementById('modal-fundo-cancel').addEventListener('click', () => closeModal('modal-fundo'));

// Venda – Adicionar item ao carrinho (profissional único/global)
document.getElementById('btn-add-item').addEventListener('click', () => {
  const catSel = document.getElementById('ci-servico-sel');
  const ciValor = document.getElementById('ci-valor');
  let nome = catSel.value;
  if (nome === '__custom' || nome === 'Outro') {
    if (typeof toast === 'function') toast('Seleccione um serviço do catálogo.', 'warning');
    return;
  }
  const wasDisabled = ciValor.disabled;
  ciValor.disabled = false;
  const valor = parseFloat(ciValor.value);
  if (wasDisabled) ciValor.disabled = true;
  if (!nome || !valor || valor <= 0) { 
    toast('Indica serviço e valor válidos.', 'warning'); 
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
  // Preparar próximo item (velocidade no balcão)
  if (catSel) catSel.value = '';
  if (ciValor) { ciValor.value = ''; }
  if (typeof updateVendaSaveButton === 'function') updateVendaSaveButton();
});

// CORREÇÃO: modal-venda-save com profissional único
const vendaSaveBtn = document.getElementById('modal-venda-save');
if (vendaSaveBtn) {
  vendaSaveBtn.onclick = async function(e) {
    if (this.disabled || this.getAttribute('aria-busy') === 'true') return;
    const cliente = (document.getElementById('venda-cliente') || {}).value || '';
    const profissionalId = (document.getElementById('venda-profissional') || {}).value || '';
    const metodoPagamento = (document.getElementById('venda-pagamento') || {}).value || '';

    const profObj = (state.profissionais || []).find(function (p) { return p && p.id === profissionalId; });
    const profissionalNome = profObj ? profObj.nome : '';

    var pagamentosSplit = null;
    var metodoFinal = metodoPagamento;
    if (metodoPagamento === '__split__' && typeof window.BPFinance !== 'undefined' && BPFinance.lerPagamentosSplit) {
      var sp = BPFinance.lerPagamentosSplit();
      if (sp && sp.list && sp.list.length) {
        pagamentosSplit = sp.list;
        metodoFinal = 'Split';
      }
    }

    var payload = {
      cliente: cliente,
      profissional: profissionalNome,
      profissional_id: profissionalId || null,
      itens: (typeof cartItems !== 'undefined' && cartItems) ? cartItems.slice() : [],
      metodoPagamento: metodoFinal,
      pagamentos: pagamentosSplit
    };

    // Validação central ANTES de processar (R19–R21)
    var pre = typeof bpValidarOperacaoVenda === 'function' ? bpValidarOperacaoVenda(payload) : { ok: true };
    if (!pre || !pre.ok) {
      if (typeof bpNotificarValidacaoVenda === 'function') bpNotificarValidacaoVenda(pre);
      else if (typeof toast === 'function') toast((pre && pre.message) || 'Complete os dados da venda.', 'warning');
      return;
    }

    // R24 — confirmação: ainda NÃO persiste
    var itensTxt = (pre.itens || []).map(function (i) {
      return (i.nome || '') + ' ×' + i.quantidade;
    }).join(', ');
    var totalTxt = (typeof fmtKz === 'function') ? fmtKz(pre.total) : (pre.total + ' Kz');
    var resumo =
      'Cliente: ' + (pre.clienteNome || '—') + '\n' +
      'Profissional: ' + (pre.profissionalNome || '—') + '\n' +
      'Itens: ' + (itensTxt || '—') + '\n' +
      'Total: ' + totalTxt + '\n' +
      'Pagamento: ' + (pre.metodoPagamento || '—') + '\n\n' +
      'Confirme para registar a venda. Até confirmar, nada é gravado.';
    var confirmou = false;
    if (typeof showConfirmModal === 'function') {
      confirmou = await showConfirmModal(
        'Confirmar venda?',
        resumo,
        false,
        { confirmLabel: 'Confirmar venda', cancelLabel: 'Voltar', variant: 'default', summaryLayout: true }
      );
    } else {
      confirmou = window.confirm(resumo);
    }
    if (!confirmou) return;

    setButtonLoading(this, true);
    try {
      const idVenda = await registarVenda(payload);
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
    } catch (err) {
      console.error('[modal-venda-save]', err);
      toast('A venda não foi concluída. Verifique se todos os campos estão preenchidos corretamente e tente novamente.', 'error');
    } finally {
      setButtonLoading(this, false);
    }
  };
}

// Cancelar venda – limpar carrinho com confirmação e fechar modal
document.getElementById('modal-venda-cancel').addEventListener('click', async () => {
  if (cartItems.length > 0) {
    let confirmCancel = true;
    if (typeof showConfirmModal === 'function') {
      confirmCancel = await showConfirmModal(
        'Limpar carrinho?',
        'Os serviços adicionados a esta venda serão removidos. Podes voltar a montar a venda a qualquer momento.',
        true,
        { confirmLabel: 'Limpar', cancelLabel: 'Manter', variant: 'destructive' }
      );
    }
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
    return;
  }

  const metodo = (document.getElementById('finalizar-pagamento') || {}).value || '';
  const itens = [{
    nome: ag.servico,
    quantidade: 1,
    precoUnit: Number(ag.preco) || 0,
    subtotal: Number(ag.preco) || 0
  }];
  let cliId = ag.cliente_id || null;
  if (!cliId && typeof resolverClienteIdPorNome === 'function') {
    cliId = resolverClienteIdPorNome(ag.cliente);
  }
  const payload = {
    cliente: ag.cliente || '',
    cliente_id: cliId,
    profissional: ag.profissional || '',
    profissional_id: ag.profissional_id || null,
    itens: itens,
    metodoPagamento: metodo
  };

  // Validar ANTES de marcar agendamento como realizado (R44 / R51)
  var pre = typeof bpValidarOperacaoVenda === 'function' ? bpValidarOperacaoVenda(payload) : { ok: true };
  if (!pre || !pre.ok) {
    if (typeof bpNotificarValidacaoVenda === 'function') bpNotificarValidacaoVenda(pre);
    else if (typeof toast === 'function') toast((pre && pre.message) || 'Não é possível registar a venda.', 'warning');
    return;
  }

  // R24 — confirmar antes de persistir (mesmo fluxo que Cobrar)
  var totalTxt = (typeof fmtKz === 'function') ? fmtKz(pre.total) : ((pre.total || 0) + ' Kz');
  var resumoFin =
    'Cliente: ' + (pre.clienteNome || payload.cliente || '—') + '\n' +
    'Profissional: ' + (pre.profissionalNome || payload.profissional || '—') + '\n' +
    'Serviço: ' + ((pre.itens && pre.itens[0] && pre.itens[0].nome) || (payload.itens[0] && payload.itens[0].nome) || '—') + '\n' +
    'Total: ' + totalTxt + '\n' +
    'Pagamento: ' + (pre.metodoPagamento || payload.metodoPagamento || '—') + '\n\n' +
    'Confirme para registar a venda. Até confirmar, o atendimento permanece pendente.';
  var confirmouFin = false;
  if (typeof showConfirmModal === 'function') {
    confirmouFin = await showConfirmModal(
      'Confirmar venda?',
      resumoFin,
      false,
      { confirmLabel: 'Confirmar venda', cancelLabel: 'Voltar', variant: 'default', summaryLayout: true }
    );
  } else {
    confirmouFin = window.confirm(resumoFin);
  }
  if (!confirmouFin) return;

  const idVenda = await registarVenda(payload);
  if (!idVenda) {
    return;
  }

  await updateAgendamento(id, { status: 'realizado' });
  closeModal('modal-finalizar');
  toast('Venda registada.', 'success');
  if (typeof updateUI === 'function') updateUI();
  if (typeof renderBadges === 'function') renderBadges();
});

document.getElementById('modal-finalizar-cancel').addEventListener('click', () => closeModal('modal-finalizar'));

// ====================================================================
//  CONFIRMAR FECHO DE CAIXA (persistência)
// ====================================================================
async function confirmarFechoCaixa() {
  var cBtn = document.getElementById('confirmar-fecho-btn');
  if (cBtn && cBtn.dataset.bpSaving === '1') return;
  if (typeof bpExigirRole === 'function' && !bpExigirRole(['admin'], 'Apenas administradores podem fechar o caixa.')) return;

  const hojeStr = hoje();
  const movs = (state.movimentos && Array.isArray(state.movimentos) ? state.movimentos : []).filter(m => m.data === hojeStr);
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
    detalhePagamento[mp] = (detalhePagamento[mp] || 0) + (Number(v.valor) || 0);
  });

  const totalVendas = vendas.reduce((s, v) => s + (Number(v.valor) || 0), 0);
  const totalDespesas = despesas.reduce((s, d) => s + (Number(d.valor) || 0), 0);
  const saldoFinal = (Number(state.config.fundo) || 0) + totalVendas - totalDespesas;

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

  if (cBtn) { cBtn.dataset.bpSaving = '1'; try { cBtn.disabled = true; } catch (_) {} }
  try {
  await dbPut('fechos_caixa', registro);
  // Atualizar o estado local (Store quando disponível — notifica subscribers)
  if (window.BeautyStore && window.BeautyStore.pushToList) {
    window.BeautyStore.pushToList('fechos_caixa', registro);
  } else {
    if (!Array.isArray(state.fechos_caixa)) state.fechos_caixa = [];
    state.fechos_caixa.push(registro);
  }
  toast('Caixa fechado.', 'success');
  closeModal('modal-fecho');
  updateUI();
  } finally {
    if (cBtn) { cBtn.dataset.bpSaving = ''; try { cBtn.disabled = false; } catch (_) {} }
  }
}

// ====================================================================
//  FECHO DE CAIXA (listeners)
// ====================================================================
document.getElementById('fecho-caixa-btn').addEventListener('click', abrirFechoCaixa);
document.getElementById('modal-fecho-fechar')?.addEventListener('click', () => closeModal('modal-fecho'));
document.getElementById('btn-imprimir-fecho')?.addEventListener('click', () => {
  const hojeStr = hoje();
  const _movsImp = (state.movimentos && Array.isArray(state.movimentos)) ? state.movimentos : [];
  const vendas = _movsImp.filter(m => m.data === hojeStr && m.tipo === 'venda');
  const despesas = _movsImp.filter(m => m.data === hojeStr && m.tipo === 'despesa');
  const tv = vendas.reduce((s, v) => s + (Number(v.valor) || 0), 0);
  const td = despesas.reduce((s, d) => s + (Number(d.valor) || 0), 0);
  const byPag = {};
  vendas.forEach(v => { const k = v.metodoPagamento || 'Numerário';
    byPag[k] = (byPag[k] || 0) + (Number(v.valor) || 0); });
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
document.getElementById('kpi-agenda-card')?.addEventListener('click', () => abrirDetalheAgendamentos('pendentes'));

document.getElementById('modal-revenue-close').addEventListener('click', () => closeModal('modal-revenue-detail'));
document.getElementById('modal-agenda-close').addEventListener('click', () => closeModal('modal-agenda-detail'));

document.getElementById('agenda-detail-pendentes')?.addEventListener('click', () => abrirDetalheAgendamentos('pendentes'));
document.getElementById('agenda-detail-realizados')?.addEventListener('click', () => abrirDetalheAgendamentos('realizados'));

// hist-chip substituído pelo popover caixa-filter (Fase E)


// Filtro frequência clientes — texto só, sem fundo (activo = negrito dourado)
document.querySelectorAll('.filtro-frequencia').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.filtro-frequencia').forEach(b => {
      b.classList.remove('active', 'is-active');
    });
    this.classList.add('is-active');
    state.filtroClientes = this.dataset.filtro || 'todos';
    try { localStorage.setItem('bp_filtro_clientes', state.filtroClientes); } catch (_) {}
    if (typeof renderClientes === 'function') renderClientes();
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
    try { btn.setAttribute('aria-expanded', open ? 'false' : 'true'); } catch (_) {}
    if (buscaBox) buscaBox.style.display = 'none';
    periodoLoc = null;
    document.querySelectorAll('.caixa-loc-periodo').forEach(b => b.classList.remove('active'));
  });

  document.addEventListener('click', function(e) {
    if (pop.style.display === 'block' && !pop.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
      pop.style.display = 'none';
      try { btn.setAttribute('aria-expanded', 'false'); } catch (_) {}
    }
  });

  document.querySelectorAll('.caixa-loc-periodo').forEach(b => {
    b.addEventListener('click', function(e) {
      e.stopPropagation();
      var per = this.dataset.periodo;
      if (per === 'dia') {
        var din = document.getElementById('caixa-loc-data-exata');
        if (din) {
          din.onchange = function () {
            if (!this.value) return;
            localStorage.setItem('bp_caixa_loc_data_exata', this.value);
            localStorage.setItem('bp_caixa_data_exata', this.value);
            periodoLoc = 'dia';
            document.querySelectorAll('.caixa-loc-periodo').forEach(x => x.classList.remove('active'));
            b.classList.add('active');
            if (buscaBox) buscaBox.style.display = 'block';
            if (input) { input.value = ''; input.focus(); }
          };
          try {
            if (typeof din.showPicker === 'function') din.showPicker();
            else din.click();
          } catch (_) { try { din.click(); } catch (__) {} }
        }
        return;
      }
      periodoLoc = per;
      document.querySelectorAll('.caixa-loc-periodo').forEach(x => x.classList.remove('active'));
      this.classList.add('active');
      if (buscaBox) buscaBox.style.display = 'block';
      if (input) { input.value = ''; input.focus(); }
    });
  });

  function procurar() {
    if (!periodoLoc) {
      toast('Selecciona primeiro o período.', 'warning');
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
        var avLoc = '';
        try {
          var cliL = null;
          if (m.cliente_id) cliL = (state.clientes || []).find(function (c) { return String(c.id) === String(m.cliente_id); });
          if (!cliL && m.cliente) {
            var nL = String(m.cliente).toLowerCase().trim();
            cliL = (state.clientes || []).find(function (c) { return String(c.nome || '').toLowerCase().trim() === nL; });
          }
          var srcL = null;
          if (cliL && window.BPMedia && typeof BPMedia.resolveFotoSrc === 'function') srcL = BPMedia.resolveFotoSrc(cliL);
          else if (cliL && cliL.foto) srcL = cliL.foto;
          else if (cliL && cliL.foto_url) srcL = cliL.foto_url;
          if (srcL) avLoc = '<div class="avatar bp-avatar-img"><img src="' + String(srcL).replace(/"/g, '&quot;') + '" alt="" loading="lazy"></div>';
          else if (cliL && cliL.nome) avLoc = '<div class="avatar">' + escHtml(String(cliL.nome).charAt(0).toUpperCase()) + '</div>';
          else if (m.cliente) avLoc = '<div class="avatar">' + escHtml(String(m.cliente).charAt(0).toUpperCase()) + '</div>';
          else avLoc = '<div class="avatar" style="background:#E6F4EC;color:var(--green);font-size:0;" aria-hidden="true"><span style="display:block;width:8px;height:8px;border-radius:50%;background:currentColor;margin:auto;"></span></div>';
        } catch (_) {
          avLoc = '<div class="avatar" style="background:#E6F4EC;color:var(--green);font-size:0;" aria-hidden="true"><span style="display:block;width:8px;height:8px;border-radius:50%;background:currentColor;margin:auto;"></span></div>';
        }
        return `<div class="list-item list-item-venda" data-id="${m.id}" data-tipo="venda" style="padding-right:32px;">
          ${avLoc}
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

(function bindClienteNaoEncontradoOk() {
  function fechar() {
    if (typeof closeModal === 'function') closeModal('modal-cliente-nao-encontrado');
    else {
      var el = document.getElementById('modal-cliente-nao-encontrado');
      if (el) {
        el.classList.remove('open');
        el.style.display = 'none';
        el.style.pointerEvents = '';
      }
      try { document.body.classList.remove('bp-modal-open'); } catch (_) {}
    }
  }
  function bind() {
    var btn = document.getElementById('modal-cliente-nao-encontrado-ok');
    if (!btn || btn.dataset.bpBoundOk === '1') return;
    btn.dataset.bpBoundOk = '1';
    btn.type = 'button';
    btn.addEventListener('click', function (ev) {
      try { ev.preventDefault(); ev.stopPropagation(); } catch (_) {}
      fechar();
    });
  }
  bind();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  setTimeout(bind, 500);
  /* Delegação (captura): cobre re-renders / timing */
  if (!window.__bpCliNaoEncDeleg) {
    window.__bpCliNaoEncDeleg = true;
    document.addEventListener('click', function (ev) {
      var t = ev.target && ev.target.closest && ev.target.closest('#modal-cliente-nao-encontrado-ok');
      if (!t) return;
      try { ev.preventDefault(); ev.stopPropagation(); } catch (_) {}
      fechar();
    }, true);
  }
})();


// R50 — Cancelar venda (confirmação + motivo)
document.getElementById('btn-cancelar-venda')?.addEventListener('click', async function () {
  if (!vendaAtual || !vendaAtual.id) {
    if (typeof toast === 'function') toast('Nenhuma venda seleccionada.', 'warning');
    return;
  }
  if (String(vendaAtual.status || '').toLowerCase() === 'cancelado') {
    if (typeof toast === 'function') toast('Esta venda já está cancelada.', 'warning');
    return;
  }
  var ok = true;
  if (typeof showConfirmModal === 'function') {
    ok = await showConfirmModal(
      'Cancelar esta venda?',
      'A venda deixa de contar no caixa e a comissão é estornada. O registo permanece no histórico. Indique o motivo a seguir.',
      true,
      { confirmLabel: 'Continuar', cancelLabel: 'Voltar', variant: 'destructive' }
    );
  }
  if (!ok) return;
  var motivo = '';
  try {
    motivo = window.prompt('Motivo do cancelamento (obrigatório):', '') || '';
  } catch (_) {}
  motivo = String(motivo).trim();
  if (!motivo) {
    if (typeof bpNotifyFormError === 'function') bpNotifyFormError('Indique o motivo do cancelamento para continuar.');
    else if (typeof toast === 'function') toast('Indique o motivo do cancelamento para continuar.', 'warning');
    return;
  }
  var done = typeof cancelarVenda === 'function' ? await cancelarVenda(vendaAtual.id, motivo) : false;
  if (done) {
    closeModal('modal-detalhe-venda');
    if (typeof updateUI === 'function') updateUI();
  }
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

// Ripple global removido (listener vazio gerava ruído na cadeia de cliques).

// ====================================================================
//  MENU DE ACÇÕES DA LINHA (⋮)
// ====================================================================
function abrirMenuLinha(anchorEl, tipo, id) {
  const menu = document.getElementById('row-menu');
  const editLabel = document.getElementById('row-menu-edit-label');
  const delBtn = document.getElementById('row-menu-delete');
  const papel = normalizarRole(state.config.userRole);

  const config = {
    cliente:      { editLabel: 'Ajustar perfil', delAction: 'del-cliente', delLabel: 'Excluir',   podeEliminar: papel === 'admin' || papel === 'gerente' },
    profissional: { editLabel: 'Ajustar',         delAction: 'del-p',       delLabel: 'Destituir', podeEliminar: papel === 'admin' },
    servico:      { editLabel: 'Ajustar',         delAction: 'del-servico', delLabel: 'Excluir',   podeEliminar: papel === 'admin' },
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
  const delLabelEl = document.getElementById('row-menu-delete-label');
  if (delLabelEl) delLabelEl.textContent = config.delLabel || 'Excluir';

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
  window.BPRuntime = window.BPRuntime || {};
  window.BPRuntime.lastMenuTrigger = anchorEl;
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
    if (window.BPRuntime && window.BPRuntime.lastMenuTrigger) {
      window.BPRuntime.lastMenuTrigger.focus();
      window.BPRuntime.lastMenuTrigger = null;
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
(function bindBpGlobClick() {
  var root = document.body;
  if (!root) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bindBpGlobClick, { once: true });
    }
    return;
  }
  if (root.dataset.bpGlobClick === '1') return;
  root.dataset.bpGlobClick = '1';
  document.addEventListener('click', async function(e) {
  const rowMenuBtn = e.target.closest('[data-action="row-menu"]');
  if (rowMenuBtn) {
    e.preventDefault();
    e.stopPropagation();
    abrirMenuLinha(rowMenuBtn, rowMenuBtn.dataset.tipo, rowMenuBtn.dataset.id);
    return;
  }

  // Finalizar atendimento (delegação — não depende de listeners por render)
  const finBtn = e.target.closest('[data-action="finalizar"]');
  if (finBtn) {
    e.preventDefault();
    e.stopPropagation();
    const id = finBtn.dataset.id;
    if (id && typeof abrirFinalizarAtendimento === 'function') abrirFinalizarAtendimento(id);
    return;
  }

  if (e.target.closest('.row-menu-item')) {
    fecharMenuLinha();
  }

  const reagendarBtn = e.target.closest('[data-action="reagendar-agenda"]');
  if (reagendarBtn) {
    e.preventDefault();
    e.stopPropagation();
    const id = reagendarBtn.dataset.id;
    if (typeof abrirReagendarAgendamento === 'function') abrirReagendarAgendamento(id);
    else if (window.abrirReagendarAgendamento) window.abrirReagendarAgendamento(id);
    return;
  }

  const waBtn = e.target.closest('[data-action="whatsapp-agenda"]');
  if (waBtn) {
    e.preventDefault();
    e.stopPropagation();
    const id = waBtn.dataset.id;
    const ag = (state.agendamentos || []).find(a => a.id === id);
    if (!ag) return;
    let href = '';
    try {
      if (window.BPAgendaUI && typeof BPAgendaUI.waHref === 'function') href = BPAgendaUI.waHref(ag);
    } catch (_) {}
    if (!href) {
      if (typeof toast === 'function') toast('Este cliente não tem telefone no registo.', 'warning');
      return;
    }
    const win = window.open(href, '_blank', 'noopener,noreferrer');
    if (!win) {
      if (typeof toast === 'function') toast('Permita pop-ups para abrir o WhatsApp', 'warning');
    }
    return;
  }

  const target = e.target.closest('[data-action="cancelar-agenda"]');
  if (target) {
    e.preventDefault();
    e.stopPropagation();
    // ET4.3: RBAC operacional (botão já tem data-role admin,gerente)
    if (typeof bpExigirRole === 'function' && !bpExigirRole(['admin', 'gerente'], 'Não tem permissão para cancelar agendamentos.')) return;
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
      toast('Agendamento cancelado.', 'warning');
    }
    return;
  }

  const delProf = e.target.closest('[data-action="del-p"]');
  if (delProf) {
    e.preventDefault();
    e.stopPropagation();
    if (normalizarRole(state.config.userRole) !== 'admin') {
      toast('Não tens permissão para esta ação.', 'warning');
      return;
    }
    const id = delProf.dataset.id;
    const prof = (state.profissionais || []).find(p => p.id === id);
    if (!prof) return;
    if (typeof isProfissionalAtivo === 'function' && !isProfissionalAtivo(prof)) {
      toast('Este profissional já está destituído', 'warning');
      return;
    }
    const msg =
      'Tem a certeza que deseja destituir ' + (prof.nome || 'este profissional') + ' das suas funções?\n\n' +
      '• Deixa de aparecer em novos agendamentos e vendas\n' +
      '• Será removido dos serviços associados\n' +
      '• Serviços onde for o único profissional serão desactivados\n' +
      '• Agendamentos e vendas anteriores mantêm-se no histórico';
    const confirmed = await showConfirmModal('Destituir profissional', msg, true);
    if (!confirmed) return;

    const result = typeof desassociarProfissional === 'function'
      ? await desassociarProfissional(id)
      : null;

    if (result) {
      let extra = '';
      if (result.servicosDesativados && result.servicosDesativados.length) {
        extra = ' Serviços desactivados: ' + result.servicosDesativados.join(', ') + '.';
      }
      toast((prof.nome || 'Profissional') + ' destituído.' + extra, 'success');

      // Aviso ao profissional via WhatsApp (contexto AO — sem SMS infra)
      const digits = String(prof.contacto || '').replace(/\D/g, '');
      if (digits.length === 9) {
        const salao = (state.config && state.config.storeName) || 'o salão';
        const texto = encodeURIComponent(
          'Olá ' + (prof.nome || '') + ', foi destituído das suas funções em ' + salao +
          '. Os registos históricos permanecem no sistema. Contacte a administração para mais informações.'
        );
        try {
          window.open('https://wa.me/244' + digits + '?text=' + texto, '_blank', 'noopener,noreferrer');
        } catch (e) {}
      }
    } else {
      toast('Não foi possível destituir o profissional', 'error');
    }
    return;
  }

  const delServ = e.target.closest('[data-action="del-servico"]');
  if (delServ) {
    e.preventDefault();
    e.stopPropagation();
    if (normalizarRole(state.config.userRole) !== 'admin') {
      toast('Não tens permissão para esta ação.', 'warning');
      return;
    }
    const id = delServ.dataset.id;
    const serv = state.servicos.find(s => s.id === id);
    if (!serv) return;
    const confirmed = await showConfirmModal('Desactivar Serviço?', `Tem a certeza que quer desactivar "${serv.nome}"? Deixa de aparecer em novas vendas; o histórico mantém-se.`, true);
    if (confirmed) await deleteServico(id);
    return;
  }

  const delCliente = e.target.closest('[data-action="del-cliente"]');
  if (delCliente) {
    e.preventDefault();
    e.stopPropagation();
    const papel = normalizarRole(state.config.userRole);
    if (papel !== 'admin' && papel !== 'gerente') {
      toast('Não tens permissão para esta ação.', 'warning');
      return;
    }
    const id = delCliente.dataset.id;
    const cli = state.clientes.find(c => c.id === id);
    if (!cli) return;
    const confirmed = await showConfirmModal('Eliminar Cliente?', `Tem a certeza que quer eliminar "${cli.nome}"? Esta acção não pode ser desfeita.`, true);
    if (confirmed) await deleteCliente(id);
    return;
  }
}, false); // bubble: evita cortar outros handlers em capture
})();


// ONLINE — flush apenas em sync-queue.js (evitar double flush). Actualiza UI IA se existir.
window.addEventListener('online', () => {
  if (typeof atualizarIAOffline === 'function') atualizarIAOffline();
  if (typeof atualizarIndicadorSync === 'function') atualizarIndicadorSync();
});

window.addEventListener('offline', () => {
  if (typeof atualizarIAOffline === 'function') atualizarIAOffline();
  if (typeof atualizarIndicadorSync === 'function') atualizarIndicadorSync();
});

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      if (typeof atualizarIndicadorSync === 'function') atualizarIndicadorSync();
    });
  } else if (typeof atualizarIndicadorSync === 'function') {
    atualizarIndicadorSync();
  }
}

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

/** Limita texto sem cortar a meio da última palavra. */
function _bpIaTrimTexto(s, max) {
  s = String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  if (!max || s.length <= max) return s;
  var cut = s.slice(0, max);
  var sp = cut.lastIndexOf(' ');
  if (sp > max * 0.6) cut = cut.slice(0, sp);
  return cut.replace(/[\s,;:.-]+$/, '') + '…';
}

/** Histórico compacto para API — mais memória sem explodir tokens. */
function _bpIaHistoricoCompacto(hist, maxTurns, maxCharsEach) {
  maxTurns = maxTurns || 8;
  maxCharsEach = maxCharsEach || 900;
  var list = Array.isArray(hist) ? hist.slice(-maxTurns) : [];
  return list.map(function (t) {
    return {
      pergunta: _bpIaTrimTexto(t && t.pergunta, 400),
      resposta: _bpIaTrimTexto(t && t.resposta, maxCharsEach),
      fonte: (t && t.fonte) || undefined
    };
  });
}

/** Contexto de salão — mais completo, ainda seguro contra payloads gigantes. */
function _bpIaContextoCompacto(ctxRaw) {
  if (ctxRaw == null) return '';
  if (typeof ctxRaw === 'object' && ctxRaw.erro) return ctxRaw;
  var s = typeof ctxRaw === 'string' ? ctxRaw : String(ctxRaw);
  /* Teto alinhado com MAX_CONTEXT_CHARS da edge (60000). Não omitir clientes. */
  if (s.length > 58000) {
    s = _bpIaTrimTexto(s, 58000);
  }
  return s;
}

function buildContextoIA() {
  if (!state.movimentos || !Array.isArray(state.movimentos) || !state.agendamentos || !Array.isArray(state.agendamentos)) {
    return { erro: 'Dados ainda não carregados. Tente novamente em instantes.' };
  }

  var hojeStr = hoje();
  var num = function (v) { return Number(v) || 0; };
  var stAg = function (a) {
    if (typeof _bpIaSt === 'function') return _bpIaSt(a);
    return String((a && (a.status || a.estado)) || 'agendado').toLowerCase();
  };
  var isActivo = function (x) {
    if (!x) return false;
    return x.ativo !== false && x.ativo !== 0 && x.ativo !== 'false';
  };

  var vendasHoje = state.movimentos.filter(function (m) { return m.data === hojeStr && m.tipo === 'venda'; });
  var despHoje = state.movimentos.filter(function (m) { return m.data === hojeStr && m.tipo === 'despesa'; });
  var agHoje = state.agendamentos.filter(function (a) { return a.data === hojeStr; });

  var d30str = (typeof _bpIaDataOffset === 'function') ? _bpIaDataOffset(-29) : (function () {
    var d = new Date(); d.setDate(d.getDate() - 29);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  })();

  var vendas30 = state.movimentos.filter(function (m) { return m.data >= d30str && m.tipo === 'venda'; });

  var byProf = {};
  vendas30.forEach(function (v) {
    if (v.profissional_id) {
      var nome = (typeof getProfissionalNome === 'function') ? getProfissionalNome(v.profissional_id) : (v.profissional || '—');
      byProf[nome] = (byProf[nome] || 0) + num(v.valor);
    }
  });

  var byServ = {};
  vendas30.forEach(function (v) {
    if (v.itens) {
      v.itens.forEach(function (i) {
        if (!i || !i.nome) return;
        byServ[i.nome] = (byServ[i.nome] || 0) + (num(i.quantidade) || 1);
      });
    }
  });

  var totalVendas30 = vendas30.reduce(function (s, v) { return s + num(v.valor); }, 0);
  var ticketMedio = vendas30.length > 0 ? Math.round(totalVendas30 / vendas30.length) : 0;
  var totalVendasHoje = vendasHoje.reduce(function (s, v) { return s + num(v.valor); }, 0);
  var totalDespHoje = despHoje.reduce(function (s, d) { return s + num(d.valor); }, 0);
  var clientesUnicos = new Set(vendasHoje.map(function (v) { return v.cliente; }).filter(Boolean)).size;

  var hojeD = new Date(hojeStr + 'T12:00:00');
  var iniSemanaAtualStr = (typeof _bpIaDataOffset === 'function') ? _bpIaDataOffset(-6) : hojeStr;
  var iniSemanaAnteriorStr = (typeof _bpIaDataOffset === 'function') ? _bpIaDataOffset(-13) : hojeStr;
  var fimSemanaAnteriorStr = (typeof _bpIaDataOffset === 'function') ? _bpIaDataOffset(-7) : hojeStr;
  var vendasSemanaAtual = state.movimentos.filter(function (m) {
    return m.tipo === 'venda' && m.data >= iniSemanaAtualStr && m.data <= hojeStr;
  });
  var vendasSemanaAnterior = state.movimentos.filter(function (m) {
    return m.tipo === 'venda' && m.data >= iniSemanaAnteriorStr && m.data <= fimSemanaAnteriorStr;
  });
  var totalSemanaAtual = vendasSemanaAtual.reduce(function (s, v) {
    return s + (typeof _bpIaNum === 'function' ? _bpIaNum(v.valor) : num(v.valor));
  }, 0);
  var totalSemanaAnterior = vendasSemanaAnterior.reduce(function (s, v) {
    return s + (typeof _bpIaNum === 'function' ? _bpIaNum(v.valor) : num(v.valor));
  }, 0);

  var fim14Str = (typeof _bpIaDataOffset === 'function') ? _bpIaDataOffset(14) : hojeStr;
  var ini14Str = (typeof _bpIaDataOffset === 'function') ? _bpIaDataOffset(-14) : hojeStr;

  var agProximos = state.agendamentos.filter(function (a) {
    if (!(a.data >= hojeStr && a.data <= fim14Str)) return false;
    return stAg(a) !== 'cancelado';
  });
  var agHistorico = state.agendamentos.filter(function (a) {
    return a.data >= ini14Str && a.data < hojeStr;
  });

  var ag30 = state.agendamentos.filter(function (a) { return a.data >= d30str && a.data <= hojeStr; });
  var ag30Cancelados = ag30.filter(function (a) { return stAg(a) === 'cancelado'; }).length;
  var taxaCancelamento = ag30.length > 0 ? Math.round((ag30Cancelados / ag30.length) * 100) : 0;

  var servicosOrdenados = Object.keys(byServ).map(function (k) { return [k, byServ[k]]; }).sort(function (a, b) { return a[1] - b[1]; });
  var servicoMenosVendido = servicosOrdenados[0];

  /* ---- Breakdown diário (todos os dias com movimento) ---- */
  var porDia = {};
  (state.movimentos || []).forEach(function (m) {
    if (!m || !m.data) return;
    if (!porDia[m.data]) porDia[m.data] = { vendas: 0, despesas: 0, nVendas: 0, nDespesas: 0 };
    if (m.tipo === 'venda') {
      porDia[m.data].vendas += num(m.valor);
      porDia[m.data].nVendas += 1;
    } else if (m.tipo === 'despesa') {
      porDia[m.data].despesas += num(m.valor);
      porDia[m.data].nDespesas += 1;
    }
  });
  var diasOrdenados = Object.keys(porDia).sort();
  var linhasDia = diasOrdenados.map(function (d) {
    var x = porDia[d];
    return '- ' + d + ': vendas ' + x.vendas + ' Kz (' + x.nVendas + ') · despesas ' + x.despesas + ' Kz (' + x.nDespesas + ')';
  });

  /* ---- Clientes activos (sem limite) + eliminados ---- */
  var clientesActivos = (state.clientes || []).filter(isActivo);
  var clientesEliminados = (state.clientes || []).filter(function (c) { return c && !isActivo(c); });

  var gastoPorCliente = {};
  var ultimaCompraPorCliente = {};
  state.movimentos.filter(function (m) { return m.tipo === 'venda' && m.cliente; }).forEach(function (v) {
    var cn = String(v.cliente || '').trim();
    if (!cn) return;
    gastoPorCliente[cn] = (gastoPorCliente[cn] || 0) + num(v.valor);
    if (!ultimaCompraPorCliente[cn] || v.data > ultimaCompraPorCliente[cn]) {
      ultimaCompraPorCliente[cn] = v.data;
    }
  });

  var linhasClientes = clientesActivos.map(function (c) {
    var nome = c.nome || '—';
    var tel = c.telefone || 'sem telefone';
    var nomeKey = String(nome).trim();
    var gasto = gastoPorCliente[nomeKey] || 0;
    var ultima = ultimaCompraPorCliente[nomeKey];
    var dias = ultima ? Math.floor((hojeD - new Date(ultima + 'T12:00:00')) / 86400000) : null;
    return '- ' + nome + ' | tel: ' + tel + ' | gasto: ' + gasto + ' Kz | última visita: ' +
      (dias !== null ? 'há ' + dias + ' dias (' + ultima + ')' : 'sem compras registadas');
  });

  /* Listas explícitas — o modelo não pode “assumir” que só existem clientes com venda */
  var clientesSemVenda = clientesActivos.filter(function (c) {
    var nome = (c.nome || '').trim();
    return nome && !(gastoPorCliente[nome] > 0);
  });
  var clientesComVenda = clientesActivos.filter(function (c) {
    var nome = (c.nome || '').trim();
    return nome && (gastoPorCliente[nome] > 0);
  });
  var linhasSemVenda = clientesSemVenda.map(function (c) {
    return '- ' + (c.nome || '—') + ' | tel: ' + (c.telefone || 'sem telefone') + ' | 0 Kz | sem nenhuma venda registada';
  });
  var linhasComVenda = clientesComVenda.map(function (c) {
    var nome = c.nome || '—';
    var nomeKey = String(nome).trim();
    var gasto = gastoPorCliente[nomeKey] || 0;
    var ultima = ultimaCompraPorCliente[nomeKey];
    var dias = ultima ? Math.floor((hojeD - new Date(ultima + 'T12:00:00')) / 86400000) : null;
    return '- ' + nome + ' | tel: ' + (c.telefone || 'sem telefone') + ' | gasto: ' + gasto + ' Kz | última visita: ' +
      (dias !== null ? 'há ' + dias + ' dias (' + ultima + ')' : 'desconhecido');
  });

  var linhasEliminados = clientesEliminados.map(function (c) {
    return '- ' + (c.nome || '—') + ' (eliminado)';
  });

  /* ---- Serviços activos (catálogo completo) ---- */
  var servicosActivos = (state.servicos || []).filter(isActivo);
  var linhasServicos = servicosActivos.map(function (s) {
    var preco = s.precoBase != null ? s.precoBase : (s.preco != null ? s.preco : '—');
    return '- ' + (s.nome || '—') + ' | preço base: ' + preco + ' Kz';
  });

  /* ---- Profissionais activos ---- */
  var profsActivos = (state.profissionais || []).filter(isActivo);
  var linhasProfs = profsActivos.map(function (p) {
    return '- ' + (p.nome || '—') +
      (p.especialidade ? ' | especialidade: ' + p.especialidade : '') +
      (p.taxa_comissao != null ? ' | comissão: ' + p.taxa_comissao + '%' : '');
  });

  /* ---- Agenda detalhada ---- */
  var linhasAgProx = agProximos
    .slice()
    .sort(function (a, b) { return String(a.data + a.hora).localeCompare(String(b.data + b.hora)); })
    .map(function (a) {
      return '- ' + a.data + ' ' + String(a.hora || '').slice(0, 5) +
        ' | ' + (a.cliente || '—') + ' | ' + (a.servico || '—') +
        ' | ' + (a.profissional || '—') + ' | status: ' + stAg(a);
    });

  var linhasAgHist = agHistorico
    .slice()
    .sort(function (a, b) { return String(b.data + b.hora).localeCompare(String(a.data + a.hora)); })
    .slice(0, 80)
    .map(function (a) {
      return '- ' + a.data + ' ' + String(a.hora || '').slice(0, 5) +
        ' | ' + (a.cliente || '—') + ' | ' + (a.servico || '—') +
        ' | status: ' + stAg(a);
    });

  var planoAtual = (typeof getPlanoAtual === 'function') ? getPlanoAtual() : (state.config && state.config.plano) || 'trial';
  var diasTrial = planoAtual === 'trial' && typeof getDiasTrialRestantes === 'function' ? getDiasTrialRestantes() : null;
  var waPlataforma = (typeof WHATSAPP_NUMBER !== 'undefined' && WHATSAPP_NUMBER) ? WHATSAPP_NUMBER : '953980750';

  return (
    'SALÃO: ' + (state.config && state.config.storeName ? state.config.storeName : '—') + '\n' +
    'DATA DE HOJE: ' + hojeStr + '\n' +
    'PLANO ACTUAL: ' + planoAtual + (diasTrial !== null ? ' (restam ' + diasTrial + ' dias de teste)' : '') + '\n' +
    '\n' +
    'CONTACTO DE SUPORTE DA PLATAFORMA BELEZAPRO (WhatsApp):\n' +
    '- Número: ' + waPlataforma + '\n' +
    '- Este número é APENAS suporte técnico da plataforma BelezaPro.\n' +
    '- NÃO é o telefone do dono nem do administrador deste salão.\n' +
    '- Oferece este número SOMENTE se o utilizador reportar problema com a plataforma (login, plano, bug, cobrança).\n' +
    '- Se perguntarem "número do administrador do salão" e não houver telefone do salão nos dados, diz que não tens o contacto do salão e oferece o suporte da plataforma se for questão técnica.\n' +
    '\n' +
    'HOJE:\n' +
    '- Faturamento: ' + totalVendasHoje + ' Kz\n' +
    '- Vendas: ' + vendasHoje.length + '\n' +
    '- Despesas: ' + totalDespHoje + ' Kz\n' +
    '- Agendamentos: ' + agHoje.length + ' (' + agHoje.filter(function (a) { return stAg(a) === 'realizado'; }).length + ' realizados)\n' +
    '- Clientes atendidos (vendas): ' + clientesUnicos + '\n' +
    '\n' +
    '======== FICHA DE CLIENTES (FONTE DE VERDADE DA ABA CLIENTES) ========\n' +
    'IMPORTANTE: Esta lista vem da ficha cadastral (state.clientes). NÃO uses só nomes de vendas.\n' +
    'RESUMO CLIENTES:\n' +
    '- Total activos na ficha: ' + clientesActivos.length + '\n' +
    '- Com pelo menos 1 venda: ' + clientesComVenda.length + '\n' +
    '- SEM nenhuma venda registada: ' + clientesSemVenda.length + '\n' +
    '\n' +
    'CLIENTES SEM NENHUMA VENDA (' + clientesSemVenda.length + ') — ESTÃO cadastrados; é PROIBIDO dizer que não existem:\n' +
    (linhasSemVenda.length ? linhasSemVenda.join('\n') : '- Nenhum (todos os activos já têm venda)') + '\n' +
    '\n' +
    'TODOS OS CLIENTES ACTIVOS DA FICHA (' + clientesActivos.length + '):\n' +
    (linhasClientes.length ? linhasClientes.join('\n') : '- Nenhum') + '\n' +
    '======== FIM FICHA DE CLIENTES ========\n' +
    '\n' +
    'ÚLTIMOS 30 DIAS:\n' +
    '- Total faturado: ' + totalVendas30 + ' Kz\n' +
    '- Total vendas: ' + vendas30.length + '\n' +
    '- Ticket médio: ' + ticketMedio + ' Kz\n' +
    '- Taxa de cancelamento de agendamentos: ' + taxaCancelamento + '%\n' +
    '\n' +
    'ESTA SEMANA vs SEMANA ANTERIOR:\n' +
    '- Esta semana: ' + totalSemanaAtual + ' Kz\n' +
    '- Semana anterior: ' + totalSemanaAnterior + ' Kz\n' +
    '- Variação: ' + (totalSemanaAnterior > 0 ? Math.round(((totalSemanaAtual - totalSemanaAnterior) / totalSemanaAnterior) * 100) : 0) + '%\n' +
    '\n' +
    'FATURAMENTO POR DIA (calendário completo com movimentos):\n' +
    (linhasDia.length ? linhasDia.join('\n') : '- Sem movimentos registados') + '\n' +
    '\n' +
    'POR PROFISSIONAL (30 dias):\n' +
    (Object.keys(byProf).length ? Object.keys(byProf).map(function (k) { return '- ' + k + ': ' + byProf[k] + ' Kz'; }).join('\n') : '- Sem dados') + '\n' +
    '\n' +
    'SERVIÇOS MAIS VENDIDOS (30 dias):\n' +
    (Object.keys(byServ).length
      ? Object.keys(byServ).sort(function (a, b) { return byServ[b] - byServ[a]; }).slice(0, 10).map(function (k) { return '- ' + k + ': ' + byServ[k] + 'x'; }).join('\n')
      : '- Sem dados') + '\n' +
    'SERVIÇO MENOS VENDIDO (30 dias): ' + (servicoMenosVendido ? (servicoMenosVendido[0] + ' (' + servicoMenosVendido[1] + 'x)') : 'Sem dados') + '\n' +
    '\n' +
    'CATÁLOGO DE SERVIÇOS ACTIVOS:\n' +
    (linhasServicos.length ? linhasServicos.join('\n') : '- Nenhum serviço activo') + '\n' +
    '\n' +
    'RESUMO CLIENTES:\n' +
    '- Total activos na ficha: ' + clientesActivos.length + '\n' +
    '- Com pelo menos 1 venda: ' + clientesComVenda.length + '\n' +
    '- SEM nenhuma venda registada: ' + clientesSemVenda.length + '\n' +
    '- Eliminados (não usar como activos): ' + clientesEliminados.length + '\n' +
    '\n' +
    'CLIENTES SEM NENHUMA VENDA (' + clientesSemVenda.length + ') — estes ESTÃO cadastrados; NÃO digas que não existem:\n' +
    (linhasSemVenda.length ? linhasSemVenda.join('\n') : '- Nenhum (todos os activos já têm pelo menos uma venda)') + '\n' +
    '\n' +
    'CLIENTES COM VENDAS (' + clientesComVenda.length + '):\n' +
    (linhasComVenda.length ? linhasComVenda.join('\n') : '- Nenhum com vendas') + '\n' +
    '\n' +
    'CLIENTES ACTIVOS — LISTA COMPLETA (' + clientesActivos.length + '):\n' +
    (linhasClientes.length ? linhasClientes.join('\n') : '- Nenhum cliente activo') + '\n' +
    '\n' +
    'CLIENTES ELIMINADOS (' + clientesEliminados.length + ') — se perguntarem por estes nomes, diz que já foram eliminados:\n' +
    (linhasEliminados.length ? linhasEliminados.join('\n') : '- Nenhum') + '\n' +
    '\n' +
    'PROFISSIONAIS ACTIVOS:\n' +
    (linhasProfs.length ? linhasProfs.join('\n') : '- Nenhum') + '\n' +
    '\n' +
    'AGENDA — PRÓXIMOS 14 DIAS (' + agProximos.length + '):\n' +
    (linhasAgProx.length ? linhasAgProx.join('\n') : '- Sem marcações') + '\n' +
    '\n' +
    'AGENDA — HISTÓRICO 14 DIAS ANTERIORES (amostra):\n' +
    (linhasAgHist.length ? linhasAgHist.join('\n') : '- Sem histórico recente') + '\n'
  );
}

// ====================================================================
//  IA – perguntarIA, nome, histórico
// ====================================================================
let iaHistorico = [];
function bpResetIaHistorico() {
  iaHistorico = [];
  try {
    if (typeof window !== 'undefined') window.iaHistorico = iaHistorico;
  } catch (_) {}
  try {
    var chat = document.getElementById('ia-chat');
    if (chat) chat.innerHTML = '';
    if (typeof atualizarEstadoVazioIA === 'function') atualizarEstadoVazioIA();
  } catch (_) {}
}
if (typeof window !== 'undefined') {
  window.bpResetIaHistorico = bpResetIaHistorico;
  window.iaHistorico = iaHistorico;
}


function _bpIaDataOffset(dias) {
  /* Data local YYYY-MM-DD relativa a hoje() — evita UTC de toISOString */
  var base = (typeof hoje === 'function') ? hoje() : null;
  var d = base ? new Date(base + 'T12:00:00') : new Date();
  if (isNaN(d.getTime())) d = new Date();
  d.setDate(d.getDate() + (Number(dias) || 0));
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function _bpIaSt(a) {
  if (typeof _statusAg === 'function') return _statusAg(a);
  return String((a && (a.status || a.estado)) || 'agendado').toLowerCase();
}
function _bpIaNum(v) { var n = Number(v); return isFinite(n) ? n : 0; }
function _bpIaItemValor(it) {
  if (!it) return 0;
  var sub = _bpIaNum(it.subtotal);
  if (sub) return sub;
  var q = _bpIaNum(it.quantidade); if (!q) q = 1;
  var pu = it.precoUnit != null ? it.precoUnit : (it.preco != null ? it.preco : 0);
  return q * _bpIaNum(pu);
}

/** Soma valor de movimentos com filtro opcional (evita loops duplicados). */
function _bpIaSomaMovs(movs, pred) {
  var s = 0;
  var list = movs || [];
  for (var i = 0; i < list.length; i++) {
    var m = list[i];
    if (pred && !pred(m)) continue;
    s += _bpIaNum(m.valor);
  }
  return s;
}

/** Fluxo de um dia: vendas, despesas, fluxo. Fallback 0 se sem dados. */
function _bpIaFluxoDia(movs, dataStr) {
  var v = 0, d = 0;
  var list = movs || [];
  for (var i = 0; i < list.length; i++) {
    var m = list[i];
    if (!m || m.data !== dataStr) continue;
    if (m.tipo === 'venda') v += _bpIaNum(m.valor);
    else if (m.tipo === 'despesa') d += _bpIaNum(m.valor);
  }
  return { vendas: v, despesas: d, fluxo: v - d };
}

/** Métricas base do dia com fallback seguro (nunca NaN/undefined). */
function _bpIaMetricasBase() {
  var movs = (state && Array.isArray(state.movimentos)) ? state.movimentos : [];
  var ags = (state && Array.isArray(state.agendamentos)) ? state.agendamentos : [];
  var hojeStr = (typeof hoje === 'function') ? hoje() : _bpIaDataOffset(0);
  var fluxo = _bpIaFluxoDia(movs, hojeStr);
  var fundo = _bpIaNum(state && state.config && state.config.fundo);
  return {
    movs: movs,
    ags: ags,
    hojeStr: hojeStr,
    vendas: fluxo.vendas,
    despesas: fluxo.despesas,
    fluxo: fluxo.fluxo,
    fundo: fundo,
    saldoEst: fundo + fluxo.fluxo,
    pronto: !!(state && Array.isArray(state.movimentos) && Array.isArray(state.agendamentos))
  };
}

function renderIAResumo() {
  var base = _bpIaMetricasBase();
  if (!base.pronto) {
    var listaWait = document.getElementById('ia-insights-list');
    if (listaWait) {
      listaWait.innerHTML = '<div class="ia-insight-row"><span>A carregar dados do salão…</span></div>';
    }
    return;
  }
  var movs = base.movs;
  var ags = base.ags;
  var hojeStr = base.hojeStr;
  var hojeD = new Date(hojeStr + 'T12:00:00');
  var vendasHoje = movs.filter(function (m) { return m.data === hojeStr && m.tipo === 'venda'; });
  var totalHoje = base.vendas;
  var totalDespHoje = base.despesas;
  var fundo = base.fundo;
  var fluxoHoje = base.fluxo;
  var saldoEst = base.saldoEst;

  var agHoje = ags.filter(function (a) { return a.data === hojeStr; });
  var pendentesHoje = agHoje.filter(function (a) {
    var st = _bpIaSt(a);
    return st === 'agendado' || (!st);
  }).length;
  var clientesHoje = new Set(vendasHoje.map(function (v) { return v.cliente; }).filter(Boolean)).size;

  var elFat = document.getElementById('ia-resumo-fat');
  if (elFat) elFat.textContent = fmtKz(totalHoje);

  var dias7Fat = [];
  for (var i = 1; i <= 7; i++) {
    dias7Fat.push(_bpIaFluxoDia(movs, _bpIaDataOffset(-i)).vendas);
  }
  var media7 = dias7Fat.reduce(function (s, v) { return s + v; }, 0) / 7;
  var fatTrendEl = document.getElementById('ia-resumo-fat-trend');
  if (fatTrendEl) {
    if (media7 > 0) {
      var variacaoFat = Math.round(((totalHoje - media7) / media7) * 100);
      fatTrendEl.innerHTML = '<span style="color:' + (variacaoFat >= 0 ? 'var(--green)' : 'var(--red)') + '">' +
        (variacaoFat >= 0 ? '↑' : '↓') + ' ' + Math.abs(variacaoFat) + '%</span> vs média 7 dias';
    } else {
      fatTrendEl.textContent = totalHoje > 0 ? 'sem histórico de 7 dias' : 'sem vendas recentes';
    }
  }

  var elCli = document.getElementById('ia-resumo-clientes');
  if (elCli) elCli.textContent = String((state.clientes || []).length);
  var elCliSub = document.getElementById('ia-resumo-clientes-sub');
  if (elCliSub) elCliSub.textContent = clientesHoje + (clientesHoje === 1 ? ' atendido hoje' : ' atendidos hoje');

  var elAg = document.getElementById('ia-resumo-ag');
  if (elAg) elAg.textContent = String(agHoje.length);
  var elAgSub = document.getElementById('ia-resumo-ag-sub');
  if (elAgSub) elAgSub.textContent = pendentesHoje + (pendentesHoje === 1 ? ' pendente' : ' pendentes');

  /* ---- Insights: prioridade (1 atenção → 3 info), máx. 5 ---- */
  var insights = [];
  function pushIns(prio, icone, cor, texto) {
    insights.push({ prio: prio, icone: icone, cor: cor, texto: texto });
  }

  /* Ticket médio hoje vs dias com venda nos últimos 7 */
  var ticketHoje = vendasHoje.length > 0 ? totalHoje / vendasHoje.length : 0;
  var ticketsDias7 = [];
  for (var t = 1; t <= 7; t++) {
    var dts = _bpIaDataOffset(-t);
    var vd = movs.filter(function (m) { return m.data === dts && m.tipo === 'venda'; });
    if (vd.length > 0) {
      var sum = vd.reduce(function (s, v) { return s + _bpIaNum(v.valor); }, 0);
      ticketsDias7.push(sum / vd.length);
    }
  }
  if (ticketHoje > 0 && ticketsDias7.length > 0) {
    var mediaTicket7 = ticketsDias7.reduce(function (s, v) { return s + v; }, 0) / ticketsDias7.length;
    if (mediaTicket7 > 0) {
      var variacaoTicket = Math.round(((ticketHoje - mediaTicket7) / mediaTicket7) * 100);
      var down = variacaoTicket < -8;
      pushIns(down ? 1 : 2, 'trend', variacaoTicket >= 0 ? 'var(--green)' : 'var(--red)',
        'Hoje o ticket médio ' + (variacaoTicket >= 0 ? 'subiu' : 'desceu') +
        ' <strong>' + Math.abs(variacaoTicket) + '%</strong> face à média dos últimos dias com vendas.');
    }
  } else if (totalHoje === 0 && media7 > 0) {
    pushIns(1, 'trend', 'var(--text-secondary)',
      'Ainda <strong>sem vendas hoje</strong>. A média dos últimos 7 dias foi ' + fmtKz(Math.round(media7)) + '.');
  }

  /* Clientes inactivos > 30 dias */
  var ultimaCompraPorCliente = {};
  movs.forEach(function (v) {
    if (v.tipo !== 'venda' || !v.cliente) return;
    var nome = String(v.cliente).trim();
    if (!nome) return;
    if (!ultimaCompraPorCliente[nome] || v.data > ultimaCompraPorCliente[nome]) {
      ultimaCompraPorCliente[nome] = v.data;
    }
  });
  var inativos = 0;
  Object.keys(ultimaCompraPorCliente).forEach(function (nome) {
    var data = ultimaCompraPorCliente[nome];
    var dias = Math.floor((hojeD - new Date(data + 'T12:00:00')) / 86400000);
    if (dias > 30) inativos++;
  });
  if (inativos > 0) {
    pushIns(1, 'user', 'var(--text-secondary)',
      inativos === 1
        ? 'Existe <strong>1 cliente</strong> sem regressar há mais de 30 dias — oportunidade de reactivação.'
        : 'Existem <strong>' + inativos + ' clientes</strong> sem regressar há mais de 30 dias — priorize contacto.');
  }

  /* Serviço campeão da semana — % sobre soma dos itens (consistente) */
  var iniSemanaStr = _bpIaDataOffset(-6);
  var vendasSemana = movs.filter(function (m) {
    return m.tipo === 'venda' && m.data >= iniSemanaStr && m.data <= hojeStr;
  });
  var receitaPorServico = {};
  var receitaItensSemana = 0;
  var receitaSemanaTotal = 0;
  vendasSemana.forEach(function (v) {
    receitaSemanaTotal += _bpIaNum(v.valor);
    if (v.itens && Array.isArray(v.itens) && v.itens.length) {
      v.itens.forEach(function (it) {
        if (!it || !it.nome) return;
        var val = _bpIaItemValor(it);
        receitaPorServico[it.nome] = (receitaPorServico[it.nome] || 0) + val;
        receitaItensSemana += val;
      });
    }
  });
  var servicosOrdenados = Object.keys(receitaPorServico).map(function (k) {
    return [k, receitaPorServico[k]];
  }).sort(function (a, b) { return b[1] - a[1]; });
  var baseServ = receitaItensSemana > 0 ? receitaItensSemana : receitaSemanaTotal;
  if (servicosOrdenados.length > 0 && baseServ > 0) {
    var nomeServico = servicosOrdenados[0][0];
    var receitaServico = servicosOrdenados[0][1];
    var pct = Math.round((receitaServico / baseServ) * 100);
    if (pct > 100) pct = 100;
    var conc = pct >= 45;
    pushIns(conc ? 1 : 2, 'star', 'var(--gold-dark)',
      'O serviço "<strong>' + escHtml(nomeServico) + '</strong>" concentra <strong>' + pct + '%</strong> da receita de itens desta semana' +
      (conc ? ' — dependência elevada num único serviço.' : '.'));
  } else if (receitaSemanaTotal > 0) {
    pushIns(2, 'star', 'var(--text-secondary)',
      'Há receita esta semana, mas as vendas sem linhas de item limitam o ranking de serviços.');
  }

  /* Fluxo diário (vendas − despesas) vs média 30 dias — explícito, não confunde com fundo */
  var fluxos30 = [];
  for (var f = 0; f <= 29; f++) {
    fluxos30.push(_bpIaFluxoDia(movs, _bpIaDataOffset(-f)).fluxo);
  }
  var fluxo0 = fluxos30[0];
  var mediaFluxo = fluxos30.slice(1).reduce(function (s, v) { return s + v; }, 0) / 29;
  var temMov30 = fluxos30.some(function (s) { return s !== 0; });
  if (temMov30) {
    var abaixo = fluxo0 < mediaFluxo;
    pushIns(abaixo ? 1 : 2, 'wallet', abaixo ? 'var(--red)' : 'var(--green)',
      'O fluxo de hoje (vendas − despesas) está <strong>' + (abaixo ? 'abaixo' : 'acima') +
      '</strong> da média dos últimos 30 dias' +
      (fundo ? ' · saldo estimado com fundo: ' + fmtKz(saldoEst) : '') + '.');
  } else if (fundo > 0 && totalHoje === 0) {
    pushIns(2, 'wallet', 'var(--text-secondary)',
      'Sem movimentos hoje. Fundo de caixa: <strong>' + fmtKz(fundo) + '</strong>.');
  }

  /* Agenda amanhã — status via _statusAg */
  var amanhaStr = _bpIaDataOffset(1);
  var agAmanha = ags.filter(function (a) {
    if (a.data !== amanhaStr) return false;
    var st = _bpIaSt(a);
    return st !== 'cancelado';
  });
  var agAmanhaActivos = agAmanha.filter(function (a) {
    var st = _bpIaSt(a);
    return st === 'agendado';
  });
  if (agAmanhaActivos.length > 0) {
    pushIns(2, 'calendar', 'var(--text-secondary)',
      'Amanhã tem <strong>' + agAmanhaActivos.length +
      (agAmanhaActivos.length === 1 ? ' agendamento</strong> activo.' : ' agendamentos</strong> activos.'));
  } else {
    pushIns(1, 'calendar', 'var(--text-secondary)',
      'Ainda <strong>não há agendamentos activos</strong> para amanhã — preencha a agenda.');
  }

  /* Pendentes de hoje em atraso (hora já passou e ainda agendado) */
  var agora = new Date();
  var atrasados = agHoje.filter(function (a) {
    if (_bpIaSt(a) !== 'agendado') return false;
    var hora = String(a.hora || '00:00').slice(0, 5);
    var ad = new Date(a.data + 'T' + hora + ':00');
    return !isNaN(ad.getTime()) && ad < agora;
  }).length;
  if (atrasados > 0) {
    pushIns(1, 'calendar', 'var(--red)',
      atrasados === 1
        ? 'Há <strong>1 marcação de hoje</strong> em atraso por finalizar ou actualizar.'
        : 'Há <strong>' + atrasados + ' marcações de hoje</strong> em atraso por finalizar ou actualizar.');
  }

  insights.sort(function (a, b) { return a.prio - b.prio; });
  if (insights.length > 5) insights = insights.slice(0, 5);

  var iconesSvg = {
    trend: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9"/></svg>',
    wallet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="15" height="15" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'
  };
  var listaEl = document.getElementById('ia-insights-list');
  if (listaEl) {
    var bgPorCor = {
      'var(--green)': 'var(--green-50)',
      'var(--red)': 'var(--red-50)',
      'var(--gold-dark)': 'var(--gold-50)',
      'var(--text-secondary)': 'var(--neutral-75)'
    };
    listaEl.innerHTML = insights.map(function (ins) {
      return '<div class="ia-insight-row"><span class="ia-insight-icone" style="color:' + ins.cor +
        ';background:' + (bgPorCor[ins.cor] || 'var(--neutral-75)') + '">' +
        (iconesSvg[ins.icone] || '') + '</span><span>' + ins.texto + '</span></div>';
    }).join('') || '<div class="ia-insight-row"><span>Ainda sem dados suficientes para gerar insights.</span></div>';
  }

  var fim7 = _bpIaDataOffset(7);
  var agProximos = ags.filter(function (a) {
    if (!a.data || a.data < hojeStr || a.data > fim7) return false;
    return _bpIaSt(a) === 'agendado';
  }).length;

  if (typeof renderIASugestoesAdaptativas === 'function') {
    renderIASugestoesAdaptativas({
      totalHoje: totalHoje,
      totalDespHoje: totalDespHoje,
      fluxoHoje: fluxoHoje,
      media7: media7,
      inativos: inativos,
      pendentesHoje: pendentesHoje,
      atrasados: atrasados,
      agAmanha: agAmanhaActivos.length,
      agProximos: agProximos,
      ticketHoje: ticketHoje,
      temServicoTop: servicosOrdenados.length > 0
    });
  }
}

function renderIASugestoesAdaptativas(ctx) {
  var grid = document.querySelector('#tab-ia .ia-sugestoes-grid');
  if (!grid || !ctx) return;

  var pool = [];
  function add(score, label, pergunta, tone) {
    pool.push({ score: score, label: label, pergunta: pergunta, tone: tone || 'ia-sug-graphite' });
  }

  /* Atenção primeiro */
  if (ctx.atrasados > 0) {
    add(100, 'Marcações em atraso', 'Quais marcações de hoje estão pendentes?', 'ia-sug-gold');
  }
  if (ctx.totalHoje === 0 && ctx.media7 > 0) {
    add(95, 'Receita hoje', 'Qual foi a minha receita hoje?', 'ia-sug-green');
  } else {
    add(40, 'Receita hoje', 'Qual foi a minha receita hoje?', 'ia-sug-green');
  }
  if (ctx.inativos > 0) {
    add(90, 'Clientes inactivos', 'Quais clientes estão inativos?', 'ia-sug-gold');
  } else {
    add(35, 'Clientes VIP', 'Quem são os meus clientes VIP?', 'ia-sug-gold');
  }
  if (ctx.agAmanha === 0) {
    add(88, 'Agenda amanhã', 'O que tenho agendado para amanhã?', 'ia-sug-green');
  } else {
    add(50, 'Agenda amanhã', 'O que tenho agendado para amanhã?', 'ia-sug-green');
  }
  if (ctx.fluxoHoje < 0 || ctx.totalDespHoje > ctx.totalHoje) {
    add(85, 'Fluxo de caixa', 'Como está o fluxo de caixa?', 'ia-sug-gold');
  } else {
    add(45, 'Fluxo de caixa', 'Como está o fluxo de caixa?', 'ia-sug-gold');
  }
  if (ctx.temServicoTop) {
    add(55, 'Serviço campeão', 'Qual é o meu serviço mais vendido?', 'ia-sug-graphite');
  }
  add(42, 'Ticket médio', 'Qual é o meu ticket médio?', 'ia-sug-graphite');
  if (ctx.pendentesHoje > 0) {
    add(60, 'Agenda de hoje', 'Como está a minha agenda?', 'ia-sug-green');
  }
  /* Calendário externo (.ics) — reutiliza BPOps.downloadIcs se existir */
  if (ctx.agProximos > 0 && window.BPOps && typeof window.BPOps.downloadIcs === 'function') {
    add(72, 'Exportar calendário', '__bp_export_ics__', 'ia-sug-graphite');
  } else if (ctx.agAmanha > 0 && window.BPOps && typeof window.BPOps.downloadIcs === 'function') {
    add(65, 'Exportar calendário', '__bp_export_ics__', 'ia-sug-graphite');
  }

  pool.sort(function (a, b) { return b.score - a.score; });
  /* Intercalar: evitar dois tons iguais seguidos quando possível */
  var picked = [];
  var usedLabel = {};
  for (var i = 0; i < pool.length && picked.length < 6; i++) {
    var c = pool[i];
    if (usedLabel[c.label]) continue;
    if (picked.length && picked[picked.length - 1].tone === c.tone) {
      var swap = null;
      for (var j = i + 1; j < pool.length; j++) {
        if (!usedLabel[pool[j].label] && pool[j].tone !== c.tone) { swap = pool[j]; pool[j] = c; break; }
      }
      if (swap) c = swap;
    }
    usedLabel[c.label] = true;
    picked.push(c);
  }

  var svg = {
    'ia-sug-green': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 18 8.5 10.5 13.5 15.5 23 6"/><polyline points="17 6 23 6 23 12"/></svg>',
    'ia-sug-gold': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    'ia-sug-graphite': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9"/></svg>'
  };
  grid.innerHTML = picked.map(function (c) {
    return '<button type="button" class="ia-sugestao-card" data-pergunta="' +
      String(c.pergunta).replace(/"/g, '&quot;') + '">' +
      '<span class="ia-sugestao-icone ' + c.tone + '">' + (svg[c.tone] || svg['ia-sug-graphite']) + '</span>' +
      '<span>' + c.label + '</span></button>';
  }).join('');
}

function chaveIAPerguntas() {
  return 'ia_perguntas_' + ((state.config && state.config.salaoId) || 'local') + '_' + hoje();
}

function getUsoIAHoje() {
  return parseInt(localStorage.getItem(chaveIAPerguntas()) || '0', 10) || 0;
}

function setUsoIAHoje(n) {
  localStorage.setItem(chaveIAPerguntas(), String(Math.max(0, n | 0)));
  actualizarContadorIA();
  // ET4.6: propagar contador para Supabase (salao_config + tabela ia_uso_diario se existir)
  try {
    if (typeof bpPushIAUsoToSupabase === 'function') {
      Promise.resolve(bpPushIAUsoToSupabase(Math.max(0, n | 0))).then(function (ok) {
        if (ok === false && navigator.onLine && typeof toast === 'function') {
          if (!window.__bpIaPushFailToast) {
            window.__bpIaPushFailToast = true;
            toast('Falha ao sincronizar uso da IA. Tente novamente mais tarde.', 'warning');
            setTimeout(function () { window.__bpIaPushFailToast = false; }, 60000);
          }
        }
      }).catch(function () {});
    }
  } catch (_) {}
}

/** Lê uso remoto e fica com max(local, remoto) — multi-dispositivo no mesmo dia. */
async function bpPullIAUsoFromSupabase() {
  try {
    if (!navigator.onLine || !state.config || !state.config.salaoId) return null;
    if (typeof supabaseClient === 'undefined' || !supabaseClient) return null;
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session || !session.access_token) return null;
    const dia = typeof hoje === 'function' ? hoje() : new Date().toISOString().slice(0, 10);
    const headers = {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + session.access_token
    };
    // Preferir tabela dedicada
    let remote = null;
    try {
      const r1 = await fetch(
        SUPABASE_URL + '/rest/v1/ia_uso_diario?salao_id=eq.' + encodeURIComponent(state.config.salaoId) +
        '&dia=eq.' + encodeURIComponent(dia) + '&select=perguntas',
        { headers: headers }
      );
      if (r1.ok) {
        const rows = await r1.json();
        if (rows && rows[0] && rows[0].perguntas != null) remote = parseInt(rows[0].perguntas, 10);
      }
    } catch (_) {}
    // Fallback salao_config
    if (remote == null || isNaN(remote)) {
      try {
        const r2 = await fetch(
          SUPABASE_URL + '/rest/v1/salao_config?salao_id=eq.' + encodeURIComponent(state.config.salaoId) +
          '&select=ia_perguntas_hoje,ia_perguntas_dia',
          { headers: headers }
        );
        if (r2.ok) {
          const rows = await r2.json();
          if (rows && rows[0]) {
            const d = rows[0].ia_perguntas_dia;
            if (d === dia && rows[0].ia_perguntas_hoje != null) {
              remote = parseInt(rows[0].ia_perguntas_hoje, 10);
            }
          }
        }
      } catch (_) {}
    }
    if (remote == null || isNaN(remote)) return null;
    const local = getUsoIAHoje();
    if (remote > local) setUsoIAHoje(remote);
    return remote;
  } catch (e) {
    return null;
  }
}

async function bpPushIAUsoToSupabase(n) {
  try {
    if (!navigator.onLine || !state.config || !state.config.salaoId) return false;
    if (typeof supabaseClient === 'undefined' || !supabaseClient) return false;
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session || !session.access_token) return false;
    const dia = typeof hoje === 'function' ? hoje() : new Date().toISOString().slice(0, 10);
    const headers = {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + session.access_token,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=minimal'
    };
    var okAny = false;
    // Tabela ia_uso_diario (PK salao_id+dia)
    try {
      var r1 = await fetch(SUPABASE_URL + '/rest/v1/ia_uso_diario', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          salao_id: state.config.salaoId,
          dia: dia,
          perguntas: n,
          updated_at: new Date().toISOString()
        })
      });
      if (!r1.ok) {
        var t1 = '';
        try { t1 = await r1.text(); } catch (_) {}
        console.error('[IA Push] ia_uso_diario', r1.status, t1);
      } else {
        okAny = true;
      }
    } catch (e1) {
      console.error('[IA Push] ia_uso_diario exception', e1);
    }
    // Espelho em salao_config
    try {
      var r2 = await fetch(
        SUPABASE_URL + '/rest/v1/salao_config?salao_id=eq.' + encodeURIComponent(state.config.salaoId),
        {
          method: 'PATCH',
          headers: headers,
          body: JSON.stringify({
            ia_perguntas_hoje: n,
            ia_perguntas_dia: dia,
            updated_at: new Date().toISOString()
          })
        }
      );
      if (!r2.ok) {
        var t2 = '';
        try { t2 = await r2.text(); } catch (_) {}
        console.error('[IA Push] salao_config', r2.status, t2);
      } else {
        okAny = true;
      }
    } catch (e2) {
      console.error('[IA Push] salao_config exception', e2);
    }
    return okAny;
  } catch (e) {
    console.error('[IA Push] falha', e);
    return false;
  }
}

if (typeof window !== 'undefined') {
  window.bpPullIAUsoFromSupabase = bpPullIAUsoFromSupabase;
  window.bpPushIAUsoToSupabase = bpPushIAUsoToSupabase;
}


/** Estado real da aba IA — nunca “Online” falso. */
function _bpIaIsOnline() {
  try { return navigator.onLine !== false; } catch (_) { return true; }
}
function _bpIaSetComposerStatus(text) {
  var el = document.getElementById('ia-status');
  if (el) el.textContent = text || '';
}
function _bpIaSetHeaderStatus(kind, detail) {
  var line = document.getElementById('ia-status-line-text');
  var root = document.querySelector('#tab-ia .ia-status-line');
  if (!line && root) {
    /* fallback: actualiza texto do nó de linha */
    var sep = root.querySelector('.ia-status-sep');
    if (sep && sep.nextSibling) {
      /* ignore */
    }
  }
  if (line) {
    if (kind === 'offline') line.textContent = 'Offline — respostas locais quando possível';
    else if (kind === 'busy') line.textContent = detail || 'A processar…';
    else if (kind === 'error') line.textContent = detail || 'Indisponível de momento';
    else if (kind === 'local') line.textContent = 'Dados locais do salão';
    else line.textContent = 'Pronta a analisar o seu negócio';
  }
  if (root) {
    root.setAttribute('data-ia-conn', kind === 'offline' ? 'offline' : (kind === 'error' ? 'error' : 'ok'));
    var dot = root.querySelector('.ia-status-dot');
    if (dot) {
      dot.setAttribute('data-state', kind === 'offline' ? 'offline' : (kind === 'busy' ? 'busy' : (kind === 'error' ? 'error' : 'ok')));
    }
  }
  var label = document.getElementById('ia-status-line-label');
  if (label) {
    if (kind === 'offline') label.textContent = 'Offline';
    else if (kind === 'busy') label.textContent = 'A trabalhar';
    else if (kind === 'error') label.textContent = 'Aviso';
    else label.textContent = 'Ligado';
  }
}
function atualizarIAOffline() {
  var online = _bpIaIsOnline();
  var overlay = document.getElementById('ia-offline-overlay');
  if (overlay) {
    overlay.style.display = 'none';
    overlay.setAttribute('aria-hidden', 'true');
  }
  if (!_iaBusy) {
    if (!online) {
      _bpIaSetHeaderStatus('offline');
      _bpIaSetComposerStatus('Modo local');
    } else {
      _bpIaSetHeaderStatus('ok');
      _bpIaSetComposerStatus('IA pronta');
    }
  }
  return online;
}
try {
  window.addEventListener('online', function () { try { atualizarIAOffline(); } catch (_) {} });
  window.addEventListener('offline', function () { try { atualizarIAOffline(); } catch (_) {} });
} catch (_) {}

function actualizarContadorIA() {
  const cont = document.getElementById('ia-contador');
  if (!cont) return;
  const plano = typeof getPlanoAtual === 'function' ? getPlanoAtual() : 'trial';
  const info = (typeof PLANOS !== 'undefined' && PLANOS[plano]) ? PLANOS[plano] : { iaDia: 0 };
  const usadas = getUsoIAHoje();
  const lim = info.iaDia;
  if (!lim || lim === 0) {
    cont.textContent = usadas + ' · plano sem cota IA';
    return;
  }
  if (lim === Infinity) {
    cont.textContent = String(usadas) + ' hoje';
    return;
  }
  cont.textContent = usadas + ' / ' + lim;
}

function normalizarPerguntaIA(q) {
  return String(q || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Respostas determinísticas a partir dos dados locais (sem gastar cota da API).
 * Devolve string ou null se não houver intenção clara.
 */
function responderIALocal(pergunta) {
  var raw = String(pergunta || '').trim();
  var q = (typeof normalizarPerguntaIA === 'function')
    ? normalizarPerguntaIA(raw)
    : raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

  if (!q || q.length < 3) return null;
  if (!state || !state.clientes) return null;

  /* ---- Ficha de clientes (determinístico — nunca LLM) ---- */
  var _isAct = function (x) {
    return x && x.ativo !== false && x.ativo !== 0 && x.ativo !== 'false';
  };
  var _activos = (state.clientes || []).filter(_isAct);
  var _gasto = {};
  (state.movimentos || []).forEach(function (m) {
    if (!m || m.tipo !== 'venda' || !m.cliente) return;
    var cn = String(m.cliente).trim();
    if (!cn) return;
    _gasto[cn] = (_gasto[cn] || 0) + (Number(m.valor) || 0);
  });
  var _semVenda = _activos.filter(function (c) {
    var n = String(c.nome || '').trim();
    return n && !(_gasto[n] > 0);
  });
  var _comVenda = _activos.filter(function (c) {
    var n = String(c.nome || '').trim();
    return n && (_gasto[n] > 0);
  });

  // Lista todos os clientes da ficha (sem inventar nomes de vendas)
  if (
    /(lista|listar|mostra|mostrar|quais|quem sao|quem são|todos).{0,40}clientes/.test(q) ||
    /^(clientes|todos os clientes|lista de clientes)\b/.test(q) ||
    /ficha de clientes|aba clientes/.test(q)
  ) {
    if (!_activos.length) return 'Não há clientes activos na ficha neste salão.';
    // Se pede explicitamente sem venda
    if (/(sem (nenhuma )?venda|sem compra|sem gasto|nunca compr|0 venda|nenhuma venda)/.test(q)) {
      if (!_semVenda.length) {
        return 'Na ficha há ' + _activos.length + ' cliente(s) activo(s) e todos já têm pelo menos uma venda registada.';
      }
      var linhasS = _semVenda.map(function (c, i) {
        return (i + 1) + '. ' + (c.nome || '—') + (c.telefone ? ' · ' + c.telefone : '');
      });
      return 'Clientes activos SEM nenhuma venda (' + _semVenda.length + ' de ' + _activos.length + '):\n' + linhasS.join('\n');
    }
    var linhasT = _activos.map(function (c, i) {
      var n = String(c.nome || '').trim();
      var flag = (_gasto[n] > 0) ? '' : ' · sem venda';
      return (i + 1) + '. ' + (c.nome || '—') + (c.telefone ? ' · ' + c.telefone : '') + flag;
    });
    return 'Clientes activos na ficha (' + _activos.length + '):\n' + linhasT.join('\n') +
      (_semVenda.length ? ('\n\nDestes, ' + _semVenda.length + ' ainda não têm nenhuma venda.') : '');
  }

  // Só clientes sem venda
  if (/(clientes?).{0,30}(sem (nenhuma )?venda|sem compra|sem gasto)/.test(q) ||
      /(sem (nenhuma )?venda|sem compra).{0,30}clientes?/.test(q)) {
    if (!_semVenda.length) {
      return 'Na ficha há ' + _activos.length + ' cliente(s) activo(s) e todos já têm pelo menos uma venda registada.';
    }
    var linhas2 = _semVenda.map(function (c, i) {
      return (i + 1) + '. ' + (c.nome || '—') + (c.telefone ? ' · ' + c.telefone : '');
    });
    return 'Clientes activos SEM nenhuma venda (' + _semVenda.length + '):\n' + linhas2.join('\n');
  }

  if (!state.movimentos || !state.agendamentos) return null;

  /* ---- Portão inteligente ---- */
  // Texto longo / várias frases → nunca local (manda para o modelo)
  if (raw.length > 72) return null;
  if ((raw.match(/[.?!;]/g) || []).length >= 2) return null;
  // Muitas palavras → intenção provavelmente complexa
  var palavras = q.split(/\s+/).filter(Boolean);
  if (palavras.length > 10) return null;
  // Mistura de temas (ex.: agenda + estratégia + cliente) → modelo
  var temas = 0;
  if (/(fatur|receita|vendeu|venda|vendas)/.test(q)) temas++;
  if (/(despes|gastou)/.test(q)) temas++;
  if (/(agenda|marcac)/.test(q)) temas++;
  if (/(cliente|equipa|profissional|servico)/.test(q)) temas++;
  if (/(saldo|caixa|fundo)/.test(q)) temas++;
  if (temas >= 2) return null;

  var hojeStr = typeof hoje === 'function' ? hoje() : '';
  var num = function (v) { return Number(v) || 0; };
  var vendasHoje = (state.movimentos || []).filter(function (m) {
    return m.data === hojeStr && m.tipo === 'venda';
  });
  var despHoje = (state.movimentos || []).filter(function (m) {
    return m.data === hojeStr && m.tipo === 'despesa';
  });
  var totalVendas = vendasHoje.reduce(function (s, v) { return s + num(v.valor); }, 0);
  var totalDesp = despHoje.reduce(function (s, v) { return s + num(v.valor); }, 0);
  var fundo = num(state.config && state.config.fundo);
  var saldo = fundo + totalVendas - totalDesp;
  var agHoje = (state.agendamentos || []).filter(function (a) { return a.data === hojeStr; });
  var pend = agHoje.filter(function (a) {
    var st = String(a.status || a.estado || '').toLowerCase();
    return st === 'agendado' || (!st);
  });
  var ticket = vendasHoje.length ? Math.round(totalVendas / vendasHoje.length) : 0;

  // Padrões ANCORADOS: intenção clara de métrica de HOJE (não palavra solta no meio)
  var soHoje =
    /^(quanto|qual|como)\b/.test(q) ||
    /\bhoje\b/.test(q) ||
    /^(faturamento|vendas|despesas|agenda|saldo|caixa)\b/.test(q);

  if (!soHoje && !/^(quantos|numero|nº|total de)\b/.test(q)) {
    return null;
  }

  // Faturamento / vendas hoje
  if (
    /^(quanto\s+(faturei|vendi|foi\s+o\s+faturamento)|faturamento(\s+de\s+hoje)?|vendas(\s+de\s+hoje)?|quanto\s+foi\s+hoje|receita\s+de\s+hoje)\b/.test(q) ||
    (/^(quanto|qual)\b/.test(q) && /(fatur|vendeu|vendas|receita)/.test(q) && /\bhoje\b/.test(q) && !/despes/.test(q))
  ) {
    return 'Hoje: ' + vendasHoje.length + (vendasHoje.length === 1 ? ' venda' : ' vendas') +
      ' · total ' + (typeof fmtKz === 'function' ? fmtKz(totalVendas) : totalVendas + ' Kz') +
      (ticket ? ' · ticket médio ' + (typeof fmtKz === 'function' ? fmtKz(ticket) : ticket + ' Kz') + '.' : '.');
  }

  // Despesas hoje
  if (
    /^(despesas(\s+de\s+hoje)?|quanto\s+(gastei|foi\s+de\s+despesa))\b/.test(q) ||
    (/^(quanto|qual)\b/.test(q) && /despes|gastei/.test(q))
  ) {
    return 'Despesas de hoje: ' + (typeof fmtKz === 'function' ? fmtKz(totalDesp) : totalDesp + ' Kz') +
      (despHoje.length ? ' (' + despHoje.length + (despHoje.length === 1 ? ' registo).' : ' registos).') : '.');
  }

  // Saldo / caixa
  if (/^(saldo|caixa|fundo)(\s+de\s+hoje)?\b/.test(q) || (/^(quanto|qual)\b/.test(q) && /(saldo|caixa|fundo)/.test(q))) {
    return 'Fundo ' + (typeof fmtKz === 'function' ? fmtKz(fundo) : fundo + ' Kz') +
      ' · vendas ' + (typeof fmtKz === 'function' ? fmtKz(totalVendas) : totalVendas + ' Kz') +
      ' · despesas ' + (typeof fmtKz === 'function' ? fmtKz(totalDesp) : totalDesp + ' Kz') +
      ' → saldo estimado ' + (typeof fmtKz === 'function' ? fmtKz(saldo) : saldo + ' Kz') + '.';
  }

  // Agenda hoje
  if (
    /^(agenda(\s+de\s+hoje)?|marcacoes\s+de\s+hoje|o\s+que\s+tenho\s+hoje)\b/.test(q) ||
    (/^(quantos|como)\b/.test(q) && /agenda|marcac|pendente/.test(q) && (/\bhoje\b/.test(q) || palavras.length <= 6))
  ) {
    return 'Agenda de hoje: ' + agHoje.length + ' marcações · ' + pend.length + ' pendentes.';
  }

  // Quantos clientes
  if (/^(quantos\s+clientes|numero\s+de\s+clientes|nº\s+de\s+clientes|total\s+de\s+clientes)\b/.test(q)) {
    var nc = (state.clientes || []).filter(function (c) {
      return c && c.ativo !== false && c.ativo !== 0 && c.ativo !== 'false';
    }).length;
    return 'Tem ' + nc + (nc === 1 ? ' cliente activo' : ' clientes activos') + ' na ficha.';
  }

  // Equipa
  if (/^(quantos\s+profissionais|tamanho\s+da\s+equipa|quantos\s+na\s+equipa)\b/.test(q)) {
    var np = (state.profissionais || []).filter(function (p) {
      return p && p.ativo !== false && p.ativo !== 0 && p.ativo !== 'false';
    }).length;
    return 'Equipa: ' + np + (np === 1 ? ' profissional activo.' : ' profissionais activos.');
  }

  return null;
}

let _iaBusy = false;
window.__bpIaLastMeta = { fonte: null };

async function perguntarIA(pergunta) {
  const q = String(pergunta || '').trim();
  if (!q) {
    toast('Escreva uma pergunta.', 'warning');
    return null;
  }
  if (q.length > 2000) {
    toast('Pergunta demasiado longa (máx. 2000 caracteres).', 'warning');
    return null;
  }
  if (_iaBusy) return null;

  const plano = typeof getPlanoAtual === 'function' ? getPlanoAtual() : 'trial';
  const iaDia = (typeof PLANOS !== 'undefined' && PLANOS[plano]) ? PLANOS[plano].iaDia : 0;
  if (iaDia === 0) {
    try { _bpIaSetComposerStatus('Sem cota IA neste plano'); } catch (_) {}
    mostrarModalUpgrade('O Agente IA está disponível no plano Pro (5 perguntas/dia) e Premium (ilimitado).');
    return null;
  }

  const usadas = getUsoIAHoje();
  if (iaDia !== Infinity && usadas >= iaDia) {
    try { _bpIaSetComposerStatus('Limite diário atingido'); } catch (_) {}
    if (plano === 'pro') {
      mostrarModalUpgrade('Atingiu o limite de 5 perguntas/dia do plano Pro. Faça upgrade para Premium para perguntas ilimitadas.');
    } else {
      toast('Limite de perguntas atingido para hoje.', 'warning');
    }
    return null;
  }

  // 1) Resposta local determinística (não consome cota da API)
  try {
    const local = responderIALocal(q);
    if (local) {
      iaHistorico.push({ pergunta: q, resposta: local, fonte: 'local' });
      if (iaHistorico.length > IA_HIST_MAX) iaHistorico = iaHistorico.slice(-IA_HIST_MAX);
      window.__bpIaLastMeta = { fonte: 'local' };
      return local;
    }
  } catch (eLocal) {}

  // ET4.2-P0: IA online só admin/gerente (aba já filtrada; reforço operacional)
  if (typeof bpExigirRole === 'function' && !bpExigirRole(['admin', 'gerente'], 'Não tem permissão para usar o agente IA.')) {
    return null;
  }

  const contextoRaw = buildContextoIA();
  if (contextoRaw && contextoRaw.erro) {
    toast(contextoRaw.erro, 'warning');
    return null;
  }
  const contexto = (typeof _bpIaContextoCompacto === 'function')
    ? _bpIaContextoCompacto(contextoRaw)
    : contextoRaw;
  const historicoEnvio = (typeof _bpIaHistoricoCompacto === 'function')
    ? _bpIaHistoricoCompacto(iaHistorico, 8, 900)
    : (iaHistorico || []).slice(-8);

  _iaBusy = true;
  window.__bpIaLastMeta = { fonte: null };
  try { _bpIaSetHeaderStatus('busy', 'A contactar o agente…'); _bpIaSetComposerStatus('A processar…'); } catch (_) {}
  try {
    // Auth resiliente: JWT de utilizador, com 1 retry após refresh se falhar.
    var iaHeaders = { 'Content-Type': 'application/json' };
    var iaAuthMode = 'none';
    try {
      if (typeof getAuthHeaders !== 'function') {
        if (typeof toast === 'function') toast('Sessão inválida. Faça login novamente.', 'error');
        return null;
      }
      var authH = null;
      try {
        authH = await getAuthHeaders();
      } catch (e1) {
        // Segunda tentativa após refresh explícito
        try {
          if (typeof supabaseClient !== 'undefined' && supabaseClient.auth) {
            await supabaseClient.auth.refreshSession();
          }
        } catch (_) {}
        try {
          authH = await getAuthHeaders();
        } catch (e2) {
          if (e2 && e2.message === 'SESSION_EXPIRED') {
            if (typeof toast === 'function') toast('Sessão expirada. Faça login novamente.', 'error');
            return null;
          }
          throw e2;
        }
      }
      if (!authH || !authH.Authorization) {
        if (typeof toast === 'function') toast('Sessão inválida. Faça login novamente.', 'error');
        return null;
      }
      iaHeaders['Authorization'] = authH.Authorization;
      if (authH.apikey) iaHeaders['apikey'] = authH.apikey;
      else if (typeof SUPABASE_ANON_KEY !== 'undefined') iaHeaders['apikey'] = SUPABASE_ANON_KEY;
      iaAuthMode = 'user-jwt';
    } catch (eAuth) {
      if (eAuth && eAuth.message === 'SESSION_EXPIRED') {
        if (typeof toast === 'function') toast('Sessão expirada. Faça login novamente.', 'error');
        return null;
      }
      if (typeof toast === 'function') toast('Não foi possível autenticar o agente IA.', 'error');
      return null;
    }
    window.__bpIaLastMeta = { fonte: null, auth: iaAuthMode };

    const resp = await fetch(IA_EDGE_URL, {
      method: 'POST',
      headers: iaHeaders,
      body: JSON.stringify({
        pergunta: q,
        contexto: contexto,
        historico: historicoEnvio,
        plano: plano || undefined,
        instrucoes:
          'Responde em português de Angola. Calibra o tamanho: pergunta simples → curto; análise → estruturado. ' +
          'Nunca cortes frases a meio. Usa o histórico. Sê estratégico e prático.'
      })
    });

    if (!resp.ok) {
      if (resp.status === 429) {
        mostrarModalUpgrade('Limite de perguntas atingido. Faça upgrade para continuar.');
        return null;
      }
      if (resp.status === 503) {
        return 'Agente IA temporariamente indisponível. Tente dentro de momentos.';
      }
      // Fallback local genérico se API falhar
      const fallback = responderIALocal(q);
      if (fallback) return fallback;
      return 'Não foi possível contactar o agente IA. Verifique a ligação e tente de novo.';
    }

    const data = await resp.json();
    setUsoIAHoje(usadas + 1);

    const resposta = data.resposta || 'Não consegui responder. Tente de novo.';
    iaHistorico.push({ pergunta: q, resposta: resposta, fonte: 'api' });
    if (iaHistorico.length > IA_HIST_MAX) iaHistorico = iaHistorico.slice(-IA_HIST_MAX);
    window.__bpIaLastMeta = { fonte: 'api' };
    return resposta;
  } catch (e) {
    try {
      const offlineLocal = responderIALocal(q);
      if (offlineLocal) {
        window.__bpIaLastMeta = { fonte: 'local' };
        return offlineLocal;
      }
    } catch (e2) {}
    window.__bpIaLastMeta = { fonte: 'error' };
    return 'Sem ligação à internet. Posso responder a perguntas simples sobre vendas, caixa e agenda de hoje com os dados locais — tente reformular (ex.: «quanto faturou hoje?»).';
  } finally {
    _iaBusy = false;
  }
}

/** Nome fixo do assistente (produto). Botão renomear permanece oculto no HTML. */
function getNomeIA() { return 'Benza'; }

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
function montarMsgUsuarioIA(pergunta) { return `<div class="ia-msg-user ia-msg-enter">${escHtml(pergunta)}</div>`; }

/**
 * Markdown seguro → HTML (XSS-safe).
 * Suporta: negrito, itálico, cabeçalhos, listas, tabelas, código inline, quebras.
 * Nunca injecta HTML cru da resposta.
 */
function formatarRespostaIA(texto) {
  if (texto == null) return '';
  var raw = String(texto).replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  if (!raw) return '';

  // 1) Escapar tudo primeiro
  var safe = (typeof escHtml === 'function') ? escHtml(raw) : raw
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  var lines = safe.split('\n');
  var out = [];
  var i = 0;
  var inUl = false;
  var inOl = false;
  var inCode = false;
  var codeBuf = [];

  function closeLists() {
    if (inUl) { out.push('</ul>'); inUl = false; }
    if (inOl) { out.push('</ol>'); inOl = false; }
  }

  function inlineFmt(s) {
    // código inline `code`
    s = s.replace(/`([^`]+)`/g, '<code class="ia-md-code">$1</code>');
    // negrito **text** ou __text__
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    // itálico *text* (evitar conflito com **)
    s = s.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
    return s;
  }

  function isTableSep(line) {
    return /^\s*\|?[\s:|-]+\|[\s|:|-]*$/.test(line) && line.indexOf('|') !== -1 && /[-:]/.test(line);
  }

  function isTableRow(line) {
    return line.indexOf('|') !== -1 && line.trim().length > 0;
  }

  function parseTableRow(line) {
    var cells = line.replace(/^\|/, '').replace(/\|$/, '').split('|');
    return cells.map(function (c) { return c.trim(); });
  }

  while (i < lines.length) {
    var line = lines[i];

    // bloco de código ```
    if (/^```/.test(line.trim())) {
      if (!inCode) {
        closeLists();
        inCode = true;
        codeBuf = [];
      } else {
        out.push('<pre class="ia-md-pre"><code>' + codeBuf.join('\n') + '</code></pre>');
        inCode = false;
        codeBuf = [];
      }
      i++;
      continue;
    }
    if (inCode) {
      codeBuf.push(line);
      i++;
      continue;
    }

    // tabela markdown
    if (isTableRow(line) && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      closeLists();
      var headers = parseTableRow(line);
      i += 2; // skip header + separator
      var rows = [];
      while (i < lines.length && isTableRow(lines[i]) && !isTableSep(lines[i])) {
        rows.push(parseTableRow(lines[i]));
        i++;
      }
      var html = '<div class="ia-md-table-wrap"><table class="ia-md-table"><thead><tr>';
      headers.forEach(function (h) { html += '<th>' + inlineFmt(h) + '</th>'; });
      html += '</tr></thead><tbody>';
      rows.forEach(function (row) {
        html += '<tr>';
        for (var c = 0; c < headers.length; c++) {
          html += '<td>' + inlineFmt(row[c] != null ? row[c] : '') + '</td>';
        }
        html += '</tr>';
      });
      html += '</tbody></table></div>';
      out.push(html);
      continue;
    }

    // cabeçalhos
    var hm = line.match(/^(#{1,3})\s+(.+)$/);
    if (hm) {
      closeLists();
      var level = hm[1].length;
      out.push('<div class="ia-md-h ia-md-h' + level + '">' + inlineFmt(hm[2]) + '</div>');
      i++;
      continue;
    }

    // lista não ordenada
    var ul = line.match(/^\s*[-*•]\s+(.+)$/);
    if (ul) {
      if (inOl) { out.push('</ol>'); inOl = false; }
      if (!inUl) { out.push('<ul class="ia-md-ul">'); inUl = true; }
      out.push('<li>' + inlineFmt(ul[1]) + '</li>');
      i++;
      continue;
    }

    // lista ordenada
    var ol = line.match(/^\s*(\d+)[.)]\s+(.+)$/);
    if (ol) {
      if (inUl) { out.push('</ul>'); inUl = false; }
      if (!inOl) { out.push('<ol class="ia-md-ol">'); inOl = true; }
      out.push('<li>' + inlineFmt(ol[2]) + '</li>');
      i++;
      continue;
    }

    // linha vazia
    if (!line.trim()) {
      closeLists();
      out.push('<div class="ia-md-gap"></div>');
      i++;
      continue;
    }

    // parágrafo
    closeLists();
    out.push('<p class="ia-md-p">' + inlineFmt(line) + '</p>');
    i++;
  }
  closeLists();
  if (inCode && codeBuf.length) {
    out.push('<pre class="ia-md-pre"><code>' + codeBuf.join('\n') + '</code></pre>');
  }
  return out.join('');
}

/** Texto limpo para clipboard (sem **, | de markdown cru). */
function textoPlanoRespostaIA(texto) {
  if (texto == null) return '';
  var s = String(texto).replace(/\r\n/g, '\n');
  // remover formatação markdown comum
  s = s.replace(/\*\*([^*]+)\*\*/g, '$1');
  s = s.replace(/__([^_]+)__/g, '$1');
  s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1$2');
  s = s.replace(/^#{1,3}\s+/gm, '');
  s = s.replace(/`([^`]+)`/g, '$1');
  s = s.replace(/^```[\w]*\n?/gm, '').replace(/^```$/gm, '');
  // tabelas → linhas tab-separadas legíveis
  s = s.split('\n').map(function (line) {
    if (line.indexOf('|') === -1) return line;
    if (/^\s*\|?[\s:|-]+\|/.test(line)) return ''; // separador
    return line.replace(/^\|/, '').replace(/\|$/, '').split('|').map(function (c) {
      return c.trim();
    }).filter(Boolean).join('\t');
  }).join('\n');
  s = s.replace(/\n{3,}/g, '\n\n').trim();
  return s;
}

function _bpIaSvg(name) {
  var s = {
    copy: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    share: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>',
    up: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>',
    down: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/><path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>',
    regen: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>'
  };
  return s[name] || '';
}

/** Follow-ups contextuais — tom de assistente de salão (não robótico). */
var _bpIaRecentFollowups = [];
(function _bpIaLoadRecentFollowups() {
  try {
    var raw = sessionStorage.getItem('bp_ia_recent_followups');
    var arr = raw ? JSON.parse(raw) : [];
    if (Array.isArray(arr)) _bpIaRecentFollowups = arr.filter(function (x) { return typeof x === 'string'; }).slice(-36);
  } catch (_) { _bpIaRecentFollowups = []; }
})();
function _bpIaRememberFollowups(items) {
  try {
    (items || []).forEach(function (it) {
      var k1 = typeof _bpIaNormFollowKey === 'function' ? _bpIaNormFollowKey(it && it.label) : String((it && it.label) || '').toLowerCase();
      var k2 = typeof _bpIaNormFollowKey === 'function' ? _bpIaNormFollowKey(it && it.pergunta) : String((it && it.pergunta) || '').toLowerCase();
      [k1, k2].forEach(function (k) {
        if (!k || k.length < 6) return;
        if (_bpIaRecentFollowups.indexOf(k) === -1) _bpIaRecentFollowups.push(k);
      });
    });
    if (_bpIaRecentFollowups.length > 36) _bpIaRecentFollowups = _bpIaRecentFollowups.slice(-36);
    try { sessionStorage.setItem('bp_ia_recent_followups', JSON.stringify(_bpIaRecentFollowups)); } catch (_) {}
  } catch (_) {}
}
function _bpIaNormFollowKey(s) {
  var t = String(s || '').toLowerCase();
  try {
    if (typeof t.normalize === 'function') t = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  } catch (_) {}
  return t.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 96);
}
function _bpIaTokenOverlap(a, b) {
  var ta = _bpIaNormFollowKey(a).split(' ').filter(function (t) { return t.length > 3; });
  var tb = _bpIaNormFollowKey(b).split(' ').filter(function (t) { return t.length > 3; });
  if (ta.length < 2 || tb.length < 2) return 0;
  var set = {};
  for (var i = 0; i < tb.length; i++) set[tb[i]] = 1;
  var hit = 0;
  for (var j = 0; j < ta.length; j++) if (set[ta[j]]) hit++;
  return hit / Math.max(ta.length, tb.length);
}
function _bpIaIsRecentFollowup(label, perguntaFull) {
  var a = _bpIaNormFollowKey(label);
  var b = _bpIaNormFollowKey(perguntaFull);
  /* só compara com as 12 mais recentes — evita bloqueio excessivo */
  var recent = _bpIaRecentFollowups.slice(-12);
  for (var i = 0; i < recent.length; i++) {
    var r = recent[i];
    if (!r || r.length < 8) continue;
    if (a && a === r) return true;
    if (b && b === r) return true;
    /* substring só se ambos longos e um contém o outro quase por completo */
    if (a && a.length > 20 && r.length > 20 && (a.indexOf(r) !== -1 || r.indexOf(a) !== -1)) return true;
    if (b && b.length > 20 && r.length > 20 && (b.indexOf(r) !== -1 || r.indexOf(b) !== -1)) return true;
    if (a && _bpIaTokenOverlap(a, r) >= 0.72) return true;
    if (b && _bpIaTokenOverlap(b, r) >= 0.72) return true;
  }
  return false;
}
function gerarFollowupsEstrategicosIA(pergunta, resposta) {
  var qRaw = String(pergunta || '').trim();
  var rRaw = String(resposta || '').trim();
  var q = (typeof normalizarPerguntaIA === 'function' ? normalizarPerguntaIA(pergunta) : qRaw.toLowerCase());
  var r = rRaw.toLowerCase();
  var out = [];
  function add(label, perguntaFull) {
    if (out.length >= 3) return;
    label = String(label || '').trim();
    perguntaFull = String(perguntaFull || '').trim();
    if (!label || !perguntaFull) return;
    if (label.length > 72) label = label.slice(0, 69) + '…';
    /* evitar eco da pergunta do utilizador */
    var qn = qRaw.toLowerCase();
    if (qn && (label.toLowerCase() === qn || perguntaFull.toLowerCase() === qn)) return;
    if (_bpIaIsRecentFollowup(label, perguntaFull)) return;
    for (var i = 0; i < out.length; i++) {
      if (out[i].label === label || out[i].pergunta === perguntaFull) return;
      /* similaridade simples */
      if (_bpIaTokenOverlap(out[i].label, label) >= 0.72) return;
    }
    out.push({ label: label, pergunta: perguntaFull });
  }

  /* 1) Extrair perguntas já sugeridas no texto da IA */
  var lines = rRaw.split(/[\n\r]+/);
  for (var li = 0; li < lines.length && out.length < 3; li++) {
    var line = lines[li].replace(/^\s*[-*•\d.)]+\s*/, '').trim();
    if (line.length < 12 || line.length > 120) continue;
    if (/\?\s*$/.test(line) || /^(como|quais|quero|vamos|posso|devemos|suger)/i.test(line)) {
      var lab = line.replace(/\?+$/, '?');
      add(lab, lab);
    }
  }

  /* 2) Aprofundar a partir da pergunta do utilizador + temas da resposta */
  if (qRaw && out.length < 3) {
    if (/porque|porquê|motivo|razão/.test(q)) {
      add('O que fazer a seguir?', 'Com base nisso, que 3 acções práticas devo tomar esta semana?');
    } else if (/como|estratég|melhorar|aumentar|subir/.test(q)) {
      add('Detalha o primeiro passo', 'Detalha o primeiro passo prático, com exemplo para o meu salão.');
    } else if (/quem|qual|quais/.test(q)) {
      add('Prioriza a lista', 'Ordena por impacto no negócio e diz por onde começar.');
    } else {
      add('Aprofunda este ponto', 'Aprofunda a resposta anterior com números e próximos passos concretos.');
    }
  }

  /* 3) Âncoras contextuais (só se o tema aparecer na pergunta OU na resposta) */
  var ctx = q + ' ' + r;
  if (/cliente|vip|inactiv|inativ|ausente|regress/.test(ctx)) {
    add('Quem contactar primeiro?', 'Com base na análise, quais clientes devo contactar primeiro e com que mensagem?');
  }
  if (/receita|fatur|vend|ticket|kz|kwanza/.test(ctx)) {
    add('Comparar com o período anterior', 'Compara estes números com o período anterior e destaca o que mudou.');
  }
  if (/agenda|marcac|horário|horario|amanhã|amanha/.test(ctx)) {
    add('Otimizar a agenda', 'Como otimizar a agenda dos próximos dias com base no que acabaste de dizer?');
  }
  if (/caixa|despes|fluxo|saldo/.test(ctx)) {
    add('Onde cortar sem risco?', 'Que despesas posso ajustar sem prejudicar a experiência do cliente?');
  }
  if (/serviço|servico|profissional|equipa|comiss/.test(ctx)) {
    add('Plano para a equipa', 'Transforma isto num plano simples para a equipa nos próximos 7 dias.');
  }

  /* 4) Fallback mínimo — só se ainda vazio (evita lista genérica sempre igual) */
  if (!out.length) {
    if (qRaw) {
      add('Resumo em 3 pontos', 'Resume a resposta anterior em 3 pontos acionáveis.');
      add('Próximo passo', 'Qual deve ser o meu próximo passo concreto hoje?');
    } else {
      add('Ponto de situação', 'Faz um ponto de situação rápido do salão hoje.');
    }
  }
  var final = out.slice(0, 3);
  if (!final.length && qRaw) {
    final = [
      { label: 'Próximo passo concreto', pergunta: 'Qual deve ser o meu próximo passo concreto com base nisto?' },
      { label: 'Resumo em 3 pontos', pergunta: 'Resume a resposta anterior em 3 pontos acionáveis.' }
    ];
  }
  _bpIaRememberFollowups(final);
  return final.slice(0, 3);
}


/** Fases de thinking + streaming progressivo (UX estilo Grok / ChatGPT). */
var _bpIaStreamAbort = null;
function _bpIaSvgBulb() {
  return '<svg class="ia-think-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/></svg>';
}
function _bpIaSvgSpark() {
  return '<svg class="ia-think-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v3"/><path d="M12 18v3"/><path d="M3 12h3"/><path d="M18 12h3"/><path d="M5.6 5.6l2.1 2.1"/><path d="M16.3 16.3l2.1 2.1"/><path d="M5.6 18.4l2.1-2.1"/><path d="M16.3 7.7l2.1-2.1"/></svg>';
}
function _bpIaSetThinkingPhase(el, phase) {
  if (!el) return;
  if (phase === 1) {
    el.innerHTML =
      '<div class="ia-think-row">' + _bpIaSvgBulb() +
      '<span class="ia-think-label">A analisar o contexto…</span></div>';
  } else if (phase === 2) {
    el.innerHTML =
      '<div class="ia-think-row">' + _bpIaSvgSpark() +
      '<span class="ia-think-label">A estruturar a resposta…</span></div>';
  }
}
function _bpIaSleep(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}
/** Revela texto progressivamente (palavras) com cursor — não depende de SSE. */
async function _bpIaStreamInto(elCorpo, textoPlano, opts) {
  opts = opts || {};
  var reduced = false;
  try {
    reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (_) {}
  if (reduced || !textoPlano) {
    elCorpo.innerHTML = typeof formatarRespostaIA === 'function' ? formatarRespostaIA(textoPlano) : String(textoPlano || '');
    return;
  }
  var words = String(textoPlano).split(/(\s+)/);
  var acc = '';
  var i = 0;
  var baseDelay = opts.baseDelay != null ? opts.baseDelay : 28;
  /* Respostas longas: um pouco mais rápido para não cansar */
  if (words.length > 120) baseDelay = 16;
  else if (words.length > 60) baseDelay = 22;
  elCorpo.innerHTML = '<span class="ia-stream-text"></span><span class="ia-stream-caret" aria-hidden="true"></span>';
  var textEl = elCorpo.querySelector('.ia-stream-text');
  var caret = elCorpo.querySelector('.ia-stream-caret');
  while (i < words.length) {
    if (_bpIaStreamAbort) break;
    acc += words[i];
    i++;
    /* actualizar em chunks de 1–3 tokens */
    if (i % 1 === 0) {
      textEl.textContent = acc;
      try {
        var chat = document.getElementById('ia-chat');
        if (chat) chat.scrollTop = chat.scrollHeight;
      } catch (_) {}
      var pause = baseDelay;
      if (/[\.\!\?…]$/.test(words[i - 1])) pause += 120;
      else if (/[,;:]$/.test(words[i - 1])) pause += 50;
      await _bpIaSleep(pause);
    }
  }
  /* Render final com markdown completo */
  elCorpo.innerHTML = typeof formatarRespostaIA === 'function' ? formatarRespostaIA(textoPlano) : String(textoPlano || '');
  elCorpo.setAttribute('data-plain', textoPlano);
}


function _bpIaEnsureScrollBtn() {
  var shell = document.getElementById('ia-chat-container');
  var chat = document.getElementById('ia-chat');
  if (!shell || !chat) return null;
  var btn = document.getElementById('ia-scroll-latest');
  if (!btn) {
    btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'ia-scroll-latest';
    btn.className = 'ia-scroll-latest';
    btn.setAttribute('aria-label', 'Ir para a última mensagem');
    btn.title = 'Última mensagem';
    btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14"/><path d="M19 12l-7 7-7-7"/></svg>';
    btn.hidden = true;
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      _bpIaScrollToLatest(true);
    });
    if (getComputedStyle(shell).position === 'static') shell.style.position = 'relative';
    shell.appendChild(btn);
    if (!chat.dataset.bpScrollBound) {
      chat.dataset.bpScrollBound = '1';
      chat.addEventListener('scroll', function () { _bpIaUpdateScrollBtn(); }, { passive: true });
    }
  }
  return btn;
}
function _bpIaScrollToLatest(smooth) {
  var chat = document.getElementById('ia-chat');
  if (!chat) return;
  try {
    chat.scrollTo({ top: chat.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  } catch (_) {
    chat.scrollTop = chat.scrollHeight;
  }
  setTimeout(_bpIaUpdateScrollBtn, smooth ? 320 : 40);
}
function _bpIaUpdateScrollBtn() {
  var chat = document.getElementById('ia-chat');
  var btn = _bpIaEnsureScrollBtn();
  if (!chat || !btn) return;
  var distance = chat.scrollHeight - chat.scrollTop - chat.clientHeight;
  var hasOverflow = chat.scrollHeight > chat.clientHeight + 12;
  var show = hasOverflow && distance > 36;
  btn.hidden = !show;
  btn.setAttribute('aria-hidden', show ? 'false' : 'true');
}

function montarMsgBotIA(resposta, ts, perguntaOrig, opts) {
  opts = opts || {};
  /* Acções + follow-ups apenas na última resposta (opts.toolbar / opts.followups) */
  var showFollow = opts.followups === true;
  var showToolbar = opts.toolbar === true;
  var fonte = opts.fonte || null;
  var tempo = formatarTempoRelativoIA(ts);
  var htmlCorpo = formatarRespostaIA(resposta);
  var planoAttr = escHtml(textoPlanoRespostaIA(resposta));
  var arrowSvg = '<svg class="ia-followup-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 10l-5 5 5 5"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/></svg>';
  var chips = '';
  if (showFollow) {
    var follows = gerarFollowupsEstrategicosIA(perguntaOrig || '', resposta);
    chips = follows.map(function (f) {
      return '<button type="button" class="ia-followup-chip" data-pergunta="' +
        String(f.pergunta).replace(/"/g, '&quot;') + '">' +
        arrowSvg + '<span class="ia-followup-label">' + escHtml(f.label) + '</span></button>';
    }).join('');
  }

  var pergAttr = escHtml(String(perguntaOrig || ''));
  var toolbarHtml = '';
  if (showToolbar) {
    toolbarHtml =
      '<div class="ia-msg-toolbar" role="group" aria-label="Acções da resposta">' +
        '<button type="button" class="ia-tool-btn ia-copiar-btn" title="Copiar" aria-label="Copiar">' + _bpIaSvg('copy') + '</button>' +
        '<button type="button" class="ia-tool-btn ia-partilhar-btn" title="Partilhar" aria-label="Partilhar">' + _bpIaSvg('share') + '</button>' +
        '<button type="button" class="ia-tool-btn ia-feedback-btn" data-fb="util" title="Gostei" aria-label="Gostei">' + _bpIaSvg('up') + '</button>' +
        '<button type="button" class="ia-tool-btn ia-feedback-btn" data-fb="naoajudou" title="Não gostei" aria-label="Não gostei">' + _bpIaSvg('down') + '</button>' +
        '<button type="button" class="ia-tool-btn ia-regen-btn" title="Gerar novamente" aria-label="Gerar novamente">' + _bpIaSvg('regen') + '</button>' +
      '</div>';
  }
  return (
    '<div class="ia-msg-block ia-msg-enter" data-pergunta="' + pergAttr + '">' +
      '<div class="ia-msg-bot">' +
        '<div class="ia-msg-bot-header"><span class="ia-msg-bot-nome">Benza</span>' +
          (tempo ? '<span class="ia-msg-bot-tempo">' + tempo + '</span>' : '') +
          (fonte === 'local' ? '<span class="ia-msg-bot-fonte" title="Calculado com dados locais do salão">Local</span>' : '') +
        '</div>' +
        '<div class="ia-msg-bot-corpo" data-plain="' + planoAttr + '">' + htmlCorpo + '</div>' +
      '</div>' +
      toolbarHtml +
      (chips ? '<div class="ia-followup-row">' + chips + '</div>' : '') +
    '</div>'
  );
}

/** Remove toolbar e follow-ups de mensagens anteriores (só a última deve tê-los). */
function _bpIaStripNonLastActions(chatEl) {
  if (!chatEl) return;
  var blocks = chatEl.querySelectorAll('.ia-msg-block');
  for (var i = 0; i < blocks.length; i++) {
    var tb = blocks[i].querySelector('.ia-msg-toolbar');
    if (tb) tb.remove();
    var fr = blocks[i].querySelector('.ia-followup-row');
    if (fr) fr.remove();
  }
}

function atualizarEstadoVazioIA() {
  const vazio = document.getElementById('ia-chat-empty');
  const chat = document.getElementById('ia-chat');
  const shell = document.getElementById('ia-chat-container');
  if (shell && chat) {
    shell.classList.toggle('has-messages', chat.children.length > 0);
  }
  if (vazio && chat) vazio.style.display = chat.children.length > 0 ? 'none' : '';
}
const IA_HIST_KEY = function () {
  var sid = (state && state.config && state.config.salaoId) ? state.config.salaoId : 'local';
  return 'bp_ia_chat_' + sid;
};
const IA_HIST_MAX = 40;

function _bpIaNormalizeHist(list) {
  if (!Array.isArray(list)) return [];
  return list.filter(function (t) {
    return t && (t.pergunta || t.resposta);
  }).slice(-IA_HIST_MAX);
}

function _bpIaRenderHistNoChat(list) {
  var chat = document.getElementById('ia-chat');
  if (!chat) return;
  var guardado = _bpIaNormalizeHist(list);
  if (!guardado.length) {
    chat.innerHTML = '';
    atualizarEstadoVazioIA();
    return;
  }
  chat.innerHTML = guardado.map(function (item, idx) {
    var last = idx === guardado.length - 1;
    return montarMsgUsuarioIA(item.pergunta) +
      montarMsgBotIA(item.resposta, item.ts, item.pergunta, { followups: last, toolbar: last, fonte: item.fonte || null });
  }).join('');
  chat.scrollTop = chat.scrollHeight;
  atualizarEstadoVazioIA();
  try { _bpIaEnsureScrollBtn(); _bpIaUpdateScrollBtn(); } catch (_) {}
}

function carregarHistoricoIA() {
  try {
    var fromLs = [];
    try { fromLs = JSON.parse(localStorage.getItem(IA_HIST_KEY()) || '[]'); } catch (e1) { fromLs = []; }
    iaHistorico = _bpIaNormalizeHist(fromLs);
    _bpIaRenderHistNoChat(iaHistorico);
  } catch (e) {
    iaHistorico = [];
  }
  /* IndexedDB (sobrevive a limpezas parciais / reabre com dados locais) */
  if (typeof dbGetAll === 'function') {
    Promise.resolve(dbGetAll('config')).then(function (rows) {
      try {
        var sidH = (state && state.config && state.config.salaoId) ? state.config.salaoId : 'local';
        var histId = 'ia_chat_hist_' + sidH;
        var row = (rows || []).find(function (c) {
          return c && (c.id === histId || c.key === histId ||
            ((c.id === 'ia_chat_hist' || c.key === 'ia_chat_hist') && (!c.salao_id || c.salao_id === sidH)));
        });
        var fromDb = row && row.value != null ? row.value : null;
        if (typeof fromDb === 'string') {
          try { fromDb = JSON.parse(fromDb); } catch (e2) { fromDb = null; }
        }
        fromDb = _bpIaNormalizeHist(fromDb);
        if (fromDb.length >= iaHistorico.length) {
          iaHistorico = fromDb;
          try { localStorage.setItem(IA_HIST_KEY(), JSON.stringify(iaHistorico)); } catch (e3) {}
          _bpIaRenderHistNoChat(iaHistorico);
        } else if (iaHistorico.length) {
          /* LS mais completo → gravar no IDB */
          guardarHistoricoIA();
        }
      } catch (e4) {}
    }).catch(function () {});
  }
}

function guardarHistoricoIA() {
  try {
    iaHistorico = _bpIaNormalizeHist(iaHistorico);
    localStorage.setItem(IA_HIST_KEY(), JSON.stringify(iaHistorico));
  } catch (e) {}
  try {
    if (typeof dbPut === 'function') {
      var sid = (state && state.config && state.config.salaoId) ? state.config.salaoId : 'local';
      var payload = {
        id: 'ia_chat_hist_' + sid,
        key: 'ia_chat_hist_' + sid,
        value: iaHistorico,
        updated_at: new Date().toISOString(),
        salao_id: sid
      };
      Promise.resolve(dbPut('config', payload)).catch(function () {});
    }
  } catch (e5) {}
}

/* Carregar quando DOM e estado estiverem prontos */
function _bpIaBootHist() {
  carregarHistoricoIA();
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { setTimeout(_bpIaBootHist, 80); });
} else {
  setTimeout(_bpIaBootHist, 80);
}
setTimeout(_bpIaBootHist, 1200);

function bpIaAutosizeInput() {
  const input = document.getElementById('ia-input');
  if (!input) return;
  input.style.height = 'auto';
  const h = Math.min(120, Math.max(40, input.scrollHeight));
  input.style.height = h + 'px';
}
function bpIaSyncSendState() {
  const input = document.getElementById('ia-input');
  const btn = document.getElementById('ia-enviar');
  if (!btn) return;
  const has = !!(input && input.value.trim());
  btn.classList.toggle('is-idle', !has);
  if (!has) btn.classList.remove('is-sending');
}
function bpIaBindComposer() {
  const input = document.getElementById('ia-input');
  const btn = document.getElementById('ia-enviar');
  if (!input || input.dataset.bpIaBound === '1') return;
  input.dataset.bpIaBound = '1';
  input.addEventListener('input', function () {
    bpIaAutosizeInput();
    bpIaSyncSendState();
  });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (btn) btn.click();
    }
  });
  bpIaAutosizeInput();
  bpIaSyncSendState();
}

document.getElementById('ia-enviar')?.addEventListener('click', async () => {
  const input = document.getElementById('ia-input');
  const btn = document.getElementById('ia-enviar');
  const pergunta = (input && input.value || '').trim();
  if (!pergunta || _iaBusy) return;
  const chat = document.getElementById('ia-chat');
  if (!chat) return;
  if (btn) {
    btn.classList.remove('is-idle');
    btn.classList.add('is-sending');
    // reinicia transição 360°
    btn.style.transition = 'none';
    btn.style.transform = 'rotate(0deg)';
    void btn.offsetWidth;
    btn.style.transition = '';
    btn.style.transform = '';
  }
  chat.innerHTML += montarMsgUsuarioIA(pergunta);
  atualizarEstadoVazioIA();
  window.__bpIaLastMeta = { fonte: null };
  if (input) {
    input.value = '';
    bpIaAutosizeInput();
  }
  if (btn) btn.disabled = true;
  _bpIaStreamAbort = false;

  /* Placeholder de progresso — só se for preciso esperar (API). Local resolve rápido. */
  const pensando = document.createElement('div');
  pensando.className = 'ia-msg-bot ia-msg-thinking';
  pensando.id = 'ia-pensando';
  pensando.setAttribute('aria-live', 'polite');
  pensando.innerHTML = '<div class="ia-msg-bot-header"><span class="ia-msg-bot-nome">Benza</span></div><div class="ia-think-body"></div>';
  chat.appendChild(pensando);
  var thinkBody = pensando.querySelector('.ia-think-body');
  try { _bpIaSetThinkingPhase(thinkBody, 1); } catch (_) {}
  chat.scrollTop = chat.scrollHeight;

  var phaseTimer = setTimeout(function () {
    try {
      if (document.getElementById('ia-pensando') && !(window.__bpIaLastMeta && window.__bpIaLastMeta.fonte === 'local')) {
        _bpIaSetThinkingPhase(thinkBody, 2);
      }
    } catch (_) {}
  }, 700);

  let resposta = null;
  try {
    try { _bpIaSetComposerStatus('A processar…'); } catch (_) {}
    resposta = await perguntarIA(pergunta);
  } finally {
    clearTimeout(phaseTimer);
    if (btn) {
      btn.disabled = false;
      setTimeout(function () {
        btn.classList.remove('is-sending');
        bpIaSyncSendState();
      }, 200);
    }
  }
  try { document.getElementById('ia-pensando') && document.getElementById('ia-pensando').remove(); } catch (_) {}

  var metaFonte = (window.__bpIaLastMeta && window.__bpIaLastMeta.fonte) || null;

  if (resposta) {
    const ts = Date.now();
    try { _bpIaStripNonLastActions(chat); } catch (_) {}
    var isLocal = metaFonte === 'local';
    try {
      if (isLocal) {
        /* Resposta local: mostrar de imediato, sem teatro de stream */
        chat.insertAdjacentHTML('beforeend', montarMsgBotIA(resposta, ts, pergunta, {
          followups: true, toolbar: true, fonte: 'local'
        }));
        try { _bpIaSetHeaderStatus('local'); _bpIaSetComposerStatus(_bpIaIsOnline() ? 'IA pronta' : 'Modo local'); } catch (_) {}
      } else {
        var blockHtml = montarMsgBotIA(resposta, ts, pergunta, { followups: false, toolbar: false, fonte: metaFonte });
        chat.insertAdjacentHTML('beforeend', blockHtml);
        var blocks = chat.querySelectorAll('.ia-msg-block');
        var lastBlock = blocks.length ? blocks[blocks.length - 1] : null;
        var corpo = lastBlock && lastBlock.querySelector('.ia-msg-bot-corpo');
        if (corpo) {
          var plano = corpo.getAttribute('data-plain') || String(resposta);
          try {
            await _bpIaStreamInto(corpo, plano, {});
          } catch (streamErr) {
            try {
              corpo.innerHTML = typeof formatarRespostaIA === 'function' ? formatarRespostaIA(plano) : plano;
              corpo.setAttribute('data-plain', plano);
            } catch (_) {}
          }
        }
        if (lastBlock && lastBlock.parentNode) {
          var full = montarMsgBotIA(resposta, ts, pergunta, { followups: true, toolbar: true, fonte: metaFonte });
          var tmp = document.createElement('div');
          tmp.innerHTML = full;
          var rich = tmp.firstElementChild;
          if (rich) lastBlock.parentNode.replaceChild(rich, lastBlock);
        }
        try {
          if (metaFonte === 'error') _bpIaSetHeaderStatus('error');
          else if (_bpIaIsOnline()) { _bpIaSetHeaderStatus('ok'); _bpIaSetComposerStatus('IA pronta'); }
          else { _bpIaSetHeaderStatus('offline'); _bpIaSetComposerStatus('Modo local'); }
        } catch (_) {}
      }
    } catch (renderErr) {
      try {
        chat.insertAdjacentHTML('beforeend', montarMsgBotIA(resposta, ts, pergunta, {
          followups: true, toolbar: true, fonte: metaFonte
        }));
      } catch (_) {}
    }
    try {
      chat.scrollTop = chat.scrollHeight;
      _bpIaEnsureScrollBtn();
      _bpIaUpdateScrollBtn();
    } catch (_) {}
    try {
      if (iaHistorico.length > 0) iaHistorico[iaHistorico.length - 1].ts = ts;
      guardarHistoricoIA();
    } catch (_) {}
  } else {
    try { atualizarIAOffline(); } catch (_) {}
  }
  actualizarContadorIA();
  bpIaSyncSendState();
});

bpIaBindComposer();
document.addEventListener('DOMContentLoaded', function () {
  bpIaBindComposer();
  try { _bpIaEnsureScrollBtn(); } catch (_) {}
  try { actualizarContadorIA(); } catch (_) {}
  try { atualizarIAOffline(); } catch (_) {}
});

// Sugestões rápidas e chips de continuação (delegação de eventos — cobre também os que são criados depois de cada resposta)
document.addEventListener('click', (e) => {
  const card = e.target.closest('.ia-sugestao-card, .ia-followup-chip');
  if (card && card.dataset.pergunta) {
    if (card.dataset.pergunta === '__bp_export_ics__') {
      try {
        if (window.BPOps && typeof window.BPOps.downloadIcs === 'function') {
          window.BPOps.downloadIcs();
          if (typeof toast === 'function') toast('Agenda exportada.', 'success');
        } else if (typeof toast === 'function') {
          toast('Exportação de calendário indisponível', 'warning');
        }
      } catch (err) {
        if (typeof toast === 'function') toast('Não foi possível exportar o calendário', 'error');
      }
      return;
    }
    const input = document.getElementById('ia-input');
    if (input) {
      input.value = card.dataset.pergunta;
      if (typeof bpIaAutosizeInput === 'function') bpIaAutosizeInput();
      if (typeof bpIaSyncSendState === 'function') bpIaSyncSendState();
      document.getElementById('ia-enviar').click();
    }
  }
  const tool = e.target.closest('.ia-tool-btn, .ia-feedback-btn');
  if (tool) {
    const block = tool.closest('.ia-msg-block') || tool.closest('.ia-msg-bot');
    const corpo = block && block.querySelector('.ia-msg-bot-corpo');
    const texto = (corpo && (corpo.getAttribute('data-plain') || corpo.innerText)) || '';
    if (tool.classList.contains('ia-copiar-btn')) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto).then(function () {
          if (typeof toast === 'function') toast('Texto copiado.', 'success');
        }).catch(function () {
          if (typeof toast === 'function') toast('Não foi possível copiar', 'error');
        });
      } else if (typeof toast === 'function') {
        toast('Cópia não suportada neste dispositivo', 'warning');
      }
      return;
    }
    if (tool.classList.contains('ia-partilhar-btn')) {
      if (navigator.share) {
        navigator.share({ text: texto }).catch(function () {});
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto).then(function () {
          if (typeof toast === 'function') toast('Texto copiado.', 'success');
        }).catch(function () {});
      }
      return;
    }
    if (tool.classList.contains('ia-regen-btn')) {
      var perg = (block && block.getAttribute('data-pergunta')) || '';
      if (!perg) {
        if (typeof toast === 'function') toast('Não foi possível repetir esta pergunta', 'warning');
        return;
      }
      /* Regenerar reenvia a pergunta (pode consumir cota se for à API). */
      var input = document.getElementById('ia-input');
      var send = document.getElementById('ia-enviar');
      if (input && send) {
        input.value = perg;
        if (typeof bpIaAutosizeInput === 'function') bpIaAutosizeInput();
        if (typeof bpIaSyncSendState === 'function') bpIaSyncSendState();
        send.click();
      }
      return;
    }
    if (tool.getAttribute('data-fb')) {
      var fb = tool.getAttribute('data-fb');
      try {
        var key = 'bp_ia_feedback';
        var list = [];
        try { list = JSON.parse(localStorage.getItem(key) || '[]'); } catch (_) { list = []; }
        if (!Array.isArray(list)) list = [];
        var plain = '';
        try {
          var c = block && block.querySelector('.ia-msg-bot-corpo');
          plain = (c && (c.getAttribute('data-plain') || c.innerText)) || '';
        } catch (_) {}
        list.push({
          fb: fb,
          ts: Date.now(),
          pergunta: (block && block.getAttribute('data-pergunta')) || '',
          amostra: String(plain).slice(0, 240),
          salao: (state && state.config && state.config.salaoId) || 'local'
        });
        if (list.length > 80) list = list.slice(-80);
        localStorage.setItem(key, JSON.stringify(list));
      } catch (_) {}
      if (typeof toast === 'function') toast('Feedback guardado neste dispositivo', 'success');
      const bar = tool.parentElement;
      if (bar) {
        bar.querySelectorAll('[data-fb]').forEach(function (b) { b.disabled = true; b.classList.remove('is-on'); });
      }
      tool.classList.add('is-on');
      tool.disabled = true;
    }
  }
});

document.getElementById('ia-offline-retry')?.addEventListener('click', () => {
  if (navigator.onLine) { atualizarIAOffline();
    toast('Ligação restabelecida.', 'success'); } else { toast('Ainda sem ligação à internet.', 'warning'); }
});

// Upgrade modal — handler principal em plano-limites.js (bindUpgradeButtons / abrirWhatsAppVenda).
// Fallback se o bind ainda não correu (ordem de scripts / bundle).
(function ensureUpgradeContatoBound() {
  const contato = document.getElementById('modal-upgrade-contato');
  if (!contato || contato.dataset.bpUpgradeBound) return;
  contato.addEventListener('click', async () => {
    if (typeof abrirWhatsAppVenda === 'function') {
      const salao = (state && state.config && state.config.storeName) || '—';
      const actual = (typeof getPlanoAtual === 'function') ? getPlanoAtual() : '—';
      await abrirWhatsAppVenda(
        `Olá, quero assinar um plano do BeautyPro. Salão: ${salao} | Plano actual: ${actual}`
      );
    } else {
      const msg =
        `Olá, quero assinar um plano do BeautyPro. Salão: ${(state.config && state.config.storeName) || '—'} | Plano actual: ${typeof getPlanoAtual === 'function' ? getPlanoAtual() : '—'}`;
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
    }
    closeModal('modal-upgrade');
  });
  contato.dataset.bpUpgradeBound = '1';
})();

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

/** Splash BeautyPro BANIDO — nunca mostrar. */
function hideSplash() {
  var splash = document.getElementById('splash-screen');
  if (!splash) return;
  splash.style.cssText = 'display:none!important;opacity:0;visibility:hidden;pointer-events:none;';
  splash.setAttribute('hidden', '');
  splash.setAttribute('aria-hidden', 'true');
  try { localStorage.setItem('bp_splash_seen', '1'); } catch (_) {}
}
function bpControlSplashOnBoot() {
  hideSplash();
}
if (typeof window !== 'undefined') {
  window.bpControlSplashOnBoot = bpControlSplashOnBoot;
  window.hideSplash = hideSplash;
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

/* ===== FILE: benza-tools.js ===== */
// ====================================================================
//  benza-tools.js — Camada segura entre a Benza e o sistema real
//  NÃO chama Supabase directamente.
//  Usa exclusivamente as funções CRUD existentes (addCliente, etc.).
//  Carregar DEPOIS de crud-operations.js e ia-module.js (ver ORDER).
// ====================================================================
(function () {
  "use strict";

  // ----------------------------------------------------------
  // UTILITÁRIOS
  // ----------------------------------------------------------
  function ok(data, extra) {
    extra = extra || {};
    return Object.assign({ ok: true, data: data }, extra);
  }

  function erro(codigo, mensagem, extra) {
    extra = extra || {};
    return Object.assign({ ok: false, codigo: codigo, mensagem: mensagem }, extra);
  }

  function exigirConfirmacao(operacao, dados) {
    return {
      ok: false,
      precisa_confirmacao: true,
      operacao: operacao,
      dados: dados
    };
  }

  function obterFuncao(nome) {
    var fn = null;
    if (typeof window !== "undefined" && typeof window[nome] === "function") {
      fn = window[nome];
    } else if (typeof globalThis !== "undefined" && typeof globalThis[nome] === "function") {
      fn = globalThis[nome];
    }
    if (typeof fn !== "function") {
      throw new Error("TOOL_NOT_IMPLEMENTED:" + nome);
    }
    return fn;
  }

  function obterState() {
    if (typeof window !== "undefined" && window.state && typeof window.state === "object") {
      return window.state;
    }
    if (typeof state !== "undefined" && state && typeof state === "object") {
      return state;
    }
    return null;
  }

  // ----------------------------------------------------------
  // CONSULTAS (read-only)
  // ----------------------------------------------------------
  function clientes() {
    try {
      var st = obterState();
      if (!st || !Array.isArray(st.clientes)) {
        return erro("DADOS_INDISPONIVEIS", "Os dados de clientes não estão disponíveis.");
      }
      var lista = st.clientes.filter(function (c) {
        return c && c.ativo !== false && c.ativo !== 0 && c.ativo !== "false";
      });
      return ok(lista);
    } catch (e) {
      return erro("ERRO_CLIENTES", e && e.message ? e.message : String(e));
    }
  }

  function agendamentos() {
    try {
      var st = obterState();
      if (!st || !Array.isArray(st.agendamentos)) {
        return erro("DADOS_INDISPONIVEIS", "Os dados de agendamentos não estão disponíveis.");
      }
      return ok(st.agendamentos);
    } catch (e) {
      return erro("ERRO_AGENDAMENTOS", e && e.message ? e.message : String(e));
    }
  }

  function movimentos() {
    try {
      var st = obterState();
      if (!st || !Array.isArray(st.movimentos)) {
        return erro("DADOS_INDISPONIVEIS", "Os movimentos não estão disponíveis.");
      }
      return ok(st.movimentos);
    } catch (e) {
      return erro("ERRO_MOVIMENTOS", e && e.message ? e.message : String(e));
    }
  }

  function profissionais() {
    try {
      var st = obterState();
      if (!st || !Array.isArray(st.profissionais)) {
        return erro("DADOS_INDISPONIVEIS", "Os profissionais não estão disponíveis.");
      }
      var lista = st.profissionais.filter(function (p) {
        return p && p.ativo !== false && p.ativo !== 0 && p.ativo !== "false";
      });
      return ok(lista);
    } catch (e) {
      return erro("ERRO_PROFISSIONAIS", e && e.message ? e.message : String(e));
    }
  }

  function servicos() {
    try {
      var st = obterState();
      if (!st || !Array.isArray(st.servicos)) {
        return erro("DADOS_INDISPONIVEIS", "Os serviços não estão disponíveis.");
      }
      var lista = st.servicos.filter(function (s) {
        return s && s.ativo !== false && s.ativo !== 0 && s.ativo !== "false";
      });
      return ok(lista);
    } catch (e) {
      return erro("ERRO_SERVICOS", e && e.message ? e.message : String(e));
    }
  }

  // ----------------------------------------------------------
  // CRIAR CLIENTE
  // ----------------------------------------------------------
  async function criarCliente(dados) {
    try {
      if (!dados || typeof dados !== "object") {
        return erro("DADOS_INVALIDOS", "Dados do cliente inválidos.");
      }
      if (!dados.nome || !String(dados.nome).trim()) {
        return erro("NOME_OBRIGATORIO", "O nome do cliente é obrigatório.");
      }
      if (!dados.telefone || !String(dados.telefone).trim()) {
        return erro("TELEFONE_OBRIGATORIO", "O telefone do cliente é obrigatório.");
      }
      var addCliente = obterFuncao("addCliente");
      var cliente = await addCliente({
        nome: String(dados.nome).trim(),
        telefone: String(dados.telefone).trim(),
        notas: dados.notas != null ? String(dados.notas) : undefined
      });
      if (!cliente) {
        return erro(
          "CLIENTE_NAO_CRIADO",
          "O cliente não foi criado. A validação do sistema recusou a operação (telefone inválido, nome duplicado ou limite de plano)."
        );
      }
      return ok(cliente);
    } catch (e) {
      return erro("ERRO_CRIAR_CLIENTE", e && e.message ? e.message : String(e));
    }
  }

  // ----------------------------------------------------------
  // CRIAR AGENDAMENTO
  // ----------------------------------------------------------
  async function criarAgendamento(dados, confirmado) {
    if (!confirmado) {
      return exigirConfirmacao("criar_agendamento", dados);
    }
    try {
      if (!dados || typeof dados !== "object") {
        return erro("DADOS_INVALIDOS", "Dados do agendamento inválidos.");
      }
      if (!dados.profissional_id) {
        return erro("PROFISSIONAL_OBRIGATORIO", "É necessário identificar o profissional.");
      }
      if (!dados.data || !dados.hora) {
        return erro("DATA_HORA_OBRIGATORIAS", "É necessário indicar data e hora.");
      }
      var addAgendamento = obterFuncao("addAgendamento");
      var agendamento = await addAgendamento({
        data: String(dados.data).trim(),
        hora: String(dados.hora).trim().slice(0, 5),
        profissional_id: dados.profissional_id,
        profissional: dados.profissional || "",
        cliente: dados.cliente || "",
        cliente_id: dados.cliente_id || null,
        servico: dados.servico || "",
        preco: dados.preco != null ? Number(dados.preco) : undefined
      });
      if (!agendamento) {
        return erro(
          "AGENDAMENTO_NAO_CRIADO",
          "O agendamento não foi criado. Pode existir conflito de horário, data no passado, profissional em falta ou limite de plano."
        );
      }
      return ok(agendamento);
    } catch (e) {
      return erro("ERRO_CRIAR_AGENDAMENTO", e && e.message ? e.message : String(e));
    }
  }

  // ----------------------------------------------------------
  // REGISTAR DESPESA
  // ----------------------------------------------------------
  async function registarDespesa(dados, confirmado) {
    if (!confirmado) {
      return exigirConfirmacao("registar_despesa", dados);
    }
    try {
      if (!dados || typeof dados !== "object") {
        return erro("DADOS_INVALIDOS", "Dados da despesa inválidos.");
      }
      var valor = Number(dados.valor);
      if (!Number.isFinite(valor) || valor <= 0) {
        return erro("VALOR_INVALIDO", "O valor da despesa deve ser superior a zero.");
      }
      var addMovimento = obterFuncao("addMovimento");
      var movimento = await addMovimento({
        tipo: "despesa",
        valor: valor,
        descricao: dados.descricao ? String(dados.descricao).trim() : ""
      });
      if (!movimento) {
        return erro("DESPESA_NAO_REGISTADA", "A despesa não foi registada.");
      }
      return ok(movimento);
    } catch (e) {
      return erro("ERRO_REGISTAR_DESPESA", e && e.message ? e.message : String(e));
    }
  }

  // ----------------------------------------------------------
  // CANCELAR AGENDAMENTO
  // ----------------------------------------------------------
  async function cancelarAgendamento(id, confirmado) {
    if (!id) {
      return erro("ID_OBRIGATORIO", "É necessário identificar o agendamento.");
    }
    if (!confirmado) {
      return exigirConfirmacao("cancelar_agendamento", { id: id });
    }
    try {
      var updateAgendamento = obterFuncao("updateAgendamento");
      var resultado = await updateAgendamento(id, { status: "cancelado" });
      if (!resultado) {
        return erro(
          "AGENDAMENTO_NAO_CANCELADO",
          "O agendamento não foi cancelado. Pode faltar permissão (admin/gerente) ou o registo não existir."
        );
      }
      return ok(resultado);
    } catch (e) {
      return erro("ERRO_CANCELAR_AGENDAMENTO", e && e.message ? e.message : String(e));
    }
  }

  // ----------------------------------------------------------
  // CATÁLOGO OFICIAL DE TOOLS
  // ----------------------------------------------------------
  var BENZA_TOOLS = {
    "customer.list": {
      descricao: "Consultar clientes activos.",
      tipo: "read",
      confirmacao: false,
      executar: clientes
    },
    "appointment.list": {
      descricao: "Consultar agendamentos.",
      tipo: "read",
      confirmacao: false,
      executar: agendamentos
    },
    "sales.list": {
      descricao: "Consultar movimentos de vendas e despesas.",
      tipo: "read",
      confirmacao: false,
      executar: movimentos
    },
    "team.list": {
      descricao: "Consultar profissionais activos.",
      tipo: "read",
      confirmacao: false,
      executar: profissionais
    },
    "service.list": {
      descricao: "Consultar serviços activos.",
      tipo: "read",
      confirmacao: false,
      executar: servicos
    },
    "customer.create": {
      descricao: "Criar cliente.",
      tipo: "write",
      confirmacao: false,
      executar: criarCliente
    },
    "appointment.create": {
      descricao: "Criar agendamento.",
      tipo: "write",
      confirmacao: true,
      executar: criarAgendamento
    },
    "expense.create": {
      descricao: "Registar despesa.",
      tipo: "write",
      confirmacao: true,
      executar: registarDespesa
    },
    "appointment.cancel": {
      descricao: "Cancelar agendamento.",
      tipo: "write",
      confirmacao: true,
      executar: cancelarAgendamento
    }
  };

  // ----------------------------------------------------------
  // EXPOSIÇÃO GLOBAL
  // ----------------------------------------------------------
  window.BenzaTools = {
    listar: function () {
      return Object.keys(BENZA_TOOLS);
    },
    existe: function (nome) {
      return !!BENZA_TOOLS[nome];
    },
    obter: function (nome) {
      return BENZA_TOOLS[nome] || null;
    },
    catalogo: function () {
      return Object.keys(BENZA_TOOLS).map(function (k) {
        var t = BENZA_TOOLS[k];
        return {
          nome: k,
          descricao: t.descricao,
          tipo: t.tipo,
          confirmacao: !!t.confirmacao
        };
      });
    },
    executar: async function (nome) {
      var args = Array.prototype.slice.call(arguments, 1);
      var tool = BENZA_TOOLS[nome];
      if (!tool) {
        return erro("TOOL_INEXISTENTE", "Essa operação não está disponível para a Benza.");
      }
      try {
        return await tool.executar.apply(null, args);
      } catch (e) {
        return erro("TOOL_ERROR", e && e.message ? e.message : String(e));
      }
    }
  };
})();

/* ===== FILE: expirar-agendamento.js ===== */
// ====================================================================
//  expirar-agendamento.js — alerta com minutos exactos (≤ 5 min)
// ====================================================================

var BP_ALERT_VISTO_PREFIX = 'bp_alert_visto_';
var BP_EXPIRING_WINDOW_MS = 5 * 60 * 1000;
var BP_EXPIRING_INTERVAL_MS = 15000; // 15s — leitura contínua, não só no reload
var _bpExpiringTimer = null;
var _bpExpiringBusy = false;
var _bpExpiringCurrentId = null;
var _bpExpiringLastShowAt = 0;
var _bpExpiringTick = null;
var BP_EXPIRING_MIN_GAP_MS = 1500;

function bpAlertVistoKey(id) {
  return BP_ALERT_VISTO_PREFIX + String(id || '');
}

function bpIsAlertVisto(id) {
  if (!id) return false;
  try {
    var v = localStorage.getItem(bpAlertVistoKey(id));
    return v === 'true' || v === '1';
  } catch (_) {
    return false;
  }
}

function bpMarkAlertVisto(id) {
  if (!id) return;
  try { localStorage.setItem(bpAlertVistoKey(id), 'true'); } catch (_) {}
}

function bpClearAlertVisto(id) {
  if (!id) return;
  try { localStorage.removeItem(bpAlertVistoKey(id)); } catch (_) {}
}

function bpGetClienteTelefoneFromAg(ag) {
  if (!ag) return '';
  var tel = '';
  if (ag.cliente_id && typeof state !== 'undefined' && state.clientes) {
    var c = state.clientes.find(function (x) {
      return x && String(x.id) === String(ag.cliente_id);
    });
    if (c && c.telefone) tel = String(c.telefone);
  }
  if (!tel && ag.telefone) tel = String(ag.telefone);
  if (!tel && ag.cliente && typeof state !== 'undefined' && state.clientes) {
    var c2 = state.clientes.find(function (x) {
      return x && x.nome === ag.cliente;
    });
    if (c2 && c2.telefone) tel = String(c2.telefone);
  }
  return String(tel || '').replace(/\D/g, '');
}

function bpNormTelWa(digits) {
  var d = String(digits || '').replace(/\D/g, '');
  if (!d) return '';
  if (d.indexOf('244') === 0 && d.length >= 12) return d;
  if (d.length === 9) return '244' + d;
  return d;
}

function bpParseAgDtLocal(data, hora) {
  if (typeof _parseAgDateTime === 'function') {
    var dt0 = _parseAgDateTime(data, hora);
    if (dt0) return dt0;
  }
  var d = String(data || '').trim();
  var h = String(hora || '00:00').trim().slice(0, 5);
  if (!d) return null;
  // Garantir HH:MM com 2 dígitos
  var parts = h.split(':');
  var hh = String(parts[0] || '0').padStart(2, '0');
  var mm = String(parts[1] || '0').padStart(2, '0');
  var iso = d + 'T' + hh + ':' + mm + ':00';
  var dt = new Date(iso);
  if (isNaN(dt.getTime())) {
    // fallback local components
    var dp = d.split('-');
    if (dp.length === 3) {
      dt = new Date(
        parseInt(dp[0], 10),
        parseInt(dp[1], 10) - 1,
        parseInt(dp[2], 10),
        parseInt(hh, 10),
        parseInt(mm, 10),
        0
      );
    }
  }
  return isNaN(dt.getTime()) ? null : dt;
}

/** ms restantes. null = N/A; <=0 = já passou. */
function bpIsAppointmentExpiring(ag, nowMs) {
  if (!ag) return null;
  var st = String(ag.status || ag.estado || 'agendado').toLowerCase();
  if (st !== 'agendado') return null;
  var dt = bpParseAgDtLocal(ag.data, ag.hora);
  if (!dt) return null;
  var now = nowMs != null ? nowMs : Date.now();
  return dt.getTime() - now;
}

function bpFormatRemainText(remainMs) {
  if (remainMs == null || remainMs <= 0) return '0 segundos';
  var totalSec = Math.max(1, Math.ceil(remainMs / 1000));
  var mins = Math.floor(totalSec / 60);
  var secs = totalSec % 60;
  var timeText = '';
  if (mins > 0) {
    timeText = mins + ' minuto' + (mins > 1 ? 's' : '');
    if (secs > 0) {
      timeText += ' e ' + secs + ' segundo' + (secs > 1 ? 's' : '');
    }
  } else {
    timeText = secs + ' segundo' + (secs > 1 ? 's' : '');
  }
  return timeText;
}

function bpEscHtmlLite(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Actualiza a frase completa do modal (countdown fluido). */
function bpUpdateExpiryMessage(remainMs, clienteNome) {
  var msgEl = document.getElementById('expirar-message');
  if (!msgEl) return;
  var nome = bpEscHtmlLite(clienteNome || 'Cliente');
  var timeText = bpEscHtmlLite(bpFormatRemainText(remainMs));
  msgEl.innerHTML =
    'O agendamento com <strong class="bp-expirar-cliente" id="expirar-cliente-nome">' + nome + '</strong> ' +
    'está prestes a ser marcado como não realizado em <strong class="bp-expirar-tempo" id="expirar-tempo">' + timeText + '</strong>. ' +
    'Entre em contacto agora para tentar recuperar o atendimento ou combinar um novo horário com a cliente.';
}

function bpGetClosestExpiring() {
  var now = Date.now();
  var best = null;
  var bestRemain = Infinity;
  var list = (typeof state !== 'undefined' && state.agendamentos) ? state.agendamentos : [];
  for (var i = 0; i < list.length; i++) {
    var ag = list[i];
    if (!ag || !ag.id) continue;
    if (bpIsAlertVisto(ag.id)) continue;
    var remain = bpIsAppointmentExpiring(ag, now);
    if (remain == null) continue;
    if (remain <= 0) continue;
    if (remain > BP_EXPIRING_WINDOW_MS) continue;
    if (remain < bestRemain) {
      bestRemain = remain;
      best = ag;
    }
  }
  return best ? { ag: best, remain: bestRemain } : null;
}

function bpIsExpirarModalOpen() {
  var open = document.getElementById('modal-expirar');
  if (!open) return false;
  return open.classList.contains('open') || open.classList.contains('is-open');
}

function bpAnyBlockingModalOpen() {
  try {
    var nodes = document.querySelectorAll('.modal-overlay.open, .modal-overlay.is-open');
    for (var i = 0; i < nodes.length; i++) {
      var id = nodes[i].id || '';
      if (id && id !== 'modal-expirar') return true;
    }
  } catch (_) {}
  return false;
}

function bpAppShellVisible() {
  try {
    var app = document.getElementById('app-view');
    if (!app) return false;
    if (app.style.display === 'none') return false;
  } catch (_) {}
  return true;
}

function bpStopRemainTick() {
  if (_bpExpiringTick) {
    clearInterval(_bpExpiringTick);
    _bpExpiringTick = null;
  }
}

function bpStartRemainTick() {
  bpStopRemainTick();
  _bpExpiringTick = setInterval(function () {
    if (!bpIsExpirarModalOpen() || !_bpExpiringCurrentId) {
      bpStopRemainTick();
      return;
    }
    if (typeof state === 'undefined' || !state.agendamentos) return;
    var cur = null;
    for (var i = 0; i < state.agendamentos.length; i++) {
      var a = state.agendamentos[i];
      if (a && String(a.id) === String(_bpExpiringCurrentId)) { cur = a; break; }
    }
    var rem = cur ? bpIsAppointmentExpiring(cur) : null;
    if (rem == null || rem <= 0) {
      bpStopRemainTick();
      bpCloseExpirarModal();
      return;
    }
    var nome = cur.cliente || 'Cliente';
    bpUpdateExpiryMessage(rem, nome);
  }, 1000);
}

function bpCloseExpirarModal() {
  bpStopRemainTick();
  _bpExpiringCurrentId = null;
  if (typeof closeModal === 'function') closeModal('modal-expirar');
  else {
    var m = document.getElementById('modal-expirar');
    if (m) {
      m.classList.remove('open', 'is-open');
      m.style.display = '';
      m.setAttribute('aria-hidden', 'true');
      try { m.setAttribute('hidden', ''); } catch (_) {}
    }
  }
}

function bpShowExpirarModal(ag, remainMs) {
  if (!ag || !ag.id) return;
  if (!bpAppShellVisible()) return;
  if (bpAnyBlockingModalOpen()) return;
  if (bpIsAlertVisto(ag.id)) return;
  var remain = remainMs != null ? remainMs : bpIsAppointmentExpiring(ag);
  if (remain == null || remain <= 0 || remain > BP_EXPIRING_WINDOW_MS) return;

  var modal = document.getElementById('modal-expirar');
  if (!modal) return;

  var nowShow = Date.now();
  if (bpIsExpirarModalOpen() && _bpExpiringCurrentId === ag.id) {
    bpUpdateExpiryMessage(remain, ag.cliente || 'Cliente');
    return;
  }
  if (nowShow - _bpExpiringLastShowAt < BP_EXPIRING_MIN_GAP_MS && bpIsExpirarModalOpen()) return;
  _bpExpiringLastShowAt = nowShow;
  _bpExpiringCurrentId = ag.id;

  bpUpdateExpiryMessage(remain, ag.cliente || 'Cliente');

  var tel = bpGetClienteTelefoneFromAg(ag);
  var btnLigar = document.getElementById('expirar-ligar');
  var btnWa = document.getElementById('expirar-whatsapp');
  function setTelBtn(btn, ok) {
    if (!btn) return;
    if (ok) {
      btn.disabled = false;
      btn.classList.remove('is-disabled');
      btn.style.opacity = '';
      btn.removeAttribute('aria-disabled');
      btn.dataset.tel = tel;
      if (btn.id === 'expirar-ligar') btn.classList.add('bp-call-anim');
    } else {
      btn.disabled = true;
      btn.classList.add('is-disabled');
      btn.style.opacity = '0.4';
      btn.setAttribute('aria-disabled', 'true');
      delete btn.dataset.tel;
      if (btn.id === 'expirar-ligar') btn.classList.remove('bp-call-anim');
    }
  }
  setTelBtn(btnLigar, !!tel);
  setTelBtn(btnWa, !!tel);

  try { modal.removeAttribute('hidden'); } catch (_) {}
  if (typeof openModal === 'function') openModal('modal-expirar');
  else {
    modal.style.display = 'flex';
    modal.classList.add('open', 'is-open');
  }
  try { modal.setAttribute('aria-hidden', 'false'); } catch (_) {}
  bpStartRemainTick();
}

function bpCheckExpiringAppointments() {
  if (_bpExpiringBusy) return;
  _bpExpiringBusy = true;
  try {
    if (!bpAppShellVisible()) return;
    if (typeof state === 'undefined' || !state.agendamentos) return;

    if (bpIsExpirarModalOpen() && _bpExpiringCurrentId) {
      var cur = state.agendamentos.find(function (a) {
        return a && String(a.id) === String(_bpExpiringCurrentId);
      });
      var rem = cur ? bpIsAppointmentExpiring(cur) : null;
      if (!cur || rem == null || rem <= 0 || bpIsAlertVisto(_bpExpiringCurrentId)) {
        bpCloseExpirarModal();
      } else if (rem <= BP_EXPIRING_WINDOW_MS) {
        bpUpdateExpiryMessage(rem, cur.cliente || 'Cliente');
        return;
      }
    }

    if (bpAnyBlockingModalOpen()) return;

    var hit = bpGetClosestExpiring();
    if (hit) bpShowExpirarModal(hit.ag, hit.remain);
  } catch (e) {
    console.warn('[expirar] check', e);
  } finally {
    _bpExpiringBusy = false;
  }
}

function bpBindExpirarModalOnce() {
  var modal = document.getElementById('modal-expirar');
  if (!modal || modal.dataset.bpBound === '1') return;
  modal.dataset.bpBound = '1';

  var ligar = document.getElementById('expirar-ligar');
  var wa = document.getElementById('expirar-whatsapp');
  var ignorar = document.getElementById('expirar-visto') || document.getElementById('expirar-ignorar');

  if (ligar && !ligar.dataset.bpBound) {
    ligar.dataset.bpBound = '1';
    ligar.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (ligar.disabled) return;
      var tel = ligar.dataset.tel || '';
      if (!tel) return;
      window.location.href = 'tel:' + tel;
    });
  }
  if (wa && !wa.dataset.bpBound) {
    wa.dataset.bpBound = '1';
    wa.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (wa.disabled) return;
      var tel = bpNormTelWa(wa.dataset.tel || '');
      if (!tel) return;
      window.open('https://wa.me/' + tel, '_blank', 'noopener,noreferrer');
    });
  }
  if (ignorar && !ignorar.dataset.bpBound) {
    ignorar.dataset.bpBound = '1';
    ignorar.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (_bpExpiringCurrentId) bpMarkAlertVisto(_bpExpiringCurrentId);
      bpCloseExpirarModal();
      setTimeout(bpCheckExpiringAppointments, 400);
    });
  }

  try {
    if (typeof MutationObserver !== 'undefined') {
      var obs = new MutationObserver(function () {
        if (!bpIsExpirarModalOpen() && _bpExpiringCurrentId) {
          _bpExpiringCurrentId = null;
        }
      });
      obs.observe(modal, { attributes: true, attributeFilter: ['class', 'style', 'hidden'] });
    }
  } catch (_) {}
}

function bpStartExpiringWatcher() {
  bpBindExpirarModalOnce();
  if (_bpExpiringTimer) {
    clearInterval(_bpExpiringTimer);
    _bpExpiringTimer = null;
  }
  _bpExpiringTimer = setInterval(bpCheckExpiringAppointments, BP_EXPIRING_INTERVAL_MS);
  // Checks iniciais escalonados (dados podem chegar após loadState)
  setTimeout(bpCheckExpiringAppointments, 800);
  setTimeout(bpCheckExpiringAppointments, 3000);
  setTimeout(bpCheckExpiringAppointments, 8000);
  if (!window._bpExpiringVisBound) {
    window._bpExpiringVisBound = true;
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') {
        setTimeout(bpCheckExpiringAppointments, 400);
      }
    });
  }
}

if (typeof window !== 'undefined') {
  window.bpCheckExpiringAppointments = bpCheckExpiringAppointments;
  window.bpStartExpiringWatcher = bpStartExpiringWatcher;
  window.bpIsAppointmentExpiring = bpIsAppointmentExpiring;
  window.bpGetClosestExpiring = bpGetClosestExpiring;
  window.bpClearAlertVisto = bpClearAlertVisto;
  window.bpMarkAlertVisto = bpMarkAlertVisto;
}

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
  /* Splash BeautyPro banido */
  try {
    var _sp = document.getElementById('splash-screen');
    if (_sp) {
      _sp.style.cssText = 'display:none!important;opacity:0;visibility:hidden;pointer-events:none;';
      _sp.setAttribute('hidden', '');
      _sp.setAttribute('aria-hidden', 'true');
    }
    if (typeof hideSplash === 'function') hideSplash();
  } catch (_) {}
  /* Anti-flash login: reforço imediato se sessão local */
  try {
    if (localStorage.getItem('bp_session_active') === '1' && localStorage.getItem('bp_salao_id_cache')) {
      document.documentElement.classList.add('bp-has-session');
      var _lv = document.getElementById('login-view');
      if (_lv) { _lv.style.display = 'none'; _lv.classList.remove('active'); }
    }
  } catch (_) {}
  /* Overlay o mais cedo possível (<1s): antes de checkSession/UI */
  try {
    var loggedOut = false;
    try { loggedOut = localStorage.getItem('bp_logged_out') === '1'; } catch (_) {}
    var hasSalao = false;
    try { hasSalao = !!localStorage.getItem('bp_salao_id_cache'); } catch (_) {}
    if (!loggedOut && hasSalao) {
      if (navigator.onLine && typeof bpShowBootOverlay === 'function') {
        bpShowBootOverlay();
      } else if (!navigator.onLine && typeof bpShowBootOverlay === 'function') {
        /* Offline: spinner com texto de modo offline */
        try {
          bpShowBootOverlay();
          var t = document.getElementById('bp-boot-title');
          var d = document.getElementById('bp-boot-desc');
          if (t) t.textContent = 'Modo offline';
          if (d) d.textContent = 'Dados disponíveis no dispositivo…';
        } catch (_) {}
      }
    }
  } catch (_) {}
  // Estado inicial: classes no <html> (gate CSS). Sem forçar display:flex no login.
  try {
    if (!document.documentElement.classList.contains('bp-has-session')) {
      var _lv0 = document.getElementById('login-view');
      var _av0 = document.getElementById('app-view');
      if (_lv0) _lv0.style.display = '';
      if (_av0) _av0.style.display = 'none';
    } else {
      var _lv1 = document.getElementById('login-view');
      if (_lv1) { _lv1.style.display = 'none'; _lv1.classList.remove('active'); }
    }
  } catch (_) {}

  // Ponto 1 — indicador Online/Offline atualizado já aqui, ANTES de
  // qualquer chamada de rede (openDB/checkSession). atualizarIndicadorSync()
  // só depende de navigator.onLine (instantâneo) e da fila local em
  // localStorage (instantâneo) — não precisa de sessão nem de perfil.
  // O HTML tem "Offline" fixo por defeito (index.html), por isso sem esta
  // chamada antecipada o texto ficava errado durante todo o checkSession().
  if (typeof atualizarIndicadorSync === 'function') atualizarIndicadorSync();
  try { if (typeof bpStartHealthMonitor === 'function') bpStartHealthMonitor({ intervalMs: 30000 }); } catch (_) {}
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
    b.classList.remove('active', 'is-active');
    if (b.dataset.filtro === filtro) b.classList.add('is-active');
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
  try {
    if (typeof bpProbePersistence === 'function') {
      bpProbePersistence().then(function (p) {
        if (p && !p.idb && !p.ls) {
          console.warn('[persist] armazenamento local indisponível — modo degradado');
        }
      });
    }
  } catch (_) {}
  try {
    await checkSession();
  } catch (errBoot) {
    console.error('[Boot] Erro:', errBoot);
  } finally {
    /* Garantir fecho do overlay em todos os caminhos */
    try {
      if (typeof bpHideBootOverlay === 'function') bpHideBootOverlay();
    } catch (_) {}
    try { document.documentElement.classList.remove('bp-booting'); } catch (_) {}
  }
  try { if (typeof bpTouchSessionLocal === 'function' && typeof bpHasLocalSession === 'function' && bpHasLocalSession()) bpTouchSessionLocal(); } catch (_) {}
  if (!dbDisponivel) {
    // Reforça a mensagem já dada acima, para o caso de o toast anterior
    // ter sido perdido durante a transição de ecrãs.
    setTimeout(() => toast('Não foi possível aceder aos dados locais deste dispositivo. Tenta recarregar a página.', 'error'), 1400);
  }

  // Splash (removida após verificação de sessão)
  // Splash: hideSplash já pode ter corrido no checkSession; fallback curto
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

  // Etapa 2 — alerta de expiração (intervalo + check imediato)
  try {
    if (typeof bpStartExpiringWatcher === 'function') bpStartExpiringWatcher();
  } catch (_) {}
  // Boot quiet: evitar “vibração” de KPIs no 1.º updateUI pós-pull
  try { window.__bpQuietUI = true; setTimeout(function () { window.__bpQuietUI = false; }, 2500); } catch (_) {}


  // ================================================================
  // CORREÇÃO (sync lento sem reload): existiam DOIS throttles de 90s
  // (este, e outro em security-hardening.js/bpSilentPull) que limitavam
  // o pull real ao Supabase a, no máximo, 1x a cada 90s quando não havia
  // fila local pendente. Por isso o dispositivo B só via as alterações
  // do dispositivo A quase de imediato ao recarregar a página (o reload
  // ignora o throttle, ver checkSession()/bpSilentPull(true) em
  // auth-supabase.js), mas com a app apenas aberta podia demorar até
  // 90s. Agora faz pull a cada poucos segundos, sem throttle, com uma
  // guarda simples para nunca sobrepor dois pulls em curso.
  // ================================================================
  // Pull silencioso: 45s, sem vibração de UI se modal aberto ou dados iguais
  const SYNC_POLL_MS = 45000;
  let bpPullEmCurso = false;
  function bpModalAberto() {
    try {
      return !!document.querySelector('.modal-overlay.open, .modal-sheet.open, .bp-shell-modal.open');
    } catch (_) { return false; }
  }
  setInterval(() => {
    if (!(navigator.onLine && document.visibilityState === 'visible' && state?.config?.salaoId)) return;
    if (bpPullEmCurso || bpModalAberto()) return;
    bpPullEmCurso = true;
    carregarDoSupabase().then(atualizado => {
      window.BPRuntime = window.BPRuntime || {}; window.BPRuntime.lastSupabasePull = Date.now();
      // Só repintar se houve mudança real E nenhum modal aberto
      if (atualizado && !bpModalAberto()) {
        if (typeof renderBadges === 'function') renderBadges();
        // updateUI completo só se não houver formulário aberto
        if (typeof updateUI === 'function') updateUI();
      }
    }).catch(() => {}).finally(() => { bpPullEmCurso = false; });
  }, SYNC_POLL_MS);

  // Ponto 3 — Forçar pull quando a app volta ao foco (visível)
  // Isto garante que ao trocar de app e voltar, os dados são atualizados
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState !== 'visible' || !navigator.onLine || !state?.config?.salaoId) return;
    if (bpPullEmCurso) return;
    bpPullEmCurso = true;
    try {
      const atualizado = await carregarDoSupabase();
      if (atualizado && !bpModalAberto()) {
        if (typeof renderBadges === 'function') renderBadges();
        if (typeof updateUI === 'function') updateUI();
      }
      if (typeof aplicarPermissoes === 'function') aplicarPermissoes();
    } catch (e) {
      console.warn('[Sync] foco:', e);
    } finally {
      bpPullEmCurso = false;
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

/* ===== Etapa 3 — Boot overlay (15s) + continuar offline ===== */
(function bpBootOverlayModule() {
  var BOOT_MS = 15000;
  var timer = null;
  var active = false;

  function el() { return document.getElementById('bp-boot-overlay'); }
  function actions() { return document.getElementById('bp-boot-actions'); }
  function spinner() { return document.querySelector('#bp-boot-overlay .bp-boot-spinner'); }
  function title() { return document.getElementById('bp-boot-title'); }
  function desc() { return document.getElementById('bp-boot-desc'); }

  function showSpinnerState() {
    var a = actions();
    if (a) a.hidden = true;
    var s = spinner();
    if (s) s.style.display = '';
    if (title()) title().textContent = 'A sincronizar';
    if (desc()) desc().textContent = 'A actualizar os dados do salão…';
  }

  function showFailState() {
    var a = actions();
    if (a) a.hidden = false;
    var s = spinner();
    if (s) s.style.display = 'none';
    if (title()) title().textContent = 'Sem ligação estável';
    if (desc()) desc().textContent = '';
  }

  function openBoot() {
    var o = el();
    if (!o) return;
    active = true;
    try { document.documentElement.classList.add('bp-booting'); } catch (_) {}
    o.hidden = false;
    try { o.removeAttribute('hidden'); } catch (_) {}
    o.classList.add('is-open');
    o.style.display = 'flex';
    o.setAttribute('aria-hidden', 'false');
    showSpinnerState();
    clearTimeout(timer);
    timer = setTimeout(function () {
      if (!active) return;
      showFailState();
    }, BOOT_MS);
  }

  function closeBoot(opts) {
    opts = opts || {};
    active = false;
    clearTimeout(timer);
    timer = null;
    /* CRÍTICO: remover bp-booting para o CSS deixar de forçar o overlay */
    try { document.documentElement.classList.remove('bp-booting'); } catch (_) {}
    var o = el();
    if (!o) return;
    o.hidden = true;
    try { o.setAttribute('hidden', ''); } catch (_) {}
    o.classList.remove('is-open');
    o.style.display = 'none';
    o.style.pointerEvents = 'none';
    o.setAttribute('aria-hidden', 'true');
  }

  function retry() {
    showSpinnerState();
    clearTimeout(timer);
    timer = setTimeout(function () {
      if (!active) return;
      showFailState();
    }, BOOT_MS);
    if (typeof carregarDoSupabase === 'function' && navigator.onLine) {
      carregarDoSupabase().then(function () {
        closeBoot();
        try { window.__bpQuietUI = true; } catch (_) {}
        if (typeof updateUI === 'function') updateUI();
        try { setTimeout(function () { window.__bpQuietUI = false; }, 1500); } catch (_) {}
        if (typeof flushSyncQueue === 'function') flushSyncQueue();
        try { if (typeof bpCheckExpiringAppointments === 'function') bpCheckExpiringAppointments(); } catch (_) {}
      }).catch(function () {
        showFailState();
      });
    } else {
      showFailState();
    }
  }

  function continueOffline() {
    closeBoot({ skipCheckmark: true });
    if (typeof flushSyncQueue === 'function' && navigator.onLine) {
      try { flushSyncQueue(); } catch (_) {}
    }
  }

  function bind() {
    var r = document.getElementById('bp-boot-retry');
    var o = document.getElementById('bp-boot-offline');
    if (r && !r.dataset.bound) {
      r.dataset.bound = '1';
      r.addEventListener('click', function (e) { e.preventDefault(); retry(); });
    }
    if (o && !o.dataset.bound) {
      o.dataset.bound = '1';
      o.addEventListener('click', function (e) { e.preventDefault(); continueOffline(); });
    }
  }

  window.bpShowBootOverlay = openBoot;
  /* Safety net: nunca deixar bp-booting > 20s */
  setTimeout(function () {
    try {
      if (document.documentElement.classList.contains('bp-booting')) {
        console.warn('[boot] safety: a forçar fecho do overlay após 20s');
        closeBoot({ skipCheckmark: true });
      }
    } catch (_) {}
  }, 20000);
  // Se for para login, nunca deixar overlay preso
  var _bpShowLoginOrig = typeof window.bpShowLoginShell === 'function' ? window.bpShowLoginShell : null;
  // patch applied after functions exist — see end of IIFE

  window.bpHideBootOverlay = closeBoot;
  window.bpBootContinueOffline = continueOffline;
  window.bpBootShowFail = function () {
    if (!active) return;
    showFailState();
  };

  window.addEventListener('offline', function () {
    /* Offline-first: não prender o utilizador no overlay */
    closeBoot({ skipCheckmark: true });
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
  setTimeout(bind, 500);

  // Login shell: fechar overlay se estiver aberto
  try {
    if (typeof bpShowLoginShell === 'function') {
      var _origLogin = bpShowLoginShell;
      window.bpShowLoginShell = function () {
        try { closeBoot(); } catch (_) {}
        return _origLogin.apply(this, arguments);
      };
    }
  } catch (_) {}
})();

/* ===== FILE: finance-comissoes.js ===== */
// ================================================================
// FUNCIONALIDADE 1: Comissões automáticas com metas
// Offline-first — sem dependência de Supabase nesta etapa
// ================================================================


function _movVendaContaComissao(m) {
  if (!m || m.tipo !== 'venda') return false;
  var st = String(m.status || '').toLowerCase();
  if (st === 'cancelado' || st === 'anulado') return false;
  return true;
}

function calcularComissao(valorLiquido, taxa) {
  const v = Number(valorLiquido) || 0;
  const t = Number(taxa) || 0;
  if (v <= 0 || t <= 0) return 0;
  return Math.round((v * (t / 100)) * 100) / 100;
}

function getTaxaComissao(profissionalId) {
  if (!profissionalId || typeof state === 'undefined') return 0;
  const p = (state.profissionais || []).find(x => x.id === profissionalId);
  return p ? (Number(p.taxa_comissao) || 0) : 0;
}

function getSaldoComissao(profissionalId) {
  if (!profissionalId || typeof state === 'undefined') return 0;
  return (state.movimentos || [])
    .filter(m => _movVendaContaComissao(m) && m.profissional_id === profissionalId)
    .reduce((s, m) => s + (Number(m.comissao_gerada) || 0), 0);
}

function getComissaoMesAtual(profissionalId) {
  if (!profissionalId || typeof state === 'undefined' || typeof hoje !== 'function') return 0;
  const agora = hoje(); // YYYY-MM-DD
  const ym = agora.slice(0, 7);
  return (state.movimentos || [])
    .filter(m => _movVendaContaComissao(m) && m.profissional_id === profissionalId && String(m.data || '').startsWith(ym))
    .reduce((s, m) => s + (Number(m.comissao_gerada) || 0), 0);
}

function getProgressoMeta(profissionalId) {
  if (!profissionalId || typeof state === 'undefined') return null;
  const p = (state.profissionais || []).find(x => x.id === profissionalId);
  if (!p || p.meta_mensal == null || Number(p.meta_mensal) <= 0) return null;
  const meta = Number(p.meta_mensal);
  // progresso = volume de vendas (valor) no mês, não comissão
  const agora = typeof hoje === 'function' ? hoje() : '';
  const ym = agora.slice(0, 7);
  const volume = (state.movimentos || [])
    .filter(m => _movVendaContaComissao(m) && m.profissional_id === profissionalId && String(m.data || '').startsWith(ym))
    .reduce((s, m) => s + (Number(m.valor) || 0), 0);
  const pct = Math.min(100, Math.round((volume / meta) * 100));
  return { meta, volume, pct, atingida: volume >= meta };
}

function renderBarraMeta(profissionalId) {
  try {
    const prog = getProgressoMeta(profissionalId);
    if (!prog) return '';
    const fmt = typeof fmtKz === 'function' ? fmtKz : (v => v + ' Kz');
    return (
      '<div class="meta-barra-wrap" style="margin-top:6px;">' +
        '<div style="display:flex;justify-content:space-between;font-size:.65rem;color:var(--text-muted);margin-bottom:3px;">' +
          '<span>Meta mensal</span>' +
          '<span>' + fmt(prog.volume) + ' / ' + fmt(prog.meta) + ' (' + prog.pct + '%)</span>' +
        '</div>' +
        '<div style="height:6px;background:var(--border-soft,#DCD5C9);border-radius:4px;overflow:hidden;">' +
          '<div style="height:100%;width:' + prog.pct + '%;background:var(--gold,#D4AF37);border-radius:4px;"></div>' +
        '</div>' +
      '</div>'
    );
  } catch (e) {
    return '';
  }
}

window.calcularComissao = calcularComissao;
window.getTaxaComissao = getTaxaComissao;
window.getSaldoComissao = getSaldoComissao;
window.getComissaoMesAtual = getComissaoMesAtual;
window.getProgressoMeta = getProgressoMeta;
window.renderBarraMeta = renderBarraMeta;

/* ===== FILE: finance-fase1-extra.js ===== */
// ================================================================
// Grupo 1 (resto) — offline-first, sem Supabase nesta etapa
// F4 Rentabilidade | F13 Split pagamento | F16 Metas salão
// F22 Fluxo caixa diário | F23 Despesas operacionais
// ================================================================
(function () {
  'use strict';

  var CATEGORIAS_DESPESA = [
    { id: 'produtos', nome: 'Produtos / Stock' },
    { id: 'renda', nome: 'Renda / Aluguer' },
    { id: 'salarios', nome: 'Salários' },
    { id: 'utilities', nome: 'Água / Luz / Net' },
    { id: 'marketing', nome: 'Marketing' },
    { id: 'manutencao', nome: 'Manutenção' },
    { id: 'outro', nome: 'Outro' }
  ];

  // ---------- F16: Meta financeira do salão ----------
  function getMetaSalao() {
    try {
      var c = (state && state.config) || {};
      if (c.meta_mensal_salao != null && c.meta_mensal_salao > 0) return Number(c.meta_mensal_salao);
      var ls = localStorage.getItem('bp_meta_salao');
      return ls ? Number(ls) || 0 : 0;
    } catch (e) { return 0; }
  }

  function setMetaSalao(valor) {
    var n = Math.max(0, Math.round(Number(valor) || 0));
    try {
      localStorage.setItem('bp_meta_salao', String(n));
      if (typeof state !== 'undefined' && state.config) {
        state.config.meta_mensal_salao = n;
        if (typeof dbPut === 'function') {
          dbPut('config', Object.assign({}, state.config, { id: 'main' })).catch(function () {});
        }
      }
    } catch (e) {}
    return n;
  }

  function getReceitaMesAtual() {
    if (typeof state === 'undefined' || typeof hoje !== 'function') return 0;
    var ym = hoje().slice(0, 7);
    return (state.movimentos || [])
      .filter(function (m) { return m.tipo === 'venda' && String(m.data || '').startsWith(ym); })
      .reduce(function (s, m) { return s + (Number(m.valor) || 0); }, 0);
  }

  function getProgressoMetaSalao() {
    var meta = getMetaSalao();
    if (meta <= 0) return null;
    var vol = getReceitaMesAtual();
    var pct = Math.min(100, Math.round((vol / meta) * 100));
    return { meta: meta, volume: vol, pct: pct, atingida: vol >= meta };
  }

  // ---------- F4: Rentabilidade ----------
  var RENT_PERIODO_KEY = 'bp_rentab_periodo';

  function ymAtualRentab() {
    var d = typeof hoje === 'function' ? hoje() : new Date().toISOString().slice(0, 10);
    return String(d).slice(0, 7);
  }

  /** periodo: 'mes' | 'tudo' — default mensal */
  function movimentosVendaPeriodo(periodo) {
    var p = periodo || 'mes';
    var movs = (state.movimentos || []).filter(function (m) {
      return m && m.tipo === 'venda';
    });
    if (p === 'mes') {
      var ym = ymAtualRentab();
      movs = movs.filter(function (m) {
        return String(m.data || '').startsWith(ym);
      });
    }
    return movs;
  }

  function calcRentabilidadeServicos(periodo) {
    var map = {};
    movimentosVendaPeriodo(periodo).forEach(function (m) {
      if (!m.itens) return;
      (m.itens || []).forEach(function (it) {
        var nome = it.nome || 'Sem nome';
        if (!map[nome]) map[nome] = { nome: nome, receita: 0, qtd: 0 };
        map[nome].receita += Number(it.subtotal) || 0;
        map[nome].qtd += Number(it.quantidade) || 1;
      });
    });
    (state.servicos || []).forEach(function (s) {
      if (map[s.nome] && s.custoBase != null) {
        map[s.nome].custo = (Number(s.custoBase) || 0) * map[s.nome].qtd;
      }
    });
    return Object.keys(map).map(function (k) {
      var r = map[k];
      var custo = r.custo || 0;
      var margem = r.receita - custo;
      var pct = r.receita > 0 ? Math.round((margem / r.receita) * 100) : 0;
      return { nome: r.nome, receita: r.receita, custo: custo, margem: margem, pct: pct, qtd: r.qtd };
    }).sort(function (a, b) { return b.receita - a.receita; });
  }

  function calcRentabilidadeProfissionais(periodo) {
    var map = {};
    movimentosVendaPeriodo(periodo).forEach(function (m) {
      var pid = m.profissional_id || 'sem';
      if (!map[pid]) {
        var nome = m.profissional || (typeof getProfissionalNome === 'function' ? getProfissionalNome(pid) : pid);
        map[pid] = { id: pid, nome: nome, receita: 0, comissao: 0, n: 0 };
      }
      map[pid].receita += Number(m.valor) || 0;
      map[pid].comissao += Number(m.comissao_gerada) || 0;
      map[pid].n += 1;
    });
    return Object.keys(map).map(function (k) {
      var r = map[k];
      var liquido = r.receita - r.comissao;
      var pct = r.receita > 0 ? Math.round((liquido / r.receita) * 100) : 0;
      return { id: r.id, nome: r.nome, receita: r.receita, comissao: r.comissao, liquido: liquido, pct: pct, vendas: r.n };
    }).sort(function (a, b) { return b.receita - a.receita; });
  }

  function totaisRentabilidade(periodo) {
    var movs = movimentosVendaPeriodo(periodo);
    var receita = 0;
    var comissao = 0;
    movs.forEach(function (m) {
      receita += Number(m.valor) || 0;
      comissao += Number(m.comissao_gerada) || 0;
    });
    return { receita: receita, comissao: comissao, vendas: movs.length };
  }

  // ---------- F22: Fluxo de caixa diário ----------
  function getFluxoDia(dataStr) {
    var d = dataStr || (typeof hoje === 'function' ? hoje() : '');
    var movs = (state.movimentos || []).filter(function (m) { return m.data === d; });
    var entradas = 0, saidas = 0;
    var porMetodo = {};
    var porCategoria = {};
    movs.forEach(function (m) {
      var v = Number(m.valor) || 0;
      if (m.tipo === 'venda') {
        entradas += v;
        if (m.pagamentos && Array.isArray(m.pagamentos)) {
          m.pagamentos.forEach(function (p) {
            var k = p.metodo || 'Numerário';
            porMetodo[k] = (porMetodo[k] || 0) + (Number(p.valor) || 0);
          });
        } else {
          var mp = m.metodoPagamento || 'Numerário';
          porMetodo[mp] = (porMetodo[mp] || 0) + v;
        }
      } else if (m.tipo === 'despesa') {
        saidas += v;
        var cat = m.categoria || 'outro';
        porCategoria[cat] = (porCategoria[cat] || 0) + v;
      }
    });
    return {
      data: d,
      entradas: entradas,
      saidas: saidas,
      saldo: entradas - saidas,
      porMetodo: porMetodo,
      porCategoria: porCategoria,
      movimentos: movs
    };
  }

  // ---------- F13: helpers split ----------
  function lerPagamentosSplit() {
    var box = document.getElementById('venda-split-box');
    if (!box || box.style.display === 'none') return null;
    var rows = box.querySelectorAll('.split-row');
    var list = [];
    var sum = 0;
    rows.forEach(function (row) {
      var metodo = row.querySelector('.split-metodo') ? row.querySelector('.split-metodo').value : 'Numerário';
      var valor = parseFloat(row.querySelector('.split-valor') ? row.querySelector('.split-valor').value : 0) || 0;
      if (valor > 0) {
        list.push({ metodo: metodo, valor: valor });
        sum += valor;
      }
    });
    return { list: list, sum: sum };
  }

  function totalCarrinho() {
    if (typeof cartItems === 'undefined' || !cartItems.length) return 0;
    return cartItems.reduce(function (s, i) { return s + (Number(i.subtotal) || 0); }, 0);
  }

  // ---------- UI: menu + modais ----------
  function ensureMenuItems() {
    var dd = document.getElementById('menu-dropdown');
    if (!dd || dd.querySelector('[data-bp-menu="finance"]')) return;
    var frag = document.createDocumentFragment();
    var sec = document.createElement('div');
    sec.className = 'bp-menu-section';
    sec.setAttribute('data-bp-menu', 'finance');
    sec.textContent = 'Financeiro';
    frag.appendChild(sec);
    var items = [
      { key: 'fluxo', label: 'Fluxo de caixa' },
      { key: 'rentab', label: 'Rentabilidade' },
      { key: 'meta', label: 'Meta do salão' },
      { key: 'despesas', label: 'Despesas' }
    ];
    items.forEach(function (it) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('data-bp-menu', 'finance');
      btn.setAttribute('data-bp-action', it.key);
      btn.innerHTML = '<span>' + it.label + '</span>';
      frag.appendChild(btn);
    });
    var logout = dd.querySelector('#logout-btn');
    if (logout) dd.insertBefore(frag, logout);
    else dd.appendChild(frag);
    dd.addEventListener('click', function (e) {
      var t = e.target.closest('[data-bp-action]');
      if (!t) return;
      e.stopPropagation();
      dd.style.display = 'none';
      var a = t.getAttribute('data-bp-action');
      if (a === 'fluxo') openModalFluxo();
      if (a === 'rentab') openModalRentabilidade();
      if (a === 'meta') openModalMetaSalao();
      if (a === 'despesas') openModalDespesaEnh();
    });
  }

  function ensureModalShell(id, title, eyebrow, subtitle) {
    if (typeof ensureBpSheetModal === 'function') {
      return ensureBpSheetModal(id, title, eyebrow, subtitle);
    }
    var el = document.getElementById(id);
    if (el) {
      var tEl = el.querySelector('.bp-sheet-title');
      if (tEl && title) tEl.textContent = title;
      return el;
    }
    el = document.createElement('div');
    el.id = id;
    el.className = 'modal-overlay';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-labelledby', id + '-title');
    var eye = eyebrow || 'BeautyPro';
    var sub = subtitle || '';
    el.innerHTML =
      '<div class="bp-sheet modal-sheet">' +
        '<div class="bp-sheet-handle handle" aria-hidden="true"></div>' +
        '<div class="bp-sheet-header">' +
          '<div class="bp-sheet-eyebrow">' + eye + '</div>' +
          '<h2 class="bp-sheet-title modal-title" id="' + id + '-title">' + title + '</h2>' +
          (sub ? '<p class="bp-sheet-subtitle">' + sub + '</p>' : '') +
        '</div>' +
        '<div class="bp-sheet-body" id="' + id + '-body"></div>' +
        '<div class="bp-sheet-footer modal-actions">' +
          '<button type="button" class="btn btn-secondary" data-close="' + id + '">Fechar</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(el);
    el.addEventListener('click', function (e) {
      if (e.target === el || e.target.getAttribute('data-close') === id) {
        if (typeof closeModal === 'function') closeModal(id);
        else el.classList.remove('open');
      }
    });
    return el;
  }

  function openModalFluxo() {
    ensureModalShell('modal-bp-fluxo', 'Fluxo de caixa', 'Financeiro', 'Movimento real do dia — entradas, saídas e saldo líquido.');
    var body = document.getElementById('modal-bp-fluxo-body');
    var hojeStr = typeof hoje === 'function' ? hoje() : '';
    var f = getFluxoDia(hojeStr);
    var fmt = typeof fmtKz === 'function' ? fmtKz : function (v) { return v + ' Kz'; };
    var saldoClass = f.saldo > 0 ? ' is-positive' : (f.saldo < 0 ? ' is-negative' : '');
    var metodos = Object.keys(f.porMetodo).map(function (k) {
      return '<div class="bp-row"><div class="bp-row-main"><div class="bp-row-title">' + k + '</div></div><div class="bp-row-value">' + fmt(f.porMetodo[k]) + '</div></div>';
    }).join('') || '<div class="bp-empty"><strong>Sem entradas</strong>Ainda não há vendas registadas hoje.</div>';
    var cats = Object.keys(f.porCategoria).map(function (k) {
      var nome = (CATEGORIAS_DESPESA.find(function (c) { return c.id === k; }) || {}).nome || k;
      return '<div class="bp-row"><div class="bp-row-main"><div class="bp-row-title">' + nome + '</div></div><div class="bp-row-value is-negative">' + fmt(f.porCategoria[k]) + '</div></div>';
    }).join('') || '<div class="bp-empty"><strong>Sem despesas</strong>Nenhuma saída categoriada hoje.</div>';
    var insight = '';
    if (f.entradas === 0 && f.saidas === 0) {
      insight = '<div class="bp-alert-banner"><strong>Dia ainda sem movimento</strong>Registe vendas ou despesas na aba Caixa para ver o fluxo aqui.</div>';
    } else if (f.saldo < 0) {
      insight = '<div class="bp-alert-banner is-warn"><strong>Saídas acima das entradas</strong>O saldo do dia está negativo em ' + fmt(Math.abs(f.saldo)) + '.</div>';
    } else if (f.entradas > 0) {
      insight = '<div class="bp-alert-banner is-ok"><strong>Dia positivo</strong>Entradas superam as saídas em ' + fmt(f.saldo) + '.</div>';
    }
    body.innerHTML =
      insight +
      '<div class="bp-kpi-grid">' +
        '<div class="bp-kpi"><div class="bp-kpi-label">Entradas</div><div class="bp-kpi-value is-positive">' + fmt(f.entradas) + '</div></div>' +
        '<div class="bp-kpi"><div class="bp-kpi-label">Saídas</div><div class="bp-kpi-value is-negative">' + fmt(f.saidas) + '</div></div>' +
        '<div class="bp-kpi"><div class="bp-kpi-label">Saldo</div><div class="bp-kpi-value' + saldoClass + '">' + fmt(f.saldo) + '</div></div>' +
      '</div>' +
      '<p class="bp-ref-line">Referência: <strong>' + f.data + '</strong> · dados locais deste dispositivo</p>' +
      '<div class="bp-section"><div class="bp-section-title">Formas de pagamento</div>' + metodos + '</div>' +
      '<div class="bp-section"><div class="bp-section-title">Despesas por categoria</div>' + cats + '</div>';
    if (typeof openModal === 'function') openModal('modal-bp-fluxo');
    else document.getElementById('modal-bp-fluxo').classList.add('open');
  }

  function openModalRentabilidade() {
    ensureModalShell('modal-bp-rentab', 'Rentabilidade', 'Análise', 'Receita, comissões e margem — por período.');
    renderRentabilidadeBody();
    if (typeof openModal === 'function') openModal('modal-bp-rentab');
    else {
      var el = document.getElementById('modal-bp-rentab');
      if (el) el.classList.add('open');
    }
  }

  function renderRentabilidadeBody() {
    var body = document.getElementById('modal-bp-rentab-body');
    if (!body) return;
    var periodo = localStorage.getItem(RENT_PERIODO_KEY) || 'mes';
    if (periodo !== 'mes' && periodo !== 'tudo') periodo = 'mes';
    var fmt = typeof fmtKz === 'function' ? fmtKz : function (v) { return v + ' Kz'; };
    var allServs = calcRentabilidadeServicos(periodo);
    var allProfs = calcRentabilidadeProfissionais(periodo);
    var tot = totaisRentabilidade(periodo);
    var servs = allServs.slice(0, 12);
    var profs = allProfs.slice(0, 12);
    var ym = ymAtualRentab();
    var labelPeriodo = periodo === 'mes' ? ('Mês ' + ym) : 'Histórico completo';

    var toggle =
      '<div class="bp-seg" role="tablist" aria-label="Período da rentabilidade">' +
        '<button type="button" class="bp-seg-btn' + (periodo === 'mes' ? ' is-active' : '') + '" data-rent-p="mes" role="tab">Este mês</button>' +
        '<button type="button" class="bp-seg-btn' + (periodo === 'tudo' ? ' is-active' : '') + '" data-rent-p="tudo" role="tab">Histórico</button></div>';

    var insight = '';
    if (!tot.vendas) {
      insight = '<div class="bp-alert-banner"><strong>Sem vendas neste período</strong>' +
        (periodo === 'mes' ? 'Ainda não há vendas registadas em ' + ym + '.' : 'Registe vendas com itens e profissional.') + '</div>';
    } else if (servs[0]) {
      var n0 = typeof escHtml === 'function' ? escHtml(servs[0].nome) : servs[0].nome;
      insight = '<div class="bp-alert-banner is-ok"><strong>Serviço mais forte: ' + n0 + '</strong>' +
        fmt(servs[0].receita) + ' de receita · margem ' + servs[0].pct + '% · ' + labelPeriodo + '.</div>';
    }

    var sHtml = servs.map(function (s) {
      var nome = typeof escHtml === 'function' ? escHtml(s.nome) : s.nome;
      var pctBadge = s.pct >= 70 ? ' is-green' : (s.pct < 40 ? ' is-red' : '');
      return '<div class="bp-row"><div class="bp-row-main"><div class="bp-row-title">' + nome +
        ' <span class="bp-badge' + pctBadge + '">' + s.pct + '%</span></div>' +
        '<div class="bp-row-meta">' + s.qtd + ' vendidos</div></div><div class="bp-row-value">' + fmt(s.receita) + '</div></div>';
    }).join('') || '<div class="bp-empty"><strong>Sem serviços no período</strong>Registe vendas com itens de serviço.</div>';

    var pHtml = profs.map(function (p) {
      var nome = typeof escHtml === 'function' ? escHtml(p.nome) : p.nome;
      return '<div class="bp-row"><div class="bp-row-main"><div class="bp-row-title">' + nome + '</div>' +
        '<div class="bp-row-meta">' + p.vendas + ' vendas · comissão ' + fmt(p.comissao) + '</div></div>' +
        '<div class="bp-row-value">' + fmt(p.receita) + '</div></div>';
    }).join('') || '<div class="bp-empty"><strong>Sem dados</strong>Atribua profissionais às vendas.</div>';

    body.innerHTML =
      toggle +
      insight +
      '<div class="bp-kpi-grid">' +
        '<div class="bp-kpi"><div class="bp-kpi-label">Receita</div><div class="bp-kpi-value is-positive" style="font-size:.75rem">' + fmt(tot.receita) + '</div></div>' +
        '<div class="bp-kpi"><div class="bp-kpi-label">Comissões</div><div class="bp-kpi-value" style="font-size:.75rem">' + fmt(tot.comissao) + '</div></div>' +
        '<div class="bp-kpi"><div class="bp-kpi-label">Vendas</div><div class="bp-kpi-value">' + tot.vendas + '</div></div>' +
      '</div>' +
      '<p class="bp-ref-line">' + labelPeriodo + ' · listas mostram top 12 por receita</p>' +
      '<div class="bp-section"><div class="bp-section-title">Por serviço</div>' + sHtml + '</div>' +
      '<div class="bp-section"><div class="bp-section-title">Por profissional</div>' + pHtml + '</div>';

    body.querySelectorAll('[data-rent-p]').forEach(function (btn) {
      btn.onclick = function () {
        localStorage.setItem(RENT_PERIODO_KEY, btn.getAttribute('data-rent-p'));
        renderRentabilidadeBody();
      };
    });
  }

  function openModalMetaSalao() {
    ensureModalShell('modal-bp-meta', 'Meta do salão', 'Objectivos', 'Receita mensal-alvo e progresso do mês corrente.');
    var body = document.getElementById('modal-bp-meta-body');
    var prog = getProgressoMetaSalao();
    var meta = getMetaSalao();
    var fmt = typeof fmtKz === 'function' ? fmtKz : function (v) { return v + ' Kz'; };
    var insight = '';
    var barra = '';
    if (prog) {
      if (prog.atingida) {
        insight = '<div class="bp-alert-banner is-ok"><strong>Meta atingida</strong>Já superou o objectivo mensal. Excelente ritmo.</div>';
      } else if (prog.pct >= 70) {
        insight = '<div class="bp-alert-banner is-ok"><strong>Quase lá — ' + prog.pct + '%</strong>Faltam ' + fmt(Math.max(0, prog.meta - prog.volume)) + ' para a meta.</div>';
      } else if (prog.pct > 0) {
        insight = '<div class="bp-alert-banner"><strong>Progresso: ' + prog.pct + '%</strong>' + fmt(prog.volume) + ' de ' + fmt(prog.meta) + ' este mês.</div>';
      }
      barra = '<div class="bp-kpi-grid">' +
        '<div class="bp-kpi"><div class="bp-kpi-label">Realizado</div><div class="bp-kpi-value is-positive" style="font-size:.75rem">' + fmt(prog.volume) + '</div></div>' +
        '<div class="bp-kpi"><div class="bp-kpi-label">Meta</div><div class="bp-kpi-value" style="font-size:.75rem">' + fmt(prog.meta) + '</div></div>' +
        '<div class="bp-kpi"><div class="bp-kpi-label">Progresso</div><div class="bp-kpi-value is-gold">' + prog.pct + '%</div></div>' +
      '</div>' +
      '<div class="bp-progress"><div class="bp-progress-head"><span>Mês corrente</span><span>' + prog.pct + '%</span></div>' +
        '<div class="bp-progress-track"><div class="bp-progress-fill" style="width:' + prog.pct + '%"></div></div></div>';
    } else {
      insight = '<div class="bp-alert-banner"><strong>Defina a meta mensal</strong>Ajuda a equipa a saber o objectivo de receita do salão.</div>';
      barra = '<div class="bp-empty"><strong>Nenhuma meta definida</strong>Indique um valor mensal em Kz abaixo.</div>';
    }
    body.innerHTML = insight + barra +
      '<div class="bp-section"><div class="bp-section-title">Definir meta</div>' +
      '<div class="input-group"><label class="input-label" for="bp-meta-salao-input">Meta mensal (Kz)</label>' +
      '<input type="number" id="bp-meta-salao-input" class="input-field" min="0" step="1000" value="' + (meta || '') + '" placeholder="Ex: 500000" inputmode="numeric"></div></div>';
    var footer = document.querySelector('#modal-bp-meta .bp-sheet-footer');
    if (footer) {
      footer.innerHTML = '<button type="button" class="btn btn-secondary" data-close="modal-bp-meta">Cancelar</button>' +
        '<button type="button" class="btn btn-primary" id="bp-meta-salao-save">Guardar meta</button>';
    }
    if (typeof openModal === 'function') openModal('modal-bp-meta');
    else document.getElementById('modal-bp-meta').classList.add('open');
    var save = document.getElementById('bp-meta-salao-save');
    if (save) {
      save.onclick = function () {
        var v = document.getElementById('bp-meta-salao-input').value;
        setMetaSalao(v);
        if (typeof toast === 'function') toast('Meta do salão actualizada', 'success');
        openModalMetaSalao();
      };
    }
  }

  function openModalDespesaEnh() {
    // Prefill enhanced fields then open existing modal-despesa
    enhanceDespesaModal();
    if (typeof openModal === 'function') openModal('modal-despesa');
  }

  // ---------- F23: enhance despesa modal ----------
  function enhanceDespesaModal() {
    var modal = document.getElementById('modal-despesa');
    if (!modal || modal.querySelector('#desp-categoria')) return;
    var valorGroup = document.getElementById('desp-valor');
    if (!valorGroup) return;
    var parent = valorGroup.closest('.input-group') || valorGroup.parentNode;
    var wrap = document.createElement('div');
    wrap.innerHTML =
      '<div class="input-group">' +
        '<label class="input-label">Categoria</label>' +
        '<select id="desp-categoria" class="input-field">' +
          CATEGORIAS_DESPESA.map(function (c) {
            return '<option value="' + c.id + '">' + c.nome + '</option>';
          }).join('') +
        '</select>' +
      '</div>' +
      '<div class="input-group">' +
        '<label class="input-label">Fornecedor (opcional)</label>' +
        '<input type="text" id="desp-fornecedor" class="input-field" placeholder="Ex: Distribuidora X">' +
      '</div>';
    parent.parentNode.insertBefore(wrap, parent.nextSibling);
  }

  // ---------- F13: split UI no modal venda ----------
  function enhanceVendaPagamento() {
    var sel = document.getElementById('venda-pagamento');
    if (!sel || document.getElementById('venda-split-box')) return;
    var opt = document.createElement('option');
    opt.value = '__split__';
    opt.textContent = 'Pagamento dividido';
    sel.appendChild(opt);
    var box = document.createElement('div');
    box.id = 'venda-split-box';
    box.style.display = 'none';
    box.style.marginTop = '8px';
    box.innerHTML =
      '<div class="split-row" style="display:flex;gap:8px;margin-bottom:6px;">' +
        '<select class="input-field split-metodo" style="flex:1;"><option>Numerário</option><option>Multicaixa Express</option><option>Transferência</option><option>Cartão</option></select>' +
        '<input type="number" class="input-field split-valor" placeholder="Valor" min="0" step="100" style="width:110px;">' +
      '</div>' +
      '<div class="split-row" style="display:flex;gap:8px;margin-bottom:6px;">' +
        '<select class="input-field split-metodo" style="flex:1;"><option>Numerário</option><option>Multicaixa Express</option><option>Transferência</option><option>Cartão</option></select>' +
        '<input type="number" class="input-field split-valor" placeholder="Valor" min="0" step="100" style="width:110px;">' +
      '</div>' +
      '<p id="split-hint" style="font-size:.75rem;color:var(--text-muted);margin:0;">A soma deve igualar o total da venda.</p>';
    sel.parentNode.appendChild(box);
    sel.addEventListener('change', function () {
      box.style.display = sel.value === '__split__' ? 'block' : 'none';
      if (sel.value === '__split__') {
        try {
          var tot = totalCarrinho();
          var inputs = box.querySelectorAll('.split-valor');
          if (inputs.length >= 2 && tot > 0) {
            var half = Math.round(tot / 2);
            if (!inputs[0].value) inputs[0].value = half;
            if (!inputs[1].value) inputs[1].value = tot - half;
          }
        } catch (e) {}
      }
    });
    box.addEventListener('input', function () {
      var hint = document.getElementById('split-hint');
      if (!hint) return;
      var sp = lerPagamentosSplit();
      var tot = totalCarrinho();
      if (!sp || !tot) {
        hint.textContent = 'A soma deve igualar o total da venda.';
        hint.style.color = '';
        return;
      }
      var diff = Math.round((sp.sum - tot) * 100) / 100;
      if (Math.abs(diff) < 0.5) {
        hint.textContent = 'Soma correcta: ' + sp.sum + ' Kz';
        hint.style.color = 'var(--green-600, #236040)';
      } else {
        hint.textContent = 'Soma ' + sp.sum + ' Kz · falta ' + (Math.round((tot - sp.sum) * 100) / 100) + ' Kz';
        hint.style.color = 'var(--red-600, #922F3B)';
      }
    });
  }

  // Save unificado em eventos-caixa-vendas.js (evita duplo registo) — só realça campos
  function hookDespesaSave() {
    try { if (typeof enhanceDespesaModal === 'function') enhanceDespesaModal(); } catch (_) {}
  }

  function init() {
    // ET4-P1-02: listeners só uma vez; re-ensure de menus permitido após login
    if (window.__bpFinanceInitDone) {
      try {
        ensureMenuItems();
        enhanceDespesaModal();
        enhanceVendaPagamento();
        // hookDespesaSave deve ser idempotente (dataset bound)
        hookDespesaSave();
      } catch (eRe) {}
      return;
    }
    window.__bpFinanceInitDone = true;

    try {
      ensureMenuItems();
      enhanceDespesaModal();
      enhanceVendaPagamento();
      hookDespesaSave();
    } catch (e) {
      console.warn('[finance-fase1-extra]', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 100); });
  } else {
    setTimeout(init, 100);
  }
  // re-init after login UI appears
  setTimeout(init, 1500);
  setTimeout(init, 4000);

  window.BPFinance = {
    getMetaSalao: getMetaSalao,
    setMetaSalao: setMetaSalao,
    getProgressoMetaSalao: getProgressoMetaSalao,
    getFluxoDia: getFluxoDia,
    calcRentabilidadeServicos: calcRentabilidadeServicos,
    calcRentabilidadeProfissionais: calcRentabilidadeProfissionais,
    lerPagamentosSplit: lerPagamentosSplit,
    totalCarrinho: totalCarrinho,
    CATEGORIAS_DESPESA: CATEGORIAS_DESPESA,
    openModalFluxo: openModalFluxo,
    openModalRentabilidade: openModalRentabilidade,
    openModalMetaSalao: openModalMetaSalao,
    openModalDespesaEnh: openModalDespesaEnh
  };
})();

/* ===== FILE: ops-crm-comercial.js ===== */
// ================================================================
// Grupos 4–6 — Operações, CRM, Comercial (robusto, offline-first)
// F3 Stock | F18 Fornecedores/compras | F7 NPS | F9 Timeline
// F24 Calendário (.ics) | F8 Pacotes / assinaturas
// ================================================================
(function () {
  "use strict";

  var STOCK_KEY = "bp_stock_v1";
  var STOCK_MOV_KEY = "bp_stock_mov_v1";
  var FORN_KEY = "bp_fornecedores_v1";
  var COMPRAS_KEY = "bp_compras_v1";
  var NPS_KEY = "bp_nps_v1";
  var PACOTES_KEY = "bp_pacotes_v1";
  var CLIENTE_PACOTES_KEY = "bp_cliente_pacotes_v1";

  function fmt(v) {
    return typeof fmtKz === "function" ? fmtKz(v) : Math.round(Number(v) || 0) + " Kz";
  }
  function esc(s) {
    return typeof escHtml === "function" ? escHtml(String(s == null ? "" : s)) : String(s == null ? "" : s);
  }
  function hojeStr() {
    return typeof hoje === "function" ? hoje() : new Date().toISOString().slice(0, 10);
  }
  function uid() {
    return typeof uuid === "function" ? uuid() : "id" + Date.now() + Math.random().toString(16).slice(2, 8);
  }
  function safeJson(key, fb) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fb;
      var v = JSON.parse(raw);
      return v == null ? fb : v;
    } catch (e) { return fb; }
  }
  function writeJson(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; }
    catch (e) {
      if (typeof toast === "function") toast("Armazenamento local indisponível", "error");
      return false;
    }
  }
  function loadArr(key) {
    var v = safeJson(key, []);
    return Array.isArray(v) ? v : [];
  }

  /* ========== F3 STOCK ========== */
  function loadStock() { return loadArr(STOCK_KEY); }
  function saveStock(list) { return writeJson(STOCK_KEY, list); }
  function loadStockMov() { return loadArr(STOCK_MOV_KEY); }
  function saveStockMov(list) { return writeJson(STOCK_MOV_KEY, list.slice(-400)); }

  function findProduto(id) {
    return loadStock().find(function (p) { return p.id === id; }) || null;
  }

  function upsertProduto(data) {
    var list = loadStock();
    var nome = String(data.nome || "").trim();
    if (!nome) {
      if (typeof toast === "function") toast("Introduz o nome do produto.", "warning");
      return null;
    }
    var qtd = Math.max(0, Number(data.qtd) || 0);
    var qtdMin = Math.max(0, Number(data.qtd_min) || 0);
    var custo = Math.max(0, Number(data.preco_custo) || 0);
    if (data.id) {
      var idx = list.findIndex(function (p) { return p.id === data.id; });
      if (idx < 0) return null;
      list[idx] = Object.assign({}, list[idx], {
        nome: nome,
        sku: String(data.sku || list[idx].sku || "").trim(),
        qtd: qtd,
        qtd_min: qtdMin,
        preco_custo: custo,
        unidade: data.unidade || list[idx].unidade || "un",
        updated_at: new Date().toISOString()
      });
      saveStock(list);
      return list[idx];
    }
    // evitar nome duplicado
    if (list.some(function (p) { return p.nome.toLowerCase() === nome.toLowerCase(); })) {
      if (typeof toast === "function") toast("Já existe um produto com este nome", "error");
      return null;
    }
    var p = {
      id: uid(),
      nome: nome,
      sku: String(data.sku || "").trim(),
      qtd: qtd,
      qtd_min: qtdMin,
      preco_custo: custo,
      unidade: data.unidade || "un",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    list.push(p);
    saveStock(list);
    return p;
  }

  function movimentarStock(produtoId, tipo, quantidade, nota) {
    var q = Math.abs(Number(quantidade) || 0);
    if (!q) {
      if (typeof toast === "function") toast("Quantidade inválida", "error");
      return null;
    }
    var list = loadStock();
    var idx = list.findIndex(function (p) { return p.id === produtoId; });
    if (idx < 0) {
      if (typeof toast === "function") toast("Produto não encontrado", "error");
      return null;
    }
    var p = list[idx];
    var delta = tipo === "entrada" || tipo === "ajuste_mais" ? q : -q;
    if (tipo === "ajuste") {
      // quantidade = novo valor absoluto
      delta = q - (Number(p.qtd) || 0);
    }
    var nova = (Number(p.qtd) || 0) + (tipo === "ajuste" ? delta : delta);
    if (tipo !== "ajuste" && tipo !== "entrada" && tipo !== "ajuste_mais" && nova < 0) {
      if (typeof toast === "function") toast("Stock insuficiente (" + p.qtd + " " + (p.unidade || "un") + ")", "error");
      return null;
    }
    if (tipo === "ajuste") nova = q;
    if (nova < 0) nova = 0;
    list[idx] = Object.assign({}, p, { qtd: nova, updated_at: new Date().toISOString() });
    saveStock(list);
    var mov = {
      id: uid(),
      produto_id: produtoId,
      produto: p.nome,
      tipo: tipo === "ajuste" ? "ajuste" : tipo,
      quantidade: tipo === "ajuste" ? Math.abs(delta) : q,
      qtd_antes: Number(p.qtd) || 0,
      qtd_depois: nova,
      nota: String(nota || "").slice(0, 200),
      data: hojeStr(),
      ts: new Date().toISOString()
    };
    var movs = loadStockMov();
    movs.push(mov);
    saveStockMov(movs);
    return { produto: list[idx], movimento: mov };
  }

  function produtosBaixoStock() {
    return loadStock().filter(function (p) {
      return (Number(p.qtd_min) || 0) > 0 && (Number(p.qtd) || 0) <= (Number(p.qtd_min) || 0);
    });
  }

  function valorStockTotal() {
    return loadStock().reduce(function (s, p) {
      return s + (Number(p.qtd) || 0) * (Number(p.preco_custo) || 0);
    }, 0);
  }

  /* ========== F18 FORNECEDORES / COMPRAS ========== */
  function loadForn() { return loadArr(FORN_KEY); }
  function saveForn(list) { return writeJson(FORN_KEY, list); }
  function loadCompras() { return loadArr(COMPRAS_KEY); }
  function saveCompras(list) { return writeJson(COMPRAS_KEY, list.slice(-200)); }

  function upsertFornecedor(data) {
    var nome = String(data.nome || "").trim();
    if (!nome) {
      if (typeof toast === "function") toast("Introduz o nome do fornecedor.", "warning");
      return null;
    }
    var list = loadForn();
    if (data.id) {
      var i = list.findIndex(function (f) { return f.id === data.id; });
      if (i < 0) return null;
      list[i] = Object.assign({}, list[i], {
        nome: nome,
        contacto: String(data.contacto || "").trim(),
        nota: String(data.nota || "").slice(0, 200),
        updated_at: new Date().toISOString()
      });
      saveForn(list);
      return list[i];
    }
    if (list.some(function (f) { return f.nome.toLowerCase() === nome.toLowerCase(); })) {
      if (typeof toast === "function") toast("Fornecedor já existe", "error");
      return null;
    }
    var f = {
      id: uid(),
      nome: nome,
      contacto: String(data.contacto || "").trim(),
      nota: String(data.nota || "").slice(0, 200),
      created_at: new Date().toISOString()
    };
    list.push(f);
    saveForn(list);
    return f;
  }

  function registarCompra(data) {
    var fornId = data.fornecedor_id;
    var forn = loadForn().find(function (f) { return f.id === fornId; });
    var produtoId = data.produto_id;
    var qtd = Math.abs(Number(data.quantidade) || 0);
    var valor = Math.max(0, Number(data.valor) || 0);
    if (!forn) {
      if (typeof toast === "function") toast("Selecciona um fornecedor.", "warning");
      return null;
    }
    if (!produtoId || !findProduto(produtoId)) {
      if (typeof toast === "function") toast("Selecciona um produto de stock.", "warning");
      return null;
    }
    if (!qtd) {
      if (typeof toast === "function") toast("Quantidade inválida", "error");
      return null;
    }
    // entrada de stock
    var mov = movimentarStock(produtoId, "entrada", qtd, "Compra · " + forn.nome);
    if (!mov) return null;
    var compra = {
      id: uid(),
      fornecedor_id: forn.id,
      fornecedor: forn.nome,
      produto_id: produtoId,
      produto: mov.produto.nome,
      quantidade: qtd,
      valor: valor,
      data: data.data || hojeStr(),
      nota: String(data.nota || "").slice(0, 200),
      ts: new Date().toISOString()
    };
    var list = loadCompras();
    list.push(compra);
    saveCompras(list);
    // opcional: despesa no caixa
    if (data.lancar_despesa && valor > 0 && typeof addMovimento === "function") {
      try {
        addMovimento({
          tipo: "despesa",
          descricao: "Compra stock · " + mov.produto.nome + " (" + forn.nome + ")",
          valor: valor,
          categoria: "produtos",
          fornecedor: forn.nome
        });
      } catch (e) {}
    }
    return compra;
  }

  /* ========== F7 NPS ========== */
  function loadNps() { return loadArr(NPS_KEY); }
  function saveNps(list) { return writeJson(NPS_KEY, list.slice(-500)); }

  function registarNps(data) {
    var score = Number(data.score);
    if (isNaN(score) || score < 0 || score > 10) {
      if (typeof toast === "function") toast("Avaliação deve ser de 0 a 10", "error");
      return null;
    }
    var entry = {
      id: uid(),
      score: score,
      comentario: String(data.comentario || "").slice(0, 300),
      cliente: String(data.cliente || "").trim(),
      cliente_id: data.cliente_id || null,
      movimento_id: data.movimento_id || null,
      data: hojeStr(),
      ts: new Date().toISOString()
    };
    // classificar
    entry.tipo = score >= 9 ? "promotor" : score >= 7 ? "passivo" : "detractor";
    var list = loadNps();
    list.push(entry);
    saveNps(list);
    return entry;
  }

  function calcNpsScore(dias) {
    var list = loadNps();
    if (dias) {
      var cut = new Date();
      cut.setDate(cut.getDate() - dias);
      var cutIso = cut.toISOString();
      list = list.filter(function (n) { return n.ts >= cutIso; });
    }
    if (!list.length) return { nps: null, total: 0, promotores: 0, passivos: 0, detractores: 0, media: null };
    var prom = 0, pass = 0, det = 0, sum = 0;
    list.forEach(function (n) {
      sum += n.score;
      if (n.score >= 9) prom++;
      else if (n.score >= 7) pass++;
      else det++;
    });
    var total = list.length;
    var nps = Math.round(((prom - det) / total) * 100);
    return {
      nps: nps,
      total: total,
      promotores: prom,
      passivos: pass,
      detractores: det,
      media: Math.round((sum / total) * 10) / 10
    };
  }

  /* ========== F9 Timeline cliente ========== */
  function timelineCliente(nomeOuId) {
    var cliente = null;
    if (!nomeOuId) return { cliente: null, eventos: [] };
    var clients = (typeof state !== "undefined" && state.clientes) ? state.clientes : [];
    cliente = clients.find(function (c) {
      return c.id === nomeOuId || String(c.nome || "").toLowerCase() === String(nomeOuId).toLowerCase();
    }) || null;
    var nome = cliente ? cliente.nome : String(nomeOuId);
    var cid = cliente ? cliente.id : null;
    var eventos = [];

    function matchCliente(row) {
      if (cid && row.cliente_id && String(row.cliente_id) === String(cid)) return true;
      if (nome && String(row.cliente || "").toLowerCase() === String(nome).toLowerCase()) return true;
      return false;
    }

    (state.movimentos || []).forEach(function (m) {
      if (m.tipo !== "venda") return;
      if (!matchCliente(m)) return;
      eventos.push({
        tipo: "venda",
        data: m.data,
        ts: m.updated_at || (m.data + "T" + (m.hora || "12:00")),
        titulo: "Venda · " + fmt(m.valor),
        detalhe: (m.descricao || "") + (m.profissional ? " · " + m.profissional : ""),
        ref: m.id
      });
    });
    (state.agendamentos || []).forEach(function (a) {
      if (!matchCliente(a)) return;
      eventos.push({
        tipo: "agenda",
        data: a.data,
        ts: a.data + "T" + (a.hora || "12:00"),
        titulo: "Marcação · " + (a.hora || ""),
        detalhe: (a.servico || a.servicos || "") + " · " + (a.status || a.estado || "agendado"),
        ref: a.id
      });
    });
    loadNps().forEach(function (n) {
      if (String(n.cliente || "").toLowerCase() !== nome.toLowerCase()) return;
      eventos.push({
        tipo: "nps",
        data: n.data,
        ts: n.ts,
        titulo: "NPS " + n.score + "/10 · " + n.tipo,
        detalhe: n.comentario || "",
        ref: n.id
      });
    });
    // pacotes cliente
    loadClientePacotes().filter(function (cp) {
      return String(cp.cliente || "").toLowerCase() === nome.toLowerCase();
    }).forEach(function (cp) {
      eventos.push({
        tipo: "pacote",
        data: (cp.created_at || "").slice(0, 10),
        ts: cp.created_at || cp.created_at,
        titulo: "Pacote · " + (cp.pacote_nome || ""),
        detalhe: cp.sessoes_restantes + " sessões restantes",
        ref: cp.id
      });
    });

    eventos.sort(function (a, b) {
      return String(b.ts || "").localeCompare(String(a.ts || ""));
    });
    return {
      cliente: cliente || { nome: nome },
      eventos: eventos,
      totalGasto: eventos.filter(function (e) { return e.tipo === "venda"; }).length
        ? (state.movimentos || []).filter(function (m) {
            return m.tipo === "venda" && String(m.cliente || "").toLowerCase() === nome.toLowerCase();
          }).reduce(function (s, m) { return s + (Number(m.valor) || 0); }, 0)
        : 0,
      pontos: cliente ? (Number(cliente.pontos) || 0) : 0
    };
  }

  /* ========== F24 Calendário ICS ========== */
  function escapeIcs(text) {
    return String(text || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
  }
  function buildIcsAgendamentos(diasFuturos) {
    diasFuturos = diasFuturos || 30;
    var start = hojeStr();
    var endD = new Date(start + "T12:00:00");
    endD.setDate(endD.getDate() + diasFuturos);
    var end = endD.toISOString().slice(0, 10);
    var store = (state && state.config && state.config.storeName) || "BeautyPro";
    var lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//BeautyPro//AO//PT",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:" + escapeIcs(store)
    ];
    (state.agendamentos || []).forEach(function (a) {
      if (!a.data || a.data < start || a.data > end) return;
      var st = (typeof _statusAg === "function")
        ? _statusAg(a)
        : String(a.status || a.estado || "").toLowerCase();
      if (st === "cancelado") return;
      var hora = (a.hora || "09:00").replace(":", "");
      if (hora.length === 3) hora = "0" + hora;
      var dtStart = a.data.replace(/-/g, "") + "T" + (hora.length >= 4 ? hora.slice(0, 4) : "0900") + "00";
      // +1h default duration
      var hh = parseInt((a.hora || "09:00").split(":")[0], 10) || 9;
      var mm = parseInt((a.hora || "09:00").split(":")[1], 10) || 0;
      var endMin = hh * 60 + mm + 60;
      var eh = String(Math.floor(endMin / 60) % 24).padStart(2, "0");
      var em = String(endMin % 60).padStart(2, "0");
      var dtEnd = a.data.replace(/-/g, "") + "T" + eh + em + "00";
      var summary = (a.cliente || "Cliente") + (a.servico ? " · " + a.servico : "");
      var desc = "Profissional: " + (a.profissional || "—");
      lines.push("BEGIN:VEVENT");
      lines.push("UID:" + (a.id || uid()) + "@beautypro.local");
      lines.push("DTSTAMP:" + new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z");
      lines.push("DTSTART:" + dtStart);
      lines.push("DTEND:" + dtEnd);
      lines.push("SUMMARY:" + escapeIcs(summary));
      lines.push("DESCRIPTION:" + escapeIcs(desc));
      lines.push("END:VEVENT");
    });
    lines.push("END:VCALENDAR");
    return lines.join("\r\n");
  }
  function downloadIcs() {
    var ics = buildIcsAgendamentos(45);
    var blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "beautypro-agenda.ics";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(url);
      a.remove();
    }, 500);
    if (typeof toast === "function") toast("Ficheiro de calendário descarregado", "success");
  }

  /* ========== F8 PACOTES ========== */
  function loadPacotes() { return loadArr(PACOTES_KEY); }
  function savePacotes(list) { return writeJson(PACOTES_KEY, list); }
  function loadClientePacotes() { return loadArr(CLIENTE_PACOTES_KEY); }
  function saveClientePacotes(list) { return writeJson(CLIENTE_PACOTES_KEY, list); }

  function upsertPacote(data) {
    var nome = String(data.nome || "").trim();
    var preco = Math.max(0, Number(data.preco) || 0);
    var sessoes = Math.max(1, parseInt(data.sessoes, 10) || 1);
    var validade = Math.max(0, parseInt(data.validade_dias, 10) || 90);
    if (!nome) {
      if (typeof toast === "function") toast("Introduz o nome do pacote.", "warning");
      return null;
    }
    var list = loadPacotes();
    if (data.id) {
      var i = list.findIndex(function (p) { return p.id === data.id; });
      if (i < 0) return null;
      list[i] = Object.assign({}, list[i], {
        nome: nome,
        preco: preco,
        sessoes: sessoes,
        validade_dias: validade,
        descricao: String(data.descricao || "").slice(0, 200),
        updated_at: new Date().toISOString()
      });
      savePacotes(list);
      return list[i];
    }
    var p = {
      id: uid(),
      nome: nome,
      preco: preco,
      sessoes: sessoes,
      validade_dias: validade,
      descricao: String(data.descricao || "").slice(0, 200),
      created_at: new Date().toISOString()
    };
    list.push(p);
    savePacotes(list);
    return p;
  }

  function venderPacote(pacoteId, clienteNome) {
    var pac = loadPacotes().find(function (p) { return p.id === pacoteId; });
    var cliente = String(clienteNome || "").trim();
    if (!pac) {
      if (typeof toast === "function") toast("Pacote não encontrado", "error");
      return null;
    }
    if (!cliente) {
      if (typeof toast === "function") toast("Indica o cliente.", "warning");
      return null;
    }
    var exp = new Date();
    exp.setDate(exp.getDate() + (Number(pac.validade_dias) || 90));
    var cp = {
      id: uid(),
      pacote_id: pac.id,
      pacote_nome: pac.nome,
      cliente: cliente,
      sessoes_total: pac.sessoes,
      sessoes_restantes: pac.sessoes,
      preco: pac.preco,
      expira_em: exp.toISOString().slice(0, 10),
      created_at: new Date().toISOString(),
      activo: true
    };
    var list = loadClientePacotes();
    list.push(cp);
    saveClientePacotes(list);
    // registar venda no caixa se possível
    if (typeof registarVenda === "function" && pac.preco > 0) {
      try {
        // não forçar profissional — só movimento simples via addMovimento
      } catch (e) {}
    }
    if (typeof addMovimento === "function" && pac.preco > 0) {
      try {
        addMovimento({
          tipo: "venda",
          descricao: "Pacote · " + pac.nome,
          valor: pac.preco,
          cliente: cliente,
          metodoPagamento: "Numerário"
        });
      } catch (e) {}
    }
    return cp;
  }

  function consumirSessaoPacote(clientePacoteId) {
    var list = loadClientePacotes();
    var i = list.findIndex(function (x) { return x.id === clientePacoteId; });
    if (i < 0) return null;
    var cp = list[i];
    if (!cp.activo) {
      if (typeof toast === "function") toast("Pacote inactivo", "error");
      return null;
    }
    if (cp.expira_em && cp.expira_em < hojeStr()) {
      list[i] = Object.assign({}, cp, { activo: false });
      saveClientePacotes(list);
      if (typeof toast === "function") toast("Pacote expirado", "error");
      return null;
    }
    if ((Number(cp.sessoes_restantes) || 0) <= 0) {
      if (typeof toast === "function") toast("Sem sessões restantes", "error");
      return null;
    }
    var rest = (Number(cp.sessoes_restantes) || 0) - 1;
    list[i] = Object.assign({}, cp, {
      sessoes_restantes: rest,
      activo: rest > 0,
      updated_at: new Date().toISOString()
    });
    saveClientePacotes(list);
    return list[i];
  }

  /* ========== UI SHELL ========== */
  function ensureShell(id, title, eyebrow, subtitle) {
    if (typeof ensureBpSheetModal === 'function') {
      return ensureBpSheetModal(id, title, eyebrow, subtitle);
    }
    var el = document.getElementById(id);
    if (el) {
      var tEl = el.querySelector('.bp-sheet-title');
      if (tEl && title) tEl.textContent = title;
      return el;
    }
    el = document.createElement('div');
    el.id = id;
    el.className = 'modal-overlay';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-labelledby', id + '-title');
    var eye = eyebrow || 'BeautyPro';
    var sub = subtitle || '';
    el.innerHTML =
      '<div class="bp-sheet modal-sheet">' +
        '<div class="bp-sheet-handle handle" aria-hidden="true"></div>' +
        '<div class="bp-sheet-header">' +
          '<div class="bp-sheet-eyebrow">' + eye + '</div>' +
          '<h2 class="bp-sheet-title modal-title" id="' + id + '-title">' + title + '</h2>' +
          (sub ? '<p class="bp-sheet-subtitle">' + sub + '</p>' : '') +
        '</div>' +
        '<div class="bp-sheet-body" id="' + id + '-body"></div>' +
        '<div class="bp-sheet-footer modal-actions">' +
          '<button type="button" class="btn btn-secondary" data-close="' + id + '">Fechar</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(el);
    el.addEventListener('click', function (e) {
      if (e.target === el || e.target.getAttribute('data-close') === id) {
        if (typeof closeModal === 'function') closeModal(id);
        else el.classList.remove('open');
      }
    });
    return el;
  }
  function openShell(id) {
    if (typeof openModal === "function") openModal(id);
    else {
      var el = document.getElementById(id);
      if (el) el.classList.add("open");
    }
  }

  /* ----- Stock UI ----- */
  function openStock() {
    ensureShell("modal-bp-stock", "Stock de produtos", "Operações", "Inventário, alertas de mínimo e movimentos.");
    renderStock();
    openShell("modal-bp-stock");
  }
  function renderStock() {
    var body = document.getElementById("modal-bp-stock-body");
    if (!body) return;
    var list = loadStock();
    var baixo = produtosBaixoStock();
    var kpis =
      '<div class="bp-kpi-grid">' +
        '<div class="bp-kpi"><div class="bp-kpi-label">Produtos</div><div class="bp-kpi-value">' + list.length + "</div></div>" +
        '<div class="bp-kpi"><div class="bp-kpi-label">Valor stock</div><div class="bp-kpi-value" style="font-size:.72rem">' + fmt(valorStockTotal()) + "</div></div>" +
        '<div class="bp-kpi"><div class="bp-kpi-label">Alertas</div><div class="bp-kpi-value' + (baixo.length ? " is-negative" : "") + '">' + baixo.length + "</div></div></div>";
    var rows = list.map(function (p) {
      var alert = (Number(p.qtd_min) > 0 && p.qtd <= p.qtd_min) ? ' <span class="bp-badge" style="background:var(--red-50);color:var(--red)">Mín.</span>' : "";
      return '<div class="bp-row"><div class="bp-row-main"><div class="bp-row-title">' + esc(p.nome) + alert + "</div>" +
        '<div class="bp-row-meta">' + (p.sku ? esc(p.sku) + " · " : "") + fmt(p.preco_custo) + "/un · mín " + (p.qtd_min || 0) + "</div></div>" +
        '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">' +
        '<div class="bp-row-value">' + p.qtd + " " + esc(p.unidade || "un") + "</div>" +
        '<div style="display:flex;gap:4px">' +
        '<button type="button" class="bp-action-btn" data-stock-out="' + p.id + '">−</button>' +
        '<button type="button" class="bp-action-btn is-primary" data-stock-in="' + p.id + '">+</button></div></div></div>';
    }).join("") || '<div class="bp-empty"><strong>Stock vazio</strong>Adicione o primeiro produto abaixo.</div>';

    var alertHtml = "";
    if (baixo.length) {
      alertHtml = '<div class="bp-alert-banner is-warn"><strong>' + baixo.length + (baixo.length === 1 ? " produto abaixo do mínimo" : " produtos abaixo do mínimo") +
        "</strong>" + baixo.slice(0, 3).map(function (p) { return esc(p.nome); }).join(", ") +
        (baixo.length > 3 ? "…" : "") + "</div>";
    }
    rows = list.map(function (p) {
      var alert = (Number(p.qtd_min) > 0 && p.qtd <= p.qtd_min) ? ' <span class="bp-badge is-red">Mín.</span>' : "";
      return '<div class="bp-row"><div class="bp-row-main"><div class="bp-row-title">' + esc(p.nome) + alert + "</div>" +
        '<div class="bp-row-meta">' + (p.sku ? esc(p.sku) + " · " : "") + fmt(p.preco_custo) + "/un · mín " + (p.qtd_min || 0) + "</div></div>" +
        '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">' +
        '<div class="bp-row-value">' + p.qtd + " " + esc(p.unidade || "un") + "</div>" +
        '<div class="bp-stepper">' +
        '<button type="button" class="bp-action-btn" data-stock-out="' + p.id + '" aria-label="Saída">−</button>' +
        '<button type="button" class="bp-action-btn is-primary" data-stock-in="' + p.id + '" aria-label="Entrada">+</button></div></div></div>';
    }).join("") || '<div class="bp-empty"><strong>Stock vazio</strong>Adicione o primeiro produto abaixo.</div>';

    body.innerHTML = alertHtml + kpis +
      '<div class="bp-section"><div class="bp-section-title">Inventário</div>' + rows + "</div>" +
      '<div class="bp-section"><div class="bp-section-title">Novo produto</div>' +
      '<div class="input-group"><label class="input-label" for="bp-st-nome">Nome</label><input id="bp-st-nome" class="input-field" placeholder="Ex: Shampoo 1L" autocomplete="off"></div>' +
      '<div class="bp-form-grid-2">' +
        '<div class="input-group"><label class="input-label" for="bp-st-qtd">Qtd inicial</label><input type="number" id="bp-st-qtd" class="input-field" min="0" value="0" inputmode="numeric"></div>' +
        '<div class="input-group"><label class="input-label" for="bp-st-min">Qtd mínima</label><input type="number" id="bp-st-min" class="input-field" min="0" value="2" inputmode="numeric"></div>' +
        '<div class="input-group"><label class="input-label" for="bp-st-custo">Custo unit. (Kz)</label><input type="number" id="bp-st-custo" class="input-field" min="0" value="0" inputmode="numeric"></div>' +
        '<div class="input-group"><label class="input-label" for="bp-st-sku">SKU</label><input id="bp-st-sku" class="input-field" placeholder="Opcional"></div></div>' +
      '<button type="button" class="btn btn-primary btn-block" id="bp-st-add" style="margin-top:12px">Adicionar produto</button></div>';

    var add = document.getElementById("bp-st-add");
    if (add) add.onclick = function () {
      var p = upsertProduto({
        nome: (document.getElementById("bp-st-nome") || {}).value,
        qtd: (document.getElementById("bp-st-qtd") || {}).value,
        qtd_min: (document.getElementById("bp-st-min") || {}).value,
        preco_custo: (document.getElementById("bp-st-custo") || {}).value,
        sku: (document.getElementById("bp-st-sku") || {}).value
      });
      if (p) {
        if (typeof toast === "function") toast("Produto adicionado.", "success");
        renderStock();
      }
    };
    body.querySelectorAll("[data-stock-in]").forEach(function (btn) {
      btn.onclick = function () {
        var q = prompt("Quantidade a entrar:", "1");
        if (q == null) return;
        if (movimentarStock(btn.getAttribute("data-stock-in"), "entrada", q, "Entrada manual")) {
          if (typeof toast === "function") toast("Entrada registada", "success");
          renderStock();
        }
      };
    });
    body.querySelectorAll("[data-stock-out]").forEach(function (btn) {
      btn.onclick = function () {
        var q = prompt("Quantidade a sair:", "1");
        if (q == null) return;
        if (movimentarStock(btn.getAttribute("data-stock-out"), "saida", q, "Saída manual")) {
          if (typeof toast === "function") toast("Saída registada", "success");
          renderStock();
        }
      };
    });
  }

  /* ----- Fornecedores UI ----- */
  function openFornecedores() {
    ensureShell("modal-bp-forn", "Fornecedores e compras", "Operações", "Cadastro de fornecedores e entrada de mercadoria.");
    renderForn();
    openShell("modal-bp-forn");
  }
  function renderForn() {
    var body = document.getElementById("modal-bp-forn-body");
    if (!body) return;
    var forns = loadForn();
    var compras = loadCompras().slice().reverse().slice(0, 15);
    var stock = loadStock();
    var fornOpts = forns.map(function (f) {
      return '<option value="' + f.id + '">' + esc(f.nome) + "</option>";
    }).join("");
    var prodOpts = stock.map(function (p) {
      return '<option value="' + p.id + '">' + esc(p.nome) + " (" + p.qtd + ")</option>";
    }).join("");

    var fornRows = forns.map(function (f) {
      return '<div class="bp-row"><div class="bp-row-main"><div class="bp-row-title">' + esc(f.nome) + "</div>" +
        '<div class="bp-row-meta">' + esc(f.contacto || "Sem contacto") + "</div></div></div>";
    }).join("") || '<div class="bp-empty">Nenhum fornecedor ainda.</div>';

    var compraRows = compras.map(function (c) {
      return '<div class="bp-row"><div class="bp-row-main"><div class="bp-row-title">' + esc(c.produto) + "</div>" +
        '<div class="bp-row-meta">' + esc(c.data) + " · " + esc(c.fornecedor) + " · ×" + c.quantidade + "</div></div>" +
        '<div class="bp-row-value">' + fmt(c.valor) + "</div></div>";
    }).join("") || '<div class="bp-empty">Sem compras registadas.</div>';

    body.innerHTML =
      '<div class="bp-section" style="margin-top:0"><div class="bp-section-title">Nova compra (entra no stock)</div>' +
      (stock.length && forns.length
        ? '<div class="input-group"><label class="input-label">Fornecedor</label><select id="bp-cp-forn" class="input-field">' + fornOpts + "</select></div>" +
          '<div class="input-group"><label class="input-label">Produto</label><select id="bp-cp-prod" class="input-field">' + prodOpts + "</select></div>" +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' +
            '<div class="input-group"><label class="input-label">Quantidade</label><input type="number" id="bp-cp-qtd" class="input-field" min="1" value="1"></div>' +
            '<div class="input-group"><label class="input-label">Valor total (Kz)</label><input type="number" id="bp-cp-valor" class="input-field" min="0" value="0"></div></div>' +
          '<label style="display:flex;align-items:center;gap:8px;font-size:.85rem;margin:8px 0"><input type="checkbox" id="bp-cp-desp" checked> Lançar como despesa no caixa</label>' +
          '<button type="button" class="btn btn-primary btn-block" id="bp-cp-save">Registar compra</button>'
        : '<div class="bp-empty">Crie pelo menos 1 produto e 1 fornecedor.</div>') +
      "</div>" +
      '<div class="bp-section"><div class="bp-section-title">Novo fornecedor</div>' +
      '<div class="input-group"><label class="input-label">Nome</label><input id="bp-fn-nome" class="input-field" placeholder="Ex: Distribuidora Luanda"></div>' +
      '<div class="input-group"><label class="input-label">Contacto</label><input id="bp-fn-tel" class="input-field" placeholder="Telefone ou WhatsApp"></div>' +
      '<button type="button" class="btn btn-secondary btn-block" id="bp-fn-add">Guardar fornecedor</button></div>' +
      '<div class="bp-section"><div class="bp-section-title">Fornecedores</div>' + fornRows + "</div>" +
      '<div class="bp-section"><div class="bp-section-title">Últimas compras</div>' + compraRows + "</div>";

    var fnAdd = document.getElementById("bp-fn-add");
    if (fnAdd) fnAdd.onclick = function () {
      if (upsertFornecedor({ nome: (document.getElementById("bp-fn-nome") || {}).value, contacto: (document.getElementById("bp-fn-tel") || {}).value })) {
        if (typeof toast === "function") toast("Fornecedor guardado", "success");
        renderForn();
      }
    };
    var cpSave = document.getElementById("bp-cp-save");
    if (cpSave) cpSave.onclick = function () {
      var c = registarCompra({
        fornecedor_id: (document.getElementById("bp-cp-forn") || {}).value,
        produto_id: (document.getElementById("bp-cp-prod") || {}).value,
        quantidade: (document.getElementById("bp-cp-qtd") || {}).value,
        valor: (document.getElementById("bp-cp-valor") || {}).value,
        lancar_despesa: !!(document.getElementById("bp-cp-desp") || {}).checked
      });
      if (c) {
        if (typeof toast === "function") toast("Compra registada.", "success");
        renderForn();
      }
    };
  }

  /* ----- NPS UI ----- */
  function openNps() {
    ensureShell("modal-bp-nps", "Avaliação NPS", "Experiência", "De 0 a 10 — promotores, passivos e detractores.");
    renderNps();
    openShell("modal-bp-nps");
  }
  function renderNps() {
    var body = document.getElementById("modal-bp-nps-body");
    if (!body) return;
    var stats = calcNpsScore(90);
    var clientes = ((state && state.clientes) || []).map(function (c) {
      return '<option value="' + esc(c.nome) + '">' + esc(c.nome) + "</option>";
    }).join("");
    var insight = "";
    if (stats.total === 0) {
      insight = '<div class="bp-alert-banner"><strong>Ainda sem avaliações</strong>Peça uma nota 0–10 após o atendimento para medir a satisfação.</div>';
    } else if (stats.nps != null && stats.nps >= 50) {
      insight = '<div class="bp-alert-banner is-ok"><strong>NPS saudável (' + stats.nps + ')</strong>Boa proporção de promotores nos últimos 90 dias.</div>';
    } else if (stats.nps != null && stats.nps < 0) {
      insight = '<div class="bp-alert-banner is-warn"><strong>NPS negativo (' + stats.nps + ')</strong>Há mais detractores do que promotores — vale rever a experiência.</div>';
    }
    var kpis =
      insight +
      '<div class="bp-kpi-grid">' +
        '<div class="bp-kpi"><div class="bp-kpi-label">NPS 90d</div><div class="bp-kpi-value' + (stats.nps != null && stats.nps < 0 ? " is-negative" : " is-gold") + '">' + (stats.nps != null ? stats.nps : "—") + "</div></div>" +
        '<div class="bp-kpi"><div class="bp-kpi-label">Média</div><div class="bp-kpi-value">' + (stats.media != null ? stats.media : "—") + "</div></div>" +
        '<div class="bp-kpi"><div class="bp-kpi-label">Respostas</div><div class="bp-kpi-value">' + stats.total + "</div></div></div>" +
      '<p class="bp-ref-line">Promotores ' + stats.promotores + " · Passivos " + stats.passivos + " · Detractores " + stats.detractores + "</p>";

    var recent = loadNps().slice().reverse().slice(0, 12).map(function (n) {
      var badgeCls = n.score >= 9 ? " is-green" : (n.score <= 6 ? " is-red" : "");
      return '<div class="bp-row"><div class="bp-row-main"><div class="bp-row-title">' + esc(n.cliente || "Anónimo") +
        ' <span class="bp-badge' + badgeCls + '">' + n.score + "/10</span></div>" +
        '<div class="bp-row-meta">' + esc(n.data) + " · " + esc(n.tipo) + (n.comentario ? " · " + esc(n.comentario) : "") + "</div></div></div>";
    }).join("") || '<div class="bp-empty"><strong>Sem avaliações</strong>As notas aparecem aqui após registar.</div>';

    body.innerHTML = kpis +
      '<div class="bp-section"><div class="bp-section-title">Nova avaliação</div>' +
      '<div class="input-group"><label class="input-label" for="bp-nps-cli">Cliente</label><select id="bp-nps-cli" class="input-field"><option value="">— opcional —</option>' + clientes + "</select></div>" +
      '<div class="bp-form-grid-2">' +
        '<div class="input-group"><label class="input-label" for="bp-nps-score">Nota (0–10)</label><input type="number" id="bp-nps-score" class="input-field" min="0" max="10" step="1" value="9" inputmode="numeric"></div>' +
        '<div class="input-group"><label class="input-label" for="bp-nps-com">Comentário</label><input id="bp-nps-com" class="input-field" placeholder="Opcional" maxlength="300"></div></div>' +
      '<button type="button" class="btn btn-primary btn-block" id="bp-nps-save" style="margin-top:12px">Guardar NPS</button></div>' +
      '<div class="bp-section"><div class="bp-section-title">Recentes</div>' + recent + "</div>";

    var save = document.getElementById("bp-nps-save");
    if (save) save.onclick = function () {
      var e = registarNps({
        score: (document.getElementById("bp-nps-score") || {}).value,
        cliente: (document.getElementById("bp-nps-cli") || {}).value,
        comentario: (document.getElementById("bp-nps-com") || {}).value
      });
      if (e) {
        if (typeof toast === "function") toast("NPS " + e.score + " registado (" + e.tipo + ")", "success");
        renderNps();
      }
    };
  }

  /* ----- Timeline UI ----- */
  function openTimeline() {
    ensureShell("modal-bp-timeline", "Histórico do cliente", "CRM", "Vendas, marcações, NPS e pacotes num só lugar.");
    renderTimeline();
    openShell("modal-bp-timeline");
  }
  function renderTimeline(nomePreset) {
    var body = document.getElementById("modal-bp-timeline-body");
    if (!body) return;
    var clientes = ((state && state.clientes) || []).slice().sort(function (a, b) {
      return String(a.nome || "").localeCompare(String(b.nome || ""), "pt");
    });
    if (!clientes.length) {
      body.innerHTML = '<div class="bp-empty"><strong>Sem clientes</strong>Cadastre clientes na aba Clientes para ver o histórico.</div>';
      return;
    }

    var opts = clientes.map(function (c) {
      return '<option value="' + esc(c.nome) + '"' + (nomePreset && nomePreset === c.nome ? " selected" : "") + ">" + esc(c.nome) + "</option>";
    }).join("");
    var selected = nomePreset || "";
    if (!selected) {
      // manter seleção do select se re-render interno
      var prev = document.getElementById("bp-tl-cli");
      if (prev && prev.value) selected = prev.value;
    }

    var head = "";
    var events = "";
    var insight = "";

    if (!selected) {
      insight = '<div class="bp-alert-banner"><strong>Seleccione um cliente</strong>Veja vendas, agenda, avaliações e pacotes associados.</div>';
      events = '<div class="bp-empty"><strong>Nenhum cliente seleccionado</strong>Escolha um nome acima.</div>';
    } else {
      var tl = timelineCliente(selected);
      var nVendas = (tl.eventos || []).filter(function (e) { return e.tipo === "venda"; }).length;
      var nAgenda = (tl.eventos || []).filter(function (e) { return e.tipo === "agenda"; }).length;
      var ultimo = (tl.eventos || [])[0];

      if (!(tl.eventos || []).length) {
        insight = '<div class="bp-alert-banner"><strong>Sem eventos</strong>Este cliente ainda não tem vendas, marcações, NPS ou pacotes registados.</div>';
      } else if (ultimo) {
        insight = '<div class="bp-alert-banner is-ok"><strong>Última actividade</strong>' +
          esc(ultimo.data || "") + " · " + esc(ultimo.titulo || "") +
          (ultimo.detalhe ? " — " + esc(String(ultimo.detalhe).slice(0, 80)) : "") + "</div>";
      }

      head =
        '<div class="bp-kpi-grid">' +
          '<div class="bp-kpi"><div class="bp-kpi-label">Gasto total</div><div class="bp-kpi-value is-positive" style="font-size:.75rem">' + fmt(tl.totalGasto) + "</div></div>" +
          '<div class="bp-kpi"><div class="bp-kpi-label">Pontos</div><div class="bp-kpi-value is-gold">' + (tl.pontos || 0) + "</div></div>" +
          '<div class="bp-kpi"><div class="bp-kpi-label">Eventos</div><div class="bp-kpi-value">' + (tl.eventos || []).length + "</div></div>" +
        "</div>" +
        '<p class="bp-ref-line">' + nVendas + " vendas · " + nAgenda + " marcações · últimos 40 eventos</p>";

      events = (tl.eventos || []).slice(0, 40).map(function (e) {
        var badgeCls = "";
        var badge = "Evento";
        if (e.tipo === "venda") { badge = "Venda"; badgeCls = " is-green"; }
        else if (e.tipo === "agenda") { badge = "Agenda"; badgeCls = " is-gold"; }
        else if (e.tipo === "nps") { badge = "NPS"; }
        else if (e.tipo === "pacote") { badge = "Pacote"; }
        return '<div class="bp-row"><div class="bp-row-main"><div class="bp-row-title"><span class="bp-badge' + badgeCls + '">' + badge + "</span> " + esc(e.titulo) + "</div>" +
          '<div class="bp-row-meta">' + esc(e.data || "") + (e.detalhe ? " · " + esc(e.detalhe) : "") + "</div></div></div>";
      }).join("") || '<div class="bp-empty"><strong>Sem eventos</strong>Nada registado para este cliente.</div>';
    }

    body.innerHTML =
      '<div class="input-group"><label class="input-label" for="bp-tl-cli">Cliente</label>' +
      '<select id="bp-tl-cli" class="input-field"><option value="">— seleccionar —</option>' + opts + "</select></div>" +
      insight + head +
      '<div class="bp-section"><div class="bp-section-title">Timeline</div>' + events + "</div>";

    var sel = document.getElementById("bp-tl-cli");
    if (sel) {
      if (selected) sel.value = selected;
      sel.onchange = function () { renderTimeline(sel.value); };
    }
  }

  /* ----- Calendário UI ----- */
  function openCalendario() {
    ensureShell("modal-bp-cal", "Calendário do telemóvel", "CRM", "Exportar marcações em formato .ics (Apple, Google, Outlook).");
    var body = document.getElementById("modal-bp-cal-body");
    var futuros = (state.agendamentos || []).filter(function (a) {
      return a.data && a.data >= hojeStr() && String(a.status || a.estado || "").toLowerCase() !== "cancelado";
    }).length;
    body.innerHTML =
      '<div class="bp-kpi-grid">' +
        '<div class="bp-kpi"><div class="bp-kpi-label">Próximas</div><div class="bp-kpi-value">' + futuros + '</div></div>' +
        '<div class="bp-kpi"><div class="bp-kpi-label">Janela</div><div class="bp-kpi-value" style="font-size:.8rem">45 dias</div></div>' +
        '<div class="bp-kpi"><div class="bp-kpi-label">Formato</div><div class="bp-kpi-value" style="font-size:.8rem">.ics</div></div>' +
      '</div>' +
      '<div class="bp-alert-banner"><strong>Calendário .ics</strong>Importe no Google Calendar, Apple Calendar ou Outlook. Janela de 45 dias.</div>' +
      '<button type="button" class="btn btn-primary btn-block" id="bp-cal-dl">Descarregar agenda.ics</button>';
    var btn = document.getElementById("bp-cal-dl");
    if (btn) btn.onclick = downloadIcs;
    openShell("modal-bp-cal");
  }

  /* ----- Pacotes UI ----- */
  function openPacotes() {
    ensureShell("modal-bp-pacotes", "Pacotes e assinaturas", "Comercial", "Pacotes de sessões com validade e consumo.");
    renderPacotes();
    openShell("modal-bp-pacotes");
  }
  function renderPacotes() {
    var body = document.getElementById("modal-bp-pacotes-body");
    if (!body) return;
    var pacs = loadPacotes();
    var cps = loadClientePacotes().filter(function (c) { return c.activo !== false && (c.sessoes_restantes || 0) > 0; });
    var clientes = ((state && state.clientes) || []).map(function (c) {
      return '<option value="' + esc(c.nome) + '">' + esc(c.nome) + "</option>";
    }).join("");
    var pacOpts = pacs.map(function (p) {
      return '<option value="' + p.id + '">' + esc(p.nome) + " · " + fmt(p.preco) + "</option>";
    }).join("");

    var pacRows = pacs.map(function (p) {
      return '<div class="bp-row"><div class="bp-row-main"><div class="bp-row-title">' + esc(p.nome) + "</div>" +
        '<div class="bp-row-meta">' + p.sessoes + " sessões · validade " + p.validade_dias + " dias" +
        (p.descricao ? " · " + esc(p.descricao) : "") + "</div></div>" +
        '<div class="bp-row-value">' + fmt(p.preco) + "</div></div>";
    }).join("") || '<div class="bp-empty">Crie o primeiro pacote abaixo.</div>';

    var cpRows = cps.map(function (c) {
      return '<div class="bp-row"><div class="bp-row-main"><div class="bp-row-title">' + esc(c.cliente) + "</div>" +
        '<div class="bp-row-meta">' + esc(c.pacote_nome) + " · expira " + esc(c.expira_em) + "</div></div>" +
        '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">' +
        '<div class="bp-row-value is-gold">' + c.sessoes_restantes + "/" + c.sessoes_total + "</div>" +
        '<button type="button" class="bp-action-btn is-primary" data-consume="' + c.id + '">Usar 1</button></div></div>';
    }).join("") || '<div class="bp-empty">Nenhum pacote activo vendido.</div>';

    body.innerHTML =
      '<div class="bp-section" style="margin-top:0"><div class="bp-section-title">Vender pacote</div>' +
      (pacs.length
        ? '<div class="input-group"><label class="input-label">Pacote</label><select id="bp-vp-pac" class="input-field">' + pacOpts + "</select></div>" +
          '<div class="input-group"><label class="input-label">Cliente</label><select id="bp-vp-cli" class="input-field"><option value="">—</option>' + clientes + "</select></div>" +
          '<button type="button" class="btn btn-primary btn-block" id="bp-vp-save">Vender e activar</button>'
        : '<div class="bp-empty">Crie um pacote primeiro.</div>') +
      "</div>" +
      '<div class="bp-section"><div class="bp-section-title">Pacotes activos de clientes</div>' + cpRows + "</div>" +
      '<div class="bp-section"><div class="bp-section-title">Catálogo</div>' + pacRows + "</div>" +
      '<div class="bp-section"><div class="bp-section-title">Novo pacote</div>' +
      '<div class="input-group"><label class="input-label">Nome</label><input id="bp-pk-nome" class="input-field" placeholder="Ex: 5 Coloracões"></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">' +
        '<div class="input-group"><label class="input-label">Preço</label><input type="number" id="bp-pk-preco" class="input-field" min="0" value="0"></div>' +
        '<div class="input-group"><label class="input-label">Sessões</label><input type="number" id="bp-pk-ses" class="input-field" min="1" value="5"></div>' +
        '<div class="input-group"><label class="input-label">Validade (dias)</label><input type="number" id="bp-pk-val" class="input-field" min="1" value="90"></div></div>' +
      '<button type="button" class="btn btn-secondary btn-block" id="bp-pk-add">Criar pacote</button></div>';

    var pkAdd = document.getElementById("bp-pk-add");
    if (pkAdd) pkAdd.onclick = function () {
      if (upsertPacote({
        nome: (document.getElementById("bp-pk-nome") || {}).value,
        preco: (document.getElementById("bp-pk-preco") || {}).value,
        sessoes: (document.getElementById("bp-pk-ses") || {}).value,
        validade_dias: (document.getElementById("bp-pk-val") || {}).value
      })) {
        if (typeof toast === "function") toast("Pacote criado", "success");
        renderPacotes();
      }
    };
    var vpSave = document.getElementById("bp-vp-save");
    if (vpSave) vpSave.onclick = function () {
      var cp = venderPacote(
        (document.getElementById("bp-vp-pac") || {}).value,
        (document.getElementById("bp-vp-cli") || {}).value
      );
      if (cp) {
        if (typeof toast === "function") toast("Pacote activado para " + cp.cliente, "success");
        renderPacotes();
        if (typeof renderCaixa === "function") try { renderCaixa(); } catch (e) {}
      }
    };
    body.querySelectorAll("[data-consume]").forEach(function (btn) {
      btn.onclick = function () {
        var r = consumirSessaoPacote(btn.getAttribute("data-consume"));
        if (r) {
          if (typeof toast === "function") toast("Sessão consumida · restam " + r.sessoes_restantes, "success");
          renderPacotes();
        }
      };
    });
  }

  /* ========== MENU ========== */
  function ensureMenuItems() {
    var dd = document.getElementById("menu-dropdown");
    if (!dd || dd.querySelector('[data-bp-menu="ops"]')) return;
    var frag = document.createDocumentFragment();

    function section(label, key) {
      var sec = document.createElement("div");
      sec.className = "bp-menu-section";
      sec.setAttribute("data-bp-menu", key);
      sec.textContent = label;
      frag.appendChild(sec);
    }
    function item(menu, key, label) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("data-bp-menu", menu);
      btn.setAttribute("data-bp-action", key);
      btn.innerHTML = "<span>" + label + "</span>";
      frag.appendChild(btn);
    }

    section("Operações", "ops");
    item("ops", "stock", "Stock de produtos");
    item("ops", "forn", "Fornecedores e compras");
    section("CRM", "crm");
    item("crm", "nps", "Avaliação NPS");
    item("crm", "timeline", "Histórico do cliente");
    item("crm", "cal", "Calendário (.ics)");
    item("crm", "galeria", "Galeria de serviços");
    section("Comercial", "com");
    item("com", "pacotes", "Pacotes e assinaturas");

    var logout = dd.querySelector("#logout-btn");
    if (logout) dd.insertBefore(frag, logout);
    else dd.appendChild(frag);

    if (!dd.dataset.bpOpsBound) {
      dd.dataset.bpOpsBound = "1";
      dd.addEventListener("click", function (e) {
        var t = e.target.closest("[data-bp-action]");
        if (!t) return;
        var menu = t.getAttribute("data-bp-menu");
        if (menu !== "ops" && menu !== "crm" && menu !== "com") return;
        e.stopPropagation();
        dd.style.display = "none";
        var a = t.getAttribute("data-bp-action");
        try {
          if (a === "stock") openStock();
          if (a === "forn") openFornecedores();
          if (a === "nps") openNps();
          if (a === "timeline") openTimeline();
          if (a === "cal") openCalendario();
          if (a === "pacotes") openPacotes();
          if (a === "galeria") {
            if (window.BPMedia && typeof BPMedia.openGaleria === "function") BPMedia.openGaleria();
            else if (typeof openGaleria === "function") openGaleria();
            else if (typeof toast === "function") toast("Galeria indisponível", "warning");
          }
        } catch (err) {
          console.error("[BPOpsCRM]", err);
          if (typeof toast === "function") toast("Não foi possível abrir esta secção", "error");
        }
      });
    }
  }

  function init() {
    // ET4-P1-02: listeners só uma vez; re-ensure de menus permitido após login
    if (window.__bpOpsInitDone) {
      try {
        if (typeof ensureMenuItems === "function") ensureMenuItems();
      } catch (eRe) {}
      return;
    }
    window.__bpOpsInitDone = true;

    try { ensureMenuItems(); } catch (e) { console.warn("[ops-crm-comercial]", e); }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { setTimeout(init, 160); });
  } else setTimeout(init, 160);
  setTimeout(init, 1800);
  setTimeout(init, 4500);

  window.BPOps = {
    loadStock: loadStock,
    upsertProduto: upsertProduto,
    movimentarStock: movimentarStock,
    produtosBaixoStock: produtosBaixoStock,
    registarCompra: registarCompra,
    registarNps: registarNps,
    calcNpsScore: calcNpsScore,
    timelineCliente: timelineCliente,
    downloadIcs: downloadIcs,
    upsertPacote: upsertPacote,
    venderPacote: venderPacote,
    consumirSessaoPacote: consumirSessaoPacote,
    openStock: openStock,
    openFornecedores: typeof openFornecedores === "function" ? openFornecedores : openStock,
    openNps: openNps,
    openTimeline: typeof openTimeline === "function" ? openTimeline : null,
    openCalendario: typeof openCalendario === "function" ? openCalendario : null,
    openPacotes: typeof openPacotes === "function" ? openPacotes : null
  };
})();

/* ===== FILE: equipa-fase3.js ===== */
// ================================================================
// Grupo 3 — Gestão de Equipa (robusto, realista, offline-first)
// F6 Ranking | F14 Horários/folgas | F25 Chat interno
// ================================================================
(function () {
  'use strict';

  var CHAT_KEY = 'bp_chat_msgs_v2';
  var HORARIOS_KEY = 'bp_horarios_equipa_v2';
  var RANK_PERIODO_KEY = 'bp_rank_periodo';
  var DIAS_ORD = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
  var DIAS_LABEL = { dom: 'Dom', seg: 'Seg', ter: 'Ter', qua: 'Qua', qui: 'Qui', sex: 'Sex', sab: 'Sáb' };
  var DIAS_JS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];

  function fmt(v) {
    return typeof fmtKz === 'function' ? fmtKz(v) : (Math.round(Number(v) || 0) + ' Kz');
  }
  function esc(s) {
    return typeof escHtml === 'function' ? escHtml(String(s == null ? '' : s)) : String(s == null ? '' : s);
  }
  function hojeStr() {
    return typeof hoje === 'function' ? hoje() : new Date().toISOString().slice(0, 10);
  }
  function parseHoraMin(hhmm) {
    var p = String(hhmm || '00:00').split(':');
    return (parseInt(p[0], 10) || 0) * 60 + (parseInt(p[1], 10) || 0);
  }
  function safeJson(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      var v = JSON.parse(raw);
      return v == null ? fallback : v;
    } catch (e) { return fallback; }
  }
  function writeJson(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; }
    catch (e) {
      if (typeof toast === 'function') toast('Armazenamento local cheio ou bloqueado', 'error');
      return false;
    }
  }

  function inicioSemanaISO() {
    var d = new Date(hojeStr() + 'T12:00:00');
    var day = d.getDay();
    var diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d.toISOString().slice(0, 10);
  }
  function fimSemanaISO() {
    var d = new Date(inicioSemanaISO() + 'T12:00:00');
    d.setDate(d.getDate() + 6);
    return d.toISOString().slice(0, 10);
  }
  function inPeriodo(dataStr, periodo) {
    if (!dataStr) return false;
    if (periodo === 'semana') {
      return dataStr >= inicioSemanaISO() && dataStr <= fimSemanaISO();
    }
    return String(dataStr).startsWith(hojeStr().slice(0, 7));
  }

  function calcRanking(periodo) {
    periodo = periodo || localStorage.getItem(RANK_PERIODO_KEY) || 'mes';
    var map = {};
    (state.profissionais || []).forEach(function (p) {
      map[p.id] = {
        id: p.id, nome: p.nome || '—', receita: 0, comissao: 0, vendas: 0,
        ticket: 0, meta: Number(p.meta_mensal) || 0, metaOk: false, pontos: 0, diasActivos: {}
      };
    });
    (state.movimentos || []).forEach(function (m) {
      if (m.tipo !== 'venda' || !m.profissional_id) return;
      if (!inPeriodo(m.data, periodo)) return;
      if (!map[m.profissional_id]) {
        map[m.profissional_id] = {
          id: m.profissional_id, nome: m.profissional || '—', receita: 0, comissao: 0,
          vendas: 0, ticket: 0, meta: 0, metaOk: false, pontos: 0, diasActivos: {}
        };
      }
      var r = map[m.profissional_id];
      r.receita += Number(m.valor) || 0;
      r.comissao += Number(m.comissao_gerada) || 0;
      r.vendas += 1;
      if (m.data) r.diasActivos[m.data] = true;
    });
    var totalReceita = 0;
    Object.keys(map).forEach(function (k) {
      var r = map[k];
      totalReceita += r.receita;
      r.ticket = r.vendas > 0 ? Math.round(r.receita / r.vendas) : 0;
      r.dias = Object.keys(r.diasActivos).length;
      r.pontos = (r.vendas * 10) + Math.floor(r.receita / 1000);
      if (periodo === 'mes' && r.meta > 0 && r.receita >= r.meta) {
        r.metaOk = true;
        r.pontos += 50;
      }
    });
    var list = Object.keys(map).map(function (k) {
      var r = map[k];
      r.share = totalReceita > 0 ? Math.round((r.receita / totalReceita) * 100) : 0;
      return r;
    });
    list.sort(function (a, b) {
      if (b.pontos !== a.pontos) return b.pontos - a.pontos;
      if (b.receita !== a.receita) return b.receita - a.receita;
      return (a.nome || '').localeCompare(b.nome || '');
    });
    return { list: list, totalReceita: totalReceita, periodo: periodo };
  }

  function defaultHorario() {
    return {
      entrada: '09:00', saida: '18:00', dias: ['seg', 'ter', 'qua', 'qui', 'sex'],
      folgas: [], intervaloInicio: '13:00', intervaloFim: '14:00', activo: true
    };
  }
  function loadHorarios() {
    var v = safeJson(HORARIOS_KEY, {});
    return v && typeof v === 'object' ? v : {};
  }
  function getHorarioProf(id) {
    return Object.assign(defaultHorario(), loadHorarios()[id] || {});
  }
  function setHorarioProf(id, partial) {
    var all = loadHorarios();
    var next = Object.assign(defaultHorario(), all[id] || {}, partial);
    if (parseHoraMin(next.entrada) >= parseHoraMin(next.saida)) {
      if (typeof toast === 'function') toast('A entrada deve ser antes da saída', 'error');
      return null;
    }
    if (!Array.isArray(next.dias)) next.dias = [];
    if (!Array.isArray(next.folgas)) next.folgas = [];
    var limite = new Date();
    limite.setDate(limite.getDate() - 90);
    var limStr = limite.toISOString().slice(0, 10);
    next.folgas = next.folgas.filter(function (d) { return d >= limStr; }).sort();
    all[id] = next;
    if (!writeJson(HORARIOS_KEY, all)) return null;
    return next;
  }
  function diaSemanaDeData(dataStr) {
    try {
      return DIAS_JS[new Date(dataStr + 'T12:00:00').getDay()];
    } catch (e) { return null; }
  }
  function estadoHojeProf(id) {
    var h = getHorarioProf(id);
    if (h.activo === false) return { code: 'inactivo', label: 'Inactivo' };
    var hs = hojeStr();
    if ((h.folgas || []).indexOf(hs) >= 0) return { code: 'folga', label: 'Folga' };
    var dia = diaSemanaDeData(hs);
    if ((h.dias || []).indexOf(dia) < 0) return { code: 'dia_folga_semana', label: 'Folga semanal' };
    var now = new Date();
    var mins = now.getHours() * 60 + now.getMinutes();
    var en = parseHoraMin(h.entrada), sa = parseHoraMin(h.saida);
    var i0 = parseHoraMin(h.intervaloInicio), i1 = parseHoraMin(h.intervaloFim);
    if (mins < en || mins >= sa) return { code: 'fora_horario', label: 'Fora de horário' };
    if (i1 > i0 && mins >= i0 && mins < i1) return { code: 'intervalo', label: 'Intervalo' };
    return { code: 'em_turno', label: 'Em turno' };
  }
  function conflitosAgenda(profId, dataStr) {
    var h = getHorarioProf(profId);
    var data = dataStr || hojeStr();
    var out = [];
    (state.agendamentos || []).forEach(function (a) {
      if (a.profissional_id !== profId || a.data !== data) return;
      var st = String(a.status || a.estado || '').toLowerCase();
      if (st === 'cancelado' || st.indexOf('conclu') === 0) return;
      var reasons = [];
      if ((h.folgas || []).indexOf(data) >= 0) reasons.push('dia de folga');
      var dia = diaSemanaDeData(data);
      if ((h.dias || []).indexOf(dia) < 0) reasons.push('não trabalha neste dia');
      var hm = parseHoraMin(a.hora);
      if (hm < parseHoraMin(h.entrada) || hm >= parseHoraMin(h.saida)) reasons.push('fora do turno');
      if (reasons.length) out.push({ ag: a, reasons: reasons });
    });
    return out;
  }

  function loadChat() {
    var list = safeJson(CHAT_KEY, []);
    return Array.isArray(list) ? list : [];
  }
  function saveChat(list) {
    return writeJson(CHAT_KEY, (list || []).slice(-300));
  }
  function autorActual() {
    var role = (state && state.config && state.config.userRole) || 'admin';
    var store = (state && state.config && state.config.storeName) || 'Salão';
    var label = (role === 'admin' || role === 'gerente') ? ('Gestão · ' + store) : ('Colaborador · ' + store);
    return { nome: label, role: role };
  }
  function enviarMensagem(texto) {
    var t = String(texto || '').replace(/\s+/g, ' ').trim();
    if (!t || t.length < 2) {
      if (typeof toast === 'function') toast('Escreva uma mensagem válida', 'error');
      return null;
    }
    var autor = autorActual();
    var msg = {
      id: (typeof uuid === 'function' ? uuid() : ('m' + Date.now())),
      texto: t.slice(0, 500),
      autor: autor.nome,
      role: autor.role,
      ts: new Date().toISOString()
    };
    var list = loadChat();
    var last = list[list.length - 1];
    if (last && last.texto === msg.texto && last.autor === msg.autor) {
      if (Math.abs(new Date(msg.ts) - new Date(last.ts)) < 5000) {
        if (typeof toast === 'function') toast('Mensagem já enviada', 'warning');
        return last;
      }
    }
    list.push(msg);
    if (!saveChat(list)) return null;
    return msg;
  }
  function formatMsgTime(ts) {
    try {
      var d = new Date(ts);
      var dia = d.toISOString().slice(0, 10);
      var hm = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
      return dia === hojeStr() ? hm : (dia.slice(8, 10) + '/' + dia.slice(5, 7) + ' ' + hm);
    } catch (e) { return ''; }
  }
  function groupChatByDay(list) {
    var groups = [], cur = null;
    list.forEach(function (m) {
      var day = String(m.ts || '').slice(0, 10) || '—';
      if (!cur || cur.day !== day) { cur = { day: day, items: [] }; groups.push(cur); }
      cur.items.push(m);
    });
    return groups;
  }

  function ensureShell(id, title, eyebrow, subtitle) {
    if (typeof ensureBpSheetModal === 'function') {
      return ensureBpSheetModal(id, title, eyebrow, subtitle);
    }
    var el = document.getElementById(id);
    if (el) {
      var tEl = el.querySelector('.bp-sheet-title');
      if (tEl && title) tEl.textContent = title;
      return el;
    }
    el = document.createElement('div');
    el.id = id;
    el.className = 'modal-overlay';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-labelledby', id + '-title');
    var eye = eyebrow || 'BeautyPro';
    var sub = subtitle || '';
    el.innerHTML =
      '<div class="bp-sheet modal-sheet">' +
        '<div class="bp-sheet-handle handle" aria-hidden="true"></div>' +
        '<div class="bp-sheet-header">' +
          '<div class="bp-sheet-eyebrow">' + eye + '</div>' +
          '<h2 class="bp-sheet-title modal-title" id="' + id + '-title">' + title + '</h2>' +
          (sub ? '<p class="bp-sheet-subtitle">' + sub + '</p>' : '') +
        '</div>' +
        '<div class="bp-sheet-body" id="' + id + '-body"></div>' +
        '<div class="bp-sheet-footer modal-actions">' +
          '<button type="button" class="btn btn-secondary" data-close="' + id + '">Fechar</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(el);
    el.addEventListener('click', function (e) {
      if (e.target === el || e.target.getAttribute('data-close') === id) {
        if (typeof closeModal === 'function') closeModal(id);
        else el.classList.remove('open');
      }
    });
    return el;
  }
  function openShell(id) {
    if (typeof openModal === 'function') openModal(id);
    else { var el = document.getElementById(id); if (el) el.classList.add('open'); }
  }

  function openRanking() {
    ensureShell('modal-bp-rank', 'Ranking da equipa', 'Desempenho', 'Pontuação com base em vendas reais, receita e metas.');
    renderRankingBody();
    openShell('modal-bp-rank');
  }
  function renderRankingBody() {
    var body = document.getElementById('modal-bp-rank-body');
    if (!body) return;
    var periodo = localStorage.getItem(RANK_PERIODO_KEY) || 'mes';
    var data = calcRanking(periodo);
    var rank = data.list;
    var activos = (state.profissionais || []).filter(function (p) {
      return typeof isProfissionalAtivo === 'function' ? isProfissionalAtivo(p) : (p.ativo !== false);
    });
    var toggle =
      '<div class="bp-seg" role="tablist" aria-label="Período do ranking">' +
        '<button type="button" class="bp-seg-btn' + (periodo === 'semana' ? ' is-active' : '') + '" data-rank-p="semana" role="tab">Esta semana</button>' +
        '<button type="button" class="bp-seg-btn' + (periodo === 'mes' ? ' is-active' : '') + '" data-rank-p="mes" role="tab">Este mês</button></div>';
    if (!activos.length) {
      body.innerHTML = toggle + '<div class="bp-empty"><strong>Sem profissionais activos</strong>Adicione a equipa na aba Equipa.</div>';
      bindRankToggle(body); return;
    }
    if (!rank.some(function (r) { return r.vendas > 0; })) {
      body.innerHTML = toggle + '<div class="bp-empty"><strong>Sem vendas no período</strong>O ranking actualiza com vendas atribuídas a profissionais.</div>';
      bindRankToggle(body); return;
    }
    var top = rank[0];
    var kpis =
      '<div class="bp-kpi-grid">' +
        '<div class="bp-kpi"><div class="bp-kpi-label">Líder</div><div class="bp-kpi-value is-gold" style="font-size:.8rem;line-height:1.25">' + esc(top.nome) + '</div></div>' +
        '<div class="bp-kpi"><div class="bp-kpi-label">Pontos</div><div class="bp-kpi-value">' + top.pontos + '</div></div>' +
        '<div class="bp-kpi"><div class="bp-kpi-label">Receita equipa</div><div class="bp-kpi-value" style="font-size:.75rem">' + fmt(data.totalReceita) + '</div></div></div>';
    var rows = rank.map(function (r, i) {
      var rankClass = i === 0 ? ' is-rank-1' : (i === 1 ? ' is-rank-2' : (i === 2 ? ' is-rank-3' : ''));
      var badge = '<span class="bp-badge' + rankClass + '">' + (i + 1) + '.º</span> ';
      var metaBadge = r.metaOk ? ' <span class="bp-badge is-green">Meta</span>' : '';
      var pctMeta = (r.meta > 0) ? Math.min(100, Math.round((r.receita / r.meta) * 100)) : 0;
      var bar = r.meta > 0 ? '<div class="bp-meta-bar" title="Progresso da meta"><i style="width:' + pctMeta + '%"></i></div>' : '';
      return '<div class="bp-row"><div class="bp-row-main"><div class="bp-row-title">' + badge + esc(r.nome) + metaBadge + '</div>' +
        '<div class="bp-row-meta">' + r.vendas + ' vendas · ticket ' + fmt(r.ticket) + ' · ' + (r.share || 0) + '% receita</div>' +
        bar +
        '</div><div class="bp-row-value is-gold">' + r.pontos + '<span style="display:block;font-size:.6rem;font-weight:500;color:var(--text-muted)">pts</span></div></div>';
    }).join('');
    body.innerHTML = toggle + kpis +
      '<p class="bp-ref-line">10 pts/venda · 1 pt/1.000 Kz · +50 pts ao atingir a meta mensal</p>' +
      '<div class="bp-section"><div class="bp-section-title">Classificação</div>' + rows + '</div>';
    bindRankToggle(body);
  }
  function bindRankToggle(body) {
    body.querySelectorAll('[data-rank-p]').forEach(function (btn) {
      btn.onclick = function () {
        localStorage.setItem(RANK_PERIODO_KEY, btn.getAttribute('data-rank-p'));
        renderRankingBody();
      };
    });
  }

  function openHorarios() {
    ensureShell('modal-bp-horarios', 'Horários e folgas', 'Equipa', 'Turnos, intervalos, folgas e conflitos com a agenda de hoje.');
    renderHorariosList();
    openShell('modal-bp-horarios');
  }
  function renderHorariosList() {
    var body = document.getElementById('modal-bp-horarios-body');
    if (!body) return;
    var profs = (state.profissionais || []).filter(function (p) {
      return typeof isProfissionalAtivo === 'function' ? isProfissionalAtivo(p) : (p.ativo !== false);
    });
    if (!profs.length) {
      body.innerHTML = '<div class="bp-empty"><strong>Sem profissionais activos</strong>Cadastre a equipa na aba Equipa.</div>';
      return;
    }

    var emTurno = 0, emFolga = 0, conflitosTotal = 0;
    var rows = profs.map(function (p) {
      var h = getHorarioProf(p.id);
      var st = estadoHojeProf(p.id);
      var conf = conflitosAgenda(p.id, hojeStr());
      conflitosTotal += conf.length;
      if (st.code === 'em_turno') emTurno++;
      if (st.code === 'folga' || st.code === 'dia_folga_semana') emFolga++;

      var badgeClass = '';
      if (st.code === 'em_turno') badgeClass = ' is-green';
      else if (st.code === 'folga' || st.code === 'dia_folga_semana') badgeClass = ' is-gold';
      else if (st.code === 'intervalo') badgeClass = '';
      else if (st.code === 'fora_horario' || st.code === 'inactivo') badgeClass = ' is-red';

      var dias = (h.dias || []).map(function (d) { return DIAS_LABEL[d] || d; }).join(', ') || 'Sem dias definidos';
      var alert = conf.length
        ? '<div class="bp-row-meta" style="color:var(--red);margin-top:4px">' + conf.length + ' marcação(ões) em conflito hoje</div>'
        : '';

      return '<div class="bp-row"><div class="bp-row-main"><div class="bp-row-title">' + esc(p.nome) +
        ' <span class="bp-badge' + badgeClass + '">' + esc(st.label) + '</span></div>' +
        '<div class="bp-row-meta">' + esc(h.entrada) + '–' + esc(h.saida) +
        (h.intervaloInicio ? ' · intervalo ' + esc(h.intervaloInicio) + '–' + esc(h.intervaloFim) : '') +
        '<br>' + esc(dias) + '</div>' + alert + '</div>' +
        '<button type="button" class="bp-action-btn" data-edit-horario="' + p.id + '">Editar</button></div>';
    }).join('');

    var insight = '';
    if (conflitosTotal > 0) {
      insight = '<div class="bp-alert-banner is-warn"><strong>' + conflitosTotal +
        (conflitosTotal === 1 ? ' conflito com a agenda' : ' conflitos com a agenda') +
        '</strong>Há marcações fora do turno ou em dia de folga. Edite o horário ou reagende.</div>';
    } else {
      insight = '<div class="bp-alert-banner is-ok"><strong>Escala alinhada com a agenda</strong>Nenhum conflito detectado para hoje.</div>';
    }

    body.innerHTML =
      insight +
      '<div class="bp-kpi-grid">' +
        '<div class="bp-kpi"><div class="bp-kpi-label">Em turno</div><div class="bp-kpi-value is-positive">' + emTurno + '</div></div>' +
        '<div class="bp-kpi"><div class="bp-kpi-label">Folga</div><div class="bp-kpi-value">' + emFolga + '</div></div>' +
        '<div class="bp-kpi"><div class="bp-kpi-label">Conflitos</div><div class="bp-kpi-value' + (conflitosTotal ? ' is-negative' : '') + '">' + conflitosTotal + '</div></div>' +
      '</div>' +
      '<p class="bp-ref-line">Estado em tempo real · ' + esc(hojeStr()) + ' · só profissionais activos</p>' +
      '<div class="bp-section"><div class="bp-section-title">Equipa · hoje</div>' + rows + '</div>' +
      '<div id="bp-horario-editor" style="display:none;margin-top:8px"></div>';

    body.querySelectorAll('[data-edit-horario]').forEach(function (btn) {
      btn.onclick = function () { renderEditorHorario(btn.getAttribute('data-edit-horario')); };
    });
  }

  function renderEditorHorario(profId) {
    var box = document.getElementById('bp-horario-editor');
    if (!box) return;
    var p = (state.profissionais || []).find(function (x) { return x.id === profId; });
    if (!p) return;
    var h = getHorarioProf(profId);
    var diasChecks = DIAS_ORD.map(function (d) {
      var on = (h.dias || []).indexOf(d) >= 0;
      return '<label style="display:inline-flex;align-items:center;gap:4px;margin:0 10px 8px 0;font-size:.8rem;cursor:pointer">' +
        '<input type="checkbox" data-dia="' + d + '"' + (on ? ' checked' : '') + '> ' + (DIAS_LABEL[d] || d) + '</label>';
    }).join('');
    var folgasHtml = (h.folgas || []).filter(function (d) { return d >= hojeStr(); }).slice(0, 8).map(function (d) {
      return '<span class="bp-badge" style="margin:0 6px 6px 0">' + esc(d) +
        ' <button type="button" data-rm-folga="' + esc(d) + '" style="border:0;background:none;cursor:pointer;color:inherit;font-weight:700">×</button></span>';
    }).join('') || '<span style="font-size:.8rem;color:var(--text-muted)">Nenhuma folga futura</span>';
    var conf = conflitosAgenda(profId, hojeStr());
    var confHtml = conf.length
      ? '<div style="margin:12px 0;padding:12px;border-radius:10px;background:var(--red-50,#FDE8E8);border:1px solid rgba(179,58,74,.25)">' +
        '<div style="font-size:.75rem;font-weight:600;color:var(--red);margin-bottom:6px">Conflitos com agenda de hoje</div>' +
        conf.map(function (c) {
          return '<div style="font-size:.8rem">' + esc(c.ag.hora) + (c.ag.cliente ? ' · ' + esc(c.ag.cliente) : '') +
            ' — ' + esc(c.reasons.join(', ')) + '</div>';
        }).join('') + '</div>'
      : '';
    box.style.display = 'block';
    box.innerHTML =
      '<div style="padding-top:16px;border-top:1px solid var(--border-soft)">' +
      '<div class="bp-section-title">Editar · ' + esc(p.nome) + '</div>' + confHtml +
      '<div class="bp-form-grid-2" style="margin-bottom:12px">' +
        '<div class="input-group"><label class="input-label" for="bp-h-entrada">Entrada</label><input type="time" id="bp-h-entrada" class="input-field" value="' + esc(h.entrada) + '"></div>' +
        '<div class="input-group"><label class="input-label" for="bp-h-saida">Saída</label><input type="time" id="bp-h-saida" class="input-field" value="' + esc(h.saida) + '"></div>' +
        '<div class="input-group"><label class="input-label" for="bp-h-i0">Início intervalo</label><input type="time" id="bp-h-i0" class="input-field" value="' + esc(h.intervaloInicio || '13:00') + '"></div>' +
        '<div class="input-group"><label class="input-label" for="bp-h-i1">Fim intervalo</label><input type="time" id="bp-h-i1" class="input-field" value="' + esc(h.intervaloFim || '14:00') + '"></div></div>' +
      '<div class="input-group"><label class="input-label">Dias de trabalho</label><div>' + diasChecks + '</div></div>' +
      '<div class="input-group"><label class="input-label">Folgas futuras</label><div style="margin-bottom:8px">' + folgasHtml + '</div>' +
      '<input type="date" id="bp-h-folga" class="input-field" min="' + hojeStr() + '"></div>' +
      '<label style="display:flex;align-items:center;gap:8px;font-size:.85rem;margin:12px 0">' +
        '<input type="checkbox" id="bp-h-activo"' + (h.activo !== false ? ' checked' : '') + '> Profissional activo na escala</label>' +
      '<button type="button" class="btn btn-primary btn-block" id="bp-h-save">Guardar horário</button></div>';
    box.querySelectorAll('[data-rm-folga]').forEach(function (btn) {
      btn.onclick = function (e) {
        e.preventDefault();
        var d = btn.getAttribute('data-rm-folga');
        setHorarioProf(profId, { folgas: (h.folgas || []).filter(function (x) { return x !== d; }) });
        renderEditorHorario(profId);
      };
    });
    document.getElementById('bp-h-save').onclick = function () {
      var dias = [];
      box.querySelectorAll('[data-dia]:checked').forEach(function (c) { dias.push(c.getAttribute('data-dia')); });
      if (!dias.length) { if (typeof toast === 'function') toast('Seleccione pelo menos um dia', 'error'); return; }
      var folgas = (getHorarioProf(profId).folgas || []).slice();
      var nova = (document.getElementById('bp-h-folga') || {}).value;
      if (nova) {
        if (nova < hojeStr()) { if (typeof toast === 'function') toast('Folga deve ser hoje ou futura', 'error'); return; }
        if (folgas.indexOf(nova) < 0) folgas.push(nova);
      }
      var saved = setHorarioProf(profId, {
        entrada: (document.getElementById('bp-h-entrada') || {}).value || '09:00',
        saida: (document.getElementById('bp-h-saida') || {}).value || '18:00',
        intervaloInicio: (document.getElementById('bp-h-i0') || {}).value || '13:00',
        intervaloFim: (document.getElementById('bp-h-i1') || {}).value || '14:00',
        dias: dias, folgas: folgas,
        activo: !!(document.getElementById('bp-h-activo') || {}).checked
      });
      if (!saved) return;
      if (typeof toast === 'function') toast('Horário de ' + p.nome + ' actualizado', 'success');
      renderHorariosList();
    };
  }

  function openChat() {
    ensureShell('modal-bp-chat', 'Chat interno', 'Comunicação', 'Recados de turno neste dispositivo.');
    var footer = document.querySelector('#modal-bp-chat .bp-sheet-footer');
    if (footer) {
      footer.innerHTML =
        '<div style="display:flex;flex-direction:column;gap:6px;width:100%">' +
          '<div style="display:flex;gap:8px;width:100%;align-items:center">' +
            '<input type="text" id="bp-chat-input" class="input-field" placeholder="Mensagem para a equipa…" maxlength="500" autocomplete="off" style="flex:1;height:44px">' +
            '<button type="button" class="btn btn-primary" id="bp-chat-send" style="flex:0;padding:0 18px;height:44px">Enviar</button></div>' +
          '<div style="display:flex;justify-content:space-between;font-size:.7rem;color:var(--text-muted)">' +
            '<span id="bp-chat-count">0 / 500</span>' +
            '<button type="button" id="bp-chat-clear" style="border:0;background:none;color:var(--text-muted);font-size:.7rem;cursor:pointer;text-decoration:underline">Limpar histórico</button></div></div>';
    }
    renderChatBody();
    openShell('modal-bp-chat');
    var send = document.getElementById('bp-chat-send');
    var input = document.getElementById('bp-chat-input');
    var count = document.getElementById('bp-chat-count');
    var clear = document.getElementById('bp-chat-clear');
    function doSend() {
      if (!input) return;
      if (enviarMensagem(input.value)) {
        input.value = '';
        if (count) count.textContent = '0 / 500';
        renderChatBody();
      }
    }
    if (send) send.onclick = doSend;
    if (input) {
      input.oninput = function () { if (count) count.textContent = input.value.length + ' / 500'; };
      input.onkeydown = function (e) { if (e.key === 'Enter') { e.preventDefault(); doSend(); } };
      setTimeout(function () { try { input.focus(); } catch (e) {} }, 200);
    }
    if (clear) {
      clear.onclick = async function () {
        var ok = true;
        if (typeof showConfirmModal === 'function') {
          ok = await showConfirmModal(
            'Limpar mensagens?',
            'Todas as mensagens deste chat neste dispositivo serão apagadas. Esta ação não remove dados do salão noutros sítios.',
            true,
            { confirmLabel: 'Limpar', cancelLabel: 'Cancelar', variant: 'destructive' }
          );
        }
        if (!ok) return;
        saveChat([]);
        renderChatBody();
        if (typeof toast === 'function') toast('Histórico limpo.', 'success');
      };
    }
  }
  function renderChatBody() {
    var body = document.getElementById('modal-bp-chat-body');
    if (!body) return;
    var list = loadChat();
    if (!list.length) {
      body.innerHTML = '<div class="bp-empty"><strong>Sem mensagens</strong>Use o campo abaixo para recados de turno, faltas ou avisos.</div>';
      return;
    }
    body.innerHTML = groupChatByDay(list).map(function (g) {
      var label = g.day === hojeStr() ? 'Hoje' : g.day;
      var items = g.items.map(function (m) {
        var isGestao = m.role === 'admin' || m.role === 'gerente';
        return '<div class="bp-row" style="flex-direction:column;align-items:stretch;gap:4px">' +
          '<div style="display:flex;justify-content:space-between;gap:8px;align-items:center">' +
            '<div class="bp-row-title" style="font-size:.78rem">' + esc(m.autor) +
            (isGestao ? ' <span class="bp-badge">Gestão</span>' : '') + '</div>' +
            '<div class="bp-row-meta">' + esc(formatMsgTime(m.ts)) + '</div></div>' +
          '<div style="font-size:.9rem;color:var(--text-primary);line-height:1.5">' + esc(m.texto) + '</div></div>';
      }).join('');
      return '<div class="bp-section"><div class="bp-section-title">' + esc(label) + '</div>' + items + '</div>';
    }).join('');
    try { body.scrollTop = body.scrollHeight; } catch (e) {}
  }

  function ensureMenuItems() {
    var dd = document.getElementById('menu-dropdown');
    if (!dd || dd.querySelector('[data-bp-menu="equipa"]')) return;
    var frag = document.createDocumentFragment();
    var sec = document.createElement('div');
    sec.className = 'bp-menu-section';
    sec.setAttribute('data-bp-menu', 'equipa');
    sec.textContent = 'Equipa';
    frag.appendChild(sec);
    [{ key: 'ranking', label: 'Ranking' }, { key: 'horarios', label: 'Horários e folgas' }, { key: 'chat', label: 'Chat interno' }].forEach(function (it) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('data-bp-menu', 'equipa');
      btn.setAttribute('data-bp-action', it.key);
      btn.innerHTML = '<span>' + it.label + '</span>';
      frag.appendChild(btn);
    });
    var logout = dd.querySelector('#logout-btn');
    if (logout) dd.insertBefore(frag, logout);
    else dd.appendChild(frag);
    if (!dd.dataset.bpEquipaBound) {
      dd.dataset.bpEquipaBound = '1';
      dd.addEventListener('click', function (e) {
        var t = e.target.closest('[data-bp-action]');
        if (!t || t.getAttribute('data-bp-menu') !== 'equipa') return;
        e.stopPropagation();
        dd.style.display = 'none';
        var a = t.getAttribute('data-bp-action');
        try {
          if (a === 'ranking') openRanking();
          if (a === 'horarios') openHorarios();
          if (a === 'chat') openChat();
        } catch (err) {
          console.error('[BPEquipa]', err);
          if (typeof toast === 'function') toast('Não foi possível abrir esta secção', 'error');
        }
      });
    }
  }

  function init() {
    // ET4-P1-02: listeners só uma vez; re-ensure de menus permitido após login
    if (window.__bpEquipaInitDone) {
      try {
        if (typeof ensureMenuItems === "function") ensureMenuItems();
      } catch (eRe) {}
      return;
    }
    window.__bpEquipaInitDone = true;

    try { ensureMenuItems(); } catch (e) { console.warn('[equipa-fase3]', e); }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 140); });
  } else setTimeout(init, 140);
  setTimeout(init, 1600);
  setTimeout(init, 4200);

  window.BPEquipa = {
    calcRanking: calcRanking,
    getHorarioProf: getHorarioProf,
    setHorarioProf: setHorarioProf,
    estadoHojeProf: estadoHojeProf,
    conflitosAgenda: conflitosAgenda,
    enviarMensagem: enviarMensagem,
    loadChat: loadChat,
    openRanking: openRanking,
    openHorarios: openHorarios,
    openChat: openChat
  };
})();

/* ===== FILE: gestao-fase78.js ===== */
// ================================================================
// Grupos 7–8 — IA/Automação + Gestão (offline-first, robusto)
// F11 Reagendamento | F10 Dashboard | F12 Export | F19 Backup
// F20 Auditoria | F21 Filiais
// Supabase: NÃO — só sob comando explícito do utilizador
// ================================================================
(function () {
  "use strict";

  var AUDIT_KEY = "bp_audit_v1";
  var FILIAIS_KEY = "bp_filiais_v1";
  var FILIAL_ATIVA_KEY = "bp_filial_ativa";
  var BACKUP_META_KEY = "bp_last_backup_meta";

  function fmt(v) {
    return typeof fmtKz === "function" ? fmtKz(v) : Math.round(Number(v) || 0) + " Kz";
  }
  function esc(s) {
    return typeof escHtml === "function" ? escHtml(String(s == null ? "" : s)) : String(s == null ? "" : s);
  }
  function hojeStr() {
    return typeof hoje === "function" ? hoje() : new Date().toISOString().slice(0, 10);
  }
  function uid() {
    return typeof uuid === "function" ? uuid() : "id" + Date.now() + Math.random().toString(16).slice(2, 8);
  }
  function safeJson(key, fb) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fb;
      var v = JSON.parse(raw);
      return v == null ? fb : v;
    } catch (e) { return fb; }
  }
  function writeJson(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; }
    catch (e) {
      if (typeof toast === "function") toast("Armazenamento local indisponível", "error");
      return false;
    }
  }
  function loadArr(key) {
    var v = safeJson(key, []);
    return Array.isArray(v) ? v : [];
  }

  /* ========== F20 AUDITORIA ========== */
  function logAudit(acao, detalhe, meta) {
    try {
      var list = loadArr(AUDIT_KEY);
      list.push({
        id: uid(),
        acao: String(acao || "accao").slice(0, 80),
        detalhe: String(detalhe || "").slice(0, 300),
        meta: meta || null,
        ts: new Date().toISOString(),
        data: hojeStr()
      });
      writeJson(AUDIT_KEY, list.slice(-400));
    } catch (e) {}
  }
  function loadAudit(limite) {
    var list = loadArr(AUDIT_KEY).slice().reverse();
    return typeof limite === "number" ? list.slice(0, limite) : list;
  }

  /* ========== F21 FILIAIS ========== */
  function loadFiliais() {
    var list = loadArr(FILIAIS_KEY);
    if (!list.length) {
      var nome = (state && state.config && state.config.storeName) || "Salão principal";
      list = [{ id: "filial_main", nome: nome, localizacao: "", contacto: "", created_at: new Date().toISOString() }];
      writeJson(FILIAIS_KEY, list);
    }
    return list;
  }
  function saveFiliais(list) { return writeJson(FILIAIS_KEY, list); }
  function getFilialAtiva() {
    var id = localStorage.getItem(FILIAL_ATIVA_KEY) || "filial_main";
    var f = loadFiliais().find(function (x) { return x.id === id; });
    return f || loadFiliais()[0];
  }
  function setFilialAtiva(id) {
    var f = loadFiliais().find(function (x) { return x.id === id; });
    if (!f) return null;
    localStorage.setItem(FILIAL_ATIVA_KEY, id);
    logAudit("filial_switch", "Mudou para " + f.nome, { filial_id: id });
    return f;
  }
  function upsertFilial(data) {
    var nome = String(data.nome || "").trim();
    if (!nome) {
      if (typeof toast === "function") toast("Nome da filial obrigatório", "error");
      return null;
    }
    var list = loadFiliais();
    if (data.id) {
      var i = list.findIndex(function (x) { return x.id === data.id; });
      if (i < 0) return null;
      list[i] = Object.assign({}, list[i], {
        nome: nome,
        localizacao: String(data.localizacao || "").trim(),
        contacto: String(data.contacto || "").trim(),
        updated_at: new Date().toISOString()
      });
      saveFiliais(list);
      logAudit("filial_edit", nome, { filial_id: data.id });
      return list[i];
    }
    if (list.some(function (x) { return x.nome.toLowerCase() === nome.toLowerCase(); })) {
      if (typeof toast === "function") toast("Já existe uma filial com este nome", "error");
      return null;
    }
    var f = {
      id: uid(),
      nome: nome,
      localizacao: String(data.localizacao || "").trim(),
      contacto: String(data.contacto || "").trim(),
      created_at: new Date().toISOString()
    };
    list.push(f);
    saveFiliais(list);
    logAudit("filial_create", nome, { filial_id: f.id });
    return f;
  }

  /* ========== F11 REAGENDAMENTO ========== */
  function parseMin(hhmm) {
    var p = String(hhmm || "09:00").split(":");
    return (parseInt(p[0], 10) || 0) * 60 + (parseInt(p[1], 10) || 0);
  }
  function minToHora(m) {
    var h = Math.floor(m / 60);
    var mm = m % 60;
    return String(h).padStart(2, "0") + ":" + String(mm).padStart(2, "0");
  }
  function slotsLivres(profissionalId, data, duracaoMin) {
    duracaoMin = duracaoMin || 60;
    var entrada = 9 * 60, saida = 18 * 60, passo = 30;
    // horários equipa se existirem
    try {
      if (window.BPEquipa && typeof BPEquipa.getHorarioProf === "function" && profissionalId) {
        var h = BPEquipa.getHorarioProf(profissionalId);
        if (h) {
          entrada = parseMin(h.entrada);
          saida = parseMin(h.saida);
          if (h.folgas && h.folgas.indexOf(data) >= 0) return [];
          var diaJs = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"][new Date(data + "T12:00:00").getDay()];
          if (h.dias && h.dias.indexOf(diaJs) < 0) return [];
        }
      }
    } catch (e) {}

    var ocupados = (state.agendamentos || []).filter(function (a) {
      if (a.data !== data) return false;
      if (profissionalId && a.profissional_id && a.profissional_id !== profissionalId) return false;
      var st = String(a.status || a.estado || "").toLowerCase();
      if (st === "cancelado") return false;
      return true;
    }).map(function (a) {
      var ini = parseMin(a.hora);
      return { ini: ini, fim: ini + duracaoMin };
    });

    var livres = [];
    for (var t = entrada; t + duracaoMin <= saida; t += passo) {
      // intervalo almoço 13-14 se BPEquipa
      var conflito = ocupados.some(function (o) {
        return t < o.fim && (t + duracaoMin) > o.ini;
      });
      if (!conflito) livres.push(minToHora(t));
      if (livres.length >= 12) break;
    }
    return livres;
  }

  function sugerirReagendamento(agendamentoId) {
    var ag = (state.agendamentos || []).find(function (a) { return a.id === agendamentoId; });
    if (!ag) return null;
    var sugestoes = [];
    var base = new Date((ag.data || hojeStr()) + "T12:00:00");
    for (var d = 0; d < 14 && sugestoes.length < 8; d++) {
      var dt = new Date(base);
      dt.setDate(base.getDate() + d);
      var dataStr = dt.toISOString().slice(0, 10);
      if (dataStr < hojeStr()) continue;
      var slots = slotsLivres(ag.profissional_id, dataStr, 60);
      slots.forEach(function (hora) {
        if (dataStr === ag.data && hora === ag.hora) return;
        if (sugestoes.length < 8) {
          sugestoes.push({ data: dataStr, hora: hora, profissional_id: ag.profissional_id });
        }
      });
    }
    return { agendamento: ag, sugestoes: sugestoes };
  }

  async function aplicarReagendamento(agendamentoId, data, hora) {
    if (!data || !hora) {
      if (typeof toast === "function") toast("Data e hora obrigatórias", "error");
      return null;
    }
    if (data < hojeStr()) {
      if (typeof toast === "function") toast("Não é possível reagendar para o passado", "error");
      return null;
    }
    var ag = (state.agendamentos || []).find(function (a) { return a.id === agendamentoId; });
    if (!ag) {
      if (typeof toast === "function") toast("Marcação não encontrada", "error");
      return null;
    }
    // conflito
    var livre = slotsLivres(ag.profissional_id, data, 60).indexOf(hora) >= 0;
    if (!livre) {
      if (typeof toast === "function") toast("Horário indisponível para este profissional", "error");
      return null;
    }
    if (typeof updateAgendamento === "function") {
      await updateAgendamento(agendamentoId, { data: data, hora: hora });
    } else {
      ag.data = data;
      ag.hora = hora;
      if (typeof dbPut === "function") await dbPut("agendamentos", ag);
    }
    logAudit("reagendar", (ag.cliente || "") + " → " + data + " " + hora, { id: agendamentoId });
    return true;
  }

  /* ========== F10 DASHBOARD EXECUTIVO ========== */
  function dashboardExecutivo() {
    var hs = hojeStr();
    var ym = hs.slice(0, 7);
    var movs = state.movimentos || [];
    var vendasMes = movs.filter(function (m) { return m.tipo === "venda" && String(m.data || "").startsWith(ym); });
    var despMes = movs.filter(function (m) { return m.tipo === "despesa" && String(m.data || "").startsWith(ym); });
    var receita = vendasMes.reduce(function (s, m) { return s + (Number(m.valor) || 0); }, 0);
    var despesas = despMes.reduce(function (s, m) { return s + (Number(m.valor) || 0); }, 0);
    var comissoes = vendasMes.reduce(function (s, m) { return s + (Number(m.comissao_gerada) || 0); }, 0);
    var hojeVendas = movs.filter(function (m) { return m.tipo === "venda" && m.data === hs; });
    var receitaHoje = hojeVendas.reduce(function (s, m) { return s + (Number(m.valor) || 0); }, 0);
    var agHoje = (state.agendamentos || []).filter(function (a) {
      return a.data === hs && String(a.status || a.estado || "").toLowerCase() !== "cancelado";
    }).length;
    var clientes = (state.clientes || []).length;
    var profs = (state.profissionais || []).filter(function (p) {
      return typeof isProfissionalAtivo === "function" ? isProfissionalAtivo(p) : (p.ativo !== false);
    }).length;
    var ticket = vendasMes.length ? Math.round(receita / vendasMes.length) : 0;
    var nps = null;
    try {
      if (window.BPOps && BPOps.calcNpsScore) nps = BPOps.calcNpsScore(90);
    } catch (e) {}
    var stockAlert = 0;
    try {
      if (window.BPOps && BPOps.produtosBaixoStock) stockAlert = BPOps.produtosBaixoStock().length;
    } catch (e) {}

    var byProf = {};
    vendasMes.forEach(function (m) {
      var k = m.profissional || m.profissional_id || "—";
      if (!byProf[k]) byProf[k] = { nome: k, receita: 0, n: 0 };
      byProf[k].receita += Number(m.valor) || 0;
      byProf[k].n += 1;
    });
    var topProf = Object.keys(byProf).map(function (k) { return byProf[k]; })
      .sort(function (a, b) { return b.receita - a.receita; }).slice(0, 8);

    var byServ = {};
    vendasMes.forEach(function (m) {
      (m.itens || []).forEach(function (it) {
        var nome = it.nome || "Sem nome";
        if (!byServ[nome]) byServ[nome] = { nome: nome, receita: 0, qtd: 0 };
        byServ[nome].receita += Number(it.subtotal) || 0;
        byServ[nome].qtd += Number(it.quantidade) || 1;
      });
    });
    var topServ = Object.keys(byServ).map(function (k) { return byServ[k]; })
      .sort(function (a, b) { return b.receita - a.receita; }).slice(0, 8);

    var byMetodo = {};
    vendasMes.forEach(function (m) {
      var k = m.metodoPagamento || m.metodo_pagamento || "Numerário";
      byMetodo[k] = (byMetodo[k] || 0) + (Number(m.valor) || 0);
    });
    var metodos = Object.keys(byMetodo).map(function (k) {
      return { nome: k, valor: byMetodo[k] };
    }).sort(function (a, b) { return b.valor - a.valor; });

    // Série diária do mês até hoje
    var y = parseInt(ym.slice(0, 4), 10);
    var mo = parseInt(ym.slice(5, 7), 10);
    var lastDay = new Date(y, mo, 0).getDate();
    var diaHoje = parseInt(hs.slice(8, 10), 10) || lastDay;
    var porDia = {};
    vendasMes.forEach(function (m) {
      var d = String(m.data || "");
      porDia[d] = (porDia[d] || 0) + (Number(m.valor) || 0);
    });
    var serieDiaria = [];
    for (var day = 1; day <= diaHoje; day++) {
      var ds = ym + "-" + String(day).padStart(2, "0");
      serieDiaria.push({ data: ds, dia: day, valor: porDia[ds] || 0 });
    }

    var meta = null;
    try {
      if (typeof getProgressoMetaSalao === "function") meta = getProgressoMetaSalao();
    } catch (e) {}

    return {
      receitaMes: receita,
      despesasMes: despesas,
      lucroMes: receita - despesas,
      comissoesMes: comissoes,
      vendasMes: vendasMes.length,
      receitaHoje: receitaHoje,
      vendasHoje: hojeVendas.length,
      agendamentosHoje: agHoje,
      clientes: clientes,
      profissionais: profs,
      ticketMedio: ticket,
      nps: nps,
      stockAlert: stockAlert,
      topProfissionais: topProf,
      topServicos: topServ,
      metodos: metodos,
      serieDiaria: serieDiaria,
      meta: meta,
      periodo: ym
    };
  }

  function drawExecChart(canvas, serie) {
    if (!canvas || !serie || !serie.length) return;
    var parent = canvas.parentElement;
    var width = Math.max((parent && parent.getBoundingClientRect().width) || 320, 240);
    var height = 160;
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, width, height);

    var maxVal = 1;
    serie.forEach(function (p) { if (p.valor > maxVal) maxVal = p.valor; });

    var padL = 8, padR = 8, padT = 12, padB = 22;
    var n = serie.length;
    var gap = n > 20 ? 1 : 2;
    var barW = Math.max(2, (width - padL - padR) / n - gap);
    var baseY = height - padB;
    var chartH = height - padT - padB;

    var gold = "#C9A227";
    try {
      var g = getComputedStyle(document.documentElement).getPropertyValue("--gold").trim();
      if (g) gold = g;
    } catch (e) {}

    // grid line
    ctx.strokeStyle = "rgba(0,0,0,0.06)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL, baseY);
    ctx.lineTo(width - padR, baseY);
    ctx.stroke();

    for (var i = 0; i < n; i++) {
      var v = serie[i].valor || 0;
      var h = Math.max(v > 0 ? 3 : 0, (v / maxVal) * chartH);
      var x = padL + i * (barW + gap);
      var y = baseY - h;
      ctx.fillStyle = v > 0 ? gold : "rgba(0,0,0,0.06)";
      ctx.beginPath();
      var r = Math.min(3, barW / 2);
      ctx.moveTo(x, baseY);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.lineTo(x + barW - r, y);
      ctx.quadraticCurveTo(x + barW, y, x + barW, y + r);
      ctx.lineTo(x + barW, baseY);
      ctx.closePath();
      ctx.fill();
    }

    // labels: first, mid, last day
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.font = "600 10px system-ui, sans-serif";
    ctx.textAlign = "center";
    var idxs = [0, Math.floor((n - 1) / 2), n - 1];
    idxs.forEach(function (ix) {
      if (ix < 0 || ix >= n) return;
      var x = padL + ix * (barW + gap) + barW / 2;
      ctx.fillText(String(serie[ix].dia), x, height - 6);
    });
  }

  /* ========== F12 EXPORT ========== */
  function csvEscape(v) {
    var s = String(v == null ? "" : v);
    if (/[",\n;]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }
  function downloadText(filename, text, mime) {
    var blob = new Blob([text], { type: mime || "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 400);
  }
  function exportRelatorio(tipo) {
    var ym = hojeStr().slice(0, 7);
    var lines = [];
    var nome = "beautypro-" + tipo + "-" + hojeStr() + ".csv";
    if (tipo === "vendas") {
      lines.push(["data", "cliente", "profissional", "valor", "comissao", "pagamento"].join(";"));
      (state.movimentos || []).filter(function (m) {
        return m.tipo === "venda" && String(m.data || "").startsWith(ym);
      }).forEach(function (m) {
        lines.push([m.data, m.cliente, m.profissional, m.valor, m.comissao_gerada || 0, m.metodoPagamento || ""].map(csvEscape).join(";"));
      });
    } else if (tipo === "despesas") {
      lines.push(["data", "descricao", "categoria", "valor", "fornecedor"].join(";"));
      (state.movimentos || []).filter(function (m) {
        return m.tipo === "despesa" && String(m.data || "").startsWith(ym);
      }).forEach(function (m) {
        lines.push([m.data, m.descricao, m.categoria || "", m.valor, m.fornecedor || ""].map(csvEscape).join(";"));
      });
    } else if (tipo === "clientes") {
      lines.push(["nome", "telefone", "pontos"].join(";"));
      (state.clientes || []).forEach(function (c) {
        lines.push([c.nome, c.telefone || c.phone || "", c.pontos || 0].map(csvEscape).join(";"));
      });
    } else if (tipo === "agenda") {
      lines.push(["data", "hora", "cliente", "servico", "profissional", "status"].join(";"));
      (state.agendamentos || []).forEach(function (a) {
        lines.push([a.data, a.hora, a.cliente, a.servico || "", a.profissional || "", a.status || a.estado || ""].map(csvEscape).join(";"));
      });
    } else if (tipo === "comissoes") {
      lines.push(["profissional", "vendas", "receita", "comissao"].join(";"));
      var map = {};
      (state.movimentos || []).filter(function (m) {
        return m.tipo === "venda" && String(m.data || "").startsWith(ym);
      }).forEach(function (m) {
        var k = m.profissional || "—";
        if (!map[k]) map[k] = { vendas: 0, receita: 0, comissao: 0 };
        map[k].vendas++;
        map[k].receita += Number(m.valor) || 0;
        map[k].comissao += Number(m.comissao_gerada) || 0;
      });
      Object.keys(map).forEach(function (k) {
        var r = map[k];
        lines.push([k, r.vendas, r.receita, r.comissao].map(csvEscape).join(";"));
      });
    } else {
      if (typeof toast === "function") toast("Tipo de relatório desconhecido", "error");
      return;
    }
    // BOM for Excel
    downloadText(nome, "\uFEFF" + lines.join("\n"), "text/csv;charset=utf-8");
    logAudit("export", tipo + " CSV", { rows: lines.length - 1 });
    if (typeof toast === "function") toast("Exportação " + tipo + " pronta", "success");
  }

  /* ========== F19 BACKUP ========== */
  function buildBackupSnapshot() {
    var local = {};
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf("bp_") === 0) local[k] = localStorage.getItem(k);
      }
    } catch (e) {}
    return {
      version: 1,
      app: "BeautyPro",
      created_at: new Date().toISOString(),
      storeName: (state && state.config && state.config.storeName) || "",
      state: {
        clientes: (state && state.clientes) || [],
        profissionais: (state && state.profissionais) || [],
        servicos: (state && state.servicos) || [],
        movimentos: (state && state.movimentos) || [],
        agendamentos: (state && state.agendamentos) || [],
        config: (state && state.config) || {}
      },
      localStorage_bp: local
    };
  }
  function downloadBackup() {
    var snap = buildBackupSnapshot();
    downloadText(
      "beautypro-backup-" + hojeStr() + ".json",
      JSON.stringify(snap, null, 2),
      "application/json;charset=utf-8"
    );
    writeJson(BACKUP_META_KEY, { at: snap.created_at, size: JSON.stringify(snap).length });
    logAudit("backup", "Backup JSON descarregado", { at: snap.created_at });
    if (typeof toast === "function") toast("Backup descarregado.", "success");
  }
  async function restoreBackupFromObject(snap) {
    if (!snap || !snap.state) {
      if (typeof toast === "function") toast("Ficheiro de backup inválido", "error");
      return false;
    }
    if (typeof showConfirmModal === "function") {
      var _okRestore = await showConfirmModal(
        "Restaurar backup?",
        "Os dados actuais em memória neste dispositivo serão substituídos pelo conteúdo do ficheiro de backup. Confirma apenas se tens a certeza.",
        true,
        { confirmLabel: "Restaurar", cancelLabel: "Cancelar", variant: "destructive" }
      );
      if (!_okRestore) return false;
    } else {
      return false;
    }
    try {
      var keys = ["clientes", "profissionais", "servicos", "movimentos", "agendamentos"];
      for (var ki = 0; ki < keys.length; ki++) {
        var key = keys[ki];
        var arr = snap.state[key] || [];
        if (window.BeautyStore && BeautyStore.setState) {
          var patch = {};
          patch[key] = arr;
          BeautyStore.setState(patch);
        } else if (typeof state !== "undefined") {
          state[key] = arr;
        }
        if (typeof dbPut === "function") {
          for (var j = 0; j < arr.length; j++) {
            try { await dbPut(key, arr[j]); } catch (e) {}
          }
        }
      }
      if (snap.state.config) {
        if (typeof state !== "undefined") state.config = Object.assign({}, state.config || {}, snap.state.config);
      }
      if (snap.localStorage_bp) {
        Object.keys(snap.localStorage_bp).forEach(function (k) {
          try { localStorage.setItem(k, snap.localStorage_bp[k]); } catch (e) {}
        });
      }
      logAudit("restore", "Backup restaurado", { at: snap.created_at });
      if (typeof updateUI === "function") updateUI();
      if (typeof toast === "function") toast("Backup restaurado.", "success");
      return true;
    } catch (e) {
      console.error(e);
      if (typeof toast === "function") toast("Erro ao restaurar backup", "error");
      return false;
    }
  }

  /* ========== UI ========== */
  function ensureShell(id, title, eyebrow, subtitle) {
    if (typeof ensureBpSheetModal === 'function') {
      return ensureBpSheetModal(id, title, eyebrow, subtitle);
    }
    var el = document.getElementById(id);
    if (el) {
      var tEl = el.querySelector('.bp-sheet-title');
      if (tEl && title) tEl.textContent = title;
      return el;
    }
    el = document.createElement('div');
    el.id = id;
    el.className = 'modal-overlay';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-labelledby', id + '-title');
    var eye = eyebrow || 'BeautyPro';
    var sub = subtitle || '';
    el.innerHTML =
      '<div class="bp-sheet modal-sheet">' +
        '<div class="bp-sheet-handle handle" aria-hidden="true"></div>' +
        '<div class="bp-sheet-header">' +
          '<div class="bp-sheet-eyebrow">' + eye + '</div>' +
          '<h2 class="bp-sheet-title modal-title" id="' + id + '-title">' + title + '</h2>' +
          (sub ? '<p class="bp-sheet-subtitle">' + sub + '</p>' : '') +
        '</div>' +
        '<div class="bp-sheet-body" id="' + id + '-body"></div>' +
        '<div class="bp-sheet-footer modal-actions">' +
          '<button type="button" class="btn btn-secondary" data-close="' + id + '">Fechar</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(el);
    el.addEventListener('click', function (e) {
      if (e.target === el || e.target.getAttribute('data-close') === id) {
        if (typeof closeModal === 'function') closeModal(id);
        else el.classList.remove('open');
      }
    });
    return el;
  }
  function openShell(id) {
    if (typeof openModal === "function") openModal(id);
    else {
      var el = document.getElementById(id);
      if (el) el.classList.add("open");
    }
  }

  function openDashboard() {
    ensureShell("modal-bp-dash", "Dashboard executivo", "Gestão", "KPIs, gráfico diário e tabelas do mês corrente.");
    var d = dashboardExecutivo();
    var body = document.getElementById("modal-bp-dash-body");
    if (!body) return;

    var npsTxt = d.nps && d.nps.nps != null ? String(d.nps.nps) : "—";
    var lucroClass = d.lucroMes > 0 ? " is-positive" : (d.lucroMes < 0 ? " is-negative" : "");

    var insight = "";
    if (d.meta && d.meta.meta > 0) {
      if (d.meta.atingida) {
        insight = '<div class="bp-alert-banner is-ok"><strong>Meta do mês atingida</strong>' + fmt(d.meta.volume) + " de " + fmt(d.meta.meta) + " (" + d.meta.pct + "%).</div>";
      } else {
        insight = '<div class="bp-alert-banner"><strong>Meta do mês · ' + d.meta.pct + "%</strong>" +
          fmt(d.meta.volume) + " de " + fmt(d.meta.meta) + " · faltam " + fmt(Math.max(0, d.meta.meta - d.meta.volume)) + ".</div>";
      }
    } else if (!d.vendasMes) {
      insight = '<div class="bp-alert-banner"><strong>Sem vendas neste mês</strong>Os indicadores e o gráfico actualizam quando registar vendas.</div>';
    }

    function tableRows(headers, rowsHtml) {
      return '<div class="bp-table-wrap"><table class="bp-table"><thead><tr>' +
        headers.map(function (h) { return "<th>" + h + "</th>"; }).join("") +
        "</tr></thead><tbody>" + rowsHtml + "</tbody></table></div>";
    }

    var profRows = (d.topProfissionais || []).map(function (p, i) {
      return "<tr><td>" + (i + 1) + "</td><td>" + esc(p.nome) + "</td><td>" + (p.n || "—") + "</td><td class=\"num\">" + fmt(p.receita) + "</td></tr>";
    }).join("") || '<tr><td colspan="4" class="empty">Sem vendas no mês</td></tr>';

    var servRows = (d.topServicos || []).map(function (s, i) {
      return "<tr><td>" + (i + 1) + "</td><td>" + esc(s.nome) + "</td><td>" + s.qtd + "</td><td class=\"num\">" + fmt(s.receita) + "</td></tr>";
    }).join("") || '<tr><td colspan="4" class="empty">Sem itens de serviço</td></tr>';

    var metRows = (d.metodos || []).map(function (m) {
      var pct = d.receitaMes > 0 ? Math.round((m.valor / d.receitaMes) * 100) : 0;
      return "<tr><td>" + esc(m.nome) + "</td><td>" + pct + "%</td><td class=\"num\">" + fmt(m.valor) + "</td></tr>";
    }).join("") || '<tr><td colspan="3" class="empty">—</td></tr>';

    body.innerHTML =
      insight +
      '<p class="bp-ref-line">Período <strong>' + esc(d.periodo) + "</strong> · actualizado agora · dados locais</p>" +
      '<div class="bp-kpi-grid">' +
        '<div class="bp-kpi"><div class="bp-kpi-label">Receita mês</div><div class="bp-kpi-value is-gold" style="font-size:.78rem">' + fmt(d.receitaMes) + "</div></div>" +
        '<div class="bp-kpi"><div class="bp-kpi-label">Despesas</div><div class="bp-kpi-value is-negative" style="font-size:.78rem">' + fmt(d.despesasMes) + "</div></div>" +
        '<div class="bp-kpi"><div class="bp-kpi-label">Lucro</div><div class="bp-kpi-value' + lucroClass + '" style="font-size:.78rem">' + fmt(d.lucroMes) + "</div></div></div>" +
      '<div class="bp-kpi-grid">' +
        '<div class="bp-kpi"><div class="bp-kpi-label">Hoje</div><div class="bp-kpi-value" style="font-size:.78rem">' + fmt(d.receitaHoje) + "</div></div>" +
        '<div class="bp-kpi"><div class="bp-kpi-label">Vendas mês</div><div class="bp-kpi-value">' + d.vendasMes + "</div></div>" +
        '<div class="bp-kpi"><div class="bp-kpi-label">Ticket médio</div><div class="bp-kpi-value" style="font-size:.78rem">' + fmt(d.ticketMedio) + "</div></div></div>" +
      '<div class="bp-kpi-grid">' +
        '<div class="bp-kpi"><div class="bp-kpi-label">Agenda hoje</div><div class="bp-kpi-value">' + d.agendamentosHoje + "</div></div>" +
        '<div class="bp-kpi"><div class="bp-kpi-label">NPS 90d</div><div class="bp-kpi-value is-gold">' + npsTxt + "</div></div>" +
        '<div class="bp-kpi"><div class="bp-kpi-label">Stock baixo</div><div class="bp-kpi-value' + (d.stockAlert ? " is-negative" : "") + '">' + d.stockAlert + "</div></div></div>" +
      '<div class="bp-section"><div class="bp-section-title">Receita diária (mês)</div>' +
        '<div class="bp-chart-box"><canvas id="bp-exec-chart" aria-label="Gráfico de receita diária"></canvas></div>' +
        '<p class="bp-ref-line">Barras = receita por dia até hoje</p></div>' +
      '<div class="bp-section"><div class="bp-section-title">Top profissionais</div>' +
        tableRows(["#", "Nome", "Vendas", "Receita"], profRows) + "</div>" +
      '<div class="bp-section"><div class="bp-section-title">Top serviços</div>' +
        tableRows(["#", "Serviço", "Qtd", "Receita"], servRows) + "</div>" +
      '<div class="bp-section"><div class="bp-section-title">Formas de pagamento</div>' +
        tableRows(["Método", "%", "Valor"], metRows) + "</div>" +
      '<p class="bp-ref-line">Comissões do mês: <strong>' + fmt(d.comissoesMes) + "</strong> · Clientes " + d.clientes + " · Equipa activa " + d.profissionais + "</p>";

    openShell("modal-bp-dash");
    logAudit("dashboard", "Consulta dashboard executivo");

    requestAnimationFrame(function () {
      var canvas = document.getElementById("bp-exec-chart");
      drawExecChart(canvas, d.serieDiaria || []);
    });
  }

  function openReagendar() {
    ensureShell("modal-bp-reagg", "Reagendamento inteligente", "Automação", "Sugere horários livres com base na agenda e turnos.");
    renderReagendar();
    openShell("modal-bp-reagg");
  }
  function renderReagendar() {
    var body = document.getElementById("modal-bp-reagg-body");
    if (!body) return;
    var lista = (state.agendamentos || []).filter(function (a) {
      var st = String(a.status || a.estado || "").toLowerCase();
      if (st === "cancelado" || st.indexOf("conclu") === 0) return false;
      return a.data && a.data >= hojeStr();
    }).sort(function (a, b) {
      return String(a.data + a.hora).localeCompare(String(b.data + b.hora));
    }).slice(0, 40);

    if (!lista.length) {
      body.innerHTML = '<div class="bp-empty"><strong>Sem marcações futuras</strong>Crie agenda para usar o reagendamento.</div>';
      return;
    }
    var rows = lista.map(function (a) {
      return '<div class="bp-row"><div class="bp-row-main"><div class="bp-row-title">' + esc(a.cliente || "Cliente") + "</div>" +
        '<div class="bp-row-meta">' + esc(a.data) + " · " + esc(a.hora || "") +
        (a.servico ? " · " + esc(a.servico) : "") +
        (a.profissional ? " · " + esc(a.profissional) : "") + "</div></div>" +
        '<button type="button" class="bp-action-btn is-primary" data-reagg="' + a.id + '">Sugerir</button></div>';
    }).join("");
    body.innerHTML =
      '<div class="bp-section" style="margin-top:0"><div class="bp-section-title">Marcações futuras</div>' + rows + "</div>" +
      '<div id="bp-reagg-sug" style="display:none;margin-top:12px"></div>';
    body.querySelectorAll("[data-reagg]").forEach(function (btn) {
      btn.onclick = function () { showSugestoes(btn.getAttribute("data-reagg")); };
    });
  }
  function showSugestoes(agId) {
    var box = document.getElementById("bp-reagg-sug");
    if (!box) return;
    var res = sugerirReagendamento(agId);
    if (!res) return;
    var ag = res.agendamento;
    if (!res.sugestoes.length) {
      box.style.display = "block";
      box.innerHTML = '<div class="bp-empty"><strong>Sem slots livres</strong>nos próximos 14 dias para este profissional.</div>';
      return;
    }
    var items = res.sugestoes.map(function (s, i) {
      return '<button type="button" class="bp-action-btn' + (i === 0 ? " is-primary" : "") + '" style="margin:0 8px 8px 0" data-apply-data="' + s.data + '" data-apply-hora="' + s.hora + '">' +
        esc(s.data) + " · " + esc(s.hora) + "</button>";
    }).join("");
    box.style.display = "block";
    box.innerHTML =
      '<div class="bp-section-title">Sugestões para ' + esc(ag.cliente || "") + "</div>" +
      '<p style="font-size:.8rem;color:var(--text-muted);margin:0 0 10px">Actual: ' + esc(ag.data) + " " + esc(ag.hora || "") + "</p>" +
      items;
    box.querySelectorAll("[data-apply-data]").forEach(function (btn) {
      btn.onclick = async function () {
        var ok = await aplicarReagendamento(agId, btn.getAttribute("data-apply-data"), btn.getAttribute("data-apply-hora"));
        if (ok) {
          if (typeof toast === "function") toast("Agendamento reagendado.", "success");
          if (typeof renderAgenda === "function") try { renderAgenda(); } catch (e) {}
          if (typeof updateUI === "function") try { updateUI(); } catch (e) {}
          renderReagendar();
        }
      };
    });
  }

  function openExport() {
    ensureShell("modal-bp-export", "Exportar relatórios", "Gestão", "CSV compatível com Excel (separador ;).");
    var body = document.getElementById("modal-bp-export-body");
    var tipos = [
      { k: "vendas", l: "Vendas do mês" },
      { k: "despesas", l: "Despesas do mês" },
      { k: "comissoes", l: "Comissões por profissional" },
      { k: "clientes", l: "Lista de clientes" },
      { k: "agenda", l: "Agenda completa" }
    ];
    body.innerHTML =
      '<div class="bp-alert-banner"><strong>Exportação local</strong>CSV com BOM UTF-8 — abre no Excel e LibreOffice sem problemas de acentos.</div>' +
      '<div class="bp-section" style="margin-top:0"><div class="bp-section-title">Escolher relatório</div>' +
      tipos.map(function (t) {
        return '<div class="bp-row"><div class="bp-row-main"><div class="bp-row-title">' + t.l + '</div>' +
          '<div class="bp-row-meta">Separador ; · mês corrente quando aplicável</div></div>' +
          '<button type="button" class="bp-action-btn is-primary" data-exp="' + t.k + '">Exportar</button></div>';
      }).join("") + '</div>';
    body.querySelectorAll("[data-exp]").forEach(function (btn) {
      btn.onclick = function () { exportRelatorio(btn.getAttribute("data-exp")); };
    });
    openShell("modal-bp-export");
  }

  function openBackup() {
    ensureShell("modal-bp-backup", "Backups", "Gestão", "Exportar e restaurar snapshot local (JSON).");
    var meta = safeJson(BACKUP_META_KEY, null);
    var body = document.getElementById("modal-bp-backup-body");
    body.innerHTML =
      '<div class="bp-alert-banner"><strong>Backup neste dispositivo</strong>Inclui clientes, equipa, serviços, movimentos, agenda e preferências BeautyPro.</div>' +
      '<div class="bp-kpi-grid">' +
        '<div class="bp-kpi"><div class="bp-kpi-label">Último backup</div><div class="bp-kpi-value" style="font-size:.7rem">' +
        (meta && meta.at ? esc(String(meta.at).slice(0, 16).replace("T", " ")) : "—") + "</div></div>" +
        '<div class="bp-kpi"><div class="bp-kpi-label">Clientes</div><div class="bp-kpi-value">' + ((state.clientes || []).length) + "</div></div>" +
        '<div class="bp-kpi"><div class="bp-kpi-label">Movimentos</div><div class="bp-kpi-value">' + ((state.movimentos || []).length) + "</div></div></div>" +
      '<div class="bp-section"><div class="bp-section-title">Exportar</div>' +
      '<button type="button" class="btn btn-primary btn-block" id="bp-bk-dl">Descarregar backup JSON</button></div>' +
      '<div class="bp-section"><div class="bp-section-title">Restaurar</div>' +
      '<div class="input-group"><label class="input-label" for="bp-bk-file">Ficheiro JSON</label>' +
      '<input type="file" id="bp-bk-file" class="input-field" accept="application/json,.json"></div>' +
      '<p class="bp-ref-line">A restauração substitui os dados locais deste dispositivo.</p></div>';
    document.getElementById("bp-bk-dl").onclick = downloadBackup;
    document.getElementById("bp-bk-file").onchange = function (ev) {
      var file = ev.target.files && ev.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var snap = JSON.parse(reader.result);
          restoreBackupFromObject(snap);
        } catch (e) {
          if (typeof toast === "function") toast("JSON inválido", "error");
        }
      };
      reader.readAsText(file);
    };
    openShell("modal-bp-backup");
  }

  function openAudit() {
    ensureShell("modal-bp-audit", "Histórico de alterações", "Auditoria", "Últimas acções registadas neste dispositivo.");
    var body = document.getElementById("modal-bp-audit-body");
    var list = loadAudit(80);
    if (!list.length) {
      body.innerHTML = '<div class="bp-alert-banner"><strong>Auditoria local</strong>Regista acções deste dispositivo (dashboard, backup, reagendar…).</div>' +
        '<div class="bp-empty"><strong>Sem registos ainda</strong>As acções das funcionalidades de gestão aparecem aqui.</div>';
    } else {
      body.innerHTML = '<div class="bp-alert-banner"><strong>Auditoria local</strong>Últimas ' + list.length + ' acções neste dispositivo.</div>' +
        '<div class="bp-section" style="margin-top:0"><div class="bp-section-title">Histórico</div>' +
        list.map(function (a) {
          return '<div class="bp-row"><div class="bp-row-main"><div class="bp-row-title">' + esc(a.acao) + "</div>" +
            '<div class="bp-row-meta">' + esc((a.ts || "").slice(0, 16).replace("T", " ")) +
            (a.detalhe ? " · " + esc(a.detalhe) : "") + "</div></div></div>";
        }).join("") + '</div>';
    }
    openShell("modal-bp-audit");
  }

  function openFiliais() {
    ensureShell("modal-bp-filiais", "Filiais", "Gestão", "Unidades do negócio. Isolamento completo de dados virá com Supabase.");
    renderFiliais();
    openShell("modal-bp-filiais");
  }
  function renderFiliais() {
    var body = document.getElementById("modal-bp-filiais-body");
    if (!body) return;
    var list = loadFiliais();
    var ativa = getFilialAtiva();
    var rows = list.map(function (f) {
      var is = ativa && ativa.id === f.id;
      return '<div class="bp-row"><div class="bp-row-main"><div class="bp-row-title">' + esc(f.nome) +
        (is ? ' <span class="bp-badge is-green">Activa</span>' : "") + "</div>" +
        '<div class="bp-row-meta">' + esc(f.localizacao || "Sem localização") +
        (f.contacto ? " · " + esc(f.contacto) : "") + "</div></div>" +
        (is ? "" : '<button type="button" class="bp-action-btn is-primary" data-filial="' + f.id + '">Activar</button>') +
        "</div>";
    }).join("");
    body.innerHTML =
      '<div class="bp-section" style="margin-top:0"><div class="bp-section-title">Unidades</div>' + rows + "</div>" +
      '<div class="bp-section"><div class="bp-section-title">Nova filial</div>' +
      '<div class="input-group"><label class="input-label">Nome</label><input id="bp-fl-nome" class="input-field" placeholder="Ex: BeautyPro Talatona"></div>' +
      '<div class="input-group"><label class="input-label">Localização</label><input id="bp-fl-loc" class="input-field" placeholder="Bairro / cidade"></div>' +
      '<div class="input-group"><label class="input-label">Contacto</label><input id="bp-fl-tel" class="input-field" placeholder="Telefone"></div>' +
      '<button type="button" class="btn btn-primary btn-block" id="bp-fl-add">Adicionar filial</button></div>' +
      '<p style="font-size:.75rem;color:var(--text-muted);line-height:1.45;margin-top:12px">Nota: o seletor de filial fica registado localmente. O isolamento total por RLS/Supabase será activado apenas quando autorizar.</p>';
    document.getElementById("bp-fl-add").onclick = function () {
      if (upsertFilial({
        nome: (document.getElementById("bp-fl-nome") || {}).value,
        localizacao: (document.getElementById("bp-fl-loc") || {}).value,
        contacto: (document.getElementById("bp-fl-tel") || {}).value
      })) {
        if (typeof toast === "function") toast("Filial criada", "success");
        renderFiliais();
      }
    };
    body.querySelectorAll("[data-filial]").forEach(function (btn) {
      btn.onclick = function () {
        setFilialAtiva(btn.getAttribute("data-filial"));
        if (typeof toast === "function") toast("Filial activa: " + (getFilialAtiva().nome || ""), "success");
        renderFiliais();
      };
    });
  }

  /* ========== MENU ========== */
  function ensureMenuItems() {
    var dd = document.getElementById("menu-dropdown");
    if (!dd || dd.querySelector('[data-bp-menu="gestao"]')) return;
    var frag = document.createDocumentFragment();
    function section(label, key) {
      var sec = document.createElement("div");
      sec.className = "bp-menu-section";
      sec.setAttribute("data-bp-menu", key);
      sec.textContent = label;
      frag.appendChild(sec);
    }
    function item(menu, key, label) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("data-bp-menu", menu);
      btn.setAttribute("data-bp-action", key);
      btn.innerHTML = "<span>" + label + "</span>";
      frag.appendChild(btn);
    }
    section("Automação", "auto");
    item("auto", "reagg", "Reagendamento");
    section("Gestão", "gestao");
    item("gestao", "dash", "Dashboard executivo");
    item("gestao", "export", "Exportar relatórios");
    item("gestao", "backup", "Backups");
    item("gestao", "audit", "Auditoria");
    item("gestao", "filiais", "Filiais");

    var logout = dd.querySelector("#logout-btn");
    if (logout) dd.insertBefore(frag, logout);
    else dd.appendChild(frag);

    if (!dd.dataset.bpGestBound) {
      dd.dataset.bpGestBound = "1";
      dd.addEventListener("click", function (e) {
        var t = e.target.closest("[data-bp-action]");
        if (!t) return;
        var menu = t.getAttribute("data-bp-menu");
        if (menu !== "gestao" && menu !== "auto") return;
        e.stopPropagation();
        dd.style.display = "none";
        var a = t.getAttribute("data-bp-action");
        try {
          if (a === "reagg") openReagendar();
          if (a === "dash") openDashboard();
          if (a === "export") openExport();
          if (a === "backup") openBackup();
          if (a === "audit") openAudit();
          if (a === "filiais") openFiliais();
        } catch (err) {
          console.error("[BPGestao]", err);
          if (typeof toast === "function") toast("Não foi possível abrir esta secção", "error");
        }
      });
    }
  }

  function init() {
    // ET4-P1-02: listeners só uma vez; re-ensure de menus permitido após login
    if (window.__bpGestaoInitDone) {
      try {
        if (typeof ensureMenuItems === "function") ensureMenuItems();
        if (typeof loadFiliais === "function") loadFiliais();
      } catch (eRe) {}
      return;
    }
    window.__bpGestaoInitDone = true;

    try { ensureMenuItems(); loadFiliais(); } catch (e) {
      console.warn("[gestao-fase78]", e);
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { setTimeout(init, 180); });
  } else setTimeout(init, 180);
  setTimeout(init, 2000);
  setTimeout(init, 5000);

  window.BPGestao = {
    dashboardExecutivo: dashboardExecutivo,
    sugerirReagendamento: sugerirReagendamento,
    aplicarReagendamento: aplicarReagendamento,
    exportRelatorio: exportRelatorio,
    downloadBackup: downloadBackup,
    logAudit: logAudit,
    loadAudit: loadAudit,
    getFilialAtiva: getFilialAtiva,
    setFilialAtiva: setFilialAtiva,
    loadFiliais: loadFiliais,
    openDashboard: openDashboard,
    openReagendar: openReagendar,
    openExport: openExport,
    openBackup: openBackup,
    openAudit: openAudit,
    openFiliais: openFiliais
  };
})();

/* ===== FILE: marketing-fase2.js ===== */
// ================================================================
// Grupo 2 — Fidelização e Marketing (offline-first)
// F2 Pontos/níveis | F5 Lembretes WhatsApp | F15 Indicação | F17 Push local
// ================================================================
(function () {
  'use strict';

  var NIVEIS = [
    { id: 'bronze', min: 0, label: 'Bronze' },
    { id: 'prata', min: 500, label: 'Prata' },
    { id: 'ouro', min: 2000, label: 'Ouro' },
    { id: 'platina', min: 5000, label: 'Platina' }
  ];

  // 1 ponto por cada 1000 Kz (configurável)
  var PONTOS_POR_KZ = 1000;
  var BONUS_INDICACAO = 50;

  function pontosDeValor(valor) {
    return Math.floor((Number(valor) || 0) / PONTOS_POR_KZ);
  }

  function nivelDePontos(pts) {
    var n = NIVEIS[0];
    for (var i = 0; i < NIVEIS.length; i++) {
      if (pts >= NIVEIS[i].min) n = NIVEIS[i];
    }
    return n;
  }

  function findClienteByNome(nome) {
    if (!nome || typeof state === 'undefined') return null;
    var n = String(nome).trim().toLowerCase();
    return (state.clientes || []).find(function (c) {
      return String(c.nome || '').trim().toLowerCase() === n;
    }) || null;
  }

  function getClientePontos(clienteIdOuNome) {
    var c = null;
    if (typeof state === 'undefined') return 0;
    if (clienteIdOuNome && String(clienteIdOuNome).length > 20) {
      c = (state.clientes || []).find(function (x) { return x.id === clienteIdOuNome; });
    } else {
      c = findClienteByNome(clienteIdOuNome);
    }
    return c ? (Number(c.pontos) || 0) : 0;
  }

  async function adicionarPontosCliente(clienteNome, pts, motivo) {
    if (!pts || pts === 0) return null;
    var c = findClienteByNome(clienteNome);
    if (!c) return null;
    var novo = (Number(c.pontos) || 0) + pts;
    var nivel = nivelDePontos(novo);
    var data = {
      pontos: novo,
      nivel_fidelidade: nivel.id,
      updated_at: new Date().toISOString()
    };
    try {
      if (typeof updateInList === 'function') {
        updateInList('clientes', c.id, data);
      } else if (c) {
        Object.assign(c, data);
      }
      if (typeof dbPut === 'function') {
        var full = Object.assign({}, c, data);
        await dbPut('clientes', full);
      }
      if (typeof logContexto === 'function') {
        logContexto('fidelidade.pontos', { cliente: c.id, pts: pts, motivo: motivo, total: novo });
      }
      return full || c;
    } catch (e) {
      console.warn('[fidelidade]', e);
      return null;
    }
  }

  /** Chamado após venda registada — F2 + F15 */
  async function onVendaFidelidade(mov) {
    try {
      if (!mov || mov.tipo !== 'venda') return;
      var pts = pontosDeValor(mov.valor);
      if (pts > 0 && mov.cliente) {
        await adicionarPontosCliente(mov.cliente, pts, 'venda');
      }
      // F15: se cliente foi indicado, bónus ao indicador (uma vez por venda do indicado)
      var c = findClienteByNome(mov.cliente);
      if (c && c.indicado_por) {
        var indicador = (state.clientes || []).find(function (x) {
          return x.id === c.indicado_por || x.codigo_indicacao === c.indicado_por;
        });
        if (indicador) {
          await adicionarPontosCliente(indicador.nome, BONUS_INDICACAO, 'indicacao');
        }
      }
    } catch (e) {
      console.warn('[onVendaFidelidade]', e);
    }
  }

  function gerarCodigoIndicacao(nome) {
    var base = String(nome || 'CLI').replace(/\s+/g, '').slice(0, 4).toUpperCase();
    var rnd = Math.floor(100 + Math.random() * 900);
    return base + rnd;
  }

  // ---------- F5: Lembrete WhatsApp (agnóstico — usa wa.me) ----------
  function linkWhatsAppLembrete(agendamento) {
    if (!agendamento) return null;
    var tel = String(agendamento.telefone || agendamento.clienteTelefone || '').replace(/\D/g, '');
    if (tel && tel.length === 9) tel = '244' + tel;
    if (!tel) return null;
    var store = (state && state.config && state.config.storeName) || 'BeautyPro';
    var msg = 'Olá' + (agendamento.cliente ? ' ' + agendamento.cliente : '') +
      '! Lembrete: tem marcação em ' + store +
      ' no dia ' + (agendamento.data || '') +
      (agendamento.hora ? ' às ' + agendamento.hora : '') +
      (agendamento.servico ? ' (' + agendamento.servico + ')' : '') +
      '. Até breve!';
    return 'https://wa.me/' + tel + '?text=' + encodeURIComponent(msg);
  }

  function enviarLembreteAgenda(agId) {
    var ag = (state.agendamentos || []).find(function (a) { return a.id === agId; });
    if (!ag) {
      // tentar pelo objecto directo
      ag = agId && agId.data ? agId : null;
    }
    if (!ag) {
      if (typeof toast === 'function') toast('Agendamento não encontrado', 'error');
      return;
    }
    // enriquecer telefone pelo cliente
    if (!ag.telefone && ag.cliente) {
      var c = findClienteByNome(ag.cliente);
      if (c) ag.telefone = c.telefone || c.contacto || '';
    }
    var url = linkWhatsAppLembrete(ag);
    if (!url) {
      if (typeof toast === 'function') toast('Cliente sem telefone válido', 'error');
      return;
    }
    window.open(url, '_blank');
    if (typeof toast === 'function') toast('A abrir WhatsApp…', 'success');
  }

  // ---------- F17: Notificações locais (sem FCM nesta etapa) ----------
  function pedirPermissaoPush() {
    if (!('Notification' in window)) {
      if (typeof toast === 'function') toast('Notificações não suportadas neste dispositivo', 'warning');
      return Promise.resolve(false);
    }
    return Notification.requestPermission().then(function (p) {
      if (p === 'granted' && typeof toast === 'function') toast('Notificações activadas', 'success');
      return p === 'granted';
    });
  }

  function notificarLocal(titulo, corpo) {
    try {
      if (!('Notification' in window) || Notification.permission !== 'granted') return false;
      new Notification(titulo || 'BeautyPro', {
        body: corpo || '',
        icon: 'icon-192.png',
        badge: 'icon-192.png'
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  function lembrarAgendamentosAmanha() {
    if (typeof hoje !== 'function') return;
    var d = new Date(hoje() + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    var amanha = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    var lista = (state.agendamentos || []).filter(function (a) {
      return a.data === amanha && a.estado !== 'cancelado';
    });
    if (lista.length) {
      notificarLocal(
        'Agenda de amanhã',
        lista.length + ' marcação(ões) amanhã. Abra a app para rever.'
      );
    }
  }

  // ---------- UI menu ----------
  function ensureMenuItems() {
    var dd = document.getElementById('menu-dropdown');
    if (!dd || dd.querySelector('[data-bp-menu="mkt"]')) return;
    var frag = document.createDocumentFragment();
    var sec = document.createElement('div');
    sec.className = 'bp-menu-section';
    sec.setAttribute('data-bp-menu', 'mkt');
    sec.textContent = 'Marketing';
    frag.appendChild(sec);
    var items = [
      { key: 'fidelidade', label: 'Fidelidade' },
      { key: 'indicacao', label: 'Indicações' },
      { key: 'lembretes', label: 'Lembretes WhatsApp' },
      { key: 'push', label: 'Notificações' }
    ];
    items.forEach(function (it) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('data-bp-menu', 'mkt');
      btn.setAttribute('data-bp-action', it.key);
      btn.innerHTML = '<span>' + it.label + '</span>';
      frag.appendChild(btn);
    });
    var logout = dd.querySelector('#logout-btn');
    if (logout) dd.insertBefore(frag, logout);
    else dd.appendChild(frag);
    dd.addEventListener('click', function (e) {
      var t = e.target.closest('[data-bp-menu="mkt"]');
      if (!t) return;
      e.stopPropagation();
      dd.style.display = 'none';
      var a = t.getAttribute('data-bp-action');
      if (a === 'fidelidade') openModalFidelidade();
      if (a === 'indicacao') openModalIndicacao();
      if (a === 'lembretes') openModalLembretes();
      if (a === 'push') {
        pedirPermissaoPush().then(function () { lembrarAgendamentosAmanha(); });
      }
    });
  }

  function ensureModal(id, title, eyebrow, subtitle) {
    if (typeof ensureBpSheetModal === 'function') {
      return ensureBpSheetModal(id, title, eyebrow, subtitle);
    }
    var el = document.getElementById(id);
    if (el) return el;
    return null;
  }

  function openModalFidelidade() {
    ensureModal('modal-bp-fid', 'Fidelidade', 'Clientes', 'Pontos acumulados e níveis de recompensa.');
    var body = document.getElementById('modal-bp-fid-body');
    var clientes = (state.clientes || []).slice().sort(function (a, b) {
      return (Number(b.pontos) || 0) - (Number(a.pontos) || 0);
    }).slice(0, 30);
    var html = '<p style="font-size:.8rem;color:var(--text-secondary);margin-bottom:16px;line-height:1.5;">1 ponto por cada ' + PONTOS_POR_KZ + ' Kz. Níveis: Bronze → Prata (500) → Ouro (2.000) → Platina (5.000).</p>';
    if (!clientes.length) {
      html += '<div class="bp-empty"><strong>Sem clientes</strong>Os pontos aparecem após as primeiras vendas.</div>';
    } else {
      html += clientes.map(function (c) {
        var pts = Number(c.pontos) || 0;
        var niv = nivelDePontos(pts);
        var nome = typeof escHtml === 'function' ? escHtml(c.nome) : c.nome;
        return '<div class="bp-row"><div class="bp-row-main"><div class="bp-row-title">' + nome + '</div>' +
          '<div class="bp-row-meta"><span class="bp-badge">' + niv.label + '</span></div></div>' +
          '<div class="bp-row-value is-gold">' + pts + ' pts</div></div>';
      }).join('');
    }
    body.innerHTML = html;
    if (typeof openModal === 'function') openModal('modal-bp-fid');
    else document.getElementById('modal-bp-fid').classList.add('open');
  }

  function openModalIndicacao() {
    ensureModal('modal-bp-ind', 'Indicações', 'Crescimento', 'Códigos para amigo indica amigo.');
    var body = document.getElementById('modal-bp-ind-body');
    var rows = (state.clientes || []).map(function (c) {
      var cod = c.codigo_indicacao || '';
      var nome = typeof escHtml === 'function' ? escHtml(c.nome) : c.nome;
      return '<div class="bp-row"><div class="bp-row-main"><div class="bp-row-title">' + nome + '</div>' +
        '<div class="bp-row-meta">' + (cod ? '<span class="bp-code">' + cod + '</span>' : 'Sem código') + '</div></div>' +
        '<button type="button" class="bp-action-btn' + (cod ? '' : ' is-primary') + '" data-gen-cod="' + c.id + '">' + (cod ? 'Gerado' : 'Gerar') + '</button></div>';
    }).join('') || '<div class="bp-empty"><strong>Sem clientes</strong>Adicione clientes para gerar códigos.</div>';
    body.innerHTML = '<div class="bp-alert-banner"><strong>Programa de indicações</strong>Cada código dá ' + BONUS_INDICACAO + ' pts ao indicador quando o indicado compra.</div>' + rows;
    body.querySelectorAll('[data-gen-cod]').forEach(function (btn) {
      btn.onclick = async function () {
        var id = btn.getAttribute('data-gen-cod');
        var c = (state.clientes || []).find(function (x) { return x.id === id; });
        if (!c) return;
        if (c.codigo_indicacao) return;
        var cod = gerarCodigoIndicacao(c.nome);
        var data = { codigo_indicacao: cod, updated_at: new Date().toISOString() };
        if (typeof updateInList === 'function') updateInList('clientes', id, data);
        else Object.assign(c, data);
        if (typeof dbPut === 'function') await dbPut('clientes', Object.assign({}, c, data));
        if (typeof toast === 'function') toast('Código ' + cod + ' gerado', 'success');
        openModalIndicacao();
      };
    });
    if (typeof openModal === 'function') openModal('modal-bp-ind');
    else document.getElementById('modal-bp-ind').classList.add('open');
  }

  function openModalLembretes() {
    ensureModal('modal-bp-lemb', 'Lembretes', 'WhatsApp', 'Mensagens prontas para marcações futuras.');
    var body = document.getElementById('modal-bp-lemb-body');
    var hojeStr = typeof hoje === 'function' ? hoje() : '';
    var lista = (state.agendamentos || []).filter(function (a) {
      return a.data >= hojeStr && a.estado !== 'cancelado';
    }).slice(0, 20);
    var html = '<div class="bp-alert-banner"><strong>Lembretes WhatsApp</strong>Abre conversa com texto pronto. O cliente precisa de telefone na ficha.</div>';
    if (!lista.length) {
      html += '<div class="bp-empty"><strong>Sem marcações futuras</strong>Os lembretes aparecem quando houver agenda.</div>';
    } else {
      html += lista.map(function (a) {
        var nome = typeof escHtml === 'function' ? escHtml(a.cliente || '') : (a.cliente || '');
        return '<div class="bp-row"><div class="bp-row-main"><div class="bp-row-title">' + nome + '</div>' +
          '<div class="bp-row-meta">' + (a.data || '') + (a.hora ? ' · ' + a.hora : '') + (a.servico ? ' · ' + a.servico : '') + '</div></div>' +
          '<button type="button" class="bp-action-btn is-primary" data-wa="' + a.id + '">WhatsApp</button></div>';
      }).join('');
    }
    body.innerHTML = html;
    body.querySelectorAll('[data-wa]').forEach(function (btn) {
      btn.onclick = function () { enviarLembreteAgenda(btn.getAttribute('data-wa')); };
    });
    if (typeof openModal === 'function') openModal('modal-bp-lemb');
    else document.getElementById('modal-bp-lemb').classList.add('open');
  }

  // Enhance render clientes list with pontos badge — safe observer
  function enhanceClientesListOnce() {
    // non-invasive: only when fidelidade modal not needed
  }

  function init() {
    // ET4-P1-02: listeners só uma vez; re-ensure de menus permitido após login
    if (window.__bpMarketingInitDone) {
      try {
        if (typeof ensureMenuItems === "function") ensureMenuItems();
      } catch (eRe) {}
      return;
    }
    window.__bpMarketingInitDone = true;

    try {
      ensureMenuItems();
    } catch (e) {
      console.warn('[marketing-fase2]', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 120); });
  } else {
    setTimeout(init, 120);
  }
  setTimeout(init, 1600);
  setTimeout(init, 4200);

  window.BPMarketing = {
    pontosDeValor: pontosDeValor,
    nivelDePontos: nivelDePontos,
    onVendaFidelidade: onVendaFidelidade,
    adicionarPontosCliente: adicionarPontosCliente,
    enviarLembreteAgenda: enviarLembreteAgenda,
    pedirPermissaoPush: pedirPermissaoPush,
    notificarLocal: notificarLocal,
    getClientePontos: getClientePontos,
    openModalFidelidade: openModalFidelidade,
    openModalIndicacao: openModalIndicacao,
    openModalLembretes: openModalLembretes
  };
})();

/* ===== FILE: menu-accordion.js ===== */
// ================================================================
// Menu ☰ — acordeão: 8 grupos visíveis; subsecções só ao expandir
// + scroll do dropdown (max-height / overflow-y)
// ================================================================
(function () {
  "use strict";

  var GROUPS = [
    {
      key: "finance",
      label: "Financeiro",
      items: [
        { action: "fluxo", label: "Fluxo de caixa" },
        { action: "rentab", label: "Rentabilidade" },
        { action: "meta", label: "Meta do salão" },
        { action: "despesas", label: "Despesas" }
      ]
    },
    {
      key: "mkt",
      label: "Marketing",
      items: [
        { action: "fidelidade", label: "Fidelidade" },
        { action: "indicacao", label: "Indicações" },
        { action: "lembretes", label: "Lembretes WhatsApp" },
        { action: "push", label: "Notificações" }
      ]
    },
    {
      key: "equipa",
      label: "Equipa",
      items: [
        { action: "ranking", label: "Ranking" },
        { action: "horarios", label: "Horários e folgas" },
        { action: "chat", label: "Chat interno" }
      ]
    },
    {
      key: "ops",
      label: "Operações",
      items: [
        { action: "stock", label: "Stock de produtos" },
        { action: "forn", label: "Fornecedores e compras" }
      ]
    },
    {
      key: "crm",
      label: "CRM",
      items: [
        { action: "nps", label: "Avaliação NPS" },
        { action: "timeline", label: "Histórico do cliente" },
        { action: "cal", label: "Calendário (.ics)" },
        { action: "galeria", label: "Galeria de serviços" }
      ]
    },
    {
      key: "com",
      label: "Comercial",
      items: [
        { action: "pacotes", label: "Pacotes e assinaturas" }
      ]
    },
    {
      key: "auto",
      label: "Automação",
      items: [
        { action: "reagg", label: "Reagendamento" }
      ]
    },
    {
      key: "gestao",
      label: "Gestão",
      items: [
        { action: "dash", label: "Dashboard executivo" },
        { action: "export", label: "Exportar relatórios" },
        { action: "backup", label: "Backups" },
        { action: "audit", label: "Auditoria" },
        { action: "filiais", label: "Filiais" }
      ]
    }
  ];

  function chevronSvg() {
    return '<svg class="bp-acc-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>';
  }

  function stripLegacy(dd) {
    // remove flat injections from feature modules (keep logout + our accordion)
    Array.prototype.slice.call(dd.querySelectorAll("[data-bp-menu], .bp-menu-section")).forEach(function (el) {
      if (el.closest && el.closest(".bp-acc-group")) return;
      if (el.classList && el.classList.contains("bp-acc-toggle")) return;
      if (el.classList && el.classList.contains("bp-acc-panel")) return;
      el.parentNode && el.parentNode.removeChild(el);
    });
  }

  function buildAccordion(dd) {
    if (dd.querySelector(".bp-acc-root")) return;

    stripLegacy(dd);

    var root = document.createElement("div");
    root.className = "bp-acc-root";

    GROUPS.forEach(function (g) {
      var group = document.createElement("div");
      group.className = "bp-acc-group";
      group.setAttribute("role", "group");
      group.setAttribute("aria-label", g.label);

      var toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "bp-acc-toggle";
      toggle.setAttribute("data-bp-menu", g.key); // impede re-injecção dos módulos
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("data-acc-key", g.key);
      toggle.innerHTML = "<span>" + g.label + "</span>" + chevronSvg();

      var panel = document.createElement("div");
      panel.className = "bp-acc-panel";
      panel.setAttribute("data-acc-panel", g.key);
      panel.hidden = true;

      g.items.forEach(function (it) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.setAttribute("data-bp-menu", g.key);
        btn.setAttribute("data-bp-action", it.action);
        btn.innerHTML = "<span>" + it.label + "</span>";
        panel.appendChild(btn);
      });

      group.appendChild(toggle);
      group.appendChild(panel);
      root.appendChild(group);
    });

    var logout = dd.querySelector("#logout-btn");
    if (logout) dd.insertBefore(root, logout);
    else dd.appendChild(root);

    // Acções dos itens (galeria, nps, etc.) — o acordeão só abria painéis
    root.addEventListener("click", function (e) {
      var actBtn = e.target.closest("[data-bp-action]");
      if (actBtn && root.contains(actBtn) && !actBtn.classList.contains("bp-acc-toggle")) {
        e.preventDefault();
        e.stopPropagation();
        var a = actBtn.getAttribute("data-bp-action");
        var menu = actBtn.getAttribute("data-bp-menu") || "";
        try {
          var dd = document.getElementById("menu-dropdown");
          if (dd) dd.style.display = "none";
          function call() {
            var args = Array.prototype.slice.call(arguments);
            var fn = args.shift();
            if (typeof fn === "function") { fn.apply(null, args); return true; }
            return false;
          }
          var ok = false;
          if (a === "galeria") {
            ok = call(window.openGaleria) || call(window.BPMedia && BPMedia.openGaleria);
            if (!ok) {
              console.warn("[menu] openGaleria ausente — BPMedia?", !!window.BPMedia);
            }
          } else if (a === "stock") ok = call(window.BPOps && BPOps.openStock);
          else if (a === "forn") ok = call(window.BPOps && BPOps.openFornecedores);
          else if (a === "nps") ok = call(window.BPOps && BPOps.openNps);
          else if (a === "timeline") ok = call(window.BPOps && BPOps.openTimeline);
          else if (a === "cal") ok = call(window.BPOps && BPOps.openCalendario);
          else if (a === "pacotes") ok = call(window.BPOps && BPOps.openPacotes);
          else if (a === "ranking") ok = call(window.BPEquipa && BPEquipa.openRanking);
          else if (a === "horarios") ok = call(window.BPEquipa && BPEquipa.openHorarios);
          else if (a === "chat") ok = call(window.BPEquipa && BPEquipa.openChat);
          else if (a === "fluxo") ok = call(window.BPFinance && (BPFinance.openModalFluxo || BPFinance.openFluxo));
          else if (a === "rentab") ok = call(window.BPFinance && (BPFinance.openModalRentabilidade || BPFinance.openRentabilidade));
          else if (a === "meta") ok = call(window.BPFinance && (BPFinance.openModalMetaSalao || BPFinance.openMeta));
          else if (a === "despesas") ok = call(window.BPFinance && (BPFinance.openModalDespesaEnh || BPFinance.openDespesas));
          else if (a === "fidelidade") ok = call(window.BPMarketing && (BPMarketing.openModalFidelidade || BPMarketing.openFidelidade));
          else if (a === "indicacao") ok = call(window.BPMarketing && (BPMarketing.openModalIndicacao || BPMarketing.openIndicacao));
          else if (a === "lembretes") ok = call(window.BPMarketing && (BPMarketing.openModalLembretes || BPMarketing.openLembretes));
          else if (a === "push") ok = call(window.BPMarketing && (BPMarketing.pedirPermissaoPush || BPMarketing.openPush));
          else if (a === "dash") ok = call(window.BPGestao && (BPGestao.openDashboard || BPGestao.dashboardExecutivo));
          else if (a === "export") ok = call(window.BPGestao && (BPGestao.openExport || BPGestao.exportRelatorio));
          else if (a === "backup") ok = call(window.BPGestao && (BPGestao.openBackup || BPGestao.downloadBackup));
          else if (a === "audit") ok = call(window.BPGestao && (BPGestao.openAudit || BPGestao.loadAudit));
          else if (a === "filiais") ok = call(window.BPGestao && (BPGestao.openFiliais || BPGestao.loadFiliais));
          else if (a === "reagg") ok = call(window.BPGestao && BPGestao.openReagendar);
          if (!ok && typeof toast === "function") toast("Função indisponível neste momento", "warning");
        } catch (err) {
          console.error("[menu-accordion] action", a, err);
          if (typeof toast === "function") toast("Não foi possível abrir", "error");
        }
        return;
      }
    });

    // toggle acordeão — um aberto de cada vez
    root.addEventListener("click", function (e) {
      var tog = e.target.closest(".bp-acc-toggle");
      if (!tog || !root.contains(tog)) return;
      e.preventDefault();
      e.stopPropagation();
      var key = tog.getAttribute("data-acc-key");
      var open = tog.getAttribute("aria-expanded") === "true";
      root.querySelectorAll(".bp-acc-toggle").forEach(function (t) {
        t.setAttribute("aria-expanded", "false");
      });
      root.querySelectorAll(".bp-acc-panel").forEach(function (p) {
        p.classList.remove("open");
        p.hidden = true;
      });
      if (!open) {
        tog.setAttribute("aria-expanded", "true");
        var panel = root.querySelector('[data-acc-panel="' + key + '"]');
        if (panel) {
          panel.hidden = false;
          panel.classList.add("open");
        }
        // garantir que o item expandido fica visível no scroll
        try {
          tog.scrollIntoView({ block: "nearest", behavior: "smooth" });
        } catch (err) {}
      }
    });
  }

  function ensureScrollable(dd) {
    dd.style.maxHeight = "min(70vh, 420px)";
    dd.style.overflowX = "hidden";
    dd.style.overflowY = "auto";
    dd.style.webkitOverflowScrolling = "touch";
  }

  function mount() {
    var dd = document.getElementById("menu-dropdown");
    if (!dd) return;
    ensureScrollable(dd);
    // limpar legados que módulos possam ter injectado
    if (!dd.querySelector(".bp-acc-root")) {
      stripLegacy(dd);
      buildAccordion(dd);
    } else {
      // se módulos injectaram irmãos fora do acordeão, remover
      Array.prototype.slice.call(dd.children).forEach(function (ch) {
        if (ch.id === "logout-btn") return;
        if (ch.classList && ch.classList.contains("bp-acc-root")) return;
        if (ch.hasAttribute && ch.hasAttribute("data-bp-menu")) ch.remove();
        if (ch.classList && ch.classList.contains("bp-menu-section")) ch.remove();
      });
    }
  }

  function init() {
    try {
      mount();
      try {
        document.dispatchEvent(new CustomEvent("bp-menu-accordion-ready"));
      } catch (_) {}
    } catch (e) { console.warn("[menu-accordion]", e); }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      setTimeout(init, 200);
    });
  } else setTimeout(init, 200);
  // depois dos módulos de features (que injectam a ~100–5000ms)
  setTimeout(init, 600);
  setTimeout(init, 1800);
  setTimeout(init, 4500);
})();

/* ===== FILE: avatars-realistas.js ===== */
// ================================================================
// Avatars realistas por género (SVG embutido) · sem rede
// ================================================================
(function () {
  "use strict";

  var FEMININOS = "maria,ana,isa,isabel,isabela,beatriz,bia,sofia,sophie,marta,carla,catarina,catia,lucia,luisa,patricia,paula,sandra,sonia,teresa,vanessa,vera,vitoria,yara,iara,rosa,rita,raquel,helena,elsa,elisa,elena,diana,daniela,debora,cristina,clara,celia,bruna,barbara,alice,adriana,fatima,fernanda,filipa,flavia,gabriela,graciela,ines,irene,joana,julia,juliana,lara,laura,leonor,lidia,liliana,lorena,luciana,madalena,manuela,margarida,marina,marisa,matilde,monica,nadia,natalia,nicole,olga,olivia,priscila,rebeca,renata,sara,silvia,simone,susana,tatiana,telma,valeria,viviane,yasmin,zara,nuria,nelma,neusa,noemia,otilia,pilar,ramona,salome,tania,ursula,virginia,wanda,zuleica,michele,andreia,angelica,benilde,celeste,conceicao,dulce,eduarda,eugenia,francisca,gloria,ivone,jacinta,leila,lurdes,lourdes,nair,nilza,odete,palmira,quelia,rosario,soraia,solange,vanda,amelia,augusta,belmira,carmo,dolores,esperanca,estrela,guilhermina,isaltina,josefa,lina,lurdes,mercedes,natercia,ofelia,perpetua,querubina,severina,teodora,urbana,violante,zelia".split(",");
  var MASCULINOS = "joao,jose,antonio,pedro,paulo,carlos,manuel,miguel,rui,ricardo,rodrigo,rafael,nuno,nelson,marco,marcos,luis,lucas,leonardo,leandro,jorge,hugo,henrique,gustavo,goncalo,francisco,fernando,felipe,filipe,fabio,eduardo,diogo,daniel,david,cristiano,bruno,bernardo,andre,alexandre,alberto,serafim,teodoro,zeferino,sebastiao,samuel,santiago,salvador,ruben,renato,raul,oscar,octavio,natan,nathan,moises,mateus,martin,martim,mario,lorenzo,leonel,kevin,julio,isaac,ivan,heitor,guilherme,gabriel,frederico,fabiano,elias,edson,eder,domingos,diego,dario,claudio,cesar,caio,brian,benjamin,arthur,artur,arnaldo,angelo,anderson,amilcar,amaro,alvaro,afonso,abel,ambrosio,anibal,baltazar,benedito,bonifacio,caetano,cipriano,constancio,cristovao,custodio,donizete,eleuterio,evaristo,faustino,florencio,gaspar,geraldo,helio,inocencio,jacinto,januario,joaquim,lindolfo,lourenco,luciano,marcelo,maximiano,norberto,onesimo,osvaldo,otavio,plinio,quirino,romulo,saturnino,silvestre,timoteo,ulisses,valdemar,vicente,wagner,xavier,zacarias,adilson,ademar,africo".split(",");

  function norm(nome) {
    return String(nome || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .split(/\s+/)[0] || "";
  }
  function hashName(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  }
  function detectarGenero(nome) {
    var n = norm(nome);
    if (!n) return "f";
    if (FEMININOS.indexOf(n) >= 0) return "f";
    if (MASCULINOS.indexOf(n) >= 0) return "m";
    if (n.endsWith("a") && ["guia","juda","luca","nicola"].indexOf(n) < 0) return "f";
    if (n.endsWith("o") || n.endsWith("son")) return "m";
    return hashName(n) % 2 === 0 ? "f" : "m";
  }

  var SKINS = ["#5C3310", "#6B3F24", "#8D5524", "#A analog".length && "#A67B5B", "#C68642"];
  SKINS = ["#5C3310", "#6B3F24", "#8D5524", "#A67B5B", "#C68642"];
  var HAIR_F = ["#1A120B", "#2C1A0E", "#3D2314", "#4A2912", "#0D0D0D"];
  var HAIR_M = ["#1A120B", "#2C1A0E", "#0D0D0D", "#3D2314"];

  function svgPortrait(genero, seed) {
    var skin = SKINS[seed % SKINS.length];
    var hair = (genero === "f" ? HAIR_F : HAIR_M)[seed % (genero === "f" ? HAIR_F.length : HAIR_M.length)];
    var bg = ["#F3F2EF", "#FBF6E9", "#ECE9E4", "#E8F0EC"][seed % 4];
    var lip = genero === "f" ? "#A65D5D" : "#8B5A4A";
    // slight feature offsets
    var eyeY = 46 + (seed % 3);
    var browY = eyeY - 6;

    var hairSvg;
    if (genero === "f") {
      // long / shoulder hair + volume
      var style = seed % 3;
      if (style === 0) {
        hairSvg =
          '<ellipse cx="50" cy="28" rx="34" ry="28" fill="' + hair + '"/>' +
          '<path d="M16 40 Q12 70 18 92 L28 92 Q22 60 24 42 Z" fill="' + hair + '"/>' +
          '<path d="M84 40 Q88 70 82 92 L72 92 Q78 60 76 42 Z" fill="' + hair + '"/>';
      } else if (style === 1) {
        hairSvg =
          '<path d="M18 48 Q20 18 50 14 Q80 18 82 48 Q80 36 50 34 Q20 36 18 48 Z" fill="' + hair + '"/>' +
          '<path d="M18 48 Q10 75 20 95 L32 90 Q24 65 28 48 Z" fill="' + hair + '"/>' +
          '<path d="M82 48 Q90 75 80 95 L68 90 Q76 65 72 48 Z" fill="' + hair + '"/>';
      } else {
        hairSvg =
          '<ellipse cx="50" cy="30" rx="32" ry="26" fill="' + hair + '"/>' +
          '<path d="M20 38 C14 55 16 80 22 96 L34 90 C28 70 30 50 32 40 Z" fill="' + hair + '"/>' +
          '<path d="M80 38 C86 55 84 80 78 96 L66 90 C72 70 70 50 68 40 Z" fill="' + hair + '"/>' +
          '<circle cx="50" cy="22" r="6" fill="' + hair + '"/>';
      }
    } else {
      var mstyle = seed % 3;
      if (mstyle === 0) {
        hairSvg = '<path d="M22 42 Q25 20 50 18 Q75 20 78 42 Q70 32 50 30 Q30 32 22 42 Z" fill="' + hair + '"/>';
      } else if (mstyle === 1) {
        hairSvg =
          '<path d="M20 44 Q22 18 50 16 Q78 18 80 44 Q72 28 50 28 Q28 28 20 44 Z" fill="' + hair + '"/>' +
          '<rect x="22" y="40" width="8" height="14" rx="3" fill="' + hair + '"/>' +
          '<rect x="70" y="40" width="8" height="14" rx="3" fill="' + hair + '"/>';
      } else {
        hairSvg = '<path d="M24 40 Q28 22 50 20 Q72 22 76 40 Q68 34 50 34 Q32 34 24 40 Z" fill="' + hair + '"/>';
      }
    }

    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">' +
      '<rect width="100" height="100" fill="' + bg + '"/>' +
      hairSvg +
      // neck
      '<rect x="40" y="72" width="20" height="18" rx="4" fill="' + skin + '"/>' +
      // shoulders
      '<ellipse cx="50" cy="98" rx="36" ry="16" fill="' + (seed % 2 === 0 ? "#2A241E" : "#3D342C") + '"/>' +
      // face
      '<ellipse cx="50" cy="52" rx="24" ry="28" fill="' + skin + '"/>' +
      // ears
      '<ellipse cx="26" cy="52" rx="4" ry="6" fill="' + skin + '"/>' +
      '<ellipse cx="74" cy="52" rx="4" ry="6" fill="' + skin + '"/>' +
      // brows
      '<path d="M34 ' + browY + ' Q42 ' + (browY - 3) + ' 48 ' + browY + '" stroke="' + hair + '" stroke-width="2" fill="none" stroke-linecap="round"/>' +
      '<path d="M52 ' + browY + ' Q58 ' + (browY - 3) + ' 66 ' + browY + '" stroke="' + hair + '" stroke-width="2" fill="none" stroke-linecap="round"/>' +
      // eyes
      '<ellipse cx="40" cy="' + eyeY + '" rx="4.2" ry="4.5" fill="#fff"/>' +
      '<ellipse cx="60" cy="' + eyeY + '" rx="4.2" ry="4.5" fill="#fff"/>' +
      '<circle cx="40.5" cy="' + (eyeY + 0.5) + '" r="2.4" fill="#2A1810"/>' +
      '<circle cx="60.5" cy="' + (eyeY + 0.5) + '" r="2.4" fill="#2A1810"/>' +
      '<circle cx="41.2" cy="' + (eyeY - 0.3) + '" r="0.7" fill="#fff"/>' +
      '<circle cx="61.2" cy="' + (eyeY - 0.3) + '" r="0.7" fill="#fff"/>' +
      // nose
      '<path d="M50 48 L48 58 Q50 60 52 58 Z" fill="' + skin + '" stroke="#00000018" stroke-width="0.5"/>' +
      // lips
      (genero === "f"
        ? '<path d="M42 66 Q50 72 58 66 Q50 70 42 66 Z" fill="' + lip + '"/>'
        : '<path d="M44 66 Q50 70 56 66" stroke="' + lip + '" stroke-width="1.8" fill="none" stroke-linecap="round"/>') +
      // soft cheek shade
      '<ellipse cx="34" cy="58" rx="5" ry="3" fill="#00000010"/>' +
      '<ellipse cx="66" cy="58" rx="5" ry="3" fill="#00000010"/>' +
      "</svg>";

    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  function avatarDataUrl(nome, generoForcado) {
    var g = generoForcado || detectarGenero(nome);
    var seed = hashName(norm(nome) || "x");
    return svgPortrait(g, seed);
  }

  function avatarImgHtml(nome, foto, extraClass) {
    var src = foto || avatarDataUrl(nome);
    return (
      '<div class="avatar bp-avatar-img ' + (extraClass || "") + '">' +
      '<img src="' + src + '" alt="" loading="lazy" decoding="async">' +
      "</div>"
    );
  }

  window.BPAvatars = {
    detectarGenero: detectarGenero,
    avatarDataUrl: avatarDataUrl,
    avatarImgHtml: avatarImgHtml
  };
})();

/* ===== FILE: media-galeria.js ===== */
// ================================================================
// BeautyPro — Fotos de perfil + Galeria de serviços
// Compressão no dispositivo · gravação imediata · offline-first
// ================================================================
(function () {
  "use strict";

  /** Sessão de UI (efémera) — não poluir window._bp* nem BeautyStore. */
  var session = {
    editingClienteId: null,
    editingProfId: null,
    pendingClienteFoto: null,
    pendingProfFoto: null,
    pendingClienteScope: null,
    pendingProfScope: null
  };
  var _uploadToken = Object.create(null);
  var UPLOAD_MS = 12000;

  var GALERIA_KEY_BASE = "bp_galeria_v1";
  var MAX_GALERIA = 60;
  function galeriaStorageKey() {
    try {
      var sid = (state && state.config && state.config.salaoId) ? String(state.config.salaoId) : "";
      return sid ? (GALERIA_KEY_BASE + "_" + sid) : GALERIA_KEY_BASE;
    } catch (_) {
      return GALERIA_KEY_BASE;
    }
  }
  var AVATAR_MAX = 160;      // lista/modal: thumb leve
  var GALERIA_MAX = 720;     // upload original galeria
  var GALERIA_THUMB = 240;   // thumb local/galeria
  var JPEG_Q = 0.62;         // perfil
  var JPEG_Q_GAL = 0.72;

  function esc(s) {
    return typeof escHtml === "function" ? escHtml(String(s == null ? "" : s)) : String(s == null ? "" : s);
  }
  function uid() {
    return typeof uuid === "function" ? uuid() : "img" + Date.now() + Math.random().toString(16).slice(2, 8);
  }
  function hojeStr() {
    return typeof hoje === "function" ? hoje() : new Date().toISOString().slice(0, 10);
  }
  function toastMsg(m, t) {
    if (typeof toast === "function") toast(m, t || "success");
  }

  /* ---------- compressão rápida ---------- */
  /* ---------- compressão robusta (CSP-safe: data: + createImageBitmap; blob: opcional) ---------- */
  function encodeCanvas(imgLike, w, h, maxSide, quality) {
    var scale = 1;
    if (w > maxSide || h > maxSide) scale = maxSide / Math.max(w, h);
    var nw = Math.max(1, Math.round(w * scale));
    var nh = Math.max(1, Math.round(h * scale));
    var canvas = document.createElement("canvas");
    canvas.width = nw;
    canvas.height = nh;
    var ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(imgLike, 0, 0, nw, nh);
    var dataUrl = canvas.toDataURL("image/jpeg", quality || JPEG_Q);
    if (dataUrl.length > 240000) {
      dataUrl = canvas.toDataURL("image/jpeg", 0.55);
    }
    return dataUrl;
  }

  function compressFile(file, maxSide, quality) {
    return new Promise(function (resolve, reject) {
      if (!file) {
        reject(new Error("Ficheiro inválido"));
        return;
      }
      // Aceitar image/*; type vazio (alguns Android) tenta na mesma
      var t = String(file.type || "");
      if (t && t.indexOf("image/") !== 0) {
        reject(new Error("Ficheiro inválido"));
        return;
      }

      function fail(msg) {
        reject(new Error(msg || "Não foi possível ler a imagem"));
      }

      // 1) createImageBitmap — não depende de blob: no <img>
      if (typeof createImageBitmap === "function") {
        createImageBitmap(file)
          .then(function (bmp) {
            try {
              var dataUrl = encodeCanvas(bmp, bmp.width, bmp.height, maxSide, quality);
              if (bmp.close) try { bmp.close(); } catch (_) {}
              resolve(dataUrl);
            } catch (e) {
              if (bmp.close) try { bmp.close(); } catch (_) {}
              // fallback abaixo
              compressViaFileReader(file, maxSide, quality).then(resolve, reject);
            }
          })
          .catch(function () {
            compressViaFileReader(file, maxSide, quality).then(resolve, reject);
          });
        return;
      }

      compressViaFileReader(file, maxSide, quality).then(resolve, reject);
    });
  }

  function compressViaFileReader(file, maxSide, quality) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onerror = function () {
        // último recurso: blob URL (requer CSP img-src blob:)
        compressViaBlobUrl(file, maxSide, quality).then(resolve, reject);
      };
      reader.onload = function () {
        var img = new Image();
        img.onload = function () {
          try {
            resolve(encodeCanvas(img, img.naturalWidth || img.width, img.naturalHeight || img.height, maxSide, quality));
          } catch (e) {
            reject(e);
          }
        };
        img.onerror = function () {
          compressViaBlobUrl(file, maxSide, quality).then(resolve, reject);
        };
        img.src = reader.result; // data: — permitido pelo CSP
      };
      try {
        reader.readAsDataURL(file);
      } catch (e) {
        compressViaBlobUrl(file, maxSide, quality).then(resolve, reject);
      }
    });
  }

  function compressViaBlobUrl(file, maxSide, quality) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        try {
          var dataUrl = encodeCanvas(img, img.naturalWidth || img.width, img.naturalHeight || img.height, maxSide, quality);
          URL.revokeObjectURL(url);
          resolve(dataUrl);
        } catch (e) {
          URL.revokeObjectURL(url);
          reject(e);
        }
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error("Não foi possível ler a imagem"));
      };
      img.src = url;
    });
  }

  function dataUrlToBlob(dataUrl) {
    try {
      var parts = String(dataUrl).split(",");
      var mime = (parts[0].match(/:(.*?);/) || [])[1] || "image/jpeg";
      var bin = atob(parts[1] || "");
      var arr = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      return new Blob([arr], { type: mime });
    } catch (e) {
      return null;
    }
  }

  function withTimeout(promise, ms) {
    return new Promise(function (resolve) {
      var done = false;
      var timer = setTimeout(function () {
        if (done) return;
        done = true;
        resolve({ url: null, error: "timeout" });
      }, ms || UPLOAD_MS);
      Promise.resolve(promise).then(
        function (v) {
          if (done) return;
          done = true;
          clearTimeout(timer);
          resolve(v);
        },
        function (err) {
          if (done) return;
          done = true;
          clearTimeout(timer);
          resolve({ url: null, error: (err && err.message) ? String(err.message) : "network" });
        }
      );
    });
  }

  function classifyStorageError(err) {
    var s = String(err && err.message ? err.message : err || "").toLowerCase();
    if (!s || s === "timeout") return "timeout";
    if (s.indexOf("offline") >= 0) return "offline";
    if (s.indexOf("403") >= 0 || s.indexOf("unauthorized") >= 0 || s.indexOf("row-level security") >= 0 || s.indexOf("policy") >= 0 || s.indexOf("jwt") >= 0)
      return "forbidden";
    if (s.indexOf("401") >= 0 || s.indexOf("session") >= 0) return "auth";
    if (s.indexOf("bucket") >= 0 || s.indexOf("not found") >= 0) return "bucket";
    if (s.indexOf("network") >= 0 || s.indexOf("fetch") >= 0) return "network";
    return "upload";
  }

  function toastUploadOutcome(result, opts) {
    opts = opts || {};
    if (result && result.url) {
      if (opts.silentOk) return;
      toastMsg(opts.okMsg || "Foto sincronizada na cloud", "success");
      return;
    }
    var code = (result && result.error) ? classifyStorageError({ message: result.error }) : "upload";
    var map = {
      timeout: "Foto guardada neste dispositivo. Cloud: tempo esgotado — tente com melhor rede.",
      offline: "Foto guardada neste dispositivo. Sem internet para a cloud.",
      forbidden: "Foto local OK. Cloud recusou (permissões Storage / RLS). Verifique políticas do bucket fotos.",
      auth: "Foto local OK. Sessão expirada — volte a entrar para sincronizar.",
      bucket: "Foto local OK. Bucket «fotos» em falta ou inacessível no Supabase.",
      network: "Foto local OK. Falha de rede ao enviar para a cloud.",
      upload: "Foto local OK. Falha ao enviar para a cloud."
    };
    toastMsg(map[code] || map.upload, "warning");
  }

  /** Upload Storage. Devolve { url, error }. Offline / falha → url null + error. */
  async function uploadFotoStorage(kind, entityId, dataUrl) {
    if (!dataUrl || !entityId) return { url: null, error: "upload" };
    if (typeof navigator !== "undefined" && !navigator.onLine) return { url: null, error: "offline" };
    if (typeof supabaseClient === "undefined" || !supabaseClient) return { url: null, error: "bucket" };
    var salaoId = (typeof state !== "undefined" && state.config && state.config.salaoId) ? state.config.salaoId : null;
    if (!salaoId) return { url: null, error: "auth" };
    try {
      var blob = dataUrlToBlob(dataUrl);
      if (!blob) return { url: null, error: "upload" };
      var path = String(salaoId) + "/" + kind + "/" + String(entityId) + ".jpg";
      var res = await supabaseClient.storage.from("fotos").upload(path, blob, {
        contentType: "image/jpeg",
        upsert: true,
        cacheControl: "60"
      });
      if (res.error) {
        console.warn("[BPMedia] storage upload:", res.error.message || res.error);
        return { url: null, error: res.error.message || "upload" };
      }
      var pub = supabaseClient.storage.from("fotos").getPublicUrl(path);
      var u = (pub && pub.data && pub.data.publicUrl) ? pub.data.publicUrl : null;
      if (!u) return { url: null, error: "upload" };
      return { url: u, error: null };
    } catch (e) {
      console.warn("[BPMedia] storage:", e && e.message ? e.message : e);
      return { url: null, error: (e && e.message) ? String(e.message) : "network" };
    }
  }

  async function removeFotoStorage(kind, entityId) {
    if (!entityId) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    if (typeof supabaseClient === "undefined" || !supabaseClient) return;
    var salaoId = (typeof state !== "undefined" && state.config && state.config.salaoId) ? state.config.salaoId : null;
    if (!salaoId) return;
    try {
      var path = String(salaoId) + "/" + kind + "/" + String(entityId) + ".jpg";
      await supabaseClient.storage.from("fotos").remove([path]);
    } catch (e) {
      console.warn("[BPMedia] storage remove:", e && e.message ? e.message : e);
    }
  }

  /** Offline robusto: se só há foto_url, descarrega e guarda data: em entity.foto */
  async function ensureLocalFotoCache(kind, entityId) {
    try {
      if (!entityId || typeof navigator === "undefined" || !navigator.onLine) return false;
      var ent = kind === "clientes" ? getCliente(entityId) : getProf(entityId);
      if (!ent) return false;
      if (ent.foto && String(ent.foto).indexOf("data:") === 0) return true;
      if (!ent.foto_url) return false;
      var res = await fetch(ent.foto_url, { mode: "cors", credentials: "omit" });
      if (!res.ok) return false;
      var blob = await res.blob();
      if (!blob || blob.size < 32) return false;
      var dataUrl = await new Promise(function (resolve, reject) {
        var fr = new FileReader();
        fr.onload = function () { resolve(fr.result); };
        fr.onerror = reject;
        fr.readAsDataURL(blob);
      });
      if (!dataUrl || String(dataUrl).indexOf("data:") !== 0) return false;
      var patch = { foto: dataUrl, updated_at: new Date().toISOString() };
      if (kind === "clientes" && typeof updateCliente === "function") await updateCliente(entityId, patch);
      else if (kind === "profissionais" && typeof updateProfissional === "function") await updateProfissional(entityId, patch);
      else {
        Object.assign(ent, patch);
        if (typeof dbPut === "function") await dbPut(kind, ent);
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  function warmFotoCaches() {
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    try {
      var clients = (state.clientes || []).slice(0, 40);
      var i = 0;
      function next() {
        if (i >= clients.length) return;
        var c = clients[i++];
        if (c && c.id && c.foto_url && !(c.foto && String(c.foto).indexOf("data:") === 0)) {
          ensureLocalFotoCache("clientes", c.id).finally(function () { setTimeout(next, 120); });
        } else setTimeout(next, 0);
      }
      setTimeout(next, 1500);
    } catch (_) {}
  }
  if (typeof window !== "undefined") {
    window.addEventListener("online", function () { setTimeout(warmFotoCaches, 800); });
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(warmFotoCaches, 2500); });
    else setTimeout(warmFotoCaches, 2500);
  }

  /** Preferir cache local (data:) depois URL remota. */
  function resolveFotoSrc(entity) {
    if (!entity) return null;
    if (entity.foto && String(entity.foto).indexOf("data:") === 0) return entity.foto;
    if (entity.foto_url) return entity.foto_url;
    if (entity.foto) return entity.foto;
    return null;
  }

  function pickImage(accept) {
    return new Promise(function (resolve) {
      var input = document.createElement("input");
      input.type = "file";
      input.accept = accept || "image/*";
      // mobile: prefer camera optional via capture not forced
      input.style.display = "none";
      document.body.appendChild(input);
      input.onchange = function () {
        var f = input.files && input.files[0];
        input.remove();
        resolve(f || null);
      };
      input.oncancel = function () {
        input.remove();
        resolve(null);
      };
      input.click();
    });
  }

  /* ---------- storage entidades (local + Supabase Storage) ---------- */
  async function setClienteFoto(clienteId, dataUrl) {
    if (!clienteId) return false;
    var prev = (state.clientes || []).find(function (x) { return x.id === clienteId; });
    var patch = { foto: dataUrl || null, updated_at: new Date().toISOString() };
    if (!dataUrl) {
      patch.foto_url = null;
      _uploadToken["clientes:" + clienteId] = "cleared";
      removeFotoStorage("clientes", clienteId);
    } else {
      // Nova foto: anular URL antiga (evita cache CDN da mesma path .jpg)
      patch.foto_url = null;
    }
    if (typeof updateCliente === "function") {
      await updateCliente(clienteId, patch);
    } else {
      var c = (state.clientes || []).find(function (x) { return x.id === clienteId; });
      if (!c) return false;
      Object.assign(c, patch);
      if (typeof dbPut === "function") await dbPut("clientes", c);
    }
    if (dataUrl) scheduleFotoUpload("clientes", clienteId, dataUrl);
    return true;
  }
  async function setProfFoto(profId, dataUrl) {
    if (!profId) return false;
    var prev = (state.profissionais || []).find(function (x) { return x.id === profId; });
    var patch = { foto: dataUrl || null, updated_at: new Date().toISOString() };
    if (!dataUrl) {
      patch.foto_url = null;
      _uploadToken["profissionais:" + profId] = "cleared";
      removeFotoStorage("profissionais", profId);
    } else {
      patch.foto_url = null;
    }
    if (typeof updateProfissional === "function") {
      await updateProfissional(profId, patch);
    } else {
      var p = (state.profissionais || []).find(function (x) { return x.id === profId; });
      if (!p) return false;
      Object.assign(p, patch);
      if (typeof dbPut === "function") await dbPut("profissionais", p);
    }
    if (dataUrl) scheduleFotoUpload("profissionais", profId, dataUrl);
    return true;
  }

  function currentClienteId() {
    var el = document.getElementById("cliente-id");
    var v = el && el.value ? String(el.value).trim() : "";
    return v || session.editingClienteId || null;
  }
  function currentProfId() {
    var el = document.getElementById("prof-id");
    var v = el && el.value ? String(el.value).trim() : "";
    return v || session.editingProfId || null;
  }
  function clearClientePending() {
    session.pendingClienteFoto = null;
    session.pendingClienteScope = null;
  }
  function clearProfPending() {
    session.pendingProfFoto = null;
    session.pendingProfScope = null;
  }
  var FOTO_QUEUE_KEY = "bp_foto_upload_queue";

  function getFotoQueue() {
    try {
      var raw = localStorage.getItem(FOTO_QUEUE_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (_) { return []; }
  }
  function saveFotoQueue(arr) {
    try { localStorage.setItem(FOTO_QUEUE_KEY, JSON.stringify(arr || [])); } catch (e) {
      console.warn("[BPMedia] foto queue save failed", e);
    }
  }
  function enqueueFotoUpload(kind, entityId, dataUrl) {
    if (!kind || !entityId || !dataUrl) return;
    var q = getFotoQueue().filter(function (x) {
      return !(x.kind === kind && x.entityId === entityId);
    });
    q.push({
      kind: kind,
      entityId: entityId,
      dataUrl: dataUrl,
      ts: Date.now(),
      attempts: 0
    });
    // ET4.6: sem teto rígido; se storage falhar, foto continua no entity.foto (data:)
    saveFotoQueue(q);
  }
  function removeFotoQueueItem(kind, entityId) {
    saveFotoQueue(getFotoQueue().filter(function (x) {
      return !(x.kind === kind && x.entityId === entityId);
    }));
  }

  /** Processa fila de fotos offline quando há rede — lotes de 3. */
  async function flushFotoUploadQueue() {
    if (!navigator.onLine) return;
    if (flushFotoUploadQueue._running) return;
    flushFotoUploadQueue._running = true;
    try {
      var q = getFotoQueue();
      if (!q.length) {
        // Também varrer entidades com foto data: ainda pendente
        try {
          (state.clientes || []).forEach(function (c) {
            if (c && c.id && c.foto && String(c.foto).indexOf("data:") === 0 && !c.foto_url) {
              enqueueFotoUpload("clientes", c.id, c.foto);
            }
          });
          (state.profissionais || []).forEach(function (p) {
            if (p && p.id && p.foto && String(p.foto).indexOf("data:") === 0 && !p.foto_url) {
              enqueueFotoUpload("profissionais", p.id, p.foto);
            }
          });
          q = getFotoQueue();
        } catch (_) {}
      }
      var batch = q.slice(0, 3);
      var rest = q.slice(3);
      for (var i = 0; i < batch.length; i++) {
        if (!navigator.onLine) {
          rest = batch.slice(i).concat(rest);
          break;
        }
        var item = batch[i];
        try {
          var result = await withTimeout(uploadFotoStorage(item.kind, item.entityId, item.dataUrl), UPLOAD_MS);
          var url = result && result.url ? result.url : null;
          if (!url) {
            item.attempts = (item.attempts || 0) + 1;
            if (item.attempts < 10) rest.push(item);
            continue;
          }
          var bustUrl = url + (url.indexOf("?") >= 0 ? "&" : "?") + "v=" + Date.now();
          /* Offline: manter data URL local como cache; foto_url para online */
        var patch = { foto_url: bustUrl, updated_at: new Date().toISOString() };
          if (item.kind === "clientes" && typeof updateCliente === "function") {
            await updateCliente(item.entityId, patch);
          } else if (item.kind === "profissionais" && typeof updateProfissional === "function") {
            await updateProfissional(item.entityId, patch);
          }
          try { patchRowAvatar(item.kind, item.entityId); } catch (_) {}
        } catch (e) {
          item.attempts = (item.attempts || 0) + 1;
          if (item.attempts < 10) rest.push(item);
        }
      }
      saveFotoQueue(rest);
    } finally {
      flushFotoUploadQueue._running = false;
    }
  }

  function scheduleFotoUpload(kind, entityId, dataUrl) {
    if (!entityId || !dataUrl) return;
    // Sempre enfileirar — garante offline e retry
    enqueueFotoUpload(kind, entityId, dataUrl);
    if (!navigator.onLine) return;
    var token = String(Date.now()) + "-" + Math.random().toString(36).slice(2, 8);
    _uploadToken[kind + ":" + entityId] = token;
    withTimeout(uploadFotoStorage(kind, entityId, dataUrl), UPLOAD_MS).then(function (result) {
      if (_uploadToken[kind + ":" + entityId] !== token) return;
      var url = result && result.url ? result.url : null;
      if (!url) {
        toastUploadOutcome(result || { url: null, error: "upload" }, { silentOk: true });
        return;
      }
      removeFotoQueueItem(kind, entityId);
      // Cache-bust: mesmo path .jpg no Storage mantém URL pública — forçar ?v=
      var bustUrl = url + (url.indexOf("?") >= 0 ? "&" : "?") + "v=" + Date.now();
      /* Offline: manter data URL local como cache; foto_url para online */
        var patch = { foto_url: bustUrl, updated_at: new Date().toISOString() };
      if (kind === "clientes") {
        var c = (state.clientes || []).find(function (x) { return x.id === entityId; });
        // Só cancelar se o utilizador já escolheu OUTRA foto mais recente
        if (c && c.foto && c.foto !== dataUrl && String(c.foto).indexOf("data:") === 0) return;
        if (typeof updateCliente === "function") updateCliente(entityId, patch);
        else if (c) { Object.assign(c, patch); if (typeof dbPut === "function") dbPut("clientes", c); }
        patchRowAvatar("clientes", entityId);
        showPreview("bp-cli-foto-preview", bustUrl, entityId);
      } else if (kind === "profissionais") {
        var p = (state.profissionais || []).find(function (x) { return x.id === entityId; });
        if (p && p.foto && p.foto !== dataUrl && String(p.foto).indexOf("data:") === 0) return;
        if (typeof updateProfissional === "function") updateProfissional(entityId, patch);
        else if (p) { Object.assign(p, patch); if (typeof dbPut === "function") dbPut("profissionais", p); }
        patchRowAvatar("profissionais", entityId);
        showPreview("bp-prof-foto-preview", bustUrl, entityId);
      }
      // Silencioso no sucesso cloud: UI já mostrou "Foto actualizada" no local
    });
  }

  /** Actualiza só a linha da lista (evita renderClientes/Profissionais completo). */
  function patchRowAvatar(kind, entityId) {
    if (!entityId) return;
    try {
      var row = kind === "clientes"
        ? document.querySelector('.cliente-item[data-cliente-id="' + entityId + '"]')
        : document.querySelector('.list-item[data-prof-id="' + entityId + '"]');
      if (!row) return;
      var ent = kind === "clientes" ? getCliente(entityId) : getProf(entityId);
      if (!ent) return;
      var av = row.querySelector(".avatar");
      if (!av) return;
      var src = resolveFotoSrc(ent) || (window.BPAvatars && BPAvatars.avatarDataUrl(ent.nome));
      if (!src) return;
      av.setAttribute("data-avatar-entity", String(entityId));
      av.classList.add("bp-avatar-img", "bp-avatar-done");
      // Forçar reload se URL http(s) (cache do browser na mesma path Storage)
      var displaySrc = src;
      if (displaySrc && (displaySrc.indexOf("http://") === 0 || displaySrc.indexOf("https://") === 0) && displaySrc.indexOf("?v=") < 0 && displaySrc.indexOf("&v=") < 0) {
        displaySrc = displaySrc + (displaySrc.indexOf("?") >= 0 ? "&" : "?") + "v=" + Date.now();
      }
      var safe = String(displaySrc).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
      av.innerHTML = '<img src="' + safe + '" alt="" loading="lazy" decoding="async" data-avatar-entity="' + entityId + '">';
    } catch (e) {}
  }

  function getCliente(id) {
    return (state.clientes || []).find(function (c) { return c.id === id; });
  }
  function getProf(id) {
    return (state.profissionais || []).find(function (p) { return p.id === id; });
  }

  /* ---------- galeria ---------- */
  function loadGaleria() {
    try {
      var raw = localStorage.getItem(galeriaStorageKey());
      var list = raw ? JSON.parse(raw) : [];
      // Migração: chave antiga sem salao_id
      if ((!list || !list.length) && galeriaStorageKey() !== GALERIA_KEY_BASE) {
        try {
          var legacy = localStorage.getItem(GALERIA_KEY_BASE);
          if (legacy) {
            list = JSON.parse(legacy);
            if (Array.isArray(list) && list.length) saveGaleria(list);
          }
        } catch (_) {}
      }
      return Array.isArray(list) ? list : [];
    } catch (e) { return []; }
  }
  function saveGaleria(list) {
    try {
      var slim = (list || []).slice(-MAX_GALERIA).map(function (f) {
        var o = {
          id: f.id,
          profissional_id: f.profissional_id,
          profissional_nome: f.profissional_nome || "",
          caption: f.caption || "",
          data: f.data || "",
          ts: f.ts || "",
          url: f.url || null,
          thumb: f.thumb || null,
          updated_at: f.updated_at || f.ts || new Date().toISOString()
        };
        if (o.url && o.thumb && String(o.thumb).indexOf("data:") === 0) {
          o.thumb = o.url;
        }
        return o;
      });
      localStorage.setItem(galeriaStorageKey(), JSON.stringify(slim));
      return true;
    } catch (e) {
      toastMsg("Armazenamento cheio — remova fotos antigas", "error");
      return false;
    }
  }
  function addFotoGaleria(entry) {
    var list = loadGaleria();
    list.push(entry);
    if (!saveGaleria(list)) return null;
    return entry;
  }
  function removeFotoGaleria(id) {
    var list = loadGaleria().filter(function (x) { return x.id !== id; });
    saveGaleria(list);
  }
  function galeriaPorProf(profId) {
    return loadGaleria().filter(function (x) { return x.profissional_id === profId; }).reverse();
  }

  /** Push metadados da galeria para Supabase (tabela galeria_fotos). */
  async function upsertGaleriaRemoto(entry) {
    if (!entry || !entry.id) return false;
    if (typeof navigator !== "undefined" && !navigator.onLine) return false;
    if (typeof SUPABASE_URL === "undefined" || !SUPABASE_URL) return false;
    var salaoId = (state && state.config && state.config.salaoId) ? state.config.salaoId : null;
    if (!salaoId) return false;
    try {
      var authHeaders = typeof getAuthHeaders === "function" ? await getAuthHeaders() : null;
      if (!authHeaders) return false;
      var body = {
        id: entry.id,
        salao_id: salaoId,
        profissional_id: entry.profissional_id || null,
        profissional_nome: entry.profissional_nome || null,
        caption: entry.caption || null,
        data: entry.data || null,
        url: entry.url || null,
        ts: entry.ts || new Date().toISOString(),
        updated_at: entry.updated_at || new Date().toISOString()
      };
      var resp = await fetch(SUPABASE_URL + "/rest/v1/galeria_fotos", {
        method: "POST",
        headers: Object.assign({
          "Content-Type": "application/json",
          "Prefer": "resolution=merge-duplicates"
        }, authHeaders),
        body: JSON.stringify(body)
      });
      if (!resp.ok) {
        var txt = "";
        try { txt = await resp.text(); } catch (_) {}
        console.warn("[BPMedia] galeria upsert", resp.status, txt);
        return false;
      }
      return true;
    } catch (e) {
      console.warn("[BPMedia] galeria upsert", e);
      return false;
    }
  }

  async function deleteGaleriaRemoto(id) {
    if (!id) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    if (typeof SUPABASE_URL === "undefined" || !SUPABASE_URL) return;
    var salaoId = (state && state.config && state.config.salaoId) ? state.config.salaoId : null;
    if (!salaoId) return;
    try {
      var authHeaders = typeof getAuthHeaders === "function" ? await getAuthHeaders() : null;
      if (!authHeaders) return;
      await fetch(
        SUPABASE_URL + "/rest/v1/galeria_fotos?id=eq." + encodeURIComponent(id) +
          "&salao_id=eq." + encodeURIComponent(salaoId),
        { method: "DELETE", headers: authHeaders }
      );
    } catch (e) {
      console.warn("[BPMedia] galeria delete remoto", e);
    }
  }

  /** Pull galeria do Supabase e funde com local (remoto com URL ganha). */
  async function pullGaleriaRemoto() {
    if (typeof navigator !== "undefined" && !navigator.onLine) return loadGaleria();
    if (typeof SUPABASE_URL === "undefined" || !SUPABASE_URL) return loadGaleria();
    var salaoId = (state && state.config && state.config.salaoId) ? state.config.salaoId : null;
    if (!salaoId) return loadGaleria();
    try {
      var authHeaders = typeof getAuthHeaders === "function" ? await getAuthHeaders() : null;
      if (!authHeaders) return loadGaleria();
      var resp = await fetch(
        SUPABASE_URL + "/rest/v1/galeria_fotos?salao_id=eq." + encodeURIComponent(salaoId) +
          "&select=*&order=ts.desc",
        { headers: authHeaders }
      );
      if (!resp.ok) {
        // tabela pode não existir ainda
        if (resp.status === 404 || resp.status === 406) {
          console.warn("[BPMedia] tabela galeria_fotos ausente — execute SUPABASE_GALERIA.sql");
        }
        return loadGaleria();
      }
      var rows = await resp.json();
      if (!Array.isArray(rows)) return loadGaleria();
      var local = loadGaleria();
      var map = Object.create(null);
      local.forEach(function (f) {
        if (f && f.id) map[f.id] = f;
      });
      rows.forEach(function (r) {
        if (!r || !r.id) return;
        var prev = map[r.id];
        // Preferir URL remota; manter thumb local se ainda não há url
        map[r.id] = {
          id: r.id,
          profissional_id: r.profissional_id,
          profissional_nome: r.profissional_nome || (prev && prev.profissional_nome) || "",
          caption: r.caption || (prev && prev.caption) || "",
          data: r.data || (prev && prev.data) || "",
          ts: r.ts || (prev && prev.ts) || "",
          url: r.url || (prev && prev.url) || null,
          thumb: (r.url || (prev && prev.thumb) || (prev && prev.url) || null),
          updated_at: r.updated_at || r.ts || (prev && prev.updated_at) || ""
        };
      });
      // Locais só data: sem url e sem remoto → manter (pendente upload)
      var merged = Object.keys(map).map(function (k) { return map[k]; });
      merged.sort(function (a, b) {
        return String(b.ts || "").localeCompare(String(a.ts || ""));
      });
      saveGaleria(merged);
      return merged;
    } catch (e) {
      console.warn("[BPMedia] pull galeria", e);
      return loadGaleria();
    }
  }

  /** Lista ficheiros no Storage se a tabela ainda não existir (contingência). */
  async function pullGaleriaFromStorage() {
    if (typeof supabaseClient === "undefined" || !supabaseClient) return;
    var salaoId = (state && state.config && state.config.salaoId) ? state.config.salaoId : null;
    if (!salaoId) return;
    try {
      var prefix = String(salaoId) + "/galeria";
      var res = await supabaseClient.storage.from("fotos").list("galeria", { limit: 100 });
      // path real: salaoId/galeria/profId/file — list hierarchical
      var profFolders = await supabaseClient.storage.from("fotos").list(String(salaoId) + "/galeria", { limit: 50 });
      if (profFolders.error || !profFolders.data) return;
      var local = loadGaleria();
      var byId = Object.create(null);
      local.forEach(function (f) { if (f && f.id) byId[f.id] = f; });
      for (var i = 0; i < profFolders.data.length; i++) {
        var folder = profFolders.data[i];
        if (!folder || !folder.name) continue;
        var files = await supabaseClient.storage.from("fotos").list(String(salaoId) + "/galeria/" + folder.name, { limit: 40 });
        if (files.error || !files.data) continue;
        files.data.forEach(function (file) {
          if (!file || !file.name || file.name === ".emptyFolderPlaceholder") return;
          var id = file.name.replace(/\.jpg$/i, "").replace(/\.jpeg$/i, "").replace(/\.webp$/i, "");
          if (byId[id] && byId[id].url) return;
          var path = String(salaoId) + "/galeria/" + folder.name + "/" + file.name;
          var pub = supabaseClient.storage.from("fotos").getPublicUrl(path);
          var u = pub && pub.data && pub.data.publicUrl ? pub.data.publicUrl : null;
          if (!u) return;
          byId[id] = {
            id: id,
            profissional_id: folder.name,
            profissional_nome: "",
            caption: "",
            data: "",
            ts: file.updated_at || file.created_at || new Date().toISOString(),
            url: u,
            thumb: u,
            updated_at: file.updated_at || ""
          };
        });
      }
      var merged = Object.keys(byId).map(function (k) { return byId[k]; });
      if (merged.length) saveGaleria(merged);
    } catch (e) {
      console.warn("[BPMedia] storage list galeria", e);
    }
  }

  async function syncGaleriaFull() {
    await pullGaleriaRemoto();
    // Contingência se tabela vazia mas há ficheiros
    var cur = loadGaleria();
    var hasUrl = cur.some(function (f) { return f && f.url; });
    if (!hasUrl) await pullGaleriaFromStorage();
    return loadGaleria();
  }

  /* ---------- UI avatar helpers ---------- */
  function avatarHtml(foto, nome, sizeClass) {
    var initial = (nome || "?").charAt(0).toUpperCase();
    if (foto) {
      return '<div class="avatar bp-avatar-img ' + (sizeClass || "") + '"><img src="' + foto + '" alt="" loading="lazy" decoding="async"></div>';
    }
    return '<div class="avatar ' + (sizeClass || "") + '">' + initial + "</div>";
  }

  function enhanceListAvatars() {
    try {
      document.querySelectorAll(".cliente-item[data-cliente-id]").forEach(function (row) {
        var id = row.getAttribute("data-cliente-id");
        var c = getCliente(id);
        if (!c) return;
        var av = row.querySelector(".avatar");
        if (!av) return;
        var src = resolveFotoSrc(c) || (window.BPAvatars && BPAvatars.avatarDataUrl(c.nome));
        if (!src) return;
        var img = av.querySelector("img");
        var same = av.getAttribute("data-avatar-entity") === id && img && img.getAttribute("src") === src;
        if (same) return;
        av.setAttribute("data-avatar-entity", id);
        av.classList.add("bp-avatar-img", "bp-avatar-done");
        av.innerHTML = '<img src="' + src + '" alt="" loading="lazy" decoding="async" data-avatar-entity="' + id + '">';
      });
      document.querySelectorAll(".list-item[data-prof-id]").forEach(function (row) {
        var id = row.getAttribute("data-prof-id");
        var p = getProf(id);
        if (!p) return;
        var av = row.querySelector(".avatar");
        if (!av) return;
        var src = resolveFotoSrc(p) || (window.BPAvatars && BPAvatars.avatarDataUrl(p.nome));
        if (!src) return;
        var img = av.querySelector("img");
        var same = av.getAttribute("data-avatar-entity") === id && img && img.getAttribute("src") === src;
        if (same) return;
        av.setAttribute("data-avatar-entity", id);
        av.classList.add("bp-avatar-img", "bp-avatar-done");
        av.innerHTML = '<img src="' + src + '" alt="" loading="lazy" decoding="async" data-avatar-entity="' + id + '">';
      });
    } catch (e) {}
  }

  function ensureClientePhotoUI() {
    var modal = document.getElementById("modal-cliente");
    if (!modal || modal.querySelector("#bp-cli-foto-wrap")) return;
    var title = modal.querySelector(".modal-title") || modal.querySelector("#cliente-modal-title");
    if (!title) return;
    var wrap = document.createElement("div");
    wrap.id = "bp-cli-foto-wrap";
    wrap.className = "bp-foto-wrap";
    wrap.innerHTML =
      '<button type="button" class="bp-foto-btn" id="bp-cli-foto-btn" aria-label="Foto do cliente">' +
        '<div class="bp-foto-preview" id="bp-cli-foto-preview"><span>Foto</span></div>' +
        '<span class="bp-foto-hint">Toque para adicionar foto</span>' +
      "</button>" +
      '<button type="button" class="bp-foto-remove" id="bp-cli-foto-rm" style="display:none">Remover foto</button>';
    title.parentNode.insertBefore(wrap, title.nextSibling);

    document.getElementById("bp-cli-foto-btn").onclick = async function () {
      var id = currentClienteId();
      var file = await pickImage();
      if (!file) return;
      try {
        toastMsg("A processar foto…", "success");
        var dataUrl = await compressFile(file, AVATAR_MAX, JPEG_Q);
        // Isolamento: após await, só aplicar se o modal ainda for o mesmo registo
        if (!stillClienteContext(id)) {
          // Dados: se tinha id, gravar na entidade correcta na mesma (sem tocar no preview alheio)
          if (id) {
            clearClientePending();
            await setClienteFoto(id, dataUrl);
            patchRowAvatar("clientes", id);
            toastMsg("Foto guardada no cliente correcto", "success");
          }
          return;
        }
        if (!id) {
          session.pendingClienteFoto = dataUrl;
          session.pendingClienteScope = "new";
          showPreview("bp-cli-foto-preview", dataUrl, "new");
          document.getElementById("bp-cli-foto-rm").style.display = "";
          toastMsg("Foto pronta — guarde o cliente", "success");
          return;
        }
        clearClientePending();
        await setClienteFoto(id, dataUrl);
        if (!stillClienteContext(id)) return;
        showPreview("bp-cli-foto-preview", dataUrl, id);
        document.getElementById("bp-cli-foto-rm").style.display = "";
        enhanceListAvatars();
        toastMsg("Foto actualizada", "success");
        patchRowAvatar("clientes", id);
      } catch (e) {
        console.warn(e);
        toastMsg("Não foi possível processar a imagem.", "error");
      }
    };
    document.getElementById("bp-cli-foto-rm").onclick = async function () {
      var id = currentClienteId();
      clearClientePending();
      if (id) await setClienteFoto(id, null);
      if (stillClienteContext(id)) {
        showPreview("bp-cli-foto-preview", null, id || "new");
        this.style.display = "none";
      }
      toastMsg("Foto removida.", "success");
      patchRowAvatar("clientes", id);
    };
  }

  function ensureProfPhotoUI() {
    var modal = document.getElementById("modal-prof");
    if (!modal || modal.querySelector("#bp-prof-foto-wrap")) return;
    var title = modal.querySelector(".modal-title") || modal.querySelector("#prof-modal-title");
    if (!title) return;
    var wrap = document.createElement("div");
    wrap.id = "bp-prof-foto-wrap";
    wrap.className = "bp-foto-wrap";
    wrap.innerHTML =
      '<button type="button" class="bp-foto-btn" id="bp-prof-foto-btn" aria-label="Foto do profissional">' +
        '<div class="bp-foto-preview" id="bp-prof-foto-preview"><span>Foto</span></div>' +
        '<span class="bp-foto-hint">Toque para adicionar foto</span>' +
      "</button>" +
      '<button type="button" class="bp-foto-remove" id="bp-prof-foto-rm" style="display:none">Remover foto</button>';
    title.parentNode.insertBefore(wrap, title.nextSibling);

    document.getElementById("bp-prof-foto-btn").onclick = async function () {
      var id = currentProfId();
      var file = await pickImage();
      if (!file) return;
      try {
        toastMsg("A processar foto…", "success");
        var dataUrl = await compressFile(file, AVATAR_MAX, JPEG_Q);
        if (!stillProfContext(id)) {
          if (id) {
            clearProfPending();
            await setProfFoto(id, dataUrl);
            patchRowAvatar("profissionais", id);
            toastMsg("Foto guardada no profissional correcto", "success");
          }
          return;
        }
        if (!id) {
          session.pendingProfFoto = dataUrl;
          session.pendingProfScope = "new";
          showPreview("bp-prof-foto-preview", dataUrl, "new");
          document.getElementById("bp-prof-foto-rm").style.display = "";
          toastMsg("Foto pronta — guarde o profissional", "success");
          return;
        }
        clearProfPending();
        await setProfFoto(id, dataUrl);
        if (!stillProfContext(id)) return;
        showPreview("bp-prof-foto-preview", dataUrl, id);
        document.getElementById("bp-prof-foto-rm").style.display = "";
        enhanceListAvatars();
        toastMsg("Foto actualizada", "success");
        patchRowAvatar("profissionais", id);
      } catch (e) {
        console.warn(e);
        toastMsg("Não foi possível processar a imagem.", "error");
      }
    };
    document.getElementById("bp-prof-foto-rm").onclick = async function () {
      var id = currentProfId();
      clearProfPending();
      if (id) await setProfFoto(id, null);
      if (stillProfContext(id)) {
        showPreview("bp-prof-foto-preview", null, id || "new");
        this.style.display = "none";
      }
      toastMsg("Foto removida.", "success");
      patchRowAvatar("profissionais", id);
    };
  }

  function showPreview(id, dataUrl, entityKey) {
    var el = document.getElementById(id);
    if (!el) return;
    var key = entityKey == null ? "" : String(entityKey);
    // Isolamento: se o preview já está ligado a outra entidade, não sobrescrever
    var bound = el.getAttribute("data-foto-for") || "";
    if (key && bound && bound !== key && el.classList.contains("has-img")) {
      // troca de entidade em curso — só aplicar se for o destino correcto
    }
    if (dataUrl) {
      el.setAttribute("data-foto-for", key || bound || "");
      el.innerHTML = '<img src="' + dataUrl + '" alt="" data-foto-for="' + (key || "") + '">';
      el.classList.add("has-img");
      el.classList.remove("bp-avatar-fallback");
    } else {
      el.setAttribute("data-foto-for", key || "");
      el.innerHTML = "<span>Foto</span>";
      el.classList.remove("has-img");
      el.classList.remove("bp-avatar-fallback");
    }
  }

  /** true se o modal ainda mostra a mesma entidade (evita leak após await). */
  function stillClienteContext(expectedId) {
    var modal = document.getElementById("modal-cliente");
    if (!modal || !modal.classList.contains("open")) return false;
    var cur = currentClienteId();
    if (!expectedId) return !cur; // novo cliente
    return String(cur) === String(expectedId);
  }
  function stillProfContext(expectedId) {
    var modal = document.getElementById("modal-prof");
    if (!modal || !modal.classList.contains("open")) return false;
    var cur = currentProfId();
    if (!expectedId) return !cur;
    return String(cur) === String(expectedId);
  }

  function syncModalPreviews() {
    ensureClientePhotoUI();
    ensureProfPhotoUI();
    var cli = document.getElementById("modal-cliente");
    if (cli && cli.classList.contains("open")) {
      var cid = currentClienteId();
      var c = cid ? getCliente(cid) : null;
      var foto = null;
      if (c) foto = resolveFotoSrc(c);
      else if (session.pendingClienteScope === "new") foto = session.pendingClienteFoto;
      showPreview("bp-cli-foto-preview", foto, cid || (foto ? "new" : ""));
      var rm = document.getElementById("bp-cli-foto-rm");
      if (rm) rm.style.display = foto ? "" : "none";
    }
    var pr = document.getElementById("modal-prof");
    if (pr && pr.classList.contains("open")) {
      var pid = currentProfId();
      var p = pid ? getProf(pid) : null;
      var foto2 = null;
      if (p) foto2 = resolveFotoSrc(p);
      else if (session.pendingProfScope === "new") foto2 = session.pendingProfFoto;
      showPreview("bp-prof-foto-preview", foto2, pid || (foto2 ? "new" : ""));
      var rm2 = document.getElementById("bp-prof-foto-rm");
      if (rm2) rm2.style.display = foto2 ? "" : "none";
    }
  }

  function hookEditTracking() {
    var cliModal = document.getElementById("modal-cliente");
    if (cliModal && !cliModal.dataset.bpFotoObs) {
      cliModal.dataset.bpFotoObs = "1";
      var obs = new MutationObserver(function () {
        if (cliModal.classList.contains("open")) {
          setTimeout(function () {
            var hid = document.getElementById("cliente-id");
            var id = hid && hid.value ? String(hid.value).trim() : "";
            session.editingClienteId = id || null;
            if (session.editingClienteId) clearClientePending();
            syncModalPreviews();
          }, 40);
        } else {
          session.editingClienteId = null;
          clearClientePending();
          showPreview("bp-cli-foto-preview", null, "");
        }
      });
      obs.observe(cliModal, { attributes: true, attributeFilter: ["class"] });
    }
    var prModal = document.getElementById("modal-prof");
    if (prModal && !prModal.dataset.bpFotoObs) {
      prModal.dataset.bpFotoObs = "1";
      var obs2 = new MutationObserver(function () {
        if (prModal.classList.contains("open")) {
          setTimeout(function () {
            var hid = document.getElementById("prof-id");
            var id = hid && hid.value ? String(hid.value).trim() : "";
            session.editingProfId = id || null;
            if (session.editingProfId) clearProfPending();
            syncModalPreviews();
          }, 40);
        } else {
          session.editingProfId = null;
          clearProfPending();
          showPreview("bp-prof-foto-preview", null, "");
        }
      });
      obs2.observe(prModal, { attributes: true, attributeFilter: ["class"] });
    }
  }

  function hookSaveButtons() {
    document.addEventListener("click", function (e) {
      var t = e.target.closest("#modal-cliente-save, #cliente-save, [data-save-cliente]");
      if (t && session.pendingClienteFoto && session.pendingClienteScope === "new") {
        var nome = ((document.getElementById("cliente-nome") || {}).value || "").trim();
        var foto = session.pendingClienteFoto;
        clearClientePending();
        setTimeout(async function () {
          if (!nome || !foto) return;
          var matches = (state.clientes || []).filter(function (x) { return x.nome === nome; });
          if (!matches.length) return;
          matches.sort(function (a, b) {
            return String(b.updated_at || "").localeCompare(String(a.updated_at || ""));
          });
          var c = matches[0];
          if (c) {
            await setClienteFoto(c.id, foto);
            patchRowAvatar("clientes", c.id);
          }
        }, 500);
      }
      var t2 = e.target.closest("#modal-prof-save, #prof-save, [data-save-prof]");
      if (t2 && session.pendingProfFoto && session.pendingProfScope === "new") {
        var nome2 = ((document.getElementById("prof-nome") || {}).value || "").trim();
        var foto2 = session.pendingProfFoto;
        // NÃO limpar ainda — eventos-cadastros / takePending também podem consumir
        var attempts = 0;
        var tryApply = async function () {
          attempts++;
          if (!foto2 || !nome2) return;
          var matches = (state.profissionais || []).filter(function (x) { return x.nome === nome2; });
          if (!matches.length) {
            if (attempts < 12) setTimeout(tryApply, 250);
            return;
          }
          matches.sort(function (a, b) {
            return String(b.updated_at || "").localeCompare(String(a.updated_at || ""));
          });
          var p = matches[0];
          if (!p) return;
          // Se já tem a mesma foto, só patch UI
          if (p.foto === foto2 || (p.foto && p.foto.indexOf("data:") === 0)) {
            clearProfPending();
            patchRowAvatar("profissionais", p.id);
            enhanceListAvatars();
            return;
          }
          await setProfFoto(p.id, foto2);
          clearProfPending();
          patchRowAvatar("profissionais", p.id);
          enhanceListAvatars();
          if (typeof renderProfissionais === "function") {
            try { renderProfissionais(); } catch (_) {}
          }
        };
        setTimeout(tryApply, 300);
      }
    });
  }

  /* Lazy load: IntersectionObserver + data-src (evita carregar todas de uma vez) */
  /* ================================================================
   * Galeria — lazy load robusto
   * - root = contentor com scroll do modal (não o viewport)
   * - URLs escapadas em atributos
   * - data: (thumb local) sempre eager; remote lazy
   * - disconnect no re-render; re-observe após paint
   * - sem src vazio; placeholder estável
   * ================================================================ */
  var _bpGalIo = null;
  var BP_GAL_PLACEHOLDER = "data:image/svg+xml," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">' +
    '<rect fill="#e8e4df" width="120" height="120"/>' +
    '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#9a9288" font-size="11" font-family="sans-serif">…</text>' +
    "</svg>"
  );

  function bpGalEscAttr(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function bpGalSrc(f) {
    if (!f || typeof f !== "object") return "";
    var u = f.url || f.thumb || "";
    if (!u || typeof u !== "string") return "";
    // rejeitar lixo óbvio
    if (u === "null" || u === "undefined") return "";
    return u;
  }

  function bpGalIsLocalData(src) {
    return typeof src === "string" && src.indexOf("data:") === 0;
  }

  function bpGalDisconnect() {
    if (_bpGalIo) {
      try { _bpGalIo.disconnect(); } catch (_) {}
      _bpGalIo = null;
    }
  }

  function bpGalScrollRoot(fromEl) {
    // Preferir o corpo do modal / sheet com overflow; senão viewport (null)
    var el = fromEl;
    var hops = 0;
    while (el && hops < 12) {
      try {
        var st = window.getComputedStyle(el);
        var oy = st && st.overflowY;
        if ((oy === "auto" || oy === "scroll" || oy === "overlay") && el.scrollHeight > el.clientHeight + 8) {
          return el;
        }
      } catch (_) {}
      el = el.parentElement;
      hops++;
    }
    var body = document.getElementById("modal-bp-galeria-body");
    if (body) return body;
    return null;
  }

  function bpGalLoadOne(img) {
    if (!img || img.getAttribute("data-bp-gal-loaded") === "1") return;
    var src = img.getAttribute("data-src");
    if (!src) {
      img.setAttribute("data-bp-gal-loaded", "1");
      return;
    }
    img.setAttribute("data-bp-gal-loaded", "1");
    img.removeAttribute("data-src");
    var done = function () {
      img.classList.add("bp-gal-loaded");
      img.classList.remove("bp-gal-pending");
    };
    img.onload = done;
    img.onerror = function () {
      img.classList.add("bp-gal-error");
      img.classList.remove("bp-gal-pending");
      img.alt = "Falha ao carregar";
      // manter placeholder visual
      try { img.src = BP_GAL_PLACEHOLDER; } catch (_) {}
    };
    img.src = src;
    // cached images may already be complete
    if (img.complete && img.naturalWidth > 0) done();
  }

  function bpGalObserve(root) {
    if (!root) return;
    var imgs = root.querySelectorAll("img.bp-gal-lazy[data-src]");
    if (!imgs.length) return;

    // Sem IO: carregar tudo (compat)
    if (!("IntersectionObserver" in window)) {
      for (var i = 0; i < imgs.length; i++) bpGalLoadOne(imgs[i]);
      return;
    }

    bpGalDisconnect();
    var scrollRoot = bpGalScrollRoot(root);
    _bpGalIo = new IntersectionObserver(
      function (entries) {
        for (var k = 0; k < entries.length; k++) {
          var en = entries[k];
          if (!en.isIntersecting) continue;
          var img = en.target;
          try { _bpGalIo.unobserve(img); } catch (_) {}
          bpGalLoadOne(img);
        }
      },
      { root: scrollRoot, rootMargin: "160px 0px", threshold: 0.01 }
    );
    for (var j = 0; j < imgs.length; j++) {
      // Já visíveis no primeiro frame
      _bpGalIo.observe(imgs[j]);
    }
  }

  function bpGalEnsureStyles() {
    if (document.getElementById("bp-gal-lazy-css")) return;
    var st = document.createElement("style");
    st.id = "bp-gal-lazy-css";
    st.textContent =
      ".bp-gal-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;}" +
      ".bp-gal-item{position:relative;border-radius:10px;overflow:hidden;background:var(--bg-soft,#f0ebe6);aspect-ratio:1;}" +
      ".bp-gal-item img{width:100%;height:100%;object-fit:cover;display:block;transition:opacity .2s ease;}" +
      ".bp-gal-lazy.bp-gal-pending{opacity:.65;}" +
      ".bp-gal-lazy.bp-gal-loaded{opacity:1;}" +
      ".bp-gal-lazy.bp-gal-error{opacity:.4;}" +
      ".bp-gal-placeholder{display:flex;align-items:center;justify-content:center;height:100%;font-size:12px;color:var(--text-muted,#9a9288);}" +
      ".bp-gal-meta{position:absolute;left:0;right:0;bottom:0;padding:6px 8px;background:linear-gradient(transparent,rgba(0,0,0,.55));color:#fff;font-size:11px;display:flex;justify-content:space-between;align-items:center;gap:6px;}" +
      ".bp-gal-meta span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}" +
      ".bp-gal-del{background:rgba(0,0,0,.35);border:0;color:#fff;border-radius:50%;width:24px;height:24px;cursor:pointer;flex-shrink:0;}";
    document.head.appendChild(st);
  }


  /** Shell do modal — independe de BPOps (ensureShell lá é privado ao IIFE). */
  function ensureShell(id, title, eyebrow, subtitle) {
    if (typeof ensureBpSheetModal === "function") {
      return ensureBpSheetModal(id, title, eyebrow, subtitle);
    }
    // Fallback mínimo se core-utils ainda não carregou
    var el = document.getElementById(id);
    if (el) return el;
    el = document.createElement("div");
    el.id = id;
    el.className = "modal-overlay";
    el.setAttribute("role", "dialog");
    el.innerHTML =
      '<div class="modal-sheet bp-sheet">' +
      '<div class="handle"></div>' +
      '<div class="modal-title" id="' + id + '-title">' + (title || "Galeria") + "</div>" +
      '<div class="bp-sheet-body" id="' + id + '-body"></div>' +
      '<div class="modal-actions"><button type="button" class="btn btn-secondary" data-close="' + id + '">Fechar</button></div>' +
      "</div>";
    document.body.appendChild(el);
    el.addEventListener("click", function (e) {
      if (e.target === el || e.target.getAttribute("data-close") === id) {
        if (typeof closeModal === "function") closeModal(id);
        else el.classList.remove("open");
      }
    });
    return el;
  }
  function openShell(id) {
    if (typeof openBpSheetModal === "function") openBpSheetModal(id);
    else if (typeof openModal === "function") openModal(id);
    else {
      var el = document.getElementById(id);
      if (el) {
        el.classList.add("open");
        el.style.display = "flex";
      }
    }
  }

  async function openGaleria(profIdPreset) {
    try {
      bpGalEnsureStyles();
      ensureShell("modal-bp-galeria", "Galeria de serviços", "Media", "Fotos dos trabalhos, associadas a cada profissional.");
      openShell("modal-bp-galeria");
      // Sync remoto antes de pintar (não bloqueia UI se falhar)
      try {
        if (navigator.onLine) await syncGaleriaFull();
      } catch (eSync) {
        console.warn("[BPMedia] sync galeria", eSync);
      }
      renderGaleria(profIdPreset);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          var body = document.getElementById("modal-bp-galeria-body");
          bpGalObserve((body && body.querySelector(".bp-gal-grid")) || body);
        });
      });
    } catch (err) {
      console.error("[BPMedia] openGaleria", err);
      if (typeof toastMsg === "function") toastMsg("Não foi possível abrir a galeria", "error");
      else if (typeof toast === "function") toast("Não foi possível abrir a galeria", "error");
      throw err;
    }
  }

  function renderGaleria(profIdPreset) {
    var body = document.getElementById("modal-bp-galeria-body");
    if (!body) return;
    bpGalDisconnect();

    var allProfs = state.profissionais || [];
    var profs = allProfs.filter(function (p) {
      if (!p || !p.id) return false;
      if (typeof isProfissionalAtivo === "function") return isProfissionalAtivo(p);
      return p.ativo !== false && p.ativo !== 0 && p.ativo !== "false";
    });
    var profId = profIdPreset || (profs[0] && profs[0].id) || "";
    if (profIdPreset) {
      var still = profs.some(function (p) { return p.id === profIdPreset; });
      if (!still) {
        var p0 = allProfs.find(function (x) { return x && x.id === profIdPreset; });
        if (p0) {
          profs = [p0].concat(profs);
          profId = profIdPreset;
        }
      } else {
        profId = profIdPreset;
      }
    }

    var opts = profs.map(function (p) {
      return '<option value="' + bpGalEscAttr(p.id) + '"' + (p.id === profId ? " selected" : "") + ">" + esc(p.nome) + "</option>";
    }).join("");

    var fotos = (profId ? galeriaPorProf(profId) : loadGaleria().slice().reverse()).filter(function (f) {
      return f && f.id;
    });

    var EAGER_REMOTE = 4;
    var remoteSeen = 0;
    var grid = fotos.map(function (f) {
      var src = bpGalSrc(f);
      var meta =
        '<div class="bp-gal-meta">' +
          "<span>" + esc(f.caption || f.data || "") + "</span>" +
          '<button type="button" class="bp-gal-del" data-del-gal="' + bpGalEscAttr(f.id) + '" title="Remover" aria-label="Remover">×</button>' +
        "</div>";
      if (!src) {
        return '<div class="bp-gal-item bp-gal-item--empty" data-gal-id="' + bpGalEscAttr(f.id) + '">' +
          '<div class="bp-gal-placeholder">Sem imagem</div>' + meta + "</div>";
      }
      var safe = bpGalEscAttr(src);
      var imgTag;
      // data: local → sempre eager (já em memória). Remote → primeiras N eager, resto lazy.
      if (bpGalIsLocalData(src) || remoteSeen < EAGER_REMOTE) {
        if (!bpGalIsLocalData(src)) remoteSeen++;
        imgTag =
          '<img class="bp-gal-lazy bp-gal-eager bp-gal-loaded" src="' + safe +
          '" alt="" loading="eager" decoding="async" data-bp-gal-loaded="1">';
      } else {
        imgTag =
          '<img class="bp-gal-lazy bp-gal-pending" src="' + BP_GAL_PLACEHOLDER +
          '" data-src="' + safe + '" alt="" loading="lazy" decoding="async">';
      }
      return '<div class="bp-gal-item" data-gal-id="' + bpGalEscAttr(f.id) + '">' + imgTag + meta + "</div>";
    }).join("") ||
      '<div class="bp-empty"><strong>Sem fotos</strong>Adicione a primeira foto do trabalho abaixo.</div>';

    body.innerHTML =
      '<div class="input-group"><label class="input-label">Profissional</label>' +
      '<select id="bp-gal-prof" class="input-field">' + (opts || '<option value="">—</option>') + "</select></div>" +
      '<div class="bp-gal-actions">' +
        '<button type="button" class="btn btn-primary btn-block" id="bp-gal-add"' + (!profId ? " disabled" : "") + ">Adicionar foto do serviço</button>" +
      "</div>" +
      '<div class="input-group" style="margin-top:12px"><label class="input-label">Legenda (opcional)</label>' +
      '<input type="text" id="bp-gal-caption" class="input-field" placeholder="Ex: Coloração · cliente A" maxlength="80"></div>' +
      '<div class="bp-section"><div class="bp-section-title">Fotos (' + fotos.length + ")</div>" +
      '<div class="bp-gal-grid">' + grid + "</div></div>";

    var sel = document.getElementById("bp-gal-prof");
    if (sel) {
      sel.onchange = function () { renderGaleria(sel.value); };
    }
    var add = document.getElementById("bp-gal-add");
    if (add) {
      add.onclick = async function () {
        var pid = (document.getElementById("bp-gal-prof") || {}).value;
        if (!pid) {
          toastMsg("Seleccione um profissional", "error");
          return;
        }
        var file = await pickImage();
        if (!file) return;
        try {
          toastMsg("A processar foto…", "success");
          var dataUrl = await compressFile(file, GALERIA_MAX, JPEG_Q_GAL);
          var thumbUrl = await compressFile(file, GALERIA_THUMB, JPEG_Q);
          var p = getProf(pid);
          var cap = ((document.getElementById("bp-gal-caption") || {}).value || "").trim();
          var galId = uid();
          var entry = {
            id: galId,
            profissional_id: pid,
            profissional_nome: (p && p.nome) || "",
            thumb: thumbUrl,
            url: null,
            caption: cap,
            data: hojeStr(),
            ts: new Date().toISOString()
          };
          if (addFotoGaleria(entry)) {
            toastMsg("Foto adicionada à galeria", "success");
            renderGaleria(pid);
            withTimeout(uploadFotoStorage("galeria/" + pid, galId, dataUrl), UPLOAD_MS).then(function (result) {
              var remoteUrl = result && result.url ? result.url : null;
              if (!remoteUrl) {
                toastUploadOutcome(result || { url: null, error: "upload" });
                return;
              }
              var list = loadGaleria();
              var hit = list.find(function (x) { return x.id === galId; });
              if (!hit || hit.profissional_id !== pid) return;
              hit.url = remoteUrl;
              hit.thumb = remoteUrl;
              hit.updated_at = new Date().toISOString();
              saveGaleria(list);
              upsertGaleriaRemoto(hit);
              renderGaleria(pid);
            });
          }
        } catch (e) {
          console.warn(e);
          toastMsg("Não foi possível processar a imagem.", "error");
        }
      };
    }
    body.querySelectorAll("[data-del-gal]").forEach(function (btn) {
      btn.onclick = function (e) {
        e.stopPropagation();
        (async function () {
          var ok = true;
          if (typeof showConfirmModal === "function") {
            ok = await showConfirmModal(
              "Remover foto?",
              "Esta foto deixa de aparecer na galeria deste profissional. Podes voltar a adicionar outra mais tarde.",
              true,
              { confirmLabel: "Remover", cancelLabel: "Cancelar", variant: "destructive" }
            );
          }
          if (!ok) return;
          var delId = btn.getAttribute("data-del-gal");
          var pidDel = (document.getElementById("bp-gal-prof") || {}).value;
          if (pidDel && delId) removeFotoStorage("galeria/" + pidDel, delId);
          removeFotoGaleria(delId);
          deleteGaleriaRemoto(delId);
          renderGaleria(pidDel);
          toastMsg("Foto removida.", "success");
        })();
      };
    });

    // Lazy load imagens fora do viewport (body no scope de renderGaleria)
    setTimeout(function () {
      try {
        if (body) bpGalObserve(body.querySelector(".bp-gal-grid") || body);
      } catch (_) {}
    }, 30);
  }



  /* ---------- Menu: CRM → Galeria (inject into accordion panel if exists) ---------- */
  function ensureMenuItem() {
    var panel = document.querySelector('.bp-acc-panel[data-acc-panel="crm"]');
    if (panel && !panel.querySelector('[data-bp-action="galeria"]')) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("data-bp-menu", "crm");
      btn.setAttribute("data-bp-action", "galeria");
      btn.innerHTML = "<span>Galeria de serviços</span>";
      panel.appendChild(btn);
    }
    // also listen
    var dd = document.getElementById("menu-dropdown");
    if (dd && !dd.dataset.bpMediaBound) {
      dd.dataset.bpMediaBound = "1";
      dd.addEventListener("click", function (e) {
        var t = e.target.closest('[data-bp-action="galeria"]');
        if (!t) return;
        e.stopPropagation();
        dd.style.display = "none";
        openGaleria();
      });
    }
  }

  /* ---------- observe list re-renders ---------- */
  function observeLists() {
    ["clientes-list", "profissionais-list"].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el || el.dataset.bpAvatarObs) return;
      el.dataset.bpAvatarObs = "1";
      var obs = new MutationObserver(function () {
        setTimeout(enhanceListAvatars, 30);
      });
      obs.observe(el, { childList: true, subtree: true });
    });
  }

  function init() {
    // ET4-P1-02: listeners só uma vez; re-ensure de menus permitido após login
    if (window.__bpMediaInitDone) {
      try {
        if (typeof ensureMenuItem === "function") ensureMenuItem();
        if (typeof enhanceListAvatars === "function") enhanceListAvatars();
      } catch (eRe) {}
      return;
    }
    window.__bpMediaInitDone = true;

    try {
      ensureClientePhotoUI();
      ensureProfPhotoUI();
      hookEditTracking();
      hookSaveButtons();
      observeLists();
      enhanceListAvatars();
      ensureMenuItem();
    } catch (e) {
      console.warn("[media-galeria]", e);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { setTimeout(init, 220); });
  } else setTimeout(init, 220);
  setTimeout(init, 800);
  setTimeout(init, 2000);
  setTimeout(function () { enhanceListAvatars(); ensureMenuItem(); }, 4000);

  // after tab switches
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-tab], .nav-tab, .tab-btn")) {
      setTimeout(enhanceListAvatars, 120);
    }
  });


  // Sync galeria em background quando a app volta online / após login
  window.addEventListener("online", function () {
    setTimeout(function () {
      if (typeof syncGaleriaFull === "function") syncGaleriaFull();
    }, 2000);
  });

  window.openGaleria = openGaleria;
  window.BPMedia = {
    compressFile: compressFile,
    setClienteFoto: setClienteFoto,
    setProfFoto: setProfFoto,
    openGaleria: openGaleria,
    loadGaleria: loadGaleria,
    takePendingProfFoto: function () {
      var f = session.pendingProfFoto;
      var scope = session.pendingProfScope;
      clearProfPending();
      return scope === "new" ? f : null;
    },
    takePendingClienteFoto: function () {
      var f = session.pendingClienteFoto;
      var scope = session.pendingClienteScope;
      clearClientePending();
      return scope === "new" ? f : null;
    },
    peekPendingProfFoto: function () { return session.pendingProfFoto; },
    peekPendingClienteFoto: function () { return session.pendingClienteFoto; },
    syncGaleriaFull: syncGaleriaFull,
    pullGaleriaRemoto: pullGaleriaRemoto,
    enhanceListAvatars: enhanceListAvatars,
    patchRowAvatar: patchRowAvatar,
    resolveFotoSrc: resolveFotoSrc,
    ensureLocalFotoCache: ensureLocalFotoCache,
    uploadFotoStorage: uploadFotoStorage,
    session: session
  };

  window.addEventListener("online", function () {
    setTimeout(function () { flushFotoUploadQueue(); }, 1200);
  });
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible" && navigator.onLine) {
      setTimeout(function () { flushFotoUploadQueue(); }, 1500);
    }
  });
  // Expor para flush global após sync de dados
  if (typeof window !== "undefined") {
    window.bpFlushFotoUploadQueue = flushFotoUploadQueue;
  }

})();

/* ===== FILE: agenda-polish.js ===== */
/* BeautyPro — Agenda cards + acções (Ag-2)
   Hierarquia: Finalizar (primário) · WhatsApp · Cancelar
   Todos os botões: mesma altura, grelha estável, área de toque ≥40px
*/
(function () {
  "use strict";

  function esc(s) {
    return typeof escHtml === "function" ? escHtml(String(s || "")) : String(s || "");
  }
  function money(v) {
    return typeof fmtKz === "function" ? fmtKz(v) : String(v || 0) + " Kz";
  }
  function statusOf(a) {
    if (typeof _statusAg === "function") return _statusAg(a);
    return String((a && (a.status || a.estado)) || "agendado").toLowerCase();
  }
  function profName(a) {
    if (typeof getProfissionalNome === "function") return getProfissionalNome(a.profissional_id);
    return a.profissional || "—";
  }
  function clienteTelefone(ag) {
    var list = (typeof state !== "undefined" && state.clientes) || [];
    var c = list.find(function (x) {
      return (ag.cliente_id && x.id === ag.cliente_id) || (ag.cliente && x.nome === ag.cliente);
    });
    if (!c || !c.telefone) return "";
    return String(c.telefone).replace(/\D/g, "");
  }
  function waHref(ag) {
    var digits = clienteTelefone(ag);
    if (!digits) return "";
    var num = digits.length === 9 ? "244" + digits : digits;
    var msg =
      "Olá " +
      (ag.cliente || "") +
      ", lembrete do seu agendamento de " +
      (ag.servico || "serviço") +
      " no dia " +
      (ag.data || "") +
      " às " +
      String(ag.hora || "").slice(0, 5) +
      ".";
    return "https://wa.me/" + num + "?text=" + encodeURIComponent(msg);
  }

  function renderAgendaItemPro(a, opts) {
    if (!a) return "";
    opts = opts || null;
    var st = statusOf(a);
    var isRealizado = st === "realizado";
    var isCancelado = st === "cancelado";
    var isExpirado = st === "nao_realizado" || st === "nao-realizado" || st === "expirado";
    var isAgendado = st === "agendado";
    var expirado =
      typeof agendamentoExpirado === "function" ? agendamentoExpirado(a) : false;
    var podeFinalizar = isAgendado && !expirado;
    var podeCancelar = isAgendado;
    var podeWhatsApp = isAgendado && !!clienteTelefone(a);

    var statusLabel = "Agendado";
    var statusClass = "bp-ag-st-agendado";
    if (isRealizado) {
      statusLabel = "Realizado";
      statusClass = "bp-ag-st-ok";
    } else if (isCancelado) {
      statusLabel = "Cancelado";
      statusClass = "bp-ag-st-off";
    } else if (isExpirado) {
      statusLabel = "Não realizado";
      statusClass = "bp-ag-st-no";
    }

    var hora = String(a.hora || "").slice(0, 5);
    var nomeProf = profName(a);

    var avHtml =
      '<div class="avatar bp-ag-avatar">' + esc((a.cliente || "?").charAt(0).toUpperCase()) + "</div>";
    try {
      var cli = ((typeof state !== "undefined" && state.clientes) || []).find(function (c) {
        return c.nome === a.cliente || c.id === a.cliente_id;
      });
      var fotoSrc = cli && (window.BPMedia && BPMedia.resolveFotoSrc
        ? BPMedia.resolveFotoSrc(cli)
        : (cli.foto || cli.foto_url));
      if (fotoSrc) {
        avHtml =
          '<div class="avatar bp-avatar-img bp-ag-avatar"><img src="' +
          fotoSrc +
          '" alt="" loading="lazy" decoding="async"></div>';
      } else if (window.BPAvatars && typeof BPAvatars.avatarDataUrl === "function") {
        avHtml =
          '<div class="avatar bp-avatar-img bp-ag-avatar"><img src="' +
          BPAvatars.avatarDataUrl(a.cliente || "") +
          '" alt="" loading="lazy" decoding="async"></div>';
      }
    } catch (e) {}

    var actions = "";
    if (podeFinalizar || podeWhatsApp || podeCancelar) {
      var cells = [];
      if (podeFinalizar) {
        cells.push(
          '<button type="button" class="btn btn-sm btn-primary bp-ag-btn" data-id="' +
            a.id +
            '" data-action="finalizar">Finalizar</button>'
        );
        cells.push(
          '<button type="button" class="btn btn-sm btn-secondary bp-ag-btn" data-id="' +
            a.id +
            '" data-action="reagendar-agenda">Reagendar</button>'
        );
      }
      if (podeWhatsApp) {
        cells.push(
          '<button type="button" class="btn btn-sm bp-btn-whatsapp bp-ag-btn" data-id="' +
            a.id +
            '" data-action="whatsapp-agenda" aria-label="WhatsApp">' +
            '<svg class="bp-ic-wa" width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.5 3.5A11 11 0 004.1 17.6L3 21l3.5-1A11 11 0 1020.5 3.5zM12 20a8 8 0 01-4.1-1.1l-.3-.2-2.4.7.7-2.3-.2-.3A8 8 0 1112 20zm4.4-5.6c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1-.2-.1-1-.4-1.9-1.2-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.4.1-.5l.4-.4c.1-.1.2-.3.2-.4 0-.1 0-.3-.1-.4-.1-.1-.5-1.3-.7-1.8-.2-.5-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2 0 1.2.9 2.3 1 2.5.1.2 1.7 2.6 4.1 3.6.6.3 1 .4 1.4.5.6.2 1.1.2 1.5.1.5-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1-.1-.1-.2-.2-.5-.3z"/></svg>' +
            '<span>WhatsApp</span></button>'
        );
      } else if (podeFinalizar) {
        cells.push(
          '<button type="button" class="btn btn-sm btn-secondary bp-ag-btn" disabled title="Cliente sem telefone">WhatsApp</button>'
        );
      }
      if (podeCancelar) {
        cells.push(
          '<button type="button" class="btn btn-sm btn-secondary bp-ag-btn bp-ag-btn-muted" data-id="' +
            a.id +
            '" data-action="cancelar-agenda" data-role="admin,gerente" aria-label="Cancelar marcação">Cancelar</button>'
        );
      }
      // 1–2 acções: uma linha; 3–4: grelha 2×2 (altura igual, sem desalinhamento)
      var cols = cells.length <= 2 ? cells.length : 2;
      actions =
        '<div class="bp-ag-actions" style="--bp-ag-cols:' +
        cols +
        '">' +
        cells.join("") +
        "</div>";
    }

    var pulseCls = (opts && opts.pulse) ? " bp-ag-card--pulse" : "";
    return (
      '<div class="list-item bp-ag-card' + pulseCls + '" data-agenda-id="' +
      a.id +
      '">' +
      avHtml +
      '<div class="info bp-ag-info">' +
      '<div class="bp-ag-top">' +
      '<span class="bp-ag-time">' +
      esc(hora) +
      "</span>" +
      '<span class="bp-ag-status ' +
      statusClass +
      '">' +
      statusLabel +
      "</span>" +
      "</div>" +
      '<div class="title">' +
      esc(a.servico || "Serviço") +
      "</div>" +
      '<div class="sub">' +
      esc(a.cliente || "Cliente") +
      "</div>" +
      '<div class="bp-ag-meta">' +
      '<span class="bp-ag-prof">' +
      esc(nomeProf) +
      "</span>" +
      '<span class="bp-ag-price">' +
      money(a.preco) +
      "</span>" +
      "</div>" +
      actions +
      "</div></div>"
    );
  }

  function install() {
    try {
      if (typeof renderAgendaItem === "function") renderAgendaItem = renderAgendaItemPro;
    } catch (e) {}
    window.renderAgendaItem = renderAgendaItemPro;
  }

  function init() {
    install();
    try {
      if (typeof renderAgendaFull === "function") {
        var tab = document.getElementById("tab-agenda");
        if (tab && tab.classList.contains("active")) renderAgendaFull();
      }
    } catch (e) {}
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      setTimeout(init, 200);
    });
  } else setTimeout(init, 200);
  setTimeout(init, 1000);

  document.addEventListener("click", function (e) {
    if (e.target.closest('[data-tab="agenda"]')) {
      install();
      setTimeout(function () {
        try {
          if (typeof renderAgendaFull === "function") renderAgendaFull();
        } catch (err) {}
      }, 60);
    }
  });

  window.BPAgendaUI = {
    renderAgendaItemPro: renderAgendaItemPro,
    install: install,
    clienteTelefone: clienteTelefone,
    waHref: waHref,
  };
})();

/* ===== FILE: avatars-listas.js ===== */
// ================================================================
// Avatars realistas nas listas Clientes + Equipa (pós-bundle)
// ================================================================
(function () {
  "use strict";

  function srcFor(nome, foto, entity) {
    if (entity && window.BPMedia && typeof BPMedia.resolveFotoSrc === "function") {
      var r = BPMedia.resolveFotoSrc(entity);
      if (r) return r;
    }
    if (foto) return foto;
    if (entity && entity.foto_url) return entity.foto_url;
    if (window.BPAvatars && typeof BPAvatars.avatarDataUrl === "function") {
      return BPAvatars.avatarDataUrl(nome || "");
    }
    return null;
  }

  function applyAvatar(av, nome, foto, entity) {
    if (!av) return;
    var id = entity && entity.id != null ? String(entity.id) : "";
    var src = srcFor(nome, foto, entity);
    if (!src) return;
    var img = av.querySelector("img");
    // Isolamento: só reutilizar DOM se for a MESMA entidade e o MESMO src
    if (id && av.getAttribute("data-avatar-entity") === id && img && img.getAttribute("src") === src) return;
    if (id) av.setAttribute("data-avatar-entity", id);
    else av.removeAttribute("data-avatar-entity");
    av.classList.add("bp-avatar-img");
    av.innerHTML = '<img src="' + src + '" alt="" loading="lazy" decoding="async"' +
      (id ? ' data-avatar-entity="' + id + '"' : '') + '>';
  }

  function enhanceClientes() {
    try {
      document.querySelectorAll(".cliente-item[data-cliente-id]").forEach(function (row) {
        var id = row.getAttribute("data-cliente-id");
        var c = (state.clientes || []).find(function (x) { return x.id === id; });
        if (!c) return;
        applyAvatar(row.querySelector(".avatar"), c.nome, c.foto, c);
      });
    } catch (e) {}
  }

  function enhanceProfissionais() {
    try {
      document.querySelectorAll(".list-item[data-prof-id]").forEach(function (row) {
        var id = row.getAttribute("data-prof-id");
        // avoid agenda cards if any share attribute — ok for equipa list
        var p = (state.profissionais || []).find(function (x) { return x.id === id; });
        if (!p) return;
        applyAvatar(row.querySelector(".avatar"), p.nome, p.foto, p);
      });
    } catch (e) {}
  }

  function enhanceAll() {
    enhanceClientes();
    enhanceProfissionais();
    syncModalAvatarFallback();
  }

  function wrapRender(name, enhancer) {
    try {
      var fn = window[name];
      if (typeof fn !== "function") {
        // function declarations in bundle are global on window in non-module scripts
        if (typeof globalThis[name] === "function") fn = globalThis[name];
      }
      if (typeof fn !== "function") return false;
      if (fn._bpAvatarWrapped) return true;
      var wrapped = function () {
        var r = fn.apply(this, arguments);
        setTimeout(enhancer, 0);
        setTimeout(enhancer, 50);
        return r;
      };
      wrapped._bpAvatarWrapped = true;
      wrapped._bpOriginal = fn;
      window[name] = wrapped;
      try { globalThis[name] = wrapped; } catch (e) {}
      // overwrite bare binding if possible
      try {
        // eslint-disable-next-line no-eval
        if (typeof eval(name) === "function") {
          // assign via Function scope — in browser global
        }
      } catch (e) {}
      return true;
    } catch (e) {
      return false;
    }
  }

  function install() {
    // Prefer direct assignment — bundle uses function renderClientes() {}
    var ok1 = false, ok2 = false;
    try {
      if (typeof renderClientes === "function" && !renderClientes._bpAvatarWrapped) {
        var origC = renderClientes;
        renderClientes = function () {
          var r = origC.apply(this, arguments);
          setTimeout(enhanceClientes, 0);
          setTimeout(enhanceClientes, 40);
          return r;
        };
        renderClientes._bpAvatarWrapped = true;
        window.renderClientes = renderClientes;
        ok1 = true;
      }
    } catch (e) {}
    try {
      if (typeof renderProfissionais === "function" && !renderProfissionais._bpAvatarWrapped) {
        var origP = renderProfissionais;
        renderProfissionais = function () {
          var r = origP.apply(this, arguments);
          setTimeout(enhanceProfissionais, 0);
          setTimeout(enhanceProfissionais, 40);
          return r;
        };
        renderProfissionais._bpAvatarWrapped = true;
        window.renderProfissionais = renderProfissionais;
        ok2 = true;
      }
    } catch (e) {}
    wrapRender("renderClientes", enhanceClientes);
    wrapRender("renderProfissionais", enhanceProfissionais);
    enhanceAll();
    return ok1 || ok2;
  }

  function observe() {
    ["clientes-list", "profissionais-list"].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el || el.dataset.bpAvListObs) return;
      el.dataset.bpAvListObs = "1";
      var obs = new MutationObserver(function () {
        setTimeout(enhanceAll, 10);
      });
      obs.observe(el, { childList: true, subtree: true });
    });
  }

  function init() {
    install();
    observe();
    enhanceAll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      setTimeout(init, 200);
    });
  } else {
    setTimeout(init, 200);
  }
  setTimeout(init, 800);
  setTimeout(init, 2000);
  setTimeout(init, 5000);

  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-tab], .nav-item, .tab-btn, #tab-clientes, #tab-equipa")) {
      setTimeout(enhanceAll, 100);
      setTimeout(enhanceAll, 300);
    }
  });

  // Fallback de avatar no modal: SÓ quando BPMedia não preencheu foto real.
  // Sem setInterval — evita race e vazamento visual entre registos.
  function syncModalAvatarFallback() {
    try {
      var cli = document.getElementById("modal-cliente");
      if (cli && cli.classList.contains("open")) {
        var prevC = document.getElementById("bp-cli-foto-preview");
        var hid = document.getElementById("cliente-id");
        var cid = hid && hid.value ? String(hid.value).trim() : "";
        var nomeC = (document.getElementById("cliente-nome") || {}).value;
        if (prevC && !prevC.classList.contains("has-img") && nomeC && window.BPAvatars) {
          // Não injectar se já há foto real no state
          var ent = cid && (state.clientes || []).find(function (x) { return String(x.id) === cid; });
          if (ent && window.BPMedia && BPMedia.resolveFotoSrc && BPMedia.resolveFotoSrc(ent)) return;
          var src = BPAvatars.avatarDataUrl(nomeC);
          prevC.setAttribute("data-foto-for", cid || "new");
          prevC.innerHTML = '<img src="' + src + '" alt="" data-foto-for="' + (cid || "new") + '">';
          prevC.classList.add("has-img", "bp-avatar-fallback");
        }
      }
      var pr = document.getElementById("modal-prof");
      if (pr && pr.classList.contains("open")) {
        var prevP = document.getElementById("bp-prof-foto-preview");
        var hidP = document.getElementById("prof-id");
        var pid = hidP && hidP.value ? String(hidP.value).trim() : "";
        var nomeP = (document.getElementById("prof-nome") || {}).value;
        if (prevP && !prevP.classList.contains("has-img") && nomeP && window.BPAvatars) {
          var entP = pid && (state.profissionais || []).find(function (x) { return String(x.id) === pid; });
          if (entP && window.BPMedia && BPMedia.resolveFotoSrc && BPMedia.resolveFotoSrc(entP)) return;
          var src2 = BPAvatars.avatarDataUrl(nomeP);
          prevP.setAttribute("data-foto-for", pid || "new");
          prevP.innerHTML = '<img src="' + src2 + '" alt="" data-foto-for="' + (pid || "new") + '">';
          prevP.classList.add("has-img", "bp-avatar-fallback");
        }
      }
    } catch (e) {}
  }

  window.BPAvatarsListas = { enhanceAll: enhanceAll, install: install };
})();

/* ===== FILE: desktop-shell.js ===== */
/**
 * Desktop shell (≥1024px)
 * - Remove top bar legada
 * - Sidebar: brand + módulos (8 grupos) + Sair
 * - Agenda master-detail
 * - Faixa de atenção no Resumo
 * Mobile permanece intacto.
 */
(function () {
  "use strict";

  // ---- Utils ----
  function isDesktop() {
    try {
      return !!(window.matchMedia && window.matchMedia("(min-width: 1024px)").matches);
    } catch (e) {
      return false;
    }
  }

  function esc(s) {
    if (typeof escHtml === "function") return escHtml(String(s == null ? "" : s));
    return String(s == null ? "" : s);
  }

  function money(v) {
    return typeof fmtKz === "function" ? fmtKz(v) : Math.round(Number(v) || 0) + " Kz";
  }

  function goTab(tab) {
    var btn = document.querySelector('.nav-item[data-tab="' + tab + '"]');
    if (btn) btn.click();
  }

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  // ---- Top bar (removida a pedido do produto) ----
  function removeLegacyTopbar() {
    var bar = qs(".bp-desk-topbar");
    if (bar && bar.parentNode) bar.parentNode.removeChild(bar);
  }

  // ---- Sidebar brand ----
  function ensureSidebarBrand() {
    var nav = qs(".bottom-nav");
    if (!nav || qs(".bp-side-brand", nav)) return;

    var brand = document.createElement("div");
    brand.className = "bp-side-brand";
    brand.innerHTML =
      '<div class="bp-side-logo">BP</div>' +
      '<div class="bp-side-meta">' +
        '<span class="bp-side-name">BeautyPro</span>' +
        '<span class="bp-side-sub">Gestão</span>' +
      "</div>";
    nav.insertBefore(brand, nav.firstChild);
  }

  // ---- Central de Operações (sidebar desktop) ----
  function restoreMenuToHeader() {
    var side = document.getElementById("bp-side-modules");
    var logoutWrap = document.getElementById("bp-side-logout");
    var divider = document.getElementById("bp-side-ops-divider");
    var dd = document.getElementById("menu-dropdown");
    if (!dd) return;

    var host = qs(".header-actions div");
    var logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn && dd && !dd.contains(logoutBtn)) {
      dd.appendChild(logoutBtn);
    }
    if (side && host && !host.contains(dd)) {
      host.appendChild(dd);
      dd.style.cssText = "";
      dd.style.display = "none";
      dd.classList.remove("bp-side-menu-dd");
    }
    if (side) side.remove();
    if (logoutWrap) logoutWrap.remove();
    if (divider) divider.remove();
  }

  function styleDropdownAsSideMenu(dd) {
    dd.classList.add("bp-side-menu-dd");
    dd.style.display = "block";
    dd.style.position = "static";
    dd.style.minWidth = "0";
    dd.style.width = "100%";
    dd.style.boxShadow = "none";
    dd.style.border = "none";
    dd.style.background = "transparent";
    dd.style.padding = "0";
  }

  function setOpsOpen(wrap, open) {
    wrap.classList.toggle("is-open", open);
    var trigger = document.getElementById("bp-side-ops-trigger");
    var opsBody = document.getElementById("bp-side-ops-body");
    if (trigger) {
      trigger.setAttribute("aria-expanded", open ? "true" : "false");
    }
    if (opsBody) {
      opsBody.hidden = !open;
    }
  }

  function ensureSideLogout(nav) {
    var logoutBtn = document.getElementById("logout-btn");
    if (!logoutBtn) return;

    var wrap = document.getElementById("bp-side-logout");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.id = "bp-side-logout";
      wrap.className = "bp-side-logout";
    }
    if (!wrap.contains(logoutBtn)) wrap.appendChild(logoutBtn);
    if (!nav.contains(wrap)) {
      var toggle = document.getElementById("bp-side-toggle");
      if (toggle) nav.insertBefore(wrap, toggle);
      else nav.appendChild(wrap);
    }
  }

  function ensureSideModules() {
    if (!isDesktop()) {
      restoreMenuToHeader();
      return;
    }

    var nav = qs(".bottom-nav");
    var dd = document.getElementById("menu-dropdown");
    if (!nav || !dd) return;

    // Linha divisória estratégica (após tabs, incl. IA)
    var divider = document.getElementById("bp-side-ops-divider");
    if (!divider) {
      divider = document.createElement("div");
      divider.id = "bp-side-ops-divider";
      divider.className = "bp-side-ops-divider";
      divider.setAttribute("role", "separator");
      divider.setAttribute("aria-hidden", "true");
    }

    var wrap = document.getElementById("bp-side-modules");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.id = "bp-side-modules";
      wrap.className = "bp-side-modules";
      wrap.innerHTML =
        '<button type="button" class="bp-side-ops-trigger" id="bp-side-ops-trigger" aria-expanded="false" aria-controls="bp-side-ops-body">' +
          '<span class="bp-side-ops-icon" aria-hidden="true">' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
              '<rect x="3" y="3" width="7" height="7" rx="1"/>' +
              '<rect x="14" y="3" width="7" height="7" rx="1"/>' +
              '<rect x="3" y="14" width="7" height="7" rx="1"/>' +
              '<rect x="14" y="14" width="7" height="7" rx="1"/>' +
            "</svg>" +
          "</span>" +
          '<span class="bp-side-ops-text">' +
            '<span class="bp-side-ops-title">Central de Operações</span>' +
            '<span class="bp-side-ops-hint">Toque para abrir</span>' +
          "</span>" +
          '<span class="bp-side-ops-chevron" aria-hidden="true">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><polyline points="9 6 15 12 9 18"/></svg>' +
          "</span>" +
        "</button>" +
        '<div class="bp-side-ops-body" id="bp-side-ops-body" hidden></div>';
    }

    // Ordem: …tabs → divider → Central → Sair → (toggle sidebar)
    var sideToggle = document.getElementById("bp-side-toggle");
    if (!nav.contains(divider)) {
      if (sideToggle) nav.insertBefore(divider, sideToggle);
      else nav.appendChild(divider);
    }
    if (!nav.contains(wrap)) {
      if (sideToggle) nav.insertBefore(wrap, sideToggle);
      else nav.appendChild(wrap);
    }

    var opsBody = document.getElementById("bp-side-ops-body");
    if (opsBody && !opsBody.contains(dd)) opsBody.appendChild(dd);
    styleDropdownAsSideMenu(dd);

    // Sair FORA da central (sempre visível)
    ensureSideLogout(nav);

    var trigger = document.getElementById("bp-side-ops-trigger");
    if (trigger && trigger.dataset.bound !== "1") {
      trigger.dataset.bound = "1";
      trigger.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        var open = trigger.getAttribute("aria-expanded") !== "true";
        setOpsOpen(wrap, open);
      });
    }
  }

  // ---- Agenda master-detail ----
  function ensureAgendaWorkspace() {
    if (!isDesktop()) return;
    var list = document.getElementById("agenda-full-list");
    if (!list || list.closest(".bp-agenda-workspace")) return;

    var parent = list.parentNode;
    var workspace = document.createElement("div");
    workspace.className = "bp-agenda-workspace";

    var listCol = document.createElement("div");
    listCol.className = "bp-agenda-list-col";

    var detail = document.createElement("div");
    detail.className = "bp-agenda-detail is-empty";
    detail.id = "bp-agenda-detail";
    detail.innerHTML = "<p>Selecione um agendamento na lista.</p>";

    parent.insertBefore(workspace, list);
    listCol.appendChild(list);
    workspace.appendChild(listCol);
    workspace.appendChild(detail);
  }

  function statusLabelAg(ag) {
    var st = (ag && (ag.status || ag.estado)) || "";
    st = String(st).toLowerCase();
    if (st === "realizado") return "Realizado";
    if (st === "cancelado") return "Cancelado";
    if (st === "nao_realizado" || st === "nao-realizado") return "Não realizado";
    if (st === "agendado" || !st) return "Agendado";
    return st;
  }

  function findAgendamentoById(id) {
    if (!id || typeof state === "undefined") return null;
    var list = state.agendamentos || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i] && String(list[i].id) === String(id)) return list[i];
    }
    return null;
  }

  function buildAgendaDetailHtml(ag) {
    if (!ag) return "";
    var prof = "";
    try {
      if (typeof getProfissionalNome === "function") prof = getProfissionalNome(ag.profissional_id) || "";
    } catch (e) {}
    if (!prof) prof = ag.profissional || "—";
    var nota = ag.notas || ag.nota || ag.observacao || ag.obs || "";
    return (
      '<div class="bp-ad-time">' + esc(String(ag.hora || "").slice(0, 5)) + " · " + esc(ag.data || "") + "</div>" +
      '<div class="bp-ad-title">' + esc(ag.servico || "Agendamento") + "</div>" +
      '<div class="bp-ad-row"><span>Cliente</span><span>' + esc(ag.cliente || "—") + "</span></div>" +
      '<div class="bp-ad-row"><span>Profissional</span><span>' + esc(prof) + "</span></div>" +
      '<div class="bp-ad-row"><span>Estado</span><span>' + esc(statusLabelAg(ag)) + "</span></div>" +
      '<div class="bp-ad-row"><span>Valor</span><span>' + money(ag.preco != null ? ag.preco : ag.valor) + "</span></div>" +
      (nota
        ? '<div class="bp-ad-row bp-ad-nota"><span>Notas</span><span>' + esc(nota) + "</span></div>"
        : "") +
      '<p class="bp-ad-hint">Use os botões no cartão para finalizar, reagendar ou cancelar.</p>'
    );
  }

  function showAgendaDetail(ag) {
    var detail = document.getElementById("bp-agenda-detail");
    if (!detail || !ag) return;
    detail.classList.remove("is-empty");
    detail.innerHTML = buildAgendaDetailHtml(ag);
  }

  function ensureMobileAgendaSheet() {
    var el = document.getElementById("bp-ag-mobile-sheet");
    if (el) return el;
    el = document.createElement("div");
    el.id = "bp-ag-mobile-sheet";
    el.className = "bp-ag-mobile-sheet";
    el.hidden = true;
    el.innerHTML =
      '<div class="bp-ag-mobile-backdrop" data-ag-close="1"></div>' +
      '<div class="bp-ag-mobile-panel" role="dialog" aria-modal="true" aria-label="Detalhe do agendamento">' +
        '<div class="bp-ag-mobile-handle" aria-hidden="true"></div>' +
        '<div class="bp-ag-mobile-body" id="bp-ag-mobile-body"></div>' +
        '<button type="button" class="btn btn-secondary bp-ag-mobile-close" data-ag-close="1">Fechar</button>' +
      "</div>";
    document.body.appendChild(el);
    el.addEventListener("click", function (ev) {
      if (ev.target.closest("[data-ag-close]")) {
        el.hidden = true;
      }
    });
    return el;
  }

  function showAgendaDetailMobile(ag) {
    var sheet = ensureMobileAgendaSheet();
    var sheetBody = document.getElementById("bp-ag-mobile-body");
    if (!sheetBody || !ag) return;
    sheetBody.innerHTML = buildAgendaDetailHtml(ag);
    sheet.hidden = false;
  }

  /**
   * Cards: data-agenda-id.
   * Desktop → painel lateral; Mobile → sheet de detalhe.
   */
  function bindAgendaClicks() {
    if (document.body.dataset.bpAgDesk === "1") return;
    document.body.dataset.bpAgDesk = "1";

    document.addEventListener("click", function (e) {
      if (e.target.closest("button, a, input, select, label, [data-action]")) return;

      var card = e.target.closest(".bp-ag-card[data-agenda-id], .list-item[data-agenda-id]");
      if (!card) return;

      var inAgenda =
        card.closest("#agenda-full-list") ||
        card.closest("#agenda-today-list");
      if (!inAgenda) return;

      var id = card.getAttribute("data-agenda-id");
      var ag = findAgendamentoById(id);
      if (!ag) return;

      document.querySelectorAll(".bp-ag-card.is-selected").forEach(function (el) {
        el.classList.remove("is-selected");
      });
      card.classList.add("is-selected");

      if (isDesktop()) {
        ensureAgendaWorkspace();
        showAgendaDetail(ag);
      } else {
        showAgendaDetailMobile(ag);
      }
    });
  }

  // ---- Resumo: faixa de atenção ----
  function ensureDashAttention() {
    if (!isDesktop()) return;
    var pane = document.getElementById("tab-dashboard");
    if (!pane || qs(".bp-desk-attention", pane)) return;

    var strip = document.createElement("div");
    strip.className = "bp-desk-attention";
    strip.id = "bp-desk-attention";
    var inner = qs(".tab-inner", pane) || pane;
    inner.insertBefore(strip, inner.firstChild);
    refreshDashAttention();
  }

  function refreshDashAttention() {
    var strip = document.getElementById("bp-desk-attention");
    if (!strip || typeof state === "undefined") return;

    var hoje = typeof window.hoje === "function" ? window.hoje() : "";
    var ags = (state.agendamentos || []).filter(function (a) {
      return a && a.data === hoje;
    });
    var pend = ags.filter(function (a) {
      return a.status === "agendado" || !a.status;
    }).length;
    var vendas = (state.movimentos || []).filter(function (m) {
      return m && m.tipo === "venda" && m.data === hoje;
    });
    var rec = vendas.reduce(function (s, m) {
      return s + (Number(m.valor) || 0);
    }, 0);

    strip.innerHTML =
      '<div class="bp-att-card"><div class="bp-att-label">Agenda hoje</div><div class="bp-att-value">' + ags.length + "</div></div>" +
      '<div class="bp-att-card"><div class="bp-att-label">Por realizar</div><div class="bp-att-value' + (pend ? " is-alert" : "") + '">' + pend + "</div></div>" +
      '<div class="bp-att-card"><div class="bp-att-label">Receita hoje</div><div class="bp-att-value">' + money(rec) + "</div></div>";
  }

  // ---- Atalhos numéricos 1–5 (tabs) ----
  function bindKeys() {
    if (document.body.dataset.bpDeskKeys === "1") return;
    document.body.dataset.bpDeskKeys = "1";

    document.addEventListener("keydown", function (e) {
      if (!isDesktop()) return;
      var tag = (e.target && e.target.tagName) || "";
      var typing =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        (e.target && e.target.isContentEditable);
      if (typing) return;

      var map = { "1": "dashboard", "2": "agenda", "3": "clientes", "4": "caixa", "5": "equipa" };
      if (map[e.key]) goTab(map[e.key]);
    });
  }

  // ---- Ciclo de vida ----
  function mount() {
    if (!qs(".app-container")) return;
    removeLegacyTopbar();
    ensureSidebarBrand();
    ensureSideModules();
    ensureAgendaWorkspace();
    bindAgendaClicks();
    ensureDashAttention();
    bindKeys();
  }

  function init() {
    try {
      mount();
    } catch (e) {
      console.warn("[desktop-shell]", e);
    }
  }

  function scheduleInit() {
    init();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      setTimeout(scheduleInit, 250);
    });
  } else {
    setTimeout(scheduleInit, 250);
  }
  // Menu acordeão pode montar depois
  setTimeout(scheduleInit, 1000);
  setTimeout(scheduleInit, 3000);
  document.addEventListener("bp-menu-accordion-ready", function () {
    try { ensureSideModules(); } catch (e) {}
  });

  window.addEventListener("resize", function () {
    removeLegacyTopbar();
    try {
      ensureSideModules();
    } catch (e) {}
  });

  document.addEventListener("click", function (e) {
    if (!e.target.closest(".nav-item[data-tab]")) return;
    setTimeout(function () {
      ensureAgendaWorkspace();
      bindAgendaClicks();
      try {
        ensureSideModules();
      } catch (err) {}
      if (qs('.nav-item[data-tab="dashboard"].active')) {
        ensureDashAttention();
        refreshDashAttention();
      }
    }, 120);
  });

  setInterval(function () {
    if (isDesktop() && qs("#tab-dashboard.active")) refreshDashAttention();
  }, 8000);

  window.BPDesktopShell = {
    mount: mount,
    showAgendaDetail: showAgendaDetail
  };
})();

/* ===== FILE: desktop-enterprise.js ===== */
/**
 * BeautyPro — Desktop Enterprise (≥1024px)
 * Preferências, palette, atalhos, multi-select, context menu, pop-out.
 * Sem virtualização agressiva (listas re-renderizam e partiam o layout).
 * Modais desktop via CSS @media — não re-envolve openModal (evita conflito com a11y).
 */
(function () {
  'use strict';

  var PREFS_KEY = 'bp_desk_prefs_v1';
  var defaultPrefs = {
    density: 'comfortable',
    sidebarCollapsed: false,
    shortcutsEnabled: true
  };

  function isDesktop() {
    try {
      return !!(window.matchMedia && window.matchMedia('(min-width: 1024px)').matches);
    } catch (e) {
      return false;
    }
  }

  function loadPrefs() {
    try {
      var raw = localStorage.getItem(PREFS_KEY);
      if (!raw) return Object.assign({}, defaultPrefs);
      return Object.assign({}, defaultPrefs, JSON.parse(raw));
    } catch (e) {
      return Object.assign({}, defaultPrefs);
    }
  }

  function savePrefs(p) {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(p));
    } catch (e) {}
  }

  var prefs = loadPrefs();

  function applyPrefs() {
    var root = document.documentElement;
    root.setAttribute('data-desk-density', prefs.density || 'comfortable');
    root.setAttribute('data-desk-sidebar', prefs.sidebarCollapsed ? 'collapsed' : 'expanded');
    root.classList.toggle('bp-is-desktop', isDesktop());
    var container = document.querySelector('.app-container');
    if (container) {
      container.classList.toggle('bp-sidebar-collapsed', isDesktop() && !!prefs.sidebarCollapsed);
    }
  }

  function goTab(tab) {
    var btn = document.querySelector('.nav-item[data-tab="' + tab + '"]');
    if (btn) btn.click();
  }

  function triggerNovaVenda() {
    var el =
      document.getElementById('bp-desk-nova') ||
      document.getElementById('nova-venda-hero-btn') ||
      document.querySelector('.fab');
    if (el) el.click();
  }

  function popOut(tab) {
    try {
      var base = location.href.split('#')[0];
      var w = window.open(
        base + '#bp-pop=' + encodeURIComponent(tab),
        'bp_' + tab,
        'noopener,noreferrer,width=1280,height=800'
      );
      if (!w && typeof toast === 'function') toast('Permita pop-ups para multi-janela', 'error');
    } catch (e) {
      if (typeof toast === 'function') toast('Não foi possível abrir janela', 'error');
    }
  }

  function toggleSidebar() {
    if (!isDesktop()) return;
    prefs.sidebarCollapsed = !prefs.sidebarCollapsed;
    savePrefs(prefs);
    applyPrefs();
  }

  function toggleDensity() {
    prefs.density = prefs.density === 'compact' ? 'comfortable' : 'compact';
    savePrefs(prefs);
    applyPrefs();
  }

  /* ----- Command palette ----- */
  var cmdIndex = 0;
  var cmdFiltered = [];

  function commands() {
    return [
      { id: 'dash', label: 'Ir para Resumo', keys: 'g r', run: function () { goTab('dashboard'); } },
      { id: 'agenda', label: 'Ir para Agenda', keys: 'g a', run: function () { goTab('agenda'); } },
      { id: 'cli', label: 'Ir para Clientes', keys: 'g c', run: function () { goTab('clientes'); } },
      { id: 'caixa', label: 'Ir para Caixa', keys: 'g x', run: function () { goTab('caixa'); } },
      { id: 'eq', label: 'Ir para Equipa', keys: 'g e', run: function () { goTab('equipa'); } },
      { id: 'ia', label: 'Ir para IA', keys: 'g i', run: function () { goTab('ia'); } },
      { id: 'venda', label: 'Nova venda', keys: 'n', run: function () { triggerNovaVenda(); } },
      { id: 'pop-a', label: 'Agenda em outra janela', keys: '', run: function () { popOut('agenda'); } },
      { id: 'pop-x', label: 'Caixa em outra janela', keys: '', run: function () { popOut('caixa'); } },
      { id: 'pop-r', label: 'Resumo em outra janela', keys: '', run: function () { popOut('dashboard'); } },
      { id: 'side', label: 'Recolher / expandir menu', keys: '[', run: function () { toggleSidebar(); } },
      { id: 'den', label: 'Alternar densidade', keys: '', run: function () { toggleDensity(); } },
      { id: 'csv', label: 'Exportar análise CSV', keys: '', run: function () {
        if (typeof exportarAnaliseCsv === 'function') {
          exportarAnaliseCsv(window.__bpUltimaAnaliseTemporal);
        } else if (typeof toast === 'function') {
          toast('Exportação indisponível neste ecrã', 'error');
        }
      } }
    ];
  }

  function ensurePalette() {
    if (document.getElementById('bp-cmd-palette')) return;
    var el = document.createElement('div');
    el.id = 'bp-cmd-palette';
    el.className = 'bp-cmd-palette';
    el.hidden = true;
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML =
      '<div class="bp-cmd-backdrop" data-cmd-close="1"></div>' +
      '<div class="bp-cmd-dialog" role="dialog" aria-modal="true" aria-label="Command palette">' +
        '<input type="search" id="bp-cmd-input" class="bp-cmd-input" placeholder="Comando ou pesquisa..." autocomplete="off" />' +
        '<ul id="bp-cmd-list" class="bp-cmd-list" role="listbox"></ul>' +
        '<div class="bp-cmd-hint">↑↓ · Enter · Esc</div>' +
      '</div>';
    document.body.appendChild(el);
    el.querySelector('[data-cmd-close]').addEventListener('click', closePalette);
  }

  function openPalette() {
    if (!isDesktop()) return;
    ensurePalette();
    var el = document.getElementById('bp-cmd-palette');
    el.hidden = false;
    el.setAttribute('aria-hidden', 'false');
    cmdIndex = 0;
    renderCmdList('');
    var input = document.getElementById('bp-cmd-input');
    if (input) {
      input.value = '';
      setTimeout(function () { try { input.focus(); } catch (e) {} }, 20);
    }
  }

  function closePalette() {
    var el = document.getElementById('bp-cmd-palette');
    if (!el) return;
    el.hidden = true;
    el.setAttribute('aria-hidden', 'true');
  }

  function renderCmdList(q) {
    q = String(q || '').toLowerCase().trim();
    cmdFiltered = commands().filter(function (c) {
      if (!q) return true;
      return c.label.toLowerCase().indexOf(q) >= 0 || String(c.keys || '').indexOf(q) >= 0;
    });
    if (cmdIndex >= cmdFiltered.length) cmdIndex = Math.max(0, cmdFiltered.length - 1);
    var ul = document.getElementById('bp-cmd-list');
    if (!ul) return;
    ul.innerHTML = cmdFiltered.map(function (c, i) {
      return (
        '<li class="bp-cmd-item' + (i === cmdIndex ? ' is-active' : '') + '" data-idx="' + i + '" role="option">' +
        '<span>' + c.label.replace(/</g, '&lt;') + '</span>' +
        (c.keys ? '<kbd>' + c.keys + '</kbd>' : '') +
        '</li>'
      );
    }).join('');
    ul.querySelectorAll('.bp-cmd-item').forEach(function (li) {
      li.addEventListener('mousedown', function (e) {
        e.preventDefault();
        runCmd(Number(li.getAttribute('data-idx')));
      });
    });
  }

  function runCmd(idx) {
    var c = cmdFiltered[idx];
    closePalette();
    if (c && typeof c.run === 'function') {
      try { c.run(); } catch (err) { console.warn('[bp-cmd]', err); }
    }
  }

  /* ----- Context menu ----- */
  function ensureCtx() {
    if (document.getElementById('bp-ctx-menu')) return;
    var m = document.createElement('div');
    m.id = 'bp-ctx-menu';
    m.className = 'bp-ctx-menu';
    m.hidden = true;
    document.body.appendChild(m);
  }

  function hideCtx() {
    var m = document.getElementById('bp-ctx-menu');
    if (m) m.hidden = true;
  }

  function showCtx(x, y, items) {
    ensureCtx();
    var m = document.getElementById('bp-ctx-menu');
    m.innerHTML = items.map(function (it, i) {
      if (it === '-') return '<div class="bp-ctx-sep"></div>';
      return '<button type="button" class="bp-ctx-item" data-i="' + i + '">' + String(it.label).replace(/</g, '&lt;') + '</button>';
    }).join('');
    m.hidden = false;
    var left = Math.min(x, window.innerWidth - 210);
    var top = Math.min(y, window.innerHeight - 16 - Math.max(items.length, 1) * 36);
    m.style.left = Math.max(8, left) + 'px';
    m.style.top = Math.max(8, top) + 'px';
    m.querySelectorAll('.bp-ctx-item').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var i = Number(btn.getAttribute('data-i'));
        hideCtx();
        if (items[i] && typeof items[i].run === 'function') items[i].run();
      });
    });
  }

  /* ----- Multi-select (só com modificador) ----- */
  var selectedIds = Object.create(null);
  var selectedCount = 0;

  function clearSelection() {
    selectedIds = Object.create(null);
    selectedCount = 0;
    document.querySelectorAll('.is-multi-selected').forEach(function (el) {
      el.classList.remove('is-multi-selected');
    });
    updateSelectionBar();
  }

  function updateSelectionBar() {
    var bar = document.getElementById('bp-multi-bar');
    if (!bar) return;
    bar.hidden = selectedCount === 0 || !isDesktop();
    var label = bar.querySelector('.bp-multi-count');
    if (label) {
      label.textContent =
        selectedCount === 1 ? '1 selecionado' : selectedCount + ' selecionados';
    }
  }

  function ensureSelectionBar() {
    if (document.getElementById('bp-multi-bar')) return;
    var bar = document.createElement('div');
    bar.id = 'bp-multi-bar';
    bar.className = 'bp-multi-bar';
    bar.hidden = true;
    bar.innerHTML =
      '<span class="bp-multi-count">0</span>' +
      '<button type="button" class="btn btn-sm btn-secondary" id="bp-multi-clear">Limpar</button>';
    document.body.appendChild(bar);
    document.getElementById('bp-multi-clear').addEventListener('click', clearSelection);
  }

  function bindListMultiSelect() {
    if (document.body.dataset.bpMulti === '1') return;
    document.body.dataset.bpMulti = '1';
    document.addEventListener('click', function (e) {
      if (!isDesktop()) return;
      if (!e.shiftKey && !e.ctrlKey && !e.metaKey) return;
      if (e.target.closest('button, a, input, select, textarea, label, [data-action]')) return;
      var row = e.target.closest(
        '.list-item[data-id], .list-item[data-agenda-id], .bp-ag-card[data-id], .bp-ag-card[data-agenda-id], tr[data-id]'
      );
      if (!row) return;
      e.preventDefault();
      e.stopPropagation();
      var id = row.getAttribute('data-id') || row.getAttribute('data-agenda-id');
      if (!id) return;
      if (selectedIds[id]) {
        delete selectedIds[id];
        selectedCount = Math.max(0, selectedCount - 1);
        row.classList.remove('is-multi-selected');
      } else {
        selectedIds[id] = true;
        selectedCount += 1;
        row.classList.add('is-multi-selected');
      }
      ensureSelectionBar();
      updateSelectionBar();
    });
  }

  function bindDoubleClick() {
    if (document.body.dataset.bpDbl === '1') return;
    document.body.dataset.bpDbl = '1';
    document.addEventListener('dblclick', function (e) {
      if (!isDesktop()) return;
      var row = e.target.closest('.list-item[data-id], .list-item[data-agenda-id], .bp-ag-card[data-id], .bp-ag-card[data-agenda-id]');
      if (!row || e.target.closest('button, a, input')) return;
      // um único click sintético se o handler de linha não tiver corrido no 2.º clique
      try {
        row.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
      } catch (err) {
        row.click();
      }
    });
  }

  function bindContext() {
    if (document.body.dataset.bpCtx === '1') return;
    document.body.dataset.bpCtx = '1';
    document.addEventListener('contextmenu', function (e) {
      if (!isDesktop()) return;
      var row = e.target.closest('.list-item[data-id], .list-item[data-agenda-id], .bp-ag-card[data-id], .bp-ag-card[data-agenda-id]');
      if (!row) return;
      e.preventDefault();
      var id = row.getAttribute('data-id') || row.getAttribute('data-agenda-id') || '';
      showCtx(e.clientX, e.clientY, [
        {
          label: 'Abrir',
          run: function () {
            try {
              row.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
            } catch (err) {
              row.click();
            }
          }
        },
        {
          label: 'Copiar ID',
          run: function () {
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(id).catch(function () {});
            }
          }
        },
        '-',
        { label: 'Clientes em outra janela', run: function () { popOut('clientes'); } }
      ]);
    });
    document.addEventListener('click', hideCtx);
    document.addEventListener('scroll', hideCtx, true);
  }

  /* ----- Keyboard ----- */
  var goPending = false;
  var goTimer = null;

  function bindKeys() {
    if (document.body.dataset.bpEntKeys === '1') return;
    document.body.dataset.bpEntKeys = '1';

    document.addEventListener('keydown', function (e) {
      if (!prefs.shortcutsEnabled) return;

      var tag = (e.target && e.target.tagName) || '';
      var typing =
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        (e.target && e.target.isContentEditable);

      // Palette: sempre disponível em desktop
      if (isDesktop() && (e.ctrlKey || e.metaKey) && !e.altKey && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        openPalette();
        return;
      }

      var palette = document.getElementById('bp-cmd-palette');
      var paletteOpen = palette && !palette.hidden;

      if (e.key === 'Escape') {
        if (paletteOpen) {
          e.preventDefault();
          closePalette();
          return;
        }
        if (selectedCount > 0) {
          clearSelection();
          return;
        }
        hideCtx();
        return;
      }

      if (paletteOpen) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          cmdIndex = Math.min(cmdIndex + 1, Math.max(0, cmdFiltered.length - 1));
          renderCmdList((document.getElementById('bp-cmd-input') || {}).value || '');
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          cmdIndex = Math.max(cmdIndex - 1, 0);
          renderCmdList((document.getElementById('bp-cmd-input') || {}).value || '');
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          runCmd(cmdIndex);
          return;
        }
        return;
      }

      if (!isDesktop()) return;

      if (typing) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          var iaTab = document.getElementById('tab-ia');
          var send = document.getElementById('ia-enviar');
          if (iaTab && iaTab.classList.contains('active') && send) {
            e.preventDefault();
            send.click();
          }
        }
        return;
      }

      if ((e.key === 'n' || e.key === 'N') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        triggerNovaVenda();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        triggerNovaVenda();
        return;
      }
      if (e.key === '[' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      if (e.key === 'g' && !e.ctrlKey && !e.metaKey) {
        goPending = true;
        if (goTimer) clearTimeout(goTimer);
        goTimer = setTimeout(function () {
          goPending = false;
        }, 700);
        return;
      }
      if (goPending && !e.ctrlKey && !e.metaKey) {
        var map = { r: 'dashboard', a: 'agenda', c: 'clientes', x: 'caixa', e: 'equipa', i: 'ia' };
        if (map[e.key]) {
          e.preventDefault();
          goPending = false;
          goTab(map[e.key]);
        }
      }
    });

    document.addEventListener('input', function (e) {
      if (e.target && e.target.id === 'bp-cmd-input') {
        cmdIndex = 0;
        renderCmdList(e.target.value);
      }
    });
  }

  /* ----- Pop-out hash ----- */
  function handlePopHash() {
    var m = (location.hash || '').match(/bp-pop=([a-z]+)/);
    if (!m) return;
    document.documentElement.classList.add('bp-popout');
    var tab = m[1];
    setTimeout(function () {
      goTab(tab);
    }, 700);
  }

  function syncSideToggle() {
    var nav = document.querySelector('.bottom-nav');
    var existing = document.getElementById('bp-side-toggle');
    if (!isDesktop()) {
      if (existing) existing.remove();
      return;
    }
    if (!nav || existing) return;
    var t = document.createElement('button');
    t.id = 'bp-side-toggle';
    t.type = 'button';
    t.className = 'bp-side-toggle';
    t.title = 'Recolher menu ([)';
    t.setAttribute('aria-label', 'Recolher ou expandir menu');
    t.textContent = '⟨';
    t.addEventListener('click', function (e) {
      e.preventDefault();
      toggleSidebar();
    });
    nav.appendChild(t);
  }

  function mount() {
    applyPrefs();
    ensurePalette();
    ensureCtx();
    ensureSelectionBar();
    bindKeys();
    bindListMultiSelect();
    bindDoubleClick();
    bindContext();
    handlePopHash();
    syncSideToggle();
  }

  var mounted = false;
  function init() {
    if (!document.querySelector('.app-container') && !document.body) return;
    try {
      mount();
      mounted = true;
    } catch (e) {
      console.warn('[desktop-enterprise]', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(init, 300);
    });
  } else {
    setTimeout(init, 300);
  }
  setTimeout(init, 1200);

  var resizeTimer = null;
  window.addEventListener('resize', function () {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      applyPrefs();
      syncSideToggle();
      updateSelectionBar();
      if (!isDesktop()) {
        closePalette();
        hideCtx();
        clearSelection();
      }
    }, 150);
  });

  window.BPDesktopEnterprise = {
    openPalette: openPalette,
    closePalette: closePalette,
    popOut: popOut,
    clearSelection: clearSelection,
    prefs: function () {
      return Object.assign({}, prefs);
    },
    savePrefs: function (p) {
      prefs = Object.assign({}, prefs, p || {});
      savePrefs(prefs);
      applyPrefs();
    }
  };
})();

/* ===== FILE: security-hardening.js ===== */
// ================================================================
// BeautyPro — Security & Sync Hardening (tombstones, silent sync)
// Padrões: offline-first queue, tombstone TTL, throttled pull
// ================================================================
(function () {
  "use strict";

  var PULL_MIN_MS = 4000; // alinhado com SYNC_POLL_MS em main.js (era 90000 — causa da demora sem reload)
  var lastPullAt = 0;
  var pullInFlight = false;

  function safeToast(msg, type) {
    if (typeof toast === "function") toast(msg, type || "info");
  }

  /** Pull remoto silencioso — sem updateUI em cascata se nada mudou. */
  window.bpSilentPull = async function bpSilentPull(force) {
    if (!navigator.onLine) return false;
    if (!state || !state.config || !state.config.salaoId) return false;
    var now = Date.now();
    if (!force && (now - lastPullAt) < PULL_MIN_MS) return false;
    if (pullInFlight) return false;
    pullInFlight = true;
    try {
      if (typeof flushSyncQueue === "function") {
        await flushSyncQueue();
      }
      var dadosMudaram = false;
      if (typeof carregarDoSupabase === "function") {
        dadosMudaram = !!(await carregarDoSupabase());
      }
      lastPullAt = Date.now();
      if (typeof atualizarIndicadorSync === "function") atualizarIndicadorSync();
      /* Badge de plano / limites: se o pull reportou mudança (incl. plano) */
      if (dadosMudaram) {
        try { if (typeof renderPlanoInfo === "function") renderPlanoInfo(); } catch (_) {}
      }
      try {
        if (typeof bpFlushFotoUploadQueue === "function") await bpFlushFotoUploadQueue();
      } catch (_) {}
      return true;
    } catch (e) {
      if (typeof logErroSilencioso === "function") logErroSilencioso("bpSilentPull", e);
      return false;
    } finally {
      pullInFlight = false;
    }
  };

  // Visibility: sync silencioso ao voltar, com throttle
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") {
      setTimeout(function () { window.bpSilentPull(false); }, 800);
    }
  });

  // Online event
  window.addEventListener("online", function () {
    setTimeout(function () { window.bpSilentPull(true); }, 500);
  });

  // Guard: impedir upsert de IDs na blacklist se API global existir
  var origFlush = window.flushSyncQueue;
  // no-op wrap if needed later

  console.info("[bp-hardening] activo — tombstones + pull throttled 4s");
})();
