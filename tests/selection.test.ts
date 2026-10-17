import { test } from "node:test";
import assert from "node:assert/strict";
import { randomIndex, shuffleIndex } from "../lib/selection.ts";

test("random selection covers every registered artwork including both ends", () => {
  for (const count of [1, 2, 365]) {
    assert.equal(
      randomIndex(count, () => 0),
      0,
    );
    assert.equal(
      randomIndex(count, () => 0.999999),
      count - 1,
    );
    for (let i = 0; i < count; i++)
      assert.equal(
        randomIndex(count, () => (i + 0.5) / count),
        i,
      );
  }
});
test("one artwork remains valid for random selection and shuffle", () => {
  assert.equal(randomIndex(1), 0);
  assert.equal(shuffleIndex(1, 0), 0);
});
test("shuffle always chooses another artwork when available", () => {
  for (const count of [2, 365])
    for (let current = 0; current < count; current++) {
      for (const random of [0, 0.5, 0.999999]) {
        const next = shuffleIndex(count, current, () => random);
        assert.notEqual(next, current);
        assert.ok(next >= 0 && next < count);
      }
    }
});
test("empty registries are rejected explicitly", () => {
  assert.throws(() => randomIndex(0), RangeError);
  assert.throws(() => shuffleIndex(0, 0), RangeError);
});
