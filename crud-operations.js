// ====================================================================
//  crud-operations.js — Fase C + Fase D (melhorias de robustez)
//  Carregar depois de core-*.js, core-store.js, db-indexeddb.js,
//  sync-*.js, auth-supabase.js, plano-limites.js
// ====================================================================

// ====================================================================
//  VALIDAÇÃO DE DUPLICADOS (local)
// ====================================================================
function existeNomeDuplicado(tabela, nome, idIgnorar = null) {
  const lista = state[tabela] || [];
  const nomeNormalizado = (nome || '').trim().toLowerCase();
  if (!nomeNormalizado) return false;
  return lista.some(item =>
    item.nome && item.nome.trim().toLowerCase() === nomeNormalizado &&
    (idIgnorar ? item.id !== idIgnorar : true)
  );
}

async function detetarTrocaDeSalao(novoSalaoId) {
  const configs = await dbGetAll('config');
  const salaoIdCache = configs.find(c => c.key === 'salaoId');
  const anterior = salaoIdCache ? salaoIdCache.value : null;
  return !!(anterior && novoSalaoId && anterior !== novoSalaoId);
}

async function loadState(trocouDeSalao = false) {
  const configs = await dbGetAll('config');

  const cfg = configs.find(c => c.key === 'storeName');
  const fund = configs.find(c => c.key === 'fundo');
  const plano = configs.find(c => c.key === 'plano');
  const trialInicio = configs.find(c => c.key === 'trialInicio');

  // Mutação directa mantida por compatibilidade; Store notifica se existir
  state.config.storeName = cfg ? cfg.value : 'Glamour Beauty';
  state.config.fundo = fund ? Number(fund.value) : 0;
  state.config.plano = plano ? plano.value : (function () {
    try { return localStorage.getItem('bp_plano_cache') || 'trial'; } catch (_) { return 'trial'; }
  })();
  state.config.trialInicio = trialInicio ? trialInicio.value : null;

  let clientes, agendamentos, movimentos, profs, servicos, fechos;
  if (trocouDeSalao) {
    await Promise.all(['clientes', 'agendamentos', 'movimentos', 'profissionais', 'servicos', 'fechos_caixa'].map(dbClear));
    localStorage.removeItem(SYNC_QUEUE_KEY);
    try { localStorage.removeItem('bp_deleted_items'); } catch (_) {}
    // Preferências e resíduos do salão anterior (P2)
    ['bp_filtro_clientes','bp_chart_periodo','bp_chart_offset','bp_chart_mostrar_valores',
     'bp_hist_periodo','bp_caixa_data_exata','bp_carrinho','bp_last_venda_id'].forEach(k => {
      try { localStorage.removeItem(k); } catch (_) {}
    });
    try { sessionStorage.removeItem('bp_last_venda_id'); } catch (_) {}
    state.histPeriodo = 'hoje';
    state.filtroClientes = 'todos';
    state.chartPeriodo = 'semana';
    state.chartOffset = 0;
    clientes = []; agendamentos = []; movimentos = []; profs = []; servicos = []; fechos = [];
    console.warn('[BeautyPro] Troca de salão detetada — dados locais, fila e preferências limpos.');
  } else {
    const [clientesData, agendamentosData, movimentosData, profsData, servicosData, fechosData] = await Promise.all([
      dbGetAll('clientes'),
      dbGetAll('agendamentos'),
      dbGetAll('movimentos'),
      dbGetAll('profissionais'),
      dbGetAll('servicos'),
      dbGetAll('fechos_caixa'),
    ]);
    clientes = clientesData;
    agendamentos = agendamentosData;
    movimentos = movimentosData;
    profs = profsData;
    servicos = servicosData;
    fechos = fechosData;
  }

  const safe = (arr) => Array.isArray(arr) ? arr : [];
  state.clientes = safe(clientes);
  state.agendamentos = safe(agendamentos);
  state.movimentos = safe(movimentos);
  state.profissionais = safe(profs);
  state.servicos = safe(servicos);
  state.fechos_caixa = safe(fechos);

  const chartPeriodo = localStorage.getItem('bp_chart_periodo') || 'semana';
  const chartOffset = parseInt(localStorage.getItem('bp_chart_offset')) || 0;
  const chartMostrarValores = localStorage.getItem('bp_chart_mostrar_valores') === 'true';
  const filtroClientes = localStorage.getItem('bp_filtro_clientes') || 'todos';
  state.filtroClientes = filtroClientes;
  state.chartPeriodo = chartPeriodo;
  state.chartOffset = chartOffset;
  state.chartMostrarValores = chartMostrarValores;

  if (!state.config.trialInicio) {
    state.config.trialInicio = hoje();
    state.config.plano = 'trial';
    await dbPut('config', { id: 'trialInicio', key: 'trialInicio', value: state.config.trialInicio });
    await dbPut('config', { id: 'plano', key: 'plano', value: 'trial' });
  }

  if (state.profissionais.length === 0) {
    console.log('[loadState] Nenhum profissional encontrado. Criação automática desativada.');
  }
  if (state.servicos.length === 0) {
    console.log('[loadState] Nenhum serviço encontrado. Criação automática desativada.');
  }

  if (state.config.salaoId && navigator.onLine) {
    await garantirSalaoRemoto();
    const carregouRemoto = await carregarDoSupabase();
    if (carregouRemoto) await flushSyncQueue();
  }

  // Notificar Store se disponível
  if (window.BeautyStore && typeof window.BeautyStore.setState === 'function') {
    window.BeautyStore.setState({ ...state });
  }

  updateUI();
  if (typeof renderBadges === 'function') renderBadges();
}

