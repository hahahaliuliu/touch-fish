import type { ReadBindingAction, ReadingBookSummary, ReadKeyBindings, ReadSettings } from "../models/reading.js";
import { listReadingBooks, loadReadingBook } from "../services/readingLoader.js";
import { getReadMouseBinding, ReadInputParser, setReadMouseTracking } from "../services/readInput.js";
import { loadReadState, saveReadState } from "../storage/readProgress.js";
import { loadReadSettings, saveReadSettings } from "../storage/readSettings.js";
import { renderReadSettings } from "../ui/readSettingsRenderer.js";
import { clearTerminalForExit } from "../ui/terminalScreen.js";
import { startReadSession } from "./readSession.js";
import { startReadingImportSession } from "./readingImportSession.js";
import { getNextValue, isBackspace, normalizeSettingBinding } from "./settingFormInput.js";
import {
  BINDING_ACTIONS,
  CURRENT_BOOK_ITEM_INDEX,
  IMPORT_ITEM_INDEX,
  INTERFACE_LANGUAGES,
  ITEM_COUNT,
  LANGUAGE_ITEM_INDEX,
  LINE_ITEM_INDEX,
  LINE_OPTIONS,
  MAIN_BINDING_ACTIONS,
  MAIN_BINDING_START_INDEX,
  MINI_COLUMNS_ITEM_INDEX,
  MINI_COLUMN_OPTIONS,
  MINI_FONT_ITEM_INDEX,
  MINI_FONT_OPTIONS,
  MINI_MOUSE_ITEM_INDEX,
  MINI_MOUSE_MODES,
  MINI_ROWS_ITEM_INDEX,
  MINI_ROW_OPTIONS,
  MINI_SCROLL_STEP_ITEM_INDEX,
  MINI_SCROLL_STEP_OPTIONS,
  MINI_WINDOW_BINDING_ITEM_INDEX,
  MINI_WINDOW_ITEM_INDEX,
  SECTION_ITEM_INDEX,
  SECTION_OPTIONS,
  THEME_ITEM_INDEX,
  THEMES,
  WIDTH_ITEM_INDEX,
  WIDTH_OPTIONS,
} from "./readSettingLayout.js";

type BindingSlot = 0 | 1;

let books: ReadingBookSummary[] = [];
let activeBookId: string | undefined;
let settings: ReadSettings;
let selectedIndex = 0;
let selectedBindingSlot: BindingSlot = 0;
let isEditing = false;
let customInput = "";
let numericInputTouched = false;
let selectedNumericOption: number | "custom" | undefined;
let isBindingCapture = false;
let editError = "";
let statusMessage = "";
let onReturnToReading: ((bookId: string) => void) | undefined;
let onOpenMiniMode: ((bookId: string) => void) | undefined;
let onCloseMiniMode: ((bookId: string) => void) | undefined;
let onToggleMiniWindow: (() => void) | undefined;
let miniModeActive = false;
const inputParser = new ReadInputParser();

interface StartReadSettingSessionOptions {
  onReturn?: (bookId: string) => void;
  onOpenMiniMode?: (bookId: string) => void;
  onCloseMiniMode?: (bookId: string) => void;
  onToggleMiniWindow?: () => void;
  miniModeActive?: boolean;
  selectedIndex?: number;
  message?: string;
}

export function startReadSettingSession(options: StartReadSettingSessionOptions = {}) {
  onReturnToReading = options.onReturn;
  onOpenMiniMode = options.onOpenMiniMode;
  onCloseMiniMode = options.onCloseMiniMode;
  onToggleMiniWindow = options.onToggleMiniWindow;
  miniModeActive = options.miniModeActive ?? false;
  books = listReadingBooks();
  activeBookId = loadReadState().activeBookId ?? books[0]?.id;
  settings = loadReadSettings();
  selectedIndex = Math.min(Math.max(options.selectedIndex ?? 0, 0), ITEM_COUNT - 1);
  selectedBindingSlot = 0;
  statusMessage = options.message ?? "";
  resetEditState();
  inputParser.reset();
  process.stdout.on("resize", handleTerminalResize);
  render();

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }
  process.stdin.resume();
  process.stdin.setEncoding("utf8");
  setReadMouseTracking(true);
  process.stdin.on("data", handleKeyPress);
}

