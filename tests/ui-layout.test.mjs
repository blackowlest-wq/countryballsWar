import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readProjectFile = (relativePath) => fs.readFileSync(path.join(projectRoot, relativePath), "utf8");

test("front title is rendered in the global header", () => {
  const html = readProjectFile("index.html");
  const header = html.match(/<header class="topbar">[\s\S]*?<\/header>/)?.[0] || "";
  const stage = html.match(/<section class="game-stage"[\s\S]*?<\/section>/)?.[0] || "";

  assert.match(header, /id="mapName"/);
  assert.doesNotMatch(stage, /id="mapName"/);
});

test("front title uses the Japanese front name", () => {
  const worldMap = readProjectFile("src/config/world-map.js");

  assert.match(worldMap, /name: "朝鮮半島戦線"/);
});

test("toast uses a left message lane instead of the centered lane", () => {
  const styles = readProjectFile("styles.css");
  const toast = styles.match(/\.toast \{[\s\S]*?\n\}/)?.[0] || "";
  const visibleToast = styles.match(/\.toast\.is-visible \{[\s\S]*?\n\}/)?.[0] || "";

  assert.match(toast, /left: 26px/);
  assert.doesNotMatch(toast, /left: 50%/);
  assert.match(visibleToast, /transform: translate\(0, 0\)/);
});
