import { CAMPAIGN, getCampaignFront, getCampaignPhase } from "./campaign.js";

const frontId = CAMPAIGN.frontOrder[0];
const front = getCampaignFront(CAMPAIGN, frontId);
const phaseId = front.phaseIds[0];
const phase = getCampaignPhase(CAMPAIGN, phaseId);

export const SCENARIO = {
  id: phase.id,
  frontId,
  phaseId,
  mapId: phase.mapId,
  playerFactionId: "blue",
  activeAiFactionId: "red",
  territoryOwners: phase.territoryOwners,
  initialUnits: phase.initialUnits,
};
