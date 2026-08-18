import assert from "node:assert/strict";
import test from "node:test";

import { GAME_CONFIG, createGameConfig, createRuntimeScenario } from "../src/config/game-config.js";
import { MAP } from "../src/config/map.js";

function editableConfig() {
  return JSON.parse(JSON.stringify(GAME_CONFIG));
}

test("the compiled geographic front map is connected", () => {
  assert.equal(GAME_CONFIG.map.id, "korea-front");
  const regionIds = GAME_CONFIG.map.regions.map((region) => region.id);
  const visited = new Set([regionIds[0]]);
  const queue = [regionIds[0]];

  while (queue.length > 0) {
    const current = queue.shift();
    GAME_CONFIG.map.roadNeighbors[current].forEach((neighbor) => {
      assert.ok(GAME_CONFIG.map.roadNeighbors[neighbor].includes(current));
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    });
  }

  assert.equal(visited.size, regionIds.length);
  assert.equal(regionIds.length, 11);
  assert.equal(GAME_CONFIG.countries["south-korea"].fragmentIds.length, 6);
  assert.equal(GAME_CONFIG.countries["north-korea"].fragmentIds.length, 5);
  assert.equal(GAME_CONFIG.map.sourceWorldMapId, "natural-earth-korea-regions-v2");
  assert.equal(GAME_CONFIG.map.source.id, "natural-earth-admin-1-korea");
  assert.equal(GAME_CONFIG.map.source.version, "5.1.1");
  assert.equal(GAME_CONFIG.map.source.scale, "1:10m");
  assert.equal(GAME_CONFIG.map.source.license, "Public domain");
  assert.equal(GAME_CONFIG.map.regions.find((region) => region.id === "south-capital").sourceGeometry.type, "MultiPolygon");
  assert.equal(GAME_CONFIG.map.regions.find((region) => region.id === "south-capital").sourceFeature.sourceFragmentIds.length, 3);
  assert.ok(GAME_CONFIG.map.regions.every((region) => region.polygons.length > 0));
  assert.ok(GAME_CONFIG.map.regions.every((region) => region.borderPolygons.length > 0));
  assert.equal(GAME_CONFIG.map.interactionMinDistance, 0.045);
});

test("roads remain the source of the runtime adjacency table and every road is passable", () => {
  const expected = new Map(GAME_CONFIG.map.regions.map((region) => [region.id, []]));
  MAP.roads.forEach(([from, to]) => {
    expected.get(from).push(to);
    expected.get(to).push(from);
  });

  expected.forEach((neighbors, regionId) => {
    assert.deepEqual([...GAME_CONFIG.map.roadNeighbors[regionId]].sort(), neighbors.sort());
  });
  assert.ok(GAME_CONFIG.map.roadDefinitions.every((road) => road.passable !== false));
  assert.equal(GAME_CONFIG.map.roadDefinitions.filter((road) => road.kind === "land").length, 17);
  assert.equal(GAME_CONFIG.map.roadDefinitions.filter((road) => road.kind === "sea").length, 1);
  assert.equal(Object.hasOwn(MAP, "roadNeighbors"), false);
});

test("countries own fragments and major countries can require multiple fragments", () => {
  assert.deepEqual(GAME_CONFIG.countries.russia.fragmentIds, ["russia-east", "russia-far-east"]);
  assert.deepEqual(GAME_CONFIG.countries.china.fragmentIds, ["china-north", "china-central", "china-south"]);
  assert.equal(GAME_CONFIG.characters.china.eyeStyle, "sharp");
  assert.equal(GAME_CONFIG.characters.vietnam.eyeStyle, "round");
  assert.equal(GAME_CONFIG.characters.player.isPlayerCharacter, true);
  GAME_CONFIG.map.regions.forEach((region) => {
    assert.equal(GAME_CONFIG.countries[region.countryId].fragmentIds.includes(region.fragmentId), true);
  });
});

test("runtime scenario uses phase production and rounds front-start enemy strength", () => {
  const runtime = createRuntimeScenario();
  const phase = GAME_CONFIG.campaign.phases[GAME_CONFIG.scenario.phaseId];

  assert.equal(runtime.regions.length, GAME_CONFIG.map.regions.length);
  assert.equal(runtime.units.length, phase.initialUnits.length);
  assert.equal(runtime.regions.filter((region) => region.faction === "blue").length, 1);
  assert.equal(runtime.units.filter((unit) => unit.faction === "blue").length, 1);
  assert.equal(runtime.units.find((unit) => unit.faction === "blue").characterId, "player");
  assert.ok(runtime.units.some((unit) => unit.faction === "gray" && unit.characterId === "south-korea"));
  assert.ok(runtime.units.some((unit) => unit.faction === "red" && unit.characterId === "north-korea"));
  assert.equal(phase.territoryOwners["south-capital"], "blue");
  GAME_CONFIG.countries["south-korea"].fragmentIds
    .filter((regionId) => regionId !== "south-capital")
    .forEach((regionId) => assert.equal(phase.territoryOwners[regionId], "gray"));
  GAME_CONFIG.countries["north-korea"].fragmentIds
    .forEach((regionId) => assert.equal(phase.territoryOwners[regionId], "red"));
  runtime.regions.forEach((region) => {
    assert.equal(region.faction, phase.territoryOwners[region.id]);
    assert.equal(region.production, phase.productionByRegion[region.id]);
    assert.deepEqual({ x: region.interactionPoint[0], y: region.interactionPoint[1] }, {
      x: region.interactionPoint[0],
      y: region.interactionPoint[1],
    });
  });
  runtime.units.forEach((unit) => {
    const base = GAME_CONFIG.balance.units.baseMaxStrengthByFaction[unit.faction];
    const expected = GAME_CONFIG.factions[unit.faction].isEnemy
      ? Math.round(base * GAME_CONFIG.balance.campaign.enemyProfiles.regionalIntro.strengthMultiplier)
      : base;
    assert.equal(unit.maxStrength, expected);
    assert.equal(unit.strength, expected);
    assert.ok(GAME_CONFIG.characters[unit.characterId]);
  });
});

