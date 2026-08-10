import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import net from "node:net";
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
    assert.equal(result.output.includes("Current Reading Workspace"), true, result.output);
    assert.equal(result.output.includes("cache entries by path ./src/read/"), true, result.output);
    assert.equal(result.output.includes("read progress saved"), true, result.output);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("Read mini child renders plain text and Q closes only the child session", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "touchfish-read-mini-child-"));
  const readingDirectory = path.join(root, "reading");
  const vocabularyDirectory = path.join(root, "vocabulary");
  const token = "mini-test-token";
  let authenticated = false;
  const server = net.createServer((socket) => {
    socket.setEncoding("utf8");
    socket.on("data", (value) => {
      authenticated ||= value.includes(token);
    });
  });

  fs.mkdirSync(readingDirectory, { recursive: true });
  fs.mkdirSync(vocabularyDirectory, { recursive: true });
  fs.writeFileSync(path.join(readingDirectory, "mini.txt"), "《小窗口》\n正文内容。", "utf8");
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.equal(typeof address === "object" && address !== null, true);
  const port = typeof address === "object" && address ? address.port : 0;

  try {
    const result = await runReadSession(
      root,
      ["q"],
      [
        "read", "--mini-child", "--mini-port", String(port),
        "--mini-token", token, "--mini-book", "mini",
      ]
    );

    assert.equal(result.code, 0, result.output);
    assert.equal(result.output.includes("小窗口"), true, result.output);
    assert.equal(result.output.includes("cache/read/"), false, result.output);
    assert.equal(authenticated, true);
    assert.equal(server.listening, true);
  } finally {
    server.close();
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
    assert.equal(ctrlOResult.output.includes("Read Settings"), true, ctrlOResult.output);
    assert.equal(ctrlOResult.output.includes("read progress saved"), true, ctrlOResult.output);

    const escResult = await runReadSession(root, ["\u000f", "\u001b", "q"]);
    assert.equal(escResult.code, 0, escResult.output);
    assert.equal(escResult.output.includes("Read Settings"), true, escResult.output);
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
    const result = await runReadSession(root, ["\u000f", "s", "s", "s", "s", "\r", "d", "\r", "\u000f", "q"]);

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
    const result = await runReadSession(root, ["\r", "d", "\r", "s", "\r", "d", "\r", "s", "s", "s", "\r", "d", "\r", "\u000f", "q"], ["read", "-s"]);

    assert.equal(result.code, 0, result.output);
    assert.equal(result.output.includes("Read Settings"), true, result.output);
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

test("Read settings split chapters at paragraphs and W/S navigate sections", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "touchfish-read-sections-"));
  const readingDirectory = path.join(root, "reading");
  const vocabularyDirectory = path.join(root, "vocabulary");
  const content = "第一章 开始\n第一段正文。\n第二段正文。\n第三段正文。";
  const secondSectionOffset = [..."第一章 开始\n第一段正文。\n"].length;

  fs.mkdirSync(readingDirectory, { recursive: true });
  fs.mkdirSync(vocabularyDirectory, { recursive: true });
  fs.writeFileSync(path.join(readingDirectory, "sections.txt"), content, "utf-8");

  try {
    const result = await runReadSession(
      root,
      ["s", "s", "\r", "d", "d", "\r", "\u000f", "s", "?", "\u001b", "q"],
      ["read", "-s"]
    );

    assert.equal(result.code, 0, result.output);
    assert.equal(result.output.includes("section 2 / 3"), true, result.output);
    assert.equal(result.output.includes("第二段正文。"), true, result.output);
    assert.equal(result.output.includes("next section"), true, result.output);
    const settings = JSON.parse(fs.readFileSync(path.join(root, "read-settings.json"), "utf-8")) as {
      chapterSectionCount: number;
    };
    assert.equal(settings.chapterSectionCount, 3);
    const progress = JSON.parse(
      fs.readFileSync(path.join(root, "read-progress", "sections.json"), "utf-8")
    ) as { characterOffset: number };
    assert.equal(progress.characterOffset, secondSectionOffset);
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
    const result = await runReadSession(root, ["s", "s", "s", "s", "s", "s", "s", "s", "s", "s", "s", "s", "\r", "f", "\u000f", "f", "q"], ["read", "-s"]);

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

test("Read settings select and edit either key-binding slot", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "touchfish-read-binding-slot-"));
  const readingDirectory = path.join(root, "reading");
  const vocabularyDirectory = path.join(root, "vocabulary");

  fs.mkdirSync(readingDirectory, { recursive: true });
  fs.mkdirSync(vocabularyDirectory, { recursive: true });
  fs.writeFileSync(path.join(readingDirectory, "slot.txt"), "正文。", "utf-8");

  try {
    const result = await runReadSession(
      root,
      ["s", "s", "s", "s", "s", "s", "s", "s", "s", "s", "s", "s", "d", "\r", "f", "q"],
      ["read", "-s"]
    );

    assert.equal(result.code, 0, result.output);
    const settings = JSON.parse(fs.readFileSync(path.join(root, "read-settings.json"), "utf-8")) as {
      keyBindings: { nextPage: [string, string] };
    };
    assert.deepEqual(settings.keyBindings.nextPage, ["d", "f"]);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("Read settings move occupied bindings and clear slots with Backspace", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "touchfish-read-binding-management-"));
  const readingDirectory = path.join(root, "reading");
  const vocabularyDirectory = path.join(root, "vocabulary");

  fs.mkdirSync(readingDirectory, { recursive: true });
  fs.mkdirSync(vocabularyDirectory, { recursive: true });
  fs.writeFileSync(path.join(readingDirectory, "managed.txt"), "正文。", "utf-8");

  try {
    const moved = await runReadSession(
      root,
      ["s", "s", "s", "s", "s", "s", "s", "s", "s", "s", "s", "\r", "d", "q"],
      ["read", "-s"]
    );
    assert.equal(moved.code, 0, moved.output);

    let settings = JSON.parse(fs.readFileSync(path.join(root, "read-settings.json"), "utf-8")) as {
      keyBindings: { previousPage: [string, string]; nextPage: [string, string] };
    };
    assert.deepEqual(settings.keyBindings.previousPage, ["d", "arrow-left"]);
    assert.deepEqual(settings.keyBindings.nextPage, ["", "arrow-right"]);

    const cleared = await runReadSession(
      root,
      ["s", "s", "s", "s", "s", "s", "s", "s", "s", "s", "s", "d", "\r", "\u007f", "q"],
      ["read", "-s"]
    );
    assert.equal(cleared.code, 0, cleared.output);

    settings = JSON.parse(fs.readFileSync(path.join(root, "read-settings.json"), "utf-8")) as {
      keyBindings: { previousPage: [string, string]; nextPage: [string, string] };
    };
    assert.deepEqual(settings.keyBindings.previousPage, ["d", ""]);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("Read settings save their own interface language and disguise theme", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "touchfish-read-language-theme-"));
  const readingDirectory = path.join(root, "reading");
  const vocabularyDirectory = path.join(root, "vocabulary");

  fs.mkdirSync(readingDirectory, { recursive: true });
  fs.mkdirSync(vocabularyDirectory, { recursive: true });
  fs.writeFileSync(path.join(readingDirectory, "localized.txt"), "正文。", "utf-8");

  try {
    const result = await runReadSession(
      root,
      ["s", "s", "s", "\r", "d", "\r", "s", "s", "s", "\r", "d", "\r", "\u000f", "q"],
      ["read", "-s"]
    );

    assert.equal(result.code, 0, result.output);
    assert.equal(result.output.includes("[INFO] 阅读设置已就绪"), true, result.output);
    assert.equal(result.output.includes("reader-api shutdown complete"), true, result.output);
    const settings = JSON.parse(fs.readFileSync(path.join(root, "read-settings.json"), "utf-8")) as {
      interfaceLanguage: string;
      theme: string;
    };
    assert.equal(settings.interfaceLanguage, "chinese");
    assert.equal(settings.theme, "backend-log");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("Read settings save mini-window width, height, and font size", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "touchfish-read-mini-settings-"));
  const readingDirectory = path.join(root, "reading");
  const vocabularyDirectory = path.join(root, "vocabulary");

  fs.mkdirSync(readingDirectory, { recursive: true });
  fs.mkdirSync(vocabularyDirectory, { recursive: true });
  fs.writeFileSync(path.join(readingDirectory, "mini-settings.txt"), "正文。", "utf8");

  try {
    const result = await runReadSession(
      root,
      [
        ...Array.from({ length: 8 }, () => "s"),
        "\r", "d", "\r",
        "s", "\r", "d", "\r",
        "s", "\r", "d", "\r",
        "q",
      ],
      ["read", "-s"]
    );

    assert.equal(result.code, 0, result.output);
    const settings = JSON.parse(fs.readFileSync(path.join(root, "read-settings.json"), "utf8")) as {
      miniWindowColumns: number;
      miniWindowRows: number;
      miniWindowFontSize: number;
    };
    assert.equal(settings.miniWindowColumns, 80);
    assert.equal(settings.miniWindowRows, 30);
    assert.equal(settings.miniWindowFontSize, 10);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("Read settings import a UTF-8 TXT novel and make it active", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "touchfish-read-import-"));
  const readingDirectory = path.join(root, "reading");
  const vocabularyDirectory = path.join(root, "vocabulary");
  const sourcePath = path.join(root, "My Novel.txt");

  fs.mkdirSync(readingDirectory, { recursive: true });
  fs.mkdirSync(vocabularyDirectory, { recursive: true });
  fs.writeFileSync(path.join(readingDirectory, "existing.txt"), "已有小说。", "utf-8");
  fs.writeFileSync(sourcePath, "\uFEFF《导入章节》\r\n导入正文。", "utf-8");

  try {
    const result = await runReadSession(
      root,
      ["s", "s", "s", "s", "s", "\r", "s", "\r", `"${sourcePath}"`, "\r", "\u000f", "\u000f", "q"],
      ["read", "-s"]
    );

    assert.equal(result.code, 0, result.output);
    assert.equal(result.output.includes("[INFO] imported My Novel"), true, result.output);
    assert.equal(result.output.includes("source loaded: My Novel.txt"), true, result.output);
    assert.equal(fs.readFileSync(path.join(readingDirectory, "My Novel.txt"), "utf-8"), "《导入章节》\n导入正文。");
    const state = JSON.parse(fs.readFileSync(path.join(root, "read-progress", "state.json"), "utf-8")) as {
      activeBookId: string;
    };
    assert.equal(state.activeBookId, "My Novel");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("Read import keeps both novels when a file name conflicts", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "touchfish-read-import-conflict-"));
  const readingDirectory = path.join(root, "reading");
  const vocabularyDirectory = path.join(root, "vocabulary");
  const sourcePath = path.join(root, "duplicate.txt");

  fs.mkdirSync(readingDirectory, { recursive: true });
  fs.mkdirSync(vocabularyDirectory, { recursive: true });
  fs.writeFileSync(path.join(readingDirectory, "duplicate.txt"), "旧正文。", "utf-8");
  fs.writeFileSync(sourcePath, "新正文。", "utf-8");

  try {
    const result = await runReadSession(
      root,
      ["s", "s", "s", "s", "s", "\r", "s", "\r", sourcePath, "\r", "d", "\r", "\u000f", "\u000f", "q"],
      ["read", "-s"]
    );

    assert.equal(result.code, 0, result.output);
    assert.equal(result.output.includes("A novel with this name already exists"), true, result.output);
    assert.equal(fs.readFileSync(path.join(readingDirectory, "duplicate.txt"), "utf-8"), "旧正文。");
    assert.equal(fs.readFileSync(path.join(readingDirectory, "duplicate (2).txt"), "utf-8"), "新正文。");
    assert.equal(result.output.includes("source loaded: duplicate (2).txt"), true, result.output);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("Read import replaces a conflicting novel after confirmation", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "touchfish-read-import-replace-"));
  const readingDirectory = path.join(root, "reading");
  const vocabularyDirectory = path.join(root, "vocabulary");
  const sourcePath = path.join(root, "replace.txt");
  const destinationPath = path.join(readingDirectory, "replace.txt");

  fs.mkdirSync(readingDirectory, { recursive: true });
  fs.mkdirSync(vocabularyDirectory, { recursive: true });
  fs.writeFileSync(destinationPath, "旧正文。", "utf-8");
  fs.writeFileSync(sourcePath, "新正文。", "utf-8");

  try {
    const result = await runReadSession(
      root,
      ["s", "s", "s", "s", "s", "\r", "s", "\r", sourcePath, "\r", "\r", "\u000f", "\u000f", "q"],
      ["read", "-s"]
    );

    assert.equal(result.code, 0, result.output);
    assert.equal(fs.readFileSync(destinationPath, "utf-8"), "新正文。");
    assert.equal(fs.readdirSync(readingDirectory).some((name) => name.endsWith(".backup") || name.endsWith(".import")), false);
    assert.equal(result.output.includes("source loaded: replace.txt"), true, result.output);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("Read import rejects files that are not TXT", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "touchfish-read-import-extension-"));
  const readingDirectory = path.join(root, "reading");
  const vocabularyDirectory = path.join(root, "vocabulary");
  const sourcePath = path.join(root, "novel.md");

  fs.mkdirSync(readingDirectory, { recursive: true });
  fs.mkdirSync(vocabularyDirectory, { recursive: true });
  fs.writeFileSync(path.join(readingDirectory, "existing.txt"), "已有小说。", "utf-8");
  fs.writeFileSync(sourcePath, "正文。", "utf-8");

  try {
    const result = await runReadSession(
      root,
      ["s", "s", "s", "s", "s", "\r", "s", "\r", sourcePath, "\r", "\u0003"],
      ["read", "-s"]
    );

    assert.equal(result.code, 0, result.output);
    assert.equal(result.output.includes("supports UTF-8 TXT files only"), true, result.output);
    assert.equal(fs.existsSync(path.join(readingDirectory, "novel.md")), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("Read import rejects invalid UTF-8 files", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "touchfish-read-import-invalid-"));
  const readingDirectory = path.join(root, "reading");
  const vocabularyDirectory = path.join(root, "vocabulary");
  const invalidPath = path.join(root, "invalid.txt");

  fs.mkdirSync(readingDirectory, { recursive: true });
  fs.mkdirSync(vocabularyDirectory, { recursive: true });
  fs.writeFileSync(path.join(readingDirectory, "existing.txt"), "已有小说。", "utf-8");
  fs.writeFileSync(invalidPath, Buffer.from([0xff, 0xfe, 0xfd]));

  try {
    const result = await runReadSession(
      root,
      ["s", "s", "s", "s", "s", "\r", "s", "\r", invalidPath, "\r", "\u0003"],
      ["read", "-s"]
    );

    assert.equal(result.code, 0, result.output);
    assert.equal(result.output.includes("Unable to decode novel as UTF-8"), true, result.output);
    assert.equal(fs.existsSync(path.join(readingDirectory, "invalid.txt")), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("Read import manager lists novels and deletes the selected novel with its progress", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "touchfish-read-delete-"));
  const readingDirectory = path.join(root, "reading");
  const progressDirectory = path.join(root, "read-progress");
  const vocabularyDirectory = path.join(root, "vocabulary");
  const sampleId = "a-赤兔之死";
  const samplePath = path.join(readingDirectory, `${sampleId}.example.txt`);
  const progressPath = path.join(progressDirectory, `${encodeURIComponent(sampleId)}.json`);

  fs.mkdirSync(readingDirectory, { recursive: true });
  fs.mkdirSync(progressDirectory, { recursive: true });
  fs.mkdirSync(vocabularyDirectory, { recursive: true });
  fs.writeFileSync(samplePath, "样例正文。", "utf-8");
  fs.writeFileSync(path.join(readingDirectory, "b-next.txt"), "下一本正文。", "utf-8");
  fs.writeFileSync(path.join(progressDirectory, "state.json"), JSON.stringify({ activeBookId: sampleId }), "utf-8");
  fs.writeFileSync(progressPath, JSON.stringify({ characterOffset: 2 }), "utf-8");

  try {
    const result = await runReadSession(
      root,
      ["s", "s", "s", "s", "s", "\r", "\r", "y", "\u000f", "\u000f", "q"],
      ["read", "-s"]
    );

    assert.equal(result.code, 0, result.output);
    assert.equal(result.output.includes("a-赤兔之死"), true, result.output);
    assert.equal(result.output.includes("The local novel file and all reading progress"), true, result.output);
    assert.equal(fs.existsSync(samplePath), false);
    assert.equal(fs.existsSync(progressPath), false);
    const state = JSON.parse(fs.readFileSync(path.join(progressDirectory, "state.json"), "utf-8")) as {
      activeBookId: string;
    };
    assert.equal(state.activeBookId, "b-next");
    assert.equal(result.output.includes("source loaded: b-next.txt"), true, result.output);
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
    const result = await runReadSession(root, ["s", "\r", "d", "d", "101", "\r", "\u001b", "q"], ["read", "-s"]);

    assert.equal(result.code, 0, result.output);
    assert.equal(fs.existsSync(path.join(root, "read-settings.json")), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("Read settings reject a custom chapter section count above 20", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "touchfish-read-section-limit-"));
  const readingDirectory = path.join(root, "reading");
  const vocabularyDirectory = path.join(root, "vocabulary");

  fs.mkdirSync(readingDirectory, { recursive: true });
  fs.mkdirSync(vocabularyDirectory, { recursive: true });
  fs.writeFileSync(path.join(readingDirectory, "limit.txt"), "正文第一段。\n正文第二段。", "utf-8");

  try {
    const result = await runReadSession(
      root,
      ["s", "s", "\r", "d", "d", "d", "d", "21", "\r", "\u001b", "q"],
      ["read", "-s"]
    );

    assert.equal(result.code, 0, result.output);
    assert.equal(result.output.includes("Chapter sections must be a whole number from 2 to 20"), true, result.output);
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
