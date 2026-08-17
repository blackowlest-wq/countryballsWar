import assert from "node:assert/strict";
import test from "node:test";

import {
  applySpecialMoveEffect,
  createSpecialMoveSettings,
} from "../src/special-move.js";

const BALANCE = {
  maxNameLength: 24,
  types: {
    enemyWeakness: { defaultName: "敵弱体化", strengthReductionRate: 0.2 },
    allyBoost: { defaultName: "味方強化", strengthIncreaseRate: 0.2 },
    invincibility: { defaultName: "無敵", durationSeconds: 3 },
  },
};

test("必殺技設定は種類と名前を正規化する", () => {
  assert.deepEqual(createSpecialMoveSettings("allyBoost", "  突撃  ", BALANCE), {
    type: "allyBoost",
    name: "突撃",
  });
  assert.deepEqual(createSpecialMoveSettings("invincibility", "", BALANCE), {
    type: "invincibility",
    name: "無敵",
  });
  assert.equal(createSpecialMoveSettings("invalid", "x", BALANCE), null);
});

test("敵弱体化は敵の現在戦力だけを20%減らす", () => {
  const units = [
    { faction: "white", strength: 10, maxStrength: 12 },
    { faction: "red", strength: 9, maxStrength: 12 },
  ];
  applySpecialMoveEffect("enemyWeakness", units, BALANCE, "white");
  assert.deepEqual(units.map((unit) => unit.strength), [10, 7]);
});

test("味方強化は最大戦力を超えない", () => {
  const units = [
    { faction: "white", strength: 7, maxStrength: 20 },
    { faction: "white", strength: 10, maxStrength: 10 },
    { faction: "red", strength: 8, maxStrength: 10 },
  ];
  applySpecialMoveEffect("allyBoost", units, BALANCE, "white", 1);
  assert.deepEqual(units.map((unit) => unit.strength), [9, 10, 8]);
});

test("無敵は設定された秒数を返し、部隊戦力を変更しない", () => {
  const units = [{ faction: "white", strength: 4, maxStrength: 10 }];
  assert.deepEqual(applySpecialMoveEffect("invincibility", units, BALANCE, "white"), {
    kind: "invincibility",
    durationSeconds: 3,
  });
  assert.equal(units[0].strength, 4);
});
