import { getTerminalColumns, getTerminalWidth, wrapTerminalTextWithAnsi } from "./terminalText.js";

interface SettingColumnOptions {
  desiredLabelWidth: number;
  desiredValueWidth: number;
}

export const STANDARD_SETTING_COLUMNS: SettingColumnOptions = {
  desiredLabelWidth: 20,
  desiredValueWidth: 16,
};

export const BINDING_SETTING_COLUMNS: SettingColumnOptions = {
  desiredLabelWidth: 20,
  desiredValueWidth: 17,
};

export function formatSettingColumns(
  marker: string,
  label: string,
  value: string,
  optionText: string,
  options: SettingColumnOptions
): string[] {
  const totalWidth = Math.max(10, getTerminalColumns());
  const widths = getResponsiveColumnWidths(totalWidth, options);
  const labelLines = wrapTerminalTextWithAnsi(label, widths.label);
  const valueLines = wrapTerminalTextWithAnsi(value, widths.value);
  const optionLines = wrapOptionText(optionText, widths.option);
  const lineCount = Math.max(labelLines.length, valueLines.length, optionLines.length);

  return Array.from({ length: lineCount }, (_, index) => {
    const rowMarker = index === 0 ? marker : " ";
    const labelCell = padCell(labelLines[index] ?? "", widths.label);
    const valueCell = padCell(valueLines[index] ?? "", widths.value);
    return `${rowMarker} ${labelCell} ${valueCell} ${optionLines[index] ?? ""}`;
  });
}

function getResponsiveColumnWidths(totalWidth: number, options: SettingColumnOptions) {
  const usableWidth = Math.max(6, totalWidth - 4);
  const minimumOptionWidth = 8;

  if (usableWidth >= options.desiredLabelWidth + options.desiredValueWidth + minimumOptionWidth) {
    return {
      label: options.desiredLabelWidth,
      value: options.desiredValueWidth,
      option: usableWidth - options.desiredLabelWidth - options.desiredValueWidth,
    };
  }

  const optionWidth = Math.max(2, Math.floor(usableWidth * 0.34));
  const remainingWidth = usableWidth - optionWidth;
  const valueWidth = Math.max(2, Math.floor(remainingWidth * 0.44));
  const labelWidth = Math.max(2, remainingWidth - valueWidth);

  return {
    label: labelWidth,
    value: valueWidth,
    option: Math.max(2, usableWidth - labelWidth - valueWidth),
  };
}

function wrapOptionText(optionText: string, availableWidth: number): string[] {
  if (!optionText || getVisibleWidth(optionText) <= availableWidth) {
    return [optionText];
  }

  if (!optionText.startsWith("[") || !optionText.endsWith("]")) {
    return wrapTerminalTextWithAnsi(optionText, availableWidth);
  }

  const options = optionText.slice(1, -1).split(" / ");
  const lines: string[] = [];
  let current = `[${options[0] ?? ""}`;

  options.slice(1).forEach((option) => {
    const candidate = `${current} / ${option}`;

    if (getVisibleWidth(`${candidate}]`) <= availableWidth) {
      current = candidate;
      return;
    }

    lines.push(`${current} /`);
    current = option;
  });

  lines.push(`${current}]`);
  return lines.flatMap((line) => wrapTerminalTextWithAnsi(line, availableWidth));
}

function padCell(value: string, width: number): string {
  return `${value}${" ".repeat(Math.max(0, width - getVisibleWidth(value)))}`;
}

function getVisibleWidth(value: string): number {
  return getTerminalWidth(value.replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, ""));
}
