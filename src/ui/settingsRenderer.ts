import type { Settings } from "../models/settings.js";

interface SettingItem {
  key: keyof Settings;
  label: string;
  options?: readonly unknown[];
}

interface RenderSettingSessionOptions {
  settings: Settings;
  draftSettings: Settings;
  items: SettingItem[];
  selectedIndex: number;
  isEditing: boolean;
}

export function renderSettingSession(options: RenderSettingSessionOptions) {
  const { settings, draftSettings, items, selectedIndex, isEditing } = options;
  const activeSettings = isEditing ? draftSettings : settings;

  console.clear();

  console.log("Touch Fish Settings");
  console.log("");
  console.log("[INFO] configuration ready");
  console.log("");
  console.log("General");

  items.forEach((item, index) => {
    const selected = index === selectedIndex;
    const value = formatSettingValue(activeSettings, item.key);
    const optionText = item.options ? `[${item.options.join(" / ")}]` : "[locked]";
    const editMark = selected && isEditing ? "*" : selected ? ">" : " ";

    console.log(
      `${editMark} ${item.label.padEnd(18, " ")} ${value.padEnd(12, " ")} ${optionText}`
    );
  });

  console.log("");
  console.log("Word Details");
  console.log(
    `  Phonetic           ${formatBoolean(settings.visibleFields.phonetic)} [locked]`
  );
  console.log(
    `  Example            ${formatBoolean(settings.visibleFields.example)} [locked]`
  );
  console.log(
    `  Part Of Speech     ${formatBoolean(settings.visibleFields.partOfSpeech)} [locked]`
  );
  console.log("");
  console.log("Controls");
  console.log("  W/S or Up/Down     move");
  console.log("  Enter              edit / confirm");
  console.log("  A/D or Left/Right  change value");
  console.log("  Esc                cancel");
  console.log("  Ctrl+O             return to word");
  console.log("  Q                  quit");

  if (isEditing) {
    console.log("");
    console.log("[EDIT] change value, then press Enter to save");
  }
}

function formatSettingValue(settings: Settings, key: keyof Settings): string {
  const value = settings[key];

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  return "configured";
}

function formatBoolean(value: boolean) {
  return value ? "enabled " : "disabled";
}
