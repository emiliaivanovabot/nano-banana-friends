# Parallel Generation Feature - Dokumentation

## Überblick

Das Parallel Generation Feature ermöglicht es, mehrere Bilder gleichzeitig zu generieren (aktuell 4x, geplant 10x). Die Implementation basiert auf der bestehenden `generateImage` Funktion und verwendet parallele API-Calls mit Promise.all.

## Aktuelle Implementation: 4x Generierung

### 1. UI Components

#### Button
- **Location**: `/src/pages/NonoBananaPage.jsx` (Zeile ~1607)
- **Design**: Grüner Button mit 4 Bananen 🍌🍌🍌🍌
- **States**: Normal / Loading / Disabled
- **onClick**: `generate4Images()`

```jsx
<button 
  onClick={generate4Images}
  disabled={!prompt.trim() || loading || multiLoading}
  className={`mobile-generate-button ${multiLoading ? 'loading' : ''}`}
  style={{ 
    background: multiLoading ? 
      'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 
      'linear-gradient(135deg, #10b981 0%, #059669 100%)'
  }}
>
  <span className="generate-icon">🍌🍌🍌🍌</span>
  <span className="generate-text">
    {multiLoading ? '4x Generiere...' : '4x Generierung'}
  </span>
</button>
```

#### Loading State
- **Design**: Gelber Hintergrund wie einzelne Generierung
- **Features**: Live-Timer, Wake Lock für Mobile
- **Location**: Zeile ~1725

```jsx
{multiLoading && (
  <div style={{ 
    backgroundColor: '#FEF3C7',
    borderRadius: '8px',
    textAlign: 'center'
  }}>
    <div style={{ fontSize: '2rem' }}>🍌🍌🍌🍌</div>
    <div style={{ color: '#D97706' }}>4x Generierung läuft...</div>
    <div style={{ fontFamily: 'monospace' }}>⏱️ {multiTimer}s</div>
  </div>
)}
```

#### Results Display
- **Design**: EXAKT wie einzelne Generierung - ein Block, ein Text, ein Button
- **Layout**: 2x2 Grid für die 4 Bilder
- **Features**: "Alle downloaden" Button, kein API-Text-Kauderwelsch
- **Location**: Zeile ~1761

### 2. Core Function: generate4Images()

#### Location
`/src/pages/NonoBananaPage.jsx` (Zeile ~756)

#### Workflow
```
1. Validation (Prompt vorhanden?)
2. State Setup (multiLoading = true, Timer starten)
3. Wake Lock für Mobile aktivieren
4. 4x parallele makeSingleCall() mit Promise.all
5. Results verarbeiten und anzeigen
6. Cleanup (Loading = false, Timer stoppen)
```

#### Key Implementation Details

**Exakte Kopie der generateImage Logik:**
```javascript
const makeSingleCall = async (index) => {
  // EXAKT gleiche API Key, Model, Personalization Logic
  const apiKey = userSettings?.gemini_api_key
  const model = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash-image'
  
  // EXAKT gleiche Prompt-Aufbereitung
  let finalPrompt = prompt
  if (showPersonalization && userSettings?.main_face_image_url && showMainFaceImage && userSettings) {
    const personalizationText = generatePersonalizationText()
    if (personalizationText) {
      finalPrompt = `${personalizationText}. ${prompt}`
    }
  }
  
  // EXAKT gleiche Request Body
  const requestBody = {
    contents: [{ role: "user", parts: parts }],
    generationConfig: {
      response_modalities: ['TEXT', 'IMAGE'],
      image_config: {
        aspect_ratio: aspectRatio,  // KORREKT übernommen
        image_size: resolution      // KORREKT übernommen  
      }
    }
  }
}
```

**Parallele Ausführung:**
```javascript
// 4 gleichzeitige API-Calls
const promises = [0, 1, 2, 3].map(index => makeSingleCall(index))
const results = await Promise.all(promises)
```

### 3. State Management

#### Neue State Variablen
```javascript
const [multiResults, setMultiResults] = useState([])      // Array mit 4 Results
const [multiLoading, setMultiLoading] = useState(false)   // Loading State
const [multiTimer, setMultiTimer] = useState(0)           // Live Timer
```

#### Result Structure
```javascript
// Pro Result:
{
  success: boolean,
  text: string,           // Text von API (wird aber nicht angezeigt)
  image: string | null,   // Base64 Image Data
  index: number,          // 0-3 für Debugging
  generationTime: string  // "5.2s"
}
```

### 4. Critical Lessons Learned

#### ❌ Was NICHT funktioniert hat
- **JSON Response Parsing**: API gibt NICHT JSON zurück, sondern Gemini-Format
- **Separate Rahmen**: User wollte einen Block wie bei einzelner Generierung
- **API-Text anzeigen**: "Is there anything else..." ist Müll

