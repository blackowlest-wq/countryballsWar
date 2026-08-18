# ADR 0007: Small front first and country-character sprites

## Status

Accepted

## Decision

The first active campaign front is the Korea Front. It uses one close-up
geographic map and one phase. The map combines 28 Natural Earth Admin 1
features into 11 strategic regions: six South Korean player regions and five
North Korean target regions. Geographic polygons are pinned to Natural Earth
v5.1.1 (`9380cca`), and the source subset is retained for reproducible map
builds.

Units use the country-specific character sprite whenever one is available,
including player-controlled units. If a character sprite is unavailable, a
player unit falls back to the player faction sprite and an enemy unit falls
back to its faction/flag renderer. Controllability is determined by faction,
not by the selected sprite.

## Consequences

- The initial scope is one small front with 11 strategic regions and 18
  passable adjacency links.
- Internal administrative borders are not used as separate game targets or
  visible strategic-region borders.
- South Korea and North Korea are completed only after all of their strategic
  regions are controlled.
- Player-controlled South Korean units visibly use the South Korean character
  asset while remaining controllable by the blue faction.
- Future fronts must explicitly select their own source fragments, grouping,
  projection bounds, production, initial deployment, and enemy profile.
