import test from "node:test";
import assert from "node:assert/strict";
import {
  createRipples,
  dragWind,
  leafBounds,
  surfaceAt,
  updateRipples,
} from "../lib/ripples404.ts";

function advance(
  state: ReturnType<typeof createRipples>,
  seconds: number,
  wind: { x: number; y: number } | null,
  width = 390,
  height = 844,
  fps = 60,
) {
  for (let i = 0; i < seconds * fps; i++)
    updateRipples(state, 1 / fps, wind, width, height);
}
test("deliberate slow drags respond, direction is direct, and force is capped", () => {
  const weak = dragWind(12, 0, 1000, 390);
  const strong = dragWind(120, 0, 100, 390);
  assert.ok(weak.x > 0.06 && weak.x < strong.x);
  assert.equal(weak.y, 0);
  const diagonal = dragWind(-10000, 10000, 10, 390);
  assert.ok(diagonal.x < 0 && diagonal.y > 0);
  assert.ok(Math.abs(Math.hypot(diagonal.x, diagonal.y) - 1) < 1e-10);
  assert.deepEqual(dragWind(0, 0, 10, 390), { x: 0, y: 0 });
});
test("ten minutes at every edge stays bounded and reverse wind frees the same leaf", () => {
  for (const [w, h] of [
    [390, 844],
    [1280, 800],
    [320, 740],
    [844, 390],
  ]) {
    for (const direction of [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 },
    ]) {
      const state = createRipples(),
        sameLeaf = state.leaf;
      const b = leafBounds(w, h);
      advance(state, 600, direction, w, h);
      const before = { ...state.leaf };
      assert.ok(before.x >= b.left && before.x <= b.right);
      assert.ok(before.y >= b.top && before.y <= b.bottom);
      // Another ten seconds must not cause edge oscillation or a wrap.
      advance(state, 10, direction, w, h);
      assert.ok(
        Math.hypot(state.leaf.x - before.x, state.leaf.y - before.y) < 0.02,
      );
      advance(state, 4, { x: -direction.x, y: -direction.y }, w, h);
      assert.equal(state.leaf, sameLeaf);
      const projection =
        (state.leaf.x - before.x) * direction.x +
        (state.leaf.y - before.y) * direction.y;
      assert.ok(
        projection < -0.025,
        `${w}x${h}: reverse wind must release the leaf`,
      );
    }
  }
});
test("release decays over six seconds, preserves inertia, and leaves a natural breeze", () => {
  const state = createRipples();
  advance(state, 2, { x: 1, y: 0 });
  const before = state.leaf.x;
  advance(state, 0.5, null);
  assert.ok(state.leaf.x > before);
  assert.ok(state.user.x > 0.6);
  advance(state, 5.5, null);
  assert.ok(state.user.x < 0.02);
  advance(state, 10, null);
  assert.ok(Math.hypot(state.wind.x, state.wind.y) > 0.005);
  assert.ok(Math.hypot(state.leaf.vx, state.leaf.vy) > 0.0001);
});
test("wind strength drives surface and leaf together, independent of 30/60fps", () => {
  const weak = createRipples(),
    strong = createRipples(),
    thirty = createRipples();
  advance(weak, 3, { x: -0.12, y: 0 });
  advance(strong, 3, { x: -1, y: 0 });
  advance(thirty, 3, { x: -1, y: 0 }, 390, 844, 30);
  assert.ok(strong.leaf.x < weak.leaf.x);
  assert.ok(strong.phase > weak.phase);
  assert.ok(Math.abs(strong.leaf.x - thirty.leaf.x) < 0.003);
  let weakPeak = 0,
    strongPeak = 0;
  for (let i = 0; i < 100; i++) {
    weakPeak = Math.max(
      weakPeak,
      Math.abs(surfaceAt(weak, i / 100, 0.47).height),
    );
    strongPeak = Math.max(
      strongPeak,
      Math.abs(surfaceAt(strong, i / 100, 0.47).height),
    );
  }
  assert.ok(strongPeak > weakPeak * 2);
});
test("reduced motion freezes spatial state while wind remains controllable", () => {
  const state = createRipples();
  const leaf = { ...state.leaf };
  for (let i = 0; i < 300; i++)
    updateRipples(state, 1 / 60, { x: -1, y: 0 }, 390, 844, true);
  assert.deepEqual(state.leaf, leaf);
  assert.equal(state.phase, 0);
  assert.ok(state.wind.x < -0.9);
  assert.deepEqual(surfaceAt(state, 0.5, 0.5, true), { height: 0, tilt: 0 });
});
