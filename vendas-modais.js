// ====================================================================
//  vendas-modais.js — extraído do app.js (Fase C da modularização)
//  Conteúdo: Sparkline, detalhe/recibo de venda, carrinho inteligente (agrupamento, +/- , persistência)
//  Linhas originais: 1143-1410
//  Carregar depois de core-*.js, db-indexeddb.js, sync-*.js, auth-supabase.js
// ====================================================================

let vendaAtual = null;

// ====================================================================
//  SPARKLINE — CORRIGIDA (funcional, robusta, com fallback)
// ====================================================================
function desenharSparkline(canvasId, dados, cor = '#D4AF37') {
  try {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      // Fallback: se o canvas não existir, cria um temporário
      console.warn('[Sparkline] Canvas não encontrado:', canvasId);
      return;
    }

    // Se o canvas não estiver visível (display:none), força um tamanho mínimo
    const rect = canvas.getBoundingClientRect();
    const cssWidth = rect.width || 84;
    const cssHeight = rect.height || 28;
    
    // Redimensionar com devicePixelRatio
    const dpr = window.devicePixelRatio || 1;
    const bufferW = Math.round(cssWidth * dpr);
    const bufferH = Math.round(cssHeight * dpr);
    
    if (canvas.width !== bufferW || canvas.height !== bufferH) {
      canvas.width = bufferW;
      canvas.height = bufferH;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const width = cssWidth;
    const height = cssHeight;

    ctx.clearRect(0, 0, width, height);

    // Se não há dados válidos
    if (!dados || !Array.isArray(dados) || dados.length < 2) {
      ctx.beginPath();
      ctx.moveTo(0, height - 4);
      ctx.lineTo(width, height - 4);
      ctx.strokeStyle = cor;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.15;
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#5C564E';
      ctx.font = '6px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('Sem dados', width/2, height - 2);
      return;
    }

    // Verifica se todos os valores são zero
    const todosZero = dados.every(v => v === 0);
    if (todosZero) {
      ctx.beginPath();
      ctx.moveTo(0, height - 4);
      ctx.lineTo(width, height - 4);
      ctx.strokeStyle = cor;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.25;
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = cor;
      ctx.font = '6px Inter';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText('0 Kz', width - 2, height - 2);
      return;
    }

    const min = Math.min(...dados, 0);
    const max = Math.max(...dados, 10);
    const range = max - min || 1;
    const padding = 3;
    const usableHeight = height - padding * 2;

    // Linha
    ctx.beginPath();
    for (let i = 0; i < dados.length; i++) {
      const x = (i / (dados.length - 1)) * width;
      const y = height - padding - ((dados[i] - min) / range) * usableHeight;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.strokeStyle = cor;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();

    // Ponto final
    const lastX = width;
    const lastY = height - padding - ((dados[dados.length - 1] - min) / range) * usableHeight;
    ctx.beginPath();
    ctx.arc(lastX, lastY, 2, 0, Math.PI * 2);
    ctx.fillStyle = cor;
    ctx.fill();

    // Seta
    if (dados.length >= 2) {
      const ultimoValor = dados[dados.length - 1];
      const penultimoValor = dados[dados.length - 2];
      const direcao = ultimoValor >= penultimoValor ? 1 : -1;
      const xSeta = lastX;
      const ySeta = lastY;
      const tamanhoSeta = 5;
      ctx.beginPath();
      if (direcao > 0) {
        ctx.moveTo(xSeta - tamanhoSeta, ySeta + tamanhoSeta);
        ctx.lineTo(xSeta, ySeta - tamanhoSeta);
        ctx.lineTo(xSeta + tamanhoSeta, ySeta + tamanhoSeta);
      } else {
        ctx.moveTo(xSeta - tamanhoSeta, ySeta - tamanhoSeta);
        ctx.lineTo(xSeta, ySeta + tamanhoSeta);
        ctx.lineTo(xSeta + tamanhoSeta, ySeta - tamanhoSeta);
      }
      ctx.closePath();
      ctx.fillStyle = cor;
      ctx.fill();
    }
  } catch (e) {
    // Fallback silencioso: se algo falhar, a sparkline não quebra a UI
    console.warn('[Sparkline] Erro ao desenhar:', e);
  }
}

// ====================================================================
//  DETALHE / RECIBO DE VENDA
// ====================================================================
function abrirDetalheVenda(id) {
  const venda = state.movimentos.find(m => m.id === id && m.tipo === 'venda');
  if (!venda) { toast('Venda não encontrada', 'error'); return; }
  vendaAtual = venda;
  const nomeProf = typeof getProfissionalNome === 'function'
    ? getProfissionalNome(venda.profissional_id)
    : (venda.profissional || '—');
  const mp = venda.metodoPagamento || 'Numerário';
  const ref = String(venda.reciboNum || venda.id || '').slice(0, 8).toUpperCase();

  let itensHtml = '';
  if (venda.itens && venda.itens.length > 0) {
    itensHtml =
      '<div class="bp-view-section-title">Itens</div>' +
      '<div class="bp-view-dl">' +
      '<div class="detalhe-itens-header" style="padding:10px 14px;border-bottom:1px solid var(--border-soft);">' +
      '<span>Descrição</span><span style="text-align:right">Qtd</span><span style="text-align:right">Unit.</span><span style="text-align:right">Total</span></div>' +
      venda.itens.map(function (item) {
        return (
          '<div class="detalhe-item-row" style="padding-left:14px;padding-right:14px;">' +
          '<span class="desc">' + escHtml(item.nome) + '</span>' +
          '<span class="qty">' + (item.quantidade || 1) + '</span>' +
          '<span class="pu">' + fmtKz(item.precoUnit != null ? item.precoUnit : item.subtotal) + '</span>' +
          '<span class="sub">' + fmtKz(item.subtotal) + '</span></div>'
        );
      }).join('') +
      '</div>';
  } else {
    itensHtml = '<p class="bp-view-value--muted" style="font-size:.85rem;margin:0 0 12px;">Sem linhas de item nesta venda.</p>';
  }

  const box = document.getElementById('detalhe-venda-conteudo');
  if (box) {
    box.innerHTML =
      '<div class="bp-view-dl">' +
      '<div class="bp-view-row"><span class="bp-view-label">Cliente</span><span class="bp-view-value">' + escHtml(venda.cliente || 'Avulso') + '</span></div>' +
      '<div class="bp-view-row"><span class="bp-view-label">Profissional</span><span class="bp-view-value">' + escHtml(nomeProf || '—') + '</span></div>' +
      '<div class="bp-view-row"><span class="bp-view-label">Quando</span><span class="bp-view-value">' + escHtml(String(venda.data || '')) + ' · ' + escHtml(String(venda.hora || '').slice(0, 5)) + '</span></div>' +
      '<div class="bp-view-row"><span class="bp-view-label">Pagamento</span><span class="bp-view-value"><span class="pagamento-badge">' + escHtml(mp) + '</span></span></div>' +
      '</div>' +
      itensHtml +
      '<div class="bp-view-total"><span class="bp-view-label">Total</span><span class="bp-view-value">' + fmtKz(Number(venda.valor) || 0) + '</span></div>';
  }
  const tit = document.getElementById('detalhe-venda-titulo');
  if (tit) tit.textContent = ref ? ('Ref. ' + ref) : 'Detalhe da venda';
  openModal('modal-detalhe-venda');
}

function imprimirRecibo(venda) {
  if (!venda) { toast('Nenhuma venda seleccionada', 'error'); return; }
  const el = document.getElementById('recibo-print');
  if (!el) {
    toast('Erro: elemento de impressão não encontrado', 'error');
    return;
  }
  const storeName = state.config.storeName || 'BeautyPro';
  const num = venda.reciboNum || nextReciboNum();
  const itensHtml = venda.itens && venda.itens.length > 0 ?
    `<div class="r-th"><span class="r-th-desc">SERVICO</span><span class="r-th-qty">QT</span><span class="r-th-sub">TOTAL</span></div>
     ${venda.itens.map(i => `<div class="r-item"><span class="r-item-name">${escHtml(i.nome)}</span><span class="r-item-qty">x${i.quantidade}</span><span class="r-item-sub">${fmtKz(i.subtotal)}</span></div>`).join('')}` :
    '<div style="font-size:7pt;">Sem itens</div>';
  const nomeProf = getProfissionalNome(venda.profissional_id);
  el.innerHTML = `
    <div class="r-store">${escHtml(storeName)}</div>
    <div class="r-sub">Luanda, Angola</div>
    <div class="r-num">Recibo N.º ${num}</div>
    <div class="r-num">${venda.data} &nbsp; ${venda.hora}</div>
    <hr class="r-div">
    <div class="r-meta"><b>CLIENTE: </b>${escHtml(venda.cliente || 'Anonimo')}</div>
    <div class="r-meta"><b>PROF.: </b>${escHtml(nomeProf)}</div>
    <hr class="r-div">
    ${itensHtml}
    <hr class="r-div">
    <div class="r-total">TOTAL: ${fmtKz(venda.valor)}</div>
    <div class="r-pag">Pag.: ${escHtml(venda.metodoPagamento || 'Numerario')}</div>
    <hr class="r-div">
    <div class="r-footer"><strong>Obrigado pela preferencia!</strong>Volte sempre ao ${escHtml(storeName)}</div>`;
  requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
}

// ====================================================================
//  CARRINHO INTELIGENTE (agrupamento, +/- , persistência) — SEM PROFISSIONAL POR ITEM
// ====================================================================

/** Microinterações do carrinho (respeita prefers-reduced-motion). */
let _cartAnim = { type: null, idx: -1, nome: null };
function _cartMotionOk() {
  try {
    return !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  } catch (e) { return true; }
}
function _pulseCartTotal() {
  if (!_cartMotionOk()) return;
  const el = document.querySelector('#cart-total-area .ct-val');
  if (!el) return;
  el.classList.remove('ct-val--pulse');
  void el.offsetWidth;
  el.classList.add('ct-val--pulse');
  setTimeout(function () { el.classList.remove('ct-val--pulse'); }, 280);
}
function _bumpEl(row, sel) {
  if (!_cartMotionOk() || !row) return;
  const el = row.querySelector(sel);
  if (!el) return;
  el.classList.remove('is-bump');
  void el.offsetWidth;
  el.classList.add('is-bump');
  setTimeout(function () { el.classList.remove('is-bump'); }, 220);
}

let cartItems = [];
const CART_STORAGE_KEY = 'bp_cart_items';

// --- Persistência ---
function saveCartToStorage() {
  try { localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems)); } catch (e) {}
}

