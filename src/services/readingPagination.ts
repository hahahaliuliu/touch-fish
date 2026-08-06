import type { ReadingPage } from "../models/reading.js";
import { getTerminalWidth } from "../ui/terminalText.js";

interface ReadingLine {
  text: string;
  startOffset: number;
  endOffset: number;
}

export function paginateReadingText(
  content: string,
  maxWidth: number,
  maxLines: number
): ReadingPage[] {
  if (!content) {
    return [];
  }

  const lines = createReadingLines(content, Math.max(2, Math.floor(maxWidth)));
  const pageLineCount = Math.max(1, Math.floor(maxLines));
  const pages: ReadingPage[] = [];

  for (let index = 0; index < lines.length; index += pageLineCount) {
    const pageLines = lines.slice(index, index + pageLineCount);
    const firstLine = pageLines[0]!;
    const lastLine = pageLines.at(-1)!;

    pages.push({
      startOffset: firstLine.startOffset,
      endOffset: lastLine.endOffset,
      lines: pageLines.map((line) => line.text),
    });
  }

  return pages;
}

export function findReadingPageIndex(pages: ReadingPage[], characterOffset: number): number {
  if (pages.length === 0) {
    return 0;
  }

  const normalizedOffset = Math.max(0, Math.floor(characterOffset));
  const matchingIndex = pages.findIndex(
    (page) => normalizedOffset >= page.startOffset && normalizedOffset < page.endOffset
  );

  return matchingIndex === -1 ? pages.length - 1 : matchingIndex;
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
      lines.push({
        text: "",
        startOffset: offset,
        endOffset: offset + (hasTrailingNewline ? 1 : 0),
      });
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
