// ====================================================================
//  ia-module.js — extraído do app.js (Fase C da modularização)
//  Conteúdo: Contexto e lógica da Benza AI: resumo, insights, perguntas/respostas, histórico, onboarding, splash e testes
//  Linhas originais: 2318-2796
//  Carregar depois de core-*.js, db-indexeddb.js, sync-*.js, auth-supabase.js
// ====================================================================
// ====================================================================

/** Limita texto sem cortar a meio da última palavra. */
function _bpIaTrimTexto(s, max) {
  s = String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  if (!max || s.length <= max) return s;
  var cut = s.slice(0, max);
  var sp = cut.lastIndexOf(' ');
  if (sp > max * 0.6) cut = cut.slice(0, sp);
  return cut.replace(/[\s,;:.-]+$/, '') + '…';
}

/** Histórico compacto para API — mais memória sem explodir tokens. */
function _bpIaHistoricoCompacto(hist, maxTurns, maxCharsEach) {
  maxTurns = maxTurns || 8;
  maxCharsEach = maxCharsEach || 900;
  var list = Array.isArray(hist) ? hist.slice(-maxTurns) : [];
  return list.map(function (t) {
    return {
      pergunta: _bpIaTrimTexto(t && t.pergunta, 400),
      resposta: _bpIaTrimTexto(t && t.resposta, maxCharsEach),
      fonte: (t && t.fonte) || undefined
    };
  });
}

/** Contexto de salão — mais completo, ainda seguro contra payloads gigantes. */
function _bpIaContextoCompacto(ctxRaw) {
  if (ctxRaw == null) return '';
  if (typeof ctxRaw === 'object' && ctxRaw.erro) return ctxRaw;
  var s = typeof ctxRaw === 'string' ? ctxRaw : String(ctxRaw);
  /* Teto alinhado com MAX_CONTEXT_CHARS da edge (60000). Não omitir clientes. */
  if (s.length > 58000) {
    s = _bpIaTrimTexto(s, 58000);
  }
  return s;
}

function buildContextoIA() {
  if (!state.movimentos || !Array.isArray(state.movimentos) || !state.agendamentos || !Array.isArray(state.agendamentos)) {
    return { erro: 'Dados ainda não carregados. Tente novamente em instantes.' };
  }

  var hojeStr = hoje();
  var num = function (v) { return Number(v) || 0; };
  var stAg = function (a) {
    if (typeof _bpIaSt === 'function') return _bpIaSt(a);
    return String((a && (a.status || a.estado)) || 'agendado').toLowerCase();
  };
  var isActivo = function (x) {
    if (!x) return false;
    return x.ativo !== false && x.ativo !== 0 && x.ativo !== 'false';
  };

  var vendasHoje = state.movimentos.filter(function (m) { return m.data === hojeStr && m.tipo === 'venda'; });
  var despHoje = state.movimentos.filter(function (m) { return m.data === hojeStr && m.tipo === 'despesa'; });
  var agHoje = state.agendamentos.filter(function (a) { return a.data === hojeStr; });

  var d30str = (typeof _bpIaDataOffset === 'function') ? _bpIaDataOffset(-29) : (function () {
    var d = new Date(); d.setDate(d.getDate() - 29);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  })();

  var vendas30 = state.movimentos.filter(function (m) { return m.data >= d30str && m.tipo === 'venda'; });

  var byProf = {};
  vendas30.forEach(function (v) {
    if (v.profissional_id) {
      var nome = (typeof getProfissionalNome === 'function') ? getProfissionalNome(v.profissional_id) : (v.profissional || '—');
      byProf[nome] = (byProf[nome] || 0) + num(v.valor);
    }
  });

  var byServ = {};
  vendas30.forEach(function (v) {
    if (v.itens) {
      v.itens.forEach(function (i) {
        if (!i || !i.nome) return;
        byServ[i.nome] = (byServ[i.nome] || 0) + (num(i.quantidade) || 1);
      });
    }
  });

  var totalVendas30 = vendas30.reduce(function (s, v) { return s + num(v.valor); }, 0);
  var ticketMedio = vendas30.length > 0 ? Math.round(totalVendas30 / vendas30.length) : 0;
  var totalVendasHoje = vendasHoje.reduce(function (s, v) { return s + num(v.valor); }, 0);
  var totalDespHoje = despHoje.reduce(function (s, d) { return s + num(d.valor); }, 0);
  var clientesUnicos = new Set(vendasHoje.map(function (v) { return v.cliente; }).filter(Boolean)).size;

  var hojeD = new Date(hojeStr + 'T12:00:00');
  var iniSemanaAtualStr = (typeof _bpIaDataOffset === 'function') ? _bpIaDataOffset(-6) : hojeStr;
  var iniSemanaAnteriorStr = (typeof _bpIaDataOffset === 'function') ? _bpIaDataOffset(-13) : hojeStr;
  var fimSemanaAnteriorStr = (typeof _bpIaDataOffset === 'function') ? _bpIaDataOffset(-7) : hojeStr;
  var vendasSemanaAtual = state.movimentos.filter(function (m) {
    return m.tipo === 'venda' && m.data >= iniSemanaAtualStr && m.data <= hojeStr;
  });
  var vendasSemanaAnterior = state.movimentos.filter(function (m) {
    return m.tipo === 'venda' && m.data >= iniSemanaAnteriorStr && m.data <= fimSemanaAnteriorStr;
  });
  var totalSemanaAtual = vendasSemanaAtual.reduce(function (s, v) {
    return s + (typeof _bpIaNum === 'function' ? _bpIaNum(v.valor) : num(v.valor));
  }, 0);
  var totalSemanaAnterior = vendasSemanaAnterior.reduce(function (s, v) {
    return s + (typeof _bpIaNum === 'function' ? _bpIaNum(v.valor) : num(v.valor));
  }, 0);

  var fim14Str = (typeof _bpIaDataOffset === 'function') ? _bpIaDataOffset(14) : hojeStr;
  var ini14Str = (typeof _bpIaDataOffset === 'function') ? _bpIaDataOffset(-14) : hojeStr;

  var agProximos = state.agendamentos.filter(function (a) {
    if (!(a.data >= hojeStr && a.data <= fim14Str)) return false;
    return stAg(a) !== 'cancelado';
  });
  var agHistorico = state.agendamentos.filter(function (a) {
    return a.data >= ini14Str && a.data < hojeStr;
  });

  var ag30 = state.agendamentos.filter(function (a) { return a.data >= d30str && a.data <= hojeStr; });
  var ag30Cancelados = ag30.filter(function (a) { return stAg(a) === 'cancelado'; }).length;
  var taxaCancelamento = ag30.length > 0 ? Math.round((ag30Cancelados / ag30.length) * 100) : 0;

  var servicosOrdenados = Object.keys(byServ).map(function (k) { return [k, byServ[k]]; }).sort(function (a, b) { return a[1] - b[1]; });
  var servicoMenosVendido = servicosOrdenados[0];

  /* ---- Breakdown diário (últimos 30 dias — evita contexto infinito) ---- */
  var porDia = {};
  (state.movimentos || []).forEach(function (m) {
    if (!m || !m.data || m.data < d30str || m.data > hojeStr) return;
    if (!porDia[m.data]) porDia[m.data] = { vendas: 0, despesas: 0, nVendas: 0, nDespesas: 0 };
    if (m.tipo === 'venda') {
      porDia[m.data].vendas += num(m.valor);
      porDia[m.data].nVendas += 1;
    } else if (m.tipo === 'despesa') {
      porDia[m.data].despesas += num(m.valor);
      porDia[m.data].nDespesas += 1;
    }
  });
  var diasOrdenados = Object.keys(porDia).sort();
  var linhasDia = diasOrdenados.map(function (d) {
    var x = porDia[d];
    return '- ' + d + ': vendas ' + x.vendas + ' Kz (' + x.nVendas + ') · despesas ' + x.despesas + ' Kz (' + x.nDespesas + ')';
  });

  /* ---- Clientes activos (sem limite) + eliminados ---- */
  var clientesActivos = (state.clientes || []).filter(isActivo);
  var clientesEliminados = (state.clientes || []).filter(function (c) { return c && !isActivo(c); });

  /* Gasto por nome E por cliente_id (evita falso "sem venda" / falso "com venda") */
  var gastoPorNome = {};
  var gastoPorId = {};
  var ultimaPorNome = {};
  var ultimaPorId = {};
  (state.movimentos || []).forEach(function (v) {
    if (!v || v.tipo !== 'venda') return;
    var val = num(v.valor);
    if (v.cliente_id) {
      var idKey = String(v.cliente_id);
      gastoPorId[idKey] = (gastoPorId[idKey] || 0) + val;
      if (!ultimaPorId[idKey] || v.data > ultimaPorId[idKey]) ultimaPorId[idKey] = v.data;
    }
    var cn = String(v.cliente || '').trim();
    if (cn) {
      gastoPorNome[cn] = (gastoPorNome[cn] || 0) + val;
      if (!ultimaPorNome[cn] || v.data > ultimaPorNome[cn]) ultimaPorNome[cn] = v.data;
    }
  });
  var gastoDe = function (c) {
    var byId = c && c.id ? (gastoPorId[String(c.id)] || 0) : 0;
    var byNome = gastoPorNome[String((c && c.nome) || '').trim()] || 0;
    return byId > 0 ? byId : byNome;
  };
  var ultimaDe = function (c) {
    var byId = c && c.id ? ultimaPorId[String(c.id)] : null;
    var byNome = ultimaPorNome[String((c && c.nome) || '').trim()] || null;
    if (byId && byNome) return byId > byNome ? byId : byNome;
    return byId || byNome || null;
  };

  var linhasClientes = clientesActivos.map(function (c) {
    var nome = c.nome || '—';
    var tel = c.telefone || 'sem telefone';
    var gasto = gastoDe(c);
    var ultima = ultimaDe(c);
    var dias = ultima ? Math.floor((hojeD - new Date(ultima + 'T12:00:00')) / 86400000) : null;
    return '- ' + nome + ' | tel: ' + tel + ' | gasto: ' + gasto + ' Kz | última visita: ' +
      (dias !== null ? 'há ' + dias + ' dias (' + ultima + ')' : 'sem compras registadas');
  });

  /* Listas explícitas — o modelo não pode “assumir” que só existem clientes com venda */
  var clientesSemVenda = clientesActivos.filter(function (c) {
    var nome = (c.nome || '').trim();
    return nome && !(gastoDe(c) > 0);
  });
  var clientesComVenda = clientesActivos.filter(function (c) {
    var nome = (c.nome || '').trim();
    return nome && (gastoDe(c) > 0);
  });
  var linhasSemVenda = clientesSemVenda.map(function (c) {
    return '- ' + (c.nome || '—') + ' | tel: ' + (c.telefone || 'sem telefone') + ' | 0 Kz | sem nenhuma venda registada';
  });
  var linhasComVenda = clientesComVenda.map(function (c) {
    var nome = c.nome || '—';
    var gasto = gastoDe(c);
    var ultima = ultimaDe(c);
    var dias = ultima ? Math.floor((hojeD - new Date(ultima + 'T12:00:00')) / 86400000) : null;
    return '- ' + nome + ' | tel: ' + (c.telefone || 'sem telefone') + ' | gasto: ' + gasto + ' Kz | última visita: ' +
      (dias !== null ? 'há ' + dias + ' dias (' + ultima + ')' : 'desconhecido');
  });

  var linhasEliminados = clientesEliminados.map(function (c) {
    return '- ' + (c.nome || '—') + ' (eliminado)';
  });

  /* ---- Serviços activos (catálogo completo) ---- */
  var servicosActivos = (state.servicos || []).filter(isActivo);
  var linhasServicos = servicosActivos.map(function (s) {
    var preco = s.precoBase != null ? s.precoBase : (s.preco != null ? s.preco : '—');
    return '- ' + (s.nome || '—') + ' | preço base: ' + preco + ' Kz';
  });

  /* ---- Profissionais activos ---- */
  var profsActivos = (state.profissionais || []).filter(isActivo);
  var linhasProfs = profsActivos.map(function (p) {
    return '- ' + (p.nome || '—') +
      (p.especialidade ? ' | especialidade: ' + p.especialidade : '') +
      (p.taxa_comissao != null ? ' | comissão: ' + p.taxa_comissao + '%' : '');
  });

  /* ---- Agenda detalhada ---- */
  var linhasAgProx = agProximos
    .slice()
    .sort(function (a, b) { return String(a.data + a.hora).localeCompare(String(b.data + b.hora)); })
    .map(function (a) {
      return '- ' + a.data + ' ' + String(a.hora || '').slice(0, 5) +
        ' | ' + (a.cliente || '—') + ' | ' + (a.servico || '—') +
        ' | ' + (a.profissional || '—') + ' | status: ' + stAg(a);
    });

  var linhasAgHist = agHistorico
    .slice()
    .sort(function (a, b) { return String(b.data + b.hora).localeCompare(String(a.data + a.hora)); })
    .slice(0, 80)
    .map(function (a) {
      return '- ' + a.data + ' ' + String(a.hora || '').slice(0, 5) +
        ' | ' + (a.cliente || '—') + ' | ' + (a.servico || '—') +
        ' | status: ' + stAg(a);
    });

  var planoAtual = (typeof getPlanoAtual === 'function') ? getPlanoAtual() : (state.config && state.config.plano) || 'trial';
  var diasTrial = planoAtual === 'trial' && typeof getDiasTrialRestantes === 'function' ? getDiasTrialRestantes() : null;
  var waPlataforma = (typeof WHATSAPP_NUMBER !== 'undefined' && WHATSAPP_NUMBER) ? WHATSAPP_NUMBER : '953980750';

  return (
    'SALÃO: ' + (state.config && state.config.storeName ? state.config.storeName : '—') + '\n' +
    'DATA DE HOJE: ' + hojeStr + '\n' +
    'PLANO ACTUAL: ' + planoAtual + (diasTrial !== null ? ' (restam ' + diasTrial + ' dias de teste)' : '') + '\n' +
    '\n' +
    'CONTACTO DE SUPORTE DA PLATAFORMA BELEZAPRO (WhatsApp):\n' +
    '- Número: ' + waPlataforma + '\n' +
    '- Este número é APENAS suporte técnico da plataforma BelezaPro.\n' +
    '- NÃO é o telefone do dono nem do administrador deste salão.\n' +
    '- Oferece este número SOMENTE se o utilizador reportar problema com a plataforma (login, plano, bug, cobrança).\n' +
    '- Se perguntarem "número do administrador do salão" e não houver telefone do salão nos dados, diz que não tens o contacto do salão e oferece o suporte da plataforma se for questão técnica.\n' +
    '\n' +
    'HOJE:\n' +
    '- Faturamento: ' + totalVendasHoje + ' Kz\n' +
    '- Vendas: ' + vendasHoje.length + '\n' +
    '- Despesas: ' + totalDespHoje + ' Kz\n' +
    '- Agendamentos: ' + agHoje.length + ' (' + agHoje.filter(function (a) { return stAg(a) === 'realizado'; }).length + ' realizados)\n' +
    '- Clientes atendidos (vendas): ' + clientesUnicos + '\n' +
    '\n' +
    '======== FICHA DE CLIENTES (FONTE DE VERDADE DA ABA CLIENTES) ========\n' +
    'IMPORTANTE: Esta lista vem da ficha cadastral (state.clientes). NÃO uses só nomes de vendas.\n' +
    'RESUMO CLIENTES:\n' +
    '- Total activos na ficha: ' + clientesActivos.length + '\n' +
    '- Com pelo menos 1 venda: ' + clientesComVenda.length + '\n' +
    '- SEM nenhuma venda registada: ' + clientesSemVenda.length + '\n' +
    '\n' +
    'CLIENTES SEM NENHUMA VENDA (' + clientesSemVenda.length + ') — ESTÃO cadastrados; é PROIBIDO dizer que não existem:\n' +
    (linhasSemVenda.length ? linhasSemVenda.join('\n') : '- Nenhum (todos os activos já têm venda)') + '\n' +
    '\n' +
    'TODOS OS CLIENTES ACTIVOS DA FICHA (' + clientesActivos.length + '):\n' +
    (linhasClientes.length ? linhasClientes.join('\n') : '- Nenhum') + '\n' +
    '======== FIM FICHA DE CLIENTES ========\n' +
    '\n' +
    'ÚLTIMOS 30 DIAS:\n' +
    '- Total faturado: ' + totalVendas30 + ' Kz\n' +
    '- Total vendas: ' + vendas30.length + '\n' +
    '- Ticket médio: ' + ticketMedio + ' Kz\n' +
    '- Taxa de cancelamento de agendamentos: ' + taxaCancelamento + '%\n' +
    '\n' +
    'ESTA SEMANA vs SEMANA ANTERIOR:\n' +
    '- Esta semana: ' + totalSemanaAtual + ' Kz\n' +
    '- Semana anterior: ' + totalSemanaAnterior + ' Kz\n' +
    '- Variação: ' + (totalSemanaAnterior > 0 ? Math.round(((totalSemanaAtual - totalSemanaAnterior) / totalSemanaAnterior) * 100) : 0) + '%\n' +
    '\n' +
    'FATURAMENTO POR DIA (últimos 30 dias):\n' +
    (linhasDia.length ? linhasDia.join('\n') : '- Sem movimentos registados') + '\n' +
    '\n' +
    'POR PROFISSIONAL (30 dias):\n' +
    (Object.keys(byProf).length ? Object.keys(byProf).map(function (k) { return '- ' + k + ': ' + byProf[k] + ' Kz'; }).join('\n') : '- Sem dados') + '\n' +
    '\n' +
    'SERVIÇOS MAIS VENDIDOS (30 dias):\n' +
    (Object.keys(byServ).length
      ? Object.keys(byServ).sort(function (a, b) { return byServ[b] - byServ[a]; }).slice(0, 10).map(function (k) { return '- ' + k + ': ' + byServ[k] + 'x'; }).join('\n')
      : '- Sem dados') + '\n' +
    'SERVIÇO MENOS VENDIDO (30 dias): ' + (servicoMenosVendido ? (servicoMenosVendido[0] + ' (' + servicoMenosVendido[1] + 'x)') : 'Sem dados') + '\n' +
    '\n' +
    'CATÁLOGO DE SERVIÇOS ACTIVOS:\n' +
    (linhasServicos.length ? linhasServicos.join('\n') : '- Nenhum serviço activo') + '\n' +
    '\n' +
    'CLIENTES ELIMINADOS (' + clientesEliminados.length + ') — se perguntarem por estes nomes, diz que já foram eliminados:\n' +
    (linhasEliminados.length ? linhasEliminados.join('\n') : '- Nenhum') + '\n' +
    '\n' +
    'PROFISSIONAIS ACTIVOS:\n' +
    (linhasProfs.length ? linhasProfs.join('\n') : '- Nenhum') + '\n' +
    '\n' +
    'AGENDA — PRÓXIMOS 14 DIAS (' + agProximos.length + '):\n' +
    (linhasAgProx.length ? linhasAgProx.join('\n') : '- Sem marcações') + '\n' +
    '\n' +
    'AGENDA — HISTÓRICO 14 DIAS ANTERIORES (amostra):\n' +
    (linhasAgHist.length ? linhasAgHist.join('\n') : '- Sem histórico recente') + '\n'
  );
}

