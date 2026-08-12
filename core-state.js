// ====================================================================
//  CORE — ESTADO GLOBAL (extraído do app.js na Fase B da modularização)
//  Fase D: integrado com core-store.js (subscribe / setState / batch)
// ====================================================================
let state = {
  config: {
    storeName: 'Glamour Beauty',
    fundo: 0,
    plano: (function () {
    try {
      var sid = localStorage.getItem('bp_salao_id_cache');
      if (sid) {
        var ns = localStorage.getItem('bp_plano_cache_' + sid);
        if (ns) return ns;
      }
      return 'trial';
    } catch (_) { return 'trial'; }
  })(),
    trialInicio: null,
    salaoId: null,
    userRole: null,
    userId: null,
  },
  clientes: [],
  agendamentos: [],
  movimentos: [],
  profissionais: [],
  servicos: [],
  fechos_caixa: [],
  agendaDataAtual: (typeof hoje === 'function' ? hoje() : new Date().toISOString().slice(0, 10)),
  histPeriodo: 'hoje',
  // NOTA: o carrinho de vendas vive em cartItems (vendas-modais.js) + localStorage.
  // A chave "carrinho" foi removida para eliminar estado morto/duplicado.
  filtroClientes: 'todos',
  chartPeriodo: 'semana',
  chartOffset: 0,
  chartMostrarValores: false,

  // Filtro do Dashboard
  dashPeriodo: localStorage.getItem('bp_dash_periodo') || 'dia',
  dashOffset: parseInt(localStorage.getItem('bp_dash_offset')) || 0,
  dashCustomInicio: localStorage.getItem('bp_dash_custom_inicio') || null,
  dashCustomFim: localStorage.getItem('bp_dash_custom_fim') || null,
};

// Restaura a última aba visitada neste dispositivo
let activeTab = localStorage.getItem('bp_active_tab') || 'dashboard';
