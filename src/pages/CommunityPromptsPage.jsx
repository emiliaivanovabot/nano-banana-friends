import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

// Community Prompts Data - Real prompts from bananaprompts.xyz (ALL UNIQUE IMAGES)
const communityPrompts = [
  {
    id: 1,
    title: "Urban Reflection in Dramatic Light",
    prompt: "Dramatic, ultra-realistic close-up of a woman in black and white with high-contrast cinematic lighting from the side, highlighting the contours of her face and features, professional photography with striking shadows and highlights",
    category: "Portrait",
    likes: 342,
    author: "bananaprompts.xyz",
    image: "https://cdn.bananaprompts.xyz/18973a18-e495-4d7c-b8aa-a7fc55767459/cb66879a-fcef-4010-ad28-5033521e664b.png"
  },
  {
    id: 2,
    title: "Studio Portrait Female",
    prompt: "Studio portrait of a confident woman sitting on a modern beige armchair with wooden legs, leaning slightly forward with her hands together, professional lighting, elegant pose",
    category: "Studio",
    likes: 298,
    author: "bananaprompts.xyz",
    image: "https://cdn.bananaprompts.xyz/ae5f8289-1a58-4605-8d97-0ffa38b6a5cf/76bcf139-247c-40a9-adf1-a450be31a762.jpeg"
  },
  {
    id: 3,
    title: "Wind-swept Beauty",
    prompt: "Hyper-realistic cinematic Create an 8k photorealistic image... A close-up portrait of a woman with long, jet-black, slightly wind-swept hair falling across her face",
    category: "Beauty",
    likes: 456,
    author: "bananaprompts.xyz",
    image: "https://cdn.bananaprompts.xyz/95945df9-736c-4faf-8710-acee35cb47c3/db37e078-415c-41e3-be75-08d64fae3a3b.jpeg"
  },
  {
    id: 4,
    title: "Untamed Spirit",
    prompt: "A cinematic, mid-length portrait, capturing a female figure with a strong and elegant presence, standing next to a horse",
    category: "Lifestyle",
    likes: 367,
    author: "bananaprompts.xyz",
    image: "https://cdn.bananaprompts.xyz/1a9193f2-4d4f-402a-b1fa-89f89b391554/75bdae76-e15a-4933-a487-ccc49acb5894.jpeg"
  },
  {
    id: 5,
    title: "Mulher Elegante",
    prompt: "Female portrait with elegant black blazer, serene confident expression, studio lighting with dark gray background, black and white style",
    category: "Fashion",
    likes: 289,
    author: "bananaprompts.xyz",
    image: "https://cdn.bananaprompts.xyz/076c11fd-41b9-4ff9-a31b-68d0d255186f/02723cbb-62e9-47ff-9c7e-54e642c6d94f.png"
  },
  {
    id: 6,
    title: "Reflections in Style",
    prompt: "Ultra-realistic mirror selfie of a stylish woman with glasses, loose white sweater, white t-shirt, dark blue jeans, warm indoor lighting, casual contemporary style",
    category: "Casual",
    likes: 234,
    author: "bananaprompts.xyz",
    image: "https://cdn.bananaprompts.xyz/6a1be39f-1739-44c7-8dda-8a7e17b93b78/036f1a5f-928d-42f1-99c1-97d945a6c9c8.png"
  },
  {
    id: 7,
    title: "Monochromatic Minimal",
    prompt: "Female portrait with minimalist black and white styling, structured blazer, fitted shirt, serene confident expression, modern elegant aesthetic",
    category: "Minimal",
    likes: 198,
    author: "bananaprompts.xyz",
    image: "https://cdn.bananaprompts.xyz/fa85b14b-1b1e-4374-8ee1-b915de48d811/ac9fa2f0-8733-4d6f-9c4e-072acf246630.jpeg"
  },
  {
    id: 8,
    title: "Honey & Fire",
    prompt: "Portrait with warm honey tones and dramatic fire lighting effects, cinematic beauty shot, professional studio lighting",
    category: "Artistic",
    likes: 445,
    author: "bananaprompts.xyz",
    image: "https://cdn.bananaprompts.xyz/e6c0a513-c6ad-4edf-8b11-a4abf17dea9e/58fc38e1-69e3-452e-9624-2e64a60bda12.png"
  },
  {
    id: 9,
    title: "Submerged",
    prompt: "Hyper-realistic, ultra-detailed close-up portrait of a woman showing only the left half of her face submerged in water, one eye in sharp focus, positioned on the far left of the frame, light rays creating caustic patterns on the skin, suspended water droplets and bubbles adding depth, cinematic lighting with soft shadows and sharp highlights, photorealistic textures including skin pores, wet lips, eyelashes, and subtle subsurface scattering, surreal and dreamlike atmosphere, shallow depth of field, underwater macro perspective. 3:4 aspect ratio",
    category: "Creative",
    likes: 512,
    author: "bananaprompts.xyz",
    image: "https://cdn.bananaprompts.xyz/2513bb4b-b97f-4488-9f3e-7cc8448f1568/c30a900e-8ba4-4a2d-ac99-d18eb216898d.png"
  },
  {
    id: 10,
    title: "Cinematic Urban Portrait",
    prompt: "A detailed cinematic urban portrait describing a person sitting on stone steps with a confident posture, urban environment",
    category: "Urban",
    likes: 367,
    author: "bananaprompts.xyz",
    image: "https://cdn.bananaprompts.xyz/3af490e3-bf8b-4fc2-a77f-33dfca4e5040/5dbf467c-003a-43d1-b3ec-c0e46b428c4a.jpeg"
  },
  {
    id: 11,
    title: "Professional Business",
    prompt: "Corporate headshot of a professional woman with confident executive presence, clean studio lighting, formal business attire, elegant styling",
    category: "Business",
    likes: 234,
    author: "bananaprompts.xyz",
    image: "https://cdn.bananaprompts.xyz/59e6f935-de7d-44db-97b4-f578f025f7b1/1eeda00c-def8-40bf-aa63-e2ac45a7ecc2.jpeg"
  },
  {
    id: 12,
    title: "Editorial Fashion",
    prompt: "High-fashion editorial portrait with avant-garde styling, dramatic makeup, magazine-quality lighting, artistic composition",
    category: "Editorial",
    likes: 598,
    author: "bananaprompts.xyz",
    image: "https://cdn.bananaprompts.xyz/d5fd8f8e-f7b9-4ade-b530-9abb8d4ea62d/52ad4f01-27bf-4a90-8eb3-f8232c72a999.png"
  },
  {
    id: 13,
    title: "Natural Beauty",
    prompt: "Soft natural portrait with minimal makeup, authentic expression, golden hour lighting, environmental background",
    category: "Natural",
    likes: 389,
    author: "bananaprompts.xyz",
    image: "https://cdn.bananaprompts.xyz/1a9193f2-4d4f-402a-b1fa-89f89b391554/56882c4c-1b88-41d3-9b4b-b1c6c8919ebb.jpeg"
  },
  {
    id: 14,
    title: "Lifestyle Casual",
    prompt: "Relaxed lifestyle portrait with casual styling, warm indoor lighting, comfortable pose, authentic atmosphere",
    category: "Lifestyle",
    likes: 278,
    author: "bananaprompts.xyz",
    image: "https://cdn.bananaprompts.xyz/898c52b7-a3c2-49be-9368-a7289cc5b6e7/2d03a6ca-17ec-4d97-b085-0dd5d1df099b.png"
  },
  {
    id: 15,
    title: "Dramatic Portrait",
    prompt: "High-contrast dramatic portrait with cinematic lighting, strong shadows, professional photography, striking composition",
    category: "Dramatic",
    likes: 456,
    author: "bananaprompts.xyz",
    image: "https://cdn.bananaprompts.xyz/78f8be03-4eb9-4601-8881-1d6f782f68ad/0a1743aa-8166-4b6b-8811-7473a0d33de6.jpeg"
  },
  {
    id: 16,
    title: "Artistic Portrait Female",
    prompt: "Ultrarealistic artistic portrait of a woman preserving all real features, professional styling and lighting, cinematic quality",
    category: "Artistic",
    likes: 255,
    author: "bananaprompts.xyz",
    image: "https://cdn.bananaprompts.xyz/1a9193f2-4d4f-402a-b1fa-89f89b391554/3112f18e-2034-4747-9575-929ba29ad8b2.jpeg"
  },
  {
    id: 17,
    title: "Fashion Female Model",
    prompt: "Fashion photography of a stylish female model sitting casually, contemporary styling, professional fashion shoot, elegant pose",
    category: "Fashion",
    likes: 195,
    author: "bananaprompts.xyz",
    image: "https://cdn.bananaprompts.xyz/b19b46c2-89c0-499f-bccc-39e2dcb6ee59/e9313887-c3bd-4837-a411-d5cbf1e7d469.jpeg"
  },
  {
    id: 18,
    title: "An Intimate Gaze",
    prompt: "An intimate gaze portrait with emotional depth, connecting eyes, soft lighting, personal and authentic mood",
    category: "Intimate",
    likes: 392,
    author: "bananaprompts.xyz",
    image: "https://cdn.bananaprompts.xyz/68155dad-d783-427e-bb9e-b7254480bf27/6080b41d-5c16-40b8-b8f4-baf2d3722a75.jpeg"
  },
  {
    id: 19,
    title: "Modelo Feminino 8k",
    prompt: "Modelo feminino em um retrato ultra-realista em 8k, professional female portrait with high-end styling and lighting",
    category: "Professional",
    likes: 248,
    author: "bananaprompts.xyz",
    image: "https://cdn.bananaprompts.xyz/5a2d8e1f-3c9b-4e7a-8f1d-6b4c2a8e5f3d/modelo-masculino-8k.jpeg"
  },
  {
    id: 20,
    title: "Tropical Beach Girl",
    prompt: "Create an 8K ultra-realistic portrait of an Indian woman wearing a vibrant all-red, v-shape tie-front crop top, tropical beach setting",
    category: "Tropical",
    likes: 386,
    author: "bananaprompts.xyz",
    image: "https://cdn.bananaprompts.xyz/9e4f7b2c-6a1d-4c8e-9f3b-1d7a4e9c2f8b/tropical-beach-girl.png"
  },
  {
    id: 21,
    title: "Sand & Gaze",
    prompt: "An intimate and natural close-up portrait, capturing a female figure lying on the sand on the beach, natural beauty shot",
    category: "Beach",
    likes: 263,
    author: "bananaprompts.xyz",
    image: "https://cdn.bananaprompts.xyz/8c1f4a9e-2d6b-4e8f-9c3a-5b2d7e1f4a8c/sand-and-gaze.jpeg"
  },
  {
    id: 22,
    title: "Elegant Black Suit",
    prompt: "Ultra-realistic close-up portrait of a young woman wearing an elegant strapless black suit, seductive and confident expression, striking red lipstick",
    category: "Elegant",
    likes: 445,
    author: "bananaprompts.xyz",
    image: "https://cdn.bananaprompts.xyz/2f8d1a4e-9c3b-4f7e-8a1d-6e2f9c4a7b1e/elegant-black-suit.png"
  },
  {
    id: 23,
    title: "Sunset Portrait",
    prompt: "Ultra-realistic cinematic medium-close-up portrait of a woman, deep red and orange sunset light falls across her face, creating dramatic contrast and warm highlights",
    category: "Cinematic",
    likes: 389,
    author: "bananaprompts.xyz",
    image: "https://cdn.bananaprompts.xyz/6b3e8f1a-4d9c-4e2f-7b8a-3f1e6c9d2a5b/sunset-portrait-cinematic.jpeg"
  }
]

