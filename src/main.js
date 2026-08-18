import { GAME_CONFIG, createRuntimeScenario } from "./config/game-config.js";
import { getFirstPhaseId } from "./config/campaign.js";
import {
  getCompletedCountryIds,
  getNextPhaseId,
  isPhaseObjectiveComplete,
  resolveEnemyStrength,
  transitionPhase,
} from "./campaign/phase-runtime.js";
import {
  loadPersistentState,
  loadEquippedCharacter,
  loadSpecialMove,
  resetPersistentState,
  saveEquippedCharacter,
  savePersistentState,
  saveSpecialMove,
} from "./storage/persistent-state.js";
import {
  calculateClearGold,
  calculateDefeatGold,
  createRunProgress,
} from "./economy/rewards.js";
import {
  applySpecialMoveEffect,
  createSpecialMoveSettings,
  getSpecialMoveConfig,
} from "./special-move.js";
import { getAiAttackCandidates as collectAiAttackCandidates, chooseAiAttackCandidate } from "./campaign/ai.js";
import { calculateGroupCombatDamage } from "./campaign/combat.js";
import { collectCountryFlags } from "./campaign/flag-collection.js";
import { getFrontSelectionEntries } from "./campaign/front-selection.js";
import { getCountryWorldMapData, projectWorldMapPoint } from "./campaign/country-location.js";
import { getCountryFlagOrigin } from "./config/countries.js";
import { PLAYER_CHARACTER_ID } from "./config/characters.js";
import { findRegionAtWorldPoint } from "./render/region-targeting.js";
import {
  createCharacterSpriteImage,
  getCharacterSpriteSource,
  getCharacterSpriteSources,
} from "./render/character-sprite.js";

const canvas = document.querySelector("#mapCanvas");
const ctx = canvas.getContext("2d");
const stage = document.querySelector("#gameStage");

const ui = {
  mapName: document.querySelector("#mapName"),
  gold: document.querySelector("#goldValue"),
  day: document.querySelector("#dayValue"),
  time: document.querySelector("#timeValue"),
  pause: document.querySelector("#pauseButton"),
  toast: document.querySelector("#toast"),
  eventFeed: document.querySelector("#eventFeed"),
  panel: document.querySelector("#territoryPanel"),
  territoryClose: document.querySelector("#territoryCloseButton"),
  dispatchHint: document.querySelector("#dispatchHint"),
  factionDot: document.querySelector("#selectedFactionDot"),
  regionName: document.querySelector("#selectedRegionName"),
  regionStatus: document.querySelector("#selectedRegionStatus"),
  production: document.querySelector("#selectedProduction"),
  threat: document.querySelector("#selectedThreat"),
  defeatDialog: document.querySelector("#defeatDialog"),
  defeatReward: document.querySelector("#defeatReward"),
  clearDialog: document.querySelector("#clearDialog"),
  clearReward: document.querySelector("#clearReward"),
  clearPlayerFactionName: document.querySelector("#clearPlayerFactionName"),
  shopDialog: document.querySelector("#shopDialog"),
  shopGold: document.querySelector("#shopGoldValue"),
  shopButtons: document.querySelectorAll("[data-shop-upgrade]"),
  occupation: document.querySelector("#selectedOccupation"),
  invasionAlert: document.querySelector("#invasionAlert"),
  invasionTarget: document.querySelector("#invasionTarget"),
  invasionCountdown: document.querySelector("#invasionCountdown"),
  specialMovePanel: document.querySelector("#specialMovePanel"),
  specialMoveName: document.querySelector("#specialMoveName"),
  specialMoveUses: document.querySelector("#specialMoveUses"),
  specialMoveButton: document.querySelector("#specialMoveButton"),
  specialMoveCutIn: document.querySelector("#specialMoveCutIn"),
  specialMoveCutInCharacter: document.querySelector("#specialMoveCutInCharacter"),
  specialMoveCutInName: document.querySelector("#specialMoveCutInName"),
  titleDialog: document.querySelector("#titleDialog"),
  titleStart: document.querySelector("#titleStartButton"),
  titleReset: document.querySelector("#titleResetButton"),
  titleMessage: document.querySelector("#titleMessage"),
  difficultySelectionDialog: document.querySelector("#difficultySelectionDialog"),
  difficultySelectionBack: document.querySelector("#difficultySelectionBackButton"),
  difficultySelectionGrid: document.querySelector("#difficultySelectionGrid"),
  mapSelectionDialog: document.querySelector("#mapSelectionDialog"),
  mapSelectionBack: document.querySelector("#mapSelectionBackButton"),
  mapSelectionGrid: document.querySelector("#mapSelectionGrid"),
  mapSelectionSummary: document.querySelector("#mapSelectionSummary"),
  mapSelectionDifficulty: document.querySelector("#mapSelectionDifficulty"),
  flagCollectionButton: document.querySelector("#flagCollectionButton"),
  flagCollectionDialog: document.querySelector("#flagCollectionDialog"),
  flagCollectionGrid: document.querySelector("#flagCollectionGrid"),
  flagCollectionCount: document.querySelector("#flagCollectionCount"),
  flagCollectionSummary: document.querySelector("#flagCollectionSummary"),
  countryDetailDialog: document.querySelector("#countryDetailDialog"),
  countryDetailBack: document.querySelector("#countryDetailBackButton"),
  countryDetailName: document.querySelector("#countryDetailName"),
  countryDetailEnglishName: document.querySelector("#countryDetailEnglishName"),
  countryDetailFlag: document.querySelector("#countryDetailFlag"),
  countryDetailStatus: document.querySelector("#countryDetailStatus"),
  countryDetailOverview: document.querySelector("#countryDetailOverview"),
  countryDetailMap: document.querySelector("#countryDetailMap"),
  countryDetailLocation: document.querySelector("#countryDetailLocation"),
  countryDetailCharacter: document.querySelector("#countryDetailCharacter"),
  countryDetailCharacterEquip: document.querySelector("#countryDetailCharacterEquip"),
  countryDetailCharacterReset: document.querySelector("#countryDetailCharacterReset"),
  countryDetailFlagOrigin: document.querySelector("#countryDetailFlagOrigin"),
  countryDetailTrivia: document.querySelector("#countryDetailTrivia"),
  countryDetailSources: document.querySelector("#countryDetailSources"),
  dataResetDialog: document.querySelector("#dataResetDialog"),
  cancelDataReset: document.querySelector("#cancelDataResetButton"),
  confirmDataReset: document.querySelector("#confirmDataResetButton"),
  specialMoveDialog: document.querySelector("#specialMoveDialog"),
  specialMoveForm: document.querySelector("#specialMoveForm"),
  specialMoveNameInput: document.querySelector("#specialMoveNameInput"),
  specialMoveError: document.querySelector("#specialMoveError"),
};

ui.specialMoveCutInCharacter.addEventListener("load", () => {
  ui.specialMoveCutInCharacter.hidden = false;
});

const BALANCE = GAME_CONFIG.balance;
const PLAYER_FACTION_ID = GAME_CONFIG.scenario.playerFactionId;
const ACTIVE_AI_FACTION_ID = GAME_CONFIG.scenario.activeAiFactionId;
const AI_FACTION_IDS = [
  ACTIVE_AI_FACTION_ID,
  ...Object.keys(GAME_CONFIG.factions).filter((factionId) => factionId !== PLAYER_FACTION_ID && factionId !== ACTIVE_AI_FACTION_ID),
];
const CLOCK_BALANCE = BALANCE.clock;
const MOVEMENT_BALANCE = BALANCE.movement;
const UNIT_BALANCE = BALANCE.units;
const OCCUPATION_DURATION = BALANCE.occupation.durationSeconds;
const COMBAT_BALANCE = BALANCE.combat;
const TARGETING_BALANCE = BALANCE.targeting;
const ECONOMY_BALANCE = BALANCE.economy;
const SPECIAL_MOVE_BALANCE = BALANCE.specialMove;
const DIFFICULTY_PROFILES = BALANCE.difficulty.profiles;
const DIFFICULTY_IDS = Object.keys(DIFFICULTY_PROFILES);
const BATTLE_DISTANCE = COMBAT_BALANCE.contactDistance;
const BATTLE_TICK_INTERVAL = COMBAT_BALANCE.tickIntervalSeconds;
let selectedFrontId = GAME_CONFIG.scenario.frontId;

function resolveDifficultyId(value) {
  return DIFFICULTY_IDS.includes(value) ? value : GAME_CONFIG.campaign.defaultDifficultyId;
}

function getDifficultyProfile(difficultyId = GAME_CONFIG.campaign.defaultDifficultyId) {
  return DIFFICULTY_PROFILES[resolveDifficultyId(difficultyId)] || DIFFICULTY_PROFILES[GAME_CONFIG.campaign.defaultDifficultyId];
}

function getSelectedFront() {
  return GAME_CONFIG.campaign.fronts[selectedFrontId]
    || GAME_CONFIG.campaign.fronts[GAME_CONFIG.scenario.frontId]
    || null;
}

function getActiveEnemyProfile() {
  const front = getSelectedFront();
  return BALANCE.campaign.enemyProfiles[front?.enemyProfileId] || BALANCE.campaign.enemyProfiles.regionalIntro;
}

function getActiveAiBalance() {
  const enemyProfile = getActiveEnemyProfile();
  return {
    ...BALANCE.ai,
    activeUnitLimit: enemyProfile.activeUnitLimit,
    reinforcementLimit: enemyProfile.reinforcementLimit,
    actionDelaySeconds: enemyProfile.actionDelaySeconds,
  };
}

function createAiFactionState(value) {
  return Object.fromEntries(AI_FACTION_IDS.map((factionId) => [factionId, value]));
}

const COLORS = Object.fromEntries(
  Object.entries(GAME_CONFIG.factions).map(([factionId, faction]) => [factionId, faction.palette]),
);

function applyConfiguredDisplayNames() {
  const playerFactionName = GAME_CONFIG.factions[PLAYER_FACTION_ID].name;
  ui.mapName.textContent = getSelectedFront()?.name || GAME_CONFIG.map.name;
  ui.clearPlayerFactionName.textContent = playerFactionName;
}

const CHARACTER_SPRITE_SOURCES = getCharacterSpriteSources(GAME_CONFIG.characters);

const CHARACTER_SPRITES = Object.fromEntries(
  Object.entries(CHARACTER_SPRITE_SOURCES).map(([characterId, source]) => {
    return [characterId, createCharacterSpriteImage(source, () => requestAnimationFrame(() => render()))];
  }),
);

const SHOP_ITEMS = BALANCE.economy.shopItems;
const upgradeKeys = Object.keys(SHOP_ITEMS);
const persistentState = loadPersistentState(undefined, upgradeKeys, {
  campaignId: GAME_CONFIG.campaign.id,
  difficultyId: GAME_CONFIG.campaign.defaultDifficultyId,
  difficultyIds: DIFFICULTY_IDS,
});
const savedEquippedCharacterId = loadEquippedCharacter(undefined);
const savedSpecialMove = loadSpecialMove(undefined, SPECIAL_MOVE_BALANCE);

function savePersistentProgress() {
  savePersistentState(undefined, {
    gold: state.gold,
    upgrades: state.upgrades,
    campaign: state.campaign,
  });
  saveEquippedCharacter(undefined, state.equippedCharacterId);
}

const state = {
  width: 0,
  height: 0,
  dpr: 1,
  zoom: 1,
  panX: 0,
  panY: 0,
  paused: false,
  speed: 1,
  elapsed: 0,
  gold: persistentState.gold,
  upgrades: persistentState.upgrades,
  campaign: persistentState.campaign,
  equippedCharacterId: savedEquippedCharacterId,
  specialMove: savedSpecialMove,
  specialMoveUsesRemaining: 0,
  invincibilityRemaining: 0,
  selectedRegionId: null,
  aiTimers: createAiFactionState(getActiveAiBalance().initialDelaySeconds),
  aiReinforcements: createAiFactionState(getActiveAiBalance().reinforcementLimit),
  invasionWarning: null,
  runProgress: createRunProgress(),
  recoveryTimer: 0,
  toastTimer: 0,
  eventNotice: true,
  motion: true,
  defeated: false,
  cleared: false,
  started: false,
  phaseId: GAME_CONFIG.scenario.phaseId,
  shopOpen: false,
  shopWasPaused: false,
  battles: new Map(),
  suppressNextClick: false,
};

function getActiveDifficulty() {
  return getDifficultyProfile(state.campaign.difficultyId);
}

function getDifficultyUpgradeCap(key) {
  return getActiveDifficulty().upgradeCaps[key] ?? Number.MAX_SAFE_INTEGER;
}

const dragState = {
  active: false,
  sourceUnit: null,
  currentPoint: null,
  targetRegion: null,
  invalidTarget: false,
  moved: false,
  pointerId: null,
};

function cloneRegion(region) {
  return {
    ...region,
    occupation: null,
    points: region.points.map(([x, y]) => [x, y]),
    polygons: cloneRegionPolygons(region),
    borderPolygons: cloneRegionBorderPolygons(region),
  };
}

function cloneRegionState(region) {
  return {
    ...region,
    occupation: region.occupation ? { ...region.occupation } : null,
    points: region.points.map(([x, y]) => [x, y]),
    polygons: cloneRegionPolygons(region),
    borderPolygons: cloneRegionBorderPolygons(region),
    interactionPoint: region.interactionPoint ? [...region.interactionPoint] : region.interactionPoint,
  };
}

function cloneRegionPolygons(region) {
  return (region.polygons || [[region.points]]).map((polygon) => polygon.map((ring) => ring.map(([x, y]) => [x, y])));
}

function cloneRegionBorderPolygons(region) {
  return (region.borderPolygons || region.polygons || [[region.points]])
    .map((polygon) => polygon.map((ring) => ring.map(([x, y]) => [x, y])));
}

function cloneUnit(unit) {
  return {
    ...unit,
    target: unit.target ? { ...unit.target } : null,
    route: unit.route ? unit.route.map((point) => ({ ...point })) : null,
    routeIndex: unit.routeIndex || 0,
    stationCenter: unit.stationCenter ? { ...unit.stationCenter } : null,
  };
}

let activePhaseId = GAME_CONFIG.scenario.phaseId;
const runtimeScenario = createRuntimeScenario(GAME_CONFIG, activePhaseId, persistentState.campaign.difficultyId);
const regions = runtimeScenario.regions;
const units = runtimeScenario.units;
let initialRegions = regions.map(cloneRegion);
let initialUnits = units.map(cloneUnit);

