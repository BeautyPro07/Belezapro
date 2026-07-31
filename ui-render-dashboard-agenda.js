// ====================================================================
//  ui-render-dashboard-agenda.js — extraído do app.js (Fase C da modularização)
//  Conteúdo: Renderização do Resumo (dashboard) e Agenda
//  Linhas originais: 383-610
//  Carregar depois de core-*.js, db-indexeddb.js, sync-*.js, auth-supabase.js
//  CORREÇÕES APLICADAS (Filtro Agenda, Expiração, Badge, Dia Exato):
//    1. Filtro da Agenda: Hoje, Semana, Mês, Todos, Dia Exato com persistência.
//    2. Expiração automática: agendamentos com data/hora passada ficam "Não realizado".
//    3. Badge da Agenda: conta todos os agendamentos disponíveis (status "agendado" com data/hora >= agora).
//    4. Eventos do filtro unificados com classes CSS e suporte a Dia Exato.
//    5. Sincronização unificada com debounce.
//    6. Navegação por setas adaptada ao filtro atual (hoje e dia exato).
// ====================================================================

// ------------------------------------------------------------
//  AUXILIAR: busca nome do profissional a partir do ID
// ------------------------------------------------------------
function getProfissionalNome(profissionalId) {
  if (!profissionalId) return 'Não atribuído';
  const prof = state.profissionais.find(p => p.id === profissionalId);
  return prof ? prof.nome : 'Não atribuído';
}

// ====================================================================
//  RENDERIZAÇÃO
// ====================================================================
let _updateUITimer = null;
let _storeSubscribed = false;

function updateUI() {
  // Debounce: várias mutações no mesmo tick → um único paint
  if (_updateUITimer) clearTimeout(_updateUITimer);
  _updateUITimer = setTimeout(_updateUINow, 16);
}

function _updateUINow() {
  _updateUITimer = null;
  renderDashboard();
  if (activeTab === 'agenda') renderAgendaFull();
  if (activeTab === 'clientes') renderClientes();
  if (activeTab === 'caixa') renderCaixa();
  if (activeTab === 'equipa') { renderProfissionais(); renderServicos(); }
  renderBadges();
  renderPlanoInfo();
  if (activeTab === 'dashboard') renderizarGrafico();
  populateVendaSelects();
  populateAgendaSelects();
  setupPrecoAutomatico('agenda-servico', 'agenda-preco');
  setupPrecoAutomatico('ci-servico-sel', 'ci-valor');
  initChartControls();
  aplicarAcessibilidade();

  const storeDisplay = document.getElementById('store-name-display');
  if (storeDisplay && state.config.storeName) {
    storeDisplay.textContent = state.config.storeName;
    storeDisplay.title = 'Duplo clique para gerir profissionais';
  }

  atualizarVisibilidadeAtalhos();
}

/** Liga o Store aos renders — mutações via BeautyStore disparam UI automaticamente */
function initStoreBindings() {
  if (_storeSubscribed) return;
  if (!window.BeautyStore || typeof window.BeautyStore.subscribe !== 'function') return;
  window.BeautyStore.subscribe(function onStoreChange() {
    updateUI();
  });
  _storeSubscribed = true;
}


function atualizarVisibilidadeAtalhos() {
  // Hierarquia: no Dashboard só a barra de venda (CTA primário);
  // FAB de agendar só na Agenda (evita 2 primários na mesma vista).
  const fabEl = document.getElementById('fab-agendar');
  if (fabEl) {
    fabEl.style.display = (activeTab === 'agenda') ? 'flex' : 'none';
  }
  const bannerEl = document.getElementById('nova-venda-hero-btn');
  if (bannerEl) {
    bannerEl.style.display = (activeTab === 'dashboard' || activeTab === 'caixa') ? 'flex' : 'none';
  }
  const vendaCta = document.getElementById('venda-cta-bar') || document.querySelector('.venda-cta-bar');
  if (vendaCta) {
    vendaCta.style.display = (activeTab === 'dashboard' || activeTab === 'caixa') ? '' : 'none';
  }
}

function renderPlanoInfo() {
  const plano = getPlanoAtual();
  const info = PLANOS[plano];
  const badge = document.getElementById('plano-badge');
  const label = plano === 'trial' ? 'Plano Gratuito' : info.label.toUpperCase();
  badge.textContent = label;
  badge.className = 'plano-badge ' + info.badgeClass;
  const countdown = document.getElementById('trial-countdown');
  if (plano === 'trial' && isTrialAtivo()) {
    const dias = getDiasTrialRestantes();
    countdown.style.display = 'inline-block';
    countdown.textContent = `Restam ${dias} dias`;
    countdown.style.color = '';
  } else if (plano === 'trial' && !isTrialAtivo()) {
    countdown.style.display = 'inline-block';
    countdown.textContent = 'Trial expirado';
    countdown.style.color = 'var(--red)';
  } else {
    countdown.style.display = 'none';
    countdown.style.color = '';
  }
  const iaInfo = document.getElementById('ia-plano-info');
  if (iaInfo) {
    const limite = info.iaDia;
    iaInfo.textContent = limite > 0 ? `${info.label}: ${limite} perguntas/dia` : 'IA não disponível neste plano';
  }
  if (typeof actualizarContadorIA === 'function') {
    actualizarContadorIA();
  } else {
    const cont = document.getElementById('ia-contador');
    if (cont) {
      if (info.iaDia === 0) cont.textContent = '0';
      else {
        const chave = 'ia_perguntas_' + ((state.config && state.config.salaoId) || 'local') + '_' + hoje();
        cont.textContent = String(parseInt(localStorage.getItem(chave) || '0', 10) || 0);
      }
    }
  }
}

