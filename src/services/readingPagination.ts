import type { ReadingPage } from "../models/reading.js";
import { getTerminalWidth } from "../ui/terminalText.js";
import { findLastIndexAtOrBelow } from "./offsetIndex.js";

interface ReadingLine {
  text: string;
  startOffset: number;
  endOffset: number;
}

export function paginateReadingText(
  content: string,
  maxWidth: number,
  maxLines: number,
  pageBreakOffsets: readonly number[] = []
): ReadingPage[] {
  if (!content) {
    return [];
  }

  const lines = createReadingLines(content, Math.max(2, Math.floor(maxWidth)));
  const pageLineCount = Math.max(1, Math.floor(maxLines));
  const pages: ReadingPage[] = [];
  const forcedBreakOffsets = new Set(pageBreakOffsets);
  let pageLines: ReadingLine[] = [];

  lines.forEach((line) => {
    const shouldBreakBeforeLine =
      pageLines.length > 0 &&
      (pageLines.length >= pageLineCount || forcedBreakOffsets.has(line.startOffset));

    if (shouldBreakBeforeLine) {
      pages.push(createReadingPage(pageLines));
      pageLines = [];
    }

    pageLines.push(line);
  });

  if (pageLines.length > 0) {
    pages.push(createReadingPage(pageLines));
  }

  return pages;
}

export function findReadingPageIndex(pages: ReadingPage[], characterOffset: number): number {
  return findLastIndexAtOrBelow(pages, characterOffset);
}

export function getNextReadingPageIndex(pages: ReadingPage[], currentIndex: number): number {
  return Math.min(Math.max(currentIndex, 0) + 1, Math.max(pages.length - 1, 0));
}

export function getPreviousReadingPageIndex(pages: ReadingPage[], currentIndex: number): number {
  return Math.max(Math.min(currentIndex, Math.max(pages.length - 1, 0)) - 1, 0);
}

function createReadingLines(content: string, maxWidth: number): ReadingLine[] {
  const sourceLines = content.split("\n");
  const lines: ReadingLine[] = [];
  let offset = 0;

  sourceLines.forEach((sourceLine, sourceLineIndex) => {
    const characters = [...sourceLine];
    const hasTrailingNewline = sourceLineIndex < sourceLines.length - 1;

    if (characters.length === 0) {
      offset += hasTrailingNewline ? 1 : 0;
      return;
    }

    let lineStartIndex = 0;
    let lineWidth = 0;

    characters.forEach((character, characterIndex) => {
      const characterWidth = getTerminalWidth(character);

      if (characterIndex > lineStartIndex && lineWidth + characterWidth > maxWidth) {
        lines.push({
          text: characters.slice(lineStartIndex, characterIndex).join(""),
          startOffset: offset + lineStartIndex,
          endOffset: offset + characterIndex,
        });
        lineStartIndex = characterIndex;
        lineWidth = 0;
      }

      lineWidth += characterWidth;
    });

    lines.push({
      text: characters.slice(lineStartIndex).join(""),
      startOffset: offset + lineStartIndex,
      endOffset: offset + characters.length + (hasTrailingNewline ? 1 : 0),
    });
    offset += characters.length + (hasTrailingNewline ? 1 : 0);
  });

  return lines;
}

function createReadingPage(lines: ReadingLine[]): ReadingPage {
  const firstLine = lines[0]!;
  const lastLine = lines.at(-1)!;

  return {
    startOffset: firstLine.startOffset,
    endOffset: lastLine.endOffset,
    lines: lines.map((line) => line.text),
  };
}
