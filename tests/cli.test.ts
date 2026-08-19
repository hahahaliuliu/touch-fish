import assert from "node:assert/strict";
import test from "node:test";
import { createTouchFishProgram, getTouchFishOverview } from "../src/cli.js";

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

test("top-level output shows the version and all public commands", () => {
  const help = getTouchFishOverview();

  assert.match(help, /Touch Fish v0\.4\.0/);
  assert.match(help, /touchfish word\s+开始背单词/);
  assert.match(help, /touchfish word -s\s+打开 Word 设置/);
  assert.match(help, /touchfish word -f\s+查看收藏词汇/);
  assert.match(help, /touchfish read\s+继续阅读小说/);
  assert.match(help, /touchfish read -s\s+打开 Read 设置/);
  assert.match(help, /touchfish read -m\s+打开小窗口阅读/);
  assert.doesNotMatch(help, /Usage:|Commands:|\[options\]/);
});

test("top-level help and version options are not registered", () => {
  const { program } = createProgramWithCalls();
  const optionFlags = program.options.map((option) => option.flags).join(" ");
  const commandNames = program.commands.map((command) => command.name());

  assert.doesNotMatch(optionFlags, /--help|--version/);
  assert.doesNotMatch(commandNames.join(" "), /\bhelp\b/);
});

test("removed top-level aliases are not registered", () => {
  const { program } = createProgramWithCalls();
  const commandNames = program.commands.map((command) => command.name());

  assert.doesNotMatch(commandNames.join(" "), /\bsetting\b/);
  assert.doesNotMatch(commandNames.join(" "), /\bfavorite\b/);
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
