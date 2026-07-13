import { loadWordProgress, saveWordProgress } from "../storage/progress.js";
import { loadVocabulary } from "./vocabularyLoader.js";

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
  const progress = loadWordProgress();
  const wordCount = loadVocabulary().length;

  saveWordProgress({
    ...progress,
    randomIndex: 0,
    randomOrder: createRandomOrder(wordCount),
  });
}
