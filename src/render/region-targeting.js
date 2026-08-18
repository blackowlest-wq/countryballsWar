function interactionRadius(region, defaultHitRadius) {
  return Number.isFinite(region.interactionRadius) && region.interactionRadius > 0
    ? region.interactionRadius
    : defaultHitRadius;
}

export function findRegionAtWorldPoint({ regions, point, pointInRegion, defaultHitRadius, zoom = 1 }) {
  const containingRegion = [...regions].reverse().find((region) => pointInRegion(point, region));
  if (containingRegion) return containingRegion;

  const safeZoom = Math.max(Number(zoom) || 1, Number.EPSILON);
  return regions
    .map((region) => ({
      region,
      center: region.interactionPoint,
      radius: interactionRadius(region, defaultHitRadius) / safeZoom,
    }))
    .map(({ region, center, radius }) => ({
      region,
      distance: Math.hypot(center[0] - point[0], center[1] - point[1]),
      radius,
    }))
    .filter(({ distance, radius }) => distance <= radius)
    .sort((left, right) => left.distance - right.distance)[0]?.region || null;
}
