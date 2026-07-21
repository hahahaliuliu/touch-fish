export interface Word {
  english: string;
  chinese: string;
  phonetic?: string;
  example?: string;
  partOfSpeech?: string;
  note?: string;
  tags?: string[];
}

export interface VocabularyBook {
  id: string;
  name: string;
  description?: string;
  language: {
    source: string;
    target: string;
  };
  version: number;
  words: Word[];
}

export interface VocabularyBookSummary {
  id: string;
  name: string;
  wordCount: number;
}
