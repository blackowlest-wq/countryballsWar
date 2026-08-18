# Faction configuration

The source is `src/config/factions.js`.

| ID | Meaning | Enemy |
|---|---|---:|
| `blue` | White Union player side | No |
| `red` | Red enemy coalition | Yes |
| `gray` | Gray enemy coalition | Yes |
| `pink` | Pink enemy coalition | Yes |

Faction data owns side-level palette, UI text, and movement. A faction does not
identify the displayed country character. Unit deployments carry `characterId`,
which resolves to the real image in `src/config/characters.js`. Character image
consumers do not generate a flag-based fallback; a deployed character must have
an image asset.
