import assert from "node:assert/strict";
import test from "node:test";
import type { ReadingBook, ReadingPage, ReadKeyBindings } from "../src/models/reading.js";
import { renderReadMiniSession } from "../src/ui/readMiniRenderer.js";
import { getTerminalWidth } from "../src/ui/terminalText.js";

const book: ReadingBook = {
  id: "mini-render",
  title: "Mini Render",
  sourcePath: "assets/reading/mini-render.txt",
  content: "Chapter\nFirst line\nSecond line",
  characterCount: 30,
  chapters: [{ title: "Chapter", startOffset: 0 }],
};
const page: ReadingPage = {
  lines: ["First line", "Second line"],
  startOffset: 8,
  endOffset: 30,
};
const keyBindings: ReadKeyBindings = {
  previousPage: ["a", "arrow-left"],
  nextPage: ["d", "arrow-right"],
  previousChapter: ["w", "arrow-up"],
  nextChapter: ["s", "arrow-down"],
  repeat: ["space", ""],
  toggleHelp: ["?", ""],
  toggleMiniWindow: ["mouse-right", ""],
};

test("Read mini keeps its page position fixed while right-aligning the scroll hint", () => {
  const originalColumns = process.stdout.columns;
  const originalLog = console.log;
  const originalClear = console.clear;
  const originalWrite = process.stdout.write;
  const loggedLines: string[] = [];
  let body = "";

  Object.defineProperty(process.stdout, "columns", { value: 80, configurable: true });
  console.log = (...values: unknown[]) => loggedLines.push(values.join(" "));
  console.clear = () => undefined;
  process.stdout.write = ((chunk: string | Uint8Array) => {
    body += chunk.toString();
    return true;
  }) as typeof process.stdout.write;

  try {
    const baseOptions = {
      book,
      page,
      pageIndex: 0,
      pageTotal: 1,
      chapterIndex: 0,
      sectionNavigationEnabled: false,
      interfaceLanguage: "english",
      keyBindings,
      mouseWheelMode: "scroll",
      mouseScrollStep: 3,
      scrollResumeLineIndex: 1,
      showHelp: false,
    } as const;

    renderReadMiniSession(baseOptions);
    const headerWithoutHint = loggedLines.at(-1) ?? "";
    const pageColumn = headerWithoutHint.indexOf("1/1");
    body = "";

    renderReadMiniSession({
      ...baseOptions,
      scrollResumeDistance: { direction: "above", lineCount: 3 },
    });

    const header = loggedLines.at(-1) ?? "";
    assert.equal(headerWithoutHint.endsWith("1/1"), true);
    assert.equal(header.indexOf("1/1"), pageColumn);
    assert.equal(getTerminalWidth(header), 78);
    assert.match(header, /last position 3 lines above$/);
    assert.equal(body, "  First line\n> Second line");
  } finally {
    Object.defineProperty(process.stdout, "columns", { value: originalColumns, configurable: true });
    console.log = originalLog;
    console.clear = originalClear;
    process.stdout.write = originalWrite;
  }
});
