import type { KeyBindings, Settings, ThemeName } from "../models/settings.js";
import { reshuffleRandomOrder } from "../services/randomOrder.js";
import { loadSettings, saveSettings } from "../services/settingsLoader.js";
import { renderSettingSession } from "../ui/settingsRenderer.js";

const RETURN_TO_WORD_KEY = "\u000f";
const WORKSPACE_SIZES = [1, 3, 5];
const STUDY_GROUP_SIZES = [10, 20, 30];
const STUDY_ORDERS: Array<Settings["studyOrder"]> = ["sequential", "random"];
const AVAILABLE_THEMES: readonly ThemeName[] = ["build-log", "backend-log"];
type NumericOption = number | "custom";
type StudyOrderOption = Settings["studyOrder"] | "reshuffle";
type BindingSlot = 0 | 1;
const STUDY_ORDER_OPTIONS: readonly StudyOrderOption[] = [...STUDY_ORDERS, "reshuffle"];

interface StartSettingSessionOptions {
  onReturn?: () => void;
}

interface ConfigItem {
  kind: "setting";
  key: keyof Settings;
  label: string;
  options?: readonly unknown[];
  acceptsNumber?: boolean;
}

interface BindingItem {
  kind: "binding";
  key: keyof KeyBindings;
  label: string;
}

type SettingItem = ConfigItem | BindingItem;

const SETTING_ITEMS: SettingItem[] = [
  { kind: "setting", key: "studyGroupEnabled", label: "Group Vocabulary", options: [false, true] },
  { kind: "setting", key: "workspaceSize", label: "Page Size", options: WORKSPACE_SIZES, acceptsNumber: true },
  { kind: "setting", key: "dailyWordCount", label: "Group Size", options: STUDY_GROUP_SIZES, acceptsNumber: true },
  { kind: "setting", key: "navigationLoop", label: "Navigation Loop", options: [false, true] },
  { kind: "setting", key: "displayMode", label: "Display Mode" },
  { kind: "setting", key: "studyOrder", label: "Study Order", options: STUDY_ORDERS },
  { kind: "setting", key: "activeVocabularyBook", label: "Vocabulary Book" },
  { kind: "setting", key: "theme", label: "Theme", options: AVAILABLE_THEMES },
  { kind: "binding", key: "previous", label: "Previous Page" },
  { kind: "binding", key: "next", label: "Next Page" },
  { kind: "binding", key: "previousGroup", label: "Previous Group" },
  { kind: "binding", key: "nextGroup", label: "Next Group" },
  { kind: "binding", key: "repeat", label: "Repeat Navigation" },
  { kind: "binding", key: "switchDisplayMode", label: "Switch Display" },
  { kind: "binding", key: "toggleHelp", label: "Toggle Help" },
];

let onReturnToPreviousSession: (() => void) | undefined;
let settings = loadSettings();
let selectedIndex = 0;
let selectedBindingSlot: BindingSlot = 0;
let isEditing = false;
let draftSettings = settings;
let numericInput = "";
let numericInputTouched = false;
let selectedNumericOption: NumericOption | undefined;
let selectedStudyOrderOption: StudyOrderOption | undefined;
let editError = "";
let isReshuffleArmed = false;

