import type { InterfaceLanguage, Settings } from "../models/settings.js";
import type { ActionItem, BindingItem, ConfigItem, SettingItem } from "../session/settingItems.js";
import {
  BINDING_SETTING_COLUMNS,
  formatSettingColumns,
  STANDARD_SETTING_COLUMNS,
} from "./settingColumns.js";

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
  const language = activeSettings.interfaceLanguage;
  const text = getSettingsText(language);
  let hasRenderedBindings = false;

  console.clear();
  console.log(text.ready);
  console.log("");
  console.log(text.title);
  console.log("");

  items.forEach((item, index) => {
    const selected = index === selectedIndex;

    if (item.kind === "binding") {
      if (!hasRenderedBindings) {
        hasRenderedBindings = true;
        console.log("");
        console.log(text.keyBindings);
      }

      renderBindingItem(item, activeSettings, selected, selectedBindingSlot, isBindingCapture && selected, language);
      return;
    }

    if (item.kind === "action") {
      renderActionItem(item, selected);
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
      ,language
    );
  });

  console.log("");
  console.log(text.controlsFirstLine);
  console.log(text.controlsSecondLine);

  if (isBindingCapture) {
    console.log(text.bindingHint);
  } else if (isEditing && numericInput !== undefined) {
    console.log(text.customHint);
  } else if (isEditing) {
    console.log(text.editHint);
  }

  if (isEditing && selectedStudyOrderOption === "reshuffle" && !isReshuffleArmed) {
    console.log(text.reshuffleHint);
  }

  if (isReshuffleArmed) {
    console.log(text.reshuffleWarning);
    console.log(text.reshuffleConfirm);
  }

  if (editError) {
    console.log(`${text.warningPrefix}${editError}`);
  }
}

function renderActionItem(item: ActionItem, selected: boolean) {
  const mark = selected ? ">" : " ";
  formatSettingColumns(mark, item.label, "[open]", "", STANDARD_SETTING_COLUMNS)
    .forEach((line) => console.log(line));
}

function renderConfigItem(
  item: ConfigItem,
  settings: Settings,
  selected: boolean,
  isEditing: boolean,
  numericInput: string | undefined,
  isNumericCursor: boolean,
  selectedNumericOption: number | "custom" | undefined,
  selectedStudyOrderOption: Settings["studyOrder"] | "reshuffle" | undefined,
  language: InterfaceLanguage
) {
  const inactive = item.key === "dailyWordCount" && !settings.studyGroupEnabled;
  const value = formatSettingValue(
    settings,
    item.key,
    selected && isEditing && item.acceptsNumber ? numericInput : undefined,
    language
  );
  const optionText = formatOptionText(
    item,
    inactive,
    selected && isEditing ? settings : undefined,
    selected && isEditing && item.acceptsNumber ? selectedNumericOption : undefined,
    selected && isEditing && item.key === "studyOrder" ? selectedStudyOrderOption : undefined,
    language
  );
  const editMark = selected && isEditing ? "*" : selected ? ">" : " ";

  if (item.key === "activeVocabularyBook" && item.options) {
    renderVocabularyBookItem(item, value, editMark, selected && isEditing ? settings : undefined, language);
    return;
  }

  formatSettingColumns(
    editMark,
    item.label,
    formatSettingCell(value, isNumericCursor).trimEnd(),
    optionText,
    STANDARD_SETTING_COLUMNS
  ).forEach((line) => console.log(line));
}

function renderVocabularyBookItem(
  item: ConfigItem,
  value: string,
  editMark: string,
  editingSettings: Settings | undefined,
  language: InterfaceLanguage
) {
  const selectedValue = editingSettings?.activeVocabularyBook;
  const options = (item.options ?? []).map((option) => {
    const optionValue = String(option);
    return formatOption(formatOptionValue(optionValue, language), optionValue === selectedValue);
  });

  const optionText = options.length > 0 ? `[${options.join(" / ")}]` : "[]";

  formatSettingColumns(editMark, item.label, value, optionText, STANDARD_SETTING_COLUMNS)
    .forEach((line) => console.log(line));
}

function renderBindingItem(
  item: BindingItem,
  settings: Settings,
  selected: boolean,
  selectedSlot: 0 | 1,
  isCapturing: boolean,
  language: InterfaceLanguage
) {
  const bindings = settings.keyBindings[item.key];
  const first = formatBindingSlot(bindings[0], selected && selectedSlot === 0, isCapturing && selectedSlot === 0, language);
  const second = formatBindingSlot(bindings[1], selected && selectedSlot === 1, isCapturing && selectedSlot === 1, language);
  const mark = selected && isCapturing ? "*" : selected ? ">" : " ";

  formatSettingColumns(mark, item.label, first, second, BINDING_SETTING_COLUMNS)
    .forEach((line) => console.log(line));
}

function formatBindingSlot(
  binding: string,
  selected: boolean,
  isCapturing: boolean,
  language: InterfaceLanguage = "english"
): string {
  if (isCapturing) {
    return blinkingCursor();
  }

  const value = formatBinding(binding, language);
  return selected ? formatOption(value, true) : value;
}

function formatSettingCell(value: string, isNumericCursor: boolean): string {
  if (!isNumericCursor) {
    return value;
  }

  return `${value}${blinkingCursor()}`;
}

function blinkingCursor(): string {
  return "\u001b[5m_\u001b[0m";
}

