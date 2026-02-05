import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createRateCalculator } from '../../src/calculator';
import { saveQuote, saveQuoteLineItems } from '../../lib/supabase';
import type { QuoteInput } from '../../types';

/**
 * POST /api/v1/quotes
 * Generate a new quote
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Validate input
    const input: QuoteInput = req.body;
    
    if (!input.bookingType || !input.mediaType || !input.days) {
      return res.status(400).json({
        error: 'Missing required fields: bookingType, mediaType, days'
      });
    }
    
    // Create calculator and perform calculation
    const calculator = await createRateCalculator();
    const calculation = await calculator.calculate(input);
    
    // Save quote to database
    const quote = await saveQuote({
      status: 'draft',
      input_payload: input,
      calculated_result: calculation,
      total_cents: calculation.total,
      user_email: input.email || null
    });
    
    // Save line items
    await saveQuoteLineItems(quote.id, calculation.lineItems);
    
    // Return response
    return res.status(200).json({
      quoteId: quote.id,
      calculation,
      createdAt: quote.created_at
    });
    
  } catch (error: any) {
    console.error('Error generating quote:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
