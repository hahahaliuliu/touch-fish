import type { ReadingBook, ReadingPage, ReadKeyBindings } from "../models/reading.js";
import type { InterfaceLanguage, ThemeName } from "../models/settings.js";
import { getTerminalColumns, getTerminalWidth } from "./terminalText.js";
import {
  renderBackendLogReadQuitMessage,
  renderBackendLogReadSession,
} from "./readBackendLogTheme.js";
import { renderGitReadQuitMessage, renderGitReadSession } from "./readGitTheme.js";

const CONTENT_PREFIX = "  cache/read/001.ts // ";
const DEFAULT_PAGE_LINE_COUNT = 10;

export interface RenderReadSessionOptions {
  book: ReadingBook;
  page: ReadingPage;
  pageIndex: number;
  pageTotal: number;
  chapterIndex: number;
  sectionIndex?: number | undefined;
  sectionTotal?: number | undefined;
  sectionNavigationEnabled?: boolean | undefined;
  theme: ThemeName;
  interfaceLanguage: InterfaceLanguage;
  keyBindings: ReadKeyBindings;
  showHelp: boolean;
}

export function getReadContentWidth(theme: ThemeName = "build-log", contentWidth = 0): number {
  const prefix = theme === "backend-log"
    ? "2026-08-07T00:00:00.000Z DEBUG read fragment=001 text=\"\""
    : theme === "git"
      ? "+  src/reading/page-001.txt: "
      : CONTENT_PREFIX;
  const availableWidth = Math.max(20, getTerminalColumns() - getTerminalWidth(prefix));

  return contentWidth >= 20 ? Math.min(contentWidth, availableWidth) : availableWidth;
}

export function getReadPageLineCount(pageLineCount = DEFAULT_PAGE_LINE_COUNT): number {
  return Math.max(1, pageLineCount);
}

export function renderReadSession(options: RenderReadSessionOptions) {
  if (options.showHelp) {
    renderReadHelp(options);
    return;
  }

  const { theme } = options;

  if (theme === "backend-log") {
    renderBackendLogReadSession(options);
    return;
  }

  if (theme === "git") {
    renderGitReadSession(options);
    return;
  }

  renderBuildLogReadSession(options);
}

function renderBuildLogReadSession(options: RenderReadSessionOptions) {
  const { book, page, pageIndex, pageTotal, chapterIndex } = options;
  const chapter = book.chapters[chapterIndex] ?? book.chapters[0]!;
  const sectionStatus = options.sectionNavigationEnabled && options.sectionIndex !== undefined && options.sectionTotal !== undefined
    ? ` | section ${options.sectionIndex + 1} / ${options.sectionTotal}`
    : "";

  console.clear();
  console.log("[INFO] compiling reading workspace...");
  console.log("[INFO] resolving chapter index...");
  console.log("[INFO] loading cached text segments...");
  console.log(`[INFO] source loaded: ${book.title}.txt`);
  console.log("[INFO] generating paged output...");
  console.log("");
  console.log("assets by status  cached text modules");
  console.log("  runtime modules 698 bytes 4 modules");
  console.log("  modules by path ./src/read/ 1.24 KiB");
  console.log("  modules by path ./node_modules/ 8.15 KiB");
  console.log("    ./node_modules/commander/index.js 2.91 KiB [built]");
  console.log("    + 2 modules");
  console.log("");
  console.log("cache entries by path ./src/read/");

  page.lines.forEach((line, index) => {
    if (!line) {
      console.log("");
      return;
    }

    const id = String(page.startOffset + index).padStart(3, "0");
    console.log(`  cache/read/${id}.ts // ${line}`);

    if (line === chapter.title) {
      console.log("");
    }
  });

  console.log("");
  console.log(`[INFO] page ${pageIndex + 1} / ${pageTotal} | chapter ${chapterIndex + 1} / ${book.chapters.length}${sectionStatus}: ${chapter.title}`);
  console.log(`[INFO] saved offset ready: ${page.startOffset}`);
  console.log("[INFO] watching for page navigation...");
  console.log("runtime: idle");
  console.log(">");
}

export function renderReadQuitMessage(theme: ThemeName) {

  if (theme === "backend-log") {
    renderBackendLogReadQuitMessage();
    return;
  }

  if (theme === "git") {
    renderGitReadQuitMessage();
    return;
  }

  console.clear();
  console.log("[INFO] read progress saved");
  console.log("[INFO] reading workspace closed");
}

