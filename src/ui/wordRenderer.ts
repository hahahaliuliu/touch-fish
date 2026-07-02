import type { Word } from "../models/word.js";

export type DisplayMode = "both" | "english" | "chinese";

interface RenderWordSessionOptions {
  words: Word[];
  current: number;
  total: number;
  displayMode: DisplayMode;
  showHelp: boolean;
}

export function renderWordSession(options: RenderWordSessionOptions) {
 const { words, current, total, displayMode, showHelp } = options;

  console.clear();

  console.log("build: touch-fish");
  console.log("sync: vocabulary cache loaded");
  console.log("task: word session active");
  console.log("");

  console.log(`sync:vocab:${String(current).padStart(3, "0")} / ${total}`);
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
  console.log("runtime: waiting for input...");

  if (showHelp) {
    console.log("");
    console.log("help:");
    console.log("  A      previous word");
    console.log("  D      next word");
    console.log("  Space  repeat last navigation");
    console.log("  Tab    switch display mode");
    console.log("  ?      toggle help");
    console.log("  Q      quit");
  }
}

export function renderQuitMessage() {
  console.clear();

  console.log("sync: progress saved");
  console.log("task: word session closed");
}