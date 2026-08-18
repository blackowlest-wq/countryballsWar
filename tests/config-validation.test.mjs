import assert from "node:assert/strict";
import test from "node:test";

import {
  GAME_CONFIG,
  MAP_REGION_COUNT_MAX,
  MAP_REGION_COUNT_MIN,
  createGameConfig,
  createRuntimeScenario,
} from "../src/config/game-config.js";
import { MAP, MAPS } from "../src/config/map.js";
import { getCountryFlagOrigin, UNKNOWN_COUNTRY_FLAG_ORIGIN } from "../src/config/countries.js";

function editableConfig() {
  return JSON.parse(JSON.stringify(GAME_CONFIG));
}

test("the compiled geographic front map is connected", () => {
  assert.equal(GAME_CONFIG.map.id, "korea-front");
  assert.equal(GAME_CONFIG.map, GAME_CONFIG.maps[GAME_CONFIG.map.id]);
  assert.deepEqual(Object.keys(GAME_CONFIG.maps), Object.keys(MAPS));
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
  assert.ok(regionIds.length >= MAP_REGION_COUNT_MIN && regionIds.length <= MAP_REGION_COUNT_MAX);
  assert.equal(regionIds.length, 11);
  assert.equal(GAME_CONFIG.countries["south-korea"].fragmentIds.length, 6);
  assert.equal(GAME_CONFIG.countries["north-korea"].fragmentIds.length, 5);
  assert.equal(GAME_CONFIG.map.sourceWorldMapId, "natural-earth-admin-1-regions-v3");
  assert.equal(GAME_CONFIG.map.source.id, "natural-earth-admin-1-korea");
  assert.equal(GAME_CONFIG.map.source.version, "5.1.1");
  assert.equal(GAME_CONFIG.map.source.scale, "1:10m");
  assert.equal(GAME_CONFIG.map.source.license, "Public domain");
  assert.equal(GAME_CONFIG.map.regions.find((region) => region.id === "south-capital").sourceGeometry.type, "MultiPolygon");
  assert.equal(GAME_CONFIG.map.regions.find((region) => region.id === "south-capital").sourceFeature.sourceFragmentIds.length, 3);
  assert.ok(GAME_CONFIG.map.regions.every((region) => region.polygons.length > 0));
  assert.ok(GAME_CONFIG.map.regions.every((region) => region.borderPolygons.length > 0));
  assert.equal(GAME_CONFIG.map.interactionMinDistance, 0.045);
  assert.equal(GAME_CONFIG.map.regions.find((region) => region.id === "south-jeju").interactionRadius, 0.035);
});

test("the Japan map uses eleven connected geographic regions without Okinawa", () => {
  const japanMap = GAME_CONFIG.maps["japan-front"];
  assert.ok(japanMap);
  assert.equal(japanMap.source.id, "natural-earth-admin-1-japan");
  assert.equal(japanMap.regions.length, 11);
  assert.equal(japanMap.sourceWorldMapId, "natural-earth-admin-1-regions-v3");

  const visited = new Set([japanMap.regions[0].id]);
  const queue = [japanMap.regions[0].id];
  while (queue.length > 0) {
    const current = queue.shift();
    japanMap.roadNeighbors[current].forEach((neighbor) => {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    });
  }

  assert.equal(visited.size, japanMap.regions.length);
  assert.equal(japanMap.regions.some((region) => region.id === "japan-okinawa"), false);
  assert.equal(japanMap.regions.find((region) => region.id === "japan-kyushu-south").interactionRadius, undefined);
  assert.equal(japanMap.projection.bounds.west, 129.3);
  assert.equal(japanMap.roadDefinitions.length, 13);
  assert.equal(japanMap.roadDefinitions.filter((road) => road.kind === "land").length, 8);
  assert.equal(japanMap.roadDefinitions.filter((road) => road.kind === "sea").length, 5);
  assert.equal(GAME_CONFIG.countries.japan.fragmentIds.length, 11);
  assert.equal(GAME_CONFIG.characters.japan.sprite, "./assets/units/enemy-japan.svg");

  const openingRuntime = createRuntimeScenario(GAME_CONFIG, "japan-front-opening");
  assert.equal(openingRuntime.mapId, "japan-front");
  assert.equal(openingRuntime.regions.length, 11);
  assert.equal(openingRuntime.units.find((unit) => unit.faction === "blue").regionId, "japan-kyushu-south");
  assert.equal(new Set(openingRuntime.units.filter((unit) => unit.faction === "blue").map((unit) => unit.regionId)).size, 1);
  assert.ok(openingRuntime.units.some((unit) => unit.faction === "red" && unit.characterId === "japan"));
  openingRuntime.units.filter((unit) => unit.faction === "red").forEach((unit) => {
    const region = openingRuntime.regions.find((candidate) => candidate.id === unit.regionId);
    assert.equal(region.countryId, GAME_CONFIG.characters[unit.characterId].countryId);
  });

  const lateRuntime = createRuntimeScenario(GAME_CONFIG, "japan-front-late");
  assert.equal(lateRuntime.phaseId, "japan-front-late");
  assert.equal(lateRuntime.units.filter((unit) => unit.faction === "red").length, 3);
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
  assert.equal(GAME_CONFIG.characters.china.sprite, "./assets/units/enemy-china.png");
  assert.equal(GAME_CONFIG.characters.player.sprite, "./assets/units/player-red-circle.png");
  assert.equal(GAME_CONFIG.characters.player.isPlayerCharacter, true);
  GAME_CONFIG.map.regions.forEach((region) => {
    assert.equal(GAME_CONFIG.countries[region.countryId].fragmentIds.includes(region.fragmentId), true);
  });
});