// ====================================================================
//  IA – perguntarIA, nome, histórico
// ====================================================================
let iaHistorico = [];
function bpResetIaHistorico() {
  iaHistorico = [];
  try {
    if (typeof window !== 'undefined') window.iaHistorico = iaHistorico;
  } catch (_) {}
  try {
    var chat = document.getElementById('ia-chat');
    if (chat) chat.innerHTML = '';
    if (typeof atualizarEstadoVazioIA === 'function') atualizarEstadoVazioIA();
  } catch (_) {}
}
if (typeof window !== 'undefined') {
  window.bpResetIaHistorico = bpResetIaHistorico;
  window.iaHistorico = iaHistorico;
}


function _bpIaDataOffset(dias) {
  /* Data local YYYY-MM-DD relativa a hoje() — evita UTC de toISOString */
  var base = (typeof hoje === 'function') ? hoje() : null;
  var d = base ? new Date(base + 'T12:00:00') : new Date();
  if (isNaN(d.getTime())) d = new Date();
  d.setDate(d.getDate() + (Number(dias) || 0));
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function _bpIaSt(a) {
  if (typeof _statusAg === 'function') return _statusAg(a);
  return String((a && (a.status || a.estado)) || 'agendado').toLowerCase();
}
function _bpIaNum(v) { var n = Number(v); return isFinite(n) ? n : 0; }
function _bpIaItemValor(it) {
  if (!it) return 0;
  var sub = _bpIaNum(it.subtotal);
  if (sub) return sub;
  var q = _bpIaNum(it.quantidade); if (!q) q = 1;
  var pu = it.precoUnit != null ? it.precoUnit : (it.preco != null ? it.preco : 0);
  return q * _bpIaNum(pu);
}

/** Soma valor de movimentos com filtro opcional (evita loops duplicados). */
function _bpIaSomaMovs(movs, pred) {
  var s = 0;
  var list = movs || [];
  for (var i = 0; i < list.length; i++) {
    var m = list[i];
    if (pred && !pred(m)) continue;
    s += _bpIaNum(m.valor);
  }
  return s;
}

/** Fluxo de um dia: vendas, despesas, fluxo. Fallback 0 se sem dados. */
function _bpIaFluxoDia(movs, dataStr) {
  var v = 0, d = 0;
  var list = movs || [];
  for (var i = 0; i < list.length; i++) {
    var m = list[i];
    if (!m || m.data !== dataStr) continue;
    if (m.tipo === 'venda') v += _bpIaNum(m.valor);
    else if (m.tipo === 'despesa') d += _bpIaNum(m.valor);
  }
  return { vendas: v, despesas: d, fluxo: v - d };
}

/** Métricas base do dia com fallback seguro (nunca NaN/undefined). */
function _bpIaMetricasBase() {
  var movs = (state && Array.isArray(state.movimentos)) ? state.movimentos : [];
  var ags = (state && Array.isArray(state.agendamentos)) ? state.agendamentos : [];
  var hojeStr = (typeof hoje === 'function') ? hoje() : _bpIaDataOffset(0);
  var fluxo = _bpIaFluxoDia(movs, hojeStr);
  var fundo = _bpIaNum(state && state.config && state.config.fundo);
  return {
    movs: movs,
    ags: ags,
    hojeStr: hojeStr,
    vendas: fluxo.vendas,
    despesas: fluxo.despesas,
    fluxo: fluxo.fluxo,
    fundo: fundo,
    saldoEst: fundo + fluxo.fluxo,
    pronto: !!(state && Array.isArray(state.movimentos) && Array.isArray(state.agendamentos))
  };
}

function renderIAResumo() {
  var base = _bpIaMetricasBase();
  if (!base.pronto) {
    var listaWait = document.getElementById('ia-insights-list');
    if (listaWait) {
      listaWait.innerHTML = '<div class="ia-insight-row"><span>A carregar dados do salão…</span></div>';
    }
    return;
  }
  var movs = base.movs;
  var ags = base.ags;
  var hojeStr = base.hojeStr;
  var hojeD = new Date(hojeStr + 'T12:00:00');
  var vendasHoje = movs.filter(function (m) { return m.data === hojeStr && m.tipo === 'venda'; });
  var totalHoje = base.vendas;
  var totalDespHoje = base.despesas;
  var fundo = base.fundo;
  var fluxoHoje = base.fluxo;
  var saldoEst = base.saldoEst;

  var agHoje = ags.filter(function (a) { return a.data === hojeStr; });
  var pendentesHoje = agHoje.filter(function (a) {
    var st = _bpIaSt(a);
    return st === 'agendado' || (!st);
  }).length;
  var clientesHoje = new Set(vendasHoje.map(function (v) { return v.cliente; }).filter(Boolean)).size;

  var elFat = document.getElementById('ia-resumo-fat');
  if (elFat) elFat.textContent = fmtKz(totalHoje);

  var dias7Fat = [];
  for (var i = 1; i <= 7; i++) {
    dias7Fat.push(_bpIaFluxoDia(movs, _bpIaDataOffset(-i)).vendas);
  }
  var media7 = dias7Fat.reduce(function (s, v) { return s + v; }, 0) / 7;
  var fatTrendEl = document.getElementById('ia-resumo-fat-trend');
  if (fatTrendEl) {
    if (media7 > 0) {
      var variacaoFat = Math.round(((totalHoje - media7) / media7) * 100);
      fatTrendEl.innerHTML = '<span style="color:' + (variacaoFat >= 0 ? 'var(--green)' : 'var(--red)') + '">' +
        (variacaoFat >= 0 ? '↑' : '↓') + ' ' + Math.abs(variacaoFat) + '%</span> vs média 7 dias';
    } else {
      fatTrendEl.textContent = totalHoje > 0 ? 'sem histórico de 7 dias' : 'sem vendas recentes';
    }
  }

  var elCli = document.getElementById('ia-resumo-clientes');
  if (elCli) elCli.textContent = String((state.clientes || []).length);
  var elCliSub = document.getElementById('ia-resumo-clientes-sub');
  if (elCliSub) elCliSub.textContent = clientesHoje + (clientesHoje === 1 ? ' atendido hoje' : ' atendidos hoje');

  var elAg = document.getElementById('ia-resumo-ag');
  if (elAg) elAg.textContent = String(agHoje.length);
  var elAgSub = document.getElementById('ia-resumo-ag-sub');
  if (elAgSub) elAgSub.textContent = pendentesHoje + (pendentesHoje === 1 ? ' pendente' : ' pendentes');

  /* ---- Insights: prioridade (1 atenção → 3 info), máx. 5 ---- */
  var insights = [];
  function pushIns(prio, icone, cor, texto) {
    insights.push({ prio: prio, icone: icone, cor: cor, texto: texto });
  }

  /* Ticket médio hoje vs dias com venda nos últimos 7 */
  var ticketHoje = vendasHoje.length > 0 ? totalHoje / vendasHoje.length : 0;
  var ticketsDias7 = [];
  for (var t = 1; t <= 7; t++) {
    var dts = _bpIaDataOffset(-t);
    var vd = movs.filter(function (m) { return m.data === dts && m.tipo === 'venda'; });
    if (vd.length > 0) {
      var sum = vd.reduce(function (s, v) { return s + _bpIaNum(v.valor); }, 0);
      ticketsDias7.push(sum / vd.length);
    }
  }
  if (ticketHoje > 0 && ticketsDias7.length > 0) {
    var mediaTicket7 = ticketsDias7.reduce(function (s, v) { return s + v; }, 0) / ticketsDias7.length;
    if (mediaTicket7 > 0) {
      var variacaoTicket = Math.round(((ticketHoje - mediaTicket7) / mediaTicket7) * 100);
      var down = variacaoTicket < -8;
      pushIns(down ? 1 : 2, 'trend', variacaoTicket >= 0 ? 'var(--green)' : 'var(--red)',
        'Hoje o ticket médio ' + (variacaoTicket >= 0 ? 'subiu' : 'desceu') +
        ' <strong>' + Math.abs(variacaoTicket) + '%</strong> face à média dos últimos dias com vendas.');
    }
  } else if (totalHoje === 0 && media7 > 0) {
    pushIns(1, 'trend', 'var(--text-secondary)',
      'Ainda <strong>sem vendas hoje</strong>. A média dos últimos 7 dias foi ' + fmtKz(Math.round(media7)) + '.');
  }

  /* Clientes inactivos > 30 dias */
  var ultimaCompraPorCliente = {};
  movs.forEach(function (v) {
    if (v.tipo !== 'venda' || !v.cliente) return;
    var nome = String(v.cliente).trim();
    if (!nome) return;
    if (!ultimaCompraPorCliente[nome] || v.data > ultimaCompraPorCliente[nome]) {
      ultimaCompraPorCliente[nome] = v.data;
    }
  });
  var inativos = 0;
  Object.keys(ultimaCompraPorCliente).forEach(function (nome) {
    var data = ultimaCompraPorCliente[nome];
    var dias = Math.floor((hojeD - new Date(data + 'T12:00:00')) / 86400000);
    if (dias > 30) inativos++;
  });
  if (inativos > 0) {
    pushIns(1, 'user', 'var(--text-secondary)',
      inativos === 1
        ? 'Existe <strong>1 cliente</strong> sem regressar há mais de 30 dias — oportunidade de reactivação.'
        : 'Existem <strong>' + inativos + ' clientes</strong> sem regressar há mais de 30 dias — priorize contacto.');
  }

  /* Serviço campeão da semana — % sobre soma dos itens (consistente) */
  var iniSemanaStr = _bpIaDataOffset(-6);
  var vendasSemana = movs.filter(function (m) {
    return m.tipo === 'venda' && m.data >= iniSemanaStr && m.data <= hojeStr;
  });
  var receitaPorServico = {};
  var receitaItensSemana = 0;
  var receitaSemanaTotal = 0;
  vendasSemana.forEach(function (v) {
    receitaSemanaTotal += _bpIaNum(v.valor);
    if (v.itens && Array.isArray(v.itens) && v.itens.length) {
      v.itens.forEach(function (it) {
        if (!it || !it.nome) return;
        var val = _bpIaItemValor(it);
        receitaPorServico[it.nome] = (receitaPorServico[it.nome] || 0) + val;
        receitaItensSemana += val;
      });
    }
  });
  var servicosOrdenados = Object.keys(receitaPorServico).map(function (k) {
    return [k, receitaPorServico[k]];
  }).sort(function (a, b) { return b[1] - a[1]; });
  var baseServ = receitaItensSemana > 0 ? receitaItensSemana : receitaSemanaTotal;
  if (servicosOrdenados.length > 0 && baseServ > 0) {
    var nomeServico = servicosOrdenados[0][0];
    var receitaServico = servicosOrdenados[0][1];
    var pct = Math.round((receitaServico / baseServ) * 100);
    if (pct > 100) pct = 100;
    var conc = pct >= 45;
    pushIns(conc ? 1 : 2, 'star', 'var(--gold-dark)',
      'O serviço "<strong>' + escHtml(nomeServico) + '</strong>" concentra <strong>' + pct + '%</strong> da receita de itens desta semana' +
      (conc ? ' — dependência elevada num único serviço.' : '.'));
  } else if (receitaSemanaTotal > 0) {
    pushIns(2, 'star', 'var(--text-secondary)',
      'Há receita esta semana, mas as vendas sem linhas de item limitam o ranking de serviços.');
  }

  /* Fluxo diário (vendas − despesas) vs média 30 dias — explícito, não confunde com fundo */
  var fluxos30 = [];
  for (var f = 0; f <= 29; f++) {
    fluxos30.push(_bpIaFluxoDia(movs, _bpIaDataOffset(-f)).fluxo);
  }
  var fluxo0 = fluxos30[0];
  var mediaFluxo = fluxos30.slice(1).reduce(function (s, v) { return s + v; }, 0) / 29;
  var temMov30 = fluxos30.some(function (s) { return s !== 0; });
  if (temMov30) {
    var abaixo = fluxo0 < mediaFluxo;
    pushIns(abaixo ? 1 : 2, 'wallet', abaixo ? 'var(--red)' : 'var(--green)',
      'O fluxo de hoje (vendas − despesas) está <strong>' + (abaixo ? 'abaixo' : 'acima') +
      '</strong> da média dos últimos 30 dias' +
      (fundo ? ' · saldo estimado com fundo: ' + fmtKz(saldoEst) : '') + '.');
  } else if (fundo > 0 && totalHoje === 0) {
    pushIns(2, 'wallet', 'var(--text-secondary)',
      'Sem movimentos hoje. Fundo de caixa: <strong>' + fmtKz(fundo) + '</strong>.');
  }

  /* Agenda amanhã — status via _statusAg */
  var amanhaStr = _bpIaDataOffset(1);
  var agAmanha = ags.filter(function (a) {
    if (a.data !== amanhaStr) return false;
    var st = _bpIaSt(a);
    return st !== 'cancelado';
  });
  var agAmanhaActivos = agAmanha.filter(function (a) {
    var st = _bpIaSt(a);
    return st === 'agendado';
  });
  if (agAmanhaActivos.length > 0) {
    pushIns(2, 'calendar', 'var(--text-secondary)',
      'Amanhã tem <strong>' + agAmanhaActivos.length +
      (agAmanhaActivos.length === 1 ? ' agendamento</strong> activo.' : ' agendamentos</strong> activos.'));
  } else {
    pushIns(1, 'calendar', 'var(--text-secondary)',
      'Ainda <strong>não há agendamentos activos</strong> para amanhã — preencha a agenda.');
  }

  /* Pendentes de hoje em atraso (hora já passou e ainda agendado) */
  var agora = new Date();
  var atrasados = agHoje.filter(function (a) {
    if (_bpIaSt(a) !== 'agendado') return false;
    var hora = String(a.hora || '00:00').slice(0, 5);
    var ad = new Date(a.data + 'T' + hora + ':00');
    return !isNaN(ad.getTime()) && ad < agora;
  }).length;
  if (atrasados > 0) {
    pushIns(1, 'calendar', 'var(--red)',
      atrasados === 1
        ? 'Há <strong>1 marcação de hoje</strong> em atraso por finalizar ou actualizar.'
        : 'Há <strong>' + atrasados + ' marcações de hoje</strong> em atraso por finalizar ou actualizar.');
  }

  insights.sort(function (a, b) { return a.prio - b.prio; });
  if (insights.length > 5) insights = insights.slice(0, 5);

  var iconesSvg = {
    trend: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9"/></svg>',
    wallet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="15" height="15" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'
  };
  var listaEl = document.getElementById('ia-insights-list');
  if (listaEl) {
    var bgPorCor = {
      'var(--green)': 'var(--green-50)',
      'var(--red)': 'var(--red-50)',
      'var(--gold-dark)': 'var(--gold-50)',
      'var(--text-secondary)': 'var(--neutral-75)'
    };
    listaEl.innerHTML = insights.map(function (ins) {
      return '<div class="ia-insight-row"><span class="ia-insight-icone" style="color:' + ins.cor +
        ';background:' + (bgPorCor[ins.cor] || 'var(--neutral-75)') + '">' +
        (iconesSvg[ins.icone] || '') + '</span><span>' + ins.texto + '</span></div>';
    }).join('') || '<div class="ia-insight-row"><span>Ainda sem dados suficientes para gerar insights.</span></div>';
  }

  var fim7 = _bpIaDataOffset(7);
  var agProximos = ags.filter(function (a) {
    if (!a.data || a.data < hojeStr || a.data > fim7) return false;
    return _bpIaSt(a) === 'agendado';
  }).length;

  if (typeof renderIASugestoesAdaptativas === 'function') {
    renderIASugestoesAdaptativas({
      totalHoje: totalHoje,
      totalDespHoje: totalDespHoje,
      fluxoHoje: fluxoHoje,
      media7: media7,
      inativos: inativos,
      pendentesHoje: pendentesHoje,
      atrasados: atrasados,
      agAmanha: agAmanhaActivos.length,
      agProximos: agProximos,
      ticketHoje: ticketHoje,
      temServicoTop: servicosOrdenados.length > 0
    });
  }
}

function renderIASugestoesAdaptativas(ctx) {
  var grid = document.querySelector('#tab-ia .ia-sugestoes-grid');
  if (!grid || !ctx) return;

  var pool = [];
  function add(score, label, pergunta, tone) {
    pool.push({ score: score, label: label, pergunta: pergunta, tone: tone || 'ia-sug-graphite' });
  }

  /* Atenção primeiro */
  if (ctx.atrasados > 0) {
    add(100, 'Marcações em atraso', 'Quais marcações de hoje estão pendentes?', 'ia-sug-gold');
  }
  if (ctx.totalHoje === 0 && ctx.media7 > 0) {
    add(95, 'Receita hoje', 'Qual foi a minha receita hoje?', 'ia-sug-green');
  } else {
    add(40, 'Receita hoje', 'Qual foi a minha receita hoje?', 'ia-sug-green');
  }
  if (ctx.inativos > 0) {
    add(90, 'Clientes inactivos', 'Quais clientes estão inativos?', 'ia-sug-gold');
  } else {
    add(35, 'Clientes VIP', 'Quem são os meus clientes VIP?', 'ia-sug-gold');
  }
  if (ctx.agAmanha === 0) {
    add(88, 'Agenda amanhã', 'O que tenho agendado para amanhã?', 'ia-sug-green');
  } else {
    add(50, 'Agenda amanhã', 'O que tenho agendado para amanhã?', 'ia-sug-green');
  }
  if (ctx.fluxoHoje < 0 || ctx.totalDespHoje > ctx.totalHoje) {
    add(85, 'Fluxo de caixa', 'Como está o fluxo de caixa?', 'ia-sug-gold');
  } else {
    add(45, 'Fluxo de caixa', 'Como está o fluxo de caixa?', 'ia-sug-gold');
  }
  if (ctx.temServicoTop) {
    add(55, 'Serviço campeão', 'Qual é o meu serviço mais vendido?', 'ia-sug-graphite');
  }
  add(42, 'Ticket médio', 'Qual é o meu ticket médio?', 'ia-sug-graphite');
  if (ctx.pendentesHoje > 0) {
    add(60, 'Agenda de hoje', 'Como está a minha agenda?', 'ia-sug-green');
  }
  /* Calendário externo (.ics) — reutiliza BPOps.downloadIcs se existir */
  if (ctx.agProximos > 0 && window.BPOps && typeof window.BPOps.downloadIcs === 'function') {
    add(72, 'Exportar calendário', '__bp_export_ics__', 'ia-sug-graphite');
  } else if (ctx.agAmanha > 0 && window.BPOps && typeof window.BPOps.downloadIcs === 'function') {
    add(65, 'Exportar calendário', '__bp_export_ics__', 'ia-sug-graphite');
  }

  pool.sort(function (a, b) { return b.score - a.score; });
  /* Intercalar: evitar dois tons iguais seguidos quando possível */
  var picked = [];
  var usedLabel = {};
  for (var i = 0; i < pool.length && picked.length < 6; i++) {
    var c = pool[i];
    if (usedLabel[c.label]) continue;
    if (picked.length && picked[picked.length - 1].tone === c.tone) {
      var swap = null;
      for (var j = i + 1; j < pool.length; j++) {
        if (!usedLabel[pool[j].label] && pool[j].tone !== c.tone) { swap = pool[j]; pool[j] = c; break; }
      }
      if (swap) c = swap;
    }
    usedLabel[c.label] = true;
    picked.push(c);
  }

  var svg = {
    'ia-sug-green': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 18 8.5 10.5 13.5 15.5 23 6"/><polyline points="17 6 23 6 23 12"/></svg>',
    'ia-sug-gold': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    'ia-sug-graphite': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9"/></svg>'
  };
  grid.innerHTML = picked.map(function (c) {
    return '<button type="button" class="ia-sugestao-card" data-pergunta="' +
      String(c.pergunta).replace(/"/g, '&quot;') + '">' +
      '<span class="ia-sugestao-icone ' + c.tone + '">' + (svg[c.tone] || svg['ia-sug-graphite']) + '</span>' +
      '<span>' + c.label + '</span></button>';
  }).join('');
}

function chaveIAPerguntas() {
  return 'ia_perguntas_' + ((state.config && state.config.salaoId) || 'local') + '_' + hoje();
}

function getUsoIAHoje() {
  return parseInt(localStorage.getItem(chaveIAPerguntas()) || '0', 10) || 0;
}

function setUsoIAHoje(n) {
  localStorage.setItem(chaveIAPerguntas(), String(Math.max(0, n | 0)));
  actualizarContadorIA();
  // ET4.6: propagar contador para Supabase (salao_config + tabela ia_uso_diario se existir)
  try {
    if (typeof bpPushIAUsoToSupabase === 'function') {
      Promise.resolve(bpPushIAUsoToSupabase(Math.max(0, n | 0))).then(function (ok) {
        if (ok === false && navigator.onLine && typeof toast === 'function') {
          if (!window.__bpIaPushFailToast) {
            window.__bpIaPushFailToast = true;
            toast('Falha ao sincronizar uso da IA. Tente novamente mais tarde.', 'warning');
            setTimeout(function () { window.__bpIaPushFailToast = false; }, 60000);
          }
        }
      }).catch(function () {});
    }
  } catch (_) {}
}

/** Lê uso remoto e fica com max(local, remoto) — multi-dispositivo no mesmo dia. */
async function bpPullIAUsoFromSupabase() {
  try {
    if (!navigator.onLine || !state.config || !state.config.salaoId) return null;
    if (typeof supabaseClient === 'undefined' || !supabaseClient) return null;
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session || !session.access_token) return null;
    const dia = typeof hoje === 'function' ? hoje() : new Date().toISOString().slice(0, 10);
    const headers = {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + session.access_token
    };
    // Preferir tabela dedicada
    let remote = null;
    try {
      const r1 = await fetch(
        SUPABASE_URL + '/rest/v1/ia_uso_diario?salao_id=eq.' + encodeURIComponent(state.config.salaoId) +
        '&dia=eq.' + encodeURIComponent(dia) + '&select=perguntas',
        { headers: headers }
      );
      if (r1.ok) {
        const rows = await r1.json();
        if (rows && rows[0] && rows[0].perguntas != null) remote = parseInt(rows[0].perguntas, 10);
      }
    } catch (_) {}
    // Fallback salao_config
    if (remote == null || isNaN(remote)) {
      try {
        const r2 = await fetch(
          SUPABASE_URL + '/rest/v1/salao_config?salao_id=eq.' + encodeURIComponent(state.config.salaoId) +
          '&select=ia_perguntas_hoje,ia_perguntas_dia',
          { headers: headers }
        );
        if (r2.ok) {
          const rows = await r2.json();
          if (rows && rows[0]) {
            const d = rows[0].ia_perguntas_dia;
            if (d === dia && rows[0].ia_perguntas_hoje != null) {
              remote = parseInt(rows[0].ia_perguntas_hoje, 10);
            }
          }
        }
      } catch (_) {}
    }
    if (remote == null || isNaN(remote)) return null;
    const local = getUsoIAHoje();
    if (remote > local) setUsoIAHoje(remote);
    return remote;
  } catch (e) {
    return null;
  }
}

async function bpPushIAUsoToSupabase(n) {
  try {
    if (!navigator.onLine || !state.config || !state.config.salaoId) return false;
    if (typeof supabaseClient === 'undefined' || !supabaseClient) return false;
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session || !session.access_token) return false;
    const dia = typeof hoje === 'function' ? hoje() : new Date().toISOString().slice(0, 10);
    const headers = {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + session.access_token,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=minimal'
    };
    var okAny = false;
    // Tabela ia_uso_diario (PK salao_id+dia)
    try {
      var r1 = await fetch(SUPABASE_URL + '/rest/v1/ia_uso_diario', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          salao_id: state.config.salaoId,
          dia: dia,
          perguntas: n,
          updated_at: new Date().toISOString()
        })
      });
      if (!r1.ok) {
        var t1 = '';
        try { t1 = await r1.text(); } catch (_) {}
        console.error('[IA Push] ia_uso_diario', r1.status, t1);
      } else {
        okAny = true;
      }
    } catch (e1) {
      console.error('[IA Push] ia_uso_diario exception', e1);
    }
    // Espelho em salao_config
    try {
      var r2 = await fetch(
        SUPABASE_URL + '/rest/v1/salao_config?salao_id=eq.' + encodeURIComponent(state.config.salaoId),
        {
          method: 'PATCH',
          headers: headers,
          body: JSON.stringify({
            ia_perguntas_hoje: n,
            ia_perguntas_dia: dia,
            updated_at: new Date().toISOString()
          })
        }
      );
      if (!r2.ok) {
        var t2 = '';
        try { t2 = await r2.text(); } catch (_) {}
        console.error('[IA Push] salao_config', r2.status, t2);
      } else {
        okAny = true;
      }
    } catch (e2) {
      console.error('[IA Push] salao_config exception', e2);
    }
    return okAny;
  } catch (e) {
    console.error('[IA Push] falha', e);
    return false;
  }
}