function loadCartFromStorage() {
  try {
    const data = localStorage.getItem(CART_STORAGE_KEY);
    if (data) {
      cartItems = JSON.parse(data);
      renderCart();
    }
  } catch (e) { cartItems = []; }
}

// --- Renderização do carrinho com botões + / - e total detalhado ---
function renderCart() {
  const list = document.getElementById('cart-items-list');
  const totalArea = document.getElementById('cart-total-area');
  if (!list) return;

  if (cartItems.length === 0) {
    list.innerHTML = `
      <div class="venda-cart-empty">
        <p class="venda-cart-empty-title">Nenhum item ainda</p>
        <p class="venda-cart-empty-hint">Escolha um serviço abaixo e toque em «Adicionar à venda».</p>
      </div>`;
    if (totalArea) {
      totalArea.innerHTML = '';
      totalArea.hidden = true;
    }
    updateVendaSaveButton();
    return;
  }

  list.innerHTML = cartItems.map((item, idx) => {
    let cls = 'cart-item-row';
    if (_cartAnim.type === 'add' && (
      (_cartAnim.idx === idx) || (_cartAnim.nome && item.nome === _cartAnim.nome)
    )) cls += ' adding';
    if (_cartAnim.type === 'qty' && _cartAnim.idx === idx) cls += ' is-qty-flash';
    return `
    <div class="${cls}" data-idx="${idx}" data-nome="${escHtml(item.nome)}">
      <span class="ci-name">${escHtml(item.nome)}</span>
      <span class="ci-qty-controls">
        <button type="button" class="qty-btn" data-idx="${idx}" data-action="decrement" aria-label="Diminuir quantidade">−</button>
        <span class="qty-number">${item.quantidade}</span>
        <button type="button" class="qty-btn" data-idx="${idx}" data-action="increment" aria-label="Aumentar quantidade">+</button>
      </span>
      <span class="ci-val">${fmtKz(item.subtotal)}</span>
      <button type="button" class="ci-del" data-idx="${idx}" aria-label="Remover item">✕</button>
    </div>`;
  }).join('');
  // Limpar flags após paint + micro-bumps
  const animType = _cartAnim.type;
  const animIdx = _cartAnim.idx;
  _cartAnim = { type: null, idx: -1, nome: null };
  if (animType && _cartMotionOk()) {
    requestAnimationFrame(function () {
      const row = list.querySelector('.cart-item-row[data-idx="' + animIdx + '"]') ||
        list.querySelector('.cart-item-row.adding') ||
        list.querySelector('.cart-item-row.is-qty-flash');
      if (row && (animType === 'qty' || animType === 'add')) {
        _bumpEl(row, '.qty-number');
        _bumpEl(row, '.ci-val');
      }
      _pulseCartTotal();
      list.querySelectorAll('.cart-item-row.adding').forEach(function (r) {
        r.addEventListener('animationend', function () { r.classList.remove('adding'); }, { once: true });
      });
      list.querySelectorAll('.cart-item-row.is-qty-flash').forEach(function (r) {
        setTimeout(function () { r.classList.remove('is-qty-flash'); }, 400);
      });
    });
  } else {
    _pulseCartTotal();
  }

  const total = cartItems.reduce((s, i) => s + (Number(i.subtotal) || 0), 0);
  const totalItems = cartItems.reduce((s, i) => s + (Number(i.quantidade) || 0), 0);
  if (totalArea) {
    totalArea.hidden = false;
    totalArea.innerHTML = `
      <div class="cart-total-row">
        <span class="ct-label">${totalItems === 1 ? '1 item' : totalItems + ' itens'}</span>
        <span class="ct-val">${fmtKz(total)}</span>
      </div>
    `;
  }

  saveCartToStorage();
  updateVendaSaveButton();
}

