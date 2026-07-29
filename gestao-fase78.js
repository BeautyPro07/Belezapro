// ================================================================
// Grupos 7–8 — IA/Automação + Gestão (offline-first, robusto)
// F11 Reagendamento | F10 Dashboard | F12 Export | F19 Backup
// F20 Auditoria | F21 Filiais
// Supabase: NÃO — só sob comando explícito do utilizador
// ================================================================
(function () {
  "use strict";

  var AUDIT_KEY = "bp_audit_v1";
  var FILIAIS_KEY = "bp_filiais_v1";
  var FILIAL_ATIVA_KEY = "bp_filial_ativa";
  var BACKUP_META_KEY = "bp_last_backup_meta";

  function fmt(v) {
    return typeof fmtKz === "function" ? fmtKz(v) : Math.round(Number(v) || 0) + " Kz";
  }
  function esc(s) {
    return typeof escHtml === "function" ? escHtml(String(s == null ? "" : s)) : String(s == null ? "" : s);
  }
  function hojeStr() {
    return typeof hoje === "function" ? hoje() : new Date().toISOString().slice(0, 10);
  }
  function uid() {
    return typeof uuid === "function" ? uuid() : "id" + Date.now() + Math.random().toString(16).slice(2, 8);
  }
  function safeJson(key, fb) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fb;
      var v = JSON.parse(raw);
      return v == null ? fb : v;
    } catch (e) { return fb; }
  }
  function writeJson(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; }
    catch (e) {
      if (typeof toast === "function") toast("Armazenamento local indisponível", "error");
      return false;
    }
  }
  function loadArr(key) {
    var v = safeJson(key, []);
    return Array.isArray(v) ? v : [];
  }

  /* ========== F20 AUDITORIA ========== */
  function logAudit(acao, detalhe, meta) {
    try {
      var list = loadArr(AUDIT_KEY);
      list.push({
        id: uid(),
        acao: String(acao || "accao").slice(0, 80),
        detalhe: String(detalhe || "").slice(0, 300),
        meta: meta || null,
        ts: new Date().toISOString(),
        data: hojeStr()
      });
      writeJson(AUDIT_KEY, list.slice(-400));
    } catch (e) {}
  }
  function loadAudit(limite) {
    var list = loadArr(AUDIT_KEY).slice().reverse();
    return typeof limite === "number" ? list.slice(0, limite) : list;
  }

  /* ========== F21 FILIAIS ========== */
  function loadFiliais() {
    var list = loadArr(FILIAIS_KEY);
    if (!list.length) {
      var nome = (state && state.config && state.config.storeName) || "Salão principal";
      list = [{ id: "filial_main", nome: nome, localizacao: "", contacto: "", created_at: new Date().toISOString() }];
      writeJson(FILIAIS_KEY, list);
    }
    return list;
  }
  function saveFiliais(list) { return writeJson(FILIAIS_KEY, list); }
  function getFilialAtiva() {
    var id = localStorage.getItem(FILIAL_ATIVA_KEY) || "filial_main";
    var f = loadFiliais().find(function (x) { return x.id === id; });
    return f || loadFiliais()[0];
  }
  function setFilialAtiva(id) {
    var f = loadFiliais().find(function (x) { return x.id === id; });
    if (!f) return null;
    localStorage.setItem(FILIAL_ATIVA_KEY, id);
    logAudit("filial_switch", "Mudou para " + f.nome, { filial_id: id });
    return f;
  }
  function upsertFilial(data) {
    var nome = String(data.nome || "").trim();
    if (!nome) {
      if (typeof toast === "function") toast("Nome da filial obrigatório", "error");
      return null;
    }
    var list = loadFiliais();
    if (data.id) {
      var i = list.findIndex(function (x) { return x.id === data.id; });
      if (i < 0) return null;
      list[i] = Object.assign({}, list[i], {
        nome: nome,
        localizacao: String(data.localizacao || "").trim(),
        contacto: String(data.contacto || "").trim(),
        updated_at: new Date().toISOString()
      });
      saveFiliais(list);
      logAudit("filial_edit", nome, { filial_id: data.id });
      return list[i];
    }
    if (list.some(function (x) { return x.nome.toLowerCase() === nome.toLowerCase(); })) {
      if (typeof toast === "function") toast("Já existe uma filial com este nome", "error");
      return null;
    }
    var f = {
      id: uid(),
      nome: nome,
      localizacao: String(data.localizacao || "").trim(),
      contacto: String(data.contacto || "").trim(),
      created_at: new Date().toISOString()
    };
    list.push(f);
    saveFiliais(list);
    logAudit("filial_create", nome, { filial_id: f.id });
    return f;
  }

  /* ========== F11 REAGENDAMENTO ========== */
  function parseMin(hhmm) {
    var p = String(hhmm || "09:00").split(":");
    return (parseInt(p[0], 10) || 0) * 60 + (parseInt(p[1], 10) || 0);
  }
  function minToHora(m) {
    var h = Math.floor(m / 60);
    var mm = m % 60;
    return String(h).padStart(2, "0") + ":" + String(mm).padStart(2, "0");
  }
  function slotsLivres(profissionalId, data, duracaoMin) {
    duracaoMin = duracaoMin || 60;
    var entrada = 9 * 60, saida = 18 * 60, passo = 30;
    // horários equipa se existirem
    try {
      if (window.BPEquipa && typeof BPEquipa.getHorarioProf === "function" && profissionalId) {
        var h = BPEquipa.getHorarioProf(profissionalId);
        if (h) {
          entrada = parseMin(h.entrada);
          saida = parseMin(h.saida);
          if (h.folgas && h.folgas.indexOf(data) >= 0) return [];
          var diaJs = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"][new Date(data + "T12:00:00").getDay()];
          if (h.dias && h.dias.indexOf(diaJs) < 0) return [];
        }
      }
    } catch (e) {}

    var ocupados = (state.agendamentos || []).filter(function (a) {
      if (a.data !== data) return false;
      if (profissionalId && a.profissional_id && a.profissional_id !== profissionalId) return false;
      var st = String(a.status || a.estado || "").toLowerCase();
      if (st === "cancelado") return false;
      return true;
    }).map(function (a) {
      var ini = parseMin(a.hora);
      return { ini: ini, fim: ini + duracaoMin };
    });

    var livres = [];
    for (var t = entrada; t + duracaoMin <= saida; t += passo) {
      // intervalo almoço 13-14 se BPEquipa
      var conflito = ocupados.some(function (o) {
        return t < o.fim && (t + duracaoMin) > o.ini;
      });
      if (!conflito) livres.push(minToHora(t));
      if (livres.length >= 12) break;
    }
    return livres;
  }

  function sugerirReagendamento(agendamentoId) {
    var ag = (state.agendamentos || []).find(function (a) { return a.id === agendamentoId; });
    if (!ag) return null;
    var sugestoes = [];
    var base = new Date((ag.data || hojeStr()) + "T12:00:00");
    for (var d = 0; d < 14 && sugestoes.length < 8; d++) {
      var dt = new Date(base);
      dt.setDate(base.getDate() + d);
      var dataStr = dt.toISOString().slice(0, 10);
      if (dataStr < hojeStr()) continue;
      var slots = slotsLivres(ag.profissional_id, dataStr, 60);
      slots.forEach(function (hora) {
        if (dataStr === ag.data && hora === ag.hora) return;
        if (sugestoes.length < 8) {
          sugestoes.push({ data: dataStr, hora: hora, profissional_id: ag.profissional_id });
        }
      });
    }
    return { agendamento: ag, sugestoes: sugestoes };
  }

  async function aplicarReagendamento(agendamentoId, data, hora) {
    if (!data || !hora) {
      if (typeof toast === "function") toast("Data e hora obrigatórias", "error");
      return null;
    }
    if (data < hojeStr()) {
      if (typeof toast === "function") toast("Não é possível reagendar para o passado", "error");
      return null;
    }
    var ag = (state.agendamentos || []).find(function (a) { return a.id === agendamentoId; });
    if (!ag) {
      if (typeof toast === "function") toast("Marcação não encontrada", "error");
      return null;
    }
    // conflito
    var livre = slotsLivres(ag.profissional_id, data, 60).indexOf(hora) >= 0;
    if (!livre) {
      if (typeof toast === "function") toast("Horário indisponível para este profissional", "error");
      return null;
    }
    if (typeof updateAgendamento === "function") {
      await updateAgendamento(agendamentoId, { data: data, hora: hora });
    } else {
      ag.data = data;
      ag.hora = hora;
      if (typeof dbPut === "function") await dbPut("agendamentos", ag);
    }
    logAudit("reagendar", (ag.cliente || "") + " → " + data + " " + hora, { id: agendamentoId });
    return true;
  }

  /* ========== F10 DASHBOARD EXECUTIVO ========== */
  function dashboardExecutivo() {
    var ym = hojeStr().slice(0, 7);
    var movs = state.movimentos || [];
    var vendasMes = movs.filter(function (m) { return m.tipo === "venda" && String(m.data || "").startsWith(ym); });
    var despMes = movs.filter(function (m) { return m.tipo === "despesa" && String(m.data || "").startsWith(ym); });
    var receita = vendasMes.reduce(function (s, m) { return s + (Number(m.valor) || 0); }, 0);
    var despesas = despMes.reduce(function (s, m) { return s + (Number(m.valor) || 0); }, 0);
    var comissoes = vendasMes.reduce(function (s, m) { return s + (Number(m.comissao_gerada) || 0); }, 0);
    var hojeVendas = movs.filter(function (m) { return m.tipo === "venda" && m.data === hojeStr(); });
    var receitaHoje = hojeVendas.reduce(function (s, m) { return s + (Number(m.valor) || 0); }, 0);
    var agHoje = (state.agendamentos || []).filter(function (a) {
      return a.data === hojeStr() && String(a.status || a.estado || "").toLowerCase() !== "cancelado";
    }).length;
    var clientes = (state.clientes || []).length;
    var profs = (state.profissionais || []).length;
    var ticket = vendasMes.length ? Math.round(receita / vendasMes.length) : 0;
    var nps = null;
    try {
      if (window.BPOps && BPOps.calcNpsScore) nps = BPOps.calcNpsScore(90);
    } catch (e) {}
    var stockAlert = 0;
    try {
      if (window.BPOps && BPOps.produtosBaixoStock) stockAlert = BPOps.produtosBaixoStock().length;
    } catch (e) {}
    // top profissionais mês
    var byProf = {};
    vendasMes.forEach(function (m) {
      var k = m.profissional || m.profissional_id || "—";
      byProf[k] = (byProf[k] || 0) + (Number(m.valor) || 0);
    });
    var topProf = Object.keys(byProf).map(function (k) {
      return { nome: k, receita: byProf[k] };
    }).sort(function (a, b) { return b.receita - a.receita; }).slice(0, 5);

    return {
      receitaMes: receita,
      despesasMes: despesas,
      lucroMes: receita - despesas,
      comissoesMes: comissoes,
      vendasMes: vendasMes.length,
      receitaHoje: receitaHoje,
      vendasHoje: hojeVendas.length,
      agendamentosHoje: agHoje,
      clientes: clientes,
      profissionais: profs,
      ticketMedio: ticket,
      nps: nps,
      stockAlert: stockAlert,
      topProfissionais: topProf,
      periodo: ym
    };
  }

  /* ========== F12 EXPORT ========== */
  function csvEscape(v) {
    var s = String(v == null ? "" : v);
    if (/[",\n;]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }
  function downloadText(filename, text, mime) {
    var blob = new Blob([text], { type: mime || "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 400);
  }
  function exportRelatorio(tipo) {
    var ym = hojeStr().slice(0, 7);
    var lines = [];
    var nome = "beautypro-" + tipo + "-" + hojeStr() + ".csv";
    if (tipo === "vendas") {
      lines.push(["data", "cliente", "profissional", "valor", "comissao", "pagamento"].join(";"));
      (state.movimentos || []).filter(function (m) {
        return m.tipo === "venda" && String(m.data || "").startsWith(ym);
      }).forEach(function (m) {
        lines.push([m.data, m.cliente, m.profissional, m.valor, m.comissao_gerada || 0, m.metodoPagamento || ""].map(csvEscape).join(";"));
      });
    } else if (tipo === "despesas") {
      lines.push(["data", "descricao", "categoria", "valor", "fornecedor"].join(";"));
      (state.movimentos || []).filter(function (m) {
        return m.tipo === "despesa" && String(m.data || "").startsWith(ym);
      }).forEach(function (m) {
        lines.push([m.data, m.descricao, m.categoria || "", m.valor, m.fornecedor || ""].map(csvEscape).join(";"));
      });
    } else if (tipo === "clientes") {
      lines.push(["nome", "telefone", "pontos"].join(";"));
      (state.clientes || []).forEach(function (c) {
        lines.push([c.nome, c.telefone || c.phone || "", c.pontos || 0].map(csvEscape).join(";"));
      });
    } else if (tipo === "agenda") {
      lines.push(["data", "hora", "cliente", "servico", "profissional", "status"].join(";"));
      (state.agendamentos || []).forEach(function (a) {
        lines.push([a.data, a.hora, a.cliente, a.servico || "", a.profissional || "", a.status || a.estado || ""].map(csvEscape).join(";"));
      });
    } else if (tipo === "comissoes") {
      lines.push(["profissional", "vendas", "receita", "comissao"].join(";"));
      var map = {};
      (state.movimentos || []).filter(function (m) {
        return m.tipo === "venda" && String(m.data || "").startsWith(ym);
      }).forEach(function (m) {
        var k = m.profissional || "—";
        if (!map[k]) map[k] = { vendas: 0, receita: 0, comissao: 0 };
        map[k].vendas++;
        map[k].receita += Number(m.valor) || 0;
        map[k].comissao += Number(m.comissao_gerada) || 0;
      });
      Object.keys(map).forEach(function (k) {
        var r = map[k];
        lines.push([k, r.vendas, r.receita, r.comissao].map(csvEscape).join(";"));
      });
    } else {
      if (typeof toast === "function") toast("Tipo de relatório desconhecido", "error");
      return;
    }
    // BOM for Excel
    downloadText(nome, "\uFEFF" + lines.join("\n"), "text/csv;charset=utf-8");
    logAudit("export", tipo + " CSV", { rows: lines.length - 1 });
    if (typeof toast === "function") toast("Exportação " + tipo + " pronta", "success");
  }

  /* ========== F19 BACKUP ========== */
  function buildBackupSnapshot() {
    var local = {};
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf("bp_") === 0) local[k] = localStorage.getItem(k);
      }
    } catch (e) {}
    return {
      version: 1,
      app: "BeautyPro",
      created_at: new Date().toISOString(),
      storeName: (state && state.config && state.config.storeName) || "",
      state: {
        clientes: (state && state.clientes) || [],
        profissionais: (state && state.profissionais) || [],
        servicos: (state && state.servicos) || [],
        movimentos: (state && state.movimentos) || [],
        agendamentos: (state && state.agendamentos) || [],
        config: (state && state.config) || {}
      },
      localStorage_bp: local
    };
  }
  function downloadBackup() {
    var snap = buildBackupSnapshot();
    downloadText(
      "beautypro-backup-" + hojeStr() + ".json",
      JSON.stringify(snap, null, 2),
      "application/json;charset=utf-8"
    );
    writeJson(BACKUP_META_KEY, { at: snap.created_at, size: JSON.stringify(snap).length });
    logAudit("backup", "Backup JSON descarregado", { at: snap.created_at });
    if (typeof toast === "function") toast("Backup descarregado", "success");
  }
  async function restoreBackupFromObject(snap) {
    if (!snap || !snap.state) {
      if (typeof toast === "function") toast("Ficheiro de backup inválido", "error");
      return false;
    }
    if (!confirm("Restaurar backup? Os dados actuais em memória serão substituídos (IndexedDB).")) return false;
    try {
      var keys = ["clientes", "profissionais", "servicos", "movimentos", "agendamentos"];
      for (var ki = 0; ki < keys.length; ki++) {
        var key = keys[ki];
        var arr = snap.state[key] || [];
        if (window.BeautyStore && BeautyStore.setState) {
          var patch = {};
          patch[key] = arr;
          BeautyStore.setState(patch);
        } else if (typeof state !== "undefined") {
          state[key] = arr;
        }
        if (typeof dbPut === "function") {
          for (var j = 0; j < arr.length; j++) {
            try { await dbPut(key, arr[j]); } catch (e) {}
          }
        }
      }
      if (snap.state.config) {
        if (typeof state !== "undefined") state.config = Object.assign({}, state.config || {}, snap.state.config);
      }
      if (snap.localStorage_bp) {
        Object.keys(snap.localStorage_bp).forEach(function (k) {
          try { localStorage.setItem(k, snap.localStorage_bp[k]); } catch (e) {}
        });
      }
      logAudit("restore", "Backup restaurado", { at: snap.created_at });
      if (typeof updateUI === "function") updateUI();
      if (typeof toast === "function") toast("Backup restaurado", "success");
      return true;
    } catch (e) {
      console.error(e);
      if (typeof toast === "function") toast("Erro ao restaurar backup", "error");
      return false;
    }
  }

  /* ========== UI ========== */
  function ensureShell(id, title, eyebrow, subtitle) {
    var el = document.getElementById(id);
    if (el) {
      var t = el.querySelector(".bp-sheet-title");
      if (t && title) t.textContent = title;
      return el;
    }
    el = document.createElement("div");
    el.id = id;
    el.className = "modal-overlay";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.innerHTML =
      '<div class="bp-sheet">' +
        '<div class="bp-sheet-handle" aria-hidden="true"></div>' +
        '<div class="bp-sheet-header">' +
          '<div class="bp-sheet-eyebrow">' + esc(eyebrow || "Gestão") + "</div>" +
          '<h2 class="bp-sheet-title">' + esc(title) + "</h2>" +
          (subtitle ? '<p class="bp-sheet-subtitle">' + esc(subtitle) + "</p>" : "") +
        "</div>" +
        '<div class="bp-sheet-body" id="' + id + '-body"></div>' +
        '<div class="bp-sheet-footer">' +
          '<button type="button" class="btn btn-secondary" data-close="' + id + '">Fechar</button>' +
        "</div></div>";
    document.body.appendChild(el);
    el.addEventListener("click", function (e) {
      if (e.target === el || e.target.getAttribute("data-close") === id) {
        if (typeof closeModal === "function") closeModal(id);
        else el.classList.remove("open");
      }
    });
    return el;
  }
  function openShell(id) {
    if (typeof openModal === "function") openModal(id);
    else {
      var el = document.getElementById(id);
      if (el) el.classList.add("open");
    }
  }

  function openDashboard() {
    ensureShell("modal-bp-dash", "Dashboard executivo", "Gestão", "Visão do mês em tempo real (dados locais).");
    var d = dashboardExecutivo();
    var body = document.getElementById("modal-bp-dash-body");
    var npsTxt = d.nps && d.nps.nps != null ? String(d.nps.nps) : "—";
    var top = (d.topProfissionais || []).map(function (p, i) {
      return '<div class="bp-row"><div class="bp-row-main"><div class="bp-row-title">' + (i + 1) + ". " + esc(p.nome) + "</div></div>" +
        '<div class="bp-row-value">' + fmt(p.receita) + "</div></div>";
    }).join("") || '<div class="bp-empty">Sem vendas no mês.</div>';

    body.innerHTML =
      '<p style="font-size:.8rem;color:var(--text-muted);margin:0 0 12px">Período <strong style="color:var(--text-primary)">' + esc(d.periodo) + "</strong></p>" +
      '<div class="bp-kpi-grid">' +
        '<div class="bp-kpi"><div class="bp-kpi-label">Receita mês</div><div class="bp-kpi-value is-gold" style="font-size:.78rem">' + fmt(d.receitaMes) + "</div></div>" +
        '<div class="bp-kpi"><div class="bp-kpi-label">Despesas</div><div class="bp-kpi-value is-negative" style="font-size:.78rem">' + fmt(d.despesasMes) + "</div></div>" +
        '<div class="bp-kpi"><div class="bp-kpi-label">Lucro</div><div class="bp-kpi-value" style="font-size:.78rem">' + fmt(d.lucroMes) + "</div></div></div>" +
      '<div class="bp-kpi-grid">' +
        '<div class="bp-kpi"><div class="bp-kpi-label">Hoje</div><div class="bp-kpi-value" style="font-size:.78rem">' + fmt(d.receitaHoje) + "</div></div>" +
        '<div class="bp-kpi"><div class="bp-kpi-label">Vendas mês</div><div class="bp-kpi-value">' + d.vendasMes + "</div></div>" +
        '<div class="bp-kpi"><div class="bp-kpi-label">Ticket</div><div class="bp-kpi-value" style="font-size:.78rem">' + fmt(d.ticketMedio) + "</div></div></div>" +
      '<div class="bp-kpi-grid">' +
        '<div class="bp-kpi"><div class="bp-kpi-label">Agenda hoje</div><div class="bp-kpi-value">' + d.agendamentosHoje + "</div></div>" +
        '<div class="bp-kpi"><div class="bp-kpi-label">NPS 90d</div><div class="bp-kpi-value is-gold">' + npsTxt + "</div></div>" +
        '<div class="bp-kpi"><div class="bp-kpi-label">Stock baixo</div><div class="bp-kpi-value' + (d.stockAlert ? " is-negative" : "") + '">' + d.stockAlert + "</div></div></div>" +
      '<div class="bp-section"><div class="bp-section-title">Top profissionais (mês)</div>' + top + "</div>" +
      '<p style="font-size:.75rem;color:var(--text-muted)">Comissões geradas no mês: <strong>' + fmt(d.comissoesMes) + "</strong> · Clientes " + d.clientes + " · Equipa " + d.profissionais + "</p>";
    openShell("modal-bp-dash");
    logAudit("dashboard", "Consulta dashboard executivo");
  }

  function openReagendar() {
    ensureShell("modal-bp-reagg", "Reagendamento inteligente", "Automação", "Sugere horários livres com base na agenda e turnos.");
    renderReagendar();
    openShell("modal-bp-reagg");
  }
  function renderReagendar() {
    var body = document.getElementById("modal-bp-reagg-body");
    if (!body) return;
    var lista = (state.agendamentos || []).filter(function (a) {
      var st = String(a.status || a.estado || "").toLowerCase();
      if (st === "cancelado" || st.indexOf("conclu") === 0) return false;
      return a.data && a.data >= hojeStr();
    }).sort(function (a, b) {
      return String(a.data + a.hora).localeCompare(String(b.data + b.hora));
    }).slice(0, 40);

    if (!lista.length) {
      body.innerHTML = '<div class="bp-empty"><strong>Sem marcações futuras</strong>Crie agenda para usar o reagendamento.</div>';
      return;
    }
    var rows = lista.map(function (a) {
      return '<div class="bp-row"><div class="bp-row-main"><div class="bp-row-title">' + esc(a.cliente || "Cliente") + "</div>" +
        '<div class="bp-row-meta">' + esc(a.data) + " · " + esc(a.hora || "") +
        (a.servico ? " · " + esc(a.servico) : "") +
        (a.profissional ? " · " + esc(a.profissional) : "") + "</div></div>" +
        '<button type="button" class="bp-action-btn is-primary" data-reagg="' + a.id + '">Sugerir</button></div>';
    }).join("");
    body.innerHTML =
      '<div class="bp-section" style="margin-top:0"><div class="bp-section-title">Marcações futuras</div>' + rows + "</div>" +
      '<div id="bp-reagg-sug" style="display:none;margin-top:12px"></div>';
    body.querySelectorAll("[data-reagg]").forEach(function (btn) {
      btn.onclick = function () { showSugestoes(btn.getAttribute("data-reagg")); };
    });
  }
  function showSugestoes(agId) {
    var box = document.getElementById("bp-reagg-sug");
    if (!box) return;
    var res = sugerirReagendamento(agId);
    if (!res) return;
    var ag = res.agendamento;
    if (!res.sugestoes.length) {
      box.style.display = "block";
      box.innerHTML = '<div class="bp-empty"><strong>Sem slots livres</strong>nos próximos 14 dias para este profissional.</div>';
      return;
    }
    var items = res.sugestoes.map(function (s, i) {
      return '<button type="button" class="bp-action-btn' + (i === 0 ? " is-primary" : "") + '" style="margin:0 8px 8px 0" data-apply-data="' + s.data + '" data-apply-hora="' + s.hora + '">' +
        esc(s.data) + " · " + esc(s.hora) + "</button>";
    }).join("");
    box.style.display = "block";
    box.innerHTML =
      '<div class="bp-section-title">Sugestões para ' + esc(ag.cliente || "") + "</div>" +
      '<p style="font-size:.8rem;color:var(--text-muted);margin:0 0 10px">Actual: ' + esc(ag.data) + " " + esc(ag.hora || "") + "</p>" +
      items;
    box.querySelectorAll("[data-apply-data]").forEach(function (btn) {
      btn.onclick = async function () {
        var ok = await aplicarReagendamento(agId, btn.getAttribute("data-apply-data"), btn.getAttribute("data-apply-hora"));
        if (ok) {
          if (typeof toast === "function") toast("Reagendado com sucesso", "success");
          if (typeof renderAgenda === "function") try { renderAgenda(); } catch (e) {}
          if (typeof updateUI === "function") try { updateUI(); } catch (e) {}
          renderReagendar();
        }
      };
    });
  }

  function openExport() {
    ensureShell("modal-bp-export", "Exportar relatórios", "Gestão", "CSV compatível com Excel (separador ;).");
    var body = document.getElementById("modal-bp-export-body");
    var tipos = [
      { k: "vendas", l: "Vendas do mês" },
      { k: "despesas", l: "Despesas do mês" },
      { k: "comissoes", l: "Comissões por profissional" },
      { k: "clientes", l: "Lista de clientes" },
      { k: "agenda", l: "Agenda completa" }
    ];
    body.innerHTML =
      '<p style="font-size:.85rem;color:var(--text-secondary);line-height:1.5;margin:0 0 16px">Ficheiros CSV com BOM UTF-8 — abrem correctamente no Excel e LibreOffice.</p>' +
      tipos.map(function (t) {
        return '<button type="button" class="btn btn-secondary btn-block" style="margin-bottom:8px" data-exp="' + t.k + '">' + t.l + "</button>";
      }).join("");
    body.querySelectorAll("[data-exp]").forEach(function (btn) {
      btn.onclick = function () { exportRelatorio(btn.getAttribute("data-exp")); };
    });
    openShell("modal-bp-export");
  }

  function openBackup() {
    ensureShell("modal-bp-backup", "Backups", "Gestão", "Exportar e restaurar snapshot local (JSON).");
    var meta = safeJson(BACKUP_META_KEY, null);
    var body = document.getElementById("modal-bp-backup-body");
    body.innerHTML =
      '<div class="bp-kpi-grid">' +
        '<div class="bp-kpi"><div class="bp-kpi-label">Último backup</div><div class="bp-kpi-value" style="font-size:.7rem">' +
        (meta && meta.at ? esc(String(meta.at).slice(0, 16).replace("T", " ")) : "—") + "</div></div>" +
        '<div class="bp-kpi"><div class="bp-kpi-label">Clientes</div><div class="bp-kpi-value">' + ((state.clientes || []).length) + "</div></div>" +
        '<div class="bp-kpi"><div class="bp-kpi-label">Movimentos</div><div class="bp-kpi-value">' + ((state.movimentos || []).length) + "</div></div></div>" +
      '<p style="font-size:.85rem;color:var(--text-secondary);line-height:1.5;margin:0 0 16px">O backup inclui clientes, equipa, serviços, movimentos, agenda e dados BeautyPro no localStorage.</p>' +
      '<button type="button" class="btn btn-primary btn-block" id="bp-bk-dl" style="margin-bottom:10px">Descarregar backup JSON</button>' +
      '<div class="input-group"><label class="input-label">Restaurar a partir de ficheiro</label>' +
      '<input type="file" id="bp-bk-file" class="input-field" accept="application/json,.json"></div>';
    document.getElementById("bp-bk-dl").onclick = downloadBackup;
    document.getElementById("bp-bk-file").onchange = function (ev) {
      var file = ev.target.files && ev.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var snap = JSON.parse(reader.result);
          restoreBackupFromObject(snap);
        } catch (e) {
          if (typeof toast === "function") toast("JSON inválido", "error");
        }
      };
      reader.readAsText(file);
    };
    openShell("modal-bp-backup");
  }

  function openAudit() {
    ensureShell("modal-bp-audit", "Histórico de alterações", "Auditoria", "Últimas acções registadas neste dispositivo.");
    var body = document.getElementById("modal-bp-audit-body");
    var list = loadAudit(80);
    if (!list.length) {
      body.innerHTML = '<div class="bp-empty"><strong>Sem registos ainda</strong>As acções das novas funcionalidades aparecem aqui.</div>';
    } else {
      body.innerHTML = list.map(function (a) {
        return '<div class="bp-row"><div class="bp-row-main"><div class="bp-row-title">' + esc(a.acao) + "</div>" +
          '<div class="bp-row-meta">' + esc((a.ts || "").slice(0, 16).replace("T", " ")) +
          (a.detalhe ? " · " + esc(a.detalhe) : "") + "</div></div></div>";
      }).join("");
    }
    openShell("modal-bp-audit");
  }

  function openFiliais() {
    ensureShell("modal-bp-filiais", "Filiais", "Gestão", "Unidades do negócio. Isolamento completo de dados virá com Supabase.");
    renderFiliais();
    openShell("modal-bp-filiais");
  }
  function renderFiliais() {
    var body = document.getElementById("modal-bp-filiais-body");
    if (!body) return;
    var list = loadFiliais();
    var ativa = getFilialAtiva();
    var rows = list.map(function (f) {
      var is = ativa && ativa.id === f.id;
      return '<div class="bp-row"><div class="bp-row-main"><div class="bp-row-title">' + esc(f.nome) +
        (is ? ' <span class="bp-badge is-green">Activa</span>' : "") + "</div>" +
        '<div class="bp-row-meta">' + esc(f.localizacao || "Sem localização") +
        (f.contacto ? " · " + esc(f.contacto) : "") + "</div></div>" +
        (is ? "" : '<button type="button" class="bp-action-btn is-primary" data-filial="' + f.id + '">Activar</button>') +
        "</div>";
    }).join("");
    body.innerHTML =
      '<div class="bp-section" style="margin-top:0"><div class="bp-section-title">Unidades</div>' + rows + "</div>" +
      '<div class="bp-section"><div class="bp-section-title">Nova filial</div>' +
      '<div class="input-group"><label class="input-label">Nome</label><input id="bp-fl-nome" class="input-field" placeholder="Ex: BeautyPro Talatona"></div>' +
      '<div class="input-group"><label class="input-label">Localização</label><input id="bp-fl-loc" class="input-field" placeholder="Bairro / cidade"></div>' +
      '<div class="input-group"><label class="input-label">Contacto</label><input id="bp-fl-tel" class="input-field" placeholder="Telefone"></div>' +
      '<button type="button" class="btn btn-primary btn-block" id="bp-fl-add">Adicionar filial</button></div>' +
      '<p style="font-size:.75rem;color:var(--text-muted);line-height:1.45;margin-top:12px">Nota: o seletor de filial fica registado localmente. O isolamento total por RLS/Supabase será activado apenas quando autorizar.</p>';
    document.getElementById("bp-fl-add").onclick = function () {
      if (upsertFilial({
        nome: (document.getElementById("bp-fl-nome") || {}).value,
        localizacao: (document.getElementById("bp-fl-loc") || {}).value,
        contacto: (document.getElementById("bp-fl-tel") || {}).value
      })) {
        if (typeof toast === "function") toast("Filial criada", "success");
        renderFiliais();
      }
    };
    body.querySelectorAll("[data-filial]").forEach(function (btn) {
      btn.onclick = function () {
        setFilialAtiva(btn.getAttribute("data-filial"));
        if (typeof toast === "function") toast("Filial activa: " + (getFilialAtiva().nome || ""), "success");
        renderFiliais();
      };
    });
  }

  /* ========== MENU ========== */
  function ensureMenuItems() {
    var dd = document.getElementById("menu-dropdown");
    if (!dd || dd.querySelector('[data-bp-menu="gestao"]')) return;
    var frag = document.createDocumentFragment();
    function section(label, key) {
      var sec = document.createElement("div");
      sec.className = "bp-menu-section";
      sec.setAttribute("data-bp-menu", key);
      sec.textContent = label;
      frag.appendChild(sec);
    }
    function item(menu, key, label) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("data-bp-menu", menu);
      btn.setAttribute("data-bp-action", key);
      btn.innerHTML = "<span>" + label + "</span>";
      frag.appendChild(btn);
    }
    section("Automação", "auto");
    item("auto", "reagg", "Reagendamento");
    section("Gestão", "gestao");
    item("gestao", "dash", "Dashboard executivo");
    item("gestao", "export", "Exportar relatórios");
    item("gestao", "backup", "Backups");
    item("gestao", "audit", "Auditoria");
    item("gestao", "filiais", "Filiais");

    var logout = dd.querySelector("#logout-btn");
    if (logout) dd.insertBefore(frag, logout);
    else dd.appendChild(frag);

    if (!dd.dataset.bpGestBound) {
      dd.dataset.bpGestBound = "1";
      dd.addEventListener("click", function (e) {
        var t = e.target.closest("[data-bp-action]");
        if (!t) return;
        var menu = t.getAttribute("data-bp-menu");
        if (menu !== "gestao" && menu !== "auto") return;
        e.stopPropagation();
        dd.style.display = "none";
        var a = t.getAttribute("data-bp-action");
        try {
          if (a === "reagg") openReagendar();
          if (a === "dash") openDashboard();
          if (a === "export") openExport();
          if (a === "backup") openBackup();
          if (a === "audit") openAudit();
          if (a === "filiais") openFiliais();
        } catch (err) {
          console.error("[BPGestao]", err);
          if (typeof toast === "function") toast("Não foi possível abrir esta secção", "error");
        }
      });
    }
  }

  function init() {
    try { ensureMenuItems(); loadFiliais(); } catch (e) {
      console.warn("[gestao-fase78]", e);
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { setTimeout(init, 180); });
  } else setTimeout(init, 180);
  setTimeout(init, 2000);
  setTimeout(init, 5000);

  window.BPGestao = {
    dashboardExecutivo: dashboardExecutivo,
    sugerirReagendamento: sugerirReagendamento,
    aplicarReagendamento: aplicarReagendamento,
    exportRelatorio: exportRelatorio,
    downloadBackup: downloadBackup,
    logAudit: logAudit,
    loadAudit: loadAudit,
    getFilialAtiva: getFilialAtiva,
    setFilialAtiva: setFilialAtiva,
    loadFiliais: loadFiliais
  };
})();
