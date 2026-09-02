import type { ReadingChapter, ReadingSection } from "../models/reading.js";
import { findLastIndexAtOrBelow } from "./offsetIndex.js";

export function createReadingSections(
  content: string,
  chapters: ReadingChapter[],
  requestedCount: number
): ReadingSection[] {
  if (chapters.length === 0) {
    return [];
  }

  const contentLength = [...content].length;
  const sectionCount = Math.max(1, Math.floor(requestedCount));
  const sourceLines = getSourceLines(content);
  const paragraphStarts = sourceLines
    .filter((line) => line.startOffset > 0 && line.text.trim() !== "")
    .map((line) => line.startOffset);

  return chapters.flatMap((chapter, chapterIndex) => {
    const chapterEnd = chapters[chapterIndex + 1]?.startOffset ?? contentLength;
    let candidates = paragraphStarts.filter((offset) => offset > chapter.startOffset && offset < chapterEnd);
    const chapterStartLine = sourceLines.find((line) => line.startOffset === chapter.startOffset);

    if (chapter.title !== "正文" && chapterStartLine?.text.trim() === chapter.title) {
      candidates = candidates.slice(1);
    }
    const selectedStarts = chooseSectionStarts(
      chapter.startOffset,
      chapterEnd,
      candidates,
      sectionCount
    );

    return selectedStarts.map((startOffset, indexInChapter, starts) => ({
      chapterIndex,
      indexInChapter,
      countInChapter: starts.length,
      startOffset,
    }));
  });
}

export function findReadingSectionIndex(sections: ReadingSection[], characterOffset: number): number {
  return findLastIndexAtOrBelow(sections, characterOffset);
}

export function getNextReadingSectionIndex(sections: ReadingSection[], currentIndex: number): number {
  return Math.min(Math.max(currentIndex, 0) + 1, Math.max(sections.length - 1, 0));
}

export function getPreviousReadingSectionIndex(sections: ReadingSection[], currentIndex: number): number {
  return Math.max(Math.min(currentIndex, Math.max(sections.length - 1, 0)) - 1, 0);
}

function chooseSectionStarts(
  chapterStart: number,
  chapterEnd: number,
  candidates: number[],
  requestedCount: number
): number[] {
  const actualCount = Math.min(requestedCount, candidates.length + 1);
  const starts = [chapterStart];
  let minimumCandidateIndex = 0;

  for (let sectionIndex = 1; sectionIndex < actualCount; sectionIndex += 1) {
    const remainingBoundaries = actualCount - sectionIndex - 1;
    const maximumCandidateIndex = candidates.length - remainingBoundaries - 1;
    const target = chapterStart + ((chapterEnd - chapterStart) * sectionIndex) / actualCount;
    let bestIndex = minimumCandidateIndex;

    for (let candidateIndex = minimumCandidateIndex; candidateIndex <= maximumCandidateIndex; candidateIndex += 1) {
      if (Math.abs(candidates[candidateIndex]! - target) < Math.abs(candidates[bestIndex]! - target)) {
        bestIndex = candidateIndex;
      }
    }

    starts.push(candidates[bestIndex]!);
    minimumCandidateIndex = bestIndex + 1;
  }

  return starts;
}

interface SourceLine {
  text: string;
  startOffset: number;
}

function getSourceLines(content: string): SourceLine[] {
  const lines: SourceLine[] = [];
  const sourceLines = content.split("\n");
  let offset = 0;

  sourceLines.forEach((line, index) => {
    lines.push({ text: line, startOffset: offset });
    offset += [...line].length + (index < sourceLines.length - 1 ? 1 : 0);
  });

  return lines;
}
