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
import { calculateGroupCombatDamage } from "../src/campaign/combat.js";
import { chooseAiAttackCandidate, getAiAttackCandidates } from "../src/campaign/ai.js";
import { findRegionAtWorldPoint } from "../src/render/region-targeting.js";
import { getCharacterSpriteSource, getCharacterSpriteSources } from "../src/render/character-sprite.js";

test("all character image consumers resolve the registered real sprite by character ID", () => {
  const characters = {
    player: { sprite: "./assets/units/player-red-circle.png" },
    "south-korea": { sprite: "./assets/units/enemy-korea.png" },
    "north-korea": { sprite: "./assets/units/enemy-north-korea.png" },
    japan: { sprite: null },
  };

  assert.equal(getCharacterSpriteSource("player", characters), "./assets/units/player-red-circle.png");
  assert.equal(getCharacterSpriteSource("south-korea", characters), "./assets/units/enemy-korea.png");
  assert.equal(getCharacterSpriteSource("north-korea", characters), "./assets/units/enemy-north-korea.png");
  assert.equal(getCharacterSpriteSource("japan", characters), null);
  assert.deepEqual(getCharacterSpriteSources(characters), {
    player: "./assets/units/player-red-circle.png",
    "south-korea": "./assets/units/enemy-korea.png",
    "north-korea": "./assets/units/enemy-north-korea.png",
  });
});

test("enemy strength is rounded once from the front profile", () => {
  assert.equal(resolveEnemyStrength(12, 0.95), 11);
  assert.equal(resolveEnemyStrength(12, 1.05), 13);
  assert.equal(resolveEnemyStrength(1, 0.1, 1), 1);
});

test("a larger direct force is not overpowered by a small production difference", () => {
  const playerDamage = calculateGroupCombatDamage({
    totalStrength: 6,
    totalProduction: 2,
    balance: GAME_CONFIG.balance.combat,
  });
  const northKoreaDamage = calculateGroupCombatDamage({
    totalStrength: 5,
    totalProduction: 3,
    balance: GAME_CONFIG.balance.combat,
  });

  assert.ok(playerDamage >= northKoreaDamage);
});

test("North Korean regions produce an attack candidate against an adjacent player region", () => {
  const runtime = createRuntimeScenario(GAME_CONFIG);
  runtime.regions.find((region) => region.id === "south-capital").faction = "blue";
  const redCandidates = getAiAttackCandidates({
    regions: runtime.regions,
    units: runtime.units,
    factionId: "red",
    playerFactionId: "blue",
    areNeighbors: (source, target) => GAME_CONFIG.map.roadNeighbors[source.id].includes(target.id),
  });

  assert.ok(redCandidates.some(({ source, target }) => source.id === "north-east-central" && target.id === "south-capital"));
  assert.equal(chooseAiAttackCandidate([
    { factionId: "gray", target: { id: "south-capital" } },
    { factionId: "red", target: { id: "south-capital" } },
  ], "red", () => 0)?.factionId, "red");
});

test("small island interaction points keep a forgiving release target", () => {
  const jeju = GAME_CONFIG.map.regions.find((region) => region.id === "south-jeju");
  const point = [jeju.interactionPoint[0] + 0.03, jeju.interactionPoint[1]];

  assert.equal(findRegionAtWorldPoint({
    regions: [jeju],
    point,
    pointInRegion: () => false,
    defaultHitRadius: GAME_CONFIG.map.interactionHitRadius,
  })?.id, "south-jeju");
});

test("split-country completion requires every fragment", () => {
  const country = GAME_CONFIG.countries.china;
  const regions = country.fragmentIds.map((id, index) => ({
    id,
    faction: index === country.fragmentIds.length - 1 ? "red" : "blue",
  }));

  assert.equal(isCountryComplete(regions, country, "blue"), false);
  regions.at(-1).faction = "blue";
  assert.equal(isCountryComplete(regions, country, "blue"), true);
  assert.deepEqual(getCompletedCountryIds(regions, { china: country }, "blue"), ["china"]);
});

test("phase transition carries player units and occupation but resets enemies", () => {
  const current = createRuntimeScenario(GAME_CONFIG, "korea-front-opening");
  const next = {
    ...createRuntimeScenario(GAME_CONFIG, "korea-front-opening"),
    phaseId: "korea-front-next",
    units: createRuntimeScenario(GAME_CONFIG, "korea-front-opening").units
      .filter((unit) => unit.faction !== "blue")
      .map((unit) => ({ ...unit, id: "next-red" })),
  };
  const carriedUnit = current.units.find((unit) => unit.faction === "blue");
  carriedUnit.x = 0.123;
  carriedUnit.y = 0.456;
  carriedUnit.strength = 7;
  const carriedRegion = current.regions.find((region) => region.id === "south-capital");
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
  assert.equal(result.regions.find((region) => region.id === "south-capital").faction, "blue");
  assert.deepEqual(result.regions.find((region) => region.id === "south-capital").occupation, { faction: "blue", remaining: 2.5 });
  assert.deepEqual(
    result.units.filter((unit) => unit.faction !== "blue").map((unit) => unit.id).sort(),
    next.units.filter((unit) => unit.faction !== "blue").map((unit) => unit.id).sort(),
  );
  assert.equal(result.units.some((unit) => unit.id === "red-1"), false);
  assert.equal(result.units.some((unit) => unit.id === "next-red"), true);
});

test("China phase transition carries the southern advance and deploys five northern enemies", () => {
  const opening = GAME_CONFIG.campaign.phases["china-front-opening"];
  const current = createRuntimeScenario(GAME_CONFIG, opening.id);
  opening.objectiveRegionIds.forEach((regionId) => {
    current.regions.find((region) => region.id === regionId).faction = "blue";
  });
  const player = current.units.find((unit) => unit.faction === "blue");
  player.strength = 9;
  player.x = 0.63;
  player.y = 0.69;

  const result = transitionPhase({
    currentRuntime: current,
    nextRuntime: createRuntimeScenario(GAME_CONFIG, "china-front-late"),
    playerFactionId: "blue",
  });

  assert.equal(result.phaseId, "china-front-late");
  assert.equal(result.units.find((unit) => unit.faction === "blue").strength, 9);
  assert.equal(result.units.find((unit) => unit.faction === "blue").x, 0.63);
  assert.ok(opening.objectiveRegionIds.every(
    (regionId) => result.regions.find((region) => region.id === regionId).faction === "blue",
  ));
  assert.deepEqual(
    result.units.filter((unit) => unit.faction === "red").map((unit) => unit.regionId).sort(),
    [
      "china-xinjiang",
      "china-northwest",
      "china-north-coast",
      "china-northern-frontier",
      "china-northeast",
    ].sort(),
  );
});

test("phase objectives and next-phase lookup are explicit", () => {
  const phase = GAME_CONFIG.campaign.phases["korea-front-opening"];
  const runtime = createRuntimeScenario(GAME_CONFIG, phase.id);

  assert.equal(isPhaseObjectiveComplete(runtime.regions, phase, "blue"), false);
  phase.objectiveRegionIds.forEach((regionId) => {
    runtime.regions.find((region) => region.id === regionId).faction = "blue";
  });
  assert.equal(isPhaseObjectiveComplete(runtime.regions, phase, "blue"), true);
  assert.equal(getNextPhaseId(GAME_CONFIG.campaign, "korea-front", phase.id), null);
});
