import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_SETTINGS } from "../src/config/defaultSettings.js";
import { renderSettingSession } from "../src/ui/settingsRenderer.js";
import { getTerminalWidth } from "../src/ui/terminalText.js";

test("vocabulary book options wrap at complete names with an indented continuation", () => {
  const lines: string[] = [];
  const originalLog = console.log;
  const originalClear = console.clear;
  const firstBook = "ielts-reading-keywords-538";
  const secondBook = "cet4-frequency-complete-vocabulary";
  const thirdBook = "ielts-example-vocabulary-book";
  const settings = { ...DEFAULT_SETTINGS, activeVocabularyBook: firstBook };

  console.log = (...values: unknown[]) => lines.push(values.join(" "));
  console.clear = () => undefined;

  try {
    renderSettingSession({
      settings,
      draftSettings: settings,
      items: [{
        kind: "setting",
        key: "activeVocabularyBook",
        label: "Vocabulary Book",
        options: [firstBook, secondBook, thirdBook],
      }],
      selectedIndex: 0,
      selectedBindingSlot: 0,
      isEditing: true,
      isBindingCapture: false,
      isNumericCursor: false,
      editError: "",
      isReshuffleArmed: false,
    });

    const optionLines = lines.filter((line) =>
      line.includes(firstBook) || line.includes(secondBook) || line.includes(thirdBook)
    ).slice(1);

    assert.ok(optionLines.length >= 2);
    assert.equal(optionLines.every((line) => line.startsWith(" ".repeat(23))), true);
    assert.equal(optionLines.some((line) => line.includes(secondBook)), true);
    assert.equal(optionLines.some((line) => line.includes(thirdBook)), true);
  } finally {
    console.log = originalLog;
    console.clear = originalClear;
  }
});

test("Word setting option continuations stay aligned with the option column", () => {
  const lines: string[] = [];
  const originalLog = console.log;
  const originalClear = console.clear;
  const originalColumns = process.stdout.columns;

  console.log = (...values: unknown[]) => lines.push(values.join(" "));
  console.clear = () => undefined;
  Object.defineProperty(process.stdout, "columns", { value: 40, configurable: true });

  try {
    renderSettingSession({
      settings: DEFAULT_SETTINGS,
      draftSettings: DEFAULT_SETTINGS,
      items: [{
        kind: "setting",
        key: "theme",
        label: "Disguise Theme",
        options: ["build-log", "backend-log", "git"],
      }],
      selectedIndex: 0,
      selectedBindingSlot: 0,
      isEditing: false,
      isBindingCapture: false,
      isNumericCursor: false,
      editError: "",
      isReshuffleArmed: false,
    });

    const settingLineIndex = lines.findIndex((line) => line.includes("Disguise Theme"));
    const nextBlankLineIndex = lines.findIndex((line, index) => index > settingLineIndex && line === "");
    const optionLines = lines.slice(settingLineIndex, nextBlankLineIndex);

    assert.equal(optionLines.length >= 3, true);
    assert.equal(optionLines.slice(1).every((line) => line.startsWith(" ".repeat(34))), true);
    assert.equal(optionLines.every((line) => getTerminalWidth(line) <= 40), true);
  } finally {
    console.log = originalLog;
    console.clear = originalClear;
    Object.defineProperty(process.stdout, "columns", { value: originalColumns, configurable: true });
  }
});