function replaceRuntime(nextRuntime) {
  regions.splice(0, regions.length, ...nextRuntime.regions.map(cloneRegion));
  units.splice(0, units.length, ...nextRuntime.units.map(cloneUnit));
  initialRegions = nextRuntime.regions.map(cloneRegion);
  initialUnits = nextRuntime.units.map(cloneUnit);
  activePhaseId = nextRuntime.phaseId;
  state.phaseId = nextRuntime.phaseId;
}

function resetRuntimeToPhase(phaseId) {
  replaceRuntime(createRuntimeScenario(GAME_CONFIG, phaseId, state.campaign.difficultyId));
}

function transitionToPhase(phaseId) {
  const nextRuntime = createRuntimeScenario(GAME_CONFIG, phaseId, state.campaign.difficultyId);
  const transitioned = transitionPhase({
    currentRuntime: { frontId: selectedFrontId, phaseId: activePhaseId, regions, units },
    nextRuntime,
    playerFactionId: PLAYER_FACTION_ID,
  });

  regions.splice(0, regions.length, ...transitioned.regions.map(cloneRegionState));
  units.splice(0, units.length, ...transitioned.units.map(cloneUnit));
  activePhaseId = phaseId;
  state.phaseId = phaseId;
  state.selectedRegionId = null;
  state.aiTimers = createAiFactionState(getActiveAiBalance().initialDelaySeconds);
  state.aiReinforcements = createAiFactionState(getActiveAiBalance().reinforcementLimit);
  state.invasionWarning = null;
  state.battles.clear();
}

const view = { width: 0, height: 0 };
let lastTime = performance.now();
let toastTimeout = null;
let specialMoveCutInTimeout = null;

function resizeCanvas() {
  const rect = stage.getBoundingClientRect();
  state.dpr = Math.min(window.devicePixelRatio || 1, 2);
  view.width = Math.max(320, rect.width);
  view.height = Math.max(450, rect.height);
  canvas.width = Math.floor(view.width * state.dpr);
  canvas.height = Math.floor(view.height * state.dpr);
  canvas.style.width = `${view.width}px`;
  canvas.style.height = `${view.height}px`;
  state.width = view.width;
  state.height = view.height;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getRegion(id) {
  return regions.find((region) => region.id === id);
}

function roadNeighbors(regionId) {
  return GAME_CONFIG.map.roadNeighbors[regionId] || [];
}

function findRoadPath(startId, targetId) {
  if (!startId || !targetId) return [];
  if (startId === targetId) return [startId];

  const queue = [startId];
  const previous = new Map([[startId, null]]);
  while (queue.length > 0) {
    const currentId = queue.shift();
    for (const neighborId of roadNeighbors(currentId)) {
      if (previous.has(neighborId)) continue;
      previous.set(neighborId, currentId);
      if (neighborId === targetId) {
        const path = [targetId];
        let parentId = currentId;
        while (parentId) {
          path.unshift(parentId);
          parentId = previous.get(parentId);
        }
        return path;
      }
      queue.push(neighborId);
    }
  }

  return [];
}

function areRoadNeighbors(sourceRegion, targetRegion) {
  return Boolean(sourceRegion && targetRegion && sourceRegion.id !== targetRegion.id && roadNeighbors(sourceRegion.id).includes(targetRegion.id));
}

function getAiAttackCandidates(factionId) {
  return collectAiAttackCandidates({
    regions,
    units,
    factionId,
    playerFactionId: PLAYER_FACTION_ID,
    areNeighbors: areRoadNeighbors,
  });
}

function hasRoadPath(sourceRegion, targetRegion) {
  return Boolean(sourceRegion && targetRegion && sourceRegion.id !== targetRegion.id && findRoadPath(sourceRegion.id, targetRegion.id).length >= 2);
}

function getAttackCandidates() {
  const owned = regions.filter((region) => region.faction === PLAYER_FACTION_ID);
  return regions
    .filter((region) => region.faction !== PLAYER_FACTION_ID)
    .filter((region) => !region.occupation || region.occupation.faction !== PLAYER_FACTION_ID)
    .filter((region) => owned.some((source) => roadNeighbors(source.id).includes(region.id)))
    .sort((left, right) => attackScore(left) - attackScore(right));
}

function attackScore(region) {
  return region.production * TARGETING_BALANCE.productionWeight + TARGETING_BALANCE.factionPenalty[region.faction];
}

function regionCenter(region) {
  if (Array.isArray(region.interactionPoint)) {
    return { x: region.interactionPoint[0], y: region.interactionPoint[1] };
  }
  const points = region.points;
  const total = points.reduce((result, point) => ({ x: result.x + point[0], y: result.y + point[1] }), { x: 0, y: 0 });
  return { x: total.x / points.length, y: total.y / points.length };
}

function screenPoint(point) {
  const centerX = view.width / 2;
  const centerY = view.height / 2;
  const x = Array.isArray(point) ? point[0] : point.x;
  const y = Array.isArray(point) ? point[1] : point.y;
  return {
    x: centerX + (x * view.width - centerX) * state.zoom + state.panX,
    y: centerY + (y * view.height - centerY) * state.zoom + state.panY,
  };
}

function worldPointFromScreen(x, y) {
  const centerX = view.width / 2;
  const centerY = view.height / 2;
  return [
    (centerX + (x - centerX - state.panX) / state.zoom) / view.width,
    (centerY + (y - centerY - state.panY) / state.zoom) / view.height,
  ];
}

function pathForPolygons(polygons) {
  ctx.beginPath();
  polygons.forEach((polygon) => polygon.forEach((ring) => {
    ring.forEach((point, index) => {
      const screen = screenPoint(point);
      if (index === 0) ctx.moveTo(screen.x, screen.y);
      else ctx.lineTo(screen.x, screen.y);
    });
    ctx.closePath();
  }));
}

function regionPolygons(region) {
  return region.polygons || [[region.points]];
}

function regionBorderPolygons(region) {
  return region.borderPolygons || regionPolygons(region);
}

function pathForPoints(points) {
  ctx.beginPath();
  points.forEach((point, index) => {
    const screen = screenPoint(point);
    if (index === 0) ctx.moveTo(screen.x, screen.y);
    else ctx.lineTo(screen.x, screen.y);
  });
  ctx.closePath();
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, view.height);
  gradient.addColorStop(0, "#f6f8fb");
  gradient.addColorStop(1, "#e4e9f0");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, view.width, view.height);

  ctx.save();
  ctx.globalAlpha = 0.32;
  ctx.strokeStyle = "#c5cedb";
  ctx.lineWidth = 1;
  for (let x = -view.height; x < view.width + view.height; x += 44) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + view.height * 0.34, view.height);
    ctx.stroke();
  }
  ctx.restore();
}

function drawDecorationLabels(labels = []) {
  if (labels.length === 0) return;
  ctx.save();
  ctx.globalAlpha = 0.26;
  ctx.fillStyle = "#9eacbf";
  ctx.font = "800 10px Inter, sans-serif";
  ctx.letterSpacing = "0.2em";
  labels.forEach(({ text, position: [x, y] }) => {
    ctx.fillText(text, view.width * x, view.height * y);
  });
  ctx.restore();
}

