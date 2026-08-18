import assert from "node:assert/strict";
import test from "node:test";

import { GAME_CONFIG, createRuntimeScenario } from "../src/config/game-config.js";
import { collectCountryFlags } from "../src/campaign/flag-collection.js";

test("a flag is collected only after every country fragment is player-controlled", () => {
  const runtime = createRuntimeScenario(GAME_CONFIG);
  const country = GAME_CONFIG.countries["south-korea"];

  country.fragmentIds.slice(0, -1).forEach((regionId) => {
    runtime.regions.find((region) => region.id === regionId).faction = "blue";
  });
  runtime.regions.find((region) => region.id === country.fragmentIds.at(-1)).faction = "gray";

  assert.deepEqual(collectCountryFlags({
    regions: runtime.regions,
    countries: { [country.id]: country },
    playerFactionId: "blue",
  }), {
    collectedCountryIds: [],
    newlyCollectedCountryIds: [],
  });

  runtime.regions.find((region) => region.id === country.fragmentIds.at(-1)).faction = "blue";
  assert.deepEqual(collectCountryFlags({
    regions: runtime.regions,
    countries: { [country.id]: country },
    playerFactionId: "blue",
  }), {
    collectedCountryIds: ["south-korea"],
    newlyCollectedCountryIds: ["south-korea"],
  });
});

test("an already collected flag is not announced again", () => {
  const runtime = createRuntimeScenario(GAME_CONFIG);
  const country = GAME_CONFIG.countries["south-korea"];
  country.fragmentIds.forEach((regionId) => {
    runtime.regions.find((region) => region.id === regionId).faction = "blue";
  });

  assert.deepEqual(collectCountryFlags({
    regions: runtime.regions,
    countries: { [country.id]: country },
    playerFactionId: "blue",
    collectedCountryIds: ["south-korea"],
  }), {
    collectedCountryIds: ["south-korea"],
    newlyCollectedCountryIds: [],
  });
});
