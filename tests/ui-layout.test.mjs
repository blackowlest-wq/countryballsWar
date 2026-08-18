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

test("title screen exposes the flag collection menu", () => {
  const html = readProjectFile("index.html");
  const titleScreen = html.match(/<div class="title-screen">[\s\S]*?<\/div>\s*<\/dialog>/)?.[0] || "";

  assert.match(titleScreen, /id="flagCollectionButton"/);
  assert.match(html, /id="flagCollectionDialog"/);
  assert.match(html, /id="flagCollectionGrid"/);
});

test("title start opens a front selection dialog and clear returns to it", () => {
  const html = readProjectFile("index.html");
  const main = readProjectFile("src/main.js");

  assert.match(html, /id="mapSelectionDialog"/);
  assert.match(html, /id="mapSelectionGrid"/);
  assert.match(html, /id="clearRestartButton"[^>]*>戦線を選択/);
  assert.match(main, /function openMapSelection/);
  assert.match(main, /startFromTitle\(\)[\s\S]*openMapSelection/);
  assert.match(main, /clearRestartButton.*openMapSelection/);
});

test("country flag collection exposes a profile dialog with the requested sections", () => {
  const html = readProjectFile("index.html");
  const main = readProjectFile("src/main.js");

  assert.match(html, /id="countryDetailDialog"/);
  [
    "countryDetailFlag",
    "countryDetailOverview",
    "countryDetailMap",
    "countryDetailCharacter",
    "countryDetailCharacterToggle",
    "countryDetailCharacterRemove",
    "countryDetailFlagOrigin",
    "countryDetailTrivia",
    "countryDetailSources",
  ].forEach((id) => assert.match(html, new RegExp(`id="${id}"`)));
  assert.match(main, /openCountryDetail/);
  assert.match(main, /country-location\.js/);
  assert.match(main, /ne_110m_admin_0_countries\.geojson/);
});

test("country profile can switch to the character image used in battle", () => {
  const html = readProjectFile("index.html");
  const main = readProjectFile("src/main.js");

  assert.match(html, /id="countryDetailCharacterToggle"/);
  assert.match(html, /利用キャラクターの絵に切り替える/);
  assert.match(html, /id="countryDetailCharacterRemove"/);
  assert.match(html, />外す</);
  assert.match(main, /function toggleCountryCharacterImage/);
  assert.match(main, /function removeCountryCharacterImage/);
  assert.match(main, /countryDetailCharacterToggle[\s\S]*aria-pressed/);
  assert.match(main, /character\.sprite/);
});

test("country character previews use the full country flag renderer", () => {
  const main = readProjectFile("src/main.js");
  const renderCharacter = main.match(/function renderCountryCharacter\(country\) \{[\s\S]*?\n\}\n\nfunction toggleCountryCharacterImage/)?.[0] || "";

  assert.match(renderCharacter, /className = "country-character-flag"/);
  assert.match(renderCharacter, /renderCountryFlag\(country, flag\)/);
  assert.doesNotMatch(renderCharacter, /ball\.style\.background = countryFlagBackground\(country\)/);
});

test("country profile defaults to the equipped character image", () => {
  const main = readProjectFile("src/main.js");

  assert.match(
    main,
    /activeCountryDetailId = country\.id;\s*showUsedCharacterImage = Boolean\(GAME_CONFIG\.characters\[country\.id\]\?\.sprite\);/,
  );
});

test("toast uses a left message lane instead of the centered lane", () => {
  const styles = readProjectFile("styles.css");
  const toast = styles.match(/\.toast \{[\s\S]*?\n\}/)?.[0] || "";
  const visibleToast = styles.match(/\.toast\.is-visible \{[\s\S]*?\n\}/)?.[0] || "";

  assert.match(toast, /left: 26px/);
  assert.doesNotMatch(toast, /left: 50%/);
  assert.match(visibleToast, /transform: translate\(0, 0\)/);
});

test("special move includes a character cut-in with the configured name", () => {
  const html = readProjectFile("index.html");
  const main = readProjectFile("src/main.js");
  const styles = readProjectFile("styles.css");

  assert.match(html, /id="specialMoveCutIn"/);
  assert.match(html, /id="specialMoveCutInCharacter"/);
  assert.match(html, /id="specialMoveCutInName"/);
  assert.match(main, /function showSpecialMoveCutIn/);
  assert.match(main, /showSpecialMoveCutIn\(name\)/);
  assert.match(styles, /\.special-move-cut-in-panel/);
});

test("special move cut-in animations wait until the overlay is visible", () => {
  const styles = readProjectFile("styles.css");
  const panelBlock = styles.match(/\.special-move-cut-in-panel\s*\{[\s\S]*?\n\}/)?.[0] || "";
  const characterBlock = styles.match(/\.special-move-cut-in-character img\s*\{[\s\S]*?\n\}/)?.[0] || "";

  assert.match(styles, /\.special-move-cut-in\.is-visible\s+\.special-move-cut-in-panel/);
  assert.match(styles, /\.special-move-cut-in\.is-visible\s+\.special-move-cut-in-character img/);
  assert.doesNotMatch(panelBlock, /animation:\s*special-move-cut-in-panel/);
  assert.doesNotMatch(characterBlock, /animation:\s*special-move-cut-in-character/);
});
