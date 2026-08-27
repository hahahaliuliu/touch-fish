import fs from "node:fs";
import { resolveAssetPath } from "../config/paths.js";
import { isRecord, readJsonFile, writeJsonFile } from "./jsonFile.js";

interface FavoriteFile {
  version: 1;
  words: string[];
}

const favoritePath = resolveAssetPath("favorites.json");

// Favorites are read for every rendered word, so cache the parsed set and only
// re-read the file when its modification time changes (or after a local write).
let cachedFavorites: Set<string> | undefined;
let cachedMtimeMs: number | undefined;

export function loadFavorites(): Set<string> {
  const currentMtimeMs = readFavoritesMtimeMs();

  if (cachedFavorites !== undefined && cachedMtimeMs === currentMtimeMs) {
    return cachedFavorites;
  }

  cachedFavorites = new Set(parseFavoriteFile(readJsonFile(favoritePath)));
  cachedMtimeMs = currentMtimeMs;
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
  cachedMtimeMs = readFavoritesMtimeMs();
}

export function toggleFavorite(english: string): boolean {
  const favorite = !isFavorite(english);
  setFavorite(english, favorite);
  return favorite;
}

function writeFavorites(value: FavoriteFile) {
  writeJsonFile(favoritePath, value);
}

function readFavoritesMtimeMs(): number | undefined {
  try {
    return fs.statSync(favoritePath).mtimeMs;
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
