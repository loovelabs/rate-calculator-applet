import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Minimal working quotes endpoint for debugging
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Test Supabase connection
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        error: 'Missing environment variables',
        supabaseUrl: !!supabaseUrl,
        supabaseKey: !!supabaseKey
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test database query
    const { data: configs, error } = await supabase
      .from('rate_config')
      .select('*')
      .limit(5);
    
    if (error) {
      return res.status(500).json({
        error: 'Database query failed',
        message: error.message
      });
    }
    
    // Return mock quote with database confirmation
    return res.status(200).json({
      status: 'success',
      message: 'Minimal endpoint working',
      database: {
        connected: true,
        configsFound: configs?.length || 0
      },
      mockQuote: {
        id: 'test-123',
        projectName: req.body.projectName || 'Test Project',
        subtotal: 1000,
        total: 1088.75
      }
    });
    
  } catch (error: any) {
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5)
    });
  }
}
