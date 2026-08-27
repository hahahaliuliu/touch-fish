import type { ReadBindingAction, ReadMouseWheelMode } from "../models/reading.js";
import type { InterfaceLanguage, ThemeName } from "../models/settings.js";

/**
 * Shared layout of the Read settings screen. Both the interactive session and
 * its renderer need the same item indices and option lists, so they live here
 * instead of being duplicated in each module.
 */

export const WIDTH_OPTIONS: Array<number | "custom"> = [0, 30, 50, "custom"];
export const LINE_OPTIONS: Array<number | "custom"> = [5, 10, 15, "custom"];
export const SECTION_OPTIONS: Array<number | "custom"> = [0, 2, 3, 5, "custom"];
export const MINI_COLUMN_OPTIONS: Array<number | "custom"> = [48, 64, 80, "custom"];
export const MINI_ROW_OPTIONS: Array<number | "custom"> = [16, 22, 30, "custom"];
export const MINI_FONT_OPTIONS: Array<number | "custom"> = [6, 8, 10, "custom"];
export const MINI_MOUSE_MODES: readonly ReadMouseWheelMode[] = ["page", "scroll"];
export const MINI_SCROLL_STEP_OPTIONS: Array<number | "custom"> = [1, 2, 3, 5, "custom"];
export const INTERFACE_LANGUAGES: readonly InterfaceLanguage[] = ["english", "chinese"];
export const THEMES: readonly ThemeName[] = ["build-log", "backend-log", "git"];
export const MAIN_BINDING_ACTIONS: ReadBindingAction[] = [
  "previousPage",
  "nextPage",
  "previousChapter",
  "nextChapter",
  "repeat",
  "toggleHelp",
];
export const BINDING_ACTIONS: ReadBindingAction[] = [...MAIN_BINDING_ACTIONS, "toggleMiniWindow"];

export const WIDTH_ITEM_INDEX = 0;
export const LINE_ITEM_INDEX = 1;
export const SECTION_ITEM_INDEX = 2;
export const LANGUAGE_ITEM_INDEX = 3;
export const CURRENT_BOOK_ITEM_INDEX = 4;
export const IMPORT_ITEM_INDEX = 5;
export const THEME_ITEM_INDEX = 6;
export const MAIN_BINDING_START_INDEX = 7;
export const MINI_WINDOW_ITEM_INDEX = 13;
export const MINI_COLUMNS_ITEM_INDEX = 14;
export const MINI_ROWS_ITEM_INDEX = 15;
export const MINI_FONT_ITEM_INDEX = 16;
export const MINI_MOUSE_ITEM_INDEX = 17;
export const MINI_SCROLL_STEP_ITEM_INDEX = 18;
export const MINI_WINDOW_BINDING_ITEM_INDEX = 19;
export const ITEM_COUNT = 20;
