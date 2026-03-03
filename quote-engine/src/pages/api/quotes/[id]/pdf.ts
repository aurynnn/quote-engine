import type { APIRoute } from 'astro';
import { collections, ObjectId } from '../../lib/mongodb';
import { generateQuoteHTML } from '../../lib/pdf-generator';

export const GET: APIRoute = async ({ url }) => {
  try {
    const quoteId = url.searchParams.get('id');
    const userId = url.searchParams.get('userId');
    const format = url.searchParams.get('format') || 'html';
    
    if (!quoteId || !userId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing quoteId or userId' 
      }), { status: 400 });
    }
    
    const quotesCollection = collections.quotes();
    const quote = await quotesCollection.findOne({ 
      _id: new ObjectId(quoteId),
      userId: new ObjectId(userId)
    });
    
    if (!quote) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Quote not found' 
      }), { status: 404 });
    }
    
    if (format === 'html') {
      const html = generateQuoteHTML(quote);
      
      return new Response(html, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `attachment; filename="quote-${quote.quoteNumber}.html"`
        }
      });
    }
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Unsupported format' 
    }), { status: 400 });
    
  } catch (error) {
    console.error('PDF generation error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: String(error)
    }), { status: 500 });
  }
};
