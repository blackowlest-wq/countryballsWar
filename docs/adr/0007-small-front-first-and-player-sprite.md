# ADR 0007: Small front first and player sprite priority

## Status

Accepted

## Decision

The first active campaign front is the Korea Front. It uses one close-up
geographic map and one phase. South Korea is the player starting territory;
North Korea is the only target country. The remaining geographic source data is
kept for future fronts but is not loaded into the active runtime map.

Player units always use the player faction sprite so they remain visually and
operationally identifiable. Enemy units may use a country-specific character
sprite; missing enemy assets fall back to the clipped flag renderer.

## Consequences

- Initial scope is two regions and one land road.
- Small-country fronts can be completed without a phase transition.
- Campaign ID changes reset old world-seed campaign completion while preserving
  economy and upgrades.
- Future fronts must explicitly select their own map fragments, projection
  bounds, production, initial deployment, and enemy profile.
