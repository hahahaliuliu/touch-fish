export type VocabularyCatalogAvailability = "available" | "coming-soon";

export interface DownloadableVocabularyBook {
  id: string;
  name: string;
  description: string;
  availability: VocabularyCatalogAvailability;
  wordCount?: number;
  version?: number;
  license?: string;
  sourceUrl?: string;
  downloadUrl?: string;
}

export interface VocabularyCatalog {
  version: number;
  books: DownloadableVocabularyBook[];
}
