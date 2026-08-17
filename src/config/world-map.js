import { NATURAL_EARTH_KOREA_FEATURES } from "./geodata/natural-earth-korea.js";

// Map geometry is sourced from Natural Earth rather than hand-authored
// rectangles. Coordinates are longitude/latitude pairs and are projected by
// map-compiler.js at runtime.
const MAP_SOURCE = {
  id: "natural-earth-110m-admin-0-countries",
  name: "Natural Earth Admin 0 – Countries",
  version: "5.1.1",
  sourceCommit: "9380cca",
  scale: "1:110m",
  license: "Public domain",
  attribution: "Made with Natural Earth.",
  sourceUrl: "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.1/geojson/ne_110m_admin_0_countries.geojson",
  licenseUrl: "https://www.naturalearthdata.com/about/terms-of-use/",
};

function countryFragment(id, countryId, name, shortName) {
  const feature = NATURAL_EARTH_KOREA_FEATURES[id];
  return {
    id,
    countryId,
    name,
    shortName,
    centroid: feature.labelPoint,
    geometry: feature.geometry,
    sourceFeature: {
      isoA3: feature.isoA3,
      name: feature.name,
    },
  };
}

export const WORLD_MAP = {
  id: "natural-earth-korea-front-v1",
  source: MAP_SOURCE,
  projection: {
    type: "equirectangular",
    bounds: { west: 124, east: 132, south: 32, north: 44 },
  },
  fragments: {
    "north-korea": countryFragment("north-korea", "north-korea", "North Korea", "NORTH KOREA"),
    "south-korea": countryFragment("south-korea", "south-korea", "South Korea", "SOUTH KOREA"),
  },
  frontMaps: {
    "korea-front": {
      id: "korea-front",
      name: "Korean Peninsula Front",
      bounds: { west: 124, east: 132, south: 32, north: 44 },
      interactionMinDistance: 0.18,
      interactionHitRadius: 0.08,
      fragmentIds: ["south-korea", "north-korea"],
      roads: [
        { from: "south-korea", to: "north-korea", kind: "land" },
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
