export const SPECIAL_MOVE_TYPE_KEYS = ["enemyWeakness", "allyBoost", "invincibility"];

function cleanName(value, fallback, maxLength) {
  if (typeof value !== "string") return fallback;
  const sanitized = Array.from(
    value
      .replace(/[\u0000-\u001f\u007f]/g, "")
      .replace(/\s+/g, " ")
      .trim(),
  ).slice(0, maxLength).join("");
  return sanitized || fallback;
}

export function normalizeSpecialMoveSettings(value, balance) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  if (!SPECIAL_MOVE_TYPE_KEYS.includes(value.type)) return null;

  const config = balance?.types?.[value.type];
  if (!config) return null;
  return {
    type: value.type,
    name: cleanName(value.name, config.defaultName, balance.maxNameLength),
  };
}

export function createSpecialMoveSettings(type, name, balance) {
  return normalizeSpecialMoveSettings({ type, name }, balance);
}

export function getSpecialMoveConfig(type, balance) {
  if (!SPECIAL_MOVE_TYPE_KEYS.includes(type)) return null;
  return balance?.types?.[type] || null;
}

export function applySpecialMoveEffect(type, units, balance, playerFactionId, minimumStrength = 0) {
  const config = getSpecialMoveConfig(type, balance);
  if (!config) return null;

  if (type === "enemyWeakness") {
    units
      .filter((unit) => unit.faction !== playerFactionId)
      .forEach((unit) => {
        unit.strength = Math.max(0, Math.floor(unit.strength * (1 - config.strengthReductionRate)));
      });
    return { kind: type, reductionRate: config.strengthReductionRate };
  }

  if (type === "allyBoost") {
    units
      .filter((unit) => unit.faction === playerFactionId)
      .forEach((unit) => {
        const maxStrength = Math.max(minimumStrength, unit.maxStrength || minimumStrength);
        unit.strength = Math.min(maxStrength, Math.ceil(unit.strength * (1 + config.strengthIncreaseRate)));
      });
    return { kind: type, increaseRate: config.strengthIncreaseRate };
  }

  return { kind: type, durationSeconds: config.durationSeconds };
}
