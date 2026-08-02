// ====================================================================
//  chart-module.js — Gráfico do dashboard (Fase A1: intervalo unificado)
// ====================================================================
let _chartSwipeStartX = null;
let _chartSwipeStartY = null;

function renderizarGrafico() {
  const canvas = document.getElementById('weekly-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const parentWidth = canvas.parentElement.getBoundingClientRect().width || 400;
  const width = Math.max(parentWidth, 200);
  const height = 140;
  canvas.width = width;
  canvas.height = height;
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
    analise = buildAnaliseTemporal(intervalo, movs, { modoHora: modoHora });
  }
  if (typeof actualizarDashChartExec === 'function') {
    try { actualizarDashChartExec(analise); } catch (eExec) { console.warn('[chart-exec]', eExec); }
  }

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

  const emptyEl = document.getElementById('dash-chart-empty');
  if (emptyEl) {
    emptyEl.hidden = hasData;
    emptyEl.setAttribute('aria-hidden', hasData ? 'true' : 'false');
  }
  // Guardar último modelo para fases seguintes (tooltip / drill-down)
  try { window.__bpUltimaAnaliseTemporal = analise; } catch (_) {}


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

  // Baseline discreta
  ctx.strokeStyle = mutedBar;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(16, baseY + 0.5);
  ctx.lineTo(width - 16, baseY + 0.5);
  ctx.stroke();

  if (!hasData) {
    // Só empty state — sem barras fantasma
    labels.forEach(function (lab, i) {
      const x = startX + i * (barW + gap) + barW / 2;
      ctx.fillStyle = textMuted;
      ctx.font = '9px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      if (n <= 14) ctx.fillText(lab, x, baseY + 4);
    });
  } else {
    for (let i = 0; i < labels.length; i++) {
      const x = startX + i * (barW + gap);
      const val = Number(dados[i]) || 0;
      const barH = val > 0 ? Math.max(3, (val / maxVal) * plotH) : 0;
      const y = baseY - barH;
      const radius = Math.min(4, barW / 2);

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
      } else {
        // stub mínimo (1px) só para marcar o eixo quando há dados noutros dias
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
    }
  }

  const labelEl = document.getElementById('chart-period-label');
  if (labelEl) {
    labelEl.textContent = modoHora
      ? ((intervalo.label || 'Dia') + ' · por hora')
      : (intervalo.label || 'Período');
  }

  const tooltip = document.getElementById('chart-tooltip');
  if (!tooltip) return;

  const handleHover = (clientX, clientY) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const mouseX = (clientX - rect.left) * scaleX;
    let idx = -1;
    for (let i = 0; i < labels.length; i++) {
      const x = startX + i * (barW + 4);
      if (mouseX >= x && mouseX <= x + barW) { idx = i; break; }
    }
    if (idx !== -1 && dados[idx] > 0) {
      tooltip.style.left = (clientX + 10) + 'px';
      tooltip.style.top = (clientY - 30) + 'px';
      tooltip.textContent = labels[idx] + ': ' + fmtKz(dados[idx]);
      tooltip.style.opacity = '1';
    } else {
      tooltip.style.opacity = '0';
    }
  };

  canvas.onmousemove = e => handleHover(e.clientX, e.clientY);
  canvas.onmouseleave = () => { tooltip.style.opacity = '0'; };

  canvas.ontouchstart = e => {
    if (e.touches.length > 0) {
      _chartSwipeStartX = e.touches[0].clientX;
      _chartSwipeStartY = e.touches[0].clientY;
      handleHover(e.touches[0].clientX, e.touches[0].clientY);
    }
  };
  canvas.ontouchmove = e => {
    if (e.touches.length > 0) handleHover(e.touches[0].clientX, e.touches[0].clientY);
  };
  canvas.ontouchend = e => {
    tooltip.style.opacity = '0';
    if (_chartSwipeStartX !== null && e.changedTouches.length > 0) {
      const dx = e.changedTouches[0].clientX - _chartSwipeStartX;
      const dy = e.changedTouches[0].clientY - _chartSwipeStartY;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) state.dashOffset = (state.dashOffset || 0) + 1;
        else if ((state.dashOffset || 0) > 0) state.dashOffset -= 1;
        localStorage.setItem('bp_dash_offset', String(state.dashOffset || 0));
        if (typeof renderDashboard === 'function') renderDashboard();
        renderizarGrafico();
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
      if (typeof renderDashboard === 'function') renderDashboard();
      renderizarGrafico();
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
