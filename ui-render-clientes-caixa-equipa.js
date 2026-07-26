// ====================================================================
//  ui-render-clientes-caixa-equipa.js — extraído do app.js (Fase C da modularização)
//  Conteúdo: Renderização de Clientes, Caixa, Profissionais e Serviços
//  Linhas originais: 611-910
//  Carregar depois de core-*.js, db-indexeddb.js, sync-*.js, auth-supabase.js
// ====================================================================

// ====================================================================
//  ESTATÍSTICAS DO CLIENTE (partilhado entre a lista e o modal de perfil)
// ====================================================================
// Cache O(1) por render — invalidado quando mudam tamanhos das listas
let _statsCache = { key: '', map: null };

function _buildStatsMap() {
  const map = {};
  (state.agendamentos || []).forEach(a => {
    if (a.status === 'cancelado' || !a.cliente) return;
    if (!map[a.cliente]) map[a.cliente] = { visitas: 0, totalGasto: 0, datas: [] };
    map[a.cliente].visitas++;
    if (a.data) map[a.cliente].datas.push(a.data);
  });
  (state.movimentos || []).forEach(m => {
    if (m.tipo !== 'venda' || !m.cliente) return;
    if (!map[m.cliente]) map[m.cliente] = { visitas: 0, totalGasto: 0, datas: [] };
    map[m.cliente].visitas++;
    map[m.cliente].totalGasto += Number(m.valor) || 0;
    if (m.data) map[m.cliente].datas.push(m.data);
  });
  Object.keys(map).forEach(k => {
    map[k].datas.sort();
    map[k].ultimaVisita = map[k].datas.length ? map[k].datas[map[k].datas.length - 1] : null;
    delete map[k].datas;
  });
  return map;
}

function getEstatisticasCliente(nomeCliente) {
  const key = (state.agendamentos || []).length + ':' + (state.movimentos || []).length;
  if (!_statsCache.map || _statsCache.key !== key) {
    _statsCache = { key, map: _buildStatsMap() };
  }
  return _statsCache.map[nomeCliente] || { visitas: 0, totalGasto: 0, ultimaVisita: null };
}

function formatarUltimaVisita(iso) {
  if (!iso) return 'Sem visitas registadas';
  const dias = Math.floor((new Date(hoje() + 'T00:00:00') - new Date(iso + 'T00:00:00')) / 86400000);
  if (dias === 0) return 'Hoje';
  if (dias === 1) return 'Ontem';
  if (dias < 30) return `Há ${dias} dias`;
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', year: 'numeric' });
}


/** Insere HTML de linhas via DocumentFragment (menos reflow que innerHTML repetido) */
function appendRowsHtml(container, htmlStrings) {
  if (!container || !htmlStrings || !htmlStrings.length) return;
  const frag = document.createDocumentFragment();
  const wrap = document.createElement('div');
  wrap.innerHTML = htmlStrings.join('');
  while (wrap.firstChild) frag.appendChild(wrap.firstChild);
  container.appendChild(frag);
}

/** Sentinel IntersectionObserver para "carregar mais" */
function observeLoadMore(sentinel, onVisible) {
  if (!sentinel || typeof IntersectionObserver === 'undefined') return null;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) onVisible();
    });
  }, { root: null, rootMargin: '120px', threshold: 0 });
  io.observe(sentinel);
  return io;
}

