import assert from "node:assert/strict";
import test from "node:test";
import { getTerminalWidth, truncateTerminalText } from "../src/ui/terminalText.js";

test("truncateTerminalText keeps wide Chinese text within the requested terminal width", () => {
  const value = truncateTerminalText("政治的，政治上的，政党的，从事政治的", 16);

  assert.equal(value.endsWith("..."), true);
  assert.equal(getTerminalWidth(value) <= 16, true);
});

test("truncateTerminalText turns embedded line breaks into spaces", () => {
  const value = truncateTerminalText("line one\nline two", 40);

  assert.equal(value, "line one line two");
});
