import { NATURAL_EARTH_KOREA_ADMIN_1 } from "./geodata/natural-earth-korea-admin-1.js";

// The source remains Natural Earth first-order administrative boundaries, but
// the game combines adjacent source features into larger, easier-to-select
// strategic regions.
const MAP_SOURCE = {
  id: "natural-earth-admin-1-korea",
  name: "Natural Earth Admin 1 - States, Provinces",
  version: "5.1.1",
  sourceCommit: "9380cca",
  scale: "1:10m",
  license: "Public domain",
  attribution: "Made with Natural Earth.",
  sourceUrl: "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.1/geojson/ne_10m_admin_1_states_provinces.geojson",
  licenseUrl: "https://www.naturalearthdata.com/about/terms-of-use/",
};

const FRONT_REGION_GROUPS = [
  {
    id: "south-capital",
    countryId: "south-korea",
    name: "Capital Region",
    shortName: "CAPITAL",
    labelPoint: [126.994, 37.5408],
    sourceFragmentIds: ["kr-11", "kr-28", "kr-41"],
  },
  {
    id: "south-gangwon",
    countryId: "south-korea",
    name: "Gangwon Region",
    shortName: "GANGWON",
    labelPoint: [128.22, 37.7951],
    sourceFragmentIds: ["kr-42"],
  },
  {
    id: "south-central",
    countryId: "south-korea",
    name: "Central Region",
    shortName: "CENTRAL",
    labelPoint: [127.401, 36.3563],
    sourceFragmentIds: ["kr-44", "kr-43", "kr-30", "kr-50"],
  },
  {
    id: "south-west",
    countryId: "south-korea",
    name: "Southwestern Region",
    shortName: "SOUTHWEST",
    labelPoint: [126.929, 35.1989],
    sourceFragmentIds: ["kr-45", "kr-46", "kr-29"],
  },
  {
    id: "south-east",
    countryId: "south-korea",
    name: "Southeastern Region",
    shortName: "SOUTHEAST",
    labelPoint: [128.631, 35.9034],
    sourceFragmentIds: ["kr-47", "kr-27", "kr-48", "kr-26", "kr-31"],
  },
  {
    id: "south-jeju",
    countryId: "south-korea",
    name: "Jeju",
    shortName: "JEJU",
    labelPoint: [126.557, 33.3741],
    interactionRadius: 0.035,
    sourceFragmentIds: ["kr-49"],
  },
  {
    id: "north-central",
    countryId: "north-korea",
    name: "Pyongyang Corridor",
    shortName: "CENTRAL",
    labelPoint: [125.955, 38.9808],
    sourceFragmentIds: ["kp-01", "kp-02"],
  },
  {
    id: "north-west",
    countryId: "north-korea",
    name: "Northwestern Region",
    shortName: "NORTHWEST",
    labelPoint: [126.404, 40.6548],
    sourceFragmentIds: ["kp-03", "kp-04", "kp-10"],
  },
  {
    id: "north-hwanghae",
    countryId: "north-korea",
    name: "Hwanghae Region",
    shortName: "HWANGHAE",
    labelPoint: [126.297, 38.5962],
    sourceFragmentIds: ["kp-05", "kp-06"],
  },
  {
    id: "north-east-central",
    countryId: "north-korea",
    name: "Eastern Central Region",
    shortName: "EAST",
    labelPoint: [127.521, 38.7273],
    sourceFragmentIds: ["kp-07", "kp-08"],
  },
  {
    id: "north-east",
    countryId: "north-korea",
    name: "Northeastern Region",
    shortName: "NORTHEAST",
    labelPoint: [129.417, 41.8666],
    sourceFragmentIds: ["kp-09", "kp-13"],
  },
];

const SOURCE_ISO_A3_BY_COUNTRY = {
  "south-korea": "KOR",
  "north-korea": "PRK",
};

function sourcePolygons(fragmentId) {
  const geometry = NATURAL_EARTH_KOREA_ADMIN_1[fragmentId].geometry;
  return geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
}

function pointKey(point) {
  return point.map((coordinate) => Number(coordinate).toFixed(6)).join(",");
}

