import {
  renderQuitMessage,
  renderWordSession,
  type DisplayMode,
} from "../ui/wordRenderer.js";

import {
  getCurrentWords,
  getCurrentStudyGroupWords,
  getSavedDisplayMode,
  getWordProgress,
  nextWordGroup as moveToNextWordGroup,
  nextStudyGroup as moveToNextStudyGroup,
  previousWordGroup as moveToPreviousWordGroup,
  previousStudyGroup as moveToPreviousStudyGroup,
  reloadWordSettings,
  saveCurrentWordProgress,
  saveDisplayMode,
  saveCurrentWordNote,
  toggleCurrentWordFavorite,
} from "../services/wordService.js";
import { loadSettings } from "../services/settingsLoader.js";
import type { InterfaceLanguage, KeyBindings, NoteMode } from "../models/settings.js";
import { startSettingSession } from "./settingSession.js";
import { startGroupQuizSession } from "./groupQuizSession.js";
import { normalizeSettingBinding, parseTerminalInputs } from "./settingFormInput.js";

type LastNavigation = "next" | "previous";
type NoteState =
  | { kind: "idle" }
  | { kind: "selecting"; selectedIndex: number }
  | { kind: "editing"; selectedIndex: number; input: string };

const OPEN_SETTINGS_KEY = "\u000f";

interface WordSessionState {
  displayMode: DisplayMode;
  keyBindings: KeyBindings;
  noteMode: NoteMode;
  interfaceLanguage: InterfaceLanguage;
  lastNavigation: LastNavigation;
  showHelp: boolean;
  noteState: NoteState;
}

function createWordSessionState(): WordSessionState {
  const settings = loadSettings();
  return {
    displayMode: getSavedDisplayMode(),
    keyBindings: settings.keyBindings,
    noteMode: settings.noteMode,
    interfaceLanguage: settings.interfaceLanguage,
    lastNavigation: "next",
    showHelp: false,
    noteState: { kind: "idle" },
  };
}

let state = createWordSessionState();

export function startWordSession() {
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
    const shouldContinue = handleInput(input);

    if (!shouldContinue) {
      return;
    }
  }
}

function handleInput(input: string): boolean {
  if (input === "\u0003") {
    quitWordSession();
    return false;
  }

  if (state.noteState.kind !== "editing" && input.toLowerCase() === "q") {
    quitWordSession();
    return false;
  }

  if (state.noteState.kind !== "idle") {
    return handleNoteInput(input);
  }

  if (input === "\u001b" && state.showHelp) {
    state.showHelp = false;
    renderSession();
    return true;
  }

  if (input === OPEN_SETTINGS_KEY) {
    openSettingSession();
    return false;
  }

  const binding = normalizeSettingBinding(input);

  if (matchesBinding(binding, "previous")) {
    previousWord();
    return true;
  }

  if (matchesBinding(binding, "next")) {
    nextWord();
    return true;
  }

  if (matchesBinding(binding, "previousGroup")) {
    previousStudyGroup();
    return true;
  }

  if (matchesBinding(binding, "nextGroup")) {
    nextStudyGroup();
    return true;
  }

  if (matchesBinding(binding, "repeat")) {
    repeatLastNavigation();
    return true;
  }

  if (matchesBinding(binding, "switchDisplayMode")) {
    switchDisplayMode();
    return true;
  }

  if (matchesBinding(binding, "startQuiz")) {
    openGroupQuiz();
    return false;
  }

  if (matchesBinding(binding, "editNote")) {
    startNoteSelection();
    return true;
  }

  if (matchesBinding(binding, "toggleHelp")) {
    state.showHelp = !state.showHelp;
    renderSession();
    return true;
  }

  return true;
}

function nextWord() {
  moveToNextWordGroup();
  state.lastNavigation = "next";
  renderSession();
}

function previousWord() {
  moveToPreviousWordGroup();
  state.lastNavigation = "previous";
  renderSession();
}

function nextStudyGroup() {
  moveToNextStudyGroup();
  renderSession();
}

function previousStudyGroup() {
  moveToPreviousStudyGroup();
  renderSession();
}

function repeatLastNavigation() {
  if (state.lastNavigation === "next") {
    nextWord();
  } else {
    previousWord();
  }
}

function switchDisplayMode() {
  if (state.displayMode === "both") {
    state.displayMode = "english";
  } else if (state.displayMode === "english") {
    state.displayMode = "chinese";
  } else {
    state.displayMode = "both";
  }

  saveDisplayMode(state.displayMode);
  renderSession();
}

function startNoteSelection() {
  const words = getCurrentWords();

  if (words.length === 0) {
    return;
  }

  state.noteState = { kind: "selecting", selectedIndex: 0 };
  renderSession();
}

