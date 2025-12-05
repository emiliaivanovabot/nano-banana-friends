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