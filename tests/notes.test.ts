import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { resolveAssetPath } from "../src/config/paths.js";
import { loadWordNotes, saveWordNote } from "../src/storage/notes.js";

const testBookId = `notes-test-${process.pid}`;
const testNotePath = resolveAssetPath("notes", `${testBookId}.json`);
const words = [{ english: "abandon" }, { english: "benefit" }];

test("word notes are stored separately from vocabulary books", () => {
  try {
    saveWordNote(testBookId, 1, "benefit", "gain; advantage");

    assert.deepEqual(loadWordNotes(testBookId, words), new Map([[1, "gain; advantage"]]));
    assert.deepEqual(loadWordNotes(testBookId, [{ english: "abandon" }, { english: "changed" }]), new Map());

    saveWordNote(testBookId, 1, "benefit", "");
    assert.deepEqual(loadWordNotes(testBookId, words), new Map());
  } finally {
    if (fs.existsSync(testNotePath)) {
      fs.unlinkSync(testNotePath);
    }

    const directory = path.dirname(testNotePath);
    if (fs.existsSync(directory) && fs.readdirSync(directory).length === 0) {
      fs.rmdirSync(directory);
    }
  }
});
