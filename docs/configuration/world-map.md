# World map and geographic map data

Each campaign map is split from the geographic source and compiled as an
independent runtime map.

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
  runtime map master: regions, roads, and decorations per mapId
```

`src/config/world-map.js` is the geographic map-definition source of truth.
The Korea, Japan, and China maps use checked-in Natural Earth Admin 1 - States,
Provinces GeoJSON subsets at 1:10m, pinned to v5.1.1 (`9380cca`). The 28 Korea
features are combined into 11 larger strategic regions. Japan retains all 47
prefecture features for audit but excludes Okinawa from its 11 playable
regions. China retains 32 source features for audit but excludes the remote
Paracel Islands feature and combines the remaining 31 into 14 playable
regions.

The source subset is retained in
`src/config/geodata/ne_10m_admin_1_korea.geojson`; the compact runtime data is
`src/config/geodata/natural-earth-korea-admin-1.js`. The Japan audit subset is
`src/config/geodata/ne_10m_admin_1_japan.geojson`, with compact runtime data in
`src/config/geodata/natural-earth-japan-admin-1.js`. The corresponding China
files are `src/config/geodata/ne_10m_admin_1_china.geojson` and
`src/config/geodata/natural-earth-china-admin-1.js`. The full Admin 0 source is
also retained for future country-level fronts. No map polygons are hand-
authored.

Natural Earth is public domain. The source URL and license URL are carried in
each map's `frontMaps[*].source` metadata, and the extraction details are documented in
`src/config/geodata/README.md`.

The playable unit is a strategic region. `countryId` identifies the country
character for enemy units, while each region retains `sourceFragmentIds` for
traceability. Every map contains 10 to 15 strategic regions. The player uses a
separate white character and begins with one region. A country is completed only after every region listed in
`src/config/countries.js` is player-controlled.

Road validation covers explicit land and sea links. Strategic-region outer
borders hide internal source-administration lines, and interaction-point
validation prevents nearby targets from sharing a touch hit area.
