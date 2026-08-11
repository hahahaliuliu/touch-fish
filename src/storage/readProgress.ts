import fs from "node:fs";
import path from "node:path";
import { resolveAssetPath } from "../config/paths.js";
import type { ReadProgress, ReadState } from "../models/reading.js";

const progressDirectory = resolveAssetPath("read-progress");
const statePath = path.join(progressDirectory, "state.json");

export function loadReadProgress(bookId: string, characterCount?: number): ReadProgress {
  const data = readJsonFile(getProgressPath(bookId));

  return {
    characterOffset: readCharacterOffset(data?.characterOffset, characterCount),
  };
}

export function saveReadProgress(bookId: string, progress: ReadProgress) {
  writeJsonAtomically(getProgressPath(bookId), {
    ...progress,
    updatedAt: new Date().toISOString(),
  });
}

export function deleteReadProgress(bookId: string) {
  const progressPath = getProgressPath(bookId);

  if (fs.existsSync(progressPath)) {
    fs.unlinkSync(progressPath);
  }
}

export function loadReadState(): ReadState {
  const data = readJsonFile(statePath);

  return data?.activeBookId && typeof data.activeBookId === "string"
    ? { activeBookId: data.activeBookId }
    : {};
}

export function saveReadState(state: ReadState) {
  writeJsonAtomically(statePath, {
    ...state,
    updatedAt: new Date().toISOString(),
  });
}

function getProgressPath(bookId: string): string {
  return path.join(progressDirectory, `${encodeURIComponent(bookId)}.json`);
}

function readJsonFile(filePath: string): Record<string, unknown> | undefined {
  if (!fs.existsSync(filePath)) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf-8")) as unknown;
    return isRecord(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function writeJsonAtomically(filePath: string, data: Record<string, unknown>) {
  const directory = path.dirname(filePath);

  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }

  const temporaryPath = `${filePath}.tmp`;

  try {
    fs.writeFileSync(temporaryPath, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(temporaryPath, filePath);
  } finally {
    if (fs.existsSync(temporaryPath)) {
      fs.unlinkSync(temporaryPath);
    }
  }
}

function readCharacterOffset(value: unknown, characterCount?: number): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    return 0;
  }

  return characterCount === undefined
    ? value
    : Math.min(value, Math.max(characterCount, 0));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
