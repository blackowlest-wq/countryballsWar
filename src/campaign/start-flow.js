export function getNextRouteAfterSpecialMove({ difficultyLocked = false } = {}) {
  return difficultyLocked ? "operation" : "difficulty-selection";
}