async function saveConfig() {
  await dbPut('config', { id: 'storeName', key: 'storeName', value: state.config.storeName });
  await dbPut('config', { id: 'fundo', key: 'fundo', value: state.config.fundo });
  await dbPut('config', { id: 'plano', key: 'plano', value: state.config.plano });
  try { if (state.config.plano) localStorage.setItem('bp_plano_cache', state.config.plano); } catch (_) {}
  await dbPut('config', { id: 'trialInicio', key: 'trialInicio', value: state.config.trialInicio });
  if (state.config.salaoId) {
    await dbPut('config', { id: 'salaoId', key: 'salaoId', value: state.config.salaoId });
  }
}

// ====================================================================
//  HELPER — DELETE OPTIMISTA COM ROLLBACK
// ====================================================================
async function _deleteComRollback(tabela, id, nomeEntidade) {
  const lista = state[tabela] || [];
  const itemOriginal = lista.find(item => item.id === id);
  if (!itemOriginal) {
    toast(`${nomeEntidade} não encontrado(a).`, 'warning');
    return false;
  }

  // Serviços: preferir soft-delete remoto se hard DELETE falhar (FK/histórico)
  const trySoftServico = (tabela === 'servicos');

  await dbDelete(tabela, id);
  if (window.BeautyStore && window.BeautyStore.removeFromList) {
    window.BeautyStore.removeFromList(tabela, id);
  } else {
    state[tabela] = state[tabela].filter(item => item.id !== id);
  }
  updateUI();
  if (typeof renderBadges === 'function') renderBadges();

  if (navigator.onLine && state.config && state.config.salaoId) {
    try {
      if (typeof flushSyncQueue === 'function') await flushSyncQueue();
      // Contingência: se serviço e ainda existir no servidor, desactivar
      if (trySoftServico && typeof supabaseDeactivate === 'function') {
        try {
          // Se hard delete na fila falhou, PATCH ativo=false mantém histórico limpo na UI
          await supabaseDeactivate('servicos', id, { updated_at: new Date().toISOString() });
        } catch (_) {
          /* hard delete pode já ter removido — ignorar */
        }
      }
      if (typeof atualizarIndicadorSync === 'function') atualizarIndicadorSync();
      toast(`${nomeEntidade} eliminado(a).`, 'success');
      return true;
    } catch (e) {
      console.warn(`[delete ${tabela}] Falha ao sincronizar:`, e);
      if (trySoftServico && typeof addToSyncQueue === 'function') {
        const soft = Object.assign({}, itemOriginal, { ativo: false, updated_at: new Date().toISOString() });
        addToSyncQueue('servicos', 'upsert', soft);
      }
      toast(`${nomeEntidade} eliminado(a) localmente. Sync em fila.`, 'warning');
      return true;
    }
  } else {
    toast(`${nomeEntidade} eliminado(a) (offline). Sync quando online.`, 'warning');
    return true;
  }
}

