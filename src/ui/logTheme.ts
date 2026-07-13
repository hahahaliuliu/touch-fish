import type { Word } from "../models/word.js";
import type { DisplayMode } from "../models/settings.js";

interface RenderLogThemeOptions {
  words: Word[];
  current: number;
  total: number;
  workspaceSize: number;
  studyGroupStart: number;
  studyGroupEnd: number;
  studyGroupCurrent: number;
  studyGroupTotal: number;
  studyGroupEnabled: boolean;
  navigationLoop: boolean;
  displayMode: DisplayMode;
  showHelp: boolean;
}

export function renderLogTheme(options: RenderLogThemeOptions) {
  const {
    words,
    current,
    total,
    workspaceSize,
    studyGroupStart,
    studyGroupEnd,
    studyGroupCurrent,
    studyGroupTotal,
    studyGroupEnabled,
    navigationLoop,
    displayMode,
    showHelp,
  } = options;

  console.clear();

  if (showHelp) {
    renderLogHelp({
      current,
      total,
      windowSize: words.length,
      workspaceSize,
      studyGroupStart,
      studyGroupEnd,
      studyGroupCurrent,
      studyGroupTotal,
      studyGroupEnabled,
      navigationLoop,
    });
    return;
  }

  console.log("[INFO] compiling workspace...");
  console.log("[INFO] resolving dependency graph...");
  console.log("[INFO] loading cached transform results...");
  console.log(`[INFO] modules transformed: ${words.length + 37}`);
  console.log("[INFO] generating optimized chunks...");
  console.log("[INFO] sealing asset pipeline...");
  console.log("");
  console.log("assets by status  cached modules");
  console.log("  runtime modules 698 bytes 4 modules");
  console.log("  modules by path ./src/cache/ 1.24 KiB");
  console.log("  modules by path ./node_modules/ 8.15 KiB");
  console.log("    ./node_modules/commander/index.js 2.91 KiB [built]");
  console.log("    ./node_modules/tsx/dist/cli.mjs 1.42 KiB [built]");
  console.log("    + 2 modules");
  console.log("");
  console.log("cache entries by path ./src/cache/");

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
}

interface RenderLogHelpOptions {
  current: number;
  total: number;
  windowSize: number;
  workspaceSize: number;
  studyGroupStart: number;
  studyGroupEnd: number;
  studyGroupCurrent: number;
  studyGroupTotal: number;
  studyGroupEnabled: boolean;
  navigationLoop: boolean;
}

function renderLogHelp(options: RenderLogHelpOptions) {
  const {
    current,
    total,
    windowSize,
    workspaceSize,
    studyGroupStart,
    studyGroupEnd,
    studyGroupCurrent,
    studyGroupTotal,
    studyGroupEnabled,
    navigationLoop,
  } = options;

  console.log("Touch Fish Help");
  console.log("");
  console.log("Navigation");
  console.log("  A / Left Arrow       previous page");
  console.log("  D / Right Arrow      next page");
  console.log("  [ / Up Arrow         previous group");
  console.log("  ] / Down Arrow       next group");
  console.log("  Space                repeat last page navigation");
  console.log("");
  console.log("Display");
  console.log("  Tab                  switch display mode");
  console.log("  Ctrl+O               open settings");
  console.log("  ?                    close help");
  console.log("  Q                    quit");
  console.log("");
  console.log("Current Workspace");
  console.log(`  position             ${current} / ${total}`);
  console.log(`  page size            ${workspaceSize}`);
  console.log(`  visible entries      ${windowSize}`);
  console.log(`  grouping             ${studyGroupEnabled ? "enabled" : "disabled"}`);
  console.log(`  group                ${studyGroupCurrent} / ${studyGroupTotal}`);
  console.log(`  group range          ${studyGroupStart}-${studyGroupEnd}`);
  console.log(`  navigation loop      ${navigationLoop ? "enabled" : "disabled"}`);
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
