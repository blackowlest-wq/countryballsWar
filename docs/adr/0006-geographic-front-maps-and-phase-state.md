# ADR 0006: Geographic front maps and phase state

## Status

Accepted

## Decision

One front uses one geographic map. A large-country operation may contain two or
more phases on the same map. Geographic source data is authored in
longitude/latitude coordinates and compiled into normalized Canvas coordinates.

The playable unit is a country fragment. `countryId` identifies the country
character and `fragmentId` identifies a split piece of territory. A country is
completed only when all of its fragments are controlled.

Factions describe sides. Every faction other than the player is an active enemy;
there is no neutral relation. Color and character differences are presentation
data, not diplomacy state.

Phase transitions carry player unit position, strength, and occupation state.
Enemy units are removed and recreated from the next phase's initial deployment.
Enemy strength is resolved once when the front starts using the configured
profile and `round`; authored runtime map strength is ignored.

Only completed country IDs are persisted. In-progress phase ownership and
enemy state are intentionally not saved, so a defeat/reload restarts the front's
first phase.

## Consequences

- Map geometry can be upgraded from the compact seed to a licensed GeoJSON
  dataset without changing gameplay code.
- Road validation must cover land and explicit sea links.
- Character asset files are resolved by character ID and shared by the map,
  country profiles, and special-move cut-ins. Deployed characters must have an
  image asset; no flag-based character fallback is used.
- Campaign UI can show front, phase, and completed-country progress without
  encoding geography into the simulation loop.
