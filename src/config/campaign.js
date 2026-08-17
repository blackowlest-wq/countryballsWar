const KOREA_FRONT_OWNERS = {
  "south-korea": "blue",
  "north-korea": "red",
};

const KOREA_FRONT_PRODUCTION = {
  "south-korea": 2,
  "north-korea": 1,
};

const KOREA_FRONT_UNITS = [
  { id: "blue-1", faction: "blue", regionId: "south-korea", characterId: "south-korea", pulse: 0 },
  { id: "red-1", faction: "red", regionId: "north-korea", characterId: "north-korea", pulse: 1.2 },
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
      objectiveRegionIds: ["north-korea"],
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
