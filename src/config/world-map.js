import { NATURAL_EARTH_KOREA_ADMIN_1 } from "./geodata/natural-earth-korea-admin-1.js";

// The active front uses Natural Earth first-order administrative boundaries.
// Coordinates are longitude/latitude pairs and are projected by
// map-compiler.js at runtime.
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

const SOUTH_KOREA_FRAGMENT_IDS = [
  "kr-42",
  "kr-41",
  "kr-44",
  "kr-28",
  "kr-45",
  "kr-46",
  "kr-48",
  "kr-26",
  "kr-31",
  "kr-47",
  "kr-49",
  "kr-11",
  "kr-30",
  "kr-50",
  "kr-43",
  "kr-29",
  "kr-27",
];

const NORTH_KOREA_FRAGMENT_IDS = [
  "kp-07",
  "kp-06",
  "kp-09",
  "kp-13",
  "kp-10",
  "kp-04",
  "kp-03",
  "kp-02",
  "kp-05",
  "kp-08",
  "kp-01",
];

const FRONT_FRAGMENT_IDS = [...SOUTH_KOREA_FRAGMENT_IDS, ...NORTH_KOREA_FRAGMENT_IDS];

const fragments = Object.fromEntries(FRONT_FRAGMENT_IDS.map((fragmentId) => {
  const feature = NATURAL_EARTH_KOREA_ADMIN_1[fragmentId];
  return [fragmentId, {
    id: fragmentId,
    countryId: feature.countryId,
    name: feature.name,
    shortName: feature.name.toUpperCase(),
    centroid: feature.labelPoint,
    geometry: feature.geometry,
    sourceFeature: {
      isoA3: feature.isoA3,
      iso3166: feature.iso3166,
      name: feature.name,
    },
  }];
}));

export const WORLD_MAP = {
  id: "natural-earth-korea-admin-1-v1",
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
      interactionMinDistance: 0.022,
      interactionHitRadius: 0.009,
      fragmentIds: FRONT_FRAGMENT_IDS,
      roads: [
        { from: "kr-42", to: "kp-07", kind: "land" },
        { from: "kr-42", to: "kr-41", kind: "land" },
        { from: "kr-42", to: "kr-47", kind: "land" },
        { from: "kr-42", to: "kr-43", kind: "land" },
        { from: "kp-07", to: "kr-41", kind: "land" },
        { from: "kp-07", to: "kp-06", kind: "land" },
        { from: "kp-07", to: "kp-02", kind: "land" },
        { from: "kp-07", to: "kp-08", kind: "land" },
        { from: "kr-41", to: "kp-06", kind: "land" },
        { from: "kr-41", to: "kr-44", kind: "land" },
        { from: "kr-41", to: "kr-28", kind: "land" },
        { from: "kr-41", to: "kr-11", kind: "land" },
        { from: "kr-41", to: "kr-43", kind: "land" },
        { from: "kp-06", to: "kp-02", kind: "land" },
        { from: "kp-06", to: "kp-05", kind: "land" },
        { from: "kp-06", to: "kp-01", kind: "land" },
        { from: "kp-09", to: "kp-13", kind: "land" },
        { from: "kp-09", to: "kp-10", kind: "land" },
        { from: "kp-09", to: "kp-08", kind: "land" },
        { from: "kp-10", to: "kp-04", kind: "land" },
        { from: "kp-10", to: "kp-08", kind: "land" },
        { from: "kp-04", to: "kp-03", kind: "land" },
        { from: "kp-04", to: "kp-02", kind: "land" },
        { from: "kp-04", to: "kp-08", kind: "land" },
        { from: "kp-03", to: "kp-02", kind: "land" },
        { from: "kr-44", to: "kr-45", kind: "land" },
        { from: "kr-44", to: "kr-30", kind: "land" },
        { from: "kr-44", to: "kr-50", kind: "land" },
        { from: "kr-44", to: "kr-43", kind: "land" },
        { from: "kp-02", to: "kp-08", kind: "land" },
        { from: "kp-02", to: "kp-01", kind: "land" },
        { from: "kr-45", to: "kr-46", kind: "land" },
        { from: "kr-45", to: "kr-48", kind: "land" },
        { from: "kr-45", to: "kr-47", kind: "land" },
        { from: "kr-45", to: "kr-43", kind: "land" },
        { from: "kr-46", to: "kr-48", kind: "land" },
        { from: "kr-46", to: "kr-29", kind: "land" },
        { from: "kr-48", to: "kr-26", kind: "land" },
        { from: "kr-48", to: "kr-31", kind: "land" },
        { from: "kr-48", to: "kr-47", kind: "land" },
        { from: "kr-31", to: "kr-47", kind: "land" },
        { from: "kr-47", to: "kr-43", kind: "land" },
        { from: "kr-47", to: "kr-27", kind: "land" },
        { from: "kr-30", to: "kr-50", kind: "land" },
        { from: "kr-30", to: "kr-43", kind: "land" },
        { from: "kr-50", to: "kr-43", kind: "land" },
        { from: "kr-49", to: "kr-46", kind: "sea" },
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
