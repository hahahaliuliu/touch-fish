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
    "Installed",
    options,
    (book) => options.installedBookIds.has(book.id)
  );
  renderBookSection(
    "Available to Download",
    options,
    (book) => book.availability === "available" && !options.installedBookIds.has(book.id)
  );
  renderBookSection(
    "Coming Soon",
    options,
    (book) => book.availability === "coming-soon"
  );

  renderSelectedBookDetails(options);

  console.log("");
  console.log("Controls  W/S or Up/Down move | Enter download or uninstall | Esc return | Q quit");

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
