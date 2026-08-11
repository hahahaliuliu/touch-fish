import type {
  ReadingBook,
  ReadingPage,
  ReadKeyBindings,
  ReadMouseWheelMode,
} from "../models/reading.js";
import type { InterfaceLanguage } from "../models/settings.js";
import { getTerminalColumns, getTerminalWidth, truncateTerminalText } from "./terminalText.js";

const MINI_FIXED_ROW_COUNT = 1;

export interface RenderReadMiniSessionOptions {
  book: ReadingBook;
  page: ReadingPage;
  pageIndex: number;
  pageTotal: number;
  chapterIndex: number;
  sectionIndex?: number | undefined;
  sectionTotal?: number | undefined;
  sectionNavigationEnabled: boolean;
  interfaceLanguage: InterfaceLanguage;
  keyBindings: ReadKeyBindings;
  mouseWheelMode: ReadMouseWheelMode;
  mouseScrollStep: number;
  scrollResumeLineIndex?: number | undefined;
  scrollResumeDistance?: { direction: "above" | "below"; lineCount: number } | undefined;
  showHelp: boolean;
}

export function getReadMiniContentWidth(contentWidth: number) {
  const availableWidth = Math.max(20, getTerminalColumns() - 4);
  return contentWidth >= 20 ? Math.min(contentWidth, availableWidth) : availableWidth;
}

export function getReadMiniPageLineCount(configuredRows: number) {
  const terminalRows = Number.isInteger(process.stdout.rows) && process.stdout.rows > 0
    ? process.stdout.rows
    : configuredRows;
  return Math.max(1, terminalRows - MINI_FIXED_ROW_COUNT);
}

export function renderReadMiniSession(options: RenderReadMiniSessionOptions) {
  console.clear();
  if (options.showHelp) {
    renderHelp(options);
    return;
  }

  const chapter = options.book.chapters[options.chapterIndex] ?? options.book.chapters[0];
  const heading = chapter?.title
    ? `${options.book.title}  |  ${chapter.title}`
    : options.book.title;
  const section = options.sectionNavigationEnabled
    ? ` | ${options.sectionIndex ?? 1}/${options.sectionTotal ?? 1}`
    : "";
  const resumeStatus = formatResumeDistance(options.scrollResumeDistance, options.interfaceLanguage);
  const progress = `${options.pageIndex + 1}/${options.pageTotal}${section}`;
  const terminalWidth = Math.max(1, getTerminalColumns() - 2);
  const progressWidth = getTerminalWidth(progress) + 3;
  const compactHeading = truncateTerminalText(heading, Math.max(1, terminalWidth - progressWidth));
  const fixedHeader = `${compactHeading}   ${progress}`;
  const availableStatusWidth = Math.max(0, terminalWidth - getTerminalWidth(fixedHeader));
  const compactStatus = truncateTerminalText(resumeStatus, availableStatusWidth);
  const statusSpacing = compactStatus
    ? " ".repeat(Math.max(0, availableStatusWidth - getTerminalWidth(compactStatus)))
    : "";
  console.log(`${fixedHeader}${statusSpacing}${compactStatus}`);
  const contentLines = options.mouseWheelMode === "scroll"
    ? options.page.lines.map((line, index) => `${index === options.scrollResumeLineIndex ? "> " : "  "}${line}`)
    : options.page.lines;
  process.stdout.write(contentLines.join("\n"));
}

function formatResumeDistance(
  distance: RenderReadMiniSessionOptions["scrollResumeDistance"],
  language: InterfaceLanguage
) {
  if (!distance) {
    return "";
  }

  const arrow = distance.direction === "above" ? "↑" : "↓";
  if (language === "chinese") {
    const direction = distance.direction === "above" ? "上方" : "下方";
    return ` | ${arrow} 上次位置在${direction} ${distance.lineCount} 行`;
  }
  return ` | ${arrow} last position ${distance.lineCount} lines ${distance.direction}`;
}

export function renderReadMiniQuitMessage() {
  console.clear();
}

function renderHelp(options: RenderReadMiniSessionOptions) {
  const chinese = options.interfaceLanguage === "chinese";
  console.log(chinese ? "Touch Fish 小窗口帮助" : "Touch Fish Mini Help");
  console.log("");
  renderBinding(options.keyBindings.previousPage, chinese ? "上一页" : "previous page");
  renderBinding(options.keyBindings.nextPage, chinese ? "下一页" : "next page");
  renderBinding(
    options.keyBindings.previousChapter,
    chinese
      ? options.sectionNavigationEnabled ? "上一小节" : "上一章"
      : options.sectionNavigationEnabled ? "previous section" : "previous chapter"
  );
  renderBinding(
    options.keyBindings.nextChapter,
    chinese
      ? options.sectionNavigationEnabled ? "下一小节" : "下一章"
      : options.sectionNavigationEnabled ? "next section" : "next chapter"
  );
  renderBinding(options.keyBindings.repeat, chinese ? "重复操作" : "repeat action");
  renderRow(
    chinese ? "鼠标滚轮" : "Mouse Wheel",
    chinese
      ? options.mouseWheelMode === "page" ? "左右翻页" : "上下逐行滚动"
      : options.mouseWheelMode === "page" ? "page navigation" : "line scrolling"
  );
  if (options.mouseWheelMode === "scroll") {
    renderRow(
      chinese ? "滚动速率" : "Scroll Speed",
      chinese ? `${options.mouseScrollStep} 行` : `${options.mouseScrollStep} lines`
    );
  }
  renderBinding(options.keyBindings.toggleMiniWindow, chinese ? "关闭小窗口" : "close mini window");
  renderBinding(options.keyBindings.toggleHelp, chinese ? "关闭帮助" : "close help");
  renderRow("Esc", chinese ? "返回阅读" : "return to reading");
  renderRow("Q / Ctrl+C", chinese ? "保存并关闭小窗口" : "save and close mini window");
  console.log("");
  renderRow(chinese ? "当前小说" : "novel", options.book.title);
  renderRow(chinese ? "当前页" : "page", `${options.pageIndex + 1} / ${options.pageTotal}`);
}

function renderBinding(bindings: [string, string], label: string) {
  renderRow(bindings.filter(Boolean).map(formatBinding).join(" / "), label);
}

function renderRow(label: string, value: string) {
  const width = 18;
  console.log(`  ${label}${" ".repeat(Math.max(1, width - getTerminalWidth(label)))}${value}`);
}

function formatBinding(binding: string) {
  return {
    "arrow-up": "↑",
    "arrow-down": "↓",
    "arrow-left": "←",
    "arrow-right": "→",
    "mouse-middle": "Middle Mouse",
    "mouse-right": "Right Mouse",
    space: "Space",
  }[binding] ?? binding.toUpperCase();
}