if (typeof window !== 'undefined') {
  window.bpPullIAUsoFromSupabase = bpPullIAUsoFromSupabase;
  window.bpPushIAUsoToSupabase = bpPushIAUsoToSupabase;
}


/** Estado real da aba IA — nunca “Online” falso. */
function _bpIaIsOnline() {
  try { return navigator.onLine !== false; } catch (_) { return true; }
}
function _bpIaSetComposerStatus(text) {
  var el = document.getElementById('ia-status');
  if (el) el.textContent = text || '';
}
function _bpIaSetHeaderStatus(kind, detail) {
  var line = document.getElementById('ia-status-line-text');
  var root = document.querySelector('#tab-ia .ia-status-line');
  if (!line && root) {
    /* fallback: actualiza texto do nó de linha */
    var sep = root.querySelector('.ia-status-sep');
    if (sep && sep.nextSibling) {
      /* ignore */
    }
  }
  if (line) {
    if (kind === 'offline') line.textContent = 'Offline — respostas locais quando possível';
    else if (kind === 'busy') line.textContent = detail || 'A processar…';
    else if (kind === 'error') line.textContent = detail || 'Indisponível de momento';
    else if (kind === 'local') line.textContent = 'Dados locais do salão';
    else line.textContent = 'Pronta a analisar o seu negócio';
  }
  if (root) {
    root.setAttribute('data-ia-conn', kind === 'offline' ? 'offline' : (kind === 'error' ? 'error' : 'ok'));
    var dot = root.querySelector('.ia-status-dot');
    if (dot) {
      dot.setAttribute('data-state', kind === 'offline' ? 'offline' : (kind === 'busy' ? 'busy' : (kind === 'error' ? 'error' : 'ok')));
    }
  }
  var label = document.getElementById('ia-status-line-label');
  if (label) {
    if (kind === 'offline') label.textContent = 'Offline';
    else if (kind === 'busy') label.textContent = 'A trabalhar';
    else if (kind === 'error') label.textContent = 'Aviso';
    else label.textContent = 'Ligado';
  }
}
function atualizarIAOffline() {
  var online = _bpIaIsOnline();
  var overlay = document.getElementById('ia-offline-overlay');
  if (overlay) {
    overlay.style.display = 'none';
    overlay.setAttribute('aria-hidden', 'true');
  }
  if (!_iaBusy) {
    if (!online) {
      _bpIaSetHeaderStatus('offline');
      _bpIaSetComposerStatus('Modo local');
    } else {
      _bpIaSetHeaderStatus('ok');
      _bpIaSetComposerStatus('IA pronta');
    }
  }
  return online;
}
try {
  window.addEventListener('online', function () { try { atualizarIAOffline(); } catch (_) {} });
  window.addEventListener('offline', function () { try { atualizarIAOffline(); } catch (_) {} });
} catch (_) {}

