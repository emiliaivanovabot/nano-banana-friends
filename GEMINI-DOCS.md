# Bildgenerierung mit Gemini (auch bekannt als Nano Banana 🍌)

Gemini kann Bilder im Rahmen von Unterhaltungen generieren und verarbeiten. Sie können Gemini mit Text, Bildern oder einer Kombination aus beidem auffordern, Bilder zu erstellen, zu bearbeiten und zu iterieren:

- **Text-to-Image**: Generieren Sie hochwertige Bilder aus einfachen oder komplexen Textbeschreibungen.
- **Bild + Text-zu-Bild (Bearbeitung)**: Sie stellen ein Bild bereit und verwenden Text-Prompts, um Elemente hinzuzufügen, zu entfernen oder zu ändern, den Stil zu ändern oder die Farbkorrektur anzupassen.
- **Mehrere Bilder zu einem Bild (Komposition und Stilübertragung)**: Verwenden Sie mehrere Eingabebilder, um eine neue Szene zu erstellen oder den Stil von einem Bild auf ein anderes zu übertragen.
- **Iterative Verfeinerung**: Sie können Ihr Bild in mehreren Schritten verfeinern, indem Sie in einer Unterhaltung nach und nach kleine Anpassungen vornehmen, bis es perfekt ist.
- **Textwiedergabe in hoher Qualität**: Bilder mit lesbarem und gut platziertem Text werden präzise generiert. Das ist ideal für Logos, Diagramme und Poster.

## Modellauswahl

**Gemini 3 Pro Image Preview (Nano Banana Pro Preview)** - für professionelle Asset-Produktion:
- Ausgabe in hoher Auflösung: 1K, 2K und 4K
- Innovatives Text-Rendering
- Fundierung mit Google Suche
- Thinking-Modus
- Bis zu 14 Referenzbilder

**Gemini 2.5 Flash Image (Nano Banana)** - für Geschwindigkeit:
- Optimiert für hohe Geschwindigkeit und niedrige Latenz
- Generiert Bilder mit 1.024 Pixeln Auflösung

## API-Parameter für Bildgenerierung

### Wichtige Parameter:

```javascript
config: types.GenerateContentConfig({
    response_modalities: ['TEXT', 'IMAGE'], // oder nur ['IMAGE']
    image_config: types.ImageConfig({
        aspect_ratio: "9:16", // "1:1","2:3","3:2","3:4","4:3","4:5","5:4","9:16","16:9","21:9"
        image_size: "2K" // "1K", "2K", "4K" (nur für Gemini 3 Pro)
    }),
})
```

### Verfügbare Seitenverhältnisse:
- 1:1 (quadratisch)
- 2:3, 3:2 (klassisch)
- 3:4, 4:3 (Standard)
- 4:5, 5:4 (Portrait/Landscape)
- 9:16, 16:9 (Story/Widescreen)
- 21:9 (Ultrawide)

### Auflösungen (nur Gemini 3 Pro):
- "1K": 1024×1024 (Standard)
- "2K": 2048×2048 (Höhere Qualität)
- "4K": 4096×4096 (Maximale Qualität)

## Beispiel API-Call:

```javascript
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey
    },
    body: JSON.stringify({
      contents: [{
        role: "user",
        parts: [
          { text: prompt },
          // Bilder optional als inline_data hinzufügen
        ]
      }],
      generationConfig: {
        response_modalities: ['TEXT', 'IMAGE'],
        image_config: {
          aspect_ratio: "9:16",
          image_size: "2K" // nur für gemini-3-pro-image-preview
        }
      }
    })
  }
)
```

## Best Practices:

1. **Seien Sie spezifisch**: Beschreiben Sie die Szene detailliert statt nur Keywords
2. **Kontext angeben**: Erklären Sie den Zweck des Bildes
3. **Iterieren**: Nutzen Sie Folge-Prompts für Verfeinerungen
4. **Fotografische Begriffe**: Verwenden Sie Kamerawinkel, Beleuchtung, etc.

## Modell-Limits:
- Gemini 2.5 Flash: Bis zu 3 Eingabebilder
- Gemini 3 Pro: Bis zu 14 Eingabebilder
- Alle generierten Bilder enthalten SynthID-Wasserzeichen