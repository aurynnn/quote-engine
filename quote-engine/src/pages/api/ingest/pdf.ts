import type { APIRoute } from 'astro';
import { extractTextFromPDF, parsePricingDataFromText } from '../../../lib/pdf-parser';

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing file'
      }), { status: 400 });
    }
    
    // Validate file type
    if (!file.type.includes('pdf')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'File must be a PDF'
      }), { status: 400 });
    }
    
    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Extract text from PDF
    const extractResult = await extractTextFromPDF(buffer);
    
    if (!extractResult.success) {
      return new Response(JSON.stringify({
        success: false,
        error: extractResult.error || 'Failed to extract text from PDF'
      }), { status: 400 });
    }
    
    // Try to parse structured pricing data from the text
    const parsedData = parsePricingDataFromText(extractResult.text);
    
    return new Response(JSON.stringify({
      success: true,
      extractedText: extractResult.text,
      pageCount: extractResult.pageCount,
      parsedItems: parsedData.success ? parsedData.data : [],
      metadata: extractResult.metadata
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error('PDF upload error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: String(error)
    }), { status: 500 });
  }
};
