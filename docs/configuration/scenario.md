# Scenario and campaign configuration

The campaign master is `src/config/campaign.js`. The current playable scenario
is derived from its first phase by `src/config/scenario.js`.

## Structure

```text
campaign
  fronts
    asia-front
      phaseIds: asia-front-early, asia-front-late
  phases
    asia-front-early
    asia-front-late
```

Each phase defines the same geographic map, its objective fragments, initial
owners, production per fragment, and initial deployments. A large-country
operation can therefore use one map while changing the active situation.

`faction` is the side that owns a unit or fragment. `countryId` and
`characterId` identify the country character displayed by that unit. There is
no neutral faction; every non-player faction is an enemy.

## Phase transition

When the phase objective is complete:

1. Player units keep position and strength.
2. Fragment occupation state is carried over.
3. All enemy units are removed.
4. Enemy units are created from the next phase's initial deployment.
5. The same map and road graph remain active.

On defeat, the current operation is restarted from the front's first phase.
Only completed front country IDs are persistent campaign progress.
