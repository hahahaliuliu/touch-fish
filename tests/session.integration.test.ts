import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import type { Settings } from "../src/models/settings.js";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

interface Fixture {
  root: string;
  settingsPath: string;
  progressPath: (bookId: string) => string;
  favoritesPath: string;
}

interface SessionResult {
  code: number | null;
  output: string;
}

test("Settings changes are applied after returning to Word", async () => {
  const fixture = createFixture({ workspaceSize: 3 });

  try {
    const result = await runSession(fixture, ["\u000f", "s", "\r", "d", "\r", "\u001b", "q"]);

    assert.equal(result.code, 0);
    assert.match(result.output, /alpha-5/);
    assert.equal(readSettings(fixture).workspaceSize, 5);
  } finally {
    removeFixture(fixture);
  }
});

test("switching vocabulary books keeps progress isolated", async () => {
  const fixture = createFixture({
    workspaceSize: 1,
    activeVocabularyBook: "alpha",
    progress: {
      alpha: { sequentialIndex: 2 },
      beta: { sequentialIndex: 1 },
    },
  });

  try {
    const result = await runSession(fixture, [
      "\u000f",
      ...Array.from({ length: 7 }, () => "s"),
      "\r",
      "d",
      "\r",
      "\u001b",
      "q",
    ]);

    assert.equal(result.code, 0);
    assert.match(result.output, /beta-2/);
    assert.equal(readSettings(fixture).activeVocabularyBook, "beta");
    assert.equal(readProgress(fixture, "alpha").sequentialIndex, 2);
    assert.equal(readProgress(fixture, "beta").sequentialIndex, 1);
  } finally {
    removeFixture(fixture);
  }
});

test("Esc returns from Settings, Q exits, and Ctrl+C exits Word", async () => {
  const fixture = createFixture();

  try {
    const returned = await runSession(fixture, ["\u000f", "\u001b", "q"]);
    assert.equal(returned.code, 0);
    assert.match(returned.output, /Touch Fish Settings/);
    assert.match(returned.output, /alpha-1/);

    const interrupted = await runSession(fixture, ["\u0003"]);
    assert.equal(interrupted.code, 0);
    assert.match(interrupted.output, /progress saved|workspace closed/i);
  } finally {
    removeFixture(fixture);
  }
});

test("custom next-page shortcut works in Word", async () => {
  const fixture = createFixture();

  try {
    const result = await runSession(fixture, [
      "\u000f",
      ...Array.from({ length: 12 }, () => "s"),
      "\r",
      "x",
      "\u001b",
      "x",
      "q",
    ]);

    assert.equal(result.code, 0);
    assert.match(result.output, /alpha-4/);
    assert.deepEqual(readSettings(fixture).keyBindings.next[0], "x");
  } finally {
    removeFixture(fixture);
  }
});

test("note selection keeps its arrow after save and ignores E/Q while editing", async () => {
  const fixture = createFixture({ workspaceSize: 1, noteMode: "editable" });

  try {
    const result = await runSession(fixture, ["e", "\r", "q", "e", "\r", "\u001b", "q"]);

    assert.equal(result.code, 0);
    assert.match(result.output, /\[NOTE\] alpha-1/);
    assert.match(result.output, /note: qe/);
    assert.match(result.output, /progress saved/);
  } finally {
    removeFixture(fixture);
  }
});

test("reverse study order starts from the last vocabulary word", async () => {
  const fixture = createFixture({ workspaceSize: 1, studyOrder: "reverse" });

  try {
    const result = await runSession(fixture, ["q"]);

    assert.equal(result.code, 0);
    assert.match(result.output, /alpha-5/);
  } finally {
    removeFixture(fixture);
  }
});

test("an empty vocabulary opens Settings instead of crashing", async () => {
  const fixture = createFixture({ empty: true });

  try {
    const result = await runSession(fixture, ["q"]);

    assert.equal(result.code, 0);
    assert.match(result.output, /no vocabulary book is installed; opening Settings/);
  } finally {
    removeFixture(fixture);
  }
});

test("a damaged progress file falls back to the beginning", async () => {
  const fixture = createFixture();
  fs.writeFileSync(fixture.progressPath("alpha"), "not valid json", "utf8");

  try {
    const result = await runSession(fixture, ["q"]);

    assert.equal(result.code, 0);
    assert.match(result.output, /alpha-1/);
  } finally {
    removeFixture(fixture);
  }
});

test("Word selection can favorite a word with E and F", async () => {
  const fixture = createFixture({ workspaceSize: 1 });

  try {
    const result = await runSession(fixture, ["e", "f", "e", "q"]);

    assert.equal(result.code, 0);
    assert.match(fs.readFileSync(fixture.favoritesPath, "utf8"), /alpha-1/);
  } finally {
    removeFixture(fixture);
  }
});

test("favorite preview keeps a canceled word until selection mode exits", async () => {
  const fixture = createFixture({ workspaceSize: 1, favorites: ["alpha-1"] });

  try {
    const result = await runSession(fixture, ["e", "f", "e", "q"], "favorite");

    assert.equal(result.code, 0);
    assert.match(result.output, /alpha-1/);
    assert.doesNotMatch(fs.readFileSync(fixture.favoritesPath, "utf8"), /alpha-1/);
  } finally {
    removeFixture(fixture);
  }
});

