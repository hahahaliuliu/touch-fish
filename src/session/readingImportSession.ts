import type { InterfaceLanguage } from "../models/settings.js";
import type { ReadingBookSummary } from "../models/reading.js";
import { deleteReadingBook, listReadingBooks } from "../services/readingLoader.js";
import {
  importReadingBook,
  inspectReadingImport,
  type ImportedReadingBook,
  type ReadingImportCandidate,
} from "../services/readingImport.js";
import { deleteReadProgress, loadReadState, saveReadState } from "../storage/readProgress.js";
import {
  renderReadingImport,
  type ReadingConflictChoice,
} from "../ui/readingImportRenderer.js";

interface StartReadingImportSessionOptions {
  interfaceLanguage: InterfaceLanguage;
  onReturn: () => void;
}

const CONFLICT_CHOICES: readonly ReadingConflictChoice[] = ["replace", "keep-both", "cancel"];
let interfaceLanguage: InterfaceLanguage = "english";
let onReturnToSettings: (() => void) | undefined;
let books: ReadingBookSummary[] = [];
let selectedIndex = 0;
let isImporting = false;
let isConfirmingDelete = false;
let importPath = "";
let candidate: ReadingImportCandidate | undefined;
let conflictChoice: ReadingConflictChoice = "replace";
let message = "";

