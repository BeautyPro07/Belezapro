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
    pendingProfFoto: null,
    pendingClienteScope: null,
    pendingProfScope: null
  };
  var _uploadToken = Object.create(null);
  var UPLOAD_MS = 12000;

  var GALERIA_KEY = "bp_galeria_v1";
  var MAX_GALERIA = 60;
  var AVATAR_MAX = 160;      // lista/modal: thumb leve
  var GALERIA_MAX = 720;     // upload original galeria
  var GALERIA_THUMB = 240;   // thumb local/galeria
  var JPEG_Q = 0.62;         // perfil
  var JPEG_Q_GAL = 0.72;

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

  function withTimeout(promise, ms) {
    return new Promise(function (resolve) {
      var done = false;
      var t = setTimeout(function () {
        if (done) return;
        done = true;
        resolve(null);
      }, ms || UPLOAD_MS);
      Promise.resolve(promise).then(
        function (v) { if (!done) { done = true; clearTimeout(t); resolve(v); } },
        function () { if (!done) { done = true; clearTimeout(t); resolve(null); } }
      );
    });
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
    var prev = (state.clientes || []).find(function (x) { return x.id === clienteId; });
    var patch = { foto: dataUrl || null, updated_at: new Date().toISOString() };
    if (!dataUrl) {
      patch.foto_url = null;
      _uploadToken["clientes:" + clienteId] = "cleared";
      removeFotoStorage("clientes", clienteId);
    } else if (prev && prev.foto_url) {
      patch.foto_url = prev.foto_url;
    }
    if (typeof updateCliente === "function") {
      await updateCliente(clienteId, patch);
    } else {
      var c = (state.clientes || []).find(function (x) { return x.id === clienteId; });
      if (!c) return false;
      Object.assign(c, patch);
      if (typeof dbPut === "function") await dbPut("clientes", c);
    }
    if (dataUrl) scheduleFotoUpload("clientes", clienteId, dataUrl);
    return true;
  }
  async function setProfFoto(profId, dataUrl) {
    if (!profId) return false;
    var prev = (state.profissionais || []).find(function (x) { return x.id === profId; });
    var patch = { foto: dataUrl || null, updated_at: new Date().toISOString() };
    if (!dataUrl) {
      patch.foto_url = null;
      _uploadToken["profissionais:" + profId] = "cleared";
      removeFotoStorage("profissionais", profId);
    } else if (prev && prev.foto_url) {
      patch.foto_url = prev.foto_url;
    }
    if (typeof updateProfissional === "function") {
      await updateProfissional(profId, patch);
    } else {
      var p = (state.profissionais || []).find(function (x) { return x.id === profId; });
      if (!p) return false;
      Object.assign(p, patch);
      if (typeof dbPut === "function") await dbPut("profissionais", p);
    }
    if (dataUrl) scheduleFotoUpload("profissionais", profId, dataUrl);
    return true;
  }

  function currentClienteId() {
    var el = document.getElementById("cliente-id");
    var v = el && el.value ? String(el.value).trim() : "";
    return v || session.editingClienteId || null;
  }
  function currentProfId() {
    var el = document.getElementById("prof-id");
    var v = el && el.value ? String(el.value).trim() : "";
    return v || session.editingProfId || null;
  }
  function clearClientePending() {
    session.pendingClienteFoto = null;
    session.pendingClienteScope = null;
  }
  function clearProfPending() {
    session.pendingProfFoto = null;
    session.pendingProfScope = null;
  }
  function scheduleFotoUpload(kind, entityId, dataUrl) {
    if (!entityId || !dataUrl) return;
    var token = String(Date.now()) + "-" + Math.random().toString(36).slice(2, 8);
    _uploadToken[kind + ":" + entityId] = token;
    withTimeout(uploadFotoStorage(kind, entityId, dataUrl), UPLOAD_MS).then(function (url) {
      if (!url) return;
      if (_uploadToken[kind + ":" + entityId] !== token) return;
      // Após URL remota: largar base64 local (menos memória / IDB) e actualizar só a linha
      var patch = { foto_url: url, foto: null, updated_at: new Date().toISOString() };
      if (kind === "clientes") {
        var c = (state.clientes || []).find(function (x) { return x.id === entityId; });
        if (!c || (c.foto && c.foto !== dataUrl)) return;
        if (typeof updateCliente === "function") updateCliente(entityId, patch);
        patchRowAvatar("clientes", entityId);
      } else if (kind === "profissionais") {
        var p = (state.profissionais || []).find(function (x) { return x.id === entityId; });
        if (!p || (p.foto && p.foto !== dataUrl)) return;
        if (typeof updateProfissional === "function") updateProfissional(entityId, patch);
        patchRowAvatar("profissionais", entityId);
      }
    });
  }

  /** Actualiza só a linha da lista (evita renderClientes/Profissionais completo). */
  function patchRowAvatar(kind, entityId) {
    if (!entityId) return;
    try {
      var row = kind === "clientes"
        ? document.querySelector('.cliente-item[data-cliente-id="' + entityId + '"]')
        : document.querySelector('.list-item[data-prof-id="' + entityId + '"]');
      if (!row) return;
      var ent = kind === "clientes" ? getCliente(entityId) : getProf(entityId);
      if (!ent) return;
      var av = row.querySelector(".avatar");
      if (!av) return;
      var src = resolveFotoSrc(ent) || (window.BPAvatars && BPAvatars.avatarDataUrl(ent.nome));
      if (!src) return;
      av.setAttribute("data-avatar-entity", String(entityId));
      av.classList.add("bp-avatar-img", "bp-avatar-done");
      av.innerHTML = '<img src="' + src + '" alt="" loading="lazy" decoding="async" data-avatar-entity="' + entityId + '">';
    } catch (e) {}
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
      var slim = (list || []).slice(-MAX_GALERIA).map(function (f) {
        var o = {
          id: f.id,
          profissional_id: f.profissional_id,
          profissional_nome: f.profissional_nome || "",
          caption: f.caption || "",
          data: f.data || "",
          ts: f.ts || "",
          url: f.url || null,
          thumb: f.thumb || null
        };
        // Se há URL remota, não guardar data URL (quota / parse)
        if (o.url && o.thumb && String(o.thumb).indexOf("data:") === 0) {
          o.thumb = o.url;
        }
        return o;
      });
      localStorage.setItem(GALERIA_KEY, JSON.stringify(slim));
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
        var src = resolveFotoSrc(c) || (window.BPAvatars && BPAvatars.avatarDataUrl(c.nome));
        if (!src) return;
        var img = av.querySelector("img");
        var same = av.getAttribute("data-avatar-entity") === id && img && img.getAttribute("src") === src;
        if (same) return;
        av.setAttribute("data-avatar-entity", id);
        av.classList.add("bp-avatar-img", "bp-avatar-done");
        av.innerHTML = '<img src="' + src + '" alt="" loading="lazy" decoding="async" data-avatar-entity="' + id + '">';
      });
      document.querySelectorAll(".list-item[data-prof-id]").forEach(function (row) {
        var id = row.getAttribute("data-prof-id");
        var p = getProf(id);
        if (!p) return;
        var av = row.querySelector(".avatar");
        if (!av) return;
        var src = resolveFotoSrc(p) || (window.BPAvatars && BPAvatars.avatarDataUrl(p.nome));
        if (!src) return;
        var img = av.querySelector("img");
        var same = av.getAttribute("data-avatar-entity") === id && img && img.getAttribute("src") === src;
        if (same) return;
        av.setAttribute("data-avatar-entity", id);
        av.classList.add("bp-avatar-img", "bp-avatar-done");
        av.innerHTML = '<img src="' + src + '" alt="" loading="lazy" decoding="async" data-avatar-entity="' + id + '">';
      });
    } catch (e) {}
  }

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
      var id = currentClienteId();
      var file = await pickImage();
      if (!file) return;
      try {
        toastMsg("A processar foto…", "success");
        var dataUrl = await compressFile(file, AVATAR_MAX, JPEG_Q);
        // Isolamento: após await, só aplicar se o modal ainda for o mesmo registo
        if (!stillClienteContext(id)) {
          // Dados: se tinha id, gravar na entidade correcta na mesma (sem tocar no preview alheio)
          if (id) {
            clearClientePending();
            await setClienteFoto(id, dataUrl);
            patchRowAvatar("clientes", id);
            toastMsg("Foto guardada no cliente correcto", "success");
          }
          return;
        }
        if (!id) {
          session.pendingClienteFoto = dataUrl;
          session.pendingClienteScope = "new";
          showPreview("bp-cli-foto-preview", dataUrl, "new");
          document.getElementById("bp-cli-foto-rm").style.display = "";
          toastMsg("Foto pronta — guarde o cliente", "success");
          return;
        }
        clearClientePending();
        await setClienteFoto(id, dataUrl);
        if (!stillClienteContext(id)) return;
        showPreview("bp-cli-foto-preview", dataUrl, id);
        document.getElementById("bp-cli-foto-rm").style.display = "";
        enhanceListAvatars();
        toastMsg("Foto actualizada", "success");
        patchRowAvatar("clientes", id);
      } catch (e) {
        console.warn(e);
        toastMsg("Erro ao processar imagem", "error");
      }
    };
    document.getElementById("bp-cli-foto-rm").onclick = async function () {
      var id = currentClienteId();
      clearClientePending();
      if (id) await setClienteFoto(id, null);
      if (stillClienteContext(id)) {
        showPreview("bp-cli-foto-preview", null, id || "new");
        this.style.display = "none";
      }
      toastMsg("Foto removida", "success");
      patchRowAvatar("clientes", id);
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
      var id = currentProfId();
      var file = await pickImage();
      if (!file) return;
      try {
        toastMsg("A processar foto…", "success");
        var dataUrl = await compressFile(file, AVATAR_MAX, JPEG_Q);
        if (!stillProfContext(id)) {
          if (id) {
            clearProfPending();
            await setProfFoto(id, dataUrl);
            patchRowAvatar("profissionais", id);
            toastMsg("Foto guardada no profissional correcto", "success");
          }
          return;
        }
        if (!id) {
          session.pendingProfFoto = dataUrl;
          session.pendingProfScope = "new";
          showPreview("bp-prof-foto-preview", dataUrl, "new");
          document.getElementById("bp-prof-foto-rm").style.display = "";
          toastMsg("Foto pronta — guarde o profissional", "success");
          return;
        }
        clearProfPending();
        await setProfFoto(id, dataUrl);
        if (!stillProfContext(id)) return;
        showPreview("bp-prof-foto-preview", dataUrl, id);
        document.getElementById("bp-prof-foto-rm").style.display = "";
        enhanceListAvatars();
        toastMsg("Foto actualizada", "success");
        patchRowAvatar("profissionais", id);
      } catch (e) {
        console.warn(e);
        toastMsg("Erro ao processar imagem", "error");
      }
    };
    document.getElementById("bp-prof-foto-rm").onclick = async function () {
      var id = currentProfId();
      clearProfPending();
      if (id) await setProfFoto(id, null);
      if (stillProfContext(id)) {
        showPreview("bp-prof-foto-preview", null, id || "new");
        this.style.display = "none";
      }
      toastMsg("Foto removida", "success");
      patchRowAvatar("profissionais", id);
    };
  }

  function showPreview(id, dataUrl, entityKey) {
    var el = document.getElementById(id);
    if (!el) return;
    var key = entityKey == null ? "" : String(entityKey);
    // Isolamento: se o preview já está ligado a outra entidade, não sobrescrever
    var bound = el.getAttribute("data-foto-for") || "";
    if (key && bound && bound !== key && el.classList.contains("has-img")) {
      // troca de entidade em curso — só aplicar se for o destino correcto
    }
    if (dataUrl) {
      el.setAttribute("data-foto-for", key || bound || "");
      el.innerHTML = '<img src="' + dataUrl + '" alt="" data-foto-for="' + (key || "") + '">';
      el.classList.add("has-img");
      el.classList.remove("bp-avatar-fallback");
    } else {
      el.setAttribute("data-foto-for", key || "");
      el.innerHTML = "<span>Foto</span>";
      el.classList.remove("has-img");
      el.classList.remove("bp-avatar-fallback");
    }
  }

  /** true se o modal ainda mostra a mesma entidade (evita leak após await). */
  function stillClienteContext(expectedId) {
    var modal = document.getElementById("modal-cliente");
    if (!modal || !modal.classList.contains("open")) return false;
    var cur = currentClienteId();
    if (!expectedId) return !cur; // novo cliente
    return String(cur) === String(expectedId);
  }
  function stillProfContext(expectedId) {
    var modal = document.getElementById("modal-prof");
    if (!modal || !modal.classList.contains("open")) return false;
    var cur = currentProfId();
    if (!expectedId) return !cur;
    return String(cur) === String(expectedId);
  }

  function syncModalPreviews() {
    ensureClientePhotoUI();
    ensureProfPhotoUI();
    var cli = document.getElementById("modal-cliente");
    if (cli && cli.classList.contains("open")) {
      var cid = currentClienteId();
      var c = cid ? getCliente(cid) : null;
      var foto = null;
      if (c) foto = resolveFotoSrc(c);
      else if (session.pendingClienteScope === "new") foto = session.pendingClienteFoto;
      showPreview("bp-cli-foto-preview", foto, cid || (foto ? "new" : ""));
      var rm = document.getElementById("bp-cli-foto-rm");
      if (rm) rm.style.display = foto ? "" : "none";
    }
    var pr = document.getElementById("modal-prof");
    if (pr && pr.classList.contains("open")) {
      var pid = currentProfId();
      var p = pid ? getProf(pid) : null;
      var foto2 = null;
      if (p) foto2 = resolveFotoSrc(p);
      else if (session.pendingProfScope === "new") foto2 = session.pendingProfFoto;
      showPreview("bp-prof-foto-preview", foto2, pid || (foto2 ? "new" : ""));
      var rm2 = document.getElementById("bp-prof-foto-rm");
      if (rm2) rm2.style.display = foto2 ? "" : "none";
    }
  }

  function hookEditTracking() {
    var cliModal = document.getElementById("modal-cliente");
    if (cliModal && !cliModal.dataset.bpFotoObs) {
      cliModal.dataset.bpFotoObs = "1";
      var obs = new MutationObserver(function () {
        if (cliModal.classList.contains("open")) {
          setTimeout(function () {
            var hid = document.getElementById("cliente-id");
            var id = hid && hid.value ? String(hid.value).trim() : "";
            session.editingClienteId = id || null;
            if (session.editingClienteId) clearClientePending();
            syncModalPreviews();
          }, 40);
        } else {
          session.editingClienteId = null;
          clearClientePending();
          showPreview("bp-cli-foto-preview", null, "");
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
            var hid = document.getElementById("prof-id");
            var id = hid && hid.value ? String(hid.value).trim() : "";
            session.editingProfId = id || null;
            if (session.editingProfId) clearProfPending();
            syncModalPreviews();
          }, 40);
        } else {
          session.editingProfId = null;
          clearProfPending();
          showPreview("bp-prof-foto-preview", null, "");
        }
      });
      obs2.observe(prModal, { attributes: true, attributeFilter: ["class"] });
    }
  }

  function hookSaveButtons() {
    document.addEventListener("click", function (e) {
      var t = e.target.closest("#modal-cliente-save, #cliente-save, [data-save-cliente]");
      if (t && session.pendingClienteFoto && session.pendingClienteScope === "new") {
        var nome = ((document.getElementById("cliente-nome") || {}).value || "").trim();
        var foto = session.pendingClienteFoto;
        clearClientePending();
        setTimeout(async function () {
          if (!nome || !foto) return;
          var matches = (state.clientes || []).filter(function (x) { return x.nome === nome; });
          if (!matches.length) return;
          matches.sort(function (a, b) {
            return String(b.updated_at || "").localeCompare(String(a.updated_at || ""));
          });
          var c = matches[0];
          if (c) {
            await setClienteFoto(c.id, foto);
            patchRowAvatar("clientes", c.id);
          }
        }, 500);
      }
      var t2 = e.target.closest("#modal-prof-save, #prof-save, [data-save-prof]");
      if (t2 && session.pendingProfFoto && session.pendingProfScope === "new") {
        var nome2 = ((document.getElementById("prof-nome") || {}).value || "").trim();
        var foto2 = session.pendingProfFoto;
        clearProfPending();
        setTimeout(async function () {
          if (!nome2 || !foto2) return;
          var matches = (state.profissionais || []).filter(function (x) { return x.nome === nome2; });
          if (!matches.length) return;
          matches.sort(function (a, b) {
            return String(b.updated_at || "").localeCompare(String(a.updated_at || ""));
          });
          var p = matches[0];
          if (p) {
            await setProfFoto(p.id, foto2);
            patchRowAvatar("profissionais", p.id);
          }
        }, 500);
      }
    });
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
        '<img src="' + (f.url || f.thumb || '') + '" alt="" loading="lazy" decoding="async">' +
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
          toastMsg("A processar foto…", "success");
          var dataUrl = await compressFile(file, GALERIA_MAX, JPEG_Q_GAL);
          var thumbUrl = await compressFile(file, GALERIA_THUMB, JPEG_Q);
          var p = getProf(pid);
          var cap = ((document.getElementById("bp-gal-caption") || {}).value || "").trim();
          var galId = uid();
          var entry = {
            id: galId,
            profissional_id: pid,
            profissional_nome: (p && p.nome) || "",
            thumb: thumbUrl,
            url: null,
            caption: cap,
            data: hojeStr(),
            ts: new Date().toISOString()
          };
          if (addFotoGaleria(entry)) {
            toastMsg("Foto adicionada à galeria", "success");
            renderGaleria(pid);
            withTimeout(uploadFotoStorage("galeria/" + pid, galId, dataUrl), UPLOAD_MS).then(function (remoteUrl) {
              if (!remoteUrl) return;
              var list = loadGaleria();
              var hit = list.find(function (x) { return x.id === galId; });
              if (!hit || hit.profissional_id !== pid) return;
              hit.url = remoteUrl;
              hit.thumb = remoteUrl;
              saveGaleria(list);
              renderGaleria(pid);
            });
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
    patchRowAvatar: patchRowAvatar,
    resolveFotoSrc: resolveFotoSrc,
    uploadFotoStorage: uploadFotoStorage,
    session: session
  };
})();
