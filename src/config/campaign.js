import { COUNTRIES } from "./countries.js";

const SOUTH_KOREA_FRAGMENT_IDS = COUNTRIES["south-korea"].fragmentIds;
const NORTH_KOREA_FRAGMENT_IDS = COUNTRIES["north-korea"].fragmentIds;
const STARTING_REGION_ID = "south-jeju";
const SOUTH_KOREA_ENEMY_REGION_IDS = SOUTH_KOREA_FRAGMENT_IDS.filter((regionId) => regionId !== STARTING_REGION_ID);
const KOREA_FRONT_OBJECTIVE_REGION_IDS = [...SOUTH_KOREA_ENEMY_REGION_IDS, ...NORTH_KOREA_FRAGMENT_IDS];

const KOREA_FRONT_OWNERS = Object.fromEntries([
  [STARTING_REGION_ID, "blue"],
  ...SOUTH_KOREA_ENEMY_REGION_IDS.map((fragmentId) => [fragmentId, "gray"]),
  ...NORTH_KOREA_FRAGMENT_IDS.map((fragmentId) => [fragmentId, "red"]),
]);

const KOREA_FRONT_PRODUCTION = {
  "south-capital": 4,
  "south-gangwon": 2,
  "south-central": 4,
  "south-west": 4,
  "south-east": 5,
  "south-jeju": 2,
  "north-central": 3,
  "north-west": 3,
  "north-hwanghae": 2,
  "north-east-central": 3,
  "north-east": 2,
};

const KOREA_FRONT_UNITS = [
  { id: "blue-1", faction: "blue", regionId: STARTING_REGION_ID, characterId: "player", pulse: 0 },
  { id: "gray-1", faction: "gray", regionId: "south-central", characterId: "south-korea", pulse: 0.8 },
  { id: "red-1", faction: "red", regionId: "north-central", characterId: "north-korea", pulse: 1.2 },
  { id: "red-2", faction: "red", regionId: "north-east-central", characterId: "north-korea", pulse: 1.8 },
  { id: "red-3", faction: "red", regionId: "north-east", characterId: "north-korea", pulse: 2.4 },
];

const JAPAN_FRAGMENT_IDS = COUNTRIES.japan.fragmentIds;
const JAPAN_STARTING_REGION_ID = "japan-okinawa";
const JAPAN_ENEMY_REGION_IDS = JAPAN_FRAGMENT_IDS.filter((regionId) => regionId !== JAPAN_STARTING_REGION_ID);
const JAPAN_FRONT_OBJECTIVE_REGION_IDS = [...JAPAN_ENEMY_REGION_IDS];
const JAPAN_FRONT_OPENING_OBJECTIVE_REGION_IDS = [
  "japan-kyushu-north",
  "japan-kyushu-south",
  "japan-shikoku",
  "japan-chugoku",
  "japan-kansai",
  "japan-chubu",
];

const JAPAN_FRONT_OWNERS = Object.fromEntries([
  [JAPAN_STARTING_REGION_ID, "blue"],
  ...JAPAN_ENEMY_REGION_IDS.map((regionId) => [regionId, "red"]),
]);

const JAPAN_FRONT_PRODUCTION = {
  "japan-okinawa": 2,
  "japan-kyushu-north": 4,
  "japan-kyushu-south": 3,
  "japan-shikoku": 3,
  "japan-chugoku": 4,
  "japan-kansai": 5,
  "japan-chubu": 5,
  "japan-hokuriku": 3,
  "japan-kanto": 6,
  "japan-tohoku-south": 4,
  "japan-tohoku-north": 3,
  "japan-hokkaido": 4,
};

const JAPAN_FRONT_OPENING_UNITS = [
  { id: "japan-blue-1", faction: "blue", regionId: JAPAN_STARTING_REGION_ID, characterId: "player", pulse: 0 },
  { id: "japan-red-1", faction: "red", regionId: "japan-kyushu-north", characterId: "japan", pulse: 0.8 },
  { id: "japan-red-2", faction: "red", regionId: "japan-kansai", characterId: "japan", pulse: 1.6 },
  { id: "japan-red-3", faction: "red", regionId: "japan-kanto", characterId: "japan", pulse: 2.4 },
];

const JAPAN_FRONT_LATE_UNITS = [
  { id: "japan-blue-2", faction: "blue", regionId: JAPAN_STARTING_REGION_ID, characterId: "player", pulse: 0 },
  { id: "japan-red-4", faction: "red", regionId: "japan-hokkaido", characterId: "japan", pulse: 1.1 },
  { id: "japan-red-5", faction: "red", regionId: "japan-tohoku-north", characterId: "japan", pulse: 1.9 },
  { id: "japan-red-6", faction: "red", regionId: "japan-kanto", characterId: "japan", pulse: 2.7 },
];

export const CAMPAIGN = {
  id: "regional-fronts-v1",
  version: 1,
  defaultDifficultyId: "normal",
  frontOrder: ["korea-front", "japan-front"],
  fronts: {
    "korea-front": {
      id: "korea-front",
      mapId: "korea-front",
      name: "朝鮮半島マップ",
      type: "regionalSmall",
      enemyProfileId: "regionalIntro",
      phaseIds: ["korea-front-opening"],
      targetCountryIds: ["south-korea", "north-korea"],
    },
    "japan-front": {
      id: "japan-front",
      mapId: "japan-front",
      name: "日本マップ",
      type: "major",
      enemyProfileId: "majorEarly",
      phaseIds: ["japan-front-opening", "japan-front-late"],
      targetCountryIds: ["japan"],
    },
  },
  phases: {
    "korea-front-opening": {
      id: "korea-front-opening",
      frontId: "korea-front",
      mapId: "korea-front",
      index: 0,
      name: "Border Breakthrough",
      objectiveRegionIds: KOREA_FRONT_OBJECTIVE_REGION_IDS,
      territoryOwners: KOREA_FRONT_OWNERS,
      productionByRegion: KOREA_FRONT_PRODUCTION,
      initialUnits: KOREA_FRONT_UNITS,
    },
    "japan-front-opening": {
      id: "japan-front-opening",
      frontId: "japan-front",
      mapId: "japan-front",
      index: 0,
      name: "Southern Landing",
      objectiveRegionIds: JAPAN_FRONT_OPENING_OBJECTIVE_REGION_IDS,
      territoryOwners: JAPAN_FRONT_OWNERS,
      productionByRegion: JAPAN_FRONT_PRODUCTION,
      initialUnits: JAPAN_FRONT_OPENING_UNITS,
    },
    "japan-front-late": {
      id: "japan-front-late",
      frontId: "japan-front",
      mapId: "japan-front",
      index: 1,
      name: "Northern Advance",
      objectiveRegionIds: JAPAN_FRONT_OBJECTIVE_REGION_IDS,
      territoryOwners: JAPAN_FRONT_OWNERS,
      productionByRegion: JAPAN_FRONT_PRODUCTION,
      initialUnits: JAPAN_FRONT_LATE_UNITS,
    },
  },
};

export function getCampaignFront(campaign, frontId) {
  return campaign.fronts[frontId] || null;
}

export function getCampaignPhase(campaign, phaseId) {
  return campaign.phases[phaseId] || null;
}

export function getFirstPhaseId(campaign, frontId) {
  return getCampaignFront(campaign, frontId)?.phaseIds[0] || null;
}
