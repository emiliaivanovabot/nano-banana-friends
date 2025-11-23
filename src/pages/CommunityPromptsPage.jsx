import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

// COMPLETE REAL Community Prompts Data from bananaprompts.xyz database - NO SHORTCUTS!
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
    prompt: "A cinematic urban portrait of me, keeping my real face unchanged. I am sitting casually on outdoor stone steps in front of a building entrance, leaning slightly forward with a confident and contemplative posture. My left elbow rests on my knee, with my hand raised to my temple in a thoughtful gesture, while my right arm hangs more loosely, with my hand extended downward in a relaxed position. My legs are bent naturally, spreading apart for a grounded and strong presence. My gaze is directed toward the camera, steady and intense, with a calm yet powerful expression. I am wearing a black outfit: a fitted turtleneck sweater layered under a black coat with a wide collar and subtle texture. The coat has a tailored yet modern look, with a slightly matte fabric that absorbs the light, creating depth. My trousers are also black, slim-fitted, completing the clean, monochromatic style. No visible accessories, emphasizing minimalism and sophistication. The background shows part of an urban building with glass doors and warm interior lights softly glowing, adding contrast to the darker tones of my outfit. The lighting is warm and diffused, highlighting my face and upper body while creating soft shadows that add cinematic depth. The camera captures me slightly from below (low angle), emphasizing strength and presence, framed from the knees up. The focal length resembles a portrait lens around 50-85mm, producing natural proportions with a shallow depth of field that keeps me sharp against the softly blurred background. Style: cinematic, moody urban portrait, editorial fashion photography, minimalistic monochrome outfit, professional model vibe.",
    category: "Urban",
    likes: 387,
    author: "bananaprompts.xyz",
    image: "/community-images/629f21c3209ebc2a.jpeg"
  },
  {
    id: 18,
    title: "Mulher Elegante",
    prompt: "Recrie essa cena usando minha foto enviada como referência, mantendo o mesmo enquadramento, pose, iluminação e estilo da imagem de exemplo. A composição deve mostrar um retrato feminino de meio corpo, com a modelo sentada e levemente inclinada para a frente. O braço direito deve cruzar o corpo, com a mão esquerda apoiada suavemente no braço oposto, transmitindo elegância e confiança. A expressão facial deve ser serena, confiante e levemente enigmática. O olhar deve estar direcionado à câmera, com os lábios suavemente fechados e postura firme. A roupa é composta por um conjunto escuro e sofisticado — blazer preto estruturado, usado sobre uma blusa preta justa. O cabelo deve estar solto, liso e bem alinhado, caindo sobre um dos ombros de forma natural. A iluminação deve ser de estúdio, com luz direcional suave e contrastada (estilo Rembrandt ou luz lateral), destacando o contorno do rosto, criando sombras elegantes e um degradê sutil no fundo. O fundo deve ser liso e neutro, em tons de cinza escuro, com profundidade leve e sem elementos de distração. O estilo final deve ser preto e branco, com contraste refinado, textura suave da pele e aparência realista de retrato editorial. Formato vertical (1080x1920), proporção retrato, qualidade fotográfica de estúdio profissional, acabamento cinematográfico e realista.",
    category: "Fashion",
    likes: 342,
    author: "bananaprompts.xyz",
    image: "/community-images/029f12d8df51a5fe.png"
  },
  {
    id: 21,
    title: "Untamed Spirit",
    prompt: "Please use my uploaded reference image to capture and apply all of my facial features, facial structure, eye color, skin tone, hair style, and color with maximum fidelity. The goal is to create a version of me in this cinematic portrait. A cinematic, mid-length portrait, capturing a female figure with a strong and elegant presence, standing next to a horse. The subject faces the camera, with a direct and confident gaze. One hand gently holds the horse's halter or head, conveying a calm and powerful connection with the animal. She wears a long-sleeved shirt in a neutral tone (beige, khaki, or light gray), with the top buttons undone to create a V-neckline. The bottoms are earthy-colored pants (brown or khaki), complemented by a brown leather belt with a large, prominent gold buckle (possibly with the letter 'V'). A gold chain hangs from the belt loops, adding a touch of glamour. The look is adorned with multiple bracelets on both wrists, combining metals and natural materials. Her hair is long, with voluminous waves and a natural look, as if gently blown by the wind, framing her face. The makeup is natural yet defined, enhancing the beauty of her features. Beside her, a brown horse with a white marking on its face looks forward, in harmony with the figure. The background is an open field, such as a prairie or a valley, with a cloudy sky and the landscape in the background gently blurred, creating a sense of vastness. The lighting is natural and diffuse, typical of an overcast day, resulting in soft shadows and light that flatters the face and body. Camera Settings: Captured with a prime portrait lens (e.g., 85mm f/1.8 or 105mm f/1.4) on a full-frame camera for optimal compression and creamy bokeh. Aperture set between f/2.0 and f/2.8 to perfectly isolate the subject and horse from the background. ISO 100-200 for maximum image quality with abundant natural light. Shutter speeds of 1/400s to 1/800s ensure absolute sharpness and freeze any subtle movement of the hair or horse. The lighting is exclusively natural, taking advantage of the soft light of an overcast sky.",
    category: "Lifestyle",
    likes: 298,
    author: "bananaprompts.xyz",
    image: "/community-images/969a0a4e22d6a62f.jpeg"
  },
  {
    id: 22,
    title: "Monochromatic minimal elegant",
    prompt: "Recreate this scene using my submitted photo as a reference, maintaining the same framing, pose, lighting, and style as the example image. The composition should show a half-length female portrait, with the model sitting and leaning slightly forward. The right arm should cross the body, with the left hand resting gently on the opposite arm, conveying elegance and confidence. The facial expression should be serene, confident, and slightly enigmatic. The gaze should be directed toward the camera, with lips softly closed and a firm posture. The outfit consists of a dark, sophisticated ensemble—a structured black blazer worn over a fitted black shirt. The hair should be neatly groomed and styled appropriately for a woman. The lighting should be studio-style, with soft, contrasting directional light (Rembrandt-style or sidelight), highlighting the contours of the face, creating elegant shadows and a subtle gradient in the background. The background should be smooth and neutral, in dark gray tones, with slight depth and no distracting elements. The final style should be black and white, with refined contrast, smooth skin texture, and a realistic editorial portrait look. Vertical format (1080x1920), portrait aspect ratio, professional studio photo quality, and a cinematic, realistic finish.",
    category: "Portrait",
    likes: 287,
    author: "bananaprompts.xyz",
    image: "/community-images/0e894b71d783bdd8.jpeg"
  },
  {
    id: 24,
    title: "Vintage Car Pro",
    prompt: "Use my uploaded photo as reference to maintain my facial features. Create a hyper-realistic portrait of a woman sitting in the driver's seat of a car, wearing a black shirt, combined with a faded light gray jacket and light gray wide-leg pants. White shoes should be visible, complementing the casual look. Round sunglasses with dark lenses should be positioned on the nose, highlighting a confident and slightly ironic facial expression. Relaxed posture: one arm on the sports steering wheel, the other supporting the head, conveying a relaxed look. The interior of the car should include side windows showing urban scenery (trees, buildings and part of another vehicle), and a black textured seat. Soft natural lighting, simulating daylight coming through the windows, creating a contrast between the warm colors of the clothing and the neutral environment of the car. Vintage style, with desaturated tones and slightly grainy textures, evoking a nostalgic atmosphere. Dominant tones of gray, white and black, with a balance between external light and internal shadows. Slightly elevated perspective, framing that includes the top of the knees to the head, with the steering wheel partially visible on the right.",
    category: "Automotive",
    likes: 234,
    author: "bananaprompts.xyz",
    image: "/community-images/b64df61d6d42f589.jpeg"
  },
  {
    id: 26,
    title: "Classroom effect",
    prompt: "Use my uploaded photo as reference to maintain my facial features. Edit this image of a young woman into a high-contrast black and white portrait in a quiet classroom. She leans casually on a wooden school chair, legs crossed, wearing a navy blue sweatshirt, beige chinos, and black-and-white Converse sneakers. Calm neutral expression. Her left arm rests on the desk, her right hand drops casually to the side. Behind her, an off-white classroom wall with visible wear, pinned papers, photos, and sticky notes in a grid. One page clearly shows the printed word 'Silence', positioned above her head. Sunlight enters sharply from the right, casting a triangular beam of light on the wall and her shadow. The contrast is dramatic, cinematic, and natural, with a warm late-afternoon tone. The overall style feels candid and realistic, similar to a film photograph: slightly grainy, soft vintage texture, natural imperfections.",
    category: "Lifestyle",
    likes: 189,
    author: "bananaprompts.xyz",
    image: "/community-images/6e1165aa2d5e0e02.jpeg"
  },
  {
    id: 27,
    title: "Low-key portrait photography",
    prompt: "Use my uploaded photo to maintain my facial features, eye color, and hair style. Professional studio portrait of a woman, confident and determined expression, head slightly tilted down, wearing a black V-neck t-shirt. Using a low-key photography setup with butterfly lighting (key light from front above), a hair rim light from behind, and a faint background light. The atmosphere is filled with a subtle haze or smoke. Shot on a medium format camera, high contrast, cinematic, sharp focus, soft shadows. The atmosphere has a subtle haze. Hyper-realistic, shot on a 85mm lens, sharp focus on eyes, detailed facial features. --ar 4:5 --style raw",
    category: "Studio",
    likes: 267,
    author: "bananaprompts.xyz",
    image: "/community-images/356148c2f6b7bcbf.png"
  },
  {
    id: 29,
    title: "Empresária e seu Reflexo",
    prompt: "Use my uploaded photo to maintain my exact facial features, eye color, and hair. A cinematic close-up portrait of a stylish woman standing by a large glass window, gazing thoughtfully at her reflection. The woman wears a black turtleneck sweater layered under a fitted dark blazer, creating a sleek and elegant look. The lighting is soft and natural, coming from the window, gently illuminating one side of the face while casting subtle shadows on the other, emphasizing depth and texture. The background is softly blurred, highlighting the calm and introspective mood of the scene. The reflection in the glass adds a sense of duality and contemplation. The overall atmosphere is moody, sophisticated, and cinematic, with a color palette dominated by neutral tones and soft daylight.",
    category: "Business",
    likes: 223,
    author: "bananaprompts.xyz",
    image: "/community-images/9383bfc74dea4a38.png"
  },
  {
    id: 30,
    title: "A Woman with dramatic dual-colored lighting",
    prompt: "Use my uploaded photo to maintain my exact facial features - DO NOT CHANGE THE FACE. A woman with short dark hair is captured in a striking portrait, illuminated by dramatic dual-colored lighting. Her face is split, with one side bathed in a cool blue light and the other in a vibrant pink/red hue, creating a high-contrast and neon-like effect. She gazes directly at the viewer with a thoughtful or pensive expression, her left hand resting on her chin. She is wearing a dark t-shirt and a watch on her left wrist. The background is dark and indistinct, further emphasizing the colorful illumination on her face and upper body.",
    category: "Artistic",
    likes: 445,
    author: "bananaprompts.xyz",
    image: "/community-images/294e82757cade4e9.png"
  },
  {
    id: 31,
    title: "Elegante",
    prompt: "Recrie essa cena utilizando minha foto enviada como base, mantendo o mesmo enquadramento, pose, iluminação e atmosfera da imagem de referência. A composição deve mostrar uma mulher sentada sobre um banco alto de madeira com estrutura metálica preta, em um estúdio minimalista de fundo neutro em tons de cinza. O enquadramento deve capturar o corpo inteiro, com leve distância que realce a postura e o cenário limpo. A modelo deve estar com a perna direita dobrada e apoiada no degrau do banco, enquanto a esquerda toca o chão com elegância, calçando sapatos de salto preto com detalhes translúcidos. O figurino é totalmente preto e elegante: blazer estruturado sobre os ombros, calça de alfaiataria justa e blusa preta por baixo, transmitindo força, estilo e profissionalismo. O cabelo solto e alinhado deve cair suavemente sobre os ombros, e a expressão facial deve ser confiante, com o olhar direcionado levemente para o lado, transmitindo poder e serenidade. A iluminação deve ser de estúdio, com luz suave e direcional, criando contraste equilibrado entre sombras e áreas iluminadas, realçando a textura do tecido e o contorno do rosto. O fundo deve permanecer liso, com um degradê sutil em cinza, sem distrações, mantendo o foco totalmente na modelo. O estilo geral deve ser editorial corporativo moderno, com acabamento realista, aparência fotográfica profissional e composição elegante digna de revista. Formato vertical (1080x1920), proporção de retrato, qualidade fotográfica premium, tom sofisticado e iluminação cinematográfica.",
    category: "Studio",
    likes: 312,
    author: "bananaprompts.xyz",
    image: "/community-images/d80911c10b5532bb.png"
  },
  {
    id: 32,
    title: "Foto estilosa de mulher com jaqueta de couro azul água",
    prompt: "Crie uma imagem hiper-realista baseada na minha imagem de referência (use a foto enviada), preservando meus traços e aparência originais, mas recriando fielmente o estilo, roupa, pose, iluminação e cenário da imagem modelo. A personagem aparece em plano médio, voltada levemente para a direita, com o rosto inclinado e olhar firme em direção à câmera. A expressão é confiante e neutra, transmitindo presença e estilo. Ela veste uma jaqueta de couro turquesa, moderna e ajustada, com textura realista e brilho suave típico do couro tratado. O zíper e os botões metálicos devem refletir a luz com realismo e sutileza, mantendo o aspecto de fotografia de moda profissional. Nos olhos, óculos escuros espelhados azul-petróleo, com reflexos sutis do ambiente — realçando a estética urbana. O fundo é monocromático, em tom turquesa idêntico à jaqueta, criando um visual harmonioso e de alto contraste com a pele. Iluminação de estúdio profissional: Luz principal (key light) suave e frontal, vinda levemente da esquerda, com difusor grande (softbox 120 cm). Luz secundária de preenchimento (fill light) neutra do lado direito, reduzindo sombras e mantendo textura facial. Luz de recorte (rim light) sutil no ombro e cabelo, criando separação do fundo. Temperatura de cor balanceada (5500K) — luz branca natural de estúdio. Sombras limpas e controladas, mantendo foco no rosto e na jaqueta. Câmera e Lente: Sony A7R IV, lente 85mm f/1.8, ISO 100, obturador 1/160s, abertura f/2. Foco absoluto no rosto, fundo suavemente desfocado (bokeh leve). Color grading e estilo visual: Estilo Modern Editorial Cool Tone: Paleta dominada por tons turquesa, azul e pele quente neutra. Contraste alto e nitidez refinada, mas sem perder naturalidade. Cores vibrantes e limpas, sem granulação perceptível. Textura realista de pele e cabelo, com brilho controlado. Reflexos metálicos sutis no zíper e nos óculos. Tom visual: elegante, vibrante e urbano — como capa de revista ou campanha de moda contemporânea. Filtro: Cinematic Cool HDR, com cores saturadas e luz de estúdio limpa. Ambiente: fundo monocromático turquesa, estúdio moderno, luz balanceada.",
    category: "Fashion",
    likes: 278,
    author: "bananaprompts.xyz",
    image: "/community-images/a8f82051c811d65e.png"
  },
  {
    id: 36,
    title: "Engraving illustration portrait photo",
    prompt: "Generate a portrait of the woman from my uploaded photo from neck to head, and follow strictly the engraving illustration style of the reference. Put a lot more hatch lines on the face. The clothes don't have any details, only the outside lines.",
    category: "Artistic",
    likes: 156,
    author: "bananaprompts.xyz",
    image: "/community-images/cd3a2ffff62b2ab8.png"
  },
  {
    id: 37,
    title: "Piercing Gaze",
    prompt: "Create a bold, dramatic GQ-style editorial portrait with intense, directional lighting that creates striking shadows and highlights, emphasizing strong facial contours and cheekbones. Use my uploaded photo to maintain my exact facial features, facial structure, eye color, skin tone, hair style, and color. The subject wears a sharply tailored, fashion-forward business casual outfit. Use a minimalist, high-contrast background with moody, dark gradients or shadows to create a powerful visual impact. The expression should be confident and slightly fierce, with a piercing gaze that commands attention and conveys authority. Incorporate artistic shadow play and high-definition details to evoke a cinematic, magazine cover effect. The overall image should feel modern and edgy, pushing the boundaries of traditional corporate portraits with a polished, avant-garde finish and vibrant but moody color grading.",
    category: "Editorial",
    likes: 398,
    author: "bananaprompts.xyz",
    image: "/community-images/54a4be32307d5e70.png"
  },
  {
    id: 38,
    title: "Windswept Soul",
    prompt: "Please use my uploaded reference image to capture and apply all of my facial features, facial structure, eye color, skin tone, style, and hair color with maximum fidelity. The goal is to create a version of me in this cinematic portrait. A cinematic and intimate portrait with an analog film aesthetic, capturing a female figure inside a car. The subject is looking out the open window, her arm resting on the door and her face partially framed by the car's frame, creating a sense of depth and a spontaneously captured moment. Her gaze is direct, intense, and melancholic toward the camera. Her hair is tousled and flowing, as if blown by the wind, with strands falling over her face, adding a sense of movement and rawness to the scene. She wears a dark, casual jacket (jeans or sweatshirt). The background is a blurred, desolate landscape, suggesting a road on a cloudy day or at dusk. The car's rearview mirror is visible, adding to the travel context. The color palette is desaturated, with cool, earthy tones, and the image has visible film grain, contributing to the nostalgic and introspective atmosphere. The lighting is natural, soft, and diffuse, typical of an overcast day, shaping the face with delicate shadows. Camera Settings: Captured with a 50mm or 85mm prime lens on a full-frame camera for an intimate and natural perspective. Aperture set between f/1.8 and f/2.8 to create a very shallow depth of field, keeping the eye in sharp focus and gently blurring the foreground and background. ISO 400-800 to capture the scene in low light and highlight the natural film grain. Post-production editing to achieve the analog film look, with desaturated colors and cool tones.",
    category: "Cinematic",
    likes: 423,
    author: "bananaprompts.xyz",
    image: "/community-images/b62532d454dca0ff.jpeg"
  },
  {
    id: 39,
    title: "الإبداع و التطور",
    prompt: "Use my uploaded photo to maintain my exact facial features and appearance. A beautiful, confident woman wearing a black suit sits elegantly on a luxurious white chair that highlights her slim, graceful figure. Her right hand rests gently beneath her chin, with her chin slightly raised in a pose of self-assurance. Her head tilts subtly to the right, eyes steady and looking forward with confidence. Her facial features glow under high-quality cinematic lighting, enhancing her natural beauty. The background is pure white, featuring a rare art painting and soft, cinematic illumination. Beside the chair stands a unique white table topped with a black coffee cup and a stylish lamp decor, creating a refined and elegant atmosphere.",
    category: "Elegant",
    likes: 367,
    author: "bananaprompts.xyz",
    image: "/community-images/cba7df26f8f20d27.jpeg"
  },
  {
    id: 43,
    title: "Urban Street Portrait",
    prompt: "Use my uploaded photo to maintain my exact facial features, eye color, skin tone, and hair style. A hyper-realistic, cinematic low-angle portrait of a young woman standing confidently in the middle of a modern city street, surrounded by towering skyscrapers curving inward toward the sky. She wears a casual oversized gray t-shirt with bold lettering, camouflage cargo shorts, and carries a backpack. Black headphones rest around her neck, and she holds a water bottle in one hand. The lighting is natural and dramatic, with clear blue skies and scattered clouds above, emphasizing the sense of scale and urban energy. The composition creates a powerful, larger-than-life perspective, making the subject appear heroic and adventurous with ultra-detailed textures in clothing, skin, and architecture.",
    category: "Urban",
    likes: 234,
    author: "bananaprompts.xyz",
    image: "/community-images/90505e9d7e9468c2.jpeg"
  },
  {
    id: 44,
    title: "Dark Studio",
    prompt: "Use my uploaded photo as reference for my facial features. A cinematic portrait of a woman sitting confidently on a round black beanbag chair against a dark gradient background. She wears a black hoodie with the sleeves slightly pushed up, black cargo pants, and clean white sneakers. A silver wristwatch is visible on her left wrist. Her pose is relaxed and strong: elbows resting on her knees, hands hanging loosely between her legs. She has a calm, slight smiling facial expression. The lighting is dramatic and directional, illuminating her face, sneakers, and upper body while the background fades into darkness. The atmosphere is modern, minimalist, and powerful, with a studio photography style and high contrast.",
    category: "Studio",
    likes: 298,
    author: "bananaprompts.xyz",
    image: "/community-images/1f9883c43f0ae85f.png"
  },
  {
    id: 45,
    title: "Fora do Carro por do sol",
    prompt: "Use minha foto de referência principal para manter exatamente meus traços faciais, cor dos olhos, tom de pele e estilo de cabelo. Retrato Feminino Elegante ao Pôr do Sol com Carro de Luxo. Retrato feminino realista, estilo editorial de luxo, mostrando a mesma mulher da referência principal encostada em um carro esportivo preto brilhante durante o pôr do sol. Ela veste um terno azul-marinho bem ajustado, camisa branca e gravata bordô. Usa sapatos de couro marrom e relógio elegante no pulso. A cena se passa em um ambiente urbano sofisticado, próximo a um parapeito de pedra com vista panorâmica e montanhas ao fundo. O pôr do sol ilumina o céu com tons dourados, alaranjados e rosados, refletindo suavemente na lataria do carro. O enquadramento é em plano médio, mostrando a mulher inteira encostada casualmente no carro, com uma perna cruzada e uma postura confiante. O foco está na harmonia entre o luxo, o bom gosto e a iluminação cinematográfica dourada. Alta definição, textura realista da pele, tecidos e reflexos do carro. Estilo fotográfico contemporâneo, luz natural dourada, atmosfera elegante e sofisticada.",
    category: "Luxury",
    likes: 456,
    author: "bananaprompts.xyz",
    image: "/community-images/0807f63c617e0a0a.png"
  },
  {
    id: 47,
    title: "Greenary",
    prompt: "Use my uploaded photo to maintain my exact facial features and facial structure. A young woman with a slight smile, wearing outfit: oversized white sweatshirt, lemon green oversized combat jean, styled with footwear: lemon green neutral Nike sneakers and white ribbed socks. Environment: futuristic lemon green-tone studio background. Lighting: soft cinematic glow highlighting skin and fabric textures. Style: fashion editorial x futuristic. Model seats on lemon green bench elegantly with a relaxed posture.",
    category: "Fashion",
    likes: 267,
    author: "bananaprompts.xyz",
    image: "/community-images/fa05d8c6430a93b7.png"
  },
  {
    id: 48,
    title: "CINEMATIC POTRET",
    prompt: "Use my uploaded reference photo to maintain my identical facial features. A beautiful Asian woman (identical to the reference photo, maintaining the original facial features) with a relaxed street-style vibe, sitting in a beauty salon chair with both legs casually resting on the table. She is wearing an oversized white t-shirt, ripped light blue jeans, brown sunglasses, a silver chain necklace, a watch on her wrist, and white high-top sneakers. Her hair is styled simply in a neutral tone that complements her outfit. She leans back in a confident yet relaxed pose — one hand lightly touching her face, while the other rests on the armrest of the chair. Style: Photorealistic, urban street style aesthetic. Lighting: Natural indoor lighting with soft shadows and slightly warm tones, enhancing the relaxed atmosphere. Composition: Medium shot, subject centered in a salon environment with mirrors, scattered beauty tools, and raw urban details. Details: Realistic fabric textures, fine hair strand detailing, reflective sunglasses, metallic shine on the silver chain, details on the watch, worn textures on the sneakers, and subtle skin shine. A confident expression with an effortless mood in a stylish urban setting. Quality: High detail, 8K, masterpiece, cinematic photography.",
    category: "Street",
    likes: 389,
    author: "bananaprompts.xyz",
    image: "/community-images/ffbbd4967118e5cc.png"
  },
  {
    id: 49,
    title: "A hyper-realistic portrait",
    prompt: "Use my uploaded photo to maintain my exact facial features - face remains sharp and untouched. A hyper-realistic portrait of the uploaded young woman inside a giant Instagram post frame that dominates the scene. Her face remains sharp and untouched, wearing dark sunglasses and sleek shoes, exuding bold charisma. Her relaxed pose shows her right elbow resting on her knee, left arm casual, and one leg stepping out of the Instagram frame in a 3D illusion. The Instagram frame is highly realistic with username GoogleGeminiPrompts, verified checkmark, display name 'AI Generation', caption: 'Too real to stay inside frame #AICreation #GoogleGeminiPrompts', and authentic icons. The background is designed for feminine boldness: deep cobalt blue blending into cyan, with subtle light streaks adding energy. Clean, cinematic lighting highlights her clothing textures and the 3D illusion, making her the viral centerpiece.",
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