import type { Word } from "../models/word.js";
import type {
  DisplayMode,
  InterfaceLanguage,
  KeyBindings,
  NoteMode,
  StudyOrder,
} from "../models/settings.js";
import { getTerminalColumns, getTerminalWidth, truncateTerminalText, wrapTerminalText } from "./terminalText.js";

interface RenderLogThemeOptions {
  words: Word[];
  current: number;
  total: number;
  workspaceSize: number;
  studyGroupStart: number;
  studyGroupEnd: number;
  studyGroupCurrent: number;
  studyGroupTotal: number;
  studyGroupEnabled: boolean;
  navigationLoop: boolean;
  studyOrder: StudyOrder;
  keyBindings: KeyBindings;
  displayMode: DisplayMode;
  noteMode: NoteMode;
  noteSelectionIndex?: number | undefined;
  interfaceLanguage: InterfaceLanguage;
  showHelp: boolean;
}

export function renderLogTheme(options: RenderLogThemeOptions) {
  const {
    words,
    current,
    total,
    workspaceSize,
    studyGroupStart,
    studyGroupEnd,
    studyGroupCurrent,
    studyGroupTotal,
    studyGroupEnabled,
    navigationLoop,
    studyOrder,
    keyBindings,
    displayMode,
    noteMode,
    noteSelectionIndex,
    interfaceLanguage,
    showHelp,
  } = options;

  console.clear();

  if (showHelp) {
    renderLogHelp({
      current,
      total,
      windowSize: words.length,
      workspaceSize,
      studyGroupStart,
      studyGroupEnd,
      studyGroupCurrent,
      studyGroupTotal,
      studyGroupEnabled,
      navigationLoop,
      studyOrder,
      keyBindings,
      noteMode,
      interfaceLanguage,
    });
    return;
  }

  console.log("[INFO] compiling workspace...");
  console.log("[INFO] resolving dependency graph...");
  console.log("[INFO] loading cached transform results...");
  console.log(`[INFO] modules transformed: ${words.length + 37}`);
  console.log("[INFO] generating optimized chunks...");
  console.log("[INFO] sealing asset pipeline...");
  console.log("");
  console.log("assets by status  cached modules");
  console.log("  runtime modules 698 bytes 4 modules");
  console.log("  modules by path ./src/cache/ 1.24 KiB");
  console.log("  modules by path ./node_modules/ 8.15 KiB");
  console.log("    ./node_modules/commander/index.js 2.91 KiB [built]");
  console.log("    ./node_modules/tsx/dist/cli.mjs 1.42 KiB [built]");
  console.log("    + 2 modules");
  console.log("");
  console.log("cache entries by path ./src/cache/");

  words.forEach((word, index) => {
    const id = String(current + index).padStart(3, "0");
    const token = `token_${id}`;
    const value = `"${getDisplayValue(word, displayMode)}"`;

    formatModuleLines(id, token, value, word, displayMode, noteMode, noteSelectionIndex === index)
      .forEach((line) => console.log(line));
  });

  console.log("");
  console.log("[INFO] emitted 3 cache entries");
  console.log("[INFO] build completed successfully in 42ms");
  console.log("[INFO] watching for file changes...");
  console.log("runtime: idle");
  console.log(">");
}

interface RenderLogHelpOptions {
  current: number;
  total: number;
  windowSize: number;
  workspaceSize: number;
  studyGroupStart: number;
  studyGroupEnd: number;
  studyGroupCurrent: number;
  studyGroupTotal: number;
  studyGroupEnabled: boolean;
  navigationLoop: boolean;
  studyOrder: StudyOrder;
  keyBindings: KeyBindings;
  noteMode: NoteMode;
  interfaceLanguage: InterfaceLanguage;
}

