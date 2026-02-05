import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { RateConfig, Quote, DiscountCode } from '../types';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ewlygzvnvqyvszdpwbww.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3bHlnenZudnF5dnN6ZHB3Ynd3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTM4NjE3NCwiZXhwIjoyMDg0OTYyMTc0fQ.QaL2zUutnv7WU-ds9IoH4r9JWq0s4deC0S9hDI3yys8';

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Fetch all active rate configurations
 */
export async function getRateConfigs(): Promise<Record<string, RateConfig>> {
  const { data, error } = await supabase
    .from('rate_config')
    .select('*')
    .eq('is_active', true);
  
  if (error) {
    throw new Error(`Failed to fetch rate configs: ${error.message}`);
  }
  
  // Convert array to keyed object for easy lookup
  const configs: Record<string, RateConfig> = {};
  for (const config of data || []) {
    configs[config.code] = config;
  }
  
  return configs;
}

/**
 * Validate and fetch discount code
 */
export async function getDiscountCode(code: string): Promise<DiscountCode | null> {
  const { data, error } = await supabase
    .from('quote_discount_codes')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  // Check expiration
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return null;
  }
  
  return data;
}

/**
 * Save a quote to the database
 */
export async function saveQuote(quote: Omit<Quote, 'id' | 'created_at'>): Promise<Quote> {
  const { data, error } = await supabase
    .from('quotes')
    .insert(quote)
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to save quote: ${error.message}`);
  }
  
  return data;
}

/**
 * Get a quote by ID
 */
export async function getQuote(id: string): Promise<Quote | null> {
  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return data;
}

/**
 * Save quote line items
 */
export async function saveQuoteLineItems(quoteId: string, lineItems: any[]): Promise<void> {
  const itemsWithQuoteId = lineItems.map((item, index) => ({
    quote_id: quoteId,
    category: item.category,
    description: item.description,
    quantity: item.quantity,
    unit_price_cents: item.unit_price_cents,
    total_cents: item.total_cents,
    display_order: index + 1
  }));
  
  const { error } = await supabase
    .from('quote_line_items')
    .insert(itemsWithQuoteId);
  
  if (error) {
    throw new Error(`Failed to save line items: ${error.message}`);
  }
}
