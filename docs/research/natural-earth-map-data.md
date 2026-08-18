# Natural Earth map-data research

## Decision

Use Natural Earth vector data instead of hand-authored country rectangles.
The Korea and Japan maps are built from the Admin 1 - States, Provinces
GeoJSON at 1:10m, pinned to v5.1.1 (`9380cca`). The source is public domain
under the Natural Earth terms of use.

The runtime keeps the 28 Korea features and the full 47-feature Japan source in
`src/config/geodata/natural-earth-korea-admin-1.js` and
`src/config/geodata/natural-earth-japan-admin-1.js`. The playable Japan map
excludes the Okinawa feature (`jp-47`), so the Korea source is grouped into 11
strategic regions and Japan into 11. The extracted audit copies are
`src/config/geodata/ne_10m_admin_1_korea.geojson` and
`src/config/geodata/ne_10m_admin_1_japan.geojson`.

## Sources

- [Natural Earth Admin 1 - States, Provinces](https://www.naturalearthdata.com/downloads/110m-cultural-vectors/110m-admin-1-states-provinces/)
- [Natural Earth 10m Admin 1 GeoJSON, v5.1.1](https://github.com/nvkelso/natural-earth-vector/blob/v5.1.1/geojson/ne_10m_admin_1_states_provinces.geojson)
- [Natural Earth Vector repository](https://github.com/nvkelso/natural-earth-vector)
- [Natural Earth Terms of Use](https://www.naturalearthdata.com/about/terms-of-use/)
- [Natural Earth v5.1.1 release](https://github.com/nvkelso/natural-earth-vector/releases/tag/v5.1.1)

## Implementation notes

- The 17 South Korean and 11 North Korean Admin 1 features preserve their
  original Polygon/MultiPolygon geometry before grouping.
- Roads are based on the extracted administrative adjacency graph and then
  collapsed to 18 strategic-region links: 17 land links plus one sea link for
  Jeju to the Southwestern Region.
- Group boundaries are derived by removing shared source edges, so internal
  administrative borders do not become separate targets or visible map lines.
- The player starts with one white faction region; country-character sprites
  are reserved for the South Korean and North Korean enemy units.
- The active map uses a close-up equirectangular projection and validated
  interaction-point spacing so the larger regions remain selectable.
- Japan uses a close-up equirectangular view without Okinawa as a playable
  region. Hokkaido and the remote Tokyo island features remain in the pinned
  source geometry for traceability.
- The older 1:110m Admin 0 source is retained for future country-level fronts,
  but is not used by the Korea or Japan maps.
