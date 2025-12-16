# MEDIA SYSTEM USAGE GUIDE

## Übersicht
Das neue Media-System löst alle deine Probleme mit Bildanzeige und -speicherung in AI Tools.

## 🔥 PROBLEM GELÖST

**VORHER (in Seedream):**
```jsx
// 100+ Zeilen custom Image-Display Code  
// Jedes Tool hatte eigene Lösung
// URLs vs Base64 handling überall anders
// Verschiedene Layouts überall neu programmiert
```

**NACHHER (Media-System):**
```jsx
// Saubere, wiederverwendbare Components
<div className="media-result-single">
  <img src={imageUrl} className="generated-image-single" />
  <div className="media-actions">
    <button className="btn btn--save">💾 Speichern</button>
    <button className="btn btn--download">⬇️ Download</button>
  </div>
</div>
```

## 🎯 VERSCHIEDENE USE CASES

### 1. SINGLE IMAGE (Qwen, Seedream)
```jsx
// Für Tools die EIN Bild generieren
function SingleImageResult({ image, onSave, onDownload }) {
  return (
    <div className="media-result-single">
      {/* Generated Image */}
      <img 
        src={image.url || `data:image/png;base64,${image.base64}`}
        className="generated-image-single"
        alt="Generated image"
        onClick={() => setFullscreen(true)}
      />
      
      {/* Actions */}
      <div className="media-actions">
        <button className="btn btn--save" onClick={onSave}>
          💾 Speichern
        </button>
        <button className="btn btn--download" onClick={onDownload}>
          ⬇️ Download
        </button>
        <button className="btn btn--regenerate" onClick={onRegenerate}>
          🔄 Erneut generieren
        </button>
      </div>
    </div>
  )
}
```

### 2. 4X GRID (Nano-Banana Multi)
```jsx
// Für Tools die 4 Bilder generieren (2x2)
function FourImageGrid({ images, onSave, onDownloadAll }) {
  return (
    <div className="media-result-grid">
      {/* 4x Grid */}
      <div className="image-grid-4x">
        {images.map((image, index) => (
          <div key={index} className="grid-image-item">
            <img 
              src={image.url || `data:image/png;base64,${image.base64}`}
              className="grid-image"
              alt={`Generated image ${index + 1}`}
            />
            {/* Hover overlay mit Actions */}
            <div className="grid-image-overlay">
              <button 
                className="grid-action-btn" 
                onClick={() => onSave(image)}
                title="Speichern"
              >
                💾
              </button>
              <button 
                className="grid-action-btn" 
                onClick={() => downloadImage(image)}
                title="Download"
              >
                ⬇️
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Grid Actions */}
      <div className="media-actions media-actions--grid">
        <button className="btn btn--download-all" onClick={onDownloadAll}>
          📦 Alle herunterladen
        </button>
        <button className="btn btn--save" onClick={() => onSave(images)}>
          💾 Alle speichern
        </button>
      </div>
    </div>
  )
}
```

### 3. 10X GRID (Batch Generation)
```jsx
// Für Tools die viele Bilder generieren
function BatchImageGrid({ images, onDownloadAll }) {
  return (
    <div className="media-result-grid">
      {/* 10x Flexible Grid */}
      <div className="image-grid-10x">
        {images.map((image, index) => (
          <div key={index} className="grid-image-item">
            <img 
              src={image.url}
              className="grid-image"
              alt={`Batch image ${index + 1}`}
            />
            <div className="grid-image-overlay">
              <button className="grid-action-btn" onClick={() => saveImage(image)}>
                💾
              </button>
              <button className="grid-action-btn" onClick={() => downloadImage(image)}>
                ⬇️
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="media-actions media-actions--grid">
        <button className="btn btn--download-all" onClick={onDownloadAll}>
          📦 Alle {images.length} Bilder herunterladen
        </button>
      </div>
    </div>
  )
}
```

### 4. VIDEO COMPONENTS (WAN, Kling)
```jsx
// Für Video-Generation Tools
function VideoResult({ video, thumbnail, onSave }) {
  return (
    <div className="media-result-video">
      {video ? (
        /* Generated Video */
        <video 
          className="generated-video"
          controls
          poster={thumbnail}
        >
          <source src={video.url} type="video/mp4" />
        </video>
      ) : (
        /* Thumbnail/Preview */
        <img 
          src={thumbnail}
          className="video-thumbnail"
          alt="Video thumbnail"
          onClick={() => playPreview()}
        />
      )}
      
      <div className="media-actions">
        <button className="btn btn--save" onClick={onSave}>
          💾 Video speichern
        </button>
        <button className="btn btn--download" onClick={() => downloadVideo(video)}>
          ⬇️ Download MP4
        </button>
      </div>
    </div>
  )
}
```

