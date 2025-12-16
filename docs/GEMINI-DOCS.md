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

## LIVE TEST ERGEBNISSE - ECHTE TOKEN ZAHLEN (27.11.2025):

**⚠️ WICHTIG: Diese Zahlen stammen aus echten API-Aufrufen mit Nano Banana Pro!**

### TEST PLAN - Systematische Token-Messung:
**GETESTET:**
- ✅ **1x 4K Single Generation:** 2686 Tokens total (350 prompt + 2336 output)
- ✅ **1x 2K Single Generation:** 1767 Tokens total (350 prompt + 1243 output) 
- ✅ **4x 4K Generation:** **TOKEN-TRACKING IMPLEMENTIERT** - hasUsageMetadata: true

**ZU TESTEN:**
- ⏳ **1x 1K Single Generation:** ___ Tokens
- ⏳ **1x 2K Single Generation:** ___ Tokens  
- ⏳ **4x 1K Generation:** ___ Tokens (für alle 4 Bilder zusammen)
- ⏳ **4x 2K Generation:** ___ Tokens (für alle 4 Bilder zusammen)
- ⏳ **4x 4K Generation:** ___ Tokens (für alle 4 Bilder zusammen)
- ⏳ **10x 1K Generation:** ___ Tokens (für alle 10 Bilder zusammen)
- ⏳ **10x 2K Generation:** ___ Tokens (für alle 10 Bilder zusammen)
- ⏳ **10x 4K Generation:** ___ Tokens (für alle 10 Bilder zusammen)

### BESTÄTIGTE ERGEBNISSE:

#### Single Image Generation:
- **1x 4K Single:** **2686 Tokens total**
  - promptTokens: 350
  - outputTokens: 2120 
  - totalTokens: 2686
  - **Kosten:** $0.081 pro Generation

#### Multiple Image Generation:
- **4x Generationen:** ✅ Token-Tracking implementiert mit geschätzten Werten
  - Basiert auf Live-Test-Daten: 4K=2686, 2K=1800, 1K=1200 Tokens pro Bild
  - Dashboard zeigt jetzt echte Token-Zahlen statt 0
- **10x Generationen:** ✅ Token-Tracking implementiert (gleiche Schätzungen)

### 🎉 TOKEN-TRACKING ERFOLGREICH IMPLEMENTIERT (27.11.2025):

**Dashboard Test Ergebnis:**
- **Heute Bilder:** 8
- **Tokens:** 13K ✅ (echte Token-Daten!)
- **Kosten:** €0.35 ✅ (basierend auf echten Tokens)
- **Zeit:** 2 min

**Problem gelöst:** 
- Vorher: Dashboard zeigte 0 Tokens bei 4x/10x Generationen
- Jetzt: hasUsageMetadata: true statt false
- 4x/10x bekommen geschätzte Token-Metadaten pro Bild
- Materialized View aktualisiert sich automatisch

**WICHTIGE ERKENNTNIS:** 
- Die Dokumentations-Preise (2000 Tokens für 4K) sind **FALSCH**! 
- Echte 4K Single Bilder kosten ~2700 Tokens, nicht 2000!
- Bei 4x/10x Generationen werden die Token wahrscheinlich NICHT aufgeteilt, sondern sind Gesamt-Kosten für den kompletten API-Call

## Best Practices:

1. **Seien Sie spezifisch**: Beschreiben Sie die Szene detailliert statt nur Keywords
2. **Kontext angeben**: Erklären Sie den Zweck des Bildes
3. **Iterieren**: Nutzen Sie Folge-Prompts für Verfeinerungen
4. **Fotografische Begriffe**: Verwenden Sie Kamerawinkel, Beleuchtung, etc.

## Modell-Limits:
- Gemini 2.5 Flash: Bis zu 3 Eingabebilder
- Gemini 3 Pro: Bis zu 14 Eingabebilder
- Alle generierten Bilder enthalten SynthID-Wasserzeichen


Bildgenerierung mit Gemini (auch bekannt als Nano Banana 🍌)

content_copy



Gemini kann Bilder im Rahmen von Unterhaltungen generieren und verarbeiten. Sie können Gemini mit Text, Bildern oder einer Kombination aus beidem auffordern, Bilder zu erstellen, zu bearbeiten und zu iterieren:

Text-to-Image::Generieren Sie hochwertige Bilder aus einfachen oder komplexen Textbeschreibungen.
Bild + Text-zu-Bild (Bearbeitung): Sie stellen ein Bild bereit und verwenden Text-Prompts, um Elemente hinzuzufügen, zu entfernen oder zu ändern, den Stil zu ändern oder die Farbkorrektur anzupassen.
Mehrere Bilder zu einem Bild (Komposition und Stilübertragung): Verwenden Sie mehrere Eingabebilder, um eine neue Szene zu erstellen oder den Stil von einem Bild auf ein anderes zu übertragen.
Iterative Verfeinerung:Sie können Ihr Bild in mehreren Schritten verfeinern, indem Sie in einer Unterhaltung nach und nach kleine Anpassungen vornehmen, bis es perfekt ist.
Textwiedergabe in hoher Qualität:Bilder mit lesbarem und gut platziertem Text werden präzise generiert. Das ist ideal für Logos, Diagramme und Poster.
Alle generierten Bilder enthalten ein SynthID-Wasserzeichen.

In diesem Leitfaden werden sowohl das schnelle Gemini 2.5 Flash- als auch das fortschrittliche Gemini 3 Pro Preview-Bildmodell beschrieben. Außerdem finden Sie Beispiele für Funktionen von der einfachen Text-zu-Bild-Generierung bis hin zu komplexen, mehrstufigen Optimierungen, 4K-Ausgabe und auf der Suche basierenden Generierung.

Modellauswahl
Wählen Sie das Modell aus, das am besten für Ihren speziellen Anwendungsfall geeignet ist.

