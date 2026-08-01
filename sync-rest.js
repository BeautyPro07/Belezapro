// ====================================================================
//  sync-rest.js — Comunicação com Supabase e merge de dados
//  CORREÇÕES APLICADAS:
//    - Adicionado profissional_id nos mapeamentos to/from Supabase
//    - Tratamento de erros robusto (nunca exibe "Error {}")
//    - Leitura do corpo da resposta em caso de erro HTTP
//    - Fallback de mensagem para qualquer tipo de exceção
//    - POLÍTICAS FORTES: prevenção de duplicados por nome no merge e upsert
//    - Verificação de existência antes de upsert
//    - Logs estruturados para auditoria
//    - CORREÇÃO CRÍTICA: eliminações propagadas entre dispositivos
//      (item local sem upsert pendente não é reintroduzido)
//    - CORREÇÃO ADICIONAL: preservar itens locais recentes (até 5 segundos)
//      para evitar desaparecimento temporário de vendas durante merge concorrente
// ====================================================================

// ====================================================================
//  VALIDAÇÃO DE UUID (para evitar envio de valores inválidos)
// ====================================================================
function isValidUUID(uuid) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
}

// ====================================================================
//  TOLERÂNCIA: coluna foto_url pode ainda não existir no Supabase
//  null = desconhecido | true = confirmada | false = ausente no schema
// ====================================================================
let _bpSchemaFotoUrl = (function () {
  try {
    const v = localStorage.getItem('bp_schema_foto_url');
    if (v === '0') return false;
    if (v === '1') return true;
  } catch (_) {}
  return null;
})();

function _bpSetSchemaFotoUrl(ok) {
  _bpSchemaFotoUrl = !!ok;
  try { localStorage.setItem('bp_schema_foto_url', ok ? '1' : '0'); } catch (_) {}
}

function _bpIsFotoUrlSchemaError(msg) {
  const s = String(msg || '').toLowerCase();
  if (!s) return false;
  if (s.includes('foto_url')) return true;
  // PostgREST: PGRST204 — column not in schema cache
  if (s.includes('pgrst204')) return true;
  if (s.includes('schema cache') && s.includes('column')) return true;
  if (s.includes('could not find') && s.includes('column')) return true;
  if (s.includes('unexpected') && s.includes('foto')) return true;
  return false;
}

function _bpStripFotoUrl(payload) {
  if (!payload || typeof payload !== 'object') return payload;
  const out = Object.assign({}, payload);
  delete out.foto_url;
  return out;
}

function _bpAttachFotoUrl(payload, item) {
  if (!payload || typeof payload !== 'object') return payload;
  if (_bpSchemaFotoUrl === false) return payload;
  // Só enviar quando há URL (evita forçar null em massa antes da coluna existir).
  // Para limpar foto no servidor: foto_url explicitamente '' ou null no item com flag.
  if (item && Object.prototype.hasOwnProperty.call(item, 'foto_url')) {
    payload.foto_url = item.foto_url || null;
  }
  return payload;
}

// ====================================================================
//  VALIDAÇÃO DE DUPLICADOS NO SUPABASE (consulta prévia)
// ====================================================================
async function existeRegistroDuplicado(tabela, nome, salaoId, idIgnorar = null) {
  try {
    const authHeaders = await getAuthHeaders();
    const url = `${SUPABASE_URL}/rest/v1/${tabela}?salao_id=eq.${encodeURIComponent(salaoId)}&select=id,nome&nome=ilike.${encodeURIComponent(nome)}`;
    const resp = await fetch(url, { headers: authHeaders });
    if (!resp.ok) return false;
    const rows = await resp.json();
    if (idIgnorar) {
      return rows.some(r => r.id !== idIgnorar);
    }
    return rows.length > 0;
  } catch (_) {
    return false;
  }
}

// ====================================================================
//  FUNÇÕES REST ALTERADAS – COM TRATAMENTO DE ERROS ROBUSTO
// ====================================================================

