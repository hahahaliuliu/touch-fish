import type { Word } from "../models/word.js";
import { loadVocabulary } from "./vocabularyLoader.js";

const words: Word[] = loadVocabulary();

let currentIndex = 0;

export function getCurrentWord(): Word {
  const word = words[currentIndex];

  if (!word) {
    throw new Error("Current word not found.");
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