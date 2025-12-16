# 🍌 Nano Banana Friends

Ein AI-basierter Multi-Projekt Hub mit drei verschiedenen Generierungstools und Community Features.

> **📋 NEW AGENTS START HERE:** Read [`CURRENT-DATABASE-STATE.md`](./CURRENT-DATABASE-STATE.md) first - this is the definitive documentation of what's actually running.

## 🚨 **CRITICAL DEVELOPMENT RULE**

**NIEMALS CODE ÄNDERN OHNE EXPLIZITE BESTÄTIGUNG VOM USER!**

- **KEIN CODE** schreiben während User am testen/generieren ist
- **IMMER FRAGEN** bevor du Änderungen machst  
- **WARTEN** bis User sagt "mach es"
- **NICHT EINFACH ANFANGEN** zu coden während Unterhaltung
- User arbeitet oft parallel mit der App - Code-Änderungen können aktive Prozesse zerstören

**Diese Regel gilt für JEDEN neuen Chat/Agent!**

## 📚 **Essential Documentation**
- **[`CURRENT-DATABASE-STATE.md`](./CURRENT-DATABASE-STATE.md)** - 🎯 **SINGLE SOURCE OF TRUTH** (Read this first!)
- [`DATABASE-ARCHITECTURE-DOCUMENTATION.md`](./DATABASE-ARCHITECTURE-DOCUMENTATION.md) - Full technical details
- [`AUTHENTICATION-SYSTEM-DOCUMENTATION.md`](./AUTHENTICATION-SYSTEM-DOCUMENTATION.md) - Auth system
- [`GEMINI-DOCS.md`](./GEMINI-DOCS.md) - Gemini API integration

## 🚀 Projekte

### 🎬 WAN 2.2 Video
Bild zu Video Generierung für professionelle Inhalte

### 🍌 Nano Banana (Gemini 3 Pro)  
**✅ AKTIV** - AI Model Shooting Bildgenerierung mit:
- Multi-Image Upload (bis zu 14 Bilder)
- Professionelle Prompt Templates für Model Shootings
- Studio Business, Beauty, Fashion, Lifestyle Kategorien
- **Community Prompts**: 1.706 kuratierte Prompts mit AVIF Bildern
- User Settings: Haarfarbe, Augenfarbe, Hautfarbe, Alter Integration
- Live Timer während Generierung
- Download Funktionalität
- Deutsch UI

### 🎨 Qwen Image Edit
*In Entwicklung* - Bildbearbeitung mit Qwen 3 Max

## 🛠️ Tech Stack

- **Frontend**: React + Vite
- **Routing**: React Router DOM  
- **Database**: Supabase (Community Prompts & User Settings)
- **API**: Gemini 3 Pro Image Preview
- **Images**: AVIF Format für optimale Performance
- **Styling**: Vanilla CSS mit modernem Design
- **Environment**: Vite Environment Variables

## 🎯 Features

### Nano Banana Highlights:
- **Community Prompts**: 1.706 kuratierte Prompts mit professionellen Vorschaubildern
- **Smart User Integration**: Automatisches Einfügen von Haarfarbe, Augenfarbe, Hautfarbe, Alter
- **AVIF Bildformat**: Optimierte Ladezeiten und Qualität
- **Professionelle Templates**: Studio, Beauty, Fashion, Lifestyle
- **Multi-Image Support**: Bis zu 14 Bilder gleichzeitig
- **Privacy-First**: Keine Speicherung sensibler Daten
- **Retry Logic**: Automatische Wiederholung bei API-Überlastung
- **Live Timer**: Echtzeitanzeige der Generierungszeit
- **Download**: Direkte Bilddownloads ohne Server

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Öffne `http://localhost:5173` im Browser.

## 🔧 Environment Setup

Erstelle `.env.local` mit:
```
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_GEMINI_MODEL=gemini-3-pro-image-preview
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 📱 Usage

1. **Homepage**: Wähle dein Projekt (WAN Video, Nano Banana, Qwen)
2. **Nano Banana**: 
   - Upload Face-Bilder (bis zu 14)
   - Konfiguriere User Settings (Haar, Augen, Haut, Alter)
   - Wähle aus 1.706 Community Prompts oder nutze Templates
   - Generiere mit intelligenter Attribut-Integration
3. **Community Prompts**: Durchsuche kuratierte Prompts mit AVIF Vorschaubildern
4. **Download**: Klick auf Download-Button für hochqualitative Bilder

## 🗄️ Database Structure

### Community Prompts
- **1.706 kuratierte Prompts** optimiert für Face-Generation
- **NO_CHANGE Artefakte**: Vollständig bereinigt
- **Attribut-Konflikt frei**: Keine Überschneidungen mit User-Einstellungen
- **AVIF Bilder**: Optimierte Performance mit `https://boertlay.de/bilder/images_avif/`

---

*🤖 Erstellt für professionelle AI Model Shootings*