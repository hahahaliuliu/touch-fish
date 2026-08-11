import type { ReadBindingAction, ReadingBookSummary, ReadMouseWheelMode, ReadSettings } from "../models/reading.js";
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
const MINI_COLUMN_OPTIONS: Array<number | "custom"> = [48, 64, 80, "custom"];
const MINI_ROW_OPTIONS: Array<number | "custom"> = [16, 22, 30, "custom"];
const MINI_FONT_OPTIONS: Array<number | "custom"> = [6, 8, 10, "custom"];
const MINI_MOUSE_MODES: readonly ReadMouseWheelMode[] = ["page", "scroll"];
const MINI_SCROLL_STEP_OPTIONS: Array<number | "custom"> = [1, 2, 3, 5, "custom"];
const INTERFACE_LANGUAGES: readonly InterfaceLanguage[] = ["english", "chinese"];
const THEMES: readonly ThemeName[] = ["build-log", "backend-log", "git"];
const MAIN_BINDING_ACTIONS: ReadBindingAction[] = [
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
const MAIN_BINDING_START_INDEX = 7;
const MINI_WINDOW_ITEM_INDEX = 13;
const MINI_COLUMNS_ITEM_INDEX = 14;
const MINI_ROWS_ITEM_INDEX = 15;
const MINI_FONT_ITEM_INDEX = 16;
const MINI_MOUSE_ITEM_INDEX = 17;
const MINI_SCROLL_STEP_ITEM_INDEX = 18;
const MINI_WINDOW_BINDING_ITEM_INDEX = 19;

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

  console.log("");
  console.log(text.keyBindings);
  MAIN_BINDING_ACTIONS.forEach((action, index) => {
    const itemIndex = index + MAIN_BINDING_START_INDEX;
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
  console.log(text.miniWindowSettings);
  renderConfigItem(
    MINI_WINDOW_ITEM_INDEX,
    selectedIndex,
    false,
    text.miniWindow,
    miniModeActive ? text.close : text.open,
    ""
  );
  renderConfigItem(
    MINI_COLUMNS_ITEM_INDEX,
    selectedIndex,
    isEditing,
    text.miniWindowWidth,
    formatNumericValue(settings.miniWindowColumns, customInput, selectedIndex === MINI_COLUMNS_ITEM_INDEX && isEditing, selectedNumericOption, false, language),
    formatNumericOptions(MINI_COLUMN_OPTIONS, selectedNumericOption, selectedIndex === MINI_COLUMNS_ITEM_INDEX && isEditing, false, language)
  );
  renderConfigItem(
    MINI_ROWS_ITEM_INDEX,
    selectedIndex,
    isEditing,
    text.miniWindowHeight,
    formatNumericValue(settings.miniWindowRows, customInput, selectedIndex === MINI_ROWS_ITEM_INDEX && isEditing, selectedNumericOption, false, language),
    formatNumericOptions(MINI_ROW_OPTIONS, selectedNumericOption, selectedIndex === MINI_ROWS_ITEM_INDEX && isEditing, false, language)
  );
  renderConfigItem(
    MINI_FONT_ITEM_INDEX,
    selectedIndex,
    isEditing,
    text.miniWindowFont,
    formatNumericValue(settings.miniWindowFontSize, customInput, selectedIndex === MINI_FONT_ITEM_INDEX && isEditing, selectedNumericOption, false, language),
    formatNumericOptions(MINI_FONT_OPTIONS, selectedNumericOption, selectedIndex === MINI_FONT_ITEM_INDEX && isEditing, false, language)
  );
  renderConfigItem(
    MINI_MOUSE_ITEM_INDEX,
    selectedIndex,
    isEditing,
    text.miniWindowMouse,
    formatMouseMode(settings.miniWindowMouseMode, language),
    formatValueOptions(
      MINI_MOUSE_MODES,
      settings.miniWindowMouseMode,
      selectedIndex === MINI_MOUSE_ITEM_INDEX && isEditing,
      (value) => formatMouseMode(value, language)
    )
  );
  renderConfigItem(
    MINI_SCROLL_STEP_ITEM_INDEX,
    selectedIndex,
    isEditing,
    text.miniWindowScrollStep,
    formatScrollStepValue(
      settings.miniWindowScrollStep,
      customInput,
      selectedIndex === MINI_SCROLL_STEP_ITEM_INDEX && isEditing,
      selectedNumericOption,
      language
    ),
    formatScrollStepOptions(
      MINI_SCROLL_STEP_OPTIONS,
      selectedNumericOption,
      selectedIndex === MINI_SCROLL_STEP_ITEM_INDEX && isEditing,
      language
    )
  );

  renderBindingItem(
    getBindingLabel(text, "toggleMiniWindow", settings.chapterSectionCount > 0),
    settings.keyBindings.toggleMiniWindow,
    MINI_WINDOW_BINDING_ITEM_INDEX === selectedIndex,
    selectedBindingSlot,
    isBindingCapture && MINI_WINDOW_BINDING_ITEM_INDEX === selectedIndex,
    language
  );

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
  } else if (isEditing && selectedIndex >= MINI_COLUMNS_ITEM_INDEX && selectedIndex <= MINI_FONT_ITEM_INDEX) {
    console.log(text.miniWindowHint);
  } else if (isEditing && selectedIndex === MINI_SCROLL_STEP_ITEM_INDEX) {
    console.log(text.scrollStepHint);
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
    "mouse-middle": "Middle Mouse",
    "mouse-right": "Right Mouse",
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
    "Middle Mouse": "鼠标中键",
    "Right Mouse": "鼠标右键",
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

function formatMouseMode(value: ReadMouseWheelMode, language: InterfaceLanguage): string {
  if (language === "chinese") {
    return value === "page" ? "左右翻页" : "上下滚动";
  }
  return value === "page" ? "page" : "scroll";
}

function formatScrollStepValue(
  value: number,
  customInput: string,
  editing: boolean,
  selectedOption: number | "custom" | undefined,
  language: InterfaceLanguage
): string {
  if (editing && selectedOption === "custom") {
    return `${customInput}${blinkingCursor()}`;
  }
  return language === "chinese" ? `${value} 行` : `${value} lines`;
}

function formatScrollStepOptions(
  options: Array<number | "custom">,
  selectedOption: number | "custom" | undefined,
  editing: boolean,
  language: InterfaceLanguage
): string {
  return `[${options.map((option) => {
    const label = option === "custom"
      ? language === "chinese" ? "自定义" : "custom"
      : language === "chinese" ? `${option} 行` : `${option}`;
    return formatOption(label, editing && option === selectedOption);
  }).join(" / ")}]`;
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
      miniWindowWidth: "小窗口宽度",
      miniWindowHeight: "小窗口高度",
      miniWindowFont: "小窗口字体",
      miniWindowMouse: "鼠标滚轮",
      miniWindowScrollStep: "滚动速率",
      keyBindings: "按键绑定",
      miniWindowSettings: "小窗口设置",
      close: "[关闭]",
      bindingLabels: {
        previousPage: "上一页",
        nextPage: "下一页",
        previousChapter: "上一章",
        nextChapter: "下一章",
        repeat: "重复操作",
        toggleHelp: "打开帮助",
        toggleMiniWindow: "小窗口开关",
      } satisfies Record<ReadBindingAction, string>,
      previousSection: "上一小节",
      nextSection: "下一小节",
      controlsFirstLine: "操作  W/S 移动 | A/D 修改设置或切换键位 | Enter 编辑 | Backspace 清空",
      controlsSecondLine: "      Esc 取消编辑 / 返回阅读 | Ctrl+O 返回阅读 | Q 退出",
      bindingHint: "[绑定] 请按英文键、符号、空格、Tab、方向键、中键或右键；已占用的键会自动清空原位置",
      widthHint: "[编辑] A/D 移动选项光标；自动适配会按终端宽度和当前主题计算正文宽度",
      lineHint: "[自定义] 输入 1 到 100 的整数后按 Enter 保存；A/D 可切换预设和自定义",
      sectionHint: "[编辑] 关闭时 W/S 跳章节；开启后按自然段分为阅读小节，输入 2 到 20 的整数可自定义份数",
      miniWindowHint: "[编辑] 宽度和高度使用终端列数与行数；拖动小窗口后会自动保存实际尺寸",
      scrollStepHint: "[自定义] 输入 1 到 100 的整数，表示每次滚轮移动的正文行数",
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
    miniWindowWidth: "Mini Window Width",
    miniWindowHeight: "Mini Window Height",
    miniWindowFont: "Mini Window Font",
    miniWindowMouse: "Mouse Wheel",
    miniWindowScrollStep: "Scroll Speed",
    keyBindings: "Key Bindings",
    miniWindowSettings: "Mini Window Settings",
    close: "[close]",
    bindingLabels: {
      previousPage: "Previous Page",
      nextPage: "Next Page",
      previousChapter: "Previous Chapter",
      nextChapter: "Next Chapter",
      repeat: "Repeat Action",
      toggleHelp: "Toggle Help",
      toggleMiniWindow: "Toggle Mini Window",
    } satisfies Record<ReadBindingAction, string>,
    previousSection: "Previous Section",
    nextSection: "Next Section",
    controlsFirstLine: "Controls  W/S move | A/D setting or slot | Enter edit | Backspace clear",
    controlsSecondLine: "          Esc cancel edit / return to read | Ctrl+O return to read | Q quit",
    bindingHint: "[BIND] English key, symbol, Space, Tab, arrow key, Middle Mouse, or Right Mouse; occupied bindings move",
    widthHint: "[EDIT] A/D moves the option cursor; auto uses the terminal width and current theme",
    lineHint: "[CUSTOM] enter a whole number from 1 to 100, then Enter; A/D cycles presets and custom",
    sectionHint: "[EDIT] off makes W/S jump chapters; enabled splits at paragraphs, with 2 to 20 custom parts",
    miniWindowHint: "[EDIT] width and height use terminal columns and rows; dragging the mini window saves its actual size",
    scrollStepHint: "[CUSTOM] enter a whole number from 1 to 100 for lines moved by each wheel step",
    editHint: "[EDIT] change the value, then press Enter to save",
    warningPrefix: "[WARN] ",
  };
}
