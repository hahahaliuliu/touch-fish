import {
  renderQuitMessage,
  renderWordSession,
  type DisplayMode,
} from "../ui/wordRenderer.js";

import {
  getCurrentWords,
  getSavedDisplayMode,
  getWordProgress,
  nextWordGroup as moveToNextWordGroup,
  nextStudyGroup as moveToNextStudyGroup,
  previousWordGroup as moveToPreviousWordGroup,
  previousStudyGroup as moveToPreviousStudyGroup,
  reloadWordSettings,
  saveCurrentWordProgress,
  saveDisplayMode,
} from "../services/wordService.js";
import { loadSettings } from "../services/settingsLoader.js";
import { startSettingSession } from "./settingSession.js";

type LastNavigation = "next" | "previous";

const OPEN_SETTINGS_KEY = "\u000f";
let displayMode: DisplayMode = getSavedDisplayMode();
let keyBindings = loadSettings().keyBindings;
let lastNavigation: LastNavigation = "next";
let showHelp = false;

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
  }

  if (input === OPEN_SETTINGS_KEY) {
    openSettingSession();
    return false;
  }

  if (input.toLowerCase() === "q") {
    quitWordSession();
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
      displayMode = getSavedDisplayMode();
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
