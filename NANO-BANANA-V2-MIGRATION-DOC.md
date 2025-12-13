# Nano Banana v2 Migration Documentation

## Project Overview

**Status**: 🚧 Migration in Progress  
**Goal**: Separate Nano Banana from monolith into standalone Vercel app for better scaling

## V1 → V2 Migration Strategy

### Why V2?
- **V1 was functional** - All modules worked perfectly in the monolith
- **Scaling needs** - Separate deployments for independent module scaling
- **Module separation** - Each generation type can be optimized independently
- **Vercel optimization** - Dedicated deployment for Nano Banana suite

### V1 Structure (Blueprint - Working Reference)
Located in `/src/pages/` - **DO NOT MODIFY V1 - USE AS REFERENCE**

```
src/pages/
├── NonoBananaPage.jsx              → V2: /classic
├── NonoBananaImage2ImagePage.jsx   → V2: /img2img  
├── GrokPlaygroundPage.jsx          → V2: /grok
├── NonoBananaCollabPage.jsx        → V2: /collab
├── NonoBananaMultiPromptsPage.jsx  → V2: /multi-prompt
```

### V2 Structure (New Modular App)
Located in `/apps/nano-banana/`

```
apps/nano-banana/
├── src/app/
│   ├── page.tsx                    ✅ Module Overview (DONE)
│   ├── classic/page.tsx           🔄 NonoBananaPage.jsx
│   ├── img2img/page.tsx           🔄 NonoBananaImage2ImagePage.jsx
│   ├── grok/page.tsx              🔄 GrokPlaygroundPage.jsx
│   ├── collab/page.tsx            🔄 NonoBananaCollabPage.jsx
│   ├── multi-prompt/page.tsx      🔄 NonoBananaMultiPromptsPage.jsx
│   └── api/
│       ├── generate/route.ts       🔄 Gemini API endpoint
│       ├── img2img/route.ts        🔄 Image2Image API
│       ├── grok/route.ts           🔄 Grok API proxy
│       └── collab/route.ts         🔄 Collaboration features
```

## Migration Progress

### ✅ Completed
1. **Foundation Setup**
   - Apps structure created
   - Next.js 15 configuration
   - Shared packages integration (@repo/*)
   - Tailwind + shadcn/ui setup

2. **Module Overview**
   - Main landing page with 5 modules
   - Navigation to sub-modules
   - Credit system integration

### 🔄 In Progress
3. **Module Migration**
   - Classic: NonoBananaPage.jsx → /classic
   - Img2Img: NonoBananaImage2ImagePage.jsx → /img2img
   - Grok: GrokPlaygroundPage.jsx → /grok
   - Collab: NonoBananaCollabPage.jsx → /collab
   - Multi-Prompt: NonoBananaMultiPromptsPage.jsx → /multi-prompt

### 📋 Pending
4. **API Routes** - Convert React Router to Next.js API routes
5. **Vercel Deployment** - Standalone nano-banana.vercel.app
6. **Testing** - Verify all modules work in V2

## Key Differences V1 → V2

| Aspect | V1 (Monolith) | V2 (Standalone) |
|--------|---------------|-----------------|
| **Routing** | React Router | Next.js App Router |
| **Components** | Local JSX | Shared @repo/ui |
| **Auth** | Local AuthContext | @repo/auth-config |
| **Database** | Direct Supabase | @repo/database |
| **API** | Frontend fetch | Next.js API routes |
| **Deployment** | Single Vercel | Separate nano-banana.vercel.app |

## Shared Packages Used
- `@repo/ui` - shadcn/ui components
- `@repo/auth-config` - Authentication
- `@repo/database` - Supabase client
- `@repo/business-logic` - Credit system
- `@repo/constants` - URLs, configs

## Migration Guidelines

### 1. **Use V1 as Blueprint**
- Copy exact functionality from V1 modules
- Preserve all working features
- Maintain same user experience

### 2. **Convert to Next.js Patterns**
- `useNavigate()` → `useRouter()` from Next.js
- React Router `<Link>` → Next.js `<Link>`
- Frontend API calls → Next.js API routes

### 3. **Preserve Functionality**
- All Gemini API integrations
- Image upload/storage
- Credit tracking
- User settings
- Security measures

## Deployment Target

**URL**: `nano-banana.vercel.app`
**Port**: 3001 (dev)
**Build**: Independent of main platform

## Success Criteria

✅ All 5 modules functional  
✅ Same UX as V1  
✅ Independent scaling  
✅ Shared package integration  
✅ Vercel deployment  

---

**Note**: V1 remains untouched as working reference. V2 is clean slate migration.