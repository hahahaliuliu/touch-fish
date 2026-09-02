import fs from "node:fs";
import path from "node:path";
import { resolveAssetPath } from "../config/paths.js";
import type { ReadProgress, ReadState } from "../models/reading.js";
import {
  isRecord,
  readJsonFile,
  resolveBookJsonPath,
  writeJsonFile,
} from "./jsonFile.js";

const progressDirectory = resolveAssetPath("read-progress");
const statePath = path.join(progressDirectory, "state.json");

export function loadReadProgress(bookId: string, characterCount?: number): ReadProgress {
  const data = readJsonFile(getProgressPath(bookId));

  return {
    characterOffset: readCharacterOffset(
      isRecord(data) ? data.characterOffset : undefined,
      characterCount
    ),
  };
}

export function saveReadProgress(bookId: string, progress: ReadProgress) {
  writeJsonFile(getProgressPath(bookId), {
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

  return isRecord(data) && typeof data.activeBookId === "string"
    ? { activeBookId: data.activeBookId }
    : {};
}

export function saveReadState(state: ReadState) {
  writeJsonFile(statePath, {
    ...state,
    updatedAt: new Date().toISOString(),
  });
}

function getProgressPath(bookId: string): string {
  return resolveBookJsonPath(progressDirectory, bookId);
}

function readCharacterOffset(value: unknown, characterCount?: number): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    return 0;
  }

  return characterCount === undefined
    ? value
    : Math.min(value, Math.max(characterCount, 0));
}
