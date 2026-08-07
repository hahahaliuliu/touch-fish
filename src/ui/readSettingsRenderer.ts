import type { ReadBindingAction, ReadingBookSummary, ReadSettings } from "../models/reading.js";

export interface RenderReadSettingsOptions {
  books: ReadingBookSummary[];
  activeBookId?: string | undefined;
  settings: ReadSettings;
  selectedIndex: number;
  isEditing: boolean;
  customInput: string;
  selectedNumericOption?: number | "custom" | undefined;
  isBindingCapture: boolean;
  editError: string;
}

const LABELS = ["当前小说", "正文宽度", "每页行数"];
const BINDING_LABELS: Array<[ReadBindingAction, string]> = [
  ["previousPage", "上一页"],
  ["nextPage", "下一页"],
  ["previousChapter", "上一章"],
  ["nextChapter", "下一章"],
  ["repeat", "重复操作"],
  ["toggleHelp", "打开帮助"],
];

export function renderReadSettings(options: RenderReadSettingsOptions) {
  const {
    books,
    activeBookId,
    settings,
    selectedIndex,
    isEditing,
    customInput,
    selectedNumericOption,
    isBindingCapture,
    editError,
  } = options;
  const activeBook = books.find((book) => book.id === activeBookId) ?? books[0];

  console.clear();
  console.log("[INFO] 阅读设置已就绪");
  console.log("");
  console.log("阅读设置");
  console.log("");
  renderItem(
    0,
    selectedIndex,
    isEditing,
    LABELS[0]!,
    activeBook?.title ?? "暂无本地小说",
    formatBookOptions(books, activeBookId, selectedIndex === 0 && isEditing)
  );
  renderItem(
    1,
    selectedIndex,
    isEditing,
    LABELS[1]!,
    formatNumericValue(settings.contentWidth, customInput, selectedIndex === 1 && isEditing, selectedNumericOption, true),
    formatNumericOptions(WIDTH_OPTIONS, selectedNumericOption, selectedIndex === 1 && isEditing, true)
  );
  renderItem(
    2,
    selectedIndex,
    isEditing,
    LABELS[2]!,
    formatNumericValue(settings.pageLineCount, customInput, selectedIndex === 2 && isEditing, selectedNumericOption, false),
    formatNumericOptions(LINE_OPTIONS, selectedNumericOption, selectedIndex === 2 && isEditing, false)
  );
  console.log("");
  console.log("按键绑定");
  BINDING_LABELS.forEach(([key, label], index) => {
    const itemIndex = index + 3;
    const marker = itemIndex === selectedIndex ? (isBindingCapture ? "*" : ">") : " ";
    console.log(`${marker} ${label.padEnd(8)} ${isBindingCapture && itemIndex === selectedIndex ? blinkingCursor() : formatBinding(settings.keyBindings[key])}`);
  });
  console.log("");
  console.log("W/S 移动 | Enter 编辑、保存或绑定 | A/D 切换选项");
  console.log("输入数字设置自定义值 | Ctrl+O 返回或启动阅读 | Esc 取消编辑或返回 | Q 退出");

  if (isEditing && selectedIndex === 1) {
    console.log("[编辑] A/D 移动选项光标；“自动适配”会按终端宽度和当前主题计算正文宽度。");
  } else if (isEditing && selectedIndex === 2) {
    console.log("[编辑] A/D 移动选项光标；选择“自定义”后输入 1 到 100 的整数。");
  } else if (isEditing && selectedIndex === 0) {
    console.log("[编辑] A/D 移动小说光标，按 Enter 保存。");
  }

  if (isBindingCapture) {
    console.log("按键捕获中：按下新的按键，Esc 取消。");
  }

  if (editError) {
    console.log(`[警告] ${editError}`);
  }
}

const WIDTH_OPTIONS: Array<number | "custom"> = [0, 30, 50, "custom"];
const LINE_OPTIONS: Array<number | "custom"> = [5, 10, 15, "custom"];

function formatBinding(binding: [string, string]): string {
  return binding.filter(Boolean).map(formatBindingName).join(" / ");
}

function formatBindingName(binding: string): string {
  const labels: Record<string, string> = {
    "arrow-up": "上方向键",
    "arrow-down": "下方向键",
    "arrow-left": "左方向键",
    "arrow-right": "右方向键",
    space: "空格",
  };

  return labels[binding] ?? binding.toUpperCase();
}

function renderItem(index: number, selectedIndex: number, isEditing: boolean, label: string, value: string, options: string) {
  const marker = index === selectedIndex ? (isEditing ? "*" : ">") : " ";
  console.log(`${marker} ${label.padEnd(8)} ${value} ${options}`);
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
  isWidth: boolean
): string {
  if (editing && selectedOption === "custom") {
    return `${customInput}${blinkingCursor()}`;
  }

  return isWidth && value === 0 ? "自动适配" : String(value);
}

function formatNumericOptions(
  options: Array<number | "custom">,
  selectedOption: number | "custom" | undefined,
  editing: boolean,
  isWidth: boolean
): string {
  return `[${options.map((option) => {
    const label = option === "custom" ? "自定义" : isWidth && option === 0 ? "自动适配" : String(option);
    return formatOption(label, editing && option === selectedOption);
  }).join(" / ")}]`;
}

function formatOption(value: string, selected: boolean): string {
  return selected ? `\u001b[7m${value}\u001b[0m` : value;
}

function blinkingCursor(): string {
  return "\u001b[5m_\u001b[0m";
}
