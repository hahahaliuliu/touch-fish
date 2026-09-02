import type { InterfaceLanguage, KeyBindings, NoteMode, Settings, ThemeName } from "../models/settings.js";
import { listVocabularyBooks } from "../services/vocabularyLoader.js";

/**
 * Data-driven model of the Word settings screen. The session builds the item
 * list, and the renderer consumes it, so the types and the item factory live
 * here instead of being duplicated in both modules.
 */

export const WORKSPACE_SIZES = [1, 3, 5];
export const STUDY_GROUP_SIZES = [10, 20, 30];
export const STUDY_ORDERS: Array<Settings["studyOrder"]> = ["sequential", "reverse", "random"];
export const AVAILABLE_THEMES: readonly ThemeName[] = ["build-log", "backend-log", "git"];
export const INTERFACE_LANGUAGES: readonly InterfaceLanguage[] = ["english", "chinese"];
export const NOTE_MODES: readonly NoteMode[] = ["hidden", "visible", "editable"];

export interface ConfigItem {
  kind: "setting";
  key: keyof Settings;
  label: string;
  options?: readonly unknown[];
  acceptsNumber?: boolean;
}

export interface BindingItem {
  kind: "binding";
  key: keyof KeyBindings;
  label: string;
}

export interface ActionItem {
  kind: "action";
  id: "download-vocabulary" | "view-favorites";
  label: string;
}

export type SettingItem = ConfigItem | BindingItem | ActionItem;

export function createSettingItems(language: InterfaceLanguage): SettingItem[] {
  const vocabularyBookIds = listVocabularyBooks().map((book) => book.id);
  const labels = getSettingLabels(language);

  return [
    { kind: "setting", key: "studyGroupEnabled", label: labels.groupVocabulary, options: [false, true] },
    { kind: "setting", key: "workspaceSize", label: labels.pageSize, options: WORKSPACE_SIZES, acceptsNumber: true },
    { kind: "setting", key: "dailyWordCount", label: labels.groupSize, options: STUDY_GROUP_SIZES, acceptsNumber: true },
    { kind: "setting", key: "navigationLoop", label: labels.navigationLoop, options: [false, true] },
    { kind: "setting", key: "interfaceLanguage", label: labels.interfaceLanguage, options: INTERFACE_LANGUAGES },
    { kind: "setting", key: "noteMode", label: labels.notes, options: NOTE_MODES },
    { kind: "setting", key: "studyOrder", label: labels.studyOrder, options: STUDY_ORDERS },
    { kind: "setting", key: "activeVocabularyBook", label: labels.vocabularyBook, options: vocabularyBookIds },
    { kind: "action", id: "view-favorites", label: language === "chinese" ? "查看收藏" : "View Favorites" },
    { kind: "action", id: "download-vocabulary", label: labels.downloadVocabulary },
    { kind: "setting", key: "theme", label: labels.theme, options: AVAILABLE_THEMES },
    { kind: "binding", key: "previous", label: labels.previousPage },
    { kind: "binding", key: "next", label: labels.nextPage },
    { kind: "binding", key: "previousGroup", label: labels.previousGroup },
    { kind: "binding", key: "nextGroup", label: labels.nextGroup },
    { kind: "binding", key: "repeat", label: labels.repeatNavigation },
    { kind: "binding", key: "switchDisplayMode", label: labels.switchDisplay },
    { kind: "binding", key: "startQuiz", label: labels.startQuiz },
    { kind: "binding", key: "editNote", label: labels.editNote },
    { kind: "binding", key: "toggleHelp", label: labels.toggleHelp },
  ];
}

function getSettingLabels(language: InterfaceLanguage) {
  if (language === "chinese") {
    return {
      groupVocabulary: "单词分组",
      pageSize: "每页数量",
      groupSize: "分组大小",
      navigationLoop: "翻页循环",
      interfaceLanguage: "界面语言",
      notes: "备注",
      studyOrder: "学习顺序",
      vocabularyBook: "当前词书",
      downloadVocabulary: "下载或导入词书",
      theme: "伪装主题",
      previousPage: "上一页",
      nextPage: "下一页",
      previousGroup: "上一组",
      nextGroup: "下一组",
      repeatNavigation: "重复翻页",
      switchDisplay: "切换单词显示",
      startQuiz: "开始组内测试",
      editNote: "编辑备注",
      toggleHelp: "打开帮助",
    };
  }

  return {
    groupVocabulary: "Group Vocabulary",
    pageSize: "Page Size",
    groupSize: "Group Size",
    navigationLoop: "Navigation Loop",
    interfaceLanguage: "Interface Language",
    notes: "Notes",
    studyOrder: "Study Order",
    vocabularyBook: "Vocabulary Book",
    downloadVocabulary: "Download Vocabulary",
    theme: "Theme",
    previousPage: "Previous Page",
    nextPage: "Next Page",
    previousGroup: "Previous Group",
    nextGroup: "Next Group",
    repeatNavigation: "Repeat Navigation",
    switchDisplay: "Switch Display",
    startQuiz: "Start Group Quiz",
    editNote: "Edit Notes",
    toggleHelp: "Toggle Help",
  };
}
