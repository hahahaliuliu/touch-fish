import type { ReadingBook, ReadingPage, ReadKeyBindings } from "../models/reading.js";
import type { InterfaceLanguage } from "../models/settings.js";
import { getTerminalColumns, getTerminalWidth } from "./terminalText.js";

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
  showHelp: boolean;
}

export function getReadMiniContentWidth(contentWidth: number) {
  const availableWidth = Math.max(20, getTerminalColumns() - 4);
  return contentWidth >= 20 ? Math.min(contentWidth, availableWidth) : availableWidth;
}

export function renderReadMiniSession(options: RenderReadMiniSessionOptions) {
  console.clear();
  if (options.showHelp) {
    renderHelp(options);
    return;
  }

  const chapter = options.book.chapters[options.chapterIndex] ?? options.book.chapters[0];
  console.log(options.book.title);
  console.log(chapter?.title ?? "");
  console.log("");
  options.page.lines.forEach((line) => console.log(line));
  console.log("");

  const section = options.sectionNavigationEnabled
    ? ` | ${options.sectionIndex ?? 1}/${options.sectionTotal ?? 1}`
    : "";
  console.log(`${options.pageIndex + 1}/${options.pageTotal}${section}`);
  console.log(">");
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
    space: "Space",
  }[binding] ?? binding.toUpperCase();
}
