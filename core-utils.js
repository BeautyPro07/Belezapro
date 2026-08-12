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
  el.classList.remove('open');
  el.style.display = '';
  el.style.pointerEvents = '';
  document.body.classList.remove('bp-modal-open');
}

function openModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  try { el.hidden = false; } catch (_) {}
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
  opts = opts || {};
  var mode = opts.mode || 'ok'; // ok | offline
  var duration = opts.duration != null ? opts.duration : 1000;
  return new Promise(function (resolve) {
    var el = document.getElementById('bp-checkmark-overlay');
    if (!el) { resolve(); return; }
    var text = document.getElementById('bp-checkmark-text');
    var icon = el.querySelector('.bp-checkmark-icon');
    el.classList.remove('is-offline', 'is-animating', 'is-open');
    if (mode === 'offline') {
      el.classList.add('is-offline');
      if (text) text.textContent = 'Offline';
      if (icon) {
        icon.innerHTML =
          '<svg class="bp-checkmark-svg" viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
          '<path d="M16 30a10 10 0 0 1 16-6 7 7 0 0 1 2 14H16a7 7 0 0 1 0-14z"/>' +
          '<line x1="18" y1="18" x2="30" y2="30"/><line x1="30" y1="18" x2="18" y2="30"/>' +
          '</svg>';
      }
    } else {
      if (text) text.textContent = opts.label || 'Sincronizado';
      if (icon) {
        icon.innerHTML =
          '<svg class="bp-checkmark-svg" viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
          '<circle class="bp-checkmark-circle" cx="24" cy="24" r="20"></circle>' +
          '<polyline class="bp-checkmark-poly" points="14,24 22,32 34,18"></polyline>' +
          '</svg>';
      }
    }
    el.hidden = false;
    try { el.removeAttribute('hidden'); } catch (_) {}
    el.setAttribute('aria-hidden', 'false');
    el.style.display = 'flex';
    requestAnimationFrame(function () {
      el.classList.add('is-open', 'is-animating');
    });
    clearTimeout(showCheckmark._t);
    showCheckmark._t = setTimeout(function () {
      hideCheckmark().then(resolve);
    }, duration);
  });
}
function hideCheckmark() {
  return new Promise(function (resolve) {
    var el = document.getElementById('bp-checkmark-overlay');
    if (!el) { resolve(); return; }
    el.classList.remove('is-open', 'is-animating');
    setTimeout(function () {
      el.hidden = true;
      try { el.setAttribute('hidden', ''); } catch (_) {}
      el.setAttribute('aria-hidden', 'true');
      el.style.display = 'none';
      resolve();
    }, 280);
  });
}
if (typeof window !== 'undefined') {
  window.showCheckmark = showCheckmark;
  window.hideCheckmark = hideCheckmark;
}