export function startSettingSession(options: StartSettingSessionOptions = {}) {
  onReturnToPreviousSession = options.onReturn;
  settings = loadSettings();
  selectedIndex = 0;
  selectedBindingSlot = 0;
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
    if (!handleInput(input)) {
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

  if (isBindingCapture()) {
    captureBinding(input);
    return true;
  }

  if (isEditing && isReshuffleSelected() && input === " ") {
    isReshuffleArmed = true;
    editError = "";
    render();
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

  selectedIndex = (selectedIndex + direction + SETTING_ITEMS.length) % SETTING_ITEMS.length;
  selectedBindingSlot = 0;
  render();
}

function confirmOrStartEdit() {
  const item = getSelectedItem();

  if (isBindingItem(item)) {
    isEditing = true;
    editError = "";
    render();
    return;
  }

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

    if (item.key === "studyOrder") {
      selectedStudyOrderOption = draftSettings.studyOrder;
    }

    render();
    return;
  }

  if (isReshuffleSelected()) {
    if (!isReshuffleArmed) {
      editError = "Press Space to arm reshuffle before pressing Enter";
      render();
      return;
    }

    draftSettings = { ...draftSettings, studyOrder: "random" };
    settings = cloneSettings(draftSettings);
    saveSettings(settings);
    reshuffleRandomOrder();
    isEditing = false;
    resetEditState();
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

  if (isBindingItem(item)) {
    if (!isEditing) {
      selectedBindingSlot = selectedBindingSlot === 0 ? 1 : 0;
      render();
    }
    return;
  }

  if (!isEditing || !item.options || isInactive(item)) {
    return;
  }

  if (item.key === "studyGroupEnabled") {
    draftSettings = { ...draftSettings, studyGroupEnabled: !draftSettings.studyGroupEnabled };
  }

  if (item.key === "workspaceSize") {
    updateNumericOption(item.key, getNextNumericOption(selectedNumericOption ?? draftSettings.workspaceSize, WORKSPACE_SIZES, direction));
  }

  if (item.key === "dailyWordCount") {
    updateNumericOption(item.key, getNextNumericOption(selectedNumericOption ?? draftSettings.dailyWordCount, STUDY_GROUP_SIZES, direction));
  }

  if (item.key === "navigationLoop") {
    draftSettings = { ...draftSettings, navigationLoop: !draftSettings.navigationLoop };
  }

  if (item.key === "studyOrder") {
    const nextOption = getNextValue(selectedStudyOrderOption ?? draftSettings.studyOrder, STUDY_ORDER_OPTIONS, direction);
    selectedStudyOrderOption = nextOption;
    isReshuffleArmed = false;
    draftSettings = { ...draftSettings, studyOrder: nextOption === "reshuffle" ? "random" : nextOption };
  }

  if (item.key === "theme") {
    draftSettings = { ...draftSettings, theme: getNextValue(draftSettings.theme, AVAILABLE_THEMES, direction) };
  }

  editError = "";
  render();
}

function captureBinding(input: string) {
  if (isBackspace(input)) {
    saveBinding("");
    return;
  }

  const binding = normalizeBinding(input);

  if (!binding) {
    editError = "Use one English key, symbol, Space, Tab, or an arrow key";
    render();
    return;
  }

  saveBinding(binding);
}

function saveBinding(binding: string) {
  const item = getSelectedItem();

  if (!isBindingItem(item)) {
    return;
  }

  const keyBindings = cloneKeyBindings(settings.keyBindings);

  if (binding) {
    (Object.keys(keyBindings) as Array<keyof KeyBindings>).forEach((key) => {
      keyBindings[key] = keyBindings[key].map((value) => (value === binding ? "" : value)) as KeyBindings[typeof key];
    });
  }

  keyBindings[item.key][selectedBindingSlot] = binding;
  settings = { ...settings, keyBindings };
  draftSettings = settings;
  saveSettings(settings);
  isEditing = false;
  resetEditState();
  render();
}

function normalizeBinding(input: string): string | undefined {
  const specialBindings: Record<string, string> = {
    "\u001b[A": "arrow-up",
    "\u001b[B": "arrow-down",
    "\u001b[C": "arrow-right",
    "\u001b[D": "arrow-left",
    "\t": "tab",
    " ": "space",
    "？": "?",
  };

  if (specialBindings[input]) {
    return specialBindings[input];
  }

  return /^[\x21-\x7e]$/.test(input) ? input.toLowerCase() : undefined;
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

  if (isConfigItem(item) && item.key === "workspaceSize") {
    draftSettings = { ...draftSettings, workspaceSize: value };
  }

  if (isConfigItem(item) && item.key === "dailyWordCount") {
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

function isBindingItem(item: SettingItem): item is BindingItem {
  return item.kind === "binding";
}

function isConfigItem(item: SettingItem): item is ConfigItem {
  return item.kind === "setting";
}

function isNumericItem(item: SettingItem): item is ConfigItem {
  return isConfigItem(item) && item.acceptsNumber === true;
}

function isInactive(item: ConfigItem): boolean {
  return item.key === "dailyWordCount" && !draftSettings.studyGroupEnabled;
}

function isBindingCapture(): boolean {
  return isEditing && isBindingItem(getSelectedItem());
}

function getNumericSettingValue(settingsValue: Settings, key: keyof Settings): number {
  return key === "workspaceSize" || key === "dailyWordCount" ? settingsValue[key] : 0;
}

function getNumericPresets(key: keyof Settings): readonly number[] {
  return key === "workspaceSize" ? WORKSPACE_SIZES : STUDY_GROUP_SIZES;
}

function getNextValue<T>(currentValue: T, options: readonly T[], direction: -1 | 1): T {
  const currentIndex = options.indexOf(currentValue);
  const nextIndex = (currentIndex + direction + options.length) % options.length;
  return options[nextIndex] ?? options[0]!;
}

function getNextNumericOption(currentOption: NumericOption, presets: readonly number[], direction: -1 | 1): NumericOption {
  const options: NumericOption[] = [...presets, "custom"];
  const currentIndex = options.indexOf(currentOption);
  const fallbackIndex = direction === 1 ? 0 : options.length - 1;
  const nextIndex = currentIndex === -1 ? fallbackIndex : (currentIndex + direction + options.length) % options.length;
  return options[nextIndex] ?? options[0]!;
}

function getSelectedItem(): SettingItem {
  return SETTING_ITEMS[selectedIndex] ?? SETTING_ITEMS[0]!;
}

function render() {
  const item = getSelectedItem();
  const showNumericCursor = isEditing && isNumericItem(item) && selectedNumericOption === "custom";

  renderSettingSession({
    settings,
    draftSettings,
    items: SETTING_ITEMS,
    selectedIndex,
    selectedBindingSlot,
    isEditing,
    numericInput: isEditing && isNumericItem(item) ? numericInput : undefined,
    selectedNumericOption: isEditing && isNumericItem(item) ? selectedNumericOption : undefined,
    selectedStudyOrderOption: isEditing && isConfigItem(item) && item.key === "studyOrder" ? selectedStudyOrderOption : undefined,
    isBindingCapture: isBindingCapture(),
    isNumericCursor: showNumericCursor,
    editError,
    isReshuffleArmed,
  });
}

function resetEditState() {
  numericInput = "";
  numericInputTouched = false;
  selectedNumericOption = undefined;
  selectedStudyOrderOption = undefined;
  editError = "";
  isReshuffleArmed = false;
}

function isReshuffleSelected(): boolean {
  const item = getSelectedItem();
  return isConfigItem(item) && item.key === "studyOrder" && selectedStudyOrderOption === "reshuffle";
}

function returnToPreviousSession() {
  const onReturn = onReturnToPreviousSession;
  onReturnToPreviousSession = undefined;
  isEditing = false;
  resetEditState();
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
    visibleFields: { ...value.visibleFields },
    keyBindings: cloneKeyBindings(value.keyBindings),
  };
}

function cloneKeyBindings(value: KeyBindings): KeyBindings {
  const bindings = {} as KeyBindings;

  (Object.keys(value) as Array<keyof KeyBindings>).forEach((key) => {
    bindings[key] = [...value[key]] as KeyBindings[typeof key];
  });

  return bindings;
}
