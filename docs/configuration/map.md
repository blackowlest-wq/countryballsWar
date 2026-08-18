# Map configuration

## Canonical files

- Geographic source: `src/config/world-map.js`
- Country master: `src/config/countries.js`
- Compiler: `src/config/map-compiler.js`
- Runtime map master: `src/config/map.js`

`map.js` compiles every entry in `WORLD_MAP.frontMaps` into `MAPS`. The
currently selected map remains available as the compatibility alias `MAP` and
`GAME_CONFIG.map`; new campaign fronts select a map through their `mapId`.
The extracted GeoJSON and runtime subsets are stored in
`src/config/geodata/`.

The Korea and Japan sources are Natural Earth Admin 1 - States, Provinces,
1:10m, v5.1.1 (commit `9380cca`, public domain). Each compiled map exposes its
own source metadata as `GAME_CONFIG.maps[mapId].source`; the compatibility alias
`GAME_CONFIG.map.source` points to the initial Korea map.

## Korea map regions

Every map must contain 10 to 15 strategic regions. The player starts from one
region only. Enemy units must be deployed to a region whose `countryId`
matches the country character shown by that unit's flag.

The source contains 28 administrative features, but the game combines
adjacent features into 11 strategic regions to keep the map readable and
reduce accidental taps: six in South Korea and five in North Korea.

| Region | Combined source areas | Country | Starting owner |
|---|---|---|---|
| `south-capital` | Seoul, Incheon, Gyeonggi | South Korea | Enemy |
| `south-gangwon` | Gangwon | South Korea | Enemy |
| `south-central` | South/North Chungcheong, Daejeon, Sejong | South Korea | Enemy |
| `south-west` | North/South Jeolla, Gwangju | South Korea | Enemy |
| `south-east` | North/South Gyeongsang, Daegu, Busan, Ulsan | South Korea | Enemy |
| `south-jeju` | Jeju | South Korea | Player start |
| `north-central` | Pyongyang, South Pyongan | North Korea | Enemy |
| `north-west` | North Pyongan, Chagang, Ryanggang | North Korea | Enemy |
| `north-hwanghae` | North/South Hwanghae | North Korea | Enemy |
| `north-east-central` | Kangwon, South Hamgyong | North Korea | Enemy |
| `north-east` | North Hamgyong, Rason | North Korea | Enemy |

Country completion is evaluated against these strategic regions. South Korea
requires all six `south-*` regions and North Korea requires all five `north-*`
regions. The player starts with only `south-jeju`; South Korea remains an
enemy country until every South Korean region is controlled.

## Japan map regions

The checked-in Japan source contains all 47 Natural Earth prefecture features,
but the playable map intentionally excludes Okinawa (`jp-47`) and combines the
remaining 46 features into 11 strategic regions. The map uses the same
Japanese country character for every enemy unit. Southern Kyushu is the only
player-owned starting region; the first phase focuses on the southern and
central islands, and the second phase opens the northern advance while
carrying player occupation and units forward.

| Region | Combined source areas | Starting owner |
|---|---|---|
| `japan-kyushu-north` | Fukuoka, Saga, Nagasaki, Kumamoto, Ōita | Enemy |
| `japan-kyushu-south` | Miyazaki, Kagoshima | Player start |
| `japan-shikoku` | Tokushima, Kagawa, Ehime, Kōchi | Enemy |
| `japan-chugoku` | Tottori, Shimane, Okayama, Hiroshima, Yamaguchi | Enemy |
| `japan-kansai` | Shiga, Kyōto, Ōsaka, Hyōgo, Nara, Wakayama | Enemy |
| `japan-chubu` | Fukui, Nagano, Gifu, Shizuoka, Aichi, Mie | Enemy |
| `japan-hokuriku` | Niigata, Toyama, Ishikawa | Enemy |
| `japan-kanto` | Ibaraki, Tochigi, Gunma, Saitama, Chiba, Tokyo, Kanagawa, Yamanashi | Enemy |
| `japan-tohoku-south` | Miyagi, Fukushima | Enemy |
| `japan-tohoku-north` | Aomori, Iwate, Akita, Yamagata | Enemy |
| `japan-hokkaido` | Hokkaidō | Enemy |

Japan is completed only after all eleven `japan-*` regions are controlled.

## Roads and interaction safety

Roads are authored once in `WORLD_MAP.frontMaps[*].roads` and compiled to the
runtime `roads` array plus `roadDefinitions` metadata. The Korea map has 18
passable adjacency links: 17 land links and one sea link from Jeju to the
Southwestern Region. The Japan map has 13 links: 8 land links and 5 sea links
for the island crossings; the Okinawa connection is not included. Validation checks unknown endpoints, self-links,
duplicate reverse links, non-passable edges, invalid kinds, and graph
connectivity.

Each strategic region uses a source label point as its `interactionPoint`.
`interactionMinDistance` is `0.045` and the default `interactionHitRadius` is
`0.018`, which leaves a larger gap between fallback hit areas than the previous
administrative-region map. Small regions may define their own
`interactionRadius`; Jeju uses `0.035` so a finger release slightly outside
the island still selects it. Validation checks that custom hit areas do not
overlap another region's interaction target. The polygon is tested first,
followed by the nearest interaction point.
