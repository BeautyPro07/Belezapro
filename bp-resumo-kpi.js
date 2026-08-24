/* bp-resumo-kpi.js — espelha contagens do período nos botões do Resumo */
(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }

  function digits(v) {
    var d = String(v == null ? '' : v).replace(/[^\d]/g, '');
    return d === '' ? '0' : String(parseInt(d, 10));
  }

  function getState() {
    try {
      if (typeof state !== 'undefined' && state) return state;
    } catch (e) {}
    try {
      if (typeof window !== 'undefined' && window.state) return window.state;
    } catch (e2) {}
    return null;
  }

  function getIntervalo() {
    try {
      if (typeof getIntervaloDashAtual === 'function') {
        var iv = getIntervaloDashAtual();
        if (iv && iv.inicio != null && iv.fim != null) return iv;
      }
    } catch (e) {}
    return null;
  }

  function fromState() {
    var st = getState();
    var iv = getIntervalo();
    if (!st || !iv) return null;
    var movs = st.movimentos || [];
    var ids = {};
    var nServ = 0;
    for (var i = 0; i < movs.length; i++) {
      var m = movs[i];
      if (!m || m.tipo !== 'venda') continue;
      if (String(m.status || '').toLowerCase() === 'cancelado') continue;
      if (m.data < iv.inicio || m.data > iv.fim) continue;
      nServ++;
      if (m.cliente_id) ids['id:' + String(m.cliente_id)] = 1;
      else if (m.cliente) ids['n:' + String(m.cliente).toLowerCase().trim()] = 1;
    }
    var nCli = 0;
    for (var k in ids) { if (ids.hasOwnProperty(k)) nCli++; }
    return { clientes: nCli, servicos: nServ };
  }

  function setView(id, value) {
    var el = $(id);
    if (!el) return;
    var v = String(value);
    if (el.textContent !== v) el.textContent = v;
  }

  function sync() {
    var computed = null;
    try { computed = fromState(); } catch (e) { computed = null; }

    var cliSrc = $('kpi-clientes-status');
    var servSrc = $('kpi-revenue-count');

    var cliDom = cliSrc ? digits(cliSrc.textContent) : null;
    var servDom = servSrc ? digits(servSrc.textContent) : null;

    /* Preferir DOM do bundle (já filtrado); se 0 e state tem valor, usar state */
    var cli = cliDom;
    var serv = servDom;

    if (computed) {
      if (cli === '0' && computed.clientes > 0) cli = String(computed.clientes);
      if (serv === '0' && computed.servicos > 0) serv = String(computed.servicos);
      /* se DOM ainda não veio, state manda */
      if (cliSrc && digits(cliSrc.textContent) === '0' && computed.clientes >= 0) {
        /* se o texto da fonte ainda é o placeholder inicial "0", state ajuda */
      }
      if (!cliSrc) cli = String(computed.clientes);
      if (!servSrc) serv = String(computed.servicos);
      /* Se fontes existem mas bundle já escreveu, confiar no maior sinal útil */
      if (cliDom === '0' && computed.clientes > 0) cli = String(computed.clientes);
      if (servDom === '0' && computed.servicos > 0) serv = String(computed.servicos);
      if (cliDom !== '0') cli = cliDom;
      if (servDom !== '0') serv = servDom;
    }

    if (cli != null) setView('kpi-clientes-view', cli);
    if (serv != null) setView('kpi-servicos-view', serv);
  }

  function hookRender() {
    try {
      if (typeof renderDashboard === 'function' && !renderDashboard.__bpMirror) {
        var orig = renderDashboard;
        renderDashboard = function () {
          var r = orig.apply(this, arguments);
          try { sync(); } catch (e) {}
          setTimeout(sync, 0);
          setTimeout(sync, 50);
          setTimeout(sync, 200);
          return r;
        };
        renderDashboard.__bpMirror = true;
      }
    } catch (e) {}
  }

  function boot() {
    hookRender();
    sync();
  }

  boot();
  setInterval(boot, 250);
  document.addEventListener('click', function () {
    setTimeout(sync, 0);
    setTimeout(sync, 100);
    setTimeout(sync, 300);
  }, true);
})();
