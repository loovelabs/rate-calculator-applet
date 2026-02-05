/**
 * Rate Calculator Types
 * Based on PRD-020 and V1 Wholetone implementation
 */

export interface RateConfig {
  id: string;
  code: string;
  name: string;
  display_name: string | null;
  description: string | null;
  value: number;
  value_type: 'fixed' | 'hourly' | 'percent';
  category: 'base' | 'staff' | 'equipment' | 'surcharge' | 'discount';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuoteInput {
  // Basic info
  projectName: string;
  name?: string;
  email?: string;
  phone?: string;
  sponsor?: string;
  startDate?: string;
  endDate?: string;
  
  // Booking details
  bookingType: 'production' | 'post' | 'facility rental';
  mediaType: 'audio' | 'av'; // audio-only or audio+video
  days: number;
  hours?: number; // Override default hours
  shift?: '10' | '4'; // 10am-4pm or 4pm-10pm for half-day
  
  // Ensemble details
  ensembleSize?: number;
  
  // Staffing selections
  staffing: {
    // Audio
    engineer?: boolean;
    tech?: boolean;
    audioAssistant?: boolean;
    
    // Video
    dpSwitcher?: boolean;
    camera1?: boolean;
    camera2?: boolean;
    camera3?: boolean;
    
    // Other
    siteAssistant?: boolean;
    security?: boolean;
    hospitalityAssistant?: boolean;
  };
  
  // Equipment & services
  pianoTuning?: boolean;
  customTuning?: boolean;
  mediaStorage?: 'Hard Drive' | 'DVD' | 'CD-R' | 'Own HD';
  
  // Flags
  clientEngineer?: boolean; // Client bringing own engineer
  audience?: boolean; // Attended event
  noEquipmentRental?: boolean; // Facility rental without equipment
  
  // Discounts
  discountCode?: string;
  
  // Misc
  miscCharge?: number;
  miscDescription?: string;
}

export interface QuoteLineItem {
  id?: string;
  quote_id?: string;
  category: 'base' | 'audio' | 'video' | 'extra' | 'surcharge' | 'discount';
  description: string;
  quantity: number;
  unit_price_cents: number;
  total_cents: number;
  display_order: number;
}

export interface QuoteCalculation {
  // Line items
  lineItems: QuoteLineItem[];
  
  // Subtotals
  baseFees: number;
  staffCharges: number;
  extraCharges: number;
  subtotal: number;
  
  // Tax and total
  tax: number;
  total: number;
  
  // Metadata
  calculatedAt: string;
  rateConfigVersion?: string;
}

export interface Quote {
  id: string;
  status: 'draft' | 'finalized' | 'accepted' | 'invoiced';
  input_payload: QuoteInput;
  calculated_result: QuoteCalculation;
  total_cents: number;
  user_email: string | null;
  created_at: string;
}

export interface DiscountCode {
  code: string;
  description: string;
  discount_percent: number;
  applies_to: 'site_fee' | 'setup_breakdown' | 'both';
  is_active: boolean;
  expires_at: string | null;
}

export interface RateCalculatorConfig {
  supabaseUrl: string;
  supabaseKey: string;
}
