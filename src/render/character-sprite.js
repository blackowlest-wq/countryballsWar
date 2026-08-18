function normalizeSpriteSource(source) {
  return typeof source === "string" && source.trim().length > 0 ? source : null;
}

export function createCharacterSpriteImage(source, onLoad) {
  const image = new Image();
  image.decoding = "async";
  if (typeof onLoad === "function") image.addEventListener("load", onLoad, { once: true });
  image.src = source;
  return image;
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
