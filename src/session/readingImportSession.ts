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
import { clearTerminalForExit } from "../ui/terminalScreen.js";
import { parseTerminalInputs } from "./settingFormInput.js";
import { formatWarning, localize as sharedLocalize } from "./sessionText.js";

interface StartReadingImportSessionOptions {
  interfaceLanguage: InterfaceLanguage;
  onReturn: () => void;
}

const CONFLICT_CHOICES: readonly ReadingConflictChoice[] = ["replace", "keep-both", "cancel"];

interface ReadingImportState {
  interfaceLanguage: InterfaceLanguage;
  onReturnToSettings: (() => void) | undefined;
  books: ReadingBookSummary[];
  selectedIndex: number;
  isImporting: boolean;
  isConfirmingDelete: boolean;
  importPath: string;
  candidate: ReadingImportCandidate | undefined;
  conflictChoice: ReadingConflictChoice;
  message: string;
}

function createReadingImportState(options: StartReadingImportSessionOptions): ReadingImportState {
  return {
    interfaceLanguage: options.interfaceLanguage,
    onReturnToSettings: options.onReturn,
    books: listReadingBooks(),
    selectedIndex: 0,
    isImporting: false,
    isConfirmingDelete: false,
    importPath: "",
    candidate: undefined,
    conflictChoice: "replace",
    message: "",
  };
}

let state: ReadingImportState = {
  interfaceLanguage: "english",
  onReturnToSettings: undefined,
  books: [],
  selectedIndex: 0,
  isImporting: false,
  isConfirmingDelete: false,
  importPath: "",
  candidate: undefined,
  conflictChoice: "replace",
  message: "",
};

export function startReadingImportSession(options: StartReadingImportSessionOptions) {
  state = createReadingImportState(options);
  render();

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }
  process.stdin.resume();
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", handleKeyPress);
}

function handleKeyPress(key: string) {
  for (const input of parseTerminalInputs(key.toString())) {
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

  if (state.candidate) {
    if (input.toLowerCase() === "q") {
      quit();
      return false;
    }
    return handleConflictInput(input);
  }

  if (state.isConfirmingDelete) {
    if (input.toLowerCase() === "q") {
      quit();
      return false;
    }

    if (input === "\u001b") {
      state.isConfirmingDelete = false;
      state.message = localize("[INFO] deletion cancelled", "[INFO] 已取消删除");
      render();
      return true;
    }

    if (input === "y" || input === "Y") {
      deleteSelectedBook();
    }
    return true;
  }

  if (state.isImporting) {
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
    state.isImporting = false;
    state.importPath = "";
    state.message = localize("[INFO] import cancelled", "[INFO] 已取消导入");
    render();
    return true;
  }

  if (input === "\r" || input === "\n") {
    inspectAndImport();
    return true;
  }

  if (input === "\b" || input === "\u007f") {
    state.importPath = state.importPath.slice(0, -1);
    state.message = "";
    render();
    return true;
  }

  if (/^[^\u0000-\u001f\u007f]+$/.test(input)) {
    state.importPath += input;
    state.message = "";
    render();
  }

  return true;
}

function moveSelection(direction: -1 | 1) {
  const itemCount = state.books.length + 1;
  state.selectedIndex = (state.selectedIndex + direction + itemCount) % itemCount;
  state.message = "";
  render();
}

function activateSelection() {
  if (state.selectedIndex === state.books.length) {
    state.isImporting = true;
    state.importPath = "";
    state.message = "";
    render();
    return;
  }

  if (state.books[state.selectedIndex]) {
    state.isConfirmingDelete = true;
    state.message = "";
    render();
  }
}

function deleteSelectedBook() {
  const selectedBook = state.books[state.selectedIndex];
  if (!selectedBook) {
    state.isConfirmingDelete = false;
    return;
  }

  const removedIndex = state.selectedIndex;
  try {
    const removedBook = deleteReadingBook(selectedBook.id);
    deleteReadProgress(removedBook.id);
    state.books = listReadingBooks();

    if (loadReadState().activeBookId === removedBook.id) {
      const replacement = state.books[Math.min(removedIndex, Math.max(state.books.length - 1, 0))];
      saveReadState(replacement ? { activeBookId: replacement.id } : {});
    }

    state.selectedIndex = state.books.length === 0
      ? 0
      : Math.min(removedIndex, state.books.length - 1);
    state.message = localize(
      `[INFO] deleted ${removedBook.title}; reading progress was removed`,
      `[INFO] 已删除 ${removedBook.title}，阅读进度已删除`
    );
  } catch (error) {
    state.message = formatError(error);
  } finally {
    state.isConfirmingDelete = false;
    render();
  }
}

function handleConflictInput(input: string): boolean {
  if (input === "\u001b") {
    state.candidate = undefined;
    state.conflictChoice = "replace";
    state.message = "";
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
    const inspected = inspectReadingImport(state.importPath);
    if (inspected.hasConflict) {
      state.candidate = inspected;
      state.conflictChoice = "replace";
      state.message = "";
      render();
      return;
    }

    finishImport(importReadingBook(inspected));
  } catch (error) {
    state.message = formatError(error);
    render();
  }
}

function moveConflictChoice(direction: -1 | 1) {
  const currentIndex = CONFLICT_CHOICES.indexOf(state.conflictChoice);
  const nextIndex = (currentIndex + direction + CONFLICT_CHOICES.length) % CONFLICT_CHOICES.length;
  state.conflictChoice = CONFLICT_CHOICES[nextIndex] ?? "replace";
  render();
}

function confirmConflictChoice() {
  if (!state.candidate) {
    return;
  }

  if (state.conflictChoice === "cancel") {
    state.candidate = undefined;
    state.conflictChoice = "replace";
    state.message = localize("[INFO] import cancelled", "[INFO] 已取消导入");
    render();
    return;
  }

  try {
    finishImport(importReadingBook(state.candidate, state.conflictChoice));
  } catch (error) {
    state.message = formatError(error);
    state.candidate = undefined;
    render();
  }
}

function finishImport(book: ImportedReadingBook) {
  saveReadState({ activeBookId: book.id });
  state.books = listReadingBooks();
  state.selectedIndex = Math.max(0, state.books.findIndex((candidateBook) => candidateBook.id === book.id));
  state.isImporting = false;
  state.importPath = "";
  state.candidate = undefined;
  state.message = localize(`[INFO] imported ${book.title}`, `[INFO] 已导入 ${book.title}`);
  render();
}

function returnToSettings() {
  const callback = state.onReturnToSettings;
  detach();
  callback?.();
}

function detach() {
  process.stdin.off("data", handleKeyPress);
  state.onReturnToSettings = undefined;
}

function quit() {
  detach();
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }
  clearTerminalForExit();
  process.stdin.pause();
  process.exit(0);
}

function render() {
  renderReadingImport({
    interfaceLanguage: state.interfaceLanguage,
    books: state.books,
    selectedIndex: state.selectedIndex,
    isImporting: state.isImporting,
    isConfirmingDelete: state.isConfirmingDelete,
    importPath: state.importPath,
    candidate: state.candidate,
    conflictChoice: state.conflictChoice,
    message: state.message,
  });
}

function formatError(error: unknown): string {
  const value = error instanceof Error ? error.message : String(error);
  return formatWarning(state.interfaceLanguage, value);
}

function localize(english: string, chinese: string): string {
  return sharedLocalize(state.interfaceLanguage, english, chinese);
}

