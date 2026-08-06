import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { resolveAssetPath } from "../src/config/paths.js";
import { loadReadingBook, normalizeReadingText } from "../src/services/readingLoader.js";

const testBookId = `reading-loader-${process.pid}`;
const testBookPath = resolveAssetPath("reading", `${testBookId}.txt`);

test("TXT novels derive their title and normalize line endings", () => {
  try {
    fs.mkdirSync(path.dirname(testBookPath), { recursive: true });
    fs.writeFileSync(testBookPath, "\uFEFFFirst line\r\n第二行\rThird line", "utf-8");

    const book = loadReadingBook(testBookId);

    assert.equal(book.id, testBookId);
    assert.equal(book.title, testBookId);
    assert.equal(book.content, "First line\n第二行\nThird line");
    assert.equal(book.characterCount, [...book.content].length);
    assert.deepEqual(book.chapters, [{ title: "正文", startOffset: 0 }]);
  } finally {
    if (fs.existsSync(testBookPath)) {
      fs.unlinkSync(testBookPath);
    }
  }
});

test("reading text removes a UTF-8 BOM and normalizes all line endings", () => {
  assert.equal(normalizeReadingText("\uFEFFone\r\ntwo\rthree\nfour"), "one\ntwo\nthree\nfour");
});

test("empty TXT novels are rejected", () => {
  try {
    fs.mkdirSync(path.dirname(testBookPath), { recursive: true });
    fs.writeFileSync(testBookPath, "   \n", "utf-8");

    assert.throws(() => loadReadingBook(testBookId), /Novel file is empty/);
  } finally {
    if (fs.existsSync(testBookPath)) {
      fs.unlinkSync(testBookPath);
    }
  }
});

test("bundled example suffix is not shown in a novel title or id", () => {
  const examplePath = resolveAssetPath("reading", `${testBookId}.example.txt`);

  try {
    fs.mkdirSync(path.dirname(examplePath), { recursive: true });
    fs.writeFileSync(examplePath, "Example text", "utf-8");

    const book = loadReadingBook(testBookId);

    assert.equal(book.id, testBookId);
    assert.equal(book.title, testBookId);
  } finally {
    if (fs.existsSync(examplePath)) {
      fs.unlinkSync(examplePath);
    }
  }
});