// ====================================================================
//  FILTRO DASHBOARD — funções auxiliares (já existentes)
// ====================================================================
function formatarDataISO(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function formatarDataCurta(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' });
}

function calcularIntervaloPeriodo(tipo, offset) {
  const base = new Date(hoje() + 'T00:00:00');
  let inicio, fim, label;
  if (tipo === 'custom') {
    inicio = state.dashCustomInicio || hoje();
    fim = state.dashCustomFim || hoje();
    label = 'Personalizado';
  } else if (tipo === 'semana') {
    const diaSemana = (base.getDay() + 6) % 7;
    const segunda = new Date(base);
    segunda.setDate(segunda.getDate() - diaSemana - offset * 7);
    const domingo = new Date(segunda);
    domingo.setDate(domingo.getDate() + 6);
    inicio = formatarDataISO(segunda);
    fim = formatarDataISO(domingo);
    label = offset === 0 ? 'Esta semana' : 'Semana de ' + formatarDataCurta(inicio);
  } else if (tipo === '7dias') {
    const fimD = new Date(base);
    fimD.setDate(fimD.getDate() - offset * 7);
    const iniD = new Date(fimD);
    iniD.setDate(iniD.getDate() - 6);
    inicio = formatarDataISO(iniD);
    fim = formatarDataISO(fimD);
    label = 'Últimos 7 dias';
  } else if (tipo === 'mes') {
    const ano = base.getFullYear();
    const mes = base.getMonth() - offset;
    const primeiro = new Date(ano, mes, 1);
    const ultimo = new Date(ano, mes + 1, 0);
    inicio = formatarDataISO(primeiro);
    fim = formatarDataISO(ultimo);
    label = offset === 0 ? 'Este mês' : 'Mês anterior';
  } else if (tipo === '30dias') {
    const fimD = new Date(base);
    fimD.setDate(fimD.getDate() - offset * 30);
    const iniD = new Date(fimD);
    iniD.setDate(iniD.getDate() - 29);
    inicio = formatarDataISO(iniD);
    fim = formatarDataISO(fimD);
    label = 'Últimos 30 dias';
  } else if (tipo === 'ano') {
    const ano = base.getFullYear() - offset;
    inicio = ano + '-01-01';
    fim = ano + '-12-31';
    label = offset === 0 ? 'Este ano' : String(ano);
  } else {
    // tipo === 'dia'
    const d = new Date(base);
    d.setDate(d.getDate() - offset);
    const iso = formatarDataISO(d);
    inicio = fim = iso;
    if (offset === 0) label = 'Hoje';
    else if (offset === 1) label = 'Ontem';
    else label = formatarDataCurta(iso);
  }
  return { inicio, fim, label };
}

function getIntervaloDashAtual() {
  return calcularIntervaloPeriodo(state.dashPeriodo, state.dashOffset);
}

// ====================================================================
//  RENDER DASHBOARD — modelo de verdade unificado (Fase A1+A2)
//  Um período (dashPeriodo) alimenta KPIs, sparkline e gráfico.
// ====================================================================
function _statusAg(a) {
  return String(a.status || a.estado || 'agendado').toLowerCase();
}

function _somaVendas(lista) {
  return (lista || []).reduce((s, v) => s + (Number(v.valor) || 0), 0);
}

function renderDashboard() {
  const intervalo = getIntervaloDashAtual();
  const movs = state.movimentos || [];
  const ags = state.agendamentos || [];

  const vendasPeriodo = movs.filter(m =>
    m.tipo === 'venda' && m.data >= intervalo.inicio && m.data <= intervalo.fim
  );
  const totalRev = _somaVendas(vendasPeriodo);
  const totalVendas = vendasPeriodo.length;
  const ticket = totalVendas > 0 ? totalRev / totalVendas : 0;

  // Agenda no período: estados explícitos (não misturar cancelados no "sucesso")
  const agPeriodo = ags.filter(a => a.data >= intervalo.inicio && a.data <= intervalo.fim);
  const realizados = agPeriodo.filter(a => _statusAg(a) === 'realizado').length;
  const cancelados = agPeriodo.filter(a => _statusAg(a) === 'cancelado').length;
  const naoRealizados = agPeriodo.filter(a => {
    const st = _statusAg(a);
    return st === 'nao_realizado' || st === 'nao-realizado' || st === 'expirado';
  }).length;
  const pendentesPeriodo = agPeriodo.filter(a => _statusAg(a) === 'agendado').length;
  const agAtivos = agPeriodo.length - cancelados; // marcados válidos (exclui cancelados)

  const todayEl = document.getElementById('today-date');
  if (todayEl) todayEl.textContent = intervalo.label;

  animateKpi('kpi-revenue', fmtKz(totalRev));
  const revenueCount = document.getElementById('kpi-revenue-count');
  if (revenueCount) {
    revenueCount.textContent = totalVendas === 1 ? '1 venda' : totalVendas + ' vendas';
  }

  // Número principal = marcações válidas no período; sub = breakdown honesto
  animateKpi('kpi-agendamentos', String(Math.max(0, agAtivos)));
  const agStatus = document.getElementById('kpi-agendamentos-status');
  if (agStatus) {
    const parts = [realizados + ' realizados'];
    if (pendentesPeriodo) parts.push(pendentesPeriodo + ' pend.');
    if (naoRealizados) parts.push(naoRealizados + ' falhados');
    if (cancelados) parts.push(cancelados + ' cancel.');
    agStatus.textContent = parts.join(' · ');
  }

  animateKpi('kpi-ticket', fmtKz(ticket));
  const ticketSub = document.getElementById('kpi-ticket-sub');
  if (ticketSub) ticketSub.textContent = 'por venda';

  // --- Sparkline: receita diária no intervalo (mesma unidade do KPI primário) ---
  const canvas = document.getElementById('ticket-sparkline');
  if (canvas) {
    canvas.style.display = 'block';
    const parent = canvas.parentElement;
    const rect = parent ? parent.getBoundingClientRect() : { width: 84 };
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = Math.max(rect.width || 84, 60);
    const cssHeight = 28;
    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);
    canvas.style.width = cssWidth + 'px';
    canvas.style.height = cssHeight + 'px';
  }

  const serieReceita = [];
  const dInicio = new Date(intervalo.inicio + 'T00:00:00');
  const dFim = new Date(intervalo.fim + 'T00:00:00');
  const msDia = 86400000;
  const diasNoPeriodo = Math.max(1, Math.round((dFim - dInicio) / msDia) + 1);
  const passo = diasNoPeriodo > 31 ? Math.ceil(diasNoPeriodo / 31) : 1;
  for (let i = 0; i < diasNoPeriodo; i += passo) {
    const d = new Date(dInicio.getTime() + i * msDia);
    const ds = formatarDataISO(d);
    const totalDia = _somaVendas(movs.filter(m => m.tipo === 'venda' && m.data === ds));
    serieReceita.push(totalDia);
  }
  if (serieReceita.length < 2) serieReceita.push(serieReceita[0] || 0);

  const goldColor = (typeof getComputedStyle === 'function')
    ? (getComputedStyle(document.documentElement).getPropertyValue('--gold').trim() || '#D4AF37')
    : '#D4AF37';
  if (typeof desenharSparkline === 'function') {
    setTimeout(() => {
      try { desenharSparkline('ticket-sparkline', serieReceita, goldColor); }
      catch (e) { console.warn('[Sparkline]', e); }
    }, 40);
  }

  // % variação: receita do período vs período anterior de igual duração (não ticket)
  const duracaoMs = (dFim - dInicio) + msDia;
  const prevFim = new Date(dInicio.getTime() - msDia);
  const prevInicio = new Date(prevFim.getTime() - duracaoMs + msDia);
  const prevInicioStr = formatarDataISO(prevInicio);
  const prevFimStr = formatarDataISO(prevFim);
  const totalPrev = _somaVendas(movs.filter(m =>
    m.tipo === 'venda' && m.data >= prevInicioStr && m.data <= prevFimStr
  ));

  const percentEl = document.getElementById('ticket-trend-percent');
  if (percentEl) {
    if (totalPrev > 0 && isFinite(totalRev)) {
      const variacao = ((totalRev - totalPrev) / totalPrev) * 100;
      const subiu = variacao >= 0;
      percentEl.className = subiu ? 'trend-up' : 'trend-down';
      percentEl.innerHTML = `<span class="trend-arrow">${subiu ? '↑' : '↓'}</span> ${Math.abs(variacao).toFixed(1)}%`;
      percentEl.style.display = 'inline-flex';
      percentEl.setAttribute('title', 'Receita vs período anterior equivalente');
    } else if (totalRev > 0 && totalPrev === 0) {
      percentEl.className = 'trend-up';
      percentEl.innerHTML = `<span class="trend-arrow">↑</span> novo`;
      percentEl.style.display = 'inline-flex';
      percentEl.setAttribute('title', 'Sem vendas no período anterior');
    } else {
      percentEl.className = 'trend-up';
      percentEl.textContent = '—';
      percentEl.style.display = 'inline-flex';
      percentEl.removeAttribute('title');
    }
  }
  const trendPeriodEl = document.getElementById('ticket-trend-period');
  if (trendPeriodEl) trendPeriodEl.textContent = 'vs período anterior';

  // --- Meta mensal (BPFinance) + saldo de caixa (admin) ---
  const metaWrap = document.getElementById('dash-meta-wrap');
  if (metaWrap) {
    let prog = null;
    try {
      if (window.BPFinance && typeof BPFinance.getProgressoMetaSalao === 'function') {
        prog = BPFinance.getProgressoMetaSalao();
      }
    } catch (_) {}
    if (prog && prog.meta > 0) {
      metaWrap.hidden = false;
      const fill = document.getElementById('dash-meta-fill');
      const label = document.getElementById('dash-meta-label');
      if (fill) fill.style.width = Math.min(100, prog.pct) + '%';
      if (label) {
        label.textContent = fmtKz(prog.volume) + ' / ' + fmtKz(prog.meta) + ' · ' + prog.pct + '%' +
          (prog.atingida ? ' · Meta atingida' : '');
      }
    } else {
      metaWrap.hidden = true;
    }
  }
  const caixaEl = document.getElementById('dash-caixa-saldo');
  if (caixaEl) {
    const hojeStr = hoje();
    const entradas = _somaVendas(movs.filter(m => m.tipo === 'venda' && m.data === hojeStr));
    const saidas = movs.filter(m => m.tipo === 'despesa' && m.data === hojeStr)
      .reduce((s, m) => s + (Number(m.valor) || 0), 0);
    const saldo = (Number(state.config && state.config.fundo) || 0) + entradas - saidas;
    caixaEl.textContent = fmtKz(saldo);
  }

  // Próximos atendimentos — só HOJE, status agendado, hora >= agora
  if (typeof atualizarAgendamentosExpirados === 'function') atualizarAgendamentosExpirados();
  const hojeStr2 = hoje();
  const agora = new Date();
  const agHoje = ags.filter(a => a.data === hojeStr2);
  const proximos = agHoje
    .filter(a => {
      if (_statusAg(a) !== 'agendado') return false;
      const hora = String(a.hora || '00:00').slice(0, 5);
      const agDate = new Date(a.data + 'T' + hora + ':00');
      return !isNaN(agDate.getTime()) && agDate >= agora;
    })
    .sort((a, b) => String(a.hora || '').localeCompare(String(b.hora || '')))
    .slice(0, 6);

  const cont = document.getElementById('agenda-today-list');
  if (cont) {
    if (proximos.length === 0) {
      const temRealizados = agHoje.some(a => _statusAg(a) === 'realizado');
      const temExpirados = agHoje.some(a => {
        const st = _statusAg(a);
        return st === 'nao_realizado' || st === 'nao-realizado';
      });
      let mensagemVazio = 'Nenhum atendimento pendente hoje';
      if (temRealizados && !temExpirados) mensagemVazio = 'Todos os atendimentos de hoje foram realizados';
      else if (temExpirados && !temRealizados) mensagemVazio = 'Sem atendimentos pendentes';
      cont.innerHTML = `<div class="empty-state"><p>${mensagemVazio}</p></div>`;
    } else {
      cont.innerHTML = proximos.map(a => {
        const nomeProf = getProfissionalNome(a.profissional_id);
        const inicial = (a.cliente || '?').charAt(0).toUpperCase();
        let avHtml = `<div class="avatar">${escHtml(inicial)}</div>`;
        try {
          const cli = (state.clientes || []).find(c => c.nome === a.cliente || c.id === a.cliente_id);
          if (cli && cli.foto) {
            avHtml = `<div class="avatar bp-avatar-img"><img src="${cli.foto}" alt="" loading="lazy" decoding="async"></div>`;
          } else if (window.BPAvatars && typeof BPAvatars.avatarDataUrl === 'function') {
            avHtml = `<div class="avatar bp-avatar-img"><img src="${BPAvatars.avatarDataUrl(a.cliente || '')}" alt="" loading="lazy" decoding="async"></div>`;
          }
        } catch (_) {}
        return `
          <div class="list-item">
            ${avHtml}
            <div class="info">
              <div class="title dash-next-title">${escHtml(a.servico || 'Serviço')}</div>
              <div class="sub">${escHtml(a.cliente || 'Cliente')} · ${escHtml(String(a.hora || '').slice(0, 5))} · ${escHtml(nomeProf)}</div>
            </div>
            <div class="action dash-next-action">
              <span class="pill pill-warning">Pendente</span>
              <span class="dash-next-price">${fmtKz(a.preco)}</span>
            </div>
          </div>`;
      }).join('');
    }
  }
  const countEl = document.getElementById('agenda-count');
  if (countEl) {
    const n = proximos.length;
    countEl.textContent = n === 0 ? '0 pendentes' : (n === 1 ? '1 pendente' : n + ' pendentes');
  }

  const h = new Date().getHours();
  const greetEl = document.getElementById('greeting');
  if (greetEl) {
    greetEl.textContent = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  }
}

