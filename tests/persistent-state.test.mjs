import test from "node:test";
import assert from "node:assert/strict";
import {
  CAMPAIGN_STORAGE_KEY,
  EQUIPPED_CHARACTER_STORAGE_KEY,
  GOLD_STORAGE_KEY,
  SPECIAL_MOVE_STORAGE_KEY,
  UPGRADES_STORAGE_KEY,
  loadEquippedCharacter,
  loadSpecialMove,
  loadPersistentState,
  resetPersistentState,
  saveEquippedCharacter,
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
    enemyWeakness: { defaultName: "weakness" },
    allyBoost: { defaultName: "boost" },
    invincibility: { defaultName: "guard" },
  },
};

const EMPTY_CAMPAIGN = {
  version: 5,
  campaignId: "regional-fronts-v1",
  difficultyId: "normal",
  difficultyLocked: false,
  completedCountryIds: [],
  collectedCountryIds: [],
  completedFrontIds: [],
  unlockedFrontIds: [],
  lastCompletedFrontId: null,
};

test("resetPersistentState clears completion while preserving map acquisition and flag collection", () => {
  const storage = createStorage({
    [GOLD_STORAGE_KEY]: "1234",
    [UPGRADES_STORAGE_KEY]: JSON.stringify({ logistics: 2, armor: 4, reserve: 1 }),
    [SPECIAL_MOVE_STORAGE_KEY]: JSON.stringify({ type: "allyBoost", name: "boost" }),
    [EQUIPPED_CHARACTER_STORAGE_KEY]: "south-korea",
    [CAMPAIGN_STORAGE_KEY]: JSON.stringify({
      completedCountryIds: ["china"],
      collectedCountryIds: ["china"],
      completedFrontIds: ["korea-front", "asia-front"],
      unlockedFrontIds: ["korea-front", "asia-front"],
      lastCompletedFrontId: "asia-front",
    }),
  });

  const result = resetPersistentState(storage, UPGRADE_KEYS);

  assert.deepEqual(result, {
    gold: 0,
    upgrades: { logistics: 0, armor: 0, reserve: 0, speed: 0 },
    campaign: {
      ...EMPTY_CAMPAIGN,
      collectedCountryIds: ["china"],
      unlockedFrontIds: ["asia-front", "korea-front"],
    },
  });
  assert.equal(storage.has(GOLD_STORAGE_KEY), false);
  assert.equal(storage.has(UPGRADES_STORAGE_KEY), false);
  assert.equal(storage.has(SPECIAL_MOVE_STORAGE_KEY), false);
  assert.equal(storage.has(EQUIPPED_CHARACTER_STORAGE_KEY), false);
  assert.deepEqual(JSON.parse(storage.getItem(CAMPAIGN_STORAGE_KEY)), result.campaign);
});

test("reset migrates the next map unlock from legacy clear progress", () => {
  const storage = createStorage({
    [CAMPAIGN_STORAGE_KEY]: JSON.stringify({
      completedFrontIds: ["korea-front"],
      lastCompletedFrontId: "korea-front",
    }),
  });

  const result = resetPersistentState(storage, UPGRADE_KEYS, {
    frontOrder: ["korea-front", "japan-front"],
  });

  assert.deepEqual(result.campaign.unlockedFrontIds, ["japan-front", "korea-front"]);
  assert.deepEqual(result.campaign.completedFrontIds, []);
  assert.equal(result.campaign.lastCompletedFrontId, null);
});

test("equipped character is normalized, persisted, and resettable", () => {
  const storage = createStorage({ [EQUIPPED_CHARACTER_STORAGE_KEY]: "  south-korea  " });

  assert.equal(loadEquippedCharacter(storage), "south-korea");
  assert.equal(saveEquippedCharacter(storage, " north-korea "), "north-korea");
  assert.equal(loadEquippedCharacter(storage), "north-korea");
  assert.equal(saveEquippedCharacter(storage, null), null);
  assert.equal(loadEquippedCharacter(storage), null);
});

