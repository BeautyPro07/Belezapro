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