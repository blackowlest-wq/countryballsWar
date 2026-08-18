import assert from "node:assert/strict";
import test from "node:test";

import { collectBattleGroups } from "../src/campaign/battle-groups.js";

const battleDistance = 0.055;

test("a home unit is not pulled into a moving group's battle unless it is defending", () => {
  const units = [
    {
      id: "player-moving",
      faction: "blue",
      x: 0,
      y: 0,
      regionId: "player-origin",
      targetRegionId: "enemy-destination",
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
      regionId: "enemy-origin",
      targetRegionId: null,
      arrived: true,
    },
  ];

  const groups = collectBattleGroups({ units, battleDistance });

  assert.deepEqual(groups.map((group) => group.unitIds), [["enemy-moving", "player-moving"]]);
});

test("a home unit joins when an enemy is attacking its region", () => {
  const units = [
    {
      id: "player-attacker",
      faction: "blue",
      x: 0,
      y: 0,
      regionId: "player-origin",
      targetRegionId: "enemy-home",
      arrived: false,
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
