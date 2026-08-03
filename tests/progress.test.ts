import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { resolveAssetPath } from "../src/config/paths.js";
import { loadWordProgress, saveWordProgress } from "../src/storage/progress.js";

const testBookId = `progress-test-${process.pid}`;
const testProgressPath = resolveAssetPath("progress", `${encodeURIComponent(testBookId)}.json`);
const testTemporaryPath = `${testProgressPath}.tmp`;

test("damaged progress falls back to empty progress", () => {
  try {
    ensureProgressDirectory();
    fs.writeFileSync(testProgressPath, "not valid json", "utf8");

    assert.deepEqual(loadWordProgress(testBookId, 5), {
      sequentialIndex: 0,
      randomIndex: 0,
      randomOrder: [],
    });
  } finally {
    cleanupProgressFiles();
  }
});

test("progress indexes are clamped to the vocabulary range", () => {
  try {
    saveWordProgress(testBookId, {
      sequentialIndex: 99,
      randomIndex: 42,
      randomOrder: [0, 1, 99],
    });

    assert.deepEqual(loadWordProgress(testBookId, 3), {
      sequentialIndex: 2,
      randomIndex: 2,
      randomOrder: [],
    });
  } finally {
    cleanupProgressFiles();
  }
});

test("progress writes replace the file through a temporary file", () => {
  try {
    saveWordProgress(testBookId, {
      sequentialIndex: 1,
      randomIndex: 0,
      randomOrder: [1, 0],
    });

    assert.equal(fs.existsSync(testProgressPath), true);
    assert.equal(fs.existsSync(testTemporaryPath), false);
    assert.equal(loadWordProgress(testBookId, 2).sequentialIndex, 1);
  } finally {
    cleanupProgressFiles();
  }
});

function ensureProgressDirectory() {
  fs.mkdirSync(path.dirname(testProgressPath), { recursive: true });
}

function cleanupProgressFiles() {
  for (const filePath of [testProgressPath, testTemporaryPath]) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}
