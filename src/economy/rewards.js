function nonNegativeInteger(value) {
  return Number.isFinite(Number(value)) ? Math.max(0, Math.floor(Number(value))) : 0;
}

function normalizedProgress(progress = {}) {
  return {
    capturedRegions: nonNegativeInteger(progress.capturedRegions),
    battleWins: nonNegativeInteger(progress.battleWins),
    elapsedSeconds: Math.max(0, Number(progress.elapsedSeconds) || 0),
  };
}

export function createRunProgress() {
  return { capturedRegions: 0, capturedRegionIds: new Set(), battleWins: 0 };
}

export function calculateProgressGold(progress, rewardBalance) {
  const normalized = normalizedProgress(progress);
  return normalized.capturedRegions * rewardBalance.captureGold
    + normalized.battleWins * rewardBalance.battleWinGold;
}

export function calculateDefeatGold(progress, rewardBalance) {
  const normalized = normalizedProgress(progress);
  if (
    normalized.capturedRegions < rewardBalance.minimumDefeatCaptures
    || normalized.elapsedSeconds < rewardBalance.minimumDefeatElapsedSeconds
  ) {
    return 0;
  }

  const progressGold = calculateProgressGold(normalized, rewardBalance);
  return Math.min(
    rewardBalance.defeatRewardCap,
    Math.max(
      rewardBalance.minimumDefeatGold || 0,
      Math.floor(progressGold * rewardBalance.defeatConversionRate),
    ),
  );
}

export function calculateClearGold(progress, rewardBalance) {
  return calculateProgressGold(progress, rewardBalance) + rewardBalance.clearBonus;
}

export function calculateCampaignClearGold(progress, rewardBalance) {
  return calculateClearGold(progress, rewardBalance) + rewardBalance.campaignClearBonus;
}
