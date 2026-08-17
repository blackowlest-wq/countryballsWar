# Natural Earth map-data research

## Decision

Use Natural Earth vector data instead of hand-authored country rectangles.
The active Korea Front is built from the Admin 1 - States, Provinces GeoJSON
at 1:10m, pinned to v5.1.1 (`9380cca`). The source is public domain under the
Natural Earth terms of use.

The runtime keeps only the 28 Korea features required by the front in
`src/config/geodata/natural-earth-korea-admin-1.js`. The extracted audit copy
is `src/config/geodata/ne_10m_admin_1_korea.geojson`.

## Sources

- [Natural Earth Admin 1 - States, Provinces](https://www.naturalearthdata.com/downloads/110m-cultural-vectors/110m-admin-1-states-provinces/)
- [Natural Earth 10m Admin 1 GeoJSON, v5.1.1](https://github.com/nvkelso/natural-earth-vector/blob/v5.1.1/geojson/ne_10m_admin_1_states_provinces.geojson)
- [Natural Earth Vector repository](https://github.com/nvkelso/natural-earth-vector)
- [Natural Earth Terms of Use](https://www.naturalearthdata.com/about/terms-of-use/)
- [Natural Earth v5.1.1 release](https://github.com/nvkelso/natural-earth-vector/releases/tag/v5.1.1)

## Implementation notes

- The 17 South Korean and 11 North Korean Admin 1 features preserve their
  original Polygon/MultiPolygon geometry.
- Roads are based on the extracted administrative adjacency graph: 46 land
  links plus one sea link for Jeju to South Jeolla.
- The active map uses a close-up equirectangular projection and validated
  interaction-point spacing so the small regions remain selectable.
- The older 1:110m Admin 0 source is retained for future country-level fronts,
  but is not used for the active Korea Front.
