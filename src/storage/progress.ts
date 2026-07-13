import fs from "node:fs";
import path from "node:path";
import { resolveAssetPath } from "../config/paths.js";
import type { DisplayMode } from "../models/settings.js";

const progressPath = resolveAssetPath("progress", "word-progress.json");

export interface WordProgress {
  sequentialIndex: number;
  randomIndex: number;
  randomOrder: number[];
  displayMode?: DisplayMode;
}

export function loadWordProgress(): WordProgress {
  if (!fs.existsSync(progressPath)) {
    return createEmptyProgress();
  }

  const content = fs.readFileSync(progressPath, "utf-8");
  const data = JSON.parse(content) as Record<string, unknown>;

  const displayMode = readDisplayMode(data.displayMode);

  return {
    // currentIndex is the format used before separate order progress existed.
    sequentialIndex: readIndex(data.sequentialIndex ?? data.currentIndex),
    randomIndex: readIndex(data.randomIndex),
    randomOrder: readRandomOrder(data.randomOrder),
    ...(displayMode ? { displayMode } : {}),
  };
}

export function saveWordProgress(progress: WordProgress) {
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
