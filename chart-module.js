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
  const height = 160;
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

  let labels = [];
  let dados = [];
  let maxVal = 1;

  if (modoHora) {
    const ds = intervalo.fim || (typeof hoje === 'function' ? hoje() : '');
    for (let h = 0; h < 12; h++) {
      const hr = h * 2;
      labels.push(String(hr).padStart(2, '0') + 'h');
      const total = movs.filter(m => {
        if (m.tipo !== 'venda' || m.data !== ds || !m.hora) return false;
        const mh = parseInt(String(m.hora).split(':')[0], 10);
        return mh >= hr && mh < hr + 2;
      }).reduce((s, v) => s + (Number(v.valor) || 0), 0);
      if (total > maxVal) maxVal = total;
      dados.push(total);
    }
  } else {
    const dInicio = new Date(intervalo.inicio + 'T00:00:00');
    const dFim = new Date(intervalo.fim + 'T00:00:00');
    const msDia = 86400000;
    const diasNoPeriodo = Math.max(1, Math.round((dFim - dInicio) / msDia) + 1);
    const passo = diasNoPeriodo > 31 ? Math.ceil(diasNoPeriodo / 31) : 1;
    for (let i = 0; i < diasNoPeriodo; i += passo) {
      const d = new Date(dInicio.getTime() + i * msDia);
      const ds = (typeof formatarDataISO === 'function')
        ? formatarDataISO(d)
        : d.toISOString().split('T')[0];
      const label = diasNoPeriodo <= 7
        ? d.toLocaleDateString('pt-AO', { weekday: 'short' }).replace('.', '')
        : d.toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' }).replace('.', '');
      labels.push(label);
      const total = movs.filter(m => m.tipo === 'venda' && m.data === ds)
        .reduce((s, v) => s + (Number(v.valor) || 0), 0);
      if (total > maxVal) maxVal = total;
      dados.push(total);
    }
  }

  maxVal = Math.max(maxVal, 1);

  const barW = (width - 40) / Math.max(labels.length, 1) - 4;
  const startX = 20;
  const baseY = height - 20;
  const gold = (typeof getComputedStyle === 'function' && getComputedStyle(document.documentElement).getPropertyValue('--gold').trim()) || '#D4AF37';
  const goldDark = (typeof getComputedStyle === 'function' && getComputedStyle(document.documentElement).getPropertyValue('--gold-600').trim()) || '#A7872B';
  const mutedBar = (typeof getComputedStyle === 'function' && getComputedStyle(document.documentElement).getPropertyValue('--border-soft').trim()) || '#DCD5C9';

  for (let i = 0; i < labels.length; i++) {
    const x = startX + i * (barW + 4);
    const barH = Math.max(4, (dados[i] / maxVal) * (height - 40));
    const y = baseY - barH;
    const radius = 4;

    const grad = ctx.createLinearGradient(0, y, 0, baseY);
    if (dados[i] > 0) {
      grad.addColorStop(0, gold);
      grad.addColorStop(1, goldDark);
    } else {
      grad.addColorStop(0, mutedBar);
      grad.addColorStop(1, mutedBar);
    }
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

    const isLast = (i === labels.length - 1 && dashOff === 0);
    ctx.fillStyle = isLast ? '#1C1A18' : '#8c8980';
    ctx.font = isLast ? 'bold 9px Inter' : '9px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(labels[i], x + barW / 2, baseY + 4);

    if (mostrarValores && dados[i] > 0) {
      ctx.fillStyle = '#1C1A18';
      ctx.font = 'bold 9px Inter';
      ctx.textBaseline = 'bottom';
      ctx.fillText(fmtKz(dados[i]).replace(' Kz', ''), x + barW / 2, y - 2);
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
function initChartControls() {
  if (_chartControlsBound) return;
  _chartControlsBound = true;
  document.querySelectorAll('.chart-filter').forEach(btn => {
    btn.addEventListener('click', function() {
      const periodo = this.dataset.periodo;
      if (periodo === 'hora') {
        state.chartPeriodo = 'hora';
      } else {
        state.chartPeriodo = 'semana';
        const mapDash = { dia: 'dia', semana: 'semana', mes: 'mes' };
        if (mapDash[periodo]) {
          state.dashPeriodo = mapDash[periodo];
          state.dashOffset = 0;
          localStorage.setItem('bp_dash_periodo', state.dashPeriodo);
          localStorage.setItem('bp_dash_offset', '0');
        }
      }
      localStorage.setItem('bp_chart_periodo', state.chartPeriodo);
      document.querySelectorAll('.chart-filter').forEach(b => {
        b.classList.remove('btn-primary');
        b.classList.add('btn-secondary');
      });
      this.classList.remove('btn-secondary');
      this.classList.add('btn-primary');
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
