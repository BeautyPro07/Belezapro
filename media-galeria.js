// ================================================================
// BeautyPro — Fotos de perfil + Galeria de serviços
// Compressão no dispositivo · gravação imediata · offline-first
// ================================================================
(function () {
  "use strict";

  /** Sessão de UI (efémera) — não poluir window._bp* nem BeautyStore. */
  var session = {
    editingClienteId: null,
    editingProfId: null,
    pendingClienteFoto: null,
    pendingProfFoto: null
  };

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
  /* ---------- compressão robusta (CSP-safe: data: + createImageBitmap; blob: opcional) ---------- */
  function encodeCanvas(imgLike, w, h, maxSide, quality) {
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
    ctx.drawImage(imgLike, 0, 0, nw, nh);
    var dataUrl = canvas.toDataURL("image/jpeg", quality || JPEG_Q);
    if (dataUrl.length > 240000) {
      dataUrl = canvas.toDataURL("image/jpeg", 0.55);
    }
    return dataUrl;
  }

  function compressFile(file, maxSide, quality) {
    return new Promise(function (resolve, reject) {
      if (!file) {
        reject(new Error("Ficheiro inválido"));
        return;
      }
      // Aceitar image/*; type vazio (alguns Android) tenta na mesma
      var t = String(file.type || "");
      if (t && t.indexOf("image/") !== 0) {
        reject(new Error("Ficheiro inválido"));
        return;
      }

      function fail(msg) {
        reject(new Error(msg || "Não foi possível ler a imagem"));
      }

      // 1) createImageBitmap — não depende de blob: no <img>
      if (typeof createImageBitmap === "function") {
        createImageBitmap(file)
          .then(function (bmp) {
            try {
              var dataUrl = encodeCanvas(bmp, bmp.width, bmp.height, maxSide, quality);
              if (bmp.close) try { bmp.close(); } catch (_) {}
              resolve(dataUrl);
            } catch (e) {
              if (bmp.close) try { bmp.close(); } catch (_) {}
              // fallback abaixo
              compressViaFileReader(file, maxSide, quality).then(resolve, reject);
            }
          })
          .catch(function () {
            compressViaFileReader(file, maxSide, quality).then(resolve, reject);
          });
        return;
      }

      compressViaFileReader(file, maxSide, quality).then(resolve, reject);
    });
  }

  function compressViaFileReader(file, maxSide, quality) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onerror = function () {
        // último recurso: blob URL (requer CSP img-src blob:)
        compressViaBlobUrl(file, maxSide, quality).then(resolve, reject);
      };
      reader.onload = function () {
        var img = new Image();
        img.onload = function () {
          try {
            resolve(encodeCanvas(img, img.naturalWidth || img.width, img.naturalHeight || img.height, maxSide, quality));
          } catch (e) {
            reject(e);
          }
        };
        img.onerror = function () {
          compressViaBlobUrl(file, maxSide, quality).then(resolve, reject);
        };
        img.src = reader.result; // data: — permitido pelo CSP
      };
      try {
        reader.readAsDataURL(file);
      } catch (e) {
        compressViaBlobUrl(file, maxSide, quality).then(resolve, reject);
      }
    });
  }

  function compressViaBlobUrl(file, maxSide, quality) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        try {
          var dataUrl = encodeCanvas(img, img.naturalWidth || img.width, img.naturalHeight || img.height, maxSide, quality);
          URL.revokeObjectURL(url);
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

  function dataUrlToBlob(dataUrl) {
    try {
      var parts = String(dataUrl).split(",");
      var mime = (parts[0].match(/:(.*?);/) || [])[1] || "image/jpeg";
      var bin = atob(parts[1] || "");
      var arr = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      return new Blob([arr], { type: mime });
    } catch (e) {
      return null;
    }
  }

  /** Upload para Supabase Storage (bucket `fotos`). Offline → null. */
  async function uploadFotoStorage(kind, entityId, dataUrl) {
    if (!dataUrl || !entityId) return null;
    if (typeof navigator !== "undefined" && !navigator.onLine) return null;
    if (typeof supabaseClient === "undefined" || !supabaseClient) return null;
    var salaoId = (typeof state !== "undefined" && state.config && state.config.salaoId) ? state.config.salaoId : null;
    if (!salaoId) return null;
    try {
      var blob = dataUrlToBlob(dataUrl);
      if (!blob) return null;
      var path = String(salaoId) + "/" + kind + "/" + String(entityId) + ".jpg";
      var res = await supabaseClient.storage.from("fotos").upload(path, blob, {
        contentType: "image/jpeg",
        upsert: true,
        cacheControl: "3600"
      });
      if (res.error) {
        console.warn("[BPMedia] storage upload:", res.error.message || res.error);
        return null;
      }
      var pub = supabaseClient.storage.from("fotos").getPublicUrl(path);
      return (pub && pub.data && pub.data.publicUrl) ? pub.data.publicUrl : null;
    } catch (e) {
      console.warn("[BPMedia] storage:", e && e.message ? e.message : e);
      return null;
    }
  }

  async function removeFotoStorage(kind, entityId) {
    if (!entityId) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    if (typeof supabaseClient === "undefined" || !supabaseClient) return;
    var salaoId = (typeof state !== "undefined" && state.config && state.config.salaoId) ? state.config.salaoId : null;
    if (!salaoId) return;
    try {
      var path = String(salaoId) + "/" + kind + "/" + String(entityId) + ".jpg";
      await supabaseClient.storage.from("fotos").remove([path]);
    } catch (e) {
      console.warn("[BPMedia] storage remove:", e && e.message ? e.message : e);
    }
  }

  /** Preferir cache local (data:) depois URL remota. */
  function resolveFotoSrc(entity) {
    if (!entity) return null;
    if (entity.foto && String(entity.foto).indexOf("data:") === 0) return entity.foto;
    if (entity.foto_url) return entity.foto_url;
    if (entity.foto) return entity.foto;
    return null;
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

  /* ---------- storage entidades (local + Supabase Storage) ---------- */
  async function setClienteFoto(clienteId, dataUrl) {
    if (!clienteId) return false;
    var fotoUrl = null;
    if (dataUrl) {
      fotoUrl = await uploadFotoStorage("clientes", clienteId, dataUrl);
    } else {
      await removeFotoStorage("clientes", clienteId);
    }
    var patch = {
      foto: dataUrl || null,
      foto_url: dataUrl ? (fotoUrl || null) : null,
      updated_at: new Date().toISOString()
    };
    // Se upload falhou mas há dataUrl local, não apagar foto_url antiga
    if (dataUrl && !fotoUrl) {
      var prev = (state.clientes || []).find(function (x) { return x.id === clienteId; });
      if (prev && prev.foto_url) patch.foto_url = prev.foto_url;
    }
    if (typeof updateCliente === "function") {
      await updateCliente(clienteId, patch);
      return true;
    }
    var c = (state.clientes || []).find(function (x) { return x.id === clienteId; });
    if (!c) return false;
    Object.assign(c, patch);
    if (typeof dbPut === "function") await dbPut("clientes", c);
    return true;
  }
  async function setProfFoto(profId, dataUrl) {
    if (!profId) return false;
    var fotoUrl = null;
    if (dataUrl) {
      fotoUrl = await uploadFotoStorage("profissionais", profId, dataUrl);
    } else {
      await removeFotoStorage("profissionais", profId);
    }
    var patch = {
      foto: dataUrl || null,
      foto_url: dataUrl ? (fotoUrl || null) : null,
      updated_at: new Date().toISOString()
    };
    if (dataUrl && !fotoUrl) {
      var prev = (state.profissionais || []).find(function (x) { return x.id === profId; });
      if (prev && prev.foto_url) patch.foto_url = prev.foto_url;
    }
    if (typeof updateProfissional === "function") {
      await updateProfissional(profId, patch);
      return true;
    }
    var p = (state.profissionais || []).find(function (x) { return x.id === profId; });
    if (!p) return false;
    Object.assign(p, patch);
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
      document.querySelectorAll(".cliente-item[data-cliente-id]").forEach(function (row) {
        var id = row.getAttribute("data-cliente-id");
        var c = getCliente(id);
        if (!c) return;
        var av = row.querySelector(".avatar");
        if (!av) return;
        if (av.classList.contains("bp-avatar-done")) return;
        var src = resolveFotoSrc(c) || (window.BPAvatars && BPAvatars.avatarDataUrl(c.nome));
        if (!src) return;
        av.classList.add("bp-avatar-img", "bp-avatar-done");
        av.innerHTML = '<img src="' + src + '" alt="" loading="lazy" decoding="async">';
      });
      document.querySelectorAll("[data-prof-id]").forEach(function (row) {
        var id = row.getAttribute("data-prof-id");
        var p = getProf(id);
        if (!p) return;
        var av = row.querySelector(".avatar");
        if (!av) return;
        if (av.classList.contains("bp-avatar-done")) return;
        var src = resolveFotoSrc(p) || (window.BPAvatars && BPAvatars.avatarDataUrl(p.nome));
        if (!src) return;
        av.classList.add("bp-avatar-img", "bp-avatar-done");
        av.innerHTML = '<img src="' + src + '" alt="" loading="lazy" decoding="async">';
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
      if (!id) id = session.editingClienteId || null;
      if (!id) {
        // new client — store pending
        var file = await pickImage();
        if (!file) return;
        try {
          toastMsg("A otimizar foto…", "info");
          var dataUrl = await compressFile(file, AVATAR_MAX, JPEG_Q);
          session.pendingClienteFoto = dataUrl;
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
      var id = session.editingClienteId;
      session.pendingClienteFoto = null;
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
      var id = session.editingProfId || null;
      if (!id) {
        var file = await pickImage();
        if (!file) return;
        try {
          toastMsg("A otimizar foto…", "info");
          var dataUrl = await compressFile(file, AVATAR_MAX, JPEG_Q);
          session.pendingProfFoto = dataUrl;
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
      var id = session.editingProfId;
      session.pendingProfFoto = null;
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
      var cid = session.editingClienteId;
      var c = cid ? getCliente(cid) : null;
      var foto = (c && resolveFotoSrc(c)) || session.pendingClienteFoto || null;
      showPreview("bp-cli-foto-preview", foto);
      var rm = document.getElementById("bp-cli-foto-rm");
      if (rm) rm.style.display = foto ? "" : "none";
    }
    var pr = document.getElementById("modal-prof");
    if (pr && pr.classList.contains("open")) {
      var pid = session.editingProfId;
      var p = pid ? getProf(pid) : null;
      var foto2 = (p && resolveFotoSrc(p)) || session.pendingProfFoto || null;
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
            if (hid && hid.value) session.editingClienteId = hid.value;
            else session.editingClienteId = found ? found.id : null;
            if (!session.editingClienteId) session.pendingClienteFoto = session.pendingClienteFoto || null;
            else session.pendingClienteFoto = null;
            syncModalPreviews();
          }, 80);
        } else {
          session.editingClienteId = null;
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
            if (hid && hid.value) session.editingProfId = hid.value;
            else session.editingProfId = found ? found.id : null;
            if (!session.editingProfId) session.pendingProfFoto = session.pendingProfFoto || null;
            else session.pendingProfFoto = null;
            syncModalPreviews();
          }, 80);
        } else {
          session.editingProfId = null;
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
      if (t && session.pendingClienteFoto) {
        setTimeout(async function () {
          try {
            var nome = (document.getElementById("cliente-nome") || {}).value || "";
            var c = (state.clientes || []).find(function (x) { return x.nome === nome; });
            if (c && session.pendingClienteFoto) {
              await setClienteFoto(c.id, session.pendingClienteFoto);
              session.pendingClienteFoto = null;
              enhanceListAvatars();
            }
          } catch (err) {}
        }, 400);
      }
      var t2 = e.target.closest("#modal-prof-save, #prof-save, [data-save-prof]");
      if (t2 && session.pendingProfFoto) {
        setTimeout(async function () {
          try {
            var nome = (document.getElementById("prof-nome") || {}).value || "";
            var p = (state.profissionais || []).find(function (x) { return x.nome === nome; });
            if (p && session.pendingProfFoto) {
              await setProfFoto(p.id, session.pendingProfFoto);
              session.pendingProfFoto = null;
              enhanceListAvatars();
            }
          } catch (err) {}
        }, 400);
      }
    }, true);
  }

  /* ---------- Galeria UI ---------- */
  function ensureShell(id, title, eyebrow, subtitle) {
    if (typeof ensureBpSheetModal === 'function') {
      return ensureBpSheetModal(id, title, eyebrow, subtitle);
    }
    var el = document.getElementById(id);
    if (el) {
      var tEl = el.querySelector('.bp-sheet-title');
      if (tEl && title) tEl.textContent = title;
      return el;
    }
    el = document.createElement('div');
    el.id = id;
    el.className = 'modal-overlay';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-labelledby', id + '-title');
    var eye = eyebrow || 'BeautyPro';
    var sub = subtitle || '';
    el.innerHTML =
      '<div class="bp-sheet modal-sheet">' +
        '<div class="bp-sheet-handle handle" aria-hidden="true"></div>' +
        '<div class="bp-sheet-header">' +
          '<div class="bp-sheet-eyebrow">' + eye + '</div>' +
          '<h2 class="bp-sheet-title modal-title" id="' + id + '-title">' + title + '</h2>' +
          (sub ? '<p class="bp-sheet-subtitle">' + sub + '</p>' : '') +
        '</div>' +
        '<div class="bp-sheet-body" id="' + id + '-body"></div>' +
        '<div class="bp-sheet-footer modal-actions">' +
          '<button type="button" class="btn btn-secondary" data-close="' + id + '">Fechar</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(el);
    el.addEventListener('click', function (e) {
      if (e.target === el || e.target.getAttribute('data-close') === id) {
        if (typeof closeModal === 'function') closeModal(id);
        else el.classList.remove('open');
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
          var galId = uid();
          var remoteUrl = await uploadFotoStorage("galeria/" + pid, galId, dataUrl);
          var entry = {
            id: galId,
            profissional_id: pid,
            profissional_nome: (p && p.nome) || "",
            thumb: remoteUrl || dataUrl,
            url: remoteUrl || null,
            caption: cap,
            data: hojeStr(),
            ts: new Date().toISOString()
          };
          // Preferir URL remota no thumb para não encher localStorage; se offline, dataUrl
          if (addFotoGaleria(entry)) {
            toastMsg(remoteUrl ? "Foto adicionada à galeria" : "Foto guardada (sync quando online)", "success");
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
        var delId = btn.getAttribute("data-del-gal");
        var pidDel = (document.getElementById("bp-gal-prof") || {}).value;
        if (pidDel && delId) removeFotoStorage("galeria/" + pidDel, delId);
        removeFotoGaleria(delId);
        renderGaleria(pidDel);
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
    enhanceListAvatars: enhanceListAvatars,
    resolveFotoSrc: resolveFotoSrc,
    uploadFotoStorage: uploadFotoStorage,
    session: session
  };
})();
