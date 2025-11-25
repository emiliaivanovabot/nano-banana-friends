import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import './RecentImagesHistory.css';

const RecentImagesHistory = ({ currentUser }) => {
  const [recentImages, setRecentImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);

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
  };

  const downloadImage = (imageUrl, filename) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename || 'generated-image.png';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyPrompt = (prompt) => {
    navigator.clipboard.writeText(prompt).then(() => {
      console.log('✅ Prompt copied to clipboard');
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
        <h3>Letzte 20 Bilder</h3>
        <div className="no-images-container">
          <p>Benutzer wird geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="recent-images-history">
        <h3>Letzte 20 Bilder</h3>
        
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
                {selectedImage.generation_type} Generierung
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
              className="modal-image"
            />
            
            <div className="modal-info">
              <p className="modal-date">
                {new Date(selectedImage.created_at).toLocaleString('de-DE')}
              </p>
              {selectedImage.prompt && (
                <p className="modal-prompt">
                  <strong>Prompt:</strong> {selectedImage.prompt.substring(0, 100)}
                  {selectedImage.prompt.length > 100 && '...'}
                </p>
              )}
            </div>
            
            <div className="modal-actions">
              <button 
                className="download-button"
                onClick={() => downloadImage(selectedImage.result_image_url, selectedImage.original_filename)}
              >
                📥 Download
              </button>
              {selectedImage.prompt && (
                <button 
                  className="copy-prompt-button"
                  onClick={() => copyPrompt(selectedImage.prompt)}
                >
                  📋 Copy Prompt
                </button>
              )}
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