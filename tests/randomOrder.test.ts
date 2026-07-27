import assert from "node:assert/strict";
import test from "node:test";
import { createRandomOrder } from "../src/services/randomOrder.js";

test("random order contains every word index exactly once", () => {
  const order = createRandomOrder(30);

  assert.equal(order.length, 30);
  assert.deepEqual([...order].sort((left, right) => left - right), Array.from({ length: 30 }, (_, index) => index));
});

test("random order supports an empty vocabulary", () => {
  assert.deepEqual(createRandomOrder(0), []);
});
