import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { supabase } from '../lib/supabase';
import './InspirationPage.css';

const InspirationPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0 });
  const [validatedImages, setValidatedImages] = useState([]);
  
  // Refs for cleanup and performance
  const componentMountedRef = useRef(true);
  const intersectionObserverRef = useRef(null);
  const imageRefsMap = useRef(new Map());

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
        .limit(200); // Reduziert für bessere Performance beim Validieren

      if (error) {
        console.error('Error loading community images:', error);
        return;
      }

      // Filter for quality images - sehr entspannter Filter für maximale Auswahl
      const qualityImages = data?.filter(img => 
        img.result_image_url && 
        img.prompt && 
        img.prompt.length > 3 && // Sehr entspannt - nur 3+ Zeichen
        img.username
        // Removed test/debug filter for more images
      ) || [];

      // Mobile-optimized batch image validation - prevents iPhone crashes
      console.log('🔍 Database returned:', data?.length || 0, 'total images')
      console.log('📋 After quality filter:', qualityImages.length, 'candidates')
      
      // Detect mobile device and adjust batch size accordingly
      const isMobile = window.innerWidth <= 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const batchSize = isMobile ? 3 : 8; // Very small batches for mobile
      const maxConcurrency = isMobile ? 2 : 4; // Limit concurrent operations
      
      console.log(`📱 Device: ${isMobile ? 'Mobile' : 'Desktop'}, batch size: ${batchSize}`);
      
      setLoadingProgress({ current: 0, total: qualityImages.length });
      setValidatedImages([]); // Reset for progressive loading
      
      const validImages = [];
      let processed = 0;
      
      // Process images in small batches to prevent memory overflow
      for (let i = 0; i < qualityImages.length; i += batchSize) {
        const batch = qualityImages.slice(i, i + batchSize);
        
        // Process batch with limited concurrency
        const batchPromises = batch.map(async (img) => {
          try {
            const dimensions = await analyzeImageDimensions(img.result_image_url, isMobile);
            if (dimensions === null) {
              return { ...img, isValid: false };
            }
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

        // Wait for current batch before proceeding
        const batchResults = await Promise.all(batchPromises);
        const validBatchImages = batchResults.filter(img => img.isValid && img.dimensions);
        
        // Progressive loading - add valid images immediately
        validImages.push(...validBatchImages);
        setValidatedImages(prev => [...prev, ...validBatchImages]);
        
        processed += batch.length;
        setLoadingProgress({ current: processed, total: qualityImages.length });
        
        // Small delay on mobile to prevent overwhelming the browser
        if (isMobile && i + batchSize < qualityImages.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
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

      // Final shuffle for display using the existing fairSelection
      const shuffledImages = fairSelection.sort(() => Math.random() - 0.5);

      console.log('🎨 Community Gallery:', Object.keys(imagesByUser).map(user => 
        `${user}: ${imagesByUser[user].length} total`
      ).join(', '));
      console.log('📊 Final selection:', shuffledImages.length, 'images from', 
        new Set(shuffledImages.map(img => img.username)).size, 'users');

      // Set final images after all validation is complete
      setImages(shuffledImages);
      setValidatedImages(shuffledImages); // Ensure consistency
    } catch (error) {
      console.error('Error loading community images:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    componentMountedRef.current = true;
    
    return () => {
      componentMountedRef.current = false;
      // Clean up intersection observer
      if (intersectionObserverRef.current) {
        intersectionObserverRef.current.disconnect();
      }
      // Clear image references
      imageRefsMap.current.clear();
    };
  }, []);

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

  const copyPromptAndGenerate = (prompt) => {
    // Clipboard copy für Fallback
    navigator.clipboard.writeText(prompt).then(() => {
      console.log('✅ Prompt copied to clipboard');
    }).catch(err => {
      console.error('❌ Failed to copy prompt:', err);
    });
    
    // Navigation zur Generation-Page mit vorausgefülltem Prompt
    console.log('🚀 Navigating to generation with prompt:', prompt.substring(0, 50) + '...');
    navigate('/nono-banana', { 
      state: { 
        promptText: prompt,
        fromInspiration: true 
      } 
    });
  };

  const openImage = (imageUrl) => {
    window.open(imageUrl, '_blank');
  };

  const getUserDisplayName = (username) => {
    if (!username) return 'Community';
    return username;
  };

  // Lazy loading image component with intersection observer
  const LazyImage = ({ img, index, sizeClass, classification, ratio }) => {
    const imageRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
      const imageElement = imageRef.current;
      if (!imageElement) return;

      // Create intersection observer for lazy loading
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !isVisible) {
              setIsVisible(true);
            }
          });
        },
        {
          rootMargin: '50px 0px', // Start loading 50px before image enters viewport
          threshold: 0.1
        }
      );

      observer.observe(imageElement);
      imageRefsMap.current.set(img.id, imageElement);

      return () => {
        observer.disconnect();
        imageRefsMap.current.delete(img.id);
      };
    }, [img.id, isVisible]);

    const handleImageLoad = () => {
      setIsLoaded(true);
    };

    const handleImageError = () => {
      setHasError(true);
      console.warn('❌ Lazy load error:', img.result_image_url);
    };

    return (
      <div 
        ref={imageRef}
        key={img.id} 
        className={`masonry-item ${sizeClass} ${isLoaded ? 'loaded' : ''}`}
        data-classification={classification}
        data-ratio={ratio.toFixed(2)}
        data-index={index}
        style={{
          background: isLoaded ? 'transparent' : '#f0f0f0',
          minHeight: isLoaded ? 'auto' : '200px'
        }}
      >
        {isVisible && !hasError && (
          <img
            src={img.result_image_url}
            className="masonry-image"
            onClick={() => handleImageClick(img)}
            loading="lazy"
            onLoad={handleImageLoad}
            onError={handleImageError}
            alt={`Inspiration by ${getUserDisplayName(img.username)} - ${classification}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              opacity: isLoaded ? 1 : 0,
              transition: 'opacity 0.3s ease'
            }}
          />
        )}
        
        {!isLoaded && isVisible && !hasError && (
          <div 
            className="image-placeholder"
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f8f8f8',
              color: '#ccc'
            }}
          >
            Loading...
          </div>
        )}

        {hasError && (
          <div 
            className="image-error"
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f0f0f0',
              color: '#999'
            }}
          >
            Error loading image
          </div>
        )}

        <div className="image-overlay">
          <div className="image-info">
            <span className="username">{getUserDisplayName(img.username)}</span>
            <span className="date">{new Date(img.created_at).toLocaleDateString('de-DE')}</span>
            {img.dimensions && (
              <span className="dimensions">{img.dimensions.width}×{img.dimensions.height}</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const analyzeImageDimensions = (imageUrl, isMobile = false) => {
    return new Promise((resolve) => {
      const img = new Image();
      
      // Mobile-optimized timeout - much shorter for responsiveness
      const timeout = setTimeout(() => {
        img.src = ''; // Cancel loading to free memory
        img.onload = null;
        img.onerror = null;
        resolve(null); // Bild nicht ladbar
      }, isMobile ? 800 : 1500); // Shorter timeout on mobile
      
      img.onload = () => {
        clearTimeout(timeout);
        
        // Quick dimension analysis
        const ratio = img.naturalWidth / img.naturalHeight;
        let classification;
        
        if (ratio >= 1.5) {
          classification = 'landscape';
        } else if (ratio <= 0.67) {
          classification = 'portrait';
        } else {
          classification = 'square';
        }
        
        const result = {
          width: img.naturalWidth,
          height: img.naturalHeight,
          ratio: ratio,
          classification: classification,
          isValid: true
        };
        
        // Clean up image reference immediately
        img.src = '';
        img.onload = null;
        img.onerror = null;
        
        resolve(result);
      };
      
      img.onerror = () => {
        clearTimeout(timeout);
        img.src = '';
        img.onload = null;
        img.onerror = null;
        console.warn('❌ Defektes Bild gefiltert:', imageUrl);
        resolve(null);
      };
      
      // Mobile optimization: disable crossOrigin to prevent CORS delays
      if (!isMobile) {
        img.crossOrigin = 'anonymous';
      }
      
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
            {loadingProgress.total > 0 && (
              <div className="progress-container">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{
                      width: `${(loadingProgress.current / loadingProgress.total) * 100}%`
                    }}
                  />
                </div>
                <p className="progress-text">
                  {loadingProgress.current} / {loadingProgress.total} Bilder validiert
                  {validatedImages.length > 0 && ` • ${validatedImages.length} bereit zur Anzeige`}
                </p>
              </div>
            )}
          </div>
        ) : (validatedImages.length === 0 && images.length === 0) ? (
          <div className="no-images-container">
            <p>Keine Community-Bilder verfügbar.</p>
          </div>
        ) : (
          <div className="masonry-gallery">
            {(() => {
              // Use progressive loading - show validated images immediately
              const displayImages = loading ? validatedImages : images;
              const imagesWithDimensions = displayImages.filter(img => img.dimensions);
              
              console.log('🎨 Progressive Display:', imagesWithDimensions.length, 'images', 
                loading ? '(partial)' : '(complete)');
              
              return imagesWithDimensions.map((img, index) => {
                const { width, height, ratio, classification } = img.dimensions;
                
                // FIXED 6-ROW REPEATING TETRIS PATTERN
                const patternIndex = index % 8;
                let sizeClass = '';
                
                switch(patternIndex) {
                  case 0: sizeClass = 'square'; break;
                  case 1: sizeClass = 'square'; break; 
                  case 2: sizeClass = 'portrait large'; break;
                  case 3: sizeClass = 'portrait'; break;
                  case 4: sizeClass = 'square'; break;
                  case 5: sizeClass = 'square'; break;
                  case 6: sizeClass = 'portrait large'; break;
                  case 7: sizeClass = 'landscape'; break;
                }
                
                console.log(`🧩 Lazy Tetris ${index}: ${classification} → ${sizeClass}`);
                
                return (
                  <LazyImage
                    key={img.id}
                    img={img}
                    index={index}
                    sizeClass={sizeClass}
                    classification={classification}
                    ratio={ratio}
                  />
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
                      copyPromptAndGenerate(selectedImage.prompt);
                    }}
                  >
                    🚀 Prompt nutzen & generieren
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