import fs from "node:fs";
import path from "node:path";
import { resolveAssetPath } from "../config/paths.js";

interface NoteEntry {
  english: string;
  note: string;
}

interface NoteFile {
  version: 1;
  notes: Record<string, NoteEntry>;
}

const notesDirectory = resolveAssetPath("notes");

export function loadWordNotes(bookId: string, words: readonly { english: string }[]): Map<number, string> {
  const noteFile = readNoteFile(bookId);
  const notes = new Map<number, string>();

  Object.entries(noteFile.notes).forEach(([indexText, entry]) => {
    const index = Number(indexText);

    if (!Number.isInteger(index) || index < 0 || words[index]?.english !== entry.english) {
      return;
    }

    notes.set(index, entry.note);
  });

  return notes;
}

export function saveWordNote(bookId: string, wordIndex: number, english: string, note: string) {
  const noteFile = readNoteFile(bookId);
  const key = String(wordIndex);
  const trimmedNote = note.trim();

  if (trimmedNote) {
    noteFile.notes[key] = { english, note: trimmedNote };
  } else {
    delete noteFile.notes[key];
  }

  writeNoteFile(bookId, noteFile);
}

function readNoteFile(bookId: string): NoteFile {
  const notePath = getNotePath(bookId);

  if (!fs.existsSync(notePath)) {
    return { version: 1, notes: {} };
  }

  try {
    return parseNoteFile(JSON.parse(fs.readFileSync(notePath, "utf-8")) as unknown);
  } catch {
    return { version: 1, notes: {} };
  }
}

function writeNoteFile(bookId: string, noteFile: NoteFile) {
  const notePath = getNotePath(bookId);
  const directory = path.dirname(notePath);
  const temporaryPath = `${notePath}.tmp`;

  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }

  try {
    fs.writeFileSync(temporaryPath, `${JSON.stringify(noteFile, null, 2)}\n`, "utf-8");
    fs.renameSync(temporaryPath, notePath);
  } finally {
    if (fs.existsSync(temporaryPath)) {
      fs.unlinkSync(temporaryPath);
    }
  }
}

function getNotePath(bookId: string): string {
  return path.join(notesDirectory, `${encodeURIComponent(bookId)}.json`);
}

function parseNoteFile(value: unknown): NoteFile {
  if (!isRecord(value) || value.version !== 1 || !isRecord(value.notes)) {
    return { version: 1, notes: {} };
  }

  const notes: Record<string, NoteEntry> = {};

  Object.entries(value.notes).forEach(([index, entry]) => {
    if (isRecord(entry) && typeof entry.english === "string" && typeof entry.note === "string") {
      notes[index] = { english: entry.english, note: entry.note };
    }
  });

  return { version: 1, notes };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
