import assert from "node:assert/strict";
import test from "node:test";

import {
  geometryToPathData,
  getCountryWorldMapData,
  projectWorldMapPoint,
} from "../src/campaign/country-location.js";

test("world map geometry is projected into the profile map coordinate system", () => {
  const polygon = {
    type: "Polygon",
    coordinates: [[[0, 0], [10, 0], [10, 10], [0, 0]]],
  };
  const path = geometryToPathData(polygon);

  assert.match(path, /^M 180\.00 90\.00/);
  assert.match(path, /L 190\.00 90\.00/);
  assert.match(path, /L 190\.00 80\.00/);
  assert.match(path, /Z$/);
});

test("country world map data includes every land path and the selected country marker", () => {
  const worldGeoJson = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { ISO_A3: "AAA", LABEL_X: 10, LABEL_Y: 20 },
        geometry: {
          type: "Polygon",
          coordinates: [[[-10, 10], [0, 10], [0, 20], [-10, 10]]],
        },
      },
      {
        type: "Feature",
        properties: { ISO_A3: "BBB", LABEL_X: 120, LABEL_Y: 30 },
        geometry: {
          type: "MultiPolygon",
          coordinates: [[[[110, 20], [120, 20], [120, 30], [110, 20]]]],
        },
      },
    ],
  };

  const mapData = getCountryWorldMapData(worldGeoJson, "BBB");

  assert.equal(mapData.viewBox, "0 0 360 180");
  assert.equal(mapData.paths.length, 2);
  assert.equal(mapData.paths.filter((item) => item.selected).length, 1);
  assert.deepEqual(mapData.selectedPoint, [120, 30]);
  assert.deepEqual(projectWorldMapPoint([0, 0]), [180, 90]);
  assert.deepEqual(projectWorldMapPoint([180, -90]), [360, 180]);
  assert.equal(projectWorldMapPoint([Number.NaN, 0]), null);
  assert.equal(projectWorldMapPoint(null), null);
});
