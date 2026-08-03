import assert from "node:assert/strict";
import test from "node:test";
import { renderGroupQuiz } from "../src/ui/groupQuizRenderer.js";

test("quiz summary shows wrong answers in test order with expected answers", () => {
  const output = captureOutput(() => {
    renderGroupQuiz({
      words: [],
      questionIndex: 0,
      direction: "english-to-chinese",
      answer: "",
      isShowingResult: false,
      lastAnswerCorrect: undefined,
      wrongAnswers: [
        {
          word: { english: "first", chinese: "one" },
          answer: "wrong one",
          direction: "english-to-chinese",
        },
        {
          word: { english: "second", chinese: "two" },
          answer: "wrong two",
          direction: "chinese-to-english",
        },
      ],
      interfaceLanguage: "english",
    });
  });

  assert.ok(output.indexOf("first") < output.indexOf("second"));
  assert.match(output, /Your answer: wrong one/);
  assert.match(output, /Expected answer: one/);
  assert.match(output, /Prompt: two/);
  assert.match(output, /Expected answer: second/);
  assert.match(output, /Press R to retry incorrect words/);
});

function captureOutput(render: () => void): string {
  const lines: string[] = [];
  const originalLog = console.log;
  const originalClear = console.clear;

  console.log = (...args: unknown[]) => lines.push(args.join(" "));
  console.clear = () => {};

  try {
    render();
  } finally {
    console.log = originalLog;
    console.clear = originalClear;
  }

  return lines.join("\n");
}
