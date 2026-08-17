# Map configuration

## Canonical files

- Geographic source: `src/config/world-map.js`
- Country master: `src/config/countries.js`
- Compiler: `src/config/map-compiler.js`
- Active runtime map: `src/config/map.js`

`map.js` is compiled from Natural Earth geographic longitude/latitude data. The
active map is a close-up projection of the Korean Peninsula. The original
GeoJSON and the extraction used by the runtime are stored in
`src/config/geodata/`.

The current source is Natural Earth Admin 0 – Countries, 1:110m, v5.1.1
(commit `9380cca`, public domain). The map source metadata is exposed as
`GAME_CONFIG.map.source` so a future data update must be explicit.

## Active front fragments

| Fragment | Country | Role |
|---|---|---|
| `south-korea` | South Korea | Player starting territory |
| `north-korea` | North Korea | Single target country |

The active front has one passable land road between the two fragments. It uses
front-specific projection bounds so the small battlefield is not rendered as
a tiny part of the full world view.

## Roads and interaction safety

Roads are authored once in `WORLD_MAP.frontMaps[*].roads` and compiled to the
runtime `roads` array plus `roadDefinitions` metadata. Validation checks
unknown endpoints, self-links, duplicate reverse links, non-passable edges,
invalid kinds, and graph connectivity.

Each fragment has an `interactionPoint`. `interactionMinDistance` rejects
overlapping target centers, while `interactionHitRadius` allows selection near
small country shapes. A target is selected by polygon first and then by the
nearest interaction point.
