

function actualizarDashChartExec(analise) {
  try {
    var elRev = document.getElementById('dash-chart-exec-rev');
    var elN = document.getElementById('dash-chart-exec-n');
    var elTicket = document.getElementById('dash-chart-exec-ticket');
    var elDelta = document.getElementById('dash-chart-exec-delta');
    if (!elRev && !elN && !elTicket && !elDelta) return;

    var fmt = function (n) {
      var v = Number(n);
      if (!isFinite(v)) v = 0;
      try {
        if (typeof fmtKz === 'function') return fmtKz(v);
      } catch (_) {}
      try {
        return Math.round(v).toLocaleString('pt-AO') + ' Kz';
      } catch (_e2) {
        return Math.round(v) + ' Kz';
      }
    };

    var totais = analise && analise.totais ? analise.totais : null;
    if (!totais) {
      if (elRev) elRev.textContent = '—';
      if (elN) elN.textContent = '—';
      if (elTicket) elTicket.textContent = '—';
      if (elDelta) {
        elDelta.textContent = '—';
        elDelta.removeAttribute('data-trend');
      }
      return;
    }

    if (elRev) elRev.textContent = fmt(totais.receita);
    if (elN) elN.textContent = String(totais.nVendas != null ? totais.nVendas : 0);
    if (elTicket) elTicket.textContent = fmt(totais.ticket);

    if (elDelta) {
      var ant = analise && analise.anterior ? analise.anterior : null;
      var pct = null;
      if (ant) {
        if (ant.pct != null) pct = Number(ant.pct);
        else if (ant.totais && totais.receita != null && ant.totais.receita > 0) {
          pct = ((Number(totais.receita) - Number(ant.totais.receita)) / Number(ant.totais.receita)) * 100;
        }
      }
      if (pct == null || !isFinite(pct)) {
        elDelta.textContent = '—';
        elDelta.removeAttribute('data-trend');
      } else {
        var rounded = Math.round(pct * 10) / 10;
        elDelta.textContent = (rounded > 0 ? '+' : '') + rounded + '%';
        elDelta.setAttribute('data-trend', rounded > 0 ? 'up' : (rounded < 0 ? 'down' : 'flat'));
      }
    }
  } catch (e) {
    try { console.warn('[chart-exec]', e); } catch (_) {}
  }
}

function _bpUpdateChartHealth(analise) {
  var el = document.getElementById('dash-chart-health');
  var val = document.getElementById('dash-chart-health-value');
  var st = document.getElementById('dash-chart-status');
  if (!el || !val) return;
  if (!analise || !analise.totais || !(analise.totais.nVendas > 0 || analise.totais.receita > 0)) {
    val.textContent = 'Sem dados';
    el.setAttribute('data-level', '');
    if (st) st.textContent = '';
    return;
  }
  var pct = analise.anterior && analise.anterior.pct != null ? Number(analise.anterior.pct) : null;
  var level = 'estavel';
  var label = 'Estável';
  if (pct != null) {
    if (pct >= 15) { level = 'excelente'; label = 'Em crescimento'; }
    else if (pct >= 0) { level = 'boa'; label = 'Estável'; }
    else if (pct > -15) { level = 'boa'; label = 'Ligeira queda'; }
    else { level = 'atencao'; label = 'Atenção'; }
  }
  el.setAttribute('data-level', level);
  val.textContent = label;
  if (st) st.textContent = pct != null ? ((pct > 0 ? '+' : '') + (Math.round(pct * 10) / 10) + '%') : '';
}

// ====================================================================
//  chart-module.js — Gráfico do dashboard (Fase A1: intervalo unificado)
// ====================================================================
let _chartSwipeStartX = null;
let _chartSwipeStartY = null;
let _chartSelectedIdx = null;
let _chartViewMode = (typeof localStorage !== 'undefined' && localStorage.getItem('bp_chart_view')) || 'barras';
let _chartAnimProgress = 1;
let _chartAnimRaf = null;



