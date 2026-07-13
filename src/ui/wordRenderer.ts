import type { Word } from "../models/word.js";
import type { DisplayMode, StudyOrder } from "../models/settings.js";
import { renderLogQuitMessage, renderLogTheme } from "./logTheme.js";

export type { DisplayMode } from "../models/settings.js";

interface RenderWordSessionOptions {
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
  displayMode: DisplayMode;
  showHelp: boolean;
}

export function renderWordSession(options: RenderWordSessionOptions) {
  renderLogTheme(options);
}

export function renderQuitMessage() {
  renderLogQuitMessage();
}
