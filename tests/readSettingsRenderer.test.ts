import assert from "node:assert/strict";
import test from "node:test";
import type { ReadSettings, ReadingBookSummary } from "../src/models/reading.js";
import { renderReadSettings } from "../src/ui/readSettingsRenderer.js";
import { getTerminalWidth } from "../src/ui/terminalText.js";

const books: ReadingBookSummary[] = [
  { id: "alpha", title: "Alpha", characterCount: 100 },
  { id: "bravo", title: "Bravo", characterCount: 200 },
];

const settings: ReadSettings = {
  contentWidth: 0,
  pageLineCount: 10,
  chapterSectionCount: 0,
  miniWindowColumns: 64,
  miniWindowRows: 22,
  miniWindowFontSize: 8,
  miniWindowMouseMode: "page",
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

test("Read settings order mirrors the corresponding Word settings", () => {
  const lines = captureRender({});
  const indexes = [
    "正文宽度", "每页行数", "章节切分", "界面语言", "当前小说", "导入 TXT 小说",
    "伪装主题", "小窗口阅读", "小窗口宽度", "小窗口高度", "小窗口字体", "鼠标滚轮",
  ]
    .map((label) => lines.findIndex((line) => line.includes(label)));

  assert.equal(indexes.every((index) => index >= 0), true);
  assert.deepEqual(indexes, [...indexes].sort((left, right) => left - right));
});

test("Read settings highlights the active automatic width option while editing", () => {
  const lines = captureRender({
    selectedIndex: 0,
    isEditing: true,
    selectedNumericOption: 0,
  });

  assert.equal(lines.some((line) => line.includes("\u001b[7m自动适配\u001b[0m")), true);
  assert.equal(lines.some((line) => line.includes("按终端宽度和当前主题计算正文宽度")), true);
});

test("Read settings highlights the selected novel while editing", () => {
  const lines = captureRender({
    selectedIndex: 4,
    isEditing: true,
  });

  assert.equal(lines.some((line) => line.includes("\u001b[7mAlpha\u001b[0m / Bravo")), true);
});

test("Read settings shows cursors for custom numeric input and key capture", () => {
  const numericLines = captureRender({
    selectedIndex: 1,
    isEditing: true,
    customInput: "25",
    selectedNumericOption: "custom",
  });
  const bindingLines = captureRender({
    selectedIndex: 12,
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
    selectedIndex: 12,
    selectedBindingSlot: 1,
  });
  const bindingLine = lines.find((line) => line.includes("上一页")) ?? "";

  assert.equal(bindingLine.includes("A"), true);
  assert.equal(bindingLine.includes("\u001b[7m左方向键"), true);
});

test("Read settings rename chapter bindings when section navigation is enabled", () => {
  const lines = captureRender({
    settings: { ...settings, chapterSectionCount: 3 },
  });

  assert.equal(lines.some((line) => line.includes("上一小节")), true);
  assert.equal(lines.some((line) => line.includes("下一小节")), true);
  assert.equal(lines.some((line) => line.includes("上一章")), false);
});

test("Read settings shows whether mini-window mode can be opened or closed", () => {
  const closedLines = captureRender({ miniModeActive: false });
  const openLines = captureRender({ miniModeActive: true });

  assert.equal(closedLines.some((line) => line.includes("小窗口阅读") && line.includes("[打开]")), true);
  assert.equal(openLines.some((line) => line.includes("小窗口阅读") && line.includes("[关闭]")), true);
});

test("Read settings edits mini-window dimensions with the same option cursor", () => {
  const lines = captureRender({
    selectedIndex: 8,
    isEditing: true,
    selectedNumericOption: 64,
  });

  assert.equal(lines.some((line) => line.includes("小窗口宽度") && line.includes("\u001b[7m64\u001b[0m")), true);
  assert.equal(lines.some((line) => line.includes("拖动小窗口后会自动保存实际尺寸")), true);
});

test("Read setting option continuations stay aligned with the option column", () => {
  const originalColumns = process.stdout.columns;
  Object.defineProperty(process.stdout, "columns", { value: 45, configurable: true });

  try {
    const lines = captureRender({
      selectedIndex: 2,
      settings: { ...settings, chapterSectionCount: 3 },
    });
    const sectionLineIndex = lines.findIndex((line) => line.includes("章节切分"));
    const languageLineIndex = lines.findIndex((line) => line.includes("界面语言"));
    const continuationLines = lines.slice(sectionLineIndex + 1, languageLineIndex);
    const sectionLine = lines[sectionLineIndex] ?? "";
    const optionIndex = sectionLine.indexOf("[");
    const optionColumn = optionIndex < 0 ? -1 : getTerminalWidth(sectionLine.slice(0, optionIndex));

    assert.equal(sectionLineIndex >= 0, true);
    assert.equal(optionColumn > 0, true);
    assert.equal(continuationLines.length >= 2, true);
    assert.equal(
      continuationLines.every((line) => (line.match(/^ */)?.[0].length ?? 0) === optionColumn),
      true
    );
    assert.equal(
      lines.slice(sectionLineIndex, languageLineIndex).every((line) => getTerminalWidth(line) <= 45),
      true
    );
  } finally {
    Object.defineProperty(process.stdout, "columns", { value: originalColumns, configurable: true });
  }
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
      miniModeActive: false,
      ...overrides,
    });
    return lines;
  } finally {
    console.log = originalLog;
    console.clear = originalClear;
  }
}
