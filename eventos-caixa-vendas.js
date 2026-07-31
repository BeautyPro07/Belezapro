// ====================================================================
//  eventos-caixa-vendas.js — extraído do app.js (Fase C da modularização)
//  Conteúdo: Eventos: despesa, fundo, carrinho/venda, confirmação de venda, fecho de caixa, detalhes e KPIs
//  Linhas originais: 1877-2109
//  Carregar depois de core-*.js, db-indexeddb.js, sync-*.js, auth-supabase.js
//  CORREÇÃO: adicionado profissional_id e renderBadges() no modal-finalizar-save
// ====================================================================

// Despesa
document.getElementById('add-despesa-btn').addEventListener('click', () => {
  const d = document.getElementById('desp-desc');
  const v = document.getElementById('desp-valor');
  const c = document.getElementById('desp-categoria');
  if (d) d.value = '';
  if (v) v.value = '';
  if (c) c.value = 'operacional';
  openModal('modal-despesa');
  setTimeout(function () { if (d) try { d.focus(); } catch (e) {} }, 100);
});
document.getElementById('modal-despesa-save').addEventListener('click', async () => {
  const desc = document.getElementById('desp-desc').value.trim();
  const valor = Number(document.getElementById('desp-valor').value);
  const categoria = (document.getElementById('desp-categoria') || {}).value || 'outro';
  if (!desc) { toast('Indique a descrição da despesa', 'error'); return; }
  if (!valor || valor <= 0 || isNaN(valor)) { toast('Indique um valor válido', 'error'); return; }
  await addMovimento({
    tipo: 'despesa',
    descricao: desc,
    valor: valor,
    categoria: categoria
  });
  closeModal('modal-despesa');
  document.getElementById('desp-desc').value = '';
  document.getElementById('desp-valor').value = '';
  toast('Despesa registada', 'success');
  if (typeof updateUI === 'function') updateUI();
});
document.getElementById('modal-despesa-cancel').addEventListener('click', () => closeModal('modal-despesa'));

// Fundo
document.getElementById('ajustar-fundo-btn').addEventListener('click', () => {
  const el = document.getElementById('fundo-valor');
  const atual = Number(state.config && state.config.fundo) || 0;
  if (el) el.value = atual;
  const sub = document.getElementById('fundo-modal-sub');
  if (sub && typeof fmtKz === 'function') {
    sub.textContent = 'Actual: ' + fmtKz(atual) + ' — define o valor de abertura do caixa.';
  }
  openModal('modal-fundo');
  setTimeout(function () { if (el) try { el.focus(); el.select(); } catch (e) {} }, 100);
});
document.getElementById('modal-fundo-save').addEventListener('click', async () => {
  const v = Number(document.getElementById('fundo-valor').value);
  if (isNaN(v) || v < 0) { toast('Valor inválido', 'error'); return; }
  state.config.fundo = v;
  await saveConfig();
  closeModal('modal-fundo');
  toast('Fundo actualizado', 'success');
  if (typeof updateUI === 'function') updateUI();
});
document.getElementById('modal-fundo-cancel').addEventListener('click', () => closeModal('modal-fundo'));

// Venda – Adicionar item ao carrinho (profissional único/global)
document.getElementById('btn-add-item').addEventListener('click', () => {
  const catSel = document.getElementById('ci-servico-sel');
  const ciValor = document.getElementById('ci-valor');
  let nome = catSel.value;
  if (nome === '__custom') { 
    nome = prompt('Nome do serviço / produto:'); 
    if (!nome || !nome.trim()) return;
    nome = nome.trim(); 
  }
  const wasDisabled = ciValor.disabled;
  ciValor.disabled = false;
  const valor = parseFloat(ciValor.value);
  if (wasDisabled) ciValor.disabled = true;
  if (!nome || !valor || valor <= 0) { 
    toast('Preencha serviço e valor válido', 'error'); 
    return; 
  }

  // Usar a função central addToCart (definida em vendas-modais.js) - sem profissional por item
  if (typeof window.addToCart === 'function') {
    window.addToCart(nome, valor);
  } else {
    // Fallback
    const existingIndex = cartItems.findIndex(item => item.nome === nome);
    if (existingIndex !== -1) {
      cartItems[existingIndex].quantidade += 1;
      cartItems[existingIndex].subtotal = cartItems[existingIndex].quantidade * cartItems[existingIndex].precoUnit;
    } else {
      cartItems.push({ nome, quantidade: 1, precoUnit: valor, subtotal: valor });
    }
    renderCart();
  }
  // Preparar próximo item (velocidade no balcão)
  if (catSel) catSel.value = '';
  if (ciValor) { ciValor.value = ''; }
  if (typeof updateVendaSaveButton === 'function') updateVendaSaveButton();
});