function _escChart(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function _fmtChart(n) {
  return typeof fmtKz === 'function' ? fmtKz(n) : String(Math.round(Number(n) || 0));
}

/** Fase 5 — sheet de drill-down do dia/hora */

/** ET4.7 — tooltip só no Resumo; nunca roubar toques da bottom-nav */
function bpChartIsDashboardActive() {
  try {
    if (typeof activeTab !== 'undefined' && activeTab && activeTab !== 'dashboard') return false;
    var pane = document.getElementById('tab-dashboard');
    if (pane && !pane.classList.contains('active')) return false;
    return true;
  } catch (_) {
    return true;
  }
}

function bpHideChartTooltip() {
  try {
    var tip = document.getElementById('chart-tooltip');
    if (tip) {
      tip.style.opacity = '0';
      tip.style.pointerEvents = 'none';
      tip.classList.remove('is-rich');
      tip.innerHTML = '';
      tip.setAttribute('aria-hidden', 'true');
    }
    if (typeof _chartSelectedIdx !== 'undefined') _chartSelectedIdx = null;
  } catch (_) {}
}

function bpConfineChartTooltipPosition(left, top, tip) {
  // Mantém o tooltip dentro da área do gráfico / tab dashboard, acima da nav (72px+)
  try {
    var wrap = document.getElementById('dash-chart-canvas-wrap')
      || document.getElementById('tab-dashboard')
      || document.body;
    var navH = 80;
    try {
      var nav = document.querySelector('.bottom-nav');
      if (nav) navH = Math.max(72, nav.getBoundingClientRect().height + 8);
    } catch (_) {}
    var maxBottom = window.innerHeight - navH - 8;
    var tipW = (tip && tip.offsetWidth) ? tip.offsetWidth : 200;
    var tipH = (tip && tip.offsetHeight) ? tip.offsetHeight : 120;
    var L = Math.min(window.innerWidth - tipW - 8, Math.max(8, left));
    var T = Math.min(maxBottom - tipH, Math.max(8, top));
    // Se o wrap do gráfico existe, preferir ficar sobre ele
    if (wrap && wrap.getBoundingClientRect) {
      var r = wrap.getBoundingClientRect();
      if (r.width > 40 && r.height > 40) {
        L = Math.min(r.right - 12 - tipW, Math.max(r.left + 8, L));
        T = Math.min(r.bottom - 8 - Math.min(tipH, r.height * 0.9), Math.max(r.top + 8, T));
      }
    }
    return { left: L, top: T };
  } catch (_) {
    return { left: left, top: top };
  }
}

if (typeof window !== 'undefined') {
  window.bpHideChartTooltip = bpHideChartTooltip;
  window.bpChartIsDashboardActive = bpChartIsDashboardActive;
}

function abrirChartDrill(dataIso, horaOpt) {
  // Contingência: drill só faz sentido no Resumo
  if (typeof bpChartIsDashboardActive === 'function' && !bpChartIsDashboardActive()) {
    if (typeof bpHideChartTooltip === 'function') bpHideChartTooltip();
    return;
  }
  if (!dataIso || typeof detalheDiaVendas !== 'function') return;
  var det = detalheDiaVendas(dataIso, (state && state.movimentos) || [], {
    hora: horaOpt != null && isFinite(horaOpt) ? Number(horaOpt) : undefined
  });
  var title = document.getElementById('chart-drill-title');
  var sub = document.getElementById('chart-drill-sub');
  var drillBody = document.getElementById('chart-drill-body');
  if (!drillBody) return;
  if (!det || !det.totais) return;

  var dataLabel = dataIso;
  if (typeof formatarDataCurta === 'function') dataLabel = formatarDataCurta(dataIso);
  try {
    var dFull = new Date(dataIso + 'T12:00:00');
    dataLabel = dFull.toLocaleDateString('pt-AO', { weekday: 'long', day: '2-digit', month: 'long' });
  } catch (_) {}

  if (title) {
    title.textContent = (det.hora != null)
      ? ('Detalhe · ' + String(det.hora).padStart(2, '0') + 'h')
      : 'Detalhe do dia';
  }
  if (sub) {
    sub.textContent = dataLabel + (det.hora != null ? (' · ' + String(det.hora).padStart(2, '0') + 'h') : '');
  }

  function listBlock(titulo, rows, nameKey) {
    nameKey = nameKey || 'nome';
    if (!rows || !rows.length) {
      return '<div class="chart-drill-section"><div class="chart-drill-sec-head">' + _escChart(titulo) + '</div><p class="chart-drill-empty">Sem dados neste período</p></div>';
    }
    var lis = rows.map(function (r) {
      var n = r.n || 0;
      var meta = n === 1 ? '1 registo' : (n + ' registos');
      return '<li class="chart-drill-row">' +
        '<div class="chart-drill-row-main">' +
          '<span class="chart-drill-row-name">' + _escChart(r[nameKey] || r.nome || '—') + '</span>' +
          '<span class="chart-drill-row-meta">' + meta + '</span>' +
        '</div>' +
        '<strong class="chart-drill-row-val">' + _escChart(_fmtChart(r.receita)) + '</strong>' +
      '</li>';
    }).join('');
    return '<div class="chart-drill-section"><div class="chart-drill-sec-head">' + _escChart(titulo) + '</div><ul class="chart-drill-list">' + lis + '</ul></div>';
  }

  var vendasLis = (det.vendas || []).map(function (m) {
    var hora = (m.hora || '').toString().slice(0, 5);
    var srv = m.servico_nome || m.servico || m.descricao || 'Venda';
    var cli = m.cliente || 'Avulso';
    var prof = (typeof getProfissionalNome === 'function' && m.profissional_id)
      ? getProfissionalNome(m.profissional_id)
      : (m.profissional || '');
    var pay = m.metodoPagamento || m.pagamento || '';
    var meta = [cli, prof, pay].filter(Boolean).join(' · ');
    return '<li class="chart-drill-row">' +
      '<div class="chart-drill-row-main">' +
        '<span class="chart-drill-row-name">' + _escChart((hora ? hora + ' · ' : '') + srv) + '</span>' +
        (meta ? '<span class="chart-drill-row-meta">' + _escChart(meta) + '</span>' : '') +
      '</div>' +
      '<strong class="chart-drill-row-val">' + _escChart(_fmtChart(m.valor)) + '</strong>' +
    '</li>';
  }).join('');

  var vsHtml = '';
  if (det.vsMesmoDiaSemana && det.vsMesmoDiaSemana.pct != null) {
    var p = det.vsMesmoDiaSemana.pct;
    var sign = p >= 0 ? '+' : '';
    vsHtml = '<div class="chart-drill-vs">' +
      '<span>Vs mesmo dia da semana</span>' +
      '<strong class="' + (p >= 0 ? 'is-up' : 'is-down') + '">' + sign + (Math.round(p * 10) / 10) + '%</strong>' +
    '</div>';
  }

  drillBody.innerHTML =
    '<div class="chart-drill-kpis">' +
      '<div class="chart-drill-kpi"><span>Receita</span><strong>' + _escChart(_fmtChart(det.totais.receita)) + '</strong></div>' +
      '<div class="chart-drill-kpi"><span>Vendas</span><strong>' + det.totais.nVendas + '</strong></div>' +
      '<div class="chart-drill-kpi"><span>Ticket</span><strong>' + _escChart(_fmtChart(det.totais.ticket)) + '</strong></div>' +
    '</div>' +
    vsHtml +
    '<div class="chart-drill-section"><div class="chart-drill-sec-head">Vendas</div>' +
      (vendasLis
        ? '<ul class="chart-drill-list">' + vendasLis + '</ul>'
        : '<p class="chart-drill-empty">Nenhuma venda neste intervalo</p>') +
    '</div>' +
    listBlock('Clientes', det.porCliente) +
    listBlock('Serviços', det.porServico) +
    listBlock('Profissionais', det.porProfissional) +
    listBlock('Pagamentos', det.porPagamento);

  if (typeof openModal === 'function') openModal('modal-chart-drill');
  else {
    var el = document.getElementById('modal-chart-drill');
    if (el) { el.classList.add('open'); el.style.display = 'flex'; }
  }
}

function fecharChartDrill() {
  if (typeof closeModal === 'function') closeModal('modal-chart-drill');
  else {
    var el = document.getElementById('modal-chart-drill');
    if (el) { el.classList.remove('open'); el.style.display = ''; }
  }
}



function actualizarDashChartInsights(analise) {
  var ul = document.getElementById('dash-chart-insights');
  if (!ul) return;
  var list = (analise && analise.insights) || [];
  if (!list.length) {
    ul.hidden = true;
    ul.innerHTML = '';
    return;
  }
  ul.hidden = false;
  if (window._chartShowInsights) ul.classList.add('is-live');
  else ul.classList.remove('is-live');
  ul.innerHTML = list.map(function (t) {
    return '<li>' + _escChart(t) + '</li>';
  }).join('');
}

function _chartShowSkeleton(on) {
  var sk = document.getElementById('dash-chart-skeleton');
  var canvas = document.getElementById('weekly-chart');
  if (sk) {
    sk.hidden = !on;
    sk.setAttribute('aria-hidden', on ? 'false' : 'true');
  }
  if (canvas) canvas.style.opacity = on ? '0.25' : '1';
}



function exportarAnalisePdf(analise) {
  var a = analise || window.__bpUltimaAnaliseTemporal;
  var fmt = typeof fmtKz === 'function' ? fmtKz : function (n) { return Math.round(Number(n) || 0) + ' Kz'; };
  if (!a || !a.totais) {
    if (typeof toast === 'function') toast('Não há dados para exportar.', 'warning');
    return;
  }
  var label = (a.intervalo && a.intervalo.label) || (a.meta && a.meta.label) || 'Período';
  var body =
    '<h1 style="font-size:18px;margin:0 0 8px;">BeautyPro — Análise de vendas</h1>' +
    '<p style="color:#555;font-size:12px;">' + String(label).replace(/</g,'&lt;') + '</p>' +
    '<table style="width:100%;font-size:13px;border-collapse:collapse;">' +
    '<tr><td>Receita</td><td style="text-align:right;"><strong>' + fmt(a.totais.receita) + '</strong></td></tr>' +
    '<tr><td>Vendas</td><td style="text-align:right;"><strong>' + a.totais.nVendas + '</strong></td></tr>' +
    '<tr><td>Ticket</td><td style="text-align:right;"><strong>' + fmt(a.totais.ticket) + '</strong></td></tr>' +
    '</table>' +
    '<p style="margin-top:20px;font-size:10px;color:#888;">' + new Date().toLocaleString('pt-AO') + '</p>';
  var w = window.open('', '_blank', 'noopener,noreferrer,width=720,height=900');
  if (!w) {
    if (typeof toast === 'function') toast('Permita pop-ups para PDF', 'error');
    return;
  }
  w.document.open();
  w.document.write('<!DOCTYPE html><html><head><meta charset="utf-8"><title>Análise</title></head><body style="font-family:system-ui;padding:24px;">' + body +
    '<script>window.onload=function(){setTimeout(function(){window.print();},250);}<\\/script></body></html>');
  w.document.close();
}

function exportarAnaliseCsv(analise) {
  var payload = typeof analiseParaExport === 'function'
    ? analiseParaExport(analise || window.__bpUltimaAnaliseTemporal)
    : null;
  if (!payload || !payload.serie) {
    if (typeof toast === 'function') toast('Não há dados para exportar.', 'warning');
    return;
  }
  var lines = ['data,label,receita,vendas,ticket'];
  payload.serie.forEach(function (p) {
    lines.push([
      p.data || '',
      '"' + String(p.label || '').replace(/"/g, '""') + '"',
      p.receita || 0,
      p.nVendas || 0,
      Math.round((p.ticket || 0) * 100) / 100
    ].join(','));
  });
  lines.push('');
  lines.push('total_receita,' + (payload.totais && payload.totais.receita || 0));
  lines.push('total_vendas,' + (payload.totais && payload.totais.nVendas || 0));
  var blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'beautypro-analise-' + (payload.meta && payload.meta.inicio ? payload.meta.inicio : 'export') + '.csv';
  document.body.appendChild(a);
  a.click();
  setTimeout(function () {
    URL.revokeObjectURL(url);
    a.remove();
  }, 500);
  if (typeof toast === 'function') toast('CSV exportado.', 'success');
}

function renderizarGrafico() {
  const canvas = document.getElementById('weekly-chart');
  if (!canvas) return;
  const parent = canvas.parentElement;
  const tabDash = document.getElementById('tab-dashboard');
  const tabVisivel = !tabDash || tabDash.classList.contains('active');
  let parentWidth = 0;
  try {
    parentWidth = parent ? parent.getBoundingClientRect().width : 0;
  } catch (_) { parentWidth = 0; }
  /* Tab oculta ou layout ainda a 0 → adiar (evita gráfico “desaparecido”) */
  if (tabVisivel && parentWidth < 40) {
    if (!renderizarGrafico._retry) {
      renderizarGrafico._retry = true;
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          renderizarGrafico._retry = false;
          renderizarGrafico();
        });
      });
    }
    return;
  }
  if (!tabVisivel) {
    /* Guarda pedido para quando a aba Resumo voltar a abrir */
    renderizarGrafico._pending = true;
    return;
  }
  renderizarGrafico._pending = false;

  const ctx = canvas.getContext('2d');
  const width = Math.max(parentWidth || 0, 200);
  const height = 220;
  canvas.width = width;
  canvas.height = height;
  try {
    canvas.style.width = '100%';
    canvas.style.height = height + 'px';
    canvas.style.display = 'block';
    canvas.style.touchAction = 'pan-y';
  } catch (_ta) {}
  if (parent) {
    try { parent.style.minHeight = height + 'px'; } catch (_) {}
  }
  ctx.clearRect(0, 0, width, height);

  const intervalo = (typeof getIntervaloDashAtual === 'function')
    ? getIntervaloDashAtual()
    : { inicio: (typeof hoje === 'function' ? hoje() : ''), fim: (typeof hoje === 'function' ? hoje() : ''), label: 'Hoje' };
  const modoHora = (state.chartPeriodo === 'hora');
  const mostrarValores = state.chartMostrarValores || false;
  const movs = state.movimentos || [];
  const dashOff = state.dashOffset || 0;

  // Modelo único (Fase 1) — série + totais + comparação
  let analise = null;
  if (typeof buildAnaliseTemporal === 'function') {
    var diaRefHora = null;
    if (modoHora) {
      if (intervalo.inicio && intervalo.inicio === intervalo.fim) diaRefHora = intervalo.inicio;
      else if (typeof hoje === 'function') diaRefHora = hoje();
      else diaRefHora = intervalo.fim;
    }
    analise = buildAnaliseTemporal(intervalo, movs, { modoHora: modoHora, diaRef: diaRefHora });
  }
  if (typeof actualizarDashChartExec === 'function') {
    try { actualizarDashChartExec(analise); } catch (eExec) { console.warn('[chart-exec]', eExec); }
  }
  try { actualizarDashChartInsights(analise); } catch (eIns) { console.warn('[chart-insights]', eIns); }


  let labels = [];
  let dados = [];
  let maxVal = 1;
  if (analise && analise.serie && analise.serie.length) {
    labels = analise.serie.map(function (p) { return p.label; });
    dados = analise.serie.map(function (p) { return Number(p.receita) || 0; });
    maxVal = 1;
    for (let i = 0; i < dados.length; i++) if (dados[i] > maxVal) maxVal = dados[i];
  }

  const hasData = !!(analise && analise.hasData) || dados.some(function (v) { return Number(v) > 0; });
  maxVal = Math.max(maxVal, 1);
  // Micro-animação de entrada (≤300ms)
  const animP = Math.max(0, Math.min(1, _chartAnimProgress));
  if (animP < 1) {
    dados = dados.map(function (v) { return v * animP; });
  }

  const emptyEl = document.getElementById('dash-chart-empty');
  if (emptyEl) {
    emptyEl.hidden = hasData;
    emptyEl.setAttribute('aria-hidden', hasData ? 'true' : 'false');
  }
  // Guardar último modelo para fases seguintes (tooltip / drill-down)
  try { window.__bpUltimaAnaliseTemporal = analise;
  try { _bpUpdateChartHealth(analise); } catch (_h) {} } catch (_) {}
  try { _chartShowSkeleton(false); } catch (_) {}


  // Tokens CSS (fallback seguro)
  const cs = (typeof getComputedStyle === 'function') ? getComputedStyle(document.documentElement) : null;
  const tok = function (name, fb) {
    try { const v = cs && cs.getPropertyValue(name); return (v && v.trim()) || fb; } catch (_) { return fb; }
  };
  const gold = tok('--gold', '#D4AF37');
  const goldDark = tok('--gold-600', tok('--gold-dark', '#A7872B'));
  const mutedBar = tok('--border-soft', '#DCD5C9');
  const textMuted = tok('--text-muted', '#8c8980');
  const textPrimary = tok('--text-primary', '#1C1A18');

  const n = Math.max(labels.length, 1);
  // Largura adaptativa: muitas barras → mais finas; poucas → cap 40px (nunca 1 barra a largura toda)
  const slot = (width - 48) / n;
  const barW = Math.min(40, Math.max(6, slot - 6));
  const gap = Math.min(8, Math.max(3, (slot - barW)));
  const groupW = n * barW + (n - 1) * gap;
  const startX = Math.max(24, (width - groupW) / 2);
  const baseY = height - 22;
  const plotH = height - 40;

  // Baseline: nítida e legível, sem engrossar
  ctx.save();
  ctx.strokeStyle = textPrimary;
  ctx.globalAlpha = 0.32;
  ctx.lineWidth = 1;
  ctx.lineCap = 'butt';
  ctx.beginPath();
  ctx.moveTo(16, baseY + 0.5);
  ctx.lineTo(width - 16, baseY + 0.5);
  ctx.stroke();
  ctx.restore();

  // Geometria de hit-test (partilhada com hover)
  const stepX = barW + gap;
  const barRects = [];

  if (!hasData) {
    labels.forEach(function (lab, i) {
      const x = startX + i * stepX + barW / 2;
      ctx.fillStyle = textMuted;
      ctx.font = '9px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      if (n <= 14) ctx.fillText(lab, x, baseY + 4);
    });
  } else {
    // Validar índice seleccionado
    if (_chartSelectedIdx != null && (_chartSelectedIdx < 0 || _chartSelectedIdx >= labels.length)) {
      _chartSelectedIdx = null;
    }
    const hasSel = _chartSelectedIdx != null;
    const viewMode = _chartViewMode || 'barras';

    // Pontos para linha/área
    const pts = [];
    for (let i = 0; i < labels.length; i++) {
      const x = startX + i * stepX + barW / 2;
      const val = Number(dados[i]) || 0;
      const y = baseY - (val > 0 ? Math.max(3, (val / maxVal) * plotH) : 0);
      pts.push({ x: x, y: y, val: val, i: i });
    }

    if (viewMode === 'linha' || viewMode === 'area') {
      ctx.save();
      if (viewMode === 'area' && pts.length) {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, baseY);
        for (let i = 0; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.lineTo(pts[pts.length - 1].x, baseY);
        ctx.closePath();
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = gold;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      ctx.beginPath();
      for (let i = 0; i < pts.length; i++) {
        if (i === 0) ctx.moveTo(pts[i].x, pts[i].y);
        else ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.strokeStyle = gold;
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();
      for (let i = 0; i < pts.length; i++) {
        if (pts[i].val <= 0) continue;
        const isSel = hasSel && i === _chartSelectedIdx;
        ctx.beginPath();
        ctx.arc(pts[i].x, pts[i].y, isSel ? 5 : 3, 0, Math.PI * 2);
        ctx.fillStyle = isSel ? textPrimary : gold;
        ctx.globalAlpha = (hasSel && !isSel) ? 0.35 : 1;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      // labels
      for (let i = 0; i < labels.length; i++) {
        const isLast = (i === labels.length - 1 && dashOff === 0);
        ctx.fillStyle = isLast ? textPrimary : textMuted;
        ctx.font = (isLast ? 'bold ' : '') + '9px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        if (n <= 16) ctx.fillText(labels[i], pts[i].x, baseY + 4);
      }
      ctx.restore();
    }

    if (viewMode === 'barras') for (let i = 0; i < labels.length; i++) {
      const x = startX + i * stepX;
      const val = Number(dados[i]) || 0;
      const barH = val > 0 ? Math.max(3, (val / maxVal) * plotH) : 0;
      const y = baseY - barH;
      const radius = Math.min(4, barW / 2);
      barRects.push({ x: x, w: barW, i: i, val: val });

      const isSel = hasSel && i === _chartSelectedIdx;
      const dim = hasSel && !isSel;
      ctx.globalAlpha = dim ? 0.32 : 1;

      if (val > 0) {
        const grad = ctx.createLinearGradient(0, y, 0, baseY);
        grad.addColorStop(0, gold);
        grad.addColorStop(1, goldDark);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + barW - radius, y);
        ctx.arcTo(x + barW, y, x + barW, y + radius, radius);
        ctx.lineTo(x + barW, baseY);
        ctx.lineTo(x, baseY);
        ctx.lineTo(x, y + radius);
        ctx.arcTo(x, y, x + radius, y, radius);
        ctx.closePath();
        ctx.fill();
        if (isSel) {
          ctx.strokeStyle = textPrimary;
          ctx.lineWidth = 1.25;
          ctx.stroke();
        }
      } else {
        ctx.fillStyle = mutedBar;
        ctx.fillRect(x + barW * 0.25, baseY - 2, barW * 0.5, 2);
      }

      const isLast = (i === labels.length - 1 && dashOff === 0);
      ctx.fillStyle = isLast ? textPrimary : textMuted;
      ctx.font = (isLast ? 'bold ' : '') + '9px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      if (n <= 16) ctx.fillText(labels[i], x + barW / 2, baseY + 4);

      if (mostrarValores && val > 0 && typeof fmtKz === 'function') {
        ctx.fillStyle = textPrimary;
        ctx.font = 'bold 9px system-ui, sans-serif';
        ctx.textBaseline = 'bottom';
        ctx.fillText(fmtKz(val).replace(' Kz', ''), x + barW / 2, y - 2);
      }
      ctx.globalAlpha = 1;
    }

    // Linha de média do período (Fase 3) — só se activada no menu ⋯
    var media = (analise && analise.mediaSerie) || 0;
    if (window._chartShowMedia && media > 0 && maxVal > 0) {
      var yMed = baseY - (media / maxVal) * plotH;
      ctx.save();
      // Média: preta, nítida, mesma espessura
      ctx.strokeStyle = textPrimary;
      ctx.lineWidth = 1;
      ctx.lineCap = 'butt';
      ctx.setLineDash([4, 3]);
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.moveTo(16, yMed + 0.5);
      ctx.lineTo(width - 16, yMed + 0.5);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = '600 8px system-ui, sans-serif';
      ctx.fillStyle = textPrimary;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText('Média', 18, yMed - 2);
      ctx.restore();
      try {
        var _mv = document.getElementById('dash-chart-leg-media-val');
        if (_mv && typeof fmtKz === 'function') _mv.textContent = fmtKz(media);
        else if (_mv) _mv.textContent = String(Math.round(media));
      } catch (_) {}
    } else {
      try {
        var _mv2 = document.getElementById('dash-chart-leg-media-val');
        if (_mv2 && !window._chartShowMedia) { /* leave */ }
      } catch (_) {}
    }

    // Linha de meta (só se meta mensal existir e o período for mensal/comparável)
    try {
      var metaMes = 0;
      if (typeof getMetaSalao === 'function') metaMes = Number(getMetaSalao()) || 0;
      else if (state && state.config && state.config.meta_mensal_salao) metaMes = Number(state.config.meta_mensal_salao) || 0;
      if (metaMes > 0 && !modoHora && analise && analise.serie && analise.serie.length) {
        var diasPeriodo = analise.serie.length;
        // Meta proporcional ao nº de buckets visíveis (aproximação discreta)
        var metaBucket = metaMes / Math.max(diasPeriodo, 1);
        // Só desenhar se estiver dentro da escala (senão polui)
        if (metaBucket > 0 && metaBucket <= maxVal * 1.35) {
          var yMeta = baseY - (Math.min(metaBucket, maxVal) / maxVal) * plotH;
          ctx.save();
          ctx.strokeStyle = gold;
          ctx.lineWidth = 1;
          ctx.globalAlpha = 0.45;
          ctx.setLineDash([2, 4]);
          ctx.beginPath();
          ctx.moveTo(16, yMeta + 0.5);
          ctx.lineTo(width - 16, yMeta + 0.5);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.font = '8px system-ui, sans-serif';
          ctx.fillStyle = goldDark;
          ctx.globalAlpha = 0.7;
          ctx.textAlign = 'right';
          ctx.textBaseline = 'bottom';
          ctx.fillText('Meta', width - 18, yMeta - 2);
          ctx.restore();
        }
      }
    } catch (_metaErr) {}
  }

  const labelEl = document.getElementById('chart-period-label');
  if (labelEl) {
    labelEl.textContent = modoHora
      ? (((analise && analise.diaRef) ? analise.diaRef : (intervalo.label || 'Dia')) + ' · por hora')
      : (intervalo.label || 'Período');
    if (modoHora && analise && analise.diaRef && typeof formatarDataCurta === 'function') {
      labelEl.textContent = formatarDataCurta(analise.diaRef) + ' · por hora';
    }
  }

  const tooltip = document.getElementById('chart-tooltip');
  const stepHit = barW + gap;

  function hitIndex(clientX) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / Math.max(rect.width, 1);
    const mouseX = (clientX - rect.left) * scaleX;
    for (let i = 0; i < labels.length; i++) {
      const x = startX + i * stepHit;
      // área de toque alargada (~44px lógico mínimo)
      const pad = Math.max(0, (22 - barW) / 2);
      if (mouseX >= x - pad && mouseX <= x + barW + pad) return i;
    }
    return -1;
  }

  function showTooltipFor(idx, clientX, clientY) {
    if (typeof bpChartIsDashboardActive === 'function' && !bpChartIsDashboardActive()) {
      if (typeof bpHideChartTooltip === 'function') bpHideChartTooltip();
      return;
    }

    if (!tooltip || idx < 0) return;
    const pt = analise && analise.serie && analise.serie[idx];
    const val = dados[idx] || 0;
    if (!(val > 0) && !(pt && pt.receita > 0)) {
      tooltip.style.opacity = '0';
      return;
    }

    var dataIso = pt && pt.data ? pt.data : null;
    var horaOpt = (pt && pt.hora != null) ? pt.hora : null;
    var det = null;
    if (dataIso && typeof detalheDiaVendas === 'function' && !modoHora) {
      // no modo dia/semana/mes: detalhe do dia do bucket
      det = detalheDiaVendas(dataIso, movs, {});
    } else if (dataIso && typeof detalheDiaVendas === 'function' && modoHora) {
      det = detalheDiaVendas(dataIso, movs, { hora: horaOpt });
    }

    var title = labels[idx] || '';
    if (pt && pt.data) {
      try {
        var df = new Date(pt.data + 'T12:00:00');
        title = df.toLocaleDateString('pt-AO', { weekday: 'short', day: '2-digit', month: 'short' });
        if (horaOpt != null) title += ' · ' + String(horaOpt).padStart(2, '0') + 'h';
      } catch (_) {}
    }

    var rows = '';
    var receita = pt ? pt.receita : val;
    var nV = pt ? pt.nVendas : 0;
    var ticket = pt ? pt.ticket : 0;
    rows += '<div class="ct-row"><span>Receita</span><strong>' + _escChart(_fmtChart(receita)) + '</strong></div>';
    if (nV) rows += '<div class="ct-row"><span>Vendas</span><strong>' + nV + '</strong></div>';
    if (nV) rows += '<div class="ct-row"><span>Ticket</span><strong>' + _escChart(_fmtChart(ticket)) + '</strong></div>';
    if (det && det.topProfissional) {
      rows += '<div class="ct-row"><span>Top profissional</span><strong>' + _escChart(det.topProfissional.nome) + '</strong></div>';
    }
    if (det && det.topServico) {
      rows += '<div class="ct-row"><span>Top serviço</span><strong>' + _escChart(det.topServico.nome) + '</strong></div>';
    }
    if (det && det.topPagamento) {
      rows += '<div class="ct-row"><span>Pagamento</span><strong>' + _escChart(det.topPagamento.nome) + '</strong></div>';
    }
    if (pt && pt.anterior && pt.anterior.pct != null && (pt.anterior.receita > 0 || pt.anterior.nVendas > 0)) {
      var s = pt.anterior.pct >= 0 ? '+' : '';
      rows += '<div class="ct-row"><span>vs mesma hora ontem</span><strong>' + s + (Math.round(pt.anterior.pct * 10) / 10) + '%</strong></div>';
    }
    if (det && det.vsMesmoDiaSemana && det.vsMesmoDiaSemana.pct != null && !modoHora) {
      var s2 = det.vsMesmoDiaSemana.pct >= 0 ? '+' : '';
      rows += '<div class="ct-row"><span>vs mesmo dia sem.</span><strong>' + s2 + (Math.round(det.vsMesmoDiaSemana.pct * 10) / 10) + '%</strong></div>';
    }

    var drillAttr = dataIso ? (' data-drill-data="' + _escChart(dataIso) + '"') : '';
    if (horaOpt != null) drillAttr += ' data-drill-hora="' + horaOpt + '"';

    tooltip.classList.add('is-rich');
    tooltip.innerHTML =
      '<div class="ct-title">' + _escChart(title) + '</div>' + rows +
      (dataIso
        ? '<div class="ct-actions"><button type="button" class="ct-drill-btn" id="chart-tooltip-drill"' + drillAttr + '>Ver detalhe</button></div>'
        : '');
    tooltip.style.whiteSpace = 'normal';
    // Só no dashboard; senão não mostrar
    if (typeof bpChartIsDashboardActive === 'function' && !bpChartIsDashboardActive()) {
      bpHideChartTooltip();
      return;
    }
    var left = Math.min(window.innerWidth - 200, Math.max(8, clientX + 8));
    var top = Math.max(8, clientY - 20);
    var confined = typeof bpConfineChartTooltipPosition === 'function'
      ? bpConfineChartTooltipPosition(left, top, tooltip)
      : { left: left, top: top };
    tooltip.style.left = confined.left + 'px';
    tooltip.style.top = confined.top + 'px';
    tooltip.style.opacity = '1';
    tooltip.style.pointerEvents = 'auto';
    tooltip.setAttribute('aria-hidden', 'false');

    var btn = document.getElementById('chart-tooltip-drill');
    if (btn) {
      btn.onclick = function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        // Garante que o toque não propaga para a nav
        if (ev.stopImmediatePropagation) ev.stopImmediatePropagation();
        if (typeof bpChartIsDashboardActive === 'function' && !bpChartIsDashboardActive()) {
          bpHideChartTooltip();
          return;
        }
        var d = btn.getAttribute('data-drill-data');
        var h = btn.getAttribute('data-drill-hora');
        if (typeof abrirChartDrill === 'function') {
          abrirChartDrill(d, h != null && h !== '' ? Number(h) : undefined);
        }
        bpHideChartTooltip();
      };
    }
  }

  function selectBar(idx) {
    if (idx < 0 || !(dados[idx] > 0)) {
      if (_chartSelectedIdx != null) {
        _chartSelectedIdx = null;
        if (tooltip) tooltip.style.opacity = '0';
        renderizarGrafico();
      }
      return;
    }
    _chartSelectedIdx = idx;
    renderizarGrafico();
    // tooltip mantém-se via re-bind — mostrar após paint
    requestAnimationFrame(function () {
      // posição aproximada: centro da barra
      const rect = canvas.getBoundingClientRect();
      const scale = rect.width / Math.max(canvas.width, 1);
      const cx = rect.left + (startX + idx * stepHit + barW / 2) * scale;
      const cy = rect.top + 24;
      showTooltipFor(idx, cx, cy);
    });
  }

  if (tooltip) {
    canvas.onmousemove = function (e) {
      const idx = hitIndex(e.clientX);
      if (idx !== -1 && dados[idx] > 0) showTooltipFor(idx, e.clientX, e.clientY);
      else if (_chartSelectedIdx == null) tooltip.style.opacity = '0';
    };
    canvas.onmouseleave = function () {
      if (_chartSelectedIdx == null) tooltip.style.opacity = '0';
    };
    canvas.onclick = function (e) {
      const idx = hitIndex(e.clientX);
      if (idx === _chartSelectedIdx) selectBar(-1);
      else selectBar(idx);
    };
  }

  canvas.ontouchstart = function (e) {
    if (e.touches.length > 0) {
      _chartSwipeStartX = e.touches[0].clientX;
      _chartSwipeStartY = e.touches[0].clientY;
      // não chamar preventDefault — permite scroll vertical da página
      if (tooltip) {
        const idx = hitIndex(e.touches[0].clientX);
        if (idx !== -1 && dados[idx] > 0) showTooltipFor(idx, e.touches[0].clientX, e.touches[0].clientY);
      }
    }
  };
  canvas.ontouchmove = function (e) {
    if (e.touches.length === 0) return;
    var t = e.touches[0];
    var dx = t.clientX - (_chartSwipeStartX != null ? _chartSwipeStartX : t.clientX);
    var dy = t.clientY - (_chartSwipeStartY != null ? _chartSwipeStartY : t.clientY);
    // só intercepta gesto claramente horizontal (drill/swipe); vertical = scroll livre
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 12) {
      if (e.cancelable) e.preventDefault();
    }
    if (tooltip) {
      const idx = hitIndex(t.clientX);
      if (idx !== -1 && dados[idx] > 0) showTooltipFor(idx, t.clientX, t.clientY);
      else if (_chartSelectedIdx == null) tooltip.style.opacity = '0';
    }
  };
  canvas.ontouchend = function (e) {
    if (_chartSwipeStartX !== null && e.changedTouches.length > 0) {
      const dx = e.changedTouches[0].clientX - _chartSwipeStartX;
      const dy = e.changedTouches[0].clientY - _chartSwipeStartY;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        if (tooltip) tooltip.style.opacity = '0';
        _chartSelectedIdx = null;
        if (dx < 0) state.dashOffset = (state.dashOffset || 0) + 1;
        else if ((state.dashOffset || 0) > 0) state.dashOffset -= 1;
        localStorage.setItem('bp_dash_offset', String(state.dashOffset || 0));
        if (typeof renderDashboard === 'function') renderDashboard();
        renderizarGrafico();
      } else if (Math.abs(dx) < 12 && Math.abs(dy) < 12) {
        // tap = seleccionar barra
        const idx = hitIndex(e.changedTouches[0].clientX);
        if (idx === _chartSelectedIdx) selectBar(-1);
        else selectBar(idx);
      } else if (_chartSelectedIdx == null && tooltip) {
        tooltip.style.opacity = '0';
      }
    }
    _chartSwipeStartX = null;
    _chartSwipeStartY = null;
  };
}

