// BeautyPro Service Worker — alinhado ao index.html (só app.bundle.js)
// v20260819-benza-ficha: força actualização do shell após correcção da Benza (lista = aba Clientes)
const CACHE_NAME = 'belezapro-shell-v20260819-cliente-fixa';

const APP_SHELL = [
  './',
  './index.html',
  './app.bundle.js',
  './base-variaveis.css',
  './componentes-base.css',
  './layout-nav-tabs.css',
  './kpis-caixa-listas.css',
  './menus-agenda.css',
  './modais-toast-fab.css',
  './login-carrinho-venda.css',
  './historico-fecho-equipa.css',
  './ia.css',
  './plano-filtros-grafico.css',
  './impressao-acessibilidade.css',
  './design-tokens-extra.css',
  './design-system-final.css',
  './dark-mode.css',
  './splash-sparkline.css',
  './bp-premium-panels.css',
  './desktop-responsive.css',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(APP_SHELL.map((url) => cache.add(url).catch(() => null)))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((nomes) =>
      Promise.all(nomes.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    ).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = event.request.url || '';

  // Nunca cachear REST/Storage Supabase
  if (url.indexOf('supabase.co') !== -1) {
    event.respondWith(fetch(event.request));
    return;
  }

  // app.bundle.js + index.html: network-first, sem servir shell antiga
  var isShellCritical =
    url.indexOf('app.bundle.js') !== -1 ||
    url.indexOf('index.html') !== -1 ||
    url.indexOf('/sw.js') !== -1 ||
    (event.request.mode === 'navigate');

  if (isShellCritical) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then(function (res) {
          if (res && res.status === 200 && url.indexOf('app.bundle.js') !== -1) {
            var clone = res.clone();
            caches.open(CACHE_NAME).then(function (c) { c.put(event.request, clone); });
          }
          return res;
        })
        .catch(function () {
          return caches.match(event.request);
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function (cached) {
      var network = fetch(event.request)
        .then(function (res) {
          if (res && res.status === 200 && url.indexOf('.css') !== -1) {
            var clone = res.clone();
            caches.open(CACHE_NAME).then(function (c) { c.put(event.request, clone); });
          }
          return res;
        })
        .catch(function () { return cached; });
      return cached || network;
    })
  );
});
