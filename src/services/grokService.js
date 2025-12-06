// Grok API Configuration  
const GROK_API_KEY = import.meta.env.VITE_GROK_API_KEY
const GROK_API_URL = 'https://api.x.ai/v1/chat/completions'

// Qwen NSFW Prompt Optimierung – von „brav" zu „absolut tabulos"
export async function optimizePromptForQwen(userPrompt) {
  try {
    console.log('Optimizing NSFW prompt for Qwen:', userPrompt)

    if (!GROK_API_KEY) {
      throw new Error('Grok API Key nicht gefunden')
    }

    const systemPrompt = `Du bist ein Experte für Qwen Image-Editing Prompts. 

AUFGABE: Optimiere den Amateur-Prompt des Users zu einem professionellen Qwen-Bearbeitungsprompt.

QWEN EDITING REGELN:
- Sei SEHR spezifisch und detailliert
- Verwende klare Aktions-Verben: "change", "add", "remove", "modify", "replace"
- Beschreibe Farben, Materialien und Texturen genau
- Gib klare Position/Location an: "on the left side", "in the background", etc.
- Verwende keine zu komplizierten Effekte - Qwen ist gut bei realistischen Edits
- Halte es unter 50 Wörter für beste Qwen Performance

BEISPIELE:
User: "mach das shirt blau" 
Optimiert: "Change the shirt color to deep navy blue with subtle fabric texture"

User: "entfern background"
Optimiert: "Remove the entire background and replace with clean white background"

User: "add sonnenbrille"
Optimiert: "Add stylish black aviator sunglasses on the person's face with realistic reflections"

Antworte NUR mit dem optimierten Prompt - keine Erklärungen!`

    const response = await fetch(GROK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-3',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt }
        ],
        max_tokens: 600,
        temperature: 0.85,
        top_p: 0.95,
        stream: false
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Grok API Fehler: ${response.status} – ${errorText}`)
    }

    const data = await response.json()
    const optimizedPrompt = data.choices[0].message.content.trim()

    console.log('NSFW Qwen Prompt ready (extreme):', optimizedPrompt.substring(0, 300) + '...')
    
    return {
      success: true,
      optimizedPrompt,
      originalPrompt: userPrompt
    }

  } catch (error) {
    console.error('NSFW Optimization Error:', error)
    return {
      success: false,
      error: error.message,
      optimizedPrompt: null
    }
  }
}

// Einfache Qwen Prompt Optimierung - schnell und basic
export async function optimizePromptSimple(userPrompt) {
  try {
    console.log('🎨 Simple optimization for:', userPrompt)
    
    if (!GROK_API_KEY) {
      throw new Error('Grok API Key nicht gefunden')
    }

    const systemPrompt = `Du bist ein Experte für Qwen Image-Editing Prompts. 

AUFGABE: Optimiere den Amateur-Prompt des Users zu einem professionellen Qwen-Bearbeitungsprompt.

QWEN EDITING REGELN:
- Sei SEHR spezifisch und detailliert
- Verwende klare Aktions-Verben: "change", "add", "remove", "modify", "replace"
- Beschreibe Farben, Materialien und Texturen genau
- Gib klare Position/Location an: "on the left side", "in the background", etc.
- Verwende keine zu komplizierten Effekte - Qwen ist gut bei realistischen Edits
- Halte es unter 50 Wörter für beste Qwen Performance

BEISPIELE:
User: "mach das shirt blau" 
Optimiert: "Change the shirt color to deep navy blue with subtle fabric texture"

User: "entfern background"
Optimiert: "Remove the entire background and replace with clean white background"

User: "add sonnenbrille"
Optimiert: "Add stylish black aviator sunglasses on the person's face with realistic reflections"

Antworte NUR mit dem optimierten Prompt - keine Erklärungen!`

    const response = await fetch(GROK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-3',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt }
        ],
        max_tokens: 350,
        temperature: 0.5,
        stream: false
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Grok API Fehler: ${response.status} – ${errorText}`)
    }

    const data = await response.json()
    const optimizedPrompt = data.choices[0].message.content.trim()

    console.log('✅ Simple optimization ready:', optimizedPrompt)
    
    return {
      success: true,
      optimizedPrompt,
      originalPrompt: userPrompt
    }

  } catch (error) {
    console.error('❌ Simple Optimization Error:', error)
    return {
      success: false,
      error: error.message,
      optimizedPrompt: null
    }
  }
}

// =======================================
// PROMPT CREATOR SERVICE (SEPARATE FROM WAN 2.5)
// =======================================

