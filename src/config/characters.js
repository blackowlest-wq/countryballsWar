import { COUNTRIES } from "./countries.js";

const EXISTING_SPRITES = {
  china: "./assets/units/enemy-china.png",
  "north-korea": "./assets/units/enemy-north-korea.png",
  "south-korea": "./assets/units/enemy-korea.png",
};

export const CHARACTERS = Object.fromEntries(
  Object.values(COUNTRIES).map((country) => [country.id, {
    id: country.id,
    countryId: country.id,
    sprite: EXISTING_SPRITES[country.id] || null,
    fallbackFactionId: country.id === "kazakhstan" || country.id === "mongolia" ? "blue" : "gray",
    eyeStyle: country.isMajor ? "sharp" : "round",
    flag: country.flag,
    assetStatus: EXISTING_SPRITES[country.id] ? "existing" : "placeholder",
  }]),
);
