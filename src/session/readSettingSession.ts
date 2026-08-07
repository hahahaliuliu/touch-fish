import type { ReadBindingAction, ReadingBookSummary, ReadSettings } from "../models/reading.js";
import { listReadingBooks, loadReadingBook } from "../services/readingLoader.js";
import { loadReadState, saveReadState } from "../storage/readProgress.js";
import { loadReadSettings, saveReadSettings } from "../storage/readSettings.js";
import { renderReadSettings } from "../ui/readSettingsRenderer.js";
import { startReadSession } from "./readSession.js";

const WIDTH_OPTIONS: Array<number | "custom"> = [0, 30, 50, "custom"];
const LINE_OPTIONS: Array<number | "custom"> = [5, 10, 15, "custom"];
const BINDING_ACTIONS: ReadBindingAction[] = [
  "previousPage",
  "nextPage",
  "previousChapter",
  "nextChapter",
  "repeat",
  "toggleHelp",
];

let books: ReadingBookSummary[] = [];
let activeBookId: string | undefined;
let settings: ReadSettings;
let selectedIndex = 0;
let isEditing = false;
let customInput = "";
let numericInputTouched = false;
let selectedNumericOption: number | "custom" | undefined;
let isBindingCapture = false;
let editError = "";
let onReturnToReading: ((bookId: string) => void) | undefined;