// ====================================================================
//  CRUD — CLIENTE
// ====================================================================

// ====================================================================
//  FIDELIDADE — pontos e níveis (1 ponto / 1000 Kz)
// ====================================================================
var BP_PONTOS_POR_KZ = 1000;

function calcularPontosVenda(valor) {
  var v = Number(valor) || 0;
  if (v <= 0) return 0;
  return Math.floor(v / BP_PONTOS_POR_KZ);
}

function getClienteTier(pontos) {
  var p = Number(pontos) || 0;
  if (p >= 300) return { id: 'ouro', label: 'Ouro', min: 300 };
  if (p >= 100) return { id: 'prata', label: 'Prata', min: 100 };
  return { id: 'bronze', label: 'Bronze', min: 0 };
}

async function creditarPontosCliente(clienteId, pontos) {
  if (!clienteId || !pontos || pontos <= 0) return null;
  var c = (state.clientes || []).find(function (x) { return x.id === clienteId; });
  if (!c) return null;
  var next = (Number(c.pontos) || 0) + pontos;
  // update directo para não disparar rename / side-effects pesados
  var data = { pontos: next, updated_at: new Date().toISOString() };
  if (window.BeautyStore && window.BeautyStore.updateInList) {
    window.BeautyStore.updateInList('clientes', clienteId, data);
  } else {
    var i = state.clientes.findIndex(function (x) { return x.id === clienteId; });
    if (i === -1) return null;
    state.clientes[i] = Object.assign({}, state.clientes[i], data);
  }
  var item = (state.clientes || []).find(function (x) { return x.id === clienteId; });
  if (item) {
    try { await dbPut('clientes', item); } catch (e) {}
  }
  return next;
}

async function addCliente(c) {
  if (!verificarLimite('clientes')) return null;
  const nome = (c.nome || '').trim();
  if (!nome) { toast('Nome é obrigatório', 'error'); return null; }

  if (existeNomeDuplicado('clientes', nome)) {
    toast('Já existe um cliente com este nome.', 'error');
    return null;
  }

  const n = { ...c, id: uuid(), nome, pontos: Number(c.pontos) || 0 };
  try {
    await dbPut('clientes', n);
    if (window.BeautyStore && window.BeautyStore.pushToList) {
      window.BeautyStore.pushToList('clientes', n);
    } else {
      state.clientes.push(n);
      updateUI();
    }
    toast('Cliente adicionado à lista', 'success');
    return n;
  } catch (err) {
    if (err.message === 'LIMITE_PLANO_ATINGIDO') {
      mostrarModalUpgrade('Limite de clientes atingido. Faça upgrade para continuar.');
      return null;
    }
    throw err;
  }
}

async function updateCliente(id, data) {
  const actual = (state.clientes || []).find(c => c.id === id);
  if (!actual) return null;

  if (data.nome) {
    const nome = data.nome.trim();
    data = { ...data, nome };
    if (existeNomeDuplicado('clientes', nome, id)) {
      toast('Já existe um cliente com este nome.', 'error');
      return null;
    }
  }

  const oldNome = actual.nome;
  const newNome = data.nome != null ? data.nome : oldNome;
  const renamed = data.nome != null && String(data.nome) !== String(oldNome);

  if (window.BeautyStore && window.BeautyStore.updateInList) {
    window.BeautyStore.updateInList('clientes', id, data);
  } else {
    const i = state.clientes.findIndex(c => c.id === id);
    if (i === -1) return null;
    state.clientes[i] = { ...state.clientes[i], ...data };
  }
  const item = state.clientes.find(c => c.id === id);
  if (item) await dbPut('clientes', item);

  // Propagar rename para histórico ligado (id ou nome legado) — mantém stats coerentes
  if (renamed && newNome) {
    const patchList = async (storeKey) => {
      const list = state[storeKey] || [];
      for (let i = 0; i < list.length; i++) {
        const row = list[i];
        const byId = row.cliente_id && String(row.cliente_id) === String(id);
        const byName = row.cliente && String(row.cliente) === String(oldNome);
        if (!byId && !byName) continue;
        const next = { ...row, cliente: newNome, cliente_id: id };
        if (window.BeautyStore && window.BeautyStore.updateInList) {
          window.BeautyStore.updateInList(storeKey, row.id, next);
        } else {
          list[i] = next;
        }
        try { await dbPut(storeKey, next); } catch (e) {}
      }
    };
    await patchList('movimentos');
    await patchList('agendamentos');
    // invalidar cache de stats se existir
    try { if (typeof _statsCache !== 'undefined') _statsCache = { key: '', map: null }; } catch (e) {}
  }

  if (!(window.BeautyStore && window.BeautyStore.subscribe)) updateUI();
  return item;
}

