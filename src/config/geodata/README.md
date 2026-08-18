# Map geometry source

The active Korea Front uses Natural Earth Admin 1 - States, Provinces at
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

The previous country-level source remains available as
`ne_110m_admin_0_countries.geojson` with its runtime subset
`natural-earth-korea.js` for future country-level fronts.

Admin 1 source:
<https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.1/geojson/ne_10m_admin_1_states_provinces.geojson>

License:
<https://www.naturalearthdata.com/about/terms-of-use/>
