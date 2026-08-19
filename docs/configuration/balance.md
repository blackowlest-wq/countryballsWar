# Balance configuration

The source is `src/config/balance.js`. Campaign-specific production and
deployment are stored per phase in `src/config/campaign.js`.

## First front

The Korea Front uses the `regionalSmall` type and has one phase. Its enemy
profile is `regionalIntro`:

- strength multiplier: `0.85`
- active enemy unit limit: `3`
- reinforcement limit: `2`
- action delay: `4.8s`

At front start, enemy strength is resolved once:

```text
enemyMaxStrength = round(baseMaxStrengthByFaction * frontStrengthMultiplier * difficultyEnemyStrengthMultiplier)
```

Authored map strength is not read. Active production values are stored in the
phase configuration. Combat now gives strength the primary weight
(`strengthDamageFactor: 0.2`), keeps production as a smaller contribution
(`productionDamageFactor: 0.2`), and allows one-point minimum damage. This
prevents a small production difference from defeating a clearly larger direct
force.

## Difficulty

Difficulty is stored in `balance.difficulty.profiles` and is selected once per
campaign. The Korea Front therefore resolves a base enemy strength of `12` as
`round(12 * 0.85 * difficultyMultiplier)`:

| ID | Japanese label | Enemy multiplier | Special move uses | Upgrade caps (logistics / armor / reserve / speed) |
|---|---|---:|---:|---:|
| `easy` | やさしい | `0.8` | `3` | `8 / 8 / 5 / 8` |
| `normal` | ふつう | `1.0` | `1` | `6 / 6 / 4 / 6` |
| `hard` | むずかしい | `1.2` | `0` | `4 / 4 / 2 / 4` |

The resulting Korea Front enemy strengths are `8`, `10`, and `12`. Upgrade
caps only block future purchases; they never reduce an already saved level.

## Major-country fronts

Japan uses `majorEarly` (`1.15`) and China uses `majorMiddle` (`1.25`). With a
base enemy strength of `12`, China resolves starting enemy strength to `12`,
`15`, and `18` on easy, normal, and hard respectively. China uses four opening
enemy deployments, five late-phase deployments, an active-unit limit of `6`, a
reinforcement limit of `6`, and an action delay of `3.5s`.

China production ranges from `2` on the Plateau to `6` on the Lower Yangtze
and Northern Coast. Hainan starts at `3`; the values for all fourteen regions
are defined per phase in `src/config/campaign.js`.