function drawRegions() {
  regions.forEach((region) => {
    const palette = COLORS[region.faction];
    pathForPolygons(regionPolygons(region));
    ctx.fillStyle = palette.territory;
    ctx.fill("evenodd");

    const selected = region.id === state.selectedRegionId;
    pathForPolygons(regionBorderPolygons(region));
    ctx.lineWidth = selected ? 4 : 2;
    ctx.strokeStyle = selected ? "#fff" : palette.territoryBorder;
    ctx.shadowColor = selected ? "rgba(36, 76, 134, 0.35)" : "transparent";
    ctx.shadowBlur = selected ? 12 : 0;
    ctx.stroke();
    ctx.shadowBlur = 0;

    const center = screenPoint(regionCenter(region));
    ctx.save();
    ctx.globalAlpha = selected ? 0.55 : 0.2;
    ctx.fillStyle = palette.territoryDark;
    ctx.beginPath();
    ctx.arc(center.x, center.y, Math.max(18, view.width * 0.017), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (state.zoom > 0.94) {
      ctx.save();
      ctx.fillStyle = palette.territoryLabel;
      ctx.font = `800 ${clamp(view.width * 0.009, 8, 12)}px Inter, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(region.shortName, center.x, center.y + view.height * 0.046);
      ctx.restore();
    }
  });
}

function drawRoadNetwork() {
  const drawnEdges = new Set();
  ctx.save();
  ctx.lineCap = "round";
  ctx.setLineDash([7, 7]);
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(72, 96, 132, 0.34)";

  regions.forEach((sourceRegion) => {
    roadNeighbors(sourceRegion.id).forEach((targetId) => {
      const edgeKey = [sourceRegion.id, targetId].sort().join("::");
      if (drawnEdges.has(edgeKey)) return;
      const targetRegion = getRegion(targetId);
      if (!targetRegion) return;
      drawnEdges.add(edgeKey);

      const start = screenPoint(regionCenter(sourceRegion));
      const end = screenPoint(regionCenter(targetRegion));
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    });
  });

  ctx.setLineDash([]);
  ctx.globalAlpha = 0.72;
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "rgba(72, 96, 132, 0.38)";
  ctx.lineWidth = 1;
  regions.forEach((region) => {
    const center = screenPoint(regionCenter(region));
    ctx.beginPath();
    ctx.arc(center.x, center.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });
  ctx.restore();
}

function drawDecorationLines(lines = []) {
  if (lines.length === 0) return;
  ctx.save();
  ctx.setLineDash([7, 7]);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "rgba(114, 79, 85, 0.27)";
  lines.forEach(({ from, to }) => {
    const a = screenPoint(from);
    const b = screenPoint(to);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  });
  ctx.restore();
}

function drawAttackMarkers() {
  const candidates = getAttackCandidates();
  const recommendedId = candidates[0]?.id;
  candidates.forEach((region) => {
    const center = screenPoint(regionCenter(region));
    const recommended = region.id === recommendedId;
    const pulse = recommended ? Math.sin(state.elapsed * 5) * 2 : 0;
    const radius = clamp(view.width * 0.018, 18, 28) + pulse;
    const label = recommended ? "ATTACK" : "TARGET";
    const accent = recommended ? "#e18832" : "#c99745";

    ctx.save();
    ctx.globalAlpha = recommended ? 0.18 : 0.1;
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius * 1.28, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = recommended ? 0.98 : 0.72;
    ctx.strokeStyle = accent;
    ctx.fillStyle = accent;
    ctx.lineWidth = recommended ? 2.5 : 1.5;
    ctx.setLineDash(recommended ? [6, 4] : [3, 4]);
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(center.x - radius - 5, center.y);
    ctx.lineTo(center.x - radius + 3, center.y);
    ctx.moveTo(center.x + radius - 3, center.y);
    ctx.lineTo(center.x + radius + 5, center.y);
    ctx.moveTo(center.x, center.y - radius - 5);
    ctx.lineTo(center.x, center.y - radius + 3);
    ctx.moveTo(center.x, center.y + radius - 3);
    ctx.lineTo(center.x, center.y + radius + 5);
    ctx.stroke();
    ctx.font = `900 ${recommended ? 10 : 8}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
    ctx.strokeText(label, center.x, center.y - radius - 8);
    ctx.fillStyle = accent;
    ctx.fillText(label, center.x, center.y - radius - 8);
    ctx.restore();
  });
}

function drawInvasionWarning() {
  const warning = state.invasionWarning;
  if (!warning) return;
  const source = getRegion(warning.sourceRegionId);
  const target = getRegion(warning.targetRegionId);
  if (!source || !target) return;

  const pathIds = findRoadPath(source.id, target.id);
  if (pathIds.length < 2) return;
  const points = pathIds.map((regionId) => screenPoint(regionCenter(getRegion(regionId))));
  const end = points[points.length - 1];
  const previous = points[points.length - 2];
  const angle = Math.atan2(end.y - previous.y, end.x - previous.x);
  const pulse = 1 + Math.sin(state.elapsed * 7) * 0.08;

  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = "#c34e58";
  ctx.fillStyle = "#c34e58";
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 5]);
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(end.x, end.y);
  ctx.lineTo(end.x - Math.cos(angle - 0.5) * 11, end.y - Math.sin(angle - 0.5) * 11);
  ctx.lineTo(end.x - Math.cos(angle + 0.5) * 11, end.y - Math.sin(angle + 0.5) * 11);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 0.16;
  ctx.beginPath();
  ctx.arc(end.x, end.y, clamp(view.width * 0.033, 25, 42) * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.92;
  ctx.strokeStyle = "#c34e58";
  ctx.lineWidth = 2.5;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.arc(end.x, end.y, clamp(view.width * 0.025, 20, 32) * pulse, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = "900 9px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
  ctx.strokeText("INCOMING", end.x, end.y - clamp(view.width * 0.025, 20, 32) - 8);
  ctx.fillStyle = "#c34e58";
  ctx.fillText("INCOMING", end.x, end.y - clamp(view.width * 0.025, 20, 32) - 8);
  ctx.restore();
}

function drawOccupationIndicators() {
  regions.forEach((region) => {
    const occupation = region.occupation;
    if (!occupation) return;
    const center = screenPoint(regionCenter(region));
    const radius = clamp(view.width * 0.024, 21, 32);
    const progress = clamp(occupation.progress / occupation.duration, 0, 1);
    const remaining = Math.max(0, Math.ceil(occupation.duration - occupation.progress));
    const color = COLORS[occupation.faction].occupation;

    ctx.save();
    ctx.globalAlpha = 0.14;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius * 1.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
    ctx.stroke();
    ctx.font = "900 9px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
    ctx.strokeText(`占領 ${remaining}s`, center.x, center.y - radius - 8);
    ctx.fillStyle = color;
    ctx.fillText(`占領 ${remaining}s`, center.x, center.y - radius - 8);
    ctx.restore();
  });
}

function getEquippedPlayerCharacterId() {
  const characterId = state.equippedCharacterId;
  return getCharacterSpriteSource(characterId, GAME_CONFIG.characters)
    ? characterId
    : PLAYER_CHARACTER_ID;
}

function getDisplayedCharacterId(unit) {
  return !unit || unit.faction === PLAYER_FACTION_ID
    ? getEquippedPlayerCharacterId()
    : unit?.characterId || null;
}

function drawUnit(unit, time) {
  const point = screenPoint([unit.x, unit.y]);
  const scale = clamp(view.width * 0.021, 15, 25) * (state.zoom > 1 ? 1.07 : 1);
  const characterId = getDisplayedCharacterId(unit);
  const spriteSource = getCharacterSpriteSource(characterId, GAME_CONFIG.characters);
  const sprite = spriteSource ? CHARACTER_SPRITES[characterId] : null;
  if (!sprite?.complete || sprite.naturalWidth <= 0) return;
  const bob = state.motion ? Math.sin(time * 2.6 + unit.pulse) * 1.8 : 0;
  const y = point.y + bob;
  const battleJitter = unit.inBattle && state.motion ? Math.sin(time * 24 + unit.pulse) * 2.2 : 0;

  ctx.save();
  ctx.translate(battleJitter, 0);

  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = "#27334b";
  ctx.beginPath();
  ctx.ellipse(point.x, y + scale * 0.9, scale * 0.8, scale * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const spriteSize = scale * 2.42;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(sprite, point.x - spriteSize / 2, y - spriteSize / 2, spriteSize, spriteSize);

  ctx.save();
  ctx.font = `900 ${clamp(scale * 0.62, 10, 14)}px Inter, sans-serif`;
  ctx.textAlign = "center";
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.strokeText(String(unit.strength), point.x, y + scale * 1.6);
  ctx.fillStyle = "#18202c";
  ctx.fillText(String(unit.strength), point.x, y + scale * 1.6);
  ctx.restore();

  if (unit.inBattle) {
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = "#ffcf56";
    ctx.strokeStyle = "#713b3f";
    ctx.lineWidth = 2;
    ctx.font = `900 ${clamp(scale * 0.72, 12, 17)}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.strokeText("⚔", point.x, y - scale * 1.2);
    ctx.fillText("⚔", point.x, y - scale * 1.2);
    ctx.restore();
  }

  ctx.restore();
}

function drawOrderLine(unit, target, active = false) {
  const start = screenPoint([unit.x, unit.y]);
  const end = screenPoint([target.x, target.y]);
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const color = COLORS[unit.faction].occupation;

  ctx.save();
  ctx.globalAlpha = active ? 0.95 : 0.55;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = active ? 3 : 1.7;
  ctx.setLineDash(active ? [8, 5] : [5, 7]);
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(end.x, end.y);
  ctx.lineTo(end.x - Math.cos(angle - 0.5) * 10, end.y - Math.sin(angle - 0.5) * 10);
  ctx.lineTo(end.x - Math.cos(angle + 0.5) * 10, end.y - Math.sin(angle + 0.5) * 10);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawRoadOrderPreview(unit, targetRegion) {
  const sourceRegion = regionForUnit(unit);
  if (!sourceRegion) return;
  const pathIds = findRoadPath(sourceRegion.id, targetRegion.id);
  if (pathIds.length < 2) return;

  const points = [{ x: unit.x, y: unit.y }];
  const sourceCenter = regionCenter(sourceRegion);
  if (distance(unit, sourceCenter) > MOVEMENT_BALANCE.routeSnapDistance) points.push(sourceCenter);
  pathIds.slice(1).forEach((regionId) => points.push(regionCenter(getRegion(regionId))));

  const screenPoints = points.map((point) => screenPoint([point.x, point.y]));
  const start = screenPoints[0];
  const end = screenPoints[screenPoints.length - 1];
  const previous = screenPoints[screenPoints.length - 2];
  const angle = Math.atan2(end.y - previous.y, end.x - previous.x);

  ctx.save();
  ctx.globalAlpha = 0.95;
  ctx.strokeStyle = "#2c5a9f";
  ctx.fillStyle = "#2c5a9f";
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 5]);
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  screenPoints.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(end.x, end.y);
  ctx.lineTo(end.x - Math.cos(angle - 0.5) * 10, end.y - Math.sin(angle - 0.5) * 10);
  ctx.lineTo(end.x - Math.cos(angle + 0.5) * 10, end.y - Math.sin(angle + 0.5) * 10);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawInvalidDispatchMarker(point) {
  const screen = screenPoint([point.x, point.y]);
  const radius = clamp(view.width * 0.021, 17, 27);
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = "#c34e58";
  ctx.fillStyle = "#c34e58";
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(screen.x - 7, screen.y - 7);
  ctx.lineTo(screen.x + 7, screen.y + 7);
  ctx.moveTo(screen.x + 7, screen.y - 7);
  ctx.lineTo(screen.x - 7, screen.y + 7);
  ctx.stroke();
  ctx.font = "900 8px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
  ctx.strokeText("ROAD ONLY", screen.x, screen.y - radius - 8);
  ctx.fillStyle = "#c34e58";
  ctx.fillText("ROAD ONLY", screen.x, screen.y - radius - 8);
  ctx.restore();
}

function drawOrders() {
  units.forEach((unit) => {
    if (unit.target && !unit.arrived) drawOrderLine(unit, unit.target);
  });

  if (dragState.active && dragState.sourceUnit && dragState.currentPoint) {
    if (dragState.targetRegion) {
      drawRoadOrderPreview(dragState.sourceUnit, dragState.targetRegion);
    } else if (dragState.invalidTarget) {
      drawInvalidDispatchMarker(dragState.currentPoint);
    }
  }
}

function drawBattleEffects() {
  state.battles.forEach((battle) => {
    const battleUnits = (battle.unitIds || []).map((unitId) => units.find((unit) => unit.id === unitId)).filter(Boolean);
    if (battleUnits.length < 2) return;

    const center = screenPoint({
      x: battleUnits.reduce((sum, unit) => sum + unit.x, 0) / battleUnits.length,
      y: battleUnits.reduce((sum, unit) => sum + unit.y, 0) / battleUnits.length,
    });
    const pulse = 1 + Math.sin(state.elapsed * 10 + battle.phase) * 0.08;
    const radius = clamp(view.width * (0.03 + battleUnits.length * 0.003), 25, 48) * pulse;

    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "#f2a536";
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.82;
    ctx.strokeStyle = "#db7b31";
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = "#b9474c";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(center.x - 8, center.y - 8);
    ctx.lineTo(center.x + 8, center.y + 8);
    ctx.moveTo(center.x + 8, center.y - 8);
    ctx.lineTo(center.x - 8, center.y + 8);
    ctx.stroke();
    ctx.font = "900 9px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#8b3c45";
    ctx.fillText("BATTLE", center.x, center.y + radius + 13);
    ctx.restore();
  });
}

function drawSelectionMarker() {
  if (!state.selectedRegionId) return;
  const region = getRegion(state.selectedRegionId);
  if (!region) return;
  const center = screenPoint(regionCenter(region));
  const radius = clamp(view.width * 0.023, 22, 34) + Math.sin(state.elapsed * 4) * 2;
  ctx.save();
  ctx.globalAlpha = 0.75;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function render() {
  ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  ctx.clearRect(0, 0, view.width, view.height);
  drawBackground();
  drawDecorationLabels(GAME_CONFIG.map.decorations?.labels);
  drawRegions();
  drawRoadNetwork();
  drawAttackMarkers();
  drawInvasionWarning();
  drawOccupationIndicators();
  drawDecorationLines(GAME_CONFIG.map.decorations?.lines);
  drawOrders();
  drawBattleEffects();
  units.forEach((unit) => drawUnit(unit, state.elapsed));
  drawSelectionMarker();
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function setUnitRoute(unit, sourceRegionId, targetRegionId) {
  const pathIds = findRoadPath(sourceRegionId, targetRegionId);
  if (pathIds.length < 2) return false;

  const points = [];
  const sourceCenter = regionCenter(getRegion(sourceRegionId));
  if (distance(unit, sourceCenter) > MOVEMENT_BALANCE.routeSnapDistance) points.push(sourceCenter);
  pathIds.slice(1).forEach((regionId) => points.push(regionCenter(getRegion(regionId))));
  if (points.length === 0) return false;

  unit.route = points;
  unit.routeIndex = 0;
  unit.target = { ...points[0] };
  return true;
}

function getUnitMovementSpeed(unit) {
  const baseSpeed = MOVEMENT_BALANCE.speedByFaction[unit.faction] || 0;
  const speedPerLevel = SHOP_ITEMS.speed?.speedPerLevel || 0;
  const speedLevel = Number(state.upgrades.speed) || 0;
  return baseSpeed + (unit.faction === PLAYER_FACTION_ID ? speedLevel * speedPerLevel : 0);
}

function moveUnit(unit, dt) {
  if (unit.inBattle) return;

  if (unit.arrived && unit.stationCenter) {
    unit.x = unit.stationCenter.x;
    unit.y = unit.stationCenter.y;
    return;
  }

  if (!unit.target) return;
  const target = unit.target;
  const dx = target.x - unit.x;
  const dy = target.y - unit.y;
  const distanceToTarget = Math.hypot(dx, dy);
  const speed = getUnitMovementSpeed(unit);
  if (distanceToTarget < speed * dt) {
    unit.x = target.x;
    unit.y = target.y;

    if (unit.route && unit.routeIndex < unit.route.length - 1) {
      unit.routeIndex += 1;
      unit.target = { ...unit.route[unit.routeIndex] };
      return;
    }

    unit.route = null;
    unit.routeIndex = 0;
    unit.target = null;
    unit.arrived = true;
    if (unit.targetRegionId) unit.regionId = unit.targetRegionId;
    const stationRegion = getRegion(unit.targetRegionId) || regionForUnit(unit);
    if (stationRegion) unit.stationCenter = regionCenter(stationRegion);
    onUnitArrived(unit);
    return;
  }
  unit.x += (dx / distanceToTarget) * speed * dt;
  unit.y += (dy / distanceToTarget) * speed * dt;
}

function startOccupation(unit, region) {
  if (!unit || !region || region.faction === unit.faction) return;
  if (region.occupation?.faction === unit.faction) return;

  region.occupation = {
    faction: unit.faction,
    unitId: unit.id,
    progress: 0,
    duration: OCCUPATION_DURATION,
  };
  addEvent(`${region.shortName}で占領進行を開始しました`);
}

function cancelOccupationForUnit(unit) {
  const region = unit.targetRegionId ? getRegion(unit.targetRegionId) : null;
  if (region?.occupation?.unitId !== unit.id) return;

  const replacement = units.find((candidate) => candidate.id !== unit.id && candidate.faction === unit.faction && candidate.arrived && candidate.targetRegionId === region.id && candidate.strength > 0);
  if (replacement) region.occupation.unitId = replacement.id;
  else region.occupation = null;
}

function occupationMembers(region, faction) {
  return units.filter((unit) => unit.faction === faction && unit.arrived && unit.targetRegionId === region.id && unit.strength > 0);
}

function completeOccupation(unit, region) {
  if (!region.occupation || region.occupation.unitId !== unit.id) return;

  region.faction = unit.faction;
  const wasInitiallyPlayerOwned = GAME_CONFIG.scenario.territoryOwners[region.id] === PLAYER_FACTION_ID;
  if (
    unit.faction === PLAYER_FACTION_ID
    && !wasInitiallyPlayerOwned
    && !state.runProgress.capturedRegionIds.has(region.id)
  ) {
    state.runProgress.capturedRegionIds.add(region.id);
    state.runProgress.capturedRegions += 1;
  }
  region.occupation = null;
  unit.regionId = region.id;
  unit.arrived = true;
  unit.stationCenter = regionCenter(region);
  unit.arrivalResolved = true;
  const occupationMessage = `${region.name}を占領しました`;
  const factionName = GAME_CONFIG.factions[unit.faction]?.name || unit.faction;
  addEvent(`${region.shortName}が${factionName}の支配下に入りました`);
  const newlyCollectedCountryIds = unit.faction === PLAYER_FACTION_ID ? collectNewCountryFlags() : [];
  if (newlyCollectedCountryIds.length > 0) announceCollectedCountryFlags(newlyCollectedCountryIds);
  else showToast(occupationMessage);
}

function updateOccupationProgress(dt) {
  regions.forEach((region) => {
    const occupation = region.occupation;
    if (!occupation) return;

    const occupants = occupationMembers(region, occupation.faction);
    let unit = occupants.find((candidate) => candidate.id === occupation.unitId);
    if (!unit) {
      unit = occupants[0];
      if (unit) occupation.unitId = unit.id;
    }
    if (!unit) {
      region.occupation = null;
      return;
    }
    if (occupants.some((candidate) => candidate.inBattle)) return;

    occupation.progress += dt;
    if (occupation.progress >= occupation.duration) completeOccupation(unit, region);
  });
}

function onUnitArrived(unit) {
  if (!unit.targetRegionId) return;
  const region = getRegion(unit.targetRegionId);
  if (!region || unit.arrivalResolved) return;

  unit.arrivalResolved = true;
  if (region.faction !== unit.faction) startOccupation(unit, region);
  unit.strength = Math.min(unit.maxStrength, Math.max(UNIT_BALANCE.minimumSurvivorStrength, unit.strength));
}

function resolveBattleWinner(winner, loser) {
  if (winner.faction === PLAYER_FACTION_ID && loser?.faction && loser.faction !== PLAYER_FACTION_ID) {
    state.runProgress.battleWins += 1;
  }

  const battleRegion = winner.targetRegionId ? getRegion(winner.targetRegionId) : loser?.targetRegionId ? getRegion(loser.targetRegionId) : null;
  if (battleRegion && winner.arrived && winner.targetRegionId === battleRegion.id && battleRegion.faction !== winner.faction) {
    const region = battleRegion;
    startOccupation(winner, region);
    addEvent(`${region.shortName}で勝利。占領進行を開始しました`);
    return;
  }

  if (battleRegion?.occupation && battleRegion.occupation.faction !== winner.faction) battleRegion.occupation = null;
  if (battleRegion && battleRegion.faction === winner.faction) {
    addEvent(`${battleRegion.shortName}の防衛に成功しました`);
  } else if (winner.targetRegionId) {
    addEvent(winner.faction === PLAYER_FACTION_ID ? "道路上の迎撃に成功しました" : "道路上の交戦に勝利。侵攻を再開します");
  }
}

function groupStrength(members) {
  return members.reduce((total, unit) => total + Math.max(0, unit.strength), 0);
}

function groupProduction(members) {
  return members.reduce((total, unit) => total + getUnitProduction(unit), 0);
}

function groupCombatDamage(members) {
  return calculateGroupCombatDamage({
    totalStrength: groupStrength(members),
    totalProduction: groupProduction(members),
    balance: COMBAT_BALANCE,
  });
}

function redistributeGroupStrength(members, totalStrength) {
  if (members.length === 0) return;
  const maxStrengthTotal = members.reduce((total, unit) => total + Math.max(UNIT_BALANCE.minimumSurvivorStrength, unit.maxStrength || getMaxUnitStrength(unit.faction)), 0);
  const targetStrength = Math.min(maxStrengthTotal, Math.max(0, Math.round(totalStrength)));
  const minimumStrength = UNIT_BALANCE.minimumSurvivorStrength;
  const survivorCount = Math.min(members.length, Math.floor(targetStrength / minimumStrength));

  if (survivorCount === 0) {
    members.forEach((unit) => { unit.strength = 0; });
    return;
  }

  const priority = members.slice().sort((left, right) => right.strength - left.strength);
  const survivors = priority.slice(0, survivorCount);
  members.forEach((unit) => { unit.strength = 0; });
  const distributable = targetStrength - minimumStrength * survivorCount;
  const allocations = [];
  let allocated = 0;
  const survivorCapacity = survivors.reduce((total, unit) => total + Math.max(0, (unit.maxStrength || getMaxUnitStrength(unit.faction)) - minimumStrength), 0);
  survivors.forEach((unit) => {
    const maxStrength = Math.max(minimumStrength, unit.maxStrength || getMaxUnitStrength(unit.faction));
    const capacity = Math.max(0, maxStrength - minimumStrength);
    const weight = survivorCapacity > 0 ? capacity / survivorCapacity : 0;
    const raw = distributable * weight;
    const whole = Math.floor(raw);
    unit.strength = minimumStrength + whole;
    allocated += unit.strength;
    allocations.push({ unit, maxStrength, remainder: raw - whole });
  });

  allocations.sort((left, right) => right.remainder - left.remainder);
  let leftover = targetStrength - allocated;
  while (leftover > 0) {
    const allocation = allocations.find(({ unit, maxStrength }) => unit.strength < maxStrength);
    if (!allocation) break;
    allocation.unit.strength += 1;
    leftover -= 1;
  }
}

function applyGroupDamage(members, damage) {
  const remaining = groupStrength(members) - Math.max(0, damage);
  redistributeGroupStrength(members, remaining);
}

function isPlayerInvincible() {
  return state.invincibilityRemaining > 0;
}

function collectBattleGroups() {
  const contacts = new Map(units.map((unit) => [unit.id, []]));
  const enemyContacts = new Set();
  for (let leftIndex = 0; leftIndex < units.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < units.length; rightIndex += 1) {
      const left = units[leftIndex];
      const right = units[rightIndex];
      if (distance(left, right) > BATTLE_DISTANCE) continue;
      contacts.get(left.id).push(right.id);
      contacts.get(right.id).push(left.id);
      if (left.faction !== right.faction) {
        enemyContacts.add(left.id);
        enemyContacts.add(right.id);
      }
    }
  }

  const visited = new Set();
  const groups = [];
  units.forEach((unit) => {
    if (visited.has(unit.id) || !enemyContacts.has(unit.id)) return;

    const queue = [unit.id];
    const memberIds = [];
    visited.add(unit.id);
    while (queue.length > 0) {
      const currentId = queue.shift();
      memberIds.push(currentId);
      contacts.get(currentId).forEach((neighborId) => {
        if (visited.has(neighborId)) return;
        visited.add(neighborId);
        queue.push(neighborId);
      });
    }

    const sortedIds = memberIds.sort();
    const sideMap = new Map();
    sortedIds.forEach((memberId) => {
      const member = units.find((candidate) => candidate.id === memberId);
      if (!member) return;
      if (!sideMap.has(member.faction)) sideMap.set(member.faction, []);
      sideMap.get(member.faction).push(memberId);
    });
    groups.push({
      id: sortedIds.join("::"),
      unitIds: sortedIds,
      sides: [...sideMap.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([faction, unitIds]) => ({ faction, unitIds })),
    });
  });
  return groups;
}

function battleRepresentative(members) {
  return members.find((unit) => unit.arrived && unit.targetRegionId) || members.find((unit) => unit.targetRegionId) || members.find((unit) => unit.arrived) || members[0] || null;
}

function updateBattles(dt) {
  const activeKeys = new Set();
  units.forEach((unit) => { unit.inBattle = false; });

  collectBattleGroups().forEach((group) => {
    const sides = group.sides
      .map((side) => ({ ...side, units: side.unitIds.map((unitId) => units.find((unit) => unit.id === unitId)).filter(Boolean) }))
      .filter((side) => side.units.length > 0);
    if (sides.length < 2) return;

    activeKeys.add(group.id);
    sides.forEach((side) => side.units.forEach((unit) => { unit.inBattle = true; }));

    let battle = state.battles.get(group.id);
    if (!battle) {
      battle = { unitIds: group.unitIds, sides: group.sides, cooldown: COMBAT_BALANCE.initialTickDelaySeconds, phase: Math.random() * 6, notified: false };
      state.battles.set(group.id, battle);
    } else {
      battle.unitIds = group.unitIds;
      battle.sides = group.sides;
    }

    battle.cooldown -= dt;
    if (battle.cooldown > 0) return;

    battle.cooldown = BATTLE_TICK_INTERVAL;
    battle.phase += 0.9;
    if (!battle.notified) {
      addEvent("前線で戦闘が発生しました");
      battle.notified = true;
    }

    const incomingDamage = new Map(sides.map((side) => [side.faction, 0]));
    sides.forEach((source) => {
      const targets = sides.filter((target) => target.faction !== source.faction);
      if (targets.length === 0) return;
      const sharedDamage = groupCombatDamage(source.units) / targets.length;
      targets.forEach((target) => incomingDamage.set(target.faction, incomingDamage.get(target.faction) + sharedDamage));
    });
    if (isPlayerInvincible()) incomingDamage.set(PLAYER_FACTION_ID, 0);
    sides.forEach((side) => applyGroupDamage(side.units, Math.round(incomingDamage.get(side.faction))));

    const survivors = sides.filter((side) => groupStrength(side.units) > 0);
    if (survivors.length === 1) {
      const winner = battleRepresentative(survivors[0].units);
      const losers = sides.filter((side) => side !== survivors[0]).flatMap((side) => side.units);
      const loser = battleRepresentative(losers);
      if (winner) resolveBattleWinner(winner, loser);
    }
  });

  state.battles.forEach((battle, key) => {
    if (!activeKeys.has(key)) state.battles.delete(key);
  });
}

function updateUnits(dt) {
  units.forEach((unit) => moveUnit(unit, dt));
  updateBattles(dt);

  for (let index = units.length - 1; index >= 0; index -= 1) {
    if (units[index].strength <= 0) units.splice(index, 1);
  }

  updateOccupationProgress(dt);
  if (!state.defeated && !state.cleared && !isPlayerInvincible() && !units.some((unit) => unit.faction === PLAYER_FACTION_ID)) triggerDefeat();
}

function nearestUnit(faction, target) {
  return units
    .filter((unit) => unit.faction === faction)
    .sort((a, b) => distance(a, target) - distance(b, target))[0];
}

function createUnit(faction, regionId, targetRegionId = null) {
  const region = getRegion(regionId);
  if (!region) return null;
  const center = regionCenter(region);
  const maxStrength = getMaxUnitStrength(faction);
  const unit = {
    id: `${faction}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    faction,
    characterId: faction === PLAYER_FACTION_ID ? getEquippedPlayerCharacterId() : region.countryId,
    x: center.x,
    y: center.y,
    strength: maxStrength,
    maxStrength,
    target: null,
    route: null,
    routeIndex: 0,
    regionId: region.id,
    targetRegionId,
    arrived: !targetRegionId,
    stationCenter: targetRegionId ? null : { ...center },
    arrivalResolved: false,
    inBattle: false,
    pulse: Math.random() * 4,
  };
  if (targetRegionId) {
    setUnitRoute(unit, region.id, targetRegionId);
  }
  units.push(unit);
  return unit;
}

function runAi(dt) {
  const aiBalance = getActiveAiBalance();
  AI_FACTION_IDS.forEach((factionId) => {
    state.aiTimers[factionId] -= dt;
  });
  if (state.invasionWarning) return;

  const candidates = [];
  AI_FACTION_IDS.forEach((factionId) => {
    if (state.aiTimers[factionId] > 0 || state.aiReinforcements[factionId] <= 0) return;

    state.aiTimers[factionId] = aiBalance.actionDelaySeconds + Math.random() * aiBalance.actionDelayJitterSeconds;
    if (units.filter((unit) => unit.faction === factionId).length >= aiBalance.activeUnitLimit) return;
    candidates.push(...getAiAttackCandidates(factionId));
  });

  const candidate = chooseAiAttackCandidate(candidates, ACTIVE_AI_FACTION_ID);
  if (!candidate) return;

  state.invasionWarning = {
    factionId: candidate.factionId,
    sourceRegionId: candidate.source.id,
    targetRegionId: candidate.target.id,
    remaining: aiBalance.invasionWarningSeconds,
  };
  addEvent("侵攻予告あり！");
  showToast("侵攻予告あり！");
  updateInvasionAlert();
}

function updateInvasionWarning(dt) {
  const aiBalance = getActiveAiBalance();
  const warning = state.invasionWarning;
  if (!warning) return;

  const source = getRegion(warning.sourceRegionId);
  const target = getRegion(warning.targetRegionId);
  if (!source || !target || !AI_FACTION_IDS.includes(warning.factionId) || source.faction !== warning.factionId || target.faction !== PLAYER_FACTION_ID) {
    state.invasionWarning = null;
    return;
  }

  warning.remaining -= dt;
  if (warning.remaining > 0) return;
  state.invasionWarning = null;
  if (units.filter((unit) => unit.faction === warning.factionId).length >= aiBalance.activeUnitLimit) return;

  const created = createUnit(warning.factionId, source.id, target.id);
  if (!created) return;
  state.aiReinforcements[warning.factionId] -= 1;
  const factionName = GAME_CONFIG.factions[warning.factionId]?.name || "敵勢力";
  addEvent(`${source.shortName}から${factionName}の部隊が出撃しました`);
}

function regionForUnit(unit) {
  const containingRegion = [...regions].reverse().find((region) => pointInRegion([unit.x, unit.y], region));
  return containingRegion || (unit.regionId ? getRegion(unit.regionId) : null) || (unit.targetRegionId ? getRegion(unit.targetRegionId) : null);
}

function snapUnitToRoadNode(unit, regionId = null) {
  const region = getRegion(regionId) || regionForUnit(unit);
  if (!region) return null;
  const center = regionCenter(region);
  unit.regionId = region.id;
  unit.x = center.x;
  unit.y = center.y;
  unit.target = null;
  unit.route = null;
  unit.routeIndex = 0;
  unit.arrived = true;
  unit.stationCenter = { ...center };
  return region;
}

function getRegionProduction(region) {
  if (!region) return 1;
  const logistics = SHOP_ITEMS.logistics?.productionPerLevel || 0;
  return region.production + (region.faction === PLAYER_FACTION_ID ? state.upgrades.logistics * logistics : 0);
}

function getUnitProduction(unit) {
  return getRegionProduction(regionForUnit(unit));
}

function getMaxUnitStrength(faction) {
  const baseStrength = UNIT_BALANCE.baseMaxStrengthByFaction[faction] || UNIT_BALANCE.minimumSurvivorStrength;
  const armor = SHOP_ITEMS.armor?.maxStrengthPerLevel || 0;
  const resolvedStrength = GAME_CONFIG.factions[faction]?.isEnemy
    ? resolveEnemyStrength(
      baseStrength,
      getActiveEnemyProfile().strengthMultiplier * getActiveDifficulty().enemyStrengthMultiplier,
      UNIT_BALANCE.minimumSurvivorStrength,
    )
    : baseStrength;
  return resolvedStrength + (faction === PLAYER_FACTION_ID ? state.upgrades.armor * armor : 0);
}

function applyArmorUpgrade() {
  const maxStrength = getMaxUnitStrength(PLAYER_FACTION_ID);
  units.filter((unit) => unit.faction === PLAYER_FACTION_ID).forEach((unit) => {
    unit.maxStrength = Math.max(unit.maxStrength || UNIT_BALANCE.minimumSurvivorStrength, maxStrength);
  });
}

function updateStrength(dt) {
  state.recoveryTimer += dt;
  while (state.recoveryTimer >= CLOCK_BALANCE.recoveryTickSeconds) {
    units.forEach((unit) => {
      const maxStrength = unit.maxStrength || getMaxUnitStrength(unit.faction);
      unit.strength = Math.min(maxStrength, unit.strength + getUnitProduction(unit));
    });
    state.recoveryTimer -= CLOCK_BALANCE.recoveryTickSeconds;
  }
}

function update(dt) {
  const scaledDt = dt * state.speed;
  state.elapsed += scaledDt;
  state.invincibilityRemaining = Math.max(0, state.invincibilityRemaining - scaledDt);
  updateStrength(scaledDt);
  updateUnits(scaledDt);
  updateInvasionWarning(scaledDt);
  runAi(scaledDt);
  state.toastTimer = Math.max(0, state.toastTimer - dt);

  if (state.toastTimer === 0) ui.toast.classList.remove("is-visible");
}

function pointInPolygon(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];
    const intersect = yi > point[1] !== yj > point[1] && point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInRegion(point, region) {
  return regionPolygons(region).some((polygon) => {
    let inside = false;
    polygon.forEach((ring) => {
      if (pointInPolygon(point, ring)) inside = !inside;
    });
    return inside;
  });
}

function regionAtWorldPoint(point) {
  return findRegionAtWorldPoint({
    regions,
    point,
    pointInRegion,
    defaultHitRadius: GAME_CONFIG.map.interactionHitRadius || 0.02,
    zoom: state.zoom,
  });
}

function selectRegion(region) {
  state.selectedRegionId = region?.id || null;
  updateSelectedPanel();
  render();
}

function regionHasBattle(region) {
  return [...state.battles.values()].some((battle) => {
    return (battle.unitIds || []).some((unitId) => {
      const unit = units.find((candidate) => candidate.id === unitId);
      return unit?.targetRegionId === region.id || unit?.regionId === region.id;
    });
  });
}

function updateSelectedPanel() {
  const region = getRegion(state.selectedRegionId);
  if (!region) {
    ui.panel.classList.remove("has-selection");
    ui.factionDot.className = "faction-dot";
    ui.regionName.textContent = "マップをクリック";
    ui.regionStatus.textContent = "領土を選択すると作戦情報が表示されます";
    ui.occupation.textContent = "—";
    ui.production.textContent = "—";
    ui.threat.textContent = "—";
    return;
  }

  ui.panel.classList.add("has-selection");
  const factionConfig = GAME_CONFIG.factions[region.faction];
  ui.factionDot.className = `faction-dot ${factionConfig.panelClass}`;
  ui.regionName.textContent = region.name;
  const battleActive = regionHasBattle(region);
  const occupationActive = Boolean(region.occupation);
  ui.regionStatus.textContent = battleActive ? "⚔ 交戦中 — 侵攻が停止しています" : occupationActive ? "占領進行中 — タイマーが動いています" : factionConfig.statusText;
  ui.occupation.textContent = occupationActive ? `${Math.ceil(region.occupation.progress)}/${region.occupation.duration}秒` : "—";
  ui.production.textContent = `+${getRegionProduction(region)}/秒`;
  ui.threat.textContent = battleActive ? "交戦中" : occupationActive ? "占領中" : factionConfig.threatText;
}

function showToast(message) {
  ui.toast.textContent = message;
  ui.toast.classList.add("is-visible");
  state.toastTimer = 2.6;
}

function countryDisplayName(country) {
  return country?.nameJa || country?.name || country?.id || "不明な国";
}

function countryFlagBackground(country) {
  const colors = country?.flag?.colors || [];
  if (colors.length < 2) return "#d9e0ea";
  if (country.flag.type === "field") {
    return `radial-gradient(circle at center, ${colors[1]} 0 20%, transparent 21%), ${colors[0]}`;
  }

  const direction = country.flag.type === "vertical" ? "to right" : "to bottom";
  const stops = colors.map((color, index) => {
    const start = (index / colors.length) * 100;
    const end = ((index + 1) / colors.length) * 100;
    return `${color} ${start}% ${end}%`;
  }).join(", ");
  return `linear-gradient(${direction}, ${stops})`;
}

const COUNTRY_FLAG_SVG_NS = "http://www.w3.org/2000/svg";

function createCountryFlagSvgElement(tagName, attributes = {}) {
  const element = document.createElementNS(COUNTRY_FLAG_SVG_NS, tagName);
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
  return element;
}

function flagStarPoints(centerX, centerY, outerRadius, innerRadius, pointCount = 5) {
  return Array.from({ length: pointCount * 2 }, (_, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI) / pointCount;
    const radius = index % 2 === 0 ? outerRadius : innerRadius;
    return `${(centerX + Math.cos(angle) * radius).toFixed(3)},${(centerY + Math.sin(angle) * radius).toFixed(3)}`;
  }).join(" ");
}

function appendCountryFlagStar(svg, centerX, centerY, outerRadius, innerRadius, color) {
  svg.append(createCountryFlagSvgElement("polygon", {
    points: flagStarPoints(centerX, centerY, outerRadius, innerRadius),
    fill: color,
  }));
}

function appendCountryFlagTrigram(svg, x, y, pattern) {
  pattern.forEach((row, rowIndex) => {
    const top = y + rowIndex * 0.1;
    row.forEach((solid, segmentIndex) => {
      if (!solid) return;
      svg.append(createCountryFlagSvgElement("rect", {
        x: x + segmentIndex * 0.16,
        y: top,
        width: 0.13,
        height: 0.045,
        fill: "#111827",
      }));
    });
  });
}

function appendCountryFlagTaegeuk(svg) {
  svg.append(createCountryFlagSvgElement("circle", { cx: 1.5, cy: 1, r: 0.42, fill: "#0047a0" }));
  svg.append(createCountryFlagSvgElement("path", {
    d: "M 1.5 0.58 A 0.42 0.42 0 0 0 1.5 1.42 A 0.21 0.21 0 0 1 1.5 1.00 A 0.21 0.21 0 0 0 1.5 0.58 Z",
    fill: "#cd2e3a",
  }));
  svg.append(createCountryFlagSvgElement("circle", { cx: 1.5, cy: 0.79, r: 0.105, fill: "#0047a0" }));
  svg.append(createCountryFlagSvgElement("circle", { cx: 1.5, cy: 1.21, r: 0.105, fill: "#cd2e3a" }));
}

function renderCountryFlag(country, container) {
  if (!country || !container) return;

  const svg = createCountryFlagSvgElement("svg", {
    viewBox: "0 0 3 2",
    preserveAspectRatio: "none",
    "aria-hidden": "true",
  });
  const addRect = (x, y, width, height, fill) => svg.append(createCountryFlagSvgElement("rect", { x, y, width, height, fill }));

  switch (country.id) {
    case "russia":
      addRect(0, 0, 3, 2 / 3, "#fff");
      addRect(0, 2 / 3, 3, 2 / 3, "#2455a4");
      addRect(0, 4 / 3, 3, 2 / 3, "#d52b1e");
      break;
    case "kazakhstan": {
      addRect(0, 0, 3, 2, "#00afca");
      addRect(0, 0, 0.22, 2, "#f6d04d");
      svg.append(createCountryFlagSvgElement("circle", { cx: 1.62, cy: 0.62, r: 0.2, fill: "#f6d04d" }));
      for (let index = 0; index < 12; index += 1) {
        const angle = (index * Math.PI) / 6;
        svg.append(createCountryFlagSvgElement("line", {
          x1: 1.62 + Math.cos(angle) * 0.25,
          y1: 0.62 + Math.sin(angle) * 0.25,
          x2: 1.62 + Math.cos(angle) * 0.34,
          y2: 0.62 + Math.sin(angle) * 0.34,
          stroke: "#f6d04d",
          "stroke-width": 0.04,
        }));
      }
      svg.append(createCountryFlagSvgElement("path", { d: "M 1.27 1.06 Q 1.62 0.83 1.98 1.06 Q 1.62 1.26 1.27 1.06 Z", fill: "#f6d04d" }));
      break;
    }
    case "mongolia":
      addRect(0, 0, 1, 2, "#c4272f");
      addRect(1, 0, 1, 2, "#164b9b");
      addRect(2, 0, 1, 2, "#c4272f");
      svg.append(createCountryFlagSvgElement("circle", { cx: 0.5, cy: 0.72, r: 0.13, fill: "none", stroke: "#f6d04d", "stroke-width": 0.035 }));
      svg.append(createCountryFlagSvgElement("line", { x1: 0.5, y1: 0.42, x2: 0.5, y2: 1.58, stroke: "#f6d04d", "stroke-width": 0.04 }));
      svg.append(createCountryFlagSvgElement("rect", { x: 0.4, y: 1.0, width: 0.2, height: 0.08, fill: "#f6d04d" }));
      break;
    case "china":
      addRect(0, 0, 3, 2, "#de2910");
      appendCountryFlagStar(svg, 0.52, 0.52, 0.28, 0.12, "#ffde00");
      appendCountryFlagStar(svg, 0.98, 0.23, 0.1, 0.04, "#ffde00");
      appendCountryFlagStar(svg, 1.16, 0.48, 0.1, 0.04, "#ffde00");
      appendCountryFlagStar(svg, 1.13, 0.79, 0.1, 0.04, "#ffde00");
      appendCountryFlagStar(svg, 0.9, 1.02, 0.1, 0.04, "#ffde00");
      break;
    case "north-korea":
      addRect(0, 0, 3, 0.3, "#024fa2");
      addRect(0, 0.3, 3, 0.15, "#fff");
      addRect(0, 0.45, 3, 1.1, "#ed1c27");
      addRect(0, 1.55, 3, 0.15, "#fff");
      addRect(0, 1.7, 3, 0.3, "#024fa2");
      svg.append(createCountryFlagSvgElement("circle", { cx: 0.62, cy: 1, r: 0.31, fill: "#fff" }));
      appendCountryFlagStar(svg, 0.62, 1, 0.22, 0.09, "#ed1c27");
      break;
    case "south-korea":
      addRect(0, 0, 3, 2, "#fff");
      appendCountryFlagTaegeuk(svg);
      appendCountryFlagTrigram(svg, 0.62, 0.37, [[1, 1, 1], [1, 0, 1], [1, 1, 1]]);
      appendCountryFlagTrigram(svg, 2.02, 0.37, [[1, 0, 1], [1, 1, 1], [1, 0, 1]]);
      appendCountryFlagTrigram(svg, 0.62, 1.32, [[1, 1, 1], [1, 1, 1], [1, 0, 1]]);
      appendCountryFlagTrigram(svg, 2.02, 1.32, [[1, 0, 1], [1, 1, 1], [1, 1, 1]]);
      break;
    case "japan":
      addRect(0, 0, 3, 2, "#fff");
      svg.append(createCountryFlagSvgElement("circle", { cx: 1.5, cy: 1, r: 0.42, fill: "#bc002d" }));
      break;
    case "vietnam":
      addRect(0, 0, 3, 2, "#da251d");
      appendCountryFlagStar(svg, 1.5, 1, 0.42, 0.18, "#ffcd00");
      break;
    case "philippines":
      addRect(0, 0, 3, 1, "#0038a8");
      addRect(0, 1, 3, 1, "#ce1126");
      svg.append(createCountryFlagSvgElement("polygon", { points: "0,0 0,2 1.58,1", fill: "#fff" }));
      svg.append(createCountryFlagSvgElement("circle", { cx: 0.56, cy: 1, r: 0.2, fill: "#fcd116" }));
      for (let index = 0; index < 8; index += 1) {
        const angle = (index * Math.PI) / 4;
        svg.append(createCountryFlagSvgElement("line", {
          x1: 0.56 + Math.cos(angle) * 0.24,
          y1: 1 + Math.sin(angle) * 0.24,
          x2: 0.56 + Math.cos(angle) * 0.31,
          y2: 1 + Math.sin(angle) * 0.31,
          stroke: "#fcd116",
          "stroke-width": 0.035,
        }));
      }
      [[0.14, 0.27], [0.14, 1.73], [1.42, 1]].forEach(([cx, cy]) => appendCountryFlagStar(svg, cx, cy, 0.08, 0.035, "#fcd116"));
      break;
    case "indonesia":
      addRect(0, 0, 3, 1, "#ce1126");
      addRect(0, 1, 3, 1, "#fff");
      break;
    default:
      addRect(0, 0, 3, 2, countryFlagBackground(country));
      break;
  }

  container.style.background = "transparent";
  container.replaceChildren(svg);
  container.setAttribute("role", "img");
  container.setAttribute("aria-label", `${countryDisplayName(country)}の国旗`);
}

function updateFlagCollectionDialog() {
  if (!ui.flagCollectionGrid) return;

  const countries = Object.values(GAME_CONFIG.countries)
    .sort((left, right) => countryDisplayName(left).localeCompare(countryDisplayName(right), "ja"));
  const collectedIds = new Set(state.campaign.collectedCountryIds || []);
  const collectedCount = countries.filter((country) => collectedIds.has(country.id)).length;

  if (ui.flagCollectionCount) ui.flagCollectionCount.textContent = `${collectedCount} / ${countries.length}`;
  if (ui.flagCollectionSummary) ui.flagCollectionSummary.textContent = `${collectedCount} / ${countries.length}`;

  const fragment = document.createDocumentFragment();
  countries.forEach((country) => {
    const isCollected = collectedIds.has(country.id);
    const item = document.createElement("button");
    item.type = "button";
    item.dataset.countryId = country.id;
    item.className = `flag-collection-item${isCollected ? " is-collected" : ""}`;
    item.setAttribute("aria-label", `${countryDisplayName(country)}の国旗`);

    const flag = document.createElement("span");
    flag.className = `flag-collection-flag${isCollected ? "" : " is-locked"}`;
    renderCountryFlag(country, flag);
    flag.setAttribute("aria-hidden", "true");

    const copy = document.createElement("span");
    copy.className = "flag-collection-copy";
    const name = document.createElement("strong");
    name.textContent = countryDisplayName(country);
    copy.append(name);

    item.append(flag, copy);
    fragment.append(item);
  });
  ui.flagCollectionGrid.replaceChildren(fragment);
}

function collectNewCountryFlags() {
  const result = collectCountryFlags({
    regions,
    countries: GAME_CONFIG.countries,
    playerFactionId: PLAYER_FACTION_ID,
    collectedCountryIds: state.campaign.collectedCountryIds,
  });
  if (result.newlyCollectedCountryIds.length === 0) return [];

  state.campaign = {
    ...state.campaign,
    collectedCountryIds: result.collectedCountryIds,
  };
  savePersistentProgress();
  updateFlagCollectionDialog();
  return result.newlyCollectedCountryIds;
}

function announceCollectedCountryFlags(countryIds) {
  const names = countryIds.map((countryId) => countryDisplayName(GAME_CONFIG.countries[countryId]));
  if (names.length === 0) return;

  names.forEach((name) => addEvent(`${name}の国旗を獲得しました！`));
  showToast(`${names.join("・")}の国旗を獲得しました！`);
}

function addEvent(message) {
  if (!state.eventNotice) return;
  const item = document.createElement("span");
  item.className = "event-item";
  item.textContent = message;
  ui.eventFeed.prepend(item);
  while (ui.eventFeed.children.length > 2) ui.eventFeed.lastElementChild.remove();
  window.setTimeout(() => item.remove(), 6500);
}

function specialMoveEffectMessage(type, config) {
  if (type === "enemyWeakness") return `敵部隊の戦力を${Math.round(config.strengthReductionRate * 100)}%減らしました`;
  if (type === "allyBoost") return `味方部隊の現在戦力を${Math.round(config.strengthIncreaseRate * 100)}%増加（最大戦力まで）しました`;
  return `${config.durationSeconds}秒間、味方部隊を戦闘ダメージと敗北判定から守ります`;
}

function getSelectedPlayerUnit() {
  const playerUnits = units.filter((unit) => unit.faction === PLAYER_FACTION_ID);
  if (state.selectedRegionId) {
    const selectedUnit = playerUnits.find((unit) => unit.regionId === state.selectedRegionId || unit.targetRegionId === state.selectedRegionId);
    if (selectedUnit) return selectedUnit;
  }
  return playerUnits[0] || null;
}

function getSpecialMoveCutInCharacter() {
  const unit = getSelectedPlayerUnit();
  const characterId = getDisplayedCharacterId(unit);
  const source = getCharacterSpriteSource(characterId, GAME_CONFIG.characters);
  const character = GAME_CONFIG.characters[characterId];
  const label = character?.countryId
    ? `${countryDisplayName(GAME_CONFIG.countries[character.countryId])}のキャラクター`
    : "自軍キャラクター";
  return { label, source };
}

function hideSpecialMoveCutIn() {
  if (!ui.specialMoveCutIn) return;
  ui.specialMoveCutIn.classList.remove("is-visible", "is-static");
  ui.specialMoveCutIn.setAttribute("aria-hidden", "true");
}

function showSpecialMoveCutIn(name) {
  if (!ui.specialMoveCutIn || !ui.specialMoveCutInName) return;

  const { label, source } = getSpecialMoveCutInCharacter();
  if (ui.specialMoveCutInName) ui.specialMoveCutInName.textContent = name;
  if (ui.specialMoveCutInCharacter) {
    ui.specialMoveCutInCharacter.hidden = true;
    ui.specialMoveCutInCharacter.alt = label;
    if (source) {
      ui.specialMoveCutInCharacter.src = source;
      ui.specialMoveCutInCharacter.hidden = !(ui.specialMoveCutInCharacter.complete && ui.specialMoveCutInCharacter.naturalWidth > 0);
    }
  }

  if (specialMoveCutInTimeout) window.clearTimeout(specialMoveCutInTimeout);
  ui.specialMoveCutIn.classList.remove("is-visible", "is-static");
  ui.specialMoveCutIn.setAttribute("aria-hidden", "false");
  void ui.specialMoveCutIn.offsetWidth;
  ui.specialMoveCutIn.classList.toggle("is-static", !state.motion);
  ui.specialMoveCutIn.classList.add("is-visible");
  specialMoveCutInTimeout = window.setTimeout(() => {
    hideSpecialMoveCutIn();
    specialMoveCutInTimeout = null;
  }, 1800);
}

function useSpecialMove() {
  if (!state.started || state.defeated || state.cleared || state.specialMoveUsesRemaining <= 0 || !state.specialMove) return;

  const { type, name } = state.specialMove;
  const config = getSpecialMoveConfig(type, SPECIAL_MOVE_BALANCE);
  const result = applySpecialMoveEffect(type, units, SPECIAL_MOVE_BALANCE, PLAYER_FACTION_ID, UNIT_BALANCE.minimumSurvivorStrength);
  if (!result || !config) return;

  state.specialMoveUsesRemaining -= 1;
  if (type === "invincibility") state.invincibilityRemaining = config.durationSeconds;
  showSpecialMoveCutIn(name);
  const message = `${name}を発動：${specialMoveEffectMessage(type, config)}`;
  showToast(message);
  addEvent(message);
  updateHud();
}

function formatTime() {
  const totalSeconds = Math.max(0, Math.floor(state.elapsed));
  const day = Math.floor(totalSeconds / CLOCK_BALANCE.dayDurationSeconds) + 1;
  const daySeconds = totalSeconds % CLOCK_BALANCE.dayDurationSeconds;
  const minutes = String(Math.floor(daySeconds / 60)).padStart(2, "0");
  const seconds = String(daySeconds % 60).padStart(2, "0");
  return { day, text: `DAY ${String(day).padStart(2, "0")} · ${minutes}:${seconds}` };
}

function updateHud() {
  const time = formatTime();
  const phase = GAME_CONFIG.campaign.phases[state.phaseId];
  if (!state.cleared && !state.defeated && isPhaseObjectiveComplete(regions, phase, PLAYER_FACTION_ID)) triggerClear();
  ui.gold.textContent = String(state.gold);
  ui.day.textContent = String(time.day).padStart(2, "0");
  ui.time.textContent = time.text;
  updateSpecialMoveHud();
  ui.pause.classList.toggle("is-paused", state.paused);
  ui.pause.textContent = state.paused ? "▶" : "Ⅱ";
  updateInvasionAlert();
  updateSelectedPanel();
}

function updateSpecialMoveHud() {
  if (!ui.specialMovePanel || !ui.specialMoveName || !ui.specialMoveUses || !ui.specialMoveButton) return;
  const specialMove = state.specialMove;
  ui.specialMoveName.textContent = specialMove?.name || "未設定";
  ui.specialMoveUses.textContent = String(state.specialMoveUsesRemaining);
  ui.specialMoveButton.disabled = !state.started || state.defeated || state.cleared || state.specialMoveUsesRemaining <= 0 || !specialMove;
  ui.specialMovePanel.classList.toggle("is-inactive", !state.started || !specialMove);
  ui.specialMoveButton.setAttribute("aria-label", specialMove ? `${specialMove.name}を使う` : "必殺技未設定");
}

function updateInvasionAlert() {
  if (!ui.invasionAlert) return;
  const warning = state.invasionWarning;
  ui.invasionAlert.classList.toggle("is-visible", Boolean(warning));
  if (!warning) {
    if (ui.invasionTarget) ui.invasionTarget.textContent = "";
    if (ui.invasionCountdown) ui.invasionCountdown.textContent = "";
    return;
  }

  const target = getRegion(warning.targetRegionId);
  if (ui.invasionTarget) ui.invasionTarget.textContent = target ? `${target.name}へ侵攻` : "";
  if (ui.invasionCountdown) ui.invasionCountdown.textContent = `${Math.max(1, Math.ceil(warning.remaining))}秒`;
}

function setupInitialUnits() {
  units.splice(0, units.length, ...initialUnits.map(cloneUnit));
  units.forEach((unit) => snapUnitToRoadNode(unit, unit.regionId));
  const reserveCount = state.upgrades.reserve;
  if (reserveCount > 0) {
    const source = initialUnits.find((unit) => unit.faction === PLAYER_FACTION_ID);
    const reserveUnitsPerLevel = SHOP_ITEMS.reserve?.unitsPerLevel || 1;
    for (let index = 0; index < reserveCount * reserveUnitsPerLevel; index += 1) {
      const reserve = {
        ...cloneUnit(source),
        id: `${PLAYER_FACTION_ID}-reserve-${index + 1}`,
      };
      snapUnitToRoadNode(reserve, reserve.regionId);
      units.push(reserve);
    }
  }
  applyArmorUpgrade();
}

function currentRewardProgress() {
  return { ...state.runProgress, elapsedSeconds: state.elapsed };
}

function grantGold(amount) {
  const reward = Math.max(0, Math.floor(Number(amount) || 0));
  if (reward === 0) return 0;

  state.gold += reward;
  savePersistentProgress();
  ui.gold.textContent = String(state.gold);
  updateShopDialog();
  return reward;
}

function triggerDefeat() {
  if (state.defeated || state.cleared) return;
  state.defeated = true;
  state.paused = true;
  const reward = grantGold(calculateDefeatGold(currentRewardProgress(), ECONOMY_BALANCE.rewards));
  ui.defeatReward.textContent = reward > 0 ? `+${reward} GOLD` : "今回の救済Goldはありません";
  ui.defeatDialog?.showModal();
}

function triggerClear() {
  if (state.cleared || state.defeated) return;

  const newlyCollectedCountryIds = collectNewCountryFlags();
  const nextPhaseId = getNextPhaseId(GAME_CONFIG.campaign, selectedFrontId, state.phaseId);
  if (nextPhaseId) {
    transitionToPhase(nextPhaseId);
    showToast("PHASE COMPLETE — NEXT LINE ENGAGED");
    addEvent("The enemy front was reset and the next phase began.");
    if (newlyCollectedCountryIds.length > 0) announceCollectedCountryFlags(newlyCollectedCountryIds);
    updateHud();
    render();
    return;
  }

  state.cleared = true;
  state.paused = true;
  const front = getSelectedFront();
  const completedCountryIds = getCompletedCountryIds(regions, GAME_CONFIG.countries, PLAYER_FACTION_ID);
  state.campaign = {
    ...state.campaign,
    completedCountryIds: [...new Set([...state.campaign.completedCountryIds, ...completedCountryIds, ...front.targetCountryIds])].sort(),
    completedFrontIds: [...new Set([...(state.campaign.completedFrontIds || []), front.id])].sort(),
    lastCompletedFrontId: front.id,
  };
  savePersistentProgress();
  if (newlyCollectedCountryIds.length > 0) announceCollectedCountryFlags(newlyCollectedCountryIds);
  const reward = grantGold(calculateClearGold(currentRewardProgress(), ECONOMY_BALANCE.rewards));
  ui.clearReward.textContent = `+${reward} GOLD`;
  ui.clearDialog?.showModal();
}

function restartGame({ announce = true } = {}) {
  resetRuntimeToPhase(getFirstPhaseId(GAME_CONFIG.campaign, selectedFrontId));
  setupInitialUnits();
  state.zoom = 1;
  state.panX = 0;
  state.panY = 0;
  state.paused = !state.specialMove;
  state.speed = 1;
  state.elapsed = 0;
  state.selectedRegionId = null;
  state.aiTimers = createAiFactionState(getActiveAiBalance().initialDelaySeconds);
  state.aiReinforcements = createAiFactionState(getActiveAiBalance().reinforcementLimit);
  state.invasionWarning = null;
  state.runProgress = createRunProgress();
  state.recoveryTimer = 0;
  state.toastTimer = 0;
  state.specialMoveUsesRemaining = state.specialMove ? getActiveDifficulty().specialMoveUsesPerOperation : 0;
  state.invincibilityRemaining = 0;
  state.defeated = false;
  state.cleared = false;
  state.started = Boolean(state.specialMove);
  state.shopOpen = false;
  state.battles.clear();
  state.suppressNextClick = false;
  dragState.active = false;
  dragState.sourceUnit = null;
  dragState.currentPoint = null;
  dragState.targetRegion = null;
  dragState.invalidTarget = false;
  dragState.moved = false;
  dragState.pointerId = null;
  ui.eventFeed.replaceChildren();
  ui.dispatchHint.classList.remove("is-hidden");
  ui.defeatDialog?.close();
  ui.clearDialog?.close();
  hideSpecialMoveCutIn();
  lastTime = performance.now();
  updateHud();
  render();
  if (announce && state.started) showToast("新しい作戦を開始しました");
}

function getUpgradePrice(key) {
  const item = SHOP_ITEMS[key];
  const level = Number(state.upgrades[key]) || 0;
  if (!item) return Number.MAX_SAFE_INTEGER;
  return Math.min(ECONOMY_BALANCE.upgradePriceCap, Math.ceil((item.basePrice * ECONOMY_BALANCE.upgradePriceGrowth ** level) / ECONOMY_BALANCE.upgradePriceStep) * ECONOMY_BALANCE.upgradePriceStep);
}

function updateShopDialog() {
  if (!ui.shopGold) return;
  ui.shopGold.textContent = String(state.gold);
  ui.shopButtons.forEach((button) => {
    const key = button.dataset.shopUpgrade;
    const item = SHOP_ITEMS[key];
    if (!item) return;
    const level = Number(state.upgrades[key]) || 0;
    const cap = getDifficultyUpgradeCap(key);
    const price = getUpgradePrice(key);
    const unaffordable = state.gold < price;
    const capped = level >= cap;
    button.disabled = unaffordable || capped;
    button.textContent = capped ? "上限" : `${price} Gold`;
    const card = button.closest("[data-shop-card]");
    card?.classList.toggle("is-purchased", level > 0);
    card?.classList.toggle("is-unaffordable", unaffordable);
    card?.classList.toggle("is-capped", capped);
    const levelLabel = card?.querySelector("[data-shop-level]");
    if (levelLabel) levelLabel.textContent = `Lv.${level} / ${cap}`;
  });
}

function purchaseUpgrade(key) {
  const item = SHOP_ITEMS[key];
  if (!item) return;
  const level = Number(state.upgrades[key]) || 0;
  const cap = getDifficultyUpgradeCap(key);
  if (level >= cap) {
    showToast(`${item.label}は難易度「${getActiveDifficulty().label}」の上限です`);
    return;
  }
  const price = getUpgradePrice(key);
  if (state.gold < price) {
    showToast("Goldが不足しています");
    return;
  }

  state.gold -= price;
  state.upgrades[key] = level + 1;
  savePersistentProgress();
  if (key === "armor") applyArmorUpgrade();
  updateShopDialog();
  updateHud();
  showToast(`${item.label}をLv.${level + 1}に強化しました`);
}

function openShop() {
  if (!ui.shopDialog) return;
  state.shopWasPaused = state.paused;
  state.shopOpen = true;
  state.paused = true;
  updateShopDialog();
  ui.shopDialog.showModal();
  updateHud();
}

function finishShop() {
  if (!state.shopOpen) return;
  state.shopOpen = false;
  state.paused = state.shopWasPaused;
  updateHud();
}

function openTitleScreen() {
  state.started = false;
  state.paused = true;
  updateFlagCollectionDialog();
  if (!ui.titleDialog || ui.titleDialog.open) return;
  ui.titleDialog.showModal();
  requestAnimationFrame(() => ui.titleStart?.focus());
}

function closeTitleScreen() {
  ui.titleDialog?.close();
}

function getFrontDisplayName(front) {
  return front?.name || (front?.mapId === GAME_CONFIG.map.id ? GAME_CONFIG.map.name : front?.mapId || "未設定のマップ");
}

function getFrontTargetNames(front) {
  return (front?.targetCountryIds || [])
    .map((countryId) => GAME_CONFIG.countries[countryId])
    .filter(Boolean)
    .map(countryDisplayName)
    .join("・");
}

function updateDifficultySelectionDialog() {
  if (!ui.difficultySelectionGrid) return;
  ui.difficultySelectionGrid.replaceChildren();
  DIFFICULTY_IDS.forEach((difficultyId) => {
    const profile = getDifficultyProfile(difficultyId);
    const card = document.createElement("button");
    card.type = "button";
    card.className = [
      "difficulty-selection-card",
      state.campaign.difficultyId === difficultyId ? "is-selected" : "",
    ].filter(Boolean).join(" ");
    card.dataset.difficultyId = difficultyId;

    const label = document.createElement("strong");
    label.className = "difficulty-selection-card-label";
    label.textContent = profile.label;
    const description = document.createElement("span");
    description.className = "difficulty-selection-card-description";
    description.textContent = profile.description;
    const details = document.createElement("span");
    details.className = "difficulty-selection-card-details";
    details.textContent = `敵戦力 ×${profile.enemyStrengthMultiplier} ・ 必殺技 ${profile.specialMoveUsesPerOperation}回`;
    card.append(label, description, details);
    ui.difficultySelectionGrid.append(card);
  });
}

function updateMapSelectionDialog() {
  if (!ui.mapSelectionGrid) return;

  const entries = getFrontSelectionEntries(GAME_CONFIG.campaign, state.campaign).filter((entry) => entry.front);
  ui.mapSelectionGrid.replaceChildren();
  if (ui.mapSelectionDifficulty) {
    const profile = getActiveDifficulty();
    ui.mapSelectionDifficulty.textContent = `難易度：${profile.label}　敵戦力 ×${profile.enemyStrengthMultiplier}　必殺技 ${profile.specialMoveUsesPerOperation}回`;
  }
  if (ui.mapSelectionSummary) {
    const unlockedCount = entries.filter((entry) => entry.unlocked).length;
    ui.mapSelectionSummary.textContent = `${unlockedCount} / ${entries.length} マップを選択可能`;
  }

  entries.forEach(({ frontId, front, index, completed, unlocked }) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = [
      "map-selection-card",
      selectedFrontId === frontId ? "is-selected" : "",
      completed ? "is-completed" : "",
      !unlocked ? "is-locked" : "",
    ].filter(Boolean).join(" ");
    card.dataset.frontId = frontId;
    card.disabled = !unlocked;

    const header = document.createElement("span");
    header.className = "map-selection-card-header";
    const number = document.createElement("span");
    number.className = "map-selection-card-number";
    number.textContent = String(index + 1).padStart(2, "0");
    const status = document.createElement("span");
    status.className = "map-selection-card-status";
    status.textContent = completed ? "クリア済み" : unlocked ? "選択可能" : "ロック中";
    header.append(number, status);

    const title = document.createElement("strong");
    title.className = "map-selection-card-title";
    title.textContent = getFrontDisplayName(front);

    const target = document.createElement("span");
    target.className = "map-selection-card-target";
    target.textContent = getFrontTargetNames(front) || "対象国データ準備中";

    const footer = document.createElement("span");
    footer.className = "map-selection-card-footer";
    footer.textContent = `${front.phaseIds?.length || 0}局面 ・ ${front.type === "regionalSmall" ? "小国マップ" : "マップ"}`;

    card.append(header, title, target, footer);
    ui.mapSelectionGrid.append(card);
  });

  if (entries.length === 0) {
    const empty = document.createElement("p");
    empty.className = "map-selection-empty";
    empty.textContent = "選択できるマップがありません。";
    ui.mapSelectionGrid.append(empty);
  }
}

let returnToTitleAfterMapSelection = false;
let suppressMapSelectionRestore = false;
let suppressDifficultySelectionRestore = false;

function openDifficultySelection() {
  if (!ui.difficultySelectionDialog) {
    openMapSelection({ returnToTitle: true });
    return;
  }

  state.started = false;
  state.paused = true;
  updateDifficultySelectionDialog();
  if (ui.titleDialog?.open) ui.titleDialog.close();
  try {
    ui.difficultySelectionDialog.showModal();
  } catch {
    openTitleScreen();
    return;
  }
  requestAnimationFrame(() => ui.difficultySelectionGrid?.querySelector("[data-difficulty-id]")?.focus());
}

function restoreTitleAfterDifficultySelection() {
  if (suppressDifficultySelectionRestore) {
    suppressDifficultySelectionRestore = false;
    return;
  }
  openTitleScreen();
}

function handleDifficultySelectionClick(event) {
  const card = event.target?.closest?.("[data-difficulty-id]");
  if (!card || !DIFFICULTY_IDS.includes(card.dataset.difficultyId)) return;

  state.campaign = {
    ...state.campaign,
    difficultyId: card.dataset.difficultyId,
    difficultyLocked: true,
  };
  savePersistentProgress();
  suppressDifficultySelectionRestore = true;
  ui.difficultySelectionDialog?.close();
  openMapSelection({ returnToTitle: true });
}

function openMapSelection({ returnToTitle = true } = {}) {
  if (!ui.mapSelectionDialog) return;

  state.started = false;
  state.paused = true;
  returnToTitleAfterMapSelection = returnToTitle;
  updateMapSelectionDialog();
  if (ui.titleDialog?.open) ui.titleDialog.close();
  if (ui.clearDialog?.open) ui.clearDialog.close();

  try {
    ui.mapSelectionDialog.showModal();
  } catch {
    returnToTitleAfterMapSelection = false;
    openTitleScreen();
    return;
  }
  requestAnimationFrame(() => ui.mapSelectionGrid?.querySelector(".map-selection-card:not(:disabled)")?.focus());
}

function restoreTitleAfterMapSelection() {
  if (suppressMapSelectionRestore) {
    suppressMapSelectionRestore = false;
    return;
  }

  const shouldReturnToTitle = returnToTitleAfterMapSelection;
  returnToTitleAfterMapSelection = false;
  if (!shouldReturnToTitle || state.started || ui.specialMoveDialog?.open) return;
  openTitleScreen();
}

function handleMapSelectionClick(event) {
  const card = event.target?.closest?.("[data-front-id]");
  if (!card || card.disabled) return;

  const entry = getFrontSelectionEntries(GAME_CONFIG.campaign, state.campaign)
    .find((candidate) => candidate.frontId === card.dataset.frontId);
  if (!entry?.front || !entry.unlocked) return;

  selectedFrontId = entry.frontId;
  applyConfiguredDisplayNames();
  suppressMapSelectionRestore = true;
  ui.mapSelectionDialog?.close();
  if (!state.specialMove) {
    openSpecialMoveSetup();
    return;
  }
  restartGame();
  closeTitleScreen();
}

let specialMoveSetupDefaultName = "";
let returnToTitleAfterFlagCollection = false;
let returnToFlagCollectionAfterCountryDetail = false;
let returnToTitleAfterCountryDetail = false;
let suppressFlagCollectionRestore = false;
let activeCountryDetailId = null;
let countryWorldMapPromise = null;

function openFlagCollection({ returnToTitle = Boolean(ui.titleDialog?.open) } = {}) {
  if (!ui.flagCollectionDialog || ui.flagCollectionDialog.open) return;

  updateFlagCollectionDialog();
  returnToTitleAfterFlagCollection = returnToTitle;
  if (ui.titleDialog?.open) ui.titleDialog.close();

  try {
    ui.flagCollectionDialog.showModal();
  } catch {
    returnToTitleAfterFlagCollection = false;
    openTitleScreen();
    return;
  }
  requestAnimationFrame(() => ui.flagCollectionDialog.querySelector(".dialog-close")?.focus());
}

function restoreTitleAfterFlagCollection() {
  if (suppressFlagCollectionRestore) {
    suppressFlagCollectionRestore = false;
    return;
  }

  const shouldReturnToTitle = returnToTitleAfterFlagCollection;
  returnToTitleAfterFlagCollection = false;
  if (!shouldReturnToTitle || state.started) return;

  openTitleScreen();
  requestAnimationFrame(() => ui.flagCollectionButton?.focus());
}

function renderCountryCharacter(country) {
  if (!ui.countryDetailCharacter) return;

  const spriteSource = getCharacterSpriteSource(country.id, GAME_CONFIG.characters);
  const isEquipped = state.equippedCharacterId === country.id;
  ui.countryDetailCharacter.className = "country-character-preview";
  ui.countryDetailCharacter.replaceChildren();
  ui.countryDetailCharacter.setAttribute("aria-hidden", String(!spriteSource));

  if (ui.countryDetailCharacterEquip) {
    ui.countryDetailCharacterEquip.disabled = !spriteSource || isEquipped;
    ui.countryDetailCharacterEquip.textContent = isEquipped ? "装着中" : "着替え";
    ui.countryDetailCharacterEquip.setAttribute("aria-pressed", String(isEquipped));
    ui.countryDetailCharacterEquip.title = isEquipped
      ? "現在このキャラクターを装着中です"
      : spriteSource
        ? "プレイヤーキャラクターをこの絵に着替えます"
        : "この国のキャラクター画像は未登録です";
  }
  if (ui.countryDetailCharacterReset) {
    ui.countryDetailCharacterReset.disabled = !state.equippedCharacterId;
    ui.countryDetailCharacterReset.title = state.equippedCharacterId
      ? "標準の自軍キャラクターに戻します"
      : "標準の自軍キャラクターを使用中です";
  }

  if (!spriteSource) {
    ui.countryDetailCharacter.classList.add("is-unavailable");
    const message = document.createElement("span");
    message.textContent = "キャラクター画像未登録";
    ui.countryDetailCharacter.append(message);
    return;
  }

  ui.countryDetailCharacter.classList.add("has-sprite");
  const image = document.createElement("img");
  image.src = spriteSource;
  image.alt = `${countryDisplayName(country)}のキャラクター`;
  ui.countryDetailCharacter.append(image);
}

function equipCountryCharacter() {
  const country = GAME_CONFIG.countries[activeCountryDetailId];
  if (!country || !getCharacterSpriteSource(country.id, GAME_CONFIG.characters)) return;

  state.equippedCharacterId = country.id;
  savePersistentProgress();
  renderCountryCharacter(country);
  render();
  showToast(`${countryDisplayName(country)}に着替えました`);
}

function resetCountryCharacter() {
  if (!state.equippedCharacterId) return;

  state.equippedCharacterId = null;
  savePersistentProgress();
  const country = GAME_CONFIG.countries[activeCountryDetailId];
  if (country) renderCountryCharacter(country);
  render();
  showToast("標準の自軍キャラクターに戻しました");
}

function renderCountryDetailSources(country) {
  if (!ui.countryDetailSources) return;
  const fragment = document.createDocumentFragment();
  country.sources.forEach((source) => {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = source.url;
    link.target = "_blank";
    link.rel = "noreferrer noopener";
    link.textContent = source.label;
    item.append(link);
    fragment.append(item);
  });
  ui.countryDetailSources.replaceChildren(fragment);
}

function renderCountryDetail(country) {
  const collected = new Set(state.campaign.collectedCountryIds || []).has(country.id);
  if (ui.countryDetailName) ui.countryDetailName.textContent = countryDisplayName(country);
  if (ui.countryDetailEnglishName) ui.countryDetailEnglishName.textContent = country.name;
  if (ui.countryDetailFlag) {
    renderCountryFlag(country, ui.countryDetailFlag);
  }
  if (ui.countryDetailStatus) {
    ui.countryDetailStatus.textContent = collected ? "獲得済み" : "未獲得";
    ui.countryDetailStatus.classList.toggle("is-uncollected", !collected);
  }
  if (ui.countryDetailOverview) ui.countryDetailOverview.textContent = country.overview;
  if (ui.countryDetailLocation) ui.countryDetailLocation.textContent = `${country.location.region}。${country.location.description}`;
  if (ui.countryDetailFlagOrigin) ui.countryDetailFlagOrigin.textContent = getCountryFlagOrigin(country);
  if (ui.countryDetailTrivia) {
    const fragment = document.createDocumentFragment();
    country.trivia.forEach((trivia) => {
      const item = document.createElement("li");
      item.textContent = trivia;
      fragment.append(item);
    });
    ui.countryDetailTrivia.replaceChildren(fragment);
  }
  renderCountryCharacter(country);
  renderCountryDetailSources(country);
}

function setCountryDetailMapMessage(message) {
  if (!ui.countryDetailMap) return;
  ui.countryDetailMap.classList.add("is-loading");
  ui.countryDetailMap.setAttribute("aria-label", message);
  ui.countryDetailMap.textContent = message;
}

function renderCountryWorldMap(country, worldGeoJson) {
  if (!ui.countryDetailMap) return;
  const mapData = getCountryWorldMapData(worldGeoJson, country.isoA3);
  const svgNamespace = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNamespace, "svg");
  svg.setAttribute("viewBox", mapData.viewBox);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", `${countryDisplayName(country)}の実際の地図上の位置`);
  ui.countryDetailMap.setAttribute("aria-label", `${countryDisplayName(country)}の実際の地図上の位置`);

  const ocean = document.createElementNS(svgNamespace, "rect");
  ocean.setAttribute("width", "360");
  ocean.setAttribute("height", "180");
  ocean.setAttribute("fill", "#eaf2fa");
  svg.append(ocean);

  mapData.paths.forEach(({ path, selected }) => {
    const shape = document.createElementNS(svgNamespace, "path");
    shape.setAttribute("class", `country-world-land${selected ? " is-selected" : ""}`);
    shape.setAttribute("d", path);
    svg.append(shape);
  });

  const markerPoint = projectWorldMapPoint(mapData.selectedPoint);
  if (markerPoint) {
    const marker = document.createElementNS(svgNamespace, "circle");
    marker.classList.add("country-world-marker");
    marker.setAttribute("cx", markerPoint[0].toFixed(2));
    marker.setAttribute("cy", markerPoint[1].toFixed(2));
    marker.setAttribute("r", "2.8");
    svg.append(marker);
  }

  ui.countryDetailMap.classList.remove("is-loading");
  ui.countryDetailMap.replaceChildren(svg);
}

