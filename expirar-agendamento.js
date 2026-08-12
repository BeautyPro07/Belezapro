// ====================================================================
//  expirar-agendamento.js — Etapa 2: alerta 5 min antes de expirar
// ====================================================================

var BP_ALERT_VISTO_PREFIX = 'bp_alert_visto_';
var BP_EXPIRING_WINDOW_MS = 5 * 60 * 1000;
var BP_EXPIRING_INTERVAL_MS = 30000;
var _bpExpiringTimer = null;
var _bpExpiringBusy = false;
var _bpExpiringCurrentId = null;

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
  try {
    localStorage.setItem(bpAlertVistoKey(id), 'true');
  } catch (_) {}
}

function bpClearAlertVisto(id) {
  if (!id) return;
  try {
    localStorage.removeItem(bpAlertVistoKey(id));
  } catch (_) {}
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
  if (typeof _parseAgDateTime === 'function') return _parseAgDateTime(data, hora);
  var hh = String(hora || '00:00').slice(0, 5);
  var dt = new Date(String(data) + 'T' + hh + ':00');
  return isNaN(dt.getTime()) ? null : dt;
}

/**
 * ms restantes até data+hora. null = inválido/não aplicável; <=0 = já passou.
 */
function bpIsAppointmentExpiring(ag, nowMs) {
  if (!ag) return null;
  var st = String(ag.status || ag.estado || 'agendado').toLowerCase();
  if (st !== 'agendado') return null;
  var dt = bpParseAgDtLocal(ag.data, ag.hora);
  if (!dt) return null;
  var now = nowMs != null ? nowMs : Date.now();
  return dt.getTime() - now;
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
  return best;
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
    if (!app) return true;
    var d = app.style.display;
    if (d === 'none') return false;
  } catch (_) {}
  return true;
}

function bpCloseExpirarModal() {
  _bpExpiringCurrentId = null;
  if (typeof closeModal === 'function') {
    closeModal('modal-expirar');
  } else {
    var m = document.getElementById('modal-expirar');
    if (m) {
      m.classList.remove('open', 'is-open');
      m.style.display = '';
      m.setAttribute('aria-hidden', 'true');
    }
  }
}

function bpShowExpirarModal(ag) {
  if (!ag || !ag.id) return;
  if (!bpAppShellVisible()) return;
  if (bpAnyBlockingModalOpen()) return;

  var remain = bpIsAppointmentExpiring(ag);
  if (remain == null || remain <= 0 || remain > BP_EXPIRING_WINDOW_MS) return;
  if (bpIsAlertVisto(ag.id)) return;

  var modal = document.getElementById('modal-expirar');
  if (!modal) return;

  _bpExpiringCurrentId = ag.id;
  var nome = ag.cliente || 'Cliente';
  var nomeEl = document.getElementById('expirar-cliente-nome');
  if (nomeEl) nomeEl.textContent = nome;

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
    } else {
      btn.disabled = true;
      btn.classList.add('is-disabled');
      btn.style.opacity = '0.4';
      btn.setAttribute('aria-disabled', 'true');
      delete btn.dataset.tel;
    }
  }
  setTelBtn(btnLigar, !!tel);
  setTelBtn(btnWa, !!tel);

  if (typeof openModal === 'function') {
    openModal('modal-expirar');
  } else {
    modal.style.display = 'flex';
    modal.classList.add('open', 'is-open');
    modal.setAttribute('aria-hidden', 'false');
  }
}

function bpCheckExpiringAppointments() {
  if (_bpExpiringBusy) return;
  _bpExpiringBusy = true;
  try {
    if (!bpAppShellVisible()) return;
    if (bpIsExpirarModalOpen()) {
      // Modal aberto: se o agendamento actual já não é válido, fechar
      if (_bpExpiringCurrentId) {
        var cur = null;
        if (typeof state !== 'undefined' && state.agendamentos) {
          cur = state.agendamentos.find(function (a) {
            return a && String(a.id) === String(_bpExpiringCurrentId);
          });
        }
        var rem = cur ? bpIsAppointmentExpiring(cur) : null;
        if (!cur || rem == null || rem <= 0 || bpIsAlertVisto(_bpExpiringCurrentId)) {
          bpCloseExpirarModal();
        } else {
          return;
        }
      } else {
        return;
      }
    }
    if (bpAnyBlockingModalOpen()) return;

    requestAnimationFrame(function () {
      try {
        var ag = bpGetClosestExpiring();
        if (ag) bpShowExpirarModal(ag);
      } catch (e) {
        console.warn('[expirar] check', e);
      } finally {
        _bpExpiringBusy = false;
      }
    });
  } catch (e2) {
    console.warn('[expirar] check outer', e2);
    _bpExpiringBusy = false;
  }
}

function bpBindExpirarModalOnce() {
  var modal = document.getElementById('modal-expirar');
  if (!modal || modal.dataset.bpBound === '1') return;
  modal.dataset.bpBound = '1';

  var ligar = document.getElementById('expirar-ligar');
  var wa = document.getElementById('expirar-whatsapp');
  var ignorar = document.getElementById('expirar-ignorar');

  if (ligar && !ligar.dataset.bpBound) {
    ligar.dataset.bpBound = '1';
    ligar.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (ligar.disabled || ligar.classList.contains('is-disabled')) return;
      var tel = ligar.dataset.tel || '';
      if (!tel) return;
      // Spec: abrir telefone; modal permanece para permitir Ignorar ou novo check após fecho
      try {
        window.location.href = 'tel:' + tel;
      } catch (_) {}
    });
  }
  if (wa && !wa.dataset.bpBound) {
    wa.dataset.bpBound = '1';
    wa.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (wa.disabled || wa.classList.contains('is-disabled')) return;
      var tel = bpNormTelWa(wa.dataset.tel || '');
      if (!tel) return;
      try {
        window.open('https://wa.me/' + tel, '_blank', 'noopener,noreferrer');
      } catch (_) {}
    });
  }
  if (ignorar && !ignorar.dataset.bpBound) {
    ignorar.dataset.bpBound = '1';
    ignorar.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (_bpExpiringCurrentId) bpMarkAlertVisto(_bpExpiringCurrentId);
      bpCloseExpirarModal();
      setTimeout(function () {
        bpCheckExpiringAppointments();
      }, 400);
    });
  }
}

function bpStartExpiringWatcher() {
  bpBindExpirarModalOnce();
  if (_bpExpiringTimer) {
    clearInterval(_bpExpiringTimer);
    _bpExpiringTimer = null;
  }
  _bpExpiringTimer = setInterval(function () {
    bpCheckExpiringAppointments();
  }, BP_EXPIRING_INTERVAL_MS);
  setTimeout(function () {
    bpCheckExpiringAppointments();
  }, 2500);
}

if (typeof window !== 'undefined') {
  window.bpCheckExpiringAppointments = bpCheckExpiringAppointments;
  window.bpStartExpiringWatcher = bpStartExpiringWatcher;
  window.bpIsAppointmentExpiring = bpIsAppointmentExpiring;
  window.bpGetClosestExpiring = bpGetClosestExpiring;
  window.bpClearAlertVisto = bpClearAlertVisto;
  window.bpMarkAlertVisto = bpMarkAlertVisto;
}
