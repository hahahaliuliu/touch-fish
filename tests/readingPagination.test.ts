import assert from "node:assert/strict";
import test from "node:test";
import {
  findReadingPageIndex,
  getNextReadingPageIndex,
  getPreviousReadingPageIndex,
  paginateReadingText,
} from "../src/services/readingPagination.js";
import { getTerminalWidth } from "../src/ui/terminalText.js";

test("reading pagination wraps Chinese and English text within the requested width", () => {
  const pages = paginateReadingText("第一段 Chinese text", 8, 10);

  assert.deepEqual(pages[0]?.lines, ["第一段 C", "hinese t", "ext"]);
  assert.equal(pages[0]?.lines.every((line) => getTerminalWidth(line) <= 8), true);
});

test("reading pagination removes blank paragraph lines while retaining their offsets", () => {
  const content = "第一段\n\n第二段";
  const pages = paginateReadingText(content, 20, 2);

  assert.deepEqual(pages.map((page) => page.lines), [["第一段", "第二段"]]);
  assert.equal(findReadingPageIndex(pages, [..."第一段\n"].length), 0);
});

test("reading pages retain character offsets for navigation and resuming", () => {
  const pages = paginateReadingText("abcdefghij", 3, 2);

  assert.deepEqual(pages.map((page) => page.lines), [["abc", "def"], ["ghi", "j"]]);
  assert.deepEqual(
    pages.map((page) => [page.startOffset, page.endOffset]),
    [[0, 6], [6, 10]]
  );
  assert.equal(findReadingPageIndex(pages, 0), 0);
  assert.equal(findReadingPageIndex(pages, 5), 0);
  assert.equal(findReadingPageIndex(pages, 6), 1);
  assert.equal(findReadingPageIndex(pages, 99), 1);
});

test("reading pagination starts a fresh page at a chapter offset", () => {
  const content = "第一段\n第二段\n第三段";
  const chapterTwoOffset = [..."第一段\n"].length;
  const pages = paginateReadingText(content, 20, 10, [0, chapterTwoOffset]);

  assert.deepEqual(pages.map((page) => page.lines), [["第一段"], ["第二段", "第三段"]]);
  assert.equal(pages[1]?.startOffset, chapterTwoOffset);
});

test("reading page navigation stops at the first and last pages", () => {
  const pages = paginateReadingText("abcdefghij", 3, 2);

  assert.equal(getPreviousReadingPageIndex(pages, 0), 0);
  assert.equal(getNextReadingPageIndex(pages, 0), 1);
  assert.equal(getNextReadingPageIndex(pages, 1), 1);
  assert.equal(getPreviousReadingPageIndex(pages, 1), 0);
});

test("empty reading text has no pages", () => {
  assert.deepEqual(paginateReadingText("", 20, 5), []);
  assert.equal(findReadingPageIndex([], 0), 0);
});
