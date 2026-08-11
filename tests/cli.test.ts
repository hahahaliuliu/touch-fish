import assert from "node:assert/strict";
import test from "node:test";
import { createTouchFishProgram } from "../src/cli.js";

type HandlerName = "word" | "word-settings" | "word-favorites" | "read" | "read-settings" | "read-mini" | "read-mini-child";

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
    startReadMini: () => {
      calls.push("read-mini");
    },
    startReadMiniChild: () => {
      calls.push("read-mini-child");
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

test("Read command routes its default, settings, and mini-window options", async () => {
  const defaultRun = createProgramWithCalls();
  await defaultRun.program.parseAsync(["node", "touchfish", "read"]);
  assert.deepEqual(defaultRun.calls, ["read"]);

  const settingsRun = createProgramWithCalls();
  await settingsRun.program.parseAsync(["node", "touchfish", "read", "-s"]);
  assert.deepEqual(settingsRun.calls, ["read-settings"]);

  const miniRun = createProgramWithCalls();
  await miniRun.program.parseAsync(["node", "touchfish", "read", "-m"]);
  assert.deepEqual(miniRun.calls, ["read-mini"]);

  const childRun = createProgramWithCalls();
  await childRun.program.parseAsync([
    "node", "touchfish", "read", "--mini-child", "--mini-port", "4310",
    "--mini-token", "token", "--mini-book", "alpha",
  ]);
  assert.deepEqual(childRun.calls, ["read-mini-child"]);
});

test("legacy v0.2 commands remain available as hidden aliases", async () => {
  const settingsRun = createProgramWithCalls();
  await settingsRun.program.parseAsync(["node", "touchfish", "setting"]);
  assert.deepEqual(settingsRun.calls, ["word-settings"]);

  const favoritesRun = createProgramWithCalls();
  await favoritesRun.program.parseAsync(["node", "touchfish", "favorite"]);
  assert.deepEqual(favoritesRun.calls, ["word-favorites"]);
});