let _chartControlsBound = false;
function _bpSetChartFilterActive(periodo) {
  document.querySelectorAll('.dash-chart-seg .chart-filter, .chart-filter[data-periodo]').forEach(function (b) {
    const on = b.getAttribute('data-periodo') === periodo;
    b.classList.toggle('is-active', on);
    b.classList.toggle('btn-primary', on);
    b.classList.toggle('btn-secondary', !on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}
/** Olho só no modo Barras (valores nas barras). */
function _bpSyncChartEye() {
  var eye = document.getElementById('chart-eye-toggle');
  if (!eye) return;
  var mode = (typeof _chartViewMode !== 'undefined' && _chartViewMode) ? _chartViewMode : 'barras';
  var show = mode === 'barras';
  eye.hidden = !show;
  eye.setAttribute('aria-hidden', show ? 'false' : 'true');
  try { eye.style.display = show ? '' : 'none'; } catch (_) {}
}


/* Mantém o canvas legível após navegação / rotação / volta à aba Resumo */
function _bpEnsureChartResizeObserver() {
  if (_bpEnsureChartResizeObserver._done) return;
  var wrap = document.getElementById('dash-chart-canvas-wrap') || document.getElementById('weekly-chart');
  if (!wrap) return;
  var target = wrap.id === 'weekly-chart' && wrap.parentElement ? wrap.parentElement : wrap;
  _bpEnsureChartResizeObserver._done = true;
  var t = null;
  function schedule() {
    if (t) clearTimeout(t);
    t = setTimeout(function () {
      if (typeof renderizarGrafico === 'function') renderizarGrafico();
    }, 60);
  }
  if (typeof ResizeObserver !== 'undefined') {
    try {
      var ro = new ResizeObserver(function () { schedule(); });
      ro.observe(target);
    } catch (_) {}
  }
  window.addEventListener('resize', schedule);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) schedule();
  });
}
try { _bpEnsureChartResizeObserver(); } catch (_) {}
document.addEventListener('DOMContentLoaded', function () {
  try { _bpEnsureChartResizeObserver(); } catch (_) {}
});