function loadCountryWorldMap() {
  if (!countryWorldMapPromise) {
    countryWorldMapPromise = fetch("./src/config/geodata/ne_110m_admin_0_countries.geojson")
      .then((response) => {
        if (!response.ok) throw new Error(`Country world map request failed: ${response.status}`);
        return response.json();
      });
  }
  return countryWorldMapPromise;
}

async function updateCountryDetailMap(country) {
  setCountryDetailMapMessage("地図を読み込んでいます…");
  try {
    const worldGeoJson = await loadCountryWorldMap();
    if (activeCountryDetailId !== country.id) return;
    renderCountryWorldMap(country, worldGeoJson);
  } catch {
    if (activeCountryDetailId !== country.id) return;
    setCountryDetailMapMessage("地図を表示できませんでした。");
  }
}

function openCountryDetail(countryId) {
  const country = GAME_CONFIG.countries[countryId];
  if (!country || !ui.countryDetailDialog || ui.countryDetailDialog.open) return;

  activeCountryDetailId = country.id;
  returnToFlagCollectionAfterCountryDetail = Boolean(ui.flagCollectionDialog?.open);
  returnToTitleAfterCountryDetail = returnToTitleAfterFlagCollection;
  renderCountryDetail(country);

  if (returnToFlagCollectionAfterCountryDetail) {
    suppressFlagCollectionRestore = true;
    ui.flagCollectionDialog.close();
  }

  try {
    ui.countryDetailDialog.showModal();
  } catch {
    activeCountryDetailId = null;
    if (returnToFlagCollectionAfterCountryDetail) {
      returnToFlagCollectionAfterCountryDetail = false;
      openFlagCollection({ returnToTitle: returnToTitleAfterCountryDetail });
    }
    return;
  }
  requestAnimationFrame(() => ui.countryDetailBack?.focus());
  updateCountryDetailMap(country);
}

