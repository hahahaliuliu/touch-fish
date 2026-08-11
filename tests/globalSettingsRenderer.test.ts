import assert from "node:assert/strict";
import test from "node:test";
import { getGlobalSettingsScreen } from "../src/ui/globalSettingsRenderer.js";

test("global settings placeholder does not look like Word or Read settings", () => {
  const screen = getGlobalSettingsScreen();

  assert.match(screen, /Touch Fish 全局设置/);
  assert.match(screen, /当前版本暂无可配置的全局设置项/);
  assert.match(screen, /Word 和 Read 的设置相互独立/);
  assert.match(screen, /Word 设置：touchfish word -s/);
  assert.match(screen, /Read 设置：touchfish read -s/);
  assert.match(screen, /Q \/ Ctrl\+C 退出程序/);
  assert.doesNotMatch(screen, /单词分组|正文宽度/);
});
