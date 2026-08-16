import test from "node:test";
import assert from "node:assert/strict";
import {
  GOLD_STORAGE_KEY,
  UPGRADES_STORAGE_KEY,
  loadPersistentState,
  resetPersistentState,
  savePersistentState,
} from "../src/storage/persistent-state.js";

function createStorage(entries = {}) {
  const values = new Map(Object.entries(entries));
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
    has(key) {
      return values.has(key);
    },
  };
}

const UPGRADE_KEYS = ["logistics", "armor", "reserve"];

test("resetPersistentState clears Gold and every upgrade", () => {
  const storage = createStorage({
    [GOLD_STORAGE_KEY]: "1234",
    [UPGRADES_STORAGE_KEY]: JSON.stringify({ logistics: 2, armor: 4, reserve: 1 }),
  });

  const result = resetPersistentState(storage, UPGRADE_KEYS);

  assert.deepEqual(result, {
    gold: 0,
    upgrades: { logistics: 0, armor: 0, reserve: 0 },
  });
  assert.equal(storage.has(GOLD_STORAGE_KEY), false);
  assert.equal(storage.has(UPGRADES_STORAGE_KEY), false);
});

test("corrupted saved values safely become a clean state", () => {
  const storage = createStorage({
    [GOLD_STORAGE_KEY]: "not-a-number",
    [UPGRADES_STORAGE_KEY]: "{broken json",
  });

  assert.deepEqual(loadPersistentState(storage, UPGRADE_KEYS), {
    gold: 0,
    upgrades: { logistics: 0, armor: 0, reserve: 0 },
  });
});

test("valid values are preserved while unknown or invalid upgrade values are normalized", () => {
  const storage = createStorage({
    [GOLD_STORAGE_KEY]: "200.8",
    [UPGRADES_STORAGE_KEY]: JSON.stringify({ logistics: 2.9, armor: -4, reserve: true }),
  });

  assert.deepEqual(loadPersistentState(storage, UPGRADE_KEYS), {
    gold: 200,
    upgrades: { logistics: 2, armor: 0, reserve: 1 },
  });
});

test("saving and loading round trips the persistent state", () => {
  const storage = createStorage();
  savePersistentState(storage, {
    gold: 350,
    upgrades: { logistics: 1, armor: 2, reserve: 3 },
  });

  assert.deepEqual(loadPersistentState(storage, UPGRADE_KEYS), {
    gold: 350,
    upgrades: { logistics: 1, armor: 2, reserve: 3 },
  });
});
