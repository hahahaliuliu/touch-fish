import type { InterfaceLanguage, ThemeName } from "./settings.js";

export interface ReadingBook {
  id: string;
  title: string;
  sourcePath: string;
  content: string;
  characterCount: number;
  chapters: ReadingChapter[];
}

export interface ReadingBookSummary {
  id: string;
  title: string;
  characterCount: number;
}

export interface ReadProgress {
  characterOffset: number;
}

export interface ReadState {
  activeBookId?: string;
}

export interface ReadSettings {
  contentWidth: number;
  pageLineCount: number;
  interfaceLanguage: InterfaceLanguage;
  theme: ThemeName;
  keyBindings: ReadKeyBindings;
}

export type ReadBindingAction =
  | "previousPage"
  | "nextPage"
  | "previousChapter"
  | "nextChapter"
  | "repeat"
  | "toggleHelp";

export type ReadKeyBindings = Record<ReadBindingAction, [string, string]>;

export interface ReadingPage {
  startOffset: number;
  endOffset: number;
  lines: string[];
}

export interface ReadingChapter {
  title: string;
  startOffset: number;
}
