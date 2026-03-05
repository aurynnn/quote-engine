import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2024-12-18.acacia'
});

export const PRICING_PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    priceId: null,
    features: [
      '5 quotes per month',
      'Basic Excel upload',
      'Email support'
    ],
    limits: {
      quotes: 5,
      knowledgeBase: 1,
      users: 1
    }
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    priceId: process.env.STRIPE_STARTER_PRICE_ID || 'price_starter_placeholder',
    features: [
      '25 quotes per month',
      'Excel upload & parsing',
      'Priority email support',
      'Export to PDF'
    ],
    limits: {
      quotes: 25,
      knowledgeBase: 5,
      users: 2
    }
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 79,
    priceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_placeholder',
    features: [
      '100 quotes per month',
      'Advanced knowledge base',
      'Custom templates',
      'Client management',
      'Priority support',
      'API access'
    ],
    limits: {
      quotes: 100,
      knowledgeBase: 20,
      users: 5
    }
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise_placeholder',
    features: [
      'Unlimited quotes',
      'Unlimited knowledge base',
      'White-label options',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantee'
    ],
    limits: {
      quotes: -1, // unlimited
      knowledgeBase: -1,
      users: -1
    }
  }
];

/**
 * Create Stripe checkout session
 */
export async function createCheckoutSession(planId: string, userId: string, email: string) {
  const plan = PRICING_PLANS.find(p => p.id === planId);
  if (!plan || !plan.priceId) {
    throw new Error('Invalid plan or plan not available for purchase');
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card', 'ideal', 'sepa_debit'],
    customer_email: email,
    line_items: [
      {
        price: plan.priceId,
        quantity: 1
      }
    ],
    mode: 'subscription',
    success_url: `${process.env.PUBLIC_APP_URL || 'http://localhost:4321'}/dashboard/settings?success=true&plan=${planId}`,
    cancel_url: `${process.env.PUBLIC_APP_URL || 'http://localhost:4321'}/dashboard/settings?canceled=true`,
    metadata: {
      userId,
      planId
    }
  });

  return session;
}

/**
 * Create customer portal session
 */
export async function createPortalSession(customerId: string, returnUrl: string) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl
  });

  return session;
}

/**
 * Get subscription details
 */
export async function getSubscription(subscriptionId: string) {
  return stripe.subscriptions.retrieve(subscriptionId);
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(subscriptionId: string) {
  return stripe.subscriptions.cancel(subscriptionId);
}

/**
 * Handle Stripe webhook
 */
export async function handleWebhook(payload: string, signature: string) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event: Stripe.Event;
  
  if (webhookSecret) {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } else {
    event = JSON.parse(payload);
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      // Update user's subscription in database
      console.log('Checkout completed:', session.id);
      break;
    }
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      console.log('Subscription updated:', subscription.id);
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      console.log('Subscription canceled:', subscription.id);
      break;
    }
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      console.log('Payment succeeded:', invoice.id);
      break;
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      console.log('Payment failed:', invoice.id);
      break;
    }
  }

  return { received: true };
}

export { stripe };
