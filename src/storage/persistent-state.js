import { normalizeSpecialMoveSettings } from "../special-move.js";

export const GOLD_STORAGE_KEY = "countryfronts.gold";
export const UPGRADES_STORAGE_KEY = "countryfronts.upgrades";
export const SPECIAL_MOVE_STORAGE_KEY = "countryfronts.specialMove";

function getStorage(storage) {
  if (storage) return storage;
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

function toGold(value) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? Math.floor(amount) : 0;
}

function toLevel(value) {
  if (typeof value === "boolean") return value ? 1 : 0;
  const level = Number(value);
  return Number.isFinite(level) && level > 0 ? Math.floor(level) : 0;
}

export function createDefaultUpgrades(upgradeKeys) {
  return Object.fromEntries(upgradeKeys.map((key) => [key, 0]));
}

export function loadPersistentState(storage, upgradeKeys) {
  const emptyUpgrades = createDefaultUpgrades(upgradeKeys);
  const target = getStorage(storage);
  if (!target) return { gold: 0, upgrades: emptyUpgrades };

  let gold = 0;
  let savedUpgrades = null;
  try {
    gold = toGold(target.getItem(GOLD_STORAGE_KEY));
    savedUpgrades = JSON.parse(target.getItem(UPGRADES_STORAGE_KEY) || "null");
  } catch {
    return { gold: 0, upgrades: emptyUpgrades };
  }

  const upgrades = Object.fromEntries(
    upgradeKeys.map((key) => [key, toLevel(savedUpgrades?.[key])]),
  );
  return { gold, upgrades };
}

export function savePersistentState(storage, persistentState) {
  const target = getStorage(storage);
  if (!target) return;
  try {
    target.setItem(GOLD_STORAGE_KEY, String(toGold(persistentState.gold)));
    target.setItem(UPGRADES_STORAGE_KEY, JSON.stringify(persistentState.upgrades));
  } catch {
    // Storage may be unavailable in private browsing; the session still works.
  }
}

export function loadSpecialMove(storage, balance) {
  const target = getStorage(storage);
  if (!target) return null;

  try {
    const saved = JSON.parse(target.getItem(SPECIAL_MOVE_STORAGE_KEY) || "null");
    return normalizeSpecialMoveSettings(saved, balance);
  } catch {
    return null;
  }
}

export function saveSpecialMove(storage, specialMove, balance) {
  const target = getStorage(storage);
  const normalized = normalizeSpecialMoveSettings(specialMove, balance);
  if (!target || !normalized) return normalized;

  try {
    target.setItem(SPECIAL_MOVE_STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    // Storage may be unavailable in private browsing; the session still works.
  }
  return normalized;
}

export function resetPersistentState(storage, upgradeKeys) {
  const target = getStorage(storage);
  if (target) {
    try {
      target.removeItem(GOLD_STORAGE_KEY);
      target.removeItem(UPGRADES_STORAGE_KEY);
      target.removeItem(SPECIAL_MOVE_STORAGE_KEY);
    } catch {
      // Storage may be unavailable; return a clean in-memory state regardless.
    }
  }
  return { gold: 0, upgrades: createDefaultUpgrades(upgradeKeys) };
}