function initChartControls() {
  if (_chartControlsBound) return;
  _chartControlsBound = true;
  // Estado inicial coerente com state
  const inicial = state.chartPeriodo || state.dashPeriodo || 'semana';
  _bpSetChartFilterActive(inicial === 'hora' ? 'hora' : (state.dashPeriodo || inicial));

  document.querySelectorAll('.dash-chart-seg .chart-filter').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const periodo = this.dataset.periodo;
      if (!periodo) return;
      if (periodo === 'hora') {
        state.chartPeriodo = 'hora';
        // Modo hora analisa um dia concreto — alinhar dash a "dia"
        state.dashPeriodo = 'dia';
        try {
          localStorage.setItem('bp_dash_periodo', 'dia');
          localStorage.setItem('bp_chart_periodo', 'hora');
        } catch (_) {}
      } else {
        state.chartPeriodo = periodo; // dia | semana | mes — alinhado ao dash
        state.dashPeriodo = periodo;
        state.dashOffset = 0;
        try {
          localStorage.setItem('bp_dash_periodo', state.dashPeriodo);
          localStorage.setItem('bp_dash_offset', '0');
        } catch (_) {}
      }
      try { localStorage.setItem('bp_chart_periodo', state.chartPeriodo); } catch (_) {}
      _bpSetChartFilterActive(periodo);
      _chartSelectedIdx = null;
      _chartShowSkeleton(true);
      _chartAnimProgress = 0;
      if (typeof renderDashboard === 'function') renderDashboard();
      if (_chartAnimRaf) cancelAnimationFrame(_chartAnimRaf);
      var t0 = performance.now();
      function step(now) {
        var t = Math.min(1, (now - t0) / 280);
        _chartAnimProgress = t * t * (3 - 2 * t); // smoothstep
        renderizarGrafico();
        if (t < 1) _chartAnimRaf = requestAnimationFrame(step);
        else {
          _chartAnimProgress = 1;
          _chartShowSkeleton(false);
        }
      }
      requestAnimationFrame(function () {
        _chartShowSkeleton(false);
        _chartAnimRaf = requestAnimationFrame(step);
      });
    });
  });

  const prevBtn = document.getElementById('chart-prev');
  const nextBtn = document.getElementById('chart-next');
  if (prevBtn) {
    prevBtn.onclick = () => {
      state.dashOffset = (state.dashOffset || 0) + 1;
      localStorage.setItem('bp_dash_offset', String(state.dashOffset));
      if (typeof renderDashboard === 'function') renderDashboard();
      renderizarGrafico();
    };
  }
  if (nextBtn) {
    nextBtn.onclick = () => {
      if ((state.dashOffset || 0) > 0) {
        state.dashOffset -= 1;
        localStorage.setItem('bp_dash_offset', String(state.dashOffset));
        if (typeof renderDashboard === 'function') renderDashboard();
        renderizarGrafico();
      }
    };
  }

  const drillModal = document.getElementById('modal-chart-drill');
  if (drillModal && !drillModal.dataset.bound) {
    drillModal.dataset.bound = '1';
    drillModal.addEventListener('click', function (e) {
      if (e.target === drillModal || e.target.getAttribute('data-close') === 'modal-chart-drill') {
        fecharChartDrill();
      }
    });
  }

  var exportBtn = document.getElementById('chart-export-csv');
  if (exportBtn && !exportBtn.dataset.bound) {
    exportBtn.dataset.bound = '1';
    exportBtn.addEventListener('click', function () {
      exportarAnaliseCsv(window.__bpUltimaAnaliseTemporal);
    });
  }

  document.querySelectorAll('.dash-chart-view-btn').forEach(function (btn) {
    if (btn.dataset.bound) return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', function () {
      try { _bpHaptic('toggle'); } catch (_) {}
      var v = this.getAttribute('data-chart-view') || 'barras';
      _chartViewMode = v;
      try { localStorage.setItem('bp_chart_view', v); } catch (_) {}
      document.querySelectorAll('.dash-chart-view-btn').forEach(function (b) {
        var on = b.getAttribute('data-chart-view') === v;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      if (typeof _bpSyncChartEye === 'function') _bpSyncChartEye();
      renderizarGrafico();
    });
  });
  // sync active view button
  document.querySelectorAll('.dash-chart-view-btn').forEach(function (b) {
    var on = b.getAttribute('data-chart-view') === (_chartViewMode || 'barras');
    b.classList.toggle('is-active', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  if (typeof _bpSyncChartEye === 'function') _bpSyncChartEye();

  const eyeToggle = document.getElementById('chart-eye-toggle');
  if (eyeToggle) {
    eyeToggle.addEventListener('click', function() {
      state.chartMostrarValores = !state.chartMostrarValores;
      localStorage.setItem('bp_chart_mostrar_valores', String(state.chartMostrarValores));
      const svg = this.querySelector('svg');
      if (svg) {
        if (state.chartMostrarValores) {
          svg.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
        } else {
          svg.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';
        }
      }
      renderizarGrafico();
    });
  }
}

/** @deprecated feedback visual — anel CSS; mantido no-op seguro */
function _bpChartPulse(el) { /* no-op */ }

function _bpInitChartChrome() {
  if (window.__bpChartChromeBound) return;
  window.__bpChartChromeBound = true;
  var card = document.querySelector('.dash-chart-card');
  var toggle = document.getElementById('chart-filter-toggle');
  if (toggle && !toggle.dataset.boundKpiModal) {
    toggle.dataset.boundKpiModal = '1';
    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      function markActive() {
        document.querySelectorAll('.dash-periodo-opcao').forEach(function (btn) {
          var ativa = btn.dataset.periodo === state.dashPeriodo &&
            (btn.dataset.periodo !== 'dia' || Number(btn.dataset.offset || 0) === Number(state.dashOffset || 0));
          btn.classList.toggle('active', ativa);
        });
      }
      function placeSheetNearFilter() {
        try {
          var sheet = document.querySelector('#modal-periodo-dashboard .modal-sheet');
          var btn = document.getElementById('chart-filter-toggle');
          if (!sheet || !btn) return;
          var r = btn.getBoundingClientRect();
          var w = Math.min(220, window.innerWidth * 0.78);
          var left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8));
          var top = Math.min(r.bottom + 6, window.innerHeight - 120);
          sheet.style.top = Math.round(top) + 'px';
          sheet.style.left = Math.round(left) + 'px';
          sheet.style.width = Math.round(w) + 'px';
        } catch (_) {}
      }
      markActive();
      try { _bpHaptic('open'); } catch (_) {}
      if (typeof openModal === 'function') {
        openModal('modal-periodo-dashboard');
        placeSheetNearFilter();
        setTimeout(placeSheetNearFilter, 30);
      } else {
        var kpiIcon = document.getElementById('dash-filter-icon');
        if (kpiIcon) kpiIcon.click();
      }
    });
  }
  setTimeout(function () {
    var card = document.querySelector('.dash-chart-card');
    if (card) card.classList.add('nudge-done');
  }, 8000);

  var expT = document.getElementById('chart-export-toggle');
  var expM = document.getElementById('chart-export-menu');
  if (expT && expM && !expT.dataset.bound) {
    expT.dataset.bound = '1';
    expT.addEventListener('click', function (e) {
      e.stopPropagation();
      expM.hidden = !expM.hidden;
      expT.setAttribute('aria-expanded', expM.hidden ? 'false' : 'true');
    });
  }
  var csv = document.getElementById('chart-export-csv');
  if (csv && !csv.dataset.boundPdf) {
    csv.dataset.boundPdf = '1';
    csv.addEventListener('click', function (e) {
      e.stopPropagation();
      if (expM) expM.hidden = true;
      if (typeof exportarAnaliseCsv === 'function') exportarAnaliseCsv(window.__bpUltimaAnaliseTemporal);
    });
  }
  var pdfBtn = document.getElementById('chart-export-pdf');
  if (pdfBtn && !pdfBtn.dataset.bound) {
    pdfBtn.dataset.bound = '1';
    pdfBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (expM) expM.hidden = true;
      if (typeof exportarAnalisePdf === 'function') exportarAnalisePdf(window.__bpUltimaAnaliseTemporal);
    });
  }

  var moreT = document.getElementById('chart-more-toggle');
  var moreM = document.getElementById('chart-more-menu');
  if (moreT && moreM && !moreT.dataset.bound) {
    moreT.dataset.bound = '1';
    moreT.addEventListener('click', function (e) {
      e.stopPropagation();
      moreM.hidden = !moreM.hidden;
      moreT.setAttribute('aria-expanded', moreM.hidden ? 'false' : 'true');
    });
    moreM.querySelectorAll('[data-chart-more]').forEach(function (item) {
      item.addEventListener('click', function (e) {
        e.stopPropagation();
        moreM.hidden = true;
        var act = this.getAttribute('data-chart-more');
        var leg = document.getElementById('dash-chart-legend');
        var ins = document.getElementById('dash-chart-insights');
        var mediaSpan = leg ? leg.querySelector('.dash-chart-leg-media') : null;

        // Exclusivo: só uma acção activa de cada vez
        var wasOn = this.classList.contains('is-on');
        moreM.querySelectorAll('[data-chart-more]').forEach(function (b) {
          b.classList.remove('is-on');
        });
        window._chartShowMedia = false;
        window._chartShowComparar = false;
        window._chartShowInsights = false;
        if (ins) { ins.hidden = true; ins.classList.remove('is-live'); }
        if (mediaSpan) mediaSpan.classList.remove('is-active');
        if (leg) {
          var cmp0 = document.getElementById('dash-chart-leg-cmp');
          if (cmp0) cmp0.hidden = true;
        }

        if (wasOn) {
          // desligar tudo
          try { _bpHaptic('toggle'); } catch (_) {}
          if (leg) leg.hidden = true;
          if (typeof renderizarGrafico === 'function') renderizarGrafico();
          return;
        }

        this.classList.add('is-on');
        try { _bpHaptic('select'); } catch (_) {}

        if (act === 'media') {
          window._chartShowMedia = true;
          if (leg) leg.hidden = false;
          if (mediaSpan) mediaSpan.classList.add('is-active');
          if (typeof renderizarGrafico === 'function') renderizarGrafico();
        } else if (act === 'comparar') {
          window._chartShowComparar = true;
          if (leg) {
            leg.hidden = false;
            var cmp = document.getElementById('dash-chart-leg-cmp');
            if (cmp) {
              cmp.hidden = false;
              var a = window.__bpUltimaAnaliseTemporal;
              var pct = a && a.anterior && a.anterior.pct != null ? a.anterior.pct : null;
              cmp.textContent = pct != null
                ? ((pct > 0 ? '+' : '') + (Math.round(pct * 10) / 10) + '% vs anterior')
                : 'Sem comparação';
            }
          }
          if (typeof renderizarGrafico === 'function') renderizarGrafico();
        } else if (act === 'insights') {
          window._chartShowInsights = true;
          if (ins) {
            if (typeof actualizarDashChartInsights === 'function' && window.__bpUltimaAnaliseTemporal) {
              try { actualizarDashChartInsights(window.__bpUltimaAnaliseTemporal); } catch (_) {}
            }
            ins.hidden = false;
            ins.classList.add('is-live');
          }
        }
      });
    });

  }
  document.addEventListener('click', function () {
    if (expM) expM.hidden = true;
    if (moreM) moreM.hidden = true;
  });
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () { setTimeout(_bpInitChartChrome, 100); });
} else {
  setTimeout(_bpInitChartChrome, 100);
}


/* ET4.7 — nav e overlays: nunca deixar tooltip roubar toques */
(function bpChartTooltipNavGuard() {
  if (window.__bpChartTipGuard) return;
  window.__bpChartTipGuard = 1;
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    // Toque na bottom-nav ou noutro tab-pane que não o dashboard → esconder tooltip
    if (t.closest('.bottom-nav, .nav-item, [data-tab]')) {
      if (typeof bpHideChartTooltip === 'function') bpHideChartTooltip();
      return;
    }
    if (t.closest('#tab-agenda, #tab-clientes, #tab-caixa, #tab-equipa, #tab-ia')) {
      if (typeof bpHideChartTooltip === 'function') bpHideChartTooltip();
    }
  }, true);
  document.addEventListener('touchstart', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    if (t.closest('.bottom-nav, .nav-item')) {
      if (typeof bpHideChartTooltip === 'function') bpHideChartTooltip();
    }
  }, { capture: true, passive: true });
})();
