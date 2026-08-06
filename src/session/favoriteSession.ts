import type { NoteMode, Settings } from "../models/settings.js";
import { loadSettings } from "../services/settingsLoader.js";
import {
  loadFavoriteEntries,
  saveFavoriteWordNote,
  toggleFavoriteWord,
} from "../services/favoriteService.js";
import {
  renderQuitMessage,
  renderWordSession,
  type DisplayMode,
} from "../ui/wordRenderer.js";
import { createRandomOrder } from "../services/randomOrder.js";

type SelectionState =
  | { kind: "idle" }
  | { kind: "selecting"; selectedIndex: number }
  | { kind: "editing"; selectedIndex: number; input: string };

interface FavoriteSessionOptions {
  onReturn?: () => void;
}

let settings: Settings;
let entries = loadFavoriteEntries();
let currentIndex = 0;
let displayMode: DisplayMode;
let noteMode: NoteMode;
let selectionState: SelectionState = { kind: "idle" };
let order: number[] = [];
let onReturnToPreviousSession: (() => void) | undefined;

export function startFavoriteSession(options: FavoriteSessionOptions = {}) {
  onReturnToPreviousSession = options.onReturn;
  settings = loadSettings();
  entries = loadFavoriteEntries();

  if (entries.length === 0) {
    console.log("[INFO] no favorite words; press Q to exit");
    options.onReturn?.();
    return;
  }

  displayMode = settings.displayMode;
  noteMode = settings.noteMode;
  order = getOrder();
  currentIndex = 0;
  renderSession();

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
  const result: string[] = [];

  for (let index = 0; index < input.length; index += 1) {
    if (input[index] === "\u001b" && input[index + 1] === "[" && input[index + 2]) {
      result.push(`${input[index]}${input[index + 1]}${input[index + 2]}`);
      index += 2;
    } else if (input[index] === "\r" && input[index + 1] === "\n") {
      result.push("\r");
      index += 1;
    } else if (input[index]) {
      result.push(input[index]!);
    }
  }

  return result;
}

function handleInput(input: string): boolean {
  if (input === "\u0003" || (selectionState.kind !== "editing" && input.toLowerCase() === "q")) {
    quitSession();
    return false;
  }

  if (input === "\u001b" && selectionState.kind === "idle" && onReturnToPreviousSession) {
    returnToPreviousSession();
    return false;
  }

  if (selectionState.kind !== "idle") {
    return handleSelectionInput(input);
  }

  if (input.toLowerCase() === "e") {
    selectionState = { kind: "selecting", selectedIndex: 0 };
    renderSession();
    return true;
  }

  const binding = normalizeBindingInput(input);

  if (matchesBinding(binding, "previous")) {
    movePage(-1);
  } else if (matchesBinding(binding, "next")) {
    movePage(1);
  } else if (matchesBinding(binding, "switchDisplayMode")) {
    displayMode = displayMode === "both" ? "english" : displayMode === "english" ? "chinese" : "both";
    renderSession();
  }

  return true;
}

