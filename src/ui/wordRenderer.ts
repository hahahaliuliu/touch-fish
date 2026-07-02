import type { Word } from "../models/word.js";

export type DisplayMode = "both" | "english" | "chinese";

interface RenderWordSessionOptions {
  word: Word;
  current: number;
  total: number;
  displayMode: DisplayMode;
  showHelp: boolean;
}

export function renderWordSession(options: RenderWordSessionOptions) {
  const { word, current, total, displayMode, showHelp } = options;

  console.clear();

  console.log("build: touch-fish");
  console.log("sync: vocabulary cache loaded");
  console.log("task: word session active");
  console.log("");

  console.log(`sync:vocab:${String(current).padStart(3, "0")} / ${total}`);
  console.log("");

  if (displayMode === "both") {
    console.log(`const token = "${word.english}";`);
    console.log(`const meaning = "${word.chinese}";`);
  }

  if (displayMode === "english") {
    console.log(`const token = "${word.english}";`);
  }

  if (displayMode === "chinese") {
    console.log(`const meaning = "${word.chinese}";`);
  }

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