export function startReadSettingSession(options: { onReturn?: (bookId: string) => void } = {}) {
  onReturnToReading = options.onReturn;
  books = listReadingBooks();
  activeBookId = loadReadState().activeBookId ?? books[0]?.id;
  settings = loadReadSettings();
  selectedIndex = 0;
  isEditing = false;
  customInput = "";
  numericInputTouched = false;
  selectedNumericOption = undefined;
  isBindingCapture = false;
  editError = "";
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

function handleInput(input: string): boolean {
  if (input === "\u0003" || input.toLowerCase() === "q") {
    quit();
    return false;
  }

  if (input === "\u000f" && !isEditing && activeBookId) {
    returnToReading();
    return false;
  }

  if (input === "\u001b") {
    if (isBindingCapture) {
      isBindingCapture = false;
      render();
      return true;
    }

    if (isEditing) {
      cancelEdit();
      return true;
    }

    returnToReadingOrQuit();
    return false;
  }

  if (input === "\r" || input === "\n") {
    if (isBindingCapture) {
      return true;
    }

    if (isEditing) {
      saveEdit();
    } else {
      startEdit();
    }
    return true;
  }

  if (isBindingCapture) {
    captureBinding(input);
    return true;
  }

  if (isEditing && selectedNumericOption === "custom" && /^\d$/.test(input)) {
    customInput = numericInputTouched ? `${customInput}${input}` : input;
    numericInputTouched = true;
    editError = "";
    render();
    return true;
  }

  if (isEditing && selectedNumericOption === "custom" && (input === "\b" || input === "\u007f")) {
    customInput = numericInputTouched ? customInput.slice(0, -1) : "";
    numericInputTouched = true;
    editError = "";
    render();
    return true;
  }

  if (input === "w" || input === "W" || input === "\u001b[A") {
    selectedIndex = Math.max(0, selectedIndex - 1);
    if (isEditing) {
      cancelEdit();
    } else {
      render();
    }
    return true;
  }

  if (input === "s" || input === "S" || input === "\u001b[B") {
    selectedIndex = Math.min(2 + BINDING_ACTIONS.length, selectedIndex + 1);
    if (isEditing) {
      cancelEdit();
    } else {
      render();
    }
    return true;
  }

  if (isEditing && (input === "a" || input === "A" || input === "\u001b[D")) {
    changeValue(-1);
    return true;
  }

  if (isEditing && (input === "d" || input === "D" || input === "\u001b[C")) {
    changeValue(1);
    return true;
  }

  return true;
}

function startEdit() {
  if (selectedIndex >= 3) {
    isBindingCapture = true;
    render();
    return;
  }

  if (selectedIndex === 0 && books.length === 0) {
    return;
  }

  isEditing = true;
  editError = "";

  if (selectedIndex === 1 || selectedIndex === 2) {
    const options = selectedIndex === 1 ? WIDTH_OPTIONS : LINE_OPTIONS;
    const currentValue = selectedIndex === 1 ? settings.contentWidth : settings.pageLineCount;
    selectedNumericOption = options.includes(currentValue) ? currentValue : "custom";
    customInput = String(currentValue);
    numericInputTouched = false;
  }

  render();
}

function changeValue(direction: -1 | 1) {
  if (selectedIndex === 0) {
    const currentIndex = Math.max(0, books.findIndex((book) => book.id === activeBookId));
    const nextIndex = (currentIndex + direction + books.length) % books.length;
    activeBookId = books[nextIndex]?.id;
    render();
    return;
  }

  const options = selectedIndex === 1 ? WIDTH_OPTIONS : LINE_OPTIONS;
  const currentValue = selectedIndex === 1 ? settings.contentWidth : settings.pageLineCount;
  const currentOption = selectedNumericOption ?? (options.includes(currentValue) ? currentValue : "custom");
  const currentIndex = options.indexOf(currentOption);
  const nextIndex = (currentIndex + direction + options.length) % options.length;
  const nextValue = options[nextIndex]!;

  selectedNumericOption = nextValue;
  editError = "";
  if (typeof nextValue === "number") {
    customInput = String(nextValue);
    numericInputTouched = false;
    if (selectedIndex === 1) {
      settings = { ...settings, contentWidth: nextValue };
    } else {
      settings = { ...settings, pageLineCount: nextValue };
    }
  } else {
    customInput = "";
    numericInputTouched = true;
  }
  render();
}

function saveEdit() {
  if (selectedIndex === 0) {
    if (activeBookId) {
      saveReadState({ activeBookId });
    }
  } else if (selectedNumericOption === "custom") {
    const numericValue = Number(customInput);
    const isWidth = selectedIndex === 1;
    const isOutsideRange = numericValue < (isWidth ? 20 : 1) || (!isWidth && numericValue > 100);
    if (!Number.isInteger(numericValue) || isOutsideRange) {
      editError = isWidth ? "正文宽度必须是大于等于 20 的整数" : "每页行数必须是 1 到 100 的整数";
      render();
      return;
    }
    settings = isWidth
      ? { ...settings, contentWidth: numericValue }
      : { ...settings, pageLineCount: numericValue };
    saveReadSettings(settings);
  } else {
    saveReadSettings(settings);
  }

  isEditing = false;
  customInput = "";
  numericInputTouched = false;
  selectedNumericOption = undefined;
  editError = "";
  render();
}

function cancelEdit() {
  settings = loadReadSettings();
  activeBookId = loadReadState().activeBookId ?? books[0]?.id;
  isEditing = false;
  customInput = "";
  numericInputTouched = false;
  selectedNumericOption = undefined;
  editError = "";
  render();
}

function render() {
  renderReadSettings({
    books,
    activeBookId,
    settings,
    selectedIndex,
    isEditing,
    customInput,
    selectedNumericOption,
    isBindingCapture,
    editError,
  });
}

function captureBinding(input: string) {
  const binding = normalizeBindingInput(input);
  const action = BINDING_ACTIONS[selectedIndex - 3];

  if (!binding || !action) {
    return;
  }

  settings = {
    ...settings,
    keyBindings: {
      ...settings.keyBindings,
      [action]: [binding, settings.keyBindings[action][1]],
    },
  };
  saveReadSettings(settings);
  isBindingCapture = false;
  render();
}

function normalizeBindingInput(input: string): string | undefined {
  const specialBindings: Record<string, string> = {
    "\u001b[A": "arrow-up",
    "\u001b[B": "arrow-down",
    "\u001b[C": "arrow-right",
    "\u001b[D": "arrow-left",
    " ": "space",
  };

  return specialBindings[input] ?? (/^[\x21-\x7e]$/.test(input) ? input.toLowerCase() : undefined);
}

function quit() {
  process.stdin.off("data", handleKeyPress);
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }
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
  startReadSession(loadReadingBook(selectedBookId));
}

function returnToReading() {
  if (onReturnToReading && activeBookId) {
    process.stdin.off("data", handleKeyPress);
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

function parseInputs(input: string): string[] {
  const values: string[] = [];
  let index = 0;
  while (index < input.length) {
    if (input[index] === "\u001b" && input[index + 1] === "[" && input[index + 2]) {
      values.push(input.slice(index, index + 3));
      index += 3;
    } else {
      values.push(input[index]!);
      index += 1;
    }
  }
  return values;
}
