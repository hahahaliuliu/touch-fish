import type { InterfaceLanguage } from "../models/settings.js";
import type { ReadingBookSummary } from "../models/reading.js";
import type { ReadingImportCandidate } from "../services/readingImport.js";
import { getTerminalWidth, truncateTerminalText } from "./terminalText.js";

export type ReadingConflictChoice = "replace" | "keep-both" | "cancel";

interface RenderReadingImportOptions {
  interfaceLanguage: InterfaceLanguage;
  books: ReadingBookSummary[];
  selectedIndex: number;
  isImporting: boolean;
  isConfirmingDelete: boolean;
  importPath: string;
  candidate?: ReadingImportCandidate | undefined;
  conflictChoice: ReadingConflictChoice;
  message: string;
}

const CONFLICT_CHOICES: readonly ReadingConflictChoice[] = ["replace", "keep-both", "cancel"];

export function renderReadingImport(options: RenderReadingImportOptions) {
  const text = getText(options.interfaceLanguage);

  console.clear();
  console.log(text.title);
  console.log("");
  console.log(text.ready);
  console.log("");

  if (options.candidate) {
    console.log(text.conflictTitle);
    console.log(`  ${text.file}: ${options.candidate.fileName}`);
    console.log(`  ${text.destination}: ${options.candidate.destinationPath}`);
    console.log("");
    console.log(`[${CONFLICT_CHOICES.map((choice) => formatOption(text.choices[choice], choice === options.conflictChoice)).join(" / ")}]`);
    console.log("");
    console.log(text.conflictControls);
  } else {
    console.log(text.importedBooks);
    options.books.forEach((book, index) => {
      const marker = index === options.selectedIndex ? ">" : " ";
      console.log(`${marker} ${formatColumn(book.title, 28)} ${text.characterCount(book.characterCount)}`);
    });

    if (options.books.length === 0) {
      console.log(`  ${text.noBooks}`);
    }

    console.log("");
    const importSelected = options.selectedIndex === options.books.length;
    console.log(`${importSelected ? ">" : " "} ${formatColumn(text.importAction, 28)} [${text.openImport}]`);

    if (options.isImporting) {
      console.log("");
      console.log(text.pathLabel);
      console.log(`  ${options.importPath}${blinkingCursor()}`);
    }

    console.log("");
    if (options.isConfirmingDelete) {
      const selectedBook = options.books[options.selectedIndex];
      console.log(text.deleteConfirm(selectedBook?.title ?? text.thisBook));
      console.log(text.deleteWarning);
      console.log(text.deleteControls);
    } else if (options.isImporting) {
      console.log(text.description);
      console.log(text.sourceFileNotice);
      console.log(text.validation);
      console.log("");
      console.log(text.pathControls);
    } else {
      console.log(text.manageControls);
      console.log(importSelected ? text.importHint : text.deleteHint);
    }
  }

  if (options.message) {
    console.log(options.message);
  }
}

function formatOption(value: string, selected: boolean): string {
  return selected ? `\u001b[7m${value}\u001b[0m` : value;
}

function blinkingCursor(): string {
  return "\u001b[5m_\u001b[0m";
}

function formatColumn(value: string, width: number): string {
  const truncated = truncateTerminalText(value, width);
  return `${truncated}${" ".repeat(Math.max(0, width - getTerminalWidth(truncated)))}`;
}

function getText(language: InterfaceLanguage) {
  if (language === "chinese") {
    return {
      title: "Touch Fish 小说导入",
      ready: "[INFO] 本地 TXT 小说导入已就绪",
      importedBooks: "已导入（Enter 删除）",
      noBooks: "尚未导入小说",
      importAction: "导入本地小说",
      openImport: "Enter 导入",
      pathLabel: "小说文件路径",
      description: "可输入项目内或项目外的任意本地 TXT 文件路径。",
      sourceFileNotice: "导入时会在 Touch Fish 中保存独立副本；成功后可移动或删除原文件，不影响阅读。",
      validation: "仅支持 UTF-8 编码且内容不为空的 .txt 文件，导入前会自动检查。",
      manageControls: "操作  W/S 或上下方向键移动 | Enter 选择 | Esc / Ctrl+O 返回设置 | Q 退出",
      importHint: "当前操作  Enter 开始输入小说文件路径",
      deleteHint: "当前操作  Enter 打开删除确认",
      pathControls: "操作  Enter 导入 | Backspace 删除 | Esc / Ctrl+O 返回设置 | Ctrl+C 退出",
      deleteConfirm: (title: string) => `[确认] 要删除《${title}》吗？`,
      deleteWarning: "[警告] 本地小说副本和该小说的全部阅读进度都会被删除",
      deleteControls: "[确认] 按 Y 删除，或按 Esc 取消",
      thisBook: "当前小说",
      characterCount: (count: number) => `${count} 字符 [已导入]`,
      conflictTitle: "[确认] 已存在同名小说",
      file: "文件",
      destination: "目标位置",
      choices: { replace: "替换", "keep-both": "保留两本", cancel: "取消" },
      conflictControls: "操作  A/D 切换选项 | Enter 确认 | Esc 返回路径输入",
    };
  }

  return {
    title: "Touch Fish Novel Import",
    ready: "[INFO] local TXT novel import ready",
    importedBooks: "Imported (Enter to delete)",
    noBooks: "No novels have been imported",
    importAction: "Import Local Novel",
    openImport: "Enter to import",
    pathLabel: "Novel File Path",
    description: "Enter any local TXT path, whether it is inside or outside the project.",
    sourceFileNotice: "Touch Fish saves an independent copy; after import, the original can be moved or deleted.",
    validation: "Only non-empty UTF-8 .txt files are supported and validated before import.",
    manageControls: "Controls  W/S or Up/Down move | Enter select | Esc / Ctrl+O return | Q quit",
    importHint: "Selected Action  Enter to type a novel file path",
    deleteHint: "Selected Action  Enter opens delete confirmation",
    pathControls: "Controls  Enter import | Backspace delete | Esc / Ctrl+O return | Ctrl+C quit",
    deleteConfirm: (title: string) => `[CONFIRM] Delete ${title}?`,
    deleteWarning: "[WARN] The local novel copy and all reading progress for it will be deleted",
    deleteControls: "[CONFIRM] Press Y to delete, or Esc to cancel",
    thisBook: "this novel",
    characterCount: (count: number) => `${count} characters [imported]`,
    conflictTitle: "[CONFIRM] A novel with this name already exists",
    file: "file",
    destination: "destination",
    choices: { replace: "replace", "keep-both": "keep both", cancel: "cancel" },
    conflictControls: "Controls  A/D choose | Enter confirm | Esc return to path input",
  };
}
