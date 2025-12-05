# 🍌 Nano Banana Friends - Account Creation Guide

## 📋 Kompletter Account-Erstellungsprozess

Für neue Accounts sind **3 Schritte** erforderlich:

### 🔐 **Schritt 1: Supabase Database Account**
### 📁 **Schritt 2: FTP Server Ordner-Struktur** 
### ⚙️ **Schritt 3: Environment Variables Update**

---

## 🔐 **SCHRITT 1: Supabase Database Setup**


### ⚠️ WICHTIG: bcrypt Authentication Required! 

Das Login System nutzt **bcrypt** - du musst die Accounts in Supabase erstellen.

**📍 Gehe zu Supabase Dashboard → SQL Editor und führe folgende Befehle aus:**

-- Erstelle bcrypt Hash-Funktion in Supabase:
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

**🚀 Accounts erstellen:**
```sql
-- Alpha User anlegen mit bcrypt Hashing
SELECT create_alpha_user('emilia.berlin', '1611');
SELECT create_alpha_user('jessy.germany', '2018'); 
SELECT create_alpha_user('tyra.foxi', '2018');
SELECT create_alpha_user('selena.luna', '2025');
```

**✅ Verification:**
```sql
-- Prüfen ob Accounts erfolgreich angelegt wurden
SELECT username, created_at FROM users 
WHERE username IN ('emilia.berlin', 'jessy.germany', 'tyra.foxi', 'selena.luna');
```

---

## 📁 **SCHRITT 2: FTP Server Ordner-Struktur**

### 🎯 **Automatische Ordner-Erstellung auf Boertlay Server**

Das System erstellt automatisch die benötigte Ordnerstruktur für jedes Model:

```
/httpdocs/user_pics/generated/
├── emilia.berlin/
│   └── 2025/
│       └── 11/
├── jessy.germany/
│   └── 2025/
│       └── 11/
├── tyra.foxi/
│   └── 2025/
│       └── 11/
└── selena.luna/
    └── 2025/
        └── 11/
```

### 🔧 **Script Ausführung:**

```bash
# FTP Ordner für alle neuen Models erstellen
node create-model-folders.js
```

**Das Script:**
- 🔍 Erkennt automatisch alle Models aus `VITE_LOGIN_USERS`
- 📁 Erstellt `/model-id/2025/11/` Struktur auf FTP Server
- ✅ Verifiziert erfolgreich erstellte Ordner
- 🎯 Basis-Pfad: `/httpdocs/user_pics/generated/`

---

## ⚙️ **SCHRITT 3: Environment Variables Update**

### 📝 **models in .env.local hinzufügen:**

```javascript
// .env.local - VITE_LOGIN_USERS JSON Array erweitern
VITE_LOGIN_USERS='[
  {"username": "emilia.berlin", "modelId": "emilia.berlin"}, 
  {"username": "jessy.germany", "modelId": "jessy.germany"},
  {"username": "tyra.foxi", "modelId": "tyra.foxi"},
  {"username": "selena.luna", "modelId": "selena.luna"}
]'
```

**🎯 Wichtig:** 
- `username` = Login-Name (wie in Supabase)
- `modelId` = Ordner-Name auf FTP Server
- JSON Array für automatische Script-Erkennung

---

## 🎉 **Account Setup Komplett!**

Nach allen 3 Schritten können sich die neuen User einloggen:

1. ✅ **Login**: Username + Password → bcrypt Validation
2. ✅ **Onboarding**: Profil-Setup (Gemini API Key, Face Images, etc.)  
3. ✅ **Generation**: AI Images werden auf FTP Server gespeichert
4. ✅ **Analytics**: Usage Tracking in user_stats Tabelle

### 🔍 **Troubleshooting:**

**Login funktioniert nicht?**
- ✅ Prüfe: Account in Supabase Users Tabelle vorhanden
- ✅ Prüfe: bcrypt Function erfolgreich ausgeführt

**Bilder werden nicht gespeichert?**  
- ✅ Prüfe: FTP Ordnerstruktur existiert
- ✅ Prüfe: Model in VITE_LOGIN_USERS enthalten

**Model nicht erkannt?**
- ✅ Prüfe: .env.local korrekt formatiert (gültiges JSON)
- ✅ Prüfe: create-model-folders.js erfolgreich ausgeführt