test("corrupted saved values safely become a clean state", () => {
  const storage = createStorage({
    [GOLD_STORAGE_KEY]: "not-a-number",
    [UPGRADES_STORAGE_KEY]: "{broken json",
  });

  assert.deepEqual(loadPersistentState(storage, UPGRADE_KEYS), {
    gold: 0,
    upgrades: { logistics: 0, armor: 0, reserve: 0, speed: 0 },
    campaign: EMPTY_CAMPAIGN,
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
    campaign: EMPTY_CAMPAIGN,
  });
});

test("a campaign id change resets only campaign progress", () => {
  const storage = createStorage({
    [GOLD_STORAGE_KEY]: "200",
    [UPGRADES_STORAGE_KEY]: JSON.stringify({ logistics: 2 }),
    [CAMPAIGN_STORAGE_KEY]: JSON.stringify({
      campaignId: "world-conquest-v1",
      difficultyId: "hard",
      completedCountryIds: ["china"],
      lastCompletedFrontId: "asia-front",
    }),
  });

  assert.deepEqual(loadPersistentState(storage, UPGRADE_KEYS, {
    campaignId: "regional-fronts-v1",
    difficultyId: "normal",
  }), {
    gold: 200,
    upgrades: { logistics: 2, armor: 0, reserve: 0, speed: 0 },
    campaign: EMPTY_CAMPAIGN,
  });
});

test("saving and loading round trips campaign progress without phase state", () => {
  const storage = createStorage();
  savePersistentState(storage, {
    gold: 350,
    upgrades: { logistics: 1, armor: 2, reserve: 3, speed: 2 },
    campaign: {
      campaignId: "regional-fronts-v1",
      difficultyId: "hard",
      completedCountryIds: ["japan", "china", "china"],
      collectedCountryIds: ["south-korea", "china", "south-korea"],
      completedFrontIds: ["korea-front", "korea-front"],
      unlockedFrontIds: ["korea-front"],
      currentPhaseId: "korea-front-opening",
      lastCompletedFrontId: "korea-front",
    },
  });

  assert.deepEqual(loadPersistentState(storage, UPGRADE_KEYS), {
    gold: 350,
    upgrades: { logistics: 1, armor: 2, reserve: 3, speed: 2 },
    campaign: {
      version: 5,
      campaignId: "regional-fronts-v1",
      difficultyId: "hard",
      difficultyLocked: true,
      completedCountryIds: ["china", "japan"],
      collectedCountryIds: ["china", "south-korea"],
      completedFrontIds: ["korea-front"],
      unlockedFrontIds: ["korea-front"],
      lastCompletedFrontId: "korea-front",
    },
  });
});

test("legacy campaign completion seeds the flag collection", () => {
  const storage = createStorage({
    [CAMPAIGN_STORAGE_KEY]: JSON.stringify({
      campaignId: "regional-fronts-v1",
      completedCountryIds: ["south-korea"],
    }),
  });

  assert.deepEqual(loadPersistentState(storage, UPGRADE_KEYS).campaign.collectedCountryIds, ["south-korea"]);
});

test("special move settings remain compatible with persistent state", () => {
  const storage = createStorage();
  const saved = saveSpecialMove(storage, {
    type: "invincibility",
    name: "  guard\u0000\n123456789  ",
  }, SPECIAL_MOVE_BALANCE);

  assert.deepEqual(saved, { type: "invincibility", name: "guard123" });
  assert.deepEqual(loadSpecialMove(storage, SPECIAL_MOVE_BALANCE), saved);
});

test("invalid special move values are treated as unset", () => {
  const storage = createStorage({ [SPECIAL_MOVE_STORAGE_KEY]: "{broken" });
  assert.equal(loadSpecialMove(storage, SPECIAL_MOVE_BALANCE), null);

  storage.setItem(SPECIAL_MOVE_STORAGE_KEY, JSON.stringify({ type: "unknown", name: "x" }));
  assert.equal(loadSpecialMove(storage, SPECIAL_MOVE_BALANCE), null);
});
