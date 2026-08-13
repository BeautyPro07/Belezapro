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