/** CTA do rodapé: desactivado se vazio; mostra o valor a cobrar. */
function updateVendaSaveButton() {
  const btn = document.getElementById('modal-venda-save');
  if (!btn) return;
  const total = (cartItems || []).reduce((s, i) => s + (Number(i.subtotal) || 0), 0);
  const n = (cartItems || []).length;
  if (n === 0 || total <= 0) {
    btn.disabled = true;
    btn.textContent = 'Cobrar';
    btn.setAttribute('aria-disabled', 'true');
  } else {
    btn.disabled = false;
    btn.textContent = 'Cobrar · ' + (typeof fmtKz === 'function' ? fmtKz(total) : total + ' Kz');
    btn.removeAttribute('aria-disabled');
  }
}

// --- Ajustar quantidade ---
function adjustQuantity(idx, delta) {
  if (idx < 0 || idx >= cartItems.length) return;
  const item = cartItems[idx];
  const newQty = item.quantidade + delta;
  if (newQty <= 0) {
    removeItemFromCart(idx, true);
    return;
  }
  item.quantidade = newQty;
  item.subtotal = item.quantidade * item.precoUnit;
  _cartAnim = { type: 'qty', idx: idx, nome: item.nome };
  renderCart();
}

// --- Remover item (com confirmação) ---
async function removeItemFromCart(idx, skipConfirm) {
  if (idx < 0 || idx >= cartItems.length) return;
  const item = cartItems[idx];
  if (!skipConfirm && item.quantidade > 1) {
    let choice = true;
    if (typeof showConfirmModal === 'function') {
      choice = await showConfirmModal(
        'Remover item?',
        '"' + (item.nome || 'Item') + '" tem ' + item.quantidade + ' unidades. Remover todas da venda?',
        true
      );
    } else {
      choice = confirm('"' + (item.nome || '') + '" tem ' + item.quantidade + ' unidades. Remover todas?');
    }
    if (!choice) {
      // Deixar só 1 unidade em vez de forçar decisão binária agressiva
      item.quantidade = 1;
      item.subtotal = item.precoUnit;
      _cartAnim = { type: 'qty', idx: idx, nome: item.nome };
      renderCart();
      return;
    }
  }

  const list = document.getElementById('cart-items-list');
  const row = list && list.querySelector('.cart-item-row[data-idx="' + idx + '"]');
  const finish = function () {
    cartItems.splice(idx, 1);
    renderCart();
  };
  if (row && _cartMotionOk()) {
    row.classList.add('removing');
    let done = false;
    const once = function () {
      if (done) return;
      done = true;
      finish();
    };
    row.addEventListener('animationend', once, { once: true });
    setTimeout(once, 320); // fallback se animationend não disparar
  } else {
    finish();
  }
}

