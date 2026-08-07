import assert from "node:assert/strict";
import test from "node:test";
import type { ReadSettings, ReadingBookSummary } from "../src/models/reading.js";
import { renderReadSettings } from "../src/ui/readSettingsRenderer.js";

const books: ReadingBookSummary[] = [
  { id: "alpha", title: "Alpha", characterCount: 100 },
  { id: "bravo", title: "Bravo", characterCount: 200 },
];

const settings: ReadSettings = {
  contentWidth: 0,
  pageLineCount: 10,
  interfaceLanguage: "chinese",
  theme: "build-log",
  keyBindings: {
    previousPage: ["a", "arrow-left"],
    nextPage: ["d", "arrow-right"],
    previousChapter: ["w", "arrow-up"],
    nextChapter: ["s", "arrow-down"],
    repeat: ["space", ""],
    toggleHelp: ["?", ""],
  },
};

test("Read settings highlights the active automatic width option while editing", () => {
  const lines = captureRender({
    selectedIndex: 2,
    isEditing: true,
    selectedNumericOption: 0,
  });

  assert.equal(lines.some((line) => line.includes("\u001b[7m自动适配\u001b[0m")), true);
  assert.equal(lines.some((line) => line.includes("按终端宽度和当前主题计算正文宽度")), true);
});

test("Read settings highlights the selected novel while editing", () => {
  const lines = captureRender({
    selectedIndex: 0,
    isEditing: true,
  });

  assert.equal(lines.some((line) => line.includes("\u001b[7mAlpha\u001b[0m / Bravo")), true);
});

test("Read settings shows cursors for custom numeric input and key capture", () => {
  const numericLines = captureRender({
    selectedIndex: 3,
    isEditing: true,
    customInput: "25",
    selectedNumericOption: "custom",
  });
  const bindingLines = captureRender({
    selectedIndex: 6,
    isEditing: false,
    isBindingCapture: true,
  });

  assert.equal(numericLines.some((line) => line.includes("25\u001b[5m_\u001b[0m")), true);
  assert.equal(numericLines.some((line) => line.includes("\u001b[7m自定义\u001b[0m")), true);
  assert.equal(bindingLines.some((line) => line.includes("\u001b[5m_\u001b[0m")), true);
  assert.equal(bindingLines.some((line) => line.includes("左方向键")), true);
});

test("Read settings highlights one binding slot without hiding the other", () => {
  const lines = captureRender({
    selectedIndex: 6,
    selectedBindingSlot: 1,
  });
  const bindingLine = lines.find((line) => line.includes("上一页")) ?? "";

  assert.equal(bindingLine.includes("A"), true);
  assert.equal(bindingLine.includes("\u001b[7m左方向键"), true);
});

function captureRender(overrides: Partial<Parameters<typeof renderReadSettings>[0]>): string[] {
  const lines: string[] = [];
  const originalLog = console.log;
  const originalClear = console.clear;

  console.log = (...values: unknown[]) => lines.push(values.join(" "));
  console.clear = () => undefined;

  try {
    renderReadSettings({
      books,
      activeBookId: "alpha",
      settings,
      selectedIndex: 0,
      selectedBindingSlot: 0,
      isEditing: false,
      customInput: "",
      isBindingCapture: false,
      editError: "",
      statusMessage: "",
      ...overrides,
    });
    return lines;
  } finally {
    console.log = originalLog;
    console.clear = originalClear;
  }
}
