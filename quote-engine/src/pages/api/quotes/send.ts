import type { APIRoute } from 'astro';
import { collections, ObjectId } from '../../../lib/mongodb';
import { sendQuoteToClient } from '../../../lib/email';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { quoteId, userId } = body;
    
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
    
    if (!quote.clientEmail) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No client email address' 
      }), { status: 400 });
    }
    
    // Send email
    const sent = await sendQuoteToClient(quote);
    
    if (!sent) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to send email' 
      }), { status: 500 });
    }
    
    // Update quote status
    await quotesCollection.updateOne(
      { _id: new ObjectId(quoteId) },
      { $set: { status: 'sent', updatedAt: new Date() } }
    );
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Quote sent successfully' 
    }), { status: 200 });
    
  } catch (error) {
    console.error('Send quote error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: String(error)
    }), { status: 500 });
  }
};
