import type { Word } from "../models/word.js";
import type {
  DisplayMode,
  InterfaceLanguage,
  KeyBindings,
  StudyOrder,
  ThemeName,
} from "../models/settings.js";
import {
  renderBackendLogQuitMessage,
  renderBackendLogTheme,
} from "./backendLogTheme.js";
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
    return;
  }

  renderLogTheme(options);
}

export function renderQuitMessage(theme: ThemeName) {
  if (theme === "backend-log") {
    renderBackendLogQuitMessage();
    return;
  }

  renderLogQuitMessage();
}
