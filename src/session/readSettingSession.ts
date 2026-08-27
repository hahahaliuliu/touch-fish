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

interface ReadSettingState {
  books: ReadingBookSummary[];
  activeBookId: string | undefined;
  settings: ReadSettings;
  selectedIndex: number;
  selectedBindingSlot: BindingSlot;
  isEditing: boolean;
  customInput: string;
  numericInputTouched: boolean;
  selectedNumericOption: number | "custom" | undefined;
  isBindingCapture: boolean;
  editError: string;
  statusMessage: string;
  onReturnToReading: ((bookId: string) => void) | undefined;
  onOpenMiniMode: ((bookId: string) => void) | undefined;
  onCloseMiniMode: ((bookId: string) => void) | undefined;
  onToggleMiniWindow: (() => void) | undefined;
  miniModeActive: boolean;
}

function createReadSettingState(options: StartReadSettingSessionOptions = {}): ReadSettingState {
  const initialBooks = listReadingBooks();
  const initialSettings = loadReadSettings();
  return {
    books: initialBooks,
    activeBookId: loadReadState().activeBookId ?? initialBooks[0]?.id,
    settings: initialSettings,
    selectedIndex: Math.min(Math.max(options.selectedIndex ?? 0, 0), ITEM_COUNT - 1),
    selectedBindingSlot: 0,
    isEditing: false,
    customInput: "",
    numericInputTouched: false,
    selectedNumericOption: undefined,
    isBindingCapture: false,
    editError: "",
    statusMessage: options.message ?? "",
    onReturnToReading: options.onReturn,
    onOpenMiniMode: options.onOpenMiniMode,
    onCloseMiniMode: options.onCloseMiniMode,
    onToggleMiniWindow: options.onToggleMiniWindow,
    miniModeActive: options.miniModeActive ?? false,
  };
}

let state: ReadSettingState = {
  books: [],
  activeBookId: undefined,
  settings: loadReadSettings(),
  selectedIndex: 0,
  selectedBindingSlot: 0,
  isEditing: false,
  customInput: "",
  numericInputTouched: false,
  selectedNumericOption: undefined,
  isBindingCapture: false,
  editError: "",
  statusMessage: "",
  onReturnToReading: undefined,
  onOpenMiniMode: undefined,
  onCloseMiniMode: undefined,
  onToggleMiniWindow: undefined,
  miniModeActive: false,
};

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
  state = createReadSettingState(options);
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

  if (input === "\u000f" && state.activeBookId) {
    restoreSavedValues();
    returnToReading();
    return false;
  }

  if (input === "\u001b") {
    if (state.isEditing || state.isBindingCapture) {
      cancelEdit();
      return true;
    }

    returnToReadingOrQuit();
    return false;
  }

  if (input === "\r" || input === "\n") {
    if (!state.isBindingCapture) {
      confirmOrStartEdit();
    }
    return true;
  }

  if (state.isBindingCapture) {
    captureBinding(input);
    return true;
  }

  const binding = normalizeBindingInput(input);
  if (binding && state.settings.keyBindings.toggleMiniWindow.includes(binding)) {
    restoreSavedValues();
    const keepSettingsOpen = handleReadSettingsMiniWindowShortcut(
      state.miniModeActive,
      state.onToggleMiniWindow,
      toggleMiniWindowMode
    );
    if (keepSettingsOpen) {
      render();
    }
    return keepSettingsOpen;
  }

  if (state.isEditing && state.selectedNumericOption === "custom" && /^\d$/.test(input)) {
    state.customInput = state.numericInputTouched ? `${state.customInput}${input}` : input;
    state.numericInputTouched = true;
    state.editError = "";
    render();
    return true;
  }

  if (state.isEditing && state.selectedNumericOption === "custom" && isBackspace(input)) {
    state.customInput = state.numericInputTouched ? state.customInput.slice(0, -1) : "";
    state.numericInputTouched = true;
    state.editError = "";
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
  if (state.isEditing || state.isBindingCapture) {
    return;
  }

  state.selectedIndex = (state.selectedIndex + direction + ITEM_COUNT) % ITEM_COUNT;
  state.selectedBindingSlot = 0;
  state.statusMessage = "";
  render();
}

