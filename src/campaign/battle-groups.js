function distance(left, right) {
  return Math.hypot(left.x - right.x, left.y - right.y);
}

function addContact(contacts, leftId, rightId) {
  contacts.get(leftId).push(rightId);
  contacts.get(rightId).push(leftId);
}

function isHomeUnit(unit) {
  return unit.arrived && !unit.targetRegionId;
}

function canJoinBattleContact(unit, opponent, getUnitRegionId) {
  if (!isHomeUnit(unit)) return true;
  const homeRegionId = getUnitRegionId(unit);
  return Boolean(homeRegionId && opponent.arrived && opponent.targetRegionId === homeRegionId);
}

export function collectBattleGroups({ units, battleDistance, getUnitRegionId = (unit) => unit.regionId || unit.targetRegionId || null }) {
  const contacts = new Map(units.map((unit) => [unit.id, []]));
  const activeUnitIds = new Set();

  // First establish only valid cross-faction contacts. A unit that has never
  // left its home region can enter through this pass only as a defender.
  for (let leftIndex = 0; leftIndex < units.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < units.length; rightIndex += 1) {
      const left = units[leftIndex];
      const right = units[rightIndex];
      if (left.faction === right.faction) continue;
      if (distance(left, right) > battleDistance) continue;
      if (!canJoinBattleContact(left, right, getUnitRegionId)) continue;
      if (!canJoinBattleContact(right, left, getUnitRegionId)) continue;
      addContact(contacts, left.id, right.id);
      activeUnitIds.add(left.id);
      activeUnitIds.add(right.id);
    }
  }

  // Same-faction edges may connect units that are already in a valid battle,
  // but an uninvolved home unit must not become a bridge into that group.
  for (let leftIndex = 0; leftIndex < units.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < units.length; rightIndex += 1) {
      const left = units[leftIndex];
      const right = units[rightIndex];
      if (left.faction !== right.faction) continue;
      if (!activeUnitIds.has(left.id) || !activeUnitIds.has(right.id)) continue;
      if (distance(left, right) > battleDistance) continue;
      addContact(contacts, left.id, right.id);
    }
  }

  const visited = new Set();
  const groups = [];
  units.forEach((unit) => {
    if (visited.has(unit.id) || !activeUnitIds.has(unit.id)) return;

    const queue = [unit.id];
    const memberIds = [];
    visited.add(unit.id);
    while (queue.length > 0) {
      const currentId = queue.shift();
      memberIds.push(currentId);
      contacts.get(currentId).forEach((neighborId) => {
        if (visited.has(neighborId)) return;
        visited.add(neighborId);
        queue.push(neighborId);
      });
    }

    const sortedIds = memberIds.sort();
    const sideMap = new Map();
    sortedIds.forEach((memberId) => {
      const member = units.find((candidate) => candidate.id === memberId);
      if (!member) return;
      if (!sideMap.has(member.faction)) sideMap.set(member.faction, []);
      sideMap.get(member.faction).push(memberId);
    });
    groups.push({
      id: sortedIds.join("::"),
      unitIds: sortedIds,
      sides: [...sideMap.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([faction, unitIds]) => ({ faction, unitIds })),
    });
  });
  return groups;
}
