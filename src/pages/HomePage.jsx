import { Link } from 'react-router-dom'

function HomePage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: '700',
          color: '#1f2937',
          marginBottom: '8px'
        }}>
          AI Creation Suite
        </h1>
        
        <p style={{
          fontSize: '16px',
          color: '#6b7280',
          marginBottom: '40px'
        }}>
          Professional AI tools for image and video generation
        </p>

        {/* Login Section */}
        <div style={{ marginBottom: '40px' }}>
          <p style={{ 
            marginBottom: '20px', 
            fontSize: '14px', 
            color: '#374151',
            fontWeight: '500'
          }}>
            Sign in to access your professional AI tools
          </p>
          <Link 
            to="/login" 
            style={{ textDecoration: 'none' }}
          >
            <button style={{ 
              background: '#1f2937',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#111827'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#1f2937'
            }}>
              Sign In
            </button>
          </Link>
        </div>

        <div>
          <h2 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: '#374151',
            marginBottom: '20px'
          }}>
            Professional AI Tools
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '12px',
            marginBottom: '24px'
          }}>
            <div style={{
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              padding: '12px',
              height: '90px',
              display: 'flex',
              flexDirection: 'column',
              opacity: '0.6'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '6px'
              }}>
                <div style={{
                  background: '#f3f4f6',
                  color: '#4b5563',
                  fontSize: '9px',
                  fontWeight: '700',
                  padding: '3px 5px',
                  borderRadius: '3px'
                }}>
                  VID
                </div>
                <h3 style={{
                  margin: 0,
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#6b7280'
                }}>
                  Video Generation
                </h3>
              </div>
              <p style={{
                margin: 0,
                fontSize: '11px',
                color: '#9ca3af',
                lineHeight: '1.3'
              }}>
                Image to Video
              </p>
            </div>

            <div style={{
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              padding: '12px',
              height: '90px',
              display: 'flex',
              flexDirection: 'column',
              opacity: '0.6'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '6px'
              }}>
                <div style={{
                  background: '#f3f4f6',
                  color: '#4b5563',
                  fontSize: '9px',
                  fontWeight: '700',
                  padding: '3px 5px',
                  borderRadius: '3px'
                }}>
                  IMG
                </div>
                <h3 style={{
                  margin: 0,
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#6b7280'
                }}>
                  Image Generation
                </h3>
              </div>
              <p style={{
                margin: 0,
                fontSize: '11px',
                color: '#9ca3af',
                lineHeight: '1.3'
              }}>
                AI Image Creation
              </p>
            </div>

            <div style={{
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              padding: '12px',
              height: '90px',
              display: 'flex',
              flexDirection: 'column',
              opacity: '0.6'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '6px'
              }}>
                <div style={{
                  background: '#f3f4f6',
                  color: '#4b5563',
                  fontSize: '9px',
                  fontWeight: '700',
                  padding: '3px 5px',
                  borderRadius: '3px'
                }}>
                  EDT
                </div>
                <h3 style={{
                  margin: 0,
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#6b7280'
                }}>
                  Image Editor
                </h3>
              </div>
              <p style={{
                margin: 0,
                fontSize: '11px',
                color: '#9ca3af',
                lineHeight: '1.3'
              }}>
                Image Processing
              </p>
            </div>
          </div>
          
          <p style={{ 
            fontSize: '12px', 
            color: '#9ca3af',
            fontStyle: 'italic'
          }}>
            Sign in to unlock all features
          </p>
        </div>
      </div>
    </div>
  )
}

export default HomePage