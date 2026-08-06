import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { resolveAssetPath } from "../src/config/paths.js";
import {
  loadReadProgress,
  loadReadState,
  saveReadProgress,
  saveReadState,
} from "../src/storage/readProgress.js";

const testBookId = `read-progress-${process.pid}`;
const testProgressPath = resolveAssetPath("read-progress", `${encodeURIComponent(testBookId)}.json`);
const testTemporaryPath = `${testProgressPath}.tmp`;
const statePath = resolveAssetPath("read-progress", "state.json");
const stateTemporaryPath = `${statePath}.tmp`;

test("damaged read progress falls back to the beginning", () => {
  try {
    fs.mkdirSync(path.dirname(testProgressPath), { recursive: true });
    fs.writeFileSync(testProgressPath, "not valid json", "utf-8");

    assert.deepEqual(loadReadProgress(testBookId, 100), { characterOffset: 0 });
  } finally {
    cleanupProgressFiles();
  }
});

test("read progress clamps an offset to the novel length", () => {
  try {
    saveReadProgress(testBookId, { characterOffset: 999 });

    assert.deepEqual(loadReadProgress(testBookId, 12), { characterOffset: 12 });
  } finally {
    cleanupProgressFiles();
  }
});

test("read progress writes through a temporary file", () => {
  try {
    saveReadProgress(testBookId, { characterOffset: 3 });

    assert.equal(fs.existsSync(testProgressPath), true);
    assert.equal(fs.existsSync(testTemporaryPath), false);
    assert.deepEqual(loadReadProgress(testBookId, 20), { characterOffset: 3 });
  } finally {
    cleanupProgressFiles();
  }
});

test("active reading state saves safely and damaged state falls back", () => {
  const originalState = fs.existsSync(statePath)
    ? fs.readFileSync(statePath, "utf-8")
    : undefined;

  try {
    saveReadState({ activeBookId: testBookId });

    assert.deepEqual(loadReadState(), { activeBookId: testBookId });
    assert.equal(fs.existsSync(stateTemporaryPath), false);

    fs.writeFileSync(statePath, "not valid json", "utf-8");
    assert.deepEqual(loadReadState(), {});
  } finally {
    if (originalState === undefined) {
      if (fs.existsSync(statePath)) {
        fs.unlinkSync(statePath);
      }
    } else {
      fs.writeFileSync(statePath, originalState, "utf-8");
    }

    if (fs.existsSync(stateTemporaryPath)) {
      fs.unlinkSync(stateTemporaryPath);
    }
  }
});

function cleanupProgressFiles() {
  for (const filePath of [testProgressPath, testTemporaryPath]) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}
