# Map configuration

## Canonical files

- Geographic source: `src/config/world-map.js`
- Country master: `src/config/countries.js`
- Compiler: `src/config/map-compiler.js`
- Runtime map: `src/config/map.js`

`map.js` is compiled from geographic source data. Do not author gameplay
coordinates directly in `main.js`.

## Current front fragments

| Fragment | Country | Role |
|---|---|---|
| `russia-east` | Russia | Major-country fragment |
| `russia-far-east` | Russia | Major-country fragment |
| `kazakhstan` | Kazakhstan | Western entry |
| `mongolia` | Mongolia | Central land corridor |
| `china-north` | China | Major-country fragment |
| `china-central` | China | Major-country fragment |
| `china-south` | China | Major-country fragment |
| `north-korea` | North Korea | Land bridge |
| `south-korea` | South Korea | Peninsula |
| `japan` | Japan | Major island country |
| `vietnam` | Vietnam | Southern mainland |
| `philippines` | Philippines | Sea-route island country |
| `indonesia` | Indonesia | Southern island group |

The points are longitude/latitude polygons projected to normalized Canvas
coordinates. The current source is a compact geographic seed; a higher
resolution licensed GeoJSON source can replace the fragment points without
changing runtime behavior.

## Roads

Roads are authored once in `WORLD_MAP.frontMaps[*].roads` and compiled to the
runtime `roads` array plus `roadDefinitions` metadata.

- `land`: ordinary land route
- `sea`: explicit sea/ferry route
- `passable: false`: invalid for this game and rejected during configuration

Validation checks unknown endpoints, self-links, duplicate reverse links,
non-passable edges, invalid kinds, and graph connectivity.

## Interaction safety

Each fragment has an `interactionPoint`. `interactionMinDistance` rejects
overlapping target centers, while `interactionHitRadius` allows selection near
small country shapes. A target is selected by polygon first and then by the
nearest interaction point, so visual geometry and touch affordance remain
separate.
