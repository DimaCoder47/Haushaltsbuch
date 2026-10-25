// Minimaler Service Worker für WebAPK / PWA-Installation
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Leerer Fetch-Handler für PWA-Kriterien
});