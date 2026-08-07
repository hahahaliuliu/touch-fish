import assert from "node:assert/strict";
import test from "node:test";
import type { ReadingBook, ReadingPage } from "../src/models/reading.js";
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
      showHelp: true,
    });
    assert.equal(lines.some((line) => line.includes("Reading controls")), true);
    assert.equal(lines.some((line) => line.includes("On branch feature/reading-workspace")), false);
  } finally {
    console.log = originalLog;
    console.clear = originalClear;
  }
});