// ====================================================================
//  EVENTOS — Filtro de Período do Dashboard (ícone + popover)
//  CORREÇÃO (causa raiz do "filtro não funciona" / "sparkline estática"):
//  o botão #dash-filter-icon e as opções .dash-periodo-opcao já existiam
//  no HTML, e o motor (calcularIntervaloPeriodo) e o CSS do popover
//  também já existiam — mas não havia NENHUM addEventListener a ligá-los.
//  state.dashPeriodo/dashOffset nunca podiam mudar, por isso o KPI, o
//  sparkline (que já dependia corretamente de intervalo.fim) e o rótulo
//  ficavam sempre presos no valor por defeito. Não foi preciso mudar o
//  motor de cálculo nem o CSS — só faltava este bloco.
// ====================================================================
document.getElementById('dash-filter-icon')?.addEventListener('click', function(e) {
  e.stopPropagation();
  document.querySelectorAll('.dash-periodo-opcao').forEach(btn => {
    const ativa = btn.dataset.periodo === state.dashPeriodo &&
      (btn.dataset.periodo !== 'dia' || Number(btn.dataset.offset || 0) === state.dashOffset);
    btn.classList.toggle('active', ativa);
  });
  const customWrap = document.getElementById('dash-periodo-custom');
  if (state.dashPeriodo === 'custom') {
    if (customWrap) customWrap.style.display = 'flex';
    const iniInput = document.getElementById('dash-custom-inicio');
    const fimInput = document.getElementById('dash-custom-fim');
    if (iniInput) iniInput.value = state.dashCustomInicio || hoje();
    if (fimInput) fimInput.value = state.dashCustomFim || hoje();
  } else if (customWrap) {
    customWrap.style.display = 'none';
  }
  const overlay = document.getElementById('modal-periodo-dashboard');
  if (overlay.classList.contains('open')) closeModal('modal-periodo-dashboard');
  else openModal('modal-periodo-dashboard');
});