function actualizarContadorIA() {
  const cont = document.getElementById('ia-contador');
  if (!cont) return;
  const plano = typeof getPlanoAtual === 'function' ? getPlanoAtual() : 'trial';
  const info = (typeof PLANOS !== 'undefined' && PLANOS[plano]) ? PLANOS[plano] : { iaDia: 0 };
  const usadas = getUsoIAHoje();
  const lim = info.iaDia;
  if (!lim || lim === 0) {
    cont.textContent = usadas + ' · plano sem cota IA';
    return;
  }
  if (lim === Infinity) {
    cont.textContent = String(usadas) + ' hoje';
    return;
  }
  cont.textContent = usadas + ' / ' + lim;
}

function normalizarPerguntaIA(q) {
  return String(q || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Respostas determinísticas a partir dos dados locais (sem gastar cota da API).
 * Devolve string ou null se não houver intenção clara.
 */
function responderIALocal(pergunta) {
  var raw = String(pergunta || '').trim();
  if (!raw || raw.length < 2) return null;

  var q = (typeof normalizarPerguntaIA === 'function')
    ? normalizarPerguntaIA(raw)
    : raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();

  if (!q || q.length < 3) return null;

  /* state.clientes = ficha da aba Clientes (fonte de verdade) */
  var st = (typeof state !== 'undefined' && state) ? state : (typeof window !== 'undefined' ? window.state : null);
  if (!st || !Array.isArray(st.clientes)) return null;

  var _isAct = function (x) {
    return x && x.nome && x.ativo !== false && x.ativo !== 0 && x.ativo !== 'false';
  };
  var _activos = st.clientes.filter(_isAct);

  /* Gasto por nome E por cliente_id (evita falso "sem venda") */
  var _gastoNome = {};
  var _gastoId = {};
  (st.movimentos || []).forEach(function (m) {
    if (!m || m.tipo !== 'venda') return;
    var val = Number(m.valor) || 0;
    if (m.cliente_id) {
      _gastoId[String(m.cliente_id)] = (_gastoId[String(m.cliente_id)] || 0) + val;
    }
    var cn = String(m.cliente || '').trim();
    if (cn) _gastoNome[cn] = (_gastoNome[cn] || 0) + val;
  });
  var _gastoDe = function (c) {
    var byId = c.id ? (_gastoId[String(c.id)] || 0) : 0;
    var byNome = _gastoNome[String(c.nome || '').trim()] || 0;
    return byId > 0 ? byId : byNome;
  };

  var _semVenda = _activos.filter(function (c) { return !(_gastoDe(c) > 0); });
  var _comVenda = _activos.filter(function (c) { return _gastoDe(c) > 0; });

  var pedeClientes =
    /\bclientes?\b/.test(q) ||
    /\bficha\b/.test(q) ||
    /\baba\b/.test(q);
  var pedeLista =
    /\b(lista|listar|mostra|mostrar|quais|quem|todos|todas|elenca|nomeia|devolve|ver|mostra-me|me de|me dê|manda)\b/.test(q) ||
    /\bsem (nenhuma )?venda\b/.test(q) ||
    /\bsem compra\b/.test(q) ||
    /\bcadastrad/.test(q);
  var pedeSemVenda =
    /\bsem (nenhuma )?venda\b/.test(q) ||
    /\bsem compra\b/.test(q) ||
    /\bsem gasto\b/.test(q) ||
    /\bnunca compr/.test(q) ||
    /\bnenhuma venda\b/.test(q) ||
    /\b0 venda\b/.test(q) ||
    /\bsem registo de venda\b/.test(q);

  /* Interceptação forte: qualquer pedido de lista/ficha de clientes */
  if (pedeClientes && (pedeLista || pedeSemVenda)) {
    try {
      if (typeof console !== 'undefined' && console.info) {
        console.info('[Benza local] ficha clientes', {
          activos: _activos.length,
          semVenda: _semVenda.length,
          comVenda: _comVenda.length,
          pergunta: raw.slice(0, 120)
        });
      }
    } catch (_) {}

    if (!_activos.length) {
      return 'Na aba Clientes não há clientes activos neste salão.';
    }

    if (pedeSemVenda) {
      if (!_semVenda.length) {
        return 'Na aba Clientes há ' + _activos.length +
          ' activo(s) e todos já têm pelo menos uma venda registada.';
      }
      var ls = _semVenda.map(function (c, i) {
        return (i + 1) + '. ' + c.nome + (c.telefone ? ' · ' + c.telefone : '');
      });
      return 'Clientes da aba Clientes SEM nenhuma venda (' +
        _semVenda.length + ' de ' + _activos.length + '):\n' + ls.join('\n');
    }

    var lt = _activos.map(function (c, i) {
      var g = _gastoDe(c);
      return (i + 1) + '. ' + c.nome +
        (c.telefone ? ' · ' + c.telefone : '') +
        (g > 0 ? '' : ' · sem venda');
    });
    return 'Clientes da aba Clientes (' + _activos.length + '):\n' + lt.join('\n') +
      (_semVenda.length
        ? ('\n\nSem nenhuma venda: ' + _semVenda.length +
           ' (' + _semVenda.map(function (c) { return c.nome; }).join(', ') + ').')
        : '');
  }

  if (!st.movimentos || !st.agendamentos) return null;

  /* ---- Portão inteligente (métricas curtas) ---- */
  if (raw.length > 72) return null;
  if ((raw.match(/[.?!;]/g) || []).length >= 2) return null;
  var palavras = q.split(/\s+/).filter(Boolean);
  if (palavras.length > 10) return null;

  var temas = 0;
  if (/(fatur|receita|vendeu|venda|vendas)/.test(q)) temas++;
  if (/(despes|gastou)/.test(q)) temas++;
  if (/(agenda|marcac)/.test(q)) temas++;
  if (/(cliente|equipa|profissional|servico)/.test(q)) temas++;
  if (/(saldo|caixa|fundo)/.test(q)) temas++;
  if (temas >= 2) return null;

  var hojeStr = typeof hoje === 'function' ? hoje() : '';
  var num = function (v) { return Number(v) || 0; };
  var vendasHoje = (st.movimentos || []).filter(function (m) {
    return m.data === hojeStr && m.tipo === 'venda';
  });
  var despHoje = (st.movimentos || []).filter(function (m) {
    return m.data === hojeStr && m.tipo === 'despesa';
  });
  var totalVendas = vendasHoje.reduce(function (s, v) { return s + num(v.valor); }, 0);
  var totalDesp = despHoje.reduce(function (s, v) { return s + num(v.valor); }, 0);
  var fundo = num(st.config && st.config.fundo);
  var saldo = fundo + totalVendas - totalDesp;
  var agHoje = (st.agendamentos || []).filter(function (a) { return a.data === hojeStr; });
  var pend = agHoje.filter(function (a) {
    var stt = String(a.status || a.estado || '').toLowerCase();
    return stt === 'agendado' || (!stt);
  });
  var ticket = vendasHoje.length ? Math.round(totalVendas / vendasHoje.length) : 0;

  var soHoje =
    /^(quanto|qual|como)\b/.test(q) ||
    /\bhoje\b/.test(q) ||
    /^(faturamento|vendas|despesas|agenda|saldo|caixa)\b/.test(q);

  if (!soHoje && !/^(quantos|numero|nº|total de)\b/.test(q)) {
    return null;
  }

  if (
    /^(quanto\s+(faturei|vendi|foi\s+o\s+faturamento)|faturamento(\s+de\s+hoje)?|vendas(\s+de\s+hoje)?|quanto\s+foi\s+hoje|receita\s+de\s+hoje)\b/.test(q) ||
    (/^(quanto|qual)\b/.test(q) && /(fatur|vendeu|vendas|receita)/.test(q) && /\bhoje\b/.test(q) && !/despes/.test(q))
  ) {
    return 'Hoje: ' + vendasHoje.length + (vendasHoje.length === 1 ? ' venda' : ' vendas') +
      ' · total ' + (typeof fmtKz === 'function' ? fmtKz(totalVendas) : totalVendas + ' Kz') +
      (ticket ? ' · ticket médio ' + (typeof fmtKz === 'function' ? fmtKz(ticket) : ticket + ' Kz') + '.' : '.');
  }

  if (
    /^(despesas(\s+de\s+hoje)?|quanto\s+(gastei|foi\s+de\s+despesa))\b/.test(q) ||
    (/^(quanto|qual)\b/.test(q) && /despes|gastei/.test(q))
  ) {
    return 'Despesas de hoje: ' + (typeof fmtKz === 'function' ? fmtKz(totalDesp) : totalDesp + ' Kz') +
      (despHoje.length ? ' (' + despHoje.length + (despHoje.length === 1 ? ' registo).' : ' registos).') : '.');
  }

  if (/^(saldo|caixa|fundo)(\s+de\s+hoje)?\b/.test(q) || (/^(quanto|qual)\b/.test(q) && /(saldo|caixa|fundo)/.test(q))) {
    return 'Fundo ' + (typeof fmtKz === 'function' ? fmtKz(fundo) : fundo + ' Kz') +
      ' · vendas ' + (typeof fmtKz === 'function' ? fmtKz(totalVendas) : totalVendas + ' Kz') +
      ' · despesas ' + (typeof fmtKz === 'function' ? fmtKz(totalDesp) : totalDesp + ' Kz') +
      ' → saldo estimado ' + (typeof fmtKz === 'function' ? fmtKz(saldo) : saldo + ' Kz') + '.';
  }

  if (
    /^(agenda(\s+de\s+hoje)?|marcacoes\s+de\s+hoje|o\s+que\s+tenho\s+hoje)\b/.test(q) ||
    (/^(quantos|como)\b/.test(q) && /agenda|marcac|pendente/.test(q) && (/\bhoje\b/.test(q) || palavras.length <= 6))
  ) {
    return 'Agenda de hoje: ' + agHoje.length + ' marcações · ' + pend.length + ' pendentes.';
  }

  if (/^(quantos\s+clientes|numero\s+de\s+clientes|nº\s+de\s+clientes|total\s+de\s+clientes)\b/.test(q)) {
    return 'Tem ' + _activos.length + (_activos.length === 1 ? ' cliente activo' : ' clientes activos') + ' na aba Clientes.';
  }

  if (/^(quantos\s+profissionais|tamanho\s+da\s+equipa|quantos\s+na\s+equipa)\b/.test(q)) {
    var np = (st.profissionais || []).filter(_isAct).length;
    return 'Equipa: ' + np + (np === 1 ? ' profissional activo.' : ' profissionais activos.');
  }

  return null;
}

if (typeof window !== 'undefined') {
  window.responderIALocal = responderIALocal;
  window.buildContextoIA = buildContextoIA;
}
let _iaBusy = false;
window.__bpIaLastMeta = { fonte: null };

async function perguntarIA(pergunta) {
  const q = String(pergunta || '').trim();
  if (!q) {
    toast('Escreva uma pergunta.', 'warning');
    return null;
  }
  if (q.length > 2000) {
    toast('Pergunta demasiado longa (máx. 2000 caracteres).', 'warning');
    return null;
  }
  if (_iaBusy) return null;

  const plano = typeof getPlanoAtual === 'function' ? getPlanoAtual() : 'trial';
  const iaDia = (typeof PLANOS !== 'undefined' && PLANOS[plano]) ? PLANOS[plano].iaDia : 0;
  if (iaDia === 0) {
    try { _bpIaSetComposerStatus('Sem cota IA neste plano'); } catch (_) {}
    mostrarModalUpgrade('O Agente IA está disponível no plano Pro (5 perguntas/dia) e Premium (ilimitado).');
    return null;
  }

  const usadas = getUsoIAHoje();
  if (iaDia !== Infinity && usadas >= iaDia) {
    try { _bpIaSetComposerStatus('Limite diário atingido'); } catch (_) {}
    if (plano === 'pro') {
      mostrarModalUpgrade('Atingiu o limite de 5 perguntas/dia do plano Pro. Faça upgrade para Premium para perguntas ilimitadas.');
    } else {
      toast('Limite de perguntas atingido para hoje.', 'warning');
    }
    return null;
  }

  // Respostas locais DESACTIVADAS — toda a pergunta vai à Edge (ia-query)
  // para garantir contexto completo + regras sobre clientes sem venda.

  // ET4.2-P0: IA online só admin/gerente (aba já filtrada; reforço operacional)
  if (typeof bpExigirRole === 'function' && !bpExigirRole(['admin', 'gerente'], 'Não tem permissão para usar o agente IA.')) {
    return null;
  }

  const contextoRaw = buildContextoIA();
  if (contextoRaw && contextoRaw.erro) {
    toast(contextoRaw.erro, 'warning');
    return null;
  }
  const contexto = (typeof _bpIaContextoCompacto === 'function')
    ? _bpIaContextoCompacto(contextoRaw)
    : contextoRaw;
  const historicoEnvio = (typeof _bpIaHistoricoCompacto === 'function')
    ? _bpIaHistoricoCompacto(iaHistorico, 8, 900)
    : (iaHistorico || []).slice(-8);

  _iaBusy = true;
  window.__bpIaLastMeta = { fonte: null };
  try { _bpIaSetHeaderStatus('busy', 'A contactar o agente…'); _bpIaSetComposerStatus('A processar…'); } catch (_) {}
  try {
    // Auth resiliente: JWT de utilizador, com 1 retry após refresh se falhar.
    var iaHeaders = { 'Content-Type': 'application/json' };
    var iaAuthMode = 'none';
    try {
      if (typeof getAuthHeaders !== 'function') {
        if (typeof toast === 'function') toast('Sessão inválida. Faça login novamente.', 'error');
        return null;
      }
      var authH = null;
      try {
        authH = await getAuthHeaders();
      } catch (e1) {
        // Segunda tentativa após refresh explícito
        try {
          if (typeof supabaseClient !== 'undefined' && supabaseClient.auth) {
            await supabaseClient.auth.refreshSession();
          }
        } catch (_) {}
        try {
          authH = await getAuthHeaders();
        } catch (e2) {
          if (e2 && e2.message === 'SESSION_EXPIRED') {
            if (typeof toast === 'function') toast('Sessão expirada. Faça login novamente.', 'error');
            return null;
          }
          throw e2;
        }
      }
      if (!authH || !authH.Authorization) {
        if (typeof toast === 'function') toast('Sessão inválida. Faça login novamente.', 'error');
        return null;
      }
      iaHeaders['Authorization'] = authH.Authorization;
      if (authH.apikey) iaHeaders['apikey'] = authH.apikey;
      else if (typeof SUPABASE_ANON_KEY !== 'undefined') iaHeaders['apikey'] = SUPABASE_ANON_KEY;
      iaAuthMode = 'user-jwt';
    } catch (eAuth) {
      if (eAuth && eAuth.message === 'SESSION_EXPIRED') {
        if (typeof toast === 'function') toast('Sessão expirada. Faça login novamente.', 'error');
        return null;
      }
      if (typeof toast === 'function') toast('Não foi possível autenticar o agente IA.', 'error');
      return null;
    }
    window.__bpIaLastMeta = { fonte: null, auth: iaAuthMode };

    const resp = await fetch(IA_EDGE_URL, {
      method: 'POST',
      headers: iaHeaders,
      body: JSON.stringify({
        pergunta: q,
        contexto: contexto,
        historico: historicoEnvio,
        plano: plano || undefined,
        instrucoes:
          'Responde em português de Angola. Calibra o tamanho: pergunta simples → curto; análise → estruturado. ' +
          'Nunca cortes frases a meio. Usa o histórico. Sê estratégico e prático.'
      })
    });

    if (!resp.ok) {
      if (resp.status === 429) {
        mostrarModalUpgrade('Limite de perguntas atingido. Faça upgrade para continuar.');
        return null;
      }
      if (resp.status === 503) {
        return 'Agente IA temporariamente indisponível. Tente dentro de momentos.';
      }
      return 'Não foi possível contactar o agente IA. Verifique a ligação e tente de novo.';
    }

    const data = await resp.json();
    setUsoIAHoje(usadas + 1);

    const resposta = data.resposta || 'Não consegui responder. Tente de novo.';
    iaHistorico.push({ pergunta: q, resposta: resposta, fonte: 'api' });
    if (iaHistorico.length > IA_HIST_MAX) iaHistorico = iaHistorico.slice(-IA_HIST_MAX);
    window.__bpIaLastMeta = { fonte: 'api' };
    return resposta;
  } catch (e) {
    window.__bpIaLastMeta = { fonte: 'error' };
    return 'Sem ligação à internet. Tente novamente quando a ligação voltar.';
  } finally {
    _iaBusy = false;
  }
}

/** Nome fixo do assistente (produto). Botão renomear permanece oculto no HTML. */
function getNomeIA() { return 'Benza'; }

function formatarTempoRelativoIA(ts) {
  if (!ts) return '';
  const diffSeg = Math.floor((Date.now() - ts) / 1000);
  if (diffSeg < 10) return 'agora mesmo';
  if (diffSeg < 60) return `há ${diffSeg} segundos`;
  const diffMin = Math.floor(diffSeg / 60);
  if (diffMin < 60) return `há ${diffMin} ${diffMin === 1 ? 'minuto' : 'minutos'}`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `há ${diffH} ${diffH === 1 ? 'hora' : 'horas'}`;
  return `há ${Math.floor(diffH / 24)} dias`;
}
function montarMsgUsuarioIA(pergunta) { return `<div class="ia-msg-user ia-msg-enter">${escHtml(pergunta)}</div>`; }

/**
 * Markdown seguro → HTML (XSS-safe).
 * Suporta: negrito, itálico, cabeçalhos, listas, tabelas, código inline, quebras.
 * Nunca injecta HTML cru da resposta.
 */
function formatarRespostaIA(texto) {
  if (texto == null) return '';
  var raw = String(texto).replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  if (!raw) return '';

  // 1) Escapar tudo primeiro
  var safe = (typeof escHtml === 'function') ? escHtml(raw) : raw
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  var lines = safe.split('\n');
  var out = [];
  var i = 0;
  var inUl = false;
  var inOl = false;
  var inCode = false;
  var codeBuf = [];

  function closeLists() {
    if (inUl) { out.push('</ul>'); inUl = false; }
    if (inOl) { out.push('</ol>'); inOl = false; }
  }

  function inlineFmt(s) {
    // código inline `code`
    s = s.replace(/`([^`]+)`/g, '<code class="ia-md-code">$1</code>');
    // negrito **text** ou __text__
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    // itálico *text* (evitar conflito com **)
    s = s.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
    return s;
  }

  function isTableSep(line) {
    return /^\s*\|?[\s:|-]+\|[\s|:|-]*$/.test(line) && line.indexOf('|') !== -1 && /[-:]/.test(line);
  }

  function isTableRow(line) {
    return line.indexOf('|') !== -1 && line.trim().length > 0;
  }

  function parseTableRow(line) {
    var cells = line.replace(/^\|/, '').replace(/\|$/, '').split('|');
    return cells.map(function (c) { return c.trim(); });
  }

  while (i < lines.length) {
    var line = lines[i];

    // bloco de código ```
    if (/^```/.test(line.trim())) {
      if (!inCode) {
        closeLists();
        inCode = true;
        codeBuf = [];
      } else {
        out.push('<pre class="ia-md-pre"><code>' + codeBuf.join('\n') + '</code></pre>');
        inCode = false;
        codeBuf = [];
      }
      i++;
      continue;
    }
    if (inCode) {
      codeBuf.push(line);
      i++;
      continue;
    }

    // tabela markdown
    if (isTableRow(line) && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      closeLists();
      var headers = parseTableRow(line);
      i += 2; // skip header + separator
      var rows = [];
      while (i < lines.length && isTableRow(lines[i]) && !isTableSep(lines[i])) {
        rows.push(parseTableRow(lines[i]));
        i++;
      }
      var html = '<div class="ia-md-table-wrap"><table class="ia-md-table"><thead><tr>';
      headers.forEach(function (h) { html += '<th>' + inlineFmt(h) + '</th>'; });
      html += '</tr></thead><tbody>';
      rows.forEach(function (row) {
        html += '<tr>';
        for (var c = 0; c < headers.length; c++) {
          html += '<td>' + inlineFmt(row[c] != null ? row[c] : '') + '</td>';
        }
        html += '</tr>';
      });
      html += '</tbody></table></div>';
      out.push(html);
      continue;
    }

    // cabeçalhos
    var hm = line.match(/^(#{1,3})\s+(.+)$/);
    if (hm) {
      closeLists();
      var level = hm[1].length;
      out.push('<div class="ia-md-h ia-md-h' + level + '">' + inlineFmt(hm[2]) + '</div>');
      i++;
      continue;
    }

    // lista não ordenada
    var ul = line.match(/^\s*[-*•]\s+(.+)$/);
    if (ul) {
      if (inOl) { out.push('</ol>'); inOl = false; }
      if (!inUl) { out.push('<ul class="ia-md-ul">'); inUl = true; }
      out.push('<li>' + inlineFmt(ul[1]) + '</li>');
      i++;
      continue;
    }

    // lista ordenada
    var ol = line.match(/^\s*(\d+)[.)]\s+(.+)$/);
    if (ol) {
      if (inUl) { out.push('</ul>'); inUl = false; }
      if (!inOl) { out.push('<ol class="ia-md-ol">'); inOl = true; }
      out.push('<li>' + inlineFmt(ol[2]) + '</li>');
      i++;
      continue;
    }

    // linha vazia
    if (!line.trim()) {
      closeLists();
      out.push('<div class="ia-md-gap"></div>');
      i++;
      continue;
    }

    // parágrafo
    closeLists();
    out.push('<p class="ia-md-p">' + inlineFmt(line) + '</p>');
    i++;
  }
  closeLists();
  if (inCode && codeBuf.length) {
    out.push('<pre class="ia-md-pre"><code>' + codeBuf.join('\n') + '</code></pre>');
  }
  return out.join('');
}

/** Texto limpo para clipboard (sem **, | de markdown cru). */
function textoPlanoRespostaIA(texto) {
  if (texto == null) return '';
  var s = String(texto).replace(/\r\n/g, '\n');
  // remover formatação markdown comum
  s = s.replace(/\*\*([^*]+)\*\*/g, '$1');
  s = s.replace(/__([^_]+)__/g, '$1');
  s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1$2');
  s = s.replace(/^#{1,3}\s+/gm, '');
  s = s.replace(/`([^`]+)`/g, '$1');
  s = s.replace(/^```[\w]*\n?/gm, '').replace(/^```$/gm, '');
  // tabelas → linhas tab-separadas legíveis
  s = s.split('\n').map(function (line) {
    if (line.indexOf('|') === -1) return line;
    if (/^\s*\|?[\s:|-]+\|/.test(line)) return ''; // separador
    return line.replace(/^\|/, '').replace(/\|$/, '').split('|').map(function (c) {
      return c.trim();
    }).filter(Boolean).join('\t');
  }).join('\n');
  s = s.replace(/\n{3,}/g, '\n\n').trim();
  return s;
}

function _bpIaSvg(name) {
  var s = {
    copy: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    share: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>',
    up: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>',
    down: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/><path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>',
    regen: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>'
  };
  return s[name] || '';
}

/** Follow-ups contextuais — tom de assistente de salão (não robótico). */
var _bpIaRecentFollowups = [];
(function _bpIaLoadRecentFollowups() {
  try {
    var raw = sessionStorage.getItem('bp_ia_recent_followups');
    var arr = raw ? JSON.parse(raw) : [];
    if (Array.isArray(arr)) _bpIaRecentFollowups = arr.filter(function (x) { return typeof x === 'string'; }).slice(-36);
  } catch (_) { _bpIaRecentFollowups = []; }
})();
function _bpIaRememberFollowups(items) {
  try {
    (items || []).forEach(function (it) {
      var k1 = typeof _bpIaNormFollowKey === 'function' ? _bpIaNormFollowKey(it && it.label) : String((it && it.label) || '').toLowerCase();
      var k2 = typeof _bpIaNormFollowKey === 'function' ? _bpIaNormFollowKey(it && it.pergunta) : String((it && it.pergunta) || '').toLowerCase();
      [k1, k2].forEach(function (k) {
        if (!k || k.length < 6) return;
        if (_bpIaRecentFollowups.indexOf(k) === -1) _bpIaRecentFollowups.push(k);
      });
    });
    if (_bpIaRecentFollowups.length > 36) _bpIaRecentFollowups = _bpIaRecentFollowups.slice(-36);
    try { sessionStorage.setItem('bp_ia_recent_followups', JSON.stringify(_bpIaRecentFollowups)); } catch (_) {}
  } catch (_) {}
}
function _bpIaNormFollowKey(s) {
  var t = String(s || '').toLowerCase();
  try {
    if (typeof t.normalize === 'function') t = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  } catch (_) {}
  return t.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 96);
}
function _bpIaTokenOverlap(a, b) {
  var ta = _bpIaNormFollowKey(a).split(' ').filter(function (t) { return t.length > 3; });
  var tb = _bpIaNormFollowKey(b).split(' ').filter(function (t) { return t.length > 3; });
  if (ta.length < 2 || tb.length < 2) return 0;
  var set = {};
  for (var i = 0; i < tb.length; i++) set[tb[i]] = 1;
  var hit = 0;
  for (var j = 0; j < ta.length; j++) if (set[ta[j]]) hit++;
  return hit / Math.max(ta.length, tb.length);
}
function _bpIaIsRecentFollowup(label, perguntaFull) {
  var a = _bpIaNormFollowKey(label);
  var b = _bpIaNormFollowKey(perguntaFull);
  /* só compara com as 12 mais recentes — evita bloqueio excessivo */
  var recent = _bpIaRecentFollowups.slice(-12);
  for (var i = 0; i < recent.length; i++) {
    var r = recent[i];
    if (!r || r.length < 8) continue;
    if (a && a === r) return true;
    if (b && b === r) return true;
    /* substring só se ambos longos e um contém o outro quase por completo */
    if (a && a.length > 20 && r.length > 20 && (a.indexOf(r) !== -1 || r.indexOf(a) !== -1)) return true;
    if (b && b.length > 20 && r.length > 20 && (b.indexOf(r) !== -1 || r.indexOf(b) !== -1)) return true;
    if (a && _bpIaTokenOverlap(a, r) >= 0.72) return true;
    if (b && _bpIaTokenOverlap(b, r) >= 0.72) return true;
  }
  return false;
}
function gerarFollowupsEstrategicosIA(pergunta, resposta) {
  var qRaw = String(pergunta || '').trim();
  var rRaw = String(resposta || '').trim();
  var q = (typeof normalizarPerguntaIA === 'function' ? normalizarPerguntaIA(pergunta) : qRaw.toLowerCase());
  var r = rRaw.toLowerCase();
  var out = [];
  function add(label, perguntaFull) {
    if (out.length >= 3) return;
    label = String(label || '').trim();
    perguntaFull = String(perguntaFull || '').trim();
    if (!label || !perguntaFull) return;
    if (label.length > 72) label = label.slice(0, 69) + '…';
    /* evitar eco da pergunta do utilizador */
    var qn = qRaw.toLowerCase();
    if (qn && (label.toLowerCase() === qn || perguntaFull.toLowerCase() === qn)) return;
    if (_bpIaIsRecentFollowup(label, perguntaFull)) return;
    for (var i = 0; i < out.length; i++) {
      if (out[i].label === label || out[i].pergunta === perguntaFull) return;
      /* similaridade simples */
      if (_bpIaTokenOverlap(out[i].label, label) >= 0.72) return;
    }
    out.push({ label: label, pergunta: perguntaFull });
  }

  /* 1) Extrair perguntas já sugeridas no texto da IA */
  var lines = rRaw.split(/[\n\r]+/);
  for (var li = 0; li < lines.length && out.length < 3; li++) {
    var line = lines[li].replace(/^\s*[-*•\d.)]+\s*/, '').trim();
    if (line.length < 12 || line.length > 120) continue;
    if (/\?\s*$/.test(line) || /^(como|quais|quero|vamos|posso|devemos|suger)/i.test(line)) {
      var lab = line.replace(/\?+$/, '?');
      add(lab, lab);
    }
  }

  /* 2) Aprofundar a partir da pergunta do utilizador + temas da resposta */
  if (qRaw && out.length < 3) {
    if (/porque|porquê|motivo|razão/.test(q)) {
      add('O que fazer a seguir?', 'Com base nisso, que 3 acções práticas devo tomar esta semana?');
    } else if (/como|estratég|melhorar|aumentar|subir/.test(q)) {
      add('Detalha o primeiro passo', 'Detalha o primeiro passo prático, com exemplo para o meu salão.');
    } else if (/quem|qual|quais/.test(q)) {
      add('Prioriza a lista', 'Ordena por impacto no negócio e diz por onde começar.');
    } else {
      add('Aprofunda este ponto', 'Aprofunda a resposta anterior com números e próximos passos concretos.');
    }
  }

  /* 3) Âncoras contextuais (só se o tema aparecer na pergunta OU na resposta) */
  var ctx = q + ' ' + r;
  if (/cliente|vip|inactiv|inativ|ausente|regress/.test(ctx)) {
    add('Quem contactar primeiro?', 'Com base na análise, quais clientes devo contactar primeiro e com que mensagem?');
  }
  if (/receita|fatur|vend|ticket|kz|kwanza/.test(ctx)) {
    add('Comparar com o período anterior', 'Compara estes números com o período anterior e destaca o que mudou.');
  }
  if (/agenda|marcac|horário|horario|amanhã|amanha/.test(ctx)) {
    add('Otimizar a agenda', 'Como otimizar a agenda dos próximos dias com base no que acabaste de dizer?');
  }
  if (/caixa|despes|fluxo|saldo/.test(ctx)) {
    add('Onde cortar sem risco?', 'Que despesas posso ajustar sem prejudicar a experiência do cliente?');
  }
  if (/serviço|servico|profissional|equipa|comiss/.test(ctx)) {
    add('Plano para a equipa', 'Transforma isto num plano simples para a equipa nos próximos 7 dias.');
  }

  /* 4) Fallback mínimo — só se ainda vazio (evita lista genérica sempre igual) */
  if (!out.length) {
    if (qRaw) {
      add('Resumo em 3 pontos', 'Resume a resposta anterior em 3 pontos acionáveis.');
      add('Próximo passo', 'Qual deve ser o meu próximo passo concreto hoje?');
    } else {
      add('Ponto de situação', 'Faz um ponto de situação rápido do salão hoje.');
    }
  }
  var final = out.slice(0, 3);
  if (!final.length && qRaw) {
    final = [
      { label: 'Próximo passo concreto', pergunta: 'Qual deve ser o meu próximo passo concreto com base nisto?' },
      { label: 'Resumo em 3 pontos', pergunta: 'Resume a resposta anterior em 3 pontos acionáveis.' }
    ];
  }
  _bpIaRememberFollowups(final);
  return final.slice(0, 3);
}


/** Fases de thinking + streaming progressivo (UX estilo Grok / ChatGPT). */
var _bpIaStreamAbort = null;
function _bpIaSvgBulb() {
  return '<svg class="ia-think-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/></svg>';
}
function _bpIaSvgSpark() {
  return '<svg class="ia-think-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v3"/><path d="M12 18v3"/><path d="M3 12h3"/><path d="M18 12h3"/><path d="M5.6 5.6l2.1 2.1"/><path d="M16.3 16.3l2.1 2.1"/><path d="M5.6 18.4l2.1-2.1"/><path d="M16.3 7.7l2.1-2.1"/></svg>';
}
function _bpIaSetThinkingPhase(el, phase) {
  if (!el) return;
  if (phase === 1) {
    el.innerHTML =
      '<div class="ia-think-row">' + _bpIaSvgBulb() +
      '<span class="ia-think-label">A analisar o contexto…</span></div>';
  } else if (phase === 2) {
    el.innerHTML =
      '<div class="ia-think-row">' + _bpIaSvgSpark() +
      '<span class="ia-think-label">A estruturar a resposta…</span></div>';
  }
}
function _bpIaSleep(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}
/** Revela texto progressivamente (palavras) com cursor — não depende de SSE. */
async function _bpIaStreamInto(elCorpo, textoPlano, opts) {
  opts = opts || {};
  var reduced = false;
  try {
    reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (_) {}
  if (reduced || !textoPlano) {
    elCorpo.innerHTML = typeof formatarRespostaIA === 'function' ? formatarRespostaIA(textoPlano) : String(textoPlano || '');
    return;
  }
  var words = String(textoPlano).split(/(\s+)/);
  var acc = '';
  var i = 0;
  var baseDelay = opts.baseDelay != null ? opts.baseDelay : 28;
  /* Respostas longas: um pouco mais rápido para não cansar */
  if (words.length > 120) baseDelay = 16;
  else if (words.length > 60) baseDelay = 22;
  elCorpo.innerHTML = '<span class="ia-stream-text"></span><span class="ia-stream-caret" aria-hidden="true"></span>';
  var textEl = elCorpo.querySelector('.ia-stream-text');
  var caret = elCorpo.querySelector('.ia-stream-caret');
  while (i < words.length) {
    if (_bpIaStreamAbort) break;
    acc += words[i];
    i++;
    /* actualizar em chunks de 1–3 tokens */
    if (i % 1 === 0) {
      textEl.textContent = acc;
      try {
        var chat = document.getElementById('ia-chat');
        if (chat) chat.scrollTop = chat.scrollHeight;
      } catch (_) {}
      var pause = baseDelay;
      if (/[\.\!\?…]$/.test(words[i - 1])) pause += 120;
      else if (/[,;:]$/.test(words[i - 1])) pause += 50;
      await _bpIaSleep(pause);
    }
  }
  /* Render final com markdown completo */
  elCorpo.innerHTML = typeof formatarRespostaIA === 'function' ? formatarRespostaIA(textoPlano) : String(textoPlano || '');
  elCorpo.setAttribute('data-plain', textoPlano);
}


function _bpIaEnsureScrollBtn() {
  var shell = document.getElementById('ia-chat-container');
  var chat = document.getElementById('ia-chat');
  if (!shell || !chat) return null;
  var btn = document.getElementById('ia-scroll-latest');
  if (!btn) {
    btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'ia-scroll-latest';
    btn.className = 'ia-scroll-latest';
    btn.setAttribute('aria-label', 'Ir para a última mensagem');
    btn.title = 'Última mensagem';
    btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14"/><path d="M19 12l-7 7-7-7"/></svg>';
    btn.hidden = true;
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      _bpIaScrollToLatest(true);
    });
    if (getComputedStyle(shell).position === 'static') shell.style.position = 'relative';
    shell.appendChild(btn);
    if (!chat.dataset.bpScrollBound) {
      chat.dataset.bpScrollBound = '1';
      chat.addEventListener('scroll', function () { _bpIaUpdateScrollBtn(); }, { passive: true });
    }
  }
  return btn;
}
function _bpIaScrollToLatest(smooth) {
  var chat = document.getElementById('ia-chat');
  if (!chat) return;
  try {
    chat.scrollTo({ top: chat.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  } catch (_) {
    chat.scrollTop = chat.scrollHeight;
  }
  setTimeout(_bpIaUpdateScrollBtn, smooth ? 320 : 40);
}
function _bpIaUpdateScrollBtn() {
  var chat = document.getElementById('ia-chat');
  var btn = _bpIaEnsureScrollBtn();
  if (!chat || !btn) return;
  var distance = chat.scrollHeight - chat.scrollTop - chat.clientHeight;
  var hasOverflow = chat.scrollHeight > chat.clientHeight + 12;
  var show = hasOverflow && distance > 36;
  btn.hidden = !show;
  btn.setAttribute('aria-hidden', show ? 'false' : 'true');
}

function montarMsgBotIA(resposta, ts, perguntaOrig, opts) {
  opts = opts || {};
  /* Acções + follow-ups apenas na última resposta (opts.toolbar / opts.followups) */
  var showFollow = opts.followups === true;
  var showToolbar = opts.toolbar === true;
  var fonte = opts.fonte || null;
  var tempo = formatarTempoRelativoIA(ts);
  var htmlCorpo = formatarRespostaIA(resposta);
  var planoAttr = escHtml(textoPlanoRespostaIA(resposta));
  var arrowSvg = '<svg class="ia-followup-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 10l-5 5 5 5"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/></svg>';
  var chips = '';
  if (showFollow) {
    var follows = gerarFollowupsEstrategicosIA(perguntaOrig || '', resposta);
    chips = follows.map(function (f) {
      return '<button type="button" class="ia-followup-chip" data-pergunta="' +
        String(f.pergunta).replace(/"/g, '&quot;') + '">' +
        arrowSvg + '<span class="ia-followup-label">' + escHtml(f.label) + '</span></button>';
    }).join('');
  }

  var pergAttr = escHtml(String(perguntaOrig || ''));
  var toolbarHtml = '';
  if (showToolbar) {
    toolbarHtml =
      '<div class="ia-msg-toolbar" role="group" aria-label="Acções da resposta">' +
        '<button type="button" class="ia-tool-btn ia-copiar-btn" title="Copiar" aria-label="Copiar">' + _bpIaSvg('copy') + '</button>' +
        '<button type="button" class="ia-tool-btn ia-partilhar-btn" title="Partilhar" aria-label="Partilhar">' + _bpIaSvg('share') + '</button>' +
        '<button type="button" class="ia-tool-btn ia-feedback-btn" data-fb="util" title="Gostei" aria-label="Gostei">' + _bpIaSvg('up') + '</button>' +
        '<button type="button" class="ia-tool-btn ia-feedback-btn" data-fb="naoajudou" title="Não gostei" aria-label="Não gostei">' + _bpIaSvg('down') + '</button>' +
        '<button type="button" class="ia-tool-btn ia-regen-btn" title="Gerar novamente" aria-label="Gerar novamente">' + _bpIaSvg('regen') + '</button>' +
      '</div>';
  }
  return (
    '<div class="ia-msg-block ia-msg-enter" data-pergunta="' + pergAttr + '">' +
      '<div class="ia-msg-bot">' +
        '<div class="ia-msg-bot-header"><span class="ia-msg-bot-nome">Benza</span>' +
          (tempo ? '<span class="ia-msg-bot-tempo">' + tempo + '</span>' : '') +
          (fonte === 'local' ? '<span class="ia-msg-bot-fonte" title="Calculado com dados locais do salão">Local</span>' : '') +
        '</div>' +
        '<div class="ia-msg-bot-corpo" data-plain="' + planoAttr + '">' + htmlCorpo + '</div>' +
      '</div>' +
      toolbarHtml +
      (chips ? '<div class="ia-followup-row">' + chips + '</div>' : '') +
    '</div>'
  );
}

/** Remove toolbar e follow-ups de mensagens anteriores (só a última deve tê-los). */
function _bpIaStripNonLastActions(chatEl) {
  if (!chatEl) return;
  var blocks = chatEl.querySelectorAll('.ia-msg-block');
  for (var i = 0; i < blocks.length; i++) {
    var tb = blocks[i].querySelector('.ia-msg-toolbar');
    if (tb) tb.remove();
    var fr = blocks[i].querySelector('.ia-followup-row');
    if (fr) fr.remove();
  }
}

function atualizarEstadoVazioIA() {
  const vazio = document.getElementById('ia-chat-empty');
  const chat = document.getElementById('ia-chat');
  const shell = document.getElementById('ia-chat-container');
  if (shell && chat) {
    shell.classList.toggle('has-messages', chat.children.length > 0);
  }
  if (vazio && chat) vazio.style.display = chat.children.length > 0 ? 'none' : '';
}
const IA_HIST_KEY = function () {
  var sid = (state && state.config && state.config.salaoId) ? state.config.salaoId : 'local';
  return 'bp_ia_chat_' + sid;
};
const IA_HIST_MAX = 40;

function _bpIaNormalizeHist(list) {
  if (!Array.isArray(list)) return [];
  return list.filter(function (t) {
    return t && (t.pergunta || t.resposta);
  }).slice(-IA_HIST_MAX);
}

function _bpIaRenderHistNoChat(list) {
  var chat = document.getElementById('ia-chat');
  if (!chat) return;
  var guardado = _bpIaNormalizeHist(list);
  if (!guardado.length) {
    chat.innerHTML = '';
    atualizarEstadoVazioIA();
    return;
  }
  chat.innerHTML = guardado.map(function (item, idx) {
    var last = idx === guardado.length - 1;
    return montarMsgUsuarioIA(item.pergunta) +
      montarMsgBotIA(item.resposta, item.ts, item.pergunta, { followups: last, toolbar: last, fonte: item.fonte || null });
  }).join('');
  chat.scrollTop = chat.scrollHeight;
  atualizarEstadoVazioIA();
  try { _bpIaEnsureScrollBtn(); _bpIaUpdateScrollBtn(); } catch (_) {}
}

function carregarHistoricoIA() {
  try {
    var fromLs = [];
    try { fromLs = JSON.parse(localStorage.getItem(IA_HIST_KEY()) || '[]'); } catch (e1) { fromLs = []; }
    iaHistorico = _bpIaNormalizeHist(fromLs);
    _bpIaRenderHistNoChat(iaHistorico);
  } catch (e) {
    iaHistorico = [];
  }
  /* IndexedDB (sobrevive a limpezas parciais / reabre com dados locais) */
  if (typeof dbGetAll === 'function') {
    Promise.resolve(dbGetAll('config')).then(function (rows) {
      try {
        var sidH = (state && state.config && state.config.salaoId) ? state.config.salaoId : 'local';
        var histId = 'ia_chat_hist_' + sidH;
        var row = (rows || []).find(function (c) {
          return c && (c.id === histId || c.key === histId ||
            ((c.id === 'ia_chat_hist' || c.key === 'ia_chat_hist') && (!c.salao_id || c.salao_id === sidH)));
        });
        var fromDb = row && row.value != null ? row.value : null;
        if (typeof fromDb === 'string') {
          try { fromDb = JSON.parse(fromDb); } catch (e2) { fromDb = null; }
        }
        fromDb = _bpIaNormalizeHist(fromDb);
        if (fromDb.length >= iaHistorico.length) {
          iaHistorico = fromDb;
          try { localStorage.setItem(IA_HIST_KEY(), JSON.stringify(iaHistorico)); } catch (e3) {}
          _bpIaRenderHistNoChat(iaHistorico);
        } else if (iaHistorico.length) {
          /* LS mais completo → gravar no IDB */
          guardarHistoricoIA();
        }
      } catch (e4) {}
    }).catch(function () {});
  }
}

function guardarHistoricoIA() {
  try {
    iaHistorico = _bpIaNormalizeHist(iaHistorico);
    localStorage.setItem(IA_HIST_KEY(), JSON.stringify(iaHistorico));
  } catch (e) {}
  try {
    if (typeof dbPut === 'function') {
      var sid = (state && state.config && state.config.salaoId) ? state.config.salaoId : 'local';
      var payload = {
        id: 'ia_chat_hist_' + sid,
        key: 'ia_chat_hist_' + sid,
        value: iaHistorico,
        updated_at: new Date().toISOString(),
        salao_id: sid
      };
      Promise.resolve(dbPut('config', payload)).catch(function () {});
    }
  } catch (e5) {}
}

/* Carregar quando DOM e estado estiverem prontos */
function _bpIaBootHist() {
  carregarHistoricoIA();
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { setTimeout(_bpIaBootHist, 80); });
} else {
  setTimeout(_bpIaBootHist, 80);
}
setTimeout(_bpIaBootHist, 1200);

function bpIaAutosizeInput() {
  const input = document.getElementById('ia-input');
  if (!input) return;
  input.style.height = 'auto';
  const h = Math.min(120, Math.max(40, input.scrollHeight));
  input.style.height = h + 'px';
}
function bpIaSyncSendState() {
  const input = document.getElementById('ia-input');
  const btn = document.getElementById('ia-enviar');
  if (!btn) return;
  const has = !!(input && input.value.trim());
  btn.classList.toggle('is-idle', !has);
  if (!has) btn.classList.remove('is-sending');
}
function bpIaBindComposer() {
  const input = document.getElementById('ia-input');
  const btn = document.getElementById('ia-enviar');
  if (!input || input.dataset.bpIaBound === '1') return;
  input.dataset.bpIaBound = '1';
  input.addEventListener('input', function () {
    bpIaAutosizeInput();
    bpIaSyncSendState();
  });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (btn) btn.click();
    }
  });
  bpIaAutosizeInput();
  bpIaSyncSendState();
}