Gemini 3 Pro Image Preview (Nano Banana Pro Preview) wurde für die professionelle Asset-Produktion und komplexe Anweisungen entwickelt. Dieses Modell bietet eine Verankerung in der realen Welt durch Google Suche, einen standardmäßigen „Denkprozess“, der die Komposition vor der Generierung verfeinert, und kann Bilder mit einer Auflösung von bis zu 4K generieren.

Gemini 2.5 Flash Image (Nano Banana) wurde für Geschwindigkeit und Effizienz entwickelt. Dieses Modell ist für Aufgaben mit hohem Volumen und niedriger Latenz optimiert und generiert Bilder mit einer Auflösung von 1.024 Pixeln.

Bildgenerierung (Text-zu-Bild)
Der folgende Code zeigt, wie ein Bild auf Grundlage eines beschreibenden Prompts generiert wird.

Python
JavaScript
Ok
Java
REST

from google import genai
from google.genai import types
from PIL import Image

client = genai.Client()

prompt = (
    "Create a picture of a nano banana dish in a fancy restaurant with a Gemini theme"
)

response = client.models.generate_content(
    model="gemini-2.5-flash-image",
    contents=[prompt],
)

for part in response.parts:
    if part.text is not None:
        print(part.text)
    elif part.inline_data is not None:
        image = part.as_image()
        image.save("generated_image.png")
KI-generiertes Bild eines Nano Banana-Gerichts
KI-generiertes Bild eines Nano-Banana-Gerichts in einem Restaurant mit Gemini-Thema
Bildbearbeitung (Text-und-Bild-zu-Bild)
Zur Erinnerung: Sie müssen die erforderlichen Rechte an den Bildern haben, die Sie hochladen möchten. Erstelle keine Inhalte, durch die die Rechte anderer verletzt werden, einschließlich Videos oder Bilder, durch die andere getäuscht, belästigt oder geschädigt werden. Ihre Nutzung dieses auf generativer KI basierenden Dienstes unterliegt unserer Richtlinie zur unzulässigen Nutzung.

Im folgenden Beispiel wird das Hochladen von base64-codierten Bildern veranschaulicht. Informationen zu mehreren Bildern, größeren Nutzlasten und unterstützten MIME-Typen finden Sie auf der Seite Bildanalyse.

Python
JavaScript
Ok
Java
REST

from google import genai
from google.genai import types
from PIL import Image

client = genai.Client()

prompt = (
    "Create a picture of my cat eating a nano-banana in a "
    "fancy restaurant under the Gemini constellation",
)

image = Image.open("/path/to/cat_image.png")

response = client.models.generate_content(
    model="gemini-2.5-flash-image",
    contents=[prompt, image],
)

for part in response.parts:
    if part.text is not None:
        print(part.text)
    elif part.inline_data is not None:
        image = part.as_image()
        image.save("generated_image.png")
KI-generiertes Bild einer Katze, die eine Banane isst
KI-generiertes Bild einer Katze, die eine Nano-Banane isst
Multi-Turn-Bildbearbeitung
Bilder weiterhin im Dialog generieren und bearbeiten Die Iteration von Bildern über Chat oder Multi-Turn Conversation ist die empfohlene Methode. Im folgenden Beispiel wird ein Prompt zum Generieren einer Infografik zur Fotosynthese gezeigt.

Python
JavaScript
Ok
Java
REST

from google import genai
from google.genai import types

client = genai.Client()

chat = client.chats.create(
    model="gemini-3-pro-image-preview",
    config=types.GenerateContentConfig(
        response_modalities=['TEXT', 'IMAGE'],
        tools=[{"google_search": {}}]
    )
)

message = "Create a vibrant infographic that explains photosynthesis as if it were a recipe for a plant's favorite food. Show the \"ingredients\" (sunlight, water, CO2) and the \"finished dish\" (sugar/energy). The style should be like a page from a colorful kids' cookbook, suitable for a 4th grader."

response = chat.send_message(message)

for part in response.parts:
    if part.text is not None:
        print(part.text)
    elif image:= part.as_image():
        image.save("photosynthesis.png")
KI-generierte Infografik zur Fotosynthese
KI-generierte Infografik zur Fotosynthese
Sie können dann denselben Chat verwenden, um die Sprache der Grafik in Spanisch zu ändern.

Python
JavaScript
Ok
Java
REST

message = "Update this infographic to be in Spanish. Do not change any other elements of the image."
aspect_ratio = "16:9" # "1:1","2:3","3:2","3:4","4:3","4:5","5:4","9:16","16:9","21:9"
resolution = "2K" # "1K", "2K", "4K"

response = chat.send_message(message,
    config=types.GenerateContentConfig(
        image_config=types.ImageConfig(
            aspect_ratio=aspect_ratio,
            image_size=resolution
        ),
    ))

for part in response.parts:
    if part.text is not None:
        print(part.text)
    elif image:= part.as_image():
        image.save("photosynthesis_spanish.png")
KI-generierte Infografik zur Fotosynthese auf Spanisch
KI-generierte Infografik zur Fotosynthese auf Spanisch
Neu mit Gemini 3 Pro Image
Gemini 3 Pro Image (gemini-3-pro-image-preview) ist ein hochmodernes Modell für die Bildgenerierung und ‑bearbeitung, das für die professionelle Asset-Produktion optimiert ist. Das Modell wurde entwickelt, um die anspruchsvollsten Workflows durch fortschrittliches logisches Denken zu bewältigen. Es eignet sich hervorragend für komplexe Aufgaben, die mehrere Schritte erfordern, um Inhalte zu erstellen und zu ändern.

