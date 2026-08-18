import { COUNTRIES } from "./countries.js";
import { compileWorldFrontMap } from "./map-compiler.js";
import { WORLD_MAP } from "./world-map.js";

export const MAPS = Object.fromEntries(
  Object.values(WORLD_MAP.frontMaps).map((frontMap) => [
    frontMap.id,
    compileWorldFrontMap(WORLD_MAP, frontMap, COUNTRIES),
  ]),
);

export const MAP = MAPS["korea-front"];
