import type { ReadingBook, ReadingPage, ReadingSection, ReadMouseWheelMode } from "../models/reading.js";
import { loadReadingBook } from "../services/readingLoader.js";
import {
  findReadingChapterIndex,
  getNextReadingChapterIndex,
  getPreviousReadingChapterIndex,
} from "../services/readingChapters.js";
import {
  findReadingPageIndex,
  getNextReadingPageIndex,
  getPreviousReadingPageIndex,
  paginateReadingText,
} from "../services/readingPagination.js";
import {
  createReadingSections,
  findReadingSectionIndex,
  getNextReadingSectionIndex,
  getPreviousReadingSectionIndex,
} from "../services/readingSections.js";
import { loadReadProgress, saveReadProgress } from "../storage/readProgress.js";
import { loadReadSettings } from "../storage/readSettings.js";
import type { InterfaceLanguage, ThemeName } from "../models/settings.js";
import type { ReadKeyBindings } from "../models/reading.js";
import {
  getReadContentWidth,
  getReadPageLineCount,
  renderReadQuitMessage,
  renderReadSession,
} from "../ui/readRenderer.js";
import {
  getReadMiniContentWidth,
  getReadMiniPageLineCount,
  renderReadMiniQuitMessage,
  renderReadMiniSession,
} from "../ui/readMiniRenderer.js";
import { startReadSettingSession } from "./readSettingSession.js";
import { startReadMiniHostSession } from "./readMiniHostSession.js";

let book: ReadingBook;
let pages = paginateReadingText("", 20, 1);
let scrollLines = paginateReadingText("", 20, 1);
let sections: ReadingSection[] = [];
let currentPageIndex = 0;
let currentScrollLineIndex = 0;
let theme: ThemeName = "build-log";
let interfaceLanguage: InterfaceLanguage = "english";
let showHelp = false;
let keyBindings: ReadKeyBindings;
let sectionNavigationEnabled = false;
let pageLineCount = 10;
let mouseWheelMode: ReadMouseWheelMode = "page";
type LastNavigation = "previous-page" | "next-page" | "previous-chapter" | "next-chapter";
let lastNavigation: LastNavigation = "next-page";
let sessionMode: "disguised" | "mini" = "disguised";
let onSessionQuit: (() => void) | undefined;
let pendingInput = "";

const ENABLE_MOUSE_TRACKING = "\u001b[?1000h\u001b[?1006h";
const DISABLE_MOUSE_TRACKING = "\u001b[?1000l\u001b[?1006l";

interface StartReadSessionOptions {
  mode?: "disguised" | "mini";
  onQuit?: () => void;
}

export function startReadSession(nextBook: ReadingBook, options: StartReadSessionOptions = {}) {
  book = nextBook;
  sessionMode = options.mode ?? "disguised";
  onSessionQuit = options.onQuit;
  const readSettings = loadReadSettings();
  theme = readSettings.theme;
  interfaceLanguage = readSettings.interfaceLanguage;
  keyBindings = readSettings.keyBindings;
  mouseWheelMode = readSettings.miniWindowMouseMode;
  pageLineCount = sessionMode === "mini"
    ? getReadMiniPageLineCount(readSettings.miniWindowRows)
    : getReadPageLineCount(readSettings.pageLineCount);
  sectionNavigationEnabled = readSettings.chapterSectionCount > 0;
  showHelp = false;
  sections = createReadingSections(
    book.content,
    book.chapters,
    sectionNavigationEnabled ? readSettings.chapterSectionCount : 1
  );
  pages = paginateReadingText(
    book.content,
    sessionMode === "mini"
      ? getReadMiniContentWidth(readSettings.contentWidth)
      : getReadContentWidth(theme, readSettings.contentWidth),
    pageLineCount,
    sections.map((section) => section.startOffset)
  );
  const progress = loadReadProgress(book.id, book.characterCount);
  currentPageIndex = findReadingPageIndex(pages, progress.characterOffset);
  rebuildScrollLines(
    sessionMode === "mini" ? getReadMiniContentWidth(readSettings.contentWidth) : 20,
    progress.characterOffset
  );
  lastNavigation = "next-page";
  pendingInput = "";
  renderSession();

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }
  if (sessionMode === "mini" && process.stdout.isTTY) {
    process.stdout.write(ENABLE_MOUSE_TRACKING);
  }
  process.stdin.resume();
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", handleKeyPress);

  return {
    close: quitReadSession,
    resize: resizeReadSession,
  };
}

function handleKeyPress(key: string) {
  for (const input of parseInputs(key.toString())) {
    if (!handleInput(input)) {
      return;
    }
  }
}

