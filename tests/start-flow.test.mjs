import assert from "node:assert/strict";
import test from "node:test";

import { getNextRouteAfterSpecialMove } from "../src/campaign/start-flow.js";

test("special move setup returns to difficulty selection when difficulty is not locked", () => {
  assert.equal(getNextRouteAfterSpecialMove({ difficultyLocked: false }), "difficulty-selection");
});

test("special move setup starts the selected map after difficulty is locked", () => {
  assert.equal(getNextRouteAfterSpecialMove({ difficultyLocked: true }), "operation");
});
