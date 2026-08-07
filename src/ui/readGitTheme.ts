import type { RenderReadSessionOptions } from "./readRenderer.js";
import { getTerminalColumns, truncateTerminalText } from "./terminalText.js";

export function renderGitReadSession(options: RenderReadSessionOptions) {
  const { book, page, pageIndex, pageTotal, chapterIndex } = options;
  const chapter = book.chapters[chapterIndex] ?? book.chapters[0]!;

  console.clear();
  console.log("On branch feature/reading-workspace");
  console.log("Your branch is up to date with 'origin/feature/reading-workspace'.");
  console.log("");
  console.log("Changes to be committed:");
  console.log("  (use \"git restore --staged <file>...\" to unstage)");
  console.log("");
  console.log(`        modified:   assets/reading/${book.id}.txt`);
  console.log("");
  console.log(`diff --git a/assets/reading/${book.id}.txt b/assets/reading/${book.id}.txt`);
  console.log("index 2c0b11a..6f4d982 100644");
  console.log(`--- a/assets/reading/${book.id}.txt`);
  console.log(`+++ b/assets/reading/${book.id}.txt`);
  console.log(`@@ page ${pageIndex + 1}/${pageTotal}, chapter ${chapterIndex + 1}/${book.chapters.length}: ${chapter.title} @@`);

  page.lines.forEach((line) => {
    console.log(truncateTerminalText(`+  src/reading/page-${String(pageIndex + 1).padStart(3, "0")}.txt: ${line}`, getTerminalColumns()));

    if (line === chapter.title) {
      console.log("");
    }
  });

  console.log("");
  console.log(`# saved offset: ${page.startOffset}`);
  console.log("nothing to commit, working tree clean");
  console.log("workspace@local:~$");
}

export function renderGitReadQuitMessage() {
  console.clear();
  console.log("[feature/reading-workspace 8f42c1a] chore: save reading checkpoint");
  console.log(" 1 file changed, 1 insertion(+)");
}
