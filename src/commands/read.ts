import { loadReadingBook, listReadingBooks } from "../services/readingLoader.js";
import { loadReadState, saveReadState } from "../storage/readProgress.js";

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

  console.log(`[INFO] loaded novel: ${book.title}`);
  console.log(`[INFO] ${book.characterCount} characters and ${book.chapters.length} chapters ready for pagination`);
}

export function startReadSettingsCommand() {
  console.log("[INFO] Read settings are planned for v0.4.");
}
