// ====================================================================
//  eventos-cadastros.js — extraído do app.js (Fase C da modularização)
//  Conteúdo: Eventos: login/menu/logout, nova venda, agenda, clientes e profissionais
//  Linhas originais: 1684-1876
//  Carregar depois de core-*.js, db-indexeddb.js, sync-*.js, auth-supabase.js
// ====================================================================
document.getElementById('signup-link')?.addEventListener('click', (e) => {
  e.preventDefault();
  toast('Peça ao administrador para criar a sua conta.', 'warning');
});

// Menu hambúrguer do header (substitui o antigo botão de logout direto)
document.getElementById('menu-btn')?.addEventListener('click', function(e) {
  e.stopPropagation();
  const dropdown = document.getElementById('menu-dropdown');
  const aberto = dropdown.style.display === 'block';
  dropdown.style.display = aberto ? 'none' : 'block';
  this.setAttribute('aria-expanded', aberto ? 'false' : 'true');
});
document.addEventListener('click', function(e) {
  const dropdown = document.getElementById('menu-dropdown');
  const menuBtn = document.getElementById('menu-btn');
  if (dropdown && dropdown.style.display === 'block' && !dropdown.contains(e.target) && e.target !== menuBtn) {
    dropdown.style.display = 'none';
    menuBtn?.setAttribute('aria-expanded', 'false');
  }
});

document.getElementById('logout-btn')?.addEventListener('click', async function() {
  var dd = document.getElementById('menu-dropdown');
  if (dd) dd.style.display = 'none';
  logoutVoluntarioEmCurso = true;
  const confirmed = await showConfirmModal('Sair da conta?', 'Vais terminar a sessão neste dispositivo. Os dados do salão continuam guardados; basta iniciares sessão outra vez para continuares.', false, { confirmLabel: 'Sair', cancelLabel: 'Cancelar', variant: 'quiet', confirmTone: 'danger' });
  if (!confirmed) {
    logoutVoluntarioEmCurso = false;
    return;
  }
  // ET4.3: limpar flags de init BP* antes do reload (troca de conta / permissões)
  try {
    ['__bpFinanceInitDone','__bpOpsInitDone','__bpGestaoInitDone','__bpEquipaInitDone','__bpMarketingInitDone','__bpMediaInitDone'].forEach(function (k) {
      try { delete window[k]; } catch (_) { window[k] = false; }
    });
  } catch (_) {}
  if (typeof bpClearSessionLocal === 'function') bpClearSessionLocal();
  try { localStorage.removeItem('bp_user_role'); } catch (_) {}
  try { await supabaseClient.auth.signOut(); } catch (_) {}
  location.reload();
});

document.getElementById('nova-venda-hero-btn').addEventListener('click', openVendaModal);

document.getElementById('fab-agendar').addEventListener('click', () => {
  const sel = document.getElementById('agenda-cliente');
  sel.innerHTML = '<option value="">Selecionar cliente</option>' + state.clientes.map(c =>
    `<option value="${escHtml(c.nome)}">${escHtml(c.nome)}</option>`).join('');
  populateAgendaSelects();
  const now = new Date();
  const isoNow = now.toISOString().slice(0, 16);
  const dtInput = document.getElementById('agenda-datetime');
  dtInput.value = isoNow;
  dtInput.min = isoNow;
  const editEl = document.getElementById('agenda-edit-id');
  if (editEl) editEl.value = '';
  const title = document.getElementById('agenda-title');
  if (title) title.textContent = 'Novo Agendamento';
  const saveBtn = document.getElementById('modal-agenda-save');
  if (saveBtn) saveBtn.textContent = 'Agendar';
  openModal('modal-agenda');
});

