import assert from "node:assert/strict";
import test from "node:test";

import { GAME_CONFIG } from "../src/config/game-config.js";
import { screenPointFromWorld, worldPointFromScreen } from "../src/render/map-viewport.js";

function coordinatePoints(value) {
  if (Array.isArray(value) && typeof value[0] === "number") return [value];
  if (!Array.isArray(value)) return [];
  return value.flatMap(coordinatePoints);
}

test("Japan map focuses the main-island geometry and excludes outlying islands", () => {
  const japanMap = GAME_CONFIG.maps["japan-front"];
  const sourcePoints = japanMap.regions.flatMap((region) => coordinatePoints(region.sourceGeometry?.coordinates));
  const longitudes = sourcePoints.map(([longitude]) => longitude);
  const latitudes = sourcePoints.map(([, latitude]) => latitude);

  assert.deepEqual(japanMap.projection.bounds, { west: 129.3, east: 146.1, south: 30.7, north: 45.8 });
  assert.equal(japanMap.displayOffset.x, 0);
  assert.ok(Math.min(...longitudes) >= japanMap.projection.bounds.west);
  assert.ok(Math.max(...longitudes) <= japanMap.projection.bounds.east);
  assert.ok(Math.min(...latitudes) >= japanMap.projection.bounds.south);
  assert.ok(Math.max(...latitudes) <= japanMap.projection.bounds.north);
});

test("map viewport display offset is reversible for pointer targeting", () => {
  const viewport = {
    width: 400,
    height: 600,
    zoom: 1,
    panX: 0,
    panY: 0,
    displayOffset: { x: 0.175, y: 0 },
  };
  const worldPoint = [0.325, 0.55];
  const screenPoint = screenPointFromWorld(worldPoint, viewport);
  assert.deepEqual(worldPointFromScreen(screenPoint.x, screenPoint.y, viewport), worldPoint);
});
