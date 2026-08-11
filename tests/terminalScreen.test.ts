import assert from "node:assert/strict";
import test from "node:test";
import { clearTerminalForExit } from "../src/ui/terminalScreen.js";

test("terminal exit clearing removes scrollback and the visible screen", () => {
  let output = "";
  let fallbackCalled = false;

  clearTerminalForExit(
    {
      isTTY: true,
      write(value) {
        output += value;
      },
    },
    () => { fallbackCalled = true; }
  );

  assert.equal(output, "\u001b[3J\u001b[2J\u001b[H");
  assert.equal(fallbackCalled, false);
});

test("terminal exit clearing falls back to console clearing outside a TTY", () => {
  let fallbackCalled = false;

  clearTerminalForExit(
    { isTTY: false, write() {} },
    () => { fallbackCalled = true; }
  );

  assert.equal(fallbackCalled, true);
});
