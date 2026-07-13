import type { Settings } from "../models/settings.js";
import { loadSettings, saveSettings } from "../services/settingsLoader.js";
import { renderSettingSession } from "../ui/settingsRenderer.js";

const RETURN_TO_WORD_KEY = "\u000f";
const WORKSPACE_SIZES = [1, 3, 5];
const STUDY_GROUP_SIZES = [10, 20, 30];
const STUDY_ORDERS: Array<Settings["studyOrder"]> = ["sequential", "random"];
type NumericOption = number | "custom";

interface StartSettingSessionOptions {
  onReturn?: () => void;
}

interface SettingItem {
  key: keyof Settings;
  label: string;
  options?: readonly unknown[];
  acceptsNumber?: boolean;
}

const SETTING_ITEMS: SettingItem[] = [
  {
    key: "studyGroupEnabled",
    label: "Group Vocabulary",
    options: [false, true],
  },
  {
    key: "workspaceSize",
    label: "Page Size",
    options: WORKSPACE_SIZES,
    acceptsNumber: true,
  },
  {
    key: "dailyWordCount",
    label: "Group Size",
    options: STUDY_GROUP_SIZES,
    acceptsNumber: true,
  },
  {
    key: "navigationLoop",
    label: "Navigation Loop",
    options: [false, true],
  },
  {
    key: "displayMode",
    label: "Display Mode",
  },
  {
    key: "studyOrder",
    label: "Study Order",
    options: STUDY_ORDERS,
  },
  {
    key: "activeVocabularyBook",
    label: "Vocabulary Book",
  },
  {
    key: "theme",
    label: "Theme",
  },
];

let onReturnToPreviousSession: (() => void) | undefined;
let settings = loadSettings();
let selectedIndex = 0;
let isEditing = false;
let draftSettings = settings;
let numericInput = "";
let numericInputTouched = false;
let selectedNumericOption: NumericOption | undefined;
let editError = "";

export function startSettingSession(options: StartSettingSessionOptions = {}) {
  onReturnToPreviousSession = options.onReturn;
  settings = loadSettings();
  selectedIndex = 0;
  isEditing = false;
  draftSettings = settings;
  resetEditState();
  render();

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }
  process.stdin.resume();
  process.stdin.setEncoding("utf8");

  process.stdin.on("data", handleKeyPress);
}

function handleKeyPress(key: string) {
  for (const input of parseInputs(key.toString())) {
    const shouldContinue = handleInput(input);

    if (!shouldContinue) {
      return;
    }
  }
}

function parseInputs(input: string): string[] {
  const inputs: string[] = [];
  let index = 0;

  while (index < input.length) {
    const current = input[index];
    const next = input[index + 1];
    const third = input[index + 2];

    if (current === "\r" && next === "\n") {
      inputs.push("\r");
      index += 2;
      continue;
    }

    if (current === "\u001b" && next === "[" && third) {
      inputs.push(`${current}${next}${third}`);
      index += 3;
      continue;
    }

    if (current) {
      inputs.push(current);
    }

    index += 1;
  }

  return inputs;
}

function handleInput(input: string): boolean {
  if (input === "\u0003" || input.toLowerCase() === "q") {
    quitSettingSession();
  }

  if (input === RETURN_TO_WORD_KEY && onReturnToPreviousSession) {
    returnToPreviousSession();
    return false;
  }

  if (input === "\u001b") {
    cancelEdit();
    return true;
  }

  if (input === "\r" || input === "\n") {
    confirmOrStartEdit();
    return true;
  }

  if (isEditing && isNumericItem(getSelectedItem()) && /^\d$/.test(input)) {
    appendNumericInput(input);
    return true;
  }

  if (isEditing && isNumericItem(getSelectedItem()) && isBackspace(input)) {
    deleteNumericInput();
    return true;
  }

  if (input === "w" || input === "W" || input === "\u001b[A") {
    moveSelection(-1);
    return true;
  }

  if (input === "s" || input === "S" || input === "\u001b[B") {
    moveSelection(1);
    return true;
  }

  if (input === "a" || input === "A" || input === "\u001b[D") {
    changeCurrentValue(-1);
    return true;
  }

  if (input === "d" || input === "D" || input === "\u001b[C") {
    changeCurrentValue(1);
    return true;
  }

  return true;
}

function moveSelection(direction: -1 | 1) {
  if (isEditing) {
    return;
  }

  selectedIndex =
    (selectedIndex + direction + SETTING_ITEMS.length) % SETTING_ITEMS.length;
  render();
}

function confirmOrStartEdit() {
  const item = getSelectedItem();

  if (!item.options || isInactive(item)) {
    return;
  }

  if (!isEditing) {
    draftSettings = cloneSettings(settings);
    isEditing = true;
    editError = "";

    if (isNumericItem(item)) {
      const currentValue = getNumericSettingValue(draftSettings, item.key);
      const presets = getNumericPresets(item.key);

      selectedNumericOption = presets.includes(currentValue) ? currentValue : "custom";
      numericInput = String(currentValue);
      numericInputTouched = false;
    }

    render();
    return;
  }

  if (isNumericItem(item) && !applyNumericInput()) {
    render();
    return;
  }

  settings = cloneSettings(draftSettings);
  saveSettings(settings);
  isEditing = false;
  resetEditState();
  render();
}

function cancelEdit() {
  if (!isEditing) {
    return;
  }

  draftSettings = settings;
  isEditing = false;
  resetEditState();
  render();
}

