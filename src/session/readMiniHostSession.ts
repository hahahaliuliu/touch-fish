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
import { normalizeSettingBinding } from "./settingFormInput.js";

interface ReadMiniHostSessionState {
  book: ReadingBook;
  controller: ReadMiniWindowController;
  state: ReadMiniWindowState;
  showHelp: boolean;
  removeStateListener: (() => void) | undefined;
  hostActive: boolean;
}

function createReadMiniHostSessionState(
  nextBook: ReadingBook,
  existingController?: ReadMiniWindowController
): ReadMiniHostSessionState {
  const controller = existingController ?? new ReadMiniWindowController();
  return {
    book: nextBook,
    controller,
    state: controller.getState(),
    showHelp: false,
    removeStateListener: undefined,
    hostActive: true,
  };
}

const BLANK_READING_BOOK: ReadingBook = {
  id: "",
  title: "",
  sourcePath: "",
  content: "",
  characterCount: 0,
  chapters: [],
};

let session: ReadMiniHostSessionState = {
  book: BLANK_READING_BOOK,
  controller: new ReadMiniWindowController(),
  state: { status: "closed" },
  showHelp: false,
  removeStateListener: undefined,
  hostActive: false,
};

const inputParser = new ReadInputParser();

export function startReadMiniHostSession(
  nextBook: ReadingBook,
  openWindow: boolean,
  existingController?: ReadMiniWindowController
) {
  session.removeStateListener?.();
  session = createReadMiniHostSessionState(nextBook, existingController);
  inputParser.reset();
  session.removeStateListener = session.controller.onStateChange((nextState) => {
    session.state = nextState;
    if (session.hostActive) {
      render();
    }
  });

  render();
  if (openWindow) {
    const settings = loadReadSettings();
    void session.controller.open(session.book.id, {
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
      if (session.showHelp) {
        session.showHelp = false;
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
      session.showHelp = !session.showHelp;
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
  if (session.state.status === "open" || session.state.status === "opening") {
    session.controller.closeMode();
    return;
  }

  const settings = loadReadSettings();
  void session.controller.open(session.book.id, {
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
    session.showHelp,
    session.state
  );
}

function openSettings() {
  stopInput();
  session.hostActive = false;
  startReadSettingSession({
    miniModeActive: true,
    onReturn: (bookId) => startReadMiniHostSession(
      loadReadingBook(bookId),
      false,
      session.controller
    ),
    onToggleMiniWindow: toggleMiniWindow,
    onCloseMiniMode: (bookId) => {
      session.controller.closeMode();
      session.removeStateListener?.();
      startReadSession(loadReadingBook(bookId));
    },
  });
}

function quit() {
  stopInput();
  session.hostActive = false;
  session.controller.closeMode();
  session.removeStateListener?.();
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

function normalizeBindingInput(input: string): string | undefined {
  return getReadMouseBinding(input) ?? normalizeSettingBinding(input);
}

