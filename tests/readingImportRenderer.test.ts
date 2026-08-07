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

test("Read delete confirmation follows the vocabulary manager prompt order", () => {
  const lines = captureRender(false, true);
  const controlsIndex = lines.findIndex((line) => line.startsWith("操作  W/S"));
  const confirmIndex = lines.findIndex((line) => line === "[确认] 要删除 赤兔之死-止战之殇 吗？");

  assert.equal(controlsIndex >= 0, true);
  assert.equal(confirmIndex > controlsIndex, true);
  assert.equal(lines.includes("[警告] 本地小说文件和该小说的全部阅读进度都会被删除"), true);
  assert.equal(lines.includes("[确认] 按 Y 删除，或按 Esc 取消"), true);
});

function captureRender(isImporting: boolean, isConfirmingDelete = false): string[] {
  const lines: string[] = [];
  const originalLog = console.log;
  const originalClear = console.clear;

  console.log = (...values: unknown[]) => lines.push(values.join(" "));
  console.clear = () => undefined;

  try {
    renderReadingImport({
      interfaceLanguage: "chinese",
      books,
      selectedIndex: isConfirmingDelete ? 0 : books.length,
      isImporting,
      isConfirmingDelete,
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