function changeCurrentValue(direction: -1 | 1) {
  const item = getSelectedItem();

  if (!isEditing || !item.options || isInactive(item)) {
    return;
  }

  if (item.key === "studyGroupEnabled") {
    draftSettings = {
      ...draftSettings,
      studyGroupEnabled: !draftSettings.studyGroupEnabled,
    };
  }

  if (item.key === "workspaceSize") {
    const nextOption = getNextNumericOption(
      selectedNumericOption ?? draftSettings.workspaceSize,
      WORKSPACE_SIZES,
      direction
    );
    updateNumericOption(item.key, nextOption);
  }

  if (item.key === "dailyWordCount") {
    const nextOption = getNextNumericOption(
      selectedNumericOption ?? draftSettings.dailyWordCount,
      STUDY_GROUP_SIZES,
      direction
    );
    updateNumericOption(item.key, nextOption);
  }

  if (item.key === "navigationLoop") {
    draftSettings = {
      ...draftSettings,
      navigationLoop: !draftSettings.navigationLoop,
    };
  }

  if (item.key === "studyOrder") {
    draftSettings = {
      ...draftSettings,
      studyOrder: getNextValue(draftSettings.studyOrder, STUDY_ORDERS, direction),
    };
  }

  editError = "";
  render();
}

function appendNumericInput(input: string) {
  selectedNumericOption = "custom";
  numericInput = numericInputTouched ? `${numericInput}${input}` : input;
  numericInputTouched = true;
  applyNumericInput();
  render();
}

function deleteNumericInput() {
  selectedNumericOption = "custom";
  numericInput = numericInputTouched ? numericInput.slice(0, -1) : "";
  numericInputTouched = true;
  applyNumericInput();
  render();
}

function applyNumericInput(): boolean {
  const item = getSelectedItem();
  const value = Number(numericInput);

  if (!Number.isInteger(value) || value <= 0) {
    editError = "Enter a whole number greater than zero";
    return false;
  }

  if (item.key === "workspaceSize") {
    draftSettings = { ...draftSettings, workspaceSize: value };
  }

  if (item.key === "dailyWordCount") {
    draftSettings = { ...draftSettings, dailyWordCount: value };
  }

  editError = "";
  return true;
}

function updateNumericOption(key: keyof Settings, option: NumericOption) {
  selectedNumericOption = option;

  if (option === "custom") {
    numericInput = "";
    numericInputTouched = true;
    return;
  }

  numericInput = String(option);
  numericInputTouched = false;

  if (key === "workspaceSize") {
    draftSettings = { ...draftSettings, workspaceSize: option };
  }

  if (key === "dailyWordCount") {
    draftSettings = { ...draftSettings, dailyWordCount: option };
  }
}

function isBackspace(input: string): boolean {
  return input === "\b" || input === "\u007f";
}

function isNumericItem(item: SettingItem): boolean {
  return item.acceptsNumber === true;
}

function isInactive(item: SettingItem): boolean {
  return item.key === "dailyWordCount" && !draftSettings.studyGroupEnabled;
}

function getNumericSettingValue(settings: Settings, key: keyof Settings): number {
  if (key === "workspaceSize" || key === "dailyWordCount") {
    return settings[key];
  }

  return 0;
}

function getNumericPresets(key: keyof Settings): readonly number[] {
  return key === "workspaceSize" ? WORKSPACE_SIZES : STUDY_GROUP_SIZES;
}

function getNextValue<T>(currentValue: T, options: readonly T[], direction: -1 | 1): T {
  const currentIndex = options.indexOf(currentValue);
  const nextIndex =
    (currentIndex + direction + options.length) % options.length;

  return options[nextIndex] ?? options[0]!;
}

function getNextNumericOption(
  currentOption: NumericOption,
  presets: readonly number[],
  direction: -1 | 1
): NumericOption {
  const options: NumericOption[] = [...presets, "custom"];
  const currentIndex = options.indexOf(currentOption);
  const fallbackIndex = direction === 1 ? 0 : options.length - 1;
  const nextIndex =
    currentIndex === -1
      ? fallbackIndex
      : (currentIndex + direction + options.length) % options.length;

  return options[nextIndex] ?? options[0]!;
}

function getSelectedItem(): SettingItem {
  return SETTING_ITEMS[selectedIndex] ?? SETTING_ITEMS[0]!;
}

function render() {
  renderSettingSession({
    settings,
    draftSettings,
    items: SETTING_ITEMS,
    selectedIndex,
    isEditing,
    numericInput: isEditing && isNumericItem(getSelectedItem()) ? numericInput : undefined,
    selectedNumericOption:
      isEditing && isNumericItem(getSelectedItem()) ? selectedNumericOption : undefined,
    editError,
  });
}

function resetEditState() {
  numericInput = "";
  numericInputTouched = false;
  selectedNumericOption = undefined;
  editError = "";
}

function returnToPreviousSession() {
  const onReturn = onReturnToPreviousSession;

  onReturnToPreviousSession = undefined;
  process.stdin.off("data", handleKeyPress);

  onReturn?.();
}

function quitSettingSession() {
  console.clear();
  console.log("[INFO] configuration session closed");

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }
  process.stdin.pause();
  process.exit(0);
}

function cloneSettings(value: Settings): Settings {
  return {
    ...value,
    visibleFields: {
      ...value.visibleFields,
    },
    keyBindings: {
      ...value.keyBindings,
    },
  };
}
