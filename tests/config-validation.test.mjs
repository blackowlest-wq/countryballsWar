import assert from "node:assert/strict";
import test from "node:test";

import { GAME_CONFIG, createGameConfig, createRuntimeScenario } from "../src/config/game-config.js";
import { MAP } from "../src/config/map.js";

function editableConfig() {
  return JSON.parse(JSON.stringify(GAME_CONFIG));
}

test("既定設定は全拠点を双方向道路で接続する", () => {
  const regionIds = GAME_CONFIG.map.regions.map((region) => region.id);
  const visited = new Set([regionIds[0]]);
  const queue = [regionIds[0]];

  while (queue.length > 0) {
    const current = queue.shift();
    GAME_CONFIG.map.roadNeighbors[current].forEach((neighbor) => {
      assert.ok(GAME_CONFIG.map.roadNeighbors[neighbor].includes(current));
      if (visited.has(neighbor)) return;
      visited.add(neighbor);
      queue.push(neighbor);
    });
  }

  assert.equal(visited.size, regionIds.length);
});

test("道路の正はmapの辺リストで、隣接表はそこから双方向生成される", () => {
  const expected = new Map(GAME_CONFIG.map.regions.map((region) => [region.id, []]));
  MAP.roads.forEach(([from, to]) => {
    expected.get(from).push(to);
    expected.get(to).push(from);
  });

  expected.forEach((neighbors, regionId) => {
    assert.deepEqual([...GAME_CONFIG.map.roadNeighbors[regionId]].sort(), neighbors.sort());
  });
  assert.equal(Object.hasOwn(MAP, "roadNeighbors"), false);
});

test("実行用シナリオは初期所有・生産力・拠点中心の部隊を組み立てる", () => {
  const runtime = createRuntimeScenario();

  assert.equal(runtime.regions.length, GAME_CONFIG.map.regions.length);
  assert.equal(runtime.units.length, GAME_CONFIG.scenario.initialUnits.length);
  runtime.regions.forEach((region) => {
    assert.equal(region.faction, GAME_CONFIG.scenario.territoryOwners[region.id]);
    assert.equal(region.production, GAME_CONFIG.balance.territoryProduction[region.id]);
  });
  runtime.units.forEach((unit) => {
    assert.deepEqual({ x: unit.x, y: unit.y }, unit.stationCenter);
    assert.equal(unit.maxStrength, GAME_CONFIG.balance.units.baseMaxStrengthByFaction[unit.faction]);
  });
});

test("未知の拠点を結ぶ道路は設定時に拒否する", () => {
  const config = editableConfig();
  config.map.roads.push(["north", "missing-region"]);

  assert.throws(() => createGameConfig(config), /missing-region/);
});

test("同じ道路の逆向き重複は設定時に拒否する", () => {
  const config = editableConfig();
  config.map.roads.push(["north", "northwest"]);

  assert.throws(() => createGameConfig(config), /重複/);
});

test("プレイヤー役と能動AI役は定義済みで異なる勢力を参照する", () => {
  assert.ok(GAME_CONFIG.factions[GAME_CONFIG.scenario.playerFactionId]);
  assert.ok(GAME_CONFIG.factions[GAME_CONFIG.scenario.activeAiFactionId]);
  assert.notEqual(GAME_CONFIG.scenario.playerFactionId, GAME_CONFIG.scenario.activeAiFactionId);
});

test("キャンペーン戦線の目標時間と敵プロファイルは定義済みである", () => {
  const { frontTypes, enemyProfiles } = GAME_CONFIG.balance.campaign;
  Object.values(frontTypes).forEach((frontType) => {
    assert.ok(frontType.targetDurationSeconds >= 300 && frontType.targetDurationSeconds <= 600);
    assert.ok(frontType.phaseCount >= 2 && frontType.phaseCount <= 6);
  });
  Object.values(enemyProfiles).forEach((profile) => {
    assert.ok(profile.strengthMultiplier > 0);
    assert.ok(profile.activeUnitLimit > 0);
    assert.ok(profile.reinforcementLimit >= 0);
    assert.ok(profile.actionDelaySeconds > 0);
  });
});

