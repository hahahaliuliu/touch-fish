import assert from "node:assert/strict";
import test from "node:test";
import { parseImportedVocabulary } from "../src/services/vocabularyImportParser.js";

test("TXT import skips comments and removes duplicate English words", () => {
  const book = parseImportedVocabulary(
    "# Starter words\nabandon\t放弃\nbenefit - 好处\nABANDON: 遗弃\n",
    "starter.txt"
  );

  assert.equal(book.id, "starter");
  assert.deepEqual(book.words, [
    { english: "abandon", chinese: "放弃" },
    { english: "benefit", chinese: "好处" },
  ]);
});

test("CSV import reads a header and quoted Chinese values", () => {
  const book = parseImportedVocabulary(
    "English,Chinese\nabandon,放弃\nbenefit,\"利益,好处\"\n",
    "cet4.csv"
  );

  assert.deepEqual(book.words, [
    { english: "abandon", chinese: "放弃" },
    { english: "benefit", chinese: "利益,好处" },
  ]);
});

test("JSON import keeps optional word details", () => {
  const book = parseImportedVocabulary(
    JSON.stringify({
      id: "details",
      name: "Details",
      language: { source: "en", target: "zh-CN" },
      version: 1,
      words: [{ english: "abandon", chinese: "放弃", phonetic: "/əˈbændən/" }],
    }),
    "details.json"
  );

  assert.equal(book.words[0]?.phonetic, "/əˈbændən/");
});
