import type { NoteMode, Settings } from "../models/settings.js";
import type { FavoriteEntry } from "../services/favoriteService.js";
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
import { isNoteTextInput, normalizeSettingBinding, parseTerminalInputs } from "./settingFormInput.js";

type SelectionState =
  | { kind: "idle" }
  | { kind: "selecting"; selectedIndex: number }
  | { kind: "editing"; selectedIndex: number; input: string };

interface FavoriteSessionOptions {
  onReturn?: () => void;
}

interface FavoriteSessionState {
  settings: Settings;
  entries: FavoriteEntry[];
  currentIndex: number;
  displayMode: DisplayMode;
  noteMode: NoteMode;
  selectionState: SelectionState;
  order: number[];
  onReturnToPreviousSession: (() => void) | undefined;
}

function createFavoriteState(options: FavoriteSessionOptions = {}): FavoriteSessionState {
  const settings = loadSettings();
  const entries = loadFavoriteEntries();
  return {
    settings,
    entries,
    currentIndex: 0,
    displayMode: settings.displayMode,
    noteMode: settings.noteMode,
    selectionState: { kind: "idle" },
    order: buildOrder(settings, entries),
    onReturnToPreviousSession: options.onReturn,
  };
}

let state: FavoriteSessionState = createFavoriteState();