function renderClientes() {
  const cont0 = document.getElementById('clientes-list');
  if (!state.clientes || !Array.isArray(state.clientes)) {
    if (cont0) cont0.innerHTML = '<div class="empty-state">A carregar clientes...</div>';
    return;
  }
  const search = document.getElementById('search-cliente')?.value.toLowerCase() || '';
  const filtro = state.filtroClientes || 'todos';
  const freqMap = {};
  (state.agendamentos || []).filter(a => a.status !== 'cancelado').forEach(a => { freqMap[a.cliente] = (freqMap[a.cliente] || 0) + 1; });
  (state.movimentos || []).filter(m => m.tipo === 'venda').forEach(v => { freqMap[v.cliente] = (freqMap[v.cliente] || 0) + 1; });

  let filtered = state.clientes.filter(c => c.nome.toLowerCase().includes(search));
  if (filtro === 'mais') filtered.sort((a, b) => (freqMap[b.nome] || 0) - (freqMap[a.nome] || 0));
  else if (filtro === 'menos') filtered.sort((a, b) => (freqMap[a.nome] || 0) - (freqMap[b.nome] || 0));

  const cont = document.getElementById('clientes-list');
  if (filtered.length === 0) {
    cont.innerHTML = `<div class="empty-state">${svgPessoa}<p>${search ? 'Nenhum resultado' : 'Nenhum cliente ainda'}</p></div>`;
    return;
  }

  // Progressive render: primeiros 60 itens, resto sob demanda (P1 performance)
  const INITIAL = 60;
  const rowHtml = (c) => {
    const { visitas, totalGasto, ultimaVisita } = getEstatisticasCliente(c.nome);
    const clienteNovo = visitas === 0;
    return `
      <div class="list-item cliente-item" data-cliente-id="${c.id}" style="cursor:pointer;">
        <div class="avatar">${(c.nome||'?').charAt(0).toUpperCase()}</div>
        <div class="info">
          <div class="title">${escHtml(c.nome)}</div>
          <div class="sub">${escHtml(c.telefone || 'Sem contacto')}${c.notas ? ' · ' + escHtml(c.notas) : ''}</div>
          <div class="cliente-stats">
            <span class="cliente-stat">${visitas} ${visitas === 1 ? 'visita' : 'visitas'}</span>
            ${totalGasto > 0 ? `<span class="cliente-stat cliente-stat--gasto">${fmtKz(totalGasto)} gastos</span>` : ''}
            ${clienteNovo ? `<span class="cliente-stat cliente-stat--novo">Novo</span>` : `<span class="cliente-stat">${formatarUltimaVisita(ultimaVisita)}</span>`}
          </div>
        </div>
        <div class="actions">
          <button class="row-menu-btn" data-action="row-menu" data-tipo="cliente" data-id="${c.id}" aria-label="Mais ações" aria-haspopup="menu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
          </button>
        </div>
      </div>`;
  };
  const first = filtered.slice(0, INITIAL);
  cont.innerHTML = first.map(rowHtml).join('');
  if (filtered.length > INITIAL) {
    const more = document.createElement('div');
    more.className = 'list-load-more';
    more.style.cssText = 'padding:12px;text-align:center;';
    more.innerHTML = '<button type="button" class="btn btn-secondary btn-sm" id="clientes-load-more">Mostrar mais (' + (filtered.length - INITIAL) + ')</button><div id="clientes-io-sentinel" style="height:1px;" aria-hidden="true"></div>';
    cont.appendChild(more);
    const btn = more.querySelector('#clientes-load-more');
    if (btn) {
      let offset = INITIAL;
      btn.onclick = () => {
        const next = filtered.slice(offset, offset + INITIAL);
        offset += next.length;
        const htmls = next.map(rowHtml);
        if (typeof appendRowsHtml === 'function') appendRowsHtml(cont, htmls);
        else next.forEach(c => cont.insertAdjacentHTML('beforeend', rowHtml(c)));
        cont.appendChild(more);
        if (offset >= filtered.length) more.remove();
        else btn.textContent = 'Mostrar mais (' + (filtered.length - offset) + ')';
        if (typeof bindClienteRowEvents === 'function') bindClienteRowEvents(cont);
      };
      const sent = more.querySelector('#clientes-io-sentinel');
      if (sent && typeof observeLoadMore === 'function') {
        observeLoadMore(sent, function() {
          if (btn && document.body.contains(btn)) btn.click();
        });
      }
    }
  }

}

