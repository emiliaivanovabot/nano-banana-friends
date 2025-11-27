# Community Prompts Feature - Dokumentation

## Projektziel
Integration von echten Community Prompts von **bananaprompts.xyz** in die nano-banana-friends Anwendung für weibliche AI-Model-Generation User.

## Funktionale Anforderungen

### 1. Datenquelle
- **Quelle**: bananaprompts.xyz/explore
- **Content**: Nur Menschen/Portrait/Model-fokussierte Prompts  
- **Ausschluss**: Keine Architecture, Nature, oder andere Non-Human Prompts
- **Gender**: Alle Prompts auf weibliche Subjects angepasst (da Userbase weiblich)
- **Zugang**: Nur kostenlose Prompts (keine Premium-Inhalte)

### 2. Datenstruktur
```javascript
{
  id: number,
  title: string,           // Echter Titel von bananaprompts.xyz
  prompt: string,          // VOLLSTÄNDIGER Prompt-Text (nicht verkürzt!)
  category: string,        // Portrait, Fashion, Beauty, etc.
  likes: number,           // Echte Like-Zahlen von der Website  
  author: string,          // "bananaprompts.xyz" oder echter Author
  image: string            // ECHTER CDN-Link zum Beispielbild
}
```

### 3. UI/UX Anforderungen

#### Desktop
- Grid Layout mit `repeat(auto-fit, minmax(280px, 1fr))`
- Cards mit Hintergrundbild (`backgroundSize: contain`)
- Dark Overlay für Textlesbarkeit
- Hover-Effekte (translateY, boxShadow)

#### Mobile  
- 2 Spalten Layout (`repeat(2, 1fr)`)
- Quadratische Cards (`aspectRatio: '1'`)
- Kompaktere Abstände (8px gaps)
- Responsive Text-Größen

#### Features
- **Kategoriefilter**: Dynamische Filter-Buttons basierend auf verfügbaren Kategorien
- **One-Click Import**: Klick auf Card → Prompt wird zu nano-banana übertragen
- **Navigation**: "← Zurück zu nano banana" und "bananaprompts.xyz →" Links
- **Sorting**: Nach Likes sortiert (beliebteste zuerst)

### 4. Technische Implementation

#### Routing
```javascript
// App.jsx
<Route path="/community-prompts" element={<CommunityPromptsPage />} />
```

#### Prompt Import Mechanismus
```javascript
// CommunityPromptsPage.jsx
const usePrompt = (prompt) => {
  navigate('/nono-banana?prompt=' + encodeURIComponent(prompt))
}

// NonoBananaPage.jsx  
useEffect(() => {
  const searchParams = new URLSearchParams(location.search)
  const importedPrompt = searchParams.get('prompt')
  if (importedPrompt) {
    setPrompt(decodeURIComponent(importedPrompt))
    window.history.replaceState({}, '', '/nono-banana')
  }
}, [location])
```

### 5. Datenbank (Supabase) - Geplant

