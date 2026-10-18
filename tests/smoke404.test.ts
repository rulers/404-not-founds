import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createSmoke,
  smokeArrival,
  smokeAt,
  blowSmoke,
  stepSmoke,
  smokeTexture,
} from "../lib/smoke404.ts";
test("404 starts unobscured; smoke arrives only after the opening pause", () => {
  assert.equal(smokeArrival(0), 0);
  assert.equal(smokeArrival(1.8), 0);
  assert.ok(smokeArrival(3) > 0.1 && smokeArrival(3) < 0.8);
  assert.equal(smokeArrival(6), 1);
});
test("wind follows the swipe path, leaves remote smoke alone and fades away", () => {
  const s = createSmoke(700),
    near = { x: 550, y: 343 },
    far = { x: 60, y: 680 };
  blowSmoke(s, { x: 300, y: 343 }, { x: 800, y: 343 }, 1);
  assert.ok(smokeAt(s, near)[2] > 0.8);
  assert.ok(smokeAt(s, far)[2] < 0.01);
  for (let i = 0; i < 360; i++) stepSmoke(s, 1 / 60);
  assert.ok(smokeAt(s, near)[2] < 0.02);
  assert.ok(s.pixels.every((n) => n >= 0 && n <= 255));
});
test("wind moves smoke, not the target, with bounded recovery and quiet reduced motion", () => {
  const s = createSmoke(700),
    still = createSmoke(700);
  blowSmoke(s, { x: 300, y: 343 }, { x: 800, y: 343 }, 1.5);
  blowSmoke(still, { x: 300, y: 343 }, { x: 800, y: 343 }, 1.5);
  const homes = s.puffs.map((p) => ({ x: p.x, y: p.y, angle: p.angle }));
  for (let i = 0; i < 90; i++) {
    stepSmoke(s, 1 / 60);
    stepSmoke(still, 1 / 60, true);
  }
  assert.ok(
    s.puffs.some((p, i) => Math.hypot(p.x - homes[i].x, p.y - homes[i].y) > 1),
  );
  assert.ok(
    still.puffs.every(
      (p, i) => p.x === homes[i].x && p.angle === homes[i].angle,
    ),
  );
  for (let i = 0; i < 900; i++) stepSmoke(s, 1 / 60);
  assert.ok(
    s.puffs.every(
      (p) =>
        Number.isFinite(p.x) && Math.hypot(p.x - p.homeX, p.y - p.homeY) < 1,
    ),
  );
  assert.ok(createSmoke(1600, true).puffs.length < s.puffs.length);
});
test("self-made smoke texture is deterministic, detailed and transparent at its edges", () => {
  const a = smokeTexture(64),
    b = smokeTexture(64);
  assert.deepEqual(a, b);
  assert.equal(a[3], 0);
  assert.equal(a[(63 * 64 + 63) * 4 + 3], 0);
  const alphas = Array.from(a).filter((_, i) => i % 4 === 3);
  assert.ok(new Set(alphas).size > 80);
  assert.ok(Math.max(...alphas) > 100);
});

test("a late frame preserves arrival and wind decay in wall time without unstable motion", () => {
  const s = createSmoke(700);
  blowSmoke(s, { x: 550, y: 343 }, { x: 550, y: 343 }, 1.5);
  stepSmoke(s, 6);
  assert.equal(smokeArrival(s.time), 1);
  assert.ok(smokeAt(s, { x: 550, y: 343 })[2] < 0.02);
  assert.ok(
    s.puffs.every(
      (p) =>
        Number.isFinite(p.x) && Math.hypot(p.x - p.homeX, p.y - p.homeY) < 10,
    ),
  );
});