// CORREÇÃO: modal-agenda-save separa ID e nome do profissional
document.getElementById('modal-agenda-save').addEventListener('click', async () => {
  const editId = (document.getElementById('agenda-edit-id') || {}).value || '';
  const cliente = document.getElementById('agenda-cliente').value;
  const servico = document.getElementById('agenda-servico').value;
  const profissionalId = document.getElementById('agenda-profissional').value;
  const datetime = document.getElementById('agenda-datetime').value;
  const preco = parseFloat(document.getElementById('agenda-preco').value);
  if (!cliente || !servico || !datetime) { toast('Preenche os campos obrigatórios.', 'warning'); return; }
  if (!profissionalId) { toast('Selecciona um profissional.', 'warning'); return; }
  if (isNaN(preco) || preco <= 0) { toast('Insira um preço válido', 'error'); return; }
  if (!datetime.includes('T')) { toast('Data e hora inválidas', 'error'); return; }
  const data = datetime.split('T')[0];
  const hora = datetime.split('T')[1].slice(0, 5);
  const profObj = state.profissionais.find(p => p.id === profissionalId);
  const profissionalNome = profObj ? profObj.nome : '';
  let clienteId = null;
  if (typeof resolverClienteIdPorNome === 'function') clienteId = resolverClienteIdPorNome(cliente);
  else {
    const hit = (state.clientes || []).find(c => c.nome === cliente);
    if (hit) clienteId = hit.id;
  }
  const payload = {
    cliente,
    cliente_id: clienteId,
    servico,
    profissional: profissionalNome,
    profissional_id: profissionalId,
    data,
    hora,
    preco
  };
  let result;
  if (editId) {
    result = await updateAgendamento(editId, payload);
    if (result) {
      toast('Agendamento actualizado.', 'success');
      closeModal('modal-agenda');
      document.getElementById('agenda-edit-id').value = '';
    }
  } else {
    result = await addAgendamento(payload);
    if (result) closeModal('modal-agenda');
  }
});

/** Abre o modal de agenda em modo edição / reagendar */
function abrirReagendarAgendamento(id) {
  const ag = (state.agendamentos || []).find(a => a.id === id);
  if (!ag) return;
  const st = String(ag.status || 'agendado').toLowerCase();
  if (st !== 'agendado') {
    toast('Só é possível reagendar marcações activas.', 'warning');
    return;
  }
  populateAgendaSelects();
  const title = document.getElementById('agenda-title');
  if (title) title.textContent = 'Reagendar';
  const editEl = document.getElementById('agenda-edit-id');
  if (editEl) editEl.value = id;
  const cli = document.getElementById('agenda-cliente');
  const srv = document.getElementById('agenda-servico');
  const prof = document.getElementById('agenda-profissional');
  const dt = document.getElementById('agenda-datetime');
  const preco = document.getElementById('agenda-preco');
  if (cli) cli.value = ag.cliente || '';
  if (srv) srv.value = ag.servico || '';
  if (prof) prof.value = ag.profissional_id || '';
  if (preco) preco.value = ag.preco != null ? ag.preco : '';
  if (dt) {
    const h = String(ag.hora || '00:00').slice(0, 5);
    dt.value = (ag.data || '') + 'T' + h;
    const now = new Date();
    dt.min = now.toISOString().slice(0, 16);
  }
  const saveBtn = document.getElementById('modal-agenda-save');
  if (saveBtn) saveBtn.textContent = 'Guardar alterações';
  openModal('modal-agenda');
}
window.abrirReagendarAgendamento = abrirReagendarAgendamento;


document.getElementById('modal-agenda-cancel').addEventListener('click', () => closeModal('modal-agenda'));

// Cliente rápido
document.getElementById('agenda-add-cliente-rapido').addEventListener('click', () => {
  closeModal('modal-agenda');
  document.getElementById('cliente-rapido-nome').value = '';
  document.getElementById('cliente-rapido-telefone').value = '';
  openModal('modal-cliente-rapido');
});

document.getElementById('modal-cliente-rapido-save').addEventListener('click', async () => {
  const nome = document.getElementById('cliente-rapido-nome').value.trim();
  const telefone = document.getElementById('cliente-rapido-telefone').value.trim();
  if (!nome) { toast('Introduz o nome.', 'warning'); return; }
  const result = await addCliente({ nome, telefone, notas: '' });
  if (result) {
    try {
      if (window.BPMedia && BPMedia.takePendingClienteFoto) {
        var fQ = BPMedia.takePendingClienteFoto();
        if (fQ && BPMedia.setClienteFoto) await BPMedia.setClienteFoto(result.id, fQ);
      }
    } catch (_) {}
    closeModal('modal-cliente-rapido');
    openModal('modal-agenda');
    const sel = document.getElementById('agenda-cliente');
    sel.innerHTML = '<option value="">Selecionar cliente</option>' + state.clientes.map(c =>
      `<option value="${escHtml(c.nome)}">${escHtml(c.nome)}</option>`).join('');
    sel.value = nome;
  }
});

document.getElementById('modal-cliente-rapido-cancel').addEventListener('click', () => {
  closeModal('modal-cliente-rapido');
  openModal('modal-agenda');
});

// CRUD Cliente
let editClienteId = null;


