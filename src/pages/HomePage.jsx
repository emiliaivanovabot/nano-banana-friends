import { Link } from 'react-router-dom'

function HomePage() {
  return (
    <div className="homepage-container">
      <h1 className="homepage-title">
        AI Video Generator
      </h1>
      
      <p className="homepage-subtitle">
        Wähle dein Projekt:
      </p>

      <div className="buttons-container">
        <Link 
          to="/wan-video" 
          className="button-link"
        >
          <button className="premium-button premium-button--blue">
            <span className="button-icon">🎬</span>
            <div className="button-title">WAN 2.2 Video</div>
            <div className="button-description">
              Bild zu Video Generierung
            </div>
          </button>
        </Link>

        <Link 
          to="/nono-banana" 
          className="button-link"
        >
          <button className="premium-button premium-button--orange">
            <span className="button-icon">🍌</span>
            <div className="button-title">nono banana</div>
            <div className="button-description">
              Gemini 3 Pro Bildgenerierung
            </div>
          </button>
        </Link>

        <Link 
          to="/qwen" 
          className="button-link"
        >
          <button className="premium-button premium-button--purple">
            <span className="button-icon">🎨</span>
            <div className="button-title">Qwen Image Edit</div>
            <div className="button-description">
              Qwen 3 Max Bildbearbeitung
            </div>
          </button>
        </Link>
      </div>
    </div>
  )
}

export default HomePage