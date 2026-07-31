// ================================================================
// Desktop shell — top bar, sidebar brand, agenda master-detail
// Only enhances UX on >=1024px. No business logic changes.
// ================================================================
(function () {
  "use strict";

  function isDesktop() {
    return window.matchMedia && window.matchMedia("(min-width: 1024px)").matches;
  }

  function esc(s) {
    return typeof escHtml === "function" ? escHtml(String(s == null ? "" : s)) : String(s == null ? "" : s);
  }
  function money(v) {
    return typeof fmtKz === "function" ? fmtKz(v) : Math.round(Number(v) || 0) + " Kz";
  }

  /* ---------- Top bar ---------- */
  function ensureTopbar() {
    var container = document.querySelector(".app-container");
    if (!container || document.querySelector(".bp-desk-topbar")) return;
    var bar = document.createElement("div");
    bar.className = "bp-desk-topbar";
    bar.innerHTML =
      '<div class="bp-desk-search" role="search">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>' +
        '<input type="search" id="bp-desk-q" placeholder="Pesquisar clientes, serviços…" autocomplete="off" />' +
        "<kbd>/</kbd>" +
      "</div>" +
      '<div class="bp-desk-actions">' +
        '<span class="bp-desk-status"><span class="dot"></span>Local</span>' +
        '<button type="button" class="bp-desk-chip" id="bp-desk-agenda">Agenda</button>' +
        '<button type="button" class="bp-desk-chip" id="bp-desk-caixa">Caixa</button>' +
        '<button type="button" class="bp-desk-chip is-primary" id="bp-desk-nova">+ Novo</button>' +
      "</div>";
    // insert as first child so grid area top works — actually grid assigns by area; need to be in container
    var header = container.querySelector(".app-header");
    if (header) container.insertBefore(bar, header);
    else container.insertBefore(bar, container.firstChild);

    var q = document.getElementById("bp-desk-q");
    if (q) {
      q.addEventListener("input", function () {
        var val = q.value;
        var searchCli = document.getElementById("search-cliente");
        if (searchCli) {
          searchCli.value = val;
          searchCli.dispatchEvent(new Event("input", { bubbles: true }));
        }
      });
      q.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          // go to clients tab
          var btn = document.querySelector('.nav-item[data-tab="clientes"]');
          if (btn) btn.click();
        }
      });
    }
    var go = function (tab) {
      var btn = document.querySelector('.nav-item[data-tab="' + tab + '"]');
      if (btn) btn.click();
    };
    var a = document.getElementById("bp-desk-agenda");
    if (a) a.onclick = function () { go("agenda"); };
    var c = document.getElementById("bp-desk-caixa");
    if (c) c.onclick = function () { go("caixa"); };
    var n = document.getElementById("bp-desk-nova");
    if (n) n.onclick = function () {
      var fab = document.querySelector(".fab");
      if (fab) fab.click();
    };
  }

  /* ---------- Sidebar brand + label ---------- */
  function ensureSidebar() {
    var nav = document.querySelector(".bottom-nav");
    if (!nav || nav.querySelector(".bp-side-brand")) return;
    var brand = document.createElement("div");
    brand.className = "bp-side-brand";
    brand.innerHTML =
      '<img src="logo.png" alt="">' +
      '<div class="bp-side-brand-text">Beauty<span>Pro</span></div>';
    var label = document.createElement("div");
    label.className = "bp-side-label";
    label.textContent = "Menu principal";
    nav.insertBefore(label, nav.firstChild);
    nav.insertBefore(brand, nav.firstChild);
  }

  /* ---------- Agenda master-detail ---------- */
  function ensureAgendaWorkspace() {
    var list = document.getElementById("agenda-full-list");
    if (!list) return;
    if (list.closest(".bp-agenda-workspace")) return;
    var parent = list.parentNode;
    var wrap = document.createElement("div");
    wrap.className = "bp-agenda-workspace";
    var col = document.createElement("div");
    col.className = "bp-agenda-list-col";
    parent.insertBefore(wrap, list);
    col.appendChild(list);
    wrap.appendChild(col);
    var detail = document.createElement("aside");
    detail.className = "bp-agenda-detail is-empty";
    detail.id = "bp-agenda-detail";
    detail.innerHTML = "<div><strong>Seleccione uma marcação</strong><br>Os detalhes e acções aparecem aqui.</div>";
    wrap.appendChild(detail);
  }

  function showAgendaDetail(id) {
    var detail = document.getElementById("bp-agenda-detail");
    if (!detail || !isDesktop()) return;
    var ag = (state.agendamentos || []).find(function (a) { return a.id === id; });
    if (!ag) return;
    document.querySelectorAll(".bp-ag-card.is-selected").forEach(function (el) {
      el.classList.remove("is-selected");
    });
    var card = document.querySelector('.bp-ag-card[data-agenda-id="' + id + '"]');
    if (card) card.classList.add("is-selected");

    var nomeProf = typeof getProfissionalNome === "function"
      ? getProfissionalNome(ag.profissional_id)
      : (ag.profissional || "—");
    var st = ag.status || "agendado";
    var stLabel = st === "realizado" ? "Realizado"
      : st === "cancelado" ? "Cancelado"
      : st === "nao_realizado" ? "Não realizado" : "Agendado";
    var stNorm = String(st || "agendado").toLowerCase();
    var podeFinalizar = stNorm === "agendado";
    var podeCancelar = stNorm === "agendado";
    var podeWhatsApp = false;
    try {
      if (window.BPAgendaUI && typeof BPAgendaUI.clienteTelefone === "function") {
        podeWhatsApp = !!BPAgendaUI.clienteTelefone(ag);
      }
    } catch (e) {}

    var cells = [];
    if (podeFinalizar) {
      cells.push('<button type="button" class="btn btn-sm btn-primary bp-ag-btn" data-id="' + ag.id + '" data-action="finalizar">Finalizar</button>');
      cells.push('<button type="button" class="btn btn-sm btn-secondary bp-ag-btn" data-id="' + ag.id + '" data-action="reagendar-agenda">Reagendar</button>');
    }
    if (podeWhatsApp) {
      cells.push('<button type="button" class="btn btn-sm btn-secondary bp-ag-btn" data-id="' + ag.id + '" data-action="whatsapp-agenda">WhatsApp</button>');
    } else if (podeFinalizar) {
      cells.push('<button type="button" class="btn btn-sm btn-secondary bp-ag-btn" disabled title="Cliente sem telefone">WhatsApp</button>');
    }
    if (podeCancelar) {
      cells.push('<button type="button" class="btn btn-sm btn-secondary bp-ag-btn bp-ag-btn-muted" data-id="' + ag.id + '" data-action="cancelar-agenda">Cancelar</button>');
    }
    var cols = cells.length <= 2 ? cells.length || 1 : 2;
    var actionsHtml = cells.length
      ? '<div class="bp-ag-actions bp-ad-actions" style="--bp-ag-cols:' + cols + '">' + cells.join("") + "</div>"
      : "";

    detail.classList.remove("is-empty");
    detail.innerHTML =
      '<div class="bp-ad-time">' + esc(String(ag.hora || "").slice(0, 5)) + " · " + esc(ag.data || "") + "</div>" +
      '<div class="bp-ad-title">' + esc(ag.servico || "Serviço") + "</div>" +
      '<div class="bp-ad-row"><span>Cliente</span><span>' + esc(ag.cliente || "—") + "</span></div>" +
      '<div class="bp-ad-row"><span>Profissional</span><span>' + esc(nomeProf) + "</span></div>" +
      '<div class="bp-ad-row"><span>Valor</span><span>' + money(ag.preco) + "</span></div>" +
      '<div class="bp-ad-row"><span>Estado</span><span>' + esc(stLabel) + "</span></div>" +
      actionsHtml;

    detail.querySelectorAll("[data-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-action");
        var aid = btn.getAttribute("data-id");
        if (action === "finalizar" && typeof abrirFinalizarAtendimento === "function") {
          abrirFinalizarAtendimento(aid);
        } else if (action === "reagendar-agenda" && typeof abrirReagendarAgendamento === "function") {
          abrirReagendarAgendamento(aid);
        } else if (action === "whatsapp-agenda") {
          var src = document.querySelector('[data-action="whatsapp-agenda"][data-id="' + aid + '"]');
          if (src && src !== btn) src.click();
          else {
            try {
              var href = window.BPAgendaUI && BPAgendaUI.waHref && BPAgendaUI.waHref(ag);
              if (href) window.open(href, "_blank", "noopener,noreferrer");
            } catch (err) {}
          }
        } else {
          var src2 = document.querySelector('[data-action="' + action + '"][data-id="' + aid + '"]');
          if (src2 && src2 !== btn) src2.click();
        }
      });
    });
  }

  function bindAgendaClicks() {
    var list = document.getElementById("agenda-full-list");
    if (!list || list.dataset.bpDeskBound) return;
    list.dataset.bpDeskBound = "1";
    list.addEventListener("click", function (e) {
      if (!isDesktop()) return;
      var card = e.target.closest(".bp-ag-card, .timeline-item");
      if (!card) return;
      // don't intercept action buttons inside card
      if (e.target.closest("[data-action]")) return;
      var id = card.getAttribute("data-agenda-id");
      if (!id) {
        // timeline-item may not have id — skip
        return;
      }
      showAgendaDetail(id);
    });
  }

  /* ---------- Dashboard attention strip ---------- */
  function ensureDashAttention() {
    if (!isDesktop()) return;
    var tab = document.getElementById("tab-dashboard");
    if (!tab) return;
    var inner = tab.querySelector(".tab-inner");
    if (!inner || inner.querySelector(".bp-desk-attention")) return;
    var strip = document.createElement("div");
    strip.className = "bp-desk-attention";
    strip.id = "bp-desk-attention";
    // insert after greeting row if possible
    var first = inner.firstElementChild;
    if (first) inner.insertBefore(strip, first.nextSibling);
    else inner.insertBefore(strip, inner.firstChild);
    refreshDashAttention();
  }

  function refreshDashAttention() {
    var strip = document.getElementById("bp-desk-attention");
    if (!strip || !isDesktop()) return;
    var hoje = typeof window.hoje === "function" ? window.hoje() : new Date().toISOString().slice(0, 10);
    var ags = (state.agendamentos || []).filter(function (a) {
      return a.data === hoje && String(a.status || "").toLowerCase() !== "cancelado";
    });
    var pend = ags.filter(function (a) { return a.status === "agendado" || !a.status; }).length;
    var done = ags.filter(function (a) { return a.status === "realizado"; }).length;
    var vendas = (state.movimentos || []).filter(function (m) {
      return m.tipo === "venda" && m.data === hoje;
    });
    var rec = vendas.reduce(function (s, m) { return s + (Number(m.valor) || 0); }, 0);
    strip.innerHTML =
      '<div class="bp-att-card"><div class="bp-att-label">Agenda hoje</div><div class="bp-att-value">' + ags.length + "</div></div>" +
      '<div class="bp-att-card"><div class="bp-att-label">Por realizar</div><div class="bp-att-value' + (pend ? " is-alert" : "") + '">' + pend + "</div></div>" +
      '<div class="bp-att-card"><div class="bp-att-label">Receita hoje</div><div class="bp-att-value">' + money(rec) + "</div></div>";
  }

  /* ---------- Keyboard ---------- */
  function bindKeys() {
    if (document.body.dataset.bpDeskKeys) return;
    document.body.dataset.bpDeskKeys = "1";
    document.addEventListener("keydown", function (e) {
      if (!isDesktop()) return;
      var tag = (e.target && e.target.tagName) || "";
      var typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || e.target.isContentEditable;
      if (e.key === "/" && !typing) {
        e.preventDefault();
        var q = document.getElementById("bp-desk-q");
        if (q) q.focus();
        return;
      }
      if (typing) return;
      var map = { "1": "dashboard", "2": "agenda", "3": "clientes", "4": "caixa", "5": "equipa" };
      if (map[e.key]) {
        var btn = document.querySelector('.nav-item[data-tab="' + map[e.key] + '"]');
        if (btn) btn.click();
      }
    });
  }

  function mount() {
    if (!document.querySelector(".app-container")) return;
    ensureTopbar();
    ensureSidebar();
    ensureAgendaWorkspace();
    bindAgendaClicks();
    ensureDashAttention();
    bindKeys();
    // toggle topbar visibility with media
    var bar = document.querySelector(".bp-desk-topbar");
    if (bar) bar.hidden = !isDesktop();
  }

  function init() {
    try { mount(); } catch (e) { console.warn("[desktop-shell]", e); }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { setTimeout(init, 250); });
  } else setTimeout(init, 250);
  setTimeout(init, 1000);
  setTimeout(init, 3000);

  window.addEventListener("resize", function () {
    var bar = document.querySelector(".bp-desk-topbar");
    if (bar) bar.hidden = !isDesktop();
  });

  document.addEventListener("click", function (e) {
    if (e.target.closest(".nav-item[data-tab]")) {
      setTimeout(function () {
        ensureAgendaWorkspace();
        bindAgendaClicks();
        if (e.target.closest('[data-tab="dashboard"]') || document.querySelector('.nav-item[data-tab="dashboard"].active')) {
          ensureDashAttention();
          refreshDashAttention();
        }
      }, 120);
    }
  });

  // refresh attention when data may change
  setInterval(function () {
    if (isDesktop() && document.querySelector("#tab-dashboard.active")) refreshDashAttention();
  }, 8000);

  window.BPDesktopShell = { mount: mount, showAgendaDetail: showAgendaDetail };
})();