async function deleteCliente(id) {
  return _deleteComRollback('clientes', id, 'Cliente');
}

// ====================================================================
//  CRUD — AGENDAMENTO
// ====================================================================

/** Duração do serviço em minutos (default 60 se não configurado). */
function getServicoDuracaoMin(servicoNome) {
  const s = (state.servicos || []).find(x => x.nome === servicoNome);
  if (!s) return 60;
  const d = Number(s.duracao || s.duracaoMin || s.minutos || 0);
  return d > 0 ? d : 60;
}

function _parseAgDateTime(data, hora) {
  const h = String(hora || '00:00').slice(0, 5);
  const dt = new Date(String(data) + 'T' + h + ':00');
  return isNaN(dt.getTime()) ? null : dt;
}

/**
 * Conflito = mesmo profissional, mesmo dia, intervalo sobreposto, status agendado.
 * @returns {object|null} o agendamento conflituoso ou null
 */
function temConflitoAgendamento({ profissional_id, data, hora, servico, excludeId, duracaoMin }) {
  if (!profissional_id || !data || !hora) return null;
  const dur = duracaoMin || getServicoDuracaoMin(servico);
  const start = _parseAgDateTime(data, hora);
  if (!start) return null;
  const end = new Date(start.getTime() + dur * 60000);

  for (const a of state.agendamentos || []) {
    if (excludeId && a.id === excludeId) continue;
    if (String(a.profissional_id) !== String(profissional_id)) continue;
    if (a.data !== data) continue;
    const st = String(a.status || a.estado || 'agendado').toLowerCase();
    if (st !== 'agendado') continue;
    const aStart = _parseAgDateTime(a.data, a.hora);
    if (!aStart) continue;
    const aDur = getServicoDuracaoMin(a.servico);
    const aEnd = new Date(aStart.getTime() + aDur * 60000);
    if (start < aEnd && end > aStart) return a;
  }
  return null;
}

async function addAgendamento(ag) {
  const data = ag.data || (typeof hoje === 'function' ? hoje() : '');
  const hora = String(ag.hora || (typeof horaAgora === 'function' ? horaAgora() : '00:00')).slice(0, 5);
  const agDatetime = _parseAgDateTime(data, hora);
  if (!agDatetime) {
    toast('Data ou hora inválida.', 'error');
    return null;
  }
  if (agDatetime < new Date()) {
    toast('Não é possível agendar para datas ou horários passados.', 'error');
    return null;
  }
  if (!verificarLimite('agendamentos')) return null;
  if (!ag.profissional_id || String(ag.profissional_id).trim() === '') {
    toast('Selecione um profissional antes de agendar.', 'error');
    return null;
  }

  const conflito = temConflitoAgendamento({
    profissional_id: ag.profissional_id,
    data,
    hora,
    servico: ag.servico,
    excludeId: null
  });
  if (conflito) {
    const h = String(conflito.hora || '').slice(0, 5);
    toast(
      'Conflito: ' + (conflito.cliente || 'cliente') + ' já tem ' + (conflito.servico || 'serviço') +
      ' com este profissional às ' + h + '.',
      'error'
    );
    return null;
  }

  const n = {
    ...ag,
    id: uuid(),
    data,
    hora,
    status: 'agendado',
    profissional_id: ag.profissional_id || null,
    profissional: ag.profissional || '',
    updated_at: new Date().toISOString()
  };
  try {
    await dbPut('agendamentos', n);
    if (window.BeautyStore && window.BeautyStore.pushToList) {
      window.BeautyStore.pushToList('agendamentos', n);
    } else {
      state.agendamentos.push(n);
      updateUI();
    }
    if (typeof renderBadges === 'function') renderBadges();
    toast('Agendamento marcado', 'success');
    return n;
  } catch (err) {
    if (err.message === 'LIMITE_PLANO_ATINGIDO') {
      mostrarModalUpgrade('Limite de agendamentos atingido. Faça upgrade para continuar.');
      return null;
    }
    throw err;
  }
}

