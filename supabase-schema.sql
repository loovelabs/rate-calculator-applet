-- Rate Calculator Supabase Schema
-- Based on PRD-020

-- Table: rate_config
-- Stores all rate variables, fees, surcharges, and discounts
CREATE TABLE IF NOT EXISTS rate_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    display_name TEXT,
    description TEXT,
    value NUMERIC(10, 2) NOT NULL,
    value_type TEXT NOT NULL CHECK (value_type IN ('fixed', 'hourly', 'percent')),
    category TEXT NOT NULL CHECK (category IN ('base', 'staff', 'equipment', 'surcharge', 'discount')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: quotes
-- Stores generated quotes
CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'finalized', 'accepted', 'invoiced')),
    input_payload JSONB NOT NULL,
    calculated_result JSONB NOT NULL,
    total_cents INT NOT NULL,
    user_email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: quote_line_items
-- Stores individual line items for each quote
CREATE TABLE IF NOT EXISTS quote_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('base', 'audio', 'video', 'extra', 'surcharge', 'discount')),
    description TEXT NOT NULL,
    quantity NUMERIC(10, 2) DEFAULT 1,
    unit_price_cents INT NOT NULL,
    total_cents INT NOT NULL,
    display_order INT
);

-- Table: quote_discount_codes
-- Stores discount codes that can be applied to quotes
CREATE TABLE IF NOT EXISTS quote_discount_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    discount_percent NUMERIC(5, 2) NOT NULL,
    applies_to TEXT NOT NULL CHECK (applies_to IN ('site_fee', 'setup_breakdown', 'both')),
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rate_config_code ON rate_config(code);
CREATE INDEX IF NOT EXISTS idx_rate_config_active ON rate_config(is_active);
CREATE INDEX IF NOT EXISTS idx_quotes_email ON quotes(user_email);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quote_line_items_quote_id ON quote_line_items(quote_id);
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON quote_discount_codes(code);

-- Seed data: Base rate configurations
-- These values are from the V1 codebase and should be adjusted as needed

INSERT INTO rate_config (code, name, display_name, value, value_type, category) VALUES
-- Base fees
('siteFee', 'Site Fee', 'Facility rental', 500.00, 'fixed', 'base'),
('setupBreakdownFee', 'Setup and Breakdown Fee', 'Setup and breakdown', 150.00, 'fixed', 'base'),

-- Audio staff (hourly)
('engineerAudio1_hourly', 'House Engineer', 'House engineer', 75.00, 'hourly', 'staff'),
('engineerAudio2_hourly', 'House Tech', 'House tech', 50.00, 'hourly', 'staff'),
('assistantAudio_hourly', 'Audio Assistant', 'Audio assistant', 35.00, 'hourly', 'staff'),

-- Video staff (hourly)
('dpswitcher_hourly', 'DP/Switcher', 'DP/Switcher', 85.00, 'hourly', 'staff'),
('camera1_hourly', 'Camera Operator 1', 'Camera operator 1', 75.00, 'hourly', 'staff'),
('camera2_hourly', 'Camera Operator 2', 'Camera operator 2', 65.00, 'hourly', 'staff'),
('camera3_hourly', 'Camera Operator 3', 'Camera operator 3', 65.00, 'hourly', 'staff'),

-- Other staff (hourly)
('security_hourly', 'Security', 'Security', 40.00, 'hourly', 'staff'),
('siteAssistant_hourly', 'Facility Assistant', 'Facility assistant', 30.00, 'hourly', 'staff'),
('hospitalityAssistant_hourly', 'Hospitality Assistant', 'Hospitality assistant', 30.00, 'hourly', 'staff'),

-- Equipment/Services
('hardDrive', 'Hard Drive', 'Hard drive', 75.00, 'fixed', 'equipment'),
('dvdRefs', 'DVD References', 'DVD reference copies', 25.00, 'fixed', 'equipment'),
('cdRefs', 'CD References', 'CD reference copies', 15.00, 'fixed', 'equipment'),
('pianoTuningFee', 'Piano Tuning', 'Piano tuning', 150.00, 'fixed', 'equipment'),

-- Percentage discounts
('halfDayDiscount_percent', 'Half Day Discount', 'Half-day discount', 20.00, 'percent', 'discount'),
('lightUsageDiscount_percent', 'Light Usage Discount', 'Small ensemble discount', 15.00, 'percent', 'discount'),
('facilityRentalDiscount_percent', 'Facility Rental Discount', 'Facility rental discount', 10.00, 'percent', 'discount'),
('bandUnder4Discount_percent', 'Small Band Discount', 'Small band discount (1-3 members)', 10.00, 'percent', 'discount'),

-- Percentage surcharges
('attendedSurcharge_percent', 'Attended Event Surcharge', 'Attended event surcharge', 25.00, 'percent', 'surcharge'),
('videoSetupSurcharge_percent', 'Video Setup Surcharge', 'Video setup surcharge', 30.00, 'percent', 'surcharge'),
('bandOver6Surcharge_percent', 'Large Band Surcharge', 'Large band surcharge (7+ members)', 15.00, 'percent', 'surcharge'),

-- Tax
('tax_divideBy1000', 'Sales Tax', 'NYC Sales Tax', 8.875, 'percent', 'base')
ON CONFLICT (code) DO NOTHING;

-- Sample discount codes
INSERT INTO quote_discount_codes (code, description, discount_percent, applies_to) VALUES
('EARLYBIRD', 'Early booking discount', 10.00, 'site_fee'),
('NONPROFIT', 'Non-profit organization discount', 15.00, 'both'),
('RETURNING', 'Returning client discount', 5.00, 'site_fee')
ON CONFLICT (code) DO NOTHING;
