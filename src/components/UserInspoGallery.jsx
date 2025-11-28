import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './UserInspoGallery.css';

const UserInspoGallery = ({ currentUser }) => {
  const [inspoImages, setInspoImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadInspoImages = async () => {
    try {
      setLoading(refreshing ? false : true); // Don't show loading if it's a refresh
      
      console.log('Loading inspiration images from community...');
      
      // Get quality images from all users (excluding current user)
      const { data, error } = await supabase
        .from('generations')
        .select('id, username, prompt, result_image_url, created_at, generation_type, original_filename')
        .neq('username', currentUser?.username || '') // Exclude current user
        .eq('status', 'completed')
        .not('result_image_url', 'is', null) // Ensure image exists
        .not('username', 'is', null) // Ensure username exists
        .order('created_at', { ascending: false })
        .limit(100); // Get more images to ensure fair user distribution

      if (error) {
        console.error('Error loading inspiration images:', error);
        return;
      }

      // Filter for quality images
      const qualityImages = data?.filter(img => 
        img.result_image_url && 
        img.prompt && 
        img.prompt.length > 10 && // Relaxed: 10+ chars instead of 15+
        img.username && 
        !img.prompt.toLowerCase().includes('test') && 
        !img.prompt.toLowerCase().includes('debug')
      ) || [];

      // Group images by username for fair distribution
      const imagesByUser = {};
      qualityImages.forEach(img => {
        if (!imagesByUser[img.username]) {
          imagesByUser[img.username] = [];
        }
        imagesByUser[img.username].push(img);
      });

      // Take max 14 random images per user for more variety in teaser
      const fairSelection = [];
      Object.keys(imagesByUser).forEach(username => {
        const userImages = imagesByUser[username];
        // Shuffle user's images and take up to 14
        const shuffledUserImages = userImages.sort(() => Math.random() - 0.5);
        fairSelection.push(...shuffledUserImages.slice(0, 14));
      });

      // Final shuffle of the fair selection and limit to 14 for display
      const shuffledImages = fairSelection
        .sort(() => Math.random() - 0.5)
        .slice(0, 14);

      console.log('🎨 User distribution:', Object.keys(imagesByUser).map(user => 
        `${user}: ${imagesByUser[user].length} images`
      ).join(', '));
      console.log('📊 Final selection: showing', shuffledImages.length, 'images from', 
        new Set(shuffledImages.map(img => img.username)).size, 'different users');

      setInspoImages(shuffledImages);
    } catch (error) {
      console.error('Error loading inspiration images:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInspoImages();
  }, [currentUser?.username]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for UX
    await loadInspoImages();
    setRefreshing(false);
  };

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

  const handleModalClick = (e) => {
    // Close modal when clicking outside the content
    if (e.target.className === 'image-modal') {
      closeModal();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  };

  // Utility function to get user display name from username
  const getUserDisplayName = (username) => {
    if (!username) return 'Community';
    // Convert username to display format (e.g., "emilia.berlin" -> "emilia.berlin")
    return username;
  };

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

  return (
    <>
      <div className="user-inspo-gallery">
        <div className="inspo-header">
          <h3>User Inspo</h3>
          <div className="inspo-subtitle">Community Inspiration</div>
          <Link 
            to="/inspiration"
            className="inspiration-link-button"
            title="Zur vollständigen Community Galerie"
          >
            Zur Galerie
          </Link>
        </div>
        
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Lade Inspiration...</p>
          </div>
        ) : inspoImages.length === 0 ? (
          <div className="no-images-container">
            <p>Keine Inspirationen verfügbar. Die Community erstellt gerade neue Kunstwerke!</p>
          </div>
        ) : (
          <div className="inspo-scroll">
            {inspoImages.map((img) => (
              <img
                key={img.id}
                src={img.result_image_url}
                className="inspo-thumbnail"
                onClick={() => handleImageClick(img)}
                loading="lazy"
                alt={`Inspiration by ${getUserDisplayName(img.username)}`}
                title={`${getUserDisplayName(img.username)} - ${new Date(img.created_at).toLocaleDateString()}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal für großes Bild */}
      {selectedImage && (
        <div className="image-modal" onClick={handleModalClick}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>
                Community Inspiration
                {(() => {
                  const imageNumber = getImageNumber(selectedImage.original_filename, selectedImage.generation_type);
                  return imageNumber ? (
                    <span style={{ 
                      fontWeight: 'normal', 
                      fontSize: '0.8em', 
                      color: '#666',
                      marginLeft: '8px'
                    }}>
                      {imageNumber.current} von {imageNumber.total}
                    </span>
                  ) : null;
                })()}
              </h4>
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

export default UserInspoGallery;