function handleNoteInput(input: string): boolean {
  if (input === "\u001b") {
    state.noteState = state.noteState.kind === "editing"
      ? { kind: "selecting", selectedIndex: state.noteState.selectedIndex }
      : { kind: "idle" };
    renderSession();
    return true;
  }

  if (state.noteState.kind === "selecting") {
    if (input.toLowerCase() === "e") {
      state.noteState = { kind: "idle" };
      renderSession();
      return true;
    }

    if (input.toLowerCase() === "f") {
      toggleCurrentWordFavorite(state.noteState.selectedIndex);
      renderSession();
      return true;
    }

    if (input === "w" || input === "W" || input === "\u001b[A") {
      moveNoteSelection(-1);
      return true;
    }

    if (input === "s" || input === "S" || input === "\u001b[B") {
      moveNoteSelection(1);
      return true;
    }

    if ((input === "\r" || input === "\n") && state.noteMode === "editable") {
      const word = getCurrentWords()[state.noteState.selectedIndex];
      state.noteState = {
        kind: "editing",
        selectedIndex: state.noteState.selectedIndex,
        input: word?.note ?? "",
      };
      renderSession();
    }

    return true;
  }

  if (state.noteState.kind !== "editing") {
    return true;
  }

  const editingState = state.noteState;

  if (input === "\r" || input === "\n") {
    saveCurrentWordNote(editingState.selectedIndex, editingState.input);
    state.noteState = { kind: "selecting", selectedIndex: editingState.selectedIndex };
    renderSession();
    return true;
  }

  if (input === "\b" || input === "\u007f") {
    state.noteState = { ...editingState, input: editingState.input.slice(0, -1) };
    renderSession();
    return true;
  }

  if (isNoteTextInput(input)) {
    state.noteState = { ...editingState, input: `${editingState.input}${input}` };
    renderSession();
  }

  return true;
}

function moveNoteSelection(direction: -1 | 1) {
  if (state.noteState.kind !== "selecting") {
    return;
  }

  const pageWords = getCurrentWords();
  const wordCount = pageWords.length;

  if (wordCount === 0) {
    return;
  }

  if (direction === -1 && state.noteState.selectedIndex === 0) {
    const before = getWordProgress().current;
    previousWord();
    const moved = getWordProgress().current !== before;
    state.noteState = { kind: "selecting", selectedIndex: moved ? getCurrentWords().length - 1 : 0 };
  } else if (direction === 1 && state.noteState.selectedIndex === wordCount - 1) {
    const before = getWordProgress().current;
    nextWord();
    const moved = getWordProgress().current !== before;
    state.noteState = { kind: "selecting", selectedIndex: moved ? 0 : wordCount - 1 };
  } else {
    state.noteState = { kind: "selecting", selectedIndex: state.noteState.selectedIndex + direction };
  }
  renderSession();
}

function isNoteTextInput(input: string): boolean {
  return input.length > 0 && !/[\u0000-\u001f\u007f]/.test(input);
}

function renderSession() {
  const currentWords = getCurrentWords();
  const progress = getWordProgress();

  renderWordSession({
    words: currentWords,
    current: progress.current,
    total: progress.total,
    workspaceSize: progress.workspaceSize,
    studyGroupStart: progress.studyGroupStart,
    studyGroupEnd: progress.studyGroupEnd,
    studyGroupCurrent: progress.studyGroupCurrent,
    studyGroupTotal: progress.studyGroupTotal,
    studyGroupEnabled: progress.studyGroupEnabled,
    navigationLoop: progress.navigationLoop,
    studyOrder: progress.studyOrder,
    theme: progress.theme,
    keyBindings: state.keyBindings,
    displayMode: state.displayMode,
    noteMode: state.noteMode,
    noteSelectionIndex: state.noteState.kind === "idle" ? undefined : state.noteState.selectedIndex,
    noteInput: state.noteState.kind === "editing" ? state.noteState.input : undefined,
    interfaceLanguage: state.interfaceLanguage,
    showHelp: state.showHelp,
  });
}

function openSettingSession() {
  saveCurrentWordProgress();
  process.stdin.off("data", handleKeyPress);
  startSettingSession({
    onReturn: () => {
      reloadWordSettings();
      state.keyBindings = loadSettings().keyBindings;
      state.noteMode = loadSettings().noteMode;
      state.interfaceLanguage = loadSettings().interfaceLanguage;
      state.displayMode = getSavedDisplayMode();
      state.noteState = { kind: "idle" };
      startWordSession();
    },
  });
}

function openGroupQuiz() {
  const groupWords = getCurrentStudyGroupWords();

  process.stdin.off("data", handleKeyPress);
  startGroupQuizSession({
    words: groupWords,
    interfaceLanguage: state.interfaceLanguage,
    onReturn: () => {
      startWordSession();
    },
  });
}

function matchesBinding(binding: string | undefined, action: keyof typeof state.keyBindings): boolean {
  return binding !== undefined && state.keyBindings[action].includes(binding);
}

function quitWordSession() {
  saveCurrentWordProgress();

  renderQuitMessage(getWordProgress().theme);

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }
  process.stdin.pause();
  process.exit(0);
}