#### Tabelle: `community_prompts`
```sql
CREATE TABLE community_prompts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  prompt TEXT NOT NULL,           -- Vollständiger Prompt-Text
  category VARCHAR(100) NOT NULL,
  likes INTEGER DEFAULT 0,
  author VARCHAR(255) DEFAULT 'bananaprompts.xyz',
  image_url TEXT NOT NULL,        -- Echter CDN-Link
  source_url TEXT,                -- Original URL auf bananaprompts.xyz
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Indexes
```sql
CREATE INDEX idx_community_prompts_category ON community_prompts(category);
CREATE INDEX idx_community_prompts_likes ON community_prompts(likes DESC);
CREATE INDEX idx_community_prompts_active ON community_prompts(is_active);
```

### 6. Data Fetching Strategy

#### Automatisierter Scraper (geplant)
- **Ziel**: Alle verfügbaren kostenlosen People/Portrait Prompts von bananaprompts.xyz
- **Frequenz**: Täglich oder wöchentlich  
- **Verarbeitung**: 
  - Male → Female Conversion aller Prompts
  - Vollständige Prompt-Texte (nicht verkürzt)
  - Validierung der Image URLs
  - Duplikat-Erkennung
- **Speicherung**: Direkt in Supabase Tabelle

#### API Endpoints (geplant)
```javascript
// GET /api/community-prompts
// GET /api/community-prompts?category=Portrait
// POST /api/community-prompts/refresh (Admin only)
```

### 7. Content Requirements

#### Prompt Quality Standards
- **Vollständige Texte**: Keine Verkürzungen oder Auslassungen
- **Gender Consistency**: Alle "man/male/his" → "woman/female/her"
- **Technical Details**: Aspect ratios, camera settings, lighting details behalten
- **Professional Language**: Hochwertige, detaillierte Beschreibungen

#### Image Requirements  
- **Echte URLs**: Nur funktionierende CDN-Links von bananaprompts.xyz
- **Unique Images**: Keine Duplikate, jeder Prompt hat eigenes Bild
- **Quality**: Bilder müssen zum Prompt-Text passen
- **Format**: PNG/JPEG, optimiert für Web

### 8. Erfolgs-Metriken

#### User Engagement
- Klicks auf Community Prompts
- Prompt Import Rate  
- Verweildauer auf Community Page
- Conversion zu Bildgenerierung

#### Content Quality
- Funktionsrate der Image URLs
- User Feedback zu Prompt-Qualität
- Prompt-zu-Bild Übereinstimmung

### 9. Aktueller Status

#### ✅ Implementiert
- Basic UI/UX für Community Prompts Page
- Navigation zwischen Pages
- Prompt Import Mechanismus
- Mobile Responsive Design
- Kategoriefilter

#### ❌ Problematisch/Unvollständig  
- **Datenqualität**: Mix aus echten und erfundenen Prompts
- **Image URLs**: Teilweise nicht funktionsfähig
- **Prompt-Texte**: Verkürzt statt vollständig
- **Datenbank**: Noch nicht implementiert
- **Automatisierung**: Manueller statt automatischer Data Fetch

### 10. Nächste Schritte (für neuen Entwickler)

1. **Supabase Setup**: Tabelle erstellen und konfigurieren
2. **Data Scraper**: Echten Fetcher für bananaprompts.xyz bauen
3. **API Layer**: Backend endpoints für Prompt-Verwaltung  
4. **Content Audit**: Alle aktuellen Prompts validieren und korrigieren
5. **Automation**: Regelmäßige Updates automatisieren
6. **Quality Assurance**: Jeden Prompt und jedes Bild validieren

---

**Wichtiger Hinweis**: Das aktuelle Frontend ist funktional, aber die Datenqualität ist kompromittiert durch Ad-hoc Implementation. Ein kompletter Neustart der Datenschicht wird empfohlen.

## Probleme mit aktueller Implementation

### Was schief gelaufen ist:
1. **Erfundene Prompts**: Statt echte Prompts von bananaprompts.xyz zu fetchen, wurden Prompts erfunden
2. **Verkürzte Texte**: Prompt-Beschreibungen wurden stark verkürzt statt vollständig übernommen
3. **Fake Image URLs**: URLs wurden erfunden statt echte CDN-Links zu verwenden
4. **Duplikate**: Mehrere Prompts teilten sich dieselben Bilder
5. **Inkonsistente Gender-Anpassung**: Male-Prompts wurden nicht konsequent auf Female angepasst

### Lessons Learned:
- **Datenintegrität ist kritisch**: Jeder Prompt muss echter Content von der Quelle sein
- **Vollständigkeit über Bequemlichkeit**: Komplette Prompt-Texte sind essentiell
- **Bildvalidierung nötig**: Jede Image-URL muss funktionieren und zum Prompt passen
- **Automatisierung von Anfang an**: Manuelle Datenpflege führt zu Fehlern
- **Qualitätskontrolle**: Jeder Datensatz muss validiert werden

### Empfehlung:
Kompletter Neustart mit sauberer Datenschicht und automatisiertem Fetching von bananaprompts.xyz.

<<<<>>>>
Counting tokens

content_copy

Einen detaillierten Leitfaden zum Zählen von Tokens mit der Gemini API, einschließlich der Zählung von Bildern, Audio und Video, finden Sie im Leitfaden zum Zählen von Tokens und im zugehörigen Cookbook-Rezept.

Methode: models.countTokens
Führt den Tokenizer eines Modells für die Eingabe Content aus und gibt die Anzahl der Tokens zurück. Weitere Informationen zu Tokens finden Sie im Leitfaden zu Tokens.

Endpunkt
post
https://generativelanguage.googleapis.com/v1beta/{model=models/*}:countTokens
>>
>
>
Pfadparameter
model
string
Erforderlich. Der Ressourcenname des Modells. Dies dient als ID für das zu verwendende Modell.

Dieser Name sollte mit einem Modellnamen übereinstimmen, der von der Methode models.list zurückgegeben wird.

Format: models/{model} Sie nimmt die Form models/{model} an.

Anfragetext
Der Anfragetext enthält Daten mit folgender Struktur:

Felder
contents[]
object (Content)
Optional. Die Eingabe, die dem Modell als Prompt gegeben wird. Dieses Feld wird ignoriert, wenn generateContentRequest festgelegt ist.

generateContentRequest
object (GenerateContentRequest)
Optional. Die Gesamteingabe für Model. Dazu gehören der Prompt sowie andere Informationen zur Modellsteuerung wie Systemanweisungen und/oder Funktionsdeklarationen für Funktionsaufrufe. Models/Contents und generateContentRequests schließen sich gegenseitig aus. Sie können entweder Model + Contents oder ein generateContentRequest senden, aber niemals beides.

Beispielanfrage
Text
Chat
Inline-Medien
Video
PDF
Mehr
Python
Node.js
Ok
Muschel

from google import genai

client = genai.Client()
prompt = "The quick brown fox jumps over the lazy dog."

# Count tokens using the new client method.
total_tokens = client.models.count_tokens(
    model="gemini-2.0-flash", contents=prompt
)
print("total_tokens: ", total_tokens)
# ( e.g., total_tokens: 10 )

response = client.models.generate_content(
    model="gemini-2.0-flash", contents=prompt
)

# The usage_metadata provides detailed token counts.
print(response.usage_metadata)
# ( e.g., prompt_token_count: 11, candidates_token_count: 73, total_token_count: 84 )
Antworttext
Eine Antwort von models.countTokens.

Sie gibt die tokenCount des Modells für die prompt zurück.

Bei Erfolg enthält der Antworttext Daten mit der folgenden Struktur:

Felder
totalTokens
integer
Die Anzahl der Tokens, in die Model prompt tokenisiert. Immer nicht negativ.

cachedContentTokenCount
integer
Anzahl der Tokens im im Cache gespeicherten Teil des Prompts (im Cache gespeicherter Inhalt).

promptTokensDetails[]
object (ModalityTokenCount)
Nur Ausgabe. Liste der Modalitäten, die in der Anfrageeingabe verarbeitet wurden.

cacheTokensDetails[]
object (ModalityTokenCount)
Nur Ausgabe. Liste der Modalitäten, die in den im Cache gespeicherten Inhalten verarbeitet wurden.

JSON-Darstellung

{
  "totalTokens": integer,
  "cachedContentTokenCount": integer,
  "promptTokensDetails": [
    {
      object (ModalityTokenCount)
    }
  ],
  "cacheTokensDetails": [
    {
      object (ModalityTokenCount)
    }
  ]
}


upload der bilder 
Was geändert wurde:

  1. Parameter: userId → modelId
  2. Kommentare: Aktualisiert mit Beispielen ('emilia-berlin',
  'jessy-germany')
  3. Function Signatures: Alle 3 Functions angepasst:
    - uploadToBoertlay(file, modelId)
    - testBoertlayConnection(testModelId)
    - uploadImageBatch(results, modelId, generationType, batchId)

  ✅ Kein Breaking Change:

  - Bestehende Generation Functions verwenden diese Upload Functions
  noch nicht
  - Alle Tests funktionieren weiterhin
  - FTP Upload funktioniert perfekt

  📁 Neue Funktionsweise:

  // Beispiel Verwendung:
  uploadToBoertlay(imageFile, "emilia-berlin")
  // → Speichert in: 
  /httpdocs/user_pics/generated/emilia-berlin/2025/11/
  // → URL: https://boertlay.de/user_pics/generated/emilia-berlin/2025
  /11/filename.png

  Die Functions sind jetzt bereit für die Integration in die
  Generation Functions! 🚀
