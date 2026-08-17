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

Authored map strength is not read. The active production values are `2` for
South Korea and `1` for North Korea.

## Future data

The world source already contains additional East Asia fragments, but they are
not active in the first front. Their production and enemy profiles should be
added when the next front is selected.
