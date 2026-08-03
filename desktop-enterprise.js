/**
 * BeautyPro — Desktop Enterprise layer (≥1024px)
 * Preferências, command palette, atalhos avançados, multi-select,
 * context menu, pop-out window, estados de layout, virtualização leve.
 * Não altera regras de negócio; só UX desktop.
 */
(function () {
  'use strict';

  var PREFS_KEY = 'bp_desk_prefs_v1';
  var defaultPrefs = {
    theme: 'system',
    density: 'comfortable',
    sidebarCollapsed: false,
    lastTab: null,
    lastSearch: '',
    panelWidths: { detail: 380 },
    shortcutsEnabled: true
  };

  function isDesktop() {
    return window.matchMedia && window.matchMedia('(min-width: 1024px)').matches;
  }

  function loadPrefs() {
    try {
      var raw = localStorage.getItem(PREFS_KEY);
      if (!raw) return Object.assign({}, defaultPrefs);
      return Object.assign({}, defaultPrefs, JSON.parse(raw));
    } catch (e) {
      return Object.assign({}, defaultPrefs);
    }
  }

  function savePrefs(p) {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(p));
    } catch (e) {}
  }

  var prefs = loadPrefs();

  function applyPrefs() {
    var root = document.documentElement;
    root.setAttribute('data-desk-density', prefs.density || 'comfortable');
    root.setAttribute('data-desk-sidebar', prefs.sidebarCollapsed ? 'collapsed' : 'expanded');
    if (prefs.theme === 'dark') root.setAttribute('data-theme', 'dark');
    else if (prefs.theme === 'light') root.setAttribute('data-theme', 'light');
    var container = document.querySelector('.app-container');
    if (container && isDesktop()) {
      container.classList.toggle('bp-sidebar-collapsed', !!prefs.sidebarCollapsed);
    }
  }

  /* ---------- Command Palette ---------- */
  function ensurePalette() {
    if (document.getElementById('bp-cmd-palette')) return;
    var el = document.createElement('div');
    el.id = 'bp-cmd-palette';
    el.className = 'bp-cmd-palette';
    el.hidden = true;
    el.innerHTML =
      '<div class="bp-cmd-backdrop" data-cmd-close="1"></div>' +
      '<div class="bp-cmd-dialog" role="dialog" aria-modal="true" aria-label="Command palette">' +
        '<input type="search" id="bp-cmd-input" class="bp-cmd-input" placeholder="Comando ou pesquisa… (Esc fecha)" autocomplete="off" />' +
        '<ul id="bp-cmd-list" class="bp-cmd-list" role="listbox"></ul>' +
        '<div class="bp-cmd-hint">↑↓ navegar · Enter executar · Esc fechar</div>' +
      '</div>';
    document.body.appendChild(el);
    el.querySelector('[data-cmd-close]').addEventListener('click', closePalette);
  }

  function commands() {
    var list = [
      { id: 'tab-dashboard', label: 'Ir para Resumo', keys: 'g r', run: function () { goTab('dashboard'); } },
      { id: 'tab-agenda', label: 'Ir para Agenda', keys: 'g a', run: function () { goTab('agenda'); } },
      { id: 'tab-clientes', label: 'Ir para Clientes', keys: 'g c', run: function () { goTab('clientes'); } },
      { id: 'tab-caixa', label: 'Ir para Caixa', keys: 'g x', run: function () { goTab('caixa'); } },
      { id: 'tab-equipa', label: 'Ir para Equipa', keys: 'g e', run: function () { goTab('equipa'); } },
      { id: 'tab-ia', label: 'Ir para IA', keys: 'g i', run: function () { goTab('ia'); } },
      { id: 'nova-venda', label: 'Nova venda', keys: 'n', run: function () { triggerNovaVenda(); } },
      { id: 'pop-agenda', label: 'Abrir Agenda noutra janela', keys: '', run: function () { popOut('agenda'); } },
      { id: 'pop-caixa', label: 'Abrir Caixa noutra janela', keys: '', run: function () { popOut('caixa'); } },
      { id: 'pop-dash', label: 'Abrir Resumo noutra janela', keys: '', run: function () { popOut('dashboard'); } },
      { id: 'toggle-sidebar', label: 'Recolher / expandir sidebar', keys: '[', run: function () { toggleSidebar(); } },
      { id: 'density', label: 'Alternar densidade (compacta/confortável)', keys: '', run: function () { toggleDensity(); } },
      { id: 'export-csv', label: 'Exportar análise CSV', keys: '', run: function () {
        if (typeof exportarAnaliseCsv === 'function') exportarAnaliseCsv(window.__bpUltimaAnaliseTemporal);
      } }
    ];
    return list;
  }

  function goTab(tab) {
    var btn = document.querySelector('.nav-item[data-tab="' + tab + '"]');
    if (btn) btn.click();
    prefs.lastTab = tab;
    savePrefs(prefs);
  }

  function triggerNovaVenda() {
    var fab = document.querySelector('.fab, #nova-venda-hero-btn, [data-action="nova-venda"]');
    if (fab) fab.click();
    else {
      var b = document.getElementById('bp-desk-nova');
      if (b) b.click();
    }
  }

  function popOut(tab) {
    var url = location.href.split('#')[0] + '#bp-pop=' + encodeURIComponent(tab);
    var w = window.open(url, 'bp_' + tab, 'noopener,noreferrer,width=1280,height=800');
    if (!w && typeof toast === 'function') toast('Permita pop-ups para multi-janela', 'error');
  }

  function toggleSidebar() {
    prefs.sidebarCollapsed = !prefs.sidebarCollapsed;
    savePrefs(prefs);
    applyPrefs();
  }

  function toggleDensity() {
    prefs.density = prefs.density === 'compact' ? 'comfortable' : 'compact';
    savePrefs(prefs);
    applyPrefs();
  }

  var cmdIndex = 0;
  var cmdFiltered = [];

  function openPalette() {
    if (!isDesktop()) return;
    ensurePalette();
    var el = document.getElementById('bp-cmd-palette');
    el.hidden = false;
    cmdIndex = 0;
    renderCmdList('');
    var input = document.getElementById('bp-cmd-input');
    if (input) {
      input.value = '';
      setTimeout(function () { input.focus(); }, 10);
    }
  }

  function closePalette() {
    var el = document.getElementById('bp-cmd-palette');
    if (el) el.hidden = true;
  }

  function renderCmdList(q) {
    q = (q || '').toLowerCase().trim();
    cmdFiltered = commands().filter(function (c) {
      if (!q) return true;
      return c.label.toLowerCase().indexOf(q) >= 0 || (c.keys && c.keys.indexOf(q) >= 0);
    });
    var ul = document.getElementById('bp-cmd-list');
    if (!ul) return;
    ul.innerHTML = cmdFiltered.map(function (c, i) {
      return '<li class="bp-cmd-item' + (i === cmdIndex ? ' is-active' : '') + '" data-idx="' + i + '" role="option">' +
        '<span>' + c.label + '</span>' +
        (c.keys ? '<kbd>' + c.keys + '</kbd>' : '') +
        '</li>';
    }).join('');
    ul.querySelectorAll('.bp-cmd-item').forEach(function (li) {
      li.addEventListener('click', function () {
        var idx = Number(li.getAttribute('data-idx'));
        runCmd(idx);
      });
    });
  }

  function runCmd(idx) {
    var c = cmdFiltered[idx];
    closePalette();
    if (c && typeof c.run === 'function') c.run();
  }

  /* ---------- Context menu ---------- */
  function ensureCtx() {
    if (document.getElementById('bp-ctx-menu')) return;
    var m = document.createElement('div');
    m.id = 'bp-ctx-menu';
    m.className = 'bp-ctx-menu';
    m.hidden = true;
    document.body.appendChild(m);
    document.addEventListener('click', function () { m.hidden = true; });
  }

  function showCtx(x, y, items) {
    ensureCtx();
    var m = document.getElementById('bp-ctx-menu');
    m.innerHTML = items.map(function (it, i) {
      if (it === '-') return '<div class="bp-ctx-sep"></div>';
      return '<button type="button" class="bp-ctx-item" data-i="' + i + '">' + it.label + '</button>';
    }).join('');
    m.hidden = false;
    m.style.left = Math.min(x, window.innerWidth - 200) + 'px';
    m.style.top = Math.min(y, window.innerHeight - 12 - items.length * 36) + 'px';
    m.querySelectorAll('.bp-ctx-item').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var i = Number(btn.getAttribute('data-i'));
        m.hidden = true;
        if (items[i] && items[i].run) items[i].run();
      });
    });
  }

  /* ---------- Multi-select ---------- */
  var selectedIds = new Set();
  var lastSelectedId = null;

  function clearSelection() {
    selectedIds.clear();
    lastSelectedId = null;
    document.querySelectorAll('.bp-row-selectable.is-multi-selected').forEach(function (el) {
      el.classList.remove('is-multi-selected');
    });
    updateSelectionBar();
  }

  function updateSelectionBar() {
    var bar = document.getElementById('bp-multi-bar');
    if (!bar) return;
    var n = selectedIds.size;
    bar.hidden = n === 0;
    var label = bar.querySelector('.bp-multi-count');
    if (label) label.textContent = n + (n === 1 ? ' seleccionado' : ' seleccionados');
  }

  function ensureSelectionBar() {
    if (document.getElementById('bp-multi-bar')) return;
    var bar = document.createElement('div');
    bar.id = 'bp-multi-bar';
    bar.className = 'bp-multi-bar';
    bar.hidden = true;
    bar.innerHTML =
      '<span class="bp-multi-count">0</span>' +
      '<button type="button" class="btn btn-sm btn-secondary" id="bp-multi-clear">Limpar</button>';
    document.body.appendChild(bar);
    document.getElementById('bp-multi-clear').onclick = clearSelection;
  }

  function bindListMultiSelect() {
    if (document.body.dataset.bpMulti) return;
    document.body.dataset.bpMulti = '1';
    document.addEventListener('click', function (e) {
      if (!isDesktop()) return;
      var row = e.target.closest('.list-item[data-id], .bp-ag-card[data-id], tr[data-id]');
      if (!row || e.target.closest('button, a, input')) return;
      if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
        // single select visual only if multi was active
        if (selectedIds.size && !e.shiftKey) clearSelection();
        return;
      }
      e.preventDefault();
      var id = row.getAttribute('data-id');
      if (!id) return;
      row.classList.add('bp-row-selectable');
      if (e.shiftKey && lastSelectedId) {
        selectedIds.add(id);
        row.classList.add('is-multi-selected');
      } else {
        if (selectedIds.has(id)) {
          selectedIds.delete(id);
          row.classList.remove('is-multi-selected');
        } else {
          selectedIds.add(id);
          row.classList.add('is-multi-selected');
        }
        lastSelectedId = id;
      }
      ensureSelectionBar();
      updateSelectionBar();
    });
  }

  /* ---------- Double-click open ---------- */
  function bindDoubleClick() {
    if (document.body.dataset.bpDbl) return;
    document.body.dataset.bpDbl = '1';
    document.addEventListener('dblclick', function (e) {
      if (!isDesktop()) return;
      var row = e.target.closest('.list-item[data-id], .bp-ag-card[data-id]');
      if (!row || e.target.closest('button')) return;
      row.click();
    });
  }

  /* ---------- Context on rows ---------- */
  function bindContext() {
    if (document.body.dataset.bpCtx) return;
    document.body.dataset.bpCtx = '1';
    document.addEventListener('contextmenu', function (e) {
      if (!isDesktop()) return;
      var row = e.target.closest('.list-item[data-id], .bp-ag-card[data-id]');
      if (!row) return;
      e.preventDefault();
      var id = row.getAttribute('data-id');
      showCtx(e.clientX, e.clientY, [
        { label: 'Abrir', run: function () { row.click(); } },
        { label: 'Copiar ID', run: function () {
          if (navigator.clipboard) navigator.clipboard.writeText(id);
        } },
        '-',
        { label: 'Abrir noutra janela (clientes)', run: function () { popOut('clientes'); } }
      ]);
    });
  }

  /* ---------- Keyboard ---------- */
  var goPending = null;
  function bindKeys() {
    if (document.body.dataset.bpEntKeys) return;
    document.body.dataset.bpEntKeys = '1';
    document.addEventListener('keydown', function (e) {
      if (!isDesktop() || !prefs.shortcutsEnabled) return;
      var tag = (e.target && e.target.tagName) || '';
      var typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target && e.target.isContentEditable);

      // Ctrl/Cmd+K or Ctrl+Shift+P → palette
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K' || (e.shiftKey && (e.key === 'p' || e.key === 'P')))) {
        e.preventDefault();
        openPalette();
        return;
      }
      if (e.key === 'Escape') {
        closePalette();
        clearSelection();
        return;
      }

      var palette = document.getElementById('bp-cmd-palette');
      if (palette && !palette.hidden) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          cmdIndex = Math.min(cmdIndex + 1, cmdFiltered.length - 1);
          renderCmdList(document.getElementById('bp-cmd-input').value);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          cmdIndex = Math.max(cmdIndex - 1, 0);
          renderCmdList(document.getElementById('bp-cmd-input').value);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          runCmd(cmdIndex);
        }
        return;
      }

      if (typing) {
        // Ctrl+Enter in IA or forms: try submit
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          var send = document.getElementById('ia-enviar');
          if (send && document.getElementById('tab-ia') && document.getElementById('tab-ia').classList.contains('active')) {
            e.preventDefault();
            send.click();
          }
        }
        return;
      }

      if (e.key === 'n' || e.key === 'N') {
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          triggerNovaVenda();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        triggerNovaVenda();
      }
      if (e.key === '[') {
        e.preventDefault();
        toggleSidebar();
      }
      // g then letter
      if (e.key === 'g') {
        goPending = true;
        setTimeout(function () { goPending = false; }, 800);
        return;
      }
      if (goPending) {
        goPending = false;
        var map = { r: 'dashboard', a: 'agenda', c: 'clientes', x: 'caixa', e: 'equipa', i: 'ia' };
        if (map[e.key]) {
          e.preventDefault();
          goTab(map[e.key]);
        }
      }
    });

    document.addEventListener('input', function (e) {
      if (e.target && e.target.id === 'bp-cmd-input') {
        cmdIndex = 0;
        renderCmdList(e.target.value);
      }
    });
  }

  /* ---------- Modal desktop class ---------- */
  function enhanceModals() {
    if (document.body.dataset.bpModalDesk) return;
    document.body.dataset.bpModalDesk = '1';
    var origOpen = window.openModal;
    if (typeof origOpen !== 'function') return;
    window.openModal = function (id) {
      origOpen(id);
      if (!isDesktop()) return;
      var el = document.getElementById(id);
      if (el) el.classList.add('bp-desk-dialog');
    };
    var origClose = window.closeModal;
    if (typeof origClose === 'function') {
      window.closeModal = function (id) {
        var el = document.getElementById(id);
        if (el) el.classList.remove('bp-desk-dialog');
        origClose(id);
      };
    }
  }

  /* ---------- Pop-out mode via hash ---------- */
  function handlePopHash() {
    var m = location.hash.match(/bp-pop=([a-z]+)/);
    if (!m) return;
    var tab = m[1];
    document.documentElement.classList.add('bp-popout');
    setTimeout(function () { goTab(tab); }, 600);
  }

  /* ---------- Lightweight virtualization for long lists ---------- */
  function virtualizeList(container, itemHeight) {
    if (!container || container.dataset.bpVirt === '1') return;
    var items = Array.prototype.slice.call(container.children);
    if (items.length < 80) return; // only worth it for long lists
    container.dataset.bpVirt = '1';
    itemHeight = itemHeight || 72;
    var total = items.length;
    container.style.position = 'relative';
    container.style.height = (total * itemHeight) + 'px';
    items.forEach(function (el, i) {
      el.style.position = 'absolute';
      el.style.top = (i * itemHeight) + 'px';
      el.style.left = '0';
      el.style.right = '0';
    });
    function paint() {
      var scroller = container.parentElement || container;
      var scrollTop = scroller.scrollTop || 0;
      var h = scroller.clientHeight || 600;
      var start = Math.max(0, Math.floor(scrollTop / itemHeight) - 5);
      var end = Math.min(total, Math.ceil((scrollTop + h) / itemHeight) + 5);
      items.forEach(function (el, i) {
        el.style.display = (i >= start && i < end) ? '' : 'none';
      });
    }
    var scroller = container.parentElement;
    if (scroller) scroller.addEventListener('scroll', paint, { passive: true });
    paint();
  }

  function observeLongLists() {
    if (!isDesktop()) return;
    ['#clientes-list', '#profissionais-list', '#servicos-list', '#caixa-list'].forEach(function (sel) {
      var el = document.querySelector(sel);
      if (el) virtualizeList(el, 72);
    });
  }

  /* ---------- State banner (offline/conflict) ---------- */
  function ensureStateChip() {
    // sync already has indicator; add desk class for layout
    document.documentElement.classList.toggle('bp-is-desktop', isDesktop());
  }

  /* ---------- Init ---------- */
  function mount() {
    applyPrefs();
    ensurePalette();
    ensureCtx();
    ensureSelectionBar();
    bindKeys();
    bindListMultiSelect();
    bindDoubleClick();
    bindContext();
    enhanceModals();
    handlePopHash();
    ensureStateChip();
    observeLongLists();

    // sidebar toggle button
    var nav = document.querySelector('.bottom-nav');
    if (nav && isDesktop() && !document.getElementById('bp-side-toggle')) {
      var t = document.createElement('button');
      t.id = 'bp-side-toggle';
      t.type = 'button';
      t.className = 'bp-side-toggle';
      t.title = 'Recolher menu ([)';
      t.textContent = '⟨';
      t.onclick = toggleSidebar;
      nav.appendChild(t);
    }

    // restore last tab optional — only popout
  }

  function init() {
    try { mount(); } catch (e) { console.warn('[desktop-enterprise]', e); }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 400); });
  } else setTimeout(init, 400);
  setTimeout(init, 1500);
  window.addEventListener('resize', function () {
    ensureStateChip();
    applyPrefs();
  });

  window.BPDesktopEnterprise = {
    openPalette: openPalette,
    prefs: function () { return prefs; },
    savePrefs: function (p) { prefs = Object.assign(prefs, p); savePrefs(prefs); applyPrefs(); },
    popOut: popOut,
    clearSelection: clearSelection
  };
})();
