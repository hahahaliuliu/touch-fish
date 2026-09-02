import type { Word } from "../models/word.js";
import { loadWordNotes, saveWordNote } from "../storage/notes.js";
import { isFavorite, loadFavorites, toggleFavorite } from "../storage/favorites.js";
import { listVocabularyBooks, loadVocabularyBook } from "./vocabularyLoader.js";

export interface FavoriteEntry {
  word: Word;
  bookId: string;
  wordIndex: number;
}

export function loadFavoriteEntries(): FavoriteEntry[] {
  const favoriteWords = loadFavorites();
  const entries: FavoriteEntry[] = [];
  const seen = new Set<string>();

  listVocabularyBooks().forEach((summary) => {
    const book = loadVocabularyBook(summary.id);
    const notes = loadWordNotes(book.id, book.words);

    book.words.forEach((word, wordIndex) => {
      if (!favoriteWords.has(word.english) || seen.has(word.english)) {
        return;
      }

      seen.add(word.english);
      const note = notes.get(wordIndex);
      entries.push({
        word: { ...(note === undefined ? word : { ...word, note }), favorite: true },
        bookId: book.id,
        wordIndex,
      });
    });
  });

  return entries;
}

export function getFavoriteWords(): Word[] {
  return loadFavoriteEntries().map((entry) => entry.word);
}

export function toggleFavoriteWord(word: Word): boolean {
  return toggleFavorite(word.english);
}

export function isWordFavorite(word: Word): boolean {
  return isFavorite(word.english);
}

export function saveFavoriteWordNote(word: Word, note: string): Word | undefined {
  const entry = findWordEntry(word.english);

  if (!entry) {
    return undefined;
  }

  saveWordNote(entry.bookId, entry.wordIndex, entry.word.english, note);
  return note.trim()
    ? { ...entry.word, note: note.trim(), favorite: true }
    : (() => {
        const { note: _note, ...wordWithoutNote } = entry.word;
        return { ...wordWithoutNote, favorite: true };
      })();
}

function findWordEntry(english: string): FavoriteEntry | undefined {
  for (const summary of listVocabularyBooks()) {
    const book = loadVocabularyBook(summary.id);
    const wordIndex = book.words.findIndex((candidate) => candidate.english === english);

    if (wordIndex >= 0) {
      const notes = loadWordNotes(book.id, book.words);
      const word = book.words[wordIndex]!;
      const note = notes.get(wordIndex);
      return {
        word: { ...(note === undefined ? word : { ...word, note }), favorite: true },
        bookId: book.id,
        wordIndex,
      };
    }
  }

  return undefined;
}
