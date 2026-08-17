import { COUNTRIES } from "./countries.js";
import { compileWorldFrontMap } from "./map-compiler.js";
import { WORLD_MAP } from "./world-map.js";

export const MAP = compileWorldFrontMap(WORLD_MAP, WORLD_MAP.frontMaps["korea-front"], COUNTRIES);
