import type { Word } from "../models/word.js";
import type { DisplayMode } from "../models/settings.js";

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

  if (showHelp) {
    renderLogHelp({
      current,
      total,
      windowSize: words.length,
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
}

function renderLogHelp(options: RenderLogHelpOptions) {
  const { current, total, windowSize } = options;

  console.log("[DEBUG] runtime diagnostics");
  console.log("[DEBUG] watcher state: paused");
  console.log("[DEBUG] input source: stdin/raw");
  console.log("");
  console.log("cache cursor");
  console.log(`  offset          ${current} / ${total}`);
  console.log(`  entries         ${windowSize}`);
  console.log("");
  console.log("active handles");
  console.log("  fs.watch        ./src/cache");
  console.log("  debounce        32ms");
  console.log("  renderer        log-theme");
  console.log("");
  console.log("stdin bindings");
  console.log("  a      seek:-1");
  console.log("  d      seek:+1");
  console.log("  space  repeat");
  console.log("  tab    rotate:output");
  console.log("  ?      debug:toggle");
  console.log("  q      process:exit");
  console.log("");
  console.log("cache policy");
  console.log("  mode            incremental");
  console.log("  invalidation    manual");
  console.log("  pending tasks    0");
  console.log("");
  console.log("[DEBUG] press ? to resume watcher");
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
