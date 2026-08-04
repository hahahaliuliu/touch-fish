const FALLBACK_TERMINAL_COLUMNS = 100;

export function getTerminalColumns(): number {
  const columns = process.stdout.columns;

  return columns && columns > 0 ? columns : FALLBACK_TERMINAL_COLUMNS;
}

export function truncateTerminalText(value: string, maxWidth: number): string {
  const normalized = value.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();

  if (getTerminalWidth(normalized) <= maxWidth) {
    return normalized;
  }

  if (maxWidth <= 3) {
    return ".".repeat(Math.max(0, maxWidth));
  }

  const characters: string[] = [];
  let width = 0;

  for (const character of normalized) {
    const characterWidth = getCharacterWidth(character);

    if (width + characterWidth > maxWidth - 3) {
      break;
    }

    characters.push(character);
    width += characterWidth;
  }

  return `${characters.join("")}...`;
}

export function wrapTerminalText(value: string, maxWidth: number): string[] {
  const normalized = value.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();

  if (!normalized || maxWidth <= 0) {
    return normalized ? [normalized] : [];
  }

  const lines: string[] = [];
  let line = "";
  let width = 0;

  for (const character of normalized) {
    const characterWidth = getCharacterWidth(character);

    if (line && width + characterWidth > maxWidth) {
      lines.push(line);
      line = "";
      width = 0;
    }

    line += character;
    width += characterWidth;
  }

  if (line) {
    lines.push(line);
  }

  return lines;
}

export function getTerminalWidth(value: string): number {
  return [...value].reduce((width, character) => width + getCharacterWidth(character), 0);
}

function getCharacterWidth(character: string): number {
  return /[\u1100-\u115f\u2e80-\ua4cf\uac00-\ud7a3\uf900-\ufaff\uff01-\uff60\uffe0-\uffe6]/.test(character)
    ? 2
    : 1;
}