export function startReadingImportSession(options: StartReadingImportSessionOptions) {
  interfaceLanguage = options.interfaceLanguage;
  onReturnToSettings = options.onReturn;
  books = listReadingBooks();
  selectedIndex = 0;
  isImporting = false;
  isConfirmingDelete = false;
  importPath = "";
  candidate = undefined;
  conflictChoice = "replace";
  message = "";
  render();

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

function handleInput(input: string): boolean {
  if (input === "\u0003") {
    quit();
    return false;
  }

  if (input === "\u000f") {
    returnToSettings();
    return false;
  }

  if (candidate) {
    if (input.toLowerCase() === "q") {
      quit();
      return false;
    }
    return handleConflictInput(input);
  }

  if (isConfirmingDelete) {
    if (input.toLowerCase() === "q") {
      quit();
      return false;
    }

    if (input === "\u001b") {
      isConfirmingDelete = false;
      message = localize("[INFO] deletion cancelled", "[INFO] 已取消删除");
      render();
      return true;
    }

    if (input === "y" || input === "Y") {
      deleteSelectedBook();
    }
    return true;
  }

  if (isImporting) {
    return handleImportInput(input);
  }

  if (input.toLowerCase() === "q") {
    quit();
    return false;
  }

  if (input === "\u001b") {
    returnToSettings();
    return false;
  }

  if (input === "w" || input === "W" || input === "\u001b[A") {
    moveSelection(-1);
    return true;
  }

  if (input === "s" || input === "S" || input === "\u001b[B") {
    moveSelection(1);
    return true;
  }

  if (input === "\r" || input === "\n") {
    activateSelection();
  }

  return true;
}

function handleImportInput(input: string): boolean {
  if (input === "\u001b") {
    isImporting = false;
    importPath = "";
    message = localize("[INFO] import cancelled", "[INFO] 已取消导入");
    render();
    return true;
  }

  if (input === "\r" || input === "\n") {
    inspectAndImport();
    return true;
  }

  if (input === "\b" || input === "\u007f") {
    importPath = importPath.slice(0, -1);
    message = "";
    render();
    return true;
  }

  if (/^[^\u0000-\u001f\u007f]+$/.test(input)) {
    importPath += input;
    message = "";
    render();
  }

  return true;
}

function moveSelection(direction: -1 | 1) {
  const itemCount = books.length + 1;
  selectedIndex = (selectedIndex + direction + itemCount) % itemCount;
  message = "";
  render();
}

function activateSelection() {
  if (selectedIndex === books.length) {
    isImporting = true;
    importPath = "";
    message = "";
    render();
    return;
  }

  if (books[selectedIndex]) {
    isConfirmingDelete = true;
    message = "";
    render();
  }
}

function deleteSelectedBook() {
  const selectedBook = books[selectedIndex];
  if (!selectedBook) {
    isConfirmingDelete = false;
    return;
  }

  const removedIndex = selectedIndex;
  try {
    const removedBook = deleteReadingBook(selectedBook.id);
    deleteReadProgress(removedBook.id);
    books = listReadingBooks();

    if (loadReadState().activeBookId === removedBook.id) {
      const replacement = books[Math.min(removedIndex, Math.max(books.length - 1, 0))];
      saveReadState(replacement ? { activeBookId: replacement.id } : {});
    }

    selectedIndex = books.length === 0
      ? 0
      : Math.min(removedIndex, books.length - 1);
    message = localize(
      `[INFO] deleted ${removedBook.title}; reading progress was removed`,
      `[INFO] 已删除 ${removedBook.title}，阅读进度已清除`
    );
  } catch (error) {
    message = formatError(error);
  } finally {
    isConfirmingDelete = false;
    render();
  }
}

function handleConflictInput(input: string): boolean {
  if (input === "\u001b") {
    candidate = undefined;
    conflictChoice = "replace";
    message = "";
    render();
    return true;
  }

  if (input === "a" || input === "A" || input === "\u001b[D") {
    moveConflictChoice(-1);
    return true;
  }

  if (input === "d" || input === "D" || input === "\u001b[C") {
    moveConflictChoice(1);
    return true;
  }

  if (input === "\r" || input === "\n") {
    confirmConflictChoice();
  }

  return true;
}

function inspectAndImport() {
  try {
    const inspected = inspectReadingImport(importPath);
    if (inspected.hasConflict) {
      candidate = inspected;
      conflictChoice = "replace";
      message = "";
      render();
      return;
    }

    finishImport(importReadingBook(inspected));
  } catch (error) {
    message = formatError(error);
    render();
  }
}

function moveConflictChoice(direction: -1 | 1) {
  const currentIndex = CONFLICT_CHOICES.indexOf(conflictChoice);
  const nextIndex = (currentIndex + direction + CONFLICT_CHOICES.length) % CONFLICT_CHOICES.length;
  conflictChoice = CONFLICT_CHOICES[nextIndex] ?? "replace";
  render();
}

function confirmConflictChoice() {
  if (!candidate) {
    return;
  }

  if (conflictChoice === "cancel") {
    candidate = undefined;
    conflictChoice = "replace";
    message = localize("[INFO] import cancelled", "[INFO] 已取消导入");
    render();
    return;
  }

  try {
    finishImport(importReadingBook(candidate, conflictChoice));
  } catch (error) {
    message = formatError(error);
    candidate = undefined;
    render();
  }
}

function finishImport(book: ImportedReadingBook) {
  saveReadState({ activeBookId: book.id });
  books = listReadingBooks();
  selectedIndex = Math.max(0, books.findIndex((candidateBook) => candidateBook.id === book.id));
  isImporting = false;
  importPath = "";
  candidate = undefined;
  message = localize(`[INFO] imported ${book.title}`, `[INFO] 已导入 ${book.title}`);
  render();
}

function returnToSettings() {
  const callback = onReturnToSettings;
  detach();
  callback?.();
}

function detach() {
  process.stdin.off("data", handleKeyPress);
  onReturnToSettings = undefined;
}

function quit() {
  detach();
  console.clear();
  console.log(localize("[INFO] novel import closed", "[INFO] 小说导入已关闭"));

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }
  process.stdin.pause();
  process.exit(0);
}

function render() {
  renderReadingImport({
    interfaceLanguage,
    books,
    selectedIndex,
    isImporting,
    isConfirmingDelete,
    importPath,
    candidate,
    conflictChoice,
    message,
  });
}

function formatError(error: unknown): string {
  const value = error instanceof Error ? error.message : String(error);
  return `${localize("[WARN] ", "[警告] ")}${value}`;
}

function localize(english: string, chinese: string): string {
  return interfaceLanguage === "chinese" ? chinese : english;
}

function parseInputs(input: string): string[] {
  const values: string[] = [];
  let index = 0;

  while (index < input.length) {
    if (input[index] === "\u001b" && input[index + 1] === "[" && input[index + 2]) {
      values.push(input.slice(index, index + 3));
      index += 3;
    } else if (input[index] === "\r" && input[index + 1] === "\n") {
      values.push("\r");
      index += 2;
    } else {
      values.push(input[index]!);
      index += 1;
    }
  }

  return values;
}
