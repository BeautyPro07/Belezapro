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
  document.getElementById('menu-dropdown').style.display = 'none';
  logoutVoluntarioEmCurso = true;
  const confirmed = await showConfirmModal('Sair da aplicação', 'Tem a certeza que quer sair?', false);
  if (!confirmed) logoutVoluntarioEmCurso = false;
  if (confirmed) {
    await supabaseClient.auth.signOut();
    location.reload();
  }
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
  openModal('modal-agenda');
});

// CORREÇÃO: modal-agenda-save separa ID e nome do profissional
document.getElementById('modal-agenda-save').addEventListener('click', async () => {
  const cliente = document.getElementById('agenda-cliente').value;
  const servico = document.getElementById('agenda-servico').value;
  const profissionalId = document.getElementById('agenda-profissional').value;
  const datetime = document.getElementById('agenda-datetime').value;
  const preco = parseFloat(document.getElementById('agenda-preco').value);
  if (!cliente || !servico || !datetime) { toast('Preencha todos os campos obrigatórios', 'error'); return; }
  if (isNaN(preco) || preco <= 0) { toast('Insira um preço válido', 'error'); return; }
  const data = datetime.split('T')[0];
  const hora = datetime.split('T')[1].slice(0, 5);
  // Buscar o nome do profissional a partir do ID
  const profObj = state.profissionais.find(p => p.id === profissionalId);
  const profissionalNome = profObj ? profObj.nome : '';
  const result = await addAgendamento({
    cliente,
    servico,
    profissional: profissionalNome,
    profissional_id: profissionalId,
    data,
    hora,
    preco
  });
  if (result) { closeModal('modal-agenda'); }
});

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
  if (!nome) { toast('Nome é obrigatório', 'error'); return; }
  const result = await addCliente({ nome, telefone, notas: '' });
  if (result) {
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

function openEditCliente(id) {
  const c = state.clientes.find(c => c.id === id);
  if (!c) return;
  editClienteId = id;
  document.getElementById('cliente-modal-title').textContent = 'Editar Cliente';
  document.getElementById('cliente-nome').value = c.nome;
  document.getElementById('cliente-telefone').value = c.telefone || '';
  document.getElementById('cliente-notas').value = c.notas || '';
  document.getElementById('cliente-id').value = id;
  const statsEl = document.getElementById('cliente-perfil-stats');
  if (statsEl && typeof getEstatisticasCliente === 'function') {
    const { visitas, totalGasto, ultimaVisita } = getEstatisticasCliente(c.nome);
    statsEl.innerHTML = `
      <div><div class="stat-valor">${visitas}</div><div class="stat-legenda">${visitas === 1 ? 'Visita' : 'Visitas'}</div></div>
      <div><div class="stat-valor">${fmtKz(totalGasto)}</div><div class="stat-legenda">Total gasto</div></div>
      <div><div class="stat-valor">${formatarUltimaVisita(ultimaVisita)}</div><div class="stat-legenda">Última visita</div></div>
    `;
    statsEl.style.display = 'grid';
  }
  openModal('modal-cliente');
}

document.getElementById('add-cliente-btn').addEventListener('click', () => {
  editClienteId = null;
  document.getElementById('cliente-modal-title').textContent = 'Novo Cliente';
  ['cliente-nome', 'cliente-telefone', 'cliente-notas', 'cliente-id'].forEach(id => document.getElementById(id).value = '');
  const statsEl = document.getElementById('cliente-perfil-stats');
  if (statsEl) statsEl.style.display = 'none';
  openModal('modal-cliente');
});

document.getElementById('modal-cliente-save').addEventListener('click', async () => {
  const nome = document.getElementById('cliente-nome').value.trim();
  let telefone = document.getElementById('cliente-telefone').value.trim();
  const notas = document.getElementById('cliente-notas').value.trim();
  const id = document.getElementById('cliente-id').value;
  if (!nome) { toast('Nome é obrigatório', 'error'); return; }
  const telDigits = telefone.replace(/\D/g, '');
  if (telDigits && telDigits.length !== 9) {
    toast('Contacto deve ter exactamente 9 dígitos, ou deixe em branco.', 'error');
    return;
  }
  telefone = telDigits;
  if (id) { 
    await updateCliente(id, { nome, telefone, notas });
    toast('Dados do cliente actualizados', 'success');
    closeModal('modal-cliente');
  } else { 
    const result = await addCliente({ nome, telefone, notas });
    if (result) {
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
  const servicos = (state.servicos || []).slice().sort((a,b) => a.nome.localeCompare(b.nome));
  let html = '<option value="">Seleccionar serviço / especialidade</option>';
  html += '<option value="__criar">Criar seu serviço</option>';
  servicos.forEach(s => {
    html += `<option value="${escHtml(s.nome)}">${escHtml(s.nome)}</option>`;
  });
  sel.innerHTML = html;
  if (selected) sel.value = selected;
  const box = document.getElementById('prof-criar-servico-box');
  if (box) box.style.display = 'none';
}

function openEditProf(id) {
  const p = state.profissionais.find(x => x.id === id);
  if (!p) return;
  editProfId = id;
  document.getElementById('prof-modal-title').textContent = 'Editar Profissional';
  document.getElementById('prof-nome').value = p.nome || '';
  document.getElementById('prof-idade').value = p.idade || '';
  const dataEl = document.getElementById('prof-data-contratual');
  if (dataEl) dataEl.value = p.dataContratual || p.dataNascimento || '';
  document.getElementById('prof-bi').value = p.numeroBI || '';
  document.getElementById('prof-morada').value = p.morada || '';
  document.getElementById('prof-contacto').value = p.contacto || '';
  popularEspecialidadesProf(p.especialidade || '');
  document.getElementById('prof-id').value = id;
  // modo edição
  ['prof-nome','prof-idade','prof-data-contratual','prof-bi','prof-morada','prof-contacto','prof-esp'].forEach(fid => {
    const el = document.getElementById(fid);
    if (el) { el.disabled = false; el.readOnly = false; el.style.opacity = '1'; }
  });
  const saveBtn = document.getElementById('modal-prof-save');
  if (saveBtn) saveBtn.style.display = '';
  openModal('modal-prof');
}

function abrirDetalheProfView(id) {
  const p = state.profissionais.find(x => x.id === id);
  if (!p) return;
  editProfId = id;
  document.getElementById('prof-modal-title').textContent = 'Perfil do Profissional';
  document.getElementById('prof-nome').value = p.nome || '';
  document.getElementById('prof-idade').value = p.idade || '';
  const dataEl = document.getElementById('prof-data-contratual');
  if (dataEl) dataEl.value = p.dataContratual || p.dataNascimento || '';
  document.getElementById('prof-bi').value = p.numeroBI || '';
  document.getElementById('prof-morada').value = p.morada || '';
  document.getElementById('prof-contacto').value = p.contacto || '';
  popularEspecialidadesProf(p.especialidade || '');
  document.getElementById('prof-id').value = id;
  ['prof-nome','prof-idade','prof-data-contratual','prof-bi','prof-morada','prof-contacto','prof-esp'].forEach(fid => {
    const el = document.getElementById(fid);
    if (el) { el.disabled = true; el.style.opacity = '0.85'; }
  });
  const saveBtn = document.getElementById('modal-prof-save');
  if (saveBtn) saveBtn.style.display = 'none';
  const box = document.getElementById('prof-criar-servico-box');
  if (box) box.style.display = 'none';
  openModal('modal-prof');
}

document.getElementById('prof-esp')?.addEventListener('change', function() {
  const box = document.getElementById('prof-criar-servico-box');
  if (box) box.style.display = this.value === '__criar' ? 'block' : 'none';
});

document.getElementById('prof-criar-servico-btn')?.addEventListener('click', async function() {
  const nome = (document.getElementById('prof-novo-servico-nome')?.value || '').trim();
  const preco = parseFloat(document.getElementById('prof-novo-servico-preco')?.value);
  if (!nome || !preco || preco <= 0) {
    toast('Indique o nome e o preço do novo serviço.', 'error');
    return;
  }
  if (existeNomeDuplicado('servicos', nome)) {
    toast('Já existe um serviço com este nome.', 'error');
    return;
  }
  const profNome = (document.getElementById('prof-nome')?.value || '').trim();
  const n = await addServico({ nome, precoBase: preco, profissionais: profNome ? [profNome] : [] });
  if (n) {
    popularEspecialidadesProf(nome);
    document.getElementById('prof-esp').value = nome;
    document.getElementById('prof-criar-servico-box').style.display = 'none';
    document.getElementById('prof-novo-servico-nome').value = '';
    document.getElementById('prof-novo-servico-preco').value = '';
    // Modal limpo de confirmação
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay open';
    overlay.id = 'modal-servico-criado-temp';
    overlay.innerHTML = `<div class="modal-confirm-sheet" style="text-align:left;">
      <div class="confirm-title" style="margin-bottom:12px;">Serviço criado</div>
      <div class="confirm-message" style="text-align:left;line-height:1.5;">O serviço foi ajustado e associado ao profissional. Podes ajustar ou editar a qualquer momento na aba Equipa.</div>
      <div class="confirm-actions" style="margin-top:20px;"><button type="button" class="btn btn-primary btn-block" id="svc-criado-ok">OK</button></div>
    </div>`;
    document.body.appendChild(overlay);
    document.getElementById('svc-criado-ok').onclick = () => overlay.remove();
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  }
});

document.getElementById('add-prof-btn')?.addEventListener('click', () => {
  editProfId = null;
  document.getElementById('prof-modal-title').textContent = 'Novo Profissional';
  ['prof-nome', 'prof-idade', 'prof-data-contratual', 'prof-bi', 'prof-morada', 'prof-contacto', 'prof-id'].forEach(fid => {
    const el = document.getElementById(fid);
    if (el) { el.value = ''; el.disabled = false; el.readOnly = false; el.style.opacity = '1'; }
  });
  popularEspecialidadesProf('');
  const saveBtn = document.getElementById('modal-prof-save');
  if (saveBtn) saveBtn.style.display = '';
  openModal('modal-prof');
});

document.getElementById('modal-prof-save')?.addEventListener('click', async () => {
  const nome = (document.getElementById('prof-nome')?.value || '').trim();
  const idade = document.getElementById('prof-idade')?.value;
  const dataContratual = (document.getElementById('prof-data-contratual')?.value || '').trim();
  const espSelect = document.getElementById('prof-esp')?.value || '';
  const especialidade = espSelect === '__criar' ? '' : espSelect;
  const numeroBI = (document.getElementById('prof-bi')?.value || '').trim().toUpperCase();
  const morada = (document.getElementById('prof-morada')?.value || '').trim();
  const contacto = (document.getElementById('prof-contacto')?.value || '').replace(/\D/g, '');
  const id = document.getElementById('prof-id')?.value;

  if (!nome) { toast('Nome é obrigatório', 'error'); return; }
  if (!idade || isNaN(parseInt(idade, 10))) { toast('Idade é obrigatória', 'error'); return; }
  if (!dataContratual) { toast('Data contratual é obrigatória', 'error'); return; }
  if (!especialidade) { toast('Seleccione uma especialidade (serviço)', 'error'); return; }
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
    contacto: contacto || ''
  };

  if (id) {
    await updateProfissional(id, dados);
    toast('Dados do profissional actualizados', 'success');
    closeModal('modal-prof');
  } else {
    const result = await addProfissional(dados);
    if (result) closeModal('modal-prof');
  }
});

document.getElementById('modal-prof-cancel')?.addEventListener('click', () => {
  ['prof-nome','prof-idade','prof-data-contratual','prof-bi','prof-morada','prof-contacto','prof-esp'].forEach(fid => {
    const el = document.getElementById(fid);
    if (el) { el.disabled = false; el.style.opacity = '1'; }
  });
  const saveBtn = document.getElementById('modal-prof-save');
  if (saveBtn) saveBtn.style.display = '';
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
  const id = document.getElementById('servico-id').value;
  const profissionais = getSelectedProfissionais();
  if (!nome || isNaN(precoBase) || precoBase <= 0) { toast('Preencha nome e preço válido', 'error'); return; }
  if (!profissionais || profissionais.length === 0) {
    toast('Selecione pelo menos um profissional para este serviço', 'error');
    return;
  }
  if (id) { await updateServico(id, { nome, precoBase, profissionais });
    toast('Serviço actualizado', 'success'); } else { await addServico({ nome, precoBase, profissionais }); }
  closeModal('modal-servico');
  updateUI();
});

document.getElementById('modal-servico-cancel').addEventListener('click', () => closeModal('modal-servico'));
// ====================================================================
//  FASE E — Ver detalhe do cliente (só visualização ao clicar na linha)
// ====================================================================
function abrirDetalheClienteView(id) {
  const c = state.clientes.find(x => x.id === id);
  if (!c) return;
  const stats = typeof getEstatisticasCliente === 'function'
    ? getEstatisticasCliente(c.nome)
    : { visitas: 0, totalGasto: 0, ultimaVisita: null };

  // Reutiliza modal-cliente em modo leitura
  editClienteId = id;
  document.getElementById('cliente-modal-title').textContent = 'Perfil do Cliente';
  document.getElementById('cliente-nome').value = c.nome;
  document.getElementById('cliente-telefone').value = c.telefone || '';
  document.getElementById('cliente-notas').value = c.notas || '';
  document.getElementById('cliente-id').value = id;

  // Bloquear edição
  ['cliente-nome', 'cliente-telefone', 'cliente-notas'].forEach(fid => {
    const el = document.getElementById(fid);
    if (el) { el.readOnly = true; el.style.opacity = '0.85'; }
  });
  const saveBtn = document.getElementById('modal-cliente-save');
  if (saveBtn) saveBtn.style.display = 'none';

  const statsEl = document.getElementById('cliente-perfil-stats');
  if (statsEl) {
    statsEl.innerHTML = `
      <div><div class="stat-valor">${stats.visitas}</div><div class="stat-legenda">${stats.visitas === 1 ? 'Visita' : 'Visitas'}</div></div>
      <div><div class="stat-valor">${fmtKz(stats.totalGasto)}</div><div class="stat-legenda">Total gasto</div></div>
      <div><div class="stat-valor">${typeof formatarUltimaVisita === 'function' ? formatarUltimaVisita(stats.ultimaVisita) : '—'}</div><div class="stat-legenda">Última visita</div></div>
    `;
    statsEl.style.display = 'grid';
  }
  openModal('modal-cliente');
}

// Ao fechar, reactivar campos
document.getElementById('modal-cliente-cancel')?.addEventListener('click', () => {
  ['cliente-nome', 'cliente-telefone', 'cliente-notas'].forEach(fid => {
    const el = document.getElementById(fid);
    if (el) { el.readOnly = false; el.style.opacity = '1'; }
  });
  const saveBtn = document.getElementById('modal-cliente-save');
  if (saveBtn) saveBtn.style.display = '';
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
