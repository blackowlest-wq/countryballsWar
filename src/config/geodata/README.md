# Map geometry source

The Korea, Japan, and China maps use Natural Earth Admin 1 - States, Provinces at
1:10m, pinned to v5.1.1 (commit `9380cca`). The checked-in
`ne_10m_admin_1_korea.geojson` is the extracted Korea subset containing 28
first-order administrative features with their original Polygon/MultiPolygon
geometry and source properties.

`natural-earth-korea-admin-1.js` is the compact runtime subset used by
`src/config/world-map.js`. It keeps the source feature ID, country mapping,
English region name, label point, ISO codes, and geometry needed by the map
compiler. `world-map.js` combines these source features into 11 larger
strategic regions and derives an outer border for each group. The player starts
in one strategic region; the South Korean and North Korean character mappings
are used by enemy units.

The Japan subset is stored in `ne_10m_admin_1_japan.geojson` and
`natural-earth-japan-admin-1.js`. It contains all 47 prefecture features and is
retained in full for audit. The playable map excludes Okinawa and combines the
remaining 46 features into 11 strategic regions. Southern Kyushu is the player
start, and Japan's country character is used by every enemy deployment on that
map.

The China subset is stored in `ne_10m_admin_1_china.geojson` and
`natural-earth-china-admin-1.js`. It contains all 32 features assigned to China
by the pinned source. The playable map excludes the remote Paracel Islands
feature and combines the remaining 31 features into 14 strategic regions.
Coastal provinces use their largest polygon for playable geometry; Hainan is a
separate source polygon and remains the player start. China's country character
is used by every enemy deployment on that map.

The previous country-level source remains available as
`ne_110m_admin_0_countries.geojson` with its runtime subset
`natural-earth-korea.js` for future country-level fronts.

Admin 1 source:
<https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.1/geojson/ne_10m_admin_1_states_provinces.geojson>

License:
<https://www.naturalearthdata.com/about/terms-of-use/>

Single-country Admin 1 subsets can be regenerated from the pinned full source
with `scripts/extract-admin1-country.mjs`. For China:

```powershell
node scripts/extract-admin1-country.mjs `
  ne_10m_admin_1_states_provinces.geojson `
  CHN china china NATURAL_EARTH_CHINA_ADMIN_1
```
