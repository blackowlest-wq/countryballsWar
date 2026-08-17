function cloneData(value) {
  if (Array.isArray(value)) return value.map(cloneData);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, cloneData(entry)]));
  }
  return value;
}

export function projectGeoPoint([longitude, latitude], bounds) {
  const x = (longitude - bounds.west) / (bounds.east - bounds.west);
  const y = 1 - (latitude - bounds.south) / (bounds.north - bounds.south);
  return [x, y];
}

function compileDecorations(decorations, bounds) {
  if (!decorations) return { labels: [], lines: [] };
  return {
    labels: (decorations.labels || []).map((label) => ({
      text: label.text,
      position: projectGeoPoint(label.coordinates, bounds),
    })),
    lines: (decorations.lines || []).map((line) => ({
      from: projectGeoPoint(line.from, bounds),
      to: projectGeoPoint(line.to, bounds),
    })),
  };
}

export function compileWorldFrontMap(worldMap, frontMap, countries) {
  const bounds = worldMap.projection.bounds;
  const regions = frontMap.fragmentIds.map((fragmentId) => {
    const fragment = worldMap.fragments[fragmentId];
    const country = countries[fragment?.countryId];
    if (!fragment || !country) throw new Error(`Map compiler: missing fragment or country for ${fragmentId}`);
    return {
      id: fragment.id,
      countryId: fragment.countryId,
      fragmentId: fragment.id,
      name: fragment.name || country.name,
      shortName: fragment.shortName || country.shortName,
      points: fragment.points.map((point) => projectGeoPoint(point, bounds)),
      interactionPoint: projectGeoPoint(fragment.interactionPoint || fragment.centroid, bounds),
      sourceCoordinates: cloneData(fragment.points),
      sourceCentroid: cloneData(fragment.centroid),
      isMajor: country.isMajor,
    };
  });

  return {
    id: frontMap.id,
    name: frontMap.name,
    sourceWorldMapId: worldMap.id,
    projection: cloneData(worldMap.projection),
    interactionMinDistance: frontMap.interactionMinDistance,
    interactionHitRadius: frontMap.interactionHitRadius,
    decorations: compileDecorations(frontMap.decorations, bounds),
    regions,
    roads: frontMap.roads.map(({ from, to }) => [from, to]),
    roadDefinitions: cloneData(frontMap.roads),
  };
}
