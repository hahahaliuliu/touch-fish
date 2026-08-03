import { loadWordProgress, saveWordProgress } from "../storage/progress.js";
import { loadSettings } from "./settingsLoader.js";
import { loadVocabularyBook } from "./vocabularyLoader.js";

export function createRandomOrder(wordCount: number): number[] {
  const order = Array.from({ length: wordCount }, (_, index) => index);

  for (let index = order.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    const current = order[index];
    order[index] = order[randomIndex]!;
    order[randomIndex] = current!;
  }

  return order;
}

export function reshuffleRandomOrder() {
  const settings = loadSettings();
  const vocabularyBook = loadVocabularyBook(settings.activeVocabularyBook);
  const progress = loadWordProgress(vocabularyBook.id, vocabularyBook.words.length);

  saveWordProgress(vocabularyBook.id, {
    ...progress,
    randomIndex: 0,
    randomOrder: createRandomOrder(vocabularyBook.words.length),
  });
}
