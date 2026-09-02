import type {
  DownloadableVocabularyBook,
  ManagedVocabularyBook,
} from "../models/vocabularyCatalog.js";
import type { InterfaceLanguage } from "../models/settings.js";
import { loadVocabularyCatalog } from "../services/vocabularyCatalog.js";
import { loadSettings, saveSettings } from "../services/settingsLoader.js";
import {
  downloadVocabularyBook,
  importVocabularyBook,
  uninstallVocabularyBook,
} from "../services/vocabularyDownload.js";
import { listVocabularyBooks } from "../services/vocabularyLoader.js";
import { renderVocabularyDownloadSession } from "../ui/vocabularyDownloadRenderer.js";
import { clearTerminalForExit } from "../ui/terminalScreen.js";
import { parseTerminalInputs } from "./settingFormInput.js";
import { formatWarning } from "./sessionText.js";

interface StartVocabularyDownloadSessionOptions {
  onReturn: () => void;
}

interface VocabularyDownloadState {
  onReturnToSettings: (() => void) | undefined;
  catalogBooks: DownloadableVocabularyBook[];
  books: ManagedVocabularyBook[];
  installedBookIds: Set<string>;
  selectedIndex: number;
  isLoading: boolean;
  isDownloading: boolean;
  isConfirmingUninstall: boolean;
  isImporting: boolean;
  importPath: string;
  message: string;
  interfaceLanguage: InterfaceLanguage;
}

function createVocabularyDownloadState(
  options: StartVocabularyDownloadSessionOptions
): VocabularyDownloadState {
  return {
    onReturnToSettings: options.onReturn,
    catalogBooks: [],
    books: [],
    installedBookIds: new Set<string>(),
    selectedIndex: 0,
    isLoading: true,
    isDownloading: false,
    isConfirmingUninstall: false,
    isImporting: false,
    importPath: "",
    message: "",
    interfaceLanguage: loadSettings().interfaceLanguage,
  };
}

let state: VocabularyDownloadState = {
  onReturnToSettings: undefined,
  catalogBooks: [],
  books: [],
  installedBookIds: new Set<string>(),
  selectedIndex: 0,
  isLoading: true,
  isDownloading: false,
  isConfirmingUninstall: false,
  isImporting: false,
  importPath: "",
  message: "",
  interfaceLanguage: "english",
};

export async function startVocabularyDownloadSession(
  options: StartVocabularyDownloadSessionOptions
) {
  state = createVocabularyDownloadState(options);
  refreshBooks();
  render();

  try {
    state.catalogBooks = await loadVocabularyCatalog();
    refreshBooks();
  } catch (error) {
    state.message = formatError(error);
  } finally {
    state.isLoading = false;
    render();
  }

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }
  process.stdin.resume();
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", handleKeyPress);
}

function handleKeyPress(key: string) {
  for (const input of parseTerminalInputs(key.toString())) {
    if (input === "\u0003") {
      quit();
      return;
    }

    if (state.isImporting) {
      handleImportInput(input);
      return;
    }

    if (input.toLowerCase() === "q") {
      quit();
      return;
    }

    if (state.isConfirmingUninstall && input === "\u001b") {
      state.isConfirmingUninstall = false;
      state.message = getSessionText().uninstallCancelled;
      render();
      return;
    }

    if (input === "\u001b") {
      returnToSettings();
      return;
    }

    if (state.isDownloading) {
      return;
    }

    if (state.isConfirmingUninstall) {
      if (input === "y" || input === "Y") {
        void uninstallSelectedBook();
      }
      return;
    }

    if (input === "w" || input === "W" || input === "\u001b[A") {
      move(-1);
      continue;
    }

    if (input === "s" || input === "S" || input === "\u001b[B") {
      move(1);
      continue;
    }

    if (input === "\r" || input === "\n") {
      void activateSelectedBook();
    }
  }
}

function move(direction: -1 | 1) {
  if (state.isConfirmingUninstall) {
    return;
  }

  const itemCount = state.books.length + 1;
  state.selectedIndex = (state.selectedIndex + direction + itemCount) % itemCount;
  state.message = "";
  render();
}

async function activateSelectedBook() {
  if (isImportSelected()) {
    state.isImporting = true;
    state.importPath = "";
    state.message = "";
    render();
    return;
  }

  const selectedBook = state.books[state.selectedIndex];

  if (!selectedBook) {
    return;
  }

  if (state.installedBookIds.has(selectedBook.id)) {
    state.isConfirmingUninstall = true;
    state.message = "";
    render();
    return;
  }

  if (selectedBook.availability === "coming-soon") {
    state.message = getSessionText().comingSoon(selectedBook.name);
    render();
    return;
  }

  state.isDownloading = true;
  state.message = "";
  render();

  try {
    await downloadVocabularyBook(selectedBook);
    refreshBooks();
    state.message = getSessionText().installed(selectedBook.name);
  } catch (error) {
    state.message = formatError(error);
  } finally {
    state.isDownloading = false;
    render();
  }
}

