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
} from "../services/wordService.js";
import { loadSettings } from "../services/settingsLoader.js";
import type { NoteMode } from "../models/settings.js";
import { startSettingSession } from "./settingSession.js";
import { startGroupQuizSession } from "./groupQuizSession.js";

type LastNavigation = "next" | "previous";
type NoteState =
  | { kind: "idle" }
  | { kind: "selecting"; selectedIndex: number }
  | { kind: "editing"; selectedIndex: number; input: string };

const OPEN_SETTINGS_KEY = "\u000f";
let displayMode: DisplayMode = getSavedDisplayMode();
let keyBindings = loadSettings().keyBindings;
let noteMode: NoteMode = loadSettings().noteMode;
let interfaceLanguage = loadSettings().interfaceLanguage;
let lastNavigation: LastNavigation = "next";
let showHelp = false;
let noteState: NoteState = { kind: "idle" };

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

    if (current === "\u001b" && next === "[" && third) {
      inputs.push(`${current}${next}${third}`);
      index += 3;
      continue;
    }

    if (current === "\r" && next === "\n") {
      inputs.push("\r");
      index += 2;
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
  if (input === "\u0003") {
    quitWordSession();
    return false;
  }

  if (noteState.kind !== "editing" && input.toLowerCase() === "q") {
    quitWordSession();
    return false;
  }

  if (noteState.kind !== "idle") {
    return handleNoteInput(input);
  }

  if (input === "\u001b" && showHelp) {
    showHelp = false;
    renderSession();
    return true;
  }

  if (input === OPEN_SETTINGS_KEY) {
    openSettingSession();
    return false;
  }

  const binding = normalizeBindingInput(input);

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

  if (noteMode === "editable" && matchesBinding(binding, "editNote")) {
    startNoteSelection();
    return true;
  }

  if (matchesBinding(binding, "toggleHelp")) {
    showHelp = !showHelp;
    renderSession();
    return true;
  }

  return true;
}

function nextWord() {
  moveToNextWordGroup();
  lastNavigation = "next";
  renderSession();
}

function previousWord() {
  moveToPreviousWordGroup();
  lastNavigation = "previous";
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
  if (lastNavigation === "next") {
    nextWord();
  } else {
    previousWord();
  }
}

function switchDisplayMode() {
  if (displayMode === "both") {
    displayMode = "english";
  } else if (displayMode === "english") {
    displayMode = "chinese";
  } else {
    displayMode = "both";
  }

  saveDisplayMode(displayMode);
  renderSession();
}

function startNoteSelection() {
  const words = getCurrentWords();

  if (words.length === 0) {
    return;
  }

  noteState = { kind: "selecting", selectedIndex: 0 };
  renderSession();
}

function handleNoteInput(input: string): boolean {
  if (input === "\u001b") {
    noteState = noteState.kind === "editing"
      ? { kind: "selecting", selectedIndex: noteState.selectedIndex }
      : { kind: "idle" };
    renderSession();
    return true;
  }

  if (noteState.kind === "selecting") {
    if (input.toLowerCase() === "e") {
      noteState = { kind: "idle" };
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

    if (input === "\r" || input === "\n") {
      const word = getCurrentWords()[noteState.selectedIndex];
      noteState = {
        kind: "editing",
        selectedIndex: noteState.selectedIndex,
        input: word?.note ?? "",
      };
      renderSession();
    }

    return true;
  }

  if (noteState.kind !== "editing") {
    return true;
  }

  const editingState = noteState;

  if (input === "\r" || input === "\n") {
    saveCurrentWordNote(editingState.selectedIndex, editingState.input);
    noteState = { kind: "selecting", selectedIndex: editingState.selectedIndex };
    renderSession();
    return true;
  }

  if (input === "\b" || input === "\u007f") {
    noteState = { ...editingState, input: editingState.input.slice(0, -1) };
    renderSession();
    return true;
  }

  if (isNoteTextInput(input)) {
    noteState = { ...editingState, input: `${editingState.input}${input}` };
    renderSession();
  }

  return true;
}

function moveNoteSelection(direction: -1 | 1) {
  if (noteState.kind !== "selecting") {
    return;
  }

  const wordCount = getCurrentWords().length;

  if (wordCount === 0) {
    return;
  }

  noteState = {
    kind: "selecting",
    selectedIndex: (noteState.selectedIndex + direction + wordCount) % wordCount,
  };
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
    keyBindings,
    displayMode,
    noteMode,
    noteSelectionIndex: noteState.kind === "idle" ? undefined : noteState.selectedIndex,
    noteInput: noteState.kind === "editing" ? noteState.input : undefined,
    interfaceLanguage,
    showHelp,
  });
}

function openSettingSession() {
  saveCurrentWordProgress();
  process.stdin.off("data", handleKeyPress);
  startSettingSession({
    onReturn: () => {
      reloadWordSettings();
      keyBindings = loadSettings().keyBindings;
      noteMode = loadSettings().noteMode;
      interfaceLanguage = loadSettings().interfaceLanguage;
      displayMode = getSavedDisplayMode();
      noteState = { kind: "idle" };
      startWordSession();
    },
  });
}

function openGroupQuiz() {
  const groupWords = getCurrentStudyGroupWords();

  process.stdin.off("data", handleKeyPress);
  startGroupQuizSession({
    words: groupWords,
    interfaceLanguage,
    onReturn: () => {
      startWordSession();
    },
  });
}

function normalizeBindingInput(input: string): string | undefined {
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

function matchesBinding(binding: string | undefined, action: keyof typeof keyBindings): boolean {
  return binding !== undefined && keyBindings[action].includes(binding);
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
