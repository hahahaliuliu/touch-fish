import { clearTerminalForExit } from "../ui/terminalScreen.js";
import { renderGlobalSettings } from "../ui/globalSettingsRenderer.js";

export function startGlobalSettingsSession() {
  renderGlobalSettings();

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }
  process.stdin.resume();
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", handleInput);
}

function handleInput(input: string) {
  if (input === "\u0003" || input.toLowerCase().includes("q")) {
    quitGlobalSettingsSession();
  }
}

function quitGlobalSettingsSession() {
  process.stdin.off("data", handleInput);
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }
  clearTerminalForExit();
  process.stdin.pause();
  process.exit(0);
}
