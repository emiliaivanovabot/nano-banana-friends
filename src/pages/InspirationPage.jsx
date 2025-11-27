import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { supabase } from '../lib/supabase';
import './InspirationPage.css';

const InspirationPage = () => {
  const { user } = useAuth();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const loadCommunityImages = async () => {
    try {
      setLoading(true);
      
      console.log('🎨 Loading community inspiration gallery...');
      
      // Get quality images from all users (excluding current user)
      const { data, error } = await supabase
        .from('generations')
        .select('id, username, prompt, result_image_url, created_at, generation_type, original_filename, aspect_ratio')
        .neq('username', user?.username || '') // Exclude current user
        .eq('status', 'completed')
        .not('result_image_url', 'is', null) 
        .not('username', 'is', null) 
        .order('created_at', { ascending: false })
        .limit(500); // Viel mehr Bilder für die volle Galerie-Power!

      if (error) {
        console.error('Error loading community images:', error);
        return;
      }

      // Filter for quality images - entspannter für mehr Auswahl
      const qualityImages = data?.filter(img => 
        img.result_image_url && 
        img.prompt && 
        img.prompt.length > 5 && // Noch entspannter - 5+ Zeichen
        img.username && 
        !img.prompt.toLowerCase().includes('test') && 
        !img.prompt.toLowerCase().includes('debug')
      ) || [];

      // Image Validation - prüfe ob Bilder wirklich ladbar sind
      const validateImage = (url) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
          img.src = url;
          // Timeout nach 3 Sekunden
          setTimeout(() => resolve(false), 3000);
        });
      };

      // Validiere alle Bilder parallel
      console.log('🔍 Validiere Bilder von', qualityImages.length, 'Kandidaten...');
      const imageValidationPromises = qualityImages.map(async (img) => {
        const isValid = await validateImage(img.result_image_url);
        return { ...img, isValid };
      });

      const validatedImages = await Promise.all(imageValidationPromises);
      const validImages = validatedImages.filter(img => img.isValid);
      
      console.log('✅ Gültige Bilder:', validImages.length, 'von', qualityImages.length);
      console.log('❌ Defekte Bilder gefiltert:', qualityImages.length - validImages.length);
      
      // DEBUG: Aspect Ratios analysieren
      const aspectRatios = validImages.map(img => img.aspect_ratio).filter(Boolean);
      const ratioCount = {};
      const gridSizeCount = {};
      
      aspectRatios.forEach(ratio => {
        ratioCount[ratio] = (ratioCount[ratio] || 0) + 1;
      });
      
      // Test grid size assignment mit FORCE VARIETY für mehr Abwechslung!
      validImages.forEach((img, index) => {
        // Jedes 3. Bild bekommt Forced Variety für mehr Mix
        const shouldForceVariety = index % 3 === 0;
        const gridSize = getGridSizeClass(img.aspect_ratio, shouldForceVariety);
        gridSizeCount[gridSize] = (gridSizeCount[gridSize] || 0) + 1;
        
        // Log individual assignments for debugging
        if (img.aspect_ratio) {
          const [w, h] = img.aspect_ratio.split(':').map(Number);
          const ratio = w / h;
          const forced = shouldForceVariety ? ' [FORCED]' : '';
          console.log(`📐 ${img.aspect_ratio} (${ratio.toFixed(2)}) → ${gridSize}${forced}`);
        }
      });
      
      console.log('📊 Aspect Ratios in Community:', ratioCount);
      console.log('🔲 Grid Size Distribution:', gridSizeCount);

      // Group by user and take variety from each
      const imagesByUser = {};
      validImages.forEach(img => {
        if (!imagesByUser[img.username]) {
          imagesByUser[img.username] = [];
        }
        imagesByUser[img.username].push(img);
      });

      // Take up to 20 images per user für maximale Vielfalt!
      const fairSelection = [];
      Object.keys(imagesByUser).forEach(username => {
        const userImages = imagesByUser[username];
        const shuffledUserImages = userImages.sort(() => Math.random() - 0.5);
        fairSelection.push(...shuffledUserImages.slice(0, 20)); // 20 statt 8!
      });

      // Final shuffle for Puzzle-Grid display
      const shuffledImages = fairSelection.sort(() => Math.random() - 0.5);

      console.log('🎨 Community Gallery:', Object.keys(imagesByUser).map(user => 
        `${user}: ${imagesByUser[user].length} total`
      ).join(', '));
      console.log('📊 Showing', shuffledImages.length, 'images from', 
        new Set(shuffledImages.map(img => img.username)).size, 'users');

      setImages(shuffledImages);
    } catch (error) {
      console.error('Error loading community images:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCommunityImages();
  }, [user?.username]);

  const handleImageClick = (image) => {
    setSelectedImage(image);
  };

  const closeModal = () => {
    setSelectedImage(null);
    setIsFullscreen(false);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const copyPrompt = (prompt) => {
    navigator.clipboard.writeText(prompt).then(() => {
      console.log('✅ Prompt copied to clipboard');
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }).catch(err => {
      console.error('❌ Failed to copy prompt:', err);
    });
  };

  const openImage = (imageUrl) => {
    window.open(imageUrl, '_blank');
  };

  const getUserDisplayName = (username) => {
    if (!username) return 'Community';
    return username;
  };

  const getGridSizeClass = (aspectRatio, forceVariety = false) => {
    if (!aspectRatio) return 'size-1x1'; // Default square
    
    const [width, height] = aspectRatio.split(':').map(Number);
    if (!width || !height) return 'size-1x1';
    
    const ratio = width / height;
    
    // FORCED VARIETY MODE: Erstelle künstlich mehr Vielfalt!
    if (forceVariety) {
      const random = Math.random();
      if (random < 0.3) return 'size-1x2'; // 30% Portrait
      if (random < 0.5) return 'size-2x1'; // 20% Landscape  
      return 'size-1x1'; // 50% Square
    }
    
    // Original Logic - aber viel aggressiver
    if (aspectRatio === '9:16') {
      return 'size-1x2'; // Portrait MUSS Portrait bleiben
    } else if (aspectRatio === '16:9') {
      return 'size-2x1'; // Landscape MUSS Landscape bleiben
    } else if (aspectRatio === '1:1') {
      return 'size-1x1'; // Square MUSS Square bleiben
    } else if (ratio >= 1.6) {
      return 'size-2x1'; // Breit
    } else if (ratio <= 0.6) {
      return 'size-1x2'; // Hoch
    } else {
      return 'size-1x1'; // Neutral
    }
  };

  const optimizeGridLayout = (imagesWithSizes) => {
    // Mische erstmal für Zufälligkeit
    const shuffled = [...imagesWithSizes].sort(() => Math.random() - 0.5);
    
    // Gelegentlich ein 2x2 "Featured" Bild für Extra-Impact (nur Desktop)
    if (shuffled.length > 12 && window.innerWidth > 768) {
      // Jedes 8-10te Bild wird zu einem großen 2x2 Feature
      const featureIndices = [0, 9, 18, 27];
      featureIndices.forEach(index => {
        if (shuffled[index] && Math.random() > 0.5) {
          shuffled[index].gridSize = 'size-2x2';
        }
      });
    }

    // Für bessere Verteilung: Sortiere so, dass nicht alle großen Bilder am Anfang sind
    const balanced = [];
    const large = shuffled.filter(img => img.gridSize === 'size-2x2' || img.gridSize === 'size-2x1');
    const medium = shuffled.filter(img => img.gridSize === 'size-1x2');
    const small = shuffled.filter(img => img.gridSize === 'size-1x1');
    
    // Interleave für natürlicheres Layout
    const maxLength = Math.max(large.length, medium.length, small.length);
    for (let i = 0; i < maxLength; i++) {
      if (small[i]) balanced.push(small[i]);
      if (medium[i]) balanced.push(medium[i]);
      if (large[i]) balanced.push(large[i]);
    }

    return balanced;
  };

  const handleModalClick = (e) => {
    if (e.target.className === 'image-modal') {
      closeModal();
    }
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };

    if (selectedImage) {
      document.addEventListener('keydown', handleKeyPress);
      document.body.style.overflow = 'hidden';
    } else {
      document.removeEventListener('keydown', handleKeyPress);
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      document.body.style.overflow = 'unset';
    };
  }, [selectedImage]);

  return (
    <>
      <div className="inspiration-page">
        <div className="inspiration-header">
          <div className="header-content">
            <Link to="/nono-banana" className="back-link">
              ← Zurück zu Nono Banana
            </Link>
            <div className="title-section">
              <h1>Community Inspiration</h1>
              <p className="subtitle">Entdecke kreative Kunstwerke von der Community</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Lade Community-Kunstwerke...</p>
          </div>
        ) : images.length === 0 ? (
          <div className="no-images-container">
            <p>Keine Community-Bilder verfügbar.</p>
          </div>
        ) : (
          <div className="masonry-gallery">
            {(() => {
              // Berechne Grid-Größen für jedes Bild mit FORCED VARIETY
              const imagesWithSizes = images.map((img, index) => {
                // Jedes 3. Bild bekommt Forced Variety für mehr Mix
                const shouldForceVariety = index % 3 === 0;
                return {
                  ...img,
                  gridSize: getGridSizeClass(img.aspect_ratio, shouldForceVariety)
                };
              });
              
              // Optimiere Layout für Tetris-Effect
              const optimizedImages = optimizeGridLayout(imagesWithSizes);
              
              return optimizedImages.map((img) => (
                <div 
                  key={img.id} 
                  className={`masonry-item ${img.gridSize}`}
                  data-aspect-ratio={img.aspect_ratio}
                  data-grid-size={img.gridSize}
                >
                  <img
                    src={img.result_image_url}
                    className="masonry-image"
                    onClick={() => handleImageClick(img)}
                    loading="lazy"
                    alt={`Inspiration by ${getUserDisplayName(img.username)}`}
                  />
                  <div className="image-overlay">
                    <div className="image-info">
                      <span className="username">{getUserDisplayName(img.username)}</span>
                      <span className="date">{new Date(img.created_at).toLocaleDateString('de-DE')}</span>
                    </div>
                  </div>
                </div>
              ));
            })()}
          </div>
        )}
      </div>

      {/* Modal für großes Bild */}
      {selectedImage && (
        <div className="image-modal" onClick={handleModalClick}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>Community Inspiration</h4>
              <button 
                className="close-button"
                onClick={closeModal}
                aria-label="Schließen"
              >
                ✖
              </button>
            </div>
            
            <img 
              src={selectedImage.result_image_url} 
              alt="Community Inspiration"
              className={isFullscreen ? "modal-image fullscreen-image" : "modal-image"}
              onClick={toggleFullscreen}
              style={{ cursor: 'pointer' }}
            />
            
            <div className="modal-info">
              <p className="modal-date">
                {getUserDisplayName(selectedImage.username)} • {new Date(selectedImage.created_at).toLocaleString('de-DE')}
              </p>
              {selectedImage.prompt && (
                <p className="modal-prompt">
                  <strong>Prompt:</strong> {selectedImage.prompt}
                </p>
              )}
            </div>
            
            <div className="modal-actions">
              <div className="action-buttons-row">
                <button 
                  className="download-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openImage(selectedImage.result_image_url);
                  }}
                >
                  Im neuen Tab öffnen
                </button>
                {selectedImage.prompt && (
                  <button 
                    className="copy-prompt-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyPrompt(selectedImage.prompt);
                    }}
                  >
                    {copySuccess ? '✅ Copied!' : '💡 Prompt kopieren'}
                  </button>
                )}
              </div>
              <button 
                className="close-modal-button"
                onClick={closeModal}
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InspirationPage;