// CORREÇÃO: modal-venda-save com profissional único
const vendaSaveBtn = document.getElementById('modal-venda-save');
if (vendaSaveBtn) {
  vendaSaveBtn.onclick = async function(e) {
    if (!cartItems.length) { toast('Adicione pelo menos um serviço à venda', 'error'); return; }
    const cliente = document.getElementById('venda-cliente').value || 'Avulso';
    const profissionalId = document.getElementById('venda-profissional').value;
    const metodoPagamento = document.getElementById('venda-pagamento').value;
    
    // Buscar o nome do profissional
    const profObj = state.profissionais.find(p => p.id === profissionalId);
    const profissionalNome = profObj ? profObj.nome : '';
    
    // Profissional opcional (comissões); venda walk-in não bloqueia
    setButtonLoading(this, true);
    try {
      let clienteId = null;
      try {
        if (typeof resolverClienteIdPorNome === 'function') clienteId = resolverClienteIdPorNome(cliente);
        else {
          const hit = (state.clientes || []).find(c => c.nome === cliente);
          if (hit) clienteId = hit.id;
        }
      } catch (e) {}
      const idVenda = await registarVenda({
        cliente,
        cliente_id: clienteId,
        profissional: profissionalNome,
        profissional_id: profissionalId || null,
        itens: [...cartItems],
        metodoPagamento
      });
      if (idVenda) {
        closeModal('modal-venda');
        if (typeof window.clearCart === 'function') {
          window.clearCart();
        } else {
          cartItems = [];
          renderCart();
        }
        mostrarConfirmacaoVenda(idVenda);
      }
      // se idVenda for null, registarVenda já mostrou o toast de validação
    } catch (err) {
      console.error('[modal-venda-save]', err);
      // Não bloquear a UX com modal de erro genérico se a venda local já foi tentada
      toast('Ocorreu um problema ao registar a venda. Verifique os dados e tente novamente.', 'error');
    } finally {
      setButtonLoading(this, false);
    }
  };
}

// Cancelar venda – limpar carrinho com confirmação e fechar modal
document.getElementById('modal-venda-cancel').addEventListener('click', () => {
  if (cartItems.length > 0) {
    const confirmCancel = confirm('Tem a certeza que deseja cancelar? O carrinho será limpo.');
    if (!confirmCancel) return;
  }
  if (typeof window.clearCart === 'function') {
    window.clearCart();
  } else {
    cartItems = [];
    renderCart();
  }
  closeModal('modal-venda');
});

document.getElementById('venda-add-cliente-rapido').addEventListener('click', () => {
  closeModal('modal-venda');
  document.getElementById('cliente-rapido-nome').value = '';
  document.getElementById('cliente-rapido-telefone').value = '';
  openModal('modal-cliente-rapido');
});

// Tela de sucesso da venda
let ultimaVendaId = null;

const PAGAMENTO_ICONES = {
  'Numerário': 'Numerário',
  'Multicaixa Express': 'Multicaixa Express',
  'Transferência Bancária': 'Transferência Bancária',
  'Cartão': 'Cartão',
  'Outro': 'Outro',
};

function mostrarConfirmacaoVenda(vendaId) {
  // Constituição: sem modal de sucesso de venda — toast + actualização UI
  const venda = (state.vendas || []).find(v => v.id === vendaId)
    || (state.movimentos || []).find(m => m.id === vendaId);
  const valor = venda ? (venda.total || venda.valor || 0) : 0;
  toast('Venda registada · ' + (typeof fmtKz === 'function' ? fmtKz(valor) : valor + ' Kz'), 'success');
  if (typeof updateUI === 'function') updateUI();
  // Guardar id para impressão rápida se o utilizador abrir detalhe
  try { sessionStorage.setItem('bp_last_venda_id', vendaId); } catch (_) {}
}


