import assert from "node:assert/strict";
import test from "node:test";

import {
  getCompletedFrontIds,
  getFrontSelectionEntries,
  isFrontUnlocked,
} from "../src/campaign/front-selection.js";

const campaign = {
  frontOrder: ["front-a", "front-b", "front-c"],
  fronts: {
    "front-a": { id: "front-a" },
    "front-b": { id: "front-b" },
    "front-c": { id: "front-c" },
  },
};

test("front selection unlocks the first front and requires prior clears", () => {
  assert.equal(isFrontUnlocked(campaign.frontOrder, "front-a"), true);
  assert.equal(isFrontUnlocked(campaign.frontOrder, "front-b"), false);
  assert.equal(isFrontUnlocked(campaign.frontOrder, "front-c", new Set(["front-a"])), false);
  assert.equal(isFrontUnlocked(campaign.frontOrder, "front-c", new Set(["front-a", "front-b"])), true);
});

test("legacy last completed front is accepted when calculating availability", () => {
  assert.deepEqual([...getCompletedFrontIds({ lastCompletedFrontId: "front-a" })], ["front-a"]);

  const entries = getFrontSelectionEntries(campaign, { lastCompletedFrontId: "front-a" });
  assert.equal(entries[0].completed, true);
  assert.equal(entries[1].unlocked, true);
  assert.equal(entries[2].unlocked, false);
});

test("front selection entries preserve order and expose completion state", () => {
  const entries = getFrontSelectionEntries(campaign, { completedFrontIds: ["front-a", "front-b"] });

  assert.deepEqual(entries.map(({ frontId }) => frontId), ["front-a", "front-b", "front-c"]);
  assert.deepEqual(entries.map(({ completed }) => completed), [true, true, false]);
  assert.deepEqual(entries.map(({ unlocked }) => unlocked), [true, true, true]);
});

test("unlocked maps remain selectable after their clear status is reset", () => {
  const entries = getFrontSelectionEntries(campaign, {
    completedFrontIds: [],
    unlockedFrontIds: ["front-a", "front-b"],
  });

  assert.deepEqual(entries.map(({ completed }) => completed), [false, false, false]);
  assert.deepEqual(entries.map(({ unlocked }) => unlocked), [true, true, false]);
});
