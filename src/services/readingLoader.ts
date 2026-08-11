import fs from "node:fs";
import path from "node:path";
import { resolveAssetPath } from "../config/paths.js";
import type { ReadingBook, ReadingBookSummary } from "../models/reading.js";
import { detectReadingChapters } from "./readingChapters.js";

export function listReadingBooks(): ReadingBookSummary[] {
  return getReadingFilePaths().map((filePath) => {
    const book = loadReadingBookFile(filePath);

    return {
      id: book.id,
      title: book.title,
      characterCount: book.characterCount,
    };
  });
}

export function loadReadingBook(bookId?: string): ReadingBook {
  const filePaths = getReadingFilePaths();

  if (filePaths.length === 0) {
    throw new Error("No local TXT novels are available in assets/reading.");
  }

  const selectedPath = bookId
    ? filePaths.find((filePath) => getBookId(filePath) === bookId) ?? filePaths[0]!
    : filePaths[0]!;

  return loadReadingBookFile(selectedPath);
}

export function deleteReadingBook(bookId: string): ReadingBookSummary {
  const filePath = getReadingFilePaths().find((candidatePath) => getBookId(candidatePath) === bookId);

  if (!filePath) {
    throw new Error(`Novel not found: ${bookId}`);
  }

  const book = loadReadingBookFile(filePath);
  fs.unlinkSync(filePath);

  return {
    id: book.id,
    title: book.title,
    characterCount: book.characterCount,
  };
}

function getReadingFilePaths(): string[] {
  const readingDirectory = resolveAssetPath("reading");

  if (!fs.existsSync(readingDirectory)) {
    return [];
  }

  return fs
    .readdirSync(readingDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === ".txt")
    .map((entry) => path.join(readingDirectory, entry.name))
    .sort((left, right) => left.localeCompare(right));
}

function loadReadingBookFile(filePath: string): ReadingBook {
  let content: string;

  try {
    content = normalizeReadingText(fs.readFileSync(filePath, "utf-8"));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Unable to read novel file: ${filePath}\n- ${message}`);
  }

  if (content.trim() === "") {
    throw new Error(`Novel file is empty: ${filePath}`);
  }

  const title = getBookName(filePath);

  return {
    id: getBookId(filePath),
    title,
    sourcePath: filePath,
    content,
    characterCount: [...content].length,
    chapters: detectReadingChapters(content),
  };
}

export function normalizeReadingText(content: string): string {
  return content.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
}

function getBookId(filePath: string): string {
  return getBookName(filePath);
}

function getBookName(filePath: string): string {
  return path.parse(filePath).name.replace(/\.example$/i, "");
}