document.querySelectorAll('.dash-periodo-opcao').forEach(btn => {
  btn.addEventListener('click', function(e) {
    e.stopPropagation();
    const tipo = this.dataset.periodo;
    if (tipo === 'custom') {
      document.querySelectorAll('.dash-periodo-opcao').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      const customWrap = document.getElementById('dash-periodo-custom');
      if (customWrap) customWrap.style.display = 'flex';
      const iniInput = document.getElementById('dash-custom-inicio');
      const fimInput = document.getElementById('dash-custom-fim');
      if (iniInput) iniInput.value = state.dashCustomInicio || hoje();
      if (fimInput) fimInput.value = state.dashCustomFim || hoje();
      return;
    }
    state.dashPeriodo = tipo;
    state.dashOffset = Number(this.dataset.offset) || 0;
    localStorage.setItem('bp_dash_periodo', state.dashPeriodo);
    localStorage.setItem('bp_dash_offset', String(state.dashOffset));
    closeModal('modal-periodo-dashboard');
    // Sai do modo hora ao mudar o período global — gráfico alinhado aos KPIs
    if (state.chartPeriodo === 'hora') state.chartPeriodo = 'semana';
    renderDashboard();
    if (typeof renderizarGrafico === 'function') renderizarGrafico();
  });
});

