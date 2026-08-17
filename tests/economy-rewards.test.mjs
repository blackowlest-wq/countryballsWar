import assert from "node:assert/strict";
import test from "node:test";
import { calculateCampaignClearGold, calculateClearGold, calculateDefeatGold, calculateProgressGold } from "../src/economy/rewards.js";

const REWARD_BALANCE = {
  captureGold: 15,
  battleWinGold: 10,
  defeatConversionRate: 0.35,
  defeatRewardCap: 60,
  minimumDefeatGold: 20,
  minimumDefeatElapsedSeconds: 30,
  minimumDefeatCaptures: 1,
  clearBonus: 50,
  campaignClearBonus: 300,
};

test("進行報酬は占領数と戦闘勝利数から計算する", () => {
  assert.equal(calculateProgressGold({ capturedRegions: 2, battleWins: 3 }, REWARD_BALANCE), 60);
});

test("成果のない短時間の敗北には救済Goldを与えない", () => {
  assert.equal(calculateDefeatGold({ capturedRegions: 0, battleWins: 20, elapsedSeconds: 120 }, REWARD_BALANCE), 0);
  assert.equal(calculateDefeatGold({ capturedRegions: 1, battleWins: 2, elapsedSeconds: 29 }, REWARD_BALANCE), 0);
});

test("敗北報酬は進行報酬の一部に限定し、上限を適用する", () => {
  assert.equal(calculateDefeatGold({ capturedRegions: 1, battleWins: 2, elapsedSeconds: 30 }, REWARD_BALANCE), 20);
  assert.equal(calculateDefeatGold({ capturedRegions: 8, battleWins: 10, elapsedSeconds: 120 }, REWARD_BALANCE), 60);
});

test("クリア時は進行報酬全額とクリアボーナスを与える", () => {
  assert.equal(calculateClearGold({ capturedRegions: 7, battleWins: 3 }, REWARD_BALANCE), 185);
});

test("キャンペーン制覇時は最終ボーナスを追加する", () => {
  assert.equal(calculateCampaignClearGold({ capturedRegions: 7, battleWins: 3 }, REWARD_BALANCE), 485);
});
