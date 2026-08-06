import assert from "node:assert/strict";
import test from "node:test";
import {
  detectReadingChapters,
  findReadingChapterIndex,
  getNextReadingChapterIndex,
  getPreviousReadingChapterIndex,
} from "../src/services/readingChapters.js";

test("reading chapters recognize article titles used by the bundled example", () => {
  const content = "《止战之殇》\n第一篇内容\n\n《赤兔之死》\n第二篇内容";
  const chapters = detectReadingChapters(content);

  assert.deepEqual(chapters, [
    { title: "《止战之殇》", startOffset: 0 },
    { title: "《赤兔之死》", startOffset: [..."《止战之殇》\n第一篇内容\n\n"].length },
  ]);
});

test("reading chapters recognize Chinese and English chapter headings", () => {
  const content = "第一章 开端\n正文\n第十二回 终章\n正文\nChapter 13: End\ntext";
  const chapters = detectReadingChapters(content);

  assert.deepEqual(chapters.map((chapter) => chapter.title), [
    "第一章 开端",
    "第十二回 终章",
    "Chapter 13: End",
  ]);
});

test("reading chapters use one body chapter when no heading is present", () => {
  assert.deepEqual(detectReadingChapters("没有章节标题的正文"), [{ title: "正文", startOffset: 0 }]);
});

test("reading chapter navigation stops at the first and last chapter", () => {
  const chapters = detectReadingChapters("《一》\n正文\n《二》\n正文");

  assert.equal(findReadingChapterIndex(chapters, 0), 0);
  assert.equal(findReadingChapterIndex(chapters, 8), 1);
  assert.equal(getPreviousReadingChapterIndex(chapters, 0), 0);
  assert.equal(getNextReadingChapterIndex(chapters, 0), 1);
  assert.equal(getNextReadingChapterIndex(chapters, 1), 1);
  assert.equal(getPreviousReadingChapterIndex(chapters, 1), 0);
});
