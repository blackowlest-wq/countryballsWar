import { normalizeSpecialMoveSettings } from "../special-move.js";

export const GOLD_STORAGE_KEY = "countryfronts.gold";
export const UPGRADES_STORAGE_KEY = "countryfronts.upgrades";
export const SPECIAL_MOVE_STORAGE_KEY = "countryfronts.specialMove";
export const EQUIPPED_CHARACTER_STORAGE_KEY = "countryfronts.equippedCharacter";
export const CAMPAIGN_STORAGE_KEY = "countryfronts.campaign";
export const CAMPAIGN_STATE_VERSION = 5;
export const DEFAULT_CAMPAIGN_ID = "regional-fronts-v1";

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

function normalizeStringList(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((entry) => typeof entry === "string" && entry.trim().length > 0))].sort();
}

function normalizeCharacterId(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export function createDefaultCampaignState({
  campaignId = DEFAULT_CAMPAIGN_ID,
  difficultyId = "normal",
  difficultyLocked = false,
} = {}) {
  return {
    version: CAMPAIGN_STATE_VERSION,
    campaignId,
    difficultyId,
    difficultyLocked,
    completedCountryIds: [],
    collectedCountryIds: [],
    completedFrontIds: [],
    unlockedFrontIds: [],
    lastCompletedFrontId: null,
  };
}

export function normalizeCampaignState(value, defaults = {}) {
  const fallback = createDefaultCampaignState(defaults);
  if (!value || typeof value !== "object" || Array.isArray(value)) return fallback;
  if (defaults.campaignId && value.campaignId && value.campaignId !== defaults.campaignId) return fallback;
  const collectedCountryIds = value.collectedCountryIds === undefined
    ? value.completedCountryIds
    : value.collectedCountryIds;
  const completedCountryIds = normalizeStringList(value.completedCountryIds);
  const normalizedCollectedCountryIds = normalizeStringList(collectedCountryIds);
  const completedFrontIds = normalizeStringList(value.completedFrontIds);
  const lastCompletedFrontId = typeof value.lastCompletedFrontId === "string" && value.lastCompletedFrontId.trim().length > 0
    ? value.lastCompletedFrontId
    : null;
  const unlockedFrontIdValues = [
    ...(Array.isArray(value.unlockedFrontIds) ? value.unlockedFrontIds : []),
    ...completedFrontIds,
    ...(lastCompletedFrontId ? [lastCompletedFrontId] : []),
  ];
  if (Array.isArray(defaults.frontOrder)) {
    [...completedFrontIds, ...(lastCompletedFrontId ? [lastCompletedFrontId] : [])].forEach((frontId) => {
      const frontIndex = defaults.frontOrder.indexOf(frontId);
      if (frontIndex >= 0 && frontIndex + 1 < defaults.frontOrder.length) {
        unlockedFrontIdValues.push(defaults.frontOrder[frontIndex + 1]);
      }
    });
  }
  const unlockedFrontIds = normalizeStringList(unlockedFrontIdValues);
  const hasProgress = completedCountryIds.length > 0
    || normalizedCollectedCountryIds.length > 0
    || completedFrontIds.length > 0
    || unlockedFrontIds.length > 0
    || lastCompletedFrontId !== null;
  const difficultyId = typeof value.difficultyId === "string" && value.difficultyId.trim().length > 0
    ? value.difficultyId
    : fallback.difficultyId;
  const validDifficultyIds = Array.isArray(defaults.difficultyIds) && defaults.difficultyIds.length > 0
    ? defaults.difficultyIds
    : null;
  return {
    version: CAMPAIGN_STATE_VERSION,
    campaignId: typeof value.campaignId === "string" && value.campaignId.trim().length > 0 ? value.campaignId : fallback.campaignId,
    difficultyId: validDifficultyIds && !validDifficultyIds.includes(difficultyId) ? fallback.difficultyId : difficultyId,
    difficultyLocked: typeof value.difficultyLocked === "boolean" ? value.difficultyLocked : hasProgress,
    completedCountryIds,
    collectedCountryIds: normalizedCollectedCountryIds,
    completedFrontIds,
    unlockedFrontIds,
    lastCompletedFrontId,
  };
}

export function createDefaultUpgrades(upgradeKeys) {
  return Object.fromEntries(upgradeKeys.map((key) => [key, 0]));
}

export function loadPersistentState(storage, upgradeKeys, campaignDefaults = {}) {
  const emptyUpgrades = createDefaultUpgrades(upgradeKeys);
  const emptyCampaign = createDefaultCampaignState(campaignDefaults);
  const target = getStorage(storage);
  if (!target) return { gold: 0, upgrades: emptyUpgrades, campaign: emptyCampaign };

  let gold = 0;
  let savedUpgrades = null;
  let savedCampaign = null;
  try {
    gold = toGold(target.getItem(GOLD_STORAGE_KEY));
    savedUpgrades = JSON.parse(target.getItem(UPGRADES_STORAGE_KEY) || "null");
    savedCampaign = JSON.parse(target.getItem(CAMPAIGN_STORAGE_KEY) || "null");
  } catch {
    return { gold: 0, upgrades: emptyUpgrades, campaign: emptyCampaign };
  }

  const upgrades = Object.fromEntries(
    upgradeKeys.map((key) => [key, toLevel(savedUpgrades?.[key])]),
  );
  return {
    gold,
    upgrades,
    campaign: normalizeCampaignState(savedCampaign, campaignDefaults),
  };
}

export function savePersistentState(storage, persistentState) {
  const target = getStorage(storage);
  const campaign = normalizeCampaignState(persistentState.campaign);
  if (!target) return campaign;
  try {
    target.setItem(GOLD_STORAGE_KEY, String(toGold(persistentState.gold)));
    target.setItem(UPGRADES_STORAGE_KEY, JSON.stringify(persistentState.upgrades));
    target.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(campaign));
  } catch {
    // Storage may be unavailable in private browsing; the session still works.
  }
  return campaign;
}

