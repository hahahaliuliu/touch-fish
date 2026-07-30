import type { Word } from "../models/word.js";
import type {
  DisplayMode,
  InterfaceLanguage,
  KeyBindings,
  NoteMode,
  StudyOrder,
  ThemeName,
} from "../models/settings.js";
import {
  renderBackendLogQuitMessage,
  renderBackendLogTheme,
} from "./backendLogTheme.js";
import { renderGitQuitMessage, renderGitTheme } from "./gitTheme.js";
import { renderLogQuitMessage, renderLogTheme } from "./logTheme.js";

export type { DisplayMode } from "../models/settings.js";

export interface RenderWordSessionOptions {
  words: Word[];
  current: number;
  total: number;
  workspaceSize: number;
  studyGroupStart: number;
  studyGroupEnd: number;
  studyGroupCurrent: number;
  studyGroupTotal: number;
  studyGroupEnabled: boolean;
  navigationLoop: boolean;
  studyOrder: StudyOrder;
  theme: ThemeName;
  keyBindings: KeyBindings;
  displayMode: DisplayMode;
  noteMode: NoteMode;
  noteSelectionIndex?: number | undefined;
  noteInput?: string | undefined;
  interfaceLanguage: InterfaceLanguage;
  showHelp: boolean;
}

export function renderWordSession(options: RenderWordSessionOptions) {
  if (options.showHelp) {
    renderLogTheme(options);
    return;
  }

  if (options.theme === "backend-log") {
    renderBackendLogTheme(options);
  } else if (options.theme === "git") {
    renderGitTheme(options);
  } else {
    renderLogTheme(options);
  }

  if (options.noteInput !== undefined && options.noteSelectionIndex !== undefined) {
    renderNoteEditor(options);
  }
}

function renderNoteEditor(options: RenderWordSessionOptions) {
  const selectedIndex = options.noteSelectionIndex;

  if (selectedIndex === undefined) {
    return;
  }

  const word = options.words[selectedIndex];

  if (!word) {
    return;
  }

  const chinese = options.interfaceLanguage === "chinese";
  console.log("");
  console.log(chinese ? `[备注] ${word.english}` : `[NOTE] ${word.english}`);
  console.log(`${chinese ? "输入" : "input"}> ${options.noteInput}\u001b[5m_\u001b[0m`);
  console.log(chinese ? "Enter 保存 | Esc 取消 | Ctrl+C 退出" : "Enter save | Esc cancel | Ctrl+C quit");
}

export function renderQuitMessage(theme: ThemeName) {
  if (theme === "backend-log") {
    renderBackendLogQuitMessage();
    return;
  }

  if (theme === "git") {
    renderGitQuitMessage();
    return;
  }

  renderLogQuitMessage();
}
