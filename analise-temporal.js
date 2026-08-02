// ====================================================================
//  analise-temporal.js — Modelo puro de análise do dashboard (Fase 1)
//  Sem DOM. Consome movimentos de venda e intervalos ISO.
// ====================================================================

function _atFmtISO(d) {
  if (typeof formatarDataISO === 'function') return formatarDataISO(d);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function _atParseISO(iso) {
  return new Date(String(iso) + 'T00:00:00');
}

function _atDiasEntre(inicioIso, fimIso) {
  const a = _atParseISO(inicioIso);
  const b = _atParseISO(fimIso);
  return Math.max(1, Math.round((b - a) / 86400000) + 1);
}

/** Período imediatamente anterior com a mesma duração em dias. */
function intervaloAnteriorEspelhado(intervalo) {
  if (!intervalo || !intervalo.inicio || !intervalo.fim) return null;
  const dias = _atDiasEntre(intervalo.inicio, intervalo.fim);
  const ini = _atParseISO(intervalo.inicio);
  const fimAnt = new Date(ini.getTime() - 86400000);
  const iniAnt = new Date(fimAnt.getTime() - (dias - 1) * 86400000);
  return {
    inicio: _atFmtISO(iniAnt),
    fim: _atFmtISO(fimAnt),
    label: 'Período anterior'
  };
}

function _atVendasNoIntervalo(movs, inicio, fim) {
  return (movs || []).filter(function (m) {
    return m && m.tipo === 'venda' && m.data && m.data >= inicio && m.data <= fim;
  });
}

function _atTotais(vendas) {
  var receita = 0;
  for (var i = 0; i < vendas.length; i++) receita += Number(vendas[i].valor) || 0;
  var n = vendas.length;
  return {
    receita: receita,
    nVendas: n,
    ticket: n > 0 ? receita / n : 0
  };
}

function _atLabelDia(iso, dens) {
  var d = _atParseISO(iso);
  if (dens === 'hora') return iso;
  if (dens <= 7) {
    return d.toLocaleDateString('pt-AO', { weekday: 'short' }).replace('.', '');
  }
  if (dens <= 31) {
    return d.toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' }).replace('.', '');
  }
  return d.toLocaleDateString('pt-AO', { month: 'short' }).replace('.', '');
}

/**
 * Série diária (ou por bloco de 2h se modoHora).
 * @param {{inicio:string,fim:string,label?:string}} intervalo
 * @param {Array} movs
 * @param {{modoHora?:boolean}} opts
 */
function buildSerieTemporal(intervalo, movs, opts) {
  opts = opts || {};
  var serie = [];
  if (!intervalo || !intervalo.inicio || !intervalo.fim) return serie;

  if (opts.modoHora) {
    var ds = intervalo.fim;
    for (var h = 0; h < 12; h++) {
      var hr = h * 2;
      var vendas = (movs || []).filter(function (m) {
        if (!m || m.tipo !== 'venda' || m.data !== ds || !m.hora) return false;
        var mh = parseInt(String(m.hora).split(':')[0], 10);
        return mh >= hr && mh < hr + 2;
      });
      var t = _atTotais(vendas);
      serie.push({
        data: ds,
        label: String(hr).padStart(2, '0') + 'h',
        receita: t.receita,
        nVendas: t.nVendas,
        ticket: t.ticket,
        chave: ds + '-' + hr
      });
    }
    return serie;
  }

  var dias = _atDiasEntre(intervalo.inicio, intervalo.fim);
  var passo = dias > 31 ? Math.ceil(dias / 31) : 1;
  var d0 = _atParseISO(intervalo.inicio);
  for (var i = 0; i < dias; i += passo) {
    var d = new Date(d0.getTime() + i * 86400000);
    var iso = _atFmtISO(d);
    // Agregar passo dias quando passo > 1
    var isoFim = iso;
    if (passo > 1) {
      var dF = new Date(d.getTime() + (passo - 1) * 86400000);
      var lim = _atParseISO(intervalo.fim);
      if (dF > lim) dF = lim;
      isoFim = _atFmtISO(dF);
    }
    var vendas = _atVendasNoIntervalo(movs, iso, isoFim);
    var tot = _atTotais(vendas);
    serie.push({
      data: iso,
      dataFim: isoFim,
      label: _atLabelDia(iso, dias),
      receita: tot.receita,
      nVendas: tot.nVendas,
      ticket: tot.ticket,
      chave: iso
    });
  }
  return serie;
}

function _atTendencia(pct) {
  if (pct == null || !isFinite(pct)) return null;
  if (pct >= 5) return 'crescimento';
  if (pct <= -5) return 'queda';
  return 'estavel';
}

function _atTendenciaLabel(t) {
  if (t === 'crescimento') return 'Receita em crescimento';
  if (t === 'queda') return 'Receita em queda';
  if (t === 'estavel') return 'Receita estável';
  return null;
}

/**
 * Modelo completo de análise temporal.
 */
function buildAnaliseTemporal(intervalo, movs, opts) {
  opts = opts || {};
  movs = movs || [];
  var serie = buildSerieTemporal(intervalo, movs, opts);
  var vendas = intervalo
    ? _atVendasNoIntervalo(movs, intervalo.inicio, intervalo.fim)
    : [];
  var totais = _atTotais(vendas);

  var antInt = intervaloAnteriorEspelhado(intervalo);
  var anterior = null;
  if (antInt) {
    var vendasAnt = _atVendasNoIntervalo(movs, antInt.inicio, antInt.fim);
    var totAnt = _atTotais(vendasAnt);
    // Só comparar se o período anterior tiver alguma actividade OU o actual tiver
    // (evita “0%” sem contexto quando ambos vazios)
    if (totAnt.nVendas > 0 || totais.nVendas > 0) {
      var delta = totais.receita - totAnt.receita;
      var pct = totAnt.receita > 0
        ? (delta / totAnt.receita) * 100
        : (totais.receita > 0 ? 100 : null);
      anterior = {
        intervalo: antInt,
        totais: totAnt,
        delta: delta,
        pct: pct
      };
    }
  }

  var melhor = null;
  var pior = null;
  for (var s = 0; s < serie.length; s++) {
    var pt = serie[s];
    if (!pt || pt.receita <= 0) continue;
    if (!melhor || pt.receita > melhor.receita) melhor = pt;
    if (!pior || pt.receita < pior.receita) pior = pt;
  }

  var diasComReceita = serie.filter(function (p) { return p.receita > 0; }).length;
  var mediaDiaria = diasComReceita > 0
    ? totais.receita / Math.max(diasComReceita, 1)
    : 0;
  // média sobre todos os buckets da série (para linha no gráfico)
  var mediaSerie = serie.length > 0
    ? serie.reduce(function (a, p) { return a + p.receita; }, 0) / serie.length
    : 0;

  var tendencia = anterior && anterior.pct != null ? _atTendencia(anterior.pct) : null;

  return {
    intervalo: intervalo || null,
    serie: serie,
    totais: totais,
    anterior: anterior,
    extremos: { melhorDia: melhor, piorDia: pior },
    mediaDiaria: mediaDiaria,
    mediaSerie: mediaSerie,
    tendencia: tendencia,
    tendenciaLabel: _atTendenciaLabel(tendencia),
    hasData: totais.nVendas > 0 || totais.receita > 0
  };
}

if (typeof window !== 'undefined') {
  window.buildAnaliseTemporal = buildAnaliseTemporal;
  window.buildSerieTemporal = buildSerieTemporal;
  window.intervaloAnteriorEspelhado = intervaloAnteriorEspelhado;
}
