# Rate Calculator Applet

**Status:** In Development  
**PRD:** PRD-020  
**Domain:** Services (D07) / Product Development (D09)

## Overview

The Rate Calculator Applet is a standalone, API-driven microservice for generating dynamic quotes for studio and event space bookings. It ports the sophisticated pricing logic from the Wholetone V1 codebase to a modern, headless architecture using TypeScript, Supabase, and Vercel serverless functions.

## Architecture

- **Backend:** TypeScript/Node.js on Vercel Serverless
- **Database:** Supabase (PostgreSQL)
- **Deployment:** Vercel
- **Integration:** RESTful API

## Project Structure

```
rate-calculator-applet/
├── api/
│   └── v1/
│       ├── quotes.ts          # POST /api/v1/quotes
│       └── quotes/
│           └── [id].ts        # GET /api/v1/quotes/:id
├── src/
│   └── calculator.ts          # Core calculation engine
├── lib/
│   └── supabase.ts            # Supabase client and helpers
├── types/
│   └── index.ts               # TypeScript type definitions
├── tests/
│   └── calculator.test.ts     # Unit tests
├── supabase-schema.sql        # Database schema
├── vercel.json                # Vercel configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Dependencies and scripts
```

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Supabase

Run the schema migration:

```bash
psql -h <supabase-host> -U postgres -d postgres -f supabase-schema.sql
```

Or use the Supabase dashboard SQL editor to execute `supabase-schema.sql`.

### 3. Configure Environment Variables

Create a `.env` file or configure Vercel environment variables:

```
SUPABASE_URL=https://ewlygzvnvqyvszdpwbww.supabase.co
SUPABASE_KEY=your_service_role_key
```

### 4. Deploy to Vercel

```bash
# Preview deployment
pnpm run deploy:preview

# Production deployment
pnpm run deploy
```

## API Endpoints

### POST /api/v1/quotes

Generate a new quote.

**Request Body:**
```json
{
  "projectName": "My Recording Session",
  "name": "John Doe",
  "email": "john@example.com",
  "bookingType": "production",
  "mediaType": "av",
  "days": 2,
  "ensembleSize": 5,
  "staffing": {
    "engineer": true,
    "dpSwitcher": true,
    "camera1": true
  },
  "pianoTuning": true
}
```

**Response:**
```json
{
  "quoteId": "uuid",
  "calculation": {
    "lineItems": [...],
    "baseFees": 120000,
    "staffCharges": 180000,
    "extraCharges": 15000,
    "subtotal": 315000,
    "tax": 27956,
    "total": 342956,
    "calculatedAt": "2026-02-04T..."
  },
  "createdAt": "2026-02-04T..."
}
```

### GET /api/v1/quotes/:id

Retrieve a previously generated quote.

**Response:**
```json
{
  "quoteId": "uuid",
  "status": "draft",
  "calculation": {...},
  "input": {...},
  "createdAt": "2026-02-04T..."
}
```

## Calculation Logic

The calculator implements the following order of operations (per PRD-020 Section 4.1):

1. **Calculate Base Fees:** Sum siteFee and setupBreakdownFee
2. **Apply Percentage Surcharges:** videoSetupSurcharge, bandOver6Surcharge, attendedSurcharge (compound)
3. **Apply Percentage Discounts:** facilityRentalDiscount, halfDayDiscount, bandUnder4Discount
4. **Calculate Hourly Staffing Costs:** For each selected staff role × hours × days
5. **Add Fixed Equipment & Misc. Costs:** pianoTuning, hardDrive, etc.
6. **Calculate Subtotal:** Sum all calculated costs
7. **Apply Discount Code:** If valid discount code provided
8. **Calculate Tax:** Apply tax rate to post-discount subtotal
9. **Calculate Final Total:** Subtotal + tax

## Rate Configuration

All rates, fees, surcharges, and discounts are stored in the `rate_config` table in Supabase. This allows for easy updates without code changes.

Key rate codes:
- `siteFee` - Base facility rental
- `setupBreakdownFee` - Setup and breakdown
- `engineerAudio1_hourly` - House engineer
- `dpswitcher_hourly` - DP/Switcher
- `camera1_hourly` - Camera operator
- `pianoTuningFee` - Piano tuning
- `halfDayDiscount_percent` - Half-day discount
- `videoSetupSurcharge_percent` - Video surcharge
- `tax_divideBy1000` - Sales tax

## Testing

```bash
pnpm test
```

## Development

```bash
pnpm dev
```

## References

- **PRD-020:** `/home/ubuntu/loove-os/docs/prds/PRD-020-Rate-Calculator-Applet.md`
- **V1 Codebase:** `joshroseman/theloove` (branch: `cg`)
- **LOOVE OS Development Skill:** `/home/ubuntu/skills/loove-os-development/SKILL.md`
- **Wholetone 4.0 Onboarding:** `/home/ubuntu/skills/wholetone-4-onboarding/SKILL.md`

## License

ISC
