import type { KeyBindings, Settings } from "../models/settings.js";

interface ConfigItem {
  kind: "setting";
  key: keyof Settings;
  label: string;
  options?: readonly unknown[];
  acceptsNumber?: boolean;
}

interface BindingItem {
  kind: "binding";
  key: keyof KeyBindings;
  label: string;
}

type SettingItem = ConfigItem | BindingItem;

interface RenderSettingSessionOptions {
  settings: Settings;
  draftSettings: Settings;
  items: SettingItem[];
  selectedIndex: number;
  selectedBindingSlot: 0 | 1;
  isEditing: boolean;
  numericInput?: string | undefined;
  selectedNumericOption?: number | "custom" | undefined;
  selectedStudyOrderOption?: Settings["studyOrder"] | "reshuffle" | undefined;
  isBindingCapture: boolean;
  isNumericCursor: boolean;
  editError: string;
  isReshuffleArmed: boolean;
}

export function renderSettingSession(options: RenderSettingSessionOptions) {
  const {
    settings,
    draftSettings,
    items,
    selectedIndex,
    selectedBindingSlot,
    isEditing,
    numericInput,
    selectedNumericOption,
    selectedStudyOrderOption,
    isBindingCapture,
    isNumericCursor,
    editError,
    isReshuffleArmed,
  } = options;
  const activeSettings = isEditing ? draftSettings : settings;
  let hasRenderedBindings = false;

  console.clear();
  console.log("Touch Fish Settings");
  console.log("");
  console.log("[INFO] configuration ready");
  console.log("");

  items.forEach((item, index) => {
    const selected = index === selectedIndex;

    if (item.kind === "binding") {
      if (!hasRenderedBindings) {
        hasRenderedBindings = true;
        console.log("Word Details  phonetic / example / part of speech: locked");
        console.log("");
        console.log("Key Bindings");
      }

      renderBindingItem(item, activeSettings, selected, selectedBindingSlot, isBindingCapture && selected);
      return;
    }

    renderConfigItem(
      item,
      activeSettings,
      selected,
      isEditing,
      numericInput,
      isNumericCursor,
      selectedNumericOption,
      selectedStudyOrderOption
    );
  });

  console.log("");
  console.log("Controls  W/S move | A/D setting or slot | Enter edit | Backspace clear");
  console.log("          Esc cancel | Ctrl+O return to word | Q quit");

  if (isBindingCapture) {
    console.log("[BIND] English key, symbol, Space, Tab, or arrow key; occupied keys clear their previous slot");
  } else if (isEditing && numericInput !== undefined) {
    console.log("[CUSTOM] type a positive whole number, then Enter; A/D cycles presets and custom");
  } else if (isEditing) {
    console.log("[EDIT] change value, then press Enter to save");
  }

  if (isEditing && selectedStudyOrderOption === "reshuffle" && !isReshuffleArmed) {
    console.log("[RESHUFFLE] Press Space to arm the reset, then press Enter to apply it");
  }

  if (isReshuffleArmed) {
    console.log("[WARN] Reshuffle armed: this replaces the saved random order and resets random progress to 1");
    console.log("[CONFIRM] Press Enter to reshuffle, or Esc to cancel");
  }

  if (editError) {
    console.log(`[WARN] ${editError}`);
  }
}

function renderConfigItem(
  item: ConfigItem,
  settings: Settings,
  selected: boolean,
  isEditing: boolean,
  numericInput: string | undefined,
  isNumericCursor: boolean,
  selectedNumericOption: number | "custom" | undefined,
  selectedStudyOrderOption: Settings["studyOrder"] | "reshuffle" | undefined
) {
  const inactive = item.key === "dailyWordCount" && !settings.studyGroupEnabled;
  const value = formatSettingValue(
    settings,
    item.key,
    selected && isEditing && item.acceptsNumber ? numericInput : undefined
  );
  const optionText = formatOptionText(
    item,
    inactive,
    selected && isEditing ? settings : undefined,
    selected && isEditing && item.acceptsNumber ? selectedNumericOption : undefined,
    selected && isEditing && item.key === "studyOrder" ? selectedStudyOrderOption : undefined
  );
  const editMark = selected && isEditing ? "*" : selected ? ">" : " ";

  console.log(`${editMark} ${item.label.padEnd(20, " ")} ${formatSettingCell(value, isNumericCursor)} ${optionText}`);
}

function renderBindingItem(
  item: BindingItem,
  settings: Settings,
  selected: boolean,
  selectedSlot: 0 | 1,
  isCapturing: boolean
) {
  const bindings = settings.keyBindings[item.key];
  const first = formatBindingSlot(bindings[0], selected && selectedSlot === 0, isCapturing && selectedSlot === 0);
  const second = formatBindingSlot(bindings[1], selected && selectedSlot === 1, isCapturing && selectedSlot === 1);
  const mark = selected && isCapturing ? "*" : selected ? ">" : " ";

  console.log(`${mark} ${item.label.padEnd(20, " ")} ${first.padEnd(17, " ")} ${second}`);
}

function formatBindingSlot(
  binding: string,
  selected: boolean,
  isCapturing: boolean
): string {
  if (isCapturing) {
    return `${blinkingCursor()}${" ".repeat(16)}`;
  }

  const value = formatBinding(binding).padEnd(17, " ");
  return selected ? formatOption(value, true) : value;
}

function formatSettingCell(value: string, isNumericCursor: boolean): string {
  if (!isNumericCursor) {
    return value.padEnd(10, " ");
  }

  return `${value}${blinkingCursor()}${" ".repeat(Math.max(0, 9 - value.length))}`;
}

function blinkingCursor(): string {
  return "\u001b[5m_\u001b[0m";
}

function formatSettingValue(settings: Settings, key: keyof Settings, editingValue?: string): string {
  if (editingValue !== undefined) {
    return editingValue || "_";
  }

  const value = settings[key];

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "on" : "off";
  }

  return "configured";
}

function formatOptionText(
  item: ConfigItem,
  inactive: boolean,
  editingSettings?: Settings,
  selectedNumericOption?: number | "custom",
  selectedStudyOrderOption?: Settings["studyOrder"] | "reshuffle"
): string {
  if (inactive) {
    return "[inactive]";
  }

  if (item.key === "studyGroupEnabled" || item.key === "navigationLoop") {
    const value = editingSettings?.[item.key];
    return `[${formatOption("off", value === false)} / ${formatOption("on", value === true)}]`;
  }

  if (item.key === "studyOrder" && item.options) {
    const value = selectedStudyOrderOption ?? editingSettings?.studyOrder;
    return `[${[...item.options, "reshuffle"].map((option) => formatOption(String(option), option === value)).join(" / ")}]`;
  }

  if (item.acceptsNumber && item.options) {
    return `[${[...item.options, "custom"].map((option) => formatOption(String(option), option === selectedNumericOption)).join(" / ")}]`;
  }

  if (item.options && editingSettings) {
    const value = editingSettings[item.key];
    return `[${item.options.map((option) => formatOption(String(option), option === value)).join(" / ")}]`;
  }

  return item.options ? `[${item.options.join(" / ")}]` : "[locked]";
}

function formatBinding(binding: string): string {
  const names: Record<string, string> = {
    "": "_",
    space: "Space",
    tab: "Tab",
    "arrow-up": "Up Arrow",
    "arrow-down": "Down Arrow",
    "arrow-left": "Left Arrow",
    "arrow-right": "Right Arrow",
  };

  return names[binding] ?? binding.toUpperCase();
}

function formatOption(option: string, selected: boolean): string {
  return selected ? `\u001b[7m${option}\u001b[0m` : option;
}
