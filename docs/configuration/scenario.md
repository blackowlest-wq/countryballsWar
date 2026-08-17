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

The active map contains 28 geographic fragments:

- South Korea: 17 player-owned administrative fragments
- North Korea: 11 enemy-owned administrative fragments

The first phase places controllable South Korean character units in Seoul and
South Gyeongsang. North Korean character units begin in Pyongyang, Kangwon,
and North Hamgyong. The phase objective contains all 11 North Korean
fragments, while country completion is also checked through the country master.

Small-country fronts use one phase. A phase defines the same map's objective,
territory owners, production, and initial deployment. Large-country operations
may add multiple phases later without changing the runtime model.

`faction` is the side that owns a unit or fragment. `countryId` and
`characterId` identify the displayed country character. There is no neutral
faction; every non-player faction is an enemy.

On defeat, the current operation restarts from its first phase. Only completed
front country IDs are persistent campaign progress. Gold and upgrades are
retained.
