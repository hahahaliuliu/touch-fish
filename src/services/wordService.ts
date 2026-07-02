import type { Word } from "../models/word.js";
import { loadWordProgress, saveWordProgress } from "../storage/progress.js";
import { loadVocabulary } from "./vocabularyLoader.js";

const words: Word[] = loadVocabulary();

let currentIndex = loadWordProgress();

export function getCurrentWord(): Word {
  const word = words[currentIndex];

  if (!word) {
    currentIndex = 0;
    return words[0];
  }

  return word;
}

export function nextWord(): Word {
  currentIndex = (currentIndex + 1) % words.length;
  return getCurrentWord();
}

export function previousWord(): Word {
  currentIndex = (currentIndex - 1 + words.length) % words.length;
  return getCurrentWord();
}

export function getWordProgress() {
  return {
    current: currentIndex + 1,
    total: words.length,
  };
}

export function saveCurrentWordProgress() {
  saveWordProgress(currentIndex);
}