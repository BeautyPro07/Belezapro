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
