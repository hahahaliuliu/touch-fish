import type { DownloadableVocabularyBook } from "../models/vocabularyCatalog.js";
import { loadVocabularyCatalog } from "../services/vocabularyCatalog.js";
import { downloadVocabularyBook } from "../services/vocabularyDownload.js";
import { listVocabularyBooks } from "../services/vocabularyLoader.js";
import { renderVocabularyDownloadSession } from "../ui/vocabularyDownloadRenderer.js";

interface StartVocabularyDownloadSessionOptions {
  onReturn: () => void;
}

let onReturnToSettings: (() => void) | undefined;
let books: DownloadableVocabularyBook[] = [];
let installedBookIds = new Set<string>();
let selectedIndex = 0;
let isLoading = true;
let isDownloading = false;
let message = "";

export async function startVocabularyDownloadSession(
  options: StartVocabularyDownloadSessionOptions
) {
  onReturnToSettings = options.onReturn;
  books = [];
  installedBookIds = new Set(listVocabularyBooks().map((book) => book.id));
  selectedIndex = 0;
  isLoading = true;
  isDownloading = false;
  message = "";
  render();

  try {
    books = await loadVocabularyCatalog();
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

    if (input === "\u001b") {
      returnToSettings();
      return;
    }

    if (isDownloading) {
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
      void downloadSelectedBook();
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
  if (books.length === 0) {
    return;
  }

  selectedIndex = (selectedIndex + direction + books.length) % books.length;
  message = "";
  render();
}

async function downloadSelectedBook() {
  const selectedBook = books[selectedIndex];

  if (!selectedBook) {
    return;
  }

  if (selectedBook.availability === "coming-soon") {
    message = `[INFO] ${selectedBook.name} is coming soon`;
    render();
    return;
  }

  if (installedBookIds.has(selectedBook.id)) {
    message = `[INFO] ${selectedBook.name} is already installed`;
    render();
    return;
  }

  isDownloading = true;
  message = "";
  render();

  try {
    await downloadVocabularyBook(selectedBook);
    installedBookIds.add(selectedBook.id);
    message = `[INFO] installed ${selectedBook.name}`;
  } catch (error) {
    message = formatError(error);
  } finally {
    isDownloading = false;
    render();
  }
}

function render() {
  renderVocabularyDownloadSession({
    books,
    installedBookIds,
    selectedIndex,
    isLoading,
    isDownloading,
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
