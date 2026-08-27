import type { KeyBindings, Settings } from "../models/settings.js";
import { reshuffleRandomOrder } from "../services/randomOrder.js";
import { loadSettings, saveSettings } from "../services/settingsLoader.js";
import { listVocabularyBooks } from "../services/vocabularyLoader.js";
import { renderSettingSession } from "../ui/settingsRenderer.js";
import { clearTerminalForExit } from "../ui/terminalScreen.js";
import {
  AVAILABLE_THEMES,
  createSettingItems,
  INTERFACE_LANGUAGES,
  NOTE_MODES,
  STUDY_GROUP_SIZES,
  STUDY_ORDERS,
  WORKSPACE_SIZES,
  type ActionItem,
  type BindingItem,
  type ConfigItem,
  type SettingItem,
} from "./settingItems.js";
import {
  getNextValue,
  isBackspace,
  normalizeSettingBinding,
  parseTerminalInputs,
} from "./settingFormInput.js";
import { startVocabularyDownloadSession } from "./vocabularyDownloadSession.js";

const RETURN_TO_WORD_KEY = "\u000f";
type NumericOption = number | "custom";
type StudyOrderOption = Settings["studyOrder"] | "reshuffle";
type BindingSlot = 0 | 1;
const STUDY_ORDER_OPTIONS: readonly StudyOrderOption[] = [...STUDY_ORDERS, "reshuffle"];

interface StartSettingSessionOptions {
  onReturn?: () => void;
  selectedIndex?: number;
}


interface SettingSessionState {
  onReturnToPreviousSession: (() => void) | undefined;
  settings: Settings;
  settingItems: SettingItem[];
  selectedIndex: number;
  selectedBindingSlot: BindingSlot;
  isEditing: boolean;
  draftSettings: Settings;
  numericInput: string;
  numericInputTouched: boolean;
  selectedNumericOption: NumericOption | undefined;
  selectedStudyOrderOption: StudyOrderOption | undefined;
  editError: string;
  isReshuffleArmed: boolean;
}

function createSettingState(options: StartSettingSessionOptions = {}): SettingSessionState {
  const initialSettings = loadSettings();
  const items = createSettingItems(initialSettings.interfaceLanguage);
  return {
    onReturnToPreviousSession: options.onReturn,
    settings: initialSettings,
    settingItems: items,
    selectedIndex: Math.min(
      Math.max(options.selectedIndex ?? 0, 0),
      Math.max(items.length - 1, 0)
    ),
    selectedBindingSlot: 0,
    isEditing: false,
    draftSettings: initialSettings,
    numericInput: "",
    numericInputTouched: false,
    selectedNumericOption: undefined,
    selectedStudyOrderOption: undefined,
    editError: "",
    isReshuffleArmed: false,
  };
}

let state: SettingSessionState = createSettingState();

export function startSettingSession(options: StartSettingSessionOptions = {}) {
  state = createSettingState(options);
  process.stdout.on("resize", handleTerminalResize);
  render();

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }
  process.stdin.resume();
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", handleKeyPress);
}

function handleKeyPress(key: string) {
  for (const input of parseTerminalInputs(key.toString())) {
    if (!handleInput(input)) {
      return;
    }
  }
}

function handleTerminalResize() {
  render();
}