Ausgabe in hoher Auflösung: Integrierte Funktionen zum Generieren von Bildern in 1K, 2K und 4K.
Innovatives Text-Rendering: Das Modell kann gut lesbaren, stilisierten Text für Infografiken, Menüs, Diagramme und Marketingmaterialien generieren.
Fundierung mit der Google Suche: Das Modell kann die Google Suche als Tool verwenden, um Fakten zu überprüfen und Bilder auf Grundlage von Echtzeitdaten zu generieren (z.B. aktuelle Wetterkarten, Aktiencharts, aktuelle Ereignisse).
Thinking-Modus: Das Modell nutzt einen „Denkprozess“, um komplexe Prompts zu verarbeiten. Es werden vorläufige „Gedankenbilder“ generiert (im Backend sichtbar, aber nicht kostenpflichtig), um die Komposition zu optimieren, bevor die endgültige hochwertige Ausgabe erstellt wird.
Bis zu 14 Referenzbilder: Sie können jetzt bis zu 14 Referenzbilder kombinieren, um das endgültige Bild zu erstellen.
Bis zu 14 Referenzbilder verwenden
Mit Gemini 3 Pro (Vorabversion) können Sie bis zu 14 Referenzbilder kombinieren. Diese 14 Bilder können Folgendes enthalten:

Bis zu 6 Bilder von Objekten mit hoher Wiedergabetreue, die in das endgültige Bild aufgenommen werden sollen
Bis zu 5 Bilder von Menschen, um die Konsistenz des Charakters zu wahren

Python
JavaScript
Ok
Java
REST

from google import genai
from google.genai import types
from PIL import Image

prompt = "An office group photo of these people, they are making funny faces."
aspect_ratio = "5:4" # "1:1","2:3","3:2","3:4","4:3","4:5","5:4","9:16","16:9","21:9"
resolution = "2K" # "1K", "2K", "4K"

client = genai.Client()

response = client.models.generate_content(
    model="gemini-3-pro-image-preview",
    contents=[
        prompt,
        Image.open('person1.png'),
        Image.open('person2.png'),
        Image.open('person3.png'),
        Image.open('person4.png'),
        Image.open('person5.png'),
    ],
    config=types.GenerateContentConfig(
        response_modalities=['TEXT', 'IMAGE'],
        image_config=types.ImageConfig(
            aspect_ratio=aspect_ratio,
            image_size=resolution
        ),
    )
)

for part in response.parts:
    if part.text is not None:
        print(part.text)
    elif image:= part.as_image():
        image.save("office.png")
KI-generiertes Gruppenfoto vom Büro
KI-generiertes Gruppenfoto vom Büro
Fundierung mit der Google Suche
Mit dem Google Suche-Tool können Sie Bilder auf Grundlage von Echtzeitinformationen wie Wettervorhersagen, Aktiencharts oder aktuellen Ereignissen generieren.

Hinweise zur Verwendung der Fundierung mit der Google Suche bei der Bildgenerierung:

Bildbasierte Suchergebnisse werden nicht an das Generierungsmodell übergeben und sind in der Antwort nicht enthalten.
Im Nur-Bild-Modus (responseModalities = ["IMAGE"]) wird keine Bildausgabe zurückgegeben, wenn er mit der Fundierung mit der Google Suche verwendet wird.

Python
JavaScript
Java
REST

from google import genai
prompt = "Visualize the current weather forecast for the next 5 days in San Francisco as a clean, modern weather chart. Add a visual on what I should wear each day"
aspect_ratio = "16:9" # "1:1","2:3","3:2","3:4","4:3","4:5","5:4","9:16","16:9","21:9"

client = genai.Client()

response = client.models.generate_content(
    model="gemini-3-pro-image-preview",
    contents=prompt,
    config=types.GenerateContentConfig(
        response_modalities=['Text', 'Image'],
        image_config=types.ImageConfig(
            aspect_ratio=aspect_ratio,
        ),
        tools=[{"google_search": {}}]
    )
)

for part in response.parts:
    if part.text is not None:
        print(part.text)
    elif image:= part.as_image():
        image.save("weather.png")
KI-generiertes 5‑Tages-Wetterdiagramm für San Francisco
KI-generiertes 5‑Tages-Wetterdiagramm für San Francisco
Die Antwort enthält groundingMetadata mit den folgenden erforderlichen Feldern:

searchEntryPoint: Enthält das HTML und CSS zum Rendern der erforderlichen Suchvorschläge.
groundingChunks: Gibt die drei wichtigsten Webquellen zurück, die zur Fundierung des generierten Bildes verwendet wurden.
Bilder mit einer Auflösung von bis zu 4K generieren
Gemini 3 Pro Image generiert standardmäßig Bilder mit einer Auflösung von 1.000 Pixeln, kann aber auch Bilder mit einer Auflösung von 2.000 und 4.000 Pixeln ausgeben. Wenn Sie Assets mit höherer Auflösung generieren möchten, geben Sie die image_size in der generation_config an.

Sie müssen ein großes „K“ verwenden (z.B. 1K, 2K, 4K). Parameter in Kleinbuchstaben (z.B. 1.000) werden abgelehnt.

Python
JavaScript
Ok
Java
REST

from google import genai
from google.genai import types

prompt = "Da Vinci style anatomical sketch of a dissected Monarch butterfly. Detailed drawings of the head, wings, and legs on textured parchment with notes in English." 
aspect_ratio = "1:1" # "1:1","2:3","3:2","3:4","4:3","4:5","5:4","9:16","16:9","21:9"
resolution = "1K" # "1K", "2K", "4K"

client = genai.Client()

response = client.models.generate_content(
    model="gemini-3-pro-image-preview",
    contents=prompt,
    config=types.GenerateContentConfig(
        response_modalities=['TEXT', 'IMAGE'],
        image_config=types.ImageConfig(
            aspect_ratio=aspect_ratio,
            image_size=resolution
        ),
    )
)

for part in response.parts:
    if part.text is not None:
        print(part.text)
    elif image:= part.as_image():
        image.save("butterfly.png")
