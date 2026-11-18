// Bro sûr — service worker minimal.
// Stratégie : réseau d'abord pour les pages (contenu frais), cache pour les
// assets buildés (noms hashés = immuables). Les données Supabase ne sont
// JAMAIS mises en cache : ce sont des discussions privées et sensibles.

const VERSION = 'v1'
const PAGES = `bro-sur-pages-${VERSION}`
const ASSETS = `bro-sur-assets-${VERSION}`
const SHELL = ['./', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PAGES).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.endsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  // Hors site (Supabase, Google Fonts…) : on laisse passer sans cache.
  if (url.origin !== location.origin) return

  // Pages : réseau d'abord, repli sur le cache puis sur la coquille hors-ligne.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(PAGES).then((c) => c.put(request, copy))
          }
          return res
        })
        .catch(() => caches.match(request).then((r) => r || caches.match('./')))
    )
    return
  }

  // Assets Vite hashés : stale-while-revalidate.
  if (url.pathname.includes('/assets/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request).then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(ASSETS).then((c) => c.put(request, copy))
          }
          return res
        })
        return cached || network
      })
    )
    return
  }

  // Icônes, manifest : cache d'abord.
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(ASSETS).then((c) => c.put(request, copy))
          }
          return res
        })
    )
  )
})
