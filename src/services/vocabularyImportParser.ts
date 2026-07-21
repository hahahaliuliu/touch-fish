import { createHash } from "node:crypto";
import path from "node:path";
import type { VocabularyBook, Word } from "../models/word.js";
import { parseVocabularyBook } from "./vocabularyLoader.js";

export function parseImportedVocabulary(content: string, sourcePath: string): VocabularyBook {
  const extension = path.extname(sourcePath).toLowerCase();

  if (extension === ".json") {
    return parseVocabularyBook(content, sourcePath);
  }

  if (extension === ".txt") {
    return createImportedBook(parseTextWords(content, sourcePath), sourcePath);
  }

  if (extension === ".csv") {
    return createImportedBook(parseCsvWords(content, sourcePath), sourcePath);
  }

  throw new Error("Supported vocabulary files are JSON, TXT, and CSV");
}

function createImportedBook(words: Word[], sourcePath: string): VocabularyBook {
  if (words.length === 0) {
    throw new Error(`No vocabulary entries found in: ${sourcePath}`);
  }

  const fileName = path.parse(sourcePath).name;

  return {
    id: createBookId(fileName, sourcePath),
    name: fileName || "Imported Vocabulary",
    description: `Imported from ${path.basename(sourcePath)}.`,
    language: { source: "en", target: "zh-CN" },
    version: 1,
    words,
  };
}

function parseTextWords(content: string, sourcePath: string): Word[] {
  const words: Word[] = [];
  const invalidLines: number[] = [];

  content.split(/\r?\n/).forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }

    const entry = splitTextEntry(trimmed);

    if (!entry) {
      invalidLines.push(index + 1);
      return;
    }

    words.push(entry);
  });

  if (invalidLines.length > 0) {
    throw new Error(
      `Unable to read TXT vocabulary entries in ${sourcePath}\n- invalid lines: ${invalidLines.join(", ")}\n- use: abandon<Tab>放弃 or abandon - 放弃`
    );
  }

  return removeDuplicateWords(words);
}

function splitTextEntry(line: string): Word | undefined {
  const separators = [/\t+/, /\s+[-–—]\s+/, /[,:：]\s*/];

  for (const separator of separators) {
    const parts = line.split(separator, 2).map((part) => part.trim());

    if (parts[0] && parts[1]) {
      return { english: parts[0], chinese: parts[1] };
    }
  }

  return undefined;
}

function parseCsvWords(content: string, sourcePath: string): Word[] {
  const rows = parseCsv(content).filter((row) => row.some((cell) => cell.trim() !== ""));

  if (rows.length === 0) {
    return [];
  }

  const header = rows[0]!.map(normalizeHeader);
  const englishIndex = findColumn(header, ["english", "word", "term", "英文", "单词"]);
  const chineseIndex = findColumn(header, ["chinese", "translation", "meaning", "definition", "中文", "释义", "翻译"]);
  const hasHeader = englishIndex !== -1 && chineseIndex !== -1;
  const startIndex = hasHeader ? 1 : 0;
  const englishColumn = hasHeader ? englishIndex : 0;
  const chineseColumn = hasHeader ? chineseIndex : 1;
  const invalidRows: number[] = [];
  const words: Word[] = [];

  rows.slice(startIndex).forEach((row, index) => {
    const english = row[englishColumn]?.trim();
    const chinese = row[chineseColumn]?.trim();

    if (!english || !chinese) {
      invalidRows.push(index + startIndex + 1);
      return;
    }

    words.push({ english, chinese });
  });

  if (invalidRows.length > 0) {
    throw new Error(
      `Unable to read CSV vocabulary entries in ${sourcePath}\n- missing English or Chinese values in rows: ${invalidRows.join(", ")}`
    );
  }

  return removeDuplicateWords(words);
}

function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index]!;

    if (quoted) {
      if (character === '"') {
        if (content[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += character;
      }
      continue;
    }

    if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  if (quoted) {
    throw new Error("CSV has an unterminated quoted field");
  }

  return rows;
}

function findColumn(headers: string[], candidates: string[]): number {
  return headers.findIndex((header) => candidates.includes(header));
}

function normalizeHeader(value: string): string {
  return value.replace(/^\uFEFF/, "").trim().toLowerCase().replace(/[ _-]/g, "");
}

function removeDuplicateWords(words: Word[]): Word[] {
  const seen = new Set<string>();

  return words.filter((word) => {
    const key = word.english.trim().toLowerCase();

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function createBookId(fileName: string, sourcePath: string): string {
  const normalizedName = fileName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (normalizedName) {
    return normalizedName;
  }

  const digest = createHash("sha256").update(sourcePath).digest("hex").slice(0, 8);
  return `imported-${digest}`;
}