async function updateAgendamento(id, data) {
  const actual = (state.agendamentos || []).find(a => a.id === id);
  if (!actual) return null;

  const merged = { ...actual, ...data };
  const st = String(merged.status || 'agendado').toLowerCase();
  if (st === 'agendado' && (data.data || data.hora || data.profissional_id || data.servico)) {
    const conflito = temConflitoAgendamento({
      profissional_id: merged.profissional_id,
      data: merged.data,
      hora: merged.hora,
      servico: merged.servico,
      excludeId: id
    });
    if (conflito) {
      const h = String(conflito.hora || '').slice(0, 5);
      toast(
        'Conflito: ' + (conflito.cliente || 'cliente') + ' já tem ' + (conflito.servico || 'serviço') +
        ' com este profissional às ' + h + '.',
        'error'
      );
      return null;
    }
    if (data.data || data.hora) {
      const dt = _parseAgDateTime(merged.data, merged.hora);
      if (dt && dt < new Date()) {
        toast('Não é possível reagendar para o passado.', 'error');
        return null;
      }
    }
  }

  merged.updated_at = new Date().toISOString();
  if (window.BeautyStore && window.BeautyStore.updateInList) {
    window.BeautyStore.updateInList('agendamentos', id, merged);
  } else {
    const i = state.agendamentos.findIndex(a => a.id === id);
    if (i === -1) return null;
    state.agendamentos[i] = merged;
  }
  const item = state.agendamentos.find(a => a.id === id);
  if (item) await dbPut('agendamentos', item);
  if (!(window.BeautyStore && window.BeautyStore.subscribe)) updateUI();
  if (typeof renderBadges === 'function') renderBadges();
  return item;
}

async function deleteAgendamento(id) {
  return _deleteComRollback('agendamentos', id, 'Agendamento');
}

// ====================================================================
//  CRUD — PROFISSIONAL
// ====================================================================
async function addProfissional(p) {
  if (!verificarLimite('profissionais')) return null;
  const nome = (p.nome || '').trim();
  if (!nome) { toast('Nome é obrigatório', 'error'); return null; }

  if (existeNomeDuplicado('profissionais', nome)) {
    toast('Já existe um profissional com este nome.', 'error');
    return null;
  }

  const n = { ...p, id: uuid(), nome, ativo: p.ativo !== false };
  try {
    await dbPut('profissionais', n);
    if (window.BeautyStore && window.BeautyStore.pushToList) {
      window.BeautyStore.pushToList('profissionais', n);
    } else {
      state.profissionais.push(n);
      updateUI();
    }
    toast('Profissional adicionado à equipa', 'success');
    return n;
  } catch (err) {
    if (err.message === 'LIMITE_PLANO_ATINGIDO') {
      mostrarModalUpgrade('Limite de profissionais atingido. Faça upgrade para continuar.');
      return null;
    }
    throw err;
  }
}


function isProfissionalAtivo(p) {
  if (!p) return false;
  return p.ativo !== false && p.ativo !== 0 && p.ativo !== 'false';
}

function isServicoAtivo(s) {
  if (!s) return false;
  return s.ativo !== false && s.ativo !== 0 && s.ativo !== 'false';
}

function getProfissionaisAtivos() {
  return (state.profissionais || []).filter(isProfissionalAtivo);
}