function restoreFlagCollectionAfterCountryDetail() {
  activeCountryDetailId = null;
  const shouldReturnToCollection = returnToFlagCollectionAfterCountryDetail;
  const shouldReturnToTitle = returnToTitleAfterCountryDetail;
  returnToFlagCollectionAfterCountryDetail = false;
  returnToTitleAfterCountryDetail = false;
  if (!shouldReturnToCollection) return;

  openFlagCollection({ returnToTitle: shouldReturnToTitle });
}

function handleFlagCollectionClick(event) {
  const item = event.target?.closest?.("[data-country-id]");
  if (!item) return;
  openCountryDetail(item.dataset.countryId);
}

function selectedSpecialMoveType() {
  return document.querySelector('input[name="specialMoveType"]:checked')?.value || "enemyWeakness";
}

function updateSpecialMoveSetupName({ force = false } = {}) {
  const type = selectedSpecialMoveType();
  const config = getSpecialMoveConfig(type, SPECIAL_MOVE_BALANCE);
  if (!config || !ui.specialMoveNameInput) return;
  if (force || !ui.specialMoveNameInput.value.trim() || ui.specialMoveNameInput.value.trim() === specialMoveSetupDefaultName) {
    ui.specialMoveNameInput.value = config.defaultName;
  }
  specialMoveSetupDefaultName = config.defaultName;
}

