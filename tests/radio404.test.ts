import { test } from "node:test";
import assert from "node:assert/strict";
import { dragFrequency, tuneRadio, type RadioState } from "../lib/radio404.ts";
const initial: RadioState = {
  frequency: 398.2,
  phase: "search",
  enteredAt: null,
};
test("slow tuning preserves precision, fast tuning scans and bounds never wrap", () => {
  assert.ok(
    dragFrequency(400, 10, 500) - 400 < dragFrequency(400, 10, 10) - 400,
  );
  assert.equal(dragFrequency(420, 100, 10), 420);
  assert.equal(dragFrequency(388, -100, 10), 388);
});
test("a released dial receives after dwell, loses signal and must leave to replay", () => {
  let state = tuneRadio(initial, 404, 100);
  assert.equal(state.phase, "near");
  state = tuneRadio(state, 404, 700);
  assert.equal(state.phase, "receiving");
  state = tuneRadio(state, 404, 2500);
  assert.equal(state.phase, "lost");
  state = tuneRadio(state, 404, 10000);
  assert.equal(state.phase, "lost");
  state = tuneRadio(state, 405, 10100);
  assert.equal(state.enteredAt, null);
  state = tuneRadio(state, 404, 10200);
  assert.equal(state.phase, "near");
  state = tuneRadio(state, 404, 10800);
  assert.equal(state.phase, "receiving");
});
test("hysteresis tolerates hand jitter but crossing release band resets listening", () => {
  let state = tuneRadio(initial, 404.3, 0);
  state = tuneRadio(state, 404.6, 600);
  assert.equal(state.phase, "receiving");
  state = tuneRadio(state, 404.7, 700);
  assert.equal(state.phase, "near");
  assert.equal(state.enteredAt, null);
  state = tuneRadio(state, 404.5, 800);
  assert.equal(state.enteredAt, null);
  state = tuneRadio(state, 403.8, 900);
  assert.equal(state.enteredAt, 900);
});
