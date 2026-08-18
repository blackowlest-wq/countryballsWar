import assert from "node:assert/strict";
import test from "node:test";

import { collectBattleGroups } from "../src/campaign/battle-groups.js";

const battleDistance = 0.055;

test("a home unit is not pulled into a moving group's battle before the attacker arrives", () => {
  const units = [
    {
      id: "player-moving",
      faction: "blue",
      x: 0,
      y: 0,
      regionId: "player-origin",
      targetRegionId: "enemy-home",
      arrived: false,
    },
    {
      id: "enemy-moving",
      faction: "red",
      x: 0.018,
      y: 0,
      regionId: "enemy-origin",
      targetRegionId: "player-destination",
      arrived: false,
    },
    {
      id: "enemy-home",
      faction: "red",
      x: 0.036,
      y: 0,
      regionId: "enemy-home",
      targetRegionId: null,
      arrived: true,
    },
  ];

  const groups = collectBattleGroups({ units, battleDistance });

  assert.deepEqual(groups.map((group) => group.unitIds), [["enemy-moving", "player-moving"]]);
});

test("a home unit joins when an enemy has arrived to attack its region", () => {
  const units = [
    {
      id: "player-attacker",
      faction: "blue",
      x: 0,
      y: 0,
      regionId: "player-origin",
      targetRegionId: "enemy-home",
      arrived: true,
    },
    {
      id: "enemy-home",
      faction: "red",
      x: 0.018,
      y: 0,
      regionId: "enemy-home",
      targetRegionId: null,
      arrived: true,
    },
  ];

  const groups = collectBattleGroups({ units, battleDistance });

  assert.deepEqual(groups.map((group) => group.unitIds), [["enemy-home", "player-attacker"]]);
});
