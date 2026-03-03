import { MongoClient, Db, Collection, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb+srv://auryn:Z16OQd6HR5CkrfS1@healteascluster.yaunfrm.mongodb.net/quotedb?appName=healteasCluster';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectDB(): Promise<Db> {
  if (db) return db;
  
  client = new MongoClient(uri);
  await client.connect();
  db = client.db();
  console.log('📦 Connected to MongoDB:', db.databaseName);
  return db;
}

export function getDB(): Db {
  if (!db) throw new Error('Database not connected. Call connectDB() first.');
  return db;
}

export function getCollection<T extends Document>(name: string): Collection<T> {
  return getDB().collection<T>(name);
}

// Collections
export const collections = {
  users: () => getCollection<User>('users'),
  priceItems: () => getCollection<PriceItem>('priceItems'),
  pricingRules: () => getCollection<PricingRule>('pricingRules'),
  quotes: () => getCollection<Quote>('quotes'),
  knowledgeBase: () => getCollection<KnowledgeBase>('knowledgeBase'),
};

// Types
export interface User {
  _id: ObjectId;
  email: string;
  passwordHash: string;
  name: string;
  company: string;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  createdAt: Date;
  updatedAt: Date;
}

export interface PriceItem {
  _id: ObjectId;
  userId: ObjectId;
  category: string;
  name: string;
  unit: string;
  basePrice: number;
  minPrice: number;
  multiplier: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PricingRule {
  _id: ObjectId;
  userId: ObjectId;
  name: string;
  type: 'minimum' | 'buffer' | 'discount' | 'tax';
  value: number;
  conditions?: {
    category?: string;
    totalAbove?: number;
  };
  active: boolean;
}

export interface QuoteItem {
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Quote {
  _id: ObjectId;
  userId: ObjectId;
  quoteNumber: string;
  clientName: string;
  clientEmail: string;
  items: QuoteItem[];
  subtotal: number;
  buffer: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  rawPrompt: string;
  generatedAt: Date;
  expiresAt: Date;
}

export interface KnowledgeBase {
  _id: ObjectId;
  userId: ObjectId;
  sourceFile: string;
  data: Record<string, unknown>;
  rowCount: number;
  uploadedAt: Date;
}

export { ObjectId };
