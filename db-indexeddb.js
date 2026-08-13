// ====================================================================
//  DB — INDEXEDDB + CACHE LOCAL ROBUSTO (write-through + fallback)
//  - IndexedDB = fonte primária
//  - localStorage `bp_${store}` = espelho para recuperação / private mode
//  - Cache em memória de curta duração para leituras repetidas no mesmo ciclo
// ====================================================================
let db = null;
const STORES = ['config', 'clientes', 'agendamentos', 'movimentos', 'profissionais', 'servicos', 'fechos_caixa'];

/** Memória: evita getAll repetidos no mesmo tick de UI */
const _memCache = Object.create(null);
const MEM_TTL_MS = 800;

function _lsKey(store) {
  return 'bp_' + store;
}

function _memInvalidate(store) {
  if (store) delete _memCache[store];
  else Object.keys(_memCache).forEach(function (k) { delete _memCache[k]; });
}

function _memGet(store) {
  const e = _memCache[store];
  if (!e) return null;
  if (Date.now() - e.ts > MEM_TTL_MS) {
    delete _memCache[store];
    return null;
  }
  return e.data;
}

function _memSet(store, data) {
  _memCache[store] = { ts: Date.now(), data: Array.isArray(data) ? data : [] };
}

function _readLSMirror(store) {
  try {
    const raw = localStorage.getItem(_lsKey(store));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function _writeLSMirror(store, items) {
  try {
    localStorage.setItem(_lsKey(store), JSON.stringify(Array.isArray(items) ? items : []));
    return true;
  } catch (e) {
    // Quota ou modo privado: tentar espelho mínimo (últimos 200) para stores grandes
    try {
      const arr = Array.isArray(items) ? items : [];
      if (arr.length > 200) {
        localStorage.setItem(_lsKey(store), JSON.stringify(arr.slice(-200)));
        return true;
      }
    } catch (e2) {}
    return false;
  }
}

function _mirrorUpsert(store, item) {
  if (!item || item.id == null) return;
  const items = _readLSMirror(store);
  const idx = items.findIndex(function (i) { return i && i.id === item.id; });
  if (idx !== -1) items[idx] = item;
  else items.push(item);
  _writeLSMirror(store, items);
}

function _mirrorDelete(store, id) {
  const items = _readLSMirror(store).filter(function (i) { return i && i.id !== id; });
  _writeLSMirror(store, items);
}

/** Rehidrata IndexedDB a partir do espelho (quando IDB está vazio e LS tem dados). */
async function _rehydrateStoreFromMirror(store, mirror) {
  if (!db || !mirror || !mirror.length) return;
  try {
    const tx = db.transaction(store, 'readwrite');
    const os = tx.objectStore(store);
    for (let i = 0; i < mirror.length; i++) {
      const it = mirror[i];
      if (it && it.id != null) os.put(it);
    }
    await new Promise(function (res, rej) {
      tx.oncomplete = res;
      tx.onerror = function () { rej(tx.error); };
      tx.onabort = function () { rej(tx.error); };
    });
  } catch (e) {
    console.warn('[BPCache] rehydrate failed:', store, e);
  }
}

function openDB() {
  return new Promise(function (res, rej) {
    try {
      const req = indexedDB.open('BelezaProDB', 8);
      req.onupgradeneeded = function (e) {
        const d = e.target.result;
        STORES.forEach(function (s) {
          if (!d.objectStoreNames.contains(s)) d.createObjectStore(s, { keyPath: 'id' });
        });
      };
      req.onsuccess = function (e) {
        db = e.target.result;
        db.onversionchange = function () {
          try { db.close(); } catch (err) {}
          db = null;
        };
        res(db);
      };
      req.onerror = function (e) { rej(e.target.error); };
    } catch (err) {
      rej(err);
    }
  });
}

async function dbGetAll(store) {
  const cached = _memGet(store);
  if (cached) return cached.slice();

  let fromIdb = null;
  try {
    if (db) {
      const tx = db.transaction(store, 'readonly');
      const r = tx.objectStore(store).getAll();
      fromIdb = await new Promise(function (res, rej) {
        r.onsuccess = function () { res(r.result || []); };
        r.onerror = function () { rej(r.error); };
      });
    }
  } catch (e) {
    fromIdb = null;
  }

  const mirror = _readLSMirror(store);

  // IDB ok e com dados
  if (Array.isArray(fromIdb) && fromIdb.length > 0) {
    // Write-through: manter espelho alinhado (recuperação futura)
    _writeLSMirror(store, fromIdb);
    _memSet(store, fromIdb);
    return fromIdb.slice();
  }

  // IDB vazio ou indisponível, mas há espelho → recuperar
  if (mirror.length > 0) {
    if (db && Array.isArray(fromIdb) && fromIdb.length === 0) {
      await _rehydrateStoreFromMirror(store, mirror);
    }
    _memSet(store, mirror);
    return mirror.slice();
  }

  // Ambos vazios
  const empty = Array.isArray(fromIdb) ? fromIdb : [];
  _memSet(store, empty);
  return empty.slice();
}

let dbPut = async function (store, item) {
  if (!item.id) item.id = typeof uuid === 'function' ? uuid() : String(Date.now());
  item.updated_at = new Date().toISOString();

  let idbOk = false;
  try {
    if (db) {
      const tx = db.transaction(store, 'readwrite');
      const r = tx.objectStore(store).put(item);
      await new Promise(function (res, rej) {
        r.onsuccess = res;
        r.onerror = function () { rej(r.error); };
      });
      idbOk = true;
    }
  } catch (e) {
    idbOk = false;
  }

  // Sempre espelhar (write-through) — robustez se IDB for limpo ou falhar depois
  _mirrorUpsert(store, item);
  _memInvalidate(store);

  return item;
};

// Escrita local pura (NUNCA dispara sync) — usada pelo pull remoto
async function dbPutLocal(store, item) {
  if (!item.id) item.id = typeof uuid === 'function' ? uuid() : String(Date.now());
  if (!item.updated_at) item.updated_at = new Date().toISOString();

  try {
    if (db) {
      const tx = db.transaction(store, 'readwrite');
      const r = tx.objectStore(store).put(item);
      await new Promise(function (res, rej) {
        r.onsuccess = res;
        r.onerror = function () { rej(r.error); };
      });
    }
  } catch (e) { /* fallback só espelho */ }

  _mirrorUpsert(store, item);
  _memInvalidate(store);
  return item;
};

let dbDelete = async function (store, id) {
  try {
    if (db) {
      const tx = db.transaction(store, 'readwrite');
      const r = tx.objectStore(store).delete(id);
      await new Promise(function (res, rej) {
        r.onsuccess = res;
        r.onerror = function () { rej(r.error); };
      });
    }
  } catch (e) {}

  _mirrorDelete(store, id);
  _memInvalidate(store);
};

async function dbClear(store) {
  try {
    if (db) {
      const tx = db.transaction(store, 'readwrite');
      await new Promise(function (res, rej) {
        const r = tx.objectStore(store).clear();
        r.onsuccess = res;
        r.onerror = function () { rej(r.error); };
      });
    }
  } catch (e) {}

  try { localStorage.removeItem(_lsKey(store)); } catch (e) {}
  _memInvalidate(store);
}

/** Diagnóstico / testes */
function bpCacheStats() {
  const out = {};
  STORES.forEach(function (s) {
    const mir = _readLSMirror(s);
    out[s] = {
      mirrorCount: mir.length,
      memCached: !!_memCache[s]
    };
  });
  out.idbOpen = !!db;
  return out;
}

if (typeof window !== 'undefined') {
  window.bpCacheStats = bpCacheStats;
  window.BPCache = {
    stats: bpCacheStats,
    invalidate: _memInvalidate,
    stores: STORES.slice()
  };
}


/** Health-check de persistência (IndexedDB + mirror LS) — NIST/PWA offline-first */
function bpProbePersistence() {
  return new Promise(function (resolve) {
    var result = { idb: false, ls: false, mirrors: 0 };
    try {
      localStorage.setItem('bp_persist_probe', '1');
      result.ls = localStorage.getItem('bp_persist_probe') === '1';
      localStorage.removeItem('bp_persist_probe');
    } catch (_) { result.ls = false; }
    try {
      var keys = ['config', 'clientes', 'agendamentos', 'movimentos', 'profissionais', 'servicos'];
      for (var i = 0; i < keys.length; i++) {
        if (localStorage.getItem('bp_' + keys[i])) result.mirrors++;
      }
    } catch (_) {}
    try {
      if (typeof openDB === 'function') {
        Promise.resolve(openDB()).then(function () {
          result.idb = true;
          resolve(result);
        }).catch(function () { resolve(result); });
      } else {
        resolve(result);
      }
    } catch (_) {
      resolve(result);
    }
  });
}
if (typeof window !== 'undefined') {
  window.bpProbePersistence = bpProbePersistence;
}
