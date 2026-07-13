import type { Word } from "../models/word.js";
import { loadWordProgress, saveWordProgress } from "../storage/progress.js";
import { loadSettings } from "./settingsLoader.js";
import { loadVocabulary } from "./vocabularyLoader.js";

const words: Word[] = loadVocabulary();
const settings = loadSettings();

let workspaceSize = settings.workspaceSize;

let currentIndex = alignToWorkspaceStart(loadWordProgress());

export function getCurrentWords(): Word[] {
  return words.slice(currentIndex, currentIndex + workspaceSize);
}

export function nextWordGroup(): Word[] {
  const nextIndex = currentIndex + workspaceSize;

  currentIndex = nextIndex >= words.length ? getLastWorkspaceStart() : nextIndex;
  return getCurrentWords();
}

export function previousWordGroup(): Word[] {
  currentIndex = currentIndex <= 0 ? 0 : currentIndex - workspaceSize;
  return getCurrentWords();
}

export function getWordProgress() {
  return {
    current: currentIndex + 1,
    total: words.length,
    workspaceSize,
  };
}

export function saveCurrentWordProgress() {
  saveWordProgress(currentIndex);
}

export function reloadWordSettings() {
  workspaceSize = loadSettings().workspaceSize;
  currentIndex = alignToWorkspaceStart(currentIndex);
}

function alignToWorkspaceStart(index: number) {
  const safeIndex = Math.min(Math.max(index, 0), Math.max(words.length - 1, 0));

  return Math.floor(safeIndex / workspaceSize) * workspaceSize;
}

function getLastWorkspaceStart() {
  return Math.floor((words.length - 1) / workspaceSize) * workspaceSize;
}