export function loadEquippedCharacter(storage) {
  const target = getStorage(storage);
  if (!target) return null;

  try {
    return normalizeCharacterId(target.getItem(EQUIPPED_CHARACTER_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function saveEquippedCharacter(storage, characterId) {
  const target = getStorage(storage);
  const normalized = normalizeCharacterId(characterId);
  if (!target) return normalized;

  try {
    if (normalized) target.setItem(EQUIPPED_CHARACTER_STORAGE_KEY, normalized);
    else target.removeItem(EQUIPPED_CHARACTER_STORAGE_KEY);
  } catch {
    // Storage may be unavailable in private browsing; the session still works.
  }
  return normalized;
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

export function resetPersistentState(storage, upgradeKeys, campaignDefaults = {}) {
  const target = getStorage(storage);
  let campaign = createDefaultCampaignState(campaignDefaults);
  if (target) {
    try {
      const savedCampaign = JSON.parse(target.getItem(CAMPAIGN_STORAGE_KEY) || "null");
      const normalizedCampaign = normalizeCampaignState(savedCampaign, campaignDefaults);
      campaign = {
        ...campaign,
        collectedCountryIds: normalizedCampaign.collectedCountryIds,
        unlockedFrontIds: normalizedCampaign.unlockedFrontIds,
      };
      target.removeItem(GOLD_STORAGE_KEY);
      target.removeItem(UPGRADES_STORAGE_KEY);
      target.removeItem(SPECIAL_MOVE_STORAGE_KEY);
      target.removeItem(EQUIPPED_CHARACTER_STORAGE_KEY);
      target.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(campaign));
    } catch {
      // Storage may be unavailable; return a clean in-memory state regardless.
    }
  }
  return {
    gold: 0,
    upgrades: createDefaultUpgrades(upgradeKeys),
    campaign,
  };
}