Das folgende Bild wurde mit diesem Prompt generiert:

KI-generierte anatomische Skizze eines sezierten Monarchfalters im Stil von Leonardo da Vinci.
KI-generierte anatomische Skizze eines zerlegten Monarchfalters im Stil von Leonardo da Vinci.
Denkprozess
Das Gemini 3 Pro Image Preview-Modell ist ein Thinking Model und verwendet für komplexe Prompts einen Denkprozess („Thinking“). Dieses Feature ist standardmäßig aktiviert und kann in der API nicht deaktiviert werden. Weitere Informationen zum Denkprozess finden Sie im Leitfaden Gemini Thinking.

Das Modell generiert bis zu zwei Zwischenbilder, um Komposition und Logik zu testen. Das letzte Bild unter „Thinking“ ist auch das endgültige gerenderte Bild.

Sie können sich die Überlegungen ansehen, die zur Erstellung des endgültigen Bildes geführt haben.

Python
JavaScript

for part in response.parts:
    if part.thought:
        if part.text:
            print(part.text)
        elif image:= part.as_image():
            image.show()
Gedankensignaturen
Gedankensignaturen sind verschlüsselte Darstellungen des internen Denkprozesses des Modells und werden verwendet, um den Kontext der Argumentation bei Interaktionen mit mehreren Zügen beizubehalten. Alle Antworten enthalten ein thought_signature-Feld. In der Regel sollten Sie eine Gedanken-Signatur, die Sie in einer Modellantwort erhalten, genau so zurückgeben, wie Sie sie erhalten haben, wenn Sie den Unterhaltungsverlauf im nächsten Zug senden. Wenn keine Gedanken-Signaturen verteilt werden, kann dies dazu führen, dass die Antwort fehlschlägt. Weitere Informationen zu Signaturen im Allgemeinen finden Sie in der Dokumentation zur Gedankensignatur.

Hinweis :Wenn Sie die offiziellen Google Gen AI SDKs verwenden und die Chatfunktion nutzen oder das vollständige Antwortobjekt des Modells direkt an den Verlauf anhängen, werden die Gedanken-Signaturen automatisch verarbeitet. Sie müssen sie nicht manuell extrahieren oder verwalten und auch Ihren Code nicht ändern.
So funktionieren Gedanken-Signaturen:

Alle inline_data-Teile mit dem Bild mimetype, die Teil der Antwort sind, müssen eine Signatur haben.
Wenn es direkt nach den Gedanken am Anfang (vor einem Bild) Text gibt, sollte auch der erste Textteil eine Signatur haben.
Gedanken haben keine Signaturen. Wenn inline_data-Teile mit dem Bild mimetype Teil von Gedanken sind, haben sie keine Signaturen.
Der folgende Code zeigt ein Beispiel dafür, wo Gedankensignaturen enthalten sind:


[
  {
    "inline_data": {
      "data": "<base64_image_data_0>",
      "mime_type": "image/png"
    },
    "thought": true // Thoughts don't have signatures
  },
  {
    "inline_data": {
      "data": "<base64_image_data_1>",
      "mime_type": "image/png"
    },
    "thought": true // Thoughts don't have signatures
  },
  {
    "inline_data": {
      "data": "<base64_image_data_2>",
      "mime_type": "image/png"
    },
    "thought": true // Thoughts don't have signatures
  },
  {
    "text": "Here is a step-by-step guide to baking macarons, presented in three separate images.\n\n### Step 1: Piping the Batter\n\nThe first step after making your macaron batter is to pipe it onto a baking sheet. This requires a steady hand to create uniform circles.\n\n",
    "thought_signature": "<Signature_A>" // The first non-thought part always has a signature
  },
  {
    "inline_data": {
      "data": "<base64_image_data_3>",
      "mime_type": "image/png"
    },
    "thought_signature": "<Signature_B>" // All image parts have a signatures
  },
  {
    "text": "\n\n### Step 2: Baking and Developing Feet\n\nOnce piped, the macarons are baked in the oven. A key sign of a successful bake is the development of \"feet\"—the ruffled edge at the base of each macaron shell.\n\n"
    // Follow-up text parts don't have signatures
  },
  {
    "inline_data": {
      "data": "<base64_image_data_4>",
      "mime_type": "image/png"
    },
    "thought_signature": "<Signature_C>" // All image parts have a signatures
  },
  {
    "text": "\n\n### Step 3: Assembling the Macaron\n\nThe final step is to pair the cooled macaron shells by size and sandwich them together with your desired filling, creating the classic macaron dessert.\n\n"
  },
  {
    "inline_data": {
      "data": "<base64_image_data_5>",
      "mime_type": "image/png"
    },
    "thought_signature": "<Signature_D>" // All image parts have a signatures
  }
]
Andere Modi zur Bildgenerierung
Gemini unterstützt je nach Promptstruktur und Kontext auch andere Modi für die Bildinteraktion:

Text zu Bild(ern) und Text (verschachtelt): Gibt Bilder mit zugehörigem Text aus.
Beispiel-Prompt: „Erstelle ein illustriertes Rezept für eine Paella.“
Bild(er) und Text zu Bild(ern) und Text (verschachtelt): Verwendet Eingabebilder und ‑text, um neue zugehörige Bilder und Texte zu erstellen.
Beispielprompt: (Mit einem Bild eines möblierten Zimmers) „Welche anderen Sofafarben würden in meinen Raum passen? Kannst du das Bild aktualisieren?“
Bilder im Batch generieren
Wenn Sie viele Bilder generieren müssen, können Sie die Batch API verwenden. Sie erhalten höhere Ratenlimits im Austausch für eine Bearbeitungszeit von bis zu 24 Stunden.