function handleInput(input: string): boolean {
  if (input === "\u0003" || input.toLowerCase() === "q") {
    quitSettingSession();
  }

  if (input === RETURN_TO_WORD_KEY && state.onReturnToPreviousSession) {
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

  if (state.isEditing && isReshuffleSelected() && input === " ") {
    state.isReshuffleArmed = true;
    state.editError = "";
    render();
    return true;
  }

  if (state.isEditing && isNumericItem(getSelectedItem()) && /^\d$/.test(input)) {
    appendNumericInput(input);
    return true;
  }

  if (state.isEditing && isNumericItem(getSelectedItem()) && isBackspace(input)) {
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
  if (state.isEditing) {
    return;
  }

  state.selectedIndex = (state.selectedIndex + direction + state.settingItems.length) % state.settingItems.length;
  state.selectedBindingSlot = 0;
  render();
}

function confirmOrStartEdit() {
  const item = getSelectedItem();

  if (isActionItem(item)) {
    if (item.id === "view-favorites") {
      openFavoriteSession();
    } else {
      openVocabularyDownloadSession();
    }
    return;
  }

  if (isBindingItem(item)) {
    state.isEditing = true;
    state.editError = "";
    render();
    return;
  }

  if (!item.options || isInactive(item)) {
    return;
  }

  if (!state.isEditing) {
    state.draftSettings = cloneSettings(state.settings);
    state.isEditing = true;
    state.editError = "";

    if (isNumericItem(item)) {
      const currentValue = getNumericSettingValue(state.draftSettings, item.key);
      const presets = getNumericPresets(item.key);
      state.selectedNumericOption = presets.includes(currentValue) ? currentValue : "custom";
      state.numericInput = String(currentValue);
      state.numericInputTouched = false;
    }

    if (item.key === "studyOrder") {
      state.selectedStudyOrderOption = state.draftSettings.studyOrder;
    }

    render();
    return;
  }

  if (isReshuffleSelected()) {
    if (!state.isReshuffleArmed) {
      state.editError = "Press Space to arm reshuffle before pressing Enter";
      render();
      return;
    }

    state.draftSettings = { ...state.draftSettings, studyOrder: "random" };
    state.settings = cloneSettings(state.draftSettings);
    saveSettings(state.settings);
    reshuffleRandomOrder();
    state.isEditing = false;
    resetEditState();
    render();
    return;
  }

  if (isNumericItem(item) && !applyNumericInput()) {
    render();
    return;
  }

  state.settings = cloneSettings(state.draftSettings);
  saveSettings(state.settings);
  state.settingItems = createSettingItems(state.settings.interfaceLanguage);
  state.isEditing = false;
  resetEditState();
  render();
}

function cancelEdit() {
  if (!state.isEditing) {
    if (state.onReturnToPreviousSession) {
      returnToPreviousSession();
    }
    return;
  }

  state.draftSettings = state.settings;
  state.settingItems = createSettingItems(state.settings.interfaceLanguage);
  state.isEditing = false;
  resetEditState();
  render();
}

function changeCurrentValue(direction: -1 | 1) {
  const item = getSelectedItem();

  if (isBindingItem(item)) {
    if (!state.isEditing) {
      state.selectedBindingSlot = state.selectedBindingSlot === 0 ? 1 : 0;
      render();
    }
    return;
  }

  if (!isConfigItem(item) || !state.isEditing || !item.options || isInactive(item)) {
    return;
  }

  if (item.key === "studyGroupEnabled") {
    state.draftSettings = { ...state.draftSettings, studyGroupEnabled: !state.draftSettings.studyGroupEnabled };
  }

  if (item.key === "workspaceSize") {
    updateNumericOption(item.key, getNextNumericOption(state.selectedNumericOption ?? state.draftSettings.workspaceSize, WORKSPACE_SIZES, direction));
  }

  if (item.key === "dailyWordCount") {
    updateNumericOption(item.key, getNextNumericOption(state.selectedNumericOption ?? state.draftSettings.dailyWordCount, STUDY_GROUP_SIZES, direction));
  }

  if (item.key === "navigationLoop") {
    state.draftSettings = { ...state.draftSettings, navigationLoop: !state.draftSettings.navigationLoop };
  }

  if (item.key === "interfaceLanguage") {
    state.draftSettings = {
      ...state.draftSettings,
      interfaceLanguage: getNextValue(state.draftSettings.interfaceLanguage, INTERFACE_LANGUAGES, direction),
    };
    state.settingItems = createSettingItems(state.draftSettings.interfaceLanguage);
  }

  if (item.key === "noteMode") {
    state.draftSettings = {
      ...state.draftSettings,
      noteMode: getNextValue(state.draftSettings.noteMode, NOTE_MODES, direction),
    };
  }

  if (item.key === "studyOrder") {
    const nextOption = getNextValue(state.selectedStudyOrderOption ?? state.draftSettings.studyOrder, STUDY_ORDER_OPTIONS, direction);
    state.selectedStudyOrderOption = nextOption;
    state.isReshuffleArmed = false;
    state.draftSettings = { ...state.draftSettings, studyOrder: nextOption === "reshuffle" ? "random" : nextOption };
  }

  if (item.key === "activeVocabularyBook" && item.options) {
    const bookIds = item.options as readonly string[];
    state.draftSettings = {
      ...state.draftSettings,
      activeVocabularyBook: getNextValue(state.draftSettings.activeVocabularyBook, bookIds, direction),
    };
  }

  if (item.key === "theme") {
    state.draftSettings = { ...state.draftSettings, theme: getNextValue(state.draftSettings.theme, AVAILABLE_THEMES, direction) };
  }

  state.editError = "";
  render();
}

function captureBinding(input: string) {
  if (isBackspace(input)) {
    saveBinding("");
    return;
  }

  const binding = normalizeSettingBinding(input);

  if (!binding) {
    state.editError = "Use one English key, symbol, Space, Tab, or an arrow key";
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

  const keyBindings = cloneKeyBindings(state.settings.keyBindings);

  if (binding) {
    (Object.keys(keyBindings) as Array<keyof KeyBindings>).forEach((key) => {
      keyBindings[key] = keyBindings[key].map((value) => (value === binding ? "" : value)) as KeyBindings[typeof key];
    });
  }

  keyBindings[item.key][state.selectedBindingSlot] = binding;
  state.settings = { ...state.settings, keyBindings };
  state.draftSettings = state.settings;
  saveSettings(state.settings);
  state.isEditing = false;
  resetEditState();
  render();
}

function appendNumericInput(input: string) {
  state.selectedNumericOption = "custom";
  state.numericInput = state.numericInputTouched ? `${state.numericInput}${input}` : input;
  state.numericInputTouched = true;
  applyNumericInput();
  render();
}

function deleteNumericInput() {
  state.selectedNumericOption = "custom";
  state.numericInput = state.numericInputTouched ? state.numericInput.slice(0, -1) : "";
  state.numericInputTouched = true;
  applyNumericInput();
  render();
}

function applyNumericInput(): boolean {
  const item = getSelectedItem();
  const value = Number(state.numericInput);

  if (!Number.isInteger(value) || value <= 0) {
    state.editError = "Enter a whole number greater than zero";
    return false;
  }

  if (isConfigItem(item) && item.key === "workspaceSize") {
    state.draftSettings = { ...state.draftSettings, workspaceSize: value };
  }

  if (isConfigItem(item) && item.key === "dailyWordCount") {
    state.draftSettings = { ...state.draftSettings, dailyWordCount: value };
  }

  state.editError = "";
  return true;
}

function updateNumericOption(key: keyof Settings, option: NumericOption) {
  state.selectedNumericOption = option;

  if (option === "custom") {
    state.numericInput = "";
    state.numericInputTouched = true;
    return;
  }

  state.numericInput = String(option);
  state.numericInputTouched = false;

  if (key === "workspaceSize") {
    state.draftSettings = { ...state.draftSettings, workspaceSize: option };
  }

  if (key === "dailyWordCount") {
    state.draftSettings = { ...state.draftSettings, dailyWordCount: option };
  }
}

function isBindingItem(item: SettingItem): item is BindingItem {
  return item.kind === "binding";
}

function isConfigItem(item: SettingItem): item is ConfigItem {
  return item.kind === "setting";
}

function isActionItem(item: SettingItem): item is ActionItem {
  return item.kind === "action";
}

function isNumericItem(item: SettingItem): item is ConfigItem {
  return isConfigItem(item) && item.acceptsNumber === true;
}

function isInactive(item: ConfigItem): boolean {
  return item.key === "dailyWordCount" && !state.draftSettings.studyGroupEnabled;
}

function isBindingCapture(): boolean {
  return state.isEditing && isBindingItem(getSelectedItem());
}

function getNumericSettingValue(settingsValue: Settings, key: keyof Settings): number {
  return key === "workspaceSize" || key === "dailyWordCount" ? settingsValue[key] : 0;
}

function getNumericPresets(key: keyof Settings): readonly number[] {
  return key === "workspaceSize" ? WORKSPACE_SIZES : STUDY_GROUP_SIZES;
}

function getNextNumericOption(currentOption: NumericOption, presets: readonly number[], direction: -1 | 1): NumericOption {
  const options: NumericOption[] = [...presets, "custom"];
  const currentIndex = options.indexOf(currentOption);
  const fallbackIndex = direction === 1 ? 0 : options.length - 1;
  const nextIndex = currentIndex === -1 ? fallbackIndex : (currentIndex + direction + options.length) % options.length;
  return options[nextIndex] ?? options[0]!;
}

function getSelectedItem(): SettingItem {
  return state.settingItems[state.selectedIndex] ?? state.settingItems[0]!;
}

function render() {
  const item = getSelectedItem();
  const showNumericCursor = state.isEditing && isNumericItem(item) && state.selectedNumericOption === "custom";

  renderSettingSession({
    settings: state.settings,
    draftSettings: state.draftSettings,
    items: state.settingItems,
    selectedIndex: state.selectedIndex,
    selectedBindingSlot: state.selectedBindingSlot,
    isEditing: state.isEditing,
    numericInput: state.isEditing && isNumericItem(item) ? state.numericInput : undefined,
    selectedNumericOption: state.isEditing && isNumericItem(item) ? state.selectedNumericOption : undefined,
    selectedStudyOrderOption: state.isEditing && isConfigItem(item) && item.key === "studyOrder" ? state.selectedStudyOrderOption : undefined,
    isBindingCapture: isBindingCapture(),
    isNumericCursor: showNumericCursor,
    editError: state.editError,
    isReshuffleArmed: state.isReshuffleArmed,
  });
}

function openVocabularyDownloadSession() {
  const returnSelectedIndex = state.selectedIndex;
  process.stdin.off("data", handleKeyPress);
  process.stdout.off("resize", handleTerminalResize);
  void startVocabularyDownloadSession({
    onReturn: () => {
      startSettingSession({
        ...(state.onReturnToPreviousSession ? { onReturn: state.onReturnToPreviousSession } : {}),
        selectedIndex: returnSelectedIndex,
      });
    },
  });
}

function openFavoriteSession() {
  const returnSelectedIndex = state.selectedIndex;
  process.stdin.off("data", handleKeyPress);
  process.stdout.off("resize", handleTerminalResize);
  void import("./favoriteSession.js").then(({ startFavoriteSession }) => {
    startFavoriteSession({
      onReturn: () => startSettingSession({
        ...(state.onReturnToPreviousSession ? { onReturn: state.onReturnToPreviousSession } : {}),
        selectedIndex: returnSelectedIndex,
      }),
    });
  });
}

function resetEditState() {
  state.numericInput = "";
  state.numericInputTouched = false;
  state.selectedNumericOption = undefined;
  state.selectedStudyOrderOption = undefined;
  state.editError = "";
  state.isReshuffleArmed = false;
}

function isReshuffleSelected(): boolean {
  const item = getSelectedItem();
  return isConfigItem(item) && item.key === "studyOrder" && state.selectedStudyOrderOption === "reshuffle";
}

function returnToPreviousSession() {
  if (listVocabularyBooks().length === 0) {
    state.editError = "Download or import a vocabulary book before returning to word mode";
    render();
    return;
  }

  const onReturn = state.onReturnToPreviousSession;
  state.onReturnToPreviousSession = undefined;
  state.isEditing = false;
  resetEditState();
  process.stdin.off("data", handleKeyPress);
  process.stdout.off("resize", handleTerminalResize);
  onReturn?.();
}

function quitSettingSession() {
  process.stdout.off("resize", handleTerminalResize);
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }
  clearTerminalForExit();
  process.stdin.pause();
  process.exit(0);
}

function cloneSettings(value: Settings): Settings {
  return {
    ...value,
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