document.getElementById('dash-custom-aplicar')?.addEventListener('click', function(e) {
  e.stopPropagation();
  const ini = document.getElementById('dash-custom-inicio').value;
  const fim = document.getElementById('dash-custom-fim').value;
  if (!ini || !fim) { toast('Selecione as duas datas', 'error'); return; }
  if (ini > fim) { toast('A data inicial deve ser anterior à data final', 'error'); return; }
  state.dashPeriodo = 'custom';
  state.dashCustomInicio = ini;
  state.dashCustomFim = fim;
  localStorage.setItem('bp_dash_periodo', 'custom');
  localStorage.setItem('bp_dash_custom_inicio', ini);
  localStorage.setItem('bp_dash_custom_fim', fim);
  closeModal('modal-periodo-dashboard');
  state.chartPeriodo = 'semana';
  renderDashboard();
  if (typeof renderizarGrafico === 'function') renderizarGrafico();
});

// Fechar o popover ao tocar fora dele (mesmo padrão já usado no menu hambúrguer)
document.addEventListener('click', function(e) {
  const overlay = document.getElementById('modal-periodo-dashboard');
  const icon = document.getElementById('dash-filter-icon');
  if (overlay && overlay.classList.contains('open') && !overlay.contains(e.target) && e.target !== icon && !icon?.contains(e.target)) {
    closeModal('modal-periodo-dashboard');
  }
});

// ====================================================================
//  AGENDA — com filtro, expiração, badge e dia exato
// ====================================================================

// Estado do filtro da agenda
const agendaFilterKey = 'bp_agenda_filter';
let agendaFilter = localStorage.getItem(agendaFilterKey) || 'hoje';

// Função para verificar se um agendamento expirou
function agendamentoExpirado(ag) {
  if (!ag || !ag.data) return false;
  const hora = String(ag.hora || '00:00').slice(0, 5);
  const agDate = new Date(ag.data + 'T' + hora + ':00');
  if (isNaN(agDate.getTime())) return false;
  return agDate < new Date();
}

// Atualiza expirados sem reentrar em render (evita loop render → expirar → render)
let _expirandoAgenda = false;
function atualizarAgendamentosExpirados() {
  if (_expirandoAgenda || !state.agendamentos) return;
  _expirandoAgenda = true;
  let atualizado = false;
  try {
    for (const ag of state.agendamentos) {
      if (_statusAg(ag) === 'agendado' && agendamentoExpirado(ag)) {
        ag.status = 'nao_realizado';
        ag.updated_at = new Date().toISOString();
        if (typeof dbPut === 'function') dbPut('agendamentos', ag);
        atualizado = true;
      }
    }
  } finally {
    _expirandoAgenda = false;
  }
  // NÃO chama renderAgendaFull aqui — o caller já renderiza
  if (atualizado && typeof renderBadges === 'function') {
    // badge only; avoid recursive full render
    try {
      const agora = new Date();
      const disponiveis = state.agendamentos.filter(a => {
        if (_statusAg(a) !== 'agendado') return false;
        const hora = String(a.hora || '00:00').slice(0, 5);
        const agDate = new Date(a.data + 'T' + hora + ':00');
        return !isNaN(agDate.getTime()) && agDate >= agora;
      });
      const badge = document.getElementById('agenda-badge');
      if (badge) {
        const count = disponiveis.length;
        if (count > 0) {
          badge.textContent = count > 9 ? '9+' : String(count);
          badge.classList.add('show');
        } else {
          badge.classList.remove('show');
        }
      }
    } catch (_) {}
  }
}

