import { COUNTRIES } from "./countries.js";

const SOUTH_KOREA_FRAGMENT_IDS = COUNTRIES["south-korea"].fragmentIds;
const NORTH_KOREA_FRAGMENT_IDS = COUNTRIES["north-korea"].fragmentIds;

const KOREA_FRONT_OWNERS = Object.fromEntries([
  ...SOUTH_KOREA_FRAGMENT_IDS.map((fragmentId) => [fragmentId, "blue"]),
  ...NORTH_KOREA_FRAGMENT_IDS.map((fragmentId) => [fragmentId, "red"]),
]);

const KOREA_FRONT_PRODUCTION = {
  "kr-42": 2,
  "kr-41": 3,
  "kr-44": 2,
  "kr-28": 2,
  "kr-45": 2,
  "kr-46": 2,
  "kr-48": 2,
  "kr-26": 2,
  "kr-31": 2,
  "kr-47": 2,
  "kr-49": 1,
  "kr-11": 3,
  "kr-30": 2,
  "kr-50": 2,
  "kr-43": 2,
  "kr-29": 2,
  "kr-27": 2,
  "kp-07": 1,
  "kp-06": 1,
  "kp-09": 1,
  "kp-13": 1,
  "kp-10": 1,
  "kp-04": 1,
  "kp-03": 1,
  "kp-02": 2,
  "kp-05": 1,
  "kp-08": 1,
  "kp-01": 2,
};

const KOREA_FRONT_UNITS = [
  { id: "blue-1", faction: "blue", regionId: "kr-11", characterId: "south-korea", pulse: 0 },
  { id: "blue-2", faction: "blue", regionId: "kr-48", characterId: "south-korea", pulse: 0.4 },
  { id: "red-1", faction: "red", regionId: "kp-01", characterId: "north-korea", pulse: 1.2 },
  { id: "red-2", faction: "red", regionId: "kp-07", characterId: "north-korea", pulse: 1.8 },
  { id: "red-3", faction: "red", regionId: "kp-09", characterId: "north-korea", pulse: 2.4 },
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
