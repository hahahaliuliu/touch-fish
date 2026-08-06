export interface ReadingBook {
  id: string;
  title: string;
  sourcePath: string;
  content: string;
  characterCount: number;
  chapters: ReadingChapter[];
}

export interface ReadingBookSummary {
  id: string;
  title: string;
  characterCount: number;
}

export interface ReadProgress {
  characterOffset: number;
}

export interface ReadState {
  activeBookId?: string;
}

export interface ReadingPage {
  startOffset: number;
  endOffset: number;
  lines: string[];
}

export interface ReadingChapter {
  title: string;
  startOffset: number;
}
