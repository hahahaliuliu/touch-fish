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
import {
  getReadMouseBinding,
  getReadMouseWheelDirection,
  ReadInputParser,
  setReadMouseTracking,
} from "../services/readInput.js";
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
import { normalizeSettingBinding } from "./settingFormInput.js";

interface ReadSessionState {
  book: ReadingBook;
  pages: ReadingPage[];
  scrollLines: ReadingPage[];
  sections: ReadingSection[];
  currentPageIndex: number;
  currentScrollLineIndex: number;
  scrollResumeLineIndex: number | undefined;
  scrollResumeDistance: { direction: "above" | "below"; lineCount: number } | undefined;
  scrollResumeHistory: Map<number, number | null>;
  scrollGestureDirection: -1 | 1 | undefined;
  scrollGestureAnchor: number | null | undefined;
  restoringScrollHistory: boolean;
  lastScrollTime: number;
  scrollResumeClearTimer: NodeJS.Timeout | undefined;
  theme: ThemeName;
  interfaceLanguage: InterfaceLanguage;
  showHelp: boolean;
  keyBindings: ReadKeyBindings;
  sectionNavigationEnabled: boolean;
  pageLineCount: number;
  mouseWheelMode: ReadMouseWheelMode;
  mouseScrollStep: number;
  lastNavigation: LastNavigation;
  sessionMode: "disguised" | "mini";
  onSessionQuit: (() => void) | undefined;
}

