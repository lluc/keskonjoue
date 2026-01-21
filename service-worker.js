/**
 * Service Worker pour Keskonjoue PWA
 * Active le mode offline complet avec lecture musicale
 */

import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from "workbox-precaching";
import { registerRoute, NavigationRoute } from "workbox-routing";

// Précache tous les assets du build Vite (HTML, JS, CSS, images, soundfonts)
precacheAndRoute(self.__WB_MANIFEST);

// Gère la navigation SPA - toutes les routes retournent index.html
const handler = createHandlerBoundToURL('/index.html');
const navigationRoute = new NavigationRoute(handler);
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
