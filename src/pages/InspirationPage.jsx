import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { supabase } from '../lib/supabase';
import './InspirationPage.css';

function InspirationPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const observerRef = useRef();
  const lastImageElementRef = useCallback(node => {
    if (loading) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        console.log('🔄 Loading more images...');
        setPage(prev => prev + 1);
      }
    });
    if (node) observerRef.current.observe(node);
  }, [loading, hasMore]);

  const fetchImages = useCallback(async (pageNumber) => {
    try {
      setLoading(true);
      console.log('🎨 Fetching page:', pageNumber);
      
      const itemsPerPage = 30;
      const from = (pageNumber - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      
      const { data, error } = await supabase
        .from('generations')
        .select('*')
        .not('result_image_url', 'is', null)
        .not('result_image_url', 'eq', '')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const newImages = data || [];
      console.log('📊 Fetched:', newImages.length, 'images for page', pageNumber);
      
      if (pageNumber === 1) {
        setImages(newImages);
      } else {
        setImages(prev => [...prev, ...newImages]);
      }
      
      setHasMore(newImages.length === itemsPerPage);
      
    } catch (error) {
      console.error('❌ Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImages(page);
  }, [page, fetchImages]);

  // Helper functions
  const getUserDisplayName = (username) => username || 'Anonymous';
  
  const classifyImage = (dimensions, index) => {
    if (!dimensions) return { sizeClass: 'square size-1x1', classification: 'square', ratio: 1 };
    
    const [width, height] = dimensions.split('x').map(Number);
    if (!width || !height) return { sizeClass: 'square size-1x1', classification: 'square', ratio: 1 };
    
    const ratio = width / height;
    
    // Mobile-First Tetris: Mehr 1x1 für 4 Spalten Layout
    const mobileVariations = {
      landscape: ['landscape size-1x1', 'landscape size-2x1'], // Meist 1 Spalte
      portrait: ['portrait size-1x2', 'portrait size-1x1'],    // Meist 1 Spalte hoch
      square: ['square size-1x1', 'square size-2x1', 'square size-1x1', 'square size-1x1'] // 75% sind 1x1
    };
    
    if (ratio > 1.3) {
      // Landscape - 80% sind 1x1 (4 pro Reihe), 20% sind 2x1 (2 pro Reihe) 
      const landscapeSize = index % 5 === 0 ? mobileVariations.landscape[1] : mobileVariations.landscape[0];
      return { sizeClass: landscapeSize, classification: 'landscape', ratio };
    }
    if (ratio < 0.7) {
      // Portrait - meist 1 Spalte breit aber 2 hoch
      const portraitSize = index % 3 === 0 ? mobileVariations.portrait[1] : mobileVariations.portrait[0];
      return { sizeClass: portraitSize, classification: 'portrait', ratio };
    }
    // Square - 75% sind 1x1 für echtes 4-Spalten Layout
    const squareIndex = index % 4;
    const squareSize = mobileVariations.square[squareIndex];
    return { sizeClass: squareSize, classification: 'square', ratio };
  };

  const handleImageClick = (image) => setSelectedImage(image);
  const closeModal = () => {
    setSelectedImage(null);
    setIsFullscreen(false);
  };

  const copyPromptAndGenerate = (prompt) => {
    navigator.clipboard.writeText(prompt);
    navigate('/nono-banana', { 
      state: { 
        promptText: prompt,
        fromInspiration: true 
      } 
    });
  };

  return (
    <div className="inspiration-page">
      <div className="page-header">
        <h1 className="page-title">Community Inspiration Gallery</h1>
        <p className="page-subtitle">Discover amazing creations from our creative community</p>
      </div>

      <div className="masonry-gallery">
        {images.map((img, index) => {
          const { classification, ratio } = classifyImage(img.dimensions, index);
          const isLast = images.length === index + 1;
          
          // FIXED 8-PATTERN REPEATING TETRIS SYSTEM (from good commit b3b438a)
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
          
          return (
            <div
              key={img.id}
              ref={isLast ? lastImageElementRef : null}
              className={`masonry-item ${sizeClass}`}
              data-classification={classification}
              data-ratio={ratio.toFixed(2)}
              data-index={index}
              onClick={() => handleImageClick(img)}
            >
              <img
                src={img.result_image_url}
                className="masonry-image"
                alt={`Inspiration by ${getUserDisplayName(img.username)} - ${classification}`}
                loading="lazy"
              />
              <div className="image-overlay">
                <div className="image-info">
                  <div className="masonry-user">
                    <span className="user-icon">👤</span>
                    <span className="username">{getUserDisplayName(img.username)}</span>
                  </div>
                  {img.prompt_text && (
                    <div className="masonry-actions">
                      <button 
                        className="copy-prompt-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyPromptAndGenerate(img.prompt_text);
                        }}
                      >
                        Use This Prompt
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {loading && (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Loading beautiful creations...</p>
        </div>
      )}

      {!hasMore && images.length > 0 && (
        <div className="end-message">
          <p>You've seen all the amazing creations! 🎨</p>
        </div>
      )}

      {/* Modal for image preview */}
      {selectedImage && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedImage.result_image_url}
              alt={`Creation by ${getUserDisplayName(selectedImage.username)}`}
              className="modal-image"
            />
            <div className="modal-info">
              <p><strong>By:</strong> {getUserDisplayName(selectedImage.username)}</p>
              {selectedImage.prompt_text && (
                <>
                  <p><strong>Prompt:</strong></p>
                  <p className="prompt-text">{selectedImage.prompt_text}</p>
                  <button 
                    className="modal-copy-btn"
                    onClick={() => copyPromptAndGenerate(selectedImage.prompt_text)}
                  >
                    Use This Prompt →
                  </button>
                </>
              )}
            </div>
            <button className="modal-close" onClick={closeModal}>×</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default InspirationPage;