function confirmOrStartEdit() {
  if (state.selectedIndex === IMPORT_ITEM_INDEX) {
    openReadingImport();
    return;
  }

  if (state.selectedIndex === MINI_WINDOW_ITEM_INDEX) {
    toggleMiniWindowMode();
    return;
  }

  if (isBindingItemSelected()) {
    state.isBindingCapture = true;
    state.editError = "";
    render();
    return;
  }

  if (!state.isEditing) {
    if (state.selectedIndex === CURRENT_BOOK_ITEM_INDEX && state.books.length === 0) {
      return;
    }

    state.isEditing = true;
    state.editError = "";

    if (isNumericSettingSelected()) {
      const options = getSelectedNumericOptions();
      const currentValue = getSelectedNumericValue();
      state.selectedNumericOption = options.includes(currentValue) ? currentValue : "custom";
      state.customInput = String(currentValue);
      state.numericInputTouched = false;
    }

    render();
    return;
  }

  saveEdit();
}

function changeCurrentValue(direction: -1 | 1) {
  if (isBindingItemSelected() && !state.isBindingCapture) {
    state.selectedBindingSlot = state.selectedBindingSlot === 0 ? 1 : 0;
    render();
    return;
  }

  if (!state.isEditing) {
    return;
  }

  if (state.selectedIndex === CURRENT_BOOK_ITEM_INDEX) {
    const currentIndex = Math.max(0, state.books.findIndex((book) => book.id === state.activeBookId));
    const nextIndex = (currentIndex + direction + state.books.length) % state.books.length;
    state.activeBookId = state.books[nextIndex]?.id;
    render();
    return;
  }

  if (state.selectedIndex === LANGUAGE_ITEM_INDEX) {
    state.settings = {
      ...state.settings,
      interfaceLanguage: getNextValue(state.settings.interfaceLanguage, INTERFACE_LANGUAGES, direction),
    };
    render();
    return;
  }

  if (state.selectedIndex === THEME_ITEM_INDEX) {
    state.settings = { ...state.settings, theme: getNextValue(state.settings.theme, THEMES, direction) };
    render();
    return;
  }

  if (state.selectedIndex === MINI_MOUSE_ITEM_INDEX) {
    state.settings = {
      ...state.settings,
      miniWindowMouseMode: getNextValue(state.settings.miniWindowMouseMode, MINI_MOUSE_MODES, direction),
    };
    render();
    return;
  }

  changeNumericValue(direction);
}

function changeNumericValue(direction: -1 | 1) {
  const options = getSelectedNumericOptions();
  const currentValue = getSelectedNumericValue();
  const currentOption = state.selectedNumericOption ?? (options.includes(currentValue) ? currentValue : "custom");
  const currentIndex = options.indexOf(currentOption);
  const nextIndex = (currentIndex + direction + options.length) % options.length;
  const nextValue = options[nextIndex]!;

  state.selectedNumericOption = nextValue;
  state.editError = "";
  if (typeof nextValue === "number") {
    state.customInput = String(nextValue);
    state.numericInputTouched = false;
    state.settings = applySelectedNumericValue(nextValue);
  } else {
    state.customInput = "";
    state.numericInputTouched = true;
  }
  render();
}

function saveEdit() {
  if (state.selectedIndex === CURRENT_BOOK_ITEM_INDEX) {
    if (state.activeBookId) {
      saveReadState({ activeBookId: state.activeBookId });
    }
  } else if (state.selectedNumericOption === "custom") {
    const numericValue = Number(state.customInput);
    const validationError = getNumericValidationError(numericValue);
    if (validationError) {
      state.editError = validationError;
      render();
      return;
    }
    state.settings = applySelectedNumericValue(numericValue);
    saveReadSettings(state.settings);
  } else {
    saveReadSettings(state.settings);
  }

  resetEditState();
  render();
}

function isNumericSettingSelected(): boolean {
  return state.selectedIndex === WIDTH_ITEM_INDEX
    || state.selectedIndex === LINE_ITEM_INDEX
    || state.selectedIndex === SECTION_ITEM_INDEX
    || state.selectedIndex === MINI_COLUMNS_ITEM_INDEX
    || state.selectedIndex === MINI_ROWS_ITEM_INDEX
    || state.selectedIndex === MINI_FONT_ITEM_INDEX
    || state.selectedIndex === MINI_SCROLL_STEP_ITEM_INDEX;
}

