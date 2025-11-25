import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { useState } from 'react'

function DashboardPage() {
  const { user, logout } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [showDisabledModal, setShowDisabledModal] = useState(false)
  const [disabledToolName, setDisabledToolName] = useState('')

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
      title: 'Image Generation',
      description: 'AI Image Creation',
      icon: '🍌',
      color: '#ffffff',
      bgColor: '#f97316',
      borderColor: '#ea580c',
      hoverBg: '#ea580c',
      sectionTitle: 'Nano Banana Pro'
    },
    {
      id: 'gallery',
      path: '/gallery',
      title: 'Meine Bilder',
      description: 'Alle generierten Bilder',
      icon: '🖼️',
      color: '#ffffff',
      bgColor: '#8b5cf6',
      borderColor: '#7c3aed',
      hoverBg: '#7c3aed',
      sectionTitle: 'Bilder Galerie'
    },
    {
      id: 'wan-video',
      path: '/wan-video',
      title: 'Video Generation',
      description: 'Image to Video',
      icon: '🎬',
      color: '#ffffff',
      bgColor: '#1f2937',
      borderColor: '#111827',
      hoverBg: '#111827',
      sectionTitle: 'WAN 2.2 Video',
      disabled: true
    },
    {
      id: 'qwen',
      path: '/qwen',
      title: 'Image Editor',
      description: 'Image Processing',
      icon: '🎨',
      color: '#ffffff',
      bgColor: '#3b82f6',
      borderColor: '#2563eb',
      hoverBg: '#2563eb',
      sectionTitle: 'Qwen - kommt noch',
      disabled: true
    }
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '16px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
        background: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(20px)',
        padding: '16px 24px',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div>
          <h1 style={{
            margin: '0 0 4px 0',
            fontSize: '24px',
            fontWeight: '600',
            color: 'white'
          }}>
            🍌 Nano Banana Friends
          </h1>
          <h2 style={{
            margin: '0 0 4px 0',
            fontSize: '20px',
            fontWeight: '500',
            color: 'white'
          }}>
            Hallo {getFirstName(user?.username)}!
          </h2>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.8)'
          }}>
            Wähle dein AI Tool
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link 
            to="/settings"
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '6px',
              padding: '8px 12px',
              fontSize: '13px',
              textDecoration: 'none',
              transition: 'all 0.2s',
              cursor: 'pointer',
              color: 'white',
              fontWeight: '500'
            }}
          >
            ⚙️
          </Link>
          
          <button 
            onClick={handleLogout}
            disabled={isLoggingOut}
            style={{
              background: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              padding: '8px 12px',
              fontSize: '13px',
              cursor: isLoggingOut ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              opacity: isLoggingOut ? 0.6 : 1,
              color: '#dc2626',
              fontWeight: '500'
            }}
          >
            {isLoggingOut ? '⏳' : '⏻'}
          </button>
        </div>
      </div>

      {/* Tools Grid */}
      <div 
        className="tools-grid"
        style={{
          display: 'grid',
          gap: '12px',
          maxWidth: '800px',
          margin: '0 auto'
        }}
      >
        {tools.map((tool) => (
          <div key={tool.id} style={{ marginBottom: '20px' }}>
            <h3 style={{
              margin: '0 0 8px 0',
              fontSize: '18px',
              fontWeight: '600',
              color: 'white',
              textAlign: 'left'
            }}>
              {tool.sectionTitle}
            </h3>
            
            {tool.disabled ? (
              <div
                onClick={() => handleDisabledToolClick(tool.sectionTitle)}
                style={{
                  textDecoration: 'none',
                  background: tool.bgColor,
                  borderRadius: '8px',
                  padding: '16px',
                  border: `2px solid ${tool.borderColor}`,
                  transition: 'all 0.2s ease',
                  cursor: 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  height: '100px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                  opacity: 0.5,
                  filter: 'grayscale(50%)'
                }}
              >
                <span style={{
                  fontSize: '18px',
                  flexShrink: 0,
                  filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))'
                }}>
                  {tool.icon}
                </span>
                
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: '14px',
                    fontWeight: '600',
                    color: tool.color,
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                  }}>
                    {tool.title}
                  </h3>
                  <p style={{
                    margin: 0,
                    fontSize: '12px',
                    color: tool.color,
                    fontWeight: '400',
                    lineHeight: '1.3',
                    opacity: 0.9,
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
                  }}>
                    {tool.description}
                  </p>
                </div>
              </div>
            ) : (
              <Link
                to={tool.path}
                style={{
                  textDecoration: 'none',
                  background: tool.bgColor,
                  borderRadius: '8px',
                  padding: '16px',
                  border: `2px solid ${tool.borderColor}`,
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  height: '100px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = tool.hoverBg
                  e.target.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.25)'
                  e.target.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = tool.bgColor
                  e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)'
                  e.target.style.transform = 'translateY(0px)'
                }}
              >
                <span style={{
                  fontSize: '18px',
                  flexShrink: 0,
                  filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))'
                }}>
                  {tool.icon}
                </span>
                
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: '14px',
                    fontWeight: '600',
                    color: tool.color,
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                  }}>
                    {tool.title}
                  </h3>
                  <p style={{
                    margin: 0,
                    fontSize: '12px',
                    color: tool.color,
                    fontWeight: '400',
                    lineHeight: '1.3',
                    opacity: 0.9,
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
                  }}>
                    {tool.description}
                  </p>
                </div>
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Disabled Tool Modal */}
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
          backdropFilter: 'blur(2px)',
          animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
            animation: 'slideUp 0.2s ease'
          }}>
            <h3 style={{
              margin: '0 0 16px 0',
              fontSize: '20px',
              fontWeight: '600',
              color: '#333'
            }}>
              {disabledToolName}
            </h3>
            <p style={{
              margin: '0 0 24px 0',
              fontSize: '16px',
              color: '#666',
              lineHeight: '1.5'
            }}>
              Noch nicht in Funktion
            </p>
            <button
              onClick={closeModal}
              style={{
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#5a67d8'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#667eea'
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