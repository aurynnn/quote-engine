import type { APIRoute } from 'astro';
import { connectDB, collections, ObjectId } from '../../../lib/mongodb';

export const GET: APIRoute = async ({ url }) => {
  try {
    await connectDB();
    
    const userId = url.searchParams.get('userId');
    const quoteId = url.searchParams.get('quoteId');
    
    if (!userId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing userId' 
      }), { status: 400 });
    }
    
    const quotesCollection = collections.quotes();
    
    // Get single quote
    if (quoteId) {
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
      
      return new Response(JSON.stringify({ success: true, quote }), { 
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=15, s-maxage=30',
          'Vary': 'Authorization'
        }
      });
    }
    
    // Get all quotes for user with pagination
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100); // Cap at 100
    const skip = (page - 1) * limit;
    
    const [quotes, total] = await Promise.all([
      quotesCollection
        .find({ userId: new ObjectId(userId) })
        .sort({ generatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      quotesCollection.countDocuments({ userId: new ObjectId(userId) })
    ]);
    
    return new Response(JSON.stringify({ 
      success: true, 
      quotes,
      count: quotes.length,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    }), { 
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=15, s-maxage=30',
        'Vary': 'Authorization'
      }
    });
    
  } catch (error) {
    console.error('Get quotes error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: String(error)
    }), { status: 500 });
  }
};

export const PATCH: APIRoute = async ({ request }) => {
  try {
    await connectDB();
    
    const body = await request.json();
    const { quoteId, userId, status, items, clientName, clientEmail } = body;
    
    if (!quoteId || !userId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing quoteId or userId' 
      }), { status: 400 });
    }
    
    const quotesCollection = collections.quotes();
    
    // Build update object
    const update: Record<string, unknown> = { updatedAt: new Date() };
    
    if (status) update.status = status;
    if (items) {
      update.items = items;
      update.subtotal = items.reduce((sum: number, item: { total: number }) => sum + item.total, 0);
      update.total = update.subtotal;
    }
    if (clientName) update.clientName = clientName;
    if (clientEmail) update.clientEmail = clientEmail;
    
    const result = await quotesCollection.findOneAndUpdate(
      { _id: new ObjectId(quoteId), userId: new ObjectId(userId) },
      { $set: update },
      { returnDocument: 'after' }
    );
    
    if (!result) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Quote not found' 
      }), { status: 404 });
    }
    
    return new Response(JSON.stringify({ success: true, quote: result }), { status: 200 });
    
  } catch (error) {
    console.error('Update quote error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: String(error)
    }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    await connectDB();
    
    const body = await request.json();
    const { quoteId, userId } = body;
    
    if (!quoteId || !userId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing quoteId or userId' 
      }), { status: 400 });
    }
    
    const quotesCollection = collections.quotes();
    
    const result = await quotesCollection.deleteOne({ 
      _id: new ObjectId(quoteId),
      userId: new ObjectId(userId)
    });
    
    if (result.deletedCount === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Quote not found' 
      }), { status: 404 });
    }
    
    return new Response(JSON.stringify({ success: true }), { status: 200 });
    
  } catch (error) {
    console.error('Delete quote error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: String(error)
    }), { status: 500 });
  }
};