function renderLogHelp(options: RenderLogHelpOptions) {
  const {
    current,
    total,
    windowSize,
    workspaceSize,
    studyGroupStart,
    studyGroupEnd,
    studyGroupCurrent,
    studyGroupTotal,
    studyGroupEnabled,
    navigationLoop,
    studyOrder,
    keyBindings,
    noteMode,
    interfaceLanguage,
  } = options;

  const text = getHelpText(interfaceLanguage);

  console.log(text.title);
  console.log("");
  console.log(text.navigation);
  console.log(`  ${formatBindings(keyBindings.previous, interfaceLanguage).padEnd(21, " ")}${text.previousPage}`);
  console.log(`  ${formatBindings(keyBindings.next, interfaceLanguage).padEnd(21, " ")}${text.nextPage}`);
  console.log(`  ${formatBindings(keyBindings.previousGroup, interfaceLanguage).padEnd(21, " ")}${text.previousGroup}`);
  console.log(`  ${formatBindings(keyBindings.nextGroup, interfaceLanguage).padEnd(21, " ")}${text.nextGroup}`);
  console.log(`  ${formatBindings(keyBindings.repeat, interfaceLanguage).padEnd(21, " ")}${text.repeatNavigation}`);
  console.log("");
  console.log(text.actions);
  console.log(`  ${formatBindings(keyBindings.switchDisplayMode, interfaceLanguage).padEnd(21, " ")}${text.switchDisplay}`);
  console.log(`  ${formatBindings(keyBindings.startQuiz, interfaceLanguage).padEnd(21, " ")}${text.startQuiz}`);
  if (noteMode === "editable") {
    console.log(`  ${formatBindings(keyBindings.editNote, interfaceLanguage).padEnd(21, " ")}${text.editNote}`);
  }
  console.log(`  ${"Ctrl+O".padEnd(21, " ")}${text.openSettings}`);
  console.log(`  ${formatBindings(keyBindings.toggleHelp, interfaceLanguage).padEnd(21, " ")}${text.closeHelp}`);
  console.log(`  ${"Esc".padEnd(21, " ")}${text.returnToWord}`);
  console.log(`  ${"Q".padEnd(21, " ")}${text.quit}`);
  console.log("");
  console.log(text.currentWorkspace);
  console.log(`  ${text.position.padEnd(21, " ")}${current} / ${total}`);
  console.log(`  ${text.pageSize.padEnd(21, " ")}${workspaceSize}`);
  console.log(`  ${text.visibleEntries.padEnd(21, " ")}${windowSize}`);
  console.log(`  ${text.grouping.padEnd(21, " ")}${studyGroupEnabled ? text.enabled : text.disabled}`);
  console.log(`  ${text.group.padEnd(21, " ")}${studyGroupCurrent} / ${studyGroupTotal}`);
  console.log(`  ${text.groupRange.padEnd(21, " ")}${studyGroupStart}-${studyGroupEnd}`);
  console.log(`  ${text.navigationLoop.padEnd(21, " ")}${navigationLoop ? text.enabled : text.disabled}`);
  console.log(`  ${text.studyOrder.padEnd(21, " ")}${studyOrder === "sequential" ? text.sequential : text.random}`);
}

