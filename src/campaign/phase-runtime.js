function cloneData(value) {
  if (Array.isArray(value)) return value.map(cloneData);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, cloneData(entry)]));
  }
  return value;
}

export function resolveEnemyStrength(baseStrength, strengthMultiplier, minimumStrength = 1) {
  const scaled = Math.round(Number(baseStrength) * Number(strengthMultiplier));
  return Math.max(minimumStrength, Number.isFinite(scaled) ? scaled : minimumStrength);
}

export function isPhaseObjectiveComplete(regions, phase, playerFactionId) {
  if (!phase || !Array.isArray(phase.objectiveRegionIds) || phase.objectiveRegionIds.length === 0) return false;
  const regionById = new Map(regions.map((region) => [region.id, region]));
  return phase.objectiveRegionIds.every((regionId) => regionById.get(regionId)?.faction === playerFactionId);
}

export function isCountryComplete(regions, country, playerFactionId) {
  if (!country || !Array.isArray(country.fragmentIds) || country.fragmentIds.length === 0) return false;
  const regionById = new Map(regions.map((region) => [region.id, region]));
  return country.fragmentIds.every((fragmentId) => regionById.get(fragmentId)?.faction === playerFactionId);
}

export function getCompletedCountryIds(regions, countries, playerFactionId) {
  return Object.values(countries)
    .filter((country) => isCountryComplete(regions, country, playerFactionId))
    .map((country) => country.id)
    .sort();
}

export function getNextPhaseId(campaign, frontId, currentPhaseId) {
  const front = campaign.fronts[frontId];
  if (!front) return null;
  const currentIndex = front.phaseIds.indexOf(currentPhaseId);
  return currentIndex >= 0 ? front.phaseIds[currentIndex + 1] || null : null;
}

export function transitionPhase({ currentRuntime, nextRuntime, playerFactionId }) {
  const previousRegions = new Map(currentRuntime.regions.map((region) => [region.id, region]));
  const regions = nextRuntime.regions.map((nextRegion) => {
    const previous = previousRegions.get(nextRegion.id);
    if (!previous) return cloneData(nextRegion);
    return {
      ...cloneData(nextRegion),
      faction: previous.faction === playerFactionId ? playerFactionId : nextRegion.faction,
      occupation: cloneData(previous.occupation),
    };
  });

  const playerUnits = currentRuntime.units
    .filter((unit) => unit.faction === playerFactionId)
    .map(cloneData);
  const enemyUnits = nextRuntime.units
    .filter((unit) => unit.faction !== playerFactionId)
    .map(cloneData);

  return {
    phaseId: nextRuntime.phaseId,
    frontId: nextRuntime.frontId,
    regions,
    units: [...playerUnits, ...enemyUnits],
  };
}
