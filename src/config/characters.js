import { COUNTRIES } from "./countries.js";

const EXISTING_SPRITES = {
  player: "./assets/units/player-red-circle.png",
  china: "./assets/units/enemy-china.png",
  "north-korea": "./assets/units/enemy-north-korea.png",
  "south-korea": "./assets/units/enemy-korea.png",
};

export const PLAYER_CHARACTER_ID = "player";

export const CHARACTERS = {
  [PLAYER_CHARACTER_ID]: {
    id: PLAYER_CHARACTER_ID,
    countryId: null,
    sprite: EXISTING_SPRITES[PLAYER_CHARACTER_ID],
    isPlayerCharacter: true,
  },
  ...Object.fromEntries(
    Object.values(COUNTRIES).map((country) => [country.id, {
      id: country.id,
      countryId: country.id,
      sprite: EXISTING_SPRITES[country.id] || null,
      isPlayerCharacter: false,
    }]),
  ),
};
