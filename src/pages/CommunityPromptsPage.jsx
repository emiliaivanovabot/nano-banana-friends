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
      
      <div className="nano-banana-container">
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <Link 
            to="/nono-banana" 
            style={{ 
              color: '#6B7280',
              textDecoration: 'none',
              fontSize: '14px'
            }}
          >
            ← Zurück zu nano banana
          </Link>
          
          <a 
            href="https://www.bananaprompts.xyz/explore" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              color: '#6B7280',
              textDecoration: 'none',
              fontSize: '14px'
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
          color: '#6B7280', 
          marginBottom: '24px',
          fontSize: '0.9rem'
        }}>
          Echte Prompts von bananaprompts.xyz - Ein Klick und der Prompt wird in nano banana eingefügt
        </p>

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ 
              fontSize: '1rem', 
              color: '#6B7280',
              marginBottom: '12px' 
            }}>
              🍌 Lädt Community Prompts...
            </div>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid #f3f3f3',
              borderTop: '3px solid #f472b6',
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
            color: '#ef4444',
            backgroundColor: '#fef2f2',
            borderRadius: '12px',
            border: '1px solid #fecaca',
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
            color: '#6B7280'
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
                  border: selectedCategory === category ? '2px solid #f472b6' : '1px solid rgba(251, 191, 36, 0.3)',
                  borderRadius: '20px',
                  background: selectedCategory === category 
                    ? 'linear-gradient(135deg, #f472b6 0%, #fb7185 100%)' 
                    : 'rgba(255, 255, 255, 0.8)',
                  color: selectedCategory === category ? 'white' : '#374151',
                  fontSize: '0.8rem',
                  fontWeight: '500',
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
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: isMobile ? '8px' : '12px',
          marginBottom: '40px'
        }}>
          {sortedPrompts.map(promptData => (
            <div
              key={promptData.id}
              style={{
                position: 'relative',
                backgroundImage: `url(${promptData.image_url})`,
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                borderRadius: '12px',
                padding: isMobile ? '12px' : '16px',
                border: '1px solid rgba(251, 191, 36, 0.2)',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                minHeight: isMobile ? '160px' : '200px',
                aspectRatio: isMobile ? '1' : 'auto',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 4px 12px rgba(251, 113, 133, 0.15)'
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h3 style={{ 
                    margin: 0, 
                    fontSize: isMobile ? '0.9rem' : '1.1rem', 
                    fontWeight: '600',
                    color: 'white',
                    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)'
                  }}>
                    {promptData.title}
                  </h3>
                  <span style={{
                    background: 'linear-gradient(135deg, #f472b6 0%, #fb7185 100%)',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.7rem',
                    fontWeight: '500',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                  }}>
                    {promptData.category}
                  </span>
                </div>
                
                <p style={{ 
                  color: 'rgba(255, 255, 255, 0.9)', 
                  fontSize: isMobile ? '0.75rem' : '0.85rem', 
                  lineHeight: '1.4',
                  marginBottom: '12px',
                  display: '-webkit-box',
                  WebkitLineClamp: isMobile ? 2 : 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)'
                }}>
                  {promptData.prompt}
                </p>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ 
                    color: 'rgba(255, 255, 255, 0.7)', 
                    fontSize: '0.75rem',
                    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)'
                  }}>
                    von {promptData.author}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ color: '#f472b6', fontSize: '0.8rem', textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)' }}>♥</span>
                    <span style={{ 
                      color: 'rgba(255, 255, 255, 0.7)', 
                      fontSize: '0.75rem',
                      textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)'
                    }}>
                      {promptData.likes}
                    </span>
                  </div>
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