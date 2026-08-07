import { loadReadingBook, listReadingBooks } from "../services/readingLoader.js";
import { loadReadState, saveReadState } from "../storage/readProgress.js";
import { startReadSession } from "../session/readSession.js";
import { startReadSettingSession } from "../session/readSettingSession.js";

export function startReadCommand() {
  const books = listReadingBooks();

  if (books.length === 0) {
    console.log("[INFO] no local TXT novel found in assets/reading");
    console.log("[INFO] add a UTF-8 .txt file there to start Read development");
    return;
  }

  const state = loadReadState();
  const book = loadReadingBook(state.activeBookId);
  saveReadState({ activeBookId: book.id });
  startReadSession(book);
}

export function startReadSettingsCommand() {
  startReadSettingSession();
}
