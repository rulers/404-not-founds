import assert from "node:assert/strict";
import test from "node:test";
import {
  initialVend,
  products,
  vendTransition,
} from "../lib/vending-machine404.ts";

test("all four purchases require arrival and collection; only the can reveals without opening", () => {
  assert.equal(products.length, 4);
  for (const product of products) {
    let state = vendTransition(initialVend, { type: "select", id: product.id });
    const other = products.find((p) => p.id !== product.id)!;
    assert.equal(
      vendTransition(state, { type: "select", id: other.id }),
      state,
    );
    assert.equal(vendTransition(state, { type: "collect" }), state);
    assert.equal(vendTransition(state, { type: "open" }), state);
    state = vendTransition(state, { type: "advance" });
    state = vendTransition(state, { type: "advance" });
    assert.equal(state.phase, "ready");
    assert.equal(
      vendTransition(state, { type: "advance" }),
      state,
      "arrival waits for the user",
    );
    state = vendTransition(state, { type: "collect" });
    assert.equal(vendTransition(state, { type: "collect" }), state);
    state = vendTransition(state, { type: "advance" });
    assert.equal(state.phase, product.id === "B2" ? "reveal" : "inspect");
    if (product.id !== "B2") {
      assert.equal(
        vendTransition(state, { type: "advance" }),
        state,
        "opening waits for the user",
      );
      state = vendTransition(state, { type: "open" });
    }
    state = vendTransition(state, { type: "advance" });
    assert.equal(state.phase, "result");
    assert.equal(state.product, product.id);
    assert.equal(
      vendTransition(state, { type: "advance" }),
      state,
      "result does not disappear by itself",
    );
    assert.deepEqual(vendTransition(state, { type: "reset" }), initialVend);
  }
});

test("cancelling clears the purchase and late advance events cannot revive it", () => {
  for (const phase of [
    "coil",
    "drop",
    "ready",
    "collect",
    "inspect",
    "reveal",
    "result",
  ] as const) {
    const state = vendTransition({ phase, product: "A1" }, { type: "reset" });
    assert.equal(state.product, null);
    assert.equal(vendTransition(state, { type: "advance" }), initialVend);
    assert.equal(vendTransition(state, { type: "open" }), initialVend);
    assert.equal(vendTransition(state, { type: "collect" }), initialVend);
    assert.equal(
      vendTransition(state, { type: "select", id: "B2" }).product,
      "B2",
    );
  }
});
