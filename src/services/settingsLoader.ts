import fs from "node:fs";
import path from "node:path";
import { DEFAULT_SETTINGS } from "../config/defaultSettings.js";
import { resolveAssetPath } from "../config/paths.js";
import type {
  DisplayMode,
  BindingSlots,
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
  const parsedSettings = JSON.parse(fileContent) as unknown;
  const settings = mergeWithDefaultSettings(parsedSettings);
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

function mergeWithDefaultSettings(value: unknown): unknown {
  if (!isRecord(value)) {
    return value;
  }

  return {
    ...DEFAULT_SETTINGS,
    ...value,
    visibleFields: isRecord(value.visibleFields)
      ? { ...DEFAULT_SETTINGS.visibleFields, ...value.visibleFields }
      : value.visibleFields,
    keyBindings: isRecord(value.keyBindings)
      ? mergeKeyBindings(value.keyBindings)
      : value.keyBindings,
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

  if (!isPositiveInteger(value.workspaceSize)) {
    errors.push("workspaceSize must be a positive whole number");
  }

  if (typeof value.studyGroupEnabled !== "boolean") {
    errors.push("studyGroupEnabled must be a boolean");
  }

  if (typeof value.navigationLoop !== "boolean") {
    errors.push("navigationLoop must be a boolean");
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
    "previousGroup",
    "nextGroup",
    "repeat",
    "switchDisplayMode",
    "toggleHelp",
    "quit",
  ];

  keys.forEach((key) => {
    if (!isBindingSlots(value[key])) {
      errors.push(`keyBindings.${key} must contain two binding slots`);
    }
  });
}

function mergeKeyBindings(value: Record<string, unknown>): KeyBindings {
  const bindings = {} as KeyBindings;

  (Object.keys(DEFAULT_SETTINGS.keyBindings) as Array<keyof KeyBindings>).forEach((key) => {
    bindings[key] = normalizeBindingSlots(value[key], DEFAULT_SETTINGS.keyBindings[key]);
  });

  return bindings;
}

function normalizeBindingSlots(value: unknown, fallback: BindingSlots): BindingSlots {
  if (isBindingSlots(value)) {
    return value;
  }

  if (typeof value === "string") {
    return [value, fallback[1]];
  }

  return [...fallback] as BindingSlots;
}

function isBindingSlots(value: unknown): value is BindingSlots {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    value.every((binding) => typeof binding === "string")
  );
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
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
