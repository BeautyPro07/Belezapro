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
function bpMarkSessionLocal(salaoId) {
  try {
    if (salaoId) localStorage.setItem('bp_salao_id_cache', String(salaoId));
    localStorage.setItem('bp_session_active', '1');
    localStorage.removeItem('bp_logged_out');
  } catch (_) {}
}
function bpClearSessionLocal() {
  try {
    localStorage.setItem('bp_logged_out', '1');
    localStorage.removeItem('bp_session_active');
    localStorage.removeItem('bp_salao_id_cache');
  } catch (_) {}
}
function bpHasLocalSession() {
  try {
    if (localStorage.getItem('bp_logged_out') === '1') return false;
    if (localStorage.getItem('bp_session_active') === '1' && localStorage.getItem('bp_salao_id_cache')) return true;
  } catch (_) {}
  return false;
}
function bpShowAppShell() {
  try {
    var login = document.getElementById('login-view');
    var app = document.getElementById('app-view');
    if (login) login.style.display = 'none';
    if (app) app.style.display = 'flex';
  } catch (_) {}
  bpHideSplashNow();
}
function bpShowLoginShell() {
  try {
    var login = document.getElementById('login-view');
    var app = document.getElementById('app-view');
    if (app) app.style.display = 'none';
    if (login) login.style.display = 'flex';
  } catch (_) {}
  bpHideSplashNow();
}

supabaseClient.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' && !logoutVoluntarioEmCurso) {
    // Offline: token pode "expirar" na lib — NÃO expulsar se há sessão local
    if (!navigator.onLine && bpHasLocalSession()) {
      console.warn('[auth] SIGNED_OUT offline ignorado — manter app local');
      return;
    }
    // Online sem sessão local explícita: pedir login
    if (!bpHasLocalSession()) {
      document.querySelectorAll('.modal-overlay.active, .modal-overlay.open').forEach(function (m) {
        m.classList.remove('active');
        m.classList.remove('open');
      });
      bpShowLoginShell();
      if (typeof toast === 'function') toast('A sua sessão expirou. Inicie sessão novamente.', 'error');
    }
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
    bpShowAppShell();
    bpMarkSessionLocal(cachedSalao);

    // Dados locais — não bloquear splash (já escondido)
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

    // Rede só em background, timeout curto, sem segundo getSession eterno
    if (navigator.onLine) {
      setTimeout(function () {
        bpWithTimeout(supabaseClient.auth.getSession(), 1500, 'getSession_bg')
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
            if (typeof bpSilentPull === 'function') return bpSilentPull(true);
            if (typeof carregarDoSupabase === 'function') return carregarDoSupabase();
          })
          .then(function () {
            if (typeof updateUI === 'function') updateUI();
            if (typeof atualizarIndicadorSync === 'function') atualizarIndicadorSync();
          })
          .catch(function (err) {
            console.warn('[boot] background (ignorado offline/lento)', err && err.message);
          });
      }, 300);
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
      setTimeout(function () {
        Promise.resolve()
          .then(function () { return typeof sincronizarConfigDoServidor === 'function' ? sincronizarConfigDoServidor() : null; })
          .then(function () { return typeof bpSilentPull === 'function' ? bpSilentPull(true) : null; })
          .then(function () {
            if (typeof updateUI === 'function') updateUI();
          })
          .catch(function () {});
      }, 400);
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
      state.config.plano       = rows[0].plano || 'trial';
      state.config.trialInicio = rows[0].trial_inicio || state.config.trialInicio;
      try { localStorage.setItem('bp_plano_cache', state.config.plano); } catch (_) {}
      await saveConfig();
      if (typeof renderPlanoInfo === 'function') renderPlanoInfo();
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