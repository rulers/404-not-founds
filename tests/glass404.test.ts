import { test } from "node:test";
import assert from "node:assert/strict";
import {
  makeCracks,
  makeShards,
  advanceShard,
  fractureGlass,
  type GlassCell,
} from "../lib/glass404.ts";

test("fractures originate at the impact and vary with the seed", () => {
  const origin = { x: 250, y: 200 };
  const first = makeCracks(origin, () => 0.2),
    second = makeCracks(origin, () => 0.8);
  for (const crack of first) {
    assert.deepEqual(crack.points[0], origin);
    assert.ok(crack.branches.length > 0);
  }
  assert.notDeepEqual(first, second);
});
test("fragments are bounded to the material, with gravity and angular damping", () => {
  assert.equal(makeShards(() => false, { x: 0, y: 0 }).length, 0);
  const shards = makeShards(
    (x, y) => x < 300 && y < 300,
    { x: 200, y: 200 },
    () => 0.6,
  );
  assert.ok(shards.length > 0 && shards.length < 500);
  for (const shard of shards) {
    assert.ok(shard.x < 300 && shard.y < 300);
    const { vy, spin } = shard;
    advanceShard(shard, 1 / 60);
    assert.ok(shard.vy > vy);
    assert.ok(Math.abs(shard.spin) < Math.abs(spin));
    assert.ok(Number.isFinite(shard.x));
  }
});

test("impact position and charge change the damage, and an empty impact cannot break twice", () => {
  const board = () =>
    makeShards(
      () => true,
      { x: 500, y: 250 },
      () => 0.5,
    ).map((p) => ({ ...p, intact: true, age: 0 })) as GlassCell[];
  const quick = board(),
    strong = board();
  const first = fractureGlass(quick, { x: 270, y: 200 }, 0, () => 0.5);
  assert.ok(first.length > 0);
  assert.equal(
    fractureGlass(quick, { x: 270, y: 200 }, 0, () => 0.5).length,
    0,
  );
  assert.ok(
    fractureGlass(strong, { x: 270, y: 200 }, 1, () => 0.5).length >
      first.length * 3,
  );
  assert.ok(quick.filter((p) => p.x > 700).every((p) => p.intact));
  const other = board();
  const second = fractureGlass(other, { x: 800, y: 200 }, 0, () => 0.5);
  assert.ok(second.every((p) => p.x > 700));
});
