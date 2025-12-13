# Environment Variables Documentation

## Overview
Complete guide for all environment variables across the entire neuronalworks ecosystem. Each app requires specific variables for proper functionality.

---

## 🏗️ Shared Infrastructure Variables

These variables are **IDENTICAL** across ALL apps and provide core infrastructure:

### Database (Supabase)
```bash
# PUBLIC: Client-side database access
NEXT_PUBLIC_SUPABASE_URL=[YOUR_SUPABASE_URL]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_SUPABASE_ANON_KEY]

# PRIVATE: Server-side database operations
SUPABASE_SERVICE_ROLE_KEY=[YOUR_SUPABASE_SERVICE_ROLE_KEY]
```

### Image Storage (FTP - User Gallery)
```bash
# Boertlay FTP for generated image uploads
BOERTLAY_FTP_HOST=[YOUR_FTP_HOST]
BOERTLAY_FTP_USER=[YOUR_FTP_USERNAME]
BOERTLAY_FTP_PASSWORD=[YOUR_FTP_PASSWORD]
BOERTLAY_FTP_PORT=21
BOERTLAY_BASE_URL=[YOUR_BASE_URL]
```

---

## 🏠 App-Specific Variables

### Platform App (`apps/platform/`)

**Purpose**: Main dashboard, user management, authentication
**Domain**: `platform.vercel.app`

#### Required Environment Variables:
```bash
# === SHARED INFRASTRUCTURE ===
NEXT_PUBLIC_SUPABASE_URL=[YOUR_SUPABASE_URL]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_SUPABASE_ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR_SUPABASE_SERVICE_ROLE_KEY]

# === NO APP-SPECIFIC VARIABLES ===
# Platform only needs database access for user management
```

### Nano Banana App (`apps/nano-banana/`)

**Purpose**: AI Image generation suite (5 modules)
**Domain**: `nano-banana.vercel.app`

#### Required Environment Variables:
```bash
# === SHARED INFRASTRUCTURE ===
NEXT_PUBLIC_SUPABASE_URL=[YOUR_SUPABASE_URL]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_SUPABASE_ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR_SUPABASE_SERVICE_ROLE_KEY]

# === FTP UPLOAD ===
BOERTLAY_FTP_HOST=[YOUR_FTP_HOST]
BOERTLAY_FTP_USER=[YOUR_FTP_USERNAME]
BOERTLAY_FTP_PASSWORD=[YOUR_FTP_PASSWORD]
BOERTLAY_FTP_PORT=21
BOERTLAY_BASE_URL=[YOUR_BASE_URL]

# === AI APIS ===
GEMINI_API_KEY=[YOUR_GEMINI_API_KEY]
GROK_API_KEY=[YOUR_GROK_API_KEY]
GEMINI_MODEL=gemini-2.5-flash-image
```

### Seedream App (`apps/seedream/`) - **TODO**

**Purpose**: High-fidelity image generation
**Domain**: `seedream.vercel.app`

#### Required Environment Variables:
```bash
# === SHARED INFRASTRUCTURE ===
NEXT_PUBLIC_SUPABASE_URL=[YOUR_SUPABASE_URL]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_SUPABASE_ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR_SUPABASE_SERVICE_ROLE_KEY]

# === FTP UPLOAD ===
BOERTLAY_FTP_HOST=[YOUR_FTP_HOST]
BOERTLAY_FTP_USER=[YOUR_FTP_USERNAME]
BOERTLAY_FTP_PASSWORD=[YOUR_FTP_PASSWORD]
BOERTLAY_FTP_PORT=21
BOERTLAY_BASE_URL=[YOUR_BASE_URL]

# === SEEDREAM API (TBD) ===
SEEDREAM_API_KEY=[TO_BE_DEFINED]
SEEDREAM_API_URL=[TO_BE_DEFINED]
```

---

## 🚀 Deployment Checklist

### For Each Vercel Project:

#### ✅ Platform Deployment
- [ ] GitHub Repository: `nano-banana-friends`
- [ ] Root Directory: `apps/platform`
- [ ] Environment Variables: **2 variables** (Supabase only)
- [ ] Domain: `platform.vercel.app`

#### ✅ Nano Banana Deployment
- [ ] GitHub Repository: `nano-banana-friends` 
- [ ] Root Directory: `apps/nano-banana`
- [ ] Environment Variables: **10 variables** (Supabase + FTP + AI APIs)
- [ ] Domain: `nano-banana.vercel.app`

#### 🔄 Seedream Deployment (Future)
- [ ] GitHub Repository: `nano-banana-friends`
- [ ] Root Directory: `apps/seedream` 
- [ ] Environment Variables: **7+ variables** (Supabase + FTP + Seedream API)
- [ ] Domain: `seedream.vercel.app`

---

## 📋 Variable Categories

### 🗄️ Database Variables (All Apps)
Every app needs these for user data, generations, credits:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` 
- `SUPABASE_SERVICE_ROLE_KEY`

### 📤 Upload Variables (Generation Apps)
Apps that generate images need FTP upload for user gallery:
- `BOERTLAY_FTP_HOST`
- `BOERTLAY_FTP_USER`
- `BOERTLAY_FTP_PASSWORD`
- `BOERTLAY_FTP_PORT`
- `BOERTLAY_BASE_URL`

### 🤖 AI API Variables (Per Service)
Each generation service needs specific API credentials:

**Nano Banana (Gemini + Grok):**
- `GEMINI_API_KEY`
- `GROK_API_KEY`
- `GEMINI_MODEL`

**Seedream (TBD):**
- `SEEDREAM_API_KEY`
- `SEEDREAM_API_URL`

---

## ⚠️ Security Notes

1. **Never commit API keys to GitHub**
2. **Use Vercel environment variables for production**
3. **Different keys for development vs production**
4. **Rotate keys regularly**
5. **Monitor API usage and costs**

---

## 🔄 Adding New Apps

When creating a new generation app, it needs:

### Minimum Required (All Apps):
```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### If App Generates Images:
```bash
# Add FTP variables for user gallery
BOERTLAY_FTP_HOST=...
BOERTLAY_FTP_USER=...
BOERTLAY_FTP_PASSWORD=...
BOERTLAY_FTP_PORT=...
BOERTLAY_BASE_URL=...
```

### Plus Service-Specific APIs:
```bash
# Add the specific AI service API keys
SERVICE_API_KEY=...
SERVICE_API_URL=...
```

---

**Generated with Claude Code**
**Last Updated**: 2024-12-13