import fs from "node:fs";
import path from "node:path";
import { resolveAssetPath } from "../config/paths.js";
import type { DownloadableVocabularyBook } from "../models/vocabularyCatalog.js";
import type { VocabularyBook } from "../models/word.js";
import { parseVocabularyBook } from "./vocabularyLoader.js";

export async function downloadVocabularyBook(
  entry: DownloadableVocabularyBook
): Promise<VocabularyBook> {
  if (entry.availability !== "available" || !entry.downloadUrl) {
    throw new Error(`${entry.name} is not available to download yet`);
  }

  const destinationPath = getDestinationPath(entry.id);

  if (fs.existsSync(destinationPath)) {
    throw new Error(`Vocabulary book is already installed: ${entry.id}`);
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

  return vocabularyBook;
}

function getDestinationPath(bookId: string): string {
  return resolveAssetPath("vocabulary", `${encodeURIComponent(bookId)}.json`);
}
