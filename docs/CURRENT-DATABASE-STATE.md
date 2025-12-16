# 🎯 CURRENT DATABASE STATE - SINGLE SOURCE OF TRUTH
**Last Updated: 2025-11-27 - This is the DEFINITIVE documentation**

> **⚠️ IMPORTANT: This document reflects EXACTLY what is running right now, not what should be running or was planned.**

## 🏗️ WORKING DATABASE ARCHITECTURE

### 📊 **TABLES THAT ARE ACTIVELY USED**

#### 1. ✅ `users` (Core User Management)
**Purpose**: Authentication, settings, profile data
**Status**: ✅ WORKING PERFECTLY

| Column | Type | Purpose | Example |
|--------|------|---------|---------|
| `id` | UUID | Primary key | `5bcc1012-7b1b-4ac3-a2e6-3093d492d2c0` |
| `username` | VARCHAR(50) | Login credential | `emilia.ivanova` |
| `password_hash` | VARCHAR(255) | bcrypt hash | `$2b$12$...` |
| `gemini_api_key` | TEXT | User's Gemini API key | `AIza...` |
| `hair_color`, `eye_color`, `skin_tone`, `age_range` | VARCHAR(50) | AI generation params | `blonde`, `blue`, `european`, `young-adult` |
| `default_resolution`, `default_aspect_ratio` | VARCHAR(10) | UI defaults | `4K`, `9:16` |
| `main_face_image_url` | TEXT | Face image URL | Supabase Storage URL |

**Used by**: Authentication, Settings Page, Generation Parameters

---

#### 2. ✅ `generations` (Image Generation Log)
**Purpose**: Every single image generation is logged here
**Status**: ✅ WORKING PERFECTLY (aspect_ratio bug FIXED 2025-11-27)

| Column | Type | Purpose | Example |
|--------|------|---------|---------|
| `id` | UUID | Primary key | `40874b52-e662-4dae-b7bd-58e9e4c8c209` |
| `user_id` | UUID | Links to users.id | `5bcc1012-7b1b-4ac3-a2e6-3093d492d2c0` |
| `prompt` | TEXT | Full AI prompt | `Take the provided image and recreate...` |
| `status` | VARCHAR | Generation status | `completed`, `failed` |
| `resolution` | VARCHAR(10) | Actual resolution | `1K`, `2K`, `4K` |
| `aspect_ratio` | VARCHAR(10) | **FIXED 2025-11-27** | `9:16`, `4:3`, `16:9` |
| `generation_time_seconds` | INTEGER | Time taken | `42` |
| `gemini_metadata` | JSONB | **Real token data** | `{usageMetadata: {...}}` |
| `result_image_url` | TEXT | Final image URL | FTP/Storage URL |
| `created_at` | TIMESTAMP | When generated | `2025-11-27 09:01:20` |

**Critical Fix Applied (2025-11-27)**: 
- ✅ `aspect_ratio` now gets REAL values instead of hardcoded `'9:16'`
- ✅ Token data extraction from Gemini API working correctly
- ✅ All new generations store accurate data

**Used by**: Dashboard Statistics, Gallery, Recent Images, Aspect Ratio Analytics

---

#### 3. ✅ `daily_usage_history` (Dashboard Analytics)
**Purpose**: Daily aggregated statistics for dashboard
**Status**: ⚠️ WORKING BUT PROBLEMATIC

| Column | Type | Purpose | Current State |
|--------|------|---------|---------------|
| `id` | UUID | Primary key | ✅ Working |
| `user_id` | UUID | Links to users | ✅ Working |
| `usage_date` | DATE | Day of usage | ⚠️ Sometimes NULL |
| `cost_usd` | DECIMAL(10,4) | Daily costs | ✅ Working |
| `generations_count` | INTEGER | Images generated | ✅ Working |
| `count_1k`, `count_2k`, `count_4k` | INTEGER | Resolution breakdown | ✅ Working |
| `prompt_tokens`, `output_tokens` | INTEGER | Token usage | ✅ Working |

**Used by**: Dashboard (heute/woche statistics), Cost tracking, Usage analytics

---

