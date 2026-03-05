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
    
    // Get pricing data (optional - can generate quotes without it)
    const priceCollection = collections.priceItems();
    const prices = await priceCollection.find({ userId: new ObjectId(userId) }).toArray();
    
    // Get rules
    const rulesCollection = collections.pricingRules();
    const rules = await rulesCollection.find({ userId: new ObjectId(userId), active: true }).toArray();
    
    // Generate quote using LLM (works with or without pricing data)
    let quote;
    try {
      quote = await generateQuote({
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
    } catch (llmError) {
      // Fallback: Create a simple quote when LLM fails
      console.log('LLM failed, using fallback quote generation');
      const promptLower = prompt.toLowerCase();
      const items = [];
      const unitPrice = 100;
      
      // Simple keyword-based item detection
      if (promptLower.includes('web') || promptLower.includes('website') || promptLower.includes('development') || promptLower.includes('code')) {
        items.push({ name: 'Web Development', description: 'Website development services', unit: 'hour', quantity: 10, unitPrice: unitPrice, total: unitPrice * 10 });
      }
      if (promptLower.includes('design') || promptLower.includes('ui') || promptLower.includes('ux') || promptLower.includes('graphic')) {
        items.push({ name: 'Design Services', description: 'UI/UX or graphic design', unit: 'hour', quantity: 5, unitPrice: unitPrice, total: unitPrice * 5 });
      }
      if (promptLower.includes('consult') || promptLower.includes('advice') || promptLower.includes('strategy')) {
        items.push({ name: 'Consulting', description: 'Consulting and strategy', unit: 'hour', quantity: 3, unitPrice: 150, total: 150 * 3 });
      }
      if (promptLower.includes('marketing') || promptLower.includes('ad') || promptLower.includes('campaign')) {
        items.push({ name: 'Marketing', description: 'Marketing services', unit: 'month', quantity: 1, unitPrice: 500, total: 500 });
      }
      
      // Default item if nothing matched
      if (items.length === 0) {
        items.push({ name: 'Professional Services', description: prompt.substring(0, 50), unit: 'hour', quantity: 5, unitPrice: unitPrice, total: unitPrice * 5 });
      }
      
      quote = { items };
    }
    
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
