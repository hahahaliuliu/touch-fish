import fs from "node:fs";
import path from "node:path";
import { resolveAssetPath } from "../config/paths.js";
import type { DisplayMode } from "../models/settings.js";

const progressDirectory = resolveAssetPath("progress");
const legacyProgressPath = resolveAssetPath("progress", "word-progress.json");

export interface WordProgress {
  sequentialIndex: number;
  randomIndex: number;
  randomOrder: number[];
  displayMode?: DisplayMode;
}

export function loadWordProgress(bookId: string): WordProgress {
  const progressPath = getProgressPath(bookId);

  if (!fs.existsSync(progressPath)) {
    migrateLegacyProgress(progressPath);
  }

  if (!fs.existsSync(progressPath)) {
    return createEmptyProgress();
  }

  let data: Record<string, unknown>;

  try {
    const content = fs.readFileSync(progressPath, "utf-8");
    const parsed = JSON.parse(content) as unknown;

    if (!isRecord(parsed)) {
      return createEmptyProgress();
    }

    data = parsed;
  } catch {
    return createEmptyProgress();
  }

  const displayMode = readDisplayMode(data.displayMode);

  return {
    // currentIndex is the format used before separate order progress existed.
    sequentialIndex: readIndex(data.sequentialIndex ?? data.currentIndex),
    randomIndex: readIndex(data.randomIndex),
    randomOrder: readRandomOrder(data.randomOrder),
    ...(displayMode ? { displayMode } : {}),
  };
}

export function saveWordProgress(bookId: string, progress: WordProgress) {
  const progressPath = getProgressPath(bookId);
  const dir = path.dirname(progressPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(
    progressPath,
    JSON.stringify(
      {
        ...progress,
        updatedAt: new Date().toISOString(),
      },
      null,
      2
    ),
    "utf-8"
  );
}

export function deleteWordProgress(bookId: string) {
  const progressPath = getProgressPath(bookId);

  if (fs.existsSync(progressPath)) {
    fs.unlinkSync(progressPath);
  }
}

function getProgressPath(bookId: string): string {
  return path.join(progressDirectory, `${encodeURIComponent(bookId)}.json`);
}

function migrateLegacyProgress(progressPath: string) {
  if (!fs.existsSync(legacyProgressPath)) {
    return;
  }

  const dir = path.dirname(progressPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.renameSync(legacyProgressPath, progressPath);
}

function createEmptyProgress(): WordProgress {
  return {
    sequentialIndex: 0,
    randomIndex: 0,
    randomOrder: [],
  };
}

function readIndex(value: unknown): number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : 0;
}

function readRandomOrder(value: unknown): number[] {
  if (!Array.isArray(value) || !value.every((item) => Number.isInteger(item))) {
    return [];
  }

  return value as number[];
}

function readDisplayMode(value: unknown): DisplayMode | undefined {
  return value === "both" || value === "english" || value === "chinese"
    ? value
    : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
