import assert from "node:assert/strict";
import test from "node:test";
import type { ReadingBook, ReadingPage, ReadKeyBindings } from "../src/models/reading.js";
import { renderReadSession } from "../src/ui/readRenderer.js";

const book: ReadingBook = {
  id: "example",
  title: "Example",
  sourcePath: "assets/reading/example.txt",
  content: "Chapter One\nFirst line",
  characterCount: 22,
  chapters: [{ title: "Chapter One", startOffset: 0 }],
};

const page: ReadingPage = { lines: ["Chapter One", "First line"], startOffset: 0, endOffset: 22 };
const keyBindings: ReadKeyBindings = {
  previousPage: ["a", "arrow-left"],
  nextPage: ["d", "arrow-right"],
  previousChapter: ["w", "arrow-up"],
  nextChapter: ["s", "arrow-down"],
  repeat: ["space", ""],
  toggleHelp: ["?", ""],
};

for (const [theme, expected] of [
  ["build-log", "cache entries by path ./src/read/"],
  ["backend-log", "reader-api booting service=local-reading"],
  ["git", "On branch feature/reading-workspace"],
] as const) {
  test(`read renderer uses the ${theme} disguise theme`, () => {
    const lines: string[] = [];
    const originalLog = console.log;
    const originalClear = console.clear;

    console.log = (...values: unknown[]) => lines.push(values.join(" "));
    console.clear = () => undefined;

    try {
      renderReadSession({
        book,
        page,
        pageIndex: 0,
        pageTotal: 1,
        chapterIndex: 0,
        theme,
        interfaceLanguage: "english",
        keyBindings,
        showHelp: false,
      });
      assert.equal(lines.some((line) => line.includes(expected)), true);
    } finally {
      console.log = originalLog;
      console.clear = originalClear;
    }
  });
}

test("read renderer displays the help screen before the selected theme", () => {
  const lines: string[] = [];
  const originalLog = console.log;
  const originalClear = console.clear;

  console.log = (...values: unknown[]) => lines.push(values.join(" "));
  console.clear = () => undefined;

  try {
    renderReadSession({
      book,
      page,
      pageIndex: 0,
      pageTotal: 1,
      chapterIndex: 0,
      theme: "git",
      interfaceLanguage: "english",
      keyBindings,
      showHelp: true,
    });
    assert.equal(lines.some((line) => line.includes("Touch Fish Help")), true);
    assert.equal(lines.some((line) => line.includes("Navigation")), true);
    assert.equal(lines.some((line) => line.includes("Actions")), true);
    assert.equal(lines.some((line) => line.includes("Current Reading Workspace")), true);
    assert.equal(lines.some((line) => line.includes("current novel") && line.includes("Example")), true);
    assert.equal(lines.some((line) => line.includes("reading position") && line.includes("1 / 22")), true);
    assert.equal(lines.some((line) => line.includes("page") && line.includes("1 / 1")), true);
    assert.equal(lines.some((line) => line.includes("On branch feature/reading-workspace")), false);
  } finally {
    console.log = originalLog;
    console.clear = originalClear;
  }
});

test("read help displays the configured key bindings", () => {
  const lines: string[] = [];
  const originalLog = console.log;
  const originalClear = console.clear;

  console.log = (...values: unknown[]) => lines.push(values.join(" "));
  console.clear = () => undefined;

  try {
    renderReadSession({
      book,
      page,
      pageIndex: 0,
      pageTotal: 1,
      chapterIndex: 0,
      theme: "build-log",
      interfaceLanguage: "english",
      keyBindings: {
        ...keyBindings,
        nextPage: ["f", "arrow-right"],
        toggleHelp: ["h", ""],
      },
      showHelp: true,
    });
    assert.equal(lines.some((line) => line.includes("F / →") && line.includes("next page")), true);
    assert.equal(lines.some((line) => line.includes("H") && line.includes("close help")), true);
    assert.equal(lines.some((line) => line.includes("D / →")), false);
  } finally {
    console.log = originalLog;
    console.clear = originalClear;
  }
});

test("read help and disguise themes display section navigation when enabled", () => {
  for (const [theme, expectedStatus] of [
    ["build-log", "section 2 / 3"],
    ["backend-log", "section=2/3"],
    ["git", "section 2/3"],
  ] as const) {
    const lines = captureReadRender({
      theme,
      sectionNavigationEnabled: true,
      sectionIndex: 1,
      sectionTotal: 3,
    });
    assert.equal(lines.some((line) => line.includes(expectedStatus)), true);
  }

  const helpLines = captureReadRender({
    showHelp: true,
    sectionNavigationEnabled: true,
    sectionIndex: 0,
    sectionTotal: 3,
  });
  assert.equal(helpLines.some((line) => line.includes("previous section")), true);
  assert.equal(helpLines.some((line) => line.includes("next section")), true);
  assert.equal(helpLines.some((line) => line.includes("previous chapter")), false);
  assert.equal(helpLines.some((line) => line.includes("chapter sections") && line.includes("enabled")), true);
  assert.equal(helpLines.some((line) => line.includes("section") && line.includes("1 / 3")), true);
});

test("Chinese Read help mirrors the Word help sections", () => {
  const lines = captureReadRender({
    showHelp: true,
    interfaceLanguage: "chinese",
  });

  assert.equal(lines[0], "Touch Fish 帮助");
  assert.equal(lines.includes("导航"), true);
  assert.equal(lines.includes("操作"), true);
  assert.equal(lines.includes("当前阅读区"), true);
  assert.equal(lines.some((line) => line.includes("当前小说") && line.includes("Example")), true);
  assert.equal(lines.some((line) => line.includes("Esc") && line.includes("返回阅读")), true);
  assert.equal(lines.some((line) => line.includes("Q / Ctrl+C") && line.includes("保存进度并退出")), true);
});

function captureReadRender(overrides: Partial<Parameters<typeof renderReadSession>[0]>): string[] {
  const lines: string[] = [];
  const originalLog = console.log;
  const originalClear = console.clear;

  console.log = (...values: unknown[]) => lines.push(values.join(" "));
  console.clear = () => undefined;

  try {
    renderReadSession({
      book,
      page,
      pageIndex: 0,
      pageTotal: 1,
      chapterIndex: 0,
      theme: "build-log",
      interfaceLanguage: "english",
      keyBindings,
      showHelp: false,
      ...overrides,
    });
  } finally {
    console.log = originalLog;
    console.clear = originalClear;
  }

  return lines;
}
