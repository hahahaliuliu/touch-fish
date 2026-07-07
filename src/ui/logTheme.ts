import type { Word } from "../models/word.js";
import type { DisplayMode } from "./wordRenderer.js";

interface RenderLogThemeOptions {
  words: Word[];
  current: number;
  total: number;
  displayMode: DisplayMode;
  showHelp: boolean;
}

export function renderLogTheme(options: RenderLogThemeOptions) {
  const { words, current, total, displayMode, showHelp } = options;

  console.clear();

  console.log("[INFO] compiling workspace...");
  console.log("[INFO] resolving dependency graph...");
  console.log("[INFO] loading cached transform results...");
  console.log(`[INFO] modules transformed: ${words.length + 37}`);
  console.log("[INFO] generating optimized chunks...");
  console.log("");
  console.log("assets by status  cached modules");
  console.log("  runtime modules 698 bytes 4 modules");
  console.log("  modules by path ./src/cache/ 1.24 KiB");

  words.forEach((word, index) => {
    const id = String(current + index).padStart(3, "0");
    const token = `token_${id}`;
    const value = `"${getDisplayValue(word, displayMode)}"`;

    console.log(formatModuleLine(id, token, value, word, displayMode));
  });

  console.log("");
  console.log("[INFO] emitted 3 cache entries");
  console.log("[INFO] build completed successfully in 42ms");
  console.log("[INFO] watching for file changes...");
  console.log("runtime: idle");
  console.log(">");

  if (showHelp) {
    console.log("");
    console.log("[DEBUG] workspace metadata");
    console.log(`  cursor    ${current} / ${total}`);
    console.log(`  mode      ${displayMode}`);
    console.log("");
    console.log("[DEBUG] key bindings");
    console.log("  A      previous workspace");
    console.log("  D      next workspace");
    console.log("  Space  repeat last navigation");
    console.log("  Tab    switch display mode");
    console.log("  ?      toggle metadata");
    console.log("  Q      quit");
  }
}

function getDisplayValue(word: Word, displayMode: DisplayMode): string {
  if (displayMode === "chinese") {
    return word.chinese;
  }

  return word.english;
}

function formatModuleLine(
  id: string,
  token: string,
  value: string,
  word: Word,
  displayMode: DisplayMode
): string {
  const modulePath = `  cache/${id}.ts`;
  const moduleSize = `${640 + Number(id)} bytes`;
  const cacheValue = value.padEnd(13, " ");

  if (displayMode === "both") {
    return `${modulePath.padEnd(16, " ")} ${cacheValue} // ${word.chinese}`;
  }

  return `${modulePath.padEnd(16, " ")} ${cacheValue} [built] ${moduleSize}`;
}

export function renderLogQuitMessage() {
  console.clear();

  console.log("[INFO] progress saved");
  console.log("[INFO] workspace closed");
}
