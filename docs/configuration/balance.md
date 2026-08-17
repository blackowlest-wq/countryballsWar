# Balance configuration

The source is `src/config/balance.js`. Campaign-specific production and
deployment are stored per phase in `src/config/campaign.js`.

## Geographic fragment production

The East Asia seed currently uses the following production values:

| Production | Fragments |
|---:|---|
| 1 | `mongolia`, `north-korea`, `vietnam`, `philippines` |
| 2 | `russia-east`, `russia-far-east`, `kazakhstan`, `china-south`, `south-korea`, `japan`, `indonesia` |
| 3 | `china-north`, `china-central` |

## Enemy profile application

At front start, the selected front profile is resolved for every enemy initial
unit. The runtime value is:

```text
enemyMaxStrength = round(baseMaxStrengthByFaction * strengthMultiplier)
```

The authored strength in a map or deployment is not used. The current East
Asia front uses `regionalEarly` (`0.95`, active limit `4`, reinforcement limit
`3`, action delay `4.4s`).

## Other balance domains

Clock, movement, occupation, combat, AI, economy, shop, and special-move values
remain in `src/config/balance.js`. Configuration validation checks every faction
and every geographic fragment has a required value.
