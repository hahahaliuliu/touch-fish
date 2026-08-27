import fs from "node:fs";
import { resolveAssetPath } from "../config/paths.js";
import { isRecord, readJsonFile, writeJsonFile } from "./jsonFile.js";

interface FavoriteFile {
  version: 1;
  words: string[];
}

const favoritePath = resolveAssetPath("favorites.json");

// Favorites are read for every rendered word, so cache the parsed set and only
// re-read the file when its signature changes (or after a local write). The
// signature combines the modification time with the file size because some
// filesystems report a coarse mtime that is identical for writes made within
// the same time window.
let cachedFavorites: Set<string> | undefined;
let cachedSignature: FileSignature | undefined;

interface FileSignature {
  mtimeMs: number;
  size: number;
}

export function loadFavorites(): Set<string> {
  const currentSignature = readFavoritesSignature();

  if (
    cachedFavorites !== undefined
    && cachedSignature !== undefined
    && cachedSignature.mtimeMs === currentSignature?.mtimeMs
    && cachedSignature.size === currentSignature?.size
  ) {
    return cachedFavorites;
  }

  cachedFavorites = new Set(parseFavoriteFile(readJsonFile(favoritePath)));
  cachedSignature = currentSignature;
  return cachedFavorites;
}

export function isFavorite(english: string): boolean {
  return loadFavorites().has(english);
}

export function setFavorite(english: string, favorite: boolean) {
  const favorites = loadFavorites();

  if (favorite) {
    favorites.add(english);
  } else {
    favorites.delete(english);
  }

  writeFavorites({ version: 1, words: [...favorites].sort((left, right) => left.localeCompare(right)) });
  cachedFavorites = favorites;
  cachedSignature = readFavoritesSignature();
}

export function toggleFavorite(english: string): boolean {
  const favorite = !isFavorite(english);
  setFavorite(english, favorite);
  return favorite;
}

function writeFavorites(value: FavoriteFile) {
  writeJsonFile(favoritePath, value);
}

function readFavoritesSignature(): FileSignature | undefined {
  try {
    const stat = fs.statSync(favoritePath);
    return { mtimeMs: stat.mtimeMs, size: stat.size };
  } catch {
    return undefined;
  }
}

function parseFavoriteFile(value: unknown): string[] {
  if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.words)) {
    return [];
  }

  return value.words.filter((word): word is string => typeof word === "string" && word.trim() !== "");
}
