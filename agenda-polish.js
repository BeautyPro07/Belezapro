// ================================================================
// Agenda — cards profissionais (paridade com Clientes/Equipa)
// ================================================================
(function () {
  "use strict";

  function esc(s) {
    return typeof escHtml === "function" ? escHtml(String(s == null ? "" : s)) : String(s == null ? "" : s);
  }
  function money(v) {
    return typeof fmtKz === "function" ? fmtKz(v) : Math.round(Number(v) || 0) + " Kz";
  }
  function avatarFor(nome) {
    if (window.BPAvatars && BPAvatars.avatarDataUrl) return BPAvatars.avatarDataUrl(nome);
    var ini = (nome || "?").charAt(0).toUpperCase();
    return null;
  }

  function renderAgendaItemPro(a) {
    var isRealizado = a.status === "realizado";
    var isCancelado = a.status === "cancelado";
    var isExpirado = a.status === "nao_realizado";
    if (a.status === "agendado") {
      try {
        if (typeof agendamentoExpirado === "function" && agendamentoExpirado(a)) {
          a.status = "nao_realizado";
          isExpirado = true;
          if (typeof dbPut === "function") dbPut("agendamentos", a);
        }
      } catch (e) {}
    }
    var podeFinalizar = a.status === "agendado";
    var podeCancelar = a.status === "agendado";
    var nomeProf = typeof getProfissionalNome === "function" ? getProfissionalNome(a.profissional_id) : a.profissional || "—";

    var statusLabel = "Agendado";
    var statusClass = "bp-ag-st-agendado";
    if (isRealizado) { statusLabel = "Realizado"; statusClass = "bp-ag-st-ok"; }
    else if (isCancelado) { statusLabel = "Cancelado"; statusClass = "bp-ag-st-off"; }
    else if (isExpirado || a.status === "nao_realizado") { statusLabel = "Não realizado"; statusClass = "bp-ag-st-no"; }

    var hora = String(a.hora || "").slice(0, 5);
    var avSrc = avatarFor(a.cliente || "");
    var avHtml = avSrc
      ? '<div class="avatar bp-avatar-img bp-ag-avatar"><img src="' + avSrc + '" alt="" loading="lazy" decoding="async"></div>'
      : '<div class="avatar bp-ag-avatar">' + esc((a.cliente || "?").charAt(0).toUpperCase()) + "</div>";

    // foto real do cliente se existir
    try {
      var cli = (state.clientes || []).find(function (c) {
        return c.nome === a.cliente || c.id === a.cliente_id;
      });
      if (cli && cli.foto) {
        avHtml = '<div class="avatar bp-avatar-img bp-ag-avatar"><img src="' + cli.foto + '" alt="" loading="lazy" decoding="async"></div>';
      }
    } catch (e) {}

    var actions = "";
    if (podeFinalizar || podeCancelar) {
      actions = '<div class="bp-ag-actions">' +
        (podeFinalizar
          ? '<button type="button" class="btn btn-sm bp-ag-btn-primary" data-id="' + a.id + '" data-action="finalizar">Finalizar</button>'
          : "") +
        (podeCancelar
          ? '<button type="button" class="btn btn-sm btn-secondary bp-ag-btn-cancel" data-id="' + a.id + '" data-action="cancelar-agenda" data-role="admin,gerente" aria-label="Cancelar" title="Cancelar">Cancelar</button>'
          : "") +
        "</div>";
    }

    return (
      '<div class="list-item bp-ag-card" data-agenda-id="' + a.id + '">' +
        avHtml +
        '<div class="info bp-ag-info">' +
          '<div class="bp-ag-top">' +
            '<span class="bp-ag-time">' + esc(hora) + "</span>" +
            '<span class="bp-ag-status ' + statusClass + '">' + statusLabel + "</span>" +
          "</div>" +
          '<div class="title">' + esc(a.servico || "Serviço") + "</div>" +
          '<div class="sub">' + esc(a.cliente || "Cliente") + "</div>" +
          '<div class="bp-ag-meta">' +
            '<span class="bp-ag-prof">' + esc(nomeProf) + "</span>" +
            '<span class="bp-ag-price">' + money(a.preco) + "</span>" +
          "</div>" +
          actions +
        "</div>" +
      "</div>"
    );
  }

  function patch() {
    if (typeof window.renderAgendaItem === "function") {
      window.renderAgendaItem = renderAgendaItemPro;
    }
    // also assign in global scope if const-bound — re-render if possible
    try {
      if (typeof renderAgendaFull === "function") {
        var tab = document.getElementById("tab-agenda");
        if (tab && tab.classList.contains("active")) renderAgendaFull();
      }
    } catch (e) {}
  }

  // bundle may use function declaration (global)
  function install() {
    try {
      if (typeof renderAgendaItem === "function") {
        // overwrite global
        renderAgendaItem = renderAgendaItemPro;
      }
      window.renderAgendaItem = renderAgendaItemPro;
    } catch (e) {
      window.renderAgendaItem = renderAgendaItemPro;
    }
    try {
      if (typeof renderAgendaFull === "function") {
        var orig = renderAgendaFull;
        // no wrap needed if item is global
      }
    } catch (e) {}
  }

  function reRender() {
    try {
      if (typeof renderAgendaFull === "function") renderAgendaFull();
    } catch (e) {}
  }

  function init() {
    install();
    setTimeout(reRender, 100);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { setTimeout(init, 300); });
  } else setTimeout(init, 300);
  setTimeout(init, 1200);
  setTimeout(init, 3000);

  // when switching to agenda tab
  document.addEventListener("click", function (e) {
    if (e.target.closest('[data-tab="agenda"], #tab-btn-agenda, [data-target="agenda"]')) {
      install();
      setTimeout(reRender, 80);
    }
  });

  window.BPAgendaUI = { renderAgendaItemPro: renderAgendaItemPro, install: install };
})();
