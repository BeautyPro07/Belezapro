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
  } catch (e) { logErroSilencioso('saveSyncQueue', e); }
}

function actualizarBannerOffline() {
  const banner = document.getElementById('offline-banner');
  const txt = document.getElementById('offline-banner-text');
  if (!banner) return;
  if (navigator.onLine) {
    banner.classList.remove('show');
    return;
  }
  banner.classList.add('show');
  if (txt) {
    const fila = getSyncQueue();
    const n = fila.filter(function (op) { return op.failed !== true; }).length;
    txt.textContent = n > 0
      ? ('Modo offline — ' + n + (n === 1 ? ' alteração' : ' alterações') + ' serão enviadas ao reconectar')
      : 'Modo offline — dados guardados neste dispositivo';
  }
}

function atualizarIndicadorSync() {
  const dot  = document.getElementById('sync-dot');
  const text = document.getElementById('sync-text');
  const container = document.getElementById('sync-status-container');
  const fila = getSyncQueue();
  const pendentes = fila.filter(function (op) { return op.failed !== true; }).length;
  const falhados = fila.filter(function (op) { return op.failed === true; }).length;

  if (dot && text) {
    if (!navigator.onLine) {
      dot.classList.remove('online');
      text.textContent = pendentes > 0
        ? ('Offline · ' + pendentes + ' pend.')
        : 'Offline';
    } else {
      dot.classList.add('online');
      if (pendentes > 0) {
        text.textContent = pendentes + (pendentes === 1 ? ' pendente' : ' pendentes');
      } else if (falhados > 0) {
        text.textContent = falhados + (falhados === 1 ? ' falha' : ' falhas');
      } else {
        text.textContent = 'Sincronizado';
      }
    }
  }

  if (container) {
    container.style.display = 'flex';
    container.setAttribute('data-state',
      !navigator.onLine ? 'offline' : (pendentes > 0 ? 'pending' : (falhados > 0 ? 'error' : 'ok'))
    );
  }

  actualizarBannerOffline();
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
  saveSyncQueue(q);
  if (typeof atualizarIndicadorSync === 'function') atualizarIndicadorSync();
}

async function flushSyncQueue() {
  const q = getSyncQueue();
  if (q.length === 0) return;

  const MAX_ATTEMPTS = 5;
  const restantes = [];
  let interrompido = false;
  const itensFalhos = [];

  for (let i = 0; i < q.length; i++) {
    const op = q[i];

    if (op.failed === true) {
      restantes.push(op);
      continue;
    }

    if (interrompido) {
      restantes.push(op);
      continue;
    }

    // Respeitar o backoff exponencial
    if (op.nextRetry && Date.now() < op.nextRetry) {
      restantes.push(op);
      continue;
    }

    try {
      if (op.operacao === 'delete') {
        const success = await supabaseDelete(op.tabela, op.payload.id);
        if (success) {
          removeDeletedItem(op.payload.id, op.tabela);  // só remover tombstone se delete remoto OK
        }
      } else {
        // Nunca fazer upsert de item na lista negra
        if (typeof isDeletedItem === 'function' && isDeletedItem(op.payload?.id, op.tabela)) {
          continue;
        }
        await supabaseUpsert(op.tabela, op.payload);
      }
    } catch (err) {
      // ================================================================
      //  TRATAMENTO PARA LIMITE DE PLANO (não retentar)
      // ================================================================
      if (err.message === 'LIMITE_PLANO_ATINGIDO') {
        toast('Operação bloqueada: limite do plano atingido.', 'error');
        // Não colocar de volta na fila – descartar definitivamente
        continue;
      }

      if (err.message === 'SESSION_EXPIRED') {
        restantes.push(op);
        for (let j = i + 1; j < q.length; j++) {
          restantes.push(q[j]);
        }
        saveSyncQueue(restantes);
        await supabaseClient.auth.signOut();
        interrompido = true;
        break;
      }

      op.attempts = (op.attempts || 0) + 1;

      if (op.attempts >= MAX_ATTEMPTS) {
        op.failed = true;
        itensFalhos.push(op.id || 'item');
        restantes.push(op);
      } else {
        const delay = Math.min(Math.pow(2, op.attempts) * 1000, 60000) + Math.random() * 1000;
        op.nextRetry = Date.now() + delay;
        restantes.push(op);
      }
    }
  }

  if (!interrompido) {
    saveSyncQueue(restantes);
  }

  if (itensFalhos.length > 0) {
    const msg = `Falha ao sincronizar ${itensFalhos.length} operação(ões) após ${MAX_ATTEMPTS} tentativas. Contacte o suporte.`;
    toast(msg, 'error');
  }
  if (typeof atualizarIndicadorSync === 'function') atualizarIndicadorSync();
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
  if (!tabela || !state.config.salaoId) return item;

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

  if (!tabela || !state.config.salaoId) return;
  if (navigator.onLine) {
    try { await supabaseDelete(tabela, id); }
    catch { addToSyncQueue(tabela, 'delete', { id }); }
  } else {
    addToSyncQueue(tabela, 'delete', { id });
  }
};