function formatSettingValue(
  settings: Settings,
  key: keyof Settings,
  editingValue: string | undefined,
  language: InterfaceLanguage
): string {
  if (editingValue !== undefined) {
    return editingValue || "_";
  }

  const value = settings[key];

  if (typeof value === "string") {
    return formatOptionValue(value, language);
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "boolean") {
    return formatOptionValue(value ? "on" : "off", language);
  }

  return "configured";
}

function formatOptionText(
  item: ConfigItem,
  inactive: boolean,
  editingSettings?: Settings,
  selectedNumericOption?: number | "custom",
  selectedStudyOrderOption?: Settings["studyOrder"] | "reshuffle",
  language: InterfaceLanguage = "english"
): string {
  if (inactive) {
    return `[${formatOptionValue("inactive", language)}]`;
  }

  if (item.key === "studyGroupEnabled" || item.key === "navigationLoop") {
    const value = editingSettings?.[item.key];
    return `[${formatOption(formatOptionValue("off", language), value === false)} / ${formatOption(formatOptionValue("on", language), value === true)}]`;
  }

  if (item.key === "studyOrder" && item.options) {
    const value = selectedStudyOrderOption ?? editingSettings?.studyOrder;
    return `[${[...item.options, "reshuffle"].map((option) => formatOption(formatOptionValue(String(option), language), option === value)).join(" / ")}]`;
  }

  if (item.acceptsNumber && item.options) {
    return `[${[...item.options, "custom"].map((option) => formatOption(formatOptionValue(String(option), language), option === selectedNumericOption)).join(" / ")}]`;
  }

  if (item.options && editingSettings) {
    const value = editingSettings[item.key];
    return `[${item.options.map((option) => formatOption(formatOptionValue(String(option), language), option === value)).join(" / ")}]`;
  }

  return item.options ? `[${item.options.map((option) => formatOptionValue(String(option), language)).join(" / ")}]` : `[${formatOptionValue("locked", language)}]`;
}

function formatBinding(binding: string, language: InterfaceLanguage): string {
  const names: Record<string, string> = {
    "": "_",
    space: "Space",
    tab: "Tab",
    "arrow-up": "Up Arrow",
    "arrow-down": "Down Arrow",
    "arrow-left": "Left Arrow",
    "arrow-right": "Right Arrow",
  };

  const value = names[binding] ?? binding.toUpperCase();
  if (language !== "chinese") {
    return value;
  }

  return {
    Space: "空格",
    "Up Arrow": "上方向键",
    "Down Arrow": "下方向键",
    "Left Arrow": "左方向键",
    "Right Arrow": "右方向键",
  }[value] ?? value;
}

function formatOptionValue(value: string, language: InterfaceLanguage): string {
  if (language !== "chinese") {
    return value;
  }

  const names: Record<string, string> = {
    on: "开启",
    off: "关闭",
    inactive: "未启用",
    locked: "暂未开放",
    custom: "自定义",
    sequential: "顺序",
    reverse: "倒序",
    random: "随机",
    reshuffle: "重新随机",
    hidden: "关闭",
    visible: "显示",
    editable: "可编辑",
    english: "英文",
    chinese: "中文",
  };

  return names[value] ?? value;
}

function getSettingsText(language: InterfaceLanguage) {
  if (language === "chinese") {
    return {
      title: "Touch Fish 设置",
      ready: "[INFO] 配置已就绪",
      keyBindings: "按键绑定",
      controlsFirstLine: "操作  W/S 移动 | A/D 修改设置或切换键位 | Enter 编辑 | Backspace 清空",
      controlsSecondLine: "      Esc 取消编辑 / 返回背词 | Ctrl+O 返回背词 | Q 退出",
      bindingHint: "[绑定] 请按英文键、符号、空格、Tab 或方向键；已占用的键会自动清空原位置",
      customHint: "[自定义] 输入正整数后按 Enter 保存；A/D 可切换预设值和自定义",
      editHint: "[编辑] 修改后按 Enter 保存",
      reshuffleHint: "[重新随机] 按空格确认，再按 Enter 执行",
      reshuffleWarning: "[警告] 将替换已保存的随机顺序，并把随机进度重置为 1",
      reshuffleConfirm: "[确认] 按 Enter 重新随机，或按 Esc 取消",
      warningPrefix: "[警告] ",
    };
  }

  return {
    title: "Touch Fish Settings",
    ready: "[INFO] configuration ready",
    keyBindings: "Key Bindings",
    controlsFirstLine: "Controls  W/S move | A/D setting or slot | Enter edit | Backspace clear",
    controlsSecondLine: "          Esc cancel edit / return to word | Ctrl+O return to word | Q quit",
    bindingHint: "[BIND] English key, symbol, Space, Tab, or arrow key; occupied keys clear their previous slot",
    customHint: "[CUSTOM] type a positive whole number, then Enter; A/D cycles presets and custom",
    editHint: "[EDIT] change value, then press Enter to save",
    reshuffleHint: "[RESHUFFLE] Press Space to arm the reset, then press Enter to apply it",
    reshuffleWarning: "[WARN] Reshuffle armed: this replaces the saved random order and resets random progress to 1",
    reshuffleConfirm: "[CONFIRM] Press Enter to reshuffle, or Esc to cancel",
    warningPrefix: "[WARN] ",
  };
}

function formatOption(option: string, selected: boolean): string {
  return selected ? `\u001b[7m${option}\u001b[0m` : option;
}
