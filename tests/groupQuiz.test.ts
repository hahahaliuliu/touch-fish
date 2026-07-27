import assert from "node:assert/strict";
import test from "node:test";
import { isGroupQuizAnswerCorrect } from "../src/services/groupQuiz.js";

const word = {
  english: "abandon",
  chinese: "放弃；遗弃",
};

test("English answers ignore case and surrounding whitespace", () => {
  assert.equal(isGroupQuizAnswerCorrect(word, "chinese-to-english", "  ABANDON  "), true);
  assert.equal(isGroupQuizAnswerCorrect(word, "chinese-to-english", "leave"), false);
});

test("Chinese answers accept one meaning from a multi-meaning entry", () => {
  assert.equal(isGroupQuizAnswerCorrect(word, "english-to-chinese", "放弃"), true);
  assert.equal(isGroupQuizAnswerCorrect(word, "english-to-chinese", "遗弃"), true);
  assert.equal(isGroupQuizAnswerCorrect(word, "english-to-chinese", "收益"), false);
});