function getSelectedNumericOptions(): Array<number | "custom"> {
  if (state.selectedIndex === WIDTH_ITEM_INDEX) {
    return WIDTH_OPTIONS;
  }
  if (state.selectedIndex === SECTION_ITEM_INDEX) {
    return SECTION_OPTIONS;
  }
  if (state.selectedIndex === MINI_COLUMNS_ITEM_INDEX) {
    return MINI_COLUMN_OPTIONS;
  }
  if (state.selectedIndex === MINI_ROWS_ITEM_INDEX) {
    return MINI_ROW_OPTIONS;
  }
  if (state.selectedIndex === MINI_FONT_ITEM_INDEX) {
    return MINI_FONT_OPTIONS;
  }
  if (state.selectedIndex === MINI_SCROLL_STEP_ITEM_INDEX) {
    return MINI_SCROLL_STEP_OPTIONS;
  }
  return LINE_OPTIONS;
}

function getSelectedNumericValue(): number {
  if (state.selectedIndex === WIDTH_ITEM_INDEX) {
    return state.settings.contentWidth;
  }
  if (state.selectedIndex === SECTION_ITEM_INDEX) {
    return state.settings.chapterSectionCount;
  }
  if (state.selectedIndex === MINI_COLUMNS_ITEM_INDEX) {
    return state.settings.miniWindowColumns;
  }
  if (state.selectedIndex === MINI_ROWS_ITEM_INDEX) {
    return state.settings.miniWindowRows;
  }
  if (state.selectedIndex === MINI_FONT_ITEM_INDEX) {
    return state.settings.miniWindowFontSize;
  }
  if (state.selectedIndex === MINI_SCROLL_STEP_ITEM_INDEX) {
    return state.settings.miniWindowScrollStep;
  }
  return state.settings.pageLineCount;
}

function applySelectedNumericValue(value: number): ReadSettings {
  if (state.selectedIndex === WIDTH_ITEM_INDEX) {
    return { ...state.settings, contentWidth: value };
  }
  if (state.selectedIndex === SECTION_ITEM_INDEX) {
    return { ...state.settings, chapterSectionCount: value };
  }
  if (state.selectedIndex === MINI_COLUMNS_ITEM_INDEX) {
    return { ...state.settings, miniWindowColumns: value };
  }
  if (state.selectedIndex === MINI_ROWS_ITEM_INDEX) {
    return { ...state.settings, miniWindowRows: value };
  }
  if (state.selectedIndex === MINI_FONT_ITEM_INDEX) {
    return { ...state.settings, miniWindowFontSize: value };
  }
  if (state.selectedIndex === MINI_SCROLL_STEP_ITEM_INDEX) {
    return { ...state.settings, miniWindowScrollStep: value };
  }
  return { ...state.settings, pageLineCount: value };
}

