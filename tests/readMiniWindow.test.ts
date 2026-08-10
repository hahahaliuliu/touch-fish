import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  buildReadMiniTerminalArguments,
  createReadMiniTerminalFragment,
  writeReadMiniTerminalProfile,
} from "../src/services/readMiniWindow.js";
import { persistReadMiniWindowSize } from "../src/session/readMiniSession.js";
import { getReadMouseWheelDirection } from "../src/session/readSession.js";
import { getReadMiniPageLineCount } from "../src/ui/readMiniRenderer.js";
import type { ReadSettings } from "../src/models/reading.js";

test("Read mini-window profile uses a smaller font and closes with its command", () => {
  const fragment = createReadMiniTerminalFragment(9);
  const profile = fragment.profiles[0]!;

  assert.equal(profile.name, "Touch Fish Mini");
  assert.equal(profile.fontSize, 9);
  assert.equal(profile.closeOnExit, "always");
  assert.equal(profile.hidden, true);
});

test("Read mini-window launch uses a new sized window and the internal child command", () => {
  const args = buildReadMiniTerminalArguments({
    port: 4310,
    token: "secret-token",
    bookId: "alpha",
    columns: 72,
    rows: 26,
  });

  assert.deepEqual(args.slice(0, 4), ["--window", "new", "--size", "72,26"]);
  assert.equal(args.includes("Touch Fish Mini"), true);
  assert.equal(args.includes("--mini-child"), true);
  assert.equal(args.includes("4310"), true);
  assert.equal(args.includes("secret-token"), true);
  assert.equal(args.includes("alpha"), true);
});

test("Read mini-window profile is written as a separate Windows Terminal fragment", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "touchfish-mini-profile-"));

  try {
    const fragmentPath = writeReadMiniTerminalProfile(8, root);
    const value = JSON.parse(fs.readFileSync(fragmentPath, "utf8")) as ReturnType<typeof createReadMiniTerminalFragment>;

    assert.equal(fragmentPath.includes(path.join("Fragments", "TouchFish")), true);
    assert.deepEqual(value, createReadMiniTerminalFragment());
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("dragged mini-window dimensions replace the saved size", () => {
  const current: ReadSettings = {
    contentWidth: 0,
    pageLineCount: 10,
    chapterSectionCount: 0,
    miniWindowColumns: 64,
    miniWindowRows: 22,
    miniWindowFontSize: 8,
    miniWindowMouseMode: "page",
    interfaceLanguage: "english",
    theme: "build-log",
    keyBindings: {
      previousPage: ["a", "arrow-left"],
      nextPage: ["d", "arrow-right"],
      previousChapter: ["w", "arrow-up"],
      nextChapter: ["s", "arrow-down"],
      repeat: ["space", ""],
      toggleHelp: ["?", ""],
    },
  };
  let saved: ReadSettings | undefined;

  const changed = persistReadMiniWindowSize(
    73,
    27,
    () => current,
    (settings) => { saved = settings; }
  );

  assert.equal(changed, true);
  assert.equal(saved?.miniWindowColumns, 73);
  assert.equal(saved?.miniWindowRows, 27);
  assert.equal(saved?.miniWindowFontSize, 8);
});

test("Read mini-window recognizes wheel-up and wheel-down input", () => {
  assert.equal(getReadMouseWheelDirection("\u001b[<64;10;5M"), -1);
  assert.equal(getReadMouseWheelDirection("\u001b[<65;10;5M"), 1);
  assert.equal(getReadMouseWheelDirection("\u001b[<0;10;5M"), undefined);
});

test("Read mini-window fills the available terminal height", () => {
  const originalRows = process.stdout.rows;
  Object.defineProperty(process.stdout, "rows", { value: 18, configurable: true });

  try {
    assert.equal(getReadMiniPageLineCount(22), 17);
  } finally {
    Object.defineProperty(process.stdout, "rows", { value: originalRows, configurable: true });
  }
});
