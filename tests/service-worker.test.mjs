import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const indexHtml = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const serviceWorker = readFileSync(new URL("../sw.js", import.meta.url), "utf8");

test("service worker invalidates the cached shell when the runtime changes", () => {
  assert.match(serviceWorker, /const CACHE_NAME = "countryfronts-shell-v54"/);
  assert.match(indexHtml, /src\/main\.js\?v=49/);
  assert.match(serviceWorker, /src\/main\.js\?v=49/);
  assert.match(serviceWorker, /src\/render\/map-viewport\.js/);
  assert.match(serviceWorker, /src\/campaign\/unit-state\.js/);
  assert.match(serviceWorker, /src\/config\/geodata\/natural-earth-china-admin-1\.js/);
});
