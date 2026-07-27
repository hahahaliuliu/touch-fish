import type { Word } from "../models/word.js";

export type QuizDirection = "english-to-chinese" | "chinese-to-english";

export function isGroupQuizAnswerCorrect(
  word: Word,
  direction: QuizDirection,
  answer: string
): boolean {
  if (direction === "chinese-to-english") {
    return normalizeEnglish(answer) === normalizeEnglish(word.english);
  }

  const normalizedAnswer = normalizeChinese(answer);

  return splitChineseMeanings(word.chinese).some(
    (meaning) => normalizeChinese(meaning) === normalizedAnswer
  );
}

function normalizeEnglish(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeChinese(value: string): string {
  return value.trim().replace(/\s+/g, "");
}

function splitChineseMeanings(value: string): string[] {
  return value
    .split(/[;；,，/、]/)
    .map((meaning) => meaning.trim())
    .filter(Boolean);
}
