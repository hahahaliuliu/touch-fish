const ENABLE_MOUSE_TRACKING = "\u001b[?1000h\u001b[?1006h";
const DISABLE_MOUSE_TRACKING = "\u001b[?1000l\u001b[?1006l";

export class ReadInputParser {
  private pending = "";

  reset() {
    this.pending = "";
  }

  parse(chunk: string): string[] {
    const inputs: string[] = [];
    const input = `${this.pending}${chunk}`;
    this.pending = "";
    let index = 0;

    while (index < input.length) {
      const current = input[index];
      const next = input[index + 1];
      const third = input[index + 2];

      if (current === "\u001b" && next === "[" && third === "<") {
        const remaining = input.slice(index);
        const mouseInput = remaining.match(/^\u001b\[<\d+;\d+;\d+[mM]/)?.[0];
        if (mouseInput) {
          inputs.push(mouseInput);
          index += mouseInput.length;
          continue;
        }
        this.pending = remaining;
        break;
      }

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
}

export function setReadMouseTracking(enabled: boolean) {
  if (process.stdout.isTTY) {
    process.stdout.write(enabled ? ENABLE_MOUSE_TRACKING : DISABLE_MOUSE_TRACKING);
  }
}

export function getReadMouseBinding(input: string): "mouse-middle" | "mouse-right" | undefined {
  const event = parseMouseInput(input);
  if (event?.action !== "press") {
    return undefined;
  }
  if (event.button === 1) {
    return "mouse-middle";
  }
  if (event.button === 2) {
    return "mouse-right";
  }
  return undefined;
}

export function getReadMouseWheelDirection(input: string): -1 | 1 | undefined {
  const event = parseMouseInput(input);
  if (event?.button === 64) {
    return -1;
  }
  if (event?.button === 65) {
    return 1;
  }
  return undefined;
}

function parseMouseInput(input: string) {
  const match = input.match(/^\u001b\[<(\d+);\d+;\d+([mM])$/);
  if (!match) {
    return undefined;
  }
  return {
    button: Number(match[1]),
    action: match[2] === "M" ? "press" as const : "release" as const,
  };
}
