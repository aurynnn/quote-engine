// Constraint Engine - Rule application logic
import type { PricingRule, GeneratedQuote } from './minimax';

export interface AppliedRules {
  minimum: { applied: boolean; original: number; adjusted: number };
  buffer: { applied: boolean; percentage: number; amount: number };
  discount: { applied: boolean; percentage: number; amount: number };
  tax: { applied: boolean; percentage: number; amount: number };
}

/**
 * Apply business rules to a quote
 */
export function applyRules(
  quote: GeneratedQuote,
  rules: PricingRule[]
): { quote: GeneratedQuote; appliedRules: AppliedRules } {
  
  const appliedRules: AppliedRules = {
    minimum: { applied: false, original: quote.total, adjusted: quote.total },
    buffer: { applied: false, percentage: 0, amount: 0 },
    discount: { applied: false, percentage: 0, amount: 0 },
    tax: { applied: false, percentage: 0, amount: 0 }
  };
  
  // Get active rules
  const activeRules = rules.filter(r => r.active);
  
  // 1. Apply minimum price rule
  const minRule = activeRules.find(r => r.type === 'minimum');
  if (minRule && quote.total < minRule.value) {
    const diff = minRule.value - quote.total;
    quote.total = minRule.value;
    appliedRules.minimum = {
      applied: true,
      original: appliedRules.minimum.original,
      adjusted: minRule.value
    };
    console.log(`💰 Applied minimum price: $${appliedRules.minimum.original} → $${minRule.value}`);
  }
  
  // 2. Apply buffer rule (for vague descriptions)
  const bufferRule = activeRules.find(r => r.type === 'buffer');
  if (bufferRule) {
    const bufferAmount = quote.subtotal * bufferRule.value;
    quote.buffer = bufferAmount;
    quote.total = quote.subtotal + bufferAmount + quote.tax;
    appliedRules.buffer = {
      applied: true,
      percentage: bufferRule.value * 100,
      amount: bufferAmount
    };
  }
  
  // 3. Apply discount rule (volume discount)
  const discountRule = activeRules.find(r => r.type === 'discount');
  if (discountRule && quote.subtotal >= (discountRule.conditions?.totalAbove || 1000)) {
    const discountAmount = quote.subtotal * discountRule.value;
    quote.subtotal -= discountAmount;
    quote.total = quote.subtotal + quote.buffer + quote.tax;
    appliedRules.discount = {
      applied: true,
      percentage: discountRule.value * 100,
      amount: discountAmount
    };
  }
  
  // 4. Apply tax rule
  const taxRule = activeRules.find(r => r.type === 'tax');
  if (taxRule) {
    const taxableAmount = quote.subtotal + quote.buffer;
    const taxAmount = taxableAmount * taxRule.value;
    quote.tax = taxAmount;
    quote.total = quote.subtotal + quote.buffer + taxAmount;
    appliedRules.tax = {
      applied: true,
      percentage: taxRule.value * 100,
      amount: taxAmount
    };
  }
  
  return { quote, appliedRules };
}

/**
 * Get default rules for a new user
 */
export function getDefaultRules(userId: string) {
  const now = new Date();
  const { ObjectId } = require('mongodb');
  
  return [
    {
      userId: new ObjectId(userId),
      name: 'Minimum Order',
      type: 'minimum' as const,
      value: 150,
      active: true,
      createdAt: now,
      updatedAt: now
    },
    {
      userId: new ObjectId(userId),
      name: 'Buffer for Vague Descriptions',
      type: 'buffer' as const,
      value: 0.15,
      active: true,
      createdAt: now,
      updatedAt: now
    },
    {
      userId: new ObjectId(userId),
      name: 'Tax Rate',
      type: 'tax' as const,
      value: 0,
      active: true,
      createdAt: now,
      updatedAt: now
    },
    {
      userId: new ObjectId(userId),
      name: 'Volume Discount',
      type: 'discount' as const,
      value: 0.10,
      active: false,
      conditions: { totalAbove: 5000 },
      createdAt: now,
      updatedAt: now
    }
  ];
}

/**
 * Validate quote data
 */
export function validateQuote(quote: GeneratedQuote): string[] {
  const errors: string[] = [];
  
  if (!quote.items || quote.items.length === 0) {
    errors.push('Quote must have at least one item');
  }
  
  if (quote.subtotal < 0) {
    errors.push('Subtotal cannot be negative');
  }
  
  if (quote.total < 0) {
    errors.push('Total cannot be negative');
  }
  
  for (const item of quote.items || []) {
    if (!item.name) {
      errors.push('Each item must have a name');
    }
    if (item.quantity <= 0) {
      errors.push('Quantity must be greater than 0');
    }
    if (item.unitPrice < 0) {
      errors.push('Unit price cannot be negative');
    }
  }
  
  return errors;
}