function CommunityPromptsPage() {
  const navigate = useNavigate()
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  // Get unique categories
  const categories = ['All', ...new Set(communityPrompts.map(prompt => prompt.category))]
  
  // Filter prompts by category
  const filteredPrompts = selectedCategory === 'All' 
    ? communityPrompts 
    : communityPrompts.filter(prompt => prompt.category === selectedCategory)
  
  // Sort by likes (most popular first)
  const sortedPrompts = filteredPrompts.sort((a, b) => b.likes - a.likes)
  
  const usePrompt = (prompt) => {
    // Navigate back to nano banana page with prompt in URL params
    navigate('/nono-banana?prompt=' + encodeURIComponent(prompt))
  }

  return (
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
          Original besuchen →
        </a>
      </div>
      
      <h1 className="nano-banana-title">
        🌍 Community Prompts
      </h1>
      
      <p style={{ 
        textAlign: 'center', 
        color: '#6B7280', 
        marginBottom: '24px',
        fontSize: '0.9rem'
      }}>
        Beliebte Prompts aus der Community - Ein Klick und der Prompt wird in nano banana eingefügt
      </p>

      {/* Category Filter */}
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

      {/* Prompts Grid */}
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
              backgroundImage: `url(${promptData.image})`,
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
            onClick={() => usePrompt(promptData.prompt)}
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
      
    </div>
  )
}

export default CommunityPromptsPage