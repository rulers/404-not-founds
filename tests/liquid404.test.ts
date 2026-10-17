import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createLiquid,
  liquidPath,
  stepLiquid,
  pulseLiquid,
  grabLiquid,
  flingLiquid,
  type LiquidInput,
} from "../lib/liquid404.ts";
const idle: LiquidInput = {
  x: -1000,
  y: -1000,
  active: false,
  dragging: false,
  anchorX: 0,
  anchorY: 0,
};
test("liquid 404 retains separate zero contours and stays still with reduced motion", () => {
  const loops = createLiquid(),
    before = liquidPath(loops);
  assert.equal(loops.length, 4);
  const winding = (points: (typeof loops)[number]) =>
    points.reduce((sum, p, i) => {
      const next = points[(i + 1) % points.length];
      return sum + p.x * next.y - next.x * p.y;
    }, 0);
  assert.ok(
    winding(loops[0]) > 0 && winding(loops[1]) > 0 && winding(loops[2]) < 0,
  );
  assert.ok(loops[1].length > 20 && loops[2].length > 20);
  assert.ok(
    Math.max(...loops[1].map((p) => p.x)) >
      Math.max(...loops[2].map((p) => p.x)),
  );
  assert.equal(stepLiquid(loops, idle, 1 / 60, 10, true), 0);
  assert.equal(liquidPath(loops), before);
});
test("drag deforms locally with inertia and converges after release", () => {
  const loops = createLiquid(),
    point = loops[0].find((p) => p.restX === 250 && p.restY < 120)!;
  const input = {
    ...idle,
    active: true,
    dragging: true,
    x: point.restX + 100,
    y: point.restY + 50,
    anchorX: point.restX,
    anchorY: point.restY,
  };
  stepLiquid(loops, input, 1 / 60, 0, true);
  assert.ok(point.x > point.restX && point.x < point.restX + 100);
  for (let i = 0; i < 120; i++) stepLiquid(loops, input, 1 / 60, 0, true);
  assert.ok(point.x > point.restX + 85);
  const far = loops[3][0];
  assert.ok(Math.abs(far.x - far.restX) < 1);
  for (let i = 0; i < 600; i++) stepLiquid(loops, idle, 1 / 60, 0, true);
  for (const loop of loops)
    for (const p of loop) {
      assert.ok(Math.abs(p.x - p.restX) < 0.01);
      assert.ok(Math.abs(p.y - p.restY) < 0.01);
    }
});
test("hover and keyboard pulse move the surface without unbounded jumps", () => {
  const loops = createLiquid();
  const input = { ...idle, active: true, x: 250, y: 200 };
  stepLiquid(loops, input, 1 / 30, 0, true);
  assert.notEqual(liquidPath(loops), liquidPath(createLiquid()));
  pulseLiquid(loops);
  for (let i = 0; i < 240; i++)
    stepLiquid(loops, idle, i === 0 ? 10 : 1 / 60, 0, true);
  for (const loop of loops)
    for (const p of loop) {
      assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y));
      assert.ok(Math.hypot(p.x - p.restX, p.y - p.restY) < 1);
    }
});

test("a grabbed digit stretches past the old cap, excludes other digits, and carries release momentum", () => {
  const loops = createLiquid();
  grabLiquid(loops, 270, 240);
  const input = {
    ...idle,
    active: true,
    dragging: true,
    anchorX: 270,
    anchorY: 240,
    x: 570,
    y: 440,
  };
  for (let i = 0; i < 180; i++) stepLiquid(loops, input, 1 / 60, 0, true);
  assert.ok(Math.max(...loops[0].map((p) => p.x - p.restX)) > 250);
  for (const loop of loops.slice(1))
    for (const p of loop) assert.equal(p.x, p.restX);
  const held = loops[0].find((p) => (p.grip ?? 0) > 0.9)!;
  const vx = held.vx;
  flingLiquid(loops, 800, 200);
  assert.ok(held.vx > vx + 300);
  for (let i = 0; i < 720; i++) stepLiquid(loops, idle, 1 / 60, 0, true);
  for (const loop of loops)
    for (const p of loop)
      assert.ok(Math.hypot(p.x - p.restX, p.y - p.restY) < 0.01);
});
