import assert from "node:assert/strict";
import test from "node:test";
import { detectReadingChapters } from "../src/services/readingChapters.js";
import {
  createReadingSections,
  findReadingSectionIndex,
  getNextReadingSectionIndex,
  getPreviousReadingSectionIndex,
} from "../src/services/readingSections.js";

test("reading sections snap requested splits to paragraph starts", () => {
  const content = "第一章 开始\n第一段很短。\n第二段内容比较长。\n第三段结束。";
  const chapters = detectReadingChapters(content);
  const sections = createReadingSections(content, chapters, 3);
  const paragraphStarts = [
    0,
    [..."第一章 开始\n第一段很短。\n"].length,
    [..."第一章 开始\n第一段很短。\n第二段内容比较长。\n"].length,
  ];

  assert.deepEqual(sections.map((section) => section.startOffset), paragraphStarts);
  assert.deepEqual(sections.map((section) => section.indexInChapter), [0, 1, 2]);
  assert.deepEqual(sections.map((section) => section.countInChapter), [3, 3, 3]);
});

test("reading sections reduce their count instead of splitting a paragraph", () => {
  const content = "第一章 开始\n这是一个没有其他换行的很长自然段。";
  const chapters = detectReadingChapters(content);
  const sections = createReadingSections(content, chapters, 5);

  assert.deepEqual(sections.map((section) => section.startOffset), [0]);
  assert.equal(sections[0]?.countInChapter, 1);
});

test("reading sections remain isolated within each chapter", () => {
  const content = "第一章 开始\n甲段\n乙段\n第二章 继续\n丙段\n丁段";
  const chapters = detectReadingChapters(content);
  const sections = createReadingSections(content, chapters, 2);

  assert.deepEqual(sections.map((section) => section.chapterIndex), [0, 0, 1, 1]);
  assert.equal(sections[2]?.startOffset, chapters[1]?.startOffset);
});

test("reading section navigation stops at the first and last section", () => {
  const sections = createReadingSections("第一段\n第二段\n第三段", [{ title: "正文", startOffset: 0 }], 3);

  assert.equal(findReadingSectionIndex(sections, sections[1]!.startOffset), 1);
  assert.equal(getPreviousReadingSectionIndex(sections, 0), 0);
  assert.equal(getNextReadingSectionIndex(sections, 0), 1);
  assert.equal(getNextReadingSectionIndex(sections, 2), 2);
});
