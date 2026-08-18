function normalizeSpriteSource(source) {
  return typeof source === "string" && source.trim().length > 0 ? source : null;
}

export function getCharacterSpriteSource(characterId, characters) {
  return normalizeSpriteSource(characters?.[characterId]?.sprite);
}

export function getCharacterSpriteSources(characters) {
  return Object.fromEntries(
    Object.keys(characters || {})
      .map((characterId) => [characterId, getCharacterSpriteSource(characterId, characters)])
      .filter(([, source]) => source),
  );
}
