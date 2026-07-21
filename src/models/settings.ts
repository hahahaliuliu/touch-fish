export type DisplayMode = "both" | "english" | "chinese";

export type InterfaceLanguage = "english" | "chinese";

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
  previous: BindingSlots;
  next: BindingSlots;
  previousGroup: BindingSlots;
  nextGroup: BindingSlots;
  repeat: BindingSlots;
  switchDisplayMode: BindingSlots;
  toggleHelp: BindingSlots;
  quit: BindingSlots;
}

export type BindingSlots = [string, string];

export interface Settings {
  dailyWordCount: number;
  workspaceSize: number;
  studyGroupEnabled: boolean;
  navigationLoop: boolean;
  studyOrder: StudyOrder;
  activeVocabularyBook: string;
  displayMode: DisplayMode;
  interfaceLanguage: InterfaceLanguage;
  theme: ThemeName;
  visibleFields: VisibleWordFields;
  keyBindings: KeyBindings;
}
