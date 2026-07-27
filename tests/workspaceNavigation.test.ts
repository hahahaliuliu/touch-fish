import assert from "node:assert/strict";
import test from "node:test";
import {
  getNextPageIndex,
  getPreviousPageIndex,
} from "../src/services/workspaceNavigation.js";

const firstPage = {
  currentIndex: 0,
  workspaceSize: 5,
  rangeStart: 0,
  rangeEnd: 20,
  navigationLoop: false,
};

test("page navigation stops at group boundaries when looping is off", () => {
  assert.equal(getPreviousPageIndex(firstPage), 0);
  assert.equal(getNextPageIndex({ ...firstPage, currentIndex: 15 }), 15);
});

test("page navigation loops within the current group when enabled", () => {
  assert.equal(getPreviousPageIndex({ ...firstPage, navigationLoop: true }), 15);
  assert.equal(getNextPageIndex({ ...firstPage, currentIndex: 15, navigationLoop: true }), 0);
});

test("looping returns to the start of the final partial page", () => {
  assert.equal(
    getPreviousPageIndex({
      currentIndex: 20,
      workspaceSize: 5,
      rangeStart: 20,
      rangeEnd: 33,
      navigationLoop: true,
    }),
    30
  );
});
