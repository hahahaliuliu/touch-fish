import type { InterfaceLanguage } from "../models/settings.js";
import type {
  DownloadableVocabularyBook,
  ManagedVocabularyBook,
} from "../models/vocabularyCatalog.js";

interface RenderVocabularyDownloadOptions {
  books: ManagedVocabularyBook[];
  installedBookIds: Set<string>;
  selectedIndex: number;
  isLoading: boolean;
  isDownloading: boolean;
  isConfirmingUninstall: boolean;
  isImporting: boolean;
  importPath: string;
  message: string;
  interfaceLanguage: InterfaceLanguage;
}

export function renderVocabularyDownloadSession(options: RenderVocabularyDownloadOptions) {
  const text = getVocabularyText(options.interfaceLanguage);

  console.clear();
  console.log(text.title);
  console.log("");

  if (options.isLoading) {
    console.log(text.loading);
    return;
  }

  if (options.books.length === 0) {
    console.log(text.noBooks);
  }

  renderBookSection(text.installed, options, text, (book) => options.installedBookIds.has(book.id));
  renderBookSection(text.available, options, text, (book) => book.availability === "available" && !options.installedBookIds.has(book.id));
  renderBookSection(text.comingSoon, options, text, (book) => book.availability === "coming-soon");
  renderImportAction(options, text);
  renderSelectedBookDetails(options, text);

  console.log("");
  renderControls(options, text);

  if (options.isDownloading) {
    console.log(text.downloading);
  }

  if (options.isConfirmingUninstall) {
    const selectedBook = options.books[options.selectedIndex];
    console.log(text.uninstallConfirm(selectedBook?.name ?? text.thisBook));
    console.log(text.uninstallWarning);
    console.log(text.uninstallControls);
  }

  if (options.message) {
    console.log(options.message);
  }
}

function renderControls(options: RenderVocabularyDownloadOptions, text: VocabularyText) {
  const selectedBook = options.books[options.selectedIndex];

  if (options.isImporting) {
    console.log(text.importControls);
    return;
  }

  console.log(text.sharedControls);

  if (options.selectedIndex === options.books.length) {
    console.log(text.importAction);
    return;
  }

  if (!selectedBook) {
    return;
  }

  if (options.installedBookIds.has(selectedBook.id)) {
    console.log(text.uninstallAction);
    return;
  }

  if (selectedBook.availability === "available") {
    console.log(text.downloadAction);
    return;
  }

  console.log(text.comingSoonAction);
}

function renderImportAction(options: RenderVocabularyDownloadOptions, text: VocabularyText) {
  const selected = options.selectedIndex === options.books.length;
  const marker = selected ? ">" : " ";

  console.log(`${marker} ${text.importVocabulary.padEnd(28, " ")} [${text.enterToImport}]`);

  if (options.isImporting) {
    console.log("");
    console.log(text.importPath);
    console.log(`  ${options.importPath || "_"}`);
  }

  console.log("");
}

function renderBookSection(
  title: string,
  options: RenderVocabularyDownloadOptions,
  text: VocabularyText,
  matches: (book: DownloadableVocabularyBook) => boolean
) {
  const rows = options.books
    .map((book, index) => ({ book, index }))
    .filter(({ book }) => matches(book));

  if (rows.length === 0) {
    return;
  }

  console.log(title);

  rows.forEach(({ book, index }) => {
    const marker = index === options.selectedIndex ? ">" : " ";
    const wordCount = book.wordCount ? text.wordCount(book.wordCount) : text.countPending;
    const status = getBookStatus(book, options.installedBookIds, text);
    console.log(`${marker} ${book.name.padEnd(28, " ")} ${wordCount.padEnd(15, " ")} [${status}]`);
  });

  console.log("");
}

function renderSelectedBookDetails(options: RenderVocabularyDownloadOptions, text: VocabularyText) {
  const selectedBook = options.books[options.selectedIndex];

  if (!selectedBook) {
    if (!options.isImporting) {
      console.log(text.selectedAction);
      console.log(`  ${text.importDescription}`);
      console.log(`  ${text.importValidation}`);
    }
    return;
  }

  console.log(text.selectedBook);
  console.log(`  ${selectedBook.description}`);
  console.log(`  ${text.id}: ${selectedBook.id}`);
  console.log(`  ${text.license}: ${selectedBook.license ?? text.pending}`);

  if (options.installedBookIds.has(selectedBook.id)) {
    if (selectedBook.source === "local") {
      console.log(`  ${text.source}: ${text.importedLocally}`);
    }
    console.log(`  ${text.openUninstall}`);
  } else if (selectedBook.availability === "available") {
    console.log(`  ${text.openDownload}`);
  } else {
    console.log(`  ${text.notAvailable}`);
  }
}

function getBookStatus(
  book: DownloadableVocabularyBook,
  installedBookIds: Set<string>,
  text: VocabularyText
): string {
  if (book.availability === "coming-soon") {
    return text.comingSoonStatus;
  }

  return installedBookIds.has(book.id) ? text.installedStatus : text.availableStatus;
}