document.getElementById('ia-enviar')?.addEventListener('click', async () => {
  const input = document.getElementById('ia-input');
  const btn = document.getElementById('ia-enviar');
  const pergunta = (input && input.value || '').trim();
  if (!pergunta || _iaBusy) return;
  const chat = document.getElementById('ia-chat');
  if (!chat) return;
  if (btn) {
    btn.classList.remove('is-idle');
    btn.classList.add('is-sending');
    // reinicia transição 360°
    btn.style.transition = 'none';
    btn.style.transform = 'rotate(0deg)';
    void btn.offsetWidth;
    btn.style.transition = '';
    btn.style.transform = '';
  }
  chat.innerHTML += montarMsgUsuarioIA(pergunta);
  atualizarEstadoVazioIA();
  window.__bpIaLastMeta = { fonte: null };
  if (input) {
    input.value = '';
    bpIaAutosizeInput();
  }
  if (btn) btn.disabled = true;
  _bpIaStreamAbort = false;

  /* Placeholder de progresso — só se for preciso esperar (API). Local resolve rápido. */
  const pensando = document.createElement('div');
  pensando.className = 'ia-msg-bot ia-msg-thinking';
  pensando.id = 'ia-pensando';
  pensando.setAttribute('aria-live', 'polite');
  pensando.innerHTML = '<div class="ia-msg-bot-header"><span class="ia-msg-bot-nome">Benza</span></div><div class="ia-think-body"></div>';
  chat.appendChild(pensando);
  var thinkBody = pensando.querySelector('.ia-think-body');
  try { _bpIaSetThinkingPhase(thinkBody, 1); } catch (_) {}
  chat.scrollTop = chat.scrollHeight;

  var phaseTimer = setTimeout(function () {
    try {
      if (document.getElementById('ia-pensando') && !(window.__bpIaLastMeta && window.__bpIaLastMeta.fonte === 'local')) {
        _bpIaSetThinkingPhase(thinkBody, 2);
      }
    } catch (_) {}
  }, 700);

  let resposta = null;
  try {
    try { _bpIaSetComposerStatus('A processar…'); } catch (_) {}
    resposta = await perguntarIA(pergunta);
  } finally {
    clearTimeout(phaseTimer);
    if (btn) {
      btn.disabled = false;
      setTimeout(function () {
        btn.classList.remove('is-sending');
        bpIaSyncSendState();
      }, 200);
    }
  }
  try { document.getElementById('ia-pensando') && document.getElementById('ia-pensando').remove(); } catch (_) {}

  var metaFonte = (window.__bpIaLastMeta && window.__bpIaLastMeta.fonte) || null;

  if (resposta) {
    const ts = Date.now();
    try { _bpIaStripNonLastActions(chat); } catch (_) {}
    var isLocal = metaFonte === 'local';
    try {
      if (isLocal) {
        /* Resposta local: mostrar de imediato, sem teatro de stream */
        chat.insertAdjacentHTML('beforeend', montarMsgBotIA(resposta, ts, pergunta, {
          followups: true, toolbar: true, fonte: 'local'
        }));
        try { _bpIaSetHeaderStatus('local'); _bpIaSetComposerStatus(_bpIaIsOnline() ? 'IA pronta' : 'Modo local'); } catch (_) {}
      } else {
        var blockHtml = montarMsgBotIA(resposta, ts, pergunta, { followups: false, toolbar: false, fonte: metaFonte });
        chat.insertAdjacentHTML('beforeend', blockHtml);
        var blocks = chat.querySelectorAll('.ia-msg-block');
        var lastBlock = blocks.length ? blocks[blocks.length - 1] : null;
        var corpo = lastBlock && lastBlock.querySelector('.ia-msg-bot-corpo');
        if (corpo) {
          var plano = corpo.getAttribute('data-plain') || String(resposta);
          try {
            await _bpIaStreamInto(corpo, plano, {});
          } catch (streamErr) {
            try {
              corpo.innerHTML = typeof formatarRespostaIA === 'function' ? formatarRespostaIA(plano) : plano;
              corpo.setAttribute('data-plain', plano);
            } catch (_) {}
          }
        }
        if (lastBlock && lastBlock.parentNode) {
          var full = montarMsgBotIA(resposta, ts, pergunta, { followups: true, toolbar: true, fonte: metaFonte });
          var tmp = document.createElement('div');
          tmp.innerHTML = full;
          var rich = tmp.firstElementChild;
          if (rich) lastBlock.parentNode.replaceChild(rich, lastBlock);
        }
        try {
          if (metaFonte === 'error') _bpIaSetHeaderStatus('error');
          else if (_bpIaIsOnline()) { _bpIaSetHeaderStatus('ok'); _bpIaSetComposerStatus('IA pronta'); }
          else { _bpIaSetHeaderStatus('offline'); _bpIaSetComposerStatus('Modo local'); }
        } catch (_) {}
      }
    } catch (renderErr) {
      try {
        chat.insertAdjacentHTML('beforeend', montarMsgBotIA(resposta, ts, pergunta, {
          followups: true, toolbar: true, fonte: metaFonte
        }));
      } catch (_) {}
    }
    try {
      chat.scrollTop = chat.scrollHeight;
      _bpIaEnsureScrollBtn();
      _bpIaUpdateScrollBtn();
    } catch (_) {}
    try {
      if (iaHistorico.length > 0) iaHistorico[iaHistorico.length - 1].ts = ts;
      guardarHistoricoIA();
    } catch (_) {}
  } else {
    try { atualizarIAOffline(); } catch (_) {}
  }
  actualizarContadorIA();
  bpIaSyncSendState();
});

