import { loadSettings } from "../services/settingsLoader.js";
import { renderSettingSession } from "../ui/settingsRenderer.js";

const RETURN_TO_WORD_KEY = "\u000f";

interface StartSettingSessionOptions {
  onReturn?: () => void;
}

let onReturnToPreviousSession: (() => void) | undefined;

export function startSettingSession(options: StartSettingSessionOptions = {}) {
  onReturnToPreviousSession = options.onReturn;
  renderSettingSession(loadSettings());

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }
  process.stdin.resume();
  process.stdin.setEncoding("utf8");

  process.stdin.on("data", handleKeyPress);
}

function handleKeyPress(key: string) {
  for (const input of key.toString()) {
    const shouldContinue = handleInput(input);

    if (!shouldContinue) {
      return;
    }
  }
}

function handleInput(input: string): boolean {
  if (input === "\u0003" || input.toLowerCase() === "q") {
    quitSettingSession();
  }

  if (input === RETURN_TO_WORD_KEY && onReturnToPreviousSession) {
    returnToPreviousSession();
    return false;
  }

  return true;
}

function returnToPreviousSession() {
  const onReturn = onReturnToPreviousSession;

  onReturnToPreviousSession = undefined;
  process.stdin.off("data", handleKeyPress);

  onReturn?.();
}

function quitSettingSession() {
  console.clear();
  console.log("[INFO] configuration session closed");

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }
  process.stdin.pause();
  process.exit(0);
}
