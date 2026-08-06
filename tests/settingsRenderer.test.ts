import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_SETTINGS } from "../src/config/defaultSettings.js";
import { renderSettingSession } from "../src/ui/settingsRenderer.js";

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
