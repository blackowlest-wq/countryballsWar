export function getAiAttackCandidates({ regions, units, factionId, playerFactionId, areNeighbors }) {
  const candidates = [];
  const aiRegions = regions.filter((region) => (
    region.faction === factionId
      && (!region.occupation || region.occupation.faction !== playerFactionId)
  ));

  aiRegions.forEach((source) => {
    regions
      .filter((region) => region.faction === playerFactionId && areNeighbors(source, region))
      .filter((target) => !units.some((unit) => unit.faction === factionId && unit.targetRegionId === target.id))
      .forEach((target) => candidates.push({ factionId, source, target }));
  });

  return candidates;
}

export function chooseAiAttackCandidate(candidates, preferredFactionId, random = Math.random) {
  const preferred = candidates.filter((candidate) => candidate.factionId === preferredFactionId);
  const pool = preferred.length > 0 ? preferred : candidates;
  if (pool.length === 0) return null;

  const randomValue = Math.max(0, Math.min(0.999999999, Number(random()) || 0));
  return pool[Math.floor(randomValue * pool.length)];
}
