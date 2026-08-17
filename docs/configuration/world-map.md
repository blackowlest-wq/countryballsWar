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

`src/config/world-map.js` remains the geographic source of truth. The active
`korea-front` selects only the South Korea and North Korea fragments and uses
close-up bounds. The larger East Asia source map remains data-only until its
scope is intentionally reintroduced as another front.

The playable unit is a country fragment. `countryId` identifies the country
character and `fragmentId` identifies a split piece of territory. A country is
completed only after every fragment listed in `src/config/countries.js` is
player-controlled.

Road validation covers explicit land and sea links. Interaction-point distance
validation prevents nearby targets from sharing a touch hit area.
