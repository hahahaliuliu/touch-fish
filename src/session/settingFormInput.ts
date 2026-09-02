const SPECIAL_BINDINGS: Record<string, string> = {
  "\u001b[A": "arrow-up",
  "\u001b[B": "arrow-down",
  "\u001b[C": "arrow-right",
  "\u001b[D": "arrow-left",
  "\t": "tab",
  " ": "space",
  "？": "?",
};

/**
 * Split raw terminal input into individual key presses, handling arrow keys
 * and CRLF line endings. Mouse escape sequences are handled by ReadInputParser.
 */
export function parseTerminalInputs(input: string): string[] {
  const inputs: string[] = [];
  let index = 0;

  while (index < input.length) {
    const current = input[index];
    const next = input[index + 1];
    const third = input[index + 2];

    if (current === "\u001b" && next === "[" && third) {
      inputs.push(`${current}${next}${third}`);
      index += 3;
      continue;
    }

    if (current === "\r" && next === "\n") {
      inputs.push("\r");
      index += 2;
      continue;
    }

    if (current) {
      inputs.push(current);
    }

    index += 1;
  }

  return inputs;
}

/** Cycle through option lists, wrapping at both ends. */
export function getNextValue<T>(currentValue: T, options: readonly T[], direction: -1 | 1): T {
  const currentIndex = options.indexOf(currentValue);
  const nextIndex = (currentIndex + direction + options.length) % options.length;
  return options[nextIndex] ?? options[0]!;
}

export function isBackspace(input: string): boolean {
  return input === "\b" || input === "\u007f";
}

/** True when the key press is plain text that can be appended to a note. */
export function isNoteTextInput(input: string): boolean {
  return input.length > 0 && !/\u0000-\u001f\u007f/.test(input);
}

/**
 * Normalize a key press to a stable binding name. Mouse bindings are resolved
 * separately by the Read module before this shared helper is consulted.
 */
export function normalizeSettingBinding(input: string): string | undefined {
  if (SPECIAL_BINDINGS[input]) {
    return SPECIAL_BINDINGS[input];
  }

  return /^[\x21-\x7e]$/.test(input) ? input.toLowerCase() : undefined;
}
