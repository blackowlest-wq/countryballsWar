# Faction configuration

The source is `src/config/factions.js`.

| ID | Meaning | Enemy |
|---|---|---:|
| `blue` | White Union player side | No |
| `red` | Red enemy coalition | Yes |
| `gray` | Gray enemy coalition | Yes |
| `pink` | Pink enemy coalition | Yes |

Faction data owns side-level palette, UI text, movement, and fallback unit
appearance. A faction does not identify the displayed country character. Unit
deployments carry `characterId`, which resolves through
`src/config/characters.js`.
