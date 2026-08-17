# Map geometry source

The checked-in `ne_110m_admin_0_countries.geojson` is the Natural Earth Admin 0
– Countries dataset at 1:110m, pinned to v5.1.1 (commit `9380cca`). Natural
Earth publishes this data in the public domain.

`natural-earth-korea.js` is the small runtime subset used by the current Korea
front. Its coordinates are copied from the `PRK` and `KOR` features in the
GeoJSON file; it preserves the source Polygon/MultiPolygon structure and only
keeps the label point and fields needed by the map compiler.

Source: <https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.1/geojson/ne_110m_admin_0_countries.geojson>

License: <https://www.naturalearthdata.com/about/terms-of-use/>