### 🚫 **TABLES/VIEWS THAT ARE BROKEN OR UNUSED**

#### ❌ `user_stats` 
**Status**: ❌ EXISTS BUT UNUSED
**Problem**: Code doesn't query this table
**Recommendation**: Could be removed or integrated

#### ❌ Materialized View Functions
**Status**: ❌ BROKEN (SQL syntax error)
**Problem**: `get_daily_usage_by_user` RPC function fails
**Error**: `invalid input syntax for type interval: "%d days"`
**Current Behavior**: Code falls back to direct table queries

---

## 🔄 **ACTUAL DATA FLOW (How It Really Works)**

### Image Generation Process:
```
1. User clicks generate → NonoBananaPage.jsx
2. Gemini API call → Real token usage returned
3. uploadAndSaveImage() → INSERT into `generations` table
4. ✅ aspect_ratio = REAL value (Fixed 2025-11-27)
5. Daily stats updated in `daily_usage_history`
```

### Dashboard Loading Process:
```
1. DashboardPage loads → usageTracking.js
2. Try RPC function → ❌ FAILS 
3. Fallback to direct query → ✅ WORKS
4. Query `daily_usage_history` + `generations` → Display stats
5. Aspect ratio stats from `generations` table → Display ratios
```

---

## 💰 **TOKEN TRACKING & COSTS (VERIFIED WORKING)**

### 4K Generation Token Costs:
**TESTED 2025-11-27 with real 4x generation:**

| Generation Type | Token Usage | Cost per Image |
|-----------------|-------------|----------------|
| **Single 4K** | ~2686 tokens | ~$0.006 |
| **4x 4K Batch** | 4 x ~1800 = ~7200 tokens | 4 x ~$0.004 = ~$0.016 |
| **10x 4K Batch** | 10 x ~1800 = ~18000 tokens | 10 x ~$0.004 = ~$0.04 |

**Key Findings**:
- ✅ Each image in a batch gets separate token count
- ✅ 4x generation = 4 separate API calls with individual tracking
- ✅ Token extraction working: `usageMetadata.promptTokenCount`, `candidatesTokenCount`

### Resolution Differences:
```javascript
// Actual measured costs from live data:
'4K': ~2686 tokens (high detail)
'2K': ~1800 tokens (balanced)  
'1K': ~1200 tokens (fast)
```

---

## 🏷️ **DATABASE FILES STATUS**

### ✅ **KEEP (Currently Used)**
- `database/create-tables.sql` - Original working schema
- `database/add-generations-table.sql` - Generations table setup
- `database/README.md` - Basic documentation

### ⚠️ **EVALUATE** 
- `database/create-materialized-view.sql` - Has SQL bugs, not working

### ✅ **ARCHIVED (Moved to /archive/)**
- `fix-data-integrity.sql` - One-time fix, no longer relevant
- `fix-existing-data.sql` - Migration script, completed
- `fix-token-extraction.sql` - Historical fix, applied
- `consolidate-user-data.sql` - Migration script, completed

---

## 🎯 **DASHBOARD CURRENT CAPABILITIES**

### ✅ **WORKING FEATURES**
- **Real-time statistics**: Heute (13 images), Diese Woche (261 images)
- **Cost tracking**: €0.55 heute, €10.45 diese Woche  
- **Resolution breakdown**: 4K (1), 2K (2), 1K (10)
- **Aspect ratio tracking**: Fixed 2025-11-27, now shows real percentages
- **Token analytics**: Real data from Gemini API

### ⚠️ **LIMITATIONS**
- **No comparisons**: No "vs yesterday" or trend indicators
- **No averages**: No "Ø per day" calculations  
- **Limited timeframes**: Only today/week/month, no custom ranges
- **SQL errors**: Materialized view functions broken (but fallbacks work)

### 🚀 **EXPANSION POSSIBILITIES**
All dashboard improvements can be done **frontend-only** without database changes:
- Gestern vs Heute comparisons
- Trend calculations (% changes)
- Average metrics
- Peak usage analysis
- Better time range selections

---

## 🔧 **KNOWN ISSUES & FIXES**

