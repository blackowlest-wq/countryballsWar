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

function projectRing(ring, bounds) {
  return ring.map((point) => projectGeoPoint(point, bounds));
}

function projectGeometry(geometry, bounds) {
  if (!geometry || !["Polygon", "MultiPolygon"].includes(geometry.type)) {
    throw new Error(`Map compiler: unsupported geometry type ${geometry?.type || "missing"}`);
  }

  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  return polygons.map((polygon) => polygon.map((ring) => projectRing(ring, bounds)));
}

function fragmentPolygons(fragment, bounds) {
  if (fragment.geometry) return projectGeometry(fragment.geometry, bounds);
  if (Array.isArray(fragment.points)) return [[projectRing(fragment.points, bounds)]];
  throw new Error(`Map compiler: fragment ${fragment.id} has no geometry`);
}

function fragmentBorderPolygons(fragment, bounds) {
  if (fragment.borderGeometry) return projectGeometry(fragment.borderGeometry, bounds);
  return fragmentPolygons(fragment, bounds);
}

export function compileWorldFrontMap(worldMap, frontMap, countries) {
  const bounds = frontMap.bounds || worldMap.projection.bounds;
  const viewport = frontMap.viewport || {};
  const regions = frontMap.fragmentIds.map((fragmentId) => {
    const fragment = worldMap.fragments[fragmentId];
    const country = countries[fragment?.countryId];
    if (!fragment || !country) throw new Error(`Map compiler: missing fragment or country for ${fragmentId}`);
    const polygons = fragmentPolygons(fragment, bounds);
    const borderPolygons = fragmentBorderPolygons(fragment, bounds);
    const points = polygons[0][0];
    return {
      id: fragment.id,
      countryId: fragment.countryId,
      fragmentId: fragment.id,
      name: fragment.name || country.name,
      shortName: fragment.shortName || country.shortName,
      points,
      polygons,
      borderPolygons,
      interactionPoint: projectGeoPoint(fragment.interactionPoint || fragment.centroid, bounds),
      interactionRadius: fragment.interactionRadius,
      sourceCoordinates: cloneData(fragment.geometry?.coordinates || fragment.points),
      sourceGeometry: cloneData(fragment.geometry),
      sourceFeature: cloneData(fragment.sourceFeature),
      sourceCentroid: cloneData(fragment.centroid),
      isMajor: country.isMajor,
    };
  });

  return {
    id: frontMap.id,
    name: frontMap.name,
    sourceWorldMapId: worldMap.id,
    source: cloneData(frontMap.source || worldMap.source),
    projection: { ...cloneData(worldMap.projection), bounds: cloneData(bounds) },
    displayOffset: cloneData(frontMap.displayOffset || { x: 0, y: 0 }),
    viewport: {
      initialZoom: viewport.initialZoom ?? 1,
      minZoom: viewport.minZoom ?? 0.82,
      maxZoom: viewport.maxZoom ?? 1.42,
      initialFocusRegionId: viewport.initialFocusRegionId || null,
      focusAnchor: cloneData(viewport.focusAnchor || [0.5, 0.5]),
    },
    interactionMinDistance: frontMap.interactionMinDistance,
    interactionHitRadius: frontMap.interactionHitRadius,
    decorations: compileDecorations(frontMap.decorations, bounds),
    regions,
    roads: frontMap.roads.map(({ from, to }) => [from, to]),
    roadDefinitions: cloneData(frontMap.roads),
  };
}
