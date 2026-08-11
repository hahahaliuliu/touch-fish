import assert from "node:assert/strict";
import test from "node:test";
import { createTouchFishProgram } from "../src/cli.js";

type HandlerName = "global-settings" | "word" | "word-settings" | "word-favorites" | "read" | "read-settings" | "read-mini" | "read-mini-child";

function createProgramWithCalls() {
  const calls: HandlerName[] = [];
  const program = createTouchFishProgram({
    startGlobalSettings: () => {
      calls.push("global-settings");
    },
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

test("top-level help shows global settings, Word, and Read", () => {
  const { program } = createProgramWithCalls();
  const help = program.helpInformation();

  assert.match(help, /setting\s+打开 Touch Fish 全局设置/);
  assert.match(help, /word \[options\]\s+开始背单词/);
  assert.match(help, /read \[options\]\s+继续阅读小说/);
  assert.doesNotMatch(help, /^\s+favorite\s/m);
});

test("CLI version follows the package version", () => {
  const { program } = createProgramWithCalls();
  assert.equal(program.version(), "0.4.0");
});

test("global settings command has its own route", async () => {
  const globalSettingsRun = createProgramWithCalls();
  await globalSettingsRun.program.parseAsync(["node", "touchfish", "setting"]);
  assert.deepEqual(globalSettingsRun.calls, ["global-settings"]);
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

test("legacy favorite command remains available as a hidden alias", async () => {
  const favoritesRun = createProgramWithCalls();
  await favoritesRun.program.parseAsync(["node", "touchfish", "favorite"]);
  assert.deepEqual(favoritesRun.calls, ["word-favorites"]);
});
