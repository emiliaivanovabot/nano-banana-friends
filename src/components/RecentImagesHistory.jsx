import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './RecentImagesHistory.css';

const RecentImagesHistory = ({ currentUser }) => {
  const [recentImages, setRecentImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!currentUser?.username) return;

    const loadRecentImages = async () => {
      try {
        setLoading(true);
        
        console.log('Loading recent images for:', currentUser?.username);
        
        const { data, error } = await supabase
          .from('generations')
          .select('*')
          .eq('username', currentUser.username)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) {
          console.error('Error loading recent images:', error);
          return;
        }

        setRecentImages(data || []);
      } catch (error) {
        console.error('Error loading recent images:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRecentImages();
  }, [currentUser?.username]);

  const openImageModal = (image) => {
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

  if (!currentUser?.username) {
    return (
      <div className="recent-images-history">
        <h3>Deine letzten 20 Bilder</h3>
        <div className="no-images-container">
          <p>Benutzer wird geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="recent-images-history">
        <div className="recent-images-header">
          <h3>Deine letzten 20 Bilder</h3>
          <Link 
            to="/gallery" 
            className="gallery-link-button"
          >
            Zur Galerie
          </Link>
        </div>
        
        {loading ? (
          <div className="loading-container">
            <p>Lade Bilder...</p>
          </div>
        ) : recentImages.length === 0 ? (
          <div className="no-images-container">
            <p>Noch keine Bilder generiert. Erstelle dein erstes Bild!</p>
          </div>
        ) : (
          <div className="thumbnails-scroll">
            {recentImages.map((img) => (
              <img
                key={img.id}
                src={img.result_image_url}
                className="thumbnail"
                onClick={() => openImageModal(img)}
                loading="lazy"
                alt={`Generated image from ${img.created_at}`}
                title={`${img.generation_type} - ${new Date(img.created_at).toLocaleDateString()}`}
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
                {selectedImage.generation_type === 'single' ? 'Einzelne' :
                 selectedImage.generation_type === '4x' ? '4x' : '10x'} Generierung
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
              alt="Generated Image"
              className={isFullscreen ? "modal-image fullscreen-image" : "modal-image"}
              onClick={toggleFullscreen}
              style={{ cursor: 'pointer' }}
            />
            
            <div className="modal-info">
              <p className="modal-date">
                {new Date(selectedImage.created_at).toLocaleString('de-DE')}
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
                    {copySuccess ? '✅ Copied!' : '📋 Copy Prompt'}
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

export default RecentImagesHistory;