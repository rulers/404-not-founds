import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createLiquid,
  stepLiquid,
  grabLiquid,
  releaseLiquid,
  liquidGroups,
} from "../lib/liquid404.ts";
test("initial pools are separate masses, not a completed 404", () => {
  const s = createLiquid();
  assert.equal(liquidGroups(s), 5);
  assert.equal(s.formed, false);
  assert.ok(
    s.drops.reduce((n, p) => n + Math.hypot(p.x - p.tx, p.y - p.ty), 0) /
      s.drops.length >
      100,
  );
  assert.equal(grabLiquid(s, 990, 10), false);
});
test("pulling moves actual mass, tears links and keeps release momentum", () => {
  const s = createLiquid(600),
    p = s.drops[0],
    start = p.x;
  assert.equal(grabLiquid(s, p.x, p.y), true);
  for (let i = 0; i < 90; i++) {
    s.pointer.x = start + Math.min(i * 10, 550);
    stepLiquid(s, 1 / 60);
  }
  assert.ok(p.x > start + 450);
  assert.ok(s.split > 0);
  s.pointer.x += 40;
  stepLiquid(s, 1 / 60);
  releaseLiquid(s);
  const released = p.x;
  stepLiquid(s, 1 / 60);
  assert.notEqual(p.x, released);
  assert.ok(s.idle < 1);
  assert.equal(s.drops.length, 42);
});
test("contact joins disconnected material and idle mass forms 404", () => {
  const s = createLiquid(600);
  s.bonds = [];
  s.drops[1].x = s.drops[0].x + 30;
  s.drops[1].y = s.drops[0].y;
  const before = liquidGroups(s);
  stepLiquid(s, 1 / 60);
  assert.ok(liquidGroups(s) < before);
  assert.ok(s.merged > 0);
  for (let i = 0; i < 1200; i++) stepLiquid(s, 1 / 60, true);
  assert.ok(s.formed);
  assert.ok(s.drops.every((p) => Math.hypot(p.x - p.tx, p.y - p.ty) < 8));
  assert.ok(grabLiquid(s, s.drops[0].x, s.drops[0].y));
  assert.equal(s.formed, false);
});
test("long steps, bounds and cancellation stay finite in portrait and landscape", () => {
  for (const h of [180, 1500]) {
    const s = createLiquid(h);
    grabLiquid(s, s.drops[0].x, s.drops[0].y);
    s.pointer = { x: -1000, y: 5000 };
    for (let i = 0; i < 300; i++) stepLiquid(s, 10, true);
    releaseLiquid(s, true);
    for (const p of s.drops) {
      assert.ok(Number.isFinite(p.x) && Number.isFinite(p.vx));
      assert.ok(p.x >= 0 && p.x <= 1000 && p.y >= 0 && p.y <= h);
    }
  }
});