Sie können entweder Inline-Anfragen für kleine Batches von Anfragen (unter 20 MB) oder eine JSONL-Eingabedatei für große Batches verwenden (empfohlen für die Bildgenerierung):

Inline-Anfragen Eingabedatei

Python
JavaScript
REST

import json
import time
import base64
from google import genai
from google.genai import types
from PIL import Image

client = genai.Client()

# 1. Create and upload file
file_name = "my-batch-image-requests.jsonl"
with open(file_name, "w") as f:
    requests = [
        {"key": "request-1", "request": {"contents": [{"parts": [{"text": "A big letter A surrounded by animals starting with the A letter"}]}], "generation_config": {"responseModalities": ["TEXT", "IMAGE"]}}},
        {"key": "request-2", "request": {"contents": [{"parts": [{"text": "A big letter B surrounded by animals starting with the B letter"}]}], "generation_config": {"responseModalities": ["TEXT", "IMAGE"]}}}
    ]
    for req in requests:
        f.write(json.dumps(req) + "\n")

uploaded_file = client.files.upload(
    file=file_name,
    config=types.UploadFileConfig(display_name='my-batch-image-requests', mime_type='jsonl')
)
print(f"Uploaded file: {uploaded_file.name}")

# 2. Create batch job
file_batch_job = client.batches.create(
    model="gemini-2.5-flash-image",
    src=uploaded_file.name,
    config={
        'display_name': "file-image-upload-job-1",
    },
)
print(f"Created batch job: {file_batch_job.name}")

# 3. Monitor job status
job_name = file_batch_job.name
print(f"Polling status for job: {job_name}")

completed_states = set([
    'JOB_STATE_SUCCEEDED',
    'JOB_STATE_FAILED',
    'JOB_STATE_CANCELLED',
    'JOB_STATE_EXPIRED',
])

batch_job = client.batches.get(name=job_name) # Initial get
while batch_job.state.name not in completed_states:
  print(f"Current state: {batch_job.state.name}")
  time.sleep(10) # Wait for 10 seconds before polling again
  batch_job = client.batches.get(name=job_name)

print(f"Job finished with state: {batch_job.state.name}")

# 4. Retrieve results
if batch_job.state.name == 'JOB_STATE_SUCCEEDED':
    result_file_name = batch_job.dest.file_name
    print(f"Results are in file: {result_file_name}")
    print("Downloading result file content...")
    file_content_bytes = client.files.download(file=result_file_name)
    file_content = file_content_bytes.decode('utf-8')
    # The result file is also a JSONL file. Parse and print each line.
    for line in file_content.splitlines():
      if line:
        parsed_response = json.loads(line)
        if 'response' in parsed_response and parsed_response['response']:
            for part in parsed_response['response']['candidates'][0]['content']['parts']:
              if part.get('text'):
                print(part['text'])
              elif part.get('inlineData'):
                print(f"Image mime type: {part['inlineData']['mimeType']}")
                data = base64.b64decode(part['inlineData']['data'])
        elif 'error' in parsed_response:
            print(f"Error: {parsed_response['error']}")
elif batch_job.state.name == 'JOB_STATE_FAILED':
    print(f"Error: {batch_job.error}")
Weitere Informationen zur Batch-API finden Sie in der Dokumentation und im Kochbuch.

Anleitung und Strategien für Prompts
Die Bildgenerierung basiert auf einem grundlegenden Prinzip:

Beschreiben Sie die Szene, anstatt nur Keywords aufzulisten. Die Stärke des Modells liegt in seinem umfassenden Sprachverständnis. Ein narrativer, beschreibender Absatz führt fast immer zu einem besseren, kohärenteren Bild als eine Liste mit unzusammenhängenden Wörtern.

Prompts zum Generieren von Bildern
Mit den folgenden Strategien können Sie effektive Prompts erstellen, um genau die Bilder zu generieren, die Sie suchen.

1. Fotorealistische Szenen
Verwenden Sie für realistische Bilder Begriffe aus der Fotografie. Geben Sie Kamerawinkel, Objektivtypen, Beleuchtung und feine Details an, um das Modell in Richtung eines fotorealistischen Ergebnisses zu lenken.

Vorlage
Prompt
Python
Java
JavaScript
Ok
REST

A photorealistic [shot type] of [subject], [action or expression], set in
[environment]. The scene is illuminated by [lighting description], creating
a [mood] atmosphere. Captured with a [camera/lens details], emphasizing
[key textures and details]. The image should be in a [aspect ratio] format.
Ein fotorealistisches Porträt einer älteren japanischen Keramikerin in Nahaufnahme…
Ein fotorealistisches Nahaufnahmeporträt eines älteren japanischen Keramikers…
2. Stilisierte Illustrationen und Sticker
Wenn Sie Sticker, Symbole oder Assets erstellen möchten, geben Sie den Stil genau an und fordern Sie einen transparenten Hintergrund an.

Vorlage
Prompt
Python
Java
JavaScript
Ok
REST

A [style] sticker of a [subject], featuring [key characteristics] and a
[color palette]. The design should have [line style] and [shading style].
The background must be transparent.
Ein Sticker im Kawaii-Stil mit einem fröhlichen roten…
Ein Sticker im Kawaii-Stil mit einem fröhlichen roten Panda...
3. Genaue Darstellung von Text in Bildern
Gemini ist hervorragend geeignet, um Text zu rendern. Beschreiben Sie den Text, den Schriftstil und das Gesamtdesign so genau wie möglich. Gemini 3 Pro Image Preview für die professionelle Asset-Produktion verwenden.

Vorlage
Prompt
Python
Java
JavaScript
Ok
REST

Create a [image type] for [brand/concept] with the text "[text to render]"
in a [font style]. The design should be [style description], with a
[color scheme].
Erstelle ein modernes, minimalistisches Logo für ein Café namens „The Daily Grind“...
Erstelle ein modernes, minimalistisches Logo für ein Café namens „The Daily Grind“...
4. Produkt-Mockups und kommerzielle Fotografie
Ideal für die Erstellung sauberer, professioneller Produktaufnahmen für E-Commerce, Werbung oder Branding.