function renderCaixa() {
  if (!state.movimentos || !Array.isArray(state.movimentos)) {
    const cont0 = document.getElementById('movimentos-list');
    if (cont0) cont0.innerHTML = '<div class="empty-state">A carregar movimentos...</div>';
    return;
  }
  const hojeStr = hoje();
  const entradas = state.movimentos.filter(m => m.data === hojeStr && m.tipo === 'venda').reduce((s, m) => s + m.valor, 0);
  const despesas = state.movimentos.filter(m => m.data === hojeStr && m.tipo === 'despesa').reduce((s, m) => s + m.valor, 0);
  document.getElementById('caixa-saldo').textContent = fmtKz(state.config.fundo + entradas - despesas);
  document.getElementById('caixa-fundo').textContent = fmtKz(state.config.fundo);
  // Variação do faturamento de hoje face a ontem
  const dOntem = new Date();
  dOntem.setDate(dOntem.getDate() - 1);
  const ontemStr = dOntem.getFullYear() + '-' + String(dOntem.getMonth() + 1).padStart(2, '0') + '-' + String(dOntem.getDate()).padStart(2, '0');
  const totalOntem = state.movimentos.filter(m => m.data === ontemStr && m.tipo === 'venda').reduce((s, m) => s + m.valor, 0);
  const variacaoEl = document.getElementById('caixa-variacao');
  if (variacaoEl) {
    let variacao = 0;
    if (totalOntem > 0) {
      variacao = ((entradas - totalOntem) / totalOntem) * 100;
    } else if (entradas > 0) {
      variacao = 100;
    }
    const subiu = variacao >= 0;
    variacaoEl.textContent = `${subiu ? '↑' : '↓'} ${Math.abs(Math.round(variacao))}%`;
    variacaoEl.style.color = subiu ? 'var(--green)' : 'var(--red)';
  }

  const periodo = state.histPeriodo || 'hoje';
  const movs = getMovimentosPeriodo(periodo).sort((a, b) => b.data.localeCompare(a.data) || b.hora.localeCompare(a.hora));
  const titEl = document.getElementById('hist-titulo');
  if (titEl) titEl.textContent = (typeof tituloPeriodoCaixa === 'function' ? tituloPeriodoCaixa(periodo) : 'Movimentos');

  const cont = document.getElementById('movimentos-list');
  if (movs.length === 0) { cont.innerHTML = `<div class="empty-state">${svgCarteira}<p>Sem movimentos neste período</p></div>`; return; }
  const MOV_INITIAL = 80;
  const movRow = (m) => {
    const isV = m.tipo === 'venda';
    const nomeProf = typeof getProfissionalNome === 'function' ? getProfissionalNome(m.profissional_id) : '';
    return `
      <div class="list-item${isV ? ' list-item-venda' : ''}" data-id="${m.id}" data-tipo="${m.tipo}" style="padding-right:${isV ? '32px' : '16px'};">
        <div class="avatar" style="background:${isV ? '#E6F4EC' : '#FDE8E8'};color:${isV ? 'var(--green)' : 'var(--red)'};font-size:0;" aria-hidden="true"><span style="display:block;width:8px;height:8px;border-radius:50%;background:currentColor;margin:auto;"></span></div>
        <div class="info">
          <div class="title">${escHtml(m.descricao||'')}</div>
          <div class="sub">${m.data} · ${m.hora || ''}${m.cliente ? ' · ' + escHtml(m.cliente) : ''}${nomeProf ? ' · ' + escHtml(nomeProf) : ''}</div>
        </div>
        <div class="action" style="color:${isV ? 'var(--green)' : 'var(--red)'};">${isV ? '+' : '−'}${fmtKz(m.valor)}</div>
      </div>`;
  };
  const movFirst = movs.slice(0, MOV_INITIAL);
  cont.innerHTML = movFirst.map(movRow).join('');
  if (movs.length > MOV_INITIAL) {
    const more = document.createElement('div');
    more.style.cssText = 'padding:12px;text-align:center;';
    more.innerHTML = '<button type="button" class="btn btn-secondary btn-sm" id="movs-load-more">Mostrar mais (' + (movs.length - MOV_INITIAL) + ')</button><div id="movs-io-sentinel" style="height:1px;" aria-hidden="true"></div>';
    cont.appendChild(more);
    let off = MOV_INITIAL;
    const movBtn = more.querySelector('#movs-load-more');
    const movSent = more.querySelector('#movs-io-sentinel');
    const loadMoreMovs = function() {
      const next = movs.slice(off, off + MOV_INITIAL);
      off += next.length;
      if (typeof appendRowsHtml === 'function') appendRowsHtml(cont, next.map(movRow)); else next.forEach(m => cont.insertAdjacentHTML('beforeend', movRow(m)));
      cont.appendChild(more);
      if (off >= movs.length) more.remove();
      else this.textContent = 'Mostrar mais (' + (movs.length - off) + ')';
      cont.querySelectorAll('.list-item-venda').forEach(el => {
        el.onclick = () => { if (typeof abrirDetalheVenda === 'function') abrirDetalheVenda(el.dataset.id); };
      });
    };
    if (movBtn) movBtn.onclick = loadMoreMovs;
    if (movSent && typeof observeLoadMore === 'function') observeLoadMore(movSent, function() { if (movBtn && document.body.contains(movBtn)) loadMoreMovs(); });
  }
  cont.querySelectorAll('.list-item-venda').forEach(el => {
    el.onclick = () => { if (typeof abrirDetalheVenda === 'function') abrirDetalheVenda(el.dataset.id); };
  });


  cont.querySelectorAll('.list-item').forEach(el => {
    el.addEventListener('click', e => {
      if (el.dataset.tipo === 'venda') { addRipple(el, e);
        abrirDetalheVenda(el.dataset.id); } else toast('Detalhes disponíveis apenas para vendas', 'warning');
    });
  });
}

