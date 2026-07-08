import fs from "node:fs";
import path from "node:path";
import { resolveAssetPath } from "../config/paths.js";

const progressPath = resolveAssetPath("progress", "word-progress.json");

export function loadWordProgress(): number {
  if (!fs.existsSync(progressPath)) {
    return 0;
  }

  const content = fs.readFileSync(progressPath, "utf-8");
  const data = JSON.parse(content) as { currentIndex?: number };

  return data.currentIndex ?? 0;
}

export function saveWordProgress(currentIndex: number) {
  const dir = path.dirname(progressPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(
    progressPath,
    JSON.stringify(
      {
        currentIndex,
        updatedAt: new Date().toISOString(),
      },
      null,
      2
    ),
    "utf-8"
  );
}
