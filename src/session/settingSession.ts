import type { Settings } from "../models/settings.js";
import { loadSettings, saveSettings } from "../services/settingsLoader.js";
import { renderSettingSession } from "../ui/settingsRenderer.js";

const RETURN_TO_WORD_KEY = "\u000f";
const WORKSPACE_SIZES: Array<Settings["workspaceSize"]> = [1, 3, 5];

interface StartSettingSessionOptions {
  onReturn?: () => void;
}

interface SettingItem {
  key: keyof Settings;
  label: string;
  options?: readonly unknown[];
}

const SETTING_ITEMS: SettingItem[] = [
  {
    key: "workspaceSize",
    label: "Workspace Size",
    options: WORKSPACE_SIZES,
  },
  {
    key: "displayMode",
    label: "Display Mode",
  },
  {
    key: "studyOrder",
    label: "Study Order",
  },
  {
    key: "activeVocabularyBook",
    label: "Vocabulary Book",
  },
  {
    key: "theme",
    label: "Theme",
  },
];

let onReturnToPreviousSession: (() => void) | undefined;
let settings = loadSettings();
let selectedIndex = 0;
let isEditing = false;
let draftSettings = settings;

export function startSettingSession(options: StartSettingSessionOptions = {}) {
  onReturnToPreviousSession = options.onReturn;
  settings = loadSettings();
  selectedIndex = 0;
  isEditing = false;
  draftSettings = settings;
  render();

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }
  process.stdin.resume();
  process.stdin.setEncoding("utf8");

  process.stdin.on("data", handleKeyPress);
}

function handleKeyPress(key: string) {
  for (const input of parseInputs(key.toString())) {
    const shouldContinue = handleInput(input);

    if (!shouldContinue) {
      return;
    }
  }
}

function parseInputs(input: string): string[] {
  const inputs: string[] = [];
  let index = 0;

  while (index < input.length) {
    const current = input[index];
    const next = input[index + 1];
    const third = input[index + 2];

    if (current === "\r" && next === "\n") {
      inputs.push("\r");
      index += 2;
      continue;
    }

    if (current === "\u001b" && next === "[" && third) {
      inputs.push(`${current}${next}${third}`);
      index += 3;
      continue;
    }

    if (current) {
      inputs.push(current);
    }

    index += 1;
  }

  return inputs;
}

function handleInput(input: string): boolean {
  if (input === "\u0003" || input.toLowerCase() === "q") {
    quitSettingSession();
  }

  if (input === RETURN_TO_WORD_KEY && onReturnToPreviousSession) {
    returnToPreviousSession();
    return false;
  }

  if (input === "\u001b") {
    cancelEdit();
    return true;
  }

  if (input === "\r" || input === "\n") {
    confirmOrStartEdit();
    return true;
  }

  if (input === "w" || input === "W" || input === "\u001b[A") {
    moveSelection(-1);
    return true;
  }

  if (input === "s" || input === "S" || input === "\u001b[B") {
    moveSelection(1);
    return true;
  }

  if (input === "a" || input === "A" || input === "\u001b[D") {
    changeCurrentValue(-1);
    return true;
  }

  if (input === "d" || input === "D" || input === "\u001b[C") {
    changeCurrentValue(1);
    return true;
  }

  return true;
}

function moveSelection(direction: -1 | 1) {
  if (isEditing) {
    return;
  }

  selectedIndex =
    (selectedIndex + direction + SETTING_ITEMS.length) % SETTING_ITEMS.length;
  render();
}

function confirmOrStartEdit() {
  const item = getSelectedItem();

  if (!item.options) {
    return;
  }

  if (!isEditing) {
    draftSettings = cloneSettings(settings);
    isEditing = true;
    render();
    return;
  }

  settings = cloneSettings(draftSettings);
  saveSettings(settings);
  isEditing = false;
  render();
}

function cancelEdit() {
  if (!isEditing) {
    return;
  }

  draftSettings = settings;
  isEditing = false;
  render();
}

function changeCurrentValue(direction: -1 | 1) {
  const item = getSelectedItem();

  if (!isEditing || !item.options || item.key !== "workspaceSize") {
    return;
  }

  const currentValue = draftSettings.workspaceSize;
  const currentIndex = WORKSPACE_SIZES.indexOf(currentValue);
  const nextIndex =
    (currentIndex + direction + WORKSPACE_SIZES.length) % WORKSPACE_SIZES.length;
  const nextWorkspaceSize = WORKSPACE_SIZES[nextIndex] ?? WORKSPACE_SIZES[0]!;

  draftSettings = {
    ...draftSettings,
    workspaceSize: nextWorkspaceSize,
  };
  render();
}

function getSelectedItem(): SettingItem {
  return SETTING_ITEMS[selectedIndex] ?? SETTING_ITEMS[0]!;
}

function render() {
  renderSettingSession({
    settings,
    draftSettings,
    items: SETTING_ITEMS,
    selectedIndex,
    isEditing,
  });
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

function cloneSettings(value: Settings): Settings {
  return {
    ...value,
    visibleFields: {
      ...value.visibleFields,
    },
    keyBindings: {
      ...value.keyBindings,
    },
  };
}
