const canvas = document.querySelector("#mapCanvas");
const ctx = canvas.getContext("2d");
const stage = document.querySelector("#gameStage");

const ui = {
  progress: document.querySelector("#progressValue"),
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
  intel: document.querySelector("#intelValue"),
  defeatDialog: document.querySelector("#defeatDialog"),
  defeatReward: document.querySelector("#defeatReward"),
  clearDialog: document.querySelector("#clearDialog"),
  shopDialog: document.querySelector("#shopDialog"),
  shopGold: document.querySelector("#shopGoldValue"),
  shopButtons: document.querySelectorAll("[data-shop-upgrade]"),
  attackGuide: document.querySelector("#attackGuide"),
  attackTarget: document.querySelector("#attackTarget"),
  occupation: document.querySelector("#selectedOccupation"),
  invasionAlert: document.querySelector("#invasionAlert"),
  invasionTarget: document.querySelector("#invasionTarget"),
  invasionCountdown: document.querySelector("#invasionCountdown"),
};

const COLORS = {
  blue: {
    territory: "#f7f9fb",
    territoryDark: "#d4dce7",
    unit: "#f2f5f8",
    accent: "#263751",
    flag: "#d94f58",
  },
  red: {
    territory: "#e15a5b",
    territoryDark: "#b93d4b",
    unit: "#d53646",
    accent: "#ffe0d8",
    flag: "#c84349",
  },
  neutral: {
    territory: "#c9d1dd",
    territoryDark: "#9eaabd",
    unit: "#eef2f6",
    accent: "#7b8798",
    flag: "#8b98aa",
  },
  pink: {
    territory: "#f2b6ba",
    territoryDark: "#d78891",
    unit: "#f3f1eb",
    accent: "#df4754",
    flag: "#e0737b",
  },
};

const GOLD_STORAGE_KEY = "countryfronts.gold";
const UPGRADES_STORAGE_KEY = "countryfronts.upgrades";
const DEFEAT_GOLD_REWARD = 100;
const AI_REINFORCEMENT_LIMIT = 5;
const AI_ACTIVE_UNIT_LIMIT = 5;
const INVASION_WARNING_DURATION = 5;
const OCCUPATION_DURATION = 5;
const BATTLE_DISTANCE = 0.055;
const BATTLE_TICK_INTERVAL = 0.72;
const SHOP_ITEMS = {
  logistics: { basePrice: 100, label: "兵站網" },
  armor: { basePrice: 100, label: "強化装甲" },
  reserve: { basePrice: 150, label: "予備部隊" },
};

function loadGold() {
  try {
    return Math.max(0, Number(window.localStorage.getItem(GOLD_STORAGE_KEY)) || 0);
  } catch {
    return 0;
  }
}

function saveGold() {
  try {
    window.localStorage.setItem(GOLD_STORAGE_KEY, String(state.gold));
  } catch {
    // Local storage may be unavailable in private browsing; the session still works.
  }
}

function loadUpgrades() {
  const empty = { logistics: 0, armor: 0, reserve: 0 };
  try {
    const saved = JSON.parse(window.localStorage.getItem(UPGRADES_STORAGE_KEY) || "null");
    const toLevel = (value) => {
      if (typeof value === "boolean") return value ? 1 : 0;
      const level = Number(value);
      return Number.isFinite(level) ? Math.max(0, Math.floor(level)) : 0;
    };
    return {
      logistics: toLevel(saved?.logistics),
      armor: toLevel(saved?.armor),
      reserve: toLevel(saved?.reserve),
    };
  } catch {
    return empty;
  }
}

function saveUpgrades() {
  try {
    window.localStorage.setItem(UPGRADES_STORAGE_KEY, JSON.stringify(state.upgrades));
  } catch {
    // Local storage may be unavailable in private browsing; the session still works.
  }
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
  gold: loadGold(),
  upgrades: loadUpgrades(),
  intel: 3,
  selectedRegionId: null,
  aiTimer: 3.2,
  aiReinforcements: AI_REINFORCEMENT_LIMIT,
  invasionWarning: null,
  recoveryTimer: 0,
  toastTimer: 0,
  eventNotice: true,
  motion: true,
  defeated: false,
  cleared: false,
  shopOpen: false,
  shopWasPaused: false,
  battles: new Map(),
  suppressNextClick: false,
};

