import type { ReadingBook, ReadingSection } from "../models/reading.js";
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
import { startReadSettingSession } from "./readSettingSession.js";

let book: ReadingBook;
let pages = paginateReadingText("", 20, 1);
let sections: ReadingSection[] = [];
let currentPageIndex = 0;
let theme: ThemeName = "build-log";
let interfaceLanguage: InterfaceLanguage = "english";
let showHelp = false;
let keyBindings: ReadKeyBindings;
let sectionNavigationEnabled = false;
type LastNavigation = "previous-page" | "next-page" | "previous-chapter" | "next-chapter";
let lastNavigation: LastNavigation = "next-page";

export function startReadSession(nextBook: ReadingBook) {
  book = nextBook;
  const readSettings = loadReadSettings();
  theme = readSettings.theme;
  interfaceLanguage = readSettings.interfaceLanguage;
  keyBindings = readSettings.keyBindings;
  sectionNavigationEnabled = readSettings.chapterSectionCount > 0;
  showHelp = false;
  sections = createReadingSections(
    book.content,
    book.chapters,
    sectionNavigationEnabled ? readSettings.chapterSectionCount : 1
  );
  pages = paginateReadingText(
    book.content,
    getReadContentWidth(theme, readSettings.contentWidth),
    getReadPageLineCount(readSettings.pageLineCount),
    sections.map((section) => section.startOffset)
  );
  const progress = loadReadProgress(book.id, book.characterCount);
  currentPageIndex = findReadingPageIndex(pages, progress.characterOffset);
  lastNavigation = "next-page";
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
    if (!handleInput(input)) {
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
    openReadSettings();
    return false;
  }

  if (showHelp) {
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
  saveAndRender();
}

function moveChapter(direction: -1 | 1) {
  const currentPage = pages[currentPageIndex];

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
  const page = pages[currentPageIndex];

  if (page) {
    saveReadProgress(book.id, { characterOffset: page.startOffset });
  }
}

function renderSession() {
  const page = pages[currentPageIndex];

  if (!page) {
    return;
  }

  const currentSection = sectionNavigationEnabled
    ? sections[findReadingSectionIndex(sections, page.startOffset)]
    : undefined;

  renderReadSession({
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
    showHelp,
  });
}

function quitReadSession() {
  saveCurrentProgress();
  process.stdin.off("data", handleKeyPress);
  renderReadQuitMessage(theme);

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }
  process.stdin.pause();
  process.exit(0);
}

function openReadSettings() {
  saveCurrentProgress();
  process.stdin.off("data", handleKeyPress);
  startReadSettingSession({
    onReturn: (bookId) => startReadSession(loadReadingBook(bookId)),
  });
}
