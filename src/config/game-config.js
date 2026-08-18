import { BALANCE } from "./balance.js";
import { CAMPAIGN } from "./campaign.js";
import { CHARACTERS, PLAYER_CHARACTER_ID } from "./characters.js";
import { COUNTRIES } from "./countries.js";
import { FACTIONS } from "./factions.js";
import { MAP } from "./map.js";
import { SCENARIO } from "./scenario.js";

function assertConfig(condition, message) {
  if (!condition) throw new Error(`Game config: ${message}`);
}

function cloneData(value) {
  if (Array.isArray(value)) return value.map(cloneData);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, cloneData(entry)]));
  }
  return value;
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

function isPositiveNumber(value) {
  return Number.isFinite(value) && value > 0;
}

function isNormalizedPoint(point) {
  return Array.isArray(point)
    && point.length === 2
    && point.every((coordinate) => Number.isFinite(coordinate) && coordinate >= 0 && coordinate <= 1);
}

function validateMapSource(source) {
  assertConfig(source && typeof source === "object" && !Array.isArray(source), "map.source must be an object");
  ["id", "name", "version", "scale", "license", "sourceUrl", "licenseUrl"].forEach((key) => {
    assertConfig(typeof source[key] === "string" && source[key].trim().length > 0, `map.source.${key} must be a non-empty string`);
  });
  assertConfig(/^https?:\/\//.test(source.sourceUrl), "map.source.sourceUrl must be an http(s) URL");
  assertConfig(/^https?:\/\//.test(source.licenseUrl), "map.source.licenseUrl must be an http(s) URL");
}

function validateRegionGeometry(region) {
  const validateRing = (ring, label) => {
    assertConfig(Array.isArray(ring) && ring.length >= 3, `${label} must contain at least three points`);
    ring.forEach((point, pointIndex) => {
      assertConfig(isNormalizedPoint(point), `${label} point #${pointIndex + 1} must contain two coordinates from 0 to 1`);
    });
  };

  assertConfig(Array.isArray(region.points) && region.points.length >= 3, `拠点 ${region.id} の形状は3点以上必要です`);
  validateRing(region.points, `Region ${region.id}.points`);
  if (region.polygons === undefined) return;

  assertConfig(Array.isArray(region.polygons) && region.polygons.length > 0, `Region ${region.id}.polygons must not be empty`);
  region.polygons.forEach((polygon, polygonIndex) => {
    assertConfig(Array.isArray(polygon) && polygon.length > 0, `Region ${region.id}.polygons #${polygonIndex + 1} must contain a ring`);
    polygon.forEach((ring, ringIndex) => validateRing(ring, `Region ${region.id}.polygons #${polygonIndex + 1} ring #${ringIndex + 1}`));
  });
}

function validateMapDecorations(decorations) {
  if (decorations === undefined) return;
  assertConfig(decorations && typeof decorations === "object" && !Array.isArray(decorations), "map.decorations must be an object");

  const labels = Object.hasOwn(decorations, "labels") ? decorations.labels : [];
  assertConfig(Array.isArray(labels), "map.decorations.labels must be an array");
  labels.forEach((label, index) => {
    assertConfig(label && typeof label === "object" && !Array.isArray(label), `map.decorations.labels #${index + 1} must be an object`);
    assertConfig(typeof label.text === "string" && label.text.trim().length > 0, `map.decorations.labels #${index + 1} text must be a non-empty string`);
    assertConfig(isNormalizedPoint(label.position), `map.decorations.labels #${index + 1} position must contain two coordinates from 0 to 1`);
  });

  const lines = Object.hasOwn(decorations, "lines") ? decorations.lines : [];
  assertConfig(Array.isArray(lines), "map.decorations.lines must be an array");
  lines.forEach((line, index) => {
    assertConfig(line && typeof line === "object" && !Array.isArray(line), `map.decorations.lines #${index + 1} must be an object`);
    assertConfig(isNormalizedPoint(line.from), `map.decorations.lines #${index + 1} from must contain two coordinates from 0 to 1`);
    assertConfig(isNormalizedPoint(line.to), `map.decorations.lines #${index + 1} to must contain two coordinates from 0 to 1`);
  });
}

function validateFaction(factionId, faction) {
  assertConfig(typeof faction?.isEnemy === "boolean", `Faction ${factionId} is missing isEnemy`);
  assertConfig(faction && faction.id === factionId, `勢力 ${factionId} のidが一致していません`);
  assertConfig(typeof faction.name === "string" && faction.name.length > 0, `勢力 ${factionId} に表示名がありません`);
  assertConfig(typeof faction.unitSprite === "string" && faction.unitSprite.length > 0, `勢力 ${factionId} に画像がありません`);
  assertConfig(typeof faction.unitStyle === "string" && faction.unitStyle.length > 0, `勢力 ${factionId} の部隊スタイルがありません`);
  assertConfig(typeof faction.panelClass === "string" && faction.panelClass.length > 0, `Faction ${factionId} is missing panelClass`);
  assertConfig(typeof faction.statusText === "string" && faction.statusText.length > 0, `Faction ${factionId} is missing statusText`);
  assertConfig(typeof faction.threatText === "string" && faction.threatText.length > 0, `Faction ${factionId} is missing threatText`);
  assertConfig(faction.palette && typeof faction.palette === "object", `勢力 ${factionId} に配色がありません`);
  ["territory", "territoryDark", "territoryBorder", "territoryLabel", "unit", "flag", "occupation"].forEach((key) => {
    assertConfig(typeof faction.palette[key] === "string" && faction.palette[key].length > 0, `Faction ${factionId} is missing palette.${key}`);
  });
}

function validateCountryMaster(countries, mapRegions) {
  assertConfig(countries && typeof countries === "object" && !Array.isArray(countries), "countries must be an object");
  const regionsById = new Map(mapRegions.map((region) => [region.id, region]));
  const fragmentOwners = new Map();

  Object.entries(countries).forEach(([countryId, country]) => {
    assertConfig(country && country.id === countryId, `Country ${countryId} has an invalid id`);
    assertConfig(typeof country.name === "string" && country.name.trim().length > 0, `Country ${countryId} is missing name`);
    assertConfig(typeof country.nameJa === "string" && country.nameJa.trim().length > 0, `Country ${countryId} is missing nameJa`);
    assertConfig(typeof country.shortName === "string" && country.shortName.trim().length > 0, `Country ${countryId} is missing shortName`);
    assertConfig(Array.isArray(country.fragmentIds) && country.fragmentIds.length > 0, `Country ${countryId} is missing fragmentIds`);
    assertConfig(typeof country.isMajor === "boolean", `Country ${countryId} is missing isMajor`);
    assertConfig(country.flag && typeof country.flag === "object", `Country ${countryId} is missing flag data`);
    assertConfig(Array.isArray(country.flag.colors) && country.flag.colors.length >= 2, `Country ${countryId} has invalid flag colors`);

    country.fragmentIds.forEach((fragmentId) => {
      const region = regionsById.get(fragmentId);
      if (!region) return;
      assertConfig(region.countryId === countryId, `Fragment ${fragmentId} belongs to another country`);
      assertConfig(!fragmentOwners.has(fragmentId), `Fragment ${fragmentId} is assigned to multiple countries`);
      fragmentOwners.set(fragmentId, countryId);
    });
  });

  mapRegions.forEach((region) => {
    assertConfig(typeof region.countryId === "string" && countries[region.countryId], `Region ${region.id} has an unknown countryId`);
    assertConfig(fragmentOwners.get(region.id) === region.countryId, `Region ${region.id} is missing from its country master`);
  });
}

function validateCharacterMaster(characters, countries, factionIds) {
  assertConfig(characters && typeof characters === "object" && !Array.isArray(characters), "characters must be an object");
  Object.entries(characters).forEach(([characterId, character]) => {
    assertConfig(character && character.id === characterId, `Character ${characterId} has an invalid id`);
    if (character.isPlayerCharacter) {
      assertConfig(characterId === PLAYER_CHARACTER_ID && character.countryId === null, `Character ${characterId} has an invalid player binding`);
    } else {
      assertConfig(typeof character.countryId === "string" && countries[character.countryId], `Character ${characterId} has an unknown countryId`);
    }
    assertConfig(character.sprite === null || (typeof character.sprite === "string" && character.sprite.length > 0), `Character ${characterId} has invalid sprite`);
    assertConfig(factionIds.includes(character.fallbackFactionId), `Character ${characterId} has an unknown fallback faction`);
    assertConfig(character.eyeStyle === "sharp" || character.eyeStyle === "round", `Character ${characterId} has invalid eyeStyle`);
    assertConfig(character.flag && typeof character.flag === "object", `Character ${characterId} is missing flag data`);
  });
  Object.keys(countries).forEach((countryId) => {
    assertConfig(characters[countryId]?.countryId === countryId, `Country ${countryId} is missing its character binding`);
  });
}

function validateRoadDefinitions(map, regionIds) {
  const definitions = map.roadDefinitions || map.roads.map(([from, to]) => ({ from, to, kind: "land" }));
  assertConfig(Array.isArray(definitions) && definitions.length === map.roads.length, "roadDefinitions must match roads");
  definitions.forEach((road, index) => {
    assertConfig(road && typeof road === "object" && !Array.isArray(road), `roadDefinitions #${index + 1} must be an object`);
    assertConfig(regionIds.includes(road.from) && regionIds.includes(road.to), `roadDefinitions #${index + 1} references an unknown region`);
    assertConfig(road.passable !== false, `roadDefinitions #${index + 1} is not passable`);
    assertConfig(road.kind === "land" || road.kind === "sea", `roadDefinitions #${index + 1} has an invalid kind`);
  });
}

function validateInteractionPoints(map) {
  const minDistance = map.interactionMinDistance;
  const hitRadius = map.interactionHitRadius;
  assertConfig(isPositiveNumber(minDistance), "map.interactionMinDistance must be positive");
  assertConfig(isPositiveNumber(hitRadius) && hitRadius * 2 <= minDistance, "map.interactionHitRadius must not overlap adjacent interaction points");
  map.regions.forEach((region) => {
    assertConfig(Array.isArray(region.interactionPoint) && isNormalizedPoint(region.interactionPoint), `Region ${region.id} has an invalid interactionPoint`);
    assertConfig(region.interactionRadius === undefined || isPositiveNumber(region.interactionRadius), `Region ${region.id} has an invalid interactionRadius`);
  });
  for (let leftIndex = 0; leftIndex < map.regions.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < map.regions.length; rightIndex += 1) {
      const leftRegion = map.regions[leftIndex];
      const rightRegion = map.regions[rightIndex];
      const left = leftRegion.interactionPoint;
      const right = rightRegion.interactionPoint;
      const distance = Math.hypot(left[0] - right[0], left[1] - right[1]);
      assertConfig(distance >= minDistance, `interaction points for ${leftRegion.id} and ${rightRegion.id} are too close`);
      const leftRadius = leftRegion.interactionRadius || hitRadius;
      const rightRadius = rightRegion.interactionRadius || hitRadius;
      assertConfig(leftRadius + rightRadius <= distance, `interaction targets for ${leftRegion.id} and ${rightRegion.id} overlap`);
    }
  }
}

function validateCampaignData(campaign, map, countries, characters, factionIds, balance, playerFactionId) {
  assertConfig(campaign && typeof campaign === "object" && !Array.isArray(campaign), "campaign must be an object");
  assertConfig(typeof campaign.id === "string" && campaign.id.length > 0, "campaign.id is missing");
  assertConfig(Array.isArray(campaign.frontOrder) && campaign.frontOrder.length > 0, "campaign.frontOrder must not be empty");
  const regionIds = map.regions.map((region) => region.id);

  campaign.frontOrder.forEach((frontId) => {
    const front = campaign.fronts?.[frontId];
    assertConfig(front && front.id === frontId, `campaign front ${frontId} is missing`);
    assertConfig(front.mapId === map.id, `campaign front ${frontId} references another map`);
    assertConfig(balance.campaign.enemyProfiles[front.enemyProfileId], `campaign front ${frontId} references an unknown enemy profile`);
    assertConfig(Array.isArray(front.phaseIds) && front.phaseIds.length > 0, `campaign front ${frontId} has no phases`);
    assertConfig(Array.isArray(front.targetCountryIds) && front.targetCountryIds.length > 0, `campaign front ${frontId} has no target countries`);
    assertConfig(new Set(front.targetCountryIds).size === front.targetCountryIds.length, `campaign front ${frontId} has duplicate target countries`);
    front.targetCountryIds.forEach((countryId) => {
      const country = countries[countryId];
      assertConfig(country, `campaign front ${frontId} references unknown country ${countryId}`);
      country.fragmentIds.forEach((fragmentId) => assertConfig(regionIds.includes(fragmentId), `campaign front ${frontId} does not include fragment ${fragmentId}`));
    });

    front.phaseIds.forEach((phaseId, phaseIndex) => {
      const phase = campaign.phases?.[phaseId];
      assertConfig(phase && phase.id === phaseId, `campaign phase ${phaseId} is missing`);
      assertConfig(phase.frontId === frontId && phase.mapId === map.id, `campaign phase ${phaseId} has an invalid owner`);
      assertConfig(phase.index === phaseIndex, `campaign phase ${phaseId} index is invalid`);
      assertConfig(Array.isArray(phase.objectiveRegionIds) && phase.objectiveRegionIds.length > 0, `campaign phase ${phaseId} has no objective`);
      phase.objectiveRegionIds.forEach((regionId) => assertConfig(regionIds.includes(regionId), `campaign phase ${phaseId} references unknown objective ${regionId}`));

      ["territoryOwners", "productionByRegion"].forEach((key) => {
        assertConfig(phase[key] && typeof phase[key] === "object", `campaign phase ${phaseId} is missing ${key}`);
        assertConfig(Object.keys(phase[key]).length === regionIds.length, `campaign phase ${phaseId}.${key} does not cover every region`);
      });
      regionIds.forEach((regionId) => {
        assertConfig(factionIds.includes(phase.territoryOwners[regionId]), `campaign phase ${phaseId} has an invalid owner for ${regionId}`);
        assertConfig(isPositiveNumber(phase.productionByRegion[regionId]), `campaign phase ${phaseId} has invalid production for ${regionId}`);
      });

      assertConfig(Array.isArray(phase.initialUnits) && phase.initialUnits.length > 0, `campaign phase ${phaseId} has no initial units`);
      const unitIds = new Set();
      phase.initialUnits.forEach((unit) => {
        assertConfig(typeof unit.id === "string" && unit.id.length > 0, `campaign phase ${phaseId} has an invalid unit id`);
        assertConfig(!unitIds.has(unit.id), `campaign phase ${phaseId} has duplicate unit ${unit.id}`);
        unitIds.add(unit.id);
        assertConfig(factionIds.includes(unit.faction), `campaign phase ${phaseId} unit ${unit.id} has an invalid faction`);
        assertConfig(regionIds.includes(unit.regionId), `campaign phase ${phaseId} unit ${unit.id} has an invalid region`);
        const region = map.regions.find((candidate) => candidate.id === unit.regionId);
        const isPlayerCharacter = unit.faction === playerFactionId && characters[unit.characterId]?.isPlayerCharacter === true;
        assertConfig(isPlayerCharacter || characters[unit.characterId]?.countryId === region.countryId, `campaign phase ${phaseId} unit ${unit.id} has an invalid character binding`);
      });
      assertConfig(phase.initialUnits.some((unit) => unit.faction === "blue"), `campaign phase ${phaseId} has no player unit`);
    });
  });
}

function buildRoadNeighbors(regionIds, roads) {
  const neighbors = Object.fromEntries(regionIds.map((regionId) => [regionId, []]));
  const roadKeys = new Set();

  assertConfig(Array.isArray(roads), "道路は配列で指定してください");
  roads.forEach((road, index) => {
    assertConfig(Array.isArray(road) && road.length === 2, `道路 #${index + 1} は2拠点で指定してください`);
    const [from, to] = road;
    assertConfig(regionIds.includes(from), `道路 #${index + 1} の始点 ${from} が存在しません`);
    assertConfig(regionIds.includes(to), `道路 #${index + 1} の終点 ${to} が存在しません`);
    assertConfig(from !== to, `道路 #${index + 1} が同じ拠点 ${from} を結んでいます`);
    const roadKey = [from, to].sort().join("::");
    assertConfig(!roadKeys.has(roadKey), `道路 ${roadKey} が重複しています`);
    roadKeys.add(roadKey);
    neighbors[from].push(to);
    neighbors[to].push(from);
  });

  if (regionIds.length > 0) {
    const visited = new Set([regionIds[0]]);
    const queue = [regionIds[0]];
    while (queue.length > 0) {
      const current = queue.shift();
      neighbors[current].forEach((neighbor) => {
        if (visited.has(neighbor)) return;
        visited.add(neighbor);
        queue.push(neighbor);
      });
    }
    assertConfig(visited.size === regionIds.length, "道路網に到達不能な拠点があります");
  }

  Object.values(neighbors).forEach((entries) => entries.sort());
  return neighbors;
}

function validateCampaignBalance(campaign) {
  const frontTypes = campaign?.frontTypes;
  const frontTypeKeys = ["regionalSmall", "regionalLarge", "major", "worldCoalition", "finalForce"];
  assertConfig(frontTypes && typeof frontTypes === "object" && !Array.isArray(frontTypes), "campaign.frontTypes must be an object");
  frontTypeKeys.forEach((key) => {
    const frontType = frontTypes[key];
    assertConfig(frontType && typeof frontType === "object" && !Array.isArray(frontType), `campaign.frontTypes.${key} is missing`);
    assertConfig(Number.isInteger(frontType.targetDurationSeconds) && frontType.targetDurationSeconds >= 300 && frontType.targetDurationSeconds <= 600, `campaign.frontTypes.${key}.targetDurationSeconds must be between 300 and 600 seconds`);
    const minimumPhaseCount = key === "regionalSmall" ? 1 : 2;
    assertConfig(Number.isInteger(frontType.phaseCount) && frontType.phaseCount >= minimumPhaseCount && frontType.phaseCount <= 6, `campaign.frontTypes.${key}.phaseCount must be between ${minimumPhaseCount} and 6`);
  });

  const enemyProfiles = campaign?.enemyProfiles;
  const enemyProfileKeys = ["regionalIntro", "regionalEarly", "regionalLate", "majorEarly", "majorMiddle", "majorLate", "worldCoalition", "finalForce"];
  assertConfig(enemyProfiles && typeof enemyProfiles === "object" && !Array.isArray(enemyProfiles), "campaign.enemyProfiles must be an object");
  enemyProfileKeys.forEach((key) => {
    const profile = enemyProfiles[key];
    assertConfig(profile && typeof profile === "object" && !Array.isArray(profile), `campaign.enemyProfiles.${key} is missing`);
    assertConfig(Number.isFinite(profile.strengthMultiplier) && profile.strengthMultiplier > 0, `campaign.enemyProfiles.${key}.strengthMultiplier must be positive`);
    assertConfig(Number.isInteger(profile.activeUnitLimit) && profile.activeUnitLimit > 0, `campaign.enemyProfiles.${key}.activeUnitLimit must be a positive integer`);
    assertConfig(Number.isInteger(profile.reinforcementLimit) && profile.reinforcementLimit >= 0, `campaign.enemyProfiles.${key}.reinforcementLimit must be a non-negative integer`);
    assertConfig(isPositiveNumber(profile.actionDelaySeconds), `campaign.enemyProfiles.${key}.actionDelaySeconds must be positive`);
  });
}

function validateSpecialMoveBalance(specialMove) {
  const typeKeys = ["enemyWeakness", "allyBoost", "invincibility"];
  assertConfig(specialMove?.usesPerOperation === 3, "specialMove.usesPerOperation must be 3");
  assertConfig(Number.isInteger(specialMove?.maxNameLength) && specialMove.maxNameLength >= 1 && specialMove.maxNameLength <= 80, "specialMove.maxNameLength must be between 1 and 80");
  assertConfig(specialMove?.types && typeof specialMove.types === "object" && !Array.isArray(specialMove.types), "specialMove.types must be an object");

  typeKeys.forEach((typeKey) => {
    const type = specialMove.types[typeKey];
    assertConfig(type && typeof type === "object" && !Array.isArray(type), `specialMove.types.${typeKey} is missing`);
    assertConfig(typeof type.defaultName === "string" && type.defaultName.trim().length > 0, `specialMove.types.${typeKey}.defaultName must be a non-empty string`);
  });
  assertConfig(Number.isFinite(specialMove.types.enemyWeakness.strengthReductionRate) && specialMove.types.enemyWeakness.strengthReductionRate > 0 && specialMove.types.enemyWeakness.strengthReductionRate <= 1, "敵弱体化の割合が不正です");
  assertConfig(Number.isFinite(specialMove.types.allyBoost.strengthIncreaseRate) && specialMove.types.allyBoost.strengthIncreaseRate > 0, "味方強化の割合が不正です");
  assertConfig(isPositiveNumber(specialMove.types.invincibility.durationSeconds), "無敵時間が正の数ではありません");
}

function validateBalance(balance, factionIds, regionIds) {
  regionIds.forEach((regionId) => {
    assertConfig(isPositiveNumber(balance.territoryProduction?.[regionId]), `拠点 ${regionId} の生産力が正の数ではありません`);
  });
  assertConfig(Object.keys(balance.territoryProduction || {}).length === regionIds.length, "生産力に未知または不足している拠点があります");

  assertConfig(Number.isInteger(balance.units?.minimumSurvivorStrength) && balance.units.minimumSurvivorStrength > 0, "minimumSurvivorStrength must be a positive integer");
  factionIds.forEach((factionId) => {
    assertConfig(isPositiveNumber(balance.units?.baseMaxStrengthByFaction?.[factionId]) && balance.units.baseMaxStrengthByFaction[factionId] >= balance.units.minimumSurvivorStrength, `勢力 ${factionId} の基本最大戦力がありません`);
    assertConfig(isPositiveNumber(balance.movement?.speedByFaction?.[factionId]), `勢力 ${factionId} の移動速度がありません`);
    assertConfig(Number.isFinite(balance.targeting?.factionPenalty?.[factionId]), `Faction ${factionId} is missing targeting.factionPenalty`);
  });

  [
    [balance.clock?.dayDurationSeconds, "1日の長さ"],
    [balance.clock?.recoveryTickSeconds, "回復間隔"],
    [balance.clock?.maxFrameDeltaSeconds, "最大フレーム時間"],
    [balance.movement?.routeSnapDistance, "道路復帰距離"],
    [balance.movement?.unitSelectionRadius, "部隊選択半径"],
    [balance.movement?.dispatchDragDistance, "ドラッグ判定距離"],
    [balance.occupation?.durationSeconds, "占領時間"],
    [balance.combat?.contactDistance, "接敵距離"],
    [balance.combat?.tickIntervalSeconds, "戦闘間隔"],
    [balance.combat?.initialTickDelaySeconds, "初回戦闘待機"],
    [balance.combat?.strengthDamageFactor, "戦力ダメージ係数"],
    [balance.combat?.productionDamageFactor, "生産力ダメージ係数"],
    [balance.combat?.minimumDamage, "最低ダメージ"],
    [balance.ai?.initialDelaySeconds, "AI初期待機"],
    [balance.ai?.actionDelaySeconds, "AI行動間隔"],
    [balance.ai?.invasionWarningSeconds, "侵攻予告時間"],
    [balance.ai?.activeUnitLimit, "AI同時部隊上限"],
    [balance.ai?.reinforcementLimit, "AI増援上限"],
    [balance.economy?.upgradePriceGrowth, "価格上昇率"],
    [balance.economy?.upgradePriceStep, "価格丸め単位"],
    [balance.economy?.upgradePriceCap, "価格上限"],
  ].forEach(([value, label]) => assertConfig(isPositiveNumber(value), `${label}が正の数ではありません`));

  assertConfig(Number.isFinite(balance.ai?.actionDelayJitterSeconds) && balance.ai.actionDelayJitterSeconds >= 0, "AI行動間隔の揺らぎが不正です");
  assertConfig(isPositiveNumber(balance.economy?.rewards?.captureGold), "占領報酬Goldが正の数ではありません");
  assertConfig(Number.isFinite(balance.economy?.rewards?.battleWinGold) && balance.economy.rewards.battleWinGold >= 0, "戦闘勝利報酬Goldが不正です");
  assertConfig(Number.isFinite(balance.economy?.rewards?.defeatConversionRate) && balance.economy.rewards.defeatConversionRate > 0 && balance.economy.rewards.defeatConversionRate <= 1, "敗北報酬の換算率が不正です");
  assertConfig(Number.isFinite(balance.economy?.rewards?.defeatRewardCap) && balance.economy.rewards.defeatRewardCap >= 0, "敗北報酬の上限が不正です");
  assertConfig(Number.isFinite(balance.economy?.rewards?.minimumDefeatGold) && balance.economy.rewards.minimumDefeatGold >= 0, "敗北報酬の最低Goldが不正です");
  assertConfig(Number.isFinite(balance.economy?.rewards?.minimumDefeatElapsedSeconds) && balance.economy.rewards.minimumDefeatElapsedSeconds >= 0, "敗北報酬の最低経過時間が不正です");
  assertConfig(Number.isInteger(balance.economy?.rewards?.minimumDefeatCaptures) && balance.economy.rewards.minimumDefeatCaptures >= 0, "敗北報酬の最低占領数が不正です");
  assertConfig(isPositiveNumber(balance.economy?.rewards?.clearBonus), "クリアボーナスGoldが正の数ではありません");
  assertConfig(isPositiveNumber(balance.economy?.rewards?.campaignClearBonus), "キャンペーンクリアボーナスGoldが正の数ではありません");
  assertConfig(Object.keys(balance.economy?.shopItems || {}).length > 0, "ショップ商品がありません");
  Object.entries(balance.economy.shopItems).forEach(([key, item]) => {
    assertConfig(isPositiveNumber(item.basePrice), `ショップ商品 ${key} の価格がありません`);
    assertConfig(typeof item.label === "string" && item.label.length > 0, `ショップ商品 ${key} の表示名がありません`);
    if (Object.hasOwn(item, "productionPerLevel")) assertConfig(Number.isFinite(item.productionPerLevel) && item.productionPerLevel >= 0, `Shop item ${key} has invalid productionPerLevel`);
    if (Object.hasOwn(item, "maxStrengthPerLevel")) assertConfig(Number.isFinite(item.maxStrengthPerLevel) && item.maxStrengthPerLevel > 0, `Shop item ${key} has invalid maxStrengthPerLevel`);
    if (Object.hasOwn(item, "unitsPerLevel")) assertConfig(Number.isInteger(item.unitsPerLevel) && item.unitsPerLevel > 0, `Shop item ${key} has invalid unitsPerLevel`);
    if (Object.hasOwn(item, "speedPerLevel")) assertConfig(Number.isFinite(item.speedPerLevel) && item.speedPerLevel > 0, `Shop item ${key} has invalid speedPerLevel`);
  });
  [
    ["logistics", "productionPerLevel", (value) => Number.isFinite(value) && value >= 0],
    ["armor", "maxStrengthPerLevel", (value) => Number.isFinite(value) && value > 0],
    ["reserve", "unitsPerLevel", (value) => Number.isInteger(value) && value > 0],
    ["speed", "speedPerLevel", (value) => Number.isFinite(value) && value > 0],
  ].forEach(([itemKey, effectKey, isValid]) => {
    const item = balance.economy.shopItems[itemKey];
    assertConfig(item && Object.hasOwn(item, effectKey) && isValid(item[effectKey]), `Shop item ${itemKey} is missing ${effectKey}`);
  });
  validateSpecialMoveBalance(balance.specialMove);
  validateCampaignBalance(balance.campaign);
}

export function createGameConfig(source) {
  const config = cloneData(source);
  const factionIds = Object.keys(config.factions || {});
  assertConfig(factionIds.length >= 2, "勢力を2つ以上定義してください");
  factionIds.forEach((factionId) => validateFaction(factionId, config.factions[factionId]));
  validateCharacterMaster(config.characters, config.countries, factionIds);

  assertConfig(config.map?.id === config.scenario?.mapId, "シナリオが別のマップを参照しています");
  assertConfig(typeof config.map?.name === "string" && config.map.name.trim().length > 0, "map.name must be a non-empty string");
  validateMapSource(config.map.source);
  validateMapDecorations(config.map.decorations);
  assertConfig(Array.isArray(config.map?.regions) && config.map.regions.length > 0, "拠点がありません");
  const regionIds = config.map.regions.map((region) => region.id);
  validateCountryMaster(config.countries, config.map.regions);
  config.map.regions.forEach((region) => {
    assertConfig(typeof region.id === "string" && region.id.length > 0, "Region ids must be non-empty strings");
  });
  assertConfig(new Set(regionIds).size === regionIds.length, "拠点IDが重複しています");
  config.map.regions.forEach((region) => {
    assertConfig(typeof region.name === "string" && region.name.length > 0, `拠点 ${region.id} に表示名がありません`);
    assertConfig(typeof region.shortName === "string" && region.shortName.length > 0, `拠点 ${region.id} に短縮名がありません`);
    validateRegionGeometry(region);
  });

  assertConfig(Array.isArray(config.map?.roads), "マップに道路の配列がありません");
  config.map.roadNeighbors = buildRoadNeighbors(regionIds, config.map.roads);
  validateRoadDefinitions(config.map, regionIds);
  validateInteractionPoints(config.map);
  assertConfig(factionIds.includes(config.scenario.playerFactionId), "プレイヤー勢力が存在しません");
  assertConfig(factionIds.includes(config.scenario.activeAiFactionId), "AI勢力が存在しません");
  assertConfig(config.scenario.playerFactionId !== config.scenario.activeAiFactionId, "プレイヤー勢力とAI勢力は分けてください");

  regionIds.forEach((regionId) => {
    const owner = config.scenario.territoryOwners?.[regionId];
    assertConfig(factionIds.includes(owner), `拠点 ${regionId} の初期所有勢力が不正です`);
  });
  assertConfig(Object.keys(config.scenario.territoryOwners || {}).length === regionIds.length, "初期所有に未知または不足している拠点があります");

  assertConfig(Array.isArray(config.scenario.initialUnits), "initialUnits must be an array");
  const unitIds = new Set();
  config.scenario.initialUnits.forEach((unit) => {
    assertConfig(typeof unit.id === "string" && unit.id.length > 0, "初期部隊にIDがありません");
    assertConfig(!unitIds.has(unit.id), `初期部隊ID ${unit.id} が重複しています`);
    unitIds.add(unit.id);
    assertConfig(factionIds.includes(unit.faction), `初期部隊 ${unit.id} の勢力が不正です`);
    assertConfig(regionIds.includes(unit.regionId), `初期部隊 ${unit.id} の配置拠点が存在しません`);
  });
  assertConfig([...unitIds].length > 0, "初期部隊がありません");
  assertConfig(config.scenario.initialUnits.some((unit) => unit.faction === config.scenario.playerFactionId), "プレイヤー初期部隊がありません");

  validateBalance(config.balance, factionIds, regionIds);
  validateCampaignData(config.campaign, config.map, config.countries, config.characters, factionIds, config.balance, config.scenario.playerFactionId);
  return deepFreeze(config);
}

export const GAME_CONFIG = createGameConfig({
  factions: FACTIONS,
  map: MAP,
  scenario: SCENARIO,
  balance: BALANCE,
  countries: COUNTRIES,
  characters: CHARACTERS,
  campaign: CAMPAIGN,
});

function regionCenter(region) {
  if (Array.isArray(region.interactionPoint)) {
    return { x: region.interactionPoint[0], y: region.interactionPoint[1] };
  }
  const total = region.points.reduce((sum, [x, y]) => ({ x: sum.x + x, y: sum.y + y }), { x: 0, y: 0 });
  return { x: total.x / region.points.length, y: total.y / region.points.length };
}

export function createRuntimeScenario(config = GAME_CONFIG, phaseId = config.scenario.phaseId) {
  const phase = config.campaign?.phases?.[phaseId];
  const front = config.campaign?.fronts?.[phase?.frontId || config.scenario.frontId];
  const territoryOwners = phase?.territoryOwners || config.scenario.territoryOwners;
  const productionByRegion = phase?.productionByRegion || config.balance.territoryProduction;
  const enemyProfile = front ? config.balance.campaign.enemyProfiles[front.enemyProfileId] : null;
  const regions = config.map.regions.map((region) => ({
    ...cloneData(region),
    faction: territoryOwners[region.id],
    production: productionByRegion[region.id],
    occupation: null,
  }));
  const regionById = Object.fromEntries(regions.map((region) => [region.id, region]));
  const deployments = phase?.initialUnits || config.scenario.initialUnits;
  const units = deployments.map((deployment) => {
    const center = regionCenter(regionById[deployment.regionId]);
    const baseStrength = config.balance.units.baseMaxStrengthByFaction[deployment.faction];
    const maxStrength = config.factions[deployment.faction].isEnemy && enemyProfile
      ? Math.max(config.balance.units.minimumSurvivorStrength, Math.round(baseStrength * enemyProfile.strengthMultiplier))
      : baseStrength;
    return {
      ...cloneData(deployment),
      characterId: deployment.characterId || regionById[deployment.regionId].countryId,
      eyeStyle: config.characters[deployment.characterId || regionById[deployment.regionId].countryId].eyeStyle,
      x: center.x,
      y: center.y,
      strength: maxStrength,
      maxStrength,
      style: config.factions[deployment.faction].unitStyle,
      target: null,
      route: null,
      routeIndex: 0,
      targetRegionId: null,
      arrived: true,
      stationCenter: { ...center },
      arrivalResolved: false,
      inBattle: false,
    };
  });

  return {
    frontId: phase?.frontId || config.scenario.frontId || null,
    phaseId: phase?.id || config.scenario.phaseId || null,
    enemyProfileId: front?.enemyProfileId || null,
    regions,
    units,
  };
}
