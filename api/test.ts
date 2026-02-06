import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Minimal test endpoint to verify Vercel function execution
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Test 1: Basic response
    const result = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      method: req.method,
      
      // Test 2: Environment variables
      env: {
        supabaseUrl: process.env.SUPABASE_URL ? 'present' : 'missing',
        supabaseKey: process.env.SUPABASE_KEY ? 'present' : 'missing',
      },
      
      // Test 3: Module imports
      modules: {
        supabase: 'checking...',
        calculator: 'checking...'
      }
    };
    
    // Test Supabase import
    try {
      const { createClient } = await import('@supabase/supabase-js');
      result.modules.supabase = 'ok';
    } catch (e: any) {
      result.modules.supabase = `error: ${e.message}`;
    }
    
    // Test calculator import
    try {
      const { createRateCalculator } = await import('../src/calculator');
      result.modules.calculator = 'ok';
    } catch (e: any) {
      result.modules.calculator = `error: ${e.message}`;
    }
    
    return res.status(200).json(result);
    
  } catch (error: any) {
    return res.status(500).json({
      error: 'Test failed',
      message: error.message,
      stack: error.stack
    });
  }
}