test("favorite preview supports the configured Tab display shortcut", async () => {
  const fixture = createFixture({ workspaceSize: 1, favorites: ["alpha-1"] });

  try {
    const result = await runSession(fixture, ["\t", "q"], "favorite");

    assert.equal(result.code, 0);
    assert.match(result.output, /alpha-1.*alpha meaning 1/s);
  } finally {
    removeFixture(fixture);
  }
});

test("Esc returns from favorite preview to Settings", async () => {
  const fixture = createFixture({ workspaceSize: 1, favorites: ["alpha-1"] });

  try {
    const result = await runSession(
      fixture,
      ["\u000f", ...Array.from({ length: 8 }, () => "s"), "\r", "\u001b", "q"],
    );

    assert.equal(result.code, 0);
    assert.match(result.output, /Touch Fish Settings/);
    assert.ok([...result.output.matchAll(/> View Favorites\s+\[open\]/g)].length >= 2);
  } finally {
    removeFixture(fixture);
  }
});

function createFixture(options: {
  workspaceSize?: number;
  noteMode?: Settings["noteMode"];
  studyOrder?: Settings["studyOrder"];
  activeVocabularyBook?: string;
  progress?: Record<string, { sequentialIndex: number }>;
  favorites?: string[];
  empty?: boolean;
} = {}): Fixture {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "touchfish-session-"));
  const vocabularyDirectory = path.join(root, "vocabulary");
  const progressDirectory = path.join(root, "progress");
  const notesDirectory = path.join(root, "notes");

  fs.mkdirSync(vocabularyDirectory, { recursive: true });
  fs.mkdirSync(progressDirectory, { recursive: true });
  fs.mkdirSync(notesDirectory, { recursive: true });

  const settings: Settings = {
    dailyWordCount: 20,
    workspaceSize: options.workspaceSize ?? 3,
    studyGroupEnabled: false,
    navigationLoop: false,
    studyOrder: options.studyOrder ?? "sequential",
    activeVocabularyBook: options.activeVocabularyBook ?? "alpha",
    displayMode: "english",
    noteMode: options.noteMode ?? "hidden",
    interfaceLanguage: "english",
    theme: "build-log",
    keyBindings: {
      previous: ["a", "arrow-left"],
      next: ["d", "arrow-right"],
      previousGroup: ["[", "arrow-up"],
      nextGroup: ["]", "arrow-down"],
      repeat: ["space", ""],
      switchDisplayMode: ["tab", ""],
      startQuiz: ["t", ""],
      editNote: ["e", ""],
      toggleHelp: ["?", ""],
      quit: ["q", ""],
    },
  };

  fs.writeFileSync(path.join(root, "settings.json"), `${JSON.stringify(settings, null, 2)}\n`, "utf8");

  if (!options.empty) {
    writeBook(vocabularyDirectory, "alpha", "alpha");
    writeBook(vocabularyDirectory, "beta", "beta");
  }

  Object.entries(options.progress ?? {}).forEach(([bookId, progress]) => {
    fs.writeFileSync(
      path.join(progressDirectory, `${encodeURIComponent(bookId)}.json`),
      JSON.stringify({ sequentialIndex: progress.sequentialIndex, randomIndex: 0, randomOrder: [] }),
      "utf8"
    );
  });

  if (options.favorites) {
    fs.writeFileSync(path.join(root, "favorites.json"), JSON.stringify({ version: 1, words: options.favorites }), "utf8");
  }

  return {
    root,
    settingsPath: path.join(root, "settings.json"),
    progressPath: (bookId) => path.join(progressDirectory, `${encodeURIComponent(bookId)}.json`),
    favoritesPath: path.join(root, "favorites.json"),
  };
}

function writeBook(directory: string, id: string, prefix: string) {
  fs.writeFileSync(
    path.join(directory, `${id}.json`),
    JSON.stringify({
      id,
      name: id,
      description: "Session test fixture",
      language: { source: "en", target: "zh-CN" },
      version: 1,
      words: Array.from({ length: 5 }, (_, index) => ({
        english: `${prefix}-${index + 1}`,
        chinese: `${prefix} meaning ${index + 1}`,
      })),
    }),
    "utf8"
  );
}

function readSettings(fixture: Fixture): Settings {
  return JSON.parse(fs.readFileSync(fixture.settingsPath, "utf8")) as Settings;
}

function readProgress(fixture: Fixture, bookId: string): { sequentialIndex: number } {
  return JSON.parse(fs.readFileSync(fixture.progressPath(bookId), "utf8")) as { sequentialIndex: number };
}

function removeFixture(fixture: Fixture) {
  fs.rmSync(fixture.root, { recursive: true, force: true });
}

async function runSession(fixture: Fixture, inputs: string[], command = "word"): Promise<SessionResult> {
  const child = spawn(process.execPath, ["--import", "tsx", "src/index.ts", command], {
    cwd: projectRoot,
    env: { ...process.env, TOUCHFISH_ASSET_DIR: fixture.root },
    stdio: ["pipe", "pipe", "pipe"],
  }) as ChildProcessWithoutNullStreams;

  let output = "";
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => { output += chunk; });
  child.stderr.on("data", (chunk) => { output += chunk; });

  const exitPromise = new Promise<number | null>((resolve, reject) => {
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`Session did not exit. Output:\n${output}`));
    }, 10000);
    child.once("error", reject);
    child.once("exit", (exitCode) => {
      clearTimeout(timer);
      resolve(exitCode);
    });
  });

  await wait(500);
  for (const input of inputs) {
    child.stdin.write(input);
    await wait(250);
  }

  const code = await exitPromise;

  return { code, output };
}

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
