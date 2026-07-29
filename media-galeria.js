// ================================================================
// BeautyPro — Fotos de perfil + Galeria de serviços
// Compressão no dispositivo · gravação imediata · offline-first
// ================================================================
(function () {
  "use strict";

  var GALERIA_KEY = "bp_galeria_v1";
  var MAX_GALERIA = 60;
  var AVATAR_MAX = 256;
  var GALERIA_MAX = 720;
  var JPEG_Q = 0.72;

  function esc(s) {
    return typeof escHtml === "function" ? escHtml(String(s == null ? "" : s)) : String(s == null ? "" : s);
  }
  function uid() {
    return typeof uuid === "function" ? uuid() : "img" + Date.now() + Math.random().toString(16).slice(2, 8);
  }
  function hojeStr() {
    return typeof hoje === "function" ? hoje() : new Date().toISOString().slice(0, 10);
  }
  function toastMsg(m, t) {
    if (typeof toast === "function") toast(m, t || "success");
  }

  /* ---------- compressão rápida ---------- */
  function compressFile(file, maxSide, quality) {
    return new Promise(function (resolve, reject) {
      if (!file || !file.type || file.type.indexOf("image/") !== 0) {
        reject(new Error("Ficheiro inválido"));
        return;
      }
      // HEIC etc. — browser pode falhar; feedback claro
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        try {
          var w = img.naturalWidth || img.width;
          var h = img.naturalHeight || img.height;
          var scale = 1;
          if (w > maxSide || h > maxSide) scale = maxSide / Math.max(w, h);
          var nw = Math.max(1, Math.round(w * scale));
          var nh = Math.max(1, Math.round(h * scale));
          var canvas = document.createElement("canvas");
          canvas.width = nw;
          canvas.height = nh;
          var ctx = canvas.getContext("2d");
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, nw, nh);
          var dataUrl = canvas.toDataURL("image/jpeg", quality || JPEG_Q);
          URL.revokeObjectURL(url);
          // limite ~180KB data URL
          if (dataUrl.length > 240000) {
            dataUrl = canvas.toDataURL("image/jpeg", 0.55);
          }
          resolve(dataUrl);
        } catch (e) {
          URL.revokeObjectURL(url);
          reject(e);
        }
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error("Não foi possível ler a imagem"));
      };
      img.src = url;
    });
  }

  function pickImage(accept) {
    return new Promise(function (resolve) {
      var input = document.createElement("input");
      input.type = "file";
      input.accept = accept || "image/*";
      // mobile: prefer camera optional via capture not forced
      input.style.display = "none";
      document.body.appendChild(input);
      input.onchange = function () {
        var f = input.files && input.files[0];
        input.remove();
        resolve(f || null);
      };
      input.oncancel = function () {
        input.remove();
        resolve(null);
      };
      input.click();
    });
  }

  /* ---------- storage entidades ---------- */
  async function setClienteFoto(clienteId, dataUrl) {
    if (!clienteId) return false;
    if (typeof updateCliente === "function") {
      await updateCliente(clienteId, { foto: dataUrl || null });
      return true;
    }
    var c = (state.clientes || []).find(function (x) { return x.id === clienteId; });
    if (!c) return false;
    c.foto = dataUrl || null;
    if (typeof dbPut === "function") await dbPut("clientes", c);
    return true;
  }
  async function setProfFoto(profId, dataUrl) {
    if (!profId) return false;
    if (typeof updateProfissional === "function") {
      await updateProfissional(profId, { foto: dataUrl || null });
      return true;
    }
    var p = (state.profissionais || []).find(function (x) { return x.id === profId; });
    if (!p) return false;
    p.foto = dataUrl || null;
    if (typeof dbPut === "function") await dbPut("profissionais", p);
    return true;
  }

  function getCliente(id) {
    return (state.clientes || []).find(function (c) { return c.id === id; });
  }
  function getProf(id) {
    return (state.profissionais || []).find(function (p) { return p.id === id; });
  }

  /* ---------- galeria ---------- */
  function loadGaleria() {
    try {
      var raw = localStorage.getItem(GALERIA_KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) { return []; }
  }
  function saveGaleria(list) {
    try {
      localStorage.setItem(GALERIA_KEY, JSON.stringify((list || []).slice(-MAX_GALERIA)));
      return true;
    } catch (e) {
      toastMsg("Armazenamento cheio — remova fotos antigas", "error");
      return false;
    }
  }
  function addFotoGaleria(entry) {
    var list = loadGaleria();
    list.push(entry);
    if (!saveGaleria(list)) return null;
    return entry;
  }
  function removeFotoGaleria(id) {
    var list = loadGaleria().filter(function (x) { return x.id !== id; });
    saveGaleria(list);
  }
  function galeriaPorProf(profId) {
    return loadGaleria().filter(function (x) { return x.profissional_id === profId; }).reverse();
  }

  /* ---------- UI avatar helpers ---------- */
  function avatarHtml(foto, nome, sizeClass) {
    var initial = (nome || "?").charAt(0).toUpperCase();
    if (foto) {
      return '<div class="avatar bp-avatar-img ' + (sizeClass || "") + '"><img src="' + foto + '" alt="" loading="lazy" decoding="async"></div>';
    }
    return '<div class="avatar ' + (sizeClass || "") + '">' + initial + "</div>";
  }

  function enhanceListAvatars() {
    try {
      // clientes
      document.querySelectorAll(".cliente-item[data-cliente-id]").forEach(function (row) {
        var id = row.getAttribute("data-cliente-id");
        var c = getCliente(id);
        if (!c || !c.foto) return;
        var av = row.querySelector(".avatar");
        if (!av || av.classList.contains("bp-avatar-img")) return;
        av.classList.add("bp-avatar-img");
        av.innerHTML = '<img src="' + c.foto + '" alt="" loading="lazy" decoding="async">';
      });
      // profissionais
      document.querySelectorAll("[data-prof-id]").forEach(function (row) {
        var id = row.getAttribute("data-prof-id");
        var p = getProf(id);
        if (!p || !p.foto) return;
        var av = row.querySelector(".avatar");
        if (!av || av.classList.contains("bp-avatar-img")) return;
        av.classList.add("bp-avatar-img");
        av.innerHTML = '<img src="' + p.foto + '" alt="" loading="lazy" decoding="async">';
      });
    } catch (e) {}
  }

  /* ---------- picker no modal ---------- */
  function ensureClientePhotoUI() {
    var modal = document.getElementById("modal-cliente");
    if (!modal || modal.querySelector("#bp-cli-foto-wrap")) return;
    var title = modal.querySelector(".modal-title") || modal.querySelector("#cliente-modal-title");
    if (!title) return;
    var wrap = document.createElement("div");
    wrap.id = "bp-cli-foto-wrap";
    wrap.className = "bp-foto-wrap";
    wrap.innerHTML =
      '<button type="button" class="bp-foto-btn" id="bp-cli-foto-btn" aria-label="Foto do cliente">' +
        '<div class="bp-foto-preview" id="bp-cli-foto-preview"><span>Foto</span></div>' +
        '<span class="bp-foto-hint">Toque para adicionar foto</span>' +
      "</button>" +
      '<button type="button" class="bp-foto-remove" id="bp-cli-foto-rm" style="display:none">Remover foto</button>';
    title.parentNode.insertBefore(wrap, title.nextSibling);

    document.getElementById("bp-cli-foto-btn").onclick = async function () {
      var id = modal.dataset.editId || modal.getAttribute("data-edit-id");
      // try common patterns
      if (!id) id = window._bpEditingClienteId || null;
      if (!id) {
        // new client — store pending
        var file = await pickImage();
        if (!file) return;
        try {
          toastMsg("A otimizar foto…", "info");
          var dataUrl = await compressFile(file, AVATAR_MAX, JPEG_Q);
          window._bpPendingClienteFoto = dataUrl;
          showPreview("bp-cli-foto-preview", dataUrl);
          document.getElementById("bp-cli-foto-rm").style.display = "";
          toastMsg("Foto pronta — guarde o cliente", "success");
        } catch (e) {
          toastMsg("Erro ao processar imagem", "error");
        }
        return;
      }
      var file = await pickImage();
      if (!file) return;
      try {
        toastMsg("A otimizar foto…", "info");
        var dataUrl = await compressFile(file, AVATAR_MAX, JPEG_Q);
        await setClienteFoto(id, dataUrl);
        showPreview("bp-cli-foto-preview", dataUrl);
        document.getElementById("bp-cli-foto-rm").style.display = "";
        enhanceListAvatars();
        toastMsg("Foto actualizada", "success");
        if (typeof renderClientes === "function") try { renderClientes(); setTimeout(enhanceListAvatars, 50); } catch (e) {}
      } catch (e) {
        console.warn(e);
        toastMsg("Erro ao guardar foto", "error");
      }
    };
    document.getElementById("bp-cli-foto-rm").onclick = async function () {
      var id = window._bpEditingClienteId;
      window._bpPendingClienteFoto = null;
      if (id) await setClienteFoto(id, null);
      showPreview("bp-cli-foto-preview", null);
      this.style.display = "none";
      toastMsg("Foto removida", "success");
      if (typeof renderClientes === "function") try { renderClientes(); setTimeout(enhanceListAvatars, 50); } catch (e) {}
    };
  }

  function ensureProfPhotoUI() {
    var modal = document.getElementById("modal-prof");
    if (!modal || modal.querySelector("#bp-prof-foto-wrap")) return;
    var title = modal.querySelector(".modal-title") || modal.querySelector("#prof-modal-title");
    if (!title) return;
    var wrap = document.createElement("div");
    wrap.id = "bp-prof-foto-wrap";
    wrap.className = "bp-foto-wrap";
    wrap.innerHTML =
      '<button type="button" class="bp-foto-btn" id="bp-prof-foto-btn" aria-label="Foto do profissional">' +
        '<div class="bp-foto-preview" id="bp-prof-foto-preview"><span>Foto</span></div>' +
        '<span class="bp-foto-hint">Toque para adicionar foto</span>' +
      "</button>" +
      '<button type="button" class="bp-foto-remove" id="bp-prof-foto-rm" style="display:none">Remover foto</button>';
    title.parentNode.insertBefore(wrap, title.nextSibling);

    document.getElementById("bp-prof-foto-btn").onclick = async function () {
      var id = window._bpEditingProfId || null;
      if (!id) {
        var file = await pickImage();
        if (!file) return;
        try {
          toastMsg("A otimizar foto…", "info");
          var dataUrl = await compressFile(file, AVATAR_MAX, JPEG_Q);
          window._bpPendingProfFoto = dataUrl;
          showPreview("bp-prof-foto-preview", dataUrl);
          document.getElementById("bp-prof-foto-rm").style.display = "";
          toastMsg("Foto pronta — guarde o profissional", "success");
        } catch (e) {
          toastMsg("Erro ao processar imagem", "error");
        }
        return;
      }
      var file = await pickImage();
      if (!file) return;
      try {
        toastMsg("A otimizar foto…", "info");
        var dataUrl = await compressFile(file, AVATAR_MAX, JPEG_Q);
        await setProfFoto(id, dataUrl);
        showPreview("bp-prof-foto-preview", dataUrl);
        document.getElementById("bp-prof-foto-rm").style.display = "";
        toastMsg("Foto actualizada", "success");
        if (typeof renderProfissionais === "function") try { renderProfissionais(); setTimeout(enhanceListAvatars, 50); } catch (e) {}
      } catch (e) {
        toastMsg("Erro ao guardar foto", "error");
      }
    };
    document.getElementById("bp-prof-foto-rm").onclick = async function () {
      var id = window._bpEditingProfId;
      window._bpPendingProfFoto = null;
      if (id) await setProfFoto(id, null);
      showPreview("bp-prof-foto-preview", null);
      this.style.display = "none";
      toastMsg("Foto removida", "success");
      if (typeof renderProfissionais === "function") try { renderProfissionais(); setTimeout(enhanceListAvatars, 50); } catch (e) {}
    };
  }

  function showPreview(id, dataUrl) {
    var el = document.getElementById(id);
    if (!el) return;
    if (dataUrl) {
      el.innerHTML = '<img src="' + dataUrl + '" alt="">';
      el.classList.add("has-img");
    } else {
      el.innerHTML = "<span>Foto</span>";
      el.classList.remove("has-img");
    }
  }

  function syncModalPreviews() {
    ensureClientePhotoUI();
    ensureProfPhotoUI();
    // observe open modals
    var cli = document.getElementById("modal-cliente");
    if (cli && cli.classList.contains("open")) {
      var cid = window._bpEditingClienteId;
      var c = cid ? getCliente(cid) : null;
      var foto = (c && c.foto) || window._bpPendingClienteFoto || null;
      showPreview("bp-cli-foto-preview", foto);
      var rm = document.getElementById("bp-cli-foto-rm");
      if (rm) rm.style.display = foto ? "" : "none";
    }
    var pr = document.getElementById("modal-prof");
    if (pr && pr.classList.contains("open")) {
      var pid = window._bpEditingProfId;
      var p = pid ? getProf(pid) : null;
      var foto2 = (p && p.foto) || window._bpPendingProfFoto || null;
      showPreview("bp-prof-foto-preview", foto2);
      var rm2 = document.getElementById("bp-prof-foto-rm");
      if (rm2) rm2.style.display = foto2 ? "" : "none";
    }
  }

  /* ---------- track which entity is being edited ---------- */
  function hookEditTracking() {
    // intercept list clicks is hard; watch when modal opens and nome field matches
    var cliModal = document.getElementById("modal-cliente");
    if (cliModal && !cliModal.dataset.bpFotoObs) {
      cliModal.dataset.bpFotoObs = "1";
      var obs = new MutationObserver(function () {
        if (cliModal.classList.contains("open")) {
          setTimeout(function () {
            var nome = (document.getElementById("cliente-nome") || {}).value || "";
            var found = (state.clientes || []).find(function (c) {
              return c.nome === nome;
            });
            // prefer hidden id if any
            var hid = document.getElementById("cliente-id");
            if (hid && hid.value) window._bpEditingClienteId = hid.value;
            else window._bpEditingClienteId = found ? found.id : null;
            if (!window._bpEditingClienteId) window._bpPendingClienteFoto = window._bpPendingClienteFoto || null;
            else window._bpPendingClienteFoto = null;
            syncModalPreviews();
          }, 80);
        } else {
          window._bpEditingClienteId = null;
        }
      });
      obs.observe(cliModal, { attributes: true, attributeFilter: ["class"] });
    }
    var prModal = document.getElementById("modal-prof");
    if (prModal && !prModal.dataset.bpFotoObs) {
      prModal.dataset.bpFotoObs = "1";
      var obs2 = new MutationObserver(function () {
        if (prModal.classList.contains("open")) {
          setTimeout(function () {
            var nome = (document.getElementById("prof-nome") || {}).value || "";
            var found = (state.profissionais || []).find(function (p) {
              return p.nome === nome;
            });
            var hid = document.getElementById("prof-id");
            if (hid && hid.value) window._bpEditingProfId = hid.value;
            else window._bpEditingProfId = found ? found.id : null;
            if (!window._bpEditingProfId) window._bpPendingProfFoto = window._bpPendingProfFoto || null;
            else window._bpPendingProfFoto = null;
            syncModalPreviews();
          }, 80);
        } else {
          window._bpEditingProfId = null;
        }
      });
      obs2.observe(prModal, { attributes: true, attributeFilter: ["class"] });
    }
  }

  /* ---------- pending foto on create: patch save buttons lightly ---------- */
  function hookSaveButtons() {
    // After client save, attach pending foto if name matches newest
    document.addEventListener("click", function (e) {
      var t = e.target.closest("#modal-cliente-save, #cliente-save, [data-save-cliente]");
      if (t && window._bpPendingClienteFoto) {
        setTimeout(async function () {
          try {
            var nome = (document.getElementById("cliente-nome") || {}).value || "";
            var c = (state.clientes || []).find(function (x) { return x.nome === nome; });
            if (c && window._bpPendingClienteFoto) {
              await setClienteFoto(c.id, window._bpPendingClienteFoto);
              window._bpPendingClienteFoto = null;
              enhanceListAvatars();
            }
          } catch (err) {}
        }, 400);
      }
      var t2 = e.target.closest("#modal-prof-save, #prof-save, [data-save-prof]");
      if (t2 && window._bpPendingProfFoto) {
        setTimeout(async function () {
          try {
            var nome = (document.getElementById("prof-nome") || {}).value || "";
            var p = (state.profissionais || []).find(function (x) { return x.nome === nome; });
            if (p && window._bpPendingProfFoto) {
              await setProfFoto(p.id, window._bpPendingProfFoto);
              window._bpPendingProfFoto = null;
              enhanceListAvatars();
            }
          } catch (err) {}
        }, 400);
      }
    }, true);
  }

  /* ---------- Galeria UI ---------- */
  function ensureShell(id, title, eyebrow, subtitle) {
    var el = document.getElementById(id);
    if (el) return el;
    el = document.createElement("div");
    el.id = id;
    el.className = "modal-overlay";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.innerHTML =
      '<div class="bp-sheet">' +
        '<div class="bp-sheet-handle" aria-hidden="true"></div>' +
        '<div class="bp-sheet-header">' +
          '<div class="bp-sheet-eyebrow">' + esc(eyebrow || "Media") + "</div>" +
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

  function openGaleria(profIdPreset) {
    ensureShell("modal-bp-galeria", "Galeria de serviços", "Media", "Fotos dos trabalhos, associadas a cada profissional.");
    renderGaleria(profIdPreset);
    openShell("modal-bp-galeria");
  }

  function renderGaleria(profIdPreset) {
    var body = document.getElementById("modal-bp-galeria-body");
    if (!body) return;
    var profs = state.profissionais || [];
    var profId = profIdPreset || (profs[0] && profs[0].id) || "";
    var opts = profs.map(function (p) {
      return '<option value="' + p.id + '"' + (p.id === profId ? " selected" : "") + ">" + esc(p.nome) + "</option>";
    }).join("");

    var fotos = profId ? galeriaPorProf(profId) : loadGaleria().slice().reverse();
    var grid = fotos.map(function (f) {
      return '<div class="bp-gal-item" data-gal-id="' + f.id + '">' +
        '<img src="' + f.thumb + '" alt="" loading="lazy" decoding="async">' +
        '<div class="bp-gal-meta">' +
          '<span>' + esc(f.caption || f.data || "") + "</span>" +
          '<button type="button" class="bp-gal-del" data-del-gal="' + f.id + '" title="Remover">×</button>' +
        "</div></div>";
    }).join("") || '<div class="bp-empty"><strong>Sem fotos</strong>Adicione a primeira foto do trabalho abaixo.</div>';

    body.innerHTML =
      '<div class="input-group"><label class="input-label">Profissional</label>' +
      '<select id="bp-gal-prof" class="input-field">' + (opts || '<option value="">—</option>') + "</select></div>" +
      '<div class="bp-gal-actions">' +
        '<button type="button" class="btn btn-primary btn-block" id="bp-gal-add"' + (!profId ? " disabled" : "") + ">Adicionar foto do serviço</button>" +
      "</div>" +
      '<div class="input-group" style="margin-top:12px"><label class="input-label">Legenda (opcional)</label>' +
      '<input type="text" id="bp-gal-caption" class="input-field" placeholder="Ex: Coloração · cliente A" maxlength="80"></div>' +
      '<div class="bp-section"><div class="bp-section-title">Fotos (' + fotos.length + ")</div>" +
      '<div class="bp-gal-grid">' + grid + "</div></div>";

    var sel = document.getElementById("bp-gal-prof");
    if (sel) {
      sel.onchange = function () { renderGaleria(sel.value); };
    }
    var add = document.getElementById("bp-gal-add");
    if (add) {
      add.onclick = async function () {
        var pid = (document.getElementById("bp-gal-prof") || {}).value;
        if (!pid) {
          toastMsg("Seleccione um profissional", "error");
          return;
        }
        var file = await pickImage();
        if (!file) return;
        try {
          toastMsg("A otimizar foto…", "info");
          var dataUrl = await compressFile(file, GALERIA_MAX, JPEG_Q);
          var p = getProf(pid);
          var cap = ((document.getElementById("bp-gal-caption") || {}).value || "").trim();
          var entry = {
            id: uid(),
            profissional_id: pid,
            profissional_nome: (p && p.nome) || "",
            thumb: dataUrl,
            caption: cap,
            data: hojeStr(),
            ts: new Date().toISOString()
          };
          if (addFotoGaleria(entry)) {
            toastMsg("Foto adicionada à galeria", "success");
            renderGaleria(pid);
          }
        } catch (e) {
          console.warn(e);
          toastMsg("Erro ao processar imagem", "error");
        }
      };
    }
    body.querySelectorAll("[data-del-gal]").forEach(function (btn) {
      btn.onclick = function (e) {
        e.stopPropagation();
        if (!confirm("Remover esta foto?")) return;
        removeFotoGaleria(btn.getAttribute("data-del-gal"));
        renderGaleria((document.getElementById("bp-gal-prof") || {}).value);
        toastMsg("Foto removida", "success");
      };
    });
  }

  /* ---------- Menu: CRM → Galeria (inject into accordion panel if exists) ---------- */
  function ensureMenuItem() {
    var panel = document.querySelector('.bp-acc-panel[data-acc-panel="crm"]');
    if (panel && !panel.querySelector('[data-bp-action="galeria"]')) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("data-bp-menu", "crm");
      btn.setAttribute("data-bp-action", "galeria");
      btn.innerHTML = "<span>Galeria de serviços</span>";
      panel.appendChild(btn);
    }
    // also listen
    var dd = document.getElementById("menu-dropdown");
    if (dd && !dd.dataset.bpMediaBound) {
      dd.dataset.bpMediaBound = "1";
      dd.addEventListener("click", function (e) {
        var t = e.target.closest('[data-bp-action="galeria"]');
        if (!t) return;
        e.stopPropagation();
        dd.style.display = "none";
        openGaleria();
      });
    }
  }

  /* ---------- observe list re-renders ---------- */
  function observeLists() {
    ["clientes-list", "profissionais-list"].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el || el.dataset.bpAvatarObs) return;
      el.dataset.bpAvatarObs = "1";
      var obs = new MutationObserver(function () {
        setTimeout(enhanceListAvatars, 30);
      });
      obs.observe(el, { childList: true, subtree: true });
    });
  }

  function init() {
    try {
      ensureClientePhotoUI();
      ensureProfPhotoUI();
      hookEditTracking();
      hookSaveButtons();
      observeLists();
      enhanceListAvatars();
      ensureMenuItem();
    } catch (e) {
      console.warn("[media-galeria]", e);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { setTimeout(init, 220); });
  } else setTimeout(init, 220);
  setTimeout(init, 800);
  setTimeout(init, 2000);
  setTimeout(function () { enhanceListAvatars(); ensureMenuItem(); }, 4000);

  // after tab switches
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-tab], .nav-tab, .tab-btn")) {
      setTimeout(enhanceListAvatars, 120);
    }
  });

  window.BPMedia = {
    compressFile: compressFile,
    setClienteFoto: setClienteFoto,
    setProfFoto: setProfFoto,
    openGaleria: openGaleria,
    loadGaleria: loadGaleria,
    enhanceListAvatars: enhanceListAvatars
  };
})();