// Remove shared source edges so the renderer can draw one strategic-region
// outline instead of exposing every internal administrative border.
function buildBoundaryGeometry(sourceFragmentIds) {
  const segments = new Map();
  sourceFragmentIds.forEach((fragmentId) => {
    sourcePolygons(fragmentId).forEach((polygon) => polygon.forEach((ring) => {
      for (let index = 0; index < ring.length - 1; index += 1) {
        const start = ring[index];
        const end = ring[index + 1];
        const startKey = pointKey(start);
        const endKey = pointKey(end);
        const edgeKey = [startKey, endKey].sort().join("::");
        if (segments.has(edgeKey)) segments.delete(edgeKey);
        else segments.set(edgeKey, { start, end, startKey, endKey });
      }
    }));
  });

  const remaining = [...segments.values()];
  const rings = [];
  while (remaining.length > 0) {
    const first = remaining.shift();
    const ring = [first.start];
    let current = first.end;
    let currentKey = first.endKey;
    let closed = false;
    for (let guard = 0; guard <= segments.size + 1; guard += 1) {
      if (currentKey === first.startKey) {
        closed = true;
        break;
      }
      const nextIndex = remaining.findIndex((segment) => segment.startKey === currentKey || segment.endKey === currentKey);
      if (nextIndex < 0) break;
      const next = remaining.splice(nextIndex, 1)[0];
      if (next.startKey === currentKey) {
        ring.push(next.start);
        current = next.end;
        currentKey = next.endKey;
      } else {
        ring.push(next.end);
        current = next.start;
        currentKey = next.startKey;
      }
    }
    if (closed && ring.length >= 3) {
      ring.push(ring[0]);
      rings.push([ring]);
    }
  }

  return { type: "MultiPolygon", coordinates: rings.map(([ring]) => [ring]) };
}

const configuredSourceFragmentIds = FRONT_REGION_GROUPS.flatMap((group) => group.sourceFragmentIds);
const sourceFragmentIds = Object.keys(NATURAL_EARTH_KOREA_ADMIN_1);
if (new Set(configuredSourceFragmentIds).size !== configuredSourceFragmentIds.length
  || new Set(configuredSourceFragmentIds).size !== sourceFragmentIds.length
  || sourceFragmentIds.some((fragmentId) => !configuredSourceFragmentIds.includes(fragmentId))) {
  throw new Error("World map: strategic region groups must cover every source fragment exactly once");
}

const fragments = Object.fromEntries(FRONT_REGION_GROUPS.map((group) => [group.id, {
  id: group.id,
  countryId: group.countryId,
  name: group.name,
    shortName: group.shortName,
    centroid: group.labelPoint,
    interactionRadius: group.interactionRadius,
    geometry: {
    type: "MultiPolygon",
    coordinates: group.sourceFragmentIds.flatMap(sourcePolygons),
  },
  borderGeometry: buildBoundaryGeometry(group.sourceFragmentIds),
  sourceFeature: {
    isoA3: SOURCE_ISO_A3_BY_COUNTRY[group.countryId],
    sourceFragmentIds: [...group.sourceFragmentIds],
    name: group.name,
  },
}]));

export const WORLD_MAP = {
  id: "natural-earth-korea-regions-v2",
  source: MAP_SOURCE,
  projection: {
    type: "equirectangular",
    bounds: { west: 124, east: 132, south: 32, north: 44 },
  },
  fragments,
  frontMaps: {
    "korea-front": {
      id: "korea-front",
      name: "Korean Peninsula Front",
      bounds: { west: 124, east: 132, south: 32, north: 44 },
      interactionMinDistance: 0.045,
      interactionHitRadius: 0.018,
      fragmentIds: FRONT_REGION_GROUPS.map((group) => group.id),
      roads: [
        { from: "south-gangwon", to: "north-east-central", kind: "land" },
        { from: "south-gangwon", to: "south-capital", kind: "land" },
        { from: "south-gangwon", to: "south-east", kind: "land" },
        { from: "south-gangwon", to: "south-central", kind: "land" },
        { from: "north-east-central", to: "south-capital", kind: "land" },
        { from: "north-east-central", to: "north-hwanghae", kind: "land" },
        { from: "north-east-central", to: "north-central", kind: "land" },
        { from: "south-capital", to: "north-hwanghae", kind: "land" },
        { from: "south-capital", to: "south-central", kind: "land" },
        { from: "north-hwanghae", to: "north-central", kind: "land" },
        { from: "north-east", to: "north-west", kind: "land" },
        { from: "north-east", to: "north-east-central", kind: "land" },
        { from: "north-west", to: "north-east-central", kind: "land" },
        { from: "north-west", to: "north-central", kind: "land" },
        { from: "south-central", to: "south-west", kind: "land" },
        { from: "south-west", to: "south-east", kind: "land" },
        { from: "south-east", to: "south-central", kind: "land" },
        { from: "south-jeju", to: "south-west", kind: "sea" },
      ],
      decorations: {
        labels: [
          { text: "KOREAN PENINSULA", coordinates: [130.4, 42.4] },
        ],
        lines: [],
      },
    },
  },
};
