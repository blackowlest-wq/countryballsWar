import { getCompletedCountryIds } from "./phase-runtime.js";

function normalizeCountryIds(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((countryId) => typeof countryId === "string" && countryId.trim().length > 0))].sort();
}

export function collectCountryFlags({ regions, countries, playerFactionId, collectedCountryIds = [] }) {
  const collected = new Set(normalizeCountryIds(collectedCountryIds));
  const completedCountryIds = getCompletedCountryIds(regions, countries, playerFactionId);
  const newlyCollectedCountryIds = completedCountryIds.filter((countryId) => !collected.has(countryId));

  newlyCollectedCountryIds.forEach((countryId) => collected.add(countryId));

  return {
    collectedCountryIds: [...collected].sort(),
    newlyCollectedCountryIds,
  };
}
