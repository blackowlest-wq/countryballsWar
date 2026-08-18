# World map and geographic front data

The campaign map is split from the geographic source and compiled per front.

```text
world-map.js
  Natural Earth Admin 1 features (longitude / latitude)
        |
        v
  strategic region grouping + outer-border extraction
        |
        v
map-compiler.js
  front bounds + equirectangular projection
        |
        v
map.js
  active runtime regions, roads, and decorations
```

`src/config/world-map.js` is the front-definition source of truth. The active
Korea Front uses the checked-in Natural Earth Admin 1 - States, Provinces
GeoJSON subset at 1:10m, pinned to v5.1.1 (`9380cca`). The 28 source features
are combined into 11 larger strategic regions while preserving their actual
geographic outlines.

The source subset is retained in
`src/config/geodata/ne_10m_admin_1_korea.geojson`; the compact runtime data is
`src/config/geodata/natural-earth-korea-admin-1.js`. The full Admin 0 source
is also retained for future country-level fronts. No map polygons are
hand-authored.

Natural Earth is public domain. The source URL and license URL are carried in
`WORLD_MAP.source`, and the extraction details are documented in
`src/config/geodata/README.md`.

The playable unit is a strategic region. `countryId` identifies the country
character for enemy units, while each region retains `sourceFragmentIds` for
traceability. The player uses a separate white character and begins with one
region. A country is completed only after every region listed in
`src/config/countries.js` is player-controlled.

Road validation covers explicit land and sea links. Strategic-region outer
borders hide internal source-administration lines, and interaction-point
validation prevents nearby targets from sharing a touch hit area.
