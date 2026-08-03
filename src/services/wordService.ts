import type { DisplayMode, StudyOrder } from "../models/settings.js";
import type { Word } from "../models/word.js";
import {
  loadWordProgress,
  saveWordProgress,
} from "../storage/progress.js";
import { loadWordNotes, saveWordNote } from "../storage/notes.js";
import { createRandomOrder } from "./randomOrder.js";
import { loadSettings } from "./settingsLoader.js";
import { loadVocabularyBook } from "./vocabularyLoader.js";
import { getNextPageIndex, getPreviousPageIndex } from "./workspaceNavigation.js";

let settings = loadSettings();
let vocabularyBook = loadVocabularyBook(settings.activeVocabularyBook);
let words: Word[] = vocabularyBook.words;
let wordNotes = loadWordNotes(vocabularyBook.id, words);
let sequentialOrder = words.map((_, index) => index);

let workspaceSize = settings.workspaceSize;
let studyGroupSize = settings.dailyWordCount;
let studyGroupEnabled = settings.studyGroupEnabled;
let navigationLoop = settings.navigationLoop;
let studyOrder = settings.studyOrder;
let theme = settings.theme;
let progress = loadWordProgress(vocabularyBook.id, words.length);
let wordOrder = getWordOrder();
let currentIndex = alignToPageStart(getSavedIndex());

export function getCurrentWords(): Word[] {
  return wordOrder
    .slice(currentIndex, Math.min(currentIndex + workspaceSize, getCurrentGroupEnd()))
    .map(getWordWithNote)
    .filter((word): word is Word => word !== undefined);
}

export function getCurrentStudyGroupWords(): Word[] {
  return wordOrder
    .slice(getCurrentGroupStart(), getCurrentGroupEnd())
    .map(getWordWithNote)
    .filter((word): word is Word => word !== undefined);
}

export function saveCurrentWordNote(pageWordIndex: number, note: string): Word | undefined {
  const wordIndex = wordOrder[currentIndex + pageWordIndex];
  const word = wordIndex === undefined ? undefined : words[wordIndex];

  if (word === undefined || wordIndex === undefined) {
    return undefined;
  }

  saveWordNote(vocabularyBook.id, wordIndex, word.english, note);

  if (note.trim()) {
    wordNotes.set(wordIndex, note.trim());
  } else {
    wordNotes.delete(wordIndex);
  }

  return getWordWithNote(wordIndex);
}

export function nextWordGroup(): Word[] {
  currentIndex = getNextPageIndex({
    currentIndex,
    workspaceSize,
    rangeStart: getCurrentGroupStart(),
    rangeEnd: getCurrentGroupEnd(),
    navigationLoop,
  });

  return getCurrentWords();
}

export function previousWordGroup(): Word[] {
  currentIndex = getPreviousPageIndex({
    currentIndex,
    workspaceSize,
    rangeStart: getCurrentGroupStart(),
    rangeEnd: getCurrentGroupEnd(),
    navigationLoop,
  });

  return getCurrentWords();
}

export function nextStudyGroup(): Word[] {
  if (!studyGroupEnabled) {
    return getCurrentWords();
  }

  const nextGroupStart = getCurrentGroupStart() + studyGroupSize;

  if (nextGroupStart < words.length) {
    currentIndex = nextGroupStart;
  }

  return getCurrentWords();
}

export function previousStudyGroup(): Word[] {
  if (!studyGroupEnabled) {
    return getCurrentWords();
  }

  const previousGroupStart = getCurrentGroupStart() - studyGroupSize;

  if (previousGroupStart >= 0) {
    currentIndex = previousGroupStart;
  }

  return getCurrentWords();
}

export function getWordProgress() {
  return {
    current: currentIndex + 1,
    total: words.length,
    workspaceSize,
    studyGroupStart: getCurrentGroupStart() + 1,
    studyGroupEnd: getCurrentGroupEnd(),
    studyGroupCurrent: studyGroupEnabled
      ? Math.floor(getCurrentGroupStart() / studyGroupSize) + 1
      : 1,
    studyGroupTotal: studyGroupEnabled ? Math.ceil(words.length / studyGroupSize) : 1,
    studyGroupEnabled,
    navigationLoop,
    studyOrder,
    theme,
  };
}

export function saveCurrentWordProgress() {
  updateSavedIndex();
  saveWordProgress(vocabularyBook.id, progress);
}

export function getSavedDisplayMode(): DisplayMode {
  return progress.displayMode ?? settings.displayMode;
}

export function saveDisplayMode(displayMode: DisplayMode) {
  updateSavedIndex();
  progress = { ...progress, displayMode };
  saveWordProgress(vocabularyBook.id, progress);
}

export function reloadWordSettings() {
  updateSavedIndex();
  saveWordProgress(vocabularyBook.id, progress);

  const updatedSettings = loadSettings();

  settings = updatedSettings;
  vocabularyBook = loadVocabularyBook(settings.activeVocabularyBook);
  words = vocabularyBook.words;
  wordNotes = loadWordNotes(vocabularyBook.id, words);
  sequentialOrder = words.map((_, index) => index);
  progress = loadWordProgress(vocabularyBook.id, words.length);
  workspaceSize = updatedSettings.workspaceSize;
  studyGroupSize = updatedSettings.dailyWordCount;
  studyGroupEnabled = updatedSettings.studyGroupEnabled;
  navigationLoop = updatedSettings.navigationLoop;
  studyOrder = updatedSettings.studyOrder;
  theme = updatedSettings.theme;
  wordOrder = getWordOrder();
  currentIndex = alignToPageStart(getSavedIndex());
}

function getWordOrder(): number[] {
  if (studyOrder === "sequential") {
    return sequentialOrder;
  }

  if (!isValidRandomOrder(progress.randomOrder)) {
    progress = {
      ...progress,
      randomIndex: 0,
      randomOrder: createRandomOrder(words.length),
    };
  }

  return progress.randomOrder;
}

function getWordWithNote(wordIndex: number): Word | undefined {
  const word = words[wordIndex];

  if (!word) {
    return undefined;
  }

  const localNote = wordNotes.get(wordIndex);

  return localNote === undefined ? word : { ...word, note: localNote };
}

function getSavedIndex(): number {
  return studyOrder === "random" ? progress.randomIndex : progress.sequentialIndex;
}

function updateSavedIndex() {
  progress = {
    ...progress,
    ...(studyOrder === "random"
      ? { randomIndex: currentIndex }
      : { sequentialIndex: currentIndex }),
  };
}

function alignToPageStart(index: number) {
  const safeIndex = Math.min(Math.max(index, 0), Math.max(words.length - 1, 0));
  const groupStart = studyGroupEnabled
    ? Math.floor(safeIndex / studyGroupSize) * studyGroupSize
    : 0;

  return groupStart + Math.floor((safeIndex - groupStart) / workspaceSize) * workspaceSize;
}

function getCurrentGroupStart() {
  if (!studyGroupEnabled) {
    return 0;
  }

  return Math.floor(currentIndex / studyGroupSize) * studyGroupSize;
}

function getCurrentGroupEnd() {
  if (!studyGroupEnabled) {
    return words.length;
  }

  return Math.min(getCurrentGroupStart() + studyGroupSize, words.length);
}

function isValidRandomOrder(order: number[]): boolean {
  if (order.length !== words.length) {
    return false;
  }

  const seen = new Set(order);

  return (
    seen.size === words.length &&
    order.every((index) => Number.isInteger(index) && index >= 0 && index < words.length)
  );
}
