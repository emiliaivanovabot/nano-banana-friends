# Nano Banana Friends Database Setup

## Quick Start

1. **Run the setup script to get SQL commands:**
   ```bash
   npm run db:setup
   ```

2. **Execute the SQL in Supabase Dashboard:**
   - Go to your [Supabase Dashboard](https://qoxznbwvyomyyijokkgk.supabase.co/project/sql)
   - Copy and paste each SQL block from the setup script output
   - Execute them one by one

3. **Verify the setup:**
   ```bash
   npm run db:verify
   ```

## Database Architecture

### Tables Overview

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `users` | User profiles and authentication | UUID primary key, unique username/email, physical attributes, preferences |
| `user_stats` | Real-time usage tracking | Token counting, financial tracking, feature usage, daily/lifetime totals |
| `daily_usage_history` | Historical analytics | Daily snapshots, business intelligence, usage patterns |

### Schema Details

#### users table
- **Primary Key**: `id` (UUID)
- **Authentication**: `username`, `password_hash`, `email`
- **API Integration**: `gemini_api_key` for personalized AI access
- **Physical Attributes**: `hair_color`, `eye_color`, `skin_tone`, `age_range`
- **Preferences**: `default_resolution`, `default_aspect_ratio`, `favorite_prompts` (JSONB)
- **Face Management**: Up to 3 face images with custom names
- **System**: `is_active`, timestamps, `last_login`

#### user_stats table
- **Primary Key**: `user_id` (references users)
- **Token Tracking**: Daily and total prompt/output tokens
- **Financial**: Daily and total cost in USD (4 decimal precision)
- **Feature Usage**: Counters for each resolution/aspect ratio combination
- **Performance**: Generation time tracking
- **Error Tracking**: Error counts and last error details
- **Daily Reset**: Automatic daily reset system

#### daily_usage_history table
- **Primary Key**: `id` (UUID)
- **Analytics**: Daily snapshots of user activity
- **Business Intelligence**: Cost, generation counts, performance metrics
- **Usage Patterns**: Peak hours, most used prompts
- **Unique Constraint**: One record per user per day

### Performance Features

#### Indexes
- `idx_users_username` - Fast login lookups
- `idx_users_email` - Email-based operations
- `idx_users_active` - Filter active users efficiently
- `idx_daily_usage_user_date` - User analytics queries
- `idx_daily_usage_date` - Date-range analytics
- `idx_user_stats_reset_date` - Daily reset operations

#### Security (Row Level Security)
- **Enabled on all tables**
- **Policy**: Users can only access their own data
- **Authentication**: Uses Supabase `auth.uid()`

#### Helper Functions
- **Auto-updater**: `updated_at` timestamp maintenance
- **Daily Reset**: `reset_daily_stats()` for scheduled maintenance

## Business Model Support

### Alpha → Commercial Transition
- **Token Tracking**: Precise usage monitoring for billing
- **Cost Calculation**: Real-time cost tracking in USD
- **Feature Analytics**: Usage patterns by resolution/aspect ratio
- **Daily Limits**: Foundation for subscription tiers
- **Historical Data**: Business intelligence for growth analysis

### Pricing Strategy Data
- **Resolution/Aspect Usage**: Track popular combinations
- **Cost Per User**: Daily and lifetime expenditure
- **Feature Adoption**: Which formats drive engagement
- **Error Rates**: Service quality metrics

## Manual Execution Steps

If the automated scripts don't work, execute these SQL statements in order:

### 1. Enable UUID Extension
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### 2. Create Users Table
```sql
-- Copy from database/create-tables.sql
```

### 3. Create User Stats Table
```sql
-- Copy from database/create-tables.sql
```

### 4. Create Daily Usage History Table
```sql
-- Copy from database/create-tables.sql
```

### 5. Add Performance Indexes
```sql
-- Copy from database/create-tables.sql
```

### 6. Enable Row Level Security
```sql
-- Copy from database/create-tables.sql
```

### 7. Create Helper Functions
```sql
-- Copy from database/create-tables.sql
```

## Verification

After setup, you should see:
- ✅ 3 tables created successfully
- ✅ 6 performance indexes active
- ✅ RLS policies protecting data
- ✅ Helper functions for maintenance

## Next Steps

1. **Implement Authentication**
   - User registration/login system
   - Session management
   - Password hashing

2. **Add Usage Tracking**
   - Track each image generation
   - Update token counters
   - Calculate costs in real-time

3. **Build Analytics Dashboard**
   - Daily usage charts
   - Cost breakdown
   - Feature usage analytics

## Troubleshooting

### Common Issues

1. **Permission Errors**
   - Verify service role key in `.env.local`
   - Check Supabase project permissions

2. **Table Not Found**
   - Ensure SQL executed successfully
   - Check Supabase Dashboard for tables

3. **Connection Issues**
   - Verify `SUPABASE_URL` is correct
   - Test with `npm run db:verify`

### Support

- **Documentation**: See `database/create-tables.sql` for complete schema
- **Scripts**: Use `npm run db:setup` for manual instructions
- **Verification**: Use `npm run db:verify` to check status


Ich habe eine umfassende lokale Backup-Strategie für dein nano-banana-friends
  Projekt implementiert:

  ✅ Was wurde gemacht:

  1. Aktueller Stand komplett gesichert - Alle deine Änderungen sind in Git committet
  2. Mehrschichtige Backup-Strategie - Bare Repository + zeitgestempelte Vollbackups
  3. GitHub-Push deaktiviert - Schutz vor versehentlichem Hochladen
  4. Automatisches Backup-Script - Einfache tägliche Sicherung
  5. Development-Branches - Struktur für sichere Feature-Entwicklung

  🔧 Einfache Nutzung:

  # Schnelles Backup ohne neuen Commit
  ./backup-local.sh

  # Backup mit Commit bei größeren Änderungen  
  ./backup-local.sh --commit

  Dein Projekt ist jetzt vollständig lokal gesichert und du kannst sicher
  weiterentwickeln, ohne dass etwas auf GitHub landet! Alle Backups werden automatisch in
  /Users/bertanyalcintepe/Desktop/nano-banana-backups/ gespeichert.