/**
 * Soft-delete: destituir profissional sem DELETE remoto (evita 409 FK).
 * Remove associações em serviços; desactiva serviços que ficam sem equipa.
 */
async function desassociarProfissional(id) {
  const p = (state.profissionais || []).find(function (x) { return x.id === id; });
  if (!p) {
    if (typeof toast === 'function') toast('Profissional não encontrado', 'error');
    return null;
  }
  if (!isProfissionalAtivo(p)) {
    if (typeof toast === 'function') toast('Este profissional já está destituído', 'warning');
    return null;
  }

  const patch = {
    ativo: false,
    data_desativacao: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // UPDATE local + fila (não DELETE — crítico para multi-dispositivo)
  if (window.BeautyStore && window.BeautyStore.updateInList) {
    window.BeautyStore.updateInList('profissionais', id, patch);
  } else {
    const i = state.profissionais.findIndex(function (x) { return x.id === id; });
    if (i === -1) return null;
    state.profissionais[i] = Object.assign({}, state.profissionais[i], patch);
  }
  const item = (state.profissionais || []).find(function (x) { return x.id === id; });
  if (item) {
    try {
      await dbPut('profissionais', item);
      // Contingência 1: PATCH directo no Supabase (fonte de verdade multi-dispositivo)
      var remotoOk = false;
      if (navigator.onLine && typeof supabaseDeactivate === 'function') {
        try {
          await supabaseDeactivate('profissionais', id, {
            data_desativacao: item.data_desativacao,
            updated_at: item.updated_at
          });
          remotoOk = true;
        } catch (eRemoto) {
          console.warn('[desassociarProfissional] PATCH remoto falhou, fila de contingência', eRemoto);
        }
      }
      // Contingência 2: fila upsert se PATCH falhou ou offline
      if (!remotoOk && typeof addToSyncQueue === 'function') {
        addToSyncQueue('profissionais', 'upsert', item);
        if (navigator.onLine && typeof flushSyncQueue === 'function') {
          try { await flushSyncQueue(); } catch (eFlush) {
            console.warn('[desassociarProfissional] flush', eFlush);
          }
        }
      }
    } catch (e) {
      console.error('[desassociarProfissional]', e);
    }
  }

  const nome = p.nome || '';
  const servicosAfetados = [];
  const servicosDesativados = [];

  for (const s of (state.servicos || []).slice()) {
    const arr = Array.isArray(s.profissionais) ? s.profissionais.slice() : [];
    if (!arr.length) continue;
    const next = arr.filter(function (x) {
      return x !== nome && String(x) !== String(id);
    });
    if (next.length === arr.length) continue;

    const sPatch = { profissionais: next };
    if (next.length === 0) {
      sPatch.ativo = false;
      servicosDesativados.push(s.nome || 'Serviço');
    } else {
      servicosAfetados.push(s.nome || 'Serviço');
    }

    if (window.BeautyStore && window.BeautyStore.updateInList) {
      window.BeautyStore.updateInList('servicos', s.id, sPatch);
    } else {
      const si = state.servicos.findIndex(function (x) { return x.id === s.id; });
      if (si !== -1) state.servicos[si] = Object.assign({}, state.servicos[si], sPatch);
    }
    const updated = (state.servicos || []).find(function (x) { return x.id === s.id; });
    if (updated) {
      try { await dbPut('servicos', updated); } catch (e) {}
    }
  }

  if (!(window.BeautyStore && window.BeautyStore.subscribe) && typeof updateUI === 'function') {
    updateUI();
  }

  return {
    profissional: item || Object.assign({}, p, patch),
    servicosAfetados: servicosAfetados,
    servicosDesativados: servicosDesativados
  };
}

async function updateProfissional(id, data) {
  const actual = (state.profissionais || []).find(p => p.id === id);
  if (!actual) return null;

  if (data.nome) {
    const nome = data.nome.trim();
    data = { ...data, nome };
    if (existeNomeDuplicado('profissionais', nome, id)) {
      toast('Já existe um profissional com este nome.', 'error');
      return null;
    }
  }
  const oldNome = actual.nome;
  const newNome = data.nome != null ? data.nome : oldNome;
  const renamed = data.nome != null && String(data.nome) !== String(oldNome);

  if (window.BeautyStore && window.BeautyStore.updateInList) {
    window.BeautyStore.updateInList('profissionais', id, data);
  } else {
    const i = state.profissionais.findIndex(p => p.id === id);
    if (i === -1) return null;
    state.profissionais[i] = { ...state.profissionais[i], ...data };
  }
  const item = state.profissionais.find(p => p.id === id);
  if (item) await dbPut('profissionais', item);

  // Rename: actualizar nomes em serviços ligados (array legado de nomes)
  if (renamed && oldNome && newNome) {
    for (const s of (state.servicos || [])) {
      const arr = s.profissionais || [];
      if (!arr.length) continue;
      let changed = false;
      const next = arr.map(function (x) {
        if (x === oldNome || x === id) { changed = true; return newNome; }
        return x;
      });
      if (!changed) continue;
      const updated = { ...s, profissionais: next };
      if (window.BeautyStore && window.BeautyStore.updateInList) {
        window.BeautyStore.updateInList('servicos', s.id, updated);
      } else {
        const si = state.servicos.findIndex(x => x.id === s.id);
        if (si !== -1) state.servicos[si] = updated;
      }
      try { await dbPut('servicos', updated); } catch (e) {}
    }
    // Nome em movimentos legados sem quebrar id
    for (const m of (state.movimentos || [])) {
      if (String(m.profissional_id) !== String(id)) continue;
      if (m.profissional === newNome) continue;
      const updated = { ...m, profissional: newNome };
      if (window.BeautyStore && window.BeautyStore.updateInList) {
        window.BeautyStore.updateInList('movimentos', m.id, updated);
      } else {
        const mi = state.movimentos.findIndex(x => x.id === m.id);
        if (mi !== -1) state.movimentos[mi] = updated;
      }
      try { await dbPut('movimentos', updated); } catch (e) {}
    }
  }

  if (!(window.BeautyStore && window.BeautyStore.subscribe)) updateUI();
  return item;
}

async function deleteProfissional(id) {
  return _deleteComRollback('profissionais', id, 'Profissional');
}

// ====================================================================
//  CRUD — SERVIÇO
// ====================================================================
async function addServico(s) {
  const nome = (s.nome || '').trim();
  if (!nome) { toast('Nome é obrigatório', 'error'); return null; }

  if (existeNomeDuplicado('servicos', nome)) {
    toast('Já existe um serviço com este nome.', 'error');
    return null;
  }

  const n = { ...s, id: uuid(), nome };
  await dbPut('servicos', n);
  if (window.BeautyStore && window.BeautyStore.pushToList) {
    window.BeautyStore.pushToList('servicos', n);
  } else {
    state.servicos.push(n);
    updateUI();
  }
  toast('Serviço criado e disponível', 'success');
  return n;
}

async function updateServico(id, data) {
  if (data.nome) {
    const nome = data.nome.trim();
    if (existeNomeDuplicado('servicos', nome, id)) {
      toast('Já existe um serviço com este nome.', 'error');
      return;
    }
  }
  if (window.BeautyStore && window.BeautyStore.updateInList) {
    window.BeautyStore.updateInList('servicos', id, data);
  } else {
    const i = state.servicos.findIndex(s => s.id === id);
    if (i === -1) return;
    state.servicos[i] = { ...state.servicos[i], ...data };
  }
  const item = state.servicos.find(s => s.id === id);
  if (item) await dbPut('servicos', item);
  if (!(window.BeautyStore && window.BeautyStore.subscribe)) updateUI();
}

async function deleteServico(id) {
  return _deleteComRollback('servicos', id, 'Serviço');
}

function getServicoById(id) {
  return state.servicos.find(s => s.id === id);
}

function getServicoByNome(nome) {
  return state.servicos.find(s => s.nome === nome);
}

function getProfissionaisPorServico(nomeServico) {
  const servico = state.servicos.find(s => s.nome === nomeServico);
  if (servico && servico.profissionais && servico.profissionais.length > 0) {
    return servico.profissionais;
  }
  return state.profissionais.map(p => p.nome);
}

// ====================================================================
//  VENDA / MOVIMENTO
// ====================================================================
async function registarVenda(dados) {
  try {
    const clienteNome = String(dados.cliente || '').trim() || 'Avulso';
    let clienteId = dados.cliente_id || null;
    if (!clienteId && typeof resolverClienteIdPorNome === 'function') {
      clienteId = resolverClienteIdPorNome(clienteNome);
    } else if (!clienteId && clienteNome && clienteNome !== 'Avulso' && clienteNome !== 'Anónimo') {
      const hit = (state.clientes || []).find(c =>
        String(c.nome || '').trim().toLowerCase() === clienteNome.toLowerCase()
      );
      if (hit) clienteId = hit.id;
    }

    if (!dados.itens || !Array.isArray(dados.itens) || dados.itens.length === 0) {
      toast('Adicione pelo menos um serviço à venda.', 'error');
      return null;
    }

    const total = dados.itens.reduce((acc, i) => acc + (Number(i.subtotal) || 0), 0);
    if (total <= 0) {
      toast('O valor total da venda tem de ser superior a zero.', 'error');
      return null;
    }

    const descricao = dados.itens.map(i => i.nome).join(', ');
    const id = uuid();
    let comissao = 0;
    if (dados.profissional_id && typeof calcularComissao === 'function') {
      try { comissao = Number(calcularComissao(dados.profissional_id, total)) || 0; } catch (e) { comissao = 0; }
    } else if (dados.profissional_id && typeof getTaxaComissao === 'function') {
      try {
        const taxa = Number(getTaxaComissao(dados.profissional_id)) || 0;
        comissao = Math.round((total * taxa) / 100);
      } catch (e) { comissao = 0; }
    }

    const mov = {
      id,
      tipo: 'venda',
      descricao,
      valor: total,
      cliente: clienteNome,
      cliente_id: clienteId || null,
      profissional_id: dados.profissional_id || null,
      profissional: dados.profissional || 'Não atribuído',
      comissao_gerada: comissao,
      itens: dados.itens.map(i => ({
        nome: i.nome,
        quantidade: Number(i.quantidade) || 1,
        precoUnit: Number(i.precoUnit) || Number(i.subtotal) || 0,
        subtotal: Number(i.subtotal) || 0
      })),
      metodoPagamento: dados.metodoPagamento || 'Numerário',
      data: hoje(),
      hora: horaAgora(),
      reciboNum: (typeof nextReciboNum === 'function' ? nextReciboNum() : '0001'),
      salao_id: state.config.salaoId || null,
      updated_at: new Date().toISOString()
    };

    // Escrita local primeiro — nunca falha a venda por causa da rede
    await dbPut('movimentos', mov);
    if (window.BeautyStore && window.BeautyStore.pushToList) {
      window.BeautyStore.pushToList('movimentos', mov);
    } else {
      state.movimentos.push(mov);
      updateUI();
    }
    if (typeof renderBadges === 'function') renderBadges();

    // Fidelidade: creditar pontos se há ficha de cliente
    if (clienteId) {
      var pts = calcularPontosVenda(total);
      if (pts > 0) {
        try { await creditarPontosCliente(clienteId, pts); } catch (ePts) {}
      }
    }

    return id;
  } catch (err) {
    console.error('[registarVenda] Erro:', err);
    // Se for limite de plano, mensagem específica
    if (err && err.message === 'LIMITE_PLANO_ATINGIDO') {
      mostrarModalUpgrade('Limite do plano atingido. Faça upgrade para continuar.');
      return null;
    }
    toast('Não foi possível registar a venda localmente. Tente novamente.', 'error');
    return null;
  }
}

async function addMovimento(mov) {
  const n = { ...mov, id: uuid(), data: hoje(), hora: horaAgora() };
  await dbPut('movimentos', n);
  if (window.BeautyStore && window.BeautyStore.pushToList) {
    window.BeautyStore.pushToList('movimentos', n);
  } else {
    state.movimentos.push(n);
    updateUI();
  }
  return n;
}