function getMovimentosPeriodo(periodo) {
  const hojeStr = hoje();
  const now = new Date();
  const iso = (d) => d.toISOString().split('T')[0];
  return state.movimentos.filter(m => {
    if (periodo === 'hoje') return m.data === hojeStr;
    if (periodo === 'ontem') {
      const d = new Date(now); d.setDate(d.getDate() - 1);
      return m.data === iso(d);
    }
    if (periodo === '7dias') {
      const d7 = new Date(now); d7.setDate(d7.getDate() - 6);
      return m.data >= iso(d7);
    }
    if (periodo === '30dias') {
      const d30 = new Date(now); d30.setDate(d30.getDate() - 29);
      return m.data >= iso(d30);
    }
    if (periodo === 'semana') {
      const d = new Date(hojeStr + 'T00:00:00');
      const dia = d.getDay();
      const inicio = new Date(d); inicio.setDate(d.getDate() - dia);
      return m.data >= iso(inicio) && m.data <= hojeStr;
    }
    if (periodo === 'mes') {
      const mes = String(now.getMonth() + 1).padStart(2, '0');
      return m.data.startsWith(now.getFullYear() + '-' + mes);
    }
    if (periodo === 'ano') {
      return m.data.startsWith(String(now.getFullYear()));
    }
    if (periodo === 'dia') {
      const dataExata = localStorage.getItem('bp_caixa_data_exata') || hojeStr;
      return m.data === dataExata;
    }
    if (periodo === 'tudo') return true;
    return true;
  });
}

function tituloPeriodoCaixa(periodo) {
  const map = {
    hoje: 'Movimentos de Hoje',
    ontem: 'Movimentos de Ontem',
    semana: 'Movimentos desta Semana',
    '7dias': 'Últimos 7 dias',
    '30dias': 'Últimos 30 dias',
    mes: 'Movimentos deste Mês',
    ano: 'Movimentos deste Ano',
    dia: 'Movimentos do dia seleccionado',
    tudo: 'Histórico Completo'
  };
  return map[periodo] || 'Movimentos';
}

function renderProfissionais() {
  const cont = document.getElementById('profissionais-list');
  if (!cont) return;
  const plano = getPlanoAtual();
  const aviso = document.getElementById('plano-aviso');
  if (aviso) aviso.style.display = (plano === 'trial' || plano === 'starter') ? 'block' : 'none';

  if (state.profissionais.length === 0) {
    cont.innerHTML = `<div class="empty-state">${svgPessoas}<p>Adicione o primeiro profissional</p></div>`;
    return;
  }
  const profissionaisOrdenados = [...state.profissionais].sort((a, b) => a.nome.localeCompare(b.nome));
  cont.innerHTML = profissionaisOrdenados.map(p => `
    <div class="list-item" data-prof-id="${p.id}" style="cursor:pointer;">
      <div class="avatar">${p.nome.charAt(0).toUpperCase()}</div>
      <div class="info">
        <div class="title">${escHtml(p.nome)}</div>
        <div class="sub">${escHtml(p.especialidade || 'Sem especialidade definida')}</div>
        <div class="cliente-stats">
          ${p.idade ? `<span class="cliente-stat">${p.idade} anos</span>` : ''}
          ${p.contacto ? `<span class="cliente-stat">${escHtml(p.contacto)}</span>` : ''}
        </div>
      </div>
      <div class="actions">
        <button class="row-menu-btn" data-action="row-menu" data-tipo="profissional" data-id="${p.id}" data-role="admin" aria-label="Mais ações" aria-haspopup="menu">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.75"/><circle cx="12" cy="12" r="1.75"/><circle cx="12" cy="19" r="1.75"/></svg>
        </button>
      </div>
    </div>
  `).join('');
}

