export function startWordSession() {
  console.clear();

  renderWordSession();

  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding("utf8");

  process.stdin.on("data", (key) => {
    const input = key.toString().toLowerCase();

    if (input === "q" || input === "\u0003") {
      quitWordSession();
    }
  });
}

function renderWordSession() {
  console.clear();

  console.log("build: touch-fish");
  console.log("sync: vocabulary cache loaded");
  console.log("task: word session active");
  console.log("");
  console.log("const currentToken = \"abandon\";");
  console.log("const meaning = \"放弃；遗弃\";");
  console.log("");
  console.log("runtime: waiting for input...");
}

function quitWordSession() {
  console.clear();

  console.log("sync: progress saved");
  console.log("task: word session closed");

  process.stdin.setRawMode(false);
  process.stdin.pause();
  process.exit(0);
}