function openSpecialMoveSetup() {
  if (!ui.specialMoveDialog || ui.specialMoveDialog.open) return;
  const currentType = state.specialMove?.type || "enemyWeakness";
  const typeInput = document.querySelector(`input[name="specialMoveType"][value="${currentType}"]`);
  if (typeInput) typeInput.checked = true;
  updateSpecialMoveSetupName({ force: true });
  if (ui.specialMoveError) ui.specialMoveError.textContent = "";
  ui.specialMoveDialog.showModal();
  requestAnimationFrame(() => ui.specialMoveNameInput?.focus());
}

function confirmSpecialMoveSetup(event) {
  event.preventDefault();
  const settings = createSpecialMoveSettings(
    selectedSpecialMoveType(),
    ui.specialMoveNameInput?.value,
    SPECIAL_MOVE_BALANCE,
  );
  if (!settings) {
    if (ui.specialMoveError) ui.specialMoveError.textContent = "必殺技の種類を選択してください。";
    return;
  }

  state.specialMove = saveSpecialMove(undefined, settings, SPECIAL_MOVE_BALANCE);
  ui.specialMoveDialog?.close();
  restartGame();
  closeTitleScreen();
}

function startFromTitle() {
  if (state.campaign.difficultyLocked) openMapSelection({ returnToTitle: true });
  else openDifficultySelection();
}

