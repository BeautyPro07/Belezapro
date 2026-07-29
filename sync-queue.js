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

function atualizarIndicadorSync() {
  const dot  = document.getElementById('sync-dot');
  const text = document.getElementById('sync-text');
  if (!dot || !text) return;
  if (!navigator.onLine) { dot.classList.remove('online'); text.textContent = 'Offline'; return; }
  const fila = getSyncQueue();
  const pendentes = fila.filter(op => op.failed !== true).length;
  const falhados = fila.length - pendentes;
  dot.classList.add('online');
  text.textContent = pendentes > 0
    ? `Online (${pendentes} pendente${pendentes > 1 ? 's' : ''})`
    : (falhados > 0 ? `Online (${falhados} com falha)` : 'Online');
}

function addToSyncQueue(tabela, operacao, payload) {
  const q = getSyncQueue().filter(item => !(item.tabela === tabela && item.payload?.id === payload?.id));
  q.push({ id: uuid(), tabela, operacao, payload, ts: Date.now(), attempts: 0 });
  saveSyncQueue(q);
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
        // Tombstone permanece na lista negra (TTL) para impedir reimportação
        // em pulls concurrentes multi-dispositivo (padrão tombstone/eventual consistency).
        await supabaseDelete(op.tabela, op.payload.id);
        // NÃO chamar removeDeletedItem aqui — só após TTL ou purge remoto confirmado.
        if (typeof touchDeletedItem === 'function') touchDeletedItem(op.payload.id, op.tabela);
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
    } catch (err) {
      // Se for erro de limite de plano, reverter a escrita local e relançar
      if (err.message === 'LIMITE_PLANO_ATINGIDO') {
        await _dbDeleteOriginal(store, item.id);
        // Remover do estado local (será feito pelo chamador)
        throw err;
      }
      // Outros erros: enfileirar para tentar depois
      addToSyncQueue(tabela, 'upsert', item);
    }
  } else {
    addToSyncQueue(tabela, 'upsert', item);
  }
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