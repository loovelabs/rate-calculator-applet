import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getQuote } from '../../../lib/supabase';

/**
 * GET /api/v1/quotes/:id
 * Retrieve a previously generated quote
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { id } = req.query;
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid quote ID' });
    }
    
    const quote = await getQuote(id);
    
    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }
    
    return res.status(200).json({
      quoteId: quote.id,
      status: quote.status,
      calculation: quote.calculated_result,
      input: quote.input_payload,
      createdAt: quote.created_at
    });
    
  } catch (error: any) {
    console.error('Error fetching quote:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
