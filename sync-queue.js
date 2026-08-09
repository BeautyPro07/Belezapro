// ====================================================================
//  FILA DE SINCRONIZAÇÃO (extraído do app.js na Fase B da modularização)
// ====================================================================

// ================================================================
//  LISTA NEGRA DE ELIMINADOS (evita reimportação)
// ================================================================
const DELETED_KEY = 'bp_deleted_items';

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
  try {
    const str = JSON.stringify(q);
    if (typeof storageSetSecure === 'function') storageSetSecure(SYNC_QUEUE_KEY, str);
    else localStorage.setItem(SYNC_QUEUE_KEY, str);
    // ET4.6: espelho em sessionStorage como contingência leve (não substitui IDB)
    try { sessionStorage.setItem(SYNC_QUEUE_KEY + '_len', String((q && q.length) || 0)); } catch (_) {}
  } catch (e) {
    // Quota cheia: manter o máximo possível; nunca silenciar perda total
    logErroSilencioso('saveSyncQueue', e);
    try {
      // Tentar gravar só metadados + últimos N se o payload for enorme
      if (q && q.length > 100) {
        const slim = q.map(function (op) {
          return {
            id: op.id,
            tabela: op.tabela,
            operacao: op.operacao,
            ts: op.ts,
            attempts: op.attempts,
            failed: op.failed,
            nextRetry: op.nextRetry,
            payload: op.payload
          };
        });
        localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(slim));
      }
    } catch (e2) {
      logErroSilencioso('saveSyncQueue.fallback', e2);
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
  const pendentes = fila.filter(function (op) { return op && op.failed !== true; }).length;
  const falhados = fila.filter(function (op) { return op && op.failed === true; }).length;
  const offline = (typeof navigator !== 'undefined' && !navigator.onLine);

  let stateKey = 'ok';
  let label = '';
  if (offline) {
    stateKey = 'offline';
    label = pendentes > 0 ? ('Sem rede · ' + pendentes + ' pend.') : 'Sem rede';
  } else if (pendentes > 0) {
    stateKey = 'pending';
    label = pendentes === 1 ? '1 pendente' : (pendentes + ' pendentes');
  } else if (falhados > 0) {
    stateKey = 'error';
    label = falhados === 1 ? '1 falha' : (falhados + ' falhas');
  } else if (typeof bpGetServiceHealth === 'function') {
    // ET4.10: sem labels de «servidor instável» no header (relatório + pedido do produto).
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
  const q = getSyncQueue().filter(function (item) {
    return !(item.tabela === tabela && item.payload && payload && item.payload.id === payload.id);
  });
  q.push({
    id: typeof uuid === 'function' ? uuid() : String(Date.now()),
    tabela: tabela,
    operacao: operacao,
    payload: payload,
    ts: Date.now(),
    attempts: 0,
    failed: false
  });
  // ET4.5: fila sem teto — nunca descartar ops (pedido de produto)
  saveSyncQueue(q);
  if (typeof atualizarIndicadorSync === 'function') atualizarIndicadorSync();
}

async function flushSyncQueue() {
  if (!navigator.onLine) return;
  if (flushSyncQueue._running) return;
  flushSyncQueue._running = true;

  // ET4.6: filas grandes (600+) em lotes — progresso gravado, sem conflitos por "tudo ou nada"
  const BATCH_SIZE = 25;
  const MAX_ATTEMPTS = 8;
  const YIELD_MS = 30;

  try {
    let q = getSyncQueue();
    if (!q.length) return;

    const itensFalhos = [];
    let processed = 0;
    let interrompido = false;

    while (q.length && navigator.onLine && !interrompido) {
      const batch = [];
      const defer = [];
      for (let i = 0; i < q.length; i++) {
        const op = q[i];
        if (!op) continue;
        if (op.failed === true) {
          defer.push(op);
          continue;
        }
        if (op.nextRetry && Date.now() < op.nextRetry) {
          defer.push(op);
          continue;
        }
        if (batch.length < BATCH_SIZE) batch.push(op);
        else defer.push(op);
      }

      if (!batch.length) {
        // Só backoff/falhas — sair para não spin
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
            const success = await supabaseDelete(op.tabela, op.payload.id);
            if (success && typeof removeDeletedItem === 'function') {
              removeDeletedItem(op.payload.id, op.tabela);
            }
          } else {
            if (typeof isDeletedItem === 'function' && isDeletedItem(op.payload && op.payload.id, op.tabela)) {
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
              await supabaseUpsert(op.tabela, op.payload);
            }
          }
          processed++;
        } catch (err) {
          if (err && err.message === 'LIMITE_PLANO_ATINGIDO') {
            if (typeof toast === 'function') toast('Operação bloqueada: limite do plano atingido.', 'error');
            continue;
          }
          if (err && (err.message === 'DUPLICADO_BLOQUEADO' || String(err.message || '').indexOf('DUPLICADO') >= 0)) {
            if (typeof logErroSilencioso === 'function') logErroSilencioso('flushSyncQueue.duplicado', err);
            // não retentar em loop
            op.failed = true;
            op.attempts = MAX_ATTEMPTS;
            itensFalhos.push(op.id || 'item');
            restantesBatch.push(op);
            continue;
          }
          op.attempts = (op.attempts || 0) + 1;
          if (op.attempts >= MAX_ATTEMPTS) {
            op.failed = true;
            itensFalhos.push(op.id || 'item');
            restantesBatch.push(op);
          } else {
            const delay = Math.min(Math.pow(2, op.attempts) * 1000, 60000) + Math.random() * 1000;
            op.nextRetry = Date.now() + delay;
            restantesBatch.push(op);
          }
        }
      }

      // Persistir progresso após cada lote (crítico com 600+)
      q = restantesBatch.concat(defer);
      saveSyncQueue(q);
      if (typeof atualizarIndicadorSync === 'function') atualizarIndicadorSync();

      // Ceder à UI entre lotes
      await new Promise(function (r) { setTimeout(r, YIELD_MS); });
    }

    if (itensFalhos.length > 0 && typeof toast === 'function') {
      toast('Falha ao sincronizar ' + itensFalhos.length + ' operação(ões) após várias tentativas. Toque no indicador de sync para reintentar.', 'error');
    }
    if (processed > 0 && typeof logErroSilencioso === 'function') {
      try { console.info('[sync] flush processou', processed, 'ops; restam', getSyncQueue().length); } catch (_) {}
    }
    if (typeof atualizarIndicadorSync === 'function') atualizarIndicadorSync();
  } finally {
    flushSyncQueue._running = false;
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
  // ET4-P0-04: sem salaoId não há sync remoto (isolamento multi-tenant)
  if (!tabela || !state.config || !state.config.salaoId) {
    if (tabela && (!state.config || !state.config.salaoId)) {
      try { console.warn('[sync-queue] dbPut sem salaoId — apenas local:', store, item && item.id); } catch (_) {}
    }
    return item;
  }

  if (navigator.onLine) {
    try {
      await supabaseUpsert(tabela, item);
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

/** Contingência: reabrir ops failed (ex. destituir) e tentar de novo. */
async function bpRetryFailedSync() {
  const q = getSyncQueue();
  let changed = false;
  for (const op of q) {
    if (op.failed) {
      op.failed = false;
      op.attempts = 0;
      op.nextRetry = 0;
      changed = true;
    }
  }
  if (changed) {
    saveSyncQueue(q);
    if (typeof flushSyncQueue === 'function') await flushSyncQueue();
  }
}
if (typeof window !== 'undefined') {
  window.bpRetryFailedSync = bpRetryFailedSync;
  // ET4.2-P1-sync-retry: toque no indicador tenta reenviar falhas + flush
  (function bindSyncRetryClick() {
    var el = document.getElementById('sync-status-container');
    if (!el || el.dataset.bpSyncRetryBound) return;
    el.dataset.bpSyncRetryBound = '1';
    el.style.cursor = 'pointer';
    el.title = el.title || 'Toque para tentar sincronizar novamente';
    el.addEventListener('click', function () {
      if (!navigator.onLine) {
        if (typeof toast === 'function') toast('Sem ligação à internet neste momento. As alterações serão enviadas quando voltares a ter rede.', 'warning');
        return;
      }
      if (typeof toast === 'function') toast('A sincronizar alterações…', 'info');
      Promise.resolve()
        .then(function () { return typeof bpRetryFailedSync === 'function' ? bpRetryFailedSync() : null; })
        .then(function () { return typeof flushSyncQueue === 'function' ? flushSyncQueue() : null; })
        .then(function () {
          if (typeof atualizarIndicadorSync === 'function') atualizarIndicadorSync();
        })
        .catch(function (e) {
          if (typeof logErroSilencioso === 'function') logErroSilencioso('syncRetryClick', e);
        });
    });
  })();

  window.addEventListener('online', function () {
    try { sessionStorage.removeItem('bp_offline_info_ack'); } catch (_) {}
    setTimeout(function () {
      if (typeof bpRetryFailedSync === 'function') bpRetryFailedSync();
    }, 1500);
  });
}
