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

test("Read mini-window profile uses a smaller font and closes with its command", () => {
  const fragment = createReadMiniTerminalFragment();
  const profile = fragment.profiles[0]!;

  assert.equal(profile.name, "Touch Fish Mini");
  assert.equal(profile.fontSize, 8);
  assert.equal(profile.closeOnExit, "always");
  assert.equal(profile.hidden, true);
});

test("Read mini-window launch uses a new sized window and the internal child command", () => {
  const args = buildReadMiniTerminalArguments({
    port: 4310,
    token: "secret-token",
    bookId: "alpha",
  });

  assert.deepEqual(args.slice(0, 4), ["--window", "new", "--size", "64,22"]);
  assert.equal(args.includes("Touch Fish Mini"), true);
  assert.equal(args.includes("--mini-child"), true);
  assert.equal(args.includes("4310"), true);
  assert.equal(args.includes("secret-token"), true);
  assert.equal(args.includes("alpha"), true);
});

test("Read mini-window profile is written as a separate Windows Terminal fragment", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "touchfish-mini-profile-"));

  try {
    const fragmentPath = writeReadMiniTerminalProfile(root);
    const value = JSON.parse(fs.readFileSync(fragmentPath, "utf8")) as ReturnType<typeof createReadMiniTerminalFragment>;

    assert.equal(fragmentPath.includes(path.join("Fragments", "TouchFish")), true);
    assert.deepEqual(value, createReadMiniTerminalFragment());
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
