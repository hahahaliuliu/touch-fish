import type { Word } from "../models/word.js";
import type { DisplayMode } from "../models/settings.js";
import type { RenderWordSessionOptions } from "./wordRenderer.js";

export function renderGitTheme(options: RenderWordSessionOptions) {
  console.clear();

  console.log("On branch feature/workspace-index");
  console.log("Your branch is ahead of 'origin/main' by 2 commits.");
  console.log("  (use \"git push\" to publish your local commits)");
  console.log("");
  console.log("Changes to be committed:");
  console.log("  (use \"git restore --staged <file>...\" to unstage)");

  options.words.forEach((word, index) => {
    const id = String(options.current + index).padStart(3, "0");
    console.log(`        modified:   src/workspace/tokens/${id}-${toFileNameSegment(word.english)}.ts`);
  });

  console.log("");
  console.log("diff --git a/src/workspace/token-index.ts b/src/workspace/token-index.ts");
  console.log("index 2c0b11a..6f4d982 100644");
  console.log("--- a/src/workspace/token-index.ts");
  console.log("+++ b/src/workspace/token-index.ts");
  console.log("@@ -18,6 +18,6 @@ export const workspaceTokens = [");

  options.words.forEach((word, index) => {
    const id = String(options.current + index).padStart(3, "0");
    console.log(formatDiffLine(id, word, options.displayMode));
  });

  console.log(" ];");
  console.log("");
  console.log("nothing to commit, working tree clean");
  console.log("workspace@local:~$");
}

function formatDiffLine(id: string, word: Word, displayMode: DisplayMode): string {
  const identifier = `token_${id}`;

  if (displayMode === "chinese") {
    return `+  export const ${identifier} = \"${word.chinese}\";`;
  }

  if (displayMode === "both") {
    return `+  export const ${identifier} = \"${word.english}\"; // ${word.chinese}`;
  }

  return `+  export const ${identifier} = \"${word.english}\";`;
}

function toFileNameSegment(word: string): string {
  return word
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "entry";
}

export function renderGitQuitMessage() {
  console.clear();
  console.log("[main 8f42c1a] chore: save workspace checkpoint");
  console.log(" 1 file changed, 1 insertion(+)");
}
