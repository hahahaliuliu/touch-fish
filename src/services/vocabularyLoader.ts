import fs from "node:fs";
import { resolveAssetPath } from "../config/paths.js";
import type {
  VocabularyBook,
  VocabularyBookSummary,
  Word,
} from "../models/word.js";

interface LocatedVocabularyBook {
  book: VocabularyBook;
  filePath: string;
}

export function loadVocabulary(bookId: string): Word[] {
  return loadVocabularyBook(bookId).words;
}

export function loadVocabularyBook(bookId: string): VocabularyBook {
  const books = locateVocabularyBooks();

  if (books.length === 0) {
    throw new Error(
      [
        "No vocabulary books are installed.",
        "",
        "Open `touchfish word -s` and choose Download or Import Vocabulary.",
      ].join("\n")
    );
  }

  const selectedBook = books.find(({ book }) => book.id === bookId);

  if (!selectedBook) {
    return books[0]!.book;
  }

  return selectedBook.book;
}

export function listVocabularyBooks(): VocabularyBookSummary[] {
  return locateVocabularyBooks().map(({ book }) => ({
    id: book.id,
    name: book.name,
    wordCount: book.words.length,
  }));
}

export function removeVocabularyBook(bookId: string): VocabularyBookSummary {
  const locatedBook = locateVocabularyBooks().find(({ book }) => book.id === bookId);

  if (!locatedBook) {
    throw new Error(`Vocabulary book is not installed: ${bookId}`);
  }

  fs.unlinkSync(locatedBook.filePath);

  return {
    id: locatedBook.book.id,
    name: locatedBook.book.name,
    wordCount: locatedBook.book.words.length,
  };
}

function locateVocabularyBooks(): LocatedVocabularyBook[] {
  const vocabularyDirectory = resolveAssetPath("vocabulary");
  const filePaths = getVocabularyFilePaths(vocabularyDirectory);
  const books = filePaths.map(loadVocabularyBookFile);

  return resolveDuplicateBookIds(books);
}

function getVocabularyFilePaths(vocabularyDirectory: string): string[] {
  if (!fs.existsSync(vocabularyDirectory)) {
    throw new Error(`Vocabulary directory not found: ${vocabularyDirectory}`);
  }

  const fileNames = fs
    .readdirSync(vocabularyDirectory)
    .filter((fileName) => fileName.endsWith(".json"));
  return fileNames
    .sort((left, right) => left.localeCompare(right))
    .map((fileName) => resolveAssetPath("vocabulary", fileName));
}

function loadVocabularyBookFile(filePath: string): LocatedVocabularyBook {
  try {
    return {
      book: parseVocabularyBook(fs.readFileSync(filePath, "utf-8"), filePath),
      filePath,
    };
  } catch (error) {
    if (error instanceof VocabularyFormatError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Unable to read vocabulary file: ${filePath}\n- ${message}`);
  }
}

export function parseVocabularyBook(content: string, sourceName: string): VocabularyBook {
  let vocabularyBook: unknown;

  try {
    vocabularyBook = JSON.parse(content) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new VocabularyFormatError(`Invalid vocabulary book JSON: ${sourceName}\n- ${message}`);
  }

  const errors = validateVocabularyBook(vocabularyBook);

  if (errors.length > 0) {
    throw new VocabularyFormatError(
      [
        `Invalid vocabulary book format: ${sourceName}`,
        ...errors.map((error) => `- ${error}`),
      ].join("\n")
    );
  }

  return vocabularyBook as VocabularyBook;
}

class VocabularyFormatError extends Error {}

function resolveDuplicateBookIds(books: LocatedVocabularyBook[]): LocatedVocabularyBook[] {
  const pathsById = new Map<string, string>();
  const booksById = new Map<string, LocatedVocabularyBook>();

  books.forEach((locatedBook) => {
    const { book, filePath } = locatedBook;
    const existingPath = pathsById.get(book.id);

    if (existingPath) {
      const existingBook = booksById.get(book.id)!;

      if (isBundledExample(existingBook.filePath)) {
        booksById.set(book.id, locatedBook);
        pathsById.set(book.id, filePath);
        return;
      }

      if (isBundledExample(filePath)) {
        return;
      }

      throw new Error(
        [
          `Duplicate vocabulary book id: ${book.id}`,
          `- ${existingPath}`,
          `- ${filePath}`,
        ].join("\n")
      );
    }

    pathsById.set(book.id, filePath);
    booksById.set(book.id, locatedBook);
  });

  return [...booksById.values()];
}

function isBundledExample(filePath: string): boolean {
  return filePath.endsWith(".example.json");
}

function validateVocabularyBook(value: unknown): string[] {
  const errors: string[] = [];

  if (!isRecord(value)) {
    return ["book must be a JSON object"];
  }

  requireNonEmptyString(value.id, "id", errors);
  requireNonEmptyString(value.name, "name", errors);

  if (value.description !== undefined) {
    requireString(value.description, "description", errors);
  }

  if (typeof value.version !== "number") {
    errors.push("version must be a number");
  }

  validateLanguage(value.language, errors);
  validateWords(value.words, errors);

  return errors;
}

function validateLanguage(value: unknown, errors: string[]) {
  if (!isRecord(value)) {
    errors.push("language must be a JSON object");
    return;
  }

  requireNonEmptyString(value.source, "language.source", errors);
  requireNonEmptyString(value.target, "language.target", errors);
}

function validateWords(value: unknown, errors: string[]) {
  if (!Array.isArray(value)) {
    errors.push("words must be an array");
    return;
  }

  value.forEach((word, index) => {
    validateWord(word, `words[${index}]`, errors);
  });
}

function validateWord(value: unknown, pathName: string, errors: string[]) {
  if (!isRecord(value)) {
    errors.push(`${pathName} must be a JSON object`);
    return;
  }

  requireNonEmptyString(value.english, `${pathName}.english`, errors);
  requireNonEmptyString(value.chinese, `${pathName}.chinese`, errors);
  requireOptionalString(value.phonetic, `${pathName}.phonetic`, errors);
  requireOptionalString(value.example, `${pathName}.example`, errors);
  requireOptionalString(value.note, `${pathName}.note`, errors);

  if (value.tags !== undefined) {
    validateTags(value.tags, `${pathName}.tags`, errors);
  }
}

function validateTags(value: unknown, pathName: string, errors: string[]) {
  if (!Array.isArray(value)) {
    errors.push(`${pathName} must be an array`);
    return;
  }

  value.forEach((tag, index) => {
    if (typeof tag !== "string") {
      errors.push(`${pathName}[${index}] must be a string`);
    }
  });
}

function requireNonEmptyString(
  value: unknown,
  pathName: string,
  errors: string[]
) {
  if (typeof value !== "string" || value.trim() === "") {
    errors.push(`${pathName} must be a non-empty string`);
  }
}

function requireOptionalString(
  value: unknown,
  pathName: string,
  errors: string[]
) {
  if (value !== undefined) {
    requireString(value, pathName, errors);
  }
}

function requireString(value: unknown, pathName: string, errors: string[]) {
  if (typeof value !== "string") {
    errors.push(`${pathName} must be a string`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
