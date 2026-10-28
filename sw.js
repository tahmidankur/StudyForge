/* ============================================================
   Study Forge service worker
   Saves the app's files on the device so it opens without internet.
   Change CACHE_NAME (v1 -> v2) whenever you update a file,
   so phones download the new version.
   ============================================================ */

const CACHE_NAME = 'study-forge-v1';

// Paths are relative so the app also works from a sub-folder (e.g. GitHub Pages).
const FILES = [
  './',
  'index.html',
  'dashboard.html',
  'reflect.html',
  'style.css',
  'script.js',
  'icon.svg',
  'manifest.json',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
];

// 1. Install: save all the files.
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(FILES)));
  self.skipWaiting();
});

// 2. Activate: delete caches from older versions.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(names => Promise.all(
      names.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
    ))
  );
  self.clients.claim();
});

// 3. Fetch: try the internet first so you always get the newest version,
//    and fall back to the saved copy when you're offline.
self.addEventListener('fetch', (event) => {
  // Only handle our own files (not Google Fonts or other websites).
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request, { ignoreSearch: true }))
  );
});
