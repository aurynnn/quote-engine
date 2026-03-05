import type { APIRoute } from 'astro';
import { createCheckoutSession, createPortalSession, PRICING_PLANS } from '../../../lib/stripe';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { action, planId } = body;

    // Get user from cookie (simple auth)
    const userId = cookies.get('userId')?.value;
    const email = cookies.get('userEmail')?.value;

    if (!userId || !email) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (action === 'create-checkout') {
      const session = await createCheckoutSession(planId, userId, email);
      
      return new Response(JSON.stringify({ 
        url: session.url 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (action === 'create-portal') {
      const customerId = cookies.get('stripeCustomerId')?.value;
      
      if (!customerId) {
        return new Response(JSON.stringify({ error: 'No subscription found' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const returnUrl = `${request.headers.get('origin')}/dashboard/settings`;
      const session = await createPortalSession(customerId, returnUrl);
      
      return new Response(JSON.stringify({ 
        url: session.url 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Stripe API error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ 
    plans: PRICING_PLANS.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      features: p.features,
      limits: p.limits
    }))
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
