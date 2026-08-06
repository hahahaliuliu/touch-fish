import assert from "node:assert/strict";
import test from "node:test";
import { createTouchFishProgram } from "../src/cli.js";

type HandlerName = "word" | "word-settings" | "word-favorites" | "read" | "read-settings";

function createProgramWithCalls() {
  const calls: HandlerName[] = [];
  const program = createTouchFishProgram({
    startWord: () => {
      calls.push("word");
    },
    startWordSettings: () => {
      calls.push("word-settings");
    },
    startWordFavorites: () => {
      calls.push("word-favorites");
    },
    startRead: () => {
      calls.push("read");
    },
    startReadSettings: () => {
      calls.push("read-settings");
    },
  });

  program.exitOverride();
  return { program, calls };
}

test("top-level help focuses on Word and Read", () => {
  const { program } = createProgramWithCalls();
  const help = program.helpInformation();

  assert.match(help, /word \[options\]\s+Learn words/);
  assert.match(help, /read \[options\]\s+Read novels/);
  assert.doesNotMatch(help, /^\s+setting\s/m);
  assert.doesNotMatch(help, /^\s+favorite\s/m);
});

test("Word command routes its default and module options", async () => {
  const defaultRun = createProgramWithCalls();
  await defaultRun.program.parseAsync(["node", "touchfish", "word"]);
  assert.deepEqual(defaultRun.calls, ["word"]);

  const settingsRun = createProgramWithCalls();
  await settingsRun.program.parseAsync(["node", "touchfish", "word", "-s"]);
  assert.deepEqual(settingsRun.calls, ["word-settings"]);

  const favoritesRun = createProgramWithCalls();
  await favoritesRun.program.parseAsync(["node", "touchfish", "word", "-f"]);
  assert.deepEqual(favoritesRun.calls, ["word-favorites"]);
});

test("Read command routes its default and settings option", async () => {
  const defaultRun = createProgramWithCalls();
  await defaultRun.program.parseAsync(["node", "touchfish", "read"]);
  assert.deepEqual(defaultRun.calls, ["read"]);

  const settingsRun = createProgramWithCalls();
  await settingsRun.program.parseAsync(["node", "touchfish", "read", "-s"]);
  assert.deepEqual(settingsRun.calls, ["read-settings"]);
});

test("legacy v0.2 commands remain available as hidden aliases", async () => {
  const settingsRun = createProgramWithCalls();
  await settingsRun.program.parseAsync(["node", "touchfish", "setting"]);
  assert.deepEqual(settingsRun.calls, ["word-settings"]);

  const favoritesRun = createProgramWithCalls();
  await favoritesRun.program.parseAsync(["node", "touchfish", "favorite"]);
  assert.deepEqual(favoritesRun.calls, ["word-favorites"]);
});
