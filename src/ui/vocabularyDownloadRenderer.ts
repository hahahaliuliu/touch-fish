import type { DownloadableVocabularyBook } from "../models/vocabularyCatalog.js";

interface RenderVocabularyDownloadOptions {
  books: DownloadableVocabularyBook[];
  installedBookIds: Set<string>;
  selectedIndex: number;
  isLoading: boolean;
  isDownloading: boolean;
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
    "Available Now",
    options,
    (book) => book.availability === "available"
  );
  renderBookSection(
    "Coming Soon",
    options,
    (book) => book.availability === "coming-soon"
  );

  renderSelectedBookDetails(options);

  console.log("");
  console.log("Controls  W/S or Up/Down move | Enter download selected book | Esc return | Q quit");

  if (options.isDownloading) {
    console.log("[INFO] downloading and validating vocabulary book...");
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

  if (selectedBook.availability === "available") {
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