function setClienteModalMode(mode) {
  // mode: 'view' | 'edit'
  const modal = document.getElementById('modal-cliente');
  const sheet = document.getElementById('modal-cliente-sheet');
  const view = document.getElementById('cliente-view-panel');
  const form = document.getElementById('cliente-form-panel');
  if (modal) modal.setAttribute('data-mode', mode);
  if (sheet) {
    sheet.classList.toggle('modal-sheet--view', mode === 'view');
  }
  if (view) view.hidden = mode !== 'view';
  if (form) form.hidden = mode !== 'edit';
  // Campos sempre editáveis no form (nunca "fantasma")
  ['cliente-nome', 'cliente-telefone', 'cliente-notas'].forEach(function (fid) {
    const el = document.getElementById(fid);
    if (el) {
      el.readOnly = false;
      el.disabled = false;
      el.style.opacity = '';
    }
  });
}

function openEditCliente(id) {
  const c = state.clientes.find(c => c.id === id);
  if (!c) return;
  editClienteId = id;
  setClienteModalMode('edit');
  document.getElementById('cliente-modal-title').textContent = 'Editar cliente';
  document.getElementById('cliente-nome').value = c.nome || '';
  document.getElementById('cliente-telefone').value = c.telefone || '';
  document.getElementById('cliente-notas').value = c.notas || '';
  document.getElementById('cliente-id').value = id;
  openModal('modal-cliente');
}

