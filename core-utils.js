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
