import { COUNTRIES } from "./countries.js";

const EXISTING_SPRITES = {
  china: "./assets/units/enemy-china.png",
  "north-korea": "./assets/units/enemy-north-korea.png",
  "south-korea": "./assets/units/enemy-korea.png",
};

export const PLAYER_CHARACTER_ID = "player";

export const CHARACTERS = {
  [PLAYER_CHARACTER_ID]: {
    id: PLAYER_CHARACTER_ID,
    countryId: null,
    sprite: null,
    fallbackFactionId: "blue",
    eyeStyle: "round",
    flag: { type: "field", colors: ["#ffffff", "#d94f58"] },
    isPlayerCharacter: true,
    assetStatus: "faction-sprite",
  },
  ...Object.fromEntries(
    Object.values(COUNTRIES).map((country) => [country.id, {
      id: country.id,
      countryId: country.id,
      sprite: EXISTING_SPRITES[country.id] || null,
      fallbackFactionId: country.id === "kazakhstan" || country.id === "mongolia" ? "blue" : "gray",
      eyeStyle: country.isMajor ? "sharp" : "round",
      flag: country.flag,
      isPlayerCharacter: false,
      assetStatus: EXISTING_SPRITES[country.id] ? "existing" : "placeholder",
    }]),
  ),
};
