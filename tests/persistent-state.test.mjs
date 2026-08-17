import test from "node:test";
import assert from "node:assert/strict";
import {
  GOLD_STORAGE_KEY,
  SPECIAL_MOVE_STORAGE_KEY,
  UPGRADES_STORAGE_KEY,
  loadSpecialMove,
  loadPersistentState,
  resetPersistentState,
  savePersistentState,
  saveSpecialMove,
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

const UPGRADE_KEYS = ["logistics", "armor", "reserve", "speed"];
const SPECIAL_MOVE_BALANCE = {
  maxNameLength: 8,
  types: {
    enemyWeakness: { defaultName: "敵弱体化" },
    allyBoost: { defaultName: "味方強化" },
    invincibility: { defaultName: "無敵" },
  },
};

test("resetPersistentState clears Gold and every upgrade", () => {
  const storage = createStorage({
    [GOLD_STORAGE_KEY]: "1234",
    [UPGRADES_STORAGE_KEY]: JSON.stringify({ logistics: 2, armor: 4, reserve: 1 }),
    [SPECIAL_MOVE_STORAGE_KEY]: JSON.stringify({ type: "allyBoost", name: "増強" }),
  });

  const result = resetPersistentState(storage, UPGRADE_KEYS);

  assert.deepEqual(result, {
    gold: 0,
    upgrades: { logistics: 0, armor: 0, reserve: 0, speed: 0 },
  });
  assert.equal(storage.has(GOLD_STORAGE_KEY), false);
  assert.equal(storage.has(UPGRADES_STORAGE_KEY), false);
  assert.equal(storage.has(SPECIAL_MOVE_STORAGE_KEY), false);
});

test("corrupted saved values safely become a clean state", () => {
  const storage = createStorage({
    [GOLD_STORAGE_KEY]: "not-a-number",
    [UPGRADES_STORAGE_KEY]: "{broken json",
  });

  assert.deepEqual(loadPersistentState(storage, UPGRADE_KEYS), {
    gold: 0,
    upgrades: { logistics: 0, armor: 0, reserve: 0, speed: 0 },
  });
});

test("valid values are preserved while unknown or invalid upgrade values are normalized", () => {
  const storage = createStorage({
    [GOLD_STORAGE_KEY]: "200.8",
    [UPGRADES_STORAGE_KEY]: JSON.stringify({ logistics: 2.9, armor: -4, reserve: true }),
  });

  assert.deepEqual(loadPersistentState(storage, UPGRADE_KEYS), {
    gold: 200,
    upgrades: { logistics: 2, armor: 0, reserve: 1, speed: 0 },
  });
});

test("saving and loading round trips the persistent state", () => {
  const storage = createStorage();
  savePersistentState(storage, {
    gold: 350,
    upgrades: { logistics: 1, armor: 2, reserve: 3, speed: 2 },
  });

  assert.deepEqual(loadPersistentState(storage, UPGRADE_KEYS), {
    gold: 350,
    upgrades: { logistics: 1, armor: 2, reserve: 3, speed: 2 },
  });
});

test("必殺技設定は名前を安全に正規化して保存・読込する", () => {
  const storage = createStorage();
  const saved = saveSpecialMove(storage, {
    type: "invincibility",
    name: "  防\u0000御\n隊123456789  ",
  }, SPECIAL_MOVE_BALANCE);

  assert.deepEqual(saved, { type: "invincibility", name: "防御隊12345" });
  assert.deepEqual(loadSpecialMove(storage, SPECIAL_MOVE_BALANCE), saved);
});

test("不正な必殺技種別や壊れた保存値は未設定として扱う", () => {
  const storage = createStorage({
    [SPECIAL_MOVE_STORAGE_KEY]: "{broken",
  });
  assert.equal(loadSpecialMove(storage, SPECIAL_MOVE_BALANCE), null);

  storage.setItem(SPECIAL_MOVE_STORAGE_KEY, JSON.stringify({ type: "unknown", name: "x" }));
  assert.equal(loadSpecialMove(storage, SPECIAL_MOVE_BALANCE), null);
});
