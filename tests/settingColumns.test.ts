import assert from "node:assert/strict";
import test from "node:test";
import { formatSettingColumns } from "../src/ui/settingColumns.js";
import { getTerminalWidth } from "../src/ui/terminalText.js";

test("responsive setting columns stay aligned across terminal widths", () => {
  const originalColumns = process.stdout.columns;

  try {
    [10, 20, 30, 45, 60, 100].forEach((columns) => {
      Object.defineProperty(process.stdout, "columns", { value: columns, configurable: true });
      const lines = formatSettingColumns(
        ">",
        "章节切分",
        "3 份",
        "[关闭 / 2 份 / 3 份 / 5 份 / 自定义]",
        { desiredLabelWidth: 20, desiredValueWidth: 16 }
      );
      const firstLine = lines[0] ?? "";
      const optionIndex = firstLine.indexOf("[");
      const optionColumn = optionIndex < 0 ? -1 : getTerminalWidth(firstLine.slice(0, optionIndex));

      assert.equal(optionColumn > 0, true, `missing option column at ${columns} columns`);
      assert.equal(lines.every((line) => getTerminalWidth(line) <= columns), true);
      if (columns >= 30) {
        assert.equal(
          lines.slice(1).every((line) => (line.match(/^ */)?.[0].length ?? 0) === optionColumn),
          true
        );
      }
    });
  } finally {
    Object.defineProperty(process.stdout, "columns", { value: originalColumns, configurable: true });
  }
});
