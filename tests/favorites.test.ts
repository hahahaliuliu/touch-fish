import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { resolveAssetPath } from "../src/config/paths.js";
import { isFavorite, loadFavorites, setFavorite, toggleFavorite } from "../src/storage/favorites.js";

const favoritePath = resolveAssetPath("favorites.json");

test("favorites are stored globally and toggle safely", () => {
  const existed = fs.existsSync(favoritePath);
  const previous = existed ? fs.readFileSync(favoritePath) : undefined;

  try {
    setFavorite("__touchfish_favorite_test__", true);
    assert.equal(isFavorite("__touchfish_favorite_test__"), true);
    assert.equal(toggleFavorite("__touchfish_favorite_test__"), false);
    assert.equal(loadFavorites().has("__touchfish_favorite_test__"), false);
  } finally {
    if (previous) {
      fs.writeFileSync(favoritePath, previous);
    } else if (fs.existsSync(favoritePath)) {
      fs.unlinkSync(favoritePath);
    }
  }
});

test("damaged favorites fall back to an empty set", () => {
  const existed = fs.existsSync(favoritePath);
  const previous = existed ? fs.readFileSync(favoritePath) : undefined;

  try {
    fs.writeFileSync(favoritePath, "not valid json", "utf8");
    assert.deepEqual(loadFavorites(), new Set());
  } finally {
    if (previous) {
      fs.writeFileSync(favoritePath, previous);
    } else if (fs.existsSync(favoritePath)) {
      fs.unlinkSync(favoritePath);
    }
  }
});
