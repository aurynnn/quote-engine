// MiniMax LLM Client for Quote Generation

const API_KEY = process.env.MINIMAX_API_KEY || 'sk-cp-F8Ok_FEuPSAHW6e-rbamWBgN1xUoyrZ6MrKvRKaN_Exap1JanqDt4aaQAAwpi5iRWcsnUEhxwAABllO5g9i2l6PqRKgVrD0pP5hjLF2lAyXjqnyqFnvHmLQ';
const GROUP_ID = process.env.MINIMAX_GROUP_ID || '1882734672295760005';
const BASE_URL = 'https://api.minimax.chat/v1';

interface MiniMaxMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface MiniMaxRequest {
  model: string;
  messages: MiniMaxMessage[];
  temperature?: number;
  max_tokens?: number;
}

interface MiniMaxResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Call MiniMax API
 */
async function callMiniMax(prompt: string, systemPrompt?: string): Promise<string> {
  const messages: MiniMaxMessage[] = [];
  
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  
  messages.push({ role: 'user', content: prompt });
  
  const request: MiniMaxRequest = {
    model: 'MiniMax-M2.5',
    messages,
    temperature: 0.7,
    max_tokens: 8192
  };
  
  const response = await fetch(`${BASE_URL}/text/chatcompletion_v2`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify(request)
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`MiniMax API error: ${response.status} - ${error}`);
  }
  
  const data: MiniMaxResponse = await response.json();
  
  if (!data.choices || data.choices.length === 0) {
    throw new Error('No response from MiniMax');
  }
  
  return data.choices[0].message.content;
}

/**
 * Generate quote using LLM
 */
export interface QuoteGenerationInput {
  pricingData: Array<{
    category: string;
    name: string;
    unit: string;
    basePrice: number;
  }>;
  rules: Array<{
    name: string;
    type: string;
    value: number;
  }>;
  userPrompt: string;
}

export interface GeneratedQuote {
  items: Array<{
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  buffer: number;
  tax: number;
  total: number;
  reasoning?: string;
}

const SYSTEM_PROMPT = `You are a pricing expert AI. Your task is to generate professional quotes based on pricing data and user requirements.

RESPONSE FORMAT - JSON ONLY (no other text):
{
  "items": [
    {
      "name": "Service name",
      "description": "Optional description",
      "quantity": 1,
      "unitPrice": 100,
      "total": 100
    }
  ],
  "subtotal": 500,
  "buffer": 0,
  "tax": 0,
  "total": 500,
  "reasoning": "Brief explanation of pricing decisions"
}

RULES:
- Use pricing data provided
- Apply minimum prices from the data
- Add buffer for vague items (15% if descriptions are unclear)
- Calculate accurate totals
- Output ONLY valid JSON`;

export async function generateQuote(input: QuoteGenerationInput): Promise<GeneratedQuote> {
  // Build pricing data string
  const pricingStr = input.pricingData
    .map(p => `- ${p.category}: ${p.name} = $${p.basePrice}/${p.unit}`)
    .join('\n');
  
  // Build rules string
  const rulesStr = input.rules
    .map(r => `- ${r.name}: ${r.type} = ${r.value}`)
    .join('\n');
  
  const userPrompt = `
PRICING DATA:
${pricingStr}

BUSINESS RULES:
${rulesStr}

USER REQUIREMENTS:
${input.userPrompt}

Generate a detailed quote following the rules above. Output ONLY valid JSON.`;

  const response = await callMiniMax(userPrompt, SYSTEM_PROMPT);
  
  // Parse JSON response
  try {
    // Try to extract JSON from response (in case there's extra text)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate structure
    if (!parsed.items || !Array.isArray(parsed.items)) {
      parsed.items = [];
    }
    
    // Calculate totals if not provided
    if (!parsed.subtotal) {
      parsed.subtotal = parsed.items.reduce((sum: number, item: { total: number }) => sum + (item.total || 0), 0);
    }
    
    if (!parsed.total) {
      parsed.total = parsed.subtotal + (parsed.buffer || 0) + (parsed.tax || 0);
    }
    
    return parsed;
    
  } catch (error) {
    console.error('Failed to parse LLM response:', response);
    throw new Error(`Failed to parse quote: ${error}`);
  }
}

/**
 * Check if MiniMax is configured and working
 */
export async function testMiniMax(): Promise<boolean> {
  try {
    await callMiniMax('Say "OK" if you can read this.');
    return true;
  } catch (error) {
    console.error('MiniMax test failed:', error);
    return false;
  }
}
