import fs from "node:fs";
import path from "node:path";
import { DEFAULT_SETTINGS } from "../config/defaultSettings.js";
import { resolveAssetPath } from "../config/paths.js";
import type {
  DisplayMode,
  KeyBindings,
  Settings,
  StudyOrder,
  ThemeName,
  VisibleWordFields,
} from "../models/settings.js";

const settingsPath = resolveAssetPath("settings.json");

export function loadSettings(): Settings {
  if (!fs.existsSync(settingsPath)) {
    return cloneSettings(DEFAULT_SETTINGS);
  }

  const fileContent = fs.readFileSync(settingsPath, "utf-8");
  const settings = JSON.parse(fileContent) as unknown;
  const errors = validateSettings(settings);

  if (errors.length > 0) {
    throw new Error(
      [
        `Invalid settings format: ${settingsPath}`,
        ...errors.map((error) => `- ${error}`),
      ].join("\n")
    );
  }

  return settings as Settings;
}

export function saveSettings(settings: Settings) {
  const errors = validateSettings(settings);

  if (errors.length > 0) {
    throw new Error(
      [
        `Invalid settings format: ${settingsPath}`,
        ...errors.map((error) => `- ${error}`),
      ].join("\n")
    );
  }

  const dir = path.dirname(settingsPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`, "utf-8");
}

function cloneSettings(settings: Settings): Settings {
  return {
    ...settings,
    visibleFields: {
      ...settings.visibleFields,
    },
    keyBindings: {
      ...settings.keyBindings,
    },
  };
}

function validateSettings(value: unknown): string[] {
  const errors: string[] = [];

  if (!isRecord(value)) {
    return ["settings must be a JSON object"];
  }

  if (!isPositiveNumber(value.dailyWordCount)) {
    errors.push("dailyWordCount must be a positive number");
  }

  if (!isWorkspaceSize(value.workspaceSize)) {
    errors.push("workspaceSize must be 1, 3, or 5");
  }

  if (!isStudyOrder(value.studyOrder)) {
    errors.push("studyOrder must be sequential or random");
  }

  if (typeof value.activeVocabularyBook !== "string") {
    errors.push("activeVocabularyBook must be a string");
  }

  if (!isDisplayMode(value.displayMode)) {
    errors.push("displayMode must be both, english, or chinese");
  }

  if (!isThemeName(value.theme)) {
    errors.push("theme is not supported");
  }

  validateVisibleFields(value.visibleFields, errors);
  validateKeyBindings(value.keyBindings, errors);

  return errors;
}

function validateVisibleFields(value: unknown, errors: string[]) {
  if (!isRecord(value)) {
    errors.push("visibleFields must be a JSON object");
    return;
  }

  const keys: Array<keyof VisibleWordFields> = [
    "phonetic",
    "example",
    "partOfSpeech",
    "note",
    "tags",
  ];

  keys.forEach((key) => {
    if (typeof value[key] !== "boolean") {
      errors.push(`visibleFields.${key} must be a boolean`);
    }
  });
}

function validateKeyBindings(value: unknown, errors: string[]) {
  if (!isRecord(value)) {
    errors.push("keyBindings must be a JSON object");
    return;
  }

  const keys: Array<keyof KeyBindings> = [
    "previous",
    "next",
    "repeat",
    "switchDisplayMode",
    "toggleHelp",
    "quit",
  ];

  keys.forEach((key) => {
    if (typeof value[key] !== "string" || value[key].trim() === "") {
      errors.push(`keyBindings.${key} must be a non-empty string`);
    }
  });
}

function isWorkspaceSize(value: unknown): value is Settings["workspaceSize"] {
  return value === 1 || value === 3 || value === 5;
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isStudyOrder(value: unknown): value is StudyOrder {
  return value === "sequential" || value === "random";
}

function isDisplayMode(value: unknown): value is DisplayMode {
  return value === "both" || value === "english" || value === "chinese";
}

function isThemeName(value: unknown): value is ThemeName {
  return (
    value === "build-log" ||
    value === "backend-log" ||
    value === "git" ||
    value === "cargo" ||
    value === "docker" ||
    value === "claude-code" ||
    value === "python-repl" ||
    value === "sql-console"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
