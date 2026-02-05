#!/bin/bash
set -e

echo "🚀 Rate Calculator Deployment Script"
echo "====================================="
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    pnpm add -g vercel
fi

# Check if logged in to Vercel
echo "🔐 Checking Vercel authentication..."
if ! vercel whoami &> /dev/null; then
    echo "❌ Not logged in to Vercel"
    echo "Please run: vercel login"
    exit 1
fi

echo "✅ Authenticated with Vercel"
echo ""

# Set environment variables
echo "🔧 Setting environment variables..."
vercel env add SUPABASE_URL production --yes || true
vercel env add SUPABASE_KEY production --yes || true

echo ""
echo "📦 Deploying to Vercel..."
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Test the API endpoints"
echo "2. Verify database migration completed"
echo "3. Post update to Slack"
