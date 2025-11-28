import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'

function GenerationModesPage() {
  const { user } = useAuth()
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  // Mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const generationModes = [
    {
      id: 'model-generation',
      path: '/nono-banana-model',
      title: 'Nano Banana Pro',
      subtitle: `Erstelle Bilder für ${user?.username || 'dich'}`,
      description: 'Erstelle Bilder aus Text-Beschreibungen',
      emoji: '🎨',
      gradient: 'linear-gradient(135deg, hsl(47 100% 65%), #f59e0b)',
      available: true
    },
    {
      id: 'collab-generation', 
      path: '/nono-banana-collab',
      title: 'Collab Generation',
      subtitle: 'Mache Collabs mit anderen',
      description: 'Gemeinsame Bildgenerierung mit anderen',
      emoji: '🤝',
      gradient: 'linear-gradient(135deg, #667eea, #764ba2)',
      available: true
    },
    {
      id: 'image-to-image',
      path: '/nono-banana-image2image', 
      title: 'Image2Image',
      subtitle: 'Higgsfield für Reiche',
      description: 'Bearbeite Bilder mit KI-Unterstützung',
      emoji: '🔄',
      gradient: 'linear-gradient(135deg, hsl(280 70% 60%), #a855f7)',
      available: true
    },
    {
      id: 'multi-prompts',
      path: '/nono-banana-multi-prompts',
      title: 'Multi Prompts Generation',
      subtitle: 'Mehrere Prompts gleichzeitig',
      description: 'Generiere Bilder aus mehreren Prompts parallel',
      emoji: '⚡',
      gradient: 'linear-gradient(135deg, #10b981, #059669)',
      available: true
    },
    {
      id: 'prompt-creator',
      path: '/prompt-creator',
      title: 'AI Prompt Creator',
      subtitle: 'Lass Grok deine Prompts erstellen',
      description: 'Beschreibe deine Idee und lass AI professionelle Prompts generieren',
      emoji: '🤖',
      gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
      available: true
    }
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: 'hsl(var(--background))',
      padding: '20px',
      color: 'hsl(var(--foreground))'
    }}>
      {/* Header - EXACT same style as original nano banana page */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '30px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%'
        }}>
          {/* Left - Dashboard Link */}
          <Link 
            to="/dashboard" 
            style={{ 
              color: 'hsl(var(--muted-foreground))',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            ← Dashboard
          </Link>
          
          {/* Right - Inspiration Link */}
          <Link 
            to="/inspiration"
            style={{ 
              color: 'hsl(var(--muted-foreground))',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            Inspiration ✨
          </Link>
        </div>
        
      </div>

      {/* Title - EXACT same as original */}
      <h1 className="nano-banana-title" style={{
        textAlign: 'center',
        margin: '0 0 20px 0',
        fontSize: '2.5rem',
        fontWeight: '700',
        color: 'hsl(47 100% 65%)',
        background: 'linear-gradient(135deg, hsl(47 100% 65%), hsl(280 70% 60%))',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontFamily: "'Space Grotesk', sans-serif"
      }}>
        🍌 nano banana pro
      </h1>

      {/* Subtitle */}
      <div style={{
        textAlign: 'center',
        marginBottom: '40px'
      }}>
        <p style={{
          margin: '0 0 10px 0',
          fontSize: isMobile ? '18px' : '22px',
          color: 'hsl(var(--foreground))',
          fontWeight: '500'
        }}>
          Wähle deinen Generierungsmodus
        </p>
      </div>

      {/* Generation Modes Grid */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '30px'
      }}>
        {generationModes.map((mode) => (
          <div key={mode.id} style={{ position: 'relative' }}>
            {mode.available ? (
              <Link
                to={mode.path}
                style={{
                  textDecoration: 'none',
                  display: 'block',
                  background: mode.id === 'model-generation' ? '#a86d09' : mode.id === 'collab-generation' ? '#5a387d' : mode.id === 'image-to-image' ? '#992f63' : mode.id === 'multi-prompts' ? '#059669' : mode.id === 'prompt-creator' ? '#d97706' : 'hsl(var(--card))',
                  borderRadius: '25px',
                  padding: '30px',
                  boxShadow: '0 15px 35px hsl(var(--background) / 0.2)',
                  border: '1px solid hsl(var(--border))',
                  transition: 'all 0.4s ease',
                  cursor: 'pointer',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-5px) scale(1.02)'
                  e.target.style.boxShadow = '0 25px 50px rgba(0, 0, 0, 0.15)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0) scale(1)'
                  e.target.style.boxShadow = '0 15px 35px rgba(0, 0, 0, 0.1)'
                }}
              >
                
                <h3 style={{
                  margin: '0 0 8px 0',
                  fontSize: '24px',
                  fontWeight: '700',
                  color: 'hsl(var(--foreground))'
                }}>
                  {mode.title}
                </h3>
                <p style={{
                  margin: 0,
                  fontSize: '16px',
                  color: 'hsl(var(--primary))',
                  fontWeight: '600'
                }}>
                  {mode.subtitle}
                </p>
              </Link>
            ) : (
              <div
                style={{
                  display: 'block',
                  background: 'hsl(var(--muted) / 0.5)',
                  borderRadius: '25px',
                  padding: '30px',
                  boxShadow: '0 15px 35px hsl(var(--background) / 0.1)',
                  border: '1px solid hsl(var(--border))',
                  cursor: 'not-allowed',
                  overflow: 'hidden',
                  opacity: 0.7,
                  filter: 'grayscale(50%)'
                }}
              >
                
                <h3 style={{
                  margin: '0 0 8px 0',
                  fontSize: '24px',
                  fontWeight: '700',
                  color: 'hsl(var(--foreground))'
                }}>
                  {mode.title}
                </h3>
                <p style={{
                  margin: 0,
                  fontSize: '16px',
                  color: 'hsl(var(--primary))',
                  fontWeight: '600'
                }}>
                  {mode.subtitle}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Info Section */}
      <div style={{
        maxWidth: '800px',
        margin: '50px auto 0',
        background: 'hsl(var(--card) / 0.5)',
        backdropFilter: 'blur(10px)',
        padding: '25px',
        borderRadius: '20px',
        border: '1px solid hsl(var(--border) / 0.5)',
        textAlign: 'center'
      }}>
        <h4 style={{
          margin: '0 0 15px 0',
          fontSize: '18px',
          fontWeight: '600',
          color: 'hsl(var(--foreground))'
        }}>
          Was willst du heute machen?
        </h4>
        <p style={{
          margin: 0,
          fontSize: '14px',
          color: 'hsl(var(--muted-foreground))',
          lineHeight: '1.5'
        }}>
          Du kennst das - manchmal brauchst du einfach was Neues. Nimm einen Modus, mach dein Ding und zeig Instagram, was du drauf hast!
        </p>
      </div>
    </div>
  )
}

export default GenerationModesPage