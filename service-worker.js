/**
 * Service Worker pour Keskonjoue PWA
 * Active le mode offline complet avec lecture musicale
 */

import { precacheAndRoute, cleanupOutdatedCaches, matchPrecache } from "workbox-precaching";
import { registerRoute, NavigationRoute, Route } from "workbox-routing";

// Précache tous les assets du build Vite (HTML, JS, CSS, images, soundfonts)
precacheAndRoute(self.__WB_MANIFEST);

// Gère la navigation SPA avec stratégie Cache First
// Retourne index.html depuis le cache sans attendre le réseau
const navigationHandler = async () => {
  const cachedResponse = await matchPrecache('/index.html');
  return cachedResponse || fetch('/index.html');
};

const navigationRoute = new NavigationRoute(navigationHandler);
registerRoute(navigationRoute);

// Nettoie les anciens caches lors des mises à jour
cleanupOutdatedCaches();

// Active immédiatement le nouveau service worker
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});
