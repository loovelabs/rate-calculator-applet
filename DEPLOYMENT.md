# Deployment Guide: Rate Calculator Applet

## Prerequisites

1. **Vercel Account:** Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI:** Install globally with `npm i -g vercel`
3. **Supabase Project:** Already configured at `https://ewlygzvnvqyvszdpwbww.supabase.co`
4. **GitHub Repository:** Push code to `joshroseman/loove-os` or dedicated repo

## Step 1: Database Setup

### Option A: Using Supabase Dashboard

1. Log in to Supabase at https://supabase.com
2. Navigate to your project: `ewlygzvnvqyvszdpwbww`
3. Go to **SQL Editor**
4. Copy and paste the contents of `supabase-schema.sql`
5. Click **Run** to execute the migration

### Option B: Using psql CLI

```bash
# Get connection string from Supabase dashboard
psql "postgresql://postgres:[PASSWORD]@aws-0-us-east-2.pooler.supabase.com:6543/postgres" \
  -f supabase-schema.sql
```

### Verify Tables Created

Run this query in Supabase SQL Editor:

```sql
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('rate_config', 'quotes', 'quote_line_items', 'quote_discount_codes');
```

You should see all 4 tables listed.

## Step 2: Configure Environment Variables

### Local Development

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase service role key:

```
SUPABASE_URL=https://ewlygzvnvqyvszdpwbww.supabase.co
SUPABASE_KEY=your_service_role_key_here
```

### Vercel Production

Set environment variables using Vercel CLI:

```bash
vercel env add SUPABASE_URL production
# Paste: https://ewlygzvnvqyvszdpwbww.supabase.co

vercel env add SUPABASE_KEY production
# Paste your service role key
```

Or use the Vercel dashboard:
1. Go to your project settings
2. Navigate to **Environment Variables**
3. Add `SUPABASE_URL` and `SUPABASE_KEY`

## Step 3: Deploy to Vercel

### First-Time Deployment

```bash
# Navigate to project directory
cd /home/ubuntu/rate-calculator-applet

# Login to Vercel (if not already logged in)
vercel login

# Deploy
vercel --prod
```

Follow the prompts:
- **Set up and deploy?** Yes
- **Which scope?** Select your account/team
- **Link to existing project?** No (first time)
- **Project name?** rate-calculator-applet
- **Directory?** ./ (current directory)
- **Override settings?** No

### Subsequent Deployments

```bash
# Preview deployment (for testing)
vercel

# Production deployment
vercel --prod
```

### Using GitHub Integration (Recommended)

1. Push code to GitHub repository
2. Connect repository to Vercel:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Configure environment variables
   - Deploy

3. Automatic deployments:
   - **Production:** Pushes to `main` branch
   - **Preview:** Pushes to other branches or PRs

## Step 4: Verify Deployment

### Test the API

```bash
# Get your deployment URL from Vercel output
VERCEL_URL="https://your-deployment-url.vercel.app"

# Test POST /api/v1/quotes
curl -X POST "$VERCEL_URL/api/v1/quotes" \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "Test Session",
    "bookingType": "production",
    "mediaType": "audio",
    "days": 1,
    "staffing": {
      "engineer": true
    }
  }'

# Should return a quote with calculation details
```

### Test GET endpoint

```bash
# Use the quoteId from the POST response
curl "$VERCEL_URL/api/v1/quotes/{quoteId}"
```

## Step 5: Monitor and Maintain

### View Logs

```bash
# Real-time logs
vercel logs --follow

# Recent logs
vercel logs
```

### Update Rate Configurations

To update rates without redeploying:

1. Go to Supabase dashboard
2. Navigate to **Table Editor**
3. Select `rate_config` table
4. Edit values directly
5. Changes take effect immediately

### Rollback Deployment

```bash
# List deployments
vercel ls

# Promote a previous deployment to production
vercel promote [deployment-url]
```

## Troubleshooting

### Issue: "Module not found" errors

**Solution:** Ensure all dependencies are installed:
```bash
pnpm install
```

### Issue: Database connection errors

**Solution:** Verify environment variables:
```bash
vercel env ls
```

Check Supabase connection string and service role key.

### Issue: CORS errors

**Solution:** Add CORS headers to API responses (if needed for browser access):

```typescript
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
```

### Issue: Calculation errors

**Solution:** Verify rate_config table is seeded:

```sql
SELECT COUNT(*) FROM rate_config WHERE is_active = true;
```

Should return at least 20+ active rate configurations.

## Security Checklist

- [ ] Environment variables set in Vercel (not hardcoded)
- [ ] Supabase service role key kept secret
- [ ] API endpoints validate input
- [ ] Rate limiting configured (if needed)
- [ ] HTTPS enforced (automatic with Vercel)

## Performance Optimization

### Enable Edge Caching

Add to `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/api/v1/quotes/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "s-maxage=60, stale-while-revalidate"
        }
      ]
    }
  ]
}
```

### Monitor Response Times

Use Vercel Analytics to track:
- API response times
- Error rates
- Request volumes

## Next Steps

1. **Integrate with Shopify:** Create theme app extension
2. **Add Admin UI:** Build Supabase-based admin panel
3. **Implement Discount Codes:** Complete discount code validation logic
4. **Add Email Notifications:** Send quotes via email
5. **Create PDF Generation:** Generate PDF quotes for download

## Support

For issues or questions:
- **GitHub Issues:** [Repository URL]
- **Slack:** #wholetone-development
- **Documentation:** See README.md and PRD-020
