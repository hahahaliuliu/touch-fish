import type { ReadingBook } from "../models/reading.js";
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
import { loadReadProgress, saveReadProgress } from "../storage/readProgress.js";
import { loadSettings } from "../services/settingsLoader.js";
import type { InterfaceLanguage, ThemeName } from "../models/settings.js";
import {
  getReadContentWidth,
  getReadPageLineCount,
  renderReadQuitMessage,
  renderReadSession,
} from "../ui/readRenderer.js";

let book: ReadingBook;
let pages = paginateReadingText("", 20, 1);
let currentPageIndex = 0;
let theme: ThemeName = "build-log";
let interfaceLanguage: InterfaceLanguage = "english";
let showHelp = false;
type LastNavigation = "previous-page" | "next-page" | "previous-chapter" | "next-chapter";
let lastNavigation: LastNavigation = "next-page";

export function startReadSession(nextBook: ReadingBook) {
  book = nextBook;
  const settings = loadSettings();
  theme = settings.theme;
  interfaceLanguage = settings.interfaceLanguage;
  showHelp = false;
  pages = paginateReadingText(
    book.content,
    getReadContentWidth(theme),
    getReadPageLineCount(),
    book.chapters.map((chapter) => chapter.startOffset)
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

  if (input === "?") {
    showHelp = !showHelp;
    renderSession();
    return true;
  }

  if (showHelp) {
    return true;
  }

  if (input === "a" || input === "A" || input === "\u001b[D") {
    movePage(-1);
    return true;
  }

  if (input === "d" || input === "D" || input === "\u001b[C") {
    movePage(1);
    return true;
  }

  if (input === "w" || input === "W" || input === "\u001b[A") {
    moveChapter(-1);
    return true;
  }

  if (input === "s" || input === "S" || input === "\u001b[B") {
    moveChapter(1);
    return true;
  }

  if (input === " ") {
    repeatLastNavigation();
    return true;
  }

  return true;
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

  renderReadSession({
    book,
    page,
    pageIndex: currentPageIndex,
    pageTotal: pages.length,
    chapterIndex: findReadingChapterIndex(book.chapters, page.startOffset),
    theme,
    interfaceLanguage,
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
