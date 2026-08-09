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
