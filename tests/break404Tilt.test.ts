import { test } from "node:test";
import assert from "node:assert/strict";
import { tiltAngle, tiltTarget } from "../lib/break404Tilt.ts";

test("tilt axes and signs follow all screen orientations and reject missing data", () => {
  assert.equal(tiltAngle(12, 8, 0), 8);
  assert.equal(tiltAngle(12, 8, 90), -12);
  assert.equal(tiltAngle(12, 8, -90), 12);
  assert.equal(tiltAngle(12, 8, 180), -8);
  assert.equal(tiltAngle(null, 8, 90), null);
  assert.equal(tiltAngle(12, null, 0), null);
  assert.equal(tiltAngle(NaN, 8, 90), null);
  assert.equal(tiltAngle(12, null, 270), 12);
});

test("calibrated tilt has a dead zone, reaches both edges at 25 degrees and wraps", () => {
  assert.equal(tiltTarget(17, 17), 500);
  assert.equal(tiltTarget(18, 17), 500);
  assert.equal(tiltTarget(42, 17), 1000);
  assert.equal(tiltTarget(-8, 17), 0);
  assert.equal(tiltTarget(90, 17), 1000);
  assert.ok(tiltTarget(-178, 179) > 500);
});
