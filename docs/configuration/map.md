# Map configuration

## Canonical files

- Geographic source: `src/config/world-map.js`
- Country master: `src/config/countries.js`
- Compiler: `src/config/map-compiler.js`
- Active runtime map: `src/config/map.js`

`map.js` is compiled from Natural Earth longitude/latitude data. The active
map is a close-up projection of the Korean Peninsula. The extracted GeoJSON
and the runtime subset are stored in `src/config/geodata/`.

The source is Natural Earth Admin 1 - States, Provinces, 1:10m, v5.1.1
(commit `9380cca`, public domain). The map source metadata is exposed as
`GAME_CONFIG.map.source` so a future data update must be explicit.

## Active front regions

The source contains 28 administrative features, but the game combines
adjacent features into 11 strategic regions to keep the map readable and
reduce accidental taps: six in South Korea and five in North Korea.

| Region | Combined source areas | Country | Starting owner |
|---|---|---|---|
| `south-capital` | Seoul, Incheon, Gyeonggi | South Korea | Player |
| `south-gangwon` | Gangwon | South Korea | Player |
| `south-central` | South/North Chungcheong, Daejeon, Sejong | South Korea | Player |
| `south-west` | North/South Jeolla, Gwangju | South Korea | Player |
| `south-east` | North/South Gyeongsang, Daegu, Busan, Ulsan | South Korea | Player |
| `south-jeju` | Jeju | South Korea | Player |
| `north-central` | Pyongyang, South Pyongan | North Korea | Enemy |
| `north-west` | North Pyongan, Chagang, Ryanggang | North Korea | Enemy |
| `north-hwanghae` | North/South Hwanghae | North Korea | Enemy |
| `north-east-central` | Kangwon, South Hamgyong | North Korea | Enemy |
| `north-east` | North Hamgyong, Rason | North Korea | Enemy |

Country completion is evaluated against these strategic regions. South Korea
requires all six `south-*` regions; North Korea requires all five `north-*`
regions.

## Roads and interaction safety

Roads are authored once in `WORLD_MAP.frontMaps[*].roads` and compiled to the
runtime `roads` array plus `roadDefinitions` metadata. The active front has 18
passable adjacency links: 17 land links and one sea link from Jeju to the
Southwestern Region. Validation checks unknown endpoints, self-links, duplicate
reverse links, non-passable edges, invalid kinds, and graph connectivity.

Each strategic region uses a source label point as its `interactionPoint`.
`interactionMinDistance` is `0.045` and `interactionHitRadius` is `0.018`,
which leaves a larger gap between fallback hit areas than the previous
administrative-region map. The polygon is tested first, followed by the
nearest interaction point.