async function supabaseUpsert(tabela, item) {
  try {
    const authHeaders = await getAuthHeaders();
    const salaoId = state.config.salaoId;
    if (!salaoId) throw new Error('Salão não identificado. Faça logout e login novamente.');

    // ================================================================
    // POLÍTICA FORTE: Verificar duplicados por nome antes de upsert
    // Aplica-se apenas a tabelas com campo 'nome' (profissionais, servicos, clientes)
    // ================================================================
    // Não bloquear por nome quando é desactivação (ativo=false) ou o id é o mesmo
    if (['profissionais', 'servicos', 'clientes'].includes(tabela) && item.nome && item.ativo !== false) {
      const existe = await existeRegistroDuplicado(tabela, item.nome, salaoId, item.id);
      if (existe) {
        console.warn(`[sync-rest] Upsert bloqueado: ${tabela} com nome "${item.nome}" já existe neste salão.`);
        throw new Error('DUPLICADO_BLOQUEADO');
      }
    }

    let payload = toSupabaseFormat(tabela, item);
    // Se já sabemos que a coluna não existe, nunca enviar foto_url
    if (_bpSchemaFotoUrl === false && payload && Object.prototype.hasOwnProperty.call(payload, 'foto_url')) {
      payload = _bpStripFotoUrl(payload);
    }

    async function postPayload(bodyObj) {
      const resp = await fetch(`${SUPABASE_URL}/rest/v1/${tabela}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
          'Prefer': 'resolution=merge-duplicates',
        },
        body: JSON.stringify(bodyObj),
      });
      return resp;
    }

    let resp = await postPayload(payload);
    if (resp.status === 401) {
      throw new Error('SESSION_EXPIRED');
    }
    if (!resp.ok) {
      let errorBody = '';
      try {
        errorBody = await resp.text();
      } catch (_) {
        errorBody = '(corpo da resposta não disponível)';
      }
      // Tolerância: coluna foto_url em falta → retry uma vez sem o campo
      const hadFotoUrl = payload && Object.prototype.hasOwnProperty.call(payload, 'foto_url');
      if (hadFotoUrl && _bpIsFotoUrlSchemaError(errorBody)) {
        console.warn('[sync-rest] Coluna foto_url indisponível no schema — a sincronizar sem ela. Execute SUPABASE_FOTOS.sql quando possível.');
        _bpSetSchemaFotoUrl(false);
        payload = _bpStripFotoUrl(payload);
        resp = await postPayload(payload);
        if (resp.status === 401) throw new Error('SESSION_EXPIRED');
        if (!resp.ok) {
          let errorBody2 = '';
          try { errorBody2 = await resp.text(); } catch (_) { errorBody2 = errorBody; }
          throw new Error(`Supabase upsert ${tabela}: ${resp.status} - ${errorBody2}`);
        }
        return;
      }
      throw new Error(`Supabase upsert ${tabela}: ${resp.status} - ${errorBody}`);
    }
    // Sucesso com foto_url → confirmar schema
    if (payload && Object.prototype.hasOwnProperty.call(payload, 'foto_url') && _bpSchemaFotoUrl !== true) {
      _bpSetSchemaFotoUrl(true);
    }
  } catch (err) {
    if (err.message === 'SESSION_EXPIRED') throw err;
    if (err.message === 'DUPLICADO_BLOQUEADO') {
      console.warn(`[sync-rest] Upsert ignorado para ${tabela} devido a duplicado.`);
      return;
    }
    const errorMsg = err.message || String(err) || 'Erro desconhecido';
    if (errorMsg.includes('LIMITE_PLANO_ATINGIDO')) {
      if (typeof mostrarModalUpgrade === 'function') {
        mostrarModalUpgrade('Limite do plano atingido. Faça upgrade para continuar.');
      }
      throw new Error('LIMITE_PLANO_ATINGIDO');
    }
    // Última rede de segurança: erro de schema no catch (rede/parse)
    if (_bpIsFotoUrlSchemaError(errorMsg) && item && (tabela === 'clientes' || tabela === 'profissionais')) {
      try {
        console.warn('[sync-rest] Retry de emergência sem foto_url após erro de schema.');
        _bpSetSchemaFotoUrl(false);
        const authHeaders2 = await getAuthHeaders();
        const payload2 = _bpStripFotoUrl(toSupabaseFormat(tabela, item));
        const resp2 = await fetch(`${SUPABASE_URL}/rest/v1/${tabela}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders2,
            'Prefer': 'resolution=merge-duplicates',
          },
          body: JSON.stringify(payload2),
        });
        if (resp2.status === 401) throw new Error('SESSION_EXPIRED');
        if (resp2.ok) return;
      } catch (e2) {
        if (e2.message === 'SESSION_EXPIRED') throw e2;
      }
    }
    console.error(`[sync-rest] Falha ao fazer upsert em ${tabela} (id: ${item?.id || 'desconhecido'}):`, errorMsg);
    throw new Error(`Falha na sincronização de ${tabela}: ${errorMsg}`);
  }
}

