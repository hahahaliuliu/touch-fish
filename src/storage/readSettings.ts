import fs from "node:fs";
import path from "node:path";
import { resolveAssetPath } from "../config/paths.js";
import type { ReadBindingAction, ReadKeyBindings, ReadSettings } from "../models/reading.js";
import type { InterfaceLanguage, ThemeName } from "../models/settings.js";
import { loadSettings } from "../services/settingsLoader.js";

const settingsPath = resolveAssetPath("read-settings.json");
const DEFAULT_KEY_BINDINGS: ReadKeyBindings = {
  previousPage: ["a", "arrow-left"],
  nextPage: ["d", "arrow-right"],
  previousChapter: ["w", "arrow-up"],
  nextChapter: ["s", "arrow-down"],
  repeat: ["space", ""],
  toggleHelp: ["?", ""],
};

function getDefaultReadSettings(): ReadSettings {
  let interfaceLanguage: InterfaceLanguage = "english";
  let theme: ThemeName = "build-log";

  try {
    const sharedSettings = loadSettings();
    interfaceLanguage = sharedSettings.interfaceLanguage;
    theme = isReadTheme(sharedSettings.theme) ? sharedSettings.theme : "build-log";
  } catch {
    // A damaged shared settings file must not prevent Read settings from opening.
  }

  return {
    contentWidth: 0,
    pageLineCount: 10,
    chapterSectionCount: 0,
    interfaceLanguage,
    theme,
    keyBindings: cloneKeyBindings(DEFAULT_KEY_BINDINGS),
  };
}

export function loadReadSettings(): ReadSettings {
  const defaults = getDefaultReadSettings();

  if (!fs.existsSync(settingsPath)) {
    return defaults;
  }

  try {
    const value = JSON.parse(fs.readFileSync(settingsPath, "utf-8")) as Partial<ReadSettings>;
    return {
      contentWidth: isValidWidth(value.contentWidth) ? value.contentWidth : defaults.contentWidth,
      pageLineCount: isValidLineCount(value.pageLineCount) ? value.pageLineCount : defaults.pageLineCount,
      chapterSectionCount: isValidSectionCount(value.chapterSectionCount) ? value.chapterSectionCount : defaults.chapterSectionCount,
      interfaceLanguage: isInterfaceLanguage(value.interfaceLanguage) ? value.interfaceLanguage : defaults.interfaceLanguage,
      theme: isReadTheme(value.theme) ? value.theme : defaults.theme,
      keyBindings: readKeyBindings(value.keyBindings),
    };
  } catch {
    return defaults;
  }
}

export function saveReadSettings(settings: ReadSettings) {
  const defaults = getDefaultReadSettings();
  const safeSettings: ReadSettings = {
    contentWidth: isValidWidth(settings.contentWidth) ? settings.contentWidth : defaults.contentWidth,
    pageLineCount: isValidLineCount(settings.pageLineCount) ? settings.pageLineCount : defaults.pageLineCount,
    chapterSectionCount: isValidSectionCount(settings.chapterSectionCount) ? settings.chapterSectionCount : defaults.chapterSectionCount,
    interfaceLanguage: isInterfaceLanguage(settings.interfaceLanguage) ? settings.interfaceLanguage : defaults.interfaceLanguage,
    theme: isReadTheme(settings.theme) ? settings.theme : defaults.theme,
    keyBindings: readKeyBindings(settings.keyBindings),
  };
  const temporaryPath = `${settingsPath}.tmp`;

  try {
    fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
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

function isValidSectionCount(value: unknown): value is number {
  return typeof value === "number"
    && Number.isInteger(value)
    && (value === 0 || (value >= 2 && value <= 20));
}

function readKeyBindings(value: unknown): ReadKeyBindings {
  const defaults = DEFAULT_KEY_BINDINGS;

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

function cloneKeyBindings(value: ReadKeyBindings): ReadKeyBindings {
  const bindings = {} as ReadKeyBindings;

  (Object.keys(value) as ReadBindingAction[]).forEach((key) => {
    bindings[key] = [...value[key]];
  });

  return bindings;
}

function isInterfaceLanguage(value: unknown): value is InterfaceLanguage {
  return value === "english" || value === "chinese";
}

function isReadTheme(value: unknown): value is ThemeName {
  return value === "build-log" || value === "backend-log" || value === "git";
}

function readBinding(value: unknown, fallback: [string, string]): [string, string] {
  return Array.isArray(value)
    && typeof value[0] === "string"
    && typeof value[1] === "string"
    ? [value[0], value[1]]
    : [...fallback] as [string, string];
}