const dragState = {
  active: false,
  sourceUnit: null,
  currentPoint: null,
  targetRegion: null,
  invalidTarget: false,
  moved: false,
  pointerId: null,
};

const regions = [
  {
    id: "northwest",
    name: "Northwest Reach",
    shortName: "北西辺境",
    faction: "blue",
    production: 7,
    points: [[0.07, 0.14], [0.26, 0.08], [0.39, 0.14], [0.36, 0.28], [0.2, 0.31], [0.08, 0.26]],
  },
  {
    id: "north",
    name: "Northern Union",
    shortName: "北方連合",
    faction: "blue",
    production: 9,
    points: [[0.26, 0.08], [0.48, 0.04], [0.68, 0.08], [0.86, 0.14], [0.83, 0.27], [0.63, 0.3], [0.47, 0.27], [0.36, 0.28], [0.39, 0.14]],
  },
  {
    id: "northeast",
    name: "Eastern Crown",
    shortName: "東方王冠",
    faction: "blue",
    production: 8,
    points: [[0.86, 0.14], [0.96, 0.19], [0.94, 0.37], [0.83, 0.43], [0.7, 0.37], [0.63, 0.3], [0.83, 0.27]],
  },
  {
    id: "western-steppe",
    name: "Western Steppe",
    shortName: "西部草原",
    faction: "blue",
    production: 6,
    points: [[0.08, 0.26], [0.2, 0.31], [0.36, 0.28], [0.47, 0.4], [0.39, 0.54], [0.19, 0.52], [0.06, 0.42]],
  },
  {
    id: "central",
    name: "Central Corridor",
    shortName: "中央回廊",
    faction: "blue",
    production: 12,
    points: [[0.36, 0.28], [0.47, 0.27], [0.63, 0.3], [0.7, 0.37], [0.61, 0.51], [0.45, 0.56], [0.39, 0.54], [0.47, 0.4]],
  },
  {
    id: "eastern-border",
    name: "Eastern Borderlands",
    shortName: "東部国境",
    faction: "red",
    production: 7,
    points: [[0.7, 0.37], [0.83, 0.43], [0.9, 0.56], [0.77, 0.66], [0.62, 0.59], [0.61, 0.51]],
  },
  {
    id: "heartland",
    name: "Crimson Heartland",
    shortName: "紅の中原",
    faction: "red",
    production: 11,
    points: [[0.45, 0.56], [0.61, 0.51], [0.62, 0.59], [0.56, 0.73], [0.39, 0.7], [0.32, 0.6]],
  },
  {
    id: "pink-coast",
    name: "Rose Coast",
    shortName: "桃色沿岸",
    faction: "pink",
    production: 5,
    points: [[0.77, 0.66], [0.9, 0.56], [0.96, 0.71], [0.9, 0.86], [0.7, 0.82], [0.64, 0.72]],
  },
  {
    id: "southern-plains",
    name: "Southern Plains",
    shortName: "南部平原",
    faction: "red",
    production: 8,
    points: [[0.19, 0.52], [0.39, 0.54], [0.45, 0.56], [0.32, 0.6], [0.39, 0.7], [0.25, 0.78], [0.11, 0.67]],
  },
  {
    id: "south-coast",
    name: "Southern Coast",
    shortName: "南岸連邦",
    faction: "red",
    production: 6,
    points: [[0.39, 0.7], [0.56, 0.73], [0.64, 0.72], [0.7, 0.82], [0.55, 0.9], [0.33, 0.84], [0.25, 0.78]],
  },
  {
    id: "island-chain",
    name: "Island Chain",
    shortName: "島嶼戦線",
    faction: "pink",
    production: 4,
    points: [[0.96, 0.71], [0.98, 0.84], [0.91, 0.96], [0.78, 0.94], [0.7, 0.82], [0.9, 0.86]],
  },
  {
    id: "frontier-isle",
    name: "Frontier Isle",
    shortName: "前線島",
    faction: "neutral",
    production: 3,
    points: [[0.42, 0.78], [0.52, 0.79], [0.56, 0.9], [0.5, 0.98], [0.42, 0.92]],
  },
];

