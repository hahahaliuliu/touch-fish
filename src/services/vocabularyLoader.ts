import fs from "node:fs";
import path from "node:path";
import type { VocabularyBook, Word } from "../models/word.js";

export function loadVocabulary(): Word[] {
  const vocabularyPath = path.resolve("assets/vocabulary/ielts.json");
  const fileContent = fs.readFileSync(vocabularyPath, "utf-8");
  const vocabularyBook = JSON.parse(fileContent) as VocabularyBook;

  if (!isVocabularyBook(vocabularyBook)) {
    throw new Error(`Invalid vocabulary book format: ${vocabularyPath}`);
  }

  return vocabularyBook.words;
}

function isVocabularyBook(value: VocabularyBook): value is VocabularyBook {
  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.version === "number" &&
    typeof value.language?.source === "string" &&
    typeof value.language?.target === "string" &&
    Array.isArray(value.words) &&
    value.words.every(isWord)
  );
}

function isWord(value: Word): value is Word {
  return typeof value.english === "string" && typeof value.chinese === "string";
}
