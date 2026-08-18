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

The active map contains 11 strategic regions:

- South Korea: six player-owned regions
- North Korea: five enemy-owned regions

Each strategic region is composed from one or more adjacent Natural Earth
administrative features. The first phase places controllable South Korean
character units in the Capital and Southeastern Regions. North Korean
character units begin in the Central, Eastern Central, and Northeastern
Regions. The phase objective contains all five North Korean regions.

Small-country fronts use one phase. A phase defines the same map's objective,
territory owners, production, and initial deployment. Large-country operations
may add multiple phases later without changing the runtime model.

`faction` is the side that owns a unit or region. `countryId` and
`characterId` identify the displayed country character. There is no neutral
faction; every non-player faction is an enemy.

On defeat, the current operation restarts from its first phase. Only completed
front country IDs are persistent campaign progress. Gold and upgrades are
retained.
