import type { ReadingChapter } from "../models/reading.js";

const CHINESE_CHAPTER_PATTERN = /^第[〇零一二三四五六七八九十百千万\d]+[章节回卷].*$/;
const ENGLISH_CHAPTER_PATTERN = /^chapter\s+\d+\b.*$/i;
const ARTICLE_TITLE_PATTERN = /^《[^》]+》$/;

export function detectReadingChapters(content: string): ReadingChapter[] {
  const chapters: ReadingChapter[] = [];
  const sourceLines = content.split("\n");
  let offset = 0;

  sourceLines.forEach((sourceLine, index) => {
    const title = sourceLine.trim();

    if (isChapterTitle(title)) {
      chapters.push({ title, startOffset: offset });
    }

    offset += [...sourceLine].length + (index < sourceLines.length - 1 ? 1 : 0);
  });

  return chapters.length > 0 ? chapters : [{ title: "正文", startOffset: 0 }];
}

export function findReadingChapterIndex(chapters: ReadingChapter[], characterOffset: number): number {
  if (chapters.length === 0) {
    return 0;
  }

  const normalizedOffset = Math.max(0, Math.floor(characterOffset));
  let chapterIndex = 0;

  chapters.forEach((chapter, index) => {
    if (chapter.startOffset <= normalizedOffset) {
      chapterIndex = index;
    }
  });

  return chapterIndex;
}

export function getNextReadingChapterIndex(chapters: ReadingChapter[], currentIndex: number): number {
  return Math.min(Math.max(currentIndex, 0) + 1, Math.max(chapters.length - 1, 0));
}

export function getPreviousReadingChapterIndex(chapters: ReadingChapter[], currentIndex: number): number {
  return Math.max(Math.min(currentIndex, Math.max(chapters.length - 1, 0)) - 1, 0);
}

function isChapterTitle(value: string): boolean {
  return (
    CHINESE_CHAPTER_PATTERN.test(value) ||
    ENGLISH_CHAPTER_PATTERN.test(value) ||
    ARTICLE_TITLE_PATTERN.test(value)
  );
}
