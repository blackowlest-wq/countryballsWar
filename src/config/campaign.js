import { COUNTRIES } from "./countries.js";

const SOUTH_KOREA_FRAGMENT_IDS = COUNTRIES["south-korea"].fragmentIds;
const NORTH_KOREA_FRAGMENT_IDS = COUNTRIES["north-korea"].fragmentIds;

const KOREA_FRONT_OWNERS = Object.fromEntries([
  ...SOUTH_KOREA_FRAGMENT_IDS.map((fragmentId) => [fragmentId, "blue"]),
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
  { id: "blue-1", faction: "blue", regionId: "south-capital", characterId: "south-korea", pulse: 0 },
  { id: "blue-2", faction: "blue", regionId: "south-east", characterId: "south-korea", pulse: 0.4 },
  { id: "red-1", faction: "red", regionId: "north-central", characterId: "north-korea", pulse: 1.2 },
  { id: "red-2", faction: "red", regionId: "north-east-central", characterId: "north-korea", pulse: 1.8 },
  { id: "red-3", faction: "red", regionId: "north-east", characterId: "north-korea", pulse: 2.4 },
];

export const CAMPAIGN = {
  id: "regional-fronts-v1",
  version: 1,
  defaultDifficultyId: "normal",
  frontOrder: ["korea-front"],
  fronts: {
    "korea-front": {
      id: "korea-front",
      mapId: "korea-front",
      type: "regionalSmall",
      enemyProfileId: "regionalIntro",
      phaseIds: ["korea-front-opening"],
      targetCountryIds: ["north-korea"],
    },
  },
  phases: {
    "korea-front-opening": {
      id: "korea-front-opening",
      frontId: "korea-front",
      mapId: "korea-front",
      index: 0,
      name: "Border Breakthrough",
      objectiveRegionIds: NORTH_KOREA_FRAGMENT_IDS,
      territoryOwners: KOREA_FRONT_OWNERS,
      productionByRegion: KOREA_FRONT_PRODUCTION,
      initialUnits: KOREA_FRONT_UNITS,
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
