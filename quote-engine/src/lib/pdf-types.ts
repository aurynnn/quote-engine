// PDF Parser Types

export interface PDFExtractOptions {
  /** Maximum number of pages to process */
  maxPages?: number;
}

export interface PDFExtractResult {
  success: boolean;
  text: string;
  pageCount: number;
  metadata?: Record<string, unknown>;
  error?: string;
}