// Função para obter agendamentos filtrados (com suporte a dia exato)
function getAgendamentosFiltrados() {
  atualizarAgendamentosExpirados();

  const hojeStr = hoje();
  const list = state.agendamentos || [];

  if (agendaFilter === 'dia') {
    const dataExata = localStorage.getItem('bp_agenda_data_exata') || hojeStr;
    return list.filter(a => a.data === dataExata && _statusAg(a) !== 'cancelado');
  }

  if (agendaFilter === 'realizados') {
    return list.filter(a => _statusAg(a) === 'realizado');
  }
  if (agendaFilter === 'cancelados') {
    return list.filter(a => _statusAg(a) === 'cancelado');
  }
  if (agendaFilter === 'nao_realizado') {
    return list.filter(a => {
      const st = _statusAg(a);
      return st === 'nao_realizado' || st === 'nao-realizado' || st === 'expirado';
    });
  }

  switch (agendaFilter) {
    case 'hoje': {
      const dataHoje = state.agendaDataAtual || hojeStr;
      return list.filter(a => a.data === dataHoje && _statusAg(a) !== 'cancelado');
    }
    case 'semana': {
      // Segunda → domingo (igual ao dashboard / mercado AO)
      const d = new Date(hojeStr + 'T00:00:00');
      const diaSemana = (d.getDay() + 6) % 7;
      const inicioSemana = new Date(d);
      inicioSemana.setDate(d.getDate() - diaSemana);
      const fimSemana = new Date(inicioSemana);
      fimSemana.setDate(inicioSemana.getDate() + 6);
      const inicio = formatarDataISO(inicioSemana);
      const fim = formatarDataISO(fimSemana);
      return list.filter(a => a.data >= inicio && a.data <= fim && _statusAg(a) !== 'cancelado');
    }
    case 'mes': {
      const d = new Date(hojeStr + 'T00:00:00');
      const mes = d.getMonth();
      const ano = d.getFullYear();
      const ultimoDia = new Date(ano, mes + 1, 0).getDate();
      const inicio = `${ano}-${String(mes+1).padStart(2,'0')}-01`;
      const fim = `${ano}-${String(mes+1).padStart(2,'0')}-${String(ultimoDia).padStart(2,'0')}`;
      return state.agendamentos.filter(a => a.data >= inicio && a.data <= fim && a.status !== 'cancelado');
    }
    case 'todos':
    default:
      return state.agendamentos.filter(a => a.status !== 'cancelado');
  }
}

function renderAgendaFull() {
  const svgCalendario = window.svgCalendario || `<svg width="80" height="80" viewBox="0 0 80 80" fill="none" stroke="var(--neutral-300)" stroke-width="1.5"><rect x="16" y="20" width="48" height="48" rx="4"/><line x1="16" y1="32" x2="64" y2="32"/><line x1="28" y1="16" x2="28" y2="24"/><line x1="52" y1="16" x2="52" y2="24"/><circle cx="40" cy="44" r="6"/></svg>`;

  const cont = document.getElementById('agenda-full-list');
  if (!state.agendamentos || !Array.isArray(state.agendamentos)) {
    if (cont) cont.innerHTML = '<div class="empty-state">A carregar agendamentos...</div>';
    return;
  }

  // Atualizar expirados antes de renderizar
  atualizarAgendamentosExpirados();

  // Obter agendamentos filtrados
  const agsFiltrados = getAgendamentosFiltrados();
  const ags = agsFiltrados.sort((a, b) => a.data.localeCompare(b.data) || a.hora.localeCompare(b.hora));

// Atualizar label da data
const label = document.getElementById('agenda-date-label');
if (label) {
  const hojeStr = hoje();
  if (agendaFilter === 'dia') {
    const dataExata = localStorage.getItem('bp_agenda_data_exata') || hojeStr;
    label.textContent = new Date(dataExata + 'T00:00:00').toLocaleDateString('pt-AO', { day: '2-digit', month: 'long', year: 'numeric' });
  } else if (agendaFilter === 'hoje') {
    const dataAtual = state.agendaDataAtual || hojeStr;
    label.textContent = dataAtual === hojeStr ? 'Hoje' : new Date(dataAtual + 'T00:00:00').toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' });
  } else if (agendaFilter === 'semana') {
    label.textContent = 'Esta semana';
  } else if (agendaFilter === 'mes') {
    label.textContent = 'Este mês';
  } else if (agendaFilter === 'realizados') {
    label.textContent = 'Realizados';
  } else if (agendaFilter === 'cancelados') {
    label.textContent = 'Cancelados';
  } else if (agendaFilter === 'nao_realizado') {
    label.textContent = 'Não realizados';
  } else {
    label.textContent = 'Todos';
  }
}
  if (!cont) return;

  if (ags.length === 0) {
    cont.innerHTML = `<div class="empty-state">${svgCalendario}<p>Sem agendamentos neste período</p></div>`;
    return;
  }

  // Agrupar por data se o filtro não for "hoje" nem "dia"
  const agrupar = (agendaFilter !== 'hoje' && agendaFilter !== 'dia');
  let html = '';
  if (agrupar) {
    const grupos = {};
    ags.forEach(a => {
      if (!grupos[a.data]) grupos[a.data] = [];
      grupos[a.data].push(a);
    });
    const datas = Object.keys(grupos).sort();
    datas.forEach(data => {
      const dataLabel = data === hoje() ? 'Hoje' : new Date(data + 'T00:00:00').toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' });
      html += `<div class="bp-ag-date-label">${dataLabel}</div>`;
      html += grupos[data].map(a => renderAgendaItem(a)).join('');
    });
  } else {
    html = ags.map(a => renderAgendaItem(a)).join('');
  }
  cont.innerHTML = html;

  // Listeners para "Finalizar" (apenas os que não estão expirados)
  cont.querySelectorAll('[data-action="finalizar"]').forEach(btn => {
    btn.addEventListener('click', function() {
      const id = this.dataset.id;
      if (id) abrirFinalizarAtendimento(id);
    });
  });
}