const REGION_NEIGHBORS = {
  northwest: ["north", "western-steppe", "central"],
  north: ["northwest", "northeast", "central"],
  northeast: ["north", "eastern-border"],
  "western-steppe": ["northwest", "central", "southern-plains"],
  central: ["north", "western-steppe", "eastern-border", "heartland", "southern-plains"],
  "eastern-border": ["northeast", "central", "heartland", "pink-coast"],
  heartland: ["central", "eastern-border", "southern-plains", "south-coast", "pink-coast"],
  "pink-coast": ["eastern-border", "heartland", "island-chain"],
  "southern-plains": ["western-steppe", "central", "heartland", "south-coast"],
  "south-coast": ["southern-plains", "heartland", "island-chain", "frontier-isle"],
  "island-chain": ["pink-coast", "south-coast", "frontier-isle"],
  "frontier-isle": ["south-coast", "island-chain"],
};

const units = [
  { id: "blue-1", faction: "blue", regionId: "western-steppe", x: 0.28, y: 0.34, strength: 18, maxStrength: 18, style: "visor", target: null, pulse: 0 },
  { id: "blue-2", faction: "blue", regionId: "central", x: 0.39, y: 0.42, strength: 18, maxStrength: 18, style: "visor", target: null, pulse: 1.4 },
  { id: "blue-3", faction: "blue", regionId: "north", x: 0.55, y: 0.27, strength: 18, maxStrength: 18, style: "visor", target: null, pulse: 2.1 },
  { id: "red-1", faction: "red", regionId: "eastern-border", x: 0.62, y: 0.43, strength: 12, maxStrength: 12, style: "cap", target: null, pulse: 0.8 },
  { id: "red-2", faction: "red", regionId: "heartland", x: 0.53, y: 0.63, strength: 12, maxStrength: 12, style: "cap", target: null, pulse: 2.5 },
  { id: "red-3", faction: "red", regionId: "south-coast", x: 0.73, y: 0.75, strength: 12, maxStrength: 12, style: "cap", target: null, pulse: 1.2 },
  { id: "neutral-1", faction: "neutral", regionId: "pink-coast", x: 0.78, y: 0.55, strength: 12, maxStrength: 12, style: "plain", target: null, pulse: 2.8 },
  { id: "neutral-2", faction: "neutral", regionId: "frontier-isle", x: 0.84, y: 0.68, strength: 12, maxStrength: 12, style: "plain", target: null, pulse: 0.2 },
];

function cloneRegion(region) {
  return { ...region, occupation: null, points: region.points.map(([x, y]) => [x, y]) };
}

function cloneUnit(unit) {
  return {
    ...unit,
    target: unit.target ? { ...unit.target } : null,
    route: unit.route ? unit.route.map((point) => ({ ...point })) : null,
    routeIndex: unit.routeIndex || 0,
    patrolCenter: unit.patrolCenter ? { ...unit.patrolCenter } : null,
  };
}

const initialRegions = regions.map(cloneRegion);
const initialUnits = units.map(cloneUnit);

const view = { width: 0, height: 0 };
let lastTime = performance.now();
let toastTimeout = null;

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
  return REGION_NEIGHBORS[regionId] || [];
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

function getAttackCandidates() {
  const owned = regions.filter((region) => region.faction === "blue");
  return regions
    .filter((region) => region.faction !== "blue")
    .filter((region) => !region.occupation || region.occupation.faction !== "blue")
    .filter((region) => owned.some((source) => REGION_NEIGHBORS[source.id]?.includes(region.id)))
    .sort((left, right) => attackScore(left) - attackScore(right));
}

function attackScore(region) {
  const factionPenalty = region.faction === "neutral" ? 0 : region.faction === "pink" ? 2 : 4;
  return region.production * 0.35 + factionPenalty;
}

function recommendedAttack() {
  return getAttackCandidates()[0] || null;
}

