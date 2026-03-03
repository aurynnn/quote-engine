// Simple auth utilities
import { connectDB, collections, ObjectId } from './mongodb';
import { sign, verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'quote-engine-secret-key-change-in-production';

export interface AuthUser {
  _id: string;
  email: string;
  name: string;
  company: string;
  plan: string;
}

/**
 * Hash password (simple base64 for demo - use bcrypt in production)
 */
export function hashPassword(password: string): string {
  return Buffer.from(password).toString('base64');
}

/**
 * Verify password
 */
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

/**
 * Generate JWT token
 */
export function generateToken(user: AuthUser): string {
  return sign(
    { userId: user._id, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = verify(token, JWT_SECRET) as { userId: string; email: string };
    return { _id: decoded.userId, email: decoded.email, name: '', company: '', plan: 'free' };
  } catch {
    return null;
  }
}

/**
 * Register new user
 */
export async function registerUser(email: string, password: string, name: string, company: string = '') {
  await connectDB();
  
  const usersCollection = collections.users();
  
  // Check if user exists
  const existing = await usersCollection.findOne({ email });
  if (existing) {
    throw new Error('User already exists');
  }
  
  // Create user
  const result = await usersCollection.insertOne({
    email,
    passwordHash: hashPassword(password),
    name,
    company,
    plan: 'free',
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  return {
    _id: result.insertedId.toString(),
    email,
    name,
    company,
    plan: 'free'
  };
}

/**
 * Login user
 */
export async function loginUser(email: string, password: string) {
  await connectDB();
  
  const usersCollection = collections.users();
  
  const user = await usersCollection.findOne({ email });
  if (!user) {
    throw new Error('Invalid credentials');
  }
  
  if (!verifyPassword(password, user.passwordHash)) {
    throw new Error('Invalid credentials');
  }
  
  return {
    _id: user._id.toString(),
    email: user.email,
    name: user.name,
    company: user.company,
    plan: user.plan
  };
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string) {
  await connectDB();
  
  const usersCollection = collections.users();
  
  const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
  if (!user) return null;
  
  return {
    _id: user._id.toString(),
    email: user.email,
    name: user.name,
    company: user.company,
    plan: user.plan
  };
}