bpIaBindComposer();
document.addEventListener('DOMContentLoaded', function () {
  bpIaBindComposer();
  try { _bpIaEnsureScrollBtn(); } catch (_) {}
  try { actualizarContadorIA(); } catch (_) {}
  try { atualizarIAOffline(); } catch (_) {}
});

// Sugestões rápidas e chips de continuação (delegação de eventos — cobre também os que são criados depois de cada resposta)
document.addEventListener('click', (e) => {
  const card = e.target.closest('.ia-sugestao-card, .ia-followup-chip');
  if (card && card.dataset.pergunta) {
    if (card.dataset.pergunta === '__bp_export_ics__') {
      try {
        if (window.BPOps && typeof window.BPOps.downloadIcs === 'function') {
          window.BPOps.downloadIcs();
          if (typeof toast === 'function') toast('Agenda exportada.', 'success');
        } else if (typeof toast === 'function') {
          toast('Exportação de calendário indisponível', 'warning');
        }
      } catch (err) {
        if (typeof toast === 'function') toast('Não foi possível exportar o calendário', 'error');
      }
      return;
    }
    const input = document.getElementById('ia-input');
    if (input) {
      input.value = card.dataset.pergunta;
      if (typeof bpIaAutosizeInput === 'function') bpIaAutosizeInput();
      if (typeof bpIaSyncSendState === 'function') bpIaSyncSendState();
      document.getElementById('ia-enviar').click();
    }
  }
  const tool = e.target.closest('.ia-tool-btn, .ia-feedback-btn');
  if (tool) {
    const block = tool.closest('.ia-msg-block') || tool.closest('.ia-msg-bot');
    const corpo = block && block.querySelector('.ia-msg-bot-corpo');
    const texto = (corpo && (corpo.getAttribute('data-plain') || corpo.innerText)) || '';
    if (tool.classList.contains('ia-copiar-btn')) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto).then(function () {
          if (typeof toast === 'function') toast('Texto copiado.', 'success');
        }).catch(function () {
          if (typeof toast === 'function') toast('Não foi possível copiar', 'error');
        });
      } else if (typeof toast === 'function') {
        toast('Cópia não suportada neste dispositivo', 'warning');
      }
      return;
    }
    if (tool.classList.contains('ia-partilhar-btn')) {
      if (navigator.share) {
        navigator.share({ text: texto }).catch(function () {});
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto).then(function () {
          if (typeof toast === 'function') toast('Texto copiado.', 'success');
        }).catch(function () {});
      }
      return;
    }
    if (tool.classList.contains('ia-regen-btn')) {
      var perg = (block && block.getAttribute('data-pergunta')) || '';
      if (!perg) {
        if (typeof toast === 'function') toast('Não foi possível repetir esta pergunta', 'warning');
        return;
      }
      /* Regenerar reenvia a pergunta (pode consumir cota se for à API). */
      var input = document.getElementById('ia-input');
      var send = document.getElementById('ia-enviar');
      if (input && send) {
        input.value = perg;
        if (typeof bpIaAutosizeInput === 'function') bpIaAutosizeInput();
        if (typeof bpIaSyncSendState === 'function') bpIaSyncSendState();
        send.click();
      }
      return;
    }
    if (tool.getAttribute('data-fb')) {
      var fb = tool.getAttribute('data-fb');
      try {
        var key = 'bp_ia_feedback';
        var list = [];
        try { list = JSON.parse(localStorage.getItem(key) || '[]'); } catch (_) { list = []; }
        if (!Array.isArray(list)) list = [];
        var plain = '';
        try {
          var c = block && block.querySelector('.ia-msg-bot-corpo');
          plain = (c && (c.getAttribute('data-plain') || c.innerText)) || '';
        } catch (_) {}
        list.push({
          fb: fb,
          ts: Date.now(),
          pergunta: (block && block.getAttribute('data-pergunta')) || '',
          amostra: String(plain).slice(0, 240),
          salao: (state && state.config && state.config.salaoId) || 'local'
        });
        if (list.length > 80) list = list.slice(-80);
        localStorage.setItem(key, JSON.stringify(list));
      } catch (_) {}
      if (typeof toast === 'function') toast('Feedback guardado neste dispositivo', 'success');
      const bar = tool.parentElement;
      if (bar) {
        bar.querySelectorAll('[data-fb]').forEach(function (b) { b.disabled = true; b.classList.remove('is-on'); });
      }
      tool.classList.add('is-on');
      tool.disabled = true;
    }
  }
});

