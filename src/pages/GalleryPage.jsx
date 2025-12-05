import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { supabase } from '../lib/supabase';
import SwipeHandler from '../utils/SwipeHandler.js';
import LazyImage from '../components/ui/LazyImage.jsx';

function GalleryPage() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  // Check if this is admin mode
  const urlParams = new URLSearchParams(window.location.search);
  const isAdminMode = urlParams.get('admin') === 'true' && user?.username === 'emilia.ivanova';
  
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [imagePool, setImagePool] = useState([]);
  const [poolIndex, setPoolIndex] = useState(0);
  const [poolExhausted, setPoolExhausted] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [filter, setFilter] = useState('all'); // Start with 'all' in both modes
  const [copySuccess, setCopySuccess] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [imageErrors, setImageErrors] = useState(new Set());
  const [isNavigating, setIsNavigating] = useState(false);
  const [visibleImages, setVisibleImages] = useState(new Set());
  const [scrolling, setScrolling] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [userImageCounts, setUserImageCounts] = useState({});
  
  // Refs for cleanup and performance
  const swipeHandlerRef = useRef(null);
  const resizeTimeoutRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  const componentMountedRef = useRef(true);
  const intersectionObserverRef = useRef(null);
  const galleryContainerRef = useRef(null);

  // Fetch all unique users who have images (for admin mode)
  const fetchAvailableUsers = useCallback(async () => {
    if (!isAdminMode || authLoading || !user?.username) return;

    try {
      console.log('🔍 Fetching available users with accurate image counts...');
      
      // Get all usernames with their actual image counts from database
      const { data, error } = await supabase
        .from('generations')
        .select('username')
        .eq('status', 'completed')
        .not('result_image_url', 'is', null)
        .not('username', 'is', null);

      if (error) throw error;

      // Count images per user
      const userCounts = {};
      data.forEach(item => {
        if (item.username) {
          userCounts[item.username] = (userCounts[item.username] || 0) + 1;
        }
      });

      // Extract usernames with counts and sort them
      const uniqueUsers = Object.keys(userCounts).sort();
      
      console.log('✅ Found users with image counts:', userCounts);
      setAvailableUsers(uniqueUsers);
      setUserImageCounts(userCounts);
      
    } catch (error) {
      console.error('❌ Error fetching available users:', error);
      setAvailableUsers([]);
      setUserImageCounts({});
    }
  }, [isAdminMode, authLoading, user?.username]);

  // Initialize image pool (load all images once)
  const initializeImagePool = useCallback(async () => {
    if (authLoading || !user?.username) return;

    try {
      setLoading(true);
      console.log('🎲 Initializing gallery image pool for:', isAdminMode ? 'ADMIN MODE' : user?.username);
      
      // Load images based on mode
      let query = supabase
        .from('generations')
        .select('id, result_image_url, prompt, generation_type, created_at, original_filename, username')
        .eq('status', 'completed')
        .not('result_image_url', 'is', null) // Ensure image exists
        .not('username', 'is', null) // Ensure username exists
        .order('created_at', { ascending: false });
      
      // In admin mode, load all users' images; otherwise just current user
      if (!isAdminMode) {
        query = query.eq('username', user.username);
      }
      // In admin mode, we don't add any user filter, so it loads ALL users
      
      const { data, error } = await query;

      if (error) throw error;

      // Debug: Log what users we found
      if (isAdminMode && data) {
        const uniqueUsers = [...new Set(data.map(img => img.username).filter(Boolean))];
        console.log('🔍 Admin mode: Found users:', uniqueUsers);
        console.log('🔍 Total images:', data.length);
      }

      setImagePool(data || []);
      setPoolIndex(0);
      setPoolExhausted(false);
      
      // Load first page from pool
      const itemsPerPage = window.innerWidth <= 768 ? 20 : 30;
      const firstPageImages = (data || []).slice(0, itemsPerPage);
      setImages(firstPageImages);
      setPoolIndex(itemsPerPage);
      setHasMore((data || []).length > itemsPerPage);
      
      console.log(`✅ Gallery pool initialized: ${data?.length || 0} images`);
      
    } catch (error) {
      console.error('❌ Error initializing gallery pool:', error);
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, [user?.username, authLoading, isAdminMode]);

  // Load more from pool (smooth, no database calls)
  const loadMoreFromPool = useCallback(() => {
    if (poolExhausted || loading) return;
    
    setLoading(true);
    console.log('🔄 Loading more from gallery pool, index:', poolIndex);
    
    const itemsPerPage = window.innerWidth <= 768 ? 20 : 30;
    const nextImages = imagePool.slice(poolIndex, poolIndex + itemsPerPage);
    
    if (nextImages.length > 0) {
      setImages(prev => [...prev, ...nextImages]);
      setPoolIndex(prev => prev + itemsPerPage);
      
      // Check if pool exhausted
      const remainingImages = imagePool.length - (poolIndex + itemsPerPage);
      if (remainingImages <= 0) {
        setHasMore(false);
        setPoolExhausted(true);
      }
    } else {
      setHasMore(false);
      setPoolExhausted(true);
    }
    
    setLoading(false);
  }, [imagePool, poolIndex, poolExhausted, loading]);

  // Intersection Observer for infinite scroll
  const observerRef = useRef();
  const lastImageElementRef = useCallback(node => {
    if (loading) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        console.log('🔄 Loading more images...');
        loadMoreFromPool();
      }
    });
    if (node) observerRef.current.observe(node);
  }, [loading, hasMore, loadMoreFromPool]);

  useEffect(() => {
    if (imagePool.length === 0) {
      initializeImagePool();
    }
    // Also fetch available users for admin mode
    if (isAdminMode && availableUsers.length === 0) {
      fetchAvailableUsers();
    }
  }, [imagePool.length, initializeImagePool, isAdminMode, availableUsers.length, fetchAvailableUsers]);

  // Floating back button visibility
  useEffect(() => {
    const floatingButton = document.getElementById('floating-back-gallery');
    const originalButton = document.querySelector('a[href="/dashboard"]');

    const handleScroll = () => {
      if (floatingButton && originalButton) {
        const originalRect = originalButton.getBoundingClientRect();
        const isOriginalVisible = originalRect.bottom > 0;
        
        if (isOriginalVisible) {
          floatingButton.style.opacity = '0';
          floatingButton.style.pointerEvents = 'none';
        } else {
          floatingButton.style.opacity = '1';
          floatingButton.style.pointerEvents = 'auto';
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const filteredImages = useMemo(() => {
    if (!images || !Array.isArray(images)) return [];
    if (filter === 'all') return images;
    
    // In admin mode, filter by username; in normal mode, filter by generation_type
    if (isAdminMode) {
      return images.filter(img => img && img.username === filter);
    } else {
      return images.filter(img => img && img.generation_type === filter);
    }
  }, [images, filter, isAdminMode]);

  const handleImageClick = (image) => {
    setSelectedImage(image);
    
    // Mobile-optimized scroll prevention without position manipulation
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
    
    // Store scroll position for restoration (but don't apply positioning)
    const scrollY = window.scrollY;
    document.documentElement.style.setProperty('--scroll-y', `${scrollY}px`);
  };

  const closeModal = () => {
    setSelectedImage(null);
    setIsFullscreen(false);
    
    // Restore body scroll when modal is closed
    document.body.style.overflow = '';
    document.body.classList.remove('modal-open');
    
    // Restore scroll position
    const scrollY = document.documentElement.style.getPropertyValue('--scroll-y');
    if (scrollY) {
      document.documentElement.style.removeProperty('--scroll-y');
      window.scrollTo(0, parseInt(scrollY, 10));
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const getImageNumber = (filename, generationType) => {
    if (!filename || generationType === 'single') return null;
    
    // Extract number from filename like "nano-banana-4x-3-1764109853661.webp"
    const match = filename.match(/nano-banana-\w+-(\d+)-\d+\.(webp|jpg|png|avif)/);
    if (match) {
      const imageNum = parseInt(match[1]);
      const total = generationType === '4x' ? 4 : 10;
      return { current: imageNum, total };
    }
    return null;
  };

  const openImage = (imageUrl) => {
    window.open(imageUrl, '_blank');
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

  // Throttled image error handler to prevent scroll-blocking state updates
  const handleImageError = useCallback((imageId) => {
    if (!componentMountedRef.current || scrolling) return;
    console.error(`Failed to load image: ${imageId}`);
    // Defer state update to avoid blocking scroll
    requestIdleCallback(() => {
      if (componentMountedRef.current) {
        setImageErrors(prev => new Set([...prev, imageId]));
      }
    });
  }, [scrolling]);

  // Throttled image load handler to prevent scroll-blocking state updates
  const handleImageLoad = useCallback((imageId) => {
    if (!componentMountedRef.current || scrolling) return;
    // Defer state update to avoid blocking scroll
    requestIdleCallback(() => {
      if (componentMountedRef.current) {
        setImageErrors(prev => {
          const newSet = new Set(prev);
          newSet.delete(imageId);
          return newSet;
        });
      }
    });
  }, [scrolling]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  }, [closeModal]);

  useEffect(() => {
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

  // Scroll detection for iPhone Safari optimization
  useEffect(() => {
    let scrollTimeout = null;
    
    const handleScroll = () => {
      setScrolling(true);
      
      // Clear existing timeout
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
        scrollTimeout = null;
      }
      
      // Debounce scroll end detection
      scrollTimeout = setTimeout(() => {
        setScrolling(false);
        scrollTimeout = null;
      }, 200);
    };
    
    // Use passive listener for better scroll performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
        scrollTimeout = null;
      }
    };
  }, []);
  
  // Debounced mobile resize detection for performance
  useEffect(() => {
    const handleResize = () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = setTimeout(() => {
        if (componentMountedRef.current) {
          setIsMobile(window.innerWidth <= 768);
        }
      }, 200); // Increased debounce for better performance
    };
    
    // Set initial value
    setIsMobile(window.innerWidth <= 768);
    
    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, []);

  // Mobile swipe navigation with scroll-aware optimization
  useEffect(() => {
    if (!isMobile || !componentMountedRef.current) {
      return;
    }

    try {
      const swipeHandler = new SwipeHandler({
        minSwipeDistance: 120,
        maxVerticalMovement: 60, // Reduced to prevent scroll conflicts
        maxSwipeTime: 800, // Reduced for quicker response
        minVelocity: 0.4, // Increased to prevent accidental triggers
        edgeThreshold: 40, // Increased edge protection
        maxTransform: 10, // Reduced visual feedback during scroll
        maxOpacity: 0.1,
        transformThreshold: 35, // Increased threshold
        feedbackDuration: 200, // Faster feedback
        navigationDelay: 100, // Faster navigation
        debug: false,
        
        onSwipeRight: () => {
          if (componentMountedRef.current && !selectedImage && !scrolling) {
            setIsNavigating(true);
            navigate('/dashboard');
          }
        },
        
        onSwipeStart: () => {
          if (!selectedImage && !scrolling) {
            console.log('Gallery swipe gesture started');
          }
        },
        
        onSwipeCancel: () => {
          console.log('Gallery swipe gesture cancelled');
        }
      });

      swipeHandlerRef.current = swipeHandler;
      // Only attach to gallery container to avoid scroll conflicts
      if (galleryContainerRef.current) {
        swipeHandler.attach(galleryContainerRef.current);
      }

      return () => {
        if (swipeHandlerRef.current) {
          try {
            swipeHandlerRef.current.detach(galleryContainerRef.current);
          } catch (error) {
            console.warn('Error detaching swipe handler:', error);
          }
          swipeHandlerRef.current = null;
        }
      };
    } catch (error) {
      console.error('Error setting up swipe handler:', error);
    }
  }, [isMobile, navigate, selectedImage, scrolling]);

  // Comprehensive cleanup on component unmount
  useEffect(() => {
    return () => {
      componentMountedRef.current = false;
      
      // Clean up all timeouts
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Clean up intersection observer
      if (intersectionObserverRef.current) {
        intersectionObserverRef.current.disconnect();
      }
      
      // Clean up swipe handler
      if (swipeHandlerRef.current) {
        try {
          swipeHandlerRef.current.detach(galleryContainerRef.current);
        } catch (error) {
          console.warn('Error cleaning up swipe handler:', error);
        }
      }
      
      // Reset scroll state
      setScrolling(false);
      
      // Clear image error state to free memory
      setImageErrors(new Set());
    };
  }, []);

  return (
    <div 
      className={scrolling ? 'scrolling' : ''}
      style={{ 
        minHeight: '100vh',
        background: 'hsl(var(--background))',
        padding: '20px',
        color: 'hsl(var(--foreground))',
        // iPhone Safari optimizations
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain'
      }}
    >
      {/* Header */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        marginBottom: '24px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          background: 'hsl(var(--card))',
          backdropFilter: 'blur(20px)',
          padding: '12px 16px',
          borderRadius: '16px',
          border: '1px solid hsl(var(--border))',
        }}>
          <Link 
            to="/dashboard"
            style={{ 
              color: 'hsl(var(--foreground))',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.3s ease',
              padding: '6px 10px',
              borderRadius: '8px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'hsl(var(--muted) / 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            ← Zurück
          </Link>
        </div>
      </div>

      {/* Title Section */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto 30px auto',
        background: 'hsl(var(--card))',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        padding: '25px',
        border: '1px solid hsl(var(--border))'
      }}>
        <div>
          <h1 style={{ 
            margin: '0 0 8px 0', 
            fontSize: '36px', 
            fontWeight: '700', 
            color: 'hsl(47 100% 65%)',
            background: 'linear-gradient(135deg, hsl(47 100% 65%), hsl(280 70% 60%))',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {isAdminMode ? 'User Galerie (Admin)' : 'Meine Bilder'}
          </h1>
          <p style={{ 
            margin: 0, 
            fontSize: '14px', 
            color: 'hsl(var(--muted-foreground))' 
          }}>
            Alle deine generierten Bilder auf einen Blick
          </p>
        </div>

        {/* Filter Buttons */}
        <div style={{ 
          marginTop: isMobile ? '15px' : '20px',
          display: 'flex',
          gap: isMobile ? '6px' : '8px',
          flexWrap: 'wrap',
          justifyContent: isMobile ? 'center' : 'flex-start'
        }}>
          {(() => {
            if (isAdminMode) {
              // Admin mode: dynamic user filters based on actual users in database
              return [
                { key: 'all', label: 'Alle User', count: images.length },
                ...availableUsers.map(username => ({
                  key: username,
                  label: username,
                  count: userImageCounts[username] || 0
                }))
              ];
            } else {
              // Normal mode: filter by generation types
              return [
                { key: 'all', label: 'Alle', count: images.length },
                { key: 'single', label: 'Einzeln', count: images.filter(img => img.generation_type === 'single').length },
                { key: '4x', label: '4x', count: images.filter(img => img.generation_type === '4x').length },
                { key: '10x', label: '10x', count: images.filter(img => img.generation_type === '10x').length }
              ];
            }
          })().map(filterOption => (
            <button
              key={filterOption.key}
              onClick={() => setFilter(filterOption.key)}
              style={{
                padding: isMobile ? '6px 12px' : '8px 16px',
                fontSize: isMobile ? '12px' : '13px',
                border: 'none',
                borderRadius: '20px',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.2s',
                background: filter === filterOption.key 
                  ? 'hsl(var(--primary))' 
                  : 'hsl(var(--muted) / 0.3)',
                color: filter === filterOption.key 
                  ? 'hsl(var(--primary-foreground))' 
                  : 'hsl(var(--foreground))'
              }}
            >
              {filterOption.label} ({filterOption.count})
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {loading ? (
          <div style={{
            background: 'hsl(var(--card))',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '60px',
            textAlign: 'center',
            border: '1px solid hsl(var(--border))'
          }}>
            <p style={{ color: 'hsl(var(--foreground))', margin: 0, fontSize: '18px' }}>
              Lade Bilder...
            </p>
          </div>
        ) : filteredImages.length === 0 ? (
          <div style={{
            background: 'hsl(var(--card))',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '60px',
            textAlign: 'center',
            border: '1px solid hsl(var(--border))'
          }}>
            <h2 style={{ color: 'hsl(var(--foreground))', margin: '0 0 16px 0', fontSize: '20px' }}>
              Keine Bilder gefunden
            </h2>
            <p style={{ 
              color: 'hsl(var(--muted-foreground))', 
              margin: '0 0 24px 0',
              fontSize: '16px' 
            }}>
              {filter === 'all' 
                ? 'Du hast noch keine Bilder generiert.' 
                : `Keine ${filter}-Bilder vorhanden.`}
            </p>
            <Link 
              to="/nono-banana"
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                background: 'linear-gradient(135deg, hsl(47 100% 65%), hsl(280 70% 60%))',
                color: 'hsl(var(--primary-foreground))',
                textDecoration: 'none',
                borderRadius: '12px',
                fontWeight: '600',
                fontSize: '14px'
              }}
            >
              Erstes Bild generieren
            </Link>
          </div>
        ) : (
          <>
            {/* iPhone Safari-Optimized Images Grid */}
            <div 
              ref={galleryContainerRef}
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)',
                gap: '2px',
                marginBottom: '40px',
                // iPhone Safari scroll performance optimizations
                transform: 'translate3d(0, 0, 0)', // Force hardware acceleration
                WebkitBackfaceVisibility: 'hidden',
                WebkitPerspective: '1000',
                WebkitTransform: 'translate3d(0, 0, 0)',
                willChange: scrolling ? 'auto' : 'transform' // Dynamic will-change
              }}
            >
              {filteredImages.map((image, index) => {
                if (!image || !image.id) {
                  console.warn('Gallery: Found invalid image data', image);
                  return null;
                }
                const isLast = filteredImages.length === index + 1;
                return (
                <div
                  key={image.id}
                  ref={isLast ? lastImageElementRef : null}
                  style={{
                    position: 'relative',
                    aspectRatio: '3/4',
                    cursor: (isNavigating || scrolling) ? 'default' : 'pointer',
                    pointerEvents: (isNavigating || scrolling) ? 'none' : 'auto',
                    overflow: 'hidden',
                    // iPhone Safari optimizations
                    transform: 'translate3d(0, 0, 0)',
                    WebkitBackfaceVisibility: 'hidden',
                    // Disable hover effects during scroll for performance
                    transition: scrolling ? 'none' : 'transform 0.2s ease'
                  }}
                  onClick={() => handleImageClick(image)}
                >
                  {imageErrors.has(image.id) ? (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(135deg, hsl(var(--muted)) 0%, hsl(var(--muted-foreground) / 0.1) 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'hsl(var(--muted-foreground))',
                      fontSize: '12px',
                      textAlign: 'center',
                      padding: '8px'
                    }}>
                      📷<br/>Bild konnte<br/>nicht geladen<br/>werden
                    </div>
                  ) : (
                    <LazyImage
                      src={image.result_image_url}
                      alt={`Generated ${image.generation_type}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        // Disable transitions during scroll for iPhone Safari performance
                        transition: scrolling ? 'none' : 'transform 0.2s ease',
                        // Hardware acceleration for images
                        transform: 'translate3d(0, 0, 0)',
                        WebkitBackfaceVisibility: 'hidden'
                      }}
                      onMouseEnter={(e) => {
                        // Disable hover effects during scroll and on mobile
                        if (!scrolling && !isMobile) {
                          e.target.style.transform = 'scale(1.05) translate3d(0, 0, 0)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!scrolling && !isMobile) {
                          e.target.style.transform = 'translate3d(0, 0, 0)';
                        }
                      }}
                      onError={() => handleImageError(image.id)}
                      onLoad={() => handleImageLoad(image.id)}
                      loading="lazy"
                      decoding="async"
                      // More aggressive prioritization for mobile
                      fetchpriority={index < (isMobile ? 6 : 8) ? 'high' : 'low'}
                    />
                  )}
                </div>
                );
              })}
            </div>
            
            {/* Loading indicator for infinite scroll */}
            {loading && hasMore && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '40px',
                fontSize: '14px',
                color: '#666'
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid #f3f3f3',
                  borderTop: '2px solid #666',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginRight: '10px'
                }}></div>
                Lade weitere Bilder...
              </div>
            )}
            
            {!hasMore && images.length > 0 && (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                fontSize: '14px',
                color: '#888'
              }}>
                🎉 Alle deine Kunstwerke geladen!
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal für großes Bild */}
      {selectedImage && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            backdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.2s ease',
            // iPhone Safari modal optimizations
            WebkitOverflowScrolling: 'touch',
            transform: 'translate3d(0, 0, 0)',
            WebkitBackfaceVisibility: 'hidden'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) { // More reliable check for backdrop click
              closeModal();
            }
          }}
        >
          <div style={{
            background: 'hsl(var(--card))',
            borderRadius: '20px',
            padding: '0',
            maxWidth: '90vw',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'slideUp 0.2s ease',
            border: '1px solid hsl(var(--border))'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid hsl(var(--border))',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ 
                margin: 0, 
                color: 'hsl(var(--foreground))',
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: '600'
              }}>
                {selectedImage.generation_type === 'single' ? 'Einzelne' :
                 selectedImage.generation_type === '4x' ? '4x' : '10x'} Generierung
                {(() => {
                  const imageNumber = getImageNumber(selectedImage.original_filename, selectedImage.generation_type);
                  return imageNumber ? (
                    <span style={{ 
                      fontWeight: 'normal', 
                      fontSize: '0.8em', 
                      color: 'hsl(var(--muted-foreground))',
                      marginLeft: '12px'
                    }}>
                      {imageNumber.current} von {imageNumber.total}
                    </span>
                  ) : null;
                })()}
              </h3>
              <button
                onClick={closeModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '18px',
                  cursor: 'pointer',
                  color: 'hsl(var(--muted-foreground))',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✖
              </button>
            </div>

            {/* Image */}
            {imageErrors.has(selectedImage.id) ? (
              <div style={{
                maxWidth: '100%',
                maxHeight: isMobile ? '40vh' : '60vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, hsl(var(--muted)) 0%, hsl(var(--muted-foreground) / 0.1) 100%)',
                color: 'hsl(var(--muted-foreground))',
                fontSize: '16px',
                textAlign: 'center',
                padding: '40px',
                borderRadius: '12px',
                margin: '20px'
              }}>
                <div>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📷</div>
                  <div>Bild konnte nicht geladen werden</div>
                  <div style={{ fontSize: '14px', opacity: 0.7, marginTop: '8px' }}>
                    Möglicherweise ist das Bild beschädigt oder nicht mehr verfügbar
                  </div>
                </div>
              </div>
            ) : (
              <img
                src={selectedImage.result_image_url}
                alt="Generated Image"
                onClick={toggleFullscreen}
                style={{
                  maxWidth: '100%',
                  maxHeight: isMobile ? '40vh' : '60vh',
                  objectFit: 'contain',
                  cursor: 'zoom-in',
                  transition: 'all 0.3s ease',
                  ...(isFullscreen && {
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    maxWidth: '100vw',
                    maxHeight: '100vh',
                    objectFit: 'contain',
                    background: 'rgba(0, 0, 0, 0.95)',
                    zIndex: 1000000,
                    borderRadius: 0,
                    cursor: 'zoom-out'
                  })
                }}
                onError={() => handleImageError(selectedImage.id)}
                onLoad={() => handleImageLoad(selectedImage.id)}
              />
            )}

            {/* Modal Info */}
            <div style={{ padding: '20px', borderTop: '1px solid hsl(var(--border))' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'hsl(var(--muted-foreground))' }}>
                {new Date(selectedImage.created_at).toLocaleString('de-DE')}
              </p>
              {selectedImage.prompt && (
                <p style={{ 
                  margin: '0 0 16px 0', 
                  fontSize: '14px', 
                  color: 'hsl(var(--foreground))', 
                  lineHeight: '1.4',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical'
                }}>
                  <strong>Prompt:</strong> {selectedImage.prompt}
                </p>
              )}
              
              <div style={{ 
                display: 'flex', 
                gap: '12px', 
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openImage(selectedImage.result_image_url);
                  }}
                  style={{
                    padding: isMobile ? '10px 8px' : '12px 24px',
                    background: 'hsl(var(--secondary))',
                    color: 'hsl(var(--secondary-foreground))',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    fontSize: isMobile ? '12px' : '14px',
                    flex: isMobile ? '1' : 'initial',
                    minWidth: isMobile ? '40%' : 'initial',
                    maxWidth: isMobile ? '48%' : 'initial'
                  }}
                >
                  Im neuen Tab öffnen
                </button>
                {selectedImage.prompt && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyPrompt(selectedImage.prompt);
                    }}
                    style={{
                      padding: isMobile ? '10px 8px' : '12px 24px',
                      background: 'hsl(var(--primary))',
                      color: 'hsl(var(--primary-foreground))',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '500',
                      fontSize: isMobile ? '12px' : '14px',
                      flex: isMobile ? '1' : 'initial',
                      minWidth: isMobile ? '40%' : 'initial',
                      maxWidth: isMobile ? '48%' : 'initial'
                    }}
                  >
                    {copySuccess ? '✅ Copied!' : '📋 Copy Prompt'}
                  </button>
                )}
                <button
                  onClick={closeModal}
                  style={{
                    padding: isMobile ? '10px 8px' : '12px 24px',
                    background: 'hsl(var(--muted))',
                    width: isMobile ? '100%' : 'initial',
                    marginTop: isMobile ? '8px' : '0',
                    color: 'hsl(var(--muted-foreground))',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    fontSize: '14px'
                  }}
                >
                  Schließen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>
        {`
          /* iPhone Safari Scroll Performance Optimizations */
          * {
            /* Improve scroll performance on iOS */
            -webkit-overflow-scrolling: touch;
            /* Prevent iOS bounce scrolling issues */
            overscroll-behavior: contain;
          }
          
          /* Optimize touch targets for mobile */
          @media (max-width: 768px) {
            img {
              /* Force GPU layer for smooth scrolling */
              transform: translate3d(0, 0, 0);
              -webkit-backface-visibility: hidden;
              /* Disable image drag on mobile to prevent scroll conflicts */
              -webkit-user-drag: none;
              -webkit-touch-callout: none;
            }
            
            /* Reduce motion during scroll for better performance */
            .scrolling img {
              transition: none !important;
              transform: translate3d(0, 0, 0) !important;
            }
          }
          
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes slideUp {
            from { 
              transform: translate3d(0, 20px, 0);
              opacity: 0;
            }
            to { 
              transform: translate3d(0, 0, 0);
              opacity: 1;
            }
          }
        `}
      </style>

      {/* Floating Back Button */}
      {ReactDOM.createPortal(
        <Link 
          to="/dashboard" 
          id="floating-back-gallery"
          style={{
            position: 'fixed',
            top: '24px',
            right: '27px',
            zIndex: 1000,
            opacity: '0',
            pointerEvents: 'none',
            
            // Glassmorphism styling
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            padding: isMobile ? '12px 15px' : '12px 18px',
            color: 'hsl(var(--foreground))',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '14px',
            transition: 'opacity 0.3s ease',
            minWidth: isMobile ? '100px' : 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ← Zurück
        </Link>,
        document.body
      )}

    </div>
  );
}

export default GalleryPage;