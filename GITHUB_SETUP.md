# GitHub Setup Instructions

## Required GitHub Secrets

To enable automated deployment via GitHub Actions, configure the following secrets in your repository settings:

### Navigate to Secrets

1. Go to your GitHub repository
2. Click **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret** for each of the following:

### Required Secrets

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `SUPABASE_DB_PASSWORD` | PostgreSQL database password | From loove_credentials table or Supabase dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Already in code: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `VERCEL_TOKEN` | Vercel authentication token | https://vercel.com/account/tokens |
| `VERCEL_ORG_ID` | Vercel organization ID | Run `vercel link` and check `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | Vercel project ID | Run `vercel link` and check `.vercel/project.json` |
| `SLACK_WEBHOOK_URL` | Slack webhook for notifications | https://api.slack.com/messaging/webhooks |

## Step-by-Step Setup

### 1. Get Supabase Database Password

The database password is stored in the loove_credentials table. You can retrieve it with:

```python
import urllib.request
import json

SUPABASE_URL = "https://ewlygzvnvqyvszdpwbww.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

url = f"{SUPABASE_URL}/rest/v1/loove_credentials?service_key=eq.supabase&credential_key=eq.database_password&is_active=eq.true&select=credential_value"
req = urllib.request.Request(url, headers={
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}"
})
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode())
    print(data[0]["credential_value"])
```

Or check the Supabase dashboard under **Settings** > **Database** > **Connection string**.

### 2. Get Vercel Token

1. Go to https://vercel.com/account/tokens
2. Click **Create Token**
3. Name it "GitHub Actions - Rate Calculator"
4. Set scope to your team/account
5. Copy the token (you won't see it again!)

### 3. Get Vercel Project IDs

First, link the project locally:

```bash
cd /path/to/rate-calculator-applet
vercel link
```

This creates `.vercel/project.json` with your IDs:

```json
{
  "orgId": "team_xxxxxxxxxxxxx",
  "projectId": "prj_xxxxxxxxxxxxx"
}
```

Copy these values to GitHub secrets.

### 4. Get Slack Webhook URL

1. Go to https://api.slack.com/apps
2. Create a new app or select existing
3. Enable **Incoming Webhooks**
4. Click **Add New Webhook to Workspace**
5. Select channel (e.g., #wholetone-development)
6. Copy the webhook URL

### 5. Add Secrets to GitHub

For each secret:

1. Go to repository **Settings** > **Secrets and variables** > **Actions**
2. Click **New repository secret**
3. Enter name (exactly as shown above)
4. Paste value
5. Click **Add secret**

## Verify Setup

After adding all secrets, test the workflow:

1. Make a small change to README.md
2. Commit and push to main branch
3. Go to **Actions** tab in GitHub
4. Watch the workflow run

You should see three jobs:
- ✅ Database Migration
- ✅ Deploy to Vercel
- ✅ Notify Slack

## Troubleshooting

### Database Migration Fails

- **Error:** "Tenant or user not found"
  - Check SUPABASE_DB_PASSWORD is correct
  - Verify connection string format in workflow

- **Error:** "relation already exists"
  - Tables already created, this is OK
  - Migration uses `CREATE TABLE IF NOT EXISTS`

### Vercel Deployment Fails

- **Error:** "Invalid token"
  - Regenerate VERCEL_TOKEN
  - Ensure token has correct scope

- **Error:** "Project not found"
  - Verify VERCEL_ORG_ID and VERCEL_PROJECT_ID
  - Run `vercel link` locally to get correct IDs

### Slack Notification Fails

- **Error:** "Invalid webhook URL"
  - Regenerate webhook in Slack
  - Ensure webhook is for correct workspace

## Manual Deployment

If GitHub Actions are not working, you can deploy manually:

### Database Migration

```bash
# Set password
export SUPABASE_DB_PASSWORD="your_password_here"

# Run migration
PGPASSWORD=$SUPABASE_DB_PASSWORD psql \
  -h db.ewlygzvnvqyvszdpwbww.supabase.co \
  -U postgres \
  -d postgres \
  -f supabase-schema.sql
```

### Vercel Deployment

```bash
# Login to Vercel
vercel login

# Set environment variables
vercel env add SUPABASE_URL production
vercel env add SUPABASE_KEY production

# Deploy
vercel --prod
```

## Security Notes

- Never commit secrets to git
- Rotate tokens periodically
- Use least-privilege access for tokens
- Monitor GitHub Actions logs for exposed secrets
- Enable branch protection on main branch

## Next Steps

After setup is complete:

1. ✅ Push code to GitHub
2. ✅ Verify GitHub Action runs successfully
3. ✅ Test API endpoints
4. ✅ Check Slack notification received
5. ✅ Document production URL
