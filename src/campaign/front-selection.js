function toFrontIdSet(value) {
  if (value instanceof Set) return new Set(value);
  if (!Array.isArray(value)) return new Set();
  return new Set(value.filter((frontId) => typeof frontId === "string" && frontId.trim().length > 0));
}

export function getCompletedFrontIds(campaignState = {}) {
  const completed = toFrontIdSet(campaignState.completedFrontIds);
  if (typeof campaignState.lastCompletedFrontId === "string" && campaignState.lastCompletedFrontId.trim().length > 0) {
    completed.add(campaignState.lastCompletedFrontId);
  }
  return completed;
}

export function isFrontUnlocked(frontOrder, frontId, completedFrontIds = new Set()) {
  if (!Array.isArray(frontOrder)) return false;
  const frontIndex = frontOrder.indexOf(frontId);
  if (frontIndex < 0) return false;

  const completed = toFrontIdSet(completedFrontIds);
  return frontOrder.slice(0, frontIndex).every((requiredFrontId) => completed.has(requiredFrontId));
}

export function getFrontSelectionEntries(campaign, campaignState = {}) {
  if (!campaign || !Array.isArray(campaign.frontOrder)) return [];

  const completed = getCompletedFrontIds(campaignState);
  return campaign.frontOrder.map((frontId, index) => ({
    frontId,
    front: campaign.fronts?.[frontId] || null,
    index,
    completed: completed.has(frontId),
    unlocked: isFrontUnlocked(campaign.frontOrder, frontId, completed),
  }));
}