async function supabaseDelete(tabela, id) {
  try {
    const authHeaders = await getAuthHeaders();
    const salaoId = state.config.salaoId;
    if (!salaoId) {
      throw new Error('Salão não identificado. Faça logout e login novamente.');
    }

    const resp = await fetch(
      `${SUPABASE_URL}/rest/v1/${tabela}?id=eq.${encodeURIComponent(id)}&salao_id=eq.${encodeURIComponent(salaoId)}`,
      {
        method: 'DELETE',
        headers: authHeaders,
      }
    );
    if (resp.status === 401) {
      throw new Error('SESSION_EXPIRED');
    }
    if (!resp.ok) {
      let errorBody = '';
      try {
        errorBody = await resp.text();
      } catch (_) {
        errorBody = '(corpo da resposta não disponível)';
      }
      throw new Error(`Supabase delete ${tabela}: ${resp.status} - ${errorBody}`);
    }

    // Verificação: confirmar que o registo foi realmente eliminado
    const checkResp = await fetch(
      `${SUPABASE_URL}/rest/v1/${tabela}?id=eq.${encodeURIComponent(id)}&salao_id=eq.${encodeURIComponent(salaoId)}`,
      { headers: authHeaders }
    );
    if (checkResp.ok) {
      const data = await checkResp.json();
      if (data && data.length > 0) {
        throw new Error(`DELETE não eliminou o registo ${id} na tabela ${tabela}. RLS pode estar a bloquear a operação.`);
      }
    }
    return true;
  } catch (err) {
    if (err.message === 'SESSION_EXPIRED') throw err;
    const errorMsg = err.message || String(err) || 'Erro desconhecido';
    console.error(`[sync-rest] Falha ao deletar em ${tabela} (id: ${id}):`, errorMsg);
    throw new Error(`Falha na exclusão de ${tabela}: ${errorMsg}`);
  }
}

async function supabaseGetAll(tabela, salaoId) {
  try {
    const authHeaders = await getAuthHeaders();
    const resp = await fetch(
      `${SUPABASE_URL}/rest/v1/${tabela}?salao_id=eq.${encodeURIComponent(salaoId)}&order=created_at.asc`,
      {
        headers: authHeaders,
      }
    );
    if (resp.status === 401) {
      throw new Error('SESSION_EXPIRED');
    }
    if (!resp.ok) {
      let errorBody = '';
      try {
        errorBody = await resp.text();
      } catch (_) {
        errorBody = '(corpo da resposta não disponível)';
      }
      throw new Error(`Supabase getAll ${tabela}: ${resp.status} - ${errorBody}`);
    }
    const rows = await resp.json();
    return rows.map(r => fromSupabaseFormat(tabela, r));
  } catch (err) {
    if (err.message === 'SESSION_EXPIRED') throw err;
    const errorMsg = err.message || String(err) || 'Erro desconhecido';
    console.error(`[sync-rest] Falha ao buscar ${tabela} do Supabase:`, errorMsg);
    throw new Error(`Falha ao carregar ${tabela}: ${errorMsg}`);
  }
}

