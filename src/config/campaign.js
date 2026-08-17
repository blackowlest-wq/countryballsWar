const PHASE_ONE_OWNERS = {
  "russia-east": "blue",
  "russia-far-east": "gray",
  kazakhstan: "blue",
  mongolia: "blue",
  "china-north": "red",
  "china-central": "red",
  "china-south": "gray",
  "north-korea": "red",
  "south-korea": "gray",
  japan: "pink",
  vietnam: "red",
  philippines: "pink",
  indonesia: "gray",
};

const PHASE_TWO_OWNERS = {
  "russia-east": "blue",
  "russia-far-east": "gray",
  kazakhstan: "blue",
  mongolia: "blue",
  "china-north": "blue",
  "china-central": "blue",
  "china-south": "gray",
  "north-korea": "blue",
  "south-korea": "gray",
  japan: "pink",
  vietnam: "blue",
  philippines: "pink",
  indonesia: "gray",
};

const PHASE_ONE_PRODUCTION = {
  "russia-east": 2,
  "russia-far-east": 2,
  kazakhstan: 2,
  mongolia: 1,
  "china-north": 3,
  "china-central": 3,
  "china-south": 2,
  "north-korea": 1,
  "south-korea": 2,
  japan: 2,
  vietnam: 1,
  philippines: 1,
  indonesia: 2,
};

const PHASE_ONE_UNITS = [
  { id: "blue-1", faction: "blue", regionId: "kazakhstan", characterId: "kazakhstan", pulse: 0 },
  { id: "blue-2", faction: "blue", regionId: "mongolia", characterId: "mongolia", pulse: 1.4 },
  { id: "blue-3", faction: "blue", regionId: "russia-east", characterId: "russia", pulse: 2.1 },
  { id: "red-1", faction: "red", regionId: "china-north", characterId: "china", pulse: 0.8 },
  { id: "red-2", faction: "red", regionId: "china-central", characterId: "china", pulse: 2.5 },
  { id: "red-3", faction: "red", regionId: "north-korea", characterId: "north-korea", pulse: 1.2 },
  { id: "red-4", faction: "red", regionId: "vietnam", characterId: "vietnam", pulse: 2.2 },
  { id: "gray-1", faction: "gray", regionId: "china-south", characterId: "china", pulse: 2.8 },
  { id: "gray-2", faction: "gray", regionId: "south-korea", characterId: "south-korea", pulse: 0.2 },
  { id: "pink-1", faction: "pink", regionId: "japan", characterId: "japan", pulse: 1.7 },
  { id: "pink-2", faction: "pink", regionId: "philippines", characterId: "philippines", pulse: 2.9 },
];

const PHASE_TWO_UNITS = [
  { id: "blue-1", faction: "blue", regionId: "kazakhstan", characterId: "kazakhstan", pulse: 0 },
  { id: "blue-2", faction: "blue", regionId: "china-central", characterId: "china", pulse: 1.4 },
  { id: "red-1", faction: "red", regionId: "russia-far-east", characterId: "russia", pulse: 0.8 },
  { id: "gray-1", faction: "gray", regionId: "china-south", characterId: "china", pulse: 2.8 },
  { id: "gray-2", faction: "gray", regionId: "south-korea", characterId: "south-korea", pulse: 0.2 },
  { id: "gray-3", faction: "gray", regionId: "indonesia", characterId: "indonesia", pulse: 2.6 },
  { id: "pink-1", faction: "pink", regionId: "japan", characterId: "japan", pulse: 1.7 },
  { id: "pink-2", faction: "pink", regionId: "philippines", characterId: "philippines", pulse: 2.9 },
];

export const CAMPAIGN = {
  id: "world-conquest-v1",
  version: 1,
  defaultDifficultyId: "normal",
  frontOrder: ["asia-front"],
  fronts: {
    "asia-front": {
      id: "asia-front",
      mapId: "asia-front",
      type: "regionalLarge",
      enemyProfileId: "regionalEarly",
      phaseIds: ["asia-front-early", "asia-front-late"],
      targetCountryIds: [
        "russia",
        "kazakhstan",
        "mongolia",
        "china",
        "north-korea",
        "south-korea",
        "japan",
        "vietnam",
        "philippines",
        "indonesia",
      ],
    },
  },
  phases: {
    "asia-front-early": {
      id: "asia-front-early",
      frontId: "asia-front",
      mapId: "asia-front",
      index: 0,
      name: "Opening Line",
      objectiveRegionIds: ["china-north", "china-central", "north-korea", "vietnam"],
      territoryOwners: PHASE_ONE_OWNERS,
      productionByRegion: PHASE_ONE_PRODUCTION,
      initialUnits: PHASE_ONE_UNITS,
    },
    "asia-front-late": {
      id: "asia-front-late",
      frontId: "asia-front",
      mapId: "asia-front",
      index: 1,
      name: "Southern Advance",
      objectiveRegionIds: [
        "russia-east",
        "russia-far-east",
        "kazakhstan",
        "mongolia",
        "china-north",
        "china-central",
        "china-south",
        "north-korea",
        "south-korea",
        "japan",
        "vietnam",
        "philippines",
        "indonesia",
      ],
      territoryOwners: PHASE_TWO_OWNERS,
      productionByRegion: PHASE_ONE_PRODUCTION,
      initialUnits: PHASE_TWO_UNITS,
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
