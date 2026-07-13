import type { Settings } from "../models/settings.js";

export const DEFAULT_SETTINGS: Settings = {
  dailyWordCount: 20,
  workspaceSize: 3,
  studyGroupEnabled: true,
  navigationLoop: false,
  studyOrder: "sequential",
  activeVocabularyBook: "ielts-basic",
  displayMode: "english",
  theme: "build-log",
  visibleFields: {
    phonetic: false,
    example: false,
    partOfSpeech: false,
    note: false,
    tags: false,
  },
  keyBindings: {
    previous: "a",
    next: "d",
    repeat: "space",
    switchDisplayMode: "tab",
    toggleHelp: "?",
    quit: "q",
  },
};