test("必殺技は固定3回と初期バランス値を持つ", () => {
  const { specialMove } = GAME_CONFIG.balance;
  assert.equal(specialMove.usesPerOperation, 3);
  assert.equal(specialMove.types.enemyWeakness.strengthReductionRate, 0.2);
  assert.equal(specialMove.types.allyBoost.strengthIncreaseRate, 0.2);
  assert.equal(specialMove.types.invincibility.durationSeconds, 3);
});

test("必殺技の使用回数や効果値が不正なら拒否する", () => {
  const invalidUses = editableConfig();
  invalidUses.balance.specialMove.usesPerOperation = 4;
  assert.throws(() => createGameConfig(invalidUses), /must be 3/);

  const invalidReduction = editableConfig();
  invalidReduction.balance.specialMove.types.enemyWeakness.strengthReductionRate = 1.1;
  assert.throws(() => createGameConfig(invalidReduction), /敵弱体化/);
});

test("戦線の目標時間が5分未満または10分超の場合は拒否する", () => {
  const config = editableConfig();
  config.balance.campaign.frontTypes.major.targetDurationSeconds = 601;

  assert.throws(() => createGameConfig(config), /targetDurationSeconds/);
});

test("初期所有が不足している拠点は設定時に拒否する", () => {
  const config = editableConfig();
  delete config.scenario.territoryOwners.central;

  assert.throws(() => createGameConfig(config), /central/);
});

test("重複した部隊IDは設定時に拒否する", () => {
  const config = editableConfig();
  config.scenario.initialUnits[1].id = config.scenario.initialUnits[0].id;

  assert.throws(() => createGameConfig(config), /重複/);
});

test("不足した勢力別攻撃補正は設定時に拒否する", () => {
  const config = editableConfig();
  delete config.balance.targeting.factionPenalty.blue;

  assert.throws(() => createGameConfig(config));
});

test("不足したpaletteキーは設定時に拒否する", () => {
  const config = editableConfig();
  delete config.factions.blue.palette.occupation;

  assert.throws(() => createGameConfig(config));
});

test("不正な拠点形状と初期部隊配列は設定時に拒否する", () => {
  const invalidPointConfig = editableConfig();
  invalidPointConfig.map.regions[0].points[0] = [0.1, 0.2, 0.3];
  assert.throws(() => createGameConfig(invalidPointConfig));

  const invalidUnitsConfig = editableConfig();
  invalidUnitsConfig.scenario.initialUnits = null;
  assert.throws(() => createGameConfig(invalidUnitsConfig));
});

test("minimumSurvivorStrengthは正の整数である必要がある", () => {
  const config = editableConfig();
  config.balance.units.minimumSurvivorStrength = 0;

  assert.throws(() => createGameConfig(config));
});

test("マップ装飾は省略または空で利用できる", () => {
  const withoutDecorations = editableConfig();
  delete withoutDecorations.map.decorations;
  assert.doesNotThrow(() => createGameConfig(withoutDecorations));

  const emptyDecorations = editableConfig();
  emptyDecorations.map.decorations = { labels: [], lines: [] };
  assert.doesNotThrow(() => createGameConfig(emptyDecorations));
});

test("空のマップ名と不正な装飾データは設定時に拒否する", () => {
  const invalidName = editableConfig();
  invalidName.map.name = " ";
  assert.throws(() => createGameConfig(invalidName), /map\.name/);

  const invalidLabel = editableConfig();
  invalidLabel.map.decorations.labels[0].text = "";
  assert.throws(() => createGameConfig(invalidLabel), /decorations\.labels/);

  const invalidLabelPosition = editableConfig();
  invalidLabelPosition.map.decorations.labels[0].position = [1.01, 0.18];
  assert.throws(() => createGameConfig(invalidLabelPosition), /decorations\.labels/);

  const invalidLineEndpoint = editableConfig();
  invalidLineEndpoint.map.decorations.lines[0].to = [0.62, Number.NaN];
  assert.throws(() => createGameConfig(invalidLineEndpoint), /decorations\.lines/);
});
