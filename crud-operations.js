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
  state.config.plano = plano ? plano.value : 'trial';
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
  await dbPut('config', { id: 'trialInicio', key: 'trialInicio', value: state.config.trialInicio });
  if (state.config.salaoId) {
    await dbPut('config', { id: 'salaoId', key: 'salaoId', value: state.config.salaoId });
  }
}

// ====================================================================
//  HELPER — DELETE OPTIMISTA COM ROLLBACK
// ====================================================================
async function _deleteComRollback(tabela, id, nomeEntidade) {
  // 1. Guardar snapshot para possível rollback
  const lista = state[tabela] || [];
  const itemOriginal = lista.find(item => item.id === id);
  if (!itemOriginal) {
    toast(`${nomeEntidade} não encontrado(a).`, 'warning');
    return false;
  }

  // 2. Remoção optimista local
  await dbDelete(tabela, id);
  if (window.BeautyStore && window.BeautyStore.removeFromList) {
    window.BeautyStore.removeFromList(tabela, id);
  } else {
    state[tabela] = state[tabela].filter(item => item.id !== id);
  }
  updateUI();
  if (typeof renderBadges === 'function') renderBadges();

  // 3. Sincronizar em background — SEM pull completo (evita “vibração”/reload da UI).
  // dbDelete já adicionou tombstone + enfileirou delete se necessário.
  if (navigator.onLine && state.config && state.config.salaoId) {
    try {
      if (typeof flushSyncQueue === 'function') await flushSyncQueue();
      if (typeof atualizarIndicadorSync === 'function') atualizarIndicadorSync();
      toast(`${nomeEntidade} eliminado(a).`, 'success');
      return true;
    } catch (e) {
      console.warn(`[delete ${tabela}] Falha ao sincronizar:`, e);
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
async function addCliente(c) {
  if (!verificarLimite('clientes')) return null;
  const nome = (c.nome || '').trim();
  if (!nome) { toast('Nome é obrigatório', 'error'); return null; }

  if (existeNomeDuplicado('clientes', nome)) {
    toast('Já existe um cliente com este nome.', 'error');
    return null;
  }

  const n = { ...c, id: uuid(), nome };
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
  if (data.nome) {
    const nome = data.nome.trim();
    if (existeNomeDuplicado('clientes', nome, id)) {
      toast('Já existe um cliente com este nome.', 'error');
      return;
    }
  }
  if (window.BeautyStore && window.BeautyStore.updateInList) {
    window.BeautyStore.updateInList('clientes', id, data);
  } else {
    const i = state.clientes.findIndex(c => c.id === id);
    if (i === -1) return;
    state.clientes[i] = { ...state.clientes[i], ...data };
  }
  const item = state.clientes.find(c => c.id === id);
  if (item) await dbPut('clientes', item);
  if (!(window.BeautyStore && window.BeautyStore.subscribe)) updateUI();
}

async function deleteCliente(id) {
  return _deleteComRollback('clientes', id, 'Cliente');
}

// ====================================================================
//  CRUD — AGENDAMENTO
// ====================================================================
async function addAgendamento(ag) {
  const dtStr = ag.data + 'T' + (ag.hora || '00:00') + ':00';
  const agDatetime = new Date(dtStr);
  const agora = new Date();
  if (agDatetime < agora) {
    toast('Não é possível agendar para datas ou horários passados.', 'error');
    return null;
  }
  if (!verificarLimite('agendamentos')) return null;
  if (!ag.profissional_id || String(ag.profissional_id).trim() === '') {
    toast('Selecione um profissional antes de agendar.', 'error');
    return null;
  }

  const n = {
    ...ag,
    id: uuid(),
    data: ag.data || hoje(),
    hora: ag.hora || horaAgora(),
    status: 'agendado',
    profissional_id: ag.profissional_id || null,
    profissional: ag.profissional || ''
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
  if (window.BeautyStore && window.BeautyStore.updateInList) {
    window.BeautyStore.updateInList('agendamentos', id, data);
  } else {
    const i = state.agendamentos.findIndex(a => a.id === id);
    if (i === -1) return;
    state.agendamentos[i] = { ...state.agendamentos[i], ...data };
  }
  const item = state.agendamentos.find(a => a.id === id);
  if (item) await dbPut('agendamentos', item);
  if (!(window.BeautyStore && window.BeautyStore.subscribe)) updateUI();
  if (typeof renderBadges === 'function') renderBadges();
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

  const n = { ...p, id: uuid(), nome };
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

async function updateProfissional(id, data) {
  if (data.nome) {
    const nome = data.nome.trim();
    if (existeNomeDuplicado('profissionais', nome, id)) {
      toast('Já existe um profissional com este nome.', 'error');
      return;
    }
  }
  if (window.BeautyStore && window.BeautyStore.updateInList) {
    window.BeautyStore.updateInList('profissionais', id, data);
  } else {
    const i = state.profissionais.findIndex(p => p.id === id);
    if (i === -1) return;
    state.profissionais[i] = { ...state.profissionais[i], ...data };
  }
  const item = state.profissionais.find(p => p.id === id);
  if (item) await dbPut('profissionais', item);
  if (!(window.BeautyStore && window.BeautyStore.subscribe)) updateUI();
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
    if (!dados.cliente || String(dados.cliente).trim() === '') {
      toast('Selecione ou crie um cliente antes de registar a venda.', 'error');
      return null;
    }

    if (!dados.profissional_id || String(dados.profissional_id).trim() === '') {
      toast('Selecione um profissional antes de registar a venda.', 'error');
      return null;
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
    const mov = {
      id,
      tipo: 'venda',
      descricao,
      valor: total,
      cliente: dados.cliente,
      profissional_id: dados.profissional_id || null,
      profissional: dados.profissional || 'Não atribuído',
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