// --- Função central de adição ao carrinho (sem profissional) ---
function addToCart(nome, valor) {
  const existingIndex = cartItems.findIndex(item => item.nome === nome);
  if (existingIndex !== -1) {
    const existing = cartItems[existingIndex];
    if (existing.precoUnit !== valor) {
      const choice = confirm(
        `"${escHtml(nome||"")}" já está no carrinho com preço ${fmtKz(existing.precoUnit)}.\n` +
        `Deseja atualizar para ${fmtKz(valor)}? (Cancelar = manter os dois separados)`
      );
      if (choice) {
        existing.precoUnit = valor;
        existing.subtotal = existing.quantidade * valor;
        _cartAnim = { type: 'qty', idx: existingIndex, nome: existing.nome };
        renderCart();
        return;
      } else {
        cartItems.push({
          nome: nome + ' (' + fmtKz(valor) + ')',
          quantidade: 1,
          precoUnit: valor,
          subtotal: valor
        });
        _cartAnim = { type: 'add', idx: cartItems.length - 1, nome: cartItems[cartItems.length - 1].nome };
        renderCart();
        return;
      }
    }
    existing.quantidade += 1;
    existing.subtotal = existing.quantidade * existing.precoUnit;
    _cartAnim = { type: 'qty', idx: existingIndex, nome: existing.nome };
    renderCart();
    return;
  }

  cartItems.push({
    nome,
    quantidade: 1,
    precoUnit: valor,
    subtotal: valor
  });
  _cartAnim = { type: 'add', idx: cartItems.length - 1, nome: nome };
  renderCart();
}

