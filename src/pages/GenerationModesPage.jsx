import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import { ArrowLeft, Sparkles, Palette, Users, RefreshCw, Zap, Wand2 } from 'lucide-react'

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
      icon: Palette,
      color: '#a86d09',
      available: true
    },
    {
      id: 'collab-generation', 
      path: '/nono-banana-collab',
      title: 'Collab Generation',
      subtitle: 'Mache Collabs mit anderen',
      description: 'Gemeinsame Bildgenerierung mit anderen',
      icon: Users,
      color: '#5a387d',
      available: true
    },
    {
      id: 'image-to-image',
      path: '/nono-banana-image2image', 
      title: 'Image2Image',
      subtitle: 'Higgsfield für Reiche',
      description: 'Bearbeite Bilder mit KI-Unterstützung',
      icon: RefreshCw,
      color: '#992f63',
      available: true
    },
    {
      id: 'multi-prompts',
      path: '/nono-banana-multi-prompts',
      title: 'Multi Prompts Generation',
      subtitle: 'Mehrere Prompts gleichzeitig',
      description: 'Generiere Bilder aus mehreren Prompts parallel',
      icon: Zap,
      color: '#059669',
      available: true
    },
    {
      id: 'prompt-creator',
      path: '/prompt-creator',
      title: 'AI Prompt Creator',
      subtitle: 'Powered by Grok AI',
      description: 'Beschreibe deine Idee und lass Grok professionelle Prompts generieren',
      icon: Wand2,
      color: '#d97706',
      available: true
    }
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: 'hsl(var(--background))',
      padding: '16px',
      color: 'hsl(var(--foreground))'
    }}>
      {/* Header */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        marginBottom: '24px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'hsl(var(--card))',
          backdropFilter: 'blur(20px)',
          padding: '12px 16px',
          borderRadius: '16px',
          border: '1px solid hsl(var(--border))',
          ...(!isMobile && { padding: '16px 20px' })
        }}>
          <Link 
            to="/dashboard" 
            style={{ 
              color: 'hsl(var(--foreground))',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.3s ease',
              padding: '6px 10px',
              borderRadius: '8px',
              ...(!isMobile && { fontSize: '14px', gap: '8px', padding: '6px 12px' })
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'hsl(var(--muted) / 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <ArrowLeft size={14} />
Dashboard
          </Link>
          
          <Link 
            to="/community-prompts"
            style={{ 
              color: 'hsl(var(--foreground))',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.3s ease',
              padding: '6px 10px',
              borderRadius: '8px',
              ...(!isMobile && { fontSize: '14px', gap: '8px', padding: '6px 12px' })
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'hsl(var(--muted) / 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <Sparkles size={14} />
Community Prompts
          </Link>
        </div>
      </div>

      {/* Title Section */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        textAlign: 'center',
        marginBottom: '32px',
        ...(!isMobile && { marginBottom: '40px' })
      }}>
        <h1 style={{
          margin: '0 0 10px 0',
          fontSize: '24px',
          fontWeight: '700',
          background: 'linear-gradient(135deg, hsl(47 100% 65%), hsl(280 70% 60%))',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontFamily: "'Space Grotesk', sans-serif",
          letterSpacing: '-0.5px',
          ...(!isMobile && { fontSize: '36px', marginBottom: '12px' })
        }}>
          🍌 nano banana pro
        </h1>
        <p style={{
          margin: 0,
          fontSize: '14px',
          color: 'hsl(var(--muted-foreground))',
          fontWeight: '400',
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          ...(!isMobile && { fontSize: '20px' })
        }}>
          Was willst du heute machen?
        </p>
      </div>

      {/* Generation Modes Grid */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '16px',
        ...(!isMobile && {
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '24px'
        })
      }}>
        {generationModes.map((mode) => {
          const IconComponent = mode.icon
          return (
            <div key={mode.id} style={{ position: 'relative' }}>
              {mode.available ? (
                <Link
                  to={mode.path}
                  style={{
                    textDecoration: 'none',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    background: mode.color + 'B3',
                    borderRadius: '16px',
                    padding: isMobile ? '14px 16px' : '18px 20px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    border: '1px solid hsl(var(--border) / 0.3)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    position: 'relative',
                    gap: '12px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.15)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1))',
                    backdropFilter: 'blur(15px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '12px',
                    width: isMobile ? '36px' : '44px',
                    height: isMobile ? '36px' : '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.4), 0 4px 8px rgba(0, 0, 0, 0.1)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    {mode.id === 'prompt-creator' ? (
                      <img src="/grok.svg" alt="Grok" style={{
                        height: isMobile ? '20px' : '24px',
                        width: 'auto',
                        maxWidth: isMobile ? '28px' : '32px',
                        objectFit: 'contain'
                      }} />
                    ) : (
                      <IconComponent size={isMobile ? 20 : 24} color="black" strokeWidth={2} />
                    )}
                  </div>
                  
                  {/* Text Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{
                      margin: '0 0 4px 0',
                      fontSize: isMobile ? '16px' : '18px',
                      fontWeight: '700',
                      color: 'rgba(255, 255, 255, 0.85)',
                      lineHeight: '1.2'
                    }}>
                      {mode.title}
                    </h3>
                    <p style={{
                      margin: 0,
                      fontSize: isMobile ? '12px' : '13px',
                      color: 'rgba(255, 255, 255, 0.6)',
                      fontWeight: '500',
                      lineHeight: '1.3'
                    }}>
                      {mode.subtitle}
                    </p>
                  </div>
                  
                  {mode.id === 'model-generation' && (
                    <span style={{ fontSize: isMobile ? '20px' : '24px', flexShrink: 0 }}>🍌</span>
                  )}
                </Link>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'hsl(var(--muted) / 0.3)',
                    borderRadius: '20px',
                    padding: isMobile ? '20px' : '24px',
                    boxShadow: '0 8px 24px hsl(var(--background) / 0.1)',
                    border: '1px solid hsl(var(--border))',
                    cursor: 'not-allowed',
                    overflow: 'hidden',
                    opacity: 0.6,
                    filter: 'grayscale(50%)'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      background: 'hsl(var(--muted) / 0.5)',
                      borderRadius: '12px',
                      padding: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <IconComponent size={isMobile ? 24 : 28} color="hsl(var(--muted-foreground))" strokeWidth={2} />
                    </div>
                  </div>
                  
                  <div>
                    <h3 style={{
                      margin: '0 0 6px 0',
                      fontSize: isMobile ? '20px' : '22px',
                      fontWeight: '700',
                      color: 'hsl(var(--foreground))',
                      lineHeight: '1.2'
                    }}>
                      {mode.title}
                    </h3>
                    <p style={{
                      margin: 0,
                      fontSize: isMobile ? '13px' : '14px',
                      color: 'hsl(var(--muted-foreground))',
                      fontWeight: '500'
                    }}>
                      {mode.subtitle}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

    </div>
  )
}

export default GenerationModesPage