#### ✅ Was funktioniert
- **EXAKTE Kopie der generateImage Logik**: Alle Settings übernommen
- **Beide Image-Formate checken**: `part.inline_data` UND `part.inlineData`
- **Ein Block Design**: Wie einzelne Generierung mit 4 Bildern im Grid

### 5. Performance Considerations

#### API Rate Limits
- **Gemini API**: Parallele Requests sind erlaubt
- **User API Key**: Verwendet individuellen Schlüssel (nicht geteiltes Limit)
- **Retry Logic**: Jeder Call hat eigene 3x Retry-Mechanismus

#### Mobile Optimizations
- **Wake Lock**: Verhindert Sleep während Generierung
- **Resource Management**: Wake Lock wird korrekt freigegeben
- **UI Feedback**: Live Timer zeigt Fortschritt

## Geplante Erweiterung: 10x Generierung

### Implementation Strategy

#### Button Layout
```
[🍌 Einzeln] [🍌🍌🍌🍌 4x] [🍌🍌🍌🍌🍌🍌🍌🍌🍌🍌 10x]
```

#### Grid Layout
- **Desktop**: 2x5 oder 5x2 Grid
- **Mobile**: 2x5 Grid (vertical scroll)

#### Performance Considerations
```javascript
// 10x parallel calls - gleiche Logik
const promises = Array.from({length: 10}, (_, i) => makeSingleCall(i))
const results = await Promise.all(promises)
```

#### State Changes Needed
```javascript
const [multiCount, setMultiCount] = useState(4)  // 4 oder 10
const generate10Images = () => { /* copy von generate4Images */ }
```

### 6. Technical Requirements für 10x

#### Memory Usage
- **Pro Bild**: ~2-5MB base64 data
- **10 Bilder**: ~20-50MB im Browser Speicher
- **Cleanup**: Results nach Download leeren?

#### API Cost
- **10x Requests**: 10x die Kosten einer einzelnen Generierung
- **User Bewusstsein**: Warnung vor hohen Kosten einbauen?

#### Error Handling
```javascript
// Success Rate bei 10x
const successCount = results.filter(r => r.success).length
if (successCount < 5) {
  alert(`Nur ${successCount}/10 Bilder erfolgreich generiert`)
}
```

## Development Checklist für 10x

### Code Changes
- [ ] `generate10Images()` Funktion erstellen (Kopie von generate4Images)
- [ ] Button UI erweitern (3 Buttons: 1x, 4x, 10x)
- [ ] Grid Layout für 10 Bilder anpassen
- [ ] State Management erweitern (`multiCount` Variable)
- [ ] Loading States anpassen (10 Bananen, Timer)
- [ ] Download Logic für 10 Bilder testen

### UX Considerations
- [ ] Cost Warning für 10x einbauen
- [ ] Progressive Loading UI? (einzelne Bilder erscheinen nacheinander)
- [ ] Memory Management testen (Browser Crash bei großen Bildern?)
- [ ] Mobile Scrolling für 10 Bilder optimieren

### Testing
- [ ] API Rate Limits bei 10 parallelen Calls testen
- [ ] Error Handling bei partiellen Failures
- [ ] Download Performance bei 10 Bildern
- [ ] Mobile Performance und Memory Usage

## Best Practices

### 1. Code Reuse
- **IMMER** die generateImage Logik kopieren (nicht neu erfinden)
- **ALLE** Settings übernehmen (Personalization, Resolution, AspectRatio)
- **EXAKTE** API Request Body Struktur verwenden

### 2. User Experience
- **Ein Block Design** für Results (nicht separate Rahmen)
- **Sinnvoller Text** statt API-Response anzeigen
- **Konsistente Timer** und Loading States
- **Ein Download Button** für alle Bilder

### 3. Error Handling
- **Partial Success** erlauben (7/10 Bilder OK = trotzdem anzeigen)
- **Clear Error Messages** ohne technische Details
- **Graceful Degradation** wenn API überlastet

### 4. Performance
- **Wake Lock** für Mobile längere Generierungen
- **Memory Cleanup** nach großen Generierungen
- **Progress Feedback** für User während langen Waits

## Conclusion

Das 4x Feature ist ein solider Proof-of-Concept für parallele Generierung. Die Erweiterung auf 10x sollte straightforward sein, da die Architektur skaliert. Der Schlüssel ist die exakte Replikation der bestehenden generateImage Logik ohne eigene "Verbesserungen".

**Nächster Schritt**: 10x Button implementieren basierend auf dieser Dokumentation.