// ====================================================================
//  TRANSFORMAÇÃO PARA O FORMATO DO SUPABASE
// ====================================================================
function toSupabaseFormat(tabela, item) {
  const salaoId = state.config.salaoId;
  if (!salaoId) {
    console.error('[toSupabaseFormat] state.config.salaoId é nulo!', { tabela, item });
    throw new Error('Salão não identificado. Faça logout e login novamente.');
  }

  if (!item.updated_at) {
    item.updated_at = new Date().toISOString();
  }

  switch (tabela) {
    case 'movimentos':
      return {
        id: item.id,
        salao_id: salaoId,
        tipo: item.tipo,
        descricao: item.descricao || '',
        valor: Math.round(item.valor || 0),
        cliente: item.cliente || 'Anónimo',
        profissional_id: isValidUUID(item.profissional_id) ? item.profissional_id : null,
        profissional: item.profissional || '',
        itens: item.itens || [],
        metodo_pagamento: item.metodoPagamento || 'Numerário',
        data: item.data,
        hora: item.hora,
        updated_at: item.updated_at,
      };
    case 'agendamentos':
      return {
        id: item.id,
        salao_id: salaoId,
        cliente: item.cliente || '',
        servico: item.servico || '',
        profissional_id: isValidUUID(item.profissional_id) ? item.profissional_id : null,
        profissional: item.profissional || '',
        data: item.data,
        hora: item.hora || '00:00',
        preco: Math.round(item.preco || 0),
        status: item.status || 'agendado',
        agendado_por: item.agendadoPor || null,
        updated_at: item.updated_at,
      };
    case 'clientes':
      return _bpAttachFotoUrl({
        id: item.id,
        salao_id: salaoId,
        nome: item.nome || '',
        telefone: item.telefone || null,
        notas: item.notas || null,
        ultima_visita: item.ultimaVisita || null,
        total_visitas: item.visitas || 0,
        updated_at: item.updated_at,
      }, item);
    case 'profissionais':
      return _bpAttachFotoUrl({
        id: item.id,
        salao_id: salaoId,
        nome: item.nome || '',
        especialidade: item.especialidade || null,
        ativo: item.ativo !== false && item.ativo !== 0 && item.ativo !== 'false',
        data_desativacao: item.data_desativacao || null,
        updated_at: item.updated_at,
      }, item);
    case 'servicos':
      return {
        id: item.id,
        salao_id: salaoId,
        nome: item.nome || '',
        preco_base: Math.round(item.precoBase || 0),
        profissionais: item.profissionais || [],
        ativo: item.ativo !== false,
        updated_at: item.updated_at,
      };
    default:
      return { ...item, salao_id: salaoId, updated_at: item.updated_at };
  }
}

// ====================================================================
//  TRANSFORMAÇÃO DO FORMATO DO SUPABASE PARA O INTERNO
// ====================================================================
function fromSupabaseFormat(tabela, row) {
  switch (tabela) {
    case 'movimentos':
      return {
        id:              row.id,
        tipo:            row.tipo,
        descricao:       row.descricao,
        valor:           row.valor,
        cliente:         row.cliente,
        profissional_id: row.profissional_id || null,
        profissional:    row.profissional || '',
        itens:           row.itens || [],
        metodoPagamento: row.metodo_pagamento,
        data:            row.data,
        hora:            row.hora,
        updated_at:      row.updated_at,
      };
    case 'agendamentos':
      return {
        id:           row.id,
        cliente:      row.cliente,
        servico:      row.servico,
        profissional_id: row.profissional_id || null,
        profissional: row.profissional || '',
        data:         row.data,
        hora:         row.hora,
        preco:        row.preco,
        status:       row.status,
        agendadoPor:  row.agendado_por,
        updated_at:   row.updated_at,
      };
    case 'clientes':
      return {
        id:           row.id,
        nome:         row.nome,
        telefone:     row.telefone,
        notas:        row.notas,
        ultimaVisita: row.ultima_visita,
        visitas:      row.total_visitas,
        foto_url:     row.foto_url || null,
        updated_at:   row.updated_at,
      };
    case 'profissionais':
      return {
        id:            row.id,
        nome:          row.nome,
        especialidade: row.especialidade,
        ativo:         row.ativo !== false && row.ativo !== 0,
        data_desativacao: row.data_desativacao || null,
        foto_url:      row.foto_url || null,
        updated_at:    row.updated_at,
      };
    case 'servicos':
      return {
        id:            row.id,
        nome:          row.nome,
        precoBase:     row.preco_base,
        profissionais: row.profissionais || [],
        ativo:         row.ativo !== false && row.ativo !== 0,
        updated_at:    row.updated_at,
      };
    default:
      return row;
  }
}

