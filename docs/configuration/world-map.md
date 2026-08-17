# World map and geographic front data

The campaign map is now split from the runtime map.

```text
world-map.js
  geographic fragments (longitude / latitude)
        |
        v
map-compiler.js
  equirectangular projection and normalized Canvas points
        |
        v
map.js
  runtime regions, roads, and decorations
```

## Source data

`src/config/world-map.js` is the geographic source of truth. A front selects
fragment IDs from that source. A fragment is the playable map unit and has:

- `countryId`: the display country/character owner
- `fragmentId`: the geographic part used by this front
- `points`: simplified longitude/latitude polygon data
- `centroid`: the geographic interaction center

Large countries may have multiple fragments. Russia currently has two and China
currently has three. A country is complete only after every fragment listed in
`src/config/countries.js` is player-controlled.

The current East Asia front is a verified seed using real country positions and
explicit land/sea links. Its polygons are intentionally compact source data for
the prototype. The compiler accepts the same fragment contract when the
license-cleared, higher-resolution GeoJSON dataset is introduced.

## Roads and preflight checks

`frontMaps[*].roads` is the only authored edge list. Each edge has:

- `kind`: `land` or `sea`
- `passable`: omitted means passable; `false` is rejected

Configuration validation rejects unknown endpoints, self-links, duplicate edges,
non-passable edges, invalid kinds, and disconnected road graphs. Sea links are
explicitly authored instead of being inferred from polygon proximity.

The map uses `interactionPoint` for unit placement and hit testing. This keeps
small or nearby countries selectable without changing the geographic polygons.
Zoom, interaction radius, and label offsets remain presentation concerns.

## Campaign phase data

`src/config/campaign.js` stores front and phase data. Each phase owns:

- territory owners
- production per fragment
- objective fragments
- initial unit deployment and character IDs

`src/config/game-config.js` resolves the front enemy profile at front start and
uses `Math.round(baseStrength * strengthMultiplier)` for every enemy initial
unit. Prototype map strength values are not read.

When a phase changes, `src/campaign/phase-runtime.js` keeps player unit
position, strength, and occupation state. All enemy units are discarded and
the next phase's enemy deployment is created. A defeat does not persist phase
captures; only a fully completed front adds its country IDs to persistent
campaign progress.