export function startFavoriteSession(options: FavoriteSessionOptions = {}) {
  state = createFavoriteState(options);

  if (state.entries.length === 0) {
    console.log("[INFO] no favorite words; press Q to exit");
    options.onReturn?.();
    return;
  }

  renderSession();

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


function handleInput(input: string): boolean {
  if (input === "\u0003" || (state.selectionState.kind !== "editing" && input.toLowerCase() === "q")) {
    quitSession();
    return false;
  }

  if (input === "\u001b" && state.selectionState.kind === "idle" && state.onReturnToPreviousSession) {
    returnToPreviousSession();
    return false;
  }

  if (state.selectionState.kind !== "idle") {
    return handleSelectionInput(input);
  }

  if (input.toLowerCase() === "e") {
    state.selectionState = { kind: "selecting", selectedIndex: 0 };
    renderSession();
    return true;
  }

  const binding = normalizeSettingBinding(input);

  if (matchesBinding(binding, "previous")) {
    movePage(-1);
  } else if (matchesBinding(binding, "next")) {
    movePage(1);
  } else if (matchesBinding(binding, "switchDisplayMode")) {
    state.displayMode = state.displayMode === "both" ? "english" : state.displayMode === "english" ? "chinese" : "both";
    renderSession();
  }

  return true;
}

function handleSelectionInput(input: string): boolean {
  if (state.selectionState.kind === "editing") {
    return handleNoteEditing(input);
  }

  if (state.selectionState.kind !== "selecting") {
    return true;
  }

  const selectingState = state.selectionState;

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
    if (entry && state.noteMode === "editable") {
      state.selectionState = {
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
  if (state.selectionState.kind !== "editing") {
    return true;
  }

  const editingState = state.selectionState;

  if (input === "\u001b") {
    state.selectionState = { kind: "selecting", selectedIndex: editingState.selectedIndex };
    renderSession();
    return true;
  }

  if (input === "\r" || input === "\n") {
    const entry = getCurrentPageEntries()[editingState.selectedIndex];
    if (entry) {
      saveFavoriteWordNote(entry.word, editingState.input);
    }
    state.selectionState = { kind: "selecting", selectedIndex: editingState.selectedIndex };
    refreshEntriesPreservingOrder();
    renderSession();
    return true;
  }

  if (input === "\b" || input === "\u007f") {
    state.selectionState = { ...editingState, input: editingState.input.slice(0, -1) };
    renderSession();
    return true;
  }

  if (isNoteTextInput(input)) {
    state.selectionState = { ...editingState, input: `${editingState.input}${input}` };
    renderSession();
  }

  return true;
}

function leaveSelectionMode() {
  refreshEntriesPreservingOrder();
  state.currentIndex = Math.min(state.currentIndex, Math.max(0, getLastPageStart()));
  state.selectionState = { kind: "idle" };
  renderSession();
}

function refreshEntriesPreservingOrder() {
  const previousWords = state.order.map((index) => state.entries[index]?.word.english).filter((word): word is string => word !== undefined);
  state.entries = loadFavoriteEntries();
  const indexByEnglish = new Map(state.entries.map((entry, index) => [entry.word.english, index]));
  state.order = previousWords
    .map((english) => indexByEnglish.get(english))
    .filter((index): index is number => index !== undefined);

  state.entries.forEach((entry, index) => {
    if (!state.order.includes(index)) {
      state.order.push(index);
    }
  });
}

function moveSelection(direction: -1 | 1) {
  if (state.selectionState.kind !== "selecting") {
    return;
  }

  const count = getCurrentPageEntries().length;
  if (count === 0) {
    return;
  }

  if (direction === -1 && state.selectionState.selectedIndex === 0) {
    const before = state.currentIndex;
    movePage(-1);
    state.selectionState = { kind: "selecting", selectedIndex: state.currentIndex !== before ? getCurrentPageEntries().length - 1 : 0 };
  } else if (direction === 1 && state.selectionState.selectedIndex === count - 1) {
    const before = state.currentIndex;
    movePage(1);
    state.selectionState = { kind: "selecting", selectedIndex: state.currentIndex !== before ? 0 : count - 1 };
  } else {
    state.selectionState = { kind: "selecting", selectedIndex: state.selectionState.selectedIndex + direction };
  }
  renderSession();
}

function movePage(direction: -1 | 1) {
  state.currentIndex = Math.min(Math.max(state.currentIndex + direction * state.settings.workspaceSize, 0), getLastPageStart());
  renderSession();
}

function getCurrentPageEntries() {
  return state.order.slice(state.currentIndex, state.currentIndex + state.settings.workspaceSize).map((index) => state.entries[index]!);
}

function getLastPageStart() {
  return Math.max(0, Math.floor(Math.max(state.entries.length - 1, 0) / state.settings.workspaceSize) * state.settings.workspaceSize);
}

function buildOrder(settings: Settings, entries: FavoriteEntry[]): number[] {
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
  const selectedIndex = state.selectionState.kind === "idle" ? undefined : state.selectionState.selectedIndex;

  renderWordSession({
    words: pageEntries.map((entry) => entry.word),
    current: state.currentIndex + 1,
    total: state.entries.length,
    workspaceSize: state.settings.workspaceSize,
    studyGroupStart: 1,
    studyGroupEnd: state.entries.length,
    studyGroupCurrent: 1,
    studyGroupTotal: 1,
    studyGroupEnabled: false,
    navigationLoop: false,
    studyOrder: state.settings.studyOrder,
    theme: state.settings.theme,
    keyBindings: state.settings.keyBindings,
    displayMode: state.displayMode,
    noteMode: state.noteMode,
    noteSelectionIndex: state.selectionState.kind === "editing" ? selectedIndex : undefined,
    selectionIndex: selectedIndex,
    noteInput: state.selectionState.kind === "editing" ? state.selectionState.input : undefined,
    interfaceLanguage: state.settings.interfaceLanguage,
    showHelp: false,
  });
}

function quitSession() {
  renderQuitMessage(state.settings.theme);

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }
  process.stdin.pause();
  process.exit(0);
}

function matchesBinding(binding: string | undefined, action: keyof Settings["keyBindings"]): boolean {
  return binding !== undefined && state.settings.keyBindings[action].includes(binding);
}

function returnToPreviousSession() {
  const onReturn = state.onReturnToPreviousSession;
  state.onReturnToPreviousSession = undefined;
  process.stdin.off("data", handleKeyPress);
  onReturn?.();
}
