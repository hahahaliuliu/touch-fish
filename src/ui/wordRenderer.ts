import type { Word } from "../models/word.js";
import type { DisplayMode } from "../models/settings.js";
import { renderLogQuitMessage, renderLogTheme } from "./logTheme.js";

export type { DisplayMode } from "../models/settings.js";

interface RenderWordSessionOptions {
  words: Word[];
  current: number;
  total: number;
  displayMode: DisplayMode;
  showHelp: boolean;
}

export function renderWordSession(options: RenderWordSessionOptions) {
  renderLogTheme(options);
}

export function renderQuitMessage() {
  renderLogQuitMessage();
}
