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

      // Echte Bilddimensionen analysieren für intelligente Darstellung
      console.log('🔍 Analysiere Bilddimensionen von', qualityImages.length, 'Kandidaten...');
      const imageAnalysisPromises = qualityImages.map(async (img) => {
        try {
          const dimensions = await analyzeImageDimensions(img.result_image_url);
          return { 
            ...img, 
            dimensions,
            isValid: true
          };
        } catch (error) {
          console.warn('❌ Fehler bei Bildanalyse:', img.result_image_url);
          return { ...img, isValid: false };
        }
      });

      const analyzedImages = await Promise.all(imageAnalysisPromises);
      const validImages = analyzedImages.filter(img => img.isValid);
      
      console.log('✅ Gültige Bilder:', validImages.length, 'von', qualityImages.length);
      console.log('❌ Defekte Bilder gefiltert:', qualityImages.length - validImages.length);
      
      // DEBUG: Aspect Ratios analysieren
      const aspectRatios = validImages.map(img => img.aspect_ratio).filter(Boolean);
      const ratioCount = {};
      const gridSizeCount = {};
      
      aspectRatios.forEach(ratio => {
        ratioCount[ratio] = (ratioCount[ratio] || 0) + 1;
      });
      
      // Debug echte Bilddimensionen
      const classificationCount = {};
      validImages.forEach((img) => {
        if (img.dimensions) {
          const { width, height, ratio, classification } = img.dimensions;
          classificationCount[classification] = (classificationCount[classification] || 0) + 1;
          console.log(`📐 ${width}x${height} (ratio: ${ratio.toFixed(2)}) → ${classification}`);
        }
      });
      
      console.log('📊 Aspect Ratios in Community:', ratioCount);
      console.log('🖼️ Image Classifications:', classificationCount);

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

  const analyzeImageDimensions = (imageUrl) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const ratio = img.naturalWidth / img.naturalHeight;
        let classification;
        
        if (ratio >= 1.5) {
          classification = 'landscape'; // Breit
        } else if (ratio <= 0.67) {
          classification = 'portrait'; // Hoch
        } else {
          classification = 'square'; // Quadratisch
        }
        
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
          ratio: ratio,
          classification: classification
        });
      };
      img.onerror = () => {
        resolve({ 
          width: 512, 
          height: 512, 
          ratio: 1, 
          classification: 'square' 
        }); // Fallback
      };
      img.src = imageUrl;
    });
  };

  // Entfernt - verwenden jetzt echte Bilddimensionen statt starres Grid-Layout

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
              // Verwende echte Bilddimensionen für intelligentes Tetris-Layout
              const imagesWithDimensions = images.filter(img => img.dimensions);
              
              console.log('🎨 Tetris Layout:', imagesWithDimensions.length, 'images');
              
              return imagesWithDimensions.map((img, index) => {
                const { width, height, ratio, classification } = img.dimensions;
                
                // Intelligente Grid-Zuordnung für Tetris-Layout
                let sizeClass = classification;
                
                // Gelegentlich große Versionen für visuellen Impact
                if (index % 7 === 0 && classification === 'portrait') {
                  sizeClass += ' large'; // 1:3 Portrait (3 Reihen hoch)
                } else if (index % 9 === 0 && classification === 'landscape') {
                  sizeClass += ' large'; // Großes Landscape (4 Spalten breit)
                }
                
                console.log(`🧩 Tetris Piece ${index}: ${classification} → ${sizeClass}`);
                
                return (
                  <div 
                    key={img.id} 
                    className={`masonry-item ${sizeClass}`}
                    data-classification={classification}
                    data-ratio={ratio.toFixed(2)}
                    data-index={index}
                  >
                    <img
                      src={img.result_image_url}
                      className="masonry-image"
                      onClick={() => handleImageClick(img)}
                      loading="lazy"
                      alt={`Inspiration by ${getUserDisplayName(img.username)} - ${classification}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center'
                      }}
                    />
                    <div className="image-overlay">
                      <div className="image-info">
                        <span className="username">{getUserDisplayName(img.username)}</span>
                        <span className="date">{new Date(img.created_at).toLocaleDateString('de-DE')}</span>
                        <span className="dimensions">{width}×{height}</span>
                      </div>
                    </div>
                  </div>
                );
              });
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