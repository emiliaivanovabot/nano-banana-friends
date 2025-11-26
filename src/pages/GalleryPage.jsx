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
  const [copySuccess, setCopySuccess] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

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
      background: 'hsl(var(--background))',
      padding: '20px',
      color: 'hsl(var(--foreground))'
    }}>
      {/* Header */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto 30px auto',
        background: 'hsl(var(--card))',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        padding: '25px',
        border: '1px solid hsl(var(--border))'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start'
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
              Meine Bilder
            </h1>
            <p style={{ 
              margin: 0, 
              fontSize: '14px', 
              color: 'hsl(var(--muted-foreground))' 
            }}>
              Alle deine generierten Bilder auf einen Blick
            </p>
          </div>
          
          <Link 
            to="/dashboard"
            style={{
              background: 'hsl(var(--secondary) / 0.3)',
              border: '1px solid hsl(var(--border))',
              borderRadius: '12px',
              padding: window.innerWidth <= 768 ? '12px 15px' : '12px 18px',
              color: 'hsl(var(--foreground))',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '14px',
              transition: 'all 0.3s ease',
              minWidth: window.innerWidth <= 768 ? '100px' : 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ← Zurück
          </Link>
        </div>

        {/* Filter Buttons */}
        <div style={{ 
          marginTop: window.innerWidth <= 768 ? '15px' : '20px',
          display: 'flex',
          gap: window.innerWidth <= 768 ? '6px' : '8px',
          flexWrap: 'wrap',
          justifyContent: window.innerWidth <= 768 ? 'center' : 'flex-start'
        }}>
          {[
            { key: 'all', label: 'Alle', count: images.length },
            { key: 'single', label: 'Einzeln', count: images.filter(img => img.generation_type === 'single').length },
            { key: '4x', label: '4x', count: images.filter(img => img.generation_type === '4x').length },
            { key: '10x', label: '10x', count: images.filter(img => img.generation_type === '10x').length }
          ].map(filterOption => (
            <button
              key={filterOption.key}
              onClick={() => setFilter(filterOption.key)}
              style={{
                padding: window.innerWidth <= 768 ? '6px 12px' : '8px 16px',
                fontSize: window.innerWidth <= 768 ? '12px' : '13px',
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
            {/* Instagram-style Images Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: window.innerWidth <= 768 ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)',
              gap: '2px',
              marginBottom: '40px'
            }}>
              {filteredImages.map((image) => (
                <div
                  key={image.id}
                  style={{
                    position: 'relative',
                    aspectRatio: '3/4',
                    cursor: 'pointer',
                    overflow: 'hidden'
                  }}
                  onClick={() => openImageModal(image)}
                >
                  <img
                    src={image.result_image_url}
                    alt={`Generated ${image.generation_type}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'scale(1)';
                    }}
                  />
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
            <img
              src={selectedImage.result_image_url}
              alt="Generated Image"
              onClick={toggleFullscreen}
              style={{
                maxWidth: '100%',
                maxHeight: window.innerWidth <= 768 ? '40vh' : '60vh',
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
                  zIndex: 9999,
                  borderRadius: 0,
                  cursor: 'zoom-out'
                })
              }}
            />

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
                    padding: window.innerWidth <= 768 ? '10px 8px' : '12px 24px',
                    background: 'hsl(var(--secondary))',
                    color: 'hsl(var(--secondary-foreground))',
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
                  Im neuen Tab öffnen
                </button>
                {selectedImage.prompt && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyPrompt(selectedImage.prompt);
                    }}
                    style={{
                      padding: window.innerWidth <= 768 ? '10px 8px' : '12px 24px',
                      background: 'hsl(var(--primary))',
                      color: 'hsl(var(--primary-foreground))',
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
                    {copySuccess ? '✅ Copied!' : '📋 Copy Prompt'}
                  </button>
                )}
                <button
                  onClick={closeModal}
                  style={{
                    padding: window.innerWidth <= 768 ? '10px 8px' : '12px 24px',
                    background: 'hsl(var(--muted))',
                    width: window.innerWidth <= 768 ? '100%' : 'initial',
                    marginTop: window.innerWidth <= 768 ? '8px' : '0',
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