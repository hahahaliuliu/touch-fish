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

export interface ManagedVocabularyBook extends DownloadableVocabularyBook {
  source: "catalog" | "local";
}

export interface VocabularyCatalog {
  version: number;
  books: DownloadableVocabularyBook[];
}