function createReadState(nextBook: ReadingBook, options: StartReadSessionOptions = {}): ReadSessionState {
  const readSettings = loadReadSettings();
  const mode = options.mode ?? "disguised";
  const resolvedPageLineCount = mode === "mini"
    ? getReadMiniPageLineCount(readSettings.miniWindowRows)
    : getReadPageLineCount(readSettings.pageLineCount);
  const sectionNavigationEnabled = readSettings.chapterSectionCount > 0;
  const sections = createReadingSections(
    nextBook.content,
    nextBook.chapters,
    sectionNavigationEnabled ? readSettings.chapterSectionCount : 1
  );
  const pages = paginateReadingText(
    nextBook.content,
    mode === "mini"
      ? getReadMiniContentWidth(readSettings.contentWidth)
      : getReadContentWidth(readSettings.theme, readSettings.contentWidth),
    resolvedPageLineCount,
    sections.map((section) => section.startOffset)
  );
  const progress = loadReadProgress(nextBook.id, nextBook.characterCount);
  const scrollLines = mode === "mini"
    ? paginateReadingText(
        nextBook.content,
        getReadMiniContentWidth(readSettings.contentWidth),
        1,
        sections.map((section) => section.startOffset)
      )
    : [];
  const currentScrollLineIndex = mode === "mini"
    ? findReadingPageIndex(scrollLines, progress.characterOffset)
    : 0;

  return {
    book: nextBook,
    pages,
    scrollLines,
    sections,
    currentPageIndex: findReadingPageIndex(pages, progress.characterOffset),
    currentScrollLineIndex,
    scrollResumeLineIndex: undefined,
    scrollResumeDistance: undefined,
    scrollResumeHistory: new Map<number, number | null>(),
    scrollGestureDirection: undefined,
    scrollGestureAnchor: undefined,
    restoringScrollHistory: false,
    lastScrollTime: 0,
    scrollResumeClearTimer: undefined,
    theme: readSettings.theme,
    interfaceLanguage: readSettings.interfaceLanguage,
    showHelp: false,
    keyBindings: readSettings.keyBindings,
    sectionNavigationEnabled,
    pageLineCount: resolvedPageLineCount,
    mouseWheelMode: readSettings.miniWindowMouseMode,
    mouseScrollStep: readSettings.miniWindowScrollStep,
    lastNavigation: "next-page",
    sessionMode: mode,
    onSessionQuit: options.onQuit,
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

let state: ReadSessionState = createReadState(BLANK_READING_BOOK, {});

const CONTINUOUS_SCROLL_DELAY = 500;
const SCROLL_RESUME_CLEAR_DELAY = 2000;
type LastNavigation = "previous-page" | "next-page" | "previous-chapter" | "next-chapter";
const inputParser = new ReadInputParser();

interface StartReadSessionOptions {
  mode?: "disguised" | "mini";
  onQuit?: () => void;
}

export function startReadSession(nextBook: ReadingBook, options: StartReadSessionOptions = {}) {
  state = createReadState(nextBook, options);
  inputParser.reset();
  renderSession();

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }
  setReadMouseTracking(true);
  process.stdin.resume();
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", handleKeyPress);

  return {
    close: quitReadSession,
    resize: resizeReadSession,
  };
}

function handleKeyPress(key: string) {
  for (const input of inputParser.parse(key.toString())) {
    if (!handleInput(input)) {
      return;
    }
  }
}

function handleInput(input: string): boolean {
  if (input === "\u0003" || input.toLowerCase() === "q") {
    quitReadSession();
    return false;
  }

  if (input === "\u001b") {
    if (state.showHelp) {
      state.showHelp = false;
      renderSession();
      return true;
    }

    quitReadSession();
    return false;
  }

  const binding = normalizeBindingInput(input);

  if (matchesBinding(binding, "toggleMiniWindow")) {
    if (state.sessionMode === "mini") {
      quitReadSession();
    } else {
      openMiniWindow();
    }
    return false;
  }

  if (matchesBinding(binding, "toggleHelp")) {
    state.showHelp = !state.showHelp;
    renderSession();
    return true;
  }

  if (input === "\u000f") {
    if (state.sessionMode === "mini") {
      return true;
    }
    openReadSettings();
    return false;
  }

  if (state.showHelp) {
    return true;
  }

  const wheelDirection = getReadMouseWheelDirection(input);
  if (state.sessionMode === "mini" && wheelDirection !== undefined) {
    if (state.mouseWheelMode === "scroll") {
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
  return getReadMouseBinding(input) ?? normalizeSettingBinding(input);
}

function matchesBinding(binding: string | undefined, action: keyof ReadKeyBindings): boolean {
  return binding !== undefined && state.keyBindings[action].includes(binding);
}

function movePage(direction: -1 | 1) {
  state.currentPageIndex = direction === 1
    ? getNextReadingPageIndex(state.pages, state.currentPageIndex)
    : getPreviousReadingPageIndex(state.pages, state.currentPageIndex);
  state.lastNavigation = direction === 1 ? "next-page" : "previous-page";
  syncScrollLineToOffset(state.pages[state.currentPageIndex]?.startOffset ?? 0);
  saveAndRender();
}

function moveScrollLine(direction: -1 | 1) {
  const previousIndex = state.currentScrollLineIndex;
  const nextIndex = Math.min(
    Math.max(state.currentScrollLineIndex + direction * state.mouseScrollStep, 0),
    Math.max(0, state.scrollLines.length - state.pageLineCount)
  );
  if (nextIndex === state.currentScrollLineIndex) {
    return;
  }

  const now = Date.now();
  const isContinuousScroll = state.scrollGestureDirection === direction
    && now - state.lastScrollTime <= CONTINUOUS_SCROLL_DELAY
    && state.scrollGestureAnchor !== undefined;
  let resumeAnchor: number | null;
  const directionChanged = state.scrollGestureDirection !== undefined
    && state.scrollGestureDirection !== direction;
  if (directionChanged || state.restoringScrollHistory) {
    resumeAnchor = state.scrollResumeHistory.has(nextIndex)
      ? state.scrollResumeHistory.get(nextIndex) ?? null
      : state.scrollGestureAnchor ?? (direction === 1
        ? Math.min(state.scrollLines.length - 1, previousIndex + state.pageLineCount)
        : previousIndex);
    state.restoringScrollHistory = true;
  } else if (isContinuousScroll) {
    resumeAnchor = state.scrollGestureAnchor ?? null;
  } else {
    resumeAnchor = direction === 1
      ? Math.min(state.scrollLines.length - 1, previousIndex + state.pageLineCount)
      : previousIndex;
    state.restoringScrollHistory = false;
  }

  state.currentScrollLineIndex = nextIndex;
  state.scrollResumeHistory.set(nextIndex, resumeAnchor);
  state.scrollGestureDirection = direction;
  state.scrollGestureAnchor = resumeAnchor;
  state.lastScrollTime = now;
  updateScrollResumeMarker(resumeAnchor);
  scheduleScrollResumeClear();
  const offset = state.scrollLines[state.currentScrollLineIndex]?.startOffset ?? 0;
  state.currentPageIndex = findReadingPageIndex(state.pages, offset);
  saveAndRender();
}

function moveChapter(direction: -1 | 1) {
  const currentPage = getCurrentReadingPage();

  if (!currentPage) {
    return;
  }

  if (state.sectionNavigationEnabled) {
    const currentSectionIndex = findReadingSectionIndex(state.sections, currentPage.startOffset);
    const nextSectionIndex = direction === 1
      ? getNextReadingSectionIndex(state.sections, currentSectionIndex)
      : getPreviousReadingSectionIndex(state.sections, currentSectionIndex);
    const nextSection = state.sections[nextSectionIndex];

    if (!nextSection) {
      return;
    }

    state.currentPageIndex = findReadingPageIndex(state.pages, nextSection.startOffset);
    syncScrollLineToOffset(nextSection.startOffset);
    state.lastNavigation = direction === 1 ? "next-chapter" : "previous-chapter";
    saveAndRender();
    return;
  }

  const currentChapterIndex = findReadingChapterIndex(state.book.chapters, currentPage.startOffset);
  const nextChapterIndex = direction === 1
    ? getNextReadingChapterIndex(state.book.chapters, currentChapterIndex)
    : getPreviousReadingChapterIndex(state.book.chapters, currentChapterIndex);
  const nextChapter = state.book.chapters[nextChapterIndex];

  if (!nextChapter) {
    return;
  }

  state.currentPageIndex = findReadingPageIndex(state.pages, nextChapter.startOffset);
  syncScrollLineToOffset(nextChapter.startOffset);
  state.lastNavigation = direction === 1 ? "next-chapter" : "previous-chapter";
  saveAndRender();
}

function repeatLastNavigation() {
  if (state.lastNavigation === "next-page") {
    movePage(1);
  } else if (state.lastNavigation === "previous-page") {
    movePage(-1);
  } else if (state.lastNavigation === "next-chapter") {
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
    saveReadProgress(state.book.id, { characterOffset: page.startOffset });
  }
}

function resizeReadSession() {
  if (state.sessionMode !== "mini") {
    return;
  }

  const currentOffset = getCurrentReadingPage()?.startOffset ?? 0;
  const readSettings = loadReadSettings();
  state.pages = paginateReadingText(
    state.book.content,
    getReadMiniContentWidth(readSettings.contentWidth),
    getReadMiniPageLineCount(readSettings.miniWindowRows),
    state.sections.map((section) => section.startOffset)
  );
  state.currentPageIndex = findReadingPageIndex(state.pages, currentOffset);
  state.pageLineCount = getReadMiniPageLineCount(readSettings.miniWindowRows);
  rebuildScrollLines(getReadMiniContentWidth(readSettings.contentWidth), currentOffset);
  renderSession();
}

function renderSession() {
  const page = getCurrentReadingPage();

  if (!page) {
    return;
  }

  const currentSection = state.sectionNavigationEnabled
    ? state.sections[findReadingSectionIndex(state.sections, page.startOffset)]
    : undefined;

  const renderOptions = {
    book: state.book,
    page,
    pageIndex: state.currentPageIndex,
    pageTotal: state.pages.length,
    chapterIndex: findReadingChapterIndex(state.book.chapters, page.startOffset),
    sectionIndex: currentSection?.indexInChapter,
    sectionTotal: currentSection?.countInChapter,
    sectionNavigationEnabled: state.sectionNavigationEnabled,
    theme: state.theme,
    interfaceLanguage: state.interfaceLanguage,
    keyBindings: state.keyBindings,
    mouseWheelMode: state.mouseWheelMode,
    mouseScrollStep: state.mouseScrollStep,
    scrollResumeLineIndex: state.scrollResumeLineIndex,
    scrollResumeDistance: state.scrollResumeDistance,
    showHelp: state.showHelp,
  };

  if (state.sessionMode === "mini") {
    renderReadMiniSession(renderOptions);
  } else {
    renderReadSession({ ...renderOptions, theme: state.theme });
  }
}

function quitReadSession() {
  clearScrollResumeTimer();
  saveCurrentProgress();
  process.stdin.off("data", handleKeyPress);
  setReadMouseTracking(false);
  if (state.sessionMode === "mini") {
    renderReadMiniQuitMessage();
  } else {
    renderReadQuitMessage(state.theme);
  }

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }
  process.stdin.pause();
  state.onSessionQuit?.();
  process.exit(0);
}

function rebuildScrollLines(contentWidth: number, offset: number) {
  if (state.sessionMode !== "mini") {
    state.scrollLines = [];
    state.currentScrollLineIndex = 0;
    return;
  }
  state.scrollLines = paginateReadingText(
    state.book.content,
    contentWidth,
    1,
    state.sections.map((section) => section.startOffset)
  );
  state.currentScrollLineIndex = findReadingPageIndex(state.scrollLines, offset);
  resetScrollResumeState();
}

function syncScrollLineToOffset(offset: number) {
  if (state.scrollLines.length > 0) {
    state.currentScrollLineIndex = findReadingPageIndex(state.scrollLines, offset);
  }
  resetScrollResumeState();
}

function resetScrollResumeState() {
  clearScrollResumeTimer();
  state.scrollResumeLineIndex = undefined;
  state.scrollResumeDistance = undefined;
  state.scrollResumeHistory.clear();
  state.scrollGestureDirection = undefined;
  state.scrollGestureAnchor = undefined;
  state.restoringScrollHistory = false;
  state.lastScrollTime = 0;
}

function scheduleScrollResumeClear() {
  clearScrollResumeTimer();
  state.scrollResumeClearTimer = setTimeout(() => {
    state.scrollResumeClearTimer = undefined;
    resetScrollResumeState();
    renderSession();
  }, SCROLL_RESUME_CLEAR_DELAY);
}

function clearScrollResumeTimer() {
  if (state.scrollResumeClearTimer) {
    clearTimeout(state.scrollResumeClearTimer);
    state.scrollResumeClearTimer = undefined;
  }
}

function updateScrollResumeMarker(resumeAnchor: number | null) {
  state.scrollResumeLineIndex = undefined;
  state.scrollResumeDistance = undefined;
  if (resumeAnchor === null) {
    return;
  }

  const relativeIndex = resumeAnchor - state.currentScrollLineIndex;
  const visibleLineCount = Math.min(state.pageLineCount, state.scrollLines.length - state.currentScrollLineIndex);
  if (relativeIndex < 0) {
    state.scrollResumeDistance = { direction: "above", lineCount: -relativeIndex };
  } else if (relativeIndex >= visibleLineCount) {
    state.scrollResumeDistance = {
      direction: "below",
      lineCount: relativeIndex - visibleLineCount + 1,
    };
  } else {
    state.scrollResumeLineIndex = relativeIndex;
  }
}

function getCurrentReadingPage(): ReadingPage | undefined {
  if (state.sessionMode !== "mini" || state.mouseWheelMode !== "scroll") {
    return state.pages[state.currentPageIndex];
  }

  const visibleLines = state.scrollLines.slice(state.currentScrollLineIndex, state.currentScrollLineIndex + state.pageLineCount);
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

export { getReadMouseWheelDirection } from "../services/readInput.js";

function openMiniWindow() {
  saveCurrentProgress();
  process.stdin.off("data", handleKeyPress);
  setReadMouseTracking(false);
  startReadMiniHostSession(state.book, true);
}

function openReadSettings() {
  saveCurrentProgress();
  process.stdin.off("data", handleKeyPress);
  setReadMouseTracking(false);
  startReadSettingSession({
    onReturn: (bookId) => startReadSession(loadReadingBook(bookId)),
    onOpenMiniMode: (bookId) => startReadMiniHostSession(loadReadingBook(bookId), true),
  });
}
