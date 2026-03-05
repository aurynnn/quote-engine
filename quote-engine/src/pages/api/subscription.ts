import type { APIRoute } from 'astro';
import { getUserById } from '../../lib/auth';

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const userId = cookies.get('userId')?.value;
    
    if (!userId) {
      // Return mock data for demo purposes when not logged in
      return new Response(JSON.stringify({
        user: null,
        subscription: {
          plan: 'free',
          status: 'active',
          currentPeriodEnd: null,
          quotesUsed: 3,
          quotesLimit: 5
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const user = await getUserById(userId);
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get quotes count for this month (mock for now)
    const quotesUsed = 3; // Would query database in production
    
    return new Response(JSON.stringify({
      user,
      subscription: {
        plan: user.plan || 'free',
        status: 'active',
        currentPeriodEnd: null,
        quotesUsed,
        quotesLimit: user.plan === 'free' ? 5 : user.plan === 'starter' ? 25 : user.plan === 'pro' ? 100 : -1
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