document.getElementById('add-cliente-btn').addEventListener('click', () => {
  editClienteId = null;
  setClienteModalMode('edit');
  document.getElementById('cliente-modal-title').textContent = 'Novo cliente';
  ['cliente-nome', 'cliente-telefone', 'cliente-notas', 'cliente-id'].forEach(function (id) {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  openModal('modal-cliente');
});

document.getElementById('modal-cliente-save').addEventListener('click', async () => {
  const nome = document.getElementById('cliente-nome').value.trim();
  let telefone = document.getElementById('cliente-telefone').value.trim();
  const notas = document.getElementById('cliente-notas').value.trim();
  const id = document.getElementById('cliente-id').value;
  if (!nome) { toast('Introduz o nome.', 'warning'); return; }
  const telDigits = telefone.replace(/\D/g, '');
  if (telDigits && telDigits.length !== 9) {
    toast('Contacto deve ter exactamente 9 dígitos, ou deixe em branco.', 'error');
    return;
  }
  telefone = telDigits;
  if (id) {
    // ET4.3: só toast/fecha se a actualização efectivamente ocorreu
    const upd = await updateCliente(id, { nome, telefone, notas });
    if (upd) {
      toast('Cliente actualizado.', 'success');
      closeModal('modal-cliente');
    }
  } else { 
    const result = await addCliente({ nome, telefone, notas });
    if (result) {
      try {
        var fotoC = null;
        if (window.BPMedia && typeof BPMedia.takePendingClienteFoto === 'function') {
          fotoC = BPMedia.takePendingClienteFoto();
        }
        if (fotoC && typeof BPMedia.setClienteFoto === 'function') {
          await BPMedia.setClienteFoto(result.id, fotoC);
          if (typeof BPMedia.patchRowAvatar === 'function') BPMedia.patchRowAvatar('clientes', result.id);
          if (typeof BPMedia.enhanceListAvatars === 'function') BPMedia.enhanceListAvatars();
          if (typeof renderClientes === 'function') renderClientes();
        }
      } catch (eFoto) { console.warn('[cli foto save]', eFoto); }
      closeModal('modal-cliente');
    }
  }
});

document.getElementById('modal-cliente-cancel').addEventListener('click', () => closeModal('modal-cliente'));

// CRUD Profissional
let editProfId = null;

function popularEspecialidadesProf(selected) {
  const sel = document.getElementById('prof-esp');
  if (!sel) return;
  // Só serviços activos e com nome — nunca lixo / eliminados / inactivos
  const servicos = (state.servicos || [])
    .filter(function (s) {
      if (!s || !s.nome) return false;
      if (typeof isServicoAtivo === 'function') return isServicoAtivo(s);
      return s.ativo !== false && s.ativo !== 0 && s.ativo !== 'false';
    })
    .slice()
    .sort(function (a, b) { return String(a.nome).localeCompare(String(b.nome), 'pt'); });
  let html = '<option value="">Seleccionar serviço / especialidade</option>';
  html += '<option value="__criar">+ Criar novo serviço</option>';
  servicos.forEach(function (s) {
    html += '<option value="' + escHtml(s.nome) + '">' + escHtml(s.nome) + '</option>';
  });
  sel.innerHTML = html;
  const box = document.getElementById('prof-criar-servico-box');
  if (selected && selected !== '__criar') {
    // Se o serviço antigo já não existe na lista activa, ainda assim mostrar valor
    const exists = servicos.some(function (s) { return s.nome === selected; });
    if (!exists && selected) {
      sel.innerHTML = html + '<option value="' + escHtml(selected) + '">' + escHtml(selected) + ' (legado)</option>';
    }
    sel.value = selected;
    if (box) box.style.display = 'none';
  } else if (selected === '__criar') {
    sel.value = '__criar';
    if (box) box.style.display = 'block';
  } else {
    if (box) box.style.display = 'none';
  }
}

function bpToggleCriarServicoBox() {
  const sel = document.getElementById('prof-esp');
  const box = document.getElementById('prof-criar-servico-box');
  if (!sel || !box) return;
  const criar = sel.value === '__criar';
  box.style.display = criar ? 'block' : 'none';
  if (criar) {
    const nomeEl = document.getElementById('prof-novo-servico-nome');
    if (nomeEl) setTimeout(function () { try { nomeEl.focus(); } catch (_) {} }, 50);
  }
}

async function bpCriarServicoDesdeProfModal() {
  const nome = ((document.getElementById('prof-novo-servico-nome') || {}).value || '').trim();
  const preco = parseFloat((document.getElementById('prof-novo-servico-preco') || {}).value);
  if (!nome) {
    toast('Indica o nome do novo serviço.', 'warning');
    return null;
  }
  if (!preco || preco <= 0) {
    toast('Indica um preço válido.', 'warning');
    return null;
  }
  if (typeof existeNomeDuplicado === 'function' && existeNomeDuplicado('servicos', nome)) {
    toast('Já existe um serviço com este nome. Seleccione-o na lista.', 'warning');
    popularEspecialidadesProf(nome);
    return nome;
  }
  const draftProf = ((document.getElementById('prof-nome') || {}).value || '').trim();
  if (!draftProf) {
    toast('Preenche o nome do profissional antes de criar o serviço.', 'warning');
    return null;
  }
  const payload = {
    nome: nome,
    precoBase: preco,
    profissionais: [draftProf],
    ativo: true,
    duracao: 60,
    updated_at: new Date().toISOString()
  };
  let created = null;
  if (typeof addServico === 'function') {
    created = await addServico(payload, { pendingNomes: [draftProf] });
  }
  if (!created) return null;
  // Associar nome ao select e fechar box
  popularEspecialidadesProf(nome);
  const box = document.getElementById('prof-criar-servico-box');
  if (box) box.style.display = 'none';
  const nomeEl = document.getElementById('prof-novo-servico-nome');
  const precoEl = document.getElementById('prof-novo-servico-preco');
  if (nomeEl) nomeEl.value = '';
  if (precoEl) precoEl.value = '';
  toast('Serviço «' + nome + '» adicionado. Pode ajustá-lo depois na aba Serviços.', 'success');
  if (typeof renderServicos === 'function') {
    try { renderServicos(); } catch (_) {}
  }
  return nome;
}


document.getElementById('prof-esp')?.addEventListener('change', bpToggleCriarServicoBox);
document.getElementById('prof-criar-servico-btn')?.addEventListener('click', async function (e) {
  e.preventDefault();
  await bpCriarServicoDesdeProfModal();
});

function setProfModalMode(mode) {
  const modal = document.getElementById('modal-prof');
  const sheet = document.getElementById('modal-prof-sheet');
  const view = document.getElementById('prof-view-panel');
  const form = document.getElementById('prof-form-panel');
  if (modal) modal.setAttribute('data-mode', mode);
  if (sheet) sheet.classList.toggle('modal-sheet--view', mode === 'view');
  if (view) view.hidden = mode !== 'view';
  if (form) form.hidden = mode !== 'edit';
  ['prof-nome','prof-idade','prof-data-contratual','prof-bi','prof-morada','prof-contacto','prof-esp','prof-taxa','prof-meta'].forEach(function (fid) {
    const el = document.getElementById(fid);
    if (el) {
      el.disabled = false;
      el.readOnly = false;
      el.style.opacity = '';
    }
  });
}

function _receitaProfissionalMes(profId) {
  const mes = (typeof hoje === 'function' ? hoje() : '').slice(0, 7);
  if (!mes || !profId) return 0;
  return (state.movimentos || []).filter(function (m) {
    return m.tipo === 'venda' && String(m.profissional_id) === String(profId) && String(m.data || '').startsWith(mes);
  }).reduce(function (s, m) { return s + (Number(m.valor) || 0); }, 0);
}


function bpFotoSrcEntidade(ent) {
  if (!ent) return null;
  if (window.BPMedia && typeof BPMedia.resolveFotoSrc === 'function') {
    var r = BPMedia.resolveFotoSrc(ent);
    if (r) return r;
  }
  if (ent.foto && String(ent.foto).indexOf('data:') === 0) return ent.foto;
  if (ent.foto_url) return ent.foto_url;
  if (ent.foto) return ent.foto;
  return null;
}
function bpViewHeroAvatarHtml(ent, fallbackChar) {
  var src = bpFotoSrcEntidade(ent);
  if (src) {
    var safe = String(src)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;');
    return '<div class="bp-view-hero-av bp-view-hero-av--img"><img src="' + safe + '" alt="" loading="lazy" decoding="async"></div>';
  }
  return '<div class="bp-view-hero-av">' + escHtml(fallbackChar || '?') + '</div>';
}

function openEditProf(id) {
  const p = state.profissionais.find(x => x.id === id);
  if (!p) return;
  editProfId = id;
  setProfModalMode('edit');
  document.getElementById('prof-modal-title').textContent = 'Editar profissional';
  document.getElementById('prof-nome').value = p.nome || '';
  document.getElementById('prof-idade').value = p.idade || '';
  const dataEl = document.getElementById('prof-data-contratual');
  if (dataEl) dataEl.value = p.dataContratual || p.dataNascimento || '';
  document.getElementById('prof-bi').value = p.numeroBI || '';
  document.getElementById('prof-morada').value = p.morada || '';
  document.getElementById('prof-contacto').value = p.contacto || '';
  const taxaEl = document.getElementById('prof-taxa');
  if (taxaEl) taxaEl.value = p.taxa_comissao != null ? p.taxa_comissao : (p.taxa || 0);
  const metaEl = document.getElementById('prof-meta');
  if (metaEl) metaEl.value = p.meta_mensal != null ? p.meta_mensal : (p.meta || '');
  popularEspecialidadesProf(p.especialidade || '');
  document.getElementById('prof-id').value = id;
  openModal('modal-prof');
}

function abrirDetalheProfView(id) {
  const p = state.profissionais.find(x => x.id === id);
  if (!p) return;
  editProfId = id;
  setProfModalMode('view');
  document.getElementById('prof-modal-title').textContent = 'Ficha do profissional';
  document.getElementById('prof-id').value = id;

  const receita = _receitaProfissionalMes(p.id);
  const meta = Number(p.meta_mensal != null ? p.meta_mensal : p.meta) || 0;
  const taxa = Number(p.taxa_comissao != null ? p.taxa_comissao : p.taxa) || 0;
  const digits = String(p.contacto || '').replace(/\D/g, '');
  let contactActions = '';
  if (digits.length === 9) {
    const wa = '244' + digits;
    const msg = encodeURIComponent('Olá ' + (p.nome || '') + ',');
    contactActions =
      '<div class="bp-view-contact-actions">' +
      '<a class="btn btn-sm btn-primary" href="https://wa.me/' + wa + '?text=' + msg + '" target="_blank" rel="noopener noreferrer">WhatsApp</a>' +
      '<a class="btn btn-sm btn-secondary" href="tel:+244' + digits + '">Ligar</a>' +
      '</div>';
  }

  let metaHtml = '';
  if (meta > 0) {
    const pct = Math.min(100, Math.round((receita / meta) * 100));
    metaHtml =
      '<div class="bp-view-section-title">Desempenho este mês</div>' +
      '<div class="bp-view-dl">' +
      '<div class="bp-view-row"><span class="bp-view-label">Receita</span><span class="bp-view-value">' + fmtKz(receita) + '</span></div>' +
      '<div class="bp-view-row"><span class="bp-view-label">Meta</span><span class="bp-view-value">' + fmtKz(meta) + ' · ' + pct + '%</span></div>' +
      '</div>';
  } else if (receita > 0) {
    metaHtml =
      '<div class="bp-view-section-title">Desempenho este mês</div>' +
      '<div class="bp-view-dl">' +
      '<div class="bp-view-row"><span class="bp-view-label">Receita</span><span class="bp-view-value">' + fmtKz(receita) + '</span></div>' +
      '</div>';
  }

  const body = document.getElementById('prof-view-body');
  if (body) {
    body.innerHTML =
      '<div class="bp-view-hero">' +
      bpViewHeroAvatarHtml(p, (p.nome || '?').charAt(0).toUpperCase()) +
      '<div><div class="bp-view-hero-name">' + escHtml(p.nome || 'Profissional') + '</div>' +
      '<div class="bp-view-hero-meta">' + escHtml(p.especialidade || 'Sem especialidade') + '</div></div></div>' +
      contactActions +
      '<div class="bp-view-dl">' +
      '<div class="bp-view-row"><span class="bp-view-label">Nome</span><span class="bp-view-value">' + escHtml(p.nome || '—') + '</span></div>' +
      '<div class="bp-view-row"><span class="bp-view-label">Especialidade</span><span class="bp-view-value">' + escHtml(p.especialidade || '—') + '</span></div>' +
      '<div class="bp-view-row"><span class="bp-view-label">Contacto</span><span class="bp-view-value">' + (digits ? escHtml(digits) : '—') + '</span></div>' +
      '<div class="bp-view-row"><span class="bp-view-label">Comissão</span><span class="bp-view-value">' + taxa + '%</span></div>' +
      (p.idade ? '<div class="bp-view-row"><span class="bp-view-label">Idade</span><span class="bp-view-value">' + escHtml(String(p.idade)) + ' anos</span></div>' : '') +
      (p.dataContratual || p.dataNascimento ? '<div class="bp-view-row"><span class="bp-view-label">Contrato</span><span class="bp-view-value">' + escHtml(p.dataContratual || p.dataNascimento) + '</span></div>' : '') +
      (p.morada ? '<div class="bp-view-row"><span class="bp-view-label">Morada</span><span class="bp-view-value">' + escHtml(p.morada) + '</span></div>' : '') +
      (p.numeroBI ? '<div class="bp-view-row"><span class="bp-view-label">BI</span><span class="bp-view-value">' + escHtml(p.numeroBI) + '</span></div>' : '') +
      '</div>' + metaHtml;
  }
  openModal('modal-prof');
}

document.getElementById('add-prof-btn')?.addEventListener('click', () => {
  editProfId = null;
  setProfModalMode('edit');
  document.getElementById('prof-modal-title').textContent = 'Novo profissional';
  ['prof-nome', 'prof-idade', 'prof-data-contratual', 'prof-bi', 'prof-morada', 'prof-contacto', 'prof-id', 'prof-taxa', 'prof-meta'].forEach(fid => {
    const el = document.getElementById(fid);
    if (el) el.value = fid === 'prof-taxa' ? '0' : '';
  });
  popularEspecialidadesProf('');
  openModal('modal-prof');
});

document.getElementById('modal-prof-save')?.addEventListener('click', async () => {
  const nome = (document.getElementById('prof-nome')?.value || '').trim();
  const idade = document.getElementById('prof-idade')?.value;
  const dataContratual = (document.getElementById('prof-data-contratual')?.value || '').trim();
  let espSelect = document.getElementById('prof-esp')?.value || '';
  let especialidade = espSelect === '__criar' ? '' : espSelect;
  const numeroBI = (document.getElementById('prof-bi')?.value || '').trim().toUpperCase();
  const morada = (document.getElementById('prof-morada')?.value || '').trim();
  const contacto = (document.getElementById('prof-contacto')?.value || '').replace(/\D/g, '');
  const id = document.getElementById('prof-id')?.value;
  const taxa = parseFloat(document.getElementById('prof-taxa')?.value);
  const meta = parseFloat(document.getElementById('prof-meta')?.value);

  if (!nome) { toast('Introduz o nome.', 'warning'); return; }
  if (!idade || isNaN(parseInt(idade, 10))) { toast('Idade é obrigatória', 'error'); return; }
  if (!dataContratual) { toast('Data contratual é obrigatória', 'error'); return; }
  // Criar serviço no próprio fluxo se escolheu «Criar novo serviço»
  if (espSelect === '__criar') {
    const criado = await bpCriarServicoDesdeProfModal();
    if (!criado) return;
    especialidade = criado;
  }
  if (!especialidade) { toast('Selecciona uma especialidade ou cria uma nova.', 'warning'); return; }
  if (numeroBI && typeof validarBI === 'function' && !validarBI(numeroBI)) {
    toast('Número do BI incompleto ou em formato inválido. Preencha correctamente ou deixe em branco.', 'error');
    return;
  }
  if (contacto && contacto.length !== 9) {
    toast('Contacto deve ter exactamente 9 dígitos, ou deixe em branco.', 'error');
    return;
  }

  const dados = {
    nome,
    idade: parseInt(idade, 10),
    dataContratual,
    especialidade,
    numeroBI: numeroBI || '',
    morada,
    contacto: contacto || '',
    taxa_comissao: isNaN(taxa) ? 0 : taxa,
    meta_mensal: isNaN(meta) ? 0 : meta
  };

  if (id) {
    const upd = await updateProfissional(id, dados);
    if (upd) {
      toast('Profissional actualizado.', 'success');
      closeModal('modal-prof');
    }
  } else {
    const result = await addProfissional(dados);
    if (result) {
      // Foto escolhida antes de guardar (criação)
      try {
        var fotoP = null;
        if (window.BPMedia && typeof BPMedia.takePendingProfFoto === 'function') {
          fotoP = BPMedia.takePendingProfFoto();
        }
        if (fotoP && typeof BPMedia.setProfFoto === 'function') {
          await BPMedia.setProfFoto(result.id, fotoP);
          if (typeof BPMedia.patchRowAvatar === 'function') BPMedia.patchRowAvatar('profissionais', result.id);
          if (typeof BPMedia.enhanceListAvatars === 'function') BPMedia.enhanceListAvatars();
          if (typeof renderProfissionais === 'function') renderProfissionais();
        }
      } catch (eFoto) { console.warn('[prof foto save]', eFoto); }
      closeModal('modal-prof');
    }
  }
});

document.getElementById('prof-view-fechar')?.addEventListener('click', () => {
  setProfModalMode('edit');
  closeModal('modal-prof');
});
document.getElementById('prof-view-editar')?.addEventListener('click', () => {
  const id = document.getElementById('prof-id')?.value || editProfId;
  if (id) openEditProf(id);
});
document.getElementById('modal-prof-cancel')?.addEventListener('click', () => {
  setProfModalMode('edit');
  closeModal('modal-prof');
});

// Clique na linha do profissional → detalhe só leitura
document.addEventListener('click', function(e) {
  const row = e.target.closest('.list-item[data-prof-id]');
  if (!row) return;
  if (e.target.closest('.row-menu-btn') || e.target.closest('.row-menu')) return;
  const id = row.dataset.profId;
  if (id) abrirDetalheProfView(id);
});


// CRUD Serviço
document.getElementById('add-servico-btn').addEventListener('click', () => openServicoModal());

document.getElementById('modal-servico-save').addEventListener('click', async () => {
  const nome = document.getElementById('servico-nome').value.trim();
  const precoBase = parseFloat(document.getElementById('servico-preco').value);
  const durRaw = parseInt(document.getElementById('servico-duracao')?.value, 10);
  const duracao = (!isNaN(durRaw) && durRaw >= 5) ? durRaw : 60;
  const id = document.getElementById('servico-id').value;
  const profissionais = typeof getSelectedProfissionais === 'function' ? getSelectedProfissionais() : [];
  if (!nome || isNaN(precoBase) || precoBase <= 0) {
    toast('Indica nome e preço válidos.', 'warning');
    return;
  }
  // ET4.5: profissionais obrigatórios — proibido vazio / "toda a equipa"
  if (!profissionais || !profissionais.length) {
    toast('Associa pelo menos um profissional a este serviço.', 'warning');
    return;
  }
  const payload = { nome, precoBase, profissionais: profissionais, duracao };
  if (id) {
    const upd = await updateServico(id, payload);
    if (!upd) return;
    toast('Serviço actualizado.', 'success');
  } else {
    const created = await addServico(payload);
    if (!created) return;
  }
  closeModal('modal-servico');
  if (typeof updateUI === 'function') updateUI();
});

document.getElementById('modal-servico-cancel')?.addEventListener('click', () => {
  if (typeof setServicoModalMode === 'function') setServicoModalMode('edit');
  closeModal('modal-servico');
});
document.getElementById('servico-view-fechar')?.addEventListener('click', () => {
  if (typeof setServicoModalMode === 'function') setServicoModalMode('edit');
  closeModal('modal-servico');
});
document.getElementById('servico-view-editar')?.addEventListener('click', () => {
  const id = document.getElementById('servico-id')?.value;
  if (id && typeof openServicoModal === 'function') openServicoModal(id);
});
document.addEventListener('click', function (e) {
  const row = e.target.closest('.list-item[data-servico-id]');
  if (!row) return;
  if (e.target.closest('.row-menu-btn') || e.target.closest('.row-menu')) return;
  const id = row.dataset.servicoId;
  if (id && typeof abrirDetalheServicoView === 'function') abrirDetalheServicoView(id);
});
// ====================================================================
//  FASE E — Ver detalhe do cliente (só visualização ao clicar na linha)
// ====================================================================
function abrirDetalheClienteView(id) {
  const c = state.clientes.find(x => x.id === id);
  if (!c) return;
  editClienteId = id;

  setClienteModalMode('view');
  document.getElementById('cliente-modal-title').textContent = 'Ficha do cliente';
  document.getElementById('cliente-id').value = id;

  const body = document.getElementById('cliente-view-body');
  if (body) {
    const digits = String(c.telefone || '').replace(/\D/g, '');
    const tel = digits || '—';
    const notas = c.notas ? escHtml(c.notas) : '<span class="bp-view-value--muted">Sem preferências</span>';
    let contactActions = '';
    if (digits.length === 9) {
      const wa = '244' + digits;
      const msg = encodeURIComponent('Olá ' + (c.nome || '') + ',');
      contactActions =
        '<div class="bp-view-contact-actions">' +
        '<a class="btn btn-sm btn-primary" href="https://wa.me/' + wa + '?text=' + msg + '" target="_blank" rel="noopener noreferrer">WhatsApp</a>' +
        '<a class="btn btn-sm btn-secondary" href="tel:+244' + digits + '">Ligar</a>' +
        '</div>';
    }
    var pts = Number(c.pontos) || 0;
    var tier = typeof getClienteTier === 'function' ? getClienteTier(pts) : { id: 'bronze', label: 'Bronze' };
    body.innerHTML =
      '<div class="bp-view-hero">' +
      bpViewHeroAvatarHtml(c, (c.nome || '?').charAt(0).toUpperCase()) +
      '<div><div class="bp-view-hero-name">' + escHtml(c.nome || 'Cliente') + '</div>' +
      '<div class="bp-view-hero-meta">' + (digits ? ('+244 ' + escHtml(digits)) : 'Sem contacto') +
      ' · <span class="bp-tier bp-tier--' + tier.id + '">' + escHtml(tier.label) + '</span></div></div></div>' +
      contactActions +
      '<div class="bp-view-dl">' +
      '<div class="bp-view-row"><span class="bp-view-label">Nome</span><span class="bp-view-value">' + escHtml(c.nome || '—') + '</span></div>' +
      '<div class="bp-view-row"><span class="bp-view-label">Celular</span><span class="bp-view-value">' + escHtml(tel) + '</span></div>' +
      '<div class="bp-view-row"><span class="bp-view-label">Fidelidade</span><span class="bp-view-value">' + pts + ' pts · ' + escHtml(tier.label) + '</span></div>' +
      '<div class="bp-view-row"><span class="bp-view-label">Preferências</span><span class="bp-view-value">' + notas + '</span></div>' +
      '</div>' +
      '<p class="venda-modal-sub" style="margin-top:10px;">1 ponto por cada 1.000 Kz em vendas registadas na ficha.</p>';
  }
  // Stats com objecto (id + nome)
  const stats = typeof getEstatisticasCliente === 'function'
    ? getEstatisticasCliente(c)
    : { visitas: 0, totalGasto: 0, ultimaVisita: null };
  const statsEl = document.getElementById('cliente-perfil-stats');
  if (statsEl) {
    statsEl.hidden = false;
    statsEl.style.display = 'grid';
    statsEl.innerHTML =
      '<div><div class="stat-valor">' + stats.visitas + '</div><div class="stat-legenda">' +
      (stats.visitas === 1 ? 'Visita' : 'Visitas') + '</div></div>' +
      '<div><div class="stat-valor">' + fmtKz(stats.totalGasto) + '</div><div class="stat-legenda">Total gasto</div></div>' +
      '<div><div class="stat-valor">' +
      (typeof formatarUltimaVisita === 'function' ? formatarUltimaVisita(stats.ultimaVisita) : '—') +
      '</div><div class="stat-legenda">Última visita</div></div>';
  }
  openModal('modal-cliente');
}

document.getElementById('cliente-view-fechar')?.addEventListener('click', function () {
  setClienteModalMode('edit');
  closeModal('modal-cliente');
});
document.getElementById('cliente-view-editar')?.addEventListener('click', function () {
  const id = document.getElementById('cliente-id')?.value || editClienteId;
  if (id) openEditCliente(id);
});
document.getElementById('modal-cliente-cancel')?.addEventListener('click', function () {
  setClienteModalMode('edit');
  closeModal('modal-cliente');
});

// Clique na linha do cliente (não no menu)
document.addEventListener('click', function(e) {
  const row = e.target.closest('.cliente-item[data-cliente-id]');
  if (!row) return;
  if (e.target.closest('.row-menu-btn') || e.target.closest('.row-menu')) return;
  const id = row.dataset.clienteId;
  if (id) abrirDetalheClienteView(id);
});

// Validação telefone 9 dígitos (Angola)
function validarTelefoneAO(tel) {
  const digits = String(tel || '').replace(/\D/g, '');
  return digits.length === 0 || digits.length === 9;
}

function validarBI(bi) {
  const v = String(bi || '').trim().toUpperCase();
  if (!v) return true; // opcional
  // Formato angolano simplificado: 9 dígitos + 2 letras + 3 dígitos (ex: 001234567LA048)
  // Aceita também sequências alfanuméricas completas >= 10 chars
  return /^[0-9]{9}[A-Z]{2}[0-9]{3}$/.test(v) || /^[0-9A-Z]{10,20}$/.test(v);
}
