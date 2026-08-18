export function calculateGroupCombatDamage({ totalStrength, totalProduction, balance }) {
  const strength = Math.max(0, totalStrength);
  if (strength <= 0) return 0;

  const production = Math.max(0, totalProduction);
  const damage = Math.ceil(
    strength * balance.strengthDamageFactor
      + production * balance.productionDamageFactor,
  );
  return Math.min(strength, Math.max(balance.minimumDamage, damage));
}
