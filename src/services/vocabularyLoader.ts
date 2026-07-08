import fs from "node:fs";
import { resolveAssetPath } from "../config/paths.js";
import type { VocabularyBook, Word } from "../models/word.js";

export function loadVocabulary(): Word[] {
  const vocabularyPath = resolveAssetPath("vocabulary", "ielts.json");
  const exampleVocabularyPath = resolveAssetPath(
    "vocabulary",
    "ielts.example.json"
  );

  if (!fs.existsSync(vocabularyPath)) {
    throw new Error(
      [
        `Vocabulary file not found: ${vocabularyPath}`,
        "",
        "Create a local vocabulary file by copying:",
        `${exampleVocabularyPath} -> ${vocabularyPath}`,
      ].join("\n")
    );
  }

  const fileContent = fs.readFileSync(vocabularyPath, "utf-8");
  const vocabularyBook = JSON.parse(fileContent) as unknown;
  const errors = validateVocabularyBook(vocabularyBook);

  if (errors.length > 0) {
    throw new Error(
      [
        `Invalid vocabulary book format: ${vocabularyPath}`,
        ...errors.map((error) => `- ${error}`),
      ].join("\n")
    );
  }

  return (vocabularyBook as VocabularyBook).words;
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
