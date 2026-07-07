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
  console.log("[INFO] resolving cache entries...");
  console.log("[INFO] task queue synchronized.");
  console.log("");

  words.forEach((word, index) => {
    const id = String(current + index).padStart(3, "0");

    if (displayMode === "both") {
      console.log(`const token_${id} = "${word.english}"; // ${word.chinese}`);
    }

    if (displayMode === "english") {
      console.log(`const token_${id} = "${word.english}";`);
    }

    if (displayMode === "chinese") {
      console.log(`const token_${id} = "${word.chinese}";`);
    }
  });

  console.log("");
  console.log("runtime: idle");

  if (showHelp) {
    console.log("");
    console.log("workspace:");
    console.log(`  progress  ${current} / ${total}`);
    console.log(`  mode      ${displayMode}`);
    console.log("");
    console.log("shortcuts:");
    console.log("  A      previous workspace");
    console.log("  D      next workspace");
    console.log("  Space  repeat last navigation");
    console.log("  Tab    switch display mode");
    console.log("  ?      toggle help");
    console.log("  Q      quit");
  }
}

export function renderLogQuitMessage() {
  console.clear();

  console.log("[INFO] progress saved");
  console.log("[INFO] workspace closed");
}