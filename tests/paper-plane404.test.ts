import test from "node:test";
import assert from "node:assert/strict";
import {
  aimFromDrag,
  createFlight,
  flightLayout,
  sampleFlight,
} from "../lib/paper-plane404.ts";

test("drag is direct, capped, and rejects accidental taps", () => {
  assert.equal(aimFromDrag(3, 4, 100).valid, false);
  assert.equal(aimFromDrag(60, 0, 100).angle, 0);
  assert.equal(aimFromDrag(0, 60, 100).angle, Math.PI / 2);
  assert.equal(aimFromDrag(-60, 0, 100).angle, Math.PI);
  assert.equal(aimFromDrag(300, 400, 100).power, 1);
  assert.ok(aimFromDrag(60, 0, 100).power > aimFromDrag(20, 0, 100).power);
});

test("all directions stay within the safe sky, face their tangent and return to the exact departure point", () => {
  for (const [w, h] of [
    [1280, 800],
    [390, 844],
    [320, 740],
    [844, 390],
  ]) {
    const { bounds, home } = flightLayout(w, h);
    for (let i = 0; i < 24; i++) {
      const angle = -Math.PI + (i * Math.PI) / 12;
      for (const power of [0.12, 0.5, 1]) {
        const plan = createFlight(w, h, angle, power);
        const start = sampleFlight(plan, 0);
        assert.ok(Math.cos(start.angle - angle) > 0.99999);
        for (let j = 1; j < 100; j++) {
          const time = (j / 100) * plan.duration;
          const p = sampleFlight(plan, time),
            before = sampleFlight(plan, time - 0.1),
            after = sampleFlight(plan, time + 0.1);
          assert.ok(
            p.x + home.x >= bounds.left - 0.01 &&
              p.x + home.x <= bounds.right + 0.01,
          );
          assert.ok(
            p.y + home.y >= bounds.top - 0.01 &&
              p.y + home.y <= bounds.bottom + 0.01,
          );
          const heading = Math.atan2(after.y - before.y, after.x - before.x);
          assert.ok(
            Math.cos(heading - p.angle) > 0.999,
            "nose follows direction of travel",
          );
          assert.ok(p.scale >= 0.58 && p.scale <= 1);
        }
        const end = sampleFlight(plan, plan.duration + 200);
        assert.equal(end.x, 0);
        assert.equal(end.y, 0);
        assert.equal(end.done, true);
      }
    }
  }
});

test("strength changes the actual path even in constrained mobile space; direction changes the turn", () => {
  for (const [w, h] of [
    [320, 740],
    [390, 844],
    [1280, 800],
  ]) {
    const weak = createFlight(w, h, -0.6, 0.2),
      strong = createFlight(w, h, -0.6, 1),
      other = createFlight(w, h, -2.2, 1);
    const extent = (p: typeof weak) =>
      Math.max(...p.curves.flat().map((v) => Math.hypot(v.x, v.y)));
    assert.ok(extent(strong) > extent(weak) * 2);
    assert.notDeepEqual(strong.curves, other.curves);
    assert.ok(strong.duration > weak.duration);
  }
});