test("production values are defined for every geographic fragment", () => {
  const production = GAME_CONFIG.balance.territoryProduction;
  assert.deepEqual(Object.keys(production).sort(), GAME_CONFIG.map.regions.map((region) => region.id).sort());
  assert.equal(production["south-capital"], 4);
  assert.equal(production["north-central"], 3);
  assert.equal(Object.values(production).filter((value) => value === 2).length, 4);
});

test("unknown and duplicate roads are rejected during configuration", () => {
  const unknown = editableConfig();
  unknown.map.roads.push([unknown.map.regions[0].id, "missing-region"]);
  assert.throws(() => createGameConfig(unknown), /missing-region/);

  const duplicate = editableConfig();
  duplicate.map.roads.push([duplicate.map.roads[0][1], duplicate.map.roads[0][0]]);
  assert.throws(() => createGameConfig(duplicate), /重複|duplicate/i);
});

test("missing ownership is rejected", () => {
  const config = editableConfig();
  delete config.scenario.territoryOwners[config.map.regions[0].id];
  assert.throws(() => createGameConfig(config));
});

test("all non-player factions are active enemies and no neutral faction remains", () => {
  assert.equal(Object.hasOwn(GAME_CONFIG.factions, "neutral"), false);
  Object.values(GAME_CONFIG.factions)
    .filter((faction) => faction.id !== GAME_CONFIG.scenario.playerFactionId)
    .forEach((faction) => assert.equal(faction.isEnemy, true));
});

test("campaign phases cover the map and carry explicit objectives", () => {
  const front = GAME_CONFIG.campaign.fronts[GAME_CONFIG.scenario.frontId];
  assert.deepEqual(front.phaseIds, ["korea-front-opening"]);
  assert.deepEqual(front.targetCountryIds, ["south-korea", "north-korea"]);
  front.phaseIds.forEach((phaseId, index) => {
    const phase = GAME_CONFIG.campaign.phases[phaseId];
    assert.equal(phase.index, index);
    assert.equal(Object.keys(phase.territoryOwners).length, GAME_CONFIG.map.regions.length);
    assert.equal(phase.objectiveRegionIds.length, 10);
  });
});

test("invalid campaign map references and road passability are rejected", () => {
  const invalidFront = editableConfig();
  invalidFront.campaign.fronts[invalidFront.scenario.frontId].mapId = "other-map";
  assert.throws(() => createGameConfig(invalidFront), /another map/);

  const invalidRoad = editableConfig();
  invalidRoad.map.roadDefinitions[0].passable = false;
  assert.throws(() => createGameConfig(invalidRoad), /not passable/);

  const invalidInteraction = editableConfig();
  invalidInteraction.map.regions[1].interactionPoint = [...invalidInteraction.map.regions[0].interactionPoint];
  assert.throws(() => createGameConfig(invalidInteraction), /too close/);
});

test("special move and campaign balance keep their fixed constraints", () => {
  const { specialMove, campaign } = GAME_CONFIG.balance;
  assert.equal(specialMove.usesPerOperation, 3);
  assert.equal(specialMove.types.enemyWeakness.strengthReductionRate, 0.2);
  assert.equal(specialMove.types.allyBoost.strengthIncreaseRate, 0.2);
  assert.equal(specialMove.types.invincibility.durationSeconds, 3);
  Object.entries(campaign.frontTypes).forEach(([frontTypeId, frontType]) => {
    assert.ok(frontType.targetDurationSeconds >= 300 && frontType.targetDurationSeconds <= 600);
    const minimumPhaseCount = frontTypeId === "regionalSmall" ? 1 : 2;
    assert.ok(frontType.phaseCount >= minimumPhaseCount && frontType.phaseCount <= 6);
  });
});

test("invalid map geometry and decoration data are rejected", () => {
  const invalidPointConfig = editableConfig();
  invalidPointConfig.map.regions[0].points[0] = [0.1, 0.2, 0.3];
  assert.throws(() => createGameConfig(invalidPointConfig));

  const invalidLabel = editableConfig();
  invalidLabel.map.decorations.labels[0].text = "";
  assert.throws(() => createGameConfig(invalidLabel), /decorations\.labels/);

  const invalidLine = editableConfig();
  invalidLine.map.decorations.lines.push({ from: [0.2, 0.2], to: [0.62, Number.NaN] });
  assert.throws(() => createGameConfig(invalidLine), /decorations\.lines/);
});