function openDataResetDialog() {
  if (!ui.dataResetDialog || ui.dataResetDialog.open) return;
  ui.dataResetDialog.showModal();
  requestAnimationFrame(() => ui.cancelDataReset?.focus());
}

function closeDataResetDialog(nextFocus = ui.titleReset) {
  if (ui.dataResetDialog?.open) ui.dataResetDialog.close();
  requestAnimationFrame(() => nextFocus?.focus());
}

function confirmPersistentDataReset() {
  const clean = resetPersistentState(undefined, upgradeKeys);
  state.gold = clean.gold;
  state.upgrades = clean.upgrades;
  state.campaign = clean.campaign;
  state.equippedCharacterId = null;
  state.specialMove = null;
  restartGame({ announce: false });
  updateShopDialog();
  updateFlagCollectionDialog();
  updateHud();
  render();
  if (ui.titleMessage) ui.titleMessage.textContent = "データをリセットしました。";
  closeDataResetDialog();
  requestAnimationFrame(() => openSpecialMoveSetup());
}

function unitAtScreenPoint(x, y) {
  const point = worldPointFromScreen(x, y);
  return units
    .filter((unit) => unit.faction === PLAYER_FACTION_ID)
    .map((unit) => ({ unit, distance: distance(unit, { x: point[0], y: point[1] }) }))
    .filter((entry) => entry.distance < MOVEMENT_BALANCE.unitSelectionRadius)
    .sort((left, right) => left.distance - right.distance)[0]?.unit || null;
}