interface VocabularyText {
  title: string;
  loading: string;
  noBooks: string;
  installed: string;
  available: string;
  comingSoon: string;
  importVocabulary: string;
  enterToImport: string;
  importPath: string;
  sharedControls: string;
  importControls: string;
  importAction: string;
  uninstallAction: string;
  downloadAction: string;
  comingSoonAction: string;
  downloading: string;
  uninstallConfirm: (name: string) => string;
  uninstallWarning: string;
  uninstallControls: string;
  thisBook: string;
  selectedAction: string;
  importDescription: string;
  importValidation: string;
  selectedBook: string;
  id: string;
  license: string;
  pending: string;
  source: string;
  importedLocally: string;
  openUninstall: string;
  openDownload: string;
  notAvailable: string;
  wordCount: (count: number) => string;
  countPending: string;
  installedStatus: string;
  availableStatus: string;
  comingSoonStatus: string;
}

function getVocabularyText(language: InterfaceLanguage): VocabularyText {
  if (language === "chinese") {
    return {
      title: "Touch Fish 词书管理",
      loading: "[INFO] 正在读取在线词书目录...",
      noBooks: "[INFO] 暂无可下载词书",
      installed: "已安装（Enter 卸载）",
      available: "可下载（Enter 下载）",
      comingSoon: "即将提供",
      importVocabulary: "导入本地词书",
      enterToImport: "Enter 导入",
      importPath: "词书文件路径",
      sharedControls: "操作  W/S 或上下方向键移动 | Esc 返回 | Q 退出",
      importControls: "操作  Enter 导入 | Backspace 删除 | Esc 取消",
      importAction: "操作  Enter 开始导入 | 粘贴 JSON、TXT、CSV 或 PDF 文件路径 | Enter 确认",
      uninstallAction: "操作  Enter 卸载 | 再按 Y 确认删除词书和学习进度",
      downloadAction: "操作  Enter 下载当前词书",
      comingSoonAction: "操作  该词书暂未提供下载",
      downloading: "[INFO] 正在下载并校验词书...",
      uninstallConfirm: (name) => `[确认] 要卸载 ${name} 吗？`,
      uninstallWarning: "[警告] 本地词书文件和该词书的全部学习进度都会被删除",
      uninstallControls: "[确认] 按 Y 卸载，或按 Esc 取消",
      thisBook: "当前词书",
      selectedAction: "当前操作",
      importDescription: "从任意本地路径导入 JSON、TXT、CSV 或 PDF 词书文件。",
      importValidation: "文件会先校验，再复制到 Touch Fish 的本地词库。",
      selectedBook: "当前词书",
      id: "编号",
      license: "许可证",
      pending: "待确认",
      source: "来源",
      importedLocally: "本地导入",
      openUninstall: "按 Enter 打开卸载确认",
      openDownload: "按 Enter 下载此词书",
      notAvailable: "该词书已计划，但暂时不能下载",
      wordCount: (count) => `${count} 个单词`,
      countPending: "数量待定",
      installedStatus: "已安装",
      availableStatus: "可下载",
      comingSoonStatus: "即将提供",
    };
  }

  return {
    title: "Touch Fish Vocabulary Download",
    loading: "[INFO] loading remote vocabulary catalog...",
    noBooks: "[INFO] no downloadable vocabulary books are available",
    installed: "Installed (Enter to uninstall)",
    available: "Available to Download (Enter to download)",
    comingSoon: "Coming Soon",
    importVocabulary: "Import Vocabulary File",
    enterToImport: "Enter to import",
    importPath: "Import Path",
    sharedControls: "Controls  W/S or Up/Down move | Esc return | Q quit",
    importControls: "Controls  Enter import | Backspace delete | Esc cancel",
    importAction: "Action    Enter import | paste a JSON, TXT, CSV, or PDF file path | Enter confirm",
    uninstallAction: "Action    Enter uninstall | then press Y to confirm deletion and reset progress",
    downloadAction: "Action    Enter download selected book",
    comingSoonAction: "Action    This book is coming soon and cannot be downloaded yet",
    downloading: "[INFO] downloading and validating vocabulary book...",
    uninstallConfirm: (name) => `[CONFIRM] Uninstall ${name}?`,
    uninstallWarning: "[WARN] The local JSON file and all progress for this book will be deleted",
    uninstallControls: "[CONFIRM] Press Y to uninstall, or Esc to cancel",
    thisBook: "this vocabulary book",
    selectedAction: "Selected Action",
    importDescription: "Import a vocabulary JSON, TXT, CSV, or PDF file from any local path.",
    importValidation: "The file will be validated and copied into Touch Fish.",
    selectedBook: "Selected Book",
    id: "id",
    license: "license",
    pending: "pending",
    source: "source",
    importedLocally: "imported locally",
    openUninstall: "Enter opens uninstall confirmation",
    openDownload: "Enter downloads this book",
    notAvailable: "This book is planned and cannot be downloaded yet",
    wordCount: (count) => `${count} words`,
    countPending: "count pending",
    installedStatus: "installed",
    availableStatus: "available",
    comingSoonStatus: "coming soon",
  };
}