// Erstellt einen dynamischen System-Prompt basierend auf den Optionen
function createSystemPrompt(count, photoStyle, consistencyMode) {
  let styleInstructions = ''
  
  switch (photoStyle) {
    case 'fashion-editorial':
      styleInstructions = 'Verwende High-Fashion Editorial Style: dramatic lighting, Vogue-ähnlich, künstlerische Posen, professionelle Studio-Ästhetik.'
      break
    case 'natural-light':
      styleInstructions = 'Verwende natürliches Tageslicht: soft natural lighting, authentische Stimmung, organic feels, minimale Schatten.'
      break
    case 'studio-professional':
      styleInstructions = 'Verwende Studio-Professional Style: controlled lighting, clean backgrounds, commercial quality, perfekte Beleuchtung.'
      break
    case 'cinematic':
      styleInstructions = 'Verwende Cinematic Style: dramatic shadows, moody lighting, film-like quality, emotionale Stimmung.'
      break
    case 'clean-beauty':
      styleInstructions = 'Verwende Clean Beauty Style: soft lighting, natural beauty, commercial appeal, fresh und clean.'
      break
    case 'instagram-casual':
      styleInstructions = 'Verwende Instagram Casual Style: lifestyle photography, relatable poses, social media optimiert.'
      break
    default:
      styleInstructions = 'Sei flexibel mit dem Fotografie-Stil - wähle was am besten zur Idee passt.'
  }

  let consistencyInstructions = ''
  
  switch (consistencyMode) {
    case 'same-shooting':
      consistencyInstructions = 'WICHTIG: Alle Prompts sollen aus demselben Shooting sein - gleiche Person, gleiche Kleidung, gleiche Location, gleiche Beleuchtung. Ändere NUR Posen, Gesichtsausdrücke und Kamerawinkel (Vogelperspektive, Nahaufnahme, etc.).'
      break
    case 'same-person':
      consistencyInstructions = 'WICHTIG: Gleiche Person und ähnliche Kleidung, aber Location und Setup können variieren. Halte den Look konsistent.'
      break
    default:
      consistencyInstructions = 'Sei kreativ mit verschiedenen Locations, Outfits und Setups.'
  }

  return `Du bist ein Weltklasse Model-Fotograf und Experte für professionelle Bildprompts.

AUFGABE: Erstelle basierend auf der User-Eingabe genau ${count} verschiedene, detaillierte und professionelle Bildprompts.

STIL-VORGABEN:
${styleInstructions}

KONSISTENZ-VORGABEN:
${consistencyInstructions}

ALLGEMEINE REGELN:
- Jeder Prompt soll 30-60 Wörter haben für maximale Details
- Verwende spezifische Fotografie-Begriffe (camera angles, lighting terms, etc.)
- Beschreibe konkrete Posen und Gesichtsausdrücke
- Erwähne immer Kamerawinkel/Perspektive (close-up, wide shot, bird's eye view, etc.)
- Mache jeden Prompt einzigartig aber thematisch passend
- Sei so detailliert wie möglich bei Aussehen, Kleidung und Location
- Verwende keine expliziten oder unpassenden Inhalte

FORMAT: Antworte NUR mit einem JSON-Array im folgenden Format:
[
  {"prompt": "Prompt 1 hier"},
  {"prompt": "Prompt 2 hier"},
  ${'  {"prompt": "Prompt N hier"},'.repeat(Math.max(0, count - 2))}
]

WICHTIG: Keine zusätzlichen Texte, Erklärungen oder Formatierungen - nur das JSON-Array!`
}

export async function generatePromptsFromIdea(userIdea, options = {}) {
  const { 
    count = 5, 
    photoStyle = 'flexible', 
    consistencyMode = 'same-shooting' 
  } = options
  
  try {
    console.log('🤖 Generating prompts from idea:', userIdea)
    console.log('🎛️ Options:', { count, photoStyle, consistencyMode })
    
    if (!GROK_API_KEY) {
      throw new Error('Grok API Key nicht gefunden in Environment Variables')
    }

    // Dynamischen System-Prompt erstellen
    const systemPrompt = createSystemPrompt(count, photoStyle, consistencyMode)
    console.log('📝 System prompt:', systemPrompt)

    const response = await fetch(GROK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-3',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userIdea
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
        stream: false
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Grok API Error:', response.status, errorText)
      throw new Error(`Grok API Fehler: ${response.status}`)
    }

    const data = await response.json()
    console.log('🤖 Raw Grok response:', data)

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Unerwartete Antwort-Struktur von Grok API')
    }

    const grokContent = data.choices[0].message.content.trim()
    console.log('🤖 Grok content:', grokContent)

    // Parse JSON response
    let prompts
    try {
      prompts = JSON.parse(grokContent)
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError)
      console.log('Raw content:', grokContent)
      
      // Fallback: Versuche JSON aus dem Text zu extrahieren
      const jsonMatch = grokContent.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        prompts = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Konnte JSON nicht aus Grok-Antwort extrahieren')
      }
    }

    // Validierung der Antwort
    if (!Array.isArray(prompts) || prompts.length !== count) {
      throw new Error(`Grok hat nicht genau ${count} Prompts zurückgegeben (erhalten: ${prompts.length})`)
    }

    // Validiere dass jeder Prompt das richtige Format hat
    const validatedPrompts = prompts.map((item, index) => {
      if (!item.prompt || typeof item.prompt !== 'string') {
        throw new Error(`Prompt ${index + 1} hat ungültiges Format`)
      }
      return item.prompt.trim()
    })

    console.log('✅ Successfully generated prompts:', validatedPrompts)
    return {
      success: true,
      prompts: validatedPrompts,
      originalIdea: userIdea
    }

  } catch (error) {
    console.error('❌ Grok Service Error:', error)
    return {
      success: false,
      error: error.message,
      prompts: null
    }
  }
}