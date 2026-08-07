import type { ReadBindingAction, ReadingBookSummary, ReadSettings } from "../models/reading.js";
import type { InterfaceLanguage, ThemeName } from "../models/settings.js";
import {
  BINDING_SETTING_COLUMNS,
  formatSettingColumns,
  STANDARD_SETTING_COLUMNS,
} from "./settingColumns.js";

export interface RenderReadSettingsOptions {
  books: ReadingBookSummary[];
  activeBookId?: string | undefined;
  settings: ReadSettings;
  selectedIndex: number;
  selectedBindingSlot: 0 | 1;
  isEditing: boolean;
  customInput: string;
  selectedNumericOption?: number | "custom" | undefined;
  isBindingCapture: boolean;
  editError: string;
  statusMessage: string;
  miniModeActive: boolean;
}

const WIDTH_OPTIONS: Array<number | "custom"> = [0, 30, 50, "custom"];
const LINE_OPTIONS: Array<number | "custom"> = [5, 10, 15, "custom"];
const SECTION_OPTIONS: Array<number | "custom"> = [0, 2, 3, 5, "custom"];
const INTERFACE_LANGUAGES: readonly InterfaceLanguage[] = ["english", "chinese"];
const THEMES: readonly ThemeName[] = ["build-log", "backend-log", "git"];
const BINDING_ACTIONS: ReadBindingAction[] = [
  "previousPage",
  "nextPage",
  "previousChapter",
  "nextChapter",
  "repeat",
  "toggleHelp",
];
const WIDTH_ITEM_INDEX = 0;
const LINE_ITEM_INDEX = 1;
const SECTION_ITEM_INDEX = 2;
const LANGUAGE_ITEM_INDEX = 3;
const CURRENT_BOOK_ITEM_INDEX = 4;
const IMPORT_ITEM_INDEX = 5;
const THEME_ITEM_INDEX = 6;
const MINI_WINDOW_ITEM_INDEX = 7;
const BINDING_START_INDEX = 8;

export function renderReadSettings(options: RenderReadSettingsOptions) {
  const {
    books,
    activeBookId,
    settings,
    selectedIndex,
    selectedBindingSlot,
    isEditing,
    customInput,
    selectedNumericOption,
    isBindingCapture,
    editError,
    statusMessage,
    miniModeActive,
  } = options;
  const language = settings.interfaceLanguage;
  const text = getText(language);
  const activeBook = books.find((book) => book.id === activeBookId) ?? books[0];

  console.clear();
  console.log(text.ready);
  console.log("");
  console.log(text.title);
  console.log("");
  renderConfigItem(
    WIDTH_ITEM_INDEX,
    selectedIndex,
    isEditing,
    text.contentWidth,
    formatNumericValue(settings.contentWidth, customInput, selectedIndex === WIDTH_ITEM_INDEX && isEditing, selectedNumericOption, true, language),
    formatNumericOptions(WIDTH_OPTIONS, selectedNumericOption, selectedIndex === WIDTH_ITEM_INDEX && isEditing, true, language)
  );
  renderConfigItem(
    LINE_ITEM_INDEX,
    selectedIndex,
    isEditing,
    text.pageLines,
    formatNumericValue(settings.pageLineCount, customInput, selectedIndex === LINE_ITEM_INDEX && isEditing, selectedNumericOption, false, language),
    formatNumericOptions(LINE_OPTIONS, selectedNumericOption, selectedIndex === LINE_ITEM_INDEX && isEditing, false, language)
  );
  renderConfigItem(
    SECTION_ITEM_INDEX,
    selectedIndex,
    isEditing,
    text.chapterSections,
    formatSectionValue(settings.chapterSectionCount, customInput, selectedIndex === SECTION_ITEM_INDEX && isEditing, selectedNumericOption, language),
    formatSectionOptions(SECTION_OPTIONS, selectedNumericOption, selectedIndex === SECTION_ITEM_INDEX && isEditing, language)
  );
  renderConfigItem(
    LANGUAGE_ITEM_INDEX,
    selectedIndex,
    isEditing,
    text.interfaceLanguage,
    formatLanguage(settings.interfaceLanguage, language),
    formatValueOptions(INTERFACE_LANGUAGES, settings.interfaceLanguage, selectedIndex === LANGUAGE_ITEM_INDEX && isEditing, (value) => formatLanguage(value, language))
  );
  renderConfigItem(
    CURRENT_BOOK_ITEM_INDEX,
    selectedIndex,
    isEditing,
    text.currentBook,
    activeBook?.title ?? text.noBooks,
    formatBookOptions(books, activeBookId, selectedIndex === CURRENT_BOOK_ITEM_INDEX && isEditing)
  );
  renderConfigItem(
    IMPORT_ITEM_INDEX,
    selectedIndex,
    false,
    text.importNovel,
    text.open,
    ""
  );
  renderConfigItem(
    THEME_ITEM_INDEX,
    selectedIndex,
    isEditing,
    text.theme,
    settings.theme,
    formatValueOptions(THEMES, settings.theme, selectedIndex === THEME_ITEM_INDEX && isEditing, String)
  );
  renderConfigItem(
    MINI_WINDOW_ITEM_INDEX,
    selectedIndex,
    false,
    text.miniWindow,
    miniModeActive ? text.close : text.open,
    ""
  );

  console.log("");
  console.log(text.keyBindings);
  BINDING_ACTIONS.forEach((action, index) => {
    const itemIndex = index + BINDING_START_INDEX;
    renderBindingItem(
      getBindingLabel(text, action, settings.chapterSectionCount > 0),
      settings.keyBindings[action],
      itemIndex === selectedIndex,
      selectedBindingSlot,
      isBindingCapture && itemIndex === selectedIndex,
      language
    );
  });

  console.log("");
  console.log(text.controlsFirstLine);
  console.log(text.controlsSecondLine);

  if (isBindingCapture) {
    console.log(text.bindingHint);
  } else if (isEditing && selectedIndex === WIDTH_ITEM_INDEX) {
    console.log(text.widthHint);
  } else if (isEditing && selectedIndex === LINE_ITEM_INDEX) {
    console.log(text.lineHint);
  } else if (isEditing && selectedIndex === SECTION_ITEM_INDEX) {
    console.log(text.sectionHint);
  } else if (isEditing) {
    console.log(text.editHint);
  }

  if (editError) {
    console.log(`${text.warningPrefix}${editError}`);
  }

  if (statusMessage) {
    console.log(statusMessage);
  }
}

