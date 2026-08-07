import type { ReadBindingAction, ReadingBookSummary, ReadSettings } from "../models/reading.js";

export interface RenderReadSettingsOptions {
  books: ReadingBookSummary[];
  activeBookId?: string | undefined;
  settings: ReadSettings;
  selectedIndex: number;
  isEditing: boolean;
  customInput: string;
  isBindingCapture: boolean;
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
  const { books, activeBookId, settings, selectedIndex, isEditing, customInput, isBindingCapture } = options;
  const activeBook = books.find((book) => book.id === activeBookId) ?? books[0];

  console.clear();
  console.log("[INFO] 阅读设置已就绪");
  console.log("");
  console.log("阅读设置");
  console.log("");
  renderItem(0, selectedIndex, isEditing, LABELS[0]!, activeBook?.title ?? "暂无本地小说", books.length > 0 ? `[${books.map((book) => book.title).join(" / ")}]` : "");
  renderItem(1, selectedIndex, isEditing, LABELS[1]!, formatWidth(settings.contentWidth, customInput, selectedIndex === 1 && isEditing), "[自动 / 30 / 50 / 自定义]");
  renderItem(2, selectedIndex, isEditing, LABELS[2]!, formatLineCount(settings.pageLineCount, customInput, selectedIndex === 2 && isEditing), "[5 / 10 / 15 / 自定义]");
  console.log("");
  console.log("按键绑定");
  BINDING_LABELS.forEach(([key, label], index) => {
    const itemIndex = index + 3;
    const marker = itemIndex === selectedIndex ? (isBindingCapture ? "*" : ">") : " ";
    console.log(`${marker} ${label.padEnd(8)} ${formatBinding(settings.keyBindings[key])}`);
  });
  console.log("");
  console.log("W/S 移动 | Enter 编辑、保存或绑定 | A/D 切换选项");
  console.log("输入数字设置自定义值 | Ctrl+O 返回或启动阅读 | Esc 取消编辑或返回 | Q 退出");

  if (isEditing && selectedIndex !== 0) {
    console.log("编辑中：选择“自定义”后直接输入数字，再按 Enter 保存。");
  }

  if (isBindingCapture) {
    console.log("按键捕获中：按下新的按键，Esc 取消。");
  }
}

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

function formatWidth(value: number, customInput: string, editing: boolean): string {
  if (editing && customInput) {
    return `${customInput}_`;
  }

  return value === 0 ? "自动" : String(value);
}

function formatLineCount(value: number, customInput: string, editing: boolean): string {
  return editing && customInput ? `${customInput}_` : String(value);
}
