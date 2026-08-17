export function selectUnitSpriteKey({ playerFactionId, faction, characterId, characters }) {
  if (faction === playerFactionId) return faction;
  const character = characters?.[characterId];
  return character?.sprite ? characterId : null;
}
