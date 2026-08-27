import type { InterfaceLanguage, KeyBindings, NoteMode, Settings, ThemeName } from "../models/settings.js";
import { reshuffleRandomOrder } from "../services/randomOrder.js";
import { loadSettings, saveSettings } from "../services/settingsLoader.js";
import { listVocabularyBooks } from "../services/vocabularyLoader.js";
import { renderSettingSession } from "../ui/settingsRenderer.js";
import { clearTerminalForExit } from "../ui/terminalScreen.js";
import { startVocabularyDownloadSession } from "./vocabularyDownloadSession.js";
import {
  getNextValue,
  isBackspace,
  normalizeSettingBinding,
  parseTerminalInputs,
} from "./settingFormInput.js";

const RETURN_TO_WORD_KEY = "\u000f";
const WORKSPACE_SIZES = [1, 3, 5];
const STUDY_GROUP_SIZES = [10, 20, 30];
const STUDY_ORDERS: Array<Settings["studyOrder"]> = ["sequential", "reverse", "random"];
const AVAILABLE_THEMES: readonly ThemeName[] = ["build-log", "backend-log", "git"];
const INTERFACE_LANGUAGES: readonly InterfaceLanguage[] = ["english", "chinese"];
const NOTE_MODES: readonly NoteMode[] = ["hidden", "visible", "editable"];
type NumericOption = number | "custom";
type StudyOrderOption = Settings["studyOrder"] | "reshuffle";
type BindingSlot = 0 | 1;
const STUDY_ORDER_OPTIONS: readonly StudyOrderOption[] = [...STUDY_ORDERS, "reshuffle"];

interface StartSettingSessionOptions {
  onReturn?: () => void;
  selectedIndex?: number;
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

interface ActionItem {
  kind: "action";
  id: "download-vocabulary" | "view-favorites";
  label: string;
}

type SettingItem = ConfigItem | BindingItem | ActionItem;

let onReturnToPreviousSession: (() => void) | undefined;
let settings = loadSettings();
let settingItems = createSettingItems();
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
  settingItems = createSettingItems();
  selectedIndex = Math.min(
    Math.max(options.selectedIndex ?? 0, 0),
    Math.max(settingItems.length - 1, 0)
  );
  selectedBindingSlot = 0;
  isEditing = false;
  draftSettings = settings;
  resetEditState();
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

  selectedIndex = (selectedIndex + direction + settingItems.length) % settingItems.length;
  selectedBindingSlot = 0;
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
  settingItems = createSettingItems(settings.interfaceLanguage);
  isEditing = false;
  resetEditState();
  render();
}

