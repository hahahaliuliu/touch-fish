import fs from "node:fs";
import { resolveAssetPath } from "../config/paths.js";
import type { ReadKeyBindings, ReadSettings } from "../models/reading.js";

const settingsPath = resolveAssetPath("read-settings.json");
const DEFAULT_READ_SETTINGS: ReadSettings = {
  contentWidth: 0,
  pageLineCount: 10,
  keyBindings: {
    previousPage: ["a", "arrow-left"],
    nextPage: ["d", "arrow-right"],
    previousChapter: ["w", "arrow-up"],
    nextChapter: ["s", "arrow-down"],
    repeat: ["space", ""],
    toggleHelp: ["?", ""],
  },
};

export function loadReadSettings(): ReadSettings {
  if (!fs.existsSync(settingsPath)) {
    return { ...DEFAULT_READ_SETTINGS };
  }

  try {
    const value = JSON.parse(fs.readFileSync(settingsPath, "utf-8")) as Partial<ReadSettings>;
    return {
      contentWidth: isValidWidth(value.contentWidth) ? value.contentWidth : DEFAULT_READ_SETTINGS.contentWidth,
      pageLineCount: isValidLineCount(value.pageLineCount) ? value.pageLineCount : DEFAULT_READ_SETTINGS.pageLineCount,
      keyBindings: readKeyBindings(value.keyBindings),
    };
  } catch {
    return { ...DEFAULT_READ_SETTINGS };
  }
}

export function saveReadSettings(settings: ReadSettings) {
  const safeSettings: ReadSettings = {
    contentWidth: isValidWidth(settings.contentWidth) ? settings.contentWidth : DEFAULT_READ_SETTINGS.contentWidth,
    pageLineCount: isValidLineCount(settings.pageLineCount) ? settings.pageLineCount : DEFAULT_READ_SETTINGS.pageLineCount,
    keyBindings: readKeyBindings(settings.keyBindings),
  };
  const temporaryPath = `${settingsPath}.tmp`;

  try {
    fs.writeFileSync(temporaryPath, `${JSON.stringify(safeSettings, null, 2)}\n`, "utf-8");
    fs.renameSync(temporaryPath, settingsPath);
  } finally {
    if (fs.existsSync(temporaryPath)) {
      fs.unlinkSync(temporaryPath);
    }
  }
}

function isValidWidth(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && (value === 0 || value >= 20);
}

function isValidLineCount(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 100;
}

function readKeyBindings(value: unknown): ReadKeyBindings {
  const defaults = DEFAULT_READ_SETTINGS.keyBindings;

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { ...defaults };
  }

  const partial = value as Partial<ReadKeyBindings>;
  return {
    previousPage: readBinding(partial.previousPage, defaults.previousPage),
    nextPage: readBinding(partial.nextPage, defaults.nextPage),
    previousChapter: readBinding(partial.previousChapter, defaults.previousChapter),
    nextChapter: readBinding(partial.nextChapter, defaults.nextChapter),
    repeat: readBinding(partial.repeat, defaults.repeat),
    toggleHelp: readBinding(partial.toggleHelp, defaults.toggleHelp),
  };
}

function readBinding(value: unknown, fallback: [string, string]): [string, string] {
  return Array.isArray(value)
    && typeof value[0] === "string"
    && typeof value[1] === "string"
    ? [value[0], value[1]]
    : [...fallback] as [string, string];
}
