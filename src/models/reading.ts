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
  chapterSectionCount: number;
  miniWindowColumns: number;
  miniWindowRows: number;
  miniWindowFontSize: number;
  miniWindowMouseMode: ReadMouseWheelMode;
  miniWindowScrollStep: number;
  interfaceLanguage: InterfaceLanguage;
  theme: ThemeName;
  keyBindings: ReadKeyBindings;
}

export type ReadMouseWheelMode = "page" | "scroll";

export type ReadBindingAction =
  | "previousPage"
  | "nextPage"
  | "previousChapter"
  | "nextChapter"
  | "repeat"
  | "toggleHelp"
  | "toggleMiniWindow";

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

export interface ReadingSection {
  chapterIndex: number;
  indexInChapter: number;
  countInChapter: number;
  startOffset: number;
}
