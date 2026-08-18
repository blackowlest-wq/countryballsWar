const CACHE_NAME = "countryfronts-shell-v30";

const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./src/main.js",
  "./src/special-move.js",
  "./src/economy/rewards.js",
  "./src/config/balance.js",
  "./src/config/campaign.js",
  "./src/config/characters.js",
  "./src/config/countries.js",
  "./src/config/factions.js",
  "./src/config/map.js",
  "./src/config/map-compiler.js",
  "./src/config/geodata/natural-earth-korea.js",
  "./src/config/geodata/natural-earth-korea-admin-1.js",
  "./src/config/scenario.js",
  "./src/config/world-map.js",
  "./src/config/game-config.js",
  "./src/campaign/ai.js",
  "./src/campaign/combat.js",
  "./src/campaign/flag-collection.js",
  "./src/campaign/front-selection.js",
  "./src/campaign/country-location.js",
  "./src/campaign/phase-runtime.js",
  "./src/render/region-targeting.js",
  "./src/render/unit-sprite.js",
  "./src/storage/persistent-state.js",
  "./src/config/geodata/ne_110m_admin_0_countries.geojson",
  "./manifest.webmanifest",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/units/player-red-circle.png",
  "./assets/units/enemy-china.png",
  "./assets/units/enemy-korea.png",
  "./assets/units/enemy-north-korea.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return caches.match(request).then((cached) => cached || caches.match("./index.html"));
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  event.respondWith(request.mode === "navigate" ? networkFirstNavigation(request) : cacheFirst(request));
});
