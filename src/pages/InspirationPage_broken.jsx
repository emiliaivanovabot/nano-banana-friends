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
  const [page, setPage] = useState(1);
  const [hasMoreImages, setHasMoreImages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Refs for cleanup and performance
  const componentMountedRef = useRef(true);
  const intersectionObserverRef = useRef(null);
  const scrollObserverRef = useRef(null); // For progressive loading
  const imageRefsMap = useRef(new Map());
  const loadingRef = useRef(false);
  const scrollLoadingRef = useRef(false); // Prevent multiple scroll loads

  const loadCommunityImages = async () => {
    // Prevent multiple simultaneous calls with ref
    if (loadingRef.current) {
      console.log('⚠️ Already loading, skipping duplicate call');
      return;
    }
    
    console.log('🚀 Starting loadCommunityImages function');
    console.log('👤 Current user info:', { username: user?.username, hasUser: !!user });
    
    try {
      loadingRef.current = true;
      setLoading(true);
      setIsInitialBatchLoaded(false);
      setBackgroundLoading(false);
      
      console.log('🎨 Loading community inspiration gallery...');
      
      // Reset states at the beginning
      setValidatedImages([]);
      setAvailableImages([]);
      setHasMoreImages(false);
      
      // Get quality images from all users (excluding current user if logged in)
      let query = supabase
        .from('generations')
        .select('id, username, prompt, result_image_url, created_at, generation_type, original_filename, aspect_ratio')
        .eq('status', 'completed')
        .not('result_image_url', 'is', null) 
        .not('username', 'is', null) 
        .order('created_at', { ascending: false })
        .limit(500); // Increased limit for more variety

      // Only exclude current user if we have a valid username
      if (user?.username && typeof user.username === 'string' && user.username.length > 0) {
        query = query.neq('username', user.username);
        console.log(`🚫 Excluding current user: ${user.username}`);
      } else {
        console.log('ℹ️ No user to exclude, loading all community images');
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Database error loading community images:', error);
        setLoading(false);
        loadingRef.current = false;
        return;
      }

      console.log('🔍 Database query results:', {
        totalReturned: data?.length || 0,
        sampleUsernames: data?.slice(0, 5).map(img => img.username) || [],
        excludedUser: user?.username || 'none'
      });

      // Filter for quality images with more lenient criteria
      const qualityImages = data?.filter(img => {
        const hasValidUrl = img.result_image_url && typeof img.result_image_url === 'string' && img.result_image_url.length > 10;
        const hasValidPrompt = img.prompt && typeof img.prompt === 'string' && img.prompt.trim().length > 2;
        const hasValidUsername = img.username && typeof img.username === 'string' && img.username.length > 0;
        
        const isValid = hasValidUrl && hasValidPrompt && hasValidUsername;
        
        if (!isValid) {
          console.log('❌ Filtered out image:', {
            id: img.id,
            hasUrl: hasValidUrl,
            hasPrompt: hasValidPrompt,
            hasUsername: hasValidUsername,
            promptLength: img.prompt?.length || 0
          });
        }
        
        return isValid;
      }) || [];

      console.log('📋 Quality filtering results:', {
        beforeFilter: data?.length || 0,
        afterFilter: qualityImages.length,
        filterRate: data?.length ? `${((qualityImages.length / data.length) * 100).toFixed(1)}%` : '0%'
      });

      // Early return if no quality images
      if (qualityImages.length === 0) {
        console.log('❌ No quality images found after filtering');
        setHasMoreImages(false);
        setLoading(false);
        loadingRef.current = false;
        return;
      }

      // Randomize images for variety in progressive loading
      const shuffledQualityImages = qualityImages.sort(() => Math.random() - 0.5);
      setRandomizedImages(shuffledQualityImages);

      console.log('🎲 Images randomized for progressive loading:', shuffledQualityImages.length);
      
      // Detect mobile device and adjust batch size accordingly
      const isMobile = window.innerWidth <= 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const initialBatchSize = isMobile ? 30 : 40; // Conservative initial batch
      
      console.log(`📱 Device: ${isMobile ? 'Mobile' : 'Desktop'}, initial batch size: ${initialBatchSize}`);
      
      // CRITICAL FIX: Ensure we have enough images before splitting
      if (shuffledQualityImages.length < initialBatchSize) {
        console.log(`⚠️ Not enough images for full initial batch: ${shuffledQualityImages.length} < ${initialBatchSize}`);
        // Use all available images as initial batch
        const initialBatch = shuffledQualityImages;
        const remainingImages = []; // No remaining images
        
        console.log('🎯 Using all available images as initial batch:', {
          totalImages: shuffledQualityImages.length,
          initialBatch: initialBatch.length,
          remaining: remainingImages.length
        });
        
        setLoadingProgress({ current: 0, total: initialBatch.length });
        
        // Process all images
        const initialValidated = await processImageBatch(initialBatch, 0, true, isMobile);
        
        // Set final state - no more images available
        setAvailableImages([]);
        setHasMoreImages(false);
        
        console.log('✅ All images processed, no progressive loading needed');
        
      } else {
        // Normal case: split into initial batch and remaining
        const initialBatch = shuffledQualityImages.slice(0, initialBatchSize);
        const remainingImages = shuffledQualityImages.slice(initialBatchSize);
        
        console.log('🎯 Normal batch split:', {
          totalQualityImages: shuffledQualityImages.length,
          initialBatchSize: initialBatch.length,
          remainingSize: remainingImages.length
        });
        
        setLoadingProgress({ current: 0, total: initialBatchSize });
        
        // Process initial batch
        const initialValidated = await processImageBatch(initialBatch, 0, true, isMobile);
        
        // CRITICAL: Store remaining images for progressive loading
        console.log('💾 Storing', remainingImages.length, 'images for progressive scroll-based loading');
        console.log('🔍 DEBUG: First few remaining images:', remainingImages.slice(0, 3).map(img => ({ id: img.id, username: img.username })));
        
        // Set progressive loading state
        setAvailableImages(remainingImages);
        setHasMoreImages(remainingImages.length > 0);
        
        console.log('✅ Progressive loading state set:', {
          remainingImages: remainingImages.length,
          hasMoreImages: remainingImages.length > 0,
          availableImagesLength: remainingImages.length
        });
        
        // Initialize scroll observer for progressive loading
        if (remainingImages.length > 0) {
          console.log('🚀 Initializing progressive loading system');
          setTimeout(() => {
            console.log('⏰ Setting up scroll observer for progressive loading');
            initializeScrollObserver();
            attachScrollObserverToLastImages();
          }, 1000); // Delay to ensure initial images are rendered
          
          // Additional attempts to ensure attachment
          setTimeout(() => {
            console.log('⏰ Secondary scroll observer setup attempt');
            attachScrollObserverToLastImages();
          }, 3000);
        }
      }
      
    } catch (error) {
      console.error('❌ Critical error in loadCommunityImages:', error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
      console.log('🏁 loadCommunityImages function completed');
    }
  };

  // Process initial batch for immediate display
  const processImageBatch = async (batch, startIndex, isInitialBatch, isMobile) => {
    console.log(`🔍 Processing ${isInitialBatch ? 'INITIAL' : 'PROGRESSIVE'} batch:`, {
      batchSize: batch.length,
      startIndex,
      isMobile,
      batchType: isInitialBatch ? 'initial' : 'progressive'
    });

    const validImages = [];
    const invalidImages = [];
    const processingBatchSize = isMobile ? 3 : 6; // Small concurrent validation batches
    
    for (let i = 0; i < batch.length; i += processingBatchSize) {
      const subBatch = batch.slice(i, i + processingBatchSize);
      
      console.log(`📦 Processing sub-batch ${Math.floor(i/processingBatchSize) + 1}/${Math.ceil(batch.length/processingBatchSize)}: ${subBatch.length} images`);
        
      const subBatchPromises = subBatch.map(async (img, subIndex) => {
        try {
          const dimensions = await analyzeImageDimensions(img.result_image_url, isMobile);
          if (dimensions === null) {
            console.log(`❌ Image ${i + subIndex + 1} failed validation:`, img.result_image_url.substring(0, 50) + '...');
            return { ...img, isValid: false, failureReason: 'dimension_analysis_failed' };
          }
          console.log(`✅ Image ${i + subIndex + 1} validated:`, dimensions.classification, `${dimensions.width}x${dimensions.height}`);
          return { 
            ...img, 
            dimensions,
            isValid: true
          };
        } catch (error) {
          console.warn(`❌ Error analyzing image ${i + subIndex + 1}:`, error.message);
          return { ...img, isValid: false, failureReason: 'analysis_error' };
        }
      });

      const subBatchResults = await Promise.all(subBatchPromises);
      const validSubBatchImages = subBatchResults.filter(img => img.isValid && img.dimensions);
      const invalidSubBatchImages = subBatchResults.filter(img => !img.isValid);
      
      console.log(`📊 Sub-batch results: ${validSubBatchImages.length} valid, ${invalidSubBatchImages.length} invalid`);
      
      if (validSubBatchImages.length > 0) {
        validImages.push(...validSubBatchImages);
        invalidImages.push(...invalidSubBatchImages);
        
        setValidatedImages(prev => {
          const existingIds = new Set(prev.map(img => img.id));
          const uniqueImages = validSubBatchImages.filter(img => !existingIds.has(img.id));
          
          console.log(`🔗 Adding ${uniqueImages.length} unique images to state (${prev.length} → ${prev.length + uniqueImages.length})`);
          return [...prev, ...uniqueImages];
        });
        
        // Update progress
        const processed = startIndex + i + subBatch.length;
        setLoadingProgress({ current: processed, total: randomizedImages.length });
        
        console.log(`✅ Batch ${Math.floor(i/processingBatchSize) + 1}: +${validSubBatchImages.length} valid images, total: ${validImages.length}`);
      } else {
        console.log(`⚠️ Sub-batch ${Math.floor(i/processingBatchSize) + 1} had no valid images`);
        invalidImages.push(...invalidSubBatchImages);
      }
      
      // Micro-delay to prevent UI blocking
      if (i + processingBatchSize < batch.length) {
        await new Promise(resolve => setTimeout(resolve, isMobile ? 50 : 25));
      }
    }
    
    console.log(`🎯 Batch processing complete:`, {
      processed: batch.length,
      valid: validImages.length,
      invalid: invalidImages.length,
      successRate: `${((validImages.length / batch.length) * 100).toFixed(1)}%`,
      isInitialBatch
    });
    
    if (isInitialBatch) {
      setIsInitialBatchLoaded(true);
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
          const existingIds = new Set(prev.map(img => img.id));
          const uniqueImages = validBatchImages.filter(img => !existingIds.has(img.id));
          return [...prev, ...uniqueImages];
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
      // Clean up intersection observers
      if (intersectionObserverRef.current) {
        intersectionObserverRef.current.disconnect();
      }
      if (scrollObserverRef.current) {
        scrollObserverRef.current.disconnect();
      }
      // Clear image references
      imageRefsMap.current.clear();
    };
  }, []);

  useEffect(() => {
    console.log('🔍 useEffect triggered - Auto loading community images');
    loadCommunityImages();
  }, []);
  
  console.log('🔍 RENDER CHECK - Component rendered, user:', !!user, 'username:', user?.username);

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
          // Remove aspect ratio to let grid control sizing
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
              background: isLoaded ? 'transparent' : 'linear-gradient(90deg, #f0f2f5 25%, #e4e6ea 50%, #f0f2f5 75%) / 200% 100%',
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

  // Progressive scroll-based loading system
  const initializeScrollObserver = () => {
    console.log('🔍 Initializing scroll observer for progressive loading...');
    
    // Clean up existing observer
    if (scrollObserverRef.current) {
      console.log('🧹 Cleaning up existing scroll observer');
      scrollObserverRef.current.disconnect();
    }

    // Create observer for progressive loading
    scrollObserverRef.current = new IntersectionObserver(
      (entries) => {
        console.log('📊 Scroll observer triggered:', entries.length, 'entries');
        entries.forEach((entry) => {
          const elementIndex = entry.target.dataset?.index;
          console.log('🎯 Entry intersecting:', entry.isIntersecting, 
                     'element index:', elementIndex,
                     'scrollLoadingRef:', scrollLoadingRef.current, 
                     'hasMoreImages:', hasMoreImages,
                     'availableImages:', availableImages.length);
          
          if (entry.isIntersecting && !scrollLoadingRef.current && hasMoreImages && availableImages.length > 0) {
            console.log('🚀 Triggering loadMoreImages from scroll observer');
            loadMoreImages();
          } else if (entry.isIntersecting) {
            console.log('❌ Progressive loading blocked:', {
              alreadyLoading: scrollLoadingRef.current,
              hasMore: hasMoreImages,
              availableCount: availableImages.length
            });
          }
        });
      },
      {
        // Trigger when user scrolls to 70% of current content
        rootMargin: '400px 0px', // Increased margin for earlier trigger
        threshold: 0.1
      }
    );
    
    console.log('✅ Scroll observer created and ready');
  };

  // Load more images progressively
  const loadMoreImages = async () => {
    console.log('🚀🚀🚀 PROGRESSIVE LOADING TRIGGERED 🚀🚀🚀');
    console.log('🔄 loadMoreImages called - checking conditions...');
    console.log('📊 Current state:', {
      scrollLoadingRef: scrollLoadingRef.current,
      hasMoreImages,
      availableImagesCount: availableImages.length,
      validatedImagesCount: validatedImages.length,
      loadingRefCurrent: loadingRef.current
    });

    // Enhanced condition checking with detailed logging
    const canLoad = !scrollLoadingRef.current && 
                   !loadingRef.current && 
                   hasMoreImages && 
                   availableImages.length > 0;

    if (!canLoad) {
      console.log('❌❌❌ Progressive loading BLOCKED ❌❌❌', {
        alreadyScrollLoading: scrollLoadingRef.current,
        mainLoading: loadingRef.current,
        hasMore: hasMoreImages,
        availableCount: availableImages.length,
        canLoad: canLoad
      });
      return;
    }

    console.log('✅✅✅ Progressive loading CONDITIONS MET ✅✅✅');

    try {
      console.log('🚀 Starting progressive image loading...');
      scrollLoadingRef.current = true;
      setIsLoadingMore(true);

      // Detect mobile for batch size
      const isMobile = window.innerWidth <= 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const batchSize = isMobile ? 20 : 30; // Conservative batch sizes

      // Get next batch of images with safety check
      if (availableImages.length === 0) {
        console.log('⚠️ No available images for progressive loading');
        setHasMoreImages(false);
        return;
      }

      const nextBatch = availableImages.slice(0, batchSize);
      const remainingAvailable = availableImages.slice(batchSize);

      console.log(`🔄 Progressive loading batch details:`, {
        batchSize: nextBatch.length,
        remainingAfterBatch: remainingAvailable.length,
        deviceType: isMobile ? 'Mobile' : 'Desktop',
        targetBatchSize: batchSize,
        firstBatchItems: nextBatch.slice(0, 3).map(img => ({ id: img.id, username: img.username }))
      });

      // Process batch with same validation as initial load
      const validatedBatch = await processImageBatch(nextBatch, validatedImages.length, false, isMobile);
      
      console.log('🎯 Progressive validation results:', {
        inputBatchSize: nextBatch.length,
        validatedCount: validatedBatch.length,
        filterSuccessRate: `${((validatedBatch.length / nextBatch.length) * 100).toFixed(1)}%`,
        totalValidatedNow: validatedImages.length + validatedBatch.length
      });
      
      if (validatedBatch.length > 0) {
        // Add to validated images with duplicate protection
        setValidatedImages(prev => {
          const existingIds = new Set(prev.map(img => img.id));
          const uniqueImages = validatedBatch.filter(img => !existingIds.has(img.id));
          const newTotal = prev.length + uniqueImages.length;
          
          console.log(`✅ Adding ${uniqueImages.length} unique images (${prev.length} → ${newTotal})`);
          return [...prev, ...uniqueImages];
        });

        console.log(`🎊 Progressive load SUCCESS: +${validatedBatch.length} new images displayed`);
      } else {
        console.log('⚠️ No valid images in this batch - continuing to next batch');
      }

      // Update available images and check if more remain
      setAvailableImages(remainingAvailable);
      const stillHasMore = remainingAvailable.length > 0;
      setHasMoreImages(stillHasMore);

      console.log('📊 Progressive loading state updated:', {
        availableImagesRemaining: remainingAvailable.length,
        hasMoreImages: stillHasMore,
        totalDisplayedImages: validatedImages.length + (validatedBatch?.length || 0)
      });

      // Re-attach observer to new last elements if more images remain
      if (stillHasMore) {
        console.log('🔗 Progressive loading continues - re-attaching scroll observer');
        // Multiple attempts with different delays for robustness
        const attachmentDelays = [500, 1500, 3000];
        attachmentDelays.forEach((delay, index) => {
          setTimeout(() => {
            console.log(`⏰ Scroll observer re-attachment attempt ${index + 1} (${delay}ms)`);
            attachScrollObserverToLastImages();
          }, delay);
        });
      } else {
        console.log('🏁🏁🏁 ALL IMAGES PROCESSED - PROGRESSIVE LOADING COMPLETE 🏁🏁🏁');
        // Clean up observer when no more images
        if (scrollObserverRef.current) {
          console.log('🧹 Cleaning up scroll observer - all images loaded');
          scrollObserverRef.current.disconnect();
          scrollObserverRef.current = null;
        }
      }

    } catch (error) {
      console.error('❌ Critical error in progressive loading:', error);
      // Reset state on error
      setIsLoadingMore(false);
      scrollLoadingRef.current = false;
    } finally {
      console.log('🔚 Progressive loading batch complete, releasing lock');
      setIsLoadingMore(false);
      scrollLoadingRef.current = false;
    }
  };

  // Attach observer to last few images for progressive loading trigger
  const attachScrollObserverToLastImages = () => {
    console.log('🔗 Attempting to attach scroll observer to last images...');
    console.log('📊 Current state check:', {
      hasScrollObserver: !!scrollObserverRef.current,
      availableImages: availableImages.length,
      hasMoreImages,
      validatedImages: validatedImages.length
    });
    
    // Ensure we have a scroll observer and there are more images to load
    if (!scrollObserverRef.current) {
      console.log('❌ No scroll observer available, creating new one');
      initializeScrollObserver();
      // Wait a bit and try again
      setTimeout(() => attachScrollObserverToLastImages(), 500);
      return;
    }

    if (!hasMoreImages || availableImages.length === 0) {
      console.log('ℹ️ No more images available for progressive loading');
      return;
    }

    // Find all masonry items currently in the DOM
    const imageElements = document.querySelectorAll('.masonry-item');
    console.log('📊 DOM analysis:', {
      totalMasonryItems: imageElements.length,
      availableImages: availableImages.length,
      hasMoreImages: hasMoreImages,
      shouldAttachObserver: imageElements.length > 0 && availableImages.length > 0
    });
    
    if (imageElements.length === 0) {
      console.log('⚠️ No masonry items found in DOM yet, scheduling retry...');
      // More aggressive retry with multiple attempts
      setTimeout(() => {
        console.log('⏰ Retry 1: Checking for masonry items...');
        attachScrollObserverToLastImages();
      }, 1000);
      setTimeout(() => {
        console.log('⏰ Retry 2: Checking for masonry items...');
        attachScrollObserverToLastImages();
      }, 2500);
      return;
    }

    // Use a reasonable number of trigger elements based on total count
    const triggerCount = Math.min(Math.max(3, Math.floor(imageElements.length * 0.1)), 8);
    const triggerElements = Array.from(imageElements).slice(-triggerCount);
    
    console.log('🎯 Progressive loading trigger setup:', {
      totalImages: imageElements.length,
      triggerElements: triggerCount,
      triggerIndexes: triggerElements.map((el, i) => imageElements.length - triggerCount + i)
    });

    try {
      // Clear existing observations first to avoid duplicates
      scrollObserverRef.current.disconnect();

      // Observe trigger elements
      let observedCount = 0;
      triggerElements.forEach((element, index) => {
        if (element) {
          const elementIndex = imageElements.length - triggerCount + index;
          element.dataset.index = elementIndex.toString(); // Ensure data-index is set
          scrollObserverRef.current.observe(element);
          observedCount++;
          
          console.log(`🔍 Observing trigger element ${index + 1}/${triggerCount}:`, {
            elementIndex: elementIndex,
            hasDataIndex: !!element.dataset?.index,
            elementId: element.querySelector('img')?.alt || 'unknown'
          });
        }
      });

      console.log('✅ Scroll observer successfully attached:', {
        observedElements: observedCount,
        totalTriggers: triggerCount,
        attachmentSuccess: observedCount === triggerCount,
        observerMargin: '400px',
        observerThreshold: 0.1
      });

    } catch (error) {
      console.error('❌ Error attaching scroll observer:', error);
      // Fallback: recreate observer
      setTimeout(() => {
        console.log('🔄 Recreating scroll observer after error...');
        initializeScrollObserver();
        setTimeout(() => attachScrollObserverToLastImages(), 1000);
      }, 1000);
    }
  };

  // Initialize progressive loading after initial batch is complete
  useEffect(() => {
    console.log('🎛️ Progressive loading initialization effect triggered:', {
      isInitialBatchLoaded,
      availableImagesCount: availableImages.length,
      validatedImagesCount: validatedImages.length
    });

    if (isInitialBatchLoaded && availableImages.length > 0) {
      console.log('🚀 Setting up progressive loading with multiple attachment attempts...');
      
      // Try multiple times to ensure attachment
      const attachTimes = [500, 1500, 3000]; // Multiple attempts
      attachTimes.forEach((delay, index) => {
        setTimeout(() => {
          console.log(`⏰ Progressive loading attempt ${index + 1} (${delay}ms delay)`);
          attachScrollObserverToLastImages();
        }, delay);
      });
    } else {
      console.log('❌ Progressive loading not initialized:', {
        batchLoaded: isInitialBatchLoaded,
        hasAvailableImages: availableImages.length > 0
      });
    }
  }, [isInitialBatchLoaded, availableImages.length]);

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
                // Show only validated images from progressive loading, remove duplicates
                const displayImages = validatedImages
                  .filter(img => img.dimensions)
                  .filter((img, index, arr) => arr.findIndex(i => i.id === img.id) === index);
                
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
                  
                  // Use the LazyImage component instead of direct rendering
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
            
            {/* Progressive Loading Indicator */}
            {isLoadingMore && (
              <div className="progressive-loading-indicator">
                <div className="progressive-loading-content">
                  <div className="mini-spinner"></div>
                  <p>Lade weitere Bilder...</p>
                </div>
              </div>
            )}
            
            {/* DEBUG: Show current loading status */}
            {validatedImages.length > 0 && (
              <div style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                background: 'rgba(0,0,0,0.8)',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                zIndex: 1000
              }}>
                Bilder: {validatedImages.length} | Verfügbar: {availableImages.length} | Mehr: {hasMoreImages ? 'Ja' : 'Nein'}
              </div>
            )}
            
            {/* End of Gallery Indicator */}
            {!hasMoreImages && validatedImages.length > 50 && (
              <div className="end-of-gallery-indicator">
                <p>🎨 Das war's! Du hast alle verfügbaren Community-Kunstwerke gesehen.</p>
              </div>
            )}
            
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