function renderServicos() {
  const container = document.getElementById('servicos-list');
  if (!container) return;
  if (state.servicos.length === 0) {
    container.innerHTML = `<div class="empty-state">${svgTesoura}<p>Nenhum serviço cadastrado</p></div>`;
    return;
  }
  const servicosOrdenados = [...state.servicos].sort((a, b) => a.nome.localeCompare(b.nome));
  container.innerHTML = servicosOrdenados.map(s => {
    const profs = s.profissionais && s.profissionais.length > 0 ? s.profissionais.join(', ') : 'Todos os profissionais disponíveis';
    return `
      <div class="list-item" style="cursor:default;">
        <div class="avatar" style="background:var(--gold-light);color:var(--gold-dark);font-size:0;" aria-hidden="true"><span style="display:block;width:8px;height:8px;border-radius:50%;background:currentColor;margin:auto;"></span></div>
        <div class="info">
          <div class="title">${escHtml(s.nome)}</div>
          <div class="sub">${fmtKz(s.precoBase)} · ${escHtml(profs)}</div>
        </div>
        <div class="actions">
          <button class="row-menu-btn" data-action="row-menu" data-tipo="servico" data-id="${s.id}" data-role="admin" aria-label="Mais ações" aria-haspopup="menu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.75"/><circle cx="12" cy="12" r="1.75"/><circle cx="12" cy="19" r="1.75"/></svg>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// renderBadges: a única declaração válida está em ui-render-dashboard-agenda.js
// (conta agendamentos futuros/pendentes em todos os dias, não só hoje). Esta
// cópia antiga foi removida — carregava depois e estava a ganhar sempre,
// travando o indicador num valor desatualizado.

// ====================================================================
//  SETUP DE PRECIFICAÇÃO E SELECTS
// ====================================================================
function setupPrecoAutomatico(selectId, inputPrecoId) {
  const select = document.getElementById(selectId);
  const inputPreco = document.getElementById(inputPrecoId);
  if (!select || !inputPreco) return;
  if (select._precoHandler) select.removeEventListener('change', select._precoHandler);
  const handler = () => {
    const nome = select.value;
    if (!nome || nome === 'Outro' || nome === '__custom') {
      inputPreco.value = '';
      inputPreco.disabled = false;
      inputPreco.style.opacity = '1';
      return;
    }
    const serv = state.servicos.find(s => s.nome === nome);
    if (serv) {
      inputPreco.value = serv.precoBase;
      inputPreco.disabled = true;
      inputPreco.style.opacity = '0.7';
    } else {
      inputPreco.value = '';
      inputPreco.disabled = false;
      inputPreco.style.opacity = '1';
    }
  };
  select._precoHandler = handler;
  select.addEventListener('change', handler);
  handler();
}

function populateAgendaSelects() {
  const profSel = document.getElementById('agenda-profissional');
  const servSel = document.getElementById('agenda-servico');
  if (!profSel || !servSel) return;

  // Verificar se há serviços
  if (state.servicos.length === 0) {
    servSel.innerHTML = '<option value="">Nenhum serviço disponível</option>';
    profSel.innerHTML = '<option value="">Nenhum profissional disponível</option>';
    return;
  }

  const prevServico = servSel.value;
  servSel.innerHTML = state.servicos.map(s =>
    `<option value="${escHtml(s.nome)}">${escHtml(s.nome)}</option>`
  ).join('') + '<option value="Outro">Outro / Personalizado</option>';
  if (prevServico) servSel.value = prevServico;

  const filtrarProfsAgenda = (servicoNome) => {
    // Se não houver profissionais, mostrar opção vazia
    if (state.profissionais.length === 0) {
      profSel.innerHTML = '<option value="">Nenhum profissional disponível</option>';
      return;
    }

    let profs;
    if (!servicoNome || servicoNome === 'Outro') {
      profs = state.profissionais.map(p => ({ id: p.id, nome: p.nome }));
    } else {
      const serv = state.servicos.find(s => s.nome === servicoNome);
      const nomes = serv && serv.profissionais && serv.profissionais.length > 0
        ? serv.profissionais
        : state.profissionais.map(p => p.nome);
      profs = state.profissionais
        .filter(p => nomes.includes(p.nome))
        .map(p => ({ id: p.id, nome: p.nome }));
    }
    const prevProfId = profSel.value;
    profSel.innerHTML = profs.map(p =>
      `<option value="${p.id}">${escHtml(p.nome)}</option>`
    ).join('');
    if (profs.some(p => p.id === prevProfId)) profSel.value = prevProfId;
  };

  filtrarProfsAgenda(servSel.value);
  if (servSel._filterHandler) servSel.removeEventListener('change', servSel._filterHandler);
  servSel._filterHandler = function() { filtrarProfsAgenda(this.value); };
  servSel.addEventListener('change', servSel._filterHandler);
}

function populateVendaSelects() {
  const profSel = document.getElementById('venda-profissional');
  const catSel = document.getElementById('ci-servico-sel');
  if (!profSel || !catSel) return;

  // Verificar se há serviços
  if (state.servicos.length === 0) {
    catSel.innerHTML = '<option value="">Nenhum serviço disponível</option>';
    profSel.innerHTML = '<option value="">Nenhum profissional disponível</option>';
    return;
  }

  catSel.selectedIndex = -1;

  catSel.innerHTML = `<option value="">Selecionar serviço</option>` +
    state.servicos.map(s =>
      `<option value="${escHtml(s.nome)}" data-preco="${s.precoBase}">${escHtml(s.nome)}</option>`
    ).join('') +
    '<option value="__custom" data-preco="">Outro (personalizado)</option>';

  const filtrarProfsVenda = (servicoNome) => {
    // Se não houver profissionais, mostrar opção vazia
    if (state.profissionais.length === 0) {
      profSel.innerHTML = '<option value="">Nenhum profissional disponível</option>';
      return;
    }

    let profs;
    if (!servicoNome || servicoNome === '__custom') {
      profs = state.profissionais.map(p => ({ id: p.id, nome: p.nome }));
    } else {
      const serv = state.servicos.find(s => s.nome === servicoNome);
      const nomes = serv && serv.profissionais && serv.profissionais.length > 0
        ? serv.profissionais
        : state.profissionais.map(p => p.nome);
      profs = state.profissionais
        .filter(p => nomes.includes(p.nome))
        .map(p => ({ id: p.id, nome: p.nome }));
    }
    profSel.innerHTML = `<option value="">Selecionar profissional</option>` +
      profs.map(p =>
        `<option value="${p.id}">${escHtml(p.nome)}</option>`
      ).join('');
  };

  if (catSel._filterHandler) catSel.removeEventListener('change', catSel._filterHandler);
  catSel._filterHandler = function() {
    filtrarProfsVenda(this.value);
    const opt = this.options[this.selectedIndex];
    const ciValor = document.getElementById('ci-valor');
    if (this.value === '__custom') {
      if (ciValor) { ciValor.value = ''; ciValor.disabled = false; ciValor.style.opacity = '1'; }
    } else if (opt && opt.dataset.preco) {
      if (ciValor) { ciValor.value = opt.dataset.preco; ciValor.disabled = true; ciValor.style.opacity = '0.7'; }
    } else {
      if (ciValor) { ciValor.value = ''; ciValor.disabled = false; ciValor.style.opacity = '1'; }
    }
  };
  catSel.addEventListener('change', catSel._filterHandler);
}