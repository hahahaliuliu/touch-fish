import type { Settings } from "../models/settings.js";

interface SettingItem {
  key: keyof Settings;
  label: string;
  options?: readonly unknown[];
  acceptsNumber?: boolean;
}

interface RenderSettingSessionOptions {
  settings: Settings;
  draftSettings: Settings;
  items: SettingItem[];
  selectedIndex: number;
  isEditing: boolean;
  numericInput?: string | undefined;
  selectedNumericOption?: number | "custom" | undefined;
  editError: string;
}

export function renderSettingSession(options: RenderSettingSessionOptions) {
  const {
    settings,
    draftSettings,
    items,
    selectedIndex,
    isEditing,
    numericInput,
    selectedNumericOption,
    editError,
  } = options;
  const activeSettings = isEditing ? draftSettings : settings;

  console.clear();

  console.log("Touch Fish Settings");
  console.log("");
  console.log("[INFO] configuration ready");
  console.log("");

  items.forEach((item, index) => {
    const selected = index === selectedIndex;
    const inactive = item.key === "dailyWordCount" && !activeSettings.studyGroupEnabled;
    const value = formatSettingValue(
      activeSettings,
      item.key,
      selected && isEditing && item.acceptsNumber ? numericInput : undefined
    );
    const optionText = formatOptionText(
      item,
      inactive,
      selected && isEditing ? activeSettings : undefined,
      selected && isEditing && item.acceptsNumber ? selectedNumericOption : undefined
    );
    const editMark = selected && isEditing ? "*" : selected ? ">" : " ";

    console.log(
      `${editMark} ${item.label.padEnd(20, " ")} ${value.padEnd(10, " ")} ${optionText}`
    );
  });

  console.log("");
  console.log("Later");
  console.log(
    `  Phonetic             ${formatBoolean(settings.visibleFields.phonetic)} [locked]`
  );
  console.log(
    `  Example              ${formatBoolean(settings.visibleFields.example)} [locked]`
  );
  console.log(
    `  Part Of Speech       ${formatBoolean(settings.visibleFields.partOfSpeech)} [locked]`
  );
  console.log("");
  console.log("Controls");
  console.log("  W/S or Up/Down       move");
  console.log("  Enter                edit / confirm");
  console.log("  A/D or Left/Right    change preset or toggle");
  console.log("  Esc                  cancel");
  console.log("  Ctrl+O               return to word");
  console.log("  Q                    quit");

  if (isEditing && numericInput !== undefined) {
    console.log("");
    console.log("[CUSTOM] type any positive whole number, then press Enter to save");
    console.log("[CUSTOM] example: type 7 for a page size of 7");
    console.log("[EDIT] A/D cycles presets and custom; Backspace deletes a digit");
  } else if (isEditing) {
    console.log("");
    console.log("[EDIT] change value, then press Enter to save");
  }

  if (editError) {
    console.log(`[WARN] ${editError}`);
  }
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
  item: SettingItem,
  inactive: boolean,
  editingSettings?: Settings,
  selectedNumericOption?: number | "custom"
): string {
  if (inactive) {
    return "[inactive]";
  }

  if (item.key === "studyGroupEnabled" || item.key === "navigationLoop") {
    const value = editingSettings?.[item.key];

    return `[${formatOption("off", value === false)} / ${formatOption("on", value === true)}]`;
  }

  if (item.key === "studyOrder" && item.options) {
    const value = editingSettings?.studyOrder;
    const options = item.options.map((option) =>
      formatOption(String(option), option === value)
    );

    return `[${options.join(" / ")}]`;
  }

  if (item.acceptsNumber && item.options) {
    const options = [...item.options, "custom"].map((option) =>
      formatOption(String(option), option === selectedNumericOption)
    );

    return `[${options.join(" / ")}]`;
  }

  return item.options ? `[${item.options.join(" / ")}]` : "[locked]";
}

function formatOption(option: string, selected: boolean): string {
  return selected ? `\u001b[7m${option}\u001b[0m` : option;
}

function formatBoolean(value: boolean) {
  return value ? "enabled " : "disabled";
}
