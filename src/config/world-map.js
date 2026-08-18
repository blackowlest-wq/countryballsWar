import { NATURAL_EARTH_KOREA_ADMIN_1 } from "./geodata/natural-earth-korea-admin-1.js";
import { NATURAL_EARTH_JAPAN_ADMIN_1 } from "./geodata/natural-earth-japan-admin-1.js";

// The source remains Natural Earth first-order administrative boundaries, but
// the game combines adjacent source features into larger, easier-to-select
// strategic regions.
const KOREA_MAP_SOURCE = {
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

const JAPAN_MAP_SOURCE = {
  id: "natural-earth-admin-1-japan",
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

const JAPAN_REGION_GROUPS = [
  {
    id: "japan-kyushu-north",
    countryId: "japan",
    name: "Northern Kyushu",
    shortName: "KYUSHU N",
    labelPoint: [130.72, 33.3],
    sourceFragmentIds: ["jp-40", "jp-41", "jp-42", "jp-43", "jp-44"],
  },
  {
    id: "japan-kyushu-south",
    countryId: "japan",
    name: "Southern Kyushu",
    shortName: "KYUSHU S",
    labelPoint: [130.75, 31.55],
    sourceFragmentIds: ["jp-45", "jp-46"],
  },
  {
    id: "japan-shikoku",
    countryId: "japan",
    name: "Shikoku Region",
    shortName: "SHIKOKU",
    labelPoint: [133.75, 33.85],
    sourceFragmentIds: ["jp-36", "jp-37", "jp-38", "jp-39"],
  },
  {
    id: "japan-chugoku",
    countryId: "japan",
    name: "Chugoku Region",
    shortName: "CHUGOKU",
    labelPoint: [132.72, 34.78],
    sourceFragmentIds: ["jp-31", "jp-32", "jp-33", "jp-34", "jp-35"],
  },
  {
    id: "japan-kansai",
    countryId: "japan",
    name: "Kansai Region",
    shortName: "KANSAI",
    labelPoint: [135.55, 34.78],
    sourceFragmentIds: ["jp-25", "jp-26", "jp-27", "jp-28", "jp-29", "jp-30"],
  },
  {
    id: "japan-chubu",
    countryId: "japan",
    name: "Chubu Region",
    shortName: "CHUBU",
    labelPoint: [137.25, 35.25],
    sourceFragmentIds: ["jp-18", "jp-20", "jp-21", "jp-22", "jp-23", "jp-24"],
  },
  {
    id: "japan-hokuriku",
    countryId: "japan",
    name: "Hokuriku Region",
    shortName: "HOKURIKU",
    labelPoint: [136.9, 36.55],
    sourceFragmentIds: ["jp-15", "jp-16", "jp-17"],
  },
  {
    id: "japan-kanto",
    countryId: "japan",
    name: "Kanto Region",
    shortName: "KANTO",
    labelPoint: [139.48, 35.72],
    sourceFragmentIds: ["jp-08", "jp-09", "jp-10", "jp-11", "jp-12", "jp-13", "jp-14", "jp-19"],
  },
  {
    id: "japan-tohoku-south",
    countryId: "japan",
    name: "Southern Tohoku",
    shortName: "TOHOKU S",
    labelPoint: [140.42, 37.75],
    sourceFragmentIds: ["jp-04", "jp-07"],
  },
  {
    id: "japan-tohoku-north",
    countryId: "japan",
    name: "Northern Tohoku",
    shortName: "TOHOKU N",
    labelPoint: [140.55, 39.75],
    sourceFragmentIds: ["jp-02", "jp-03", "jp-05", "jp-06"],
  },
  {
    id: "japan-hokkaido",
    countryId: "japan",
    name: "Hokkaido Region",
    shortName: "HOKKAIDO",
    labelPoint: [142.8, 43.35],
    sourceFragmentIds: ["jp-01"],
  },
];

const KOREA_SOURCE_ISO_A3_BY_COUNTRY = {
  "south-korea": "KOR",
  "north-korea": "PRK",
};

const JAPAN_SOURCE_ISO_A3_BY_COUNTRY = {
  japan: "JPN",
};

function polygonArea(polygon) {
  const ring = polygon[0] || [];
  return Math.abs(ring.reduce((total, point, index) => {
    const next = ring[(index + 1) % ring.length];
    return total + point[0] * next[1] - next[0] * point[1];
  }, 0)) / 2;
}

function sourcePolygons(sourceFragments, fragmentId, { mainLandOnly = false } = {}) {
  const geometry = sourceFragments[fragmentId].geometry;
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  if (!mainLandOnly) return polygons;
  return polygons.slice().sort((left, right) => polygonArea(right) - polygonArea(left)).slice(0, 1);
}

function pointKey(point) {
  return point.map((coordinate) => Number(coordinate).toFixed(6)).join(",");
}

// Remove shared source edges so the renderer can draw one strategic-region
// outline instead of exposing every internal administrative border.
function buildBoundaryGeometry(sourceFragments, sourceFragmentIds, options = {}) {
  const segments = new Map();
  sourceFragmentIds.forEach((fragmentId) => {
    sourcePolygons(sourceFragments, fragmentId, options).forEach((polygon) => polygon.forEach((ring) => {
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

function assertSourceCoverage(sourceFragments, groups, sourceLabel, excludedSourceFragmentIds = []) {
  const configuredSourceFragmentIds = groups.flatMap((group) => group.sourceFragmentIds);
  const excluded = new Set(excludedSourceFragmentIds);
  const sourceFragmentIds = Object.keys(sourceFragments).filter((fragmentId) => !excluded.has(fragmentId));
  if ([...excluded].some((fragmentId) => !Object.hasOwn(sourceFragments, fragmentId))) {
    throw new Error(`World map: ${sourceLabel} excludes an unknown source fragment`);
  }
  if (new Set(configuredSourceFragmentIds).size !== configuredSourceFragmentIds.length
    || new Set(configuredSourceFragmentIds).size !== sourceFragmentIds.length
    || sourceFragmentIds.some((fragmentId) => !configuredSourceFragmentIds.includes(fragmentId))) {
    throw new Error(`World map: ${sourceLabel} strategic region groups must cover every source fragment exactly once`);
  }
}

function buildFragments(sourceFragments, groups, sourceIsoA3ByCountry, options = {}) {
  return Object.fromEntries(groups.map((group) => [group.id, {
    id: group.id,
    countryId: group.countryId,
    name: group.name,
    shortName: group.shortName,
    centroid: group.labelPoint,
    interactionRadius: group.interactionRadius,
    geometry: {
      type: "MultiPolygon",
      coordinates: group.sourceFragmentIds.flatMap((fragmentId) => sourcePolygons(sourceFragments, fragmentId, options)),
    },
    borderGeometry: buildBoundaryGeometry(sourceFragments, group.sourceFragmentIds, options),
    sourceFeature: {
      isoA3: sourceIsoA3ByCountry[group.countryId],
      sourceFragmentIds: [...group.sourceFragmentIds],
      name: group.name,
    },
  }]));
}

assertSourceCoverage(NATURAL_EARTH_KOREA_ADMIN_1, FRONT_REGION_GROUPS, "Korea");
assertSourceCoverage(NATURAL_EARTH_JAPAN_ADMIN_1, JAPAN_REGION_GROUPS, "Japan", ["jp-47"]);

const fragments = {
  ...buildFragments(NATURAL_EARTH_KOREA_ADMIN_1, FRONT_REGION_GROUPS, KOREA_SOURCE_ISO_A3_BY_COUNTRY),
  ...buildFragments(NATURAL_EARTH_JAPAN_ADMIN_1, JAPAN_REGION_GROUPS, JAPAN_SOURCE_ISO_A3_BY_COUNTRY, { mainLandOnly: true }),
};

export const WORLD_MAP = {
  id: "natural-earth-admin-1-regions-v3",
  source: KOREA_MAP_SOURCE,
  projection: {
    type: "equirectangular",
    bounds: { west: 124, east: 132, south: 32, north: 44 },
  },
  fragments,
  frontMaps: {
    "korea-front": {
      id: "korea-front",
      name: "朝鮮半島マップ",
      source: KOREA_MAP_SOURCE,
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
    "japan-front": {
      id: "japan-front",
      name: "日本マップ",
      source: JAPAN_MAP_SOURCE,
      // The playable Japan map focuses on the main islands. Remote islands are
      // removed from the compiled geometry, so the projection can fit the
      // archipelago without large empty ocean margins.
      bounds: { west: 129.3, east: 146.1, south: 30.7, north: 45.8 },
      displayOffset: { x: 0, y: 0 },
      viewport: {
        initialZoom: 1.25,
        minZoom: 0.82,
        maxZoom: 1.42,
        initialFocusRegionId: "japan-kyushu-south",
        focusAnchor: [0.5, 0.72],
      },
      interactionMinDistance: 0.045,
      interactionHitRadius: 0.018,
      fragmentIds: JAPAN_REGION_GROUPS.map((group) => group.id),
      roads: [
        { from: "japan-kyushu-south", to: "japan-kyushu-north", kind: "land" },
        { from: "japan-kyushu-north", to: "japan-chugoku", kind: "sea" },
        { from: "japan-kyushu-north", to: "japan-shikoku", kind: "sea" },
        { from: "japan-chugoku", to: "japan-shikoku", kind: "sea" },
        { from: "japan-chugoku", to: "japan-kansai", kind: "land" },
        { from: "japan-shikoku", to: "japan-kansai", kind: "sea" },
        { from: "japan-kansai", to: "japan-chubu", kind: "land" },
        { from: "japan-chubu", to: "japan-hokuriku", kind: "land" },
        { from: "japan-chubu", to: "japan-kanto", kind: "land" },
        { from: "japan-hokuriku", to: "japan-kanto", kind: "land" },
        { from: "japan-kanto", to: "japan-tohoku-south", kind: "land" },
        { from: "japan-tohoku-south", to: "japan-tohoku-north", kind: "land" },
        { from: "japan-tohoku-north", to: "japan-hokkaido", kind: "sea" },
      ],
      decorations: {
        labels: [
          { text: "JAPAN ARCHIPELAGO", coordinates: [137.7, 45.2] },
        ],
        lines: [],
      },
    },
  },
};
