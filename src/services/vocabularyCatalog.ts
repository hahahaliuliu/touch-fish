import fs from "node:fs";
import { resolveAssetPath } from "../config/paths.js";
import { VOCABULARY_CATALOG_URL } from "../config/vocabularyCatalog.js";
import type {
  DownloadableVocabularyBook,
  VocabularyCatalog,
} from "../models/vocabularyCatalog.js";

export async function loadVocabularyCatalog(): Promise<DownloadableVocabularyBook[]> {
  try {
    return parseVocabularyCatalog(await fetchCatalogContent(), VOCABULARY_CATALOG_URL);
  } catch (error) {
    return loadBundledVocabularyCatalog(error);
  }
}

async function fetchCatalogContent(): Promise<string> {
  let response: Response;

  try {
    response = await fetch(VOCABULARY_CATALOG_URL);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Unable to reach vocabulary catalog\n- ${message}`);
  }

  if (!response.ok) {
    throw new Error(
      `Unable to load vocabulary catalog\n- ${response.status} ${response.statusText}`
    );
  }

  return response.text();
}

function loadBundledVocabularyCatalog(remoteError: unknown): DownloadableVocabularyBook[] {
  const catalogPath = resolveAssetPath("catalog.json");

  try {
    return parseVocabularyCatalog(fs.readFileSync(catalogPath, "utf-8"), catalogPath);
  } catch {
    throw remoteError;
  }
}

function parseVocabularyCatalog(content: string, sourceName: string): DownloadableVocabularyBook[] {
  let catalog: unknown;

  try {
    catalog = JSON.parse(content) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid vocabulary catalog JSON: ${sourceName}\n- ${message}`);
  }

  const errors = validateVocabularyCatalog(catalog);

  if (errors.length > 0) {
    throw new Error(
      [`Invalid vocabulary catalog: ${sourceName}`, ...errors.map((error) => `- ${error}`)].join("\n")
    );
  }

  return (catalog as VocabularyCatalog).books;
}

function validateVocabularyCatalog(value: unknown): string[] {
  if (!isRecord(value)) {
    return ["catalog must be a JSON object"];
  }

  const errors: string[] = [];

  if (!isPositiveInteger(value.version)) {
    errors.push("version must be a positive whole number");
  }

  if (!Array.isArray(value.books)) {
    errors.push("books must be an array");
    return errors;
  }

  const ids = new Set<string>();

  value.books.forEach((book, index) => {
    const prefix = `books[${index}]`;

    if (!isRecord(book)) {
      errors.push(`${prefix} must be a JSON object`);
      return;
    }

    if (!isBookId(book.id)) {
      errors.push(`${prefix}.id must use lowercase letters, numbers, and hyphens`);
    } else if (ids.has(book.id)) {
      errors.push(`${prefix}.id is duplicated: ${book.id}`);
    } else {
      ids.add(book.id);
    }

    requireNonEmptyString(book.name, `${prefix}.name`, errors);
    requireNonEmptyString(book.description, `${prefix}.description`, errors);

    if (!isAvailability(book.availability)) {
      errors.push(`${prefix}.availability must be available or coming-soon`);
      return;
    }

    if (book.wordCount !== undefined && !isPositiveInteger(book.wordCount)) {
      errors.push(`${prefix}.wordCount must be a positive whole number`);
    }

    if (book.availability === "available") {
      if (!isPositiveInteger(book.wordCount)) {
        errors.push(`${prefix}.wordCount must be a positive whole number`);
      }

      if (!isPositiveInteger(book.version)) {
        errors.push(`${prefix}.version must be a positive whole number`);
      }

      requireNonEmptyString(book.license, `${prefix}.license`, errors);
      validateHttpsUrl(book.sourceUrl, `${prefix}.sourceUrl`, errors);
      validateHttpsUrl(book.downloadUrl, `${prefix}.downloadUrl`, errors);
    }
  });

  return errors;
}

function isAvailability(value: unknown): value is "available" | "coming-soon" {
  return value === "available" || value === "coming-soon";
}

function isBookId(value: unknown): value is string {
  return typeof value === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

function requireNonEmptyString(value: unknown, path: string, errors: string[]) {
  if (typeof value !== "string" || value.trim() === "") {
    errors.push(`${path} must be a non-empty string`);
  }
}

function validateHttpsUrl(value: unknown, path: string, errors: string[]) {
  if (typeof value !== "string") {
    errors.push(`${path} must be an HTTPS URL`);
    return;
  }

  try {
    if (new URL(value).protocol !== "https:") {
      errors.push(`${path} must be an HTTPS URL`);
    }
  } catch {
    errors.push(`${path} must be an HTTPS URL`);
  }
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
