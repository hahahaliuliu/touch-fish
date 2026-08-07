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

async function runReadSession(root: string, inputs: string[]) {
  const child = spawn(process.execPath, ["--import", "tsx", "src/index.ts", "read"], {
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

  child.stdin.write(inputs.join(""));

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
