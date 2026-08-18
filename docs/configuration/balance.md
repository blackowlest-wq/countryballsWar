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
enemyMaxStrength = round(baseMaxStrengthByFaction * strengthMultiplier)
```

Authored map strength is not read. Active production values are stored in the
phase configuration. Combat now gives strength the primary weight
(`strengthDamageFactor: 0.2`), keeps production as a smaller contribution
(`productionDamageFactor: 0.2`), and allows one-point minimum damage. This
prevents a small production difference from defeating a clearly larger direct
force.

## Future data

The world source already contains additional East Asia fragments, but they are
not active in the first front. Their production and enemy profiles should be
added when the next front is selected.