test("every country has researched profile content and a world map code", () => {
  Object.values(GAME_CONFIG.countries).forEach((country) => {
    assert.match(country.isoA3, /^[A-Z]{3}$/);
    assert.ok(country.overview.length > 0);
    assert.ok(country.location.region.length > 0);
    assert.ok(country.location.description.length > 0);
    assert.ok(country.flagOrigin.length > 0);
    assert.ok(country.trivia.length >= 2);
    assert.ok(country.sources.length >= 2);
    country.sources.forEach((source) => assert.match(source.url, /^https?:\/\//));
  });
});

test("missing flag origin is accepted and uses the neutral fallback text", () => {
  const config = editableConfig();
  delete config.countries.russia.flagOrigin;

  assert.doesNotThrow(() => createGameConfig(config));
  assert.equal(getCountryFlagOrigin(config.countries.russia), UNKNOWN_COUNTRY_FLAG_ORIGIN);

  config.countries.russia.flagOrigin = "  ";
  assert.equal(getCountryFlagOrigin(config.countries.russia), UNKNOWN_COUNTRY_FLAG_ORIGIN);
});

test("runtime scenario uses phase production and rounds front-start enemy strength", () => {
  const runtime = createRuntimeScenario();
  const phase = GAME_CONFIG.campaign.phases[GAME_CONFIG.scenario.phaseId];

  assert.equal(runtime.regions.length, GAME_CONFIG.map.regions.length);
  assert.equal(runtime.mapId, GAME_CONFIG.scenario.mapId);
  assert.equal(runtime.units.length, phase.initialUnits.length);
  assert.equal(runtime.regions.filter((region) => region.faction === "blue").length, 1);
  assert.equal(runtime.units.filter((unit) => unit.faction === "blue").length, 1);
  assert.equal(runtime.units.find((unit) => unit.faction === "blue").characterId, "player");
  assert.ok(runtime.units.some((unit) => unit.faction === "gray" && unit.characterId === "south-korea"));
  assert.ok(runtime.units.some((unit) => unit.faction === "red" && unit.characterId === "north-korea"));
  assert.equal(phase.territoryOwners["south-jeju"], "blue");
  assert.equal(runtime.units.find((unit) => unit.faction === "blue").regionId, "south-jeju");
  GAME_CONFIG.countries["south-korea"].fragmentIds
    .filter((regionId) => regionId !== "south-jeju")
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
    assert.match(GAME_CONFIG.characters[unit.characterId].sprite, /^\.\/assets\/units\/.*\.png$/);
  });
});

test("map rules keep the player in one starting region and enemies in their country", () => {
  const runtime = createRuntimeScenario();
  const playerStartRegionIds = new Set(
    runtime.units
      .filter((unit) => unit.faction === GAME_CONFIG.scenario.playerFactionId)
      .map((unit) => unit.regionId),
  );
  assert.equal(playerStartRegionIds.size, 1);

  runtime.units
    .filter((unit) => GAME_CONFIG.factions[unit.faction].isEnemy)
    .forEach((unit) => {
      const region = runtime.regions.find((candidate) => candidate.id === unit.regionId);
      assert.equal(GAME_CONFIG.characters[unit.characterId].countryId, region.countryId);
    });
});

test("difficulty applies enemy strength and special move balance at campaign start", () => {
  const profiles = GAME_CONFIG.balance.difficulty.profiles;
  assert.deepEqual(
    Object.fromEntries(Object.entries(profiles).map(([id, profile]) => [id, profile.label])),
    { easy: "やさしい", normal: "ふつう", hard: "むずかしい" },
  );
  assert.deepEqual(
    Object.fromEntries(Object.entries(profiles).map(([id, profile]) => [id, profile.specialMoveUsesPerOperation])),
    { easy: 3, normal: 1, hard: 0 },
  );

  const startingStrengths = Object.fromEntries(Object.keys(profiles).map((difficultyId) => {
    const runtime = createRuntimeScenario(GAME_CONFIG, GAME_CONFIG.scenario.phaseId, difficultyId);
    return [difficultyId, runtime.units.find((unit) => unit.faction === "red").maxStrength];
  }));
  assert.deepEqual(startingStrengths, { easy: 8, normal: 10, hard: 12 });
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
  assert.throws(() => createGameConfig(invalidFront), /unknown map/);

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

test("maps outside the 10 to 15 region range are rejected", () => {
  const tooSmall = editableConfig();
  tooSmall.map.regions = tooSmall.map.regions.slice(0, MAP_REGION_COUNT_MIN - 1);
  assert.throws(() => createGameConfig(tooSmall), /between 10 and 15 regions/);

  const tooLarge = editableConfig();
  tooLarge.map.regions = [
    ...tooLarge.map.regions,
    ...tooLarge.map.regions.slice(0, MAP_REGION_COUNT_MAX - tooLarge.map.regions.length + 1)
      .map((region, index) => ({ ...region, id: `extra-${index}` })),
  ];
  assert.throws(() => createGameConfig(tooLarge), /between 10 and 15 regions/);
});