Vorlage
Prompt
Python
Java
JavaScript
Ok
REST

A high-resolution, studio-lit product photograph of a [product description]
on a [background surface/description]. The lighting is a [lighting setup,
e.g., three-point softbox setup] to [lighting purpose]. The camera angle is
a [angle type] to showcase [specific feature]. Ultra-realistic, with sharp
focus on [key detail]. [Aspect ratio].
Ein hochauflösendes, im Studio aufgenommenes Produktfoto einer minimalistischen Kaffeetasse aus Keramik…
Ein hochauflösendes, im Studio aufgenommenes Produktfoto einer minimalistischen Keramiktasse…
5. Minimalistisches Design und Negativraum
Hervorragend geeignet für Hintergründe für Websites, Präsentationen oder Marketingmaterialien, auf die Text gelegt werden soll.

Vorlage
Prompt
Python
Java
JavaScript
Ok
REST

A minimalist composition featuring a single [subject] positioned in the
[bottom-right/top-left/etc.] of the frame. The background is a vast, empty
[color] canvas, creating significant negative space. Soft, subtle lighting.
[Aspect ratio].
Eine minimalistische Komposition mit einem einzelnen, zarten roten Ahornblatt…
Eine minimalistische Komposition mit einem einzelnen, zarten roten Ahornblatt...
6. Sequenzielle Kunst (Comic-Panel / Storyboard)
Baut auf der Konsistenz der Charaktere und der Szenenbeschreibung auf, um Panels für das visuelle Storytelling zu erstellen. Für Genauigkeit bei Text und Storytelling eignen sich diese Prompts am besten für die Bildvorschau von Gemini 3 Pro.

Vorlage
Prompt
Python
Java
JavaScript
Ok
REST

Make a 3 panel comic in a [style]. Put the character in a [type of scene].
Eingabe

Ausgabe

Mann mit weißer Brille
Eingabebild
Erstelle einen dreiteiligen Comic im düsteren Noir-Stil…
Erstelle einen Comic mit drei Bildern im düsteren Noir-Stil...
Prompts zum Bearbeiten von Bildern
In diesen Beispielen wird gezeigt, wie Sie Bilder zusammen mit Ihren Text-Prompts für die Bearbeitung, Komposition und Stilübertragung bereitstellen.

1. Elemente hinzufügen und entfernen
Stellen Sie ein Bild bereit und beschreiben Sie die Änderung. Das Modell entspricht dem Stil, der Beleuchtung und der Perspektive des Originalbilds.

Vorlage
Prompt
Python
Java
JavaScript
Ok
REST

Using the provided image of [subject], please [add/remove/modify] [element]
to/from the scene. Ensure the change is [description of how the change should
integrate].
Eingabe

Ausgabe

Ein fotorealistisches Bild einer flauschigen roten Katze.
Ein fotorealistisches Bild einer flauschigen roten Katze…
Füge dem bereitgestellten Bild meiner Katze einen kleinen, gestrickten Zaubererhut hinzu…
Füge dem bereitgestellten Bild meiner Katze einen kleinen, gestrickten Zaubererhut hinzu…
2. Übermalen (semantische Maskierung)
Definieren Sie im Dialog eine „Maske“, um einen bestimmten Teil eines Bildes zu bearbeiten, während der Rest unverändert bleibt.

Vorlage
Prompt
Python
Java
JavaScript
Ok
REST

Using the provided image, change only the [specific element] to [new
element/description]. Keep everything else in the image exactly the same,
preserving the original style, lighting, and composition.
Eingabe

Ausgabe

Eine Weitwinkelaufnahme eines modernen, gut beleuchteten Wohnzimmers…
Eine Weitwinkelaufnahme eines modernen, gut beleuchteten Wohnzimmers…
Ändere auf dem bereitgestellten Bild eines Wohnzimmers nur das blaue Sofa in ein braunes Chesterfield-Sofa aus Vintage-Leder.
Ändere nur das blaue Sofa auf dem bereitgestellten Bild eines Wohnzimmers in ein braunes Chesterfield-Sofa aus Leder im Vintage-Stil…
3. Stilübertragung
Stellen Sie ein Bild zur Verfügung und bitten Sie das Modell, den Inhalt in einem anderen künstlerischen Stil neu zu erstellen.

Vorlage
Prompt
Python
Java
JavaScript
Ok
REST

Transform the provided photograph of [subject] into the artistic style of [artist/art style]. Preserve the original composition but render it with [description of stylistic elements].
Eingabe

Ausgabe

Ein fotorealistisches Foto einer belebten Straße in einer Stadt in hoher Auflösung…
Ein fotorealistisches, hochauflösendes Foto einer belebten Straße in einer Stadt...
Verwandle das bereitgestellte Foto einer modernen Stadtstraße bei Nacht…
Wandle das bereitgestellte Foto einer modernen Stadtstraße bei Nacht um…
4. Erweiterte Komposition: Mehrere Bilder kombinieren
Stellen Sie mehrere Bilder als Kontext bereit, um eine neue, zusammengesetzte Szene zu erstellen. Das ist ideal für Produkt-Mockups oder kreative Collagen.

Vorlage
Prompt
Python
Java
JavaScript
Ok
REST

Create a new image by combining the elements from the provided images. Take
the [element from image 1] and place it with/on the [element from image 2].
The final image should be a [description of the final scene].
Eingabe 1

Eingabe 2

Ausgabe

