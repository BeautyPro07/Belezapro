// ================================================================
// Grupo 1 (resto) — offline-first, sem Supabase nesta etapa
// F4 Rentabilidade | F13 Split pagamento | F16 Metas salão
// F22 Fluxo caixa diário | F23 Despesas operacionais
// ================================================================
(function () {
  'use strict';

  var CATEGORIAS_DESPESA = [
    { id: 'produtos', nome: 'Produtos / Stock' },
    { id: 'renda', nome: 'Renda / Aluguer' },
    { id: 'salarios', nome: 'Salários' },
    { id: 'utilities', nome: 'Água / Luz / Net' },
    { id: 'marketing', nome: 'Marketing' },
    { id: 'manutencao', nome: 'Manutenção' },
    { id: 'outro', nome: 'Outro' }
  ];

  // ---------- F16: Meta financeira do salão ----------
  function getMetaSalao() {
    try {
      var c = (state && state.config) || {};
      if (c.meta_mensal_salao != null && c.meta_mensal_salao > 0) return Number(c.meta_mensal_salao);
      var ls = localStorage.getItem('bp_meta_salao');
      return ls ? Number(ls) || 0 : 0;
    } catch (e) { return 0; }
  }

  function setMetaSalao(valor) {
    var n = Math.max(0, Math.round(Number(valor) || 0));
    try {
      localStorage.setItem('bp_meta_salao', String(n));
      if (typeof state !== 'undefined' && state.config) {
        state.config.meta_mensal_salao = n;
        if (typeof dbPut === 'function') {
          dbPut('config', Object.assign({}, state.config, { id: 'main' })).catch(function () {});
        }
      }
    } catch (e) {}
    return n;
  }

  function getReceitaMesAtual() {
    if (typeof state === 'undefined' || typeof hoje !== 'function') return 0;
    var ym = hoje().slice(0, 7);
    return (state.movimentos || [])
      .filter(function (m) { return m.tipo === 'venda' && String(m.data || '').startsWith(ym); })
      .reduce(function (s, m) { return s + (Number(m.valor) || 0); }, 0);
  }

  function getProgressoMetaSalao() {
    var meta = getMetaSalao();
    if (meta <= 0) return null;
    var vol = getReceitaMesAtual();
    var pct = Math.min(100, Math.round((vol / meta) * 100));
    return { meta: meta, volume: vol, pct: pct, atingida: vol >= meta };
  }

  // ---------- F4: Rentabilidade ----------
  function calcRentabilidadeServicos() {
    var map = {};
    (state.movimentos || []).forEach(function (m) {
      if (m.tipo !== 'venda' || !m.itens) return;
      (m.itens || []).forEach(function (it) {
        var nome = it.nome || 'Sem nome';
        if (!map[nome]) map[nome] = { nome: nome, receita: 0, qtd: 0 };
        map[nome].receita += Number(it.subtotal) || 0;
        map[nome].qtd += Number(it.quantidade) || 1;
      });
    });
    // custo estimado: se serviço tiver custoBase, senão 0 (margem = 100% da receita até configurar)
    (state.servicos || []).forEach(function (s) {
      if (map[s.nome] && s.custoBase != null) {
        map[s.nome].custo = (Number(s.custoBase) || 0) * map[s.nome].qtd;
      }
    });
    return Object.keys(map).map(function (k) {
      var r = map[k];
      var custo = r.custo || 0;
      var margem = r.receita - custo;
      var pct = r.receita > 0 ? Math.round((margem / r.receita) * 100) : 0;
      return { nome: r.nome, receita: r.receita, custo: custo, margem: margem, pct: pct, qtd: r.qtd };
    }).sort(function (a, b) { return b.receita - a.receita; });
  }

  function calcRentabilidadeProfissionais() {
    var map = {};
    (state.movimentos || []).forEach(function (m) {
      if (m.tipo !== 'venda') return;
      var pid = m.profissional_id || 'sem';
      if (!map[pid]) {
        var nome = m.profissional || (typeof getProfissionalNome === 'function' ? getProfissionalNome(pid) : pid);
        map[pid] = { id: pid, nome: nome, receita: 0, comissao: 0, n: 0 };
      }
      map[pid].receita += Number(m.valor) || 0;
      map[pid].comissao += Number(m.comissao_gerada) || 0;
      map[pid].n += 1;
    });
    return Object.keys(map).map(function (k) {
      var r = map[k];
      var liquido = r.receita - r.comissao;
      var pct = r.receita > 0 ? Math.round((liquido / r.receita) * 100) : 0;
      return { id: r.id, nome: r.nome, receita: r.receita, comissao: r.comissao, liquido: liquido, pct: pct, vendas: r.n };
    }).sort(function (a, b) { return b.receita - a.receita; });
  }

  // ---------- F22: Fluxo de caixa diário ----------
  function getFluxoDia(dataStr) {
    var d = dataStr || (typeof hoje === 'function' ? hoje() : '');
    var movs = (state.movimentos || []).filter(function (m) { return m.data === d; });
    var entradas = 0, saidas = 0;
    var porMetodo = {};
    var porCategoria = {};
    movs.forEach(function (m) {
      var v = Number(m.valor) || 0;
      if (m.tipo === 'venda') {
        entradas += v;
        if (m.pagamentos && Array.isArray(m.pagamentos)) {
          m.pagamentos.forEach(function (p) {
            var k = p.metodo || 'Numerário';
            porMetodo[k] = (porMetodo[k] || 0) + (Number(p.valor) || 0);
          });
        } else {
          var mp = m.metodoPagamento || 'Numerário';
          porMetodo[mp] = (porMetodo[mp] || 0) + v;
        }
      } else if (m.tipo === 'despesa') {
        saidas += v;
        var cat = m.categoria || 'outro';
        porCategoria[cat] = (porCategoria[cat] || 0) + v;
      }
    });
    return {
      data: d,
      entradas: entradas,
      saidas: saidas,
      saldo: entradas - saidas,
      porMetodo: porMetodo,
      porCategoria: porCategoria,
      movimentos: movs
    };
  }

  // ---------- F13: helpers split ----------
  function lerPagamentosSplit() {
    var box = document.getElementById('venda-split-box');
    if (!box || box.style.display === 'none') return null;
    var rows = box.querySelectorAll('.split-row');
    var list = [];
    var sum = 0;
    rows.forEach(function (row) {
      var metodo = row.querySelector('.split-metodo') ? row.querySelector('.split-metodo').value : 'Numerário';
      var valor = parseFloat(row.querySelector('.split-valor') ? row.querySelector('.split-valor').value : 0) || 0;
      if (valor > 0) {
        list.push({ metodo: metodo, valor: valor });
        sum += valor;
      }
    });
    return { list: list, sum: sum };
  }

  function totalCarrinho() {
    if (typeof cartItems === 'undefined' || !cartItems.length) return 0;
    return cartItems.reduce(function (s, i) { return s + (Number(i.subtotal) || 0); }, 0);
  }

  // ---------- UI: menu + modais ----------
  function ensureMenuItems() {
    var dd = document.getElementById('menu-dropdown');
    if (!dd || dd.querySelector('[data-bp-menu="finance"]')) return;
    var frag = document.createDocumentFragment();
    var sec = document.createElement('div');
    sec.className = 'bp-menu-section';
    sec.setAttribute('data-bp-menu', 'finance');
    sec.textContent = 'Financeiro';
    frag.appendChild(sec);
    var items = [
      { key: 'fluxo', label: 'Fluxo de caixa' },
      { key: 'rentab', label: 'Rentabilidade' },
      { key: 'meta', label: 'Meta do salão' },
      { key: 'despesas', label: 'Despesas' }
    ];
    items.forEach(function (it) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('data-bp-menu', 'finance');
      btn.setAttribute('data-bp-action', it.key);
      btn.innerHTML = '<span>' + it.label + '</span>';
      frag.appendChild(btn);
    });
    var logout = dd.querySelector('#logout-btn');
    if (logout) dd.insertBefore(frag, logout);
    else dd.appendChild(frag);
    dd.addEventListener('click', function (e) {
      var t = e.target.closest('[data-bp-action]');
      if (!t) return;
      e.stopPropagation();
      dd.style.display = 'none';
      var a = t.getAttribute('data-bp-action');
      if (a === 'fluxo') openModalFluxo();
      if (a === 'rentab') openModalRentabilidade();
      if (a === 'meta') openModalMetaSalao();
      if (a === 'despesas') openModalDespesaEnh();
    });
  }

  function ensureModalShell(id, title, eyebrow, subtitle) {
    var el = document.getElementById(id);
    if (el) {
      var t = el.querySelector('.bp-sheet-title');
      if (t && title) t.textContent = title;
      return el;
    }
    el = document.createElement('div');
    el.id = id;
    el.className = 'modal-overlay';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    var eye = eyebrow || 'BeautyPro';
    var sub = subtitle || '';
    el.innerHTML =
      '<div class="bp-sheet">' +
        '<div class="bp-sheet-handle" aria-hidden="true"></div>' +
        '<div class="bp-sheet-header">' +
          '<div class="bp-sheet-eyebrow">' + eye + '</div>' +
          '<h2 class="bp-sheet-title">' + title + '</h2>' +
          (sub ? '<p class="bp-sheet-subtitle">' + sub + '</p>' : '') +
        '</div>' +
        '<div class="bp-sheet-body" id="' + id + '-body"></div>' +
        '<div class="bp-sheet-footer">' +
          '<button type="button" class="btn btn-secondary" data-close="' + id + '">Fechar</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(el);
    el.addEventListener('click', function (e) {
      if (e.target === el || e.target.getAttribute('data-close') === id) {
        if (typeof closeModal === 'function') closeModal(id);
        else el.classList.remove('open');
      }
    });
    return el;
  }

  function openModalFluxo() {
    ensureModalShell('modal-bp-fluxo', 'Fluxo de caixa', 'Financeiro', 'Entradas, saídas e métodos do dia.');
    var body = document.getElementById('modal-bp-fluxo-body');
    var hojeStr = typeof hoje === 'function' ? hoje() : '';
    var f = getFluxoDia(hojeStr);
    var fmt = typeof fmtKz === 'function' ? fmtKz : function (v) { return v + ' Kz'; };
    var metodos = Object.keys(f.porMetodo).map(function (k) {
      return '<div class="bp-row"><div class="bp-row-main"><div class="bp-row-title">' + k + '</div></div><div class="bp-row-value">' + fmt(f.porMetodo[k]) + '</div></div>';
    }).join('') || '<div class="bp-empty">Sem entradas neste dia.</div>';
    var cats = Object.keys(f.porCategoria).map(function (k) {
      var nome = (CATEGORIAS_DESPESA.find(function (c) { return c.id === k; }) || {}).nome || k;
      return '<div class="bp-row"><div class="bp-row-main"><div class="bp-row-title">' + nome + '</div></div><div class="bp-row-value" style="color:var(--red)">' + fmt(f.porCategoria[k]) + '</div></div>';
    }).join('') || '<div class="bp-empty">Sem despesas neste dia.</div>';
    body.innerHTML =
      '<div class="bp-kpi-grid">' +
        '<div class="bp-kpi"><div class="bp-kpi-label">Entradas</div><div class="bp-kpi-value is-positive">' + fmt(f.entradas) + '</div></div>' +
        '<div class="bp-kpi"><div class="bp-kpi-label">Saídas</div><div class="bp-kpi-value is-negative">' + fmt(f.saidas) + '</div></div>' +
        '<div class="bp-kpi"><div class="bp-kpi-label">Saldo</div><div class="bp-kpi-value">' + fmt(f.saldo) + '</div></div>' +
      '</div>' +
      '<p style="font-size:.8rem;color:var(--text-muted);margin:-4px 0 12px">Referência: <strong style="color:var(--text-primary)">' + f.data + '</strong></p>' +
      '<div class="bp-section"><div class="bp-section-title">Por forma de pagamento</div>' + metodos + '</div>' +
      '<div class="bp-section"><div class="bp-section-title">Despesas por categoria</div>' + cats + '</div>';
    if (typeof openModal === 'function') openModal('modal-bp-fluxo');
    else document.getElementById('modal-bp-fluxo').classList.add('open');
  }

  function openModalRentabilidade() {
    ensureModalShell('modal-bp-rentab', 'Rentabilidade', 'Análise', 'Receita, comissões e margem.');
    var body = document.getElementById('modal-bp-rentab-body');
    var fmt = typeof fmtKz === 'function' ? fmtKz : function (v) { return v + ' Kz'; };
    var servs = calcRentabilidadeServicos().slice(0, 12);
    var profs = calcRentabilidadeProfissionais().slice(0, 12);
    var sHtml = servs.map(function (s) {
      var nome = typeof escHtml === 'function' ? escHtml(s.nome) : s.nome;
      return '<div class="bp-row"><div class="bp-row-main"><div class="bp-row-title">' + nome + '</div><div class="bp-row-meta">' + s.qtd + ' vendidos · margem ' + s.pct + '%</div></div><div class="bp-row-value">' + fmt(s.receita) + '</div></div>';
    }).join('') || '<div class="bp-empty"><strong>Sem vendas ainda</strong>Registe vendas para ver margens.</div>';
    var pHtml = profs.map(function (p) {
      var nome = typeof escHtml === 'function' ? escHtml(p.nome) : p.nome;
      return '<div class="bp-row"><div class="bp-row-main"><div class="bp-row-title">' + nome + '</div><div class="bp-row-meta">' + p.vendas + ' vendas · comissão ' + fmt(p.comissao) + ' · ' + p.pct + '% líquido</div></div><div class="bp-row-value">' + fmt(p.receita) + '</div></div>';
    }).join('') || '<div class="bp-empty"><strong>Sem dados</strong>Atribua profissionais às vendas.</div>';
    body.innerHTML =
      '<div class="bp-section" style="margin-top:0"><div class="bp-section-title">Por serviço</div>' + sHtml + '</div>' +
      '<div class="bp-section"><div class="bp-section-title">Por profissional</div>' + pHtml + '</div>';
    if (typeof openModal === 'function') openModal('modal-bp-rentab');
    else document.getElementById('modal-bp-rentab').classList.add('open');
  }

  function openModalMetaSalao() {
    ensureModalShell('modal-bp-meta', 'Meta do salão', 'Objectivos', 'Receita mensal-alvo e progresso.');
    var body = document.getElementById('modal-bp-meta-body');
    var prog = getProgressoMetaSalao();
    var meta = getMetaSalao();
    var fmt = typeof fmtKz === 'function' ? fmtKz : function (v) { return v + ' Kz'; };
    var barra = '';
    if (prog) {
      barra = '<div class="bp-progress"><div class="bp-progress-head"><span>Progresso do mês</span><span>' + fmt(prog.volume) + ' / ' + fmt(prog.meta) + ' · ' + prog.pct + '%</span></div>' +
        '<div class="bp-progress-track"><div class="bp-progress-fill" style="width:' + prog.pct + '%"></div></div></div>' +
        (prog.atingida ? '<span class="bp-badge is-green">Meta atingida</span>' : '');
    } else {
      barra = '<div class="bp-empty" style="padding:12px 0"><strong>Nenhuma meta definida</strong>Indique um valor mensal em Kz.</div>';
    }
    body.innerHTML = barra +
      '<div class="input-group" style="margin-top:16px"><label class="input-label">Meta mensal (Kz)</label>' +
      '<input type="number" id="bp-meta-salao-input" class="input-field" min="0" step="1000" value="' + (meta || '') + '" placeholder="Ex: 500000" inputmode="numeric"></div>';
    var footer = document.querySelector('#modal-bp-meta .bp-sheet-footer');
    if (footer) {
      footer.innerHTML = '<button type="button" class="btn btn-secondary" data-close="modal-bp-meta">Cancelar</button>' +
        '<button type="button" class="btn btn-primary" id="bp-meta-salao-save">Guardar meta</button>';
    }
    if (typeof openModal === 'function') openModal('modal-bp-meta');
    else document.getElementById('modal-bp-meta').classList.add('open');
    var save = document.getElementById('bp-meta-salao-save');
    if (save) {
      save.onclick = function () {
        var v = document.getElementById('bp-meta-salao-input').value;
        setMetaSalao(v);
        if (typeof toast === 'function') toast('Meta do salão actualizada', 'success');
        openModalMetaSalao();
      };
    }
  }

  function openModalDespesaEnh() {
    // Prefill enhanced fields then open existing modal-despesa
    enhanceDespesaModal();
    if (typeof openModal === 'function') openModal('modal-despesa');
  }

  // ---------- F23: enhance despesa modal ----------
  function enhanceDespesaModal() {
    var modal = document.getElementById('modal-despesa');
    if (!modal || modal.querySelector('#desp-categoria')) return;
    var valorGroup = document.getElementById('desp-valor');
    if (!valorGroup) return;
    var parent = valorGroup.closest('.input-group') || valorGroup.parentNode;
    var wrap = document.createElement('div');
    wrap.innerHTML =
      '<div class="input-group">' +
        '<label class="input-label">Categoria</label>' +
        '<select id="desp-categoria" class="input-field">' +
          CATEGORIAS_DESPESA.map(function (c) {
            return '<option value="' + c.id + '">' + c.nome + '</option>';
          }).join('') +
        '</select>' +
      '</div>' +
      '<div class="input-group">' +
        '<label class="input-label">Fornecedor (opcional)</label>' +
        '<input type="text" id="desp-fornecedor" class="input-field" placeholder="Ex: Distribuidora X">' +
      '</div>';
    parent.parentNode.insertBefore(wrap, parent.nextSibling);
  }

  // ---------- F13: split UI no modal venda ----------
  function enhanceVendaPagamento() {
    var sel = document.getElementById('venda-pagamento');
    if (!sel || document.getElementById('venda-split-box')) return;
    var opt = document.createElement('option');
    opt.value = '__split__';
    opt.textContent = 'Pagamento dividido';
    sel.appendChild(opt);
    var box = document.createElement('div');
    box.id = 'venda-split-box';
    box.style.display = 'none';
    box.style.marginTop = '8px';
    box.innerHTML =
      '<div class="split-row" style="display:flex;gap:8px;margin-bottom:6px;">' +
        '<select class="input-field split-metodo" style="flex:1;"><option>Numerário</option><option>Multicaixa Express</option><option>Transferência Bancária</option><option>Cartão</option></select>' +
        '<input type="number" class="input-field split-valor" placeholder="Valor" min="0" step="100" style="width:110px;">' +
      '</div>' +
      '<div class="split-row" style="display:flex;gap:8px;margin-bottom:6px;">' +
        '<select class="input-field split-metodo" style="flex:1;"><option>Numerário</option><option>Multicaixa Express</option><option>Transferência Bancária</option><option>Cartão</option></select>' +
        '<input type="number" class="input-field split-valor" placeholder="Valor" min="0" step="100" style="width:110px;">' +
      '</div>' +
      '<p id="split-hint" style="font-size:.75rem;color:var(--text-muted);margin:0;">A soma deve igualar o total da venda.</p>';
    sel.parentNode.appendChild(box);
    sel.addEventListener('change', function () {
      box.style.display = sel.value === '__split__' ? 'block' : 'none';
    });
  }

  // Hook despesa save to include categoria
  function hookDespesaSave() {
    var btn = document.getElementById('modal-despesa-save');
    if (!btn || btn.dataset.bpHooked) return;
    btn.dataset.bpHooked = '1';
    var orig = btn.onclick;
    btn.onclick = async function (e) {
      enhanceDespesaModal();
      var desc = (document.getElementById('desp-desc') || {}).value;
      var valor = parseFloat((document.getElementById('desp-valor') || {}).value);
      var cat = (document.getElementById('desp-categoria') || {}).value || 'outro';
      var forn = (document.getElementById('desp-fornecedor') || {}).value || '';
      if (!desc || !valor || valor <= 0) {
        if (typeof toast === 'function') toast('Preencha descrição e valor válido', 'error');
        return;
      }
      if (typeof addMovimento === 'function') {
        await addMovimento({
          tipo: 'despesa',
          descricao: desc,
          valor: valor,
          categoria: cat,
          fornecedor: forn
        });
      }
      if (typeof closeModal === 'function') closeModal('modal-despesa');
      var d1 = document.getElementById('desp-desc'); if (d1) d1.value = '';
      var d2 = document.getElementById('desp-valor'); if (d2) d2.value = '';
      var d3 = document.getElementById('desp-fornecedor'); if (d3) d3.value = '';
      if (typeof toast === 'function') toast('Despesa registada', 'success');
      if (typeof renderCaixa === 'function') renderCaixa();
      if (typeof updateUI === 'function') updateUI();
    };
  }

  function init() {
    try {
      ensureMenuItems();
      enhanceDespesaModal();
      enhanceVendaPagamento();
      hookDespesaSave();
    } catch (e) {
      console.warn('[finance-fase1-extra]', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 100); });
  } else {
    setTimeout(init, 100);
  }
  // re-init after login UI appears
  setTimeout(init, 1500);
  setTimeout(init, 4000);

  window.BPFinance = {
    getMetaSalao: getMetaSalao,
    setMetaSalao: setMetaSalao,
    getProgressoMetaSalao: getProgressoMetaSalao,
    getFluxoDia: getFluxoDia,
    calcRentabilidadeServicos: calcRentabilidadeServicos,
    calcRentabilidadeProfissionais: calcRentabilidadeProfissionais,
    lerPagamentosSplit: lerPagamentosSplit,
    totalCarrinho: totalCarrinho,
    CATEGORIAS_DESPESA: CATEGORIAS_DESPESA
  };
})();
