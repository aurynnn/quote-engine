import type { APIRoute } from 'astro';
import { handleWebhook } from '../../../lib/stripe';

export const POST: APIRoute = async ({ request }) => {
  try {
    const payload = await request.text();
    const signature = request.headers.get('stripe-signature') || '';

    const result = await handleWebhook(payload, signature);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Webhook error' 
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
