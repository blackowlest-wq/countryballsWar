# Map configuration

## Canonical files

- Geographic source: `src/config/world-map.js`
- Country master: `src/config/countries.js`
- Compiler: `src/config/map-compiler.js`
- Active runtime map: `src/config/map.js`

`map.js` is compiled from Natural Earth longitude/latitude data. The active
map is a close-up projection of the Korean Peninsula. The extracted GeoJSON
and the runtime subset are stored in `src/config/geodata/`.

The active source is Natural Earth Admin 1 - States, Provinces, 1:10m,
v5.1.1 (commit `9380cca`, public domain). Source metadata is exposed as
`GAME_CONFIG.map.source`, so a future data update must be explicit.

## Active front fragments

The Korea Front contains all 28 first-order administrative fragments from the
Natural Earth Admin 1 source: 17 in South Korea and 11 in North Korea.

| Fragment | Region | Country | Starting owner |
|---|---|---|---|
| `kr-42` | Gangwon | South Korea | Player |
| `kr-41` | Gyeonggi | South Korea | Player |
| `kr-44` | South Chungcheong | South Korea | Player |
| `kr-28` | Incheon | South Korea | Player |
| `kr-45` | North Jeolla | South Korea | Player |
| `kr-46` | South Jeolla | South Korea | Player |
| `kr-48` | South Gyeongsang | South Korea | Player |
| `kr-26` | Busan | South Korea | Player |
| `kr-31` | Ulsan | South Korea | Player |
| `kr-47` | North Gyeongsang | South Korea | Player |
| `kr-49` | Jeju | South Korea | Player |
| `kr-11` | Seoul | South Korea | Player |
| `kr-30` | Daejeon | South Korea | Player |
| `kr-50` | Sejong | South Korea | Player |
| `kr-43` | North Chungcheong | South Korea | Player |
| `kr-29` | Gwangju | South Korea | Player |
| `kr-27` | Daegu | South Korea | Player |
| `kp-07` | Kangwon | North Korea | Enemy |
| `kp-06` | North Hwanghae | North Korea | Enemy |
| `kp-09` | North Hamgyong | North Korea | Enemy |
| `kp-13` | Rason | North Korea | Enemy |
| `kp-10` | Ryanggang | North Korea | Enemy |
| `kp-04` | Chagang | North Korea | Enemy |
| `kp-03` | North Pyongan | North Korea | Enemy |
| `kp-02` | South Pyongan | North Korea | Enemy |
| `kp-05` | South Hwanghae | North Korea | Enemy |
| `kp-08` | South Hamgyong | North Korea | Enemy |
| `kp-01` | Pyongyang | North Korea | Enemy |

Country completion is still evaluated at the country level. South Korea is
complete only when all 17 `kr-*` fragments are player-controlled; North Korea
is complete only when all 11 `kp-*` fragments are player-controlled.

## Roads and interaction safety

Roads are authored once in `WORLD_MAP.frontMaps[*].roads` and compiled to the
runtime `roads` array plus `roadDefinitions` metadata. The active front has 47
passable adjacency links: 46 land links and one sea link from Jeju to South
Jeolla. Validation checks unknown endpoints, self-links, duplicate reverse
links, non-passable edges, invalid kinds, and graph connectivity.

Each fragment uses its source label point as its `interactionPoint`.
`interactionMinDistance` is `0.022` and `interactionHitRadius` is `0.009`,
which keeps neighboring small administrative regions selectable without
overlapping fallback hit areas. A target is selected by polygon first and
then by the nearest interaction point.
