import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("Read pages through text, jumps chapters, and saves progress", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "touchfish-read-session-"));
  const readingDirectory = path.join(root, "reading");
  const progressDirectory = path.join(root, "read-progress");
  const vocabularyDirectory = path.join(root, "vocabulary");
  const bookId = "session-novel";
  const chapterTwoOffset = [..."《第一章》\n第一章第一段\n第一章第二段\n第一章第三段\n第一章第四段\n第一章第五段\n第一章第六段\n第一章第七段\n第一章第八段\n第一章第九段\n第一章第十段\n"].length;

  fs.mkdirSync(readingDirectory, { recursive: true });
  fs.mkdirSync(vocabularyDirectory, { recursive: true });
  fs.writeFileSync(
    path.join(readingDirectory, `${bookId}.txt`),
    [
      "《第一章》",
      "第一章第一段",
      "第一章第二段",
      "第一章第三段",
      "第一章第四段",
      "第一章第五段",
      "第一章第六段",
      "第一章第七段",
      "第一章第八段",
      "第一章第九段",
      "第一章第十段",
      "《第二章》",
      "第二章正文",
    ].join("\n"),
    "utf-8"
  );

  try {
    const result = await runReadSession(root, ["d", " ", "s", "q"]);

    assert.equal(result.code, 0, result.output);
    assert.match(result.output, /cache\/read\/000\.ts \/\/ 《第一章》/);
    assert.match(result.output, /page 3 \/ 3 \| chapter 2 \/ 2: 《第二章》/);
    assert.match(result.output, /read progress saved/);

    const progress = JSON.parse(
      fs.readFileSync(path.join(progressDirectory, `${bookId}.json`), "utf-8")
    ) as { characterOffset: number };
    assert.equal(progress.characterOffset, chapterTwoOffset);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("Read starts every disguise theme and exits safely", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "touchfish-read-theme-"));
  const readingDirectory = path.join(root, "reading");
  const vocabularyDirectory = path.join(root, "vocabulary");

  fs.mkdirSync(readingDirectory, { recursive: true });
  fs.mkdirSync(vocabularyDirectory, { recursive: true });
  fs.writeFileSync(
    path.join(readingDirectory, "theme-novel.txt"),
    "《主题测试》\n第一段正文。\n第二段正文。",
    "utf-8"
  );

  const cases = [
    { theme: "build-log", quit: "\u0003", expected: "[INFO] read progress saved" },
    { theme: "backend-log", quit: "q", expected: "reader-api shutdown complete" },
    { theme: "git", quit: "\u001b", expected: "chore: save reading checkpoint" },
  ] as const;

  try {
    for (const scenario of cases) {
      fs.writeFileSync(
        path.join(root, "settings.json"),
        JSON.stringify({ theme: scenario.theme }),
        "utf-8"
      );

      const result = await runReadSession(root, [scenario.quit]);

      assert.equal(result.code, 0, result.output);
      assert.equal(result.output.includes(scenario.expected), true, result.output);
    }
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("Read help returns to reading when Esc is pressed", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "touchfish-read-help-"));
  const readingDirectory = path.join(root, "reading");
  const vocabularyDirectory = path.join(root, "vocabulary");

  fs.mkdirSync(readingDirectory, { recursive: true });
  fs.mkdirSync(vocabularyDirectory, { recursive: true });
  fs.writeFileSync(path.join(readingDirectory, "help-novel.txt"), "正文。", "utf-8");

  try {
    const result = await runReadSession(root, ["?", "\u001b", "q"]);

    assert.equal(result.code, 0, result.output);
    assert.equal(result.output.includes("Reading controls"), true, result.output);
    assert.equal(result.output.includes("cache entries by path ./src/read/"), true, result.output);
    assert.equal(result.output.includes("read progress saved"), true, result.output);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("Read opens settings with Ctrl+O and returns with Ctrl+O or Esc", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "touchfish-read-settings-return-"));
  const readingDirectory = path.join(root, "reading");
  const vocabularyDirectory = path.join(root, "vocabulary");

  fs.mkdirSync(readingDirectory, { recursive: true });
  fs.mkdirSync(vocabularyDirectory, { recursive: true });
  fs.writeFileSync(path.join(readingDirectory, "return-novel.txt"), "正文。", "utf-8");

  try {
    const ctrlOResult = await runReadSession(root, ["\u000f", "\u000f", "q"]);
    assert.equal(ctrlOResult.code, 0, ctrlOResult.output);
    assert.equal(ctrlOResult.output.includes("阅读设置"), true, ctrlOResult.output);
    assert.equal(ctrlOResult.output.includes("read progress saved"), true, ctrlOResult.output);

    const escResult = await runReadSession(root, ["\u000f", "\u001b", "q"]);
    assert.equal(escResult.code, 0, escResult.output);
    assert.equal(escResult.output.includes("阅读设置"), true, escResult.output);
    assert.equal(escResult.output.includes("read progress saved"), true, escResult.output);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("Read returns from settings with the newly selected novel", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "touchfish-read-switch-from-session-"));
  const readingDirectory = path.join(root, "reading");
  const vocabularyDirectory = path.join(root, "vocabulary");

  fs.mkdirSync(readingDirectory, { recursive: true });
  fs.mkdirSync(vocabularyDirectory, { recursive: true });
  fs.writeFileSync(path.join(readingDirectory, "alpha.txt"), "第一本。", "utf-8");
  fs.writeFileSync(path.join(readingDirectory, "bravo.txt"), "第二本。", "utf-8");

  try {
    const result = await runReadSession(root, ["\u000f", "\r", "d", "\r", "\u000f", "q"]);

    assert.equal(result.code, 0, result.output);
    assert.equal(result.output.includes("source loaded: bravo.txt"), true, result.output);
    const state = JSON.parse(fs.readFileSync(path.join(root, "read-progress", "state.json"), "utf-8")) as {
      activeBookId: string;
    };
    assert.equal(state.activeBookId, "bravo");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("Read settings select a novel and save the page layout", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "touchfish-read-settings-"));
  const readingDirectory = path.join(root, "reading");
  const vocabularyDirectory = path.join(root, "vocabulary");

  fs.mkdirSync(readingDirectory, { recursive: true });
  fs.mkdirSync(vocabularyDirectory, { recursive: true });
  fs.writeFileSync(path.join(readingDirectory, "alpha.txt"), "第一本。", "utf-8");
  fs.writeFileSync(path.join(readingDirectory, "bravo.txt"), "第二本。", "utf-8");

  try {
    const result = await runReadSession(root, ["\r", "d", "\r", "s", "\r", "d", "\r", "s", "\r", "d", "\r", "\u000f", "q"], ["read", "-s"]);

    assert.equal(result.code, 0, result.output);
    assert.equal(result.output.includes("阅读设置"), true, result.output);
    assert.equal(result.output.includes("source loaded: bravo.txt"), true, result.output);
    const state = JSON.parse(fs.readFileSync(path.join(root, "read-progress", "state.json"), "utf-8")) as { activeBookId: string };
    assert.equal(state.activeBookId, "bravo");
    const readSettings = JSON.parse(fs.readFileSync(path.join(root, "read-settings.json"), "utf-8")) as {
      contentWidth: number;
      pageLineCount: number;
    };
    assert.equal(readSettings.contentWidth, 30);
    assert.equal(readSettings.pageLineCount, 15);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("Read settings bind a custom next-page key", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "touchfish-read-key-binding-"));
  const readingDirectory = path.join(root, "reading");
  const vocabularyDirectory = path.join(root, "vocabulary");

  fs.mkdirSync(readingDirectory, { recursive: true });
  fs.mkdirSync(vocabularyDirectory, { recursive: true });
  fs.writeFileSync(
    path.join(readingDirectory, "binding-novel.txt"),
    Array.from({ length: 12 }, (_, index) => `第${index + 1}段正文。`).join("\n"),
    "utf-8"
  );

  try {
    const result = await runReadSession(root, ["s", "s", "s", "s", "\r", "f", "\u000f", "f", "q"], ["read", "-s"]);

    assert.equal(result.code, 0, result.output);
    assert.equal(result.output.includes("page 2 / 2"), true, result.output);
    const settings = JSON.parse(fs.readFileSync(path.join(root, "read-settings.json"), "utf-8")) as {
      keyBindings: { nextPage: [string, string] };
    };
    assert.deepEqual(settings.keyBindings.nextPage, ["f", "arrow-right"]);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("Read settings reject a custom page line count above 100", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "touchfish-read-line-limit-"));
  const readingDirectory = path.join(root, "reading");
  const vocabularyDirectory = path.join(root, "vocabulary");

  fs.mkdirSync(readingDirectory, { recursive: true });
  fs.mkdirSync(vocabularyDirectory, { recursive: true });
  fs.writeFileSync(path.join(readingDirectory, "limit.txt"), "正文。", "utf-8");

  try {
    const result = await runReadSession(root, ["s", "s", "\r", "d", "d", "101", "\r", "\u001b", "q"], ["read", "-s"]);

    assert.equal(result.code, 0, result.output);
    assert.equal(fs.existsSync(path.join(root, "read-settings.json")), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

async function runReadSession(root: string, inputs: string[], command = ["read"]) {
  const child = spawn(process.execPath, ["--import", "tsx", "src/index.ts", ...command], {
    cwd: projectRoot,
    env: { ...process.env, TOUCHFISH_ASSET_DIR: root },
    stdio: ["pipe", "pipe", "pipe"],
  }) as ChildProcessWithoutNullStreams;

  let output = "";
  let stdinError: Error | undefined;
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => { output += chunk; });
  child.stderr.on("data", (chunk) => { output += chunk; });
  child.stdin.on("error", (error) => { stdinError = error; });

  const exitPromise = new Promise<number | null>((resolve, reject) => {
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`Read session did not exit. Output:\n${output}`));
    }, 10000);
    child.once("error", reject);
    child.once("exit", (exitCode) => {
      clearTimeout(timer);
      resolve(exitCode);
    });
  });

  await waitUntil(() => output.length > 0 || child.exitCode !== null, 5000);

  for (const input of inputs) {
    child.stdin.write(input);
    await wait(20);
  }

  const code = await exitPromise;

  return {
    code,
    output: stdinError ? `${output}\nstdin error: ${stdinError.message}` : output,
  };
}

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function waitUntil(condition: () => boolean, timeoutMilliseconds: number) {
  const deadline = Date.now() + timeoutMilliseconds;

  while (!condition()) {
    if (Date.now() >= deadline) {
      throw new Error("Timed out waiting for Read session output");
    }

    await wait(10);
  }
}
