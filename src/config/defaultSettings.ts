import type { Settings } from "../models/settings.js";

export const DEFAULT_SETTINGS: Settings = {
  dailyWordCount: 20,
  workspaceSize: 3,
  studyGroupEnabled: true,
  navigationLoop: false,
  studyOrder: "sequential",
  activeVocabularyBook: "ielts-luran",
  displayMode: "english",
  noteMode: "hidden",
  interfaceLanguage: "english",
  theme: "build-log",
  keyBindings: {
    previous: ["a", "arrow-left"],
    next: ["d", "arrow-right"],
    previousGroup: ["[", "arrow-up"],
    nextGroup: ["]", "arrow-down"],
    repeat: ["space", ""],
    switchDisplayMode: ["tab", ""],
    startQuiz: ["t", ""],
    editNote: ["e", ""],
    toggleHelp: ["?", ""],
    quit: ["q", ""],
  },
};
