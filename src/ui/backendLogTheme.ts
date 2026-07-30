import type { Word } from "../models/word.js";
import type { DisplayMode, NoteMode } from "../models/settings.js";
import type { RenderWordSessionOptions } from "./wordRenderer.js";

export function renderBackendLogTheme(options: RenderWordSessionOptions) {
  const timestamp = new Date().toISOString();

  console.clear();

  console.log(`${timestamp} INFO  cache-worker booting service=vocabulary-index`);
  console.log(`${timestamp} INFO  config loaded source=local-store`);
  console.log(`${timestamp} DEBUG cache pool connected name=workspace-cache`);
  console.log("");

  options.words.forEach((word, index) => {
    const id = String(options.current + index).padStart(3, "0");
    console.log(
      formatCacheEntry(
        timestamp,
        id,
        word,
        options.displayMode,
        options.noteMode,
        options.noteSelectionIndex === index
      )
    );
  });

  console.log("");
  console.log(`${timestamp} INFO  cache-worker sync complete status=ready`);
  console.log(`${timestamp} INFO  http server listening addr=127.0.0.1:4310`);
  console.log("service: ready");
  console.log(">");
}

function formatCacheEntry(
  timestamp: string,
  id: string,
  word: Word,
  displayMode: DisplayMode,
  noteMode: NoteMode,
  isSelected: boolean
): string {
  const key = `vocabulary.token.${id}`;
  const value = JSON.stringify(getDisplayValue(word, displayMode));

  const prefix = isSelected ? "> " : "";
  const note = noteMode === "hidden" || !word.note ? "" : ` memo=${JSON.stringify(word.note)}`;

  if (displayMode === "both") {
    return `${prefix}${timestamp} DEBUG cache hit key=${key} value=${value} note=${JSON.stringify(word.chinese)}${note}`;
  }

  return `${prefix}${timestamp} DEBUG cache hit key=${key} value=${value} ttl=300s${note}`;
}

function getDisplayValue(word: Word, displayMode: DisplayMode): string {
  return displayMode === "chinese" ? word.chinese : word.english;
}

export function renderBackendLogQuitMessage() {
  const timestamp = new Date().toISOString();

  console.clear();
  console.log(`${timestamp} INFO  progress checkpoint saved`);
  console.log(`${timestamp} INFO  cache-worker shutdown complete`);
}
