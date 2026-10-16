import { test } from "node:test";
import assert from "node:assert/strict";
import { dailyIndex, jstDateKey, shuffleIndex } from "../lib/selection.ts";

test("JST day changes precisely at midnight", () => {
  assert.equal(jstDateKey(new Date("2026-10-16T14:59:59.999Z")), "2026-10-16");
  assert.equal(jstDateKey(new Date("2026-10-16T15:00:00Z")), "2026-10-17");
});
test("every visitor gets the same selection throughout a JST day", () => {
  for (const count of [1, 2, 365]) {
    const start = dailyIndex(count, new Date("2026-10-16T15:00:00Z"));
    assert.equal(start, dailyIndex(count, new Date("2026-10-17T14:59:59Z")));
    assert.ok(start >= 0 && start < count);
  }
});
test("selection spans registry over multiple days", () => {
  const selections = new Set(
    Array.from({ length: 60 }, (_, i) =>
      dailyIndex(5, new Date(Date.UTC(2026, 9, i + 1))),
    ),
  );
  assert.equal(selections.size, 5);
});
test("one artwork remains valid for daily selection and shuffle", () => {
  assert.equal(dailyIndex(1), 0);
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
  assert.throws(() => dailyIndex(0), RangeError);
  assert.throws(() => shuffleIndex(0, 0), RangeError);
});
