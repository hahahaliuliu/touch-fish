import fs from "node:fs";
import path from "node:path";
import { resolveAssetPath } from "../config/paths.js";

interface FavoriteFile {
  version: 1;
  words: string[];
}

const favoritePath = resolveAssetPath("favorites.json");

export function loadFavorites(): Set<string> {
  if (!fs.existsSync(favoritePath)) {
    return new Set();
  }

  try {
    const value = JSON.parse(fs.readFileSync(favoritePath, "utf-8")) as unknown;
    return new Set(parseFavoriteFile(value));
  } catch {
    return new Set();
  }
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
}

export function toggleFavorite(english: string): boolean {
  const favorite = !isFavorite(english);
  setFavorite(english, favorite);
  return favorite;
}

function writeFavorites(value: FavoriteFile) {
  const directory = path.dirname(favoritePath);
  const temporaryPath = `${favoritePath}.tmp`;

  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }

  try {
    fs.writeFileSync(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
    fs.renameSync(temporaryPath, favoritePath);
  } finally {
    if (fs.existsSync(temporaryPath)) {
      fs.unlinkSync(temporaryPath);
    }
  }
}

function parseFavoriteFile(value: unknown): string[] {
  if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.words)) {
    return [];
  }

  return value.words.filter((word): word is string => typeof word === "string" && word.trim() !== "");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