function renderAgendaItem(a) {
  // Leitura apenas — expiração é responsabilidade de atualizarAgendamentosExpirados
  const st = _statusAg(a);
  const isRealizado = st === 'realizado';
  const isCancelado = st === 'cancelado';
  const isExpirado = st === 'nao_realizado' || st === 'nao-realizado' || st === 'expirado';
  const isAgendado = st === 'agendado';
  const podeFinalizar = isAgendado && !agendamentoExpirado(a);
  const podeCancelar = isAgendado;
  const nomeProf = getProfissionalNome(a.profissional_id);

  let statusLabel = '';
  let statusClass = '';

  if (isRealizado) {
    statusLabel = 'Realizado';
    statusClass = 'pill-success';
  } else if (isCancelado) {
    statusLabel = 'Cancelado';
    statusClass = 'pill-gray';
  } else if (isExpirado) {
    statusLabel = 'Não realizado';
    statusClass = 'pill-danger';
  } else {
    statusLabel = 'Agendado';
    statusClass = 'pill-warning';
  }

  // Fallback se polish não estiver activo — mesma hierarquia de acções
  if (window.BPAgendaUI && typeof BPAgendaUI.renderAgendaItemPro === 'function') {
    return BPAgendaUI.renderAgendaItemPro(a);
  }
  const hora = String(a.hora || '').slice(0, 5);
  return `
    <div class="list-item bp-ag-card" data-agenda-id="${a.id}">
      <div class="avatar bp-ag-avatar">${escHtml((a.cliente || '?').charAt(0).toUpperCase())}</div>
      <div class="info bp-ag-info">
        <div class="bp-ag-top">
          <span class="bp-ag-time">${escHtml(hora)}</span>
          <span class="bp-ag-status ${statusClass === 'pill-success' ? 'bp-ag-st-ok' : statusClass === 'pill-danger' ? 'bp-ag-st-no' : statusClass === 'pill-gray' ? 'bp-ag-st-off' : 'bp-ag-st-agendado'}">${statusLabel}</span>
        </div>
        <div class="title">${escHtml(a.servico || 'Serviço')}</div>
        <div class="sub">${escHtml(a.cliente || 'Cliente')}</div>
        <div class="bp-ag-meta">
          <span class="bp-ag-prof">${escHtml(nomeProf)}</span>
          <span class="bp-ag-price">${fmtKz(a.preco)}</span>
        </div>
        ${(podeFinalizar || podeCancelar) ? `
        <div class="bp-ag-actions" style="--bp-ag-cols:2">
          ${podeFinalizar ? `<button type="button" class="btn btn-sm btn-primary bp-ag-btn" data-id="${a.id}" data-action="finalizar">Finalizar</button>` : ''}
          ${podeCancelar ? `<button type="button" class="btn btn-sm btn-secondary bp-ag-btn bp-ag-btn-muted" data-id="${a.id}" data-action="cancelar-agenda" data-role="admin,gerente">Cancelar</button>` : ''}
        </div>` : ''}
      </div>
    </div>
  `;
}
function abrirFinalizarAtendimento(id) {
  const ag = state.agendamentos.find(a => a.id === id);
  if (!ag) return;
  if (ag.status === 'realizado' || ag.status === 'nao_realizado' || ag.status === 'cancelado') {
    toast('Este atendimento já foi finalizado, cancelado ou expirou.', 'warning');
    return;
  }
  const nomeProf = getProfissionalNome(ag.profissional_id);
  document.getElementById('finalizar-ag-id').value = ag.id;
  document.getElementById('finalizar-info').innerHTML =
    `<strong>${escHtml(ag.servico)}</strong><br>${escHtml(ag.cliente)} · ${ag.hora} · ${escHtml(nomeProf)} · ${fmtKz(ag.preco)}`;
  document.getElementById('finalizar-pagamento').value = 'Numerário';
  openModal('modal-finalizar');
}

