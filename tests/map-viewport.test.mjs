import assert from "node:assert/strict";
import test from "node:test";

import { GAME_CONFIG } from "../src/config/game-config.js";
import { screenPointFromWorld, worldPointFromScreen } from "../src/render/map-viewport.js";

test("Japan map display offset centers its strategic region coordinates", () => {
  const japanMap = GAME_CONFIG.maps["japan-front"];
  const points = japanMap.regions.map((region) => region.interactionPoint[0]);
  const averageX = points.reduce((total, x) => total + x, 0) / points.length;
  const centered = averageX + japanMap.displayOffset.x;

  assert.ok(Math.abs(centered - 0.5) < 0.01);
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