function parseInputs(input: string): string[] {
  const inputs: string[] = [];
  input = `${pendingInput}${input}`;
  pendingInput = "";
  let index = 0;

  while (index < input.length) {
    const current = input[index];
    const next = input[index + 1];
    const third = input[index + 2];

    if (current === "\u001b" && next === "[" && third === "<") {
      const remaining = input.slice(index);
      const mouseInput = remaining.match(/^\u001b\[<\d+;\d+;\d+[mM]/)?.[0];
      if (mouseInput) {
        inputs.push(mouseInput);
        index += mouseInput.length;
        continue;
      }

      pendingInput = remaining;
      break;
    }

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
  if (input === "\u0003" || input.toLowerCase() === "q") {
    quitReadSession();
    return false;
  }

  if (input === "\u001b") {
    if (showHelp) {
      showHelp = false;
      renderSession();
      return true;
    }

    quitReadSession();
    return false;
  }

  const binding = normalizeBindingInput(input);

  if (matchesBinding(binding, "toggleHelp")) {
    showHelp = !showHelp;
    renderSession();
    return true;
  }

  if (input === "\u000f") {
    if (sessionMode === "mini") {
      return true;
    }
    openReadSettings();
    return false;
  }

  if (showHelp) {
    return true;
  }

  const wheelDirection = getReadMouseWheelDirection(input);
  if (sessionMode === "mini" && wheelDirection !== undefined) {
    if (mouseWheelMode === "scroll") {
      moveScrollLine(wheelDirection);
    } else {
      movePage(wheelDirection);
    }
    return true;
  }

  if (matchesBinding(binding, "previousPage")) {
    movePage(-1);
    return true;
  }

  if (matchesBinding(binding, "nextPage")) {
    movePage(1);
    return true;
  }

  if (matchesBinding(binding, "previousChapter")) {
    moveChapter(-1);
    return true;
  }

  if (matchesBinding(binding, "nextChapter")) {
    moveChapter(1);
    return true;
  }

  if (matchesBinding(binding, "repeat")) {
    repeatLastNavigation();
    return true;
  }

  return true;
}

function normalizeBindingInput(input: string): string | undefined {
  const specialBindings: Record<string, string> = {
    "\u001b[A": "arrow-up",
    "\u001b[B": "arrow-down",
    "\u001b[C": "arrow-right",
    "\u001b[D": "arrow-left",
    " ": "space",
  };

  return specialBindings[input] ?? (/^[\x21-\x7e]$/.test(input) ? input.toLowerCase() : undefined);
}

function matchesBinding(binding: string | undefined, action: keyof ReadKeyBindings): boolean {
  return binding !== undefined && keyBindings[action].includes(binding);
}

function movePage(direction: -1 | 1) {
  currentPageIndex = direction === 1
    ? getNextReadingPageIndex(pages, currentPageIndex)
    : getPreviousReadingPageIndex(pages, currentPageIndex);
  lastNavigation = direction === 1 ? "next-page" : "previous-page";
  syncScrollLineToOffset(pages[currentPageIndex]?.startOffset ?? 0);
  saveAndRender();
}

function moveScrollLine(direction: -1 | 1) {
  const nextIndex = Math.min(
    Math.max(currentScrollLineIndex + direction, 0),
    Math.max(0, scrollLines.length - 1)
  );
  if (nextIndex === currentScrollLineIndex) {
    return;
  }
  currentScrollLineIndex = nextIndex;
  const offset = scrollLines[currentScrollLineIndex]?.startOffset ?? 0;
  currentPageIndex = findReadingPageIndex(pages, offset);
  saveAndRender();
}

function moveChapter(direction: -1 | 1) {
  const currentPage = getCurrentReadingPage();

  if (!currentPage) {
    return;
  }

  if (sectionNavigationEnabled) {
    const currentSectionIndex = findReadingSectionIndex(sections, currentPage.startOffset);
    const nextSectionIndex = direction === 1
      ? getNextReadingSectionIndex(sections, currentSectionIndex)
      : getPreviousReadingSectionIndex(sections, currentSectionIndex);
    const nextSection = sections[nextSectionIndex];

    if (!nextSection) {
      return;
    }

    currentPageIndex = findReadingPageIndex(pages, nextSection.startOffset);
    syncScrollLineToOffset(nextSection.startOffset);
    lastNavigation = direction === 1 ? "next-chapter" : "previous-chapter";
    saveAndRender();
    return;
  }

  const currentChapterIndex = findReadingChapterIndex(book.chapters, currentPage.startOffset);
  const nextChapterIndex = direction === 1
    ? getNextReadingChapterIndex(book.chapters, currentChapterIndex)
    : getPreviousReadingChapterIndex(book.chapters, currentChapterIndex);
  const nextChapter = book.chapters[nextChapterIndex];

  if (!nextChapter) {
    return;
  }

  currentPageIndex = findReadingPageIndex(pages, nextChapter.startOffset);
  syncScrollLineToOffset(nextChapter.startOffset);
  lastNavigation = direction === 1 ? "next-chapter" : "previous-chapter";
  saveAndRender();
}

function repeatLastNavigation() {
  if (lastNavigation === "next-page") {
    movePage(1);
  } else if (lastNavigation === "previous-page") {
    movePage(-1);
  } else if (lastNavigation === "next-chapter") {
    moveChapter(1);
  } else {
    moveChapter(-1);
  }
}

function saveAndRender() {
  saveCurrentProgress();
  renderSession();
}

function saveCurrentProgress() {
  const page = getCurrentReadingPage();

  if (page) {
    saveReadProgress(book.id, { characterOffset: page.startOffset });
  }
}

function resizeReadSession() {
  if (sessionMode !== "mini") {
    return;
  }

  const currentOffset = getCurrentReadingPage()?.startOffset ?? 0;
  const readSettings = loadReadSettings();
  pages = paginateReadingText(
    book.content,
    getReadMiniContentWidth(readSettings.contentWidth),
    getReadMiniPageLineCount(readSettings.miniWindowRows),
    sections.map((section) => section.startOffset)
  );
  currentPageIndex = findReadingPageIndex(pages, currentOffset);
  pageLineCount = getReadMiniPageLineCount(readSettings.miniWindowRows);
  rebuildScrollLines(getReadMiniContentWidth(readSettings.contentWidth), currentOffset);
  renderSession();
}

function renderSession() {
  const page = getCurrentReadingPage();

  if (!page) {
    return;
  }

  const currentSection = sectionNavigationEnabled
    ? sections[findReadingSectionIndex(sections, page.startOffset)]
    : undefined;

  const renderOptions = {
    book,
    page,
    pageIndex: currentPageIndex,
    pageTotal: pages.length,
    chapterIndex: findReadingChapterIndex(book.chapters, page.startOffset),
    sectionIndex: currentSection?.indexInChapter,
    sectionTotal: currentSection?.countInChapter,
    sectionNavigationEnabled,
    theme,
    interfaceLanguage,
    keyBindings,
    mouseWheelMode,
    showHelp,
  };

  if (sessionMode === "mini") {
    renderReadMiniSession(renderOptions);
  } else {
    renderReadSession({ ...renderOptions, theme });
  }
}

function quitReadSession() {
  saveCurrentProgress();
  process.stdin.off("data", handleKeyPress);
  if (sessionMode === "mini") {
    if (process.stdout.isTTY) {
      process.stdout.write(DISABLE_MOUSE_TRACKING);
    }
    renderReadMiniQuitMessage();
  } else {
    renderReadQuitMessage(theme);
  }

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }
  process.stdin.pause();
  onSessionQuit?.();
  process.exit(0);
}

function rebuildScrollLines(contentWidth: number, offset: number) {
  if (sessionMode !== "mini") {
    scrollLines = [];
    currentScrollLineIndex = 0;
    return;
  }
  scrollLines = paginateReadingText(
    book.content,
    contentWidth,
    1,
    sections.map((section) => section.startOffset)
  );
  currentScrollLineIndex = findReadingPageIndex(scrollLines, offset);
}

function syncScrollLineToOffset(offset: number) {
  if (scrollLines.length > 0) {
    currentScrollLineIndex = findReadingPageIndex(scrollLines, offset);
  }
}

function getCurrentReadingPage(): ReadingPage | undefined {
  if (sessionMode !== "mini" || mouseWheelMode !== "scroll") {
    return pages[currentPageIndex];
  }

  const visibleLines = scrollLines.slice(currentScrollLineIndex, currentScrollLineIndex + pageLineCount);
  const first = visibleLines[0];
  const last = visibleLines[visibleLines.length - 1];
  if (!first || !last) {
    return undefined;
  }
  return {
    startOffset: first.startOffset,
    endOffset: last.endOffset,
    lines: visibleLines.flatMap((line) => line.lines),
  };
}

export function getReadMouseWheelDirection(input: string): -1 | 1 | undefined {
  const match = input.match(/^\u001b\[<(\d+);\d+;\d+[mM]$/);
  if (!match) {
    return undefined;
  }
  const button = Number(match[1]);
  if (button === 64) {
    return -1;
  }
  if (button === 65) {
    return 1;
  }
  return undefined;
}

function openReadSettings() {
  saveCurrentProgress();
  process.stdin.off("data", handleKeyPress);
  startReadSettingSession({
    onReturn: (bookId) => startReadSession(loadReadingBook(bookId)),
    onOpenMiniMode: (bookId) => startReadMiniHostSession(loadReadingBook(bookId), true),
  });
}
