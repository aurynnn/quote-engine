// PDF Text Extraction Utility
// Uses pdf-parse to extract text content from uploaded PDF files

import type { PDFExtractResult, PDFExtractOptions } from './pdf-types';

// Lazy-load pdf-parse to reduce initial bundle size
let pdfParse: typeof import('pdf-parse') | null = null;

async function getPdfParse() {
  if (!pdfParse) {
    pdfParse = await import('pdf-parse');
  }
  return pdfParse;
}

/**
 * Extract text from a PDF buffer
 */
export async function extractTextFromPDF(
  buffer: Buffer,
  options: PDFExtractOptions = {}
): Promise<PDFExtractResult> {
  const { maxPages = 100 } = options;
  
  try {
    const pdf = await getPdfParse();
    
    // Limit pages to prevent memory issues with large PDFs
    const options = {
      max: maxPages,
      hint: {
        // This is a hint for pdf-parse to limit memory usage
        // Actual behavior depends on pdf-parse implementation
      }
    };
    
    const data = await pdf.default(buffer, options);
    
    if (!data || !data.text) {
      return {
        success: false,
        text: '',
        pageCount: 0,
        error: 'No text content found in PDF'
      };
    }
    
    return {
      success: true,
      text: data.text,
      pageCount: data.numpages,
      metadata: data.info || undefined
    };
    
  } catch (error) {
    return {
      success: false,
      text: '',
      pageCount: 0,
      error: `Failed to extract PDF text: ${error}`
    };
  }
}

/**
 * Parse structured data from extracted PDF text
 * Looks for common pricing table patterns
 */
export function parsePricingDataFromText(text: string): {
  success: boolean;
  data: Array<{
    category: string;
    name: string;
    unit: string;
    price: string;
  }>;
} {
  const lines = text.split('\n').filter(line => line.trim());
  const items: Array<{ category: string; name: string; unit: string; price: string }> = [];
  
  // Common patterns for pricing items
  // Try to match lines like:
  // - "Development $100 hour"
  // - "Web Design - €75/hr"
  // - "Server Setup: €150/item"
  
  const pricePattern = /(?:€|£|\$|USD|EUR)?\s*(\d+(?:[.,]\d{2})?)\s*(?:\/|per)\s*(hour|hr|item|unit|page|word|day|month|project)?/i;
  
  let currentCategory = 'General';
  
  // Category keywords that indicate a new section
  const categoryKeywords = [
    'labor', 'materials', 'services', 'development', 'design',
    'consulting', 'support', 'maintenance', 'hosting', 'domain'
  ];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Check if this line is a category header
    const lowerLine = trimmed.toLowerCase();
    const isCategory = categoryKeywords.some(cat => 
      lowerLine === cat || lowerLine === `${cat}s` || lowerLine.startsWith(`${cat}:`)
    );
    
    if (isCategory && !trimmed.match(pricePattern)) {
      currentCategory = trimmed.replace(/:$/, '').replace(/s$/, '').replace(/^./, c => c.toUpperCase());
      continue;
    }
    
    // Try to match pricing pattern
    const match = trimmed.match(pricePattern);
    if (match) {
      // Extract the name (everything before the price)
      const name = trimmed.slice(0, match.index).replace(/[-:]+$/, '').trim();
      const price = match[1];
      const unit = match[2] || 'item';
      
      if (name && name.length > 2) {
        items.push({
          category: currentCategory,
          name,
          unit: unit.toLowerCase(),
          price
        });
      }
    }
  }
  
  return {
    success: items.length > 0,
    data: items
  };
}