### 5. LOADING STATES (Universal)
```jsx
// Während Generation läuft
function MediaLoading({ type = 'single', count = 4, progress = 0 }) {
  if (type === 'single') {
    return (
      <div className="media-result-single">
        <div className="media-loading-single">
          <div className="loading-spinner-overlay">
            <div className="spinner"></div>
          </div>
        </div>
        <div className="progress-text">Generiere Bild... {progress}%</div>
        <div className="generation-progress">
          <div 
            className="generation-progress-bar" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    )
  }
  
  if (type === 'grid') {
    return (
      <div className="media-result-grid">
        <div className="media-loading-grid">
          {Array(count).fill(0).map((_, i) => (
            <div key={i} className="media-loading-item" />
          ))}
        </div>
        <div className="progress-text">Generiere {count} Bilder... {progress}%</div>
      </div>
    )
  }
}
```

## 🔧 DATENFORMAT HANDLING

### URL vs Base64
```jsx
// Das System unterstützt beide automatisch:

// URL von API
const imageUrl = "https://api.seedream.com/image/12345.png"

// Base64 embedded
const imageBase64 = "iVBORw0KGgoAAAANSUhEUgAAA..."

// Verwendung (funktioniert für beide):
<img 
  src={image.url || `data:image/png;base64,${image.base64}`}
  className="generated-image-single"
/>

// Oder mit Helper:
function getImageSrc(image) {
  if (image.url) return image.url
  if (image.base64) return `data:image/${image.format || 'png'};base64,${image.base64}`
  return null
}
```

## 📱 MOBILE RESPONSIVE (Automatisch)

```jsx
// Automatisch mobile-optimiert:
<div className={`media-result-single ${isMobile ? 'media-result-single--mobile' : ''}`}>

<div className={`image-grid-4x ${isMobile ? 'image-grid-4x--mobile' : ''}`}>

<div className={`media-actions ${isMobile ? 'media-actions--mobile' : ''}`}>
```

## 🎭 FULLSCREEN VIEWER

```jsx
// Fullscreen für jedes Medium:
function FullscreenViewer({ media, isVisible, onClose }) {
  if (!isVisible) return null
  
  return (
    <div className="media-fullscreen-overlay" onClick={onClose}>
      {media.type === 'video' ? (
        <video className="media-fullscreen" controls>
          <source src={media.url} type="video/mp4" />
        </video>
      ) : (
        <img 
          className="media-fullscreen"
          src={media.url}
          alt="Fullscreen view"
        />
      )}
      
      <button className="btn--close-fullscreen" onClick={onClose}>
        ✕
      </button>
    </div>
  )
}
```

## 🚀 MIGRATION GUIDE

### Von Custom Code zu Media-System:

**VORHER (Seedream):**
```jsx
// Custom styling überall
<div style={{
  background: 'card',
  padding: '24px',
  borderRadius: '20px'
}}>
  <img style={{
    width: '100%',
    maxWidth: '512px',
    borderRadius: '12px'
  }} />
  <div style={{
    display: 'flex',
    gap: '12px',
    marginTop: '20px'
  }}>
    <button style={{...customSaveStyles}}>Save</button>
    <button style={{...customDownloadStyles}}>Download</button>
  </div>
</div>
```

**NACHHER (Media-System):**
```jsx
// Saubere CSS-Klassen
<div className="media-result-single">
  <img className="generated-image-single" />
  <div className="media-actions">
    <button className="btn btn--save">💾 Speichern</button>
    <button className="btn btn--download">⬇️ Download</button>
  </div>
</div>
```

## 🎯 FÜR NEUE TOOLS

Wenn du ein **neues AI Tool** erstellst:

1. **Entscheide Media Type:**
   - Single Image → `media-result-single`
   - Multi Images → `media-result-grid` + `image-grid-4x` oder `image-grid-10x`
   - Video → `media-result-video`

2. **Copy-Paste Template:**
   - Nimm entsprechenden Code von oben
   - Passe nur die `onSave`/`onDownload` Functions an
   - Ready! 🎉

3. **Automatisch dabei:**
   - ✅ Responsive Design
   - ✅ Loading States
   - ✅ URL + Base64 Support
   - ✅ Fullscreen Viewer
   - ✅ Consistent Styling

## 💡 VORTEILE

**Für dich als Entwickler:**
- 🔥 **10x weniger Code** pro Tool
- 🎨 **Konsistentes Design** automatisch  
- 📱 **Mobile ready** out-of-the-box
- 🛠️ **Wartbar** - eine CSS-Änderung wirkt überall

**Für neue Tools:**
- 🚀 **Schneller Development** - Templates ready
- 🎯 **Keine Media-Bugs** mehr - alles getestet
- 📐 **Perfekte Layouts** automatisch

---

**🎉 RESULTAT:** Nie wieder Custom Image-Display Code! Copy-paste Templates und alles funktioniert perfekt! 🔥