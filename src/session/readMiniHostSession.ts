import type { ReadingBook } from "../models/reading.js";
import { loadReadingBook } from "../services/readingLoader.js";
import {
  ReadMiniWindowController,
  type ReadMiniWindowState,
} from "../services/readMiniWindow.js";
import { loadReadSettings } from "../storage/readSettings.js";
import { clearTerminalForExit } from "../ui/terminalScreen.js";
import { renderReadMiniHost } from "../ui/readMiniHostRenderer.js";
import { startReadSession } from "./readSession.js";
import { startReadSettingSession } from "./readSettingSession.js";

let book: ReadingBook;
let controller: ReadMiniWindowController;
let state: ReadMiniWindowState = { status: "closed" };
let showHelp = false;
let removeStateListener: (() => void) | undefined;
let hostActive = false;

export function startReadMiniHostSession(
  nextBook: ReadingBook,
  openWindow: boolean,
  existingController?: ReadMiniWindowController
) {
  book = nextBook;
  controller = existingController ?? new ReadMiniWindowController();
  state = controller.getState();
  showHelp = false;
  hostActive = true;
  removeStateListener?.();
  removeStateListener = controller.onStateChange((nextState) => {
    state = nextState;
    if (hostActive) {
      render();
    }
  });

  render();
  if (openWindow) {
    void controller.open(book.id);
  }

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }
  process.stdin.resume();
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", handleKeyPress);
}

function handleKeyPress(key: string) {
  for (const input of parseInputs(key.toString())) {
    if (input === "\u0003" || input.toLowerCase() === "q") {
      quit();
      return;
    }

    if (input === "\u001b") {
      if (showHelp) {
        showHelp = false;
        render();
      } else {
        quit();
      }
      return;
    }

    const binding = normalizeBindingInput(input);
    const helpBindings = loadReadSettings().keyBindings.toggleHelp;
    if (binding && helpBindings.includes(binding)) {
      showHelp = !showHelp;
      render();
      continue;
    }

    if (input === "\u000f") {
      openSettings();
      return;
    }
  }
}

function render() {
  const settings = loadReadSettings();
  renderReadMiniHost(
    settings.theme,
    settings.interfaceLanguage,
    settings.keyBindings.toggleHelp,
    showHelp,
    state
  );
}

function openSettings() {
  stopInput();
  hostActive = false;
  startReadSettingSession({
    miniModeActive: true,
    onReturn: (bookId) => startReadMiniHostSession(
      loadReadingBook(bookId),
      false,
      controller
    ),
    onCloseMiniMode: (bookId) => {
      controller.closeMode();
      removeStateListener?.();
      startReadSession(loadReadingBook(bookId));
    },
  });
}

function quit() {
  stopInput();
  hostActive = false;
  controller.closeMode();
  removeStateListener?.();
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }
  clearTerminalForExit();
  process.stdin.pause();
  process.exit(0);
}

function stopInput() {
  process.stdin.off("data", handleKeyPress);
}

function parseInputs(input: string) {
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

function normalizeBindingInput(input: string) {
  const specialBindings: Record<string, string> = {
    "\u001b[A": "arrow-up",
    "\u001b[B": "arrow-down",
    "\u001b[C": "arrow-right",
    "\u001b[D": "arrow-left",
    " ": "space",
    "？": "?",
  };
  return specialBindings[input] ?? (/^[\x21-\x7e]$/.test(input) ? input.toLowerCase() : undefined);
}
