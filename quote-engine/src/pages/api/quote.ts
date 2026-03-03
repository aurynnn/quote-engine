import type { APIRoute } from 'astro';
import { connectDB, collections, ObjectId } from '../../lib/mongodb';
import { generateQuote } from '../../lib/minimax';
import { applyRules } from '../../lib/rules-engine';

export const POST: APIRoute = async ({ request }) => {
  try {
    await connectDB();
    
    const body = await request.json();
    const { userId, clientName, clientEmail, prompt } = body;
    
    if (!userId || !prompt) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing required fields: userId, prompt' 
      }), { status: 400 });
    }
    
    // Get pricing data
    const priceCollection = collections.priceItems();
    const prices = await priceCollection.find({ userId: new ObjectId(userId) }).toArray();
    
    if (prices.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No pricing data found. Please upload a price list first.' 
      }), { status: 400 });
    }
    
    // Get rules
    const rulesCollection = collections.pricingRules();
    const rules = await rulesCollection.find({ userId: new ObjectId(userId), active: true }).toArray();
    
    // Generate quote using LLM
    const quote = await generateQuote({
      pricingData: prices.map(p => ({
        category: p.category,
        name: p.name,
        unit: p.unit,
        basePrice: p.basePrice
      })),
      rules: rules.map(r => ({
        name: r.name,
        type: r.type,
        value: r.value
      })),
      userPrompt: prompt
    });
    
    // Apply business rules
    const { quote: finalQuote, appliedRules } = applyRules(quote, rules);
    
    // Generate quote number
    const quoteNumber = `QT-${Date.now().toString(36).toUpperCase()}`;
    
    // Calculate expiry (30 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    // Save to database
    const quotesCollection = collections.quotes();
    const savedQuote = await quotesCollection.insertOne({
      userId: new ObjectId(userId),
      quoteNumber,
      clientName: clientName || 'Unknown Client',
      clientEmail: clientEmail || '',
      items: finalQuote.items,
      subtotal: finalQuote.subtotal,
      buffer: finalQuote.buffer,
      tax: finalQuote.tax,
      total: finalQuote.total,
      status: 'draft',
      rawPrompt: prompt,
      generatedAt: new Date(),
      expiresAt
    });
    
    return new Response(JSON.stringify({
      success: true,
      quote: {
        ...finalQuote,
        _id: savedQuote.insertedId,
        quoteNumber,
        appliedRules
      }
    }), { status: 200 });
    
  } catch (error) {
    console.error('Quote generation error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: String(error)
    }), { status: 500 });
  }
};
