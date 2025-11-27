import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { useState, useEffect } from 'react'
import { getDailyUsageHistory, getUnifiedGenerationStats, getTopAspectRatios } from '../utils/usageTracking'

function DashboardPage() {
  const { user, logout } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [showDisabledModal, setShowDisabledModal] = useState(false)
  const [disabledToolName, setDisabledToolName] = useState('')
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [stats, setStats] = useState({
    today: { images: 0, time: 0, tokens: 0, cost: 0, count_1k: 0, count_2k: 0, count_4k: 0 },
    week: { images: 0, time: 0, tokens: 0, cost: 0, count_1k: 0, count_2k: 0, count_4k: 0 },
    month: { cost: 0 }
  })
  const [aspectRatios, setAspectRatios] = useState({
    today: [],
    week: []
  })
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const loadStats = async () => {
    if (user?.id) {
      try {
        console.log('📊 Loading dashboard stats for user:', user.id)
        
        // Use materialized view for real-time token data
        const usageData = await getDailyUsageHistory(user.id, 30)
        if (usageData.success) {
          const today = new Date().toISOString().split('T')[0]
          const todayData = usageData.data.find(d => d.usage_date === today)
          
          console.log('🔍 Dashboard debug - today:', today)
          console.log('📊 Today data found:', todayData)
          if (usageData.data.length > 0) {
            console.log('📈 Total records from DB:', usageData.data.length)
            console.log('📅 Date range:', usageData.data[0].usage_date, 'to', usageData.data[usageData.data.length - 1].usage_date)
          }
          
          // Calculate weekly stats
          const weekStart = new Date()
          weekStart.setDate(weekStart.getDate() - 7)
          const weekData = usageData.data.filter(d => 
            new Date(d.usage_date) >= weekStart
          )
          
          console.log('🔍 Dashboard debug - weekData:', weekData)
          console.log('🔍 Dashboard debug - weekStart:', weekStart)
          
          const weekStats = weekData.reduce((acc, day) => ({
            images: acc.images + (day.generations_count || 0),
            time: acc.time + (day.generation_time_seconds || 0),
            tokens: acc.tokens + (day.prompt_tokens || 0) + (day.output_tokens || 0),
            cost: acc.cost + (parseFloat(day.cost_usd) || 0),
            count_1k: acc.count_1k + (day.count_1k || 0),
            count_2k: acc.count_2k + (day.count_2k || 0),
            count_4k: acc.count_4k + (day.count_4k || 0)
          }), { images: 0, time: 0, tokens: 0, cost: 0, count_1k: 0, count_2k: 0, count_4k: 0 })
          
          console.log('🔍 Dashboard debug - weekStats calculated:', weekStats)

          // Calculate daily cost (today)
          const todayCost = parseFloat(todayData?.cost_usd) || 0
          
          // Calculate monthly cost  
          const monthCost = usageData.data.reduce((acc, day) => 
            acc + (parseFloat(day.cost_usd) || 0), 0
          )

          setStats({
            today: {
              images: todayData?.generations_count || 0,
              time: Math.round((todayData?.generation_time_seconds || 0) / 60),
              tokens: Math.round(((todayData?.prompt_tokens || 0) + (todayData?.output_tokens || 0)) / 1000),
              cost: todayCost * 1.1, // Convert USD to EUR approximately
              count_1k: todayData?.count_1k || 0,
              count_2k: todayData?.count_2k || 0,
              count_4k: todayData?.count_4k || 0
            },
            week: {
              images: weekStats.images,
              time: Math.round(weekStats.time / 60),
              tokens: Math.round(weekStats.tokens / 1000),
              cost: weekStats.cost * 1.1, // Convert USD to EUR approximately  
              count_1k: weekStats.count_1k,
              count_2k: weekStats.count_2k,
              count_4k: weekStats.count_4k
            },
            month: {
              cost: monthCost * 1.1 // Convert USD to EUR approximately
            }
          })

          // Fetch aspect ratios for today and week
          const todayRatios = await getTopAspectRatios(user.id, 1, 2) // 1 day, top 2
          const weekRatios = await getTopAspectRatios(user.id, 7, 2) // 7 days, top 2
          
          setAspectRatios({
            today: todayRatios.success ? todayRatios.data : [],
            week: weekRatios.success ? weekRatios.data : []
          })
        }
      } catch (error) {
        console.error('Error loading stats:', error)
      }
    }
  }

  const handleRefreshData = async () => {
    setIsRefreshing(true)
    try {
      // Call refresh API endpoint
      const response = await fetch('/src/pages/api/refresh-view.js', { method: 'POST' })
      if (response.ok) {
        console.log('✅ Materialized view refreshed')
      }
      
      // Reload stats regardless
      await loadStats()
    } catch (error) {
      console.error('Error refreshing data:', error)
      // Still try to reload stats
      await loadStats()
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [user])

  // Auto-refresh dashboard data every 30 seconds for real-time updates
  useEffect(() => {
    if (!user?.id) return

    const refreshInterval = setInterval(() => {
      console.log('🔄 Auto-refreshing dashboard stats...')
      loadStats()
    }, 30000) // 30 seconds

    return () => clearInterval(refreshInterval)
  }, [user])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
      setIsLoggingOut(false)
    }
  }

  const getFirstName = (username) => {
    if (!username) return 'User'
    const firstName = username.split('.')[0] || username
    return firstName.charAt(0).toUpperCase() + firstName.slice(1)
  }

  const ImageDetailsSection = ({ stats, aspectRatios, period }) => {
    const maxCount = Math.max(stats.count_4k, stats.count_2k, stats.count_1k) || 1
    
    return (
      <div style={{
        background: 'hsl(var(--muted) / 0.05)',
        border: '1px solid hsl(var(--border) / 0.3)',
        borderRadius: '12px',
        padding: isMobile ? '12px' : '16px',
        marginTop: '12px',
        transition: 'all 0.3s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'hsl(var(--muted) / 0.08)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'hsl(var(--muted) / 0.05)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px'
        }}>
          <span style={{ fontSize: '14px', opacity: 0.7 }}>🖼️</span>
          <span style={{
            fontSize: isMobile ? '13px' : '14px',
            fontWeight: '600',
            color: 'hsl(var(--foreground))',
            letterSpacing: '0.25px'
          }}>
            Bild Details
          </span>
        </div>
        
        {/* Resolution Breakdown */}
        <div style={{ marginBottom: aspectRatios?.length > 0 ? '12px' : '0' }}>
          {/* 4K Row */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <span style={{
              fontSize: '13px',
              color: 'hsl(var(--muted-foreground))',
              fontWeight: '500'
            }}>{isMobile ? '4K' : '4K Ultra'}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '15px',
                fontWeight: '700',
                color: 'hsl(280 70% 60%)',
                minWidth: '20px',
                textAlign: 'right'
              }}>{stats.count_4k}</span>
              <div style={{
                width: `${Math.min((stats.count_4k / maxCount) * 60, 60)}px`,
                height: isMobile ? '4px' : '6px',
                background: 'linear-gradient(90deg, hsl(280 70% 60%), hsl(280 70% 70%))',
                borderRadius: '3px',
                boxShadow: '0 2px 4px hsl(280 70% 60% / 0.2)',
                transition: 'filter 0.2s ease'
              }} />
            </div>
          </div>
          
          {/* 2K Row */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <span style={{
              fontSize: '13px',
              color: 'hsl(var(--muted-foreground))',
              fontWeight: '500'
            }}>{isMobile ? '2K' : '2K Qualität'}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '15px',
                fontWeight: '700',
                color: 'hsl(47 100% 65%)',
                minWidth: '20px',
                textAlign: 'right'
              }}>{stats.count_2k}</span>
              <div style={{
                width: `${Math.min((stats.count_2k / maxCount) * 60, 60)}px`,
                height: isMobile ? '4px' : '6px',
                background: 'linear-gradient(90deg, hsl(47 100% 65%), hsl(47 100% 75%))',
                borderRadius: '3px',
                boxShadow: '0 2px 4px hsl(47 100% 65% / 0.2)',
                transition: 'filter 0.2s ease'
              }} />
            </div>
          </div>
          
          {/* 1K Row */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{
              fontSize: '13px',
              color: 'hsl(var(--muted-foreground))',
              fontWeight: '500'
            }}>{isMobile ? '1K' : '1K Standard'}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '15px',
                fontWeight: '700',
                color: 'hsl(var(--primary))',
                minWidth: '20px',
                textAlign: 'right'
              }}>{stats.count_1k}</span>
              <div style={{
                width: `${Math.min((stats.count_1k / maxCount) * 60, 60)}px`,
                height: isMobile ? '4px' : '6px',
                background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))',
                borderRadius: '3px',
                boxShadow: '0 2px 4px hsl(var(--primary) / 0.2)',
                transition: 'filter 0.2s ease'
              }} />
            </div>
          </div>
        </div>
        
        {/* Aspect Ratios */}
        {aspectRatios?.length > 0 && (
          <div>
            <span style={{
              fontSize: '12px',
              color: 'hsl(var(--muted-foreground))',
              marginBottom: '6px',
              display: 'block'
            }}>{isMobile ? 'Formate' : 'Beliebte Formate'}</span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {aspectRatios.map((ratio, index) => (
                <span key={index} style={{
                  background: 'hsl(var(--secondary) / 0.2)',
                  color: 'hsl(var(--secondary-foreground))',
                  borderRadius: '20px',
                  padding: '4px 12px',
                  fontSize: isMobile ? '11px' : '12px',
                  fontWeight: '500',
                  border: '1px solid hsl(var(--border) / 0.5)',
                  transition: 'transform 0.2s ease',
                  cursor: 'default'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                }}>
                  {ratio.aspect_ratio} ({ratio.percentage}%)
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const handleDisabledToolClick = (toolName) => {
    setDisabledToolName(toolName)
    setShowDisabledModal(true)
  }

  const closeModal = () => {
    setShowDisabledModal(false)
    setDisabledToolName('')
  }

  const tools = [
    {
      id: 'nano-banana',
      path: '/nono-banana',
      title: 'Nano Banana Pro',
      subtitle: 'Image Generation',
      gradient: 'linear-gradient(135deg, hsl(47 100% 65%), #f59e0b)',
      available: true
    },
    {
      id: 'gallery',
      path: '/gallery', 
      title: 'Bilder Galerie',
      subtitle: 'Deine Bilder',
      gradient: 'linear-gradient(135deg, #667eea, #764ba2)',
      available: true
    },
    {
      id: 'wan-video',
      title: 'WAN 2.2 Video',
      subtitle: 'Video Generation',
      gradient: 'linear-gradient(135deg, #f093fb, #f5576c)',
      available: false
    },
    {
      id: 'qwen',
      title: 'Qwen',
      subtitle: 'Image Editor',
      gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)',
      available: false
    },
    {
      id: 'comfyui',
      title: 'Comfyui',
      subtitle: 'Real Pics',
      gradient: 'linear-gradient(135deg, #a8edea, #fed6e3)',
      available: false
    }
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: 'hsl(var(--background))',
      padding: '20px',
      color: 'hsl(var(--foreground))'
    }}>
      {/* Header */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        marginBottom: '30px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '25px',
          background: 'hsl(var(--card))',
          backdropFilter: 'blur(20px)',
          padding: isMobile ? '15px 20px' : '20px 25px',
          borderRadius: '20px',
          border: '1px solid hsl(var(--border))'
        }}>
          <div>
            <h1 style={{
              margin: '0 0 8px 0',
              fontSize: isMobile ? '28px' : '36px',
              fontWeight: '700',
              color: 'hsl(47 100% 65%)',
              background: 'linear-gradient(135deg, hsl(47 100% 65%), hsl(280 70% 60%))',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontFamily: "'Space Grotesk', sans-serif"
            }}>
              neuronalworks
            </h1>
            <p style={{
              margin: 0,
              fontSize: isMobile ? '16px' : '18px',
              color: 'hsl(var(--foreground))',
              fontWeight: '500'
            }}>
              🍌 Hallo {getFirstName(user?.username)}!
            </p>
            <p style={{
              margin: '5px 0 0 0',
              fontSize: '14px',
              color: 'hsl(var(--muted-foreground))',
              fontWeight: '300',
              fontFamily: 'Georgia, serif'
            }}>
              Wähle dein AI Tool und ab gehts
            </p>
          </div>
          
          <div style={{ 
            display: 'flex', 
            gap: '12px',
            alignItems: 'center'
          }}>
            <button
              onClick={handleRefreshData}
              disabled={isRefreshing}
              style={{
                background: isRefreshing ? 'hsl(var(--muted) / 0.5)' : 'hsl(280 70% 60% / 0.2)',
                border: `1px solid ${isRefreshing ? 'hsl(var(--border))' : 'hsl(280 70% 60%)'}`,
                borderRadius: '12px',
                padding: '12px',
                color: isRefreshing ? 'hsl(var(--muted-foreground))' : 'hsl(280 70% 60%)',
                fontSize: '18px',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '48px',
                height: '48px',
                cursor: isRefreshing ? 'not-allowed' : 'pointer'
              }}
              onMouseEnter={(e) => {
                if (!isRefreshing) {
                  e.target.style.background = 'hsl(280 70% 60% / 0.3)'
                  e.target.style.transform = 'scale(1.05)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isRefreshing) {
                  e.target.style.background = 'hsl(280 70% 60% / 0.2)'
                  e.target.style.transform = 'scale(1)'
                }
              }}
              title={isRefreshing ? 'Daten werden aktualisiert...' : 'Token-Daten aktualisieren'}
            >
              {isRefreshing ? '🔄' : '🔄'}
            </button>
            <Link 
              to="/settings"
              style={{
                background: 'hsl(var(--secondary) / 0.3)',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
                padding: '12px',
                textDecoration: 'none',
                color: 'hsl(var(--foreground))',
                fontSize: '20px',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '48px',
                height: '48px'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'hsl(var(--secondary) / 0.5)'
                e.target.style.transform = 'scale(1.1)'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'hsl(var(--secondary) / 0.3)'
                e.target.style.transform = 'scale(1)'
              }}
            >
              ⚙️
            </Link>
            
            <button 
              onClick={handleLogout}
              disabled={isLoggingOut}
              style={{
                background: 'hsl(var(--destructive) / 0.3)',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
                padding: '12px',
                cursor: isLoggingOut ? 'not-allowed' : 'pointer',
                opacity: isLoggingOut ? 0.6 : 1,
                color: 'hsl(var(--foreground))',
                fontSize: '20px',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '48px',
                height: '48px'
              }}
              onMouseEnter={(e) => {
                if (!isLoggingOut) {
                  e.target.style.background = 'hsl(var(--destructive) / 0.5)'
                  e.target.style.transform = 'scale(1.1)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoggingOut) {
                  e.target.style.background = 'hsl(var(--destructive) / 0.3)'
                  e.target.style.transform = 'scale(1)'
                }
              }}
            >
              {isLoggingOut ? '⏳' : '⏻'}
            </button>
          </div>
        </div>

        {/* Stats - Mobile Layout */}
        <div style={{ marginBottom: '30px' }}>
          {/* Today and Week Stats - Mobile: Side by side, Desktop: All three */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)',
            gap: '15px',
            marginBottom: isMobile ? '15px' : '30px'
          }}>
            {/* Heute */}
          <div style={{
            background: 'hsl(var(--card))',
            borderRadius: '20px',
            padding: '25px',
            boxShadow: '0 10px 30px hsl(var(--background) / 0.3)',
            border: '1px solid hsl(var(--border))'
          }}>
            <h3 style={{
              margin: '0 0 15px 0',
              fontSize: '16px',
              fontWeight: '600',
              color: 'hsl(var(--primary))',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Heute
            </h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', color: 'hsl(var(--muted-foreground))' }}>Bilder:</span>
              <span style={{ fontSize: '18px', fontWeight: '700', color: 'hsl(var(--primary))' }}>{stats.today.images}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', color: 'hsl(var(--muted-foreground))' }}>Zeit:</span>
              <span style={{ fontSize: '18px', fontWeight: '700', color: 'hsl(var(--secondary))' }}>{stats.today.time} min</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', color: 'hsl(var(--muted-foreground))' }}>Tokens:</span>
              <span style={{ fontSize: '18px', fontWeight: '700', color: 'hsl(var(--accent))' }}>{stats.today.tokens}K</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', color: 'hsl(var(--muted-foreground))' }}>Kosten:</span>
              <span style={{ fontSize: '18px', fontWeight: '700', color: 'hsl(var(--destructive))' }}>€{(stats.today.cost || 0).toFixed(2)}</span>
            </div>
            
            
            {/* Enhanced Image Details Section */}
            <ImageDetailsSection 
              stats={stats.today} 
              aspectRatios={aspectRatios.today}
              period="today"
            />
          </div>

            {/* Diese Woche */}
            <div style={{
              background: 'hsl(var(--card))',
              borderRadius: '20px',
              padding: '25px',
              boxShadow: '0 10px 30px hsl(var(--background) / 0.3)',
              border: '1px solid hsl(var(--border))'
            }}>
              <h3 style={{
                margin: '0 0 15px 0',
                fontSize: '16px',
                fontWeight: '600',
                color: 'hsl(var(--primary))',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Diese Woche
              </h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: 'hsl(var(--muted-foreground))' }}>Bilder:</span>
                <span style={{ fontSize: '18px', fontWeight: '700', color: 'hsl(var(--primary))' }}>{stats.week.images}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: 'hsl(var(--muted-foreground))' }}>Zeit:</span>
                <span style={{ fontSize: '18px', fontWeight: '700', color: 'hsl(var(--secondary))' }}>{stats.week.time} min</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: 'hsl(var(--muted-foreground))' }}>Tokens:</span>
                <span style={{ fontSize: '18px', fontWeight: '700', color: 'hsl(var(--accent))' }}>{stats.week.tokens}K</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: 'hsl(var(--muted-foreground))' }}>Kosten:</span>
                <span style={{ fontSize: '18px', fontWeight: '700', color: 'hsl(var(--destructive))' }}>€{(stats.week.cost || 0).toFixed(2)}</span>
              </div>
              
              
              {/* Enhanced Image Details Section */}
              <ImageDetailsSection 
                stats={stats.week} 
                aspectRatios={aspectRatios.week}
                period="week"
              />
            </div>

            {/* Monat - Desktop: Third column, Mobile: Hidden here */}
            {!isMobile && (
              <div style={{
                background: 'hsl(var(--card))',
                borderRadius: '20px',
                padding: '25px',
                boxShadow: '0 10px 30px hsl(var(--background) / 0.3)',
                border: '1px solid hsl(var(--border))',
                textAlign: 'center'
              }}>
                <h3 style={{
                  margin: '0 0 15px 0',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: 'hsl(var(--primary))',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Monat
                </h3>
                <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'hsl(var(--muted-foreground))' }}>Deine Ausgaben</p>
                <p style={{
                  margin: 0,
                  fontSize: '32px',
                  fontWeight: '700',
                  color: 'hsl(47 100% 65%)',
                  background: 'linear-gradient(135deg, hsl(47 100% 65%), hsl(280 70% 60%))',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  €{stats.month.cost.toFixed(2)}
                </p>
              </div>
            )}
          </div>

          {/* Month Stats - Mobile: Full width below */}
          {isMobile && (
            <div style={{
              background: 'hsl(var(--card))',
              borderRadius: '20px',
              padding: '25px',
              boxShadow: '0 10px 30px hsl(var(--background) / 0.3)',
              border: '1px solid hsl(var(--border))',
              textAlign: 'center',
              width: '100%'
            }}>
              <h3 style={{
                margin: '0 0 15px 0',
                fontSize: '16px',
                fontWeight: '600',
                color: 'hsl(var(--primary))',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Monat
              </h3>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'hsl(var(--muted-foreground))' }}>Deine Ausgaben</p>
              <p style={{
                margin: 0,
                fontSize: '32px',
                fontWeight: '700',
                color: 'hsl(47 100% 65%)',
                background: 'linear-gradient(135deg, hsl(47 100% 65%), hsl(280 70% 60%))',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                €{stats.month.cost.toFixed(2)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tools Grid */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '25px'
      }}>
        {tools.map((tool) => (
          <div key={tool.id} style={{ position: 'relative' }}>
            {tool.available ? (
              <Link
                to={tool.path}
                style={{
                  textDecoration: 'none',
                  display: 'block',
                  background: tool.id === 'nano-banana' ? '#a86d09' : tool.id === 'gallery' ? '#5a387d' : 'hsl(var(--card))',
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
                  {tool.title}
                </h3>
                <p style={{
                  margin: 0,
                  fontSize: '16px',
                  color: 'hsl(var(--primary))',
                  fontWeight: '600'
                }}>
                  {tool.subtitle}
                </p>
              </Link>
            ) : (
              <div
                onClick={() => handleDisabledToolClick(tool.title)}
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
                  {tool.title}
                </h3>
                <p style={{
                  margin: 0,
                  fontSize: '16px',
                  color: 'hsl(var(--primary))',
                  fontWeight: '600'
                }}>
                  {tool.subtitle}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      {showDisabledModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            background: 'hsl(var(--card))',
            borderRadius: '20px',
            padding: '30px',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 25px 50px hsl(var(--background) / 0.5)',
            border: '1px solid hsl(var(--border))'
          }}>
            <h3 style={{
              margin: '0 0 15px 0',
              fontSize: '24px',
              fontWeight: '700',
              color: 'hsl(var(--foreground))'
            }}>
              {disabledToolName}
            </h3>
            <p style={{
              margin: '0 0 25px 0',
              fontSize: '16px',
              color: 'hsl(var(--muted-foreground))',
              lineHeight: '1.5'
            }}>
              Noch nicht verfügbar - wir arbeiten daran! 🚀
            </p>
            <button
              onClick={closeModal}
              style={{
                background: 'linear-gradient(135deg, hsl(47 100% 65%), hsl(280 70% 60%))',
                color: 'hsl(var(--primary-foreground))',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.05)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)'
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardPage