import fs from "node:fs";
import path from "node:path";
import { resolveAssetPath } from "../config/paths.js";
import type { DisplayMode } from "../models/settings.js";
import {
  isRecord,
  readJsonFile,
  resolveBookJsonPath,
  writeJsonFile,
} from "./jsonFile.js";

const progressDirectory = resolveAssetPath("progress");
const legacyProgressPath = resolveAssetPath("progress", "word-progress.json");

export interface WordProgress {
  sequentialIndex: number;
  reverseIndex: number;
  randomIndex: number;
  randomOrder: number[];
  displayMode?: DisplayMode;
}

export function loadWordProgress(bookId: string, wordCount?: number): WordProgress {
  const progressPath = getProgressPath(bookId);

  if (!fs.existsSync(progressPath)) {
    migrateLegacyProgress(progressPath);
  }

  const data = readJsonFile(progressPath);

  if (!isRecord(data)) {
    return createEmptyProgress();
  }

  const displayMode = readDisplayMode(data.displayMode);

  return {
    // currentIndex is the format used before separate order progress existed.
    sequentialIndex: readIndex(data.sequentialIndex ?? data.currentIndex, wordCount),
    reverseIndex: readIndex(data.reverseIndex, wordCount),
    randomIndex: readIndex(data.randomIndex, wordCount),
    randomOrder: readRandomOrder(data.randomOrder, wordCount),
    ...(displayMode ? { displayMode } : {}),
  };
}

export function saveWordProgress(bookId: string, progress: WordProgress) {
  writeJsonFile(getProgressPath(bookId), {
    ...progress,
    updatedAt: new Date().toISOString(),
  });
}

export function deleteWordProgress(bookId: string) {
  const progressPath = getProgressPath(bookId);

  if (fs.existsSync(progressPath)) {
    fs.unlinkSync(progressPath);
  }
}

function getProgressPath(bookId: string): string {
  return resolveBookJsonPath(progressDirectory, bookId);
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
    reverseIndex: 0,
    randomIndex: 0,
    randomOrder: [],
  };
}

function readIndex(value: unknown, wordCount?: number): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    return 0;
  }

  if (wordCount === undefined) {
    return value;
  }

  return Math.min(value, Math.max(wordCount - 1, 0));
}

function readRandomOrder(value: unknown, wordCount?: number): number[] {
  if (
    !Array.isArray(value) ||
    !value.every(
      (item) =>
        Number.isInteger(item) &&
        (wordCount === undefined || (item >= 0 && item < wordCount))
    )
  ) {
    return [];
  }

  return value as number[];
}

function readDisplayMode(value: unknown): DisplayMode | undefined {
  return value === "both" || value === "english" || value === "chinese"
    ? value
    : undefined;
}
