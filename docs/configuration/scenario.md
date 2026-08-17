# Scenario and campaign configuration

The active campaign is intentionally small while the front rules are being
validated. The first playable operation is the Korea Front.

```text
campaign
  fronts
    korea-front
      phaseIds: korea-front-opening
      targetCountryIds: north-korea
  phases
    korea-front-opening
```

The active map contains two geographic fragments:

- South Korea: player starting territory and initial blue unit
- North Korea: the single target country and initial red unit

Small-country fronts use one phase. A phase defines the same map's objective,
territory owners, production, and initial deployment. Large-country operations
may add multiple phases later without changing the runtime model.

`faction` is the side that owns a unit or fragment. `countryId` and
`characterId` identify the displayed country character. There is no neutral
faction; every non-player faction is an enemy.

On defeat, the current operation restarts from its first phase. Only completed
front country IDs are persistent campaign progress. The campaign ID changed
from the previous world seed, so old campaign completion is discarded while
Gold and upgrades are retained.
