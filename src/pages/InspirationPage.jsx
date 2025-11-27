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
  const [isInitialBatchLoaded, setIsInitialBatchLoaded] = useState(false);
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  const [randomizedImages, setRandomizedImages] = useState([]);
  
  // Refs for cleanup and performance
  const componentMountedRef = useRef(true);
  const intersectionObserverRef = useRef(null);
  const imageRefsMap = useRef(new Map());

  const loadCommunityImages = async () => {
    try {
      setLoading(true);
      setIsInitialBatchLoaded(false);
      setBackgroundLoading(false);
      
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
        .limit(250); // Increased for better variety after randomization

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

      // PERFORMANCE BOOST: Randomize BEFORE validation to ensure variety
      const shuffledQualityImages = qualityImages.sort(() => Math.random() - 0.5);
      setRandomizedImages(shuffledQualityImages);

      console.log('🔍 Database returned:', data?.length || 0, 'total images')
      console.log('📋 After quality filter & randomization:', shuffledQualityImages.length, 'candidates')
      console.log('🎲 Images randomized for progressive loading')
      
      // Detect mobile device and adjust batch size accordingly
      const isMobile = window.innerWidth <= 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const initialBatchSize = isMobile ? 50 : 75; // Load initial batch for immediate display
      const backgroundBatchSize = isMobile ? 5 : 10; // Smaller background batches for mobile
      
      console.log(`📱 Device: ${isMobile ? 'Mobile' : 'Desktop'}, initial batch: ${initialBatchSize}`);
      
      // PHASE 1: Load ONLY initial batch (50 images) for immediate display
      const initialBatch = shuffledQualityImages.slice(0, 50);
      const remainingImages = shuffledQualityImages.slice(50);
      
      setLoadingProgress({ current: 0, total: 50 }); // Only count first 50 for progress bar
      setValidatedImages([]); // Reset
      
      console.log('🚀 PHASE 1: Processing ONLY first', initialBatch.length, 'images');
      await processImageBatch(initialBatch, 0, true, isMobile);
      
      // Store remaining images for scroll-based loading later
      setImages(remainingImages); // Use images state to store remaining
      
      console.log('💾 Stored', remainingImages.length, 'images for scroll-based loading');
    } catch (error) {
      console.error('Error loading community images:', error);
    } finally {
      setLoading(false);
    }
  };

  // Process initial batch for immediate display
  const processImageBatch = async (batch, startIndex, isInitialBatch, isMobile) => {
    const validImages = [];
    const batchSize = isMobile ? 3 : 6; // Small concurrent validation batches
    
    for (let i = 0; i < batch.length; i += batchSize) {
      const subBatch = batch.slice(i, i + batchSize);
        
      const subBatchPromises = subBatch.map(async (img) => {
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

      const subBatchResults = await Promise.all(subBatchPromises);
      const validSubBatchImages = subBatchResults.filter(img => img.isValid && img.dimensions);
      
      if (validSubBatchImages.length > 0) {
        validImages.push(...validSubBatchImages);
        setValidatedImages(prev => [...prev, ...validSubBatchImages]);
        
        // Update progress
        const processed = startIndex + i + subBatch.length;
        setLoadingProgress({ current: processed, total: randomizedImages.length });
        
        console.log(`✅ Batch ${Math.floor(i/batchSize) + 1}: +${validSubBatchImages.length} valid images, total: ${validImages.length}`);
      }
      
      // Micro-delay to prevent UI blocking
      if (i + batchSize < batch.length) {
        await new Promise(resolve => setTimeout(resolve, isMobile ? 50 : 25));
      }
    }
    
    if (isInitialBatch) {
      setIsInitialBatchLoaded(true);
      // Don't set images - keep using validatedImages state for progressive loading
      console.log('🎉 Initial batch complete:', validImages.length, 'images ready for display');
    }
    
    return validImages;
  };

  // Background loading of remaining images
  const processBackgroundImages = async (backgroundBatch, startIndex, isMobile) => {
    const batchSize = isMobile ? 2 : 4; // Even smaller batches for background loading
    
    for (let i = 0; i < backgroundBatch.length; i += batchSize) {
      const batch = backgroundBatch.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (img) => {
        try {
          const dimensions = await analyzeImageDimensions(img.result_image_url, isMobile);
          if (dimensions === null) return { ...img, isValid: false };
          return { ...img, dimensions, isValid: true };
        } catch (error) {
          return { ...img, isValid: false };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      const validBatchImages = batchResults.filter(img => img.isValid && img.dimensions);
      
      if (validBatchImages.length > 0) {
        setValidatedImages(prev => {
          const updated = [...prev, ...validBatchImages];
          setImages(updated); // Update main images array
          return updated;
        });
        
        const processed = startIndex + i + batch.length;
        setLoadingProgress({ current: processed, total: randomizedImages.length });
        
        console.log(`🔄 Background: +${validBatchImages.length} images loaded`);
      }
      
      // Longer delay for background loading to not interfere with UI
      await new Promise(resolve => setTimeout(resolve, isMobile ? 200 : 100));
    }
    
    setBackgroundLoading(false);
    console.log('🏁 Background loading complete');
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

  // Stable placeholder dimensions calculator
  const calculatePlaceholderDimensions = (dimensions, sizeClass) => {
    if (!dimensions) {
      // Fallback dimensions based on size class to prevent layout shifts
      const fallbackDimensions = {
        'square': { width: 300, height: 300 },
        'landscape': { width: 400, height: 250 },
        'portrait': { width: 250, height: 400 },
        'portrait large': { width: 250, height: 500 },
        'landscape large': { width: 500, height: 300 }
      };
      return fallbackDimensions[sizeClass] || { width: 300, height: 300 };
    }
    return { width: dimensions.width, height: dimensions.height };
  };

  // Stable lazy loading image component with fixed aspect ratios
  const LazyImage = ({ img, index, sizeClass, classification, ratio }) => {
    const imageRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    
    // Calculate stable placeholder dimensions to prevent layout shifts
    const placeholderDims = calculatePlaceholderDimensions(img.dimensions, sizeClass);
    const aspectRatio = placeholderDims.height / placeholderDims.width;

    useEffect(() => {
      const imageElement = imageRef.current;
      if (!imageElement) return;

      // Enhanced intersection observer for mobile Safari optimization
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !isVisible) {
              // Slight delay for better performance on mobile Safari
              requestAnimationFrame(() => {
                setIsVisible(true);
              });
            }
          });
        },
        {
          // Optimized for mobile Safari - larger rootMargin for smoother loading
          rootMargin: '100px 0px', // Start loading earlier to prevent blank spaces
          threshold: 0.01, // Lower threshold for better mobile performance
          // Use root element for better Safari compatibility
          root: null
        }
      );

      observer.observe(imageElement);
      imageRefsMap.current.set(img.id, imageElement);

      return () => {
        if (observer) {
          observer.unobserve(imageElement);
          observer.disconnect();
        }
        imageRefsMap.current.delete(img.id);
      };
    }, [img.id, isVisible]);

    const handleImageLoad = useCallback(() => {
      // Use requestAnimationFrame for smoother transition on mobile Safari
      requestAnimationFrame(() => {
        setIsLoaded(true);
      });
    }, []);

    const handleImageError = useCallback(() => {
      setHasError(true);
      console.warn('❌ Lazy load error:', img.result_image_url);
    }, [img.result_image_url]);

    return (
      <div 
        ref={imageRef}
        key={img.id} 
        className={`masonry-item ${sizeClass} ${isLoaded ? 'loaded' : 'loading'}`}
        data-classification={classification}
        data-ratio={ratio.toFixed(2)}
        data-index={index}
        style={{
          // CRITICAL: Fixed aspect ratio container to prevent layout shifts
          aspectRatio: `${placeholderDims.width} / ${placeholderDims.height}`,
          backgroundColor: isLoaded ? 'transparent' : '#f8f9fa',
          // Prevent any height changes during loading
          height: 'auto',
          width: '100%',
          // GPU acceleration for smooth animations
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden'
        }}
      >
        {/* Stable placeholder that maintains exact dimensions */}
        <div 
          className="image-container"
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            borderRadius: 'inherit'
          }}
        >
          {/* Always render placeholder first to maintain stable layout */}
          <div 
            className={`image-placeholder ${isLoaded ? 'hidden' : 'visible'}`}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: isLoaded ? 'transparent' : 'linear-gradient(90deg, #f0f2f5 25%, #e4e6ea 50%, #f0f2f5 75%)',
              backgroundSize: '200% 100%',
              animation: isLoaded ? 'none' : 'shimmer 1.5s infinite',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#98a5b3',
              fontSize: '0.75rem',
              fontWeight: '500',
              transition: 'opacity 0.3s ease',
              opacity: isLoaded ? 0 : 1,
              zIndex: 1
            }}
          >
            {!isVisible ? 'Loading...' : (hasError ? 'Error' : 'Loading...')}
          </div>
          
          {/* Actual image - only render when visible and no error */}
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
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
                opacity: isLoaded ? 1 : 0,
                transition: 'opacity 0.4s ease-out',
                zIndex: 2,
                // Prevent image from affecting layout
                display: 'block',
                // Enhanced mobile Safari image rendering
                imageRendering: 'optimizeQuality',
                // Prevent iOS Safari image scaling issues
                maxWidth: '100%',
                maxHeight: '100%'
              }}
              // Mobile Safari specific attributes for better performance
              decoding="async"
              fetchpriority={index < 12 ? "high" : "low"}
            />
          )}
        </div>

        {/* Error state - maintain same container structure */}
        {hasError && (
          <div 
            className="image-error"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f8f9fa',
              color: '#6c757d',
              fontSize: '0.75rem',
              zIndex: 3
            }}
          >
            Failed to load
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
      
      // Aggressive mobile timeout for progressive loading
      const timeout = setTimeout(() => {
        img.src = ''; // Cancel loading to free memory
        img.onload = null;
        img.onerror = null;
        resolve(null); // Bild nicht ladbar
      }, isMobile ? 400 : 800); // Much shorter timeout for faster progression
      
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

        {loading && !isInitialBatchLoaded ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Lade erste Community-Kunstwerke...</p>
            {loadingProgress.total > 0 && (
              <div className="progress-container">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{
                      width: `${Math.min((loadingProgress.current / Math.min(loadingProgress.total, 50)) * 100, 100)}%`
                    }}
                  />
                </div>
                <p className="progress-text">
                  {loadingProgress.current} / 50 Bilder werden geladen...
                </p>
              </div>
            )}
          </div>
        ) : (validatedImages.length === 0 && images.length === 0) ? (
          <div className="no-images-container">
            <p>Keine Community-Bilder verfügbar.</p>
          </div>
        ) : (
          <>
            <div className="masonry-gallery">
              {(() => {
                // Show only validated images from progressive loading
                const displayImages = validatedImages.filter(img => img.dimensions);
                
                console.log('🎨 Progressive Display:', displayImages.length, 'images', 
                  backgroundLoading ? '(+ background loading)' : '(complete)');
                
                return displayImages.map((img, index) => {
                const { width, height, ratio, classification } = img.dimensions;
                
                // Simple Tetris pattern
                const patternIndex = index % 8;
                let sizeClass = 'square';
                
                if (patternIndex === 2 || patternIndex === 6) {
                  sizeClass = 'portrait-large';
                } else if (patternIndex === 3 || patternIndex === 7) {
                  sizeClass = 'portrait';
                } else if (patternIndex === 1 || patternIndex === 5) {
                  sizeClass = 'landscape';
                }
                
                return (
                  <div 
                    key={img.id} 
                    className={`masonry-item ${sizeClass}`}
                    onClick={() => handleImageClick(img)}
                  >
                    <img
                      src={img.result_image_url}
                      className="masonry-image"
                      loading="lazy"
                      alt={`Community inspiration by ${getUserDisplayName(img.username)}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                    <div className="image-overlay">
                      <div className="image-info">
                        <span className="username">{getUserDisplayName(img.username)}</span>
                        <span className="date">{new Date(img.created_at).toLocaleDateString('de-DE')}</span>
                      </div>
                    </div>
                  </div>
                );
                });
              })()}
            </div>
            
            {/* Background Loading Indicator */}
            {backgroundLoading && isInitialBatchLoaded && (
              <div className="background-loading-indicator">
                <div className="background-loading-content">
                  <div className="mini-spinner"></div>
                  <p>Lädt weitere Bilder im Hintergrund... ({loadingProgress.current}/{loadingProgress.total})</p>
                </div>
              </div>
            )}
          </>
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