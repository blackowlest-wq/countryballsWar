import assert from "node:assert/strict";
import test from "node:test";

import { GAME_CONFIG, createRuntimeScenario } from "../src/config/game-config.js";
import {
  getCompletedCountryIds,
  getNextPhaseId,
  isCountryComplete,
  isPhaseObjectiveComplete,
  resolveEnemyStrength,
  transitionPhase,
} from "../src/campaign/phase-runtime.js";

test("enemy strength is rounded once from the front profile", () => {
  assert.equal(resolveEnemyStrength(12, 0.95), 11);
  assert.equal(resolveEnemyStrength(12, 1.05), 13);
  assert.equal(resolveEnemyStrength(1, 0.1, 1), 1);
});

test("split-country completion requires every fragment", () => {
  const regions = [
    { id: "china-north", faction: "blue" },
    { id: "china-central", faction: "blue" },
    { id: "china-south", faction: "red" },
  ];
  const country = GAME_CONFIG.countries.china;

  assert.equal(isCountryComplete(regions, country, "blue"), false);
  regions[2].faction = "blue";
  assert.equal(isCountryComplete(regions, country, "blue"), true);
  assert.deepEqual(getCompletedCountryIds(regions, { china: country }, "blue"), ["china"]);
});

test("phase transition carries player units and occupation but resets enemies", () => {
  const current = createRuntimeScenario(GAME_CONFIG, "asia-front-early");
  const next = createRuntimeScenario(GAME_CONFIG, "asia-front-late");
  const carriedUnit = current.units.find((unit) => unit.faction === "blue");
  carriedUnit.x = 0.123;
  carriedUnit.y = 0.456;
  carriedUnit.strength = 7;
  const carriedRegion = current.regions.find((region) => region.id === "china-north");
  carriedRegion.faction = "blue";
  carriedRegion.occupation = { faction: "blue", remaining: 2.5 };

  const result = transitionPhase({
    currentRuntime: current,
    nextRuntime: next,
    playerFactionId: "blue",
  });

  const resultUnit = result.units.find((unit) => unit.id === carriedUnit.id);
  assert.equal(resultUnit.x, 0.123);
  assert.equal(resultUnit.y, 0.456);
  assert.equal(resultUnit.strength, 7);
  assert.equal(result.regions.find((region) => region.id === "china-north").faction, "blue");
  assert.deepEqual(result.regions.find((region) => region.id === "china-north").occupation, { faction: "blue", remaining: 2.5 });
  assert.deepEqual(
    result.units.filter((unit) => unit.faction !== "blue").map((unit) => unit.id).sort(),
    next.units.filter((unit) => unit.faction !== "blue").map((unit) => unit.id).sort(),
  );
  assert.equal(result.units.some((unit) => unit.id === "red-2" && unit.regionId === "china-central"), false);
});

test("phase objectives and next-phase lookup are explicit", () => {
  const early = GAME_CONFIG.campaign.phases["asia-front-early"];
  const late = GAME_CONFIG.campaign.phases["asia-front-late"];
  const runtime = createRuntimeScenario(GAME_CONFIG, early.id);

  assert.equal(isPhaseObjectiveComplete(runtime.regions, early, "blue"), false);
  early.objectiveRegionIds.forEach((regionId) => {
    runtime.regions.find((region) => region.id === regionId).faction = "blue";
  });
  assert.equal(isPhaseObjectiveComplete(runtime.regions, early, "blue"), true);
  assert.equal(getNextPhaseId(GAME_CONFIG.campaign, "asia-front", early.id), late.id);
  assert.equal(getNextPhaseId(GAME_CONFIG.campaign, "asia-front", late.id), null);
});
