import fs from "node:fs";
import path from "node:path";
import { resolveAssetPath } from "../config/paths.js";
import type { DownloadableVocabularyBook } from "../models/vocabularyCatalog.js";
import type { VocabularyBook } from "../models/word.js";
import { deleteWordProgress } from "../storage/progress.js";
import { parseVocabularyBook, removeVocabularyBook } from "./vocabularyLoader.js";
import {
  parseImportedPdf,
  parseImportedVocabulary,
} from "./vocabularyImportParser.js";

export async function downloadVocabularyBook(
  entry: DownloadableVocabularyBook
): Promise<VocabularyBook> {
  if (entry.availability !== "available" || !entry.downloadUrl) {
    throw new Error(`${entry.name} is not available to download yet`);
  }

  let response: Response;

  try {
    response = await fetch(entry.downloadUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Unable to download ${entry.name}\n- ${message}`);
  }

  if (!response.ok) {
    throw new Error(`Unable to download ${entry.name}\n- ${response.status} ${response.statusText}`);
  }

  const content = await response.text();
  const vocabularyBook = parseVocabularyBook(content, entry.downloadUrl);

  if (vocabularyBook.id !== entry.id) {
    throw new Error(
      `Downloaded vocabulary id does not match catalog entry\n- expected: ${entry.id}\n- received: ${vocabularyBook.id}`
    );
  }

  installVocabularyBook(vocabularyBook, content);
  return vocabularyBook;
}

export async function importVocabularyBook(sourcePath: string): Promise<VocabularyBook> {
  const normalizedPath = sourcePath.trim().replace(/^"|"$/g, "");

  if (!normalizedPath) {
    throw new Error("Enter the full path to a vocabulary JSON, TXT, CSV, or PDF file");
  }

  if (!fs.existsSync(normalizedPath)) {
    throw new Error(`Vocabulary file not found: ${normalizedPath}`);
  }

  const extension = path.extname(normalizedPath).toLowerCase();
  const vocabularyBook = extension === ".pdf"
    ? await parseImportedPdf(fs.readFileSync(normalizedPath), normalizedPath)
    : parseImportedVocabulary(fs.readFileSync(normalizedPath, "utf-8"), normalizedPath);

  installVocabularyBook(vocabularyBook, JSON.stringify(vocabularyBook, null, 2));
  return vocabularyBook;
}

export function uninstallVocabularyBook(bookId: string) {
  const removedBook = removeVocabularyBook(bookId);
  deleteWordProgress(bookId);
  return removedBook;
}

function installVocabularyBook(vocabularyBook: VocabularyBook, content: string) {
  const destinationPath = getDestinationPath(vocabularyBook.id);

  if (fs.existsSync(destinationPath)) {
    throw new Error(`Vocabulary book is already installed: ${vocabularyBook.id}`);
  }

  const directory = path.dirname(destinationPath);
  const temporaryPath = `${destinationPath}.download`;

  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }

  try {
    fs.writeFileSync(temporaryPath, `${content.trim()}\n`, "utf-8");
    fs.renameSync(temporaryPath, destinationPath);
  } finally {
    if (fs.existsSync(temporaryPath)) {
      fs.unlinkSync(temporaryPath);
    }
  }

}

function getDestinationPath(bookId: string): string {
  return resolveAssetPath("vocabulary", `${encodeURIComponent(bookId)}.json`);
}