function handleKeyPress(key: string) {
  for (const input of inputParser.parse(key.toString())) {
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
    quit();
    return false;
  }

  if (input === "\u000f" && activeBookId) {
    restoreSavedValues();
    returnToReading();
    return false;
  }

  if (input === "\u001b") {
    if (isEditing || isBindingCapture) {
      cancelEdit();
      return true;
    }

    returnToReadingOrQuit();
    return false;
  }

  if (input === "\r" || input === "\n") {
    if (!isBindingCapture) {
      confirmOrStartEdit();
    }
    return true;
  }

  if (isBindingCapture) {
    captureBinding(input);
    return true;
  }

  const binding = normalizeBindingInput(input);
  if (binding && settings.keyBindings.toggleMiniWindow.includes(binding)) {
    restoreSavedValues();
    const keepSettingsOpen = handleReadSettingsMiniWindowShortcut(
      miniModeActive,
      onToggleMiniWindow,
      toggleMiniWindowMode
    );
    if (keepSettingsOpen) {
      render();
    }
    return keepSettingsOpen;
  }

  if (isEditing && selectedNumericOption === "custom" && /^\d$/.test(input)) {
    customInput = numericInputTouched ? `${customInput}${input}` : input;
    numericInputTouched = true;
    editError = "";
    render();
    return true;
  }

  if (isEditing && selectedNumericOption === "custom" && isBackspace(input)) {
    customInput = numericInputTouched ? customInput.slice(0, -1) : "";
    numericInputTouched = true;
    editError = "";
    render();
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

export function handleReadSettingsMiniWindowShortcut(
  isMiniModeActive: boolean,
  toggleWindow: (() => void) | undefined,
  toggleMode: () => void
) {
  if (isMiniModeActive && toggleWindow) {
    toggleWindow();
    return true;
  }

  toggleMode();
  return false;
}

function moveSelection(direction: -1 | 1) {
  if (isEditing || isBindingCapture) {
    return;
  }

  selectedIndex = (selectedIndex + direction + ITEM_COUNT) % ITEM_COUNT;
  selectedBindingSlot = 0;
  statusMessage = "";
  render();
}

function confirmOrStartEdit() {
  if (selectedIndex === IMPORT_ITEM_INDEX) {
    openReadingImport();
    return;
  }

  if (selectedIndex === MINI_WINDOW_ITEM_INDEX) {
    toggleMiniWindowMode();
    return;
  }

  if (isBindingItemSelected()) {
    isBindingCapture = true;
    editError = "";
    render();
    return;
  }

  if (!isEditing) {
    if (selectedIndex === CURRENT_BOOK_ITEM_INDEX && books.length === 0) {
      return;
    }

    isEditing = true;
    editError = "";

    if (isNumericSettingSelected()) {
      const options = getSelectedNumericOptions();
      const currentValue = getSelectedNumericValue();
      selectedNumericOption = options.includes(currentValue) ? currentValue : "custom";
      customInput = String(currentValue);
      numericInputTouched = false;
    }

    render();
    return;
  }

  saveEdit();
}

function changeCurrentValue(direction: -1 | 1) {
  if (isBindingItemSelected() && !isBindingCapture) {
    selectedBindingSlot = selectedBindingSlot === 0 ? 1 : 0;
    render();
    return;
  }

  if (!isEditing) {
    return;
  }

  if (selectedIndex === CURRENT_BOOK_ITEM_INDEX) {
    const currentIndex = Math.max(0, books.findIndex((book) => book.id === activeBookId));
    const nextIndex = (currentIndex + direction + books.length) % books.length;
    activeBookId = books[nextIndex]?.id;
    render();
    return;
  }

  if (selectedIndex === LANGUAGE_ITEM_INDEX) {
    settings = {
      ...settings,
      interfaceLanguage: getNextValue(settings.interfaceLanguage, INTERFACE_LANGUAGES, direction),
    };
    render();
    return;
  }

  if (selectedIndex === THEME_ITEM_INDEX) {
    settings = { ...settings, theme: getNextValue(settings.theme, THEMES, direction) };
    render();
    return;
  }

  if (selectedIndex === MINI_MOUSE_ITEM_INDEX) {
    settings = {
      ...settings,
      miniWindowMouseMode: getNextValue(settings.miniWindowMouseMode, MINI_MOUSE_MODES, direction),
    };
    render();
    return;
  }

  changeNumericValue(direction);
}

function changeNumericValue(direction: -1 | 1) {
  const options = getSelectedNumericOptions();
  const currentValue = getSelectedNumericValue();
  const currentOption = selectedNumericOption ?? (options.includes(currentValue) ? currentValue : "custom");
  const currentIndex = options.indexOf(currentOption);
  const nextIndex = (currentIndex + direction + options.length) % options.length;
  const nextValue = options[nextIndex]!;

  selectedNumericOption = nextValue;
  editError = "";
  if (typeof nextValue === "number") {
    customInput = String(nextValue);
    numericInputTouched = false;
    settings = applySelectedNumericValue(nextValue);
  } else {
    customInput = "";
    numericInputTouched = true;
  }
  render();
}

function saveEdit() {
  if (selectedIndex === CURRENT_BOOK_ITEM_INDEX) {
    if (activeBookId) {
      saveReadState({ activeBookId });
    }
  } else if (selectedNumericOption === "custom") {
    const numericValue = Number(customInput);
    const validationError = getNumericValidationError(numericValue);
    if (validationError) {
      editError = validationError;
      render();
      return;
    }
    settings = applySelectedNumericValue(numericValue);
    saveReadSettings(settings);
  } else {
    saveReadSettings(settings);
  }

  resetEditState();
  render();
}

function isNumericSettingSelected(): boolean {
  return selectedIndex === WIDTH_ITEM_INDEX
    || selectedIndex === LINE_ITEM_INDEX
    || selectedIndex === SECTION_ITEM_INDEX
    || selectedIndex === MINI_COLUMNS_ITEM_INDEX
    || selectedIndex === MINI_ROWS_ITEM_INDEX
    || selectedIndex === MINI_FONT_ITEM_INDEX
    || selectedIndex === MINI_SCROLL_STEP_ITEM_INDEX;
}

function getSelectedNumericOptions(): Array<number | "custom"> {
  if (selectedIndex === WIDTH_ITEM_INDEX) {
    return WIDTH_OPTIONS;
  }
  if (selectedIndex === SECTION_ITEM_INDEX) {
    return SECTION_OPTIONS;
  }
  if (selectedIndex === MINI_COLUMNS_ITEM_INDEX) {
    return MINI_COLUMN_OPTIONS;
  }
  if (selectedIndex === MINI_ROWS_ITEM_INDEX) {
    return MINI_ROW_OPTIONS;
  }
  if (selectedIndex === MINI_FONT_ITEM_INDEX) {
    return MINI_FONT_OPTIONS;
  }
  if (selectedIndex === MINI_SCROLL_STEP_ITEM_INDEX) {
    return MINI_SCROLL_STEP_OPTIONS;
  }
  return LINE_OPTIONS;
}

function getSelectedNumericValue(): number {
  if (selectedIndex === WIDTH_ITEM_INDEX) {
    return settings.contentWidth;
  }
  if (selectedIndex === SECTION_ITEM_INDEX) {
    return settings.chapterSectionCount;
  }
  if (selectedIndex === MINI_COLUMNS_ITEM_INDEX) {
    return settings.miniWindowColumns;
  }
  if (selectedIndex === MINI_ROWS_ITEM_INDEX) {
    return settings.miniWindowRows;
  }
  if (selectedIndex === MINI_FONT_ITEM_INDEX) {
    return settings.miniWindowFontSize;
  }
  if (selectedIndex === MINI_SCROLL_STEP_ITEM_INDEX) {
    return settings.miniWindowScrollStep;
  }
  return settings.pageLineCount;
}

function applySelectedNumericValue(value: number): ReadSettings {
  if (selectedIndex === WIDTH_ITEM_INDEX) {
    return { ...settings, contentWidth: value };
  }
  if (selectedIndex === SECTION_ITEM_INDEX) {
    return { ...settings, chapterSectionCount: value };
  }
  if (selectedIndex === MINI_COLUMNS_ITEM_INDEX) {
    return { ...settings, miniWindowColumns: value };
  }
  if (selectedIndex === MINI_ROWS_ITEM_INDEX) {
    return { ...settings, miniWindowRows: value };
  }
  if (selectedIndex === MINI_FONT_ITEM_INDEX) {
    return { ...settings, miniWindowFontSize: value };
  }
  if (selectedIndex === MINI_SCROLL_STEP_ITEM_INDEX) {
    return { ...settings, miniWindowScrollStep: value };
  }
  return { ...settings, pageLineCount: value };
}

function getNumericValidationError(value: number): string {
  if (selectedIndex === WIDTH_ITEM_INDEX) {
    return Number.isInteger(value) && value >= 20
      ? ""
      : localize("Content width must be a whole number of at least 20", "正文宽度必须是大于等于 20 的整数");
  }

  if (selectedIndex === SECTION_ITEM_INDEX) {
    return Number.isInteger(value) && value >= 2 && value <= 20
      ? ""
      : localize("Chapter sections must be a whole number from 2 to 20", "章节切分必须是 2 到 20 的整数");
  }

  if (selectedIndex === MINI_COLUMNS_ITEM_INDEX) {
    return Number.isInteger(value) && value >= 20 && value <= 500
      ? ""
      : localize("Mini-window width must be a whole number from 20 to 500", "小窗口宽度必须是 20 到 500 的整数");
  }

  if (selectedIndex === MINI_ROWS_ITEM_INDEX) {
    return Number.isInteger(value) && value >= 5 && value <= 200
      ? ""
      : localize("Mini-window height must be a whole number from 5 to 200", "小窗口高度必须是 5 到 200 的整数");
  }

  if (selectedIndex === MINI_FONT_ITEM_INDEX) {
    return Number.isInteger(value) && value >= 5 && value <= 72
      ? ""
      : localize("Mini-window font size must be a whole number from 5 to 72", "小窗口字体必须是 5 到 72 的整数");
  }

  if (selectedIndex === MINI_SCROLL_STEP_ITEM_INDEX) {
    return Number.isInteger(value) && value >= 1 && value <= 100
      ? ""
      : localize("Scroll speed must be a whole number from 1 to 100", "滚动速率必须是 1 到 100 的整数");
  }

  return Number.isInteger(value) && value >= 1 && value <= 100
    ? ""
    : localize("Page lines must be a whole number from 1 to 100", "每页行数必须是 1 到 100 的整数");
}

function cancelEdit() {
  restoreSavedValues();
  render();
}

function restoreSavedValues() {
  settings = loadReadSettings();
  activeBookId = loadReadState().activeBookId ?? books[0]?.id;
  resetEditState();
}

function resetEditState() {
  isEditing = false;
  isBindingCapture = false;
  customInput = "";
  numericInputTouched = false;
  selectedNumericOption = undefined;
  editError = "";
}

function render() {
  renderReadSettings({
    books,
    activeBookId,
    settings,
    selectedIndex,
    selectedBindingSlot,
    isEditing,
    customInput,
    selectedNumericOption,
    isBindingCapture,
    editError,
    statusMessage,
    miniModeActive,
  });
}

function captureBinding(input: string) {
  if (isBackspace(input)) {
    saveBinding("");
    return;
  }

  const binding = normalizeBindingInput(input);
  if (!binding) {
    editError = localize(
      "Use one English key, symbol, Space, Tab, or an arrow key",
      "请按英文键、符号、空格、Tab 或方向键"
    );
    render();
    return;
  }

  saveBinding(binding);
}

function saveBinding(binding: string) {
  const action = getSelectedBindingAction();
  if (!action) {
    return;
  }

  const keyBindings = cloneKeyBindings(settings.keyBindings);
  if (binding) {
    BINDING_ACTIONS.forEach((key) => {
      keyBindings[key] = keyBindings[key].map((value) => value === binding ? "" : value) as [string, string];
    });
  }
  keyBindings[action][selectedBindingSlot] = binding;
  settings = { ...settings, keyBindings };
  saveReadSettings(settings);
  resetEditState();
  render();
}

function cloneKeyBindings(value: ReadKeyBindings): ReadKeyBindings {
  const bindings = {} as ReadKeyBindings;
  BINDING_ACTIONS.forEach((key) => {
    bindings[key] = [...value[key]];
  });
  return bindings;
}

function normalizeBindingInput(input: string): string | undefined {
  return getReadMouseBinding(input) ?? normalizeSettingBinding(input);
}

function isBindingItemSelected(): boolean {
  return (selectedIndex >= MAIN_BINDING_START_INDEX
      && selectedIndex < MAIN_BINDING_START_INDEX + MAIN_BINDING_ACTIONS.length)
    || selectedIndex === MINI_WINDOW_BINDING_ITEM_INDEX;
}

function getSelectedBindingAction(): ReadBindingAction | undefined {
  if (selectedIndex === MINI_WINDOW_BINDING_ITEM_INDEX) {
    return "toggleMiniWindow";
  }
  return MAIN_BINDING_ACTIONS[selectedIndex - MAIN_BINDING_START_INDEX];
}

function openReadingImport() {
  const returnCallback = onReturnToReading;
  const openMiniCallback = onOpenMiniMode;
  const closeMiniCallback = onCloseMiniMode;
  const toggleMiniCallback = onToggleMiniWindow;
  const wasMiniModeActive = miniModeActive;
  process.stdin.off("data", handleKeyPress);
  process.stdout.off("resize", handleTerminalResize);
  setReadMouseTracking(false);
  startReadingImportSession({
    interfaceLanguage: settings.interfaceLanguage,
    onReturn: () => startReadSettingSession({
      ...(returnCallback ? { onReturn: returnCallback } : {}),
      ...(openMiniCallback ? { onOpenMiniMode: openMiniCallback } : {}),
      ...(closeMiniCallback ? { onCloseMiniMode: closeMiniCallback } : {}),
      ...(toggleMiniCallback ? { onToggleMiniWindow: toggleMiniCallback } : {}),
      miniModeActive: wasMiniModeActive,
      selectedIndex: IMPORT_ITEM_INDEX,
    }),
  });
}

function toggleMiniWindowMode() {
  const selectedBookId = activeBookId;
  if (!selectedBookId) {
    return;
  }

  saveReadState({ activeBookId: selectedBookId });
  process.stdin.off("data", handleKeyPress);
  process.stdout.off("resize", handleTerminalResize);
  setReadMouseTracking(false);

  if (miniModeActive) {
    onCloseMiniMode?.(selectedBookId);
    return;
  }

  onOpenMiniMode?.(selectedBookId);
}

function localize(english: string, chinese: string): string {
  return settings.interfaceLanguage === "chinese" ? chinese : english;
}

function quit() {
  process.stdin.off("data", handleKeyPress);
  process.stdout.off("resize", handleTerminalResize);
  setReadMouseTracking(false);
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }
  clearTerminalForExit();
  process.stdin.pause();
  process.exit(0);
}

function openReadingSession() {
  const selectedBookId = activeBookId;
  if (!selectedBookId) {
    return;
  }

  saveReadState({ activeBookId: selectedBookId });
  process.stdin.off("data", handleKeyPress);
  process.stdout.off("resize", handleTerminalResize);
  setReadMouseTracking(false);
  startReadSession(loadReadingBook(selectedBookId));
}

function returnToReading() {
  if (onReturnToReading && activeBookId) {
    process.stdin.off("data", handleKeyPress);
    process.stdout.off("resize", handleTerminalResize);
    setReadMouseTracking(false);
    onReturnToReading(activeBookId);
    return;
  }

  openReadingSession();
}

function returnToReadingOrQuit() {
  if (onReturnToReading) {
    returnToReading();
    return;
  }

  quit();
}
