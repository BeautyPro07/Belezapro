/* BeautyPro — Agenda cards + acções (Ag-2)
   Hierarquia: Finalizar (primário) · WhatsApp · Cancelar
   Todos os botões: mesma altura, grelha estável, área de toque ≥40px
*/
(function () {
  "use strict";

  function esc(s) {
    return typeof escHtml === "function" ? escHtml(String(s || "")) : String(s || "");
  }
  function money(v) {
    return typeof fmtKz === "function" ? fmtKz(v) : String(v || 0) + " Kz";
  }
  function statusOf(a) {
    if (typeof _statusAg === "function") return _statusAg(a);
    return String((a && (a.status || a.estado)) || "agendado").toLowerCase();
  }
  function profName(a) {
    if (typeof getProfissionalNome === "function") return getProfissionalNome(a.profissional_id);
    return a.profissional || "—";
  }
  function clienteTelefone(ag) {
    var list = (typeof state !== "undefined" && state.clientes) || [];
    var c = list.find(function (x) {
      return (ag.cliente_id && x.id === ag.cliente_id) || (ag.cliente && x.nome === ag.cliente);
    });
    if (!c || !c.telefone) return "";
    return String(c.telefone).replace(/\D/g, "");
  }
  function waHref(ag) {
    var digits = clienteTelefone(ag);
    if (!digits) return "";
    var num = digits.length === 9 ? "244" + digits : digits;
    var msg =
      "Olá " +
      (ag.cliente || "") +
      ", lembrete do seu agendamento de " +
      (ag.servico || "serviço") +
      " no dia " +
      (ag.data || "") +
      " às " +
      String(ag.hora || "").slice(0, 5) +
      ".";
    return "https://wa.me/" + num + "?text=" + encodeURIComponent(msg);
  }

  function renderAgendaItemPro(a) {
    if (!a) return "";
    var st = statusOf(a);
    var isRealizado = st === "realizado";
    var isCancelado = st === "cancelado";
    var isExpirado = st === "nao_realizado" || st === "nao-realizado" || st === "expirado";
    var isAgendado = st === "agendado";
    var expirado =
      typeof agendamentoExpirado === "function" ? agendamentoExpirado(a) : false;
    var podeFinalizar = isAgendado && !expirado;
    var podeCancelar = isAgendado;
    var podeWhatsApp = isAgendado && !!clienteTelefone(a);

    var statusLabel = "Agendado";
    var statusClass = "bp-ag-st-agendado";
    if (isRealizado) {
      statusLabel = "Realizado";
      statusClass = "bp-ag-st-ok";
    } else if (isCancelado) {
      statusLabel = "Cancelado";
      statusClass = "bp-ag-st-off";
    } else if (isExpirado) {
      statusLabel = "Não realizado";
      statusClass = "bp-ag-st-no";
    }

    var hora = String(a.hora || "").slice(0, 5);
    var nomeProf = profName(a);

    var avHtml =
      '<div class="avatar bp-ag-avatar">' + esc((a.cliente || "?").charAt(0).toUpperCase()) + "</div>";
    try {
      var cli = ((typeof state !== "undefined" && state.clientes) || []).find(function (c) {
        return c.nome === a.cliente || c.id === a.cliente_id;
      });
      if (cli && cli.foto) {
        avHtml =
          '<div class="avatar bp-avatar-img bp-ag-avatar"><img src="' +
          cli.foto +
          '" alt="" loading="lazy" decoding="async"></div>';
      } else if (window.BPAvatars && typeof BPAvatars.avatarDataUrl === "function") {
        avHtml =
          '<div class="avatar bp-avatar-img bp-ag-avatar"><img src="' +
          BPAvatars.avatarDataUrl(a.cliente || "") +
          '" alt="" loading="lazy" decoding="async"></div>';
      }
    } catch (e) {}

    var actions = "";
    if (podeFinalizar || podeWhatsApp || podeCancelar) {
      var cells = [];
      if (podeFinalizar) {
        cells.push(
          '<button type="button" class="btn btn-sm btn-primary bp-ag-btn" data-id="' +
            a.id +
            '" data-action="finalizar">Finalizar</button>'
        );
        cells.push(
          '<button type="button" class="btn btn-sm btn-secondary bp-ag-btn" data-id="' +
            a.id +
            '" data-action="reagendar-agenda">Reagendar</button>'
        );
      }
      if (podeWhatsApp) {
        cells.push(
          '<button type="button" class="btn btn-sm btn-secondary bp-ag-btn" data-id="' +
            a.id +
            '" data-action="whatsapp-agenda" aria-label="WhatsApp">WhatsApp</button>'
        );
      } else if (podeFinalizar) {
        cells.push(
          '<button type="button" class="btn btn-sm btn-secondary bp-ag-btn" disabled title="Cliente sem telefone">WhatsApp</button>'
        );
      }
      if (podeCancelar) {
        cells.push(
          '<button type="button" class="btn btn-sm btn-secondary bp-ag-btn bp-ag-btn-muted" data-id="' +
            a.id +
            '" data-action="cancelar-agenda" data-role="admin,gerente" aria-label="Cancelar marcação">Cancelar</button>'
        );
      }
      // 1–2 acções: uma linha; 3–4: grelha 2×2 (altura igual, sem desalinhamento)
      var cols = cells.length <= 2 ? cells.length : 2;
      actions =
        '<div class="bp-ag-actions" style="--bp-ag-cols:' +
        cols +
        '">' +
        cells.join("") +
        "</div>";
    }

    return (
      '<div class="list-item bp-ag-card" data-agenda-id="' +
      a.id +
      '">' +
      avHtml +
      '<div class="info bp-ag-info">' +
      '<div class="bp-ag-top">' +
      '<span class="bp-ag-time">' +
      esc(hora) +
      "</span>" +
      '<span class="bp-ag-status ' +
      statusClass +
      '">' +
      statusLabel +
      "</span>" +
      "</div>" +
      '<div class="title">' +
      esc(a.servico || "Serviço") +
      "</div>" +
      '<div class="sub">' +
      esc(a.cliente || "Cliente") +
      "</div>" +
      '<div class="bp-ag-meta">' +
      '<span class="bp-ag-prof">' +
      esc(nomeProf) +
      "</span>" +
      '<span class="bp-ag-price">' +
      money(a.preco) +
      "</span>" +
      "</div>" +
      actions +
      "</div></div>"
    );
  }

  function install() {
    try {
      if (typeof renderAgendaItem === "function") renderAgendaItem = renderAgendaItemPro;
    } catch (e) {}
    window.renderAgendaItem = renderAgendaItemPro;
  }

  function init() {
    install();
    try {
      if (typeof renderAgendaFull === "function") {
        var tab = document.getElementById("tab-agenda");
        if (tab && tab.classList.contains("active")) renderAgendaFull();
      }
    } catch (e) {}
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      setTimeout(init, 200);
    });
  } else setTimeout(init, 200);
  setTimeout(init, 1000);

  document.addEventListener("click", function (e) {
    if (e.target.closest('[data-tab="agenda"]')) {
      install();
      setTimeout(function () {
        try {
          if (typeof renderAgendaFull === "function") renderAgendaFull();
        } catch (err) {}
      }, 60);
    }
  });

  window.BPAgendaUI = {
    renderAgendaItemPro: renderAgendaItemPro,
    install: install,
    clienteTelefone: clienteTelefone,
    waHref: waHref,
  };
})();
