import type { APIRoute } from 'astro';
import { connectDB, collections, ObjectId } from '../../lib/mongodb';
import { parseExcelFile, toPriceItems } from '../../lib/excel-parser';

export const POST: APIRoute = async ({ request }) => {
  try {
    await connectDB();
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    
    if (!file || !userId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing file or userId' 
      }), { status: 400 });
    }
    
    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Parse Excel
    const parseResult = parseExcelFile(buffer);
    
    if (!parseResult.success) {
      return new Response(JSON.stringify({
        success: false,
        error: parseResult.errors.join(', ')
      }), { status: 400 });
    }
    
    // Convert to price items
    const priceItems = toPriceItems(parseResult.data, userId);
    
    // Clear existing items for this user and insert new ones
    const priceCollection = collections.priceItems();
    await priceCollection.deleteMany({ userId: new ObjectId(userId) });
    
    if (priceItems.length > 0) {
      await priceCollection.insertMany(priceItems);
    }
    
    return new Response(JSON.stringify({
      success: true,
      rowCount: parseResult.rowCount,
      itemsCount: priceItems.length
    }), { status: 200 });
    
  } catch (error) {
    console.error('Upload error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: String(error)
    }), { status: 500 });
  }
};

export const GET: APIRoute = async ({ url }) => {
  try {
    await connectDB();
    
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing userId' 
      }), { status: 400 });
    }
    
    const priceCollection = collections.priceItems();
    const items = await priceCollection.find({ 
      userId: new ObjectId(userId) 
    }).sort({ category: 1, name: 1 }).toArray();
    
    // Group by category
    const grouped: Record<string, typeof items> = {};
    for (const item of items) {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    }
    
    return new Response(JSON.stringify({
      success: true,
      items,
      grouped,
      count: items.length
    }), { status: 200 });
    
  } catch (error) {
    console.error('Get prices error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: String(error)
    }), { status: 500 });
  }
};
