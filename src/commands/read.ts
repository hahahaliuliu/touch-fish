import { loadReadingBook, listReadingBooks } from "../services/readingLoader.js";
import { loadReadState, saveReadState } from "../storage/readProgress.js";
import { startReadSession } from "../session/readSession.js";
import { startReadSettingSession } from "../session/readSettingSession.js";
import { startReadMiniHostSession } from "../session/readMiniHostSession.js";
import { startReadMiniChildSession } from "../session/readMiniSession.js";
import type { ReadMiniChildCommandOptions } from "../cli.js";

export function startReadCommand() {
  const book = getActiveReadingBook();
  if (!book) {
    return;
  }
  startReadSession(book);
}

export function startReadSettingsCommand() {
  startReadSettingSession({
    onOpenMiniMode: (bookId) => startReadMiniHostSession(loadReadingBook(bookId), true),
  });
}

export function startReadMiniCommand() {
  const book = getActiveReadingBook();
  if (!book) {
    return;
  }
  startReadMiniHostSession(book, true);
}

export function startReadMiniChildCommand(options: ReadMiniChildCommandOptions) {
  startReadMiniChildSession(loadReadingBook(options.bookId), options);
}

function getActiveReadingBook() {
  const books = listReadingBooks();

  if (books.length === 0) {
    console.log("[INFO] no local TXT novel found in assets/reading");
    console.log("[INFO] add a UTF-8 .txt file there to start Read development");
    return undefined;
  }

  const state = loadReadState();
  const book = loadReadingBook(state.activeBookId);
  saveReadState({ activeBookId: book.id });
  return book;
}
