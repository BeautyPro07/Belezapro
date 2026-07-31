// ================================================================
// Avatars realistas nas listas Clientes + Equipa (pós-bundle)
// ================================================================
(function () {
  "use strict";

  function srcFor(nome, foto, entity) {
    if (entity && window.BPMedia && typeof BPMedia.resolveFotoSrc === "function") {
      var r = BPMedia.resolveFotoSrc(entity);
      if (r) return r;
    }
    if (foto) return foto;
    if (entity && entity.foto_url) return entity.foto_url;
    if (window.BPAvatars && typeof BPAvatars.avatarDataUrl === "function") {
      return BPAvatars.avatarDataUrl(nome || "");
    }
    return null;
  }

  function applyAvatar(av, nome, foto, entity) {
    if (!av) return;
    var id = entity && entity.id != null ? String(entity.id) : "";
    var src = srcFor(nome, foto, entity);
    if (!src) return;
    var img = av.querySelector("img");
    // Isolamento: só reutilizar DOM se for a MESMA entidade e o MESMO src
    if (id && av.getAttribute("data-avatar-entity") === id && img && img.getAttribute("src") === src) return;
    if (id) av.setAttribute("data-avatar-entity", id);
    else av.removeAttribute("data-avatar-entity");
    av.classList.add("bp-avatar-img");
    av.innerHTML = '<img src="' + src + '" alt="" loading="lazy" decoding="async"' +
      (id ? ' data-avatar-entity="' + id + '"' : '') + '>';
  }

  function enhanceClientes() {
    try {
      document.querySelectorAll(".cliente-item[data-cliente-id]").forEach(function (row) {
        var id = row.getAttribute("data-cliente-id");
        var c = (state.clientes || []).find(function (x) { return x.id === id; });
        if (!c) return;
        applyAvatar(row.querySelector(".avatar"), c.nome, c.foto, c);
      });
    } catch (e) {}
  }

  function enhanceProfissionais() {
    try {
      document.querySelectorAll(".list-item[data-prof-id]").forEach(function (row) {
        var id = row.getAttribute("data-prof-id");
        // avoid agenda cards if any share attribute — ok for equipa list
        var p = (state.profissionais || []).find(function (x) { return x.id === id; });
        if (!p) return;
        applyAvatar(row.querySelector(".avatar"), p.nome, p.foto, p);
      });
    } catch (e) {}
  }

  function enhanceAll() {
    enhanceClientes();
    enhanceProfissionais();
    syncModalAvatarFallback();
  }

  function wrapRender(name, enhancer) {
    try {
      var fn = window[name];
      if (typeof fn !== "function") {
        // function declarations in bundle are global on window in non-module scripts
        if (typeof globalThis[name] === "function") fn = globalThis[name];
      }
      if (typeof fn !== "function") return false;
      if (fn._bpAvatarWrapped) return true;
      var wrapped = function () {
        var r = fn.apply(this, arguments);
        setTimeout(enhancer, 0);
        setTimeout(enhancer, 50);
        return r;
      };
      wrapped._bpAvatarWrapped = true;
      wrapped._bpOriginal = fn;
      window[name] = wrapped;
      try { globalThis[name] = wrapped; } catch (e) {}
      // overwrite bare binding if possible
      try {
        // eslint-disable-next-line no-eval
        if (typeof eval(name) === "function") {
          // assign via Function scope — in browser global
        }
      } catch (e) {}
      return true;
    } catch (e) {
      return false;
    }
  }

  function install() {
    // Prefer direct assignment — bundle uses function renderClientes() {}
    var ok1 = false, ok2 = false;
    try {
      if (typeof renderClientes === "function" && !renderClientes._bpAvatarWrapped) {
        var origC = renderClientes;
        renderClientes = function () {
          var r = origC.apply(this, arguments);
          setTimeout(enhanceClientes, 0);
          setTimeout(enhanceClientes, 40);
          return r;
        };
        renderClientes._bpAvatarWrapped = true;
        window.renderClientes = renderClientes;
        ok1 = true;
      }
    } catch (e) {}
    try {
      if (typeof renderProfissionais === "function" && !renderProfissionais._bpAvatarWrapped) {
        var origP = renderProfissionais;
        renderProfissionais = function () {
          var r = origP.apply(this, arguments);
          setTimeout(enhanceProfissionais, 0);
          setTimeout(enhanceProfissionais, 40);
          return r;
        };
        renderProfissionais._bpAvatarWrapped = true;
        window.renderProfissionais = renderProfissionais;
        ok2 = true;
      }
    } catch (e) {}
    wrapRender("renderClientes", enhanceClientes);
    wrapRender("renderProfissionais", enhanceProfissionais);
    enhanceAll();
    return ok1 || ok2;
  }

  function observe() {
    ["clientes-list", "profissionais-list"].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el || el.dataset.bpAvListObs) return;
      el.dataset.bpAvListObs = "1";
      var obs = new MutationObserver(function () {
        setTimeout(enhanceAll, 10);
      });
      obs.observe(el, { childList: true, subtree: true });
    });
  }

  function init() {
    install();
    observe();
    enhanceAll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      setTimeout(init, 200);
    });
  } else {
    setTimeout(init, 200);
  }
  setTimeout(init, 800);
  setTimeout(init, 2000);
  setTimeout(init, 5000);

  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-tab], .nav-item, .tab-btn, #tab-clientes, #tab-equipa")) {
      setTimeout(enhanceAll, 100);
      setTimeout(enhanceAll, 300);
    }
  });

  // Fallback de avatar no modal: SÓ quando BPMedia não preencheu foto real.
  // Sem setInterval — evita race e vazamento visual entre registos.
  function syncModalAvatarFallback() {
    try {
      var cli = document.getElementById("modal-cliente");
      if (cli && cli.classList.contains("open")) {
        var prevC = document.getElementById("bp-cli-foto-preview");
        var hid = document.getElementById("cliente-id");
        var cid = hid && hid.value ? String(hid.value).trim() : "";
        var nomeC = (document.getElementById("cliente-nome") || {}).value;
        if (prevC && !prevC.classList.contains("has-img") && nomeC && window.BPAvatars) {
          // Não injectar se já há foto real no state
          var ent = cid && (state.clientes || []).find(function (x) { return String(x.id) === cid; });
          if (ent && window.BPMedia && BPMedia.resolveFotoSrc && BPMedia.resolveFotoSrc(ent)) return;
          var src = BPAvatars.avatarDataUrl(nomeC);
          prevC.setAttribute("data-foto-for", cid || "new");
          prevC.innerHTML = '<img src="' + src + '" alt="" data-foto-for="' + (cid || "new") + '">';
          prevC.classList.add("has-img", "bp-avatar-fallback");
        }
      }
      var pr = document.getElementById("modal-prof");
      if (pr && pr.classList.contains("open")) {
        var prevP = document.getElementById("bp-prof-foto-preview");
        var hidP = document.getElementById("prof-id");
        var pid = hidP && hidP.value ? String(hidP.value).trim() : "";
        var nomeP = (document.getElementById("prof-nome") || {}).value;
        if (prevP && !prevP.classList.contains("has-img") && nomeP && window.BPAvatars) {
          var entP = pid && (state.profissionais || []).find(function (x) { return String(x.id) === pid; });
          if (entP && window.BPMedia && BPMedia.resolveFotoSrc && BPMedia.resolveFotoSrc(entP)) return;
          var src2 = BPAvatars.avatarDataUrl(nomeP);
          prevP.setAttribute("data-foto-for", pid || "new");
          prevP.innerHTML = '<img src="' + src2 + '" alt="" data-foto-for="' + (pid || "new") + '">';
          prevP.classList.add("has-img", "bp-avatar-fallback");
        }
      }
    } catch (e) {}
  }

  window.BPAvatarsListas = { enhanceAll: enhanceAll, install: install };
})();
