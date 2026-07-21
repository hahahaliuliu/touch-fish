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

function locateVocabularyBooks(): LocatedVocabularyBook[] {
  const vocabularyDirectory = resolveAssetPath("vocabulary");
  const filePaths = getVocabularyFilePaths(vocabularyDirectory);
  const books = filePaths.map(loadVocabularyBookFile);

  validateUniqueBookIds(books);

  return books;
}

function getVocabularyFilePaths(vocabularyDirectory: string): string[] {
  if (!fs.existsSync(vocabularyDirectory)) {
    throw new Error(`Vocabulary directory not found: ${vocabularyDirectory}`);
  }

  const fileNames = fs
    .readdirSync(vocabularyDirectory)
    .filter((fileName) => fileName.endsWith(".json"));
  const localFileNames = fileNames.filter(
    (fileName) => !fileName.endsWith(".example.json")
  );
  const selectedFileNames = localFileNames.length > 0 ? localFileNames : fileNames;

  if (selectedFileNames.length === 0) {
    throw new Error(
      [
        `No vocabulary books found in: ${vocabularyDirectory}`,
        "",
        "Add a vocabulary JSON file or restore an example vocabulary file.",
      ].join("\n")
    );
  }

  return selectedFileNames
    .sort((left, right) => left.localeCompare(right))
    .map((fileName) => resolveAssetPath("vocabulary", fileName));
}

function loadVocabularyBookFile(filePath: string): LocatedVocabularyBook {
  let vocabularyBook: unknown;

  try {
    vocabularyBook = JSON.parse(fs.readFileSync(filePath, "utf-8")) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Unable to read vocabulary file: ${filePath}\n- ${message}`);
  }

  const errors = validateVocabularyBook(vocabularyBook);

  if (errors.length > 0) {
    throw new Error(
      [
        `Invalid vocabulary book format: ${filePath}`,
        ...errors.map((error) => `- ${error}`),
      ].join("\n")
    );
  }

  return {
    book: vocabularyBook as VocabularyBook,
    filePath,
  };
}

function validateUniqueBookIds(books: LocatedVocabularyBook[]) {
  const pathsById = new Map<string, string>();

  books.forEach(({ book, filePath }) => {
    const existingPath = pathsById.get(book.id);

    if (existingPath) {
      throw new Error(
        [
          `Duplicate vocabulary book id: ${book.id}`,
          `- ${existingPath}`,
          `- ${filePath}`,
        ].join("\n")
      );
    }

    pathsById.set(book.id, filePath);
  });
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
  requireOptionalString(value.partOfSpeech, `${pathName}.partOfSpeech`, errors);
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
