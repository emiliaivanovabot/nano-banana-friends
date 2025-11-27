# 🚀 Async Image Generation System - Deployment Guide

## Overview

The async generation system solves mobile sleep/lock interruption issues by:
- **Database Storage**: Tracks generation requests in `generations` table
- **Background Processing**: Gemini API runs server-side without client connection
- **Mobile Polling**: Frontend checks status every 10 seconds, resumes after sleep
- **Persistence**: Generations survive phone sleep, app close, page refresh

## 🏗️ Architecture

```
[Mobile App] → [API Server] → [Supabase DB] → [Gemini API]
     ↑              ↓              ↓
   Polling      Background      Status
  (10s)         Processing      Storage
```

## 📋 Deployment Steps

### 1. Database Setup

```sql
-- Run in Supabase SQL Editor
\i /path/to/database/add-generations-table.sql
```

Or manually execute the SQL from:
- `database/add-generations-table.sql`

### 2. API Server Deployment

#### Option A: Vercel (Recommended)
```bash
# Deploy API as Vercel Function
cd api/
npm install
vercel --prod

# Set environment variables in Vercel dashboard:
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

#### Option B: Railway/Render/Heroku
```bash
# Deploy API as standalone service
cd api/
npm install
npm start

# Configure environment variables:
# PORT=3001
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

#### Option C: VPS/Docker
```bash
# Run on VPS with PM2
cd api/
npm install
npm install -g pm2
pm2 start index.js --name "nano-banana-api"
pm2 startup
pm2 save
```

### 3. Frontend Configuration

Add to your `.env.local`:
```bash
# Async Generation API URL (replace with your deployed API URL)
VITE_ASYNC_API_URL=https://your-api-domain.vercel.app
# or 
VITE_ASYNC_API_URL=https://your-api.railway.app
# or for local development:
VITE_ASYNC_API_URL=http://localhost:3001
```

### 4. Update Routes

Replace the current NonoBananaPage with the async version:

```jsx
// In your router (App.jsx or similar)
import NonoBananaPageAsync from './pages/NonoBananaPageAsync.jsx'

// Replace:
// <Route path="/nono-banana" element={<NonoBananaPage />} />
// With:
<Route path="/nono-banana" element={<NonoBananaPageAsync />} />
```

### 5. Cleanup Automation

Setup automated cleanup (choose one):

#### Option A: Vercel Cron (Vercel Functions)
```javascript
// api/cleanup-cron.js
import { cleanup } from './cleanup-generations.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  
  await cleanup()
  res.status(200).json({ success: true })
}
```

Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cleanup-cron",
      "schedule": "0 2 * * *"
    }
  ]
}
```

#### Option B: Server Cron Job
```bash
# Add to crontab (runs daily at 2 AM)
crontab -e
0 2 * * * cd /path/to/project && node scripts/cleanup-generations.js
```

## ⚙️ Environment Variables

### Frontend (.env.local)
```bash
# Existing variables
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_key
VITE_GEMINI_MODEL=gemini-2.5-flash-image

# New variable for async API
VITE_ASYNC_API_URL=https://your-deployed-api-url
```

### API Server
```bash
# Required
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Optional
PORT=3001
VITE_GEMINI_MODEL=gemini-2.5-flash-image
```

## 🧪 Testing

### 1. Test Database Schema
```bash
node scripts/cleanup-generations.js stats
```

### 2. Test API Server
```bash
# Start API locally
cd api/
npm run dev

# Test endpoints
curl http://localhost:3001/health
```

### 3. Test Frontend Integration
1. Start generation with mobile device
2. Lock phone for 30+ seconds  
3. Unlock phone - generation should resume/complete
4. Refresh page - status should persist

### 4. Test Cleanup
```bash
node scripts/cleanup-generations.js all
```

## 📱 Mobile Testing Checklist

- [ ] Generation starts successfully
- [ ] Status shows "Processing..." with live timer
- [ ] Phone sleep doesn't interrupt generation
- [ ] Status updates when returning from sleep
- [ ] Generation completes and shows result
- [ ] Image downloads work
- [ ] Failed generations show retry option
- [ ] Page refresh preserves active generation
- [ ] Multiple generations tracked in history

## 🔒 Security Considerations

1. **API Access**: Only authenticated users can create/view their generations
2. **Rate Limiting**: Consider adding rate limiting to prevent abuse
3. **API Key Security**: Individual user API keys maintain billing separation
4. **Data Retention**: 30-day automatic cleanup prevents data bloat
5. **RLS Policies**: Database-level security ensures user isolation

## 🐛 Troubleshooting

### Common Issues

1. **API Connection Failed**
   ```bash
   # Check API URL is correct
   curl $VITE_ASYNC_API_URL/health
   ```

2. **Polling Not Working**
   - Check browser network tab for API calls
   - Verify user authentication
   - Check console for errors

3. **Generations Stuck Processing**
   ```bash
   # Fix stuck generations
   node scripts/cleanup-generations.js fix-stuck
   ```

4. **Database Connection Issues**
   - Verify Supabase service role key has full access
   - Check RLS policies allow service role access
   - Confirm generations table exists

### Debug Commands

```bash
# Check generation stats
node scripts/cleanup-generations.js stats

# View API logs (if using PM2)
pm2 logs nano-banana-api

# Test database connection
node scripts/verify-database.js
```

## 📊 Monitoring

### Key Metrics to Track
- Generation success rate
- Average generation time
- Failed generation reasons  
- Active generation count
- Database growth rate

### Recommended Monitoring
- Setup alerts for API server downtime
- Monitor database storage usage
- Track failed generation patterns
- Monitor Gemini API quota usage

## 🔄 Migration from Sync to Async

1. Deploy async system alongside existing sync system
2. Update one route to use async version for testing
3. Gradually migrate users to async version
4. Remove sync version once fully migrated

The async system is backward compatible - users can switch between versions seamlessly.

## 🎯 Success Metrics

After deployment, you should see:
- ✅ Zero generation failures due to mobile sleep
- ✅ Improved user retention during long generations
- ✅ Better mobile user experience
- ✅ Reduced support requests about "lost" generations
- ✅ Higher completion rate for 2+ minute generations

---

🍌 **Nano Banana Pro Async Generation System** - Built for mobile-first image generation that never interrupts!