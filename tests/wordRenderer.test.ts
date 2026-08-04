import assert from "node:assert/strict";
import test from "node:test";
import type { RenderWordSessionOptions } from "../src/ui/wordRenderer.js";
import { renderWordSession } from "../src/ui/wordRenderer.js";

const baseOptions: RenderWordSessionOptions = {
  words: [{ english: "resemble", chinese: "像；与……相似", note: "like | be similar to" }],
  current: 1,
  total: 1,
  workspaceSize: 1,
  studyGroupStart: 1,
  studyGroupEnd: 1,
  studyGroupCurrent: 1,
  studyGroupTotal: 1,
  studyGroupEnabled: true,
  navigationLoop: false,
  studyOrder: "sequential",
  theme: "build-log",
  keyBindings: {
    previous: ["a", "arrow-left"],
    next: ["d", "arrow-right"],
    previousGroup: ["[", "arrow-up"],
    nextGroup: ["]", "arrow-down"],
    repeat: ["space", ""],
    switchDisplayMode: ["tab", ""],
    startQuiz: ["t", ""],
    editNote: ["e", ""],
    toggleHelp: ["?", ""],
    quit: ["q", ""],
  },
  displayMode: "english",
  noteMode: "hidden",
  interfaceLanguage: "english",
  showHelp: false,
};

test("word renderer hides or displays notes according to note mode", () => {
  const lines: string[] = [];
  const originalLog = console.log;
  const originalClear = console.clear;

  console.log = (...values: unknown[]) => lines.push(values.join(" "));
  console.clear = () => undefined;

  try {
    renderWordSession(baseOptions);
    assert.equal(lines.some((line) => line.includes("note:")), false);

    lines.length = 0;
    renderWordSession({ ...baseOptions, noteMode: "visible" });
    assert.equal(lines.some((line) => line.includes("note: like | be similar to")), true);
  } finally {
    console.log = originalLog;
    console.clear = originalClear;
  }
});

test("long visible notes move to a complete continuation line", () => {
  const lines: string[] = [];
  const originalLog = console.log;
  const originalClear = console.clear;

  console.log = (...values: unknown[]) => lines.push(values.join(" "));
  console.clear = () => undefined;

  try {
    const longNote = "perceive, acknowledge, realize, appreciate, admit, identify, comprehend, ".repeat(3).trim();

    renderWordSession({
      ...baseOptions,
      words: [{
        english: "recognize",
        chinese: "认出，识别",
        note: longNote,
      }],
      displayMode: "both",
      noteMode: "visible",
    });

    const noteLineIndex = lines.findIndex((line) => line.trimStart().startsWith("note: "));
    assert.ok(noteLineIndex > 0);
    assert.equal(lines[noteLineIndex - 1]?.includes("recognize"), true);
    assert.equal(lines.slice(noteLineIndex, noteLineIndex + 5).some((line) => line.includes("comprehend")), true);
    const noteLines = lines.slice(noteLineIndex).filter((line) => line.includes("note:") || line.startsWith("         "));
    assert.equal(noteLines.every((line) => line.startsWith("    note: ") || line.startsWith("             ")), true);
  } finally {
    console.log = originalLog;
    console.clear = originalClear;
  }
});
