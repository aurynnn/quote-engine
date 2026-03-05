import type { APIRoute } from 'astro';
import { connectDB, collections, ObjectId } from '../../lib/mongodb';
import { parseExcelFile, toPriceItems } from '../../lib/excel-parser';

export const POST: APIRoute = async ({ request }) => {
  try {
    await connectDB();
    
    const contentType = request.headers.get('content-type') || '';
    let userId = '';
    let priceItems: any[] = [];
    
    // Parse request based on content type
    if (contentType.includes('application/json')) {
      const body = await request.json();
      userId = body.userId;
      
      // Handle sample data (items array)
      if (body.items && Array.isArray(body.items)) {
        priceItems = body.items.map((item: any) => ({
          userId: new ObjectId(userId),
          category: item.category || 'General',
          name: item.name || 'Item',
          unit: item.unit || 'piece',
          basePrice: parseFloat(item.basePrice) || 0,
          minPrice: parseFloat(item.minPrice) || 0,
          createdAt: new Date()
        }));
        
        // Clear and insert
        const priceCollection = collections.priceItems();
        await priceCollection.deleteMany({ userId: new ObjectId(userId) });
        
        if (priceItems.length > 0) {
          await priceCollection.insertMany(priceItems);
        }
        
        return new Response(JSON.stringify({
          success: true,
          itemsCount: priceItems.length
        }), { status: 200 });
      }
      
      // JSON file upload - get file from body
      // This path not fully implemented for JSON file upload
    }
    
    // Handle multipart form data (file upload)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      userId = formData.get('userId') as string;
      
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
      const parseResult = await parseExcelFile(buffer);
      
      if (!parseResult.success) {
        return new Response(JSON.stringify({
          success: false,
          error: parseResult.errors.join(', ')
        }), { status: 400 });
      }
      
      // Convert to price items
      priceItems = toPriceItems(parseResult.data, userId);
      
      // Clear existing and insert new
      const priceCollection = collections.priceItems();
      await priceCollection.deleteMany({ userId: new ObjectId(userId) });
      
      if (priceItems.length > 0) {
        await priceCollection.insertMany(priceItems);
      }
      
      return new Response(JSON.stringify({
        success: true,
        rowCount: parseResult.rowCount,
        itemsCount: priceItems.length,
        items: priceItems.map(item => ({
          ...item,
          _id: item._id?.toString()
        }))
      }), { status: 200 });
    }
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Invalid Content-Type. Use multipart/form-data or application/json' 
    }), { status: 400 });
    
  } catch (error) {
    console.error('Upload error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
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
    const items = await priceCollection.find({ userId: new ObjectId(userId) }).toArray();
    
    return new Response(JSON.stringify({
      success: true,
      items: items.map(item => ({
        ...item,
        _id: item._id?.toString()
      }))
    }), { status: 200 });
    
  } catch (error) {
    console.error('Get prices error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ url }) => {
  try {
    await connectDB();
    
    const id = url.searchParams.get('id');
    const userId = url.searchParams.get('userId');
    
    if (!id) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing id' 
      }), { status: 400 });
    }
    
    const priceCollection = collections.priceItems();
    
    if (id === 'all' && userId) {
      // Delete all prices for user
      await priceCollection.deleteMany({ userId: new ObjectId(userId) });
    } else {
      // Delete single item
      await priceCollection.deleteOne({ _id: new ObjectId(id) });
    }
    
    return new Response(JSON.stringify({
      success: true
    }), { status: 200 });
    
  } catch (error) {
    console.error('Delete price error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), { status: 500 });
  }
};
