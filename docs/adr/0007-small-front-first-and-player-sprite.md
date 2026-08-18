# ADR 0007: Small front first and country-character sprites

## Status

Accepted

## Decision

The first active campaign front is the Korea Front. It uses one close-up
geographic map and one phase. The map combines 28 Natural Earth Admin 1
features into 11 strategic regions: six South Korean regions and five North
Korean regions. Only Jeju starts under
player control; both South Korea and North Korea are enemy countries.
Geographic polygons are pinned to Natural Earth
v5.1.1 (`9380cca`), and the source subset is retained for reproducible map
builds.

Player units use the separate white player-character/faction sprite. Enemy
units use the country-specific character sprite whenever one is available. If
an enemy character sprite is unavailable, the unit falls back to its
faction/flag renderer. Controllability is determined by faction, not by the
selected sprite.

## Consequences

- The initial scope is one small front with 11 strategic regions and 18
  passable adjacency links.
- Jeju has an expanded interaction radius so the small island remains
  selectable on touch screens without overlapping nearby strategic targets.
- Internal administrative borders are not used as separate game targets or
  visible strategic-region borders.
- South Korea and North Korea are both enemy countries and are completed only
  after all of their strategic regions are controlled.
- The player begins with one white unit on Jeju and one controlled region; South Korean
  and North Korean character assets are reserved for enemy units.
- Combat gives direct strength a stronger influence than production, and the
  configured active AI faction is preferred when several enemy invasions are
  possible.
- Future fronts must explicitly select their own source fragments, grouping,
  projection bounds, production, initial deployment, and enemy profile.
