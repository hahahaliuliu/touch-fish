import assert from "node:assert/strict";
import test from "node:test";
import { getTerminalWidth, truncateTerminalText, wrapTerminalText, wrapTerminalTextWithAnsi } from "../src/ui/terminalText.js";

test("truncateTerminalText keeps wide Chinese text within the requested terminal width", () => {
  const value = truncateTerminalText("政治的，政治上的，政党的，从事政治的", 16);

  assert.equal(value.endsWith("..."), true);
  assert.equal(getTerminalWidth(value) <= 16, true);
});

test("truncateTerminalText turns embedded line breaks into spaces", () => {
  const value = truncateTerminalText("line one\nline two", 40);

  assert.equal(value, "line one line two");
});

test("wrapTerminalText preserves long note text without ellipsis", () => {
  const lines = wrapTerminalText("note: calculate assess evaluate appreciate", 20);

  assert.deepEqual(lines, ["note: calculate asse", "ss evaluate apprecia", "te"]);
  assert.equal(lines.join(""), "note: calculate assess evaluate appreciate");
  assert.equal(lines.every((line) => getTerminalWidth(line) <= 20), true);
});

test("wrapTerminalTextWithAnsi keeps every visible segment within its column", () => {
  const lines = wrapTerminalTextWithAnsi("\u001b[7mbackend-log\u001b[0m", 5);
  const visibleLines = lines.map((line) => line.replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, ""));

  assert.deepEqual(visibleLines, ["backe", "nd-lo", "g"]);
  assert.equal(visibleLines.every((line) => getTerminalWidth(line) <= 5), true);
  assert.equal(lines.slice(1).every((line) => line.startsWith("\u001b[7m")), true);
});
