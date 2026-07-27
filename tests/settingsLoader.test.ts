import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_SETTINGS } from "../src/config/defaultSettings.js";
import { parseSettings } from "../src/services/settingsLoader.js";

test("old settings gain newly added defaults", () => {
  const settings = parseSettings({
    workspaceSize: 5,
    displayMode: "both",
  });

  assert.equal(settings.workspaceSize, 5);
  assert.equal(settings.displayMode, "both");
  assert.equal(settings.interfaceLanguage, "english");
  assert.equal(settings.theme, "build-log");
  assert.deepEqual(settings.keyBindings, DEFAULT_SETTINGS.keyBindings);
});

test("settings reject an unsupported interface language", () => {
  assert.throws(
    () => parseSettings({ ...DEFAULT_SETTINGS, interfaceLanguage: "french" }),
    /interfaceLanguage must be english or chinese/
  );
});
