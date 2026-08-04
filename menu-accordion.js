// ================================================================
// Menu ☰ — acordeão: 8 grupos visíveis; subsecções só ao expandir
// + scroll do dropdown (max-height / overflow-y)
// ================================================================
(function () {
  "use strict";

  var GROUPS = [
    {
      key: "finance",
      label: "Financeiro",
      items: [
        { action: "fluxo", label: "Fluxo de caixa" },
        { action: "rentab", label: "Rentabilidade" },
        { action: "meta", label: "Meta do salão" },
        { action: "despesas", label: "Despesas" }
      ]
    },
    {
      key: "mkt",
      label: "Marketing",
      items: [
        { action: "fidelidade", label: "Fidelidade" },
        { action: "indicacao", label: "Indicações" },
        { action: "lembretes", label: "Lembretes WhatsApp" },
        { action: "push", label: "Notificações" }
      ]
    },
    {
      key: "equipa",
      label: "Equipa",
      items: [
        { action: "ranking", label: "Ranking" },
        { action: "horarios", label: "Horários e folgas" },
        { action: "chat", label: "Chat interno" }
      ]
    },
    {
      key: "ops",
      label: "Operações",
      items: [
        { action: "stock", label: "Stock de produtos" },
        { action: "forn", label: "Fornecedores e compras" }
      ]
    },
    {
      key: "crm",
      label: "CRM",
      items: [
        { action: "nps", label: "Avaliação NPS" },
        { action: "timeline", label: "Histórico do cliente" },
        { action: "cal", label: "Calendário (.ics)" },
        { action: "galeria", label: "Galeria de serviços" }
      ]
    },
    {
      key: "com",
      label: "Comercial",
      items: [
        { action: "pacotes", label: "Pacotes e assinaturas" }
      ]
    },
    {
      key: "auto",
      label: "Automação",
      items: [
        { action: "reagg", label: "Reagendamento" }
      ]
    },
    {
      key: "gestao",
      label: "Gestão",
      items: [
        { action: "dash", label: "Dashboard executivo" },
        { action: "export", label: "Exportar relatórios" },
        { action: "backup", label: "Backups" },
        { action: "audit", label: "Auditoria" },
        { action: "filiais", label: "Filiais" }
      ]
    }
  ];

  function chevronSvg() {
    return '<svg class="bp-acc-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>';
  }

  function stripLegacy(dd) {
    // remove flat injections from feature modules (keep logout + our accordion)
    Array.prototype.slice.call(dd.querySelectorAll("[data-bp-menu], .bp-menu-section")).forEach(function (el) {
      if (el.closest && el.closest(".bp-acc-group")) return;
      if (el.classList && el.classList.contains("bp-acc-toggle")) return;
      if (el.classList && el.classList.contains("bp-acc-panel")) return;
      el.parentNode && el.parentNode.removeChild(el);
    });
  }

  function buildAccordion(dd) {
    if (dd.querySelector(".bp-acc-root")) return;

    stripLegacy(dd);

    var root = document.createElement("div");
    root.className = "bp-acc-root";

    GROUPS.forEach(function (g) {
      var group = document.createElement("div");
      group.className = "bp-acc-group";
      group.setAttribute("role", "group");
      group.setAttribute("aria-label", g.label);

      var toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "bp-acc-toggle";
      toggle.setAttribute("data-bp-menu", g.key); // impede re-injecção dos módulos
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("data-acc-key", g.key);
      toggle.innerHTML = "<span>" + g.label + "</span>" + chevronSvg();

      var panel = document.createElement("div");
      panel.className = "bp-acc-panel";
      panel.setAttribute("data-acc-panel", g.key);
      panel.hidden = true;

      g.items.forEach(function (it) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.setAttribute("data-bp-menu", g.key);
        btn.setAttribute("data-bp-action", it.action);
        btn.innerHTML = "<span>" + it.label + "</span>";
        panel.appendChild(btn);
      });

      group.appendChild(toggle);
      group.appendChild(panel);
      root.appendChild(group);
    });

    var logout = dd.querySelector("#logout-btn");
    if (logout) dd.insertBefore(root, logout);
    else dd.appendChild(root);

    // Acções dos itens (galeria, nps, etc.) — o acordeão só abria painéis
    root.addEventListener("click", function (e) {
      var actBtn = e.target.closest("[data-bp-action]");
      if (actBtn && root.contains(actBtn) && !actBtn.classList.contains("bp-acc-toggle")) {
        e.preventDefault();
        e.stopPropagation();
        var a = actBtn.getAttribute("data-bp-action");
        var menu = actBtn.getAttribute("data-bp-menu") || "";
        try {
          var dd = document.getElementById("menu-dropdown");
          if (dd) dd.style.display = "none";
          function call() {
            var args = Array.prototype.slice.call(arguments);
            var fn = args.shift();
            if (typeof fn === "function") { fn.apply(null, args); return true; }
            return false;
          }
          var ok = false;
          if (a === "galeria") {
            ok = call(window.openGaleria) || call(window.BPMedia && BPMedia.openGaleria);
            if (!ok) {
              console.warn("[menu] openGaleria ausente — BPMedia?", !!window.BPMedia);
            }
          } else if (a === "stock") ok = call(window.BPOps && BPOps.openStock);
          else if (a === "forn") ok = call(window.BPOps && BPOps.openFornecedores);
          else if (a === "nps") ok = call(window.BPOps && BPOps.openNps);
          else if (a === "timeline") ok = call(window.BPOps && BPOps.openTimeline);
          else if (a === "cal") ok = call(window.BPOps && BPOps.openCalendario);
          else if (a === "pacotes") ok = call(window.BPOps && BPOps.openPacotes);
          else if (a === "ranking") ok = call(window.BPEquipa && BPEquipa.openRanking);
          else if (a === "horarios") ok = call(window.BPEquipa && BPEquipa.openHorarios);
          else if (a === "chat") ok = call(window.BPEquipa && BPEquipa.openChat);
          else if (a === "fluxo") ok = call(window.BPFinance && (BPFinance.openModalFluxo || BPFinance.openFluxo));
          else if (a === "rentab") ok = call(window.BPFinance && (BPFinance.openModalRentabilidade || BPFinance.openRentabilidade));
          else if (a === "meta") ok = call(window.BPFinance && (BPFinance.openModalMetaSalao || BPFinance.openMeta));
          else if (a === "despesas") ok = call(window.BPFinance && (BPFinance.openModalDespesaEnh || BPFinance.openDespesas));
          else if (a === "fidelidade") ok = call(window.BPMarketing && (BPMarketing.openModalFidelidade || BPMarketing.openFidelidade));
          else if (a === "indicacao") ok = call(window.BPMarketing && (BPMarketing.openModalIndicacao || BPMarketing.openIndicacao));
          else if (a === "lembretes") ok = call(window.BPMarketing && (BPMarketing.openModalLembretes || BPMarketing.openLembretes));
          else if (a === "push") ok = call(window.BPMarketing && (BPMarketing.pedirPermissaoPush || BPMarketing.openPush));
          else if (a === "dash") ok = call(window.BPGestao && (BPGestao.openDashboard || BPGestao.dashboardExecutivo));
          else if (a === "export") ok = call(window.BPGestao && (BPGestao.openExport || BPGestao.exportRelatorio));
          else if (a === "backup") ok = call(window.BPGestao && (BPGestao.openBackup || BPGestao.downloadBackup));
          else if (a === "audit") ok = call(window.BPGestao && (BPGestao.openAudit || BPGestao.loadAudit));
          else if (a === "filiais") ok = call(window.BPGestao && (BPGestao.openFiliais || BPGestao.loadFiliais));
          else if (a === "reagg") ok = call(window.BPGestao && BPGestao.openReagendar);
          if (!ok && typeof toast === "function") toast("Função indisponível neste momento", "warning");
        } catch (err) {
          console.error("[menu-accordion] action", a, err);
          if (typeof toast === "function") toast("Não foi possível abrir", "error");
        }
        return;
      }
    });

    // toggle acordeão — um aberto de cada vez
    root.addEventListener("click", function (e) {
      var tog = e.target.closest(".bp-acc-toggle");
      if (!tog || !root.contains(tog)) return;
      e.preventDefault();
      e.stopPropagation();
      var key = tog.getAttribute("data-acc-key");
      var open = tog.getAttribute("aria-expanded") === "true";
      root.querySelectorAll(".bp-acc-toggle").forEach(function (t) {
        t.setAttribute("aria-expanded", "false");
      });
      root.querySelectorAll(".bp-acc-panel").forEach(function (p) {
        p.classList.remove("open");
        p.hidden = true;
      });
      if (!open) {
        tog.setAttribute("aria-expanded", "true");
        var panel = root.querySelector('[data-acc-panel="' + key + '"]');
        if (panel) {
          panel.hidden = false;
          panel.classList.add("open");
        }
        // garantir que o item expandido fica visível no scroll
        try {
          tog.scrollIntoView({ block: "nearest", behavior: "smooth" });
        } catch (err) {}
      }
    });
  }

  function ensureScrollable(dd) {
    dd.style.maxHeight = "min(70vh, 420px)";
    dd.style.overflowX = "hidden";
    dd.style.overflowY = "auto";
    dd.style.webkitOverflowScrolling = "touch";
  }

  function mount() {
    var dd = document.getElementById("menu-dropdown");
    if (!dd) return;
    ensureScrollable(dd);
    // limpar legados que módulos possam ter injectado
    if (!dd.querySelector(".bp-acc-root")) {
      stripLegacy(dd);
      buildAccordion(dd);
    } else {
      // se módulos injectaram irmãos fora do acordeão, remover
      Array.prototype.slice.call(dd.children).forEach(function (ch) {
        if (ch.id === "logout-btn") return;
        if (ch.classList && ch.classList.contains("bp-acc-root")) return;
        if (ch.hasAttribute && ch.hasAttribute("data-bp-menu")) ch.remove();
        if (ch.classList && ch.classList.contains("bp-menu-section")) ch.remove();
      });
    }
  }

  function init() {
    try {
      mount();
      try {
        document.dispatchEvent(new CustomEvent("bp-menu-accordion-ready"));
      } catch (_) {}
    } catch (e) { console.warn("[menu-accordion]", e); }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      setTimeout(init, 200);
    });
  } else setTimeout(init, 200);
  // depois dos módulos de features (que injectam a ~100–5000ms)
  setTimeout(init, 600);
  setTimeout(init, 1800);
  setTimeout(init, 4500);
})();
