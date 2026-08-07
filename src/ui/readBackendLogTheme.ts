import type { RenderReadSessionOptions } from "./readRenderer.js";
import { getTerminalColumns, truncateTerminalText } from "./terminalText.js";

export function renderBackendLogReadSession(options: RenderReadSessionOptions) {
  const { book, page, pageIndex, pageTotal, chapterIndex } = options;
  const chapter = book.chapters[chapterIndex] ?? book.chapters[0]!;
  const timestamp = new Date().toISOString();
  const sectionStatus = options.sectionNavigationEnabled && options.sectionIndex !== undefined && options.sectionTotal !== undefined
    ? ` section=${options.sectionIndex + 1}/${options.sectionTotal}`
    : "";

  console.clear();
  console.log(`${timestamp} INFO  reader-api booting service=local-reading`);
  console.log(`${timestamp} INFO  book opened id=${book.id}`);
  console.log(`${timestamp} DEBUG chapter resolved index=${chapterIndex + 1}`);
  console.log("");

  page.lines.forEach((line, index) => {
    const id = String(page.startOffset + index).padStart(3, "0");
    console.log(truncateTerminalText(
      `${timestamp} DEBUG read fragment=${id} text=${JSON.stringify(line)}`,
      getTerminalColumns()
    ));

    if (line === chapter.title) {
      console.log("");
    }
  });

  console.log("");
  console.log(`${timestamp} INFO  page served current=${pageIndex + 1}/${pageTotal} chapter=${chapterIndex + 1}/${book.chapters.length}${sectionStatus}`);
  console.log(`${timestamp} INFO  checkpoint offset=${page.startOffset}`);
  console.log("service: ready");
  console.log(">");
}

export function renderBackendLogReadQuitMessage() {
  const timestamp = new Date().toISOString();

  console.clear();
  console.log(`${timestamp} INFO  reading checkpoint saved`);
  console.log(`${timestamp} INFO  reader-api shutdown complete`);
}
