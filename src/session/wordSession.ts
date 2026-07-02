import {
  renderQuitMessage,
  renderWordSession,
  type DisplayMode,
} from "../ui/wordRenderer.js";

import {
  getCurrentWord,
  getWordProgress,
  nextWord as moveToNextWord,
  previousWord as moveToPreviousWord,
  saveCurrentWordProgress,
} from "../services/wordService.js";

type LastNavigation = "next" | "previous";

let displayMode: DisplayMode = "both";
let lastNavigation: LastNavigation = "next";
let showHelp = false;

export function startWordSession() {
  renderSession();

  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding("utf8");

  process.stdin.on("data", handleKeyPress);
}

function handleKeyPress(key: string) {
  const input = key.toString();

  if (input === "\u0003") {
    quitWordSession();
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
}

function nextWord() {
  moveToNextWord();
  lastNavigation = "next";
  renderSession();
}

function previousWord() {
  moveToPreviousWord();
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
  const currentWord = getCurrentWord();
  const progress = getWordProgress();

  renderWordSession({
    word: currentWord,
    current: progress.current,
    total: progress.total,
    displayMode,
    showHelp,
  });
}

function quitWordSession() {
  saveCurrentWordProgress();

  renderQuitMessage();

  process.stdin.setRawMode(false);
  process.stdin.pause();
  process.exit(0);
}