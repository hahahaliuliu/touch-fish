const CLEAR_TERMINAL_FOR_EXIT = "\u001b[3J\u001b[2J\u001b[H";

interface TerminalOutput {
  isTTY?: boolean | undefined;
  write(value: string): unknown;
}

export function clearTerminalForExit(
  output: TerminalOutput = process.stdout,
  clearFallback: () => void = console.clear
) {
  if (output.isTTY) {
    output.write(CLEAR_TERMINAL_FOR_EXIT);
    return;
  }

  clearFallback();
}
