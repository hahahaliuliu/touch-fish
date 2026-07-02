import fs from "node:fs";
import path from "node:path";
import type { Word } from "../models/word.js";

export function loadVocabulary(): Word[] {
  const vocabularyPath = path.resolve("assets/vocabulary/ielts.json");
  const fileContent = fs.readFileSync(vocabularyPath, "utf-8");

  return JSON.parse(fileContent) as Word[];
}