# World map and geographic front data

The campaign map is split from the geographic source and compiled per front.

```text
world-map.js
  geographic fragments (longitude / latitude)
        |
        v
map-compiler.js
  front bounds + equirectangular projection
        |
        v
map.js
  active runtime regions, roads, and decorations
```

`src/config/world-map.js` remains the front-definition source of truth. Its
country geometry comes from the checked-in Natural Earth Admin 0 – Countries
GeoJSON at 1:110m, pinned to v5.1.1 (`9380cca`). The active `korea-front`
selects only the South Korea and North Korea features and uses close-up bounds.
The full source file is retained in `src/config/geodata/` so later fronts can
select additional countries without recreating geographic polygons by hand.

Natural Earth is public domain. The source URL and license URL are carried in
`WORLD_MAP.source`, and the small runtime subset is documented in
`src/config/geodata/README.md`.

The playable unit is a country fragment. `countryId` identifies the country
character and `fragmentId` identifies a split piece of territory. A country is
completed only after every fragment listed in `src/config/countries.js` is
player-controlled.

Road validation covers explicit land and sea links. Interaction-point distance
validation prevents nearby targets from sharing a touch hit area.
