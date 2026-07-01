type DisplayMode = "both" | "english" | "chinese";
type LastNavigation = "next" | "previous";

const words = [
  { english: "abandon", chinese: "放弃；遗弃" },
  { english: "benefit", chinese: "好处；利益" },
  { english: "complex", chinese: "复杂的" },
];

let currentIndex = 0;
let displayMode: DisplayMode = "both";
let lastNavigation: LastNavigation = "next";
let showHelp = false;

export function startWordSession() {
  renderWordSession();

  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding("utf8");

  process.stdin.on("data", handleKeyPress);
}

function handleKeyPress(key: string) {
  const input = key.toString();

  if (input === "\u0003") {
    quitWordSession();
  }

  if (input.toLowerCase() === "q") {
    quitWordSession();
  }

  if (input.toLowerCase() === "a") {
    previousWord();
  }

  if (input.toLowerCase() === "d") {
    nextWord();
  }

  if (input === " ") {
    repeatLastNavigation();
  }

  if (input === "\t") {
    switchDisplayMode();
  }

  if (input === "?") {
    showHelp = !showHelp;
    renderWordSession();
  }
}

function nextWord() {
  currentIndex = (currentIndex + 1) % words.length;
  lastNavigation = "next";
  renderWordSession();
}

function previousWord() {
  currentIndex = (currentIndex - 1 + words.length) % words.length;
  lastNavigation = "previous";
  renderWordSession();
}

function repeatLastNavigation() {
  if (lastNavigation === "next") {
    nextWord();
  } else {
    previousWord();
  }
}

function switchDisplayMode() {
  if (displayMode === "both") {
    displayMode = "english";
  } else if (displayMode === "english") {
    displayMode = "chinese";
  } else {
    displayMode = "both";
  }

  renderWordSession();
}

function renderWordSession() {
  console.clear();

  const currentWord = words[currentIndex];

  console.log("build: touch-fish");
  console.log("sync: vocabulary cache loaded");
  console.log("task: word session active");
  console.log("");

  console.log(`sync:vocab:${String(currentIndex + 1).padStart(3, "0")} / ${words.length}`);
  console.log("");

  if (displayMode === "both") {
    console.log(`const token = "${currentWord.english}";`);
    console.log(`const meaning = "${currentWord.chinese}";`);
  }

  if (displayMode === "english") {
    console.log(`const token = "${currentWord.english}";`);
  }

  if (displayMode === "chinese") {
    console.log(`const meaning = "${currentWord.chinese}";`);
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

function quitWordSession() {
  console.clear();

  console.log("sync: progress saved");
  console.log("task: word session closed");

  process.stdin.setRawMode(false);
  process.stdin.pause();
  process.exit(0);
}