// --- Event listeners (delegação para botões do carrinho) ---
document.addEventListener('click', function(e) {
  const qtyBtn = e.target.closest('.qty-btn');
  if (qtyBtn) {
    e.preventDefault();
    const idx = parseInt(qtyBtn.dataset.idx);
    const action = qtyBtn.dataset.action;
    if (action === 'increment') adjustQuantity(idx, 1);
    else if (action === 'decrement') adjustQuantity(idx, -1);
    return;
  }

  const delBtn = e.target.closest('.ci-del');
  if (delBtn) {
    e.preventDefault();
    const idx = parseInt(delBtn.dataset.idx);
    removeItemFromCart(idx);
    return;
  }
});

// --- Função de abertura do modal (restaurar carrinho) ---
function openVendaModal() {
  try {
    loadCartFromStorage();
    const clientSel = document.getElementById('venda-cliente');
    if (clientSel) {
      const opts = ['<option value="">Cliente avulso (sem ficha)</option>']
        .concat((state.clientes || []).map(c =>
          `<option value="${escHtml(c.nome)}">${escHtml(c.nome)}</option>`
        ));
      clientSel.innerHTML = opts.join('');
    }
    if (typeof populateVendaSelects === 'function') populateVendaSelects();
    const pag = document.getElementById('venda-pagamento');
    if (pag && !pag.value) pag.value = 'Numerário';
    renderCart();
    updateVendaSaveButton();
    if (typeof openModal === 'function') openModal('modal-venda');
    else {
      const modal = document.getElementById('modal-venda');
      if (modal) { modal.classList.add('open'); modal.style.display = 'flex'; }
    }
    setTimeout(function () {
      const el = document.getElementById(cartItems.length ? 'venda-pagamento' : 'ci-servico-sel');
      if (el && typeof el.focus === 'function') try { el.focus(); } catch (e) {}
    }, 120);
  } catch (err) {
    console.error('[openVendaModal]', err);
    if (typeof toast === 'function') toast('Não foi possível abrir a venda', 'error');
  }
}

// --- Limpar carrinho (após venda ou cancelamento) ---
function clearCart() {
  cartItems = [];
  localStorage.removeItem(CART_STORAGE_KEY);
  renderCart();
}

// --- Expor funções globalmente (para outros ficheiros) ---
window.addToCart = addToCart;
window.clearCart = clearCart;
window.loadCartFromStorage = loadCartFromStorage;
window.saveCartToStorage = saveCartToStorage;

// ====================================================================
//  SERVIÇO MODAL
// ====================================================================
function _servicoProfSelected(selected, p) {
  const arr = selected || [];
  return arr.some(function (x) {
    return x === p.id || x === p.nome || String(x) === String(p.id);
  });
}

function renderServicoProfissionais(selected = []) {
  const container = document.getElementById('servico-profissionais-container');
  if (!container) return;
  const activos = (state.profissionais || []).filter(function (p) {
    return typeof isProfissionalAtivo === 'function' ? isProfissionalAtivo(p) : (p.ativo !== false);
  });
  if (!activos.length) {
    container.innerHTML = '<span style="color:var(--text-muted);font-size:.75rem;">Nenhum profissional activo</span>';
    return;
  }
  container.innerHTML = activos.map(p => {
    const checked = _servicoProfSelected(selected, p) ? ' checked' : '';
    return (
      '<label class="bp-chip-check">' +
      '<input type="checkbox" value="' + escHtml(p.id) + '" data-nome="' + escHtml(p.nome) + '"' + checked + '>' +
      escHtml(p.nome) +
      '</label>'
    );
  }).join('');
}