// ====================================================================
//  CARREGAMENTO DO SUPABASE COM MERGE CAMPO A CAMPO (ROBUSTO)
// ====================================================================

/** Soft-delete remoto garantido: PATCH ativo=false + verificação GET. */
async function supabaseDeactivate(tabela, id, extra) {
  const authHeaders = await getAuthHeaders();
  const salaoId = state.config.salaoId;
  if (!salaoId) throw new Error('Salão não identificado. Faça logout e login novamente.');
  const body = Object.assign({
    ativo: false,
    updated_at: new Date().toISOString()
  }, extra || {});
  if (tabela === 'profissionais' && !body.data_desativacao) {
    body.data_desativacao = new Date().toISOString();
  }
  const resp = await fetch(
    `${SUPABASE_URL}/rest/v1/${tabela}?id=eq.${encodeURIComponent(id)}&salao_id=eq.${encodeURIComponent(salaoId)}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(body)
    }
  );
  if (resp.status === 401) throw new Error('SESSION_EXPIRED');
  if (!resp.ok) {
    let errorBody = '';
    try { errorBody = await resp.text(); } catch (_) { errorBody = ''; }
    throw new Error(`Supabase deactivate ${tabela}: ${resp.status} - ${errorBody}`);
  }
  // Verificar
  const check = await fetch(
    `${SUPABASE_URL}/rest/v1/${tabela}?id=eq.${encodeURIComponent(id)}&salao_id=eq.${encodeURIComponent(salaoId)}&select=id,ativo`,
    { headers: authHeaders }
  );
  if (check.ok) {
    const rows = await check.json();
    if (rows && rows[0] && rows[0].ativo !== false && rows[0].ativo !== 0) {
      throw new Error(`Deactivate não aplicou ativo=false em ${tabela}/${id}`);
    }
  }
  return true;
}

async function carregarDoSupabase() {
  if (!navigator.onLine || !state.config.salaoId) return false;

  try {
    const [clientesRemotos, agendamentosRemotos, movimentosRemotos, profsRemotos, servicosRemotos] = await Promise.all([
      supabaseGetAll('clientes',      state.config.salaoId),
      supabaseGetAll('agendamentos',  state.config.salaoId),
      supabaseGetAll('movimentos',    state.config.salaoId),
      supabaseGetAll('profissionais', state.config.salaoId),
      supabaseGetAll('servicos',      state.config.salaoId),
    ]);

    const mergeTable = (itensLocais, itensRemotos, tabela) => {
      const mapLocal = new Map();
      itensLocais.forEach(item => mapLocal.set(item.id, item));

      // ================================================================
      // LISTA NEGRA: itens eliminados permanentemente (nunca reimportar)
      // ================================================================
      const deletedIds = new Set(
        (typeof getDeletedItems === 'function' ? getDeletedItems() : [])
          .filter(i => i && i.tabela === tabela && i.id)
          .filter(i => {
            // respeitar TTL 30d se prune disponível
            if (typeof pruneDeletedItems === 'function') return true;
            return true;
          })
          .map(i => i.id)
      );
      // Aplicar prune global periodicamente
      if (typeof pruneDeletedItems === 'function' && typeof saveDeletedItems === 'function') {
        try { saveDeletedItems(pruneDeletedItems(getDeletedItems())); } catch (_) {}
      }

      const idsComDeletePendente = new Set(
        getSyncQueue()
          .filter(op => op.tabela === tabela && op.operacao === 'delete')
          .map(op => op.payload?.id)
      );

      // ================================================================
      // CORREÇÃO CRÍTICA (eliminações não propagavam entre dispositivos):
      // um item que existe só localmente pode significar duas coisas muito
      // diferentes: a) criado/editado aqui e ainda não chegou ao servidor
      // (está na fila de upsert) → preservar; b) já existiu no servidor
      // mas foi eliminado (por este ou por outro dispositivo) → não
      // preservar. Sem isto, a lista negra/fila de delete (que são por
      // dispositivo) nunca chegavam ao dispositivo B, e o item eliminado
      // era sempre reintroduzido.
      // ================================================================
      const idsComUpsertPendente = new Set(
        getSyncQueue()
          .filter(op => op.tabela === tabela && op.operacao === 'upsert')
          .map(op => op.payload?.id)
      );

      // ================================================================
      // POLÍTICA FORTE: Mapa de nomes para detetar duplicados
      // ================================================================
      const nomesExistentes = new Map();
      for (const item of itensLocais) {
        if (item.nome) {
          const chave = item.nome.trim().toLowerCase();
          nomesExistentes.set(chave, item.id);
        }
      }

      const mergeCampoACampo = (maisRecente, maisAntigo) => {
        const merged = { ...maisRecente };
        for (const campo in maisAntigo) {
          if (merged[campo] === undefined || merged[campo] === null) {
            merged[campo] = maisAntigo[campo];
          }
        }
        return merged;
      };

      const resultado = [];
      const itensParaSync = [];

      for (const remoto of itensRemotos) {
        // Ignorar itens com delete pendente ou na lista negra
        if (deletedIds.has(remoto.id) || idsComDeletePendente.has(remoto.id)) {
          // Remoto ainda existe mas foi apagado localmente → reforçar DELETE na fila
          if (deletedIds.has(remoto.id) && !idsComDeletePendente.has(remoto.id) && typeof addToSyncQueue === 'function') {
            try { addToSyncQueue(tabela, 'delete', { id: remoto.id }); } catch (_) {}
          }
          continue;
        }

        const local = mapLocal.get(remoto.id);

        // ================================================================
        // POLÍTICA FORTE: Verificar duplicados por nome (para tabelas com nome)
        // ================================================================
        if (['profissionais', 'servicos', 'clientes'].includes(tabela) && remoto.nome) {
          const chave = remoto.nome.trim().toLowerCase();
          const idExistente = nomesExistentes.get(chave);
          // Se já existe um item com o mesmo nome e é diferente do atual, ignorar o remoto
          if (idExistente && idExistente !== remoto.id) {
            continue;
          }
          // Registrar este nome para futuras iterações
          nomesExistentes.set(chave, remoto.id);
        }

        if (!local) {
          // Remoto inactivo: manter no estado (histórico) mas listas filtram
          resultado.push(remoto);
        } else {
          // Contingência: se qualquer lado está inactivo, o resultado fica inactivo
          const localInactivo = local.ativo === false || local.ativo === 0 || local.ativo === 'false';
          const remotoInactivo = remoto.ativo === false || remoto.ativo === 0 || remoto.ativo === 'false';
          if (localInactivo || remotoInactivo) {
            const base = localInactivo ? { ...remoto, ...local } : { ...local, ...remoto };
            base.ativo = false;
            if (local.data_desativacao || remoto.data_desativacao) {
              base.data_desativacao = local.data_desativacao || remoto.data_desativacao;
            }
            // updated_at o mais recente
            const lt = local.updated_at || '';
            const rt = remoto.updated_at || '';
            base.updated_at = lt > rt ? lt : rt;
            resultado.push(base);
            // Se remoto ainda activo, forçar PATCH no próximo flush
            if (!remotoInactivo && typeof addToSyncQueue === 'function') {
              try { addToSyncQueue(tabela, 'upsert', base); } catch (_) {}
            }
            mapLocal.delete(remoto.id);
          } else {
            const localTs = local.updated_at || '1970-01-01T00:00:00.000Z';
            const remotoTs = remoto.updated_at || '1970-01-01T00:00:00.000Z';
            if (remotoTs > localTs) {
              const merged = mergeCampoACampo(remoto, local);
              resultado.push(merged);
              if (JSON.stringify(merged) !== JSON.stringify(remoto)) itensParaSync.push(merged);
            } else if (localTs > remotoTs) {
              const merged = mergeCampoACampo(local, remoto);
              resultado.push(merged);
              itensParaSync.push(merged);
            } else {
              resultado.push(local);
            }
            mapLocal.delete(remoto.id);
          }
        }
      }

      // ================================================================
      // CORREÇÃO ADICIONAL: preservar itens locais recentes (até 5 segundos)
      // mesmo que ainda não estejam na fila de upsert, para evitar
      // desaparecimento temporário durante merge concorrente.
      // ================================================================
      const AGORA = Date.now();
      for (const [id, local] of mapLocal) {
        // Preservar se houver upsert pendente
        if (idsComUpsertPendente.has(id)) {
          resultado.push(local);
          itensParaSync.push(local);
          continue;
        }
        // Preservar se for muito recente (criação local ainda não enfileirada)
        const localTs = new Date(local.updated_at || '1970-01-01').getTime();
        if (localTs > AGORA - 5000) { // menos de 5 segundos
          resultado.push(local);
          itensParaSync.push(local);
          continue;
        }
        // Caso contrário, descartar (lista negra, delete pendente ou sem operação)
        if (deletedIds.has(id) || idsComDeletePendente.has(id)) {
          continue;
        }
        // Verificar se o nome local conflita com algum nome remoto já processado
        if (local.nome) {
          const chave = local.nome.trim().toLowerCase();
          if (nomesExistentes.has(chave) && nomesExistentes.get(chave) !== id) {
            console.warn(`[mergeTable] Ignorando ${tabela} local "${local.nome}" porque já existe remoto com mesmo nome.`);
            continue;
          }
        }
        // Último caso: só local, sem fila, não recente → NÃO reintroduzir nem re-upsert
        // (evita ressurreição de deletes e lixo offline)
        continue;
      }

      return resultado;
    };

    state.clientes      = mergeTable(state.clientes, clientesRemotos, 'clientes');
    state.agendamentos  = mergeTable(state.agendamentos, agendamentosRemotos, 'agendamentos');
    state.movimentos    = mergeTable(state.movimentos, movimentosRemotos, 'movimentos');
    state.profissionais = mergeTable(state.profissionais, profsRemotos, 'profissionais');
    state.servicos      = mergeTable(state.servicos, servicosRemotos, 'servicos');

    // Fingerprint antes/depois para evitar updateUI sem mudanças
    const fpBefore = window._bpDataFp || '';
    const fpAfter = [
      (state.clientes||[]).length,
      (state.agendamentos||[]).length,
      (state.movimentos||[]).length,
      (state.profissionais||[]).map(p => p.id+':'+(p.ativo===false?'0':'1')).join(','),
      (state.servicos||[]).map(s => s.id+':'+(s.ativo===false?'0':'1')).join(',')
    ].join('|');

    for (const c of state.clientes)      await dbPutLocal('clientes',      c);
    for (const a of state.agendamentos)  await dbPutLocal('agendamentos',  a);
    for (const m of state.movimentos)    await dbPutLocal('movimentos',    m);
    for (const p of state.profissionais) await dbPutLocal('profissionais', p);
    for (const s of state.servicos)      await dbPutLocal('servicos',      s);

    window._bpDataFp = fpAfter;
    return fpAfter !== fpBefore;
  } catch (err) {
    if (err.message === 'SESSION_EXPIRED') {
      console.warn('[carregarDoSupabase] Sessão expirada, a sincronização será retomada após login.');
      return false;
    }
    const errorMsg = err.message || String(err) || 'Erro desconhecido';
    console.error('[carregarDoSupabase] Erro ao carregar dados do Supabase:', errorMsg);
    return false;
  }
}