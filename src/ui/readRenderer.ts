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
    renderReadHelp(options.interfaceLanguage, options.keyBindings);
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
  console.log(`[INFO] page ${pageIndex + 1} / ${pageTotal} | chapter ${chapterIndex + 1} / ${book.chapters.length}: ${chapter.title}`);
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

function renderReadHelp(language: InterfaceLanguage, keyBindings: ReadKeyBindings) {
  const chinese = language === "chinese";

  console.clear();
  console.log(chinese ? "[INFO] 阅读工作区帮助已加载" : "[INFO] read workspace help loaded");
  console.log("");
  console.log(chinese ? "阅读操作" : "Reading controls");
  renderHelpBinding(keyBindings.previousPage, chinese ? "上一页" : "Previous page");
  renderHelpBinding(keyBindings.nextPage, chinese ? "下一页" : "Next page");
  renderHelpBinding(keyBindings.previousChapter, chinese ? "上一章" : "Previous chapter");
  renderHelpBinding(keyBindings.nextChapter, chinese ? "下一章" : "Next chapter");
  renderHelpBinding(keyBindings.repeat, chinese ? "重复上次操作" : "Repeat last action");
  console.log(`  Ctrl+O    ${chinese ? "打开阅读设置" : "Open Read settings"}`);
  renderHelpBinding(keyBindings.toggleHelp, chinese ? "关闭帮助" : "Close help");
  console.log("");
  console.log(chinese
    ? "Esc 返回阅读 | Q / Ctrl+C 保存进度并退出"
    : "Esc return to reading | Q / Ctrl+C save progress and quit");
  console.log(">");
}

function renderHelpBinding(bindings: [string, string], label: string) {
  const names = bindings.filter(Boolean).map(formatHelpBinding).join(" / ");
  console.log(`  ${names.padEnd(9)} ${label}`);
}

function formatHelpBinding(binding: string): string {
  const labels: Record<string, string> = {
    "arrow-up": "↑",
    "arrow-down": "↓",
    "arrow-left": "←",
    "arrow-right": "→",
    space: "Space",
  };

  return labels[binding] ?? binding.toUpperCase();
}