function handleImportInput(input: string) {
  if (input === "\u001b") {
    state.isImporting = false;
    state.importPath = "";
    state.message = getSessionText().importCancelled;
    render();
    return;
  }

  if (input === "\r" || input === "\n") {
    void importSelectedFile();
    return;
  }

  if (input === "\b" || input === "\u007f") {
    state.importPath = state.importPath.slice(0, -1);
    render();
    return;
  }

  if (/^[^\u0000-\u001f\u007f]+$/.test(input)) {
    state.importPath += input;
    render();
  }
}

async function importSelectedFile() {
  try {
    const importedBook = await importVocabularyBook(state.importPath);
    refreshBooks();
    state.selectedIndex = state.books.findIndex((book) => book.id === importedBook.id);
    state.message = getSessionText().imported(importedBook.name);
  } catch (error) {
    state.message = formatError(error);
  } finally {
    state.isImporting = false;
    state.importPath = "";
    render();
  }
}

async function uninstallSelectedBook() {
  const selectedBook = state.books[state.selectedIndex];

  if (!selectedBook || !state.installedBookIds.has(selectedBook.id)) {
    state.isConfirmingUninstall = false;
    return;
  }

  try {
    const removedBook = uninstallVocabularyBook(selectedBook.id);
    refreshBooks();
    updateActiveBookAfterUninstall(removedBook.id);
    state.message = getSessionText().uninstalled(removedBook.name);
  } catch (error) {
    state.message = formatError(error);
  } finally {
    state.isConfirmingUninstall = false;
    render();
  }
}

function refreshBooks() {
  const installedBooks = listVocabularyBooks();
  state.installedBookIds = new Set(installedBooks.map((book) => book.id));
  const catalogById = new Map(state.catalogBooks.map((book) => [book.id, book]));
  const installed = installedBooks.map((book) => {
    const catalogBook = catalogById.get(book.id);

    if (catalogBook) {
      return { ...catalogBook, source: "catalog" as const };
    }

    return {
      ...book,
      description: "A local vocabulary book imported outside the public catalog.",
      availability: "available" as const,
      source: "local" as const,
    };
  });
  const downloadable = state.catalogBooks
    .filter((book) => book.availability === "available" && !state.installedBookIds.has(book.id))
    .map((book) => ({ ...book, source: "catalog" as const }));
  const comingSoon = state.catalogBooks
    .filter((book) => book.availability === "coming-soon")
    .map((book) => ({ ...book, source: "catalog" as const }));

  state.books = [...installed, ...downloadable, ...comingSoon];
  state.selectedIndex = Math.min(state.selectedIndex, Math.max(state.books.length - 1, 0));
}

function isImportSelected(): boolean {
  return state.selectedIndex === state.books.length;
}

function updateActiveBookAfterUninstall(removedBookId: string) {
  const settings = loadSettings();

  if (settings.activeVocabularyBook !== removedBookId) {
    return;
  }

  saveSettings({
    ...settings,
    activeVocabularyBook: listVocabularyBooks()[0]?.id ?? "",
  });
}

function render() {
  renderVocabularyDownloadSession({
    books: state.books,
    installedBookIds: state.installedBookIds,
    selectedIndex: state.selectedIndex,
    isLoading: state.isLoading,
    isDownloading: state.isDownloading,
    isConfirmingUninstall: state.isConfirmingUninstall,
    isImporting: state.isImporting,
    importPath: state.importPath,
    message: state.message,
    interfaceLanguage: state.interfaceLanguage,
  });
}

function returnToSettings() {
  const onReturn = state.onReturnToSettings;
  state.onReturnToSettings = undefined;
  process.stdin.off("data", handleKeyPress);
  onReturn?.();
}

function quit() {
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }
  clearTerminalForExit();
  process.stdin.pause();
  process.exit(0);
}

function formatError(error: unknown): string {
  const errorMessage = error instanceof Error ? error.message : String(error);
  return formatWarning(state.interfaceLanguage, errorMessage);
}

function getSessionText() {
  if (state.interfaceLanguage === "chinese") {
    return {
      uninstallCancelled: "[INFO] 已取消卸载",
      comingSoon: (name: string) => `[INFO] ${name} 即将提供`,
      installed: (name: string) => `[INFO] 已安装 ${name}`,
      importCancelled: "[INFO] 已取消导入",
      imported: (name: string) => `[INFO] 已导入 ${name}`,
      uninstalled: (name: string) => `[INFO] 已卸载 ${name}，学习进度已删除`,
      sessionClosed: "[INFO] 词书管理已关闭",
    };
  }

  return {
    uninstallCancelled: "[INFO] uninstall cancelled",
    comingSoon: (name: string) => `[INFO] ${name} is coming soon`,
    installed: (name: string) => `[INFO] installed ${name}`,
    importCancelled: "[INFO] import cancelled",
    imported: (name: string) => `[INFO] imported ${name}`,
    uninstalled: (name: string) => `[INFO] uninstalled ${name}; progress was removed`,
    sessionClosed: "[INFO] vocabulary download session closed",
  };
}