function regionCenter(region) {
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

function drawSeaDetails() {
  ctx.save();
  ctx.globalAlpha = 0.26;
  ctx.fillStyle = "#9eacbf";
  ctx.font = "800 10px Inter, sans-serif";
  ctx.letterSpacing = "0.2em";
  ctx.fillText("EASTERN OCEAN", view.width * 0.77, view.height * 0.18);
  ctx.fillText("SOUTHERN SEA", view.width * 0.56, view.height * 0.95);
  ctx.restore();
}

function drawRegions() {
  regions.forEach((region) => {
    const palette = COLORS[region.faction];
    pathForPoints(region.points);
    ctx.fillStyle = palette.territory;
    ctx.fill();

    const selected = region.id === state.selectedRegionId;
    ctx.lineWidth = selected ? 4 : 2;
    ctx.strokeStyle = selected ? "#fff" : region.faction === "blue" ? "#aebdce" : "rgba(255, 255, 255, 0.9)";
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
      ctx.fillStyle = region.faction === "blue" || region.faction === "neutral" ? "#6e7c91" : "rgba(255,255,255,0.7)";
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

function drawFrontLines() {
  const lines = [
    [[0.53, 0.35], [0.62, 0.59]],
    [[0.39, 0.54], [0.56, 0.73]],
    [[0.62, 0.59], [0.77, 0.66]],
    [[0.65, 0.18], [0.83, 0.43]],
  ];
  ctx.save();
  ctx.setLineDash([7, 7]);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "rgba(114, 79, 85, 0.27)";
  lines.forEach(([start, end]) => {
    const a = screenPoint(start);
    const b = screenPoint(end);
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
    const color = occupation.faction === "blue" ? "#2c5a9f" : "#c34e58";

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

function drawFlag(x, y, color, scale) {
  ctx.save();
  ctx.lineWidth = Math.max(1.2, scale * 0.08);
  ctx.strokeStyle = "#1d2536";
  ctx.beginPath();
  ctx.moveTo(x, y - scale * 0.9);
  ctx.lineTo(x, y + scale * 0.65);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y - scale * 0.88);
  ctx.lineTo(x + scale * 0.66, y - scale * 0.67);
  ctx.lineTo(x, y - scale * 0.42);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawUnit(unit, time) {
  const point = screenPoint([unit.x, unit.y]);
  const scale = clamp(view.width * 0.021, 15, 25) * (state.zoom > 1 ? 1.07 : 1);
  const palette = COLORS[unit.faction];
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

  drawFlag(point.x + scale * 0.72, y - scale * 0.2, palette.flag, scale * 0.75);

  ctx.save();
  ctx.beginPath();
  ctx.arc(point.x, y, scale, 0, Math.PI * 2);
  ctx.fillStyle = palette.unit;
  ctx.fill();
  ctx.lineWidth = Math.max(1.5, scale * 0.1);
  ctx.strokeStyle = "#222b3d";
  ctx.stroke();

  if (unit.faction === "blue") {
    ctx.fillStyle = "#d94f58";
    ctx.beginPath();
    ctx.arc(point.x, y, scale * 0.62, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = Math.max(1, scale * 0.05);
    ctx.stroke();
  } else if (unit.faction === "red") {
    ctx.fillStyle = "#ffd75d";
    ctx.beginPath();
    ctx.moveTo(point.x - scale * 0.86, y - scale * 0.54);
    ctx.lineTo(point.x, y - scale * 1.13);
    ctx.lineTo(point.x + scale * 0.86, y - scale * 0.54);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (unit.faction === "pink") {
    ctx.fillStyle = "#ec5461";
    ctx.fillRect(point.x - scale * 0.83, y - scale * 0.12, scale * 1.66, scale * 0.28);
  }

  const eyeY = y - scale * 0.13;
  const eyeOffset = scale * 0.39;
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(point.x - eyeOffset, eyeY, scale * 0.21, 0, Math.PI * 2);
  ctx.arc(point.x + eyeOffset, eyeY, scale * 0.21, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1c2334";
  ctx.beginPath();
  ctx.arc(point.x - eyeOffset, eyeY, scale * 0.1, 0, Math.PI * 2);
  ctx.arc(point.x + eyeOffset, eyeY, scale * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#1c2334";
  ctx.lineWidth = Math.max(1, scale * 0.055);
  ctx.beginPath();
  ctx.arc(point.x, y + scale * 0.13, scale * 0.25, 0.1, Math.PI - 0.1);
  ctx.stroke();
  ctx.restore();

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
  const color = unit.faction === "blue" ? "rgba(79, 96, 121, 0.66)" : "rgba(178, 61, 75, 0.66)";

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
  if (distance(unit, sourceCenter) > 0.008) points.push(sourceCenter);
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
  drawSeaDetails();
  drawRegions();
  drawRoadNetwork();
  drawAttackMarkers();
  drawInvasionWarning();
  drawOccupationIndicators();
  drawFrontLines();
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
  if (distance(unit, sourceCenter) > 0.008) points.push(sourceCenter);
  pathIds.slice(1).forEach((regionId) => points.push(regionCenter(getRegion(regionId))));
  if (points.length === 0) return false;

  unit.route = points;
  unit.routeIndex = 0;
  unit.target = { ...points[0] };
  return true;
}

function moveUnit(unit, dt) {
  if (unit.inBattle) return;

  if (unit.arrived && unit.patrolCenter) {
    unit.x = unit.patrolCenter.x;
    unit.y = unit.patrolCenter.y;
    return;
  }

  if (!unit.target) return;
  const target = unit.target;
  const dx = target.x - unit.x;
  const dy = target.y - unit.y;
  const distanceToTarget = Math.hypot(dx, dy);
  const speed = unit.faction === "blue" ? 0.045 : 0.035;
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
    unit.patrolCenter = { x: target.x, y: target.y };
    unit.orbitAngle = 0;
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
  region.occupation = null;
  unit.regionId = region.id;
  unit.arrived = true;
  unit.patrolCenter = regionCenter(region);
  unit.arrivalResolved = true;
  showToast(`${region.name}を占領しました`);
  addEvent(`${region.shortName}が${unit.faction === "blue" ? "White Union" : "敵勢力"}の支配下に入りました`);
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
  unit.strength = Math.min(unit.maxStrength, Math.max(1, unit.strength));
}

function resolveBattleWinner(winner, loser) {
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
    addEvent(winner.faction === "blue" ? "道路上の迎撃に成功しました" : "道路上の交戦に勝利。侵攻を再開します");
  }
}

function groupStrength(members) {
  return members.reduce((total, unit) => total + Math.max(0, unit.strength), 0);
}

function groupProduction(members) {
  return members.reduce((total, unit) => total + getUnitProduction(unit), 0);
}

function groupCombatDamage(members) {
  const totalStrength = groupStrength(members);
  if (totalStrength <= 0) return 0;

  // A group deals one shared hit per tick. Strength makes the hit stronger,
  // while production keeps the existing recovery-focused balance relevant.
  const damage = Math.ceil(totalStrength * 0.1 + groupProduction(members) * 0.6);
  return Math.min(totalStrength, Math.max(2, damage));
}

function redistributeGroupStrength(members, totalStrength) {
  if (members.length === 0) return;
  const maxStrengthTotal = members.reduce((total, unit) => total + Math.max(1, unit.maxStrength || 12), 0);
  const targetStrength = Math.min(maxStrengthTotal, Math.max(0, Math.round(totalStrength)));

  if (targetStrength === 0) {
    members.forEach((unit) => { unit.strength = 0; });
    return;
  }

  if (targetStrength < members.length) {
    const priority = members.slice().sort((left, right) => right.strength - left.strength);
    members.forEach((unit) => { unit.strength = 0; });
    priority.slice(0, targetStrength).forEach((unit) => { unit.strength = 1; });
    return;
  }

  const minimumStrength = 1;
  const distributable = targetStrength - minimumStrength * members.length;
  const allocations = [];
  let allocated = 0;
  members.forEach((unit) => {
    const weight = Math.max(1, unit.maxStrength || 12) / maxStrengthTotal;
    const raw = distributable * weight;
    const whole = Math.floor(raw);
    unit.strength = minimumStrength + whole;
    allocated += unit.strength;
    allocations.push({ unit, remainder: raw - whole });
  });

  allocations.sort((left, right) => right.remainder - left.remainder);
  let leftover = targetStrength - allocated;
  let index = 0;
  while (leftover > 0 && allocations.length > 0) {
    allocations[index % allocations.length].unit.strength += 1;
    leftover -= 1;
    index += 1;
  }
}

function applyGroupDamage(members, damage) {
  const remaining = groupStrength(members) - Math.max(0, damage);
  redistributeGroupStrength(members, remaining);
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
      battle = { unitIds: group.unitIds, sides: group.sides, cooldown: 0.2, phase: Math.random() * 6, notified: false };
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
  if (!state.defeated && !state.cleared && !units.some((unit) => unit.faction === "blue")) triggerDefeat();
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
    x: center.x,
    y: center.y,
    strength: maxStrength,
    maxStrength,
    style: faction === "blue" ? "visor" : faction === "red" ? "cap" : "plain",
    target: null,
    route: null,
    routeIndex: 0,
    regionId: region.id,
    targetRegionId,
    arrived: !targetRegionId,
    patrolCenter: targetRegionId ? null : { ...center },
    orbitAngle: 0,
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
  state.aiTimer -= dt;
  if (state.aiTimer > 0 || state.aiReinforcements <= 0 || state.invasionWarning) return;
  state.aiTimer = 3.8 + Math.random() * 2.6;

  if (units.filter((unit) => unit.faction === "red").length >= AI_ACTIVE_UNIT_LIMIT) return;

  const redRegions = regions.filter((region) => region.faction === "red");
  const source = redRegions[Math.floor(Math.random() * redRegions.length)] || regions.find((region) => region.faction === "red");
  const targets = source ? regions.filter((region) => region.faction === "blue" && areRoadNeighbors(source, region)) : [];
  const target = targets[Math.floor(Math.random() * targets.length)];
  if (!source || !target) return;

  const existing = units.find((unit) => unit.faction === "red" && unit.targetRegionId === target.id);
  if (!existing) {
    state.invasionWarning = {
      sourceRegionId: source.id,
      targetRegionId: target.id,
      remaining: INVASION_WARNING_DURATION,
    };
    addEvent("侵攻予告あり！");
    showToast("侵攻予告あり！");
    updateInvasionAlert();
  }
}

function updateInvasionWarning(dt) {
  const warning = state.invasionWarning;
  if (!warning) return;

  const source = getRegion(warning.sourceRegionId);
  const target = getRegion(warning.targetRegionId);
  if (!source || !target || source.faction !== "red" || target.faction !== "blue") {
    state.invasionWarning = null;
    return;
  }

  warning.remaining -= dt;
  if (warning.remaining > 0) return;
  state.invasionWarning = null;
  if (units.filter((unit) => unit.faction === "red").length >= AI_ACTIVE_UNIT_LIMIT) return;

  const created = createUnit("red", source.id, target.id);
  if (!created) return;
  state.aiReinforcements -= 1;
  addEvent(`${source.shortName}から敵部隊が出撃しました`);
}

function regionForUnit(unit) {
  const containingRegion = [...regions].reverse().find((region) => pointInPolygon([unit.x, unit.y], region.points));
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
  unit.patrolCenter = { ...center };
  unit.orbitAngle = 0;
  return region;
}

function getRegionProduction(region) {
  if (!region) return 1;
  return region.production + (region.faction === "blue" ? state.upgrades.logistics : 0);
}

function getUnitProduction(unit) {
  return getRegionProduction(regionForUnit(unit));
}

function getMaxUnitStrength(faction) {
  const baseStrength = faction === "blue" ? 18 : 12;
  return baseStrength + (faction === "blue" ? state.upgrades.armor * 3 : 0);
}

function applyArmorUpgrade() {
  const maxStrength = getMaxUnitStrength("blue");
  units.filter((unit) => unit.faction === "blue").forEach((unit) => {
    unit.maxStrength = Math.max(unit.maxStrength || 12, maxStrength);
  });
}

function updateStrength(dt) {
  state.recoveryTimer += dt;
  while (state.recoveryTimer >= 1) {
    units.forEach((unit) => {
      const maxStrength = unit.maxStrength || 12;
      unit.strength = Math.min(maxStrength, unit.strength + getUnitProduction(unit));
    });
    state.recoveryTimer -= 1;
  }
}

function update(dt) {
  const scaledDt = dt * state.speed;
  state.elapsed += scaledDt;
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
  ui.factionDot.className = `faction-dot ${region.faction === "pink" ? "neutral" : region.faction}`;
  ui.regionName.textContent = region.name;
  const battleActive = regionHasBattle(region);
  const occupationActive = Boolean(region.occupation);
  ui.regionStatus.textContent = battleActive ? "⚔ 交戦中 — 侵攻が停止しています" : occupationActive ? "占領進行中 — タイマーが動いています" : region.faction === "blue" ? "White Unionの支配領域" : region.faction === "red" ? "敵対勢力が展開中" : "勢力未確定の中立地域";
  ui.occupation.textContent = occupationActive ? `${Math.ceil(region.occupation.progress)}/${region.occupation.duration}秒` : "—";
  ui.production.textContent = `+${getRegionProduction(region)}/秒`;
  ui.threat.textContent = battleActive ? "交戦中" : occupationActive ? "占領中" : region.faction === "blue" ? "安定" : region.faction === "red" ? "高" : "警戒";
}

function showToast(message) {
  ui.toast.textContent = message;
  ui.toast.classList.add("is-visible");
  state.toastTimer = 2.6;
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

function formatTime() {
  const totalSeconds = Math.max(0, Math.floor(state.elapsed));
  const day = Math.floor(totalSeconds / 90) + 1;
  const daySeconds = totalSeconds % 90;
  const minutes = String(Math.floor(daySeconds / 60)).padStart(2, "0");
  const seconds = String(daySeconds % 60).padStart(2, "0");
  return { day, text: `DAY ${String(day).padStart(2, "0")} · ${minutes}:${seconds}` };
}

function updateHud() {
  const blueRegions = regions.filter((region) => region.faction === "blue").length;
  const progress = Math.round((blueRegions / regions.length) * 100);
  const time = formatTime();
  if (!state.cleared && !state.defeated && blueRegions === regions.length) triggerClear();
  ui.progress.textContent = `${Math.max(1, progress)}%`;
  ui.gold.textContent = String(state.gold);
  ui.day.textContent = String(time.day).padStart(2, "0");
  ui.time.textContent = time.text;
  ui.intel.textContent = String(state.intel);
  ui.pause.classList.toggle("is-paused", state.paused);
  ui.pause.textContent = state.paused ? "▶" : "Ⅱ";
  updateInvasionAlert();
  updateAttackGuide();
  updateSelectedPanel();
}

function updateAttackGuide() {
  const target = recommendedAttack();
  if (!ui.attackGuide || !ui.attackTarget) return;
  ui.attackGuide.classList.toggle("is-hidden", !target);
  if (target) ui.attackTarget.textContent = target.name;
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
    const source = initialUnits.find((unit) => unit.faction === "blue");
    for (let index = 0; index < reserveCount; index += 1) {
      const reserve = {
        ...cloneUnit(source),
        id: `blue-reserve-${index + 1}`,
      };
      snapUnitToRoadNode(reserve, reserve.regionId);
      units.push(reserve);
    }
  }
  applyArmorUpgrade();
}

function triggerDefeat() {
  if (state.defeated || state.cleared) return;
  state.defeated = true;
  state.paused = true;
  state.gold += DEFEAT_GOLD_REWARD;
  saveGold();
  ui.gold.textContent = String(state.gold);
  ui.defeatReward.textContent = `+${DEFEAT_GOLD_REWARD} GOLD`;
  ui.defeatDialog?.showModal();
}

function triggerClear() {
  if (state.cleared || state.defeated) return;
  state.cleared = true;
  state.paused = true;
  ui.clearDialog?.showModal();
}

function restartGame() {
  regions.splice(0, regions.length, ...initialRegions.map(cloneRegion));
  setupInitialUnits();
  state.zoom = 1;
  state.panX = 0;
  state.panY = 0;
  state.paused = false;
  state.speed = 1;
  state.elapsed = 0;
  state.intel = 3;
  state.selectedRegionId = null;
  state.aiTimer = 3.2;
  state.aiReinforcements = AI_REINFORCEMENT_LIMIT;
  state.invasionWarning = null;
  state.recoveryTimer = 0;
  state.toastTimer = 0;
  state.defeated = false;
  state.cleared = false;
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
  lastTime = performance.now();
  updateHud();
  render();
  showToast("新しい作戦を開始しました");
}

function getUpgradePrice(key) {
  const item = SHOP_ITEMS[key];
  const level = Number(state.upgrades[key]) || 0;
  if (!item) return Number.MAX_SAFE_INTEGER;
  return Math.min(999999, Math.ceil((item.basePrice * 1.45 ** level) / 10) * 10);
}

function updateShopDialog() {
  if (!ui.shopGold) return;
  ui.shopGold.textContent = String(state.gold);
  ui.shopButtons.forEach((button) => {
    const key = button.dataset.shopUpgrade;
    const item = SHOP_ITEMS[key];
    if (!item) return;
    const level = Number(state.upgrades[key]) || 0;
    const price = getUpgradePrice(key);
    const unaffordable = state.gold < price;
    button.disabled = unaffordable;
    button.textContent = `${price} Gold`;
    const card = button.closest("[data-shop-card]");
    card?.classList.toggle("is-purchased", level > 0);
    card?.classList.toggle("is-unaffordable", unaffordable);
    const levelLabel = card?.querySelector("[data-shop-level]");
    if (levelLabel) levelLabel.textContent = `Lv.${level}`;
  });
}

function purchaseUpgrade(key) {
  const item = SHOP_ITEMS[key];
  if (!item) return;
  const level = Number(state.upgrades[key]) || 0;
  const price = getUpgradePrice(key);
  if (state.gold < price) {
    showToast("Goldが不足しています");
    return;
  }

  state.gold -= price;
  state.upgrades[key] = level + 1;
  saveGold();
  saveUpgrades();
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

function unitAtScreenPoint(x, y) {
  const point = worldPointFromScreen(x, y);
  return units
    .filter((unit) => unit.faction === "blue")
    .map((unit) => ({ unit, distance: distance(unit, { x: point[0], y: point[1] }) }))
    .filter((entry) => entry.distance < 0.055)
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
  return areRoadNeighbors(regionForUnit(unit), targetRegion);
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
  dragState.moved = dragState.moved || distance(dragState.sourceUnit, point) > 0.012;
  const candidate = [...regions].reverse().find((region) => pointInPolygon([point.x, point.y], region.points)) || null;
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
  if (!areRoadNeighbors(sourceRegion, region)) {
    showToast("道路でつながった隣接領土にのみ派遣できます");
    return false;
  }

  if (!setUnitRoute(unit, sourceRegion.id, region.id)) {
    showToast("この領土への道路がありません");
    return false;
  }

  cancelOccupationForUnit(unit);
  unit.targetRegionId = region.id;
  unit.arrived = false;
  unit.patrolCenter = null;
  unit.arrivalResolved = false;
  unit.orbitAngle = 0;
  ui.dispatchHint.classList.add("is-hidden");
  addEvent(`白い部隊が${region.shortName}へ移動を開始しました`);
  showToast(`${region.name}へ部隊を派遣しました`);
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
    else if (invalidTarget) showToast("道路でつながった隣接領土にのみ派遣できます");
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
  const clicked = [...regions].reverse().find((region) => pointInPolygon(point, region.points));
  selectRegion(clicked || null);
  if (clicked) showToast(`${clicked.name}を選択しました`);
}

function setZoom(nextZoom) {
  state.zoom = clamp(nextZoom, 0.82, 1.42);
  render();
}

function resetMap() {
  state.zoom = 1;
  state.panX = 0;
  state.panY = 0;
  render();
  showToast("マップを初期位置に戻しました");
}

function loop(now) {
  const rawDt = Math.max(0, (now - lastTime) / 1000);
  const dt = Math.min(rawDt, 0.06);
  lastTime = now;
  if (!state.paused) update(dt);
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
document.querySelector("#homeButton").addEventListener("click", resetMap);
ui.territoryClose?.addEventListener("click", () => selectRegion(null));

document.querySelector("#shopButton").addEventListener("click", openShop);
ui.shopButtons.forEach((button) => {
  button.addEventListener("click", () => purchaseUpgrade(button.dataset.shopUpgrade));
});
document.querySelector("#shopCloseButton").addEventListener("click", () => ui.shopDialog.close());
ui.shopDialog?.addEventListener("close", finishShop);
document.querySelector("#intelButton").addEventListener("click", () => {
  if (state.intel <= 0) {
    showToast("情報ポイントがありません");
    return;
  }
  state.intel -= 1;
  const hostile = regions.find((region) => region.faction === "red" || region.faction === "pink");
  if (hostile) showToast(`偵察結果：${hostile.shortName}の生産力は+${getRegionProduction(hostile)}/秒`);
});

const settingsDialog = document.querySelector("#settingsDialog");
document.querySelector("#settingsButton").addEventListener("click", () => settingsDialog.showModal());
document.querySelector("#restartButton").addEventListener("click", restartGame);
document.querySelector("#clearRestartButton").addEventListener("click", restartGame);
ui.defeatDialog?.addEventListener("cancel", (event) => event.preventDefault());
ui.clearDialog?.addEventListener("cancel", (event) => event.preventDefault());
document.querySelector("#eventToggle").addEventListener("change", (event) => { state.eventNotice = event.target.checked; });
document.querySelector("#motionToggle").addEventListener("change", (event) => { state.motion = event.target.checked; });

setupInitialUnits();
updateShopDialog();
resizeCanvas();
updateSelectedPanel();
updateHud();
requestAnimationFrame(loop);
