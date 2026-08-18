const WORLD_MAP_VIEW_BOX = "0 0 360 180";

function projectPoint([longitude, latitude]) {
  return [
    ((longitude + 180) / 360) * 360,
    ((90 - latitude) / 180) * 180,
  ];
}

function ringPath(ring) {
  if (!Array.isArray(ring) || ring.length < 3) return "";
  const points = ring
    .filter((point) => Array.isArray(point) && point.length >= 2 && point.every(Number.isFinite))
    .map(projectPoint);
  if (points.length < 3) return "";
  const [first, ...rest] = points;
  return `M ${first[0].toFixed(2)} ${first[1].toFixed(2)} ${rest.map(([x, y]) => `L ${x.toFixed(2)} ${y.toFixed(2)}`).join(" ")} Z`;
}

export function geometryToPathData(geometry) {
  if (!geometry || !["Polygon", "MultiPolygon"].includes(geometry.type)) return "";
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  return polygons
    .flatMap((polygon) => (Array.isArray(polygon) ? polygon.map(ringPath) : []))
    .filter(Boolean)
    .join(" ");
}

function featureLabelPoint(feature) {
  const longitude = Number(feature?.properties?.LABEL_X);
  const latitude = Number(feature?.properties?.LABEL_Y);
  if (Number.isFinite(longitude) && Number.isFinite(latitude)) return [longitude, latitude];

  const bbox = feature?.bbox;
  if (!Array.isArray(bbox) || bbox.length < 4 || !bbox.every(Number.isFinite)) return null;
  return [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2];
}

export function getCountryWorldMapData(worldGeoJson, isoA3) {
  const features = Array.isArray(worldGeoJson?.features) ? worldGeoJson.features : [];
  const selectedFeature = features.find((feature) => feature?.properties?.ISO_A3 === isoA3) || null;
  return {
    paths: features
      .map((feature) => ({
        path: geometryToPathData(feature.geometry),
        selected: feature === selectedFeature,
      }))
      .filter(({ path }) => path),
    selectedPoint: featureLabelPoint(selectedFeature),
    viewBox: WORLD_MAP_VIEW_BOX,
  };
}

export function projectWorldMapPoint(point) {
  if (!Array.isArray(point) || point.length < 2 || !point.every(Number.isFinite)) return null;
  return projectPoint(point);
}