function cancelEdit() {
  if (!isEditing) {
    if (onReturnToPreviousSession) {
      returnToPreviousSession();
    }
    return;
  }

  draftSettings = settings;
  settingItems = createSettingItems(settings.interfaceLanguage);
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

  if (!isConfigItem(item) || !isEditing || !item.options || isInactive(item)) {
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

  if (item.key === "interfaceLanguage") {
    draftSettings = {
      ...draftSettings,
      interfaceLanguage: getNextValue(draftSettings.interfaceLanguage, INTERFACE_LANGUAGES, direction),
    };
    settingItems = createSettingItems(draftSettings.interfaceLanguage);
  }

  if (item.key === "noteMode") {
    draftSettings = {
      ...draftSettings,
      noteMode: getNextValue(draftSettings.noteMode, NOTE_MODES, direction),
    };
  }

  if (item.key === "studyOrder") {
    const nextOption = getNextValue(selectedStudyOrderOption ?? draftSettings.studyOrder, STUDY_ORDER_OPTIONS, direction);
    selectedStudyOrderOption = nextOption;
    isReshuffleArmed = false;
    draftSettings = { ...draftSettings, studyOrder: nextOption === "reshuffle" ? "random" : nextOption };
  }

  if (item.key === "activeVocabularyBook" && item.options) {
    const bookIds = item.options as readonly string[];
    draftSettings = {
      ...draftSettings,
      activeVocabularyBook: getNextValue(draftSettings.activeVocabularyBook, bookIds, direction),
    };
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

  const binding = normalizeSettingBinding(input);

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

function getNextNumericOption(currentOption: NumericOption, presets: readonly number[], direction: -1 | 1): NumericOption {
  const options: NumericOption[] = [...presets, "custom"];
  const currentIndex = options.indexOf(currentOption);
  const fallbackIndex = direction === 1 ? 0 : options.length - 1;
  const nextIndex = currentIndex === -1 ? fallbackIndex : (currentIndex + direction + options.length) % options.length;
  return options[nextIndex] ?? options[0]!;
}

function getSelectedItem(): SettingItem {
  return settingItems[selectedIndex] ?? settingItems[0]!;
}

function render() {
  const item = getSelectedItem();
  const showNumericCursor = isEditing && isNumericItem(item) && selectedNumericOption === "custom";

  renderSettingSession({
    settings,
    draftSettings,
    items: settingItems,
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

function createSettingItems(language: InterfaceLanguage = settings.interfaceLanguage): SettingItem[] {
  const vocabularyBookIds = listVocabularyBooks().map((book) => book.id);
  const labels = getSettingLabels(language);

  return [
    { kind: "setting", key: "studyGroupEnabled", label: labels.groupVocabulary, options: [false, true] },
    { kind: "setting", key: "workspaceSize", label: labels.pageSize, options: WORKSPACE_SIZES, acceptsNumber: true },
    { kind: "setting", key: "dailyWordCount", label: labels.groupSize, options: STUDY_GROUP_SIZES, acceptsNumber: true },
    { kind: "setting", key: "navigationLoop", label: labels.navigationLoop, options: [false, true] },
    { kind: "setting", key: "interfaceLanguage", label: labels.interfaceLanguage, options: INTERFACE_LANGUAGES },
    { kind: "setting", key: "noteMode", label: labels.notes, options: NOTE_MODES },
    { kind: "setting", key: "studyOrder", label: labels.studyOrder, options: STUDY_ORDERS },
    { kind: "setting", key: "activeVocabularyBook", label: labels.vocabularyBook, options: vocabularyBookIds },
    { kind: "action", id: "view-favorites", label: language === "chinese" ? "查看收藏" : "View Favorites" },
    { kind: "action", id: "download-vocabulary", label: labels.downloadVocabulary },
    { kind: "setting", key: "theme", label: labels.theme, options: AVAILABLE_THEMES },
    { kind: "binding", key: "previous", label: labels.previousPage },
    { kind: "binding", key: "next", label: labels.nextPage },
    { kind: "binding", key: "previousGroup", label: labels.previousGroup },
    { kind: "binding", key: "nextGroup", label: labels.nextGroup },
    { kind: "binding", key: "repeat", label: labels.repeatNavigation },
    { kind: "binding", key: "switchDisplayMode", label: labels.switchDisplay },
    { kind: "binding", key: "startQuiz", label: labels.startQuiz },
    { kind: "binding", key: "editNote", label: labels.editNote },
    { kind: "binding", key: "toggleHelp", label: labels.toggleHelp },
  ];
}

function getSettingLabels(language: InterfaceLanguage) {
  if (language === "chinese") {
    return {
      groupVocabulary: "单词分组",
      pageSize: "每页数量",
      groupSize: "分组大小",
      navigationLoop: "翻页循环",
      interfaceLanguage: "界面语言",
      notes: "备注",
      studyOrder: "学习顺序",
      vocabularyBook: "当前词书",
      downloadVocabulary: "下载或导入词书",
      theme: "伪装主题",
      previousPage: "上一页",
      nextPage: "下一页",
      previousGroup: "上一组",
      nextGroup: "下一组",
      repeatNavigation: "重复翻页",
      switchDisplay: "切换单词显示",
      startQuiz: "开始组内测试",
      editNote: "编辑备注",
      toggleHelp: "打开帮助",
    };
  }

  return {
    groupVocabulary: "Group Vocabulary",
    pageSize: "Page Size",
    groupSize: "Group Size",
    navigationLoop: "Navigation Loop",
    interfaceLanguage: "Interface Language",
    notes: "Notes",
    studyOrder: "Study Order",
    vocabularyBook: "Vocabulary Book",
    downloadVocabulary: "Download Vocabulary",
    theme: "Theme",
    previousPage: "Previous Page",
    nextPage: "Next Page",
    previousGroup: "Previous Group",
    nextGroup: "Next Group",
    repeatNavigation: "Repeat Navigation",
    switchDisplay: "Switch Display",
    startQuiz: "Start Group Quiz",
    editNote: "Edit Notes",
    toggleHelp: "Toggle Help",
  };
}

function openVocabularyDownloadSession() {
  const returnSelectedIndex = selectedIndex;
  process.stdin.off("data", handleKeyPress);
  process.stdout.off("resize", handleTerminalResize);
  void startVocabularyDownloadSession({
    onReturn: () => {
      startSettingSession({
        ...(onReturnToPreviousSession ? { onReturn: onReturnToPreviousSession } : {}),
        selectedIndex: returnSelectedIndex,
      });
    },
  });
}

function openFavoriteSession() {
  const returnSelectedIndex = selectedIndex;
  process.stdin.off("data", handleKeyPress);
  process.stdout.off("resize", handleTerminalResize);
  void import("./favoriteSession.js").then(({ startFavoriteSession }) => {
    startFavoriteSession({
      onReturn: () => startSettingSession({
        ...(onReturnToPreviousSession ? { onReturn: onReturnToPreviousSession } : {}),
        selectedIndex: returnSelectedIndex,
      }),
    });
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
  if (listVocabularyBooks().length === 0) {
    editError = "Download or import a vocabulary book before returning to word mode";
    render();
    return;
  }

  const onReturn = onReturnToPreviousSession;
  onReturnToPreviousSession = undefined;
  isEditing = false;
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
