import type {
  DownloadableVocabularyBook,
  ManagedVocabularyBook,
} from "../models/vocabularyCatalog.js";
import { loadVocabularyCatalog } from "../services/vocabularyCatalog.js";
import { loadSettings, saveSettings } from "../services/settingsLoader.js";
import {
  downloadVocabularyBook,
  uninstallVocabularyBook,
} from "../services/vocabularyDownload.js";
import { listVocabularyBooks } from "../services/vocabularyLoader.js";
import { renderVocabularyDownloadSession } from "../ui/vocabularyDownloadRenderer.js";

interface StartVocabularyDownloadSessionOptions {
  onReturn: () => void;
}

let onReturnToSettings: (() => void) | undefined;
let catalogBooks: DownloadableVocabularyBook[] = [];
let books: ManagedVocabularyBook[] = [];
let installedBookIds = new Set<string>();
let selectedIndex = 0;
let isLoading = true;
let isDownloading = false;
let isConfirmingUninstall = false;
let message = "";

export async function startVocabularyDownloadSession(
  options: StartVocabularyDownloadSessionOptions
) {
  onReturnToSettings = options.onReturn;
  catalogBooks = [];
  books = [];
  refreshBooks();
  selectedIndex = 0;
  isLoading = true;
  isDownloading = false;
  isConfirmingUninstall = false;
  message = "";
  render();

  try {
    catalogBooks = await loadVocabularyCatalog();
    refreshBooks();
  } catch (error) {
    message = formatError(error);
  } finally {
    isLoading = false;
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
  for (const input of parseInputs(key.toString())) {
    if (input === "\u0003" || input.toLowerCase() === "q") {
      quit();
      return;
    }

    if (isConfirmingUninstall && input === "\u001b") {
      isConfirmingUninstall = false;
      message = "[INFO] uninstall cancelled";
      render();
      return;
    }

    if (input === "\u001b") {
      returnToSettings();
      return;
    }

    if (isDownloading) {
      return;
    }

    if (isConfirmingUninstall) {
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

function parseInputs(input: string): string[] {
  const inputs: string[] = [];
  let index = 0;

  while (index < input.length) {
    const current = input[index];
    const next = input[index + 1];
    const third = input[index + 2];

    if (current === "\r" && next === "\n") {
      inputs.push("\r");
      index += 2;
      continue;
    }

    if (current === "\u001b" && next === "[" && third) {
      inputs.push(`${current}${next}${third}`);
      index += 3;
      continue;
    }

    if (current) {
      inputs.push(current);
    }
    index += 1;
  }

  return inputs;
}

function move(direction: -1 | 1) {
  if (books.length === 0 || isConfirmingUninstall) {
    return;
  }

  selectedIndex = (selectedIndex + direction + books.length) % books.length;
  message = "";
  render();
}

async function activateSelectedBook() {
  const selectedBook = books[selectedIndex];

  if (!selectedBook) {
    return;
  }

  if (installedBookIds.has(selectedBook.id)) {
    isConfirmingUninstall = true;
    message = "";
    render();
    return;
  }

  if (selectedBook.availability === "coming-soon") {
    message = `[INFO] ${selectedBook.name} is coming soon`;
    render();
    return;
  }

  isDownloading = true;
  message = "";
  render();

  try {
    await downloadVocabularyBook(selectedBook);
    refreshBooks();
    message = `[INFO] installed ${selectedBook.name}`;
  } catch (error) {
    message = formatError(error);
  } finally {
    isDownloading = false;
    render();
  }
}

async function uninstallSelectedBook() {
  const selectedBook = books[selectedIndex];

  if (!selectedBook || !installedBookIds.has(selectedBook.id)) {
    isConfirmingUninstall = false;
    return;
  }

  try {
    const removedBook = uninstallVocabularyBook(selectedBook.id);
    refreshBooks();
    updateActiveBookAfterUninstall(removedBook.id);
    message = `[INFO] uninstalled ${removedBook.name}; progress was removed`;
  } catch (error) {
    message = formatError(error);
  } finally {
    isConfirmingUninstall = false;
    render();
  }
}

function refreshBooks() {
  const installedBooks = listVocabularyBooks();
  installedBookIds = new Set(installedBooks.map((book) => book.id));
  const catalogIds = new Set(catalogBooks.map((book) => book.id));
  const localOnlyBooks: ManagedVocabularyBook[] = installedBooks
    .filter((book) => !catalogIds.has(book.id))
    .map((book) => ({
      ...book,
      description: "A local vocabulary book imported outside the public catalog.",
      availability: "available",
      source: "local",
    }));

  books = [
    ...catalogBooks.map((book) => ({ ...book, source: "catalog" as const })),
    ...localOnlyBooks,
  ];
  selectedIndex = Math.min(selectedIndex, Math.max(books.length - 1, 0));
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
    books,
    installedBookIds,
    selectedIndex,
    isLoading,
    isDownloading,
    isConfirmingUninstall,
    message,
  });
}

function returnToSettings() {
  const onReturn = onReturnToSettings;
  onReturnToSettings = undefined;
  process.stdin.off("data", handleKeyPress);
  onReturn?.();
}

function quit() {
  console.clear();
  console.log("[INFO] vocabulary download session closed");

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }
  process.stdin.pause();
  process.exit(0);
}

function formatError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return `[WARN] ${message}`;
}