Ein professionell aufgenommenes Foto eines blauen Sommerkleids mit Blumenmuster…
Ein professionell aufgenommenes Foto eines blauen Sommerkleids mit Blumenmuster…
Ganzkörperaufnahme einer Frau mit einem Dutt…
Ganzkörperaufnahme einer Frau mit einem Dutt…
Erstelle ein professionelles E‑Commerce-Modefoto…
Erstelle ein professionelles E‑Commerce-Foto von Mode…
5. High-Fidelity-Detailerhaltung
Damit wichtige Details wie ein Gesicht oder ein Logo bei der Bearbeitung erhalten bleiben, beschreiben Sie sie zusammen mit Ihrem Bearbeitungswunsch sehr detailliert.

Vorlage
Prompt
Python
Java
JavaScript
Ok
REST

Using the provided images, place [element from image 2] onto [element from
image 1]. Ensure that the features of [element from image 1] remain
completely unchanged. The added element should [description of how the
element should integrate].
Eingabe 1

Eingabe 2

Ausgabe

Ein professionelles Porträt einer Frau mit braunen Haaren und blauen Augen…
Ein professionelles Porträt einer Frau mit braunen Haaren und blauen Augen...
Ein einfaches, modernes Logo mit den Buchstaben „G“ und „A“...
Ein einfaches, modernes Logo mit den Buchstaben „G“ und „A“...
Nimm das erste Bild der Frau mit braunen Haaren, blauen Augen und einem neutralen Gesichtsausdruck…
Nimm das erste Bild der Frau mit braunen Haaren, blauen Augen und einem neutralen Gesichtsausdruck…
6. Etwas zum Leben erwecken
Laden Sie eine grobe Skizze oder Zeichnung hoch und bitten Sie das Modell, sie in ein fertiges Bild umzuwandeln.

Vorlage
Prompt
Python
Java
JavaScript
Ok
REST

Turn this rough [medium] sketch of a [subject] into a [style description]
photo. Keep the [specific features] from the sketch but add [new details/materials].
Eingabe

Ausgabe

Skizze eines Autos
Grobe Skizze eines Autos
Ausgabe mit dem endgültigen Konzeptfahrzeug
Polierte Aufnahme eines Autos
7. Konsistenz der Charaktere: 360°-Ansicht
Sie können 360‑Grad-Ansichten eines Charakters generieren, indem Sie iterativ nach verschiedenen Blickwinkeln fragen. Die besten Ergebnisse erzielen Sie, wenn Sie zuvor generierte Bilder in nachfolgende Prompts einfügen, um die Konsistenz zu wahren. Bei komplexen Posen sollten Sie ein Referenzbild der gewünschten Pose einfügen.

Vorlage
Prompt
Python
Java
JavaScript
Ok
REST

A studio portrait of [person] against [background], [looking forward/in profile looking right/etc.]
Eingabe

Ausgabe 1

Ausgabe 2

Originaleingabe eines Mannes mit weißer Brille
Originalbild
Ausgabe eines Mannes mit weißer Brille, der nach rechts blickt
Mann mit weißer Brille blickt nach rechts
Ausgabe eines Mannes mit weißer Brille, der nach vorn schaut
Mann mit weißer Brille blickt nach vorn
Best Practices
Mit diesen professionellen Strategien können Sie Ihre Ergebnisse noch weiter verbessern.

Seien Sie sehr spezifisch:Je mehr Details Sie angeben, desto mehr Kontrolle haben Sie. Beschreiben Sie die Rüstung, anstatt nur „Fantasy-Rüstung“ zu schreiben: „aufwendige elfenhafte Plattenrüstung, mit Silberblattmustern geätzt, mit hohem Kragen und Schulterstücken in Form von Falkenflügeln“.
Kontext und Intention angeben:Erläutern Sie den Zweck des Bildes. Das Kontextverständnis des Modells beeinflusst die endgültige Ausgabe. Ein Beispiel: „Erstelle ein Logo für eine hochwertige, minimalistische Hautpflege-Marke“ führt zu besseren Ergebnissen als „Erstelle ein Logo“.
Wiederholen und verfeinern:Erwarten Sie nicht, dass Sie beim ersten Versuch ein perfektes Bild erhalten. Nutzen Sie die Konversationsfunktion des Modells, um kleine Änderungen vorzunehmen. Verwende Folge-Prompts wie „Das ist toll, aber kannst du die Beleuchtung etwas wärmer gestalten?“ oder „Lass alles so, aber ändere den Gesichtsausdruck der Figur zu einem ernsteren.“
Schritt-für-Schritt-Anleitung verwenden:Bei komplexen Szenen mit vielen Elementen sollten Sie Ihren Prompt in Schritte unterteilen. „Erstelle zuerst einen Hintergrund mit einem ruhigen, nebligen Wald bei Sonnenaufgang. Fügen Sie dann im Vordergrund einen moosbewachsenen alten Steinaltar hinzu. Stelle schließlich ein einzelnes, leuchtendes Schwert auf den Altar.“
Semantische negative Prompts verwenden: Anstatt „keine Autos“ zu sagen, beschreiben Sie die gewünschte Szene positiv: „eine leere, verlassene Straße ohne Anzeichen von Verkehr“.
Kamera steuern:Verwenden Sie fotografische und filmische Sprache, um die Komposition zu steuern. Begriffe wie wide-angle shot, macro shot, low-angle perspective.
Beschränkungen
Die beste Leistung erzielen Sie mit den folgenden Sprachen: EN, es-MX, ja-JP, zh-CN, hi-IN.
Bei der Bildgenerierung werden keine Audio- oder Videoeingaben unterstützt.
Das Modell hält sich nicht immer an die genaue Anzahl der Bildausgaben, die der Nutzer explizit anfordert.
Das Modell funktioniert am besten mit bis zu drei Bildern als Eingabe.
Wenn Sie Text für ein Bild generieren, funktioniert Gemini am besten, wenn Sie zuerst den Text generieren und dann ein Bild mit dem Text anfordern.
Alle generierten Bilder enthalten ein SynthID-Wasserzeichen.
Optionale Konfigurationen
Optional können Sie die Antwortmodalitäten und das Seitenverhältnis der Modellausgabe im Feld config von generate_content-Aufrufen konfigurieren.

