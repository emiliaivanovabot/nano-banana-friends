import { Link } from 'react-router-dom'

function HomePage() {
  return (
    <div style={{ 
      padding: '40px 20px', 
      maxWidth: '600px', 
      margin: '0 auto',
      textAlign: 'center' 
    }}>
      <h1 style={{ 
        fontSize: '2.5rem', 
        marginBottom: '20px', 
        color: '#1F2937' 
      }}>
        AI Video Generator
      </h1>
      
      <p style={{ 
        fontSize: '1.2rem', 
        color: '#6B7280', 
        marginBottom: '40px' 
      }}>
        Wähle dein Projekt:
      </p>

      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '20px',
        alignItems: 'center'
      }}>
        <Link 
          to="/wan-video" 
          style={{ 
            textDecoration: 'none',
            width: '100%',
            maxWidth: '300px'
          }}
        >
          <button style={{
            width: '100%',
            padding: '20px',
            fontSize: '1.2rem',
            backgroundColor: '#3B82F6',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.2s',
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#2563EB'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#3B82F6'}
          >
            <div style={{ marginBottom: '8px', fontSize: '1.4rem' }}>🎬</div>
            <div style={{ fontWeight: 'bold' }}>WAN 2.2 Video</div>
            <div style={{ fontSize: '0.9rem', opacity: '0.9', marginTop: '4px' }}>
              Bild zu Video Generierung
            </div>
          </button>
        </Link>

        <Link 
          to="/nono-banana" 
          style={{ 
            textDecoration: 'none',
            width: '100%',
            maxWidth: '300px'
          }}
        >
          <button style={{
            width: '100%',
            padding: '20px',
            fontSize: '1.2rem',
            backgroundColor: '#F59E0B',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.2s',
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#D97706'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#F59E0B'}
          >
            <div style={{ marginBottom: '8px', fontSize: '1.4rem' }}>🍌</div>
            <div style={{ fontWeight: 'bold' }}>nono banana</div>
            <div style={{ fontSize: '0.9rem', opacity: '0.9', marginTop: '4px' }}>
              Gemini 3 Pro Bildgenerierung
            </div>
          </button>
        </Link>

        <Link 
          to="/qwen" 
          style={{ 
            textDecoration: 'none',
            width: '100%',
            maxWidth: '300px'
          }}
        >
          <button style={{
            width: '100%',
            padding: '20px',
            fontSize: '1.2rem',
            backgroundColor: '#8B5CF6',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.2s',
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#7C3AED'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#8B5CF6'}
          >
            <div style={{ marginBottom: '8px', fontSize: '1.4rem' }}>🎨</div>
            <div style={{ fontWeight: 'bold' }}>Qwen Image Edit</div>
            <div style={{ fontSize: '0.9rem', opacity: '0.9', marginTop: '4px' }}>
              Qwen 3 Max Bildbearbeitung
            </div>
          </button>
        </Link>
      </div>
    </div>
  )
}

export default HomePage