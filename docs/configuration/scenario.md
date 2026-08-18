# Scenario and campaign configuration

The campaign begins with the small Korea map. Clearing it unlocks the Japan
map, which is the first two-phase major-country operation.

```text
campaign
  fronts
    korea-front
      phaseIds: korea-front-opening
      targetCountryIds: south-korea, north-korea
    japan-front
      phaseIds: japan-front-opening, japan-front-late
      targetCountryIds: japan
  phases
    korea-front-opening
    japan-front-opening
    japan-front-late
```

The active Korea map contains 11 strategic regions:

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

Small-country maps use one phase. A phase defines the same map's objective,
territory owners, production, and initial deployment. Large-country operations
use multiple phases on the same map. Player units and occupied regions carry
over between phases; enemy units are cleared and recreated from the next
phase's initial deployment.

`faction` is the side that owns a unit or region. `countryId` and
`characterId` identify the displayed country character for enemy units; the
player uses the separate white `player` character by default and can equip a
real country character from the flag collection. There is no neutral faction;
every non-player faction is an enemy.

On defeat, the current operation restarts from its first phase. Only completed
front country IDs are persistent campaign progress. Gold and upgrades are
retained.
