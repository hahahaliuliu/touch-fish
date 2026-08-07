import assert from "node:assert/strict";
import test from "node:test";
import type { ReadingBookSummary } from "../src/models/reading.js";
import { renderReadingImport } from "../src/ui/readingImportRenderer.js";

const books: ReadingBookSummary[] = [
  { id: "sample", title: "赤兔之死-止战之殇", characterCount: 1626 },
];

test("Read import waits for Enter before showing the path editor", () => {
  const lines = captureRender(false);

  assert.equal(lines.some((line) => line.includes("赤兔之死-止战之殇")), true);
  assert.equal(lines.some((line) => line.includes("Enter 开始输入小说文件路径")), true);
  assert.equal(lines.includes("小说文件路径"), false);
  assert.equal(lines.some((line) => line.includes("\u001b[5m_\u001b[0m")), false);
  assert.equal(lines.some((line) => line.includes("Q / Ctrl+C 退出程序")), true);
});

test("Read import explains source-file handling while editing a path", () => {
  const lines = captureRender(true);

  assert.equal(lines.includes("小说文件路径"), true);
  assert.equal(lines.some((line) => line.includes("\u001b[5m_\u001b[0m")), true);
  assert.equal(lines.some((line) => line.includes("成功后可移动或删除原文件")), true);
  assert.equal(lines.some((line) => line.includes("路径编辑时 Q 会作为路径内容输入")), true);
});

function captureRender(isImporting: boolean): string[] {
  const lines: string[] = [];
  const originalLog = console.log;
  const originalClear = console.clear;

  console.log = (...values: unknown[]) => lines.push(values.join(" "));
  console.clear = () => undefined;

  try {
    renderReadingImport({
      interfaceLanguage: "chinese",
      books,
      selectedIndex: books.length,
      isImporting,
      isConfirmingDelete: false,
      importPath: "",
      conflictChoice: "replace",
      message: "",
    });
  } finally {
    console.log = originalLog;
    console.clear = originalClear;
  }

  return lines;
}
