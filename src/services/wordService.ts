import type { Word } from "../models/word.js";
import { loadWordProgress, saveWordProgress } from "../storage/progress.js";
import { loadVocabulary } from "./vocabularyLoader.js";
import { DEFAULT_WORKSPACE_SIZE } from "../config/workspace.js";

const words: Word[] = loadVocabulary();

const workspaceSize = DEFAULT_WORKSPACE_SIZE;

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