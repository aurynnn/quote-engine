import type { APIRoute } from 'astro';
import { registerUser, loginUser, generateToken } from '../../lib/auth';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { action, email, password, name, company } = body;
    
    if (!action || !email || !password) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing required fields' 
      }), { status: 400 });
    }
    
    let user;
    
    if (action === 'register') {
      if (!name) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Name is required for registration' 
        }), { status: 400 });
      }
      user = await registerUser(email, password, name, company);
    } else if (action === 'login') {
      user = await loginUser(email, password);
    } else {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid action. Use "register" or "login"' 
      }), { status: 400 });
    }
    
    // Generate token
    const token = generateToken(user);
    
    return new Response(JSON.stringify({
      success: true,
      user,
      token
    }), { status: 200 });
    
  } catch (error) {
    console.error('Auth error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: String(error)
    }), { status: 400 });
  }
};