// ====================================================================
// CORREÇÃO: Finalizar atendimento (adicionado profissional_id e renderBadges)
// ====================================================================
document.getElementById('modal-finalizar-save').addEventListener('click', async () => {
  const id = document.getElementById('finalizar-ag-id').value;
  const ag = state.agendamentos.find(a => a.id === id);
  if (!ag) return;
  if (ag.status !== 'agendado') {
    toast('Este atendimento já não está disponível para finalizar (foi cancelado, expirou ou já foi realizado).', 'warning');
    closeModal('modal-finalizar');
    return;
  }
  const metodo = document.getElementById('finalizar-pagamento').value;
  
  // Atualizar status do agendamento para realizado
  await updateAgendamento(id, { status: 'realizado' });
  
  // Registar a venda com profissional_id
  const itens = [{ nome: ag.servico, quantidade: 1, precoUnit: ag.preco, subtotal: ag.preco }];
  let cliId = ag.cliente_id || null;
  if (!cliId && typeof resolverClienteIdPorNome === 'function') {
    cliId = resolverClienteIdPorNome(ag.cliente);
  }
  await registarVenda({
    cliente: ag.cliente || 'Avulso',
    cliente_id: cliId,
    profissional: ag.profissional,
    profissional_id: ag.profissional_id || null,
    itens,
    metodoPagamento: metodo
  });
  
  closeModal('modal-finalizar');
  toast('Atendimento finalizado e venda registada!', 'success');
  
  // Atualizar UI e badge
  updateUI();
  renderBadges(); // <- CORREÇÃO
});

document.getElementById('modal-finalizar-cancel').addEventListener('click', () => closeModal('modal-finalizar'));

// ====================================================================
//  CONFIRMAR FECHO DE CAIXA (persistência)
// ====================================================================
async function confirmarFechoCaixa() {
  const hojeStr = hoje();
  const movs = state.movimentos.filter(m => m.data === hojeStr);
  const vendas = movs.filter(m => m.tipo === 'venda');
  const despesas = movs.filter(m => m.tipo === 'despesa');

  // Verificar se já existe fecho para hoje
  if (state.fechos_caixa && state.fechos_caixa.some(f => f.data === hojeStr)) {
    toast('Já existe um fecho de caixa registado para hoje.', 'warning');
    return;
  }

  const detalhePagamento = {};
  vendas.forEach(v => {
    const mp = v.metodoPagamento || 'Numerário';
    detalhePagamento[mp] = (detalhePagamento[mp] || 0) + (Number(v.valor) || 0);
  });

  const totalVendas = vendas.reduce((s, v) => s + (Number(v.valor) || 0), 0);
  const totalDespesas = despesas.reduce((s, d) => s + (Number(d.valor) || 0), 0);
  const saldoFinal = (Number(state.config.fundo) || 0) + totalVendas - totalDespesas;

  const registro = {
    id: uuid(),
    salao_id: state.config.salaoId,
    data: hojeStr,
    fundo_abertura: state.config.fundo,
    total_vendas: totalVendas,
    total_despesas: totalDespesas,
    saldo_final: saldoFinal,
    detalhe_pagamento: detalhePagamento,
    fechado_por: state.config.userId || null,
  };

  await dbPut('fechos_caixa', registro);
  // Atualizar o estado local
  state.fechos_caixa.push(registro);
  toast('Caixa fechado com sucesso', 'success');
  closeModal('modal-fecho');
  updateUI();
}