function renderConfigItem(
  index: number,
  selectedIndex: number,
  isEditing: boolean,
  label: string,
  value: string,
  optionText: string
) {
  const marker = index === selectedIndex ? (isEditing ? "*" : ">") : " ";
  formatSettingColumns(marker, label, value, optionText, STANDARD_SETTING_COLUMNS)
    .forEach((line) => console.log(line));
}

function renderBindingItem(
  label: string,
  bindings: [string, string],
  selected: boolean,
  selectedSlot: 0 | 1,
  isCapturing: boolean,
  language: InterfaceLanguage
) {
  const first = formatBindingSlot(bindings[0], selected && selectedSlot === 0, isCapturing && selectedSlot === 0, language);
  const second = formatBindingSlot(bindings[1], selected && selectedSlot === 1, isCapturing && selectedSlot === 1, language);
  const marker = selected && isCapturing ? "*" : selected ? ">" : " ";

  formatSettingColumns(marker, label, first, second, BINDING_SETTING_COLUMNS)
    .forEach((line) => console.log(line));
}

function formatBindingSlot(binding: string, selected: boolean, isCapturing: boolean, language: InterfaceLanguage): string {
  if (isCapturing) {
    return blinkingCursor();
  }

  const value = formatBinding(binding, language);
  return selected ? formatOption(value, true) : value;
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

function formatBookOptions(books: ReadingBookSummary[], activeBookId: string | undefined, editing: boolean): string {
  if (books.length === 0) {
    return "";
  }

  return `[${books.map((book) => formatOption(book.title, editing && book.id === activeBookId)).join(" / ")}]`;
}

function formatNumericValue(
  value: number,
  customInput: string,
  editing: boolean,
  selectedOption: number | "custom" | undefined,
  isWidth: boolean,
  language: InterfaceLanguage
): string {
  if (editing && selectedOption === "custom") {
    return `${customInput}${blinkingCursor()}`;
  }

  return isWidth && value === 0 ? formatAutomatic(language) : String(value);
}

function formatNumericOptions(
  options: Array<number | "custom">,
  selectedOption: number | "custom" | undefined,
  editing: boolean,
  isWidth: boolean,
  language: InterfaceLanguage
): string {
  return `[${options.map((option) => {
    const label = option === "custom"
      ? language === "chinese" ? "自定义" : "custom"
      : isWidth && option === 0 ? formatAutomatic(language) : String(option);
    return formatOption(label, editing && option === selectedOption);
  }).join(" / ")}]`;
}

function formatSectionValue(
  value: number,
  customInput: string,
  editing: boolean,
  selectedOption: number | "custom" | undefined,
  language: InterfaceLanguage
): string {
  if (editing && selectedOption === "custom") {
    return `${customInput}${blinkingCursor()}`;
  }

  if (value === 0) {
    return language === "chinese" ? "关闭" : "off";
  }

  return language === "chinese" ? `${value} 份` : `${value} parts`;
}

function formatSectionOptions(
  options: Array<number | "custom">,
  selectedOption: number | "custom" | undefined,
  editing: boolean,
  language: InterfaceLanguage
): string {
  return `[${options.map((option) => {
    const label = option === "custom"
      ? language === "chinese" ? "自定义" : "custom"
      : option === 0
        ? language === "chinese" ? "关闭" : "off"
        : language === "chinese" ? `${option} 份` : `${option} parts`;
    return formatOption(label, editing && option === selectedOption);
  }).join(" / ")}]`;
}

function getBindingLabel(
  text: ReturnType<typeof getText>,
  action: ReadBindingAction,
  sectionNavigationEnabled: boolean
): string {
  if (sectionNavigationEnabled && action === "previousChapter") {
    return text.previousSection;
  }
  if (sectionNavigationEnabled && action === "nextChapter") {
    return text.nextSection;
  }
  return text.bindingLabels[action];
}

function formatValueOptions<T>(
  options: readonly T[],
  currentValue: T,
  editing: boolean,
  formatter: (value: T) => string
): string {
  return `[${options.map((option) => formatOption(formatter(option), editing && option === currentValue)).join(" / ")}]`;
}

function formatLanguage(value: InterfaceLanguage, language: InterfaceLanguage): string {
  if (language === "chinese") {
    return value === "chinese" ? "中文" : "英文";
  }
  return value === "chinese" ? "Chinese" : "English";
}

function formatAutomatic(language: InterfaceLanguage): string {
  return language === "chinese" ? "自动适配" : "auto";
}

function formatOption(value: string, selected: boolean): string {
  return selected ? `\u001b[7m${value}\u001b[0m` : value;
}

function blinkingCursor(): string {
  return "\u001b[5m_\u001b[0m";
}

function getText(language: InterfaceLanguage) {
  if (language === "chinese") {
    return {
      ready: "[INFO] 阅读设置已就绪",
      title: "阅读设置",
      currentBook: "当前小说",
      importNovel: "导入 TXT 小说",
      open: "[打开]",
      noBooks: "暂无本地小说",
      contentWidth: "正文宽度",
      pageLines: "每页行数",
      chapterSections: "章节切分",
      interfaceLanguage: "界面语言",
      theme: "伪装主题",
      miniWindow: "小窗口阅读",
      keyBindings: "按键绑定",
      close: "[关闭]",
      bindingLabels: {
        previousPage: "上一页",
        nextPage: "下一页",
        previousChapter: "上一章",
        nextChapter: "下一章",
        repeat: "重复操作",
        toggleHelp: "打开帮助",
      } satisfies Record<ReadBindingAction, string>,
      previousSection: "上一小节",
      nextSection: "下一小节",
      controlsFirstLine: "操作  W/S 移动 | A/D 修改设置或切换键位 | Enter 编辑 | Backspace 清空",
      controlsSecondLine: "      Esc 取消编辑 / 返回阅读 | Ctrl+O 返回阅读 | Q 退出",
      bindingHint: "[绑定] 请按英文键、符号、空格、Tab 或方向键；已占用的键会自动清空原位置",
      widthHint: "[编辑] A/D 移动选项光标；自动适配会按终端宽度和当前主题计算正文宽度",
      lineHint: "[自定义] 输入 1 到 100 的整数后按 Enter 保存；A/D 可切换预设和自定义",
      sectionHint: "[编辑] 关闭时 W/S 跳章节；开启后按自然段分为阅读小节，输入 2 到 20 的整数可自定义份数",
      editHint: "[编辑] 修改后按 Enter 保存",
      warningPrefix: "[警告] ",
    };
  }

  return {
    ready: "[INFO] Read settings ready",
    title: "Read Settings",
    currentBook: "Current Book",
    importNovel: "Import TXT Novel",
    open: "[open]",
    noBooks: "No local novels",
    contentWidth: "Content Width",
    pageLines: "Page Lines",
    chapterSections: "Chapter Sections",
    interfaceLanguage: "Interface Language",
    theme: "Disguise Theme",
    miniWindow: "Mini Window Reading",
    keyBindings: "Key Bindings",
    close: "[close]",
    bindingLabels: {
      previousPage: "Previous Page",
      nextPage: "Next Page",
      previousChapter: "Previous Chapter",
      nextChapter: "Next Chapter",
      repeat: "Repeat Action",
      toggleHelp: "Toggle Help",
    } satisfies Record<ReadBindingAction, string>,
    previousSection: "Previous Section",
    nextSection: "Next Section",
    controlsFirstLine: "Controls  W/S move | A/D setting or slot | Enter edit | Backspace clear",
    controlsSecondLine: "          Esc cancel edit / return to read | Ctrl+O return to read | Q quit",
    bindingHint: "[BIND] English key, symbol, Space, Tab, or arrow key; occupied keys clear their previous slot",
    widthHint: "[EDIT] A/D moves the option cursor; auto uses the terminal width and current theme",
    lineHint: "[CUSTOM] enter a whole number from 1 to 100, then Enter; A/D cycles presets and custom",
    sectionHint: "[EDIT] off makes W/S jump chapters; enabled splits at paragraphs, with 2 to 20 custom parts",
    editHint: "[EDIT] change the value, then press Enter to save",
    warningPrefix: "[WARN] ",
  };
}
