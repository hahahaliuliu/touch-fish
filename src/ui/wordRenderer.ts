import type { Word } from "../models/word.js";
import { renderLogQuitMessage, renderLogTheme } from "./logTheme.js";

export type DisplayMode = "both" | "english" | "chinese";

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