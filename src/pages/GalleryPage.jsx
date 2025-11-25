import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { supabase } from '../lib/supabase';

function GalleryPage() {
  const { user } = useAuth();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'single', '4x', '10x'

  useEffect(() => {
    const loadImages = async () => {
      try {
        setLoading(true);
        
        // Use username directly as modelId (emilia.ivanova → emilia.ivanova)
        const currentModelId = user?.username || 'unknown';
        console.log('Loading gallery images for user:', user?.username, '→ modelId:', currentModelId);
        
        const { data, error } = await supabase
          .from('generations')
          .select('*')
          .eq('username', user?.username)
          .eq('status', 'completed')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading images:', error);
          setImages([]);
          return;
        }

        setImages(data || []);
      } catch (error) {
        console.error('Error loading images:', error);
      } finally {
        setLoading(false);
      }
    };

    loadImages();
  }, []); // Load images once when component mounts

  const filteredImages = images.filter(img => {
    if (filter === 'all') return true;
    return img.generation_type === filter;
  });

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

  // REMOVED: Bullshit Login Check - User is already authenticated!

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto 30px auto',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        borderRadius: '16px',
        padding: '20px',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ 
              margin: '0 0 8px 0', 
              fontSize: '24px', 
              fontWeight: '600', 
              color: 'white' 
            }}>
              🖼️ Meine Bilder
            </h1>
            <p style={{ 
              margin: 0, 
              fontSize: '14px', 
              color: 'rgba(255, 255, 255, 0.8)' 
            }}>
              Alle deine generierten Bilder auf einen Blick
            </p>
          </div>
          
          <Link 
            to="/dashboard"
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              padding: '10px 16px',
              color: 'white',
              textDecoration: 'none',
              fontWeight: '500',
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
          >
            ← Zurück zum Dashboard
          </Link>
        </div>

        {/* Filter Buttons */}
        <div style={{ 
          marginTop: '20px',
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          {[
            { key: 'all', label: '🖼️ Alle', count: images.length },
            { key: 'single', label: '🍌 Einzeln', count: images.filter(img => img.generation_type === 'single').length },
            { key: '4x', label: '🍌🍌🍌🍌 4x', count: images.filter(img => img.generation_type === '4x').length },
            { key: '10x', label: '🍌🍌🍌🍌🍌🍌🍌🍌🍌🍌 10x', count: images.filter(img => img.generation_type === '10x').length }
          ].map(filterOption => (
            <button
              key={filterOption.key}
              onClick={() => setFilter(filterOption.key)}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                border: 'none',
                borderRadius: '20px',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.2s',
                background: filter === filterOption.key 
                  ? 'rgba(255, 255, 255, 0.9)' 
                  : 'rgba(255, 255, 255, 0.2)',
                color: filter === filterOption.key 
                  ? '#333' 
                  : 'white'
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
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '60px',
            textAlign: 'center'
          }}>
            <p style={{ color: 'white', margin: 0, fontSize: '18px' }}>
              🔄 Lade Bilder...
            </p>
          </div>
        ) : filteredImages.length === 0 ? (
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '60px',
            textAlign: 'center'
          }}>
            <h2 style={{ color: 'white', margin: '0 0 16px 0', fontSize: '20px' }}>
              📭 Keine Bilder gefunden
            </h2>
            <p style={{ 
              color: 'rgba(255, 255, 255, 0.8)', 
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
                background: '#f97316',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: '500',
                fontSize: '14px'
              }}
            >
              🍌 Erstes Bild generieren
            </Link>
          </div>
        ) : (
          <>
            {/* Images Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '20px',
              marginBottom: '40px'
            }}>
              {filteredImages.map((image) => (
                <div
                  key={image.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => openImageModal(image)}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-4px)';
                    e.target.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <img
                    src={image.result_image_url}
                    alt={`Generated ${image.generation_type}`}
                    style={{
                      width: '100%',
                      height: '200px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      marginBottom: '12px'
                    }}
                  />
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 8px',
                      fontSize: '11px',
                      fontWeight: '600',
                      borderRadius: '12px',
                      background: image.generation_type === 'single' ? '#f97316' : 
                                 image.generation_type === '4x' ? '#10b981' : '#8b5cf6',
                      color: 'white'
                    }}>
                      {image.generation_type === 'single' ? '🍌 SINGLE' :
                       image.generation_type === '4x' ? '🍌🍌🍌🍌 4X' : '🍌🍌🍌🍌🍌🍌🍌🍌🍌🍌 10X'}
                    </span>
                    
                    <span style={{
                      fontSize: '11px',
                      color: 'rgba(255, 255, 255, 0.7)'
                    }}>
                      {new Date(image.created_at).toLocaleDateString('de-DE')}
                    </span>
                  </div>
                  
                  <p style={{
                    margin: 0,
                    fontSize: '13px',
                    color: 'rgba(255, 255, 255, 0.9)',
                    lineHeight: '1.4',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {image.prompt || 'Kein Prompt verfügbar'}
                  </p>
                </div>
              ))}
            </div>
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
            zIndex: 1000,
            backdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.2s ease'
          }}
          onClick={(e) => {
            if (e.target.style.position === 'fixed') {
              closeModal();
            }
          }}
        >
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '0',
            maxWidth: '90vw',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'slideUp 0.2s ease'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #eee',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, color: '#333' }}>
                {selectedImage.generation_type === 'single' ? '🍌 Einzelne Generierung' :
                 selectedImage.generation_type === '4x' ? '🍌🍌🍌🍌 4x Generierung' : '🍌🍌🍌🍌🍌🍌🍌🍌🍌🍌 10x Generierung'}
              </h3>
              <button
                onClick={closeModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '18px',
                  cursor: 'pointer',
                  color: '#666',
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
            <img
              src={selectedImage.result_image_url}
              alt="Generated Image"
              style={{
                maxWidth: '100%',
                maxHeight: '60vh',
                objectFit: 'contain'
              }}
            />

            {/* Modal Info */}
            <div style={{ padding: '20px', borderTop: '1px solid #eee' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#666' }}>
                {new Date(selectedImage.created_at).toLocaleString('de-DE')}
              </p>
              {selectedImage.prompt && (
                <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#333', lineHeight: '1.4' }}>
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
                  onClick={() => downloadImage(selectedImage.result_image_url, selectedImage.original_filename)}
                  style={{
                    padding: window.innerWidth <= 768 ? '10px 8px' : '12px 24px',
                    background: '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    fontSize: window.innerWidth <= 768 ? '12px' : '14px',
                    flex: window.innerWidth <= 768 ? '1' : 'initial',
                    minWidth: window.innerWidth <= 768 ? '40%' : 'initial',
                    maxWidth: window.innerWidth <= 768 ? '48%' : 'initial'
                  }}
                >
                  📥 Download
                </button>
                {selectedImage.prompt && (
                  <button
                    onClick={() => copyPrompt(selectedImage.prompt)}
                    style={{
                      padding: window.innerWidth <= 768 ? '10px 8px' : '12px 24px',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '500',
                      fontSize: window.innerWidth <= 768 ? '12px' : '14px',
                      flex: window.innerWidth <= 768 ? '1' : 'initial',
                      minWidth: window.innerWidth <= 768 ? '40%' : 'initial',
                      maxWidth: window.innerWidth <= 768 ? '48%' : 'initial'
                    }}
                  >
                    📋 Copy Prompt
                  </button>
                )}
                <button
                  onClick={closeModal}
                  style={{
                    padding: window.innerWidth <= 768 ? '10px 8px' : '12px 24px',
                    background: '#6b7280',
                    width: window.innerWidth <= 768 ? '100%' : 'initial',
                    marginTop: window.innerWidth <= 768 ? '8px' : '0',
                    color: 'white',
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
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes slideUp {
            from { 
              transform: translateY(20px);
              opacity: 0;
            }
            to { 
              transform: translateY(0);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
}

export default GalleryPage;