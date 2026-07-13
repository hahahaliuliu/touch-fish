import type { Word } from "../models/word.js";
import { loadWordProgress, saveWordProgress } from "../storage/progress.js";
import { loadSettings } from "./settingsLoader.js";
import { loadVocabulary } from "./vocabularyLoader.js";

const words: Word[] = loadVocabulary();
const settings = loadSettings();

let workspaceSize = settings.workspaceSize;
let studyGroupSize = settings.dailyWordCount;
let studyGroupEnabled = settings.studyGroupEnabled;
let navigationLoop = settings.navigationLoop;

let currentIndex = alignToPageStart(loadWordProgress());

export function getCurrentWords(): Word[] {
  return words.slice(
    currentIndex,
    Math.min(currentIndex + workspaceSize, getCurrentGroupEnd())
  );
}

export function nextWordGroup(): Word[] {
  const nextIndex = currentIndex + workspaceSize;

  if (nextIndex >= getCurrentGroupEnd() && navigationLoop) {
    currentIndex = getCurrentGroupStart();
  } else if (nextIndex < getCurrentGroupEnd()) {
    currentIndex = nextIndex;
  }

  return getCurrentWords();
}

export function previousWordGroup(): Word[] {
  const previousIndex = currentIndex - workspaceSize;

  if (previousIndex < getCurrentGroupStart() && navigationLoop) {
    currentIndex = getLastPageStartInCurrentGroup();
  } else if (previousIndex >= getCurrentGroupStart()) {
    currentIndex = previousIndex;
  }

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
  };
}

export function saveCurrentWordProgress() {
  saveWordProgress(currentIndex);
}

export function reloadWordSettings() {
  const updatedSettings = loadSettings();

  workspaceSize = updatedSettings.workspaceSize;
  studyGroupSize = updatedSettings.dailyWordCount;
  studyGroupEnabled = updatedSettings.studyGroupEnabled;
  navigationLoop = updatedSettings.navigationLoop;
  currentIndex = alignToPageStart(currentIndex);
}

function alignToPageStart(index: number) {
  const safeIndex = Math.min(Math.max(index, 0), Math.max(words.length - 1, 0));
  const groupStart = Math.floor(safeIndex / studyGroupSize) * studyGroupSize;

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

function getLastPageStartInCurrentGroup() {
  const groupStart = getCurrentGroupStart();
  const groupLength = getCurrentGroupEnd() - groupStart;

  return groupStart + Math.floor((groupLength - 1) / workspaceSize) * workspaceSize;
}