/** Preferência: guarda nomes legíveis + ids resolvíveis no futuro via data-nome */
function getSelectedProfissionais() {
  const container = document.getElementById('servico-profissionais-container');
  if (!container) return [];
  const checks = container.querySelectorAll('input[type="checkbox"]:checked');
  return Array.from(checks).map(function (cb) {
    // Guardar nome para compatibilidade com dados legados e seed
    return cb.getAttribute('data-nome') || cb.value;
  }).filter(Boolean);
}

function setServicoModalMode(mode) {
  const modal = document.getElementById('modal-servico');
  const sheet = document.getElementById('modal-servico-sheet');
  const view = document.getElementById('servico-view-panel');
  const form = document.getElementById('servico-form-panel');
  if (modal) modal.setAttribute('data-mode', mode);
  if (sheet) sheet.classList.toggle('modal-sheet--view', mode === 'view');
  if (view) view.hidden = mode !== 'view';
  if (form) form.hidden = mode !== 'edit';
}

function _labelProfsServico(arr) {
  const list = arr || [];
  if (!list.length) return 'Toda a equipa';
  return list.map(function (x) {
    const byId = (state.profissionais || []).find(function (p) { return p.id === x; });
    return byId ? byId.nome : x;
  }).join(', ');
}

function abrirDetalheServicoView(id) {
  const s = (state.servicos || []).find(function (x) { return x.id === id; });
  if (!s) return;
  setServicoModalMode('view');
  const title = document.getElementById('servico-modal-title');
  if (title) title.textContent = 'Ficha do serviço';
  const idInput = document.getElementById('servico-id');
  if (idInput) idInput.value = id;
  const dur = Number(s.duracao || s.duracaoMin || s.minutos || 60) || 60;
  const body = document.getElementById('servico-view-body');
  if (body) {
    body.innerHTML =
      '<div class="bp-view-hero">' +
      '<div class="bp-view-hero-av" style="font-size:0.75rem;letter-spacing:0.02em;">SRV</div>' +
      '<div><div class="bp-view-hero-name">' + escHtml(s.nome || 'Serviço') + '</div>' +
      '<div class="bp-view-hero-meta">' + fmtKz(Number(s.precoBase) || 0) + ' · ' + dur + ' min</div></div></div>' +
      '<div class="bp-view-dl">' +
      '<div class="bp-view-row"><span class="bp-view-label">Nome</span><span class="bp-view-value">' + escHtml(s.nome || '—') + '</span></div>' +
      '<div class="bp-view-row"><span class="bp-view-label">Preço</span><span class="bp-view-value">' + fmtKz(Number(s.precoBase) || 0) + '</span></div>' +
      '<div class="bp-view-row"><span class="bp-view-label">Duração</span><span class="bp-view-value">' + dur + ' min</span></div>' +
      '<div class="bp-view-row"><span class="bp-view-label">Profissionais</span><span class="bp-view-value">' + escHtml(_labelProfsServico(s.profissionais)) + '</span></div>' +
      '</div>';
  }
  openModal('modal-servico');
}

function openServicoModal(id = null) {
  setServicoModalMode('edit');
  const title = document.getElementById('servico-modal-title');
  const nomeInput = document.getElementById('servico-nome');
  const precoInput = document.getElementById('servico-preco');
  const durInput = document.getElementById('servico-duracao');
  const idInput = document.getElementById('servico-id');
  if (id) {
    const serv = state.servicos.find(s => s.id === id);
    if (!serv) return;
    if (title) title.textContent = 'Editar serviço';
    if (nomeInput) nomeInput.value = serv.nome || '';
    if (precoInput) precoInput.value = serv.precoBase != null ? serv.precoBase : '';
    if (durInput) durInput.value = Number(serv.duracao || serv.duracaoMin || serv.minutos || 60) || 60;
    if (idInput) idInput.value = id;
    renderServicoProfissionais(serv.profissionais || []);
  } else {
    if (title) title.textContent = 'Novo serviço';
    if (nomeInput) nomeInput.value = '';
    if (precoInput) precoInput.value = '';
    if (durInput) durInput.value = '60';
    if (idInput) idInput.value = '';
    renderServicoProfissionais([]);
  }
  openModal('modal-servico');
}

window.abrirDetalheServicoView = abrirDetalheServicoView;
window.openServicoModal = openServicoModal;
window.setServicoModalMode = setServicoModalMode;