function handleSelectionInput(input: string): boolean {
  if (selectionState.kind === "editing") {
    return handleNoteEditing(input);
  }

  if (selectionState.kind !== "selecting") {
    return true;
  }

  const selectingState = selectionState;

  if (input === "\u001b" || input.toLowerCase() === "e") {
    leaveSelectionMode();
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

  if (input.toLowerCase() === "f") {
    const entry = getCurrentPageEntries()[selectingState.selectedIndex];
    if (entry) {
      toggleFavoriteWord(entry.word);
      renderSession();
    }
    return true;
  }

  if (input === "\r" || input === "\n") {
    const entry = getCurrentPageEntries()[selectingState.selectedIndex];
    if (entry && noteMode === "editable") {
      selectionState = {
        kind: "editing",
        selectedIndex: selectingState.selectedIndex,
        input: entry.word.note ?? "",
      };
      renderSession();
    }
  }

  return true;
}

function handleNoteEditing(input: string): boolean {
  if (selectionState.kind !== "editing") {
    return true;
  }

  const editingState = selectionState;

  if (input === "\u001b") {
    selectionState = { kind: "selecting", selectedIndex: editingState.selectedIndex };
    renderSession();
    return true;
  }

  if (input === "\r" || input === "\n") {
    const entry = getCurrentPageEntries()[editingState.selectedIndex];
    if (entry) {
      saveFavoriteWordNote(entry.word, editingState.input);
    }
    selectionState = { kind: "selecting", selectedIndex: editingState.selectedIndex };
    refreshEntriesPreservingOrder();
    renderSession();
    return true;
  }

  if (input === "\b" || input === "\u007f") {
    selectionState = { ...editingState, input: editingState.input.slice(0, -1) };
    renderSession();
    return true;
  }

  if (input.length > 0 && !/[\u0000-\u001f\u007f]/.test(input)) {
    selectionState = { ...editingState, input: `${editingState.input}${input}` };
    renderSession();
  }

  return true;
}

function leaveSelectionMode() {
  refreshEntriesPreservingOrder();
  currentIndex = Math.min(currentIndex, Math.max(0, getLastPageStart()));
  selectionState = { kind: "idle" };
  renderSession();
}

function refreshEntriesPreservingOrder() {
  const previousWords = order.map((index) => entries[index]?.word.english).filter((word): word is string => word !== undefined);
  entries = loadFavoriteEntries();
  const indexByEnglish = new Map(entries.map((entry, index) => [entry.word.english, index]));
  order = previousWords
    .map((english) => indexByEnglish.get(english))
    .filter((index): index is number => index !== undefined);

  entries.forEach((entry, index) => {
    if (!order.includes(index)) {
      order.push(index);
    }
  });
}

function moveSelection(direction: -1 | 1) {
  if (selectionState.kind !== "selecting") {
    return;
  }

  const count = getCurrentPageEntries().length;
  if (count === 0) {
    return;
  }

  if (direction === -1 && selectionState.selectedIndex === 0) {
    const before = currentIndex;
    movePage(-1);
    selectionState = { kind: "selecting", selectedIndex: currentIndex !== before ? getCurrentPageEntries().length - 1 : 0 };
  } else if (direction === 1 && selectionState.selectedIndex === count - 1) {
    const before = currentIndex;
    movePage(1);
    selectionState = { kind: "selecting", selectedIndex: currentIndex !== before ? 0 : count - 1 };
  } else {
    selectionState = { kind: "selecting", selectedIndex: selectionState.selectedIndex + direction };
  }
  renderSession();
}

function movePage(direction: -1 | 1) {
  currentIndex = Math.min(Math.max(currentIndex + direction * settings.workspaceSize, 0), getLastPageStart());
  renderSession();
}

function getCurrentPageEntries() {
  return order.slice(currentIndex, currentIndex + settings.workspaceSize).map((index) => entries[index]!);
}

function getLastPageStart() {
  return Math.max(0, Math.floor(Math.max(entries.length - 1, 0) / settings.workspaceSize) * settings.workspaceSize);
}

function getOrder() {
  if (settings.studyOrder === "reverse") {
    return entries.map((_, index) => index).reverse();
  }

  if (settings.studyOrder === "random") {
    return createRandomOrder(entries.length);
  }

  return entries.map((_, index) => index);
}

function renderSession() {
  const pageEntries = getCurrentPageEntries();
  const selectedIndex = selectionState.kind === "idle" ? undefined : selectionState.selectedIndex;

  renderWordSession({
    words: pageEntries.map((entry) => entry.word),
    current: currentIndex + 1,
    total: entries.length,
    workspaceSize: settings.workspaceSize,
    studyGroupStart: 1,
    studyGroupEnd: entries.length,
    studyGroupCurrent: 1,
    studyGroupTotal: 1,
    studyGroupEnabled: false,
    navigationLoop: false,
    studyOrder: settings.studyOrder,
    theme: settings.theme,
    keyBindings: settings.keyBindings,
    displayMode,
    noteMode,
    noteSelectionIndex: selectionState.kind === "editing" ? selectedIndex : undefined,
    selectionIndex: selectedIndex,
    noteInput: selectionState.kind === "editing" ? selectionState.input : undefined,
    interfaceLanguage: settings.interfaceLanguage,
    showHelp: false,
  });
}

function quitSession() {
  renderQuitMessage(settings.theme);

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }
  process.stdin.pause();
  process.exit(0);
}

function normalizeBindingInput(input: string): string | undefined {
  const specialBindings: Record<string, string> = {
    "\u001b[A": "arrow-up",
    "\u001b[B": "arrow-down",
    "\u001b[C": "arrow-right",
    "\u001b[D": "arrow-left",
    "\t": "tab",
    " ": "space",
  };

  if (specialBindings[input]) {
    return specialBindings[input];
  }

  return /^[\x21-\x7e]$/.test(input) ? input.toLowerCase() : undefined;
}

function matchesBinding(binding: string | undefined, action: keyof Settings["keyBindings"]): boolean {
  return binding !== undefined && settings.keyBindings[action].includes(binding);
}

function returnToPreviousSession() {
  const onReturn = onReturnToPreviousSession;
  onReturnToPreviousSession = undefined;
  process.stdin.off("data", handleKeyPress);
  onReturn?.();
}
