// Service Worker Minimalista para PWA
// Isso é necessário apenas para o navegador reconhecer o site como instalável.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Não interceptamos requisições, deixamos a internet fluir normalmente.
  // PWA offline não é estritamente necessário para instalar.
});
