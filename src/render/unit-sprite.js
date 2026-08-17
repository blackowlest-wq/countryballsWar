export function selectUnitSpriteKey({ playerFactionId, faction, characterId, characters }) {
  const character = characters?.[characterId];
  if (character?.sprite) return characterId;
  if (faction === playerFactionId) return faction;
  return null;
}
