import { Link } from 'react-router-dom'

function QwenPage() {
  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      
      <Link 
        to="/" 
        style={{ 
          display: 'inline-block',
          marginBottom: '20px',
          color: '#6B7280',
          textDecoration: 'none',
          fontSize: '14px'
        }}
      >
        ← Zurück zur Startseite
      </Link>
      
      <h1 style={{ 
        fontSize: '1.8rem', 
        marginBottom: '20px', 
        color: '#1F2937',
        textAlign: 'center'
      }}>
        🎨 Qwen Image Edit
      </h1>

      <div style={{ 
        textAlign: 'center',
        padding: '40px',
        backgroundColor: '#F3F4F6',
        borderRadius: '12px',
        border: '2px dashed #8B5CF6'
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🎨</div>
        <h2 style={{ color: '#7C3AED', marginBottom: '10px' }}>
          Qwen Image Edit 2509
        </h2>
        <p style={{ color: '#6B7280', fontSize: '1.1rem', marginBottom: '20px' }}>
          Powered by Qwen-3-Max LLM
        </p>
        <div style={{ 
          background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
          color: 'white',
          padding: '15px',
          borderRadius: '8px',
          marginTop: '20px'
        }}>
          <p style={{ margin: '0', fontSize: '0.9rem' }}>
            🚧 In Entwicklung - Bald verfügbar!<br/>
            Qwen Image Edit API Integration kommt als nächstes...
          </p>
        </div>
      </div>

    </div>
  )
}

export default QwenPage