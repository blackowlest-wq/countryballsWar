export const UNIT_MOVEMENT_STATES = Object.freeze({
  MOVING: "moving",
  STATIONED: "stationed",
});

export function isUnitMoving(unit) {
  return unit.movementState === UNIT_MOVEMENT_STATES.MOVING;
}

export function isUnitStationed(unit) {
  return unit.movementState === UNIT_MOVEMENT_STATES.STATIONED;
}
