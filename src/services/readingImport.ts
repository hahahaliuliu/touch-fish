import fs from "node:fs";
import path from "node:path";
import { resolveAssetPath } from "../config/paths.js";
import { normalizeReadingText } from "./readingLoader.js";

export interface ReadingImportCandidate {
  sourcePath: string;
  destinationPath: string;
  fileName: string;
  bookId: string;
  title: string;
  content: string;
  hasConflict: boolean;
}

export interface ImportedReadingBook {
  id: string;
  title: string;
  fileName: string;
  destinationPath: string;
}

export type ReadingImportConflictResolution = "replace" | "keep-both";

export function inspectReadingImport(sourcePath: string): ReadingImportCandidate {
  const normalizedPath = path.resolve(sourcePath.trim().replace(/^"|"$/g, ""));

  if (!sourcePath.trim()) {
    throw new Error("Enter the full path to a UTF-8 TXT novel");
  }

  if (!fs.existsSync(normalizedPath)) {
    throw new Error(`Novel file not found: ${normalizedPath}`);
  }

  const stats = fs.statSync(normalizedPath);
  if (!stats.isFile()) {
    throw new Error(`Novel path is not a file: ${normalizedPath}`);
  }

  if (path.extname(normalizedPath).toLowerCase() !== ".txt") {
    throw new Error("Read import currently supports UTF-8 TXT files only");
  }

  let content: string;
  try {
    content = normalizeReadingText(new TextDecoder("utf-8", { fatal: true }).decode(fs.readFileSync(normalizedPath)));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Unable to decode novel as UTF-8: ${normalizedPath}\n- ${message}`);
  }

  if (content.trim() === "") {
    throw new Error(`Novel file is empty: ${normalizedPath}`);
  }

  const fileName = path.basename(normalizedPath);
  const destinationPath = resolveAssetPath("reading", fileName);
  const title = getBookName(destinationPath);

  return {
    sourcePath: normalizedPath,
    destinationPath,
    fileName,
    bookId: title,
    title,
    content,
    hasConflict: fs.existsSync(destinationPath) && !isSamePath(normalizedPath, destinationPath),
  };
}

export function importReadingBook(
  candidate: ReadingImportCandidate,
  conflictResolution?: ReadingImportConflictResolution
): ImportedReadingBook {
  if (isSamePath(candidate.sourcePath, candidate.destinationPath)) {
    throw new Error("This novel is already inside the Touch Fish reading directory");
  }

  if (candidate.hasConflict && !conflictResolution) {
    throw new Error(`A novel named ${candidate.fileName} is already imported`);
  }

  const destinationPath = conflictResolution === "keep-both"
    ? getAvailableDestinationPath(candidate.destinationPath)
    : candidate.destinationPath;
  writeNovelAtomically(destinationPath, candidate.content, conflictResolution === "replace");
  const title = getBookName(destinationPath);

  return {
    id: title,
    title,
    fileName: path.basename(destinationPath),
    destinationPath,
  };
}

function writeNovelAtomically(destinationPath: string, content: string, replace: boolean) {
  const directory = path.dirname(destinationPath);
  const operationSuffix = `${process.pid}-${Date.now()}`;
  const temporaryPath = `${destinationPath}.${operationSuffix}.import`;
  const backupPath = `${destinationPath}.${operationSuffix}.backup`;
  fs.mkdirSync(directory, { recursive: true });

  if (fs.existsSync(destinationPath) && !replace) {
    throw new Error(`A novel named ${path.basename(destinationPath)} is already imported`);
  }

  try {
    fs.writeFileSync(temporaryPath, content, "utf-8");

    if (replace && fs.existsSync(destinationPath)) {
      fs.renameSync(destinationPath, backupPath);
    }

    try {
      fs.renameSync(temporaryPath, destinationPath);
      if (fs.existsSync(backupPath)) {
        fs.unlinkSync(backupPath);
      }
    } catch (error) {
      if (fs.existsSync(backupPath) && !fs.existsSync(destinationPath)) {
        fs.renameSync(backupPath, destinationPath);
      }
      throw error;
    }
  } finally {
    if (fs.existsSync(temporaryPath)) {
      fs.unlinkSync(temporaryPath);
    }
  }
}

function getAvailableDestinationPath(destinationPath: string): string {
  const parsed = path.parse(destinationPath);
  let suffix = 2;
  let candidatePath = path.join(parsed.dir, `${parsed.name} (${suffix})${parsed.ext}`);

  while (fs.existsSync(candidatePath)) {
    suffix += 1;
    candidatePath = path.join(parsed.dir, `${parsed.name} (${suffix})${parsed.ext}`);
  }

  return candidatePath;
}

function getBookName(filePath: string): string {
  return path.parse(filePath).name.replace(/\.example$/i, "");
}

function isSamePath(left: string, right: string): boolean {
  const resolvedLeft = path.resolve(left);
  const resolvedRight = path.resolve(right);
  return process.platform === "win32"
    ? resolvedLeft.toLowerCase() === resolvedRight.toLowerCase()
    : resolvedLeft === resolvedRight;
}
