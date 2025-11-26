import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import { Link, useNavigate } from 'react-router-dom'
// import CommunityPromptsAPI from '../lib/communityPromptsAPI.js' // TODO: Implement later

function CommunityPromptsPage() {
  const navigate = useNavigate()
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [communityPrompts, setCommunityPrompts] = useState([])
  const [categories, setCategories] = useState(['All'])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Touch gesture handling for mobile swipe navigation
  useEffect(() => {
    let touchStartX = 0
    let touchStartY = 0
    let touchEndX = 0
    let touchEndY = 0

    const handleTouchStart = (e) => {
      touchStartX = e.changedTouches[0].screenX
      touchStartY = e.changedTouches[0].screenY
    }

    const handleTouchEnd = (e) => {
      touchEndX = e.changedTouches[0].screenX
      touchEndY = e.changedTouches[0].screenY
      handleSwipeGesture()
    }

    const handleSwipeGesture = () => {
      const swipeThreshold = 30
      const maxVerticalThreshold = 40
      const swipeDistance = touchEndX - touchStartX
      const verticalDistance = Math.abs(touchEndY - touchStartY)
      
      // Check if it's a horizontal swipe (not vertical scroll)
      if (verticalDistance < maxVerticalThreshold && Math.abs(swipeDistance) > swipeThreshold) {
        // Right swipe detected
        if (swipeDistance > 0) {
          navigate('/nono-banana')
        }
      }
    }

    if (isMobile) {
      document.addEventListener('touchstart', handleTouchStart, { passive: true })
      document.addEventListener('touchend', handleTouchEnd, { passive: true })
    }

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isMobile, navigate])

  // Load community prompts from Supabase database
  useEffect(() => {
    const loadCommunityPrompts = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // DEBUG: Check environment variables
        console.log('🔍 ENV DEBUG:', {
          url: import.meta.env.VITE_SUPABASE_URL?.substring(0, 30) + '...',
          hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
        })
        
        const { data: promptsData, error: promptsError } = await supabase
          .from('community_prompts')
          .select('*')
          .eq('is_active', true)
          .order('likes', { ascending: false })
        
        if (promptsError) {
          console.error('Error loading community prompts:', promptsError)
          setError('Fehler beim Laden der Community Prompts. Versuche es später noch einmal.')
          return
        }
        
        // DEBUG: Log prompts count  
        console.log('📊 PROMPTS LOADED:', promptsData.length)
        
        // Extract unique categories from prompts
        const allCategories = promptsData.map(prompt => prompt.category)
        const categoriesData = ['All', ...new Set(allCategories)]
        
        setCommunityPrompts(promptsData)
        setCategories(categoriesData)
        
      } catch (err) {
        console.error('Error loading community prompts:', err)
        setError('Fehler beim Laden der Community Prompts. Versuche es später noch einmal.')
      } finally {
        setLoading(false)
      }
    }
    
    loadCommunityPrompts()
  }, [])
  
  // Categories are now loaded from the database
  
  // Filter prompts by category
  const filteredPrompts = selectedCategory === 'All' 
    ? communityPrompts 
    : communityPrompts.filter(prompt => prompt.category === selectedCategory)
  
  // Sort by likes (most popular first)
  const sortedPrompts = filteredPrompts.sort((a, b) => b.likes - a.likes)
  
  const usePrompt = (promptData) => {
    // Simply navigate with the clean prompt
    // Face instructions will be handled by the NonoBananaPage based on actual uploaded images
    navigate('/nono-banana?prompt=' + encodeURIComponent(promptData.prompt))
  }

  return (
    <>
      {/* Add CSS for loading spinner */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      
      <div className="nano-banana-container" style={{
        background: 'hsl(var(--background))',
        color: 'hsl(var(--foreground))',
        minHeight: '100vh'
      }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <Link 
            to="/nono-banana" 
            style={{ 
              color: 'hsl(var(--muted-foreground))',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            ← Zurück zu nano banana
          </Link>
          
          <a 
            href="https://www.bananaprompts.xyz/explore" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              color: 'hsl(var(--muted-foreground))',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            bananaprompts.xyz →
          </a>
        </div>
        
        <h1 className="nano-banana-title">
          Community Prompts
        </h1>
        
        <p style={{ 
          textAlign: 'center', 
          color: 'hsl(var(--muted-foreground))', 
          marginBottom: '24px',
          fontSize: '0.9rem'
        }}>
          Ein Klick und der Prompt wird in nano banana eingefügt
        </p>

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ 
              fontSize: '1rem', 
              color: 'hsl(var(--muted-foreground))',
              marginBottom: '12px' 
            }}>
              🍌 Lädt Community Prompts...
            </div>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid hsl(var(--muted))',
              borderTop: '3px solid hsl(var(--primary))',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto'
            }}></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px',
            color: 'hsl(var(--destructive-foreground))',
            backgroundColor: 'hsl(var(--destructive) / 0.1)',
            borderRadius: '12px',
            border: '1px solid hsl(var(--destructive) / 0.3)',
            marginBottom: '24px'
          }}>
            <div style={{ fontSize: '1.2rem', marginBottom: '8px' }}>⚠️</div>
            <div style={{ fontSize: '0.9rem' }}>{error}</div>
          </div>
        )}

        {/* No prompts found */}
        {!loading && !error && communityPrompts.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px',
            color: 'hsl(var(--muted-foreground))'
          }}>
            <div style={{ fontSize: '1.2rem', marginBottom: '8px' }}>💭</div>
            <div style={{ fontSize: '0.9rem' }}>Noch keine Community Prompts verfügbar.</div>
            <div style={{ fontSize: '0.8rem', marginTop: '8px' }}>Die Datenbank wird bald mit echten Prompts gefüllt!</div>
          </div>
        )}

        {/* Category Filter - only show when prompts are loaded */}
        {!loading && !error && communityPrompts.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                style={{
                  padding: '6px 16px',
                  border: selectedCategory === category ? '2px solid hsl(var(--primary))' : '1px solid hsl(var(--border))',
                  borderRadius: '20px',
                  background: selectedCategory === category 
                    ? 'linear-gradient(135deg, hsl(var(--primary)) 0%, #f59e0b 100%)' 
                    : 'hsl(var(--muted))',
                  color: selectedCategory === category ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
                  fontSize: '0.8rem',
                  fontWeight: '500',
                  fontFamily: "'Space Grotesk', sans-serif",
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
        )}

        {/* Prompts Grid - only show when prompts are loaded */}
        {!loading && !error && filteredPrompts.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(4, 1fr)' : 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: isMobile ? '4px' : '12px',
          marginBottom: '40px'
        }}>
          {sortedPrompts.map(promptData => (
            <div
              key={promptData.id}
              style={{
                position: 'relative',
                backgroundImage: `url(${promptData.image_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                borderRadius: '12px',
                padding: isMobile ? '6px' : '16px',
                border: '1px solid hsl(var(--border))',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                minHeight: isMobile ? '120px' : '200px',
                aspectRatio: isMobile ? '3/4' : 'auto',
                overflow: 'hidden',
                backdropFilter: 'blur(10px)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 4px 12px hsl(var(--primary) / 0.2)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = 'none'
              }}
              onClick={() => usePrompt(promptData)}
            >
              {/* Dark overlay for better text readability */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.7) 100%)',
                borderRadius: '12px',
                zIndex: 1
              }} />
              
              {/* Content wrapper */}
              <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span style={{
                    background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, #f59e0b 100%)',
                    color: 'hsl(var(--primary-foreground))',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.7rem',
                    fontWeight: '500',
                    fontFamily: "'Space Grotesk', sans-serif",
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                  }}>
                    {promptData.category}
                  </span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                  <h3 style={{ 
                    margin: 0, 
                    fontSize: isMobile ? '0.7rem' : '1.4rem', 
                    fontWeight: '600',
                    fontFamily: "'Space Grotesk', sans-serif",
                    color: 'white',
                    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
                    textAlign: 'center',
                    lineHeight: '1.2'
                  }}>
                    {promptData.title}
                  </h3>
                </div>
                
              </div>
            </div>
          ))}
        </div>
        )}
        
      </div>
    </>
  )
}

export default CommunityPromptsPage