function renderReadHelp(options: RenderReadSessionOptions) {
  const {
    book,
    page,
    pageIndex,
    pageTotal,
    chapterIndex,
    keyBindings,
    interfaceLanguage,
  } = options;
  const sectionNavigationEnabled = options.sectionNavigationEnabled === true;
  const chapter = book.chapters[chapterIndex] ?? book.chapters[0];
  const text = getReadHelpText(interfaceLanguage);

  console.clear();
  console.log(text.title);
  console.log("");
  console.log(text.navigation);
  renderHelpBinding(keyBindings.previousPage, text.previousPage);
  renderHelpBinding(keyBindings.nextPage, text.nextPage);
  renderHelpBinding(
    keyBindings.previousChapter,
    sectionNavigationEnabled ? text.previousSection : text.previousChapter
  );
  renderHelpBinding(
    keyBindings.nextChapter,
    sectionNavigationEnabled ? text.nextSection : text.nextChapter
  );
  renderHelpBinding(keyBindings.repeat, text.repeat);
  console.log("");
  console.log(text.actions);
  renderHelpRow("Ctrl+O", text.openSettings);
  renderHelpBinding(keyBindings.toggleMiniWindow, text.toggleMiniWindow);
  renderHelpBinding(keyBindings.toggleHelp, text.closeHelp);
  renderHelpRow("Esc", text.returnToReading);
  renderHelpRow("Q / Ctrl+C", text.quit);
  console.log("");
  console.log(text.currentWorkspace);
  renderHelpRow(text.currentBook, book.title);
  const readingPosition = Math.min(book.characterCount, page.startOffset + 1);
  renderHelpRow(text.position, `${readingPosition} / ${book.characterCount}`);
  renderHelpRow(text.page, `${pageIndex + 1} / ${pageTotal}`);
  renderHelpRow(text.visibleLines, String(page.lines.length));
  renderHelpRow(text.chapter, `${chapterIndex + 1} / ${book.chapters.length}`);
  renderHelpRow(text.chapterTitle, chapter?.title ?? "-");
  renderHelpRow(text.sectionNavigation, sectionNavigationEnabled ? text.enabled : text.disabled);
  if (sectionNavigationEnabled) {
    renderHelpRow(
      text.section,
      `${(options.sectionIndex ?? 0) + 1} / ${options.sectionTotal ?? 1}`
    );
  }
}

function renderHelpBinding(bindings: [string, string], label: string) {
  const names = bindings.filter(Boolean).map(formatHelpBinding).join(" / ");
  renderHelpRow(names, label);
}

function renderHelpRow(label: string, value: string) {
  const labelWidth = 21;
  console.log(`  ${label}${" ".repeat(Math.max(1, labelWidth - getTerminalWidth(label)))}${value}`);
}

function formatHelpBinding(binding: string): string {
  const labels: Record<string, string> = {
    "arrow-up": "↑",
    "arrow-down": "↓",
    "arrow-left": "←",
    "arrow-right": "→",
    "mouse-middle": "Middle Mouse",
    "mouse-right": "Right Mouse",
    space: "Space",
  };

  return labels[binding] ?? binding.toUpperCase();
}

function getReadHelpText(language: InterfaceLanguage) {
  if (language === "chinese") {
    return {
      title: "Touch Fish 帮助",
      navigation: "导航",
      previousPage: "上一页",
      nextPage: "下一页",
      previousChapter: "上一章",
      nextChapter: "下一章",
      previousSection: "上一小节",
      nextSection: "下一小节",
      repeat: "重复上次操作",
      actions: "操作",
      openSettings: "打开阅读设置",
      toggleMiniWindow: "打开或关闭小窗口",
      closeHelp: "关闭帮助",
      returnToReading: "返回阅读",
      quit: "保存进度并退出",
      currentWorkspace: "当前阅读区",
      currentBook: "当前小说",
      position: "当前进度",
      page: "当前页面",
      visibleLines: "当前显示",
      chapter: "当前章节",
      chapterTitle: "章节标题",
      sectionNavigation: "章节切分",
      section: "当前小节",
      enabled: "开启",
      disabled: "关闭",
    };
  }

  return {
    title: "Touch Fish Help",
    navigation: "Navigation",
    previousPage: "previous page",
    nextPage: "next page",
    previousChapter: "previous chapter",
    nextChapter: "next chapter",
    previousSection: "previous section",
    nextSection: "next section",
    repeat: "repeat last action",
    actions: "Actions",
    openSettings: "open Read settings",
    toggleMiniWindow: "open or close mini window",
    closeHelp: "close help",
    returnToReading: "return to reading",
    quit: "save progress and quit",
    currentWorkspace: "Current Reading Workspace",
    currentBook: "current novel",
    position: "reading position",
    page: "page",
    visibleLines: "visible lines",
    chapter: "chapter",
    chapterTitle: "chapter title",
    sectionNavigation: "chapter sections",
    section: "section",
    enabled: "enabled",
    disabled: "disabled",
  };
}
