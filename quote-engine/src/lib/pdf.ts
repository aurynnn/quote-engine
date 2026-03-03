// PDF Generator for Quotes
import { generateQuotePDF } from './pdf-generator';

export async function generatePDF(quote: any): Promise<Buffer> {
  return generateQuotePDF(quote);
}
