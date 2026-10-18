import { test } from "node:test";
import assert from "node:assert/strict";
import {
  makePane,
  scorePane,
  strikePane,
  advanceShard,
  makeCracks,
} from "../lib/glass404.ts";
test("pane covers the viewport, shares joints, and fractures originate at input", () => {
  const cells = makePane(700, () => 0.5);
  assert.ok(cells.some((c) => c.home.x < 50));
  assert.ok(cells.some((c) => c.home.y > 650));
  assert.ok(cells.every((c) => c.neighbors.length >= 1));
  const origin = { x: 230, y: 300 };
  assert.deepEqual(makeCracks(origin, () => 0.3)[0].points[0], origin);
});
test("repeated localized impacts and scoring alter failure, with distant areas intact", () => {
  const p = { x: 220, y: 330 },
    plain = makePane(700, () => 0.5),
    scored = makePane(700, () => 0.5);
  scorePane(scored, { x: 120, y: 330 }, { x: 350, y: 330 });
  scorePane(scored, { x: 120, y: 330 }, { x: 350, y: 330 });
  assert.equal(strikePane(plain, p, 0, () => 0.5).length, 0);
  assert.ok(strikePane(scored, p, 0, () => 0.5).length > 0);
  assert.ok(strikePane(plain, p, 0, () => 0.5).length > 0);
  assert.ok(plain.filter((c) => c.home.x > 700).every((c) => c.intact));
  const other = makePane(700, () => 0.5);
  strikePane(other, { x: 800, y: 300 }, 1, () => 0.5);
  assert.ok(other.filter((c) => !c.intact).every((c) => c.home.x > 500));
});
test("material loss cascades and fragments fall with angular damping", () => {
  const cells = makePane(700, () => 0.5);
  for (const c of cells) {
    strikePane(cells, c.home, 1, () => 0.5);
    if (cells.every((p) => !p.intact)) break;
  }
  assert.ok(cells.every((c) => !c.intact));
  const shard = cells[0],
    vy = shard.vy,
    spin = shard.spin;
  advanceShard(shard, 1 / 60);
  assert.ok(shard.vy > vy);
  assert.ok(Math.abs(shard.spin) <= Math.abs(spin));
});
