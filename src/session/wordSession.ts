import {
  renderQuitMessage,
  renderWordSession,
  type DisplayMode,
} from "../ui/wordRenderer.js";

import {
  getCurrentWords,
  getWordProgress,
  nextWordGroup as moveToNextWordGroup,
  previousWordGroup as moveToPreviousWordGroup,
  reloadWordSettings,
  saveCurrentWordProgress,
} from "../services/wordService.js";
import { loadSettings } from "../services/settingsLoader.js";
import { startSettingSession } from "./settingSession.js";

type LastNavigation = "next" | "previous";

const OPEN_SETTINGS_KEY = "\u000f";
const settings = loadSettings();

let displayMode: DisplayMode = settings.displayMode;
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
  for (const input of key.toString()) {
    const shouldContinue = handleInput(input);

    if (!shouldContinue) {
      return;
    }
  }
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

  if (input.toLowerCase() === "a") {
    previousWord();
  }

  if (input.toLowerCase() === "d") {
    nextWord();
  }

  if (input === " ") {
    repeatLastNavigation();
  }

  if (input === "\t") {
    switchDisplayMode();
  }

  if (input === "?") {
    showHelp = !showHelp;
    renderSession();
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

  renderSession();
}

function renderSession() {
  const currentWords = getCurrentWords();
  const progress = getWordProgress();

  renderWordSession({
    words: currentWords,
    current: progress.current,
    total: progress.total,
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
      startWordSession();
    },
  });
}

function quitWordSession() {
  saveCurrentWordProgress();

  renderQuitMessage();

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }
  process.stdin.pause();
  process.exit(0);
}
