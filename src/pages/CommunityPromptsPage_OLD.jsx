import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

// REAL Community Prompts Data from bananaprompts.xyz database
const communityPrompts = [
  {
    id: 6,
    title: "Submerged",
    prompt: "Use my uploaded photo to maintain my exact facial features, skin tone, eye color, and hair. Hyper-realistic, ultra-detailed close-up portrait showing only the left half of my face submerged in water, one eye in sharp focus, positioned on the far left of the frame, light rays creating caustic patterns on the skin, suspended water droplets and bubbles adding depth, cinematic lighting with soft shadows and sharp highlights, photorealistic textures including skin pores, wet lips, eyelashes, and subtle subsurface scattering, surreal and dreamlike atmosphere, shallow depth of field, underwater macro perspective. 3:4 aspect ratio",
    category: "Creative",
    likes: 512,
    author: "bananaprompts.xyz",
    image: "/community-images/70738daecf66b056.png"
  },
  {
    id: 7,
    title: "Gini",
    prompt: "Maintain the same face and person (use attached photo for accurate face). Hyper-realistic cinematic Create an 8k photorealistic image using the attached photo. A close-up portrait of a woman with long, jet-black, slightly wind-swept hair falling across her face. Her striking, light-colored eyes gaze upwards and to the right, catching a sharp, diagonal beam of natural light that illuminates the high points of her cheekbone, nose, and plump, glossy, mauve-toned lips a slightly light weight silk",
    category: "Beauty",
    likes: 456,
    author: "bananaprompts.xyz",
    image: "/community-images/917bfae488d8b000.jpeg"
  },
  {
    id: 11,
    title: "A cinematic urban portrait",
    prompt: "A cinematic urban portrait of me, keeping my real face unchanged. Use my uploaded photo to preserve all my facial features, eye color, skin tone, and hair style. I am sitting casually on outdoor stone steps in front of a building entrance, leaning slightly forward with a confident and contemplative posture. My left elbow rests on my knee, with my hand raised to my temple in a thoughtful gesture, while my right arm hangs more loosely, with my hand extended downward in a relaxed position. My legs are bent naturally, spreading apart for a grounded and strong presence. My gaze is directed toward the camera, steady and intense, with a calm yet powerful expression. I am wearing a black outfit: a fitted turtleneck sweater layered under a black coat with a wide collar and subtle texture. The coat has a tailored yet modern look, with a slightly matte fabric that absorbs the light, creating depth. My trousers are also black, slim-fitted, completing the clean, monochromatic style. No visible accessories, emphasizing minimalism and sophistication. The background shows part of an urban building with glass doors and warm interior lights softly glowing, adding contrast to the darker tones of my outfit. The lighting is warm and diffused, highlighting my face and upper body while creating soft shadows that add cinematic depth. The camera captures me slightly from below (low angle), emphasizing strength and presence, framed from the knees up. The focal length resembles a portrait lens around 50-85mm, producing natural proportions with a shallow depth of field that keeps me sharp against the softly blurred background. Style: cinematic, moody urban portrait, editorial fashion photography, minimalistic monochrome outfit, professional model vibe.",
    category: "Urban",
    likes: 387,
    author: "bananaprompts.xyz",
    image: "/community-images/629f21c3209ebc2a.jpeg"
  },
  {
    id: 18,
    title: "Mulher Elegante",
    prompt: "Recrie essa cena usando minha foto enviada como referência, mantendo o mesmo enquadramento, pose, iluminação e estilo da imagem de exemplo. A composição deve mostrar um retrato feminino de meio corpo, com a modelo sentada e levemente inclinada para a frente. O braço direito deve cruzar o corpo, com a mão esquerda apoiada suavemente no braço oposto, transmitindo elegância e confiança. A expressão facial deve ser serena, confiante e levemente enigmática. O olhar deve estar direcionado à câmera, com os lábios suavemente fechados e postura firme. A roupa é composta por um conjunto escuro e sofisticado — blazer preto estruturado, usado sobre uma blusa preta justa.",
    category: "Fashion",
    likes: 342,
    author: "bananaprompts.xyz",
    image: "/community-images/029f12d8df51a5fe.png"
  },
  {
    id: 21,
    title: "Untamed Spirit",
    prompt: "A cinematic, mid-length portrait, capturing a female figure with a strong and elegant presence, standing next to a horse. The subject faces the camera, with a direct and confident gaze. One hand gently holds the horse's halter or head, conveying a calm and powerful connection with the animal. She wears a long-sleeved shirt in a neutral tone (beige, khaki, or light gray), with the top buttons undone to create a V-neckline. The bottoms are earthy-colored pants (brown or khaki), complemented by a brown leather belt with a large, prominent gold buckle.",
    category: "Lifestyle",
    likes: 298,
    author: "bananaprompts.xyz",
    image: "/community-images/969a0a4e22d6a62f.jpeg"
  },
  {
    id: 22,
    title: "Monochromatic minimal elegant",
    prompt: "Recreate this scene using my submitted photo as a reference, maintaining the same framing, pose, lighting, and style as the example image. The composition should show a half-length female portrait, with the model sitting and leaning slightly forward. The right arm should cross the body, with the left hand resting gently on the opposite arm, conveying elegance and confidence. The facial expression should be serene, confident, and slightly enigmatic. The gaze should be directed toward the camera, with lips softly closed and a firm posture. The outfit consists of a dark, sophisticated ensemble—a structured black blazer worn over a fitted black shirt.",
    category: "Portrait",
    likes: 287,
    author: "bananaprompts.xyz",
    image: "/community-images/0e894b71d783bdd8.jpeg"
  },
  {
    id: 24,
    title: "Vintage Car Pro - Female Version",
    prompt: "Create a hyper-realistic portrait of a woman (woman of the uploaded photo) sitting in the driver's seat of a car, wearing a black shirt, combined with a faded light gray jacket and light gray wide-leg pants. White shoes should be visible, complementing the casual look. Round sunglasses with dark lenses should be positioned on the nose, highlighting a confident and slightly ironic facial expression. Relaxed posture: one arm on the sports steering wheel, the other supporting the head, conveying a relaxed look.",
    category: "Automotive",
    likes: 234,
    author: "bananaprompts.xyz",
    image: "/community-images/b64df61d6d42f589.jpeg"
  },
  {
    id: 26,
    title: "Classroom effect - Female Version",
    prompt: "Edit this image of a young woman into a high-contrast black and white portrait in a quiet classroom. She leans casually on a wooden school chair, legs crossed, wearing a navy blue sweatshirt, beige chinos, and black-and-white Converse sneakers. Calm neutral expression. Her left arm rests on the desk, her right hand drops casually to the side. Behind her, an off-white classroom wall with visible wear, pinned papers, photos, and sticky notes in a grid.",
    category: "Lifestyle",
    likes: 189,
    author: "bananaprompts.xyz",
    image: "/community-images/6e1165aa2d5e0e02.jpeg"
  },
  {
    id: 27,
    title: "Low-key portrait photography",
    prompt: "Professional studio portrait of a woman, confident and determined expression, head slightly tilted down, wearing a black V-neck t-shirt. Using a low-key photography setup with butterfly lighting (key light from front above), a hair rim light from behind, and a faint background light. The atmosphere is filled with a subtle haze or smoke. Shot on a medium format camera, high contrast, cinematic, sharp focus, soft shadows. Hyper-realistic, shot on a 85mm lens, sharp focus on eyes, detailed facial features.",
    category: "Studio",
    likes: 267,
    author: "bananaprompts.xyz",
    image: "/community-images/356148c2f6b7bcbf.png"
  },
  {
    id: 29,
    title: "Empresária e seu Reflexo",
    prompt: "A cinematic close-up portrait of a stylish woman standing by a large glass window, gazing thoughtfully at her reflection. The woman wears a black turtleneck sweater layered under a fitted dark blazer, creating a sleek and elegant look. The lighting is soft and natural, coming from the window, gently illuminating one side of the face while casting subtle shadows on the other, emphasizing depth and texture. The background is softly blurred, highlighting the calm and introspective mood of the scene.",
    category: "Business",
    likes: 223,
    author: "bananaprompts.xyz",
    image: "/community-images/9383bfc74dea4a38.png"
  },
  {
    id: 30,
    title: "A Woman with dramatic dual-colored lighting",
    prompt: "A woman with short dark hair is captured in a striking portrait, illuminated by dramatic dual-colored lighting. Her face is split, with one side bathed in a cool blue light and the other in a vibrant pink/red hue, creating a high-contrast and neon-like effect. She gazes directly at the viewer with a thoughtful or pensive expression, her left hand resting on her chin. She is wearing a dark t-shirt and a watch on her left wrist. The background is dark and indistinct, further emphasizing the colorful illumination on her face and upper body.",
    category: "Artistic",
    likes: 445,
    author: "bananaprompts.xyz",
    image: "/community-images/294e82757cade4e9.png"
  },
  {
    id: 31,
    title: "Elegante",
    prompt: "Recrie essa cena utilizando minha foto enviada como base, mantendo o mesmo enquadramento, pose, iluminação e atmosfera da imagem de referência. A composição deve mostrar uma mulher sentada sobre um banco alto de madeira com estrutura metálica preta, em um estúdio minimalista de fundo neutro em tons de cinza. O enquadramento deve capturar o corpo inteiro, com leve distância que realce a postura e o cenário limpo. A modelo deve estar com a perna direita dobrada e apoiada no degrau do banco, enquanto a esquerda toca o chão com elegância.",
    category: "Studio",
    likes: 312,
    author: "bananaprompts.xyz",
    image: "/community-images/d80911c10b5532bb.png"
  },
  {
    id: 32,
    title: "Foto estilosa de mulher com jaqueta de couro azul água",
    prompt: "Crie uma imagem hiper-realista baseada na minha imagem de referência, preservando meus traços e aparência originais, mas recriando fielmente o estilo, roupa, pose, iluminação e cenário da imagem modelo. A personagem aparece em plano médio, voltada levemente para a direita, com o rosto inclinado e olhar firme em direção à câmera. A expressão é confiante e neutra, transmitindo presença e estilo. Ela veste uma jaqueta de couro turquesa, moderna e ajustada, com textura realista e brilho suave típico do couro tratado.",
    category: "Fashion",
    likes: 278,
    author: "bananaprompts.xyz",
    image: "/community-images/a8f82051c811d65e.png"
  },
  {
    id: 36,
    title: "Engraving illustration portrait photo",
    prompt: "Generate a portrait of a woman from neck to head, and follow strictly the engraving illustration style of the reference. Put a lot more hatch lines on the face. The clothes don't have any details, only the outside lines.",
    category: "Artistic",
    likes: 156,
    author: "bananaprompts.xyz",
    image: "/community-images/cd3a2ffff62b2ab8.png"
  },
  {
    id: 37,
    title: "Piercing Gaze - Female Version",
    prompt: "Create a bold, dramatic GQ-style editorial portrait with intense, directional lighting that creates striking shadows and highlights, emphasizing strong facial contours and cheekbones. The subject wears a sharply tailored, fashion-forward business casual outfit. Use a minimalist, high-contrast background with moody, dark gradients or shadows to create a powerful visual impact. The expression should be confident and slightly fierce, with a piercing gaze that commands attention and conveys authority.",
    category: "Editorial",
    likes: 398,
    author: "bananaprompts.xyz",
    image: "/community-images/54a4be32307d5e70.png"
  },
  {
    id: 38,
    title: "Windswept Soul",
    prompt: "A cinematic and intimate portrait with an analog film aesthetic, capturing a female figure inside a car. The subject is looking out the open window, her arm resting on the door and her face partially framed by the car's frame, creating a sense of depth and a spontaneously captured moment. Her gaze is direct, intense, and melancholic toward the camera. Her hair is tousled and flowing, as if blown by the wind, with strands falling over her face, adding a sense of movement and rawness to the scene. She wears a dark, casual jacket.",
    category: "Cinematic",
    likes: 423,
    author: "bananaprompts.xyz",
    image: "/community-images/b62532d454dca0ff.jpeg"
  },
  {
    id: 39,
    title: "الإبداع و التطور",
    prompt: "A beautiful, confident woman wearing a black suit sits elegantly on a luxurious white chair that highlights her slim, graceful figure. Her right hand rests gently beneath her chin, with her chin slightly raised in a pose of self-assurance. Her head tilts subtly to the right, eyes steady and looking forward with confidence. Her facial features glow under high-quality cinematic lighting, enhancing her natural beauty. The background is pure white, featuring a rare art painting and soft, cinematic illumination.",
    category: "Elegant",
    likes: 367,
    author: "bananaprompts.xyz",
    image: "/community-images/cba7df26f8f20d27.jpeg"
  },
  {
    id: 43,
    title: "Omar Faruk Jafree - Female Version",
    prompt: "A hyper-realistic, cinematic low-angle portrait of a young woman standing confidently in the middle of a modern city street, surrounded by towering skyscrapers curving inward toward the sky. She wears a casual oversized gray t-shirt with bold lettering, camouflage cargo shorts, and carries a backpack. Black headphones rest around her neck, and she holds a water bottle in one hand. The lighting is natural and dramatic, with clear blue skies and scattered clouds above, emphasizing the sense of scale and urban energy.",
    category: "Urban",
    likes: 234,
    author: "bananaprompts.xyz",
    image: "/community-images/90505e9d7e9468c2.jpeg"
  },
  {
    id: 44,
    title: "Dark Studio - Female Version",
    prompt: "A cinematic portrait of a woman sitting confidently on a round black beanbag chair against a dark gradient background. She wears a black hoodie with the sleeves slightly pushed up, black cargo pants, and clean white sneakers. A silver wristwatch is visible on her left wrist. Her pose is relaxed and strong: elbows resting on her knees, hands hanging loosely between her legs. She has a calm, slight smiling facial expression. The lighting is dramatic and directional, illuminating her face, sneakers, and upper body while the background fades into darkness.",
    category: "Studio",
    likes: 298,
    author: "bananaprompts.xyz",
    image: "/community-images/1f9883c43f0ae85f.png"
  },
  {
    id: 45,
    title: "Fora do Carro por do sol - Female Version",
    prompt: "Retrato Feminino Elegante ao Pôr do Sol com Carro de Luxo. Retrato feminino realista, estilo editorial de luxo, mostrando uma mulher elegante (cabelo bem penteado, expressão confiante e madura) encostada em um carro esportivo preto brilhante durante o pôr do sol. Ela veste um terno azul-marinho bem ajustado, camisa branca e gravata bordô. Usa sapatos de couro marrom e relógio elegante no pulso. A cena se passa em um ambiente urbano sofisticado, próximo a um parapeito de pedra com vista panorâmica.",
    category: "Luxury",
    likes: 456,
    author: "bananaprompts.xyz",
    image: "/community-images/0807f63c617e0a0a.png"
  },
  {
    id: 47,
    title: "Greenary - Female Version",
    prompt: "A young woman with a slight smile, wearing outfit: oversized white sweatshirt, lemon green oversized combat jean, styled with footwear: lemon green neutral Nike sneakers and white ribbed socks. Environment: futuristic lemon green-tone studio background. Lighting: soft cinematic glow highlighting skin and fabric textures. Style: fashion editorial x futuristic. Model seats on lemon green bench elegantly with a relaxed posture.",
    category: "Fashion",
    likes: 267,
    author: "bananaprompts.xyz",
    image: "/community-images/fa05d8c6430a93b7.png"
  },
  {
    id: 48,
    title: "CINEMATIC POTRET - Female Version",
    prompt: "A beautiful Asian woman with a relaxed street-style vibe, sitting in a beauty salon chair with both legs casually resting on the table. She is wearing an oversized white t-shirt, ripped light blue jeans, brown sunglasses, a silver chain necklace, a watch on her wrist, and white high-top sneakers. Her hair is styled simply in a neutral tone that complements her outfit. She leans back in a confident yet relaxed pose — one hand lightly touching her face, while the other rests on the armrest of the chair.",
    category: "Street",
    likes: 389,
    author: "bananaprompts.xyz",
    image: "/community-images/ffbbd4967118e5cc.png"
  },
  {
    id: 49,
    title: "A hyper-realistic portrait - Female Version",
    prompt: "A hyper-realistic portrait of a young woman inside a giant Instagram post frame that dominates the scene. Her face remains sharp and untouched, wearing dark sunglasses and sleek shoes, exuding bold charisma. Her relaxed pose shows her right elbow resting on her knee, left arm casual, and one leg stepping out of the Instagram frame in a 3D illusion. The Instagram frame is highly realistic with username, verified checkmark, display name, caption, and authentic icons.",
    category: "Creative",
    likes: 445,
    author: "bananaprompts.xyz",
    image: "/community-images/68d33aab2a852dd4.jpeg"
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