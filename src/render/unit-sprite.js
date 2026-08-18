export function selectUnitSpriteKey({ playerFactionId, faction, characterId, characters }) {
  if (faction === playerFactionId) return faction;
  const character = characters?.[characterId];
  if (character?.sprite) return characterId;
  return null;
}
