import type { APIRoute } from 'astro';
import { connectDB, collections, ObjectId } from '../../../lib/mongodb';

export const GET: APIRoute = async ({ url }) => {
  try {
    await connectDB();
    
    const userId = url.searchParams.get('userId');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    if (!userId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing userId query parameter' 
      }), { status: 400 });
    }
    
    const quotesCollection = collections.quotes();
    
    const [quotes, total] = await Promise.all([
      quotesCollection
        .find({ userId: new ObjectId(userId) })
        .sort({ generatedAt: -1 })
        .skip(offset)
        .limit(limit)
        .toArray(),
      quotesCollection.countDocuments({ userId: new ObjectId(userId) })
    ]);
    
    return new Response(JSON.stringify({ 
      success: true, 
      quotes,
      count: quotes.length,
      total,
      limit,
      offset
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
