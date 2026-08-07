import type { InterfaceLanguage } from "../models/settings.js";
import type { ReadingImportCandidate } from "../services/readingImport.js";

export type ReadingConflictChoice = "replace" | "keep-both" | "cancel";

interface RenderReadingImportOptions {
  interfaceLanguage: InterfaceLanguage;
  importPath: string;
  candidate?: ReadingImportCandidate | undefined;
  conflictChoice: ReadingConflictChoice;
  message: string;
}

const CONFLICT_CHOICES: readonly ReadingConflictChoice[] = ["replace", "keep-both", "cancel"];

export function renderReadingImport(options: RenderReadingImportOptions) {
  const text = getText(options.interfaceLanguage);

  console.clear();
  console.log(text.title);
  console.log("");
  console.log(text.ready);
  console.log("");

  if (options.candidate) {
    console.log(text.conflictTitle);
    console.log(`  ${text.file}: ${options.candidate.fileName}`);
    console.log(`  ${text.destination}: ${options.candidate.destinationPath}`);
    console.log("");
    console.log(`[${CONFLICT_CHOICES.map((choice) => formatOption(text.choices[choice], choice === options.conflictChoice)).join(" / ")}]`);
    console.log("");
    console.log(text.conflictControls);
  } else {
    console.log(text.pathLabel);
    console.log(`  ${options.importPath}${blinkingCursor()}`);
    console.log("");
    console.log(text.description);
    console.log(text.validation);
    console.log("");
    console.log(text.pathControls);
  }

  if (options.message) {
    console.log(options.message);
  }
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
      title: "Touch Fish 小说导入",
      ready: "[INFO] 本地 TXT 小说导入已就绪",
      pathLabel: "小说文件路径",
      description: "从任意本地路径导入 UTF-8 TXT 小说，文件会复制到 Touch Fish。",
      validation: "导入前会检查扩展名、UTF-8 编码和正文内容。",
      pathControls: "操作  Enter 导入 | Backspace 删除 | Esc / Ctrl+O 返回设置 | Ctrl+C 退出",
      conflictTitle: "[确认] 已存在同名小说",
      file: "文件",
      destination: "目标位置",
      choices: { replace: "替换", "keep-both": "保留两本", cancel: "取消" },
      conflictControls: "操作  A/D 切换选项 | Enter 确认 | Esc 返回路径输入",
    };
  }

  return {
    title: "Touch Fish Novel Import",
    ready: "[INFO] local TXT novel import ready",
    pathLabel: "Novel File Path",
    description: "Import a UTF-8 TXT novel from any local path; the file is copied into Touch Fish.",
    validation: "The extension, UTF-8 encoding, and text content are validated before import.",
    pathControls: "Controls  Enter import | Backspace delete | Esc / Ctrl+O return | Ctrl+C quit",
    conflictTitle: "[CONFIRM] A novel with this name already exists",
    file: "file",
    destination: "destination",
    choices: { replace: "replace", "keep-both": "keep both", cancel: "cancel" },
    conflictControls: "Controls  A/D choose | Enter confirm | Esc return to path input",
  };
}