function mapPointFromPointer(event) {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const point = worldPointFromScreen(x, y);
  return { x: point[0], y: point[1], screenX: x, screenY: y };
}

function canDispatchToRegion(unit, targetRegion) {
  return hasRoadPath(regionForUnit(unit), targetRegion);
}

function beginDispatch(event) {
  if (event.pointerType === "mouse" && event.button !== 0) return;
  const point = mapPointFromPointer(event);
  const sourceUnit = unitAtScreenPoint(point.screenX, point.screenY);
  if (!sourceUnit) return;

  dragState.active = true;
  dragState.sourceUnit = sourceUnit;
  dragState.currentPoint = { x: point.x, y: point.y };
  dragState.targetRegion = null;
  dragState.invalidTarget = false;
  dragState.moved = false;
  dragState.pointerId = event.pointerId;
  canvas.setPointerCapture?.(event.pointerId);
  render();
}

function updateDispatch(event) {
  if (!dragState.active || event.pointerId !== dragState.pointerId) return;
  const point = mapPointFromPointer(event);
  dragState.currentPoint = { x: point.x, y: point.y };
  dragState.moved = dragState.moved || distance(dragState.sourceUnit, point) > MOVEMENT_BALANCE.dispatchDragDistance;
  const candidate = regionAtWorldPoint([point.x, point.y]);
  dragState.targetRegion = candidate && canDispatchToRegion(dragState.sourceUnit, candidate) ? candidate : null;
  dragState.invalidTarget = Boolean(candidate && !dragState.targetRegion);
  render();
}

function dispatchUnitToRegion(unit, region) {
  if (unit.inBattle) {
    showToast("戦闘中の部隊は移動できません");
    return false;
  }

  const sourceRegion = regionForUnit(unit);
  if (!hasRoadPath(sourceRegion, region)) {
    showToast("道路でつながった領土にのみ派遣できます");
    return false;
  }

  if (!setUnitRoute(unit, sourceRegion.id, region.id)) {
    showToast("この領土への道路がありません");
    return false;
  }

  cancelOccupationForUnit(unit);
  unit.targetRegionId = region.id;
  unit.arrived = false;
  unit.stationCenter = null;
  unit.arrivalResolved = false;
  ui.dispatchHint.classList.add("is-hidden");
  addEvent(`白い部隊が${region.shortName}へ移動を開始しました`);
  return true;
}

function endDispatch(event) {
  if (!dragState.active || event.pointerId !== dragState.pointerId) return;
  const sourceUnit = dragState.sourceUnit;
  const targetRegion = dragState.targetRegion;
  const wasDrag = dragState.moved;
  dragState.active = false;
  dragState.sourceUnit = null;
  dragState.currentPoint = null;
  dragState.targetRegion = null;
  const invalidTarget = dragState.invalidTarget;
  dragState.invalidTarget = false;
  dragState.pointerId = null;
  canvas.releasePointerCapture?.(event.pointerId);

  if (wasDrag) {
    state.suppressNextClick = true;
    if (targetRegion) dispatchUnitToRegion(sourceUnit, targetRegion);
    else if (invalidTarget) showToast("道路でつながった領土にのみ派遣できます");
    else showToast("目的地の領土の上で指を離してください");
    updateSelectedPanel();
    render();
  }
}

function handleMapClick(event) {
  if (state.suppressNextClick) {
    state.suppressNextClick = false;
    return;
  }
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const point = worldPointFromScreen(x, y);
  const clicked = regionAtWorldPoint(point);
  selectRegion(clicked || null);
  if (clicked) showToast(`${clicked.name}を選択しました`);
}

function setZoom(nextZoom) {
  state.zoom = clamp(nextZoom, 0.82, 1.42);
  render();
}

function loop(now) {
  const rawDt = Math.max(0, (now - lastTime) / 1000);
  const dt = Math.min(rawDt, CLOCK_BALANCE.maxFrameDeltaSeconds);
  lastTime = now;
  if (state.started && !state.paused) update(dt);
  render();
  updateHud();
  requestAnimationFrame(loop);
}

ui.pause.addEventListener("click", () => {
  state.paused = !state.paused;
  showToast(state.paused ? "シミュレーションを一時停止しました" : "シミュレーションを再開しました");
});

document.querySelectorAll("[data-speed]").forEach((button) => {
  button.addEventListener("click", () => {
    state.speed = Number(button.dataset.speed);
    document.querySelectorAll("[data-speed]").forEach((candidate) => candidate.classList.toggle("is-active", candidate === button));
    showToast(`ゲーム速度を×${state.speed}に変更しました`);
  });
});

canvas.addEventListener("pointerdown", beginDispatch);
canvas.addEventListener("pointermove", updateDispatch);
canvas.addEventListener("pointerup", endDispatch);
canvas.addEventListener("pointercancel", endDispatch);
canvas.addEventListener("click", handleMapClick);
window.addEventListener("resize", () => {
  resizeCanvas();
  render();
});

document.querySelector("#zoomInButton").addEventListener("click", () => setZoom(state.zoom + 0.12));
document.querySelector("#zoomOutButton").addEventListener("click", () => setZoom(state.zoom - 0.12));
ui.territoryClose?.addEventListener("click", () => selectRegion(null));

document.querySelector("#shopButton").addEventListener("click", openShop);
ui.shopButtons.forEach((button) => {
  button.addEventListener("click", () => purchaseUpgrade(button.dataset.shopUpgrade));
});
document.querySelector("#shopCloseButton").addEventListener("click", () => ui.shopDialog.close());
ui.shopDialog?.addEventListener("close", finishShop);

const settingsDialog = document.querySelector("#settingsDialog");
document.querySelector("#settingsButton").addEventListener("click", () => settingsDialog.showModal());
document.querySelector("#restartButton").addEventListener("click", restartGame);
document.querySelector("#clearRestartButton").addEventListener("click", () => openMapSelection({ returnToTitle: true }));
ui.titleStart?.addEventListener("click", startFromTitle);
ui.titleReset?.addEventListener("click", openDataResetDialog);
ui.difficultySelectionGrid?.addEventListener("click", handleDifficultySelectionClick);
ui.difficultySelectionBack?.addEventListener("click", () => ui.difficultySelectionDialog?.close());
ui.difficultySelectionDialog?.addEventListener("close", restoreTitleAfterDifficultySelection);
ui.difficultySelectionDialog?.addEventListener("cancel", (event) => {
  event.preventDefault();
  ui.difficultySelectionDialog.close();
});
ui.mapSelectionGrid?.addEventListener("click", handleMapSelectionClick);
ui.mapSelectionBack?.addEventListener("click", () => ui.mapSelectionDialog?.close());
ui.mapSelectionDialog?.addEventListener("close", restoreTitleAfterMapSelection);
ui.mapSelectionDialog?.addEventListener("cancel", (event) => {
  event.preventDefault();
  ui.mapSelectionDialog.close();
});
ui.flagCollectionButton?.addEventListener("click", openFlagCollection);
ui.flagCollectionGrid?.addEventListener("click", handleFlagCollectionClick);
ui.flagCollectionDialog?.addEventListener("close", restoreTitleAfterFlagCollection);
ui.flagCollectionDialog?.addEventListener("cancel", (event) => {
  event.preventDefault();
  ui.flagCollectionDialog.close();
});
ui.countryDetailBack?.addEventListener("click", () => ui.countryDetailDialog?.close());
ui.countryDetailCharacterEquip?.addEventListener("click", equipCountryCharacter);
ui.countryDetailCharacterReset?.addEventListener("click", resetCountryCharacter);
ui.countryDetailDialog?.addEventListener("close", restoreFlagCollectionAfterCountryDetail);
ui.countryDetailDialog?.addEventListener("cancel", (event) => {
  event.preventDefault();
  ui.countryDetailDialog.close();
});
ui.specialMoveButton?.addEventListener("click", useSpecialMove);
ui.specialMoveForm?.addEventListener("submit", confirmSpecialMoveSetup);
document.querySelectorAll('input[name="specialMoveType"]').forEach((input) => {
  input.addEventListener("change", () => updateSpecialMoveSetupName());
});
ui.titleDialog?.addEventListener("cancel", (event) => event.preventDefault());
ui.cancelDataReset?.addEventListener("click", () => closeDataResetDialog());
ui.confirmDataReset?.addEventListener("click", confirmPersistentDataReset);
ui.dataResetDialog?.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeDataResetDialog();
});
ui.dataResetDialog?.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  event.preventDefault();
  closeDataResetDialog();
});
ui.defeatDialog?.addEventListener("cancel", (event) => event.preventDefault());
ui.clearDialog?.addEventListener("cancel", (event) => event.preventDefault());
ui.specialMoveDialog?.addEventListener("cancel", (event) => event.preventDefault());
document.querySelector("#eventToggle").addEventListener("change", (event) => { state.eventNotice = event.target.checked; });
document.querySelector("#motionToggle").addEventListener("change", (event) => { state.motion = event.target.checked; });

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js", { scope: "./" }).catch(() => {
      // The game remains fully playable when service workers are unavailable.
    });
  }, { once: true });
}

applyConfiguredDisplayNames();
setupInitialUnits();
updateShopDialog();
updateFlagCollectionDialog();
resizeCanvas();
updateSelectedPanel();
updateHud();
openTitleScreen();
registerServiceWorker();
requestAnimationFrame(loop);