function getHelpText(language: InterfaceLanguage) {
  if (language === "chinese") {
    return {
      title: "Touch Fish 帮助",
      navigation: "导航",
      previousPage: "上一页",
      nextPage: "下一页",
      previousGroup: "上一组",
      nextGroup: "下一组",
      repeatNavigation: "重复上次翻页",
      actions: "操作",
      switchDisplay: "切换单词显示",
      startQuiz: "开始组内测试",
      editNote: "编辑当前页备注",
      openSettings: "打开设置",
      closeHelp: "关闭帮助",
      returnToWord: "返回背词",
      quit: "退出",
      currentWorkspace: "当前学习区",
      position: "当前位置",
      pageSize: "每页数量",
      visibleEntries: "当前显示",
      grouping: "分组学习",
      group: "当前分组",
      groupRange: "分组范围",
      navigationLoop: "循环翻页",
      studyOrder: "学习顺序",
      enabled: "开启",
      disabled: "关闭",
      sequential: "顺序",
      random: "随机",
    };
  }

  return {
    title: "Touch Fish Help",
    navigation: "Navigation",
    previousPage: "previous page",
    nextPage: "next page",
    previousGroup: "previous group",
    nextGroup: "next group",
    repeatNavigation: "repeat last page navigation",
    actions: "Display",
    switchDisplay: "switch display mode",
    startQuiz: "start group quiz",
    editNote: "edit a note on this page",
    openSettings: "open settings",
    closeHelp: "close help",
    returnToWord: "return to word",
    quit: "quit",
    currentWorkspace: "Current Workspace",
    position: "position",
    pageSize: "page size",
    visibleEntries: "visible entries",
    grouping: "grouping",
    group: "group",
    groupRange: "group range",
    navigationLoop: "navigation loop",
    studyOrder: "study order",
    enabled: "enabled",
    disabled: "disabled",
    sequential: "sequential",
    random: "random",
  };
}

function formatBindings(bindings: [string, string], language: InterfaceLanguage): string {
  return bindings.filter(Boolean).map((binding) => formatBinding(binding, language)).join(" / ") || "unbound";
}

function formatBinding(binding: string, language: InterfaceLanguage): string {
  const names: Record<string, string> = {
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

function getDisplayValue(word: Word, displayMode: DisplayMode): string {
  if (displayMode === "chinese") {
    return word.chinese;
  }

  return word.english;
}

function formatModuleLines(
  id: string,
  token: string,
  value: string,
  word: Word,
  displayMode: DisplayMode,
  noteMode: NoteMode,
  isSelected: boolean
): string[] {
  const modulePath = `  cache/${id}.ts`;
  const prefix = isSelected ? ">" : "";
  const rawNote = noteMode === "hidden" || !word.note ? "" : word.note;
  const linePrefix = `${prefix}${modulePath.padEnd(16, " ")} `;

  if (!rawNote) {
    return [formatModuleLine(linePrefix, value, word, displayMode, "")];
  }

  if (displayMode === "both") {
    const inlineLine = `${linePrefix}${value} // ${word.chinese} | note: ${rawNote}`;

    if (getTerminalWidth(inlineLine) <= getTerminalColumns()) {
      return [inlineLine];
    }
  } else {
    const rawInlineLine = `${linePrefix}${value} // note: ${rawNote}`;

    if (getTerminalWidth(rawInlineLine) <= getTerminalColumns()) {
      return [rawInlineLine];
    }
  }

  const baseLine = formatModuleLine(linePrefix, value, word, displayMode, "");
  const notePrefix = "    note: ";
  const noteContinuationPrefix = "             ";
  const noteContentWidth = Math.max(1, getTerminalColumns() - getTerminalWidth(notePrefix));
  const noteContentLines = wrapTerminalText(rawNote, noteContentWidth);

  return [
    baseLine,
    `${notePrefix}${noteContentLines[0] ?? ""}`,
    ...noteContentLines.slice(1).map((line) => `${noteContinuationPrefix}${line}`),
  ];
}

function formatModuleLine(
  linePrefix: string,
  value: string,
  word: Word,
  displayMode: DisplayMode,
  suffix: string
): string {
  if (displayMode === "both") {
    const content = `${value} // ${word.chinese}${suffix ? ` |${suffix.slice(3)}` : ""}`;
    const availableWidth = Math.max(1, getTerminalColumns() - getTerminalWidth(linePrefix));

    return `${linePrefix}${truncateTerminalText(content, availableWidth)}`;
  }

  const availableValueWidth = Math.max(
    8,
    getTerminalColumns() - getTerminalWidth(linePrefix) - getTerminalWidth(suffix)
  );

  return `${linePrefix}${truncateTerminalText(value, availableValueWidth)}${suffix}`;
}

export function renderLogQuitMessage() {
  console.clear();

  console.log("[INFO] progress saved");
  console.log("[INFO] workspace closed");
}