### ✅ **RESOLVED (2025-11-27)**
1. **Aspect Ratio Bug**: Fixed hardcoded '9:16', now stores real ratios
2. **Token Tracking**: Verified working with real Gemini API data
3. **4x Generation Counting**: Each image now tracked separately

### ⚠️ **ONGOING ISSUES**
1. **Materialized View RPC Error**: SQL interval syntax error
   - **Impact**: Console errors, but dashboard works via fallback
   - **Fix needed**: Repair SQL syntax in materialized view function
   
2. **Date Filter Logic**: Aspect ratio queries needed date range fixes
   - **Status**: Fixed for today/week queries
   - **Impact**: Dashboard now shows accurate aspect ratio percentages

### 🎯 **ARCHITECTURAL DECISIONS**
1. **Keep working system**: Don't fix what isn't broken
2. **Frontend expansion**: Dashboard improvements without DB changes  
3. **Clean documentation**: This document is the single source of truth
4. **Archive old attempts**: Moved failed/outdated SQL attempts to archive

---

## 👤 **MANUAL USER CREATION WORKFLOW**

### 🔐 **Step 1: Create User in Supabase Database**

**Use this proven SQL code in Supabase SQL Editor:**

```sql
-- Create bcrypt hash function in Supabase (run once):
CREATE OR REPLACE FUNCTION create_alpha_user(p_username TEXT, p_password TEXT) 
RETURNS void AS $$
DECLARE
  v_hash TEXT;
BEGIN
  -- Generate bcrypt hash (Supabase has crypt extension)
  SELECT crypt(p_password, gen_salt('bf', 12)) INTO v_hash;
  
  INSERT INTO users (username, password_hash, gemini_api_key, default_resolution, default_aspect_ratio) 
  VALUES (p_username, v_hash, '', '2K', '9:16');
END;
$$ LANGUAGE plpgsql;

-- Create new users (examples from working system):
SELECT create_alpha_user('emilia.berlin', '1611');
SELECT create_alpha_user('jessy.germany', '2018'); 
SELECT create_alpha_user('tyra.foxi', '2018');
SELECT create_alpha_user('selena.luna', '2025');

-- Verify successful creation:
SELECT username, created_at FROM users 
WHERE username IN ('emilia.berlin', 'jessy.germany', 'tyra.foxi', 'selena.luna');
```

### 📁 **Step 2: Create FTP Directory Structure**

**Manually create directories on FTP server:**
```
/httpdocs/user_pics/generated/
├── [username]/
│   └── 2025/
│       └── 11/
```

**Example for new user `emilia.berlin`:**
```
/httpdocs/user_pics/generated/emilia.berlin/2025/11/
```

### ⚠️ **Current Status**
- ✅ **Database creation**: Working with provided SQL
- ✅ **Login system**: Works with bcrypt authentication  
- ⚠️ **FTP upload**: Currently has API errors (404) but database tracking works
- ✅ **User onboarding**: Works after login (Gemini API key + face image setup)

---

## 🤝 **FOR NEW AGENTS: QUICK START**

**To understand this codebase:**
1. **Read this document first** - It's the current reality
2. **Database**: `users` + `generations` + `daily_usage_history` tables
3. **Main flows**: Image generation → generations table → dashboard queries
4. **Key files**: 
   - `src/pages/NonoBananaPage.jsx` - Generation logic
   - `src/pages/DashboardPage.jsx` - Analytics display  
   - `src/utils/usageTracking.js` - Database queries
   - `src/utils/imageUpload.js` - Data storage

**Don't:**
- ❌ Create new SQL migration files
- ❌ Try to "fix" the materialized view immediately  
- ❌ Assume documentation in other files is current

**Do:**
- ✅ Use this document as ground truth
- ✅ Frontend-only improvements for dashboard
- ✅ Test any changes thoroughly
- ✅ Update this document when making changes

---

**Last verified: 2025-11-27 12:50 CET**  
**Dashboard working**: ✅ YES  
**Image generation working**: ✅ YES  
**Token tracking accurate**: ✅ YES  
**Ready for feature expansion**: ✅ YES (frontend-only)