function mudarAgenda(delta) {
  // Navegação adaptada ao filtro atual
  if (agendaFilter === 'hoje') {
    const atual = new Date(state.agendaDataAtual || hoje());
    atual.setDate(atual.getDate() + delta);
    state.agendaDataAtual = atual.toISOString().split('T')[0];
    renderAgendaFull();
  } else if (agendaFilter === 'dia') {
    // Navegar por dias no modo "Dia Exato"
    const dataAtual = localStorage.getItem('bp_agenda_data_exata') || hoje();
    const d = new Date(dataAtual + 'T00:00:00');
    d.setDate(d.getDate() + delta);
    const novaData = formatarDataISO(d);
    localStorage.setItem('bp_agenda_data_exata', novaData);
    renderAgendaFull();
  }
  // Nos modos "semana", "mes", "todos" as setas não têm efeito
}

// ====================================================================
//  BADGE DA AGENDA (contar todos os disponíveis)
// ====================================================================
function renderBadges() {
  atualizarAgendamentosExpirados();
  const agora = new Date();
  const disponiveis = (state.agendamentos || []).filter(a => {
    if (_statusAg(a) !== 'agendado') return false;
    const hora = String(a.hora || '00:00').slice(0, 5);
    const agDate = new Date(a.data + 'T' + hora + ':00');
    return !isNaN(agDate.getTime()) && agDate >= agora;
  });
  const count = disponiveis.length;

  const badge = document.getElementById('agenda-badge');
  if (badge) {
    if (count > 0) {
      badge.textContent = count > 9 ? '9+' : count;
      badge.classList.add('show');
    } else {
      badge.classList.remove('show');
    }
  }
}

// ====================================================================
//  EVENTOS — Filtro da Agenda
// ====================================================================

// Restaurar filtro
agendaFilter = localStorage.getItem(agendaFilterKey) || 'hoje';

// Marcar opção ativa no popover (usando classes CSS)
function atualizarFiltroAgendaUI() {
  document.querySelectorAll('.agenda-periodo-filter').forEach(btn => {
    const periodo = btn.dataset.periodo;
    btn.classList.toggle('active', periodo === agendaFilter);
  });
}

// Fechar popover (função auxiliar)
function fecharPopover() {
  const popover = document.getElementById('agenda-filter-popover');
  if (popover) popover.style.display = 'none';
}

// Toggle do popover
document.getElementById('agenda-filter-icon')?.addEventListener('click', function(e) {
  e.stopPropagation();
  const popover = document.getElementById('agenda-filter-popover');
  if (!popover) return;
  const isOpen = popover.style.display === 'block';
  popover.style.display = isOpen ? 'none' : 'block';
  if (!isOpen) {
    atualizarFiltroAgendaUI();
  }
});

// Fechar popover ao clicar fora
document.addEventListener('click', function(e) {
  const popover = document.getElementById('agenda-filter-popover');
  const btn = document.getElementById('agenda-filter-icon');
  if (popover && popover.style.display === 'block') {
    if (!popover.contains(e.target) && e.target !== btn) {
      fecharPopover();
    }
  }
});

// Listeners para todos os botões de filtro (incluindo Dia Exato)
document.querySelectorAll('.agenda-periodo-filter').forEach(btn => {
  btn.addEventListener('click', function(e) {
    e.stopPropagation();
    const periodo = this.dataset.periodo;

    // Dia Exato: abrir seletor de data
    if (periodo === 'dia') {
      const input = document.getElementById('agenda-data-exata');
      if (input) {
        input.click();
      }
      return; // não fecha popover nem muda o filtro ainda
    }

    // Outros períodos (hoje, semana, mes, todos)
    agendaFilter = periodo;
    localStorage.setItem(agendaFilterKey, periodo);

    // Resetar data atual quando voltar a "hoje"
    if (periodo === 'hoje') {
      state.agendaDataAtual = hoje();
    }

    // Limpar data exata se não for "dia"
    localStorage.removeItem('bp_agenda_data_exata');

    atualizarFiltroAgendaUI();
    fecharPopover();
    renderAgendaFull();
    renderBadges();
  });
});

// Input de data para Dia Exato
document.getElementById('agenda-data-exata')?.addEventListener('change', function() {
  const data = this.value;
  if (data) {
    agendaFilter = 'dia';
    localStorage.setItem(agendaFilterKey, 'dia');
    localStorage.setItem('bp_agenda_data_exata', data);
    atualizarFiltroAgendaUI();
    fecharPopover();
    renderAgendaFull();
    renderBadges();
  }
});

// ====================================================================
//  SINCRONIZAÇÃO (unificada com debounce)
// ====================================================================
let syncTimeout = null;

function syncAgenda() {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    if (document.visibilityState === 'visible') {
      atualizarAgendamentosExpirados();
      if (activeTab === 'agenda') renderAgendaFull();
      renderBadges();
    }
  }, 200);
}

// Verificar expirados a cada 60 segundos
setInterval(syncAgenda, 60000);

// Verificar quando a app volta ao foco
document.addEventListener('visibilitychange', syncAgenda);