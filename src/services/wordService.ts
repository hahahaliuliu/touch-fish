import type { Word } from "../models/word.js";
import { loadWordProgress, saveWordProgress } from "../storage/progress.js";
import { loadSettings } from "./settingsLoader.js";
import { loadVocabulary } from "./vocabularyLoader.js";

const words: Word[] = loadVocabulary();
const settings = loadSettings();

let workspaceSize = settings.workspaceSize;

let currentIndex = loadWordProgress();

export function getCurrentWords(): Word[] {
  return words.slice(currentIndex, currentIndex + workspaceSize);
}

export function nextWordGroup(): Word[] {
  currentIndex = (currentIndex + workspaceSize) % words.length;
  return getCurrentWords();
}

export function previousWordGroup(): Word[] {
  currentIndex = (currentIndex - workspaceSize + words.length) % words.length;
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
}
