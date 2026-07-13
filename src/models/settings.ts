export type DisplayMode = "both" | "english" | "chinese";

export type StudyOrder = "sequential" | "random";

export type ThemeName =
  | "build-log"
  | "backend-log"
  | "git"
  | "cargo"
  | "docker"
  | "claude-code"
  | "python-repl"
  | "sql-console";

export interface VisibleWordFields {
  phonetic: boolean;
  example: boolean;
  partOfSpeech: boolean;
  note: boolean;
  tags: boolean;
}

export interface KeyBindings {
  previous: string;
  next: string;
  repeat: string;
  switchDisplayMode: string;
  toggleHelp: string;
  quit: string;
}

export interface Settings {
  dailyWordCount: number;
  workspaceSize: number;
  studyGroupEnabled: boolean;
  navigationLoop: boolean;
  studyOrder: StudyOrder;
  activeVocabularyBook: string;
  displayMode: DisplayMode;
  theme: ThemeName;
  visibleFields: VisibleWordFields;
  keyBindings: KeyBindings;
}
