// ─── Incrémentez ce numéro à chaque déploiement ───────────────────────────
const CACHE_VERSION = "gpc-v5";
const ASSETS = ["./index.html", "./manifest.json", "./icons/icon-192.png", "./icons/icon-512.png"];

// Installation : mise en cache des assets
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_VERSION).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting(); // Active immédiatement sans attendre la fermeture des onglets
});

// Activation : supprime les anciens caches
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => {
        console.log("[SW] Suppression ancien cache:", k);
        return caches.delete(k);
      }))
    )
  );
  self.clients.claim(); // Prend le contrôle immédiatement
});

// Stratégie : RÉSEAU D'ABORD, cache en fallback
// → L'app est toujours à jour quand vous êtes en ligne
// → Fonctionne quand même hors ligne (depuis le cache)
self.addEventListener("fetch", e => {
  // Uniquement pour les requêtes GET
  if (e.request.method !== "GET") return;

  e.respondWith(
    fetch(e.request)
      .then(networkResponse => {
        // Succès réseau → on met à jour le cache et on retourne la réponse fraîche
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(e.request, responseClone));
        }
        return networkResponse;
      })
      .catch(() => {
        // Pas de réseau → on sert depuis le cache
        return caches.match(e.request).then(cached => cached || caches.match("./index.html"));
      })
  );
});

// Message pour forcer la mise à jour depuis l'app
self.addEventListener("message", e => {
  if (e.data === "SKIP_WAITING") self.skipWaiting();
});
