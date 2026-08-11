import type { ReadingBook } from "../models/reading.js";
import { loadReadingBook } from "../services/readingLoader.js";
import { getReadMouseBinding, ReadInputParser, setReadMouseTracking } from "../services/readInput.js";
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
const inputParser = new ReadInputParser();

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
  inputParser.reset();
  removeStateListener?.();
  removeStateListener = controller.onStateChange((nextState) => {
    state = nextState;
    if (hostActive) {
      render();
    }
  });

  render();
  if (openWindow) {
    const settings = loadReadSettings();
    void controller.open(book.id, {
      columns: settings.miniWindowColumns,
      rows: settings.miniWindowRows,
      fontSize: settings.miniWindowFontSize,
    });
  }

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
    const settings = loadReadSettings();
    if (binding && settings.keyBindings.toggleMiniWindow.includes(binding)) {
      toggleMiniWindow();
      return;
    }
    const helpBindings = settings.keyBindings.toggleHelp;
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

function toggleMiniWindow() {
  if (state.status === "open" || state.status === "opening") {
    controller.closeMode();
    return;
  }

  const settings = loadReadSettings();
  void controller.open(book.id, {
    columns: settings.miniWindowColumns,
    rows: settings.miniWindowRows,
    fontSize: settings.miniWindowFontSize,
  });
}

function render() {
  const settings = loadReadSettings();
  renderReadMiniHost(
    settings.theme,
    settings.interfaceLanguage,
    settings.keyBindings.toggleHelp,
    settings.keyBindings.toggleMiniWindow,
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
    onToggleMiniWindow: toggleMiniWindow,
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
  setReadMouseTracking(false);
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
  return getReadMouseBinding(input)
    ?? specialBindings[input]
    ?? (/^[\x21-\x7e]$/.test(input) ? input.toLowerCase() : undefined);
}
