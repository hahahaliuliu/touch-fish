import fs from "node:fs";
import path from "node:path";

/**
 * Read a JSON file and parse its content.
 *
 * Returns undefined when the file is missing or its content is not valid JSON
 * so callers can fall back to safe defaults.
 */
export function readJsonFile(filePath: string): unknown {
  if (!fs.existsSync(filePath)) {
    return undefined;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as unknown;
  } catch {
    return undefined;
  }
}

/**
 * Write a JSON file atomically: write to a temporary file first, then rename
 * it over the destination. The temporary file is cleaned up on failure so a
 * partially written file never replaces valid data.
 */
export function writeJsonFile(filePath: string, data: unknown): void {
  const directory = path.dirname(filePath);

  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }

  const temporaryPath = `${filePath}.tmp`;

  try {
    fs.writeFileSync(
      temporaryPath,
      `${JSON.stringify(data, null, 2)}\n`,
      "utf-8"
    );
    fs.renameSync(temporaryPath, filePath);
  } finally {
    if (fs.existsSync(temporaryPath)) {
      fs.unlinkSync(temporaryPath);
    }
  }
}

/**
 * Build the JSON file path for a book or list identified by id. Book ids are
 * URL-encoded so they are safe to use as file names on every platform.
 */
export function resolveBookJsonPath(directory: string, bookId: string): string {
  return path.join(directory, `${encodeURIComponent(bookId)}.json`);
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
