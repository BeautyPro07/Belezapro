// sw.js — Service Worker do BeautyPro
//
// Objetivo único: fazer cache do "app shell" (o próprio HTML, o manifest,
// os ícones, e as bibliotecas externas de que a app depende) para que,
// depois da primeira visita com internet, a app abra e funcione mesmo
// sem rede nenhuma. Os DADOS do salão (clientes, agendamentos, etc.) já
// são tratados à parte pelo IndexedDB + fila de sincronização — este
// service worker não mexe nisso, só garante que o ficheiro da app em si
// carrega offline.

const CACHE_NAME = 'beautypro-shell-v24';