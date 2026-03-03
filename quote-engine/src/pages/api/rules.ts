import type { APIRoute } from 'astro';
import { connectDB, collections, ObjectId } from '../../lib/mongodb';

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
    
    const rulesCollection = collections.pricingRules();
    const rules = await rulesCollection.find({ userId: new ObjectId(userId) }).toArray();
    
    return new Response(JSON.stringify({ 
      success: true, 
      rules,
      count: rules.length 
    }), { status: 200 });
    
  } catch (error) {
    console.error('Get rules error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: String(error)
    }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    await connectDB();
    
    const body = await request.json();
    const { userId, name, type, value, conditions, active = true } = body;
    
    if (!userId || !name || !type || value === undefined) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing required fields: userId, name, type, value' 
      }), { status: 400 });
    }
    
    const rulesCollection = collections.pricingRules();
    
    const newRule = {
      userId: new ObjectId(userId),
      name,
      type,
      value,
      conditions: conditions || {},
      active,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await rulesCollection.insertOne(newRule);
    
    return new Response(JSON.stringify({ 
      success: true, 
      ruleId: result.insertedId 
    }), { status: 201 });
    
  } catch (error) {
    console.error('Create rule error:', error);
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
    const { ruleId, userId, name, type, value, conditions, active } = body;
    
    if (!ruleId || !userId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing ruleId or userId' 
      }), { status: 400 });
    }
    
    const rulesCollection = collections.pricingRules();
    
    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (name) update.name = name;
    if (type) update.type = type;
    if (value !== undefined) update.value = value;
    if (conditions) update.conditions = conditions;
    if (active !== undefined) update.active = active;
    
    const result = await rulesCollection.findOneAndUpdate(
      { _id: new ObjectId(ruleId), userId: new ObjectId(userId) },
      { $set: update },
      { returnDocument: 'after' }
    );
    
    if (!result) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Rule not found' 
      }), { status: 404 });
    }
    
    return new Response(JSON.stringify({ success: true, rule: result }), { status: 200 });
    
  } catch (error) {
    console.error('Update rule error:', error);
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
    const { ruleId, userId } = body;
    
    if (!ruleId || !userId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing ruleId or userId' 
      }), { status: 400 });
    }
    
    const rulesCollection = collections.pricingRules();
    
    const result = await rulesCollection.deleteOne({ 
      _id: new ObjectId(ruleId),
      userId: new ObjectId(userId)
    });
    
    if (result.deletedCount === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Rule not found' 
      }), { status: 404 });
    }
    
    return new Response(JSON.stringify({ success: true }), { status: 200 });
    
  } catch (error) {
    console.error('Delete rule error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: String(error)
    }), { status: 500 });
  }
};