function getNumericValidationError(value: number): string {
  if (state.selectedIndex === WIDTH_ITEM_INDEX) {
    return Number.isInteger(value) && value >= 20
      ? ""
      : localize("Content width must be a whole number of at least 20", "正文宽度必须是大于等于 20 的整数");
  }

  if (state.selectedIndex === SECTION_ITEM_INDEX) {
    return Number.isInteger(value) && value >= 2 && value <= 20
      ? ""
      : localize("Chapter sections must be a whole number from 2 to 20", "章节切分必须是 2 到 20 的整数");
  }

  if (state.selectedIndex === MINI_COLUMNS_ITEM_INDEX) {
    return Number.isInteger(value) && value >= 20 && value <= 500
      ? ""
      : localize("Mini-window width must be a whole number from 20 to 500", "小窗口宽度必须是 20 到 500 的整数");
  }

  if (state.selectedIndex === MINI_ROWS_ITEM_INDEX) {
    return Number.isInteger(value) && value >= 5 && value <= 200
      ? ""
      : localize("Mini-window height must be a whole number from 5 to 200", "小窗口高度必须是 5 到 200 的整数");
  }

  if (state.selectedIndex === MINI_FONT_ITEM_INDEX) {
    return Number.isInteger(value) && value >= 5 && value <= 72
      ? ""
      : localize("Mini-window font size must be a whole number from 5 to 72", "小窗口字体必须是 5 到 72 的整数");
  }

  if (state.selectedIndex === MINI_SCROLL_STEP_ITEM_INDEX) {
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
  state.settings = loadReadSettings();
  state.activeBookId = loadReadState().activeBookId ?? state.books[0]?.id;
  resetEditState();
}

function resetEditState() {
  state.isEditing = false;
  state.isBindingCapture = false;
  state.customInput = "";
  state.numericInputTouched = false;
  state.selectedNumericOption = undefined;
  state.editError = "";
}

function render() {
  renderReadSettings({
    books: state.books,
    activeBookId: state.activeBookId,
    settings: state.settings,
    selectedIndex: state.selectedIndex,
    selectedBindingSlot: state.selectedBindingSlot,
    isEditing: state.isEditing,
    customInput: state.customInput,
    selectedNumericOption: state.selectedNumericOption,
    isBindingCapture: state.isBindingCapture,
    editError: state.editError,
    statusMessage: state.statusMessage,
    miniModeActive: state.miniModeActive,
  });
}

function captureBinding(input: string) {
  if (isBackspace(input)) {
    saveBinding("");
    return;
  }

  const binding = normalizeBindingInput(input);
  if (!binding) {
    state.editError = localize(
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

  const keyBindings = cloneKeyBindings(state.settings.keyBindings);
  if (binding) {
    BINDING_ACTIONS.forEach((key) => {
      keyBindings[key] = keyBindings[key].map((value) => value === binding ? "" : value) as [string, string];
    });
  }
  keyBindings[action][state.selectedBindingSlot] = binding;
  state.settings = { ...state.settings, keyBindings };
  saveReadSettings(state.settings);
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
  return (state.selectedIndex >= MAIN_BINDING_START_INDEX
      && state.selectedIndex < MAIN_BINDING_START_INDEX + MAIN_BINDING_ACTIONS.length)
    || state.selectedIndex === MINI_WINDOW_BINDING_ITEM_INDEX;
}

function getSelectedBindingAction(): ReadBindingAction | undefined {
  if (state.selectedIndex === MINI_WINDOW_BINDING_ITEM_INDEX) {
    return "toggleMiniWindow";
  }
  return MAIN_BINDING_ACTIONS[state.selectedIndex - MAIN_BINDING_START_INDEX];
}

function openReadingImport() {
  const returnCallback = state.onReturnToReading;
  const openMiniCallback = state.onOpenMiniMode;
  const closeMiniCallback = state.onCloseMiniMode;
  const toggleMiniCallback = state.onToggleMiniWindow;
  const wasMiniModeActive = state.miniModeActive;
  process.stdin.off("data", handleKeyPress);
  process.stdout.off("resize", handleTerminalResize);
  setReadMouseTracking(false);
  startReadingImportSession({
    interfaceLanguage: state.settings.interfaceLanguage,
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
  const selectedBookId = state.activeBookId;
  if (!selectedBookId) {
    return;
  }

  saveReadState({ activeBookId: selectedBookId });
  process.stdin.off("data", handleKeyPress);
  process.stdout.off("resize", handleTerminalResize);
  setReadMouseTracking(false);

  if (state.miniModeActive) {
    state.onCloseMiniMode?.(selectedBookId);
    return;
  }

  state.onOpenMiniMode?.(selectedBookId);
}

function localize(english: string, chinese: string): string {
  return state.settings.interfaceLanguage === "chinese" ? chinese : english;
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
  const selectedBookId = state.activeBookId;
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
  if (state.onReturnToReading && state.activeBookId) {
    process.stdin.off("data", handleKeyPress);
    process.stdout.off("resize", handleTerminalResize);
    setReadMouseTracking(false);
    state.onReturnToReading(state.activeBookId);
    return;
  }

  openReadingSession();
}

function returnToReadingOrQuit() {
  if (state.onReturnToReading) {
    returnToReading();
    return;
  }

  quit();
}