document.getElementById('ia-offline-retry')?.addEventListener('click', () => {
  if (navigator.onLine) { atualizarIAOffline();
    toast('Ligação restabelecida.', 'success'); } else { toast('Ainda sem ligação à internet.', 'warning'); }
});

// Upgrade modal — handler principal em plano-limites.js (bindUpgradeButtons / abrirWhatsAppVenda).
// Fallback se o bind ainda não correu (ordem de scripts / bundle).
(function ensureUpgradeContatoBound() {
  const contato = document.getElementById('modal-upgrade-contato');
  if (!contato || contato.dataset.bpUpgradeBound) return;
  contato.addEventListener('click', async () => {
    if (typeof abrirWhatsAppVenda === 'function') {
      const salao = (state && state.config && state.config.storeName) || '—';
      const actual = (typeof getPlanoAtual === 'function') ? getPlanoAtual() : '—';
      await abrirWhatsAppVenda(
        `Olá, quero assinar um plano do BeautyPro. Salão: ${salao} | Plano actual: ${actual}`
      );
    } else {
      const msg =
        `Olá, quero assinar um plano do BeautyPro. Salão: ${(state.config && state.config.storeName) || '—'} | Plano actual: ${typeof getPlanoAtual === 'function' ? getPlanoAtual() : '—'}`;
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
    }
    closeModal('modal-upgrade');
  });
  contato.dataset.bpUpgradeBound = '1';
})();