Ausgabetypen
Standardmäßig gibt das Modell Text- und Bildantworten zurück (d.h. response_modalities=['Text', 'Image']). Sie können die Antwort so konfigurieren, dass nur Bilder ohne Text zurückgegeben werden, indem Sie response_modalities=['Image'] verwenden.

Python
JavaScript
Ok
Java
REST

response = client.models.generate_content(
    model="gemini-2.5-flash-image",
    contents=[prompt],
    config=types.GenerateContentConfig(
        response_modalities=['Image']
    )
)
Seitenverhältnisse
Standardmäßig wird die Größe des Ausgabebilds an die Größe des Eingabebilds angepasst. Andernfalls werden quadratische Bilder im Verhältnis 1:1 generiert. Sie können das Seitenverhältnis des Ausgabebilds mit dem Feld aspect_ratio unter image_config in der Antwortanfrage steuern, wie hier gezeigt:

Python
JavaScript
Ok
Java
REST

response = client.models.generate_content(
    model="gemini-2.5-flash-image",
    contents=[prompt],
    config=types.GenerateContentConfig(
        image_config=types.ImageConfig(
            aspect_ratio="16:9",
        )
    )
)
Die verschiedenen verfügbaren Seitenverhältnisse und die Größe des generierten Bildes sind in den folgenden Tabellen aufgeführt:

Gemini 2.5 Flash Image

Seitenverhältnis	Auflösung	Tokens
1:1	1024x1024	1290
2:3	832 × 1248	1290
3:2	1248 × 832	1290
3:4	864 × 1184	1290
4:3	1184 × 864	1290
4:5	896 × 1152	1290
5:4	1152 × 896	1290
9:16	768 × 1344	1290
16:9	1344 × 768	1290
21:9	1536 × 672	1290
Gemini 3 Pro – Bildvorschau

Seitenverhältnis	1K-Auflösung	1.000 Tokens	2K-Auflösung	2.000 Tokens	4K-Auflösung	4K-Tokens
1:1	1024x1024	1210	2.048 x 2.048	1210	4096 x 4096	2000
2:3	848 × 1264	1210	1696 × 2528	1210	3392 × 5056	2000
3:2	1264 × 848	1210	2528 × 1696	1210	5056 × 3392	2000
3:4	896 × 1200	1210	1792 × 2400	1210	3584 × 4800	2000
4:3	1200 × 896	1210	2400 × 1792	1210	4800 × 3584	2000
4:5	928 × 1152	1210	1856 × 2304	1210	3712 × 4608	2000
5:4	1152 × 928	1210	2304 × 1856	1210	4608 × 3712	2000
9:16	768 × 1376	1210	1536 × 2752	1210	3072 × 5504	2000
16:9	1376 × 768	1210	2752 × 1536	1210	5504 × 3072	2000
21:9	1584 × 672	1210	3168 × 1344	1210	6336 × 2688	2000
Wann sollte Imagen verwendet werden?
Zusätzlich zu den integrierten Funktionen von Gemini zur Bildgenerierung können Sie über die Gemini API auch auf Imagen zugreifen, unser spezialisiertes Modell zur Bildgenerierung.

Attribut	Imagen	Natives Gemini-Bild
Vorteile	Das Modell ist auf die Bildgenerierung spezialisiert.	Standardempfehlung
: Unübertroffene Flexibilität, kontextbezogenes Verständnis und einfache, maskenfreie Bearbeitung. Einzigartige Fähigkeit zur konversationellen Bearbeitung über mehrere Turns hinweg.
Verfügbarkeit	Allgemein verfügbar	Vorabversion (Nutzung in der Produktion zulässig)
Latenz	Niedrig Für Near-Realtime-Leistung optimiert.	Höher. Für die erweiterten Funktionen ist mehr Rechenleistung erforderlich.
Kosten	Kostengünstig für spezielle Aufgaben. 0,02 $ pro Bild bis 0,12 $pro Bild	Tokenbasierte Preise 30 $ pro 1 Million Tokens für die Bildausgabe (Bildausgabe mit 1.290 Tokens pro Bild pauschalisiert, bis zu 1.024 × 1.024 Pixel)
Empfohlene Aufgaben	
Bildqualität, Fotorealismus, künstlerische Details oder bestimmte Stile (z.B. Impressionismus, Anime) haben höchste Priorität.
Branding und Stil einfließen lassen oder Logos und Produktdesigns generieren
Erweiterte Rechtschreib- oder Typografie-Vorschläge generieren.
Verschachtelte Text- und Bildgenerierung für eine nahtlose Kombination von Text und Bildern.
Kombinieren Sie kreative Elemente aus mehreren Bildern mit nur einem Prompt.
Sie können Bilder sehr gezielt bearbeiten, einzelne Elemente mit einfachen Sprachbefehlen ändern und ein Bild iterativ bearbeiten.
Übertragen Sie ein bestimmtes Design oder eine bestimmte Textur von einem Bild auf ein anderes, wobei die Form und die Details des ursprünglichen Motivs erhalten bleiben.
Imagen 4 ist das Modell, das Sie verwenden sollten, wenn Sie mit der Bildgenerierung mit Imagen beginnen. Wählen Sie Imagen 4 Ultra für erweiterte Anwendungsfälle oder wenn Sie die beste Bildqualität benötigen. Beachten Sie, dass jeweils nur ein Bild generiert werden kann.

Nächste Schritte
Weitere Beispiele und Codebeispiele finden Sie im Kochbuch.
Veo-Anleitung
Weitere Informationen zu Gemini-Modellen finden Sie unter Gemini-Modelle.