// ====================================================================
//  FECHO DE CAIXA (listeners)
// ====================================================================
document.getElementById('fecho-caixa-btn').addEventListener('click', abrirFechoCaixa);
document.getElementById('modal-fecho-fechar').addEventListener('click', () => closeModal('modal-fecho'));
document.getElementById('btn-imprimir-fecho').addEventListener('click', () => {
  const hojeStr = hoje();
  const vendas = state.movimentos.filter(m => m.data === hojeStr && m.tipo === 'venda');
  const despesas = state.movimentos.filter(m => m.data === hojeStr && m.tipo === 'despesa');
  const tv = vendas.reduce((s, v) => s + (Number(v.valor) || 0), 0);
  const td = despesas.reduce((s, d) => s + (Number(d.valor) || 0), 0);
  const byPag = {};
  vendas.forEach(v => { const k = v.metodoPagamento || 'Numerário';
    byPag[k] = (byPag[k] || 0) + (Number(v.valor) || 0); });
  document.getElementById('recibo-print').innerHTML = `
    <div class="r-store">${escHtml(state.config.storeName)}</div>
    <div class="r-sub">FECHO DE CAIXA</div>
    <div class="r-num">${hojeStr}</div>
    <hr class="r-div">
    <div class="r-meta"><b>Fundo abertura: </b>${fmtKz(state.config.fundo)}</div>
    <div class="r-meta"><b>Total vendas (${vendas.length}): </b>${fmtKz(tv)}</div>
    <div class="r-meta"><b>Total despesas (${despesas.length}): </b>${fmtKz(td)}</div>
    <hr class="r-div">
    ${Object.entries(byPag).map(([k, v]) => `<div class="r-meta">${escHtml(k)}: ${fmtKz(v)}</div>`).join('')}
    <hr class="r-div">
    <div class="r-total">SALDO: ${fmtKz(state.config.fundo + tv - td)}</div>
    <div class="r-footer"><strong>BeautyPro</strong>Fechado ${new Date().toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })}</div>`;
  requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
});

// NOVO: Listener para o botão "Confirmar Fecho"
document.getElementById('confirmar-fecho-btn')?.addEventListener('click', confirmarFechoCaixa);

// Detalhe venda
document.getElementById('modal-detalhe-fechar').addEventListener('click', () => closeModal('modal-detalhe-venda'));
document.getElementById('btn-imprimir-recibo').addEventListener('click', () => {
  if (vendaAtual) imprimirRecibo(vendaAtual);
  else toast('Nenhuma venda para imprimir', 'error');
});

// KPIs clicáveis
document.getElementById('kpi-revenue-card').addEventListener('click', abrirDetalheFaturamento);
document.getElementById('kpi-agenda-card').addEventListener('click', () => abrirDetalheAgendamentos('pendentes'));

document.getElementById('modal-revenue-close').addEventListener('click', () => closeModal('modal-revenue-detail'));
document.getElementById('modal-agenda-close').addEventListener('click', () => closeModal('modal-agenda-detail'));

document.getElementById('agenda-detail-pendentes').addEventListener('click', () => abrirDetalheAgendamentos('pendentes'));
document.getElementById('agenda-detail-realizados').addEventListener('click', () => abrirDetalheAgendamentos('realizados'));

// hist-chip substituído pelo popover caixa-filter (Fase E)


// Filtro clientes
document.querySelectorAll('.filtro-frequencia').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.filtro-frequencia').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    state.filtroClientes = this.dataset.filtro;
    localStorage.setItem('bp_filtro_clientes', state.filtroClientes);
    renderClientes();
  });
});

// Agenda navegação
// ====================================================================
//  FASE E — Filtro Caixa (popover) + Localizar cliente
// ====================================================================
(function initCaixaFiltro() {
  const icon = document.getElementById('caixa-filter-icon');
  const pop = document.getElementById('caixa-filter-popover');
  if (!icon || !pop) return;

  icon.addEventListener('click', function(e) {
    e.stopPropagation();
    const open = pop.style.display === 'block';
    pop.style.display = open ? 'none' : 'block';
    document.querySelectorAll('.caixa-periodo-filter').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.periodo === (state.histPeriodo || 'hoje'));
    });
  });

  document.addEventListener('click', function(e) {
    if (pop.style.display === 'block' && !pop.contains(e.target) && e.target !== icon && !icon.contains(e.target)) {
      pop.style.display = 'none';
    }
  });

  document.querySelectorAll('.caixa-periodo-filter').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const periodo = this.dataset.periodo;
      if (periodo === 'dia') {
        const input = document.getElementById('caixa-data-exata');
        if (input) {
          input.onchange = function() {
            if (this.value) {
              localStorage.setItem('bp_caixa_data_exata', this.value);
              state.histPeriodo = 'dia';
              pop.style.display = 'none';
              renderCaixa();
            }
          };
          input.click();
        }
        return;
      }
      state.histPeriodo = periodo;
      localStorage.setItem('bp_hist_periodo', periodo);
      pop.style.display = 'none';
      renderCaixa();
    });
  });
})();

(function initCaixaLocalizar() {
  const btn = document.getElementById('caixa-localizar-btn');
  const pop = document.getElementById('caixa-localizar-popover');
  const buscaBox = document.getElementById('caixa-localizar-busca');
  const input = document.getElementById('caixa-localizar-input');
  const go = document.getElementById('caixa-localizar-go');
  if (!btn || !pop) return;

  let periodoLoc = null;

  btn.addEventListener('click', function(e) {
    e.stopPropagation();
    const open = pop.style.display === 'block';
    pop.style.display = open ? 'none' : 'block';
    if (buscaBox) buscaBox.style.display = 'none';
    periodoLoc = null;
    document.querySelectorAll('.caixa-loc-periodo').forEach(b => b.classList.remove('active'));
  });

  document.addEventListener('click', function(e) {
    if (pop.style.display === 'block' && !pop.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
      pop.style.display = 'none';
    }
  });

  document.querySelectorAll('.caixa-loc-periodo').forEach(b => {
    b.addEventListener('click', function(e) {
      e.stopPropagation();
      periodoLoc = this.dataset.periodo;
      document.querySelectorAll('.caixa-loc-periodo').forEach(x => x.classList.remove('active'));
      this.classList.add('active');
      if (buscaBox) buscaBox.style.display = 'block';
      if (input) { input.value = ''; input.focus(); }
    });
  });

  function procurar() {
    if (!periodoLoc) {
      toast('Seleccione primeiro o período.', 'warning');
      return;
    }
    const nome = (input && input.value || '').trim().toLowerCase();
    if (!nome) {
      toast('Introduza o nome do cliente.', 'warning');
      return;
    }
    const movs = getMovimentosPeriodo(periodoLoc).filter(m =>
      m.tipo === 'venda' && m.cliente && m.cliente.toLowerCase().includes(nome)
    );
    if (movs.length === 0) {
      pop.style.display = 'none';
      openModal('modal-cliente-nao-encontrado');
      return;
    }
    // Mostrar só estes movimentos e actualizar título
    state.histPeriodo = periodoLoc;
    const cont = document.getElementById('movimentos-list');
    const tit = document.getElementById('hist-titulo');
    if (tit) tit.textContent = 'Histórico: ' + movs[0].cliente;
    if (cont) {
      cont.innerHTML = movs.sort((a,b) => b.data.localeCompare(a.data) || b.hora.localeCompare(a.hora)).map(m => {
        const nomeProf = typeof getProfissionalNome === 'function' ? getProfissionalNome(m.profissional_id) : '';
        return `<div class="list-item list-item-venda" data-id="${m.id}" data-tipo="venda" style="padding-right:32px;">
          <div class="avatar" style="background:#E6F4EC;color:var(--green);font-size:0;" aria-hidden="true"><span style="display:block;width:8px;height:8px;border-radius:50%;background:currentColor;margin:auto;"></span></div>
          <div class="info">
            <div class="title">${escHtml(m.descricao)}</div>
            <div class="sub">${m.data} · ${m.hora} · ${escHtml(m.cliente || '')} · ${escHtml(m.metodoPagamento || '')}</div>
          </div>
          <div class="action" style="color:var(--green);">+${fmtKz(m.valor)}</div>
        </div>`;
      }).join('');
      cont.querySelectorAll('.list-item-venda').forEach(el => {
        el.addEventListener('click', e => { abrirDetalheVenda(el.dataset.id); });
      });
    }
    pop.style.display = 'none';
  }

  if (go) go.addEventListener('click', procurar);
  if (input) input.addEventListener('keydown', e => { if (e.key === 'Enter') procurar(); });
})();

document.getElementById('modal-cliente-nao-encontrado-ok')?.addEventListener('click', () => {
  closeModal('modal-cliente-nao-encontrado');
});