// Pesquisa clientes
let searchTimer;
document.getElementById('search-cliente').addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => renderClientes(), 300);
});

// Onboarding
let onboardingIndex = 0;
const onboardingSlides = document.querySelectorAll('.onboarding-slide');
const onboardingDots = document.querySelectorAll('.onboarding-dot');
const nextBtn = document.getElementById('onboarding-next');
const skipBtn = document.getElementById('onboarding-skip');

function showOnboardingSlide(index) {
  onboardingSlides.forEach((s, i) => {
    s.classList.toggle('active', i === index);
    s.style.display = i === index ? 'flex' : 'none';
  });
  onboardingDots.forEach((d, i) => {
    if (i === index) { d.style.width = '24px';
      d.style.background = 'var(--gold)'; } else { d.style.width = '6px';
      d.style.background = 'var(--border-soft)'; }
  });
  if (index === 2) { nextBtn.textContent = 'Começar agora';
    nextBtn.className = 'btn btn-primary'; } else { nextBtn.textContent = 'Próximo'; }
}

function closeOnboarding() {
  document.getElementById('onboarding-screen').style.display = 'none';
  localStorage.setItem('bp_onboarding_seen', 'true');
}

if (nextBtn) {
  nextBtn.addEventListener('click', () => {
    if (onboardingIndex === 2) closeOnboarding();
    else { onboardingIndex++;
      showOnboardingSlide(onboardingIndex); }
  });
}
if (skipBtn) skipBtn.addEventListener('click', closeOnboarding);

/** Splash BeautyPro BANIDO — nunca mostrar. */
function hideSplash() {
  var splash = document.getElementById('splash-screen');
  if (!splash) return;
  splash.style.cssText = 'display:none!important;opacity:0;visibility:hidden;pointer-events:none;';
  splash.setAttribute('hidden', '');
  splash.setAttribute('aria-hidden', 'true');
  try { localStorage.setItem('bp_splash_seen', '1'); } catch (_) {}
}
function bpControlSplashOnBoot() {
  hideSplash();
}
if (typeof window !== 'undefined') {
  window.bpControlSplashOnBoot = bpControlSplashOnBoot;
  window.hideSplash = hideSplash;
}



// Testes automatizados
function runTests() {
  console.log('🧪 Iniciando testes automatizados...');
  console.group('📦 Funções puras');
  console.assert(fmtKz(0) === '0 Kz', 'fmtKz(0)');
  console.assert(fmtKz(1000) === '1.000 Kz', 'fmtKz(1000)');
  console.assert(fmtKz(1234567) === '1.234.567 Kz', 'fmtKz(1234567)');
  console.assert(escHtml('<script>') === '&lt;script&gt;', 'escHtml');
  console.assert(escHtml('a & b') === 'a &amp; b', 'escHtml &');
  const id = uuid();
  console.assert(id.length > 10 && id.includes('-'), 'uuid');
  console.assert(/^\d{4}-\d{2}-\d{2}$/.test(hoje()), 'hoje');
  console.assert(/^\d{2}:\d{2}$/.test(horaAgora()), 'horaAgora');
  console.groupEnd();
  console.group('🧠 Lógica de negócio (mocks)');
  console.log('✅ Testes concluídos (mock)');
  console.groupEnd();
  console.log('✅ Todos os testes concluídos!');
}

if (localStorage.getItem('bp_run_tests') === 'true') {
  // runTests sob demanda: window.runBeautyProTests()
  localStorage.removeItem('bp_run_tests');
}
window.runBeautyProTests = runTests;