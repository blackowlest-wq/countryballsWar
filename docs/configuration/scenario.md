# Scenario and campaign configuration

The active campaign is intentionally small while the front rules are being
validated. The first playable operation is the Korea Front.

```text
campaign
  fronts
    korea-front
      phaseIds: korea-front-opening
      targetCountryIds: south-korea, north-korea
  phases
    korea-front-opening
```

The active map contains 11 strategic regions:

- South Korea: one player starting region and five enemy-owned regions
- North Korea: five enemy-owned regions

Each strategic region is composed from one or more adjacent Natural Earth
administrative features. The player begins with one white character unit on
Jeju Island. South Korean and North Korean character units are both enemy
units; South Korean enemies begin in the Central Region, while North Korean
enemies begin in the Central, Eastern Central, and Northeastern Regions. The
phase objective contains the other ten enemy regions.

All non-player factions can generate invasion candidates. When multiple enemy
factions can attack at the same time, the configured active AI faction (North
Korea in this front) is selected first so an adjacent North Korean region does
not get starved by another enemy warning.

Small-country fronts use one phase. A phase defines the same map's objective,
territory owners, production, and initial deployment. Large-country operations
may add multiple phases later without changing the runtime model.

`faction` is the side that owns a unit or region. `countryId` and
`characterId` identify the displayed country character for enemy units; the
player uses the separate white `player` character by default and can equip a
real country character from the flag collection. There is no neutral faction;
every non-player faction is an enemy.

On defeat, the current operation restarts from its first phase. Only completed
front country IDs are persistent campaign progress. Gold and upgrades are
retained.
