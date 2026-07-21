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
}

export function renderVocabularyDownloadSession(options: RenderVocabularyDownloadOptions) {
  console.clear();
  console.log("Touch Fish Vocabulary Download");
  console.log("");

  if (options.isLoading) {
    console.log("[INFO] loading remote vocabulary catalog...");
    return;
  }

  if (options.books.length === 0) {
    console.log("[INFO] no downloadable vocabulary books are available");
  }

  renderBookSection(
    "Installed (Enter to uninstall)",
    options,
    (book) => options.installedBookIds.has(book.id)
  );
  renderBookSection(
    "Available to Download (Enter to download)",
    options,
    (book) => book.availability === "available" && !options.installedBookIds.has(book.id)
  );
  renderBookSection(
    "Coming Soon",
    options,
    (book) => book.availability === "coming-soon"
  );

  renderImportAction(options);

  renderSelectedBookDetails(options);

  console.log("");
  renderControls(options);

  if (options.isDownloading) {
    console.log("[INFO] downloading and validating vocabulary book...");
  }

  if (options.isConfirmingUninstall) {
    const selectedBook = options.books[options.selectedIndex];
    console.log(`[CONFIRM] Uninstall ${selectedBook?.name ?? "this vocabulary book"}?`);
    console.log("[WARN] The local JSON file and all progress for this book will be deleted");
    console.log("[CONFIRM] Press Y to uninstall, or Esc to cancel");
  }

  if (options.message) {
    console.log(options.message);
  }
}

function renderControls(options: RenderVocabularyDownloadOptions) {
  const selectedBook = options.books[options.selectedIndex];
  const sharedControls = "W/S or Up/Down move | Esc return | Q quit";

  if (options.isImporting) {
    console.log("Controls  Enter import | Backspace delete | Esc cancel");
    return;
  }

  if (options.selectedIndex === options.books.length) {
    console.log(`Controls  ${sharedControls}`);
    console.log("Action    Enter import | paste your JSON file's full path | Enter confirm");
    return;
  }

  if (!selectedBook) {
    console.log(`Controls  ${sharedControls}`);
    return;
  }

  if (options.installedBookIds.has(selectedBook.id)) {
    console.log(`Controls  ${sharedControls}`);
    console.log("Action    Enter uninstall | then press Y to confirm deletion and reset progress");
    return;
  }

  if (selectedBook.availability === "available") {
    console.log(`Controls  ${sharedControls}`);
    console.log("Action    Enter download selected book");
    return;
  }

  console.log(`Controls  ${sharedControls}`);
  console.log("Action    This book is coming soon and cannot be downloaded yet");
}

function renderImportAction(options: RenderVocabularyDownloadOptions) {
  const selected = options.selectedIndex === options.books.length;
  const marker = selected ? ">" : " ";

  console.log(`${marker} Import Local JSON             [Enter to import]`);

  if (options.isImporting) {
    console.log("");
    console.log("Import Path");
    console.log(`  ${options.importPath || "_"}`);
  }

  console.log("");
}

function renderBookSection(
  title: string,
  options: RenderVocabularyDownloadOptions,
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
    const wordCount = book.wordCount ? `${book.wordCount} words` : "count pending";
    const status = getBookStatus(book, options.installedBookIds);
    console.log(`${marker} ${book.name.padEnd(28, " ")} ${wordCount.padEnd(15, " ")} [${status}]`);
  });

  console.log("");
}

function renderSelectedBookDetails(options: RenderVocabularyDownloadOptions) {
  const selectedBook = options.books[options.selectedIndex];

  if (!selectedBook) {
    if (!options.isImporting) {
      console.log("Selected Action");
      console.log("  Import a vocabulary JSON file from any local path.");
      console.log("  The file will be validated and copied into Touch Fish.");
    }
    return;
  }

  console.log("Selected Book");
  console.log(`  ${selectedBook.description}`);
  console.log(`  id: ${selectedBook.id}`);
  console.log(`  license: ${selectedBook.license ?? "pending"}`);

  if (options.installedBookIds.has(selectedBook.id)) {
    if (selectedBook.source === "local") {
      console.log("  source: imported locally");
    }
    console.log("  Enter opens uninstall confirmation");
  } else if (selectedBook.availability === "available") {
    console.log("  Enter downloads this book");
  } else {
    console.log("  This book is planned and cannot be downloaded yet");
  }
}

function getBookStatus(book: DownloadableVocabularyBook, installedBookIds: Set<string>): string {
  if (book.availability === "coming-soon") {
    return "coming soon";
  }

  return installedBookIds.has(book.id) ? "installed" : "available";
}
