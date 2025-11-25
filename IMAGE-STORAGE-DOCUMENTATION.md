# Image Storage & Gallery System - Dokumentation

## Problem Statement

**User Experience Issue:** Benutzer verlieren generierte Bilder wenn sie vor lauter Freude ein neues Bild generieren, bevor sie das vorherige heruntergeladen haben.

**Solution:** Automatisches Speichern aller generierten Bilder mit integrierter Gallery und Verlauf-Funktion.

## Geplante Features

### 1. Automatisches Bild-Speichern
- **Trigger**: Nach jeder erfolgreichen Bildgenerierung (1x, 4x, 10x)
- **Storage**: Boertlay Server (gleicher Host wie Community Prompts)
- **Format**: Originale Base64 → PNG/JPEG Dateien
- **Naming**: `user_{id}_{timestamp}_{type}.png` (z.B. `user_123_1703123456_single.png`)

### 2. User Gallery
- **Location**: Neuer Menüpunkt "Meine Bilder" oder Teil des Profils
- **Display**: Grid-Layout mit Thumbnails
- **Sorting**: Neueste zuerst, optional nach Datum/Typ filtern
- **Actions**: Download, Teilen, Löschen

### 3. Verlauf auf Generierungsseite ✅ SPEZIFIKATION
- **Location**: Ganz unten auf NonoBananaPage (unter den Generation-Results)
- **Display**: "Letzte 20 Bilder" als kleine Thumbnails in horizontaler Scroll-Leiste
- **Layout**: Chronologisch sortiert (neuestes links), responsive horizontal scroll
- **Interaction**: 
  - Klick auf Thumbnail → Bild wird groß angezeigt (Modal/Popup)
  - Download-Button im großen View verfügbar
  - Auto-Update nach jeder neuen Generierung
- **Model-spezifisch**: User sieht nur Bilder vom eigenen Model (jessy.germany sieht nur ihre Bilder)
- **Performance**: Lazy loading für Thumbnails, Live Updates nach Generierung
- **Layout Konzept**:
  ```
  [Generierungs-Interface]
  [Aktuelle Results]
  
  ─────────────────────────
  Letzte 20 Bilder
  ─────────────────────────
  [🖼️][🖼️][🖼️][🖼️][🖼️][🖼️] →
  ```

## Technical Architecture

### Storage Strategy: Boertlay FTP

#### Warum Boertlay?
- ✅ **Bereits vorhanden**: Community Prompts funktionieren dort
- ✅ **Bewährte URLs**: `https://boertlay.de/user_pics/...` funktioniert
- ✅ **Einfacher Upload**: Standard FTP/SFTP
- ✅ **Kostengünstig**: Keine zusätzlichen Cloud-Kosten
- ✅ **Keine komplexe API**: Direkte Dateiübertragung

#### FTP Connection Details ✅ GETESTET
- **Host**: `ftp.boertlay.de`
- **User**: `boertlay.de_16pud23l77w`
- **Port**: `21` (Standard FTP)
- **Encryption**: None (Plain FTP)
- **Base URL**: `https://boertlay.de`

#### Folder Structure ✅ IMPLEMENTIERT
```
/httpdocs/user_pics/generated/
  /emilia-berlin/          # Model-spezifische Ordner
    /2025/
      /11/                 # Year/Month for organization
        single_1703123456.png
        4x_1703123500_1.png
        4x_1703123500_2.png
        10x_1703123600_1.png
  /emilia-ivanova/
    /2025/11/
  /jessy-germany/
    /2025/11/
  /tyra-foxi/
    /2025/11/
  /selina/
    /2025/11/
  /test-user/              # Für Tests
    /2025/11/
```

#### Implementation Status ✅ GETESTET
- **FTP Upload**: ✅ Funktioniert perfekt
- **Ordnerstruktur**: ✅ Alle Model-Ordner erstellt
- **Public URLs**: ✅ Zugänglich unter `https://boertlay.de/user_pics/generated/{model}/{year}/{month}/{filename}`
- **Test Upload**: ✅ Erfolgreich (`test_1764092819297_8f8pxqkoq.png`)
- **Dependencies**: ✅ Installiert (`formidable`, `basic-ftp`)

### Database Schema Extension

#### Neue Tabelle: `user_images`
```sql
CREATE TABLE user_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_id VARCHAR(50) NOT NULL,        -- 'emilia-berlin', 'jessy-germany', etc.
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  original_filename TEXT,
  generation_type VARCHAR(10) NOT NULL, -- 'single', '4x', '10x'
  generation_batch_id UUID,             -- Group 4x/10x images together
  prompt_used TEXT,
  settings_used JSONB,                  -- {resolution, aspect_ratio, personalization}
  file_size_kb INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_user_images_model_id (model_id),
  INDEX idx_user_images_created (created_at DESC),
  INDEX idx_user_images_batch (generation_batch_id)
);
```

#### RLS Policy
```sql
-- WICHTIG: Kein Login-System in diesem Projekt!
-- Users sind bereits authentifiziert über bestehendes System
-- RLS Policy basiert auf aktuell eingeloggtem User
CREATE POLICY user_images_policy ON user_images
FOR ALL USING (model_id = current_user_model_id());
```

### Implementation Flow

#### 1. Upload Process ⚠️ TODO: Integration in Generation Functions
```javascript
// After successful generation in generateImage/generate4Images/generate10Images
const uploadImages = async (results, generationType, currentUser) => {
  const batchId = crypto.randomUUID()
  
  for (const [index, result] of results.entries()) {
    if (result.success && result.image) {
      // Convert base64 to file
      const imageFile = base64ToFile(result.image, `${generationType}_${Date.now()}_${index}.png`)
      
      // Upload to Boertlay via FTP (using modelId from current user)
      const imageUrl = await uploadToBoertlay(imageFile, currentUser.modelId)
      
      // Save to database
      await supabase.from('user_images').insert({
        model_id: currentUser.modelId,
        image_url: imageUrl,
        generation_type: generationType,
        generation_batch_id: batchId,
        prompt_used: prompt,
        settings_used: {
          resolution,
          aspect_ratio: aspectRatio,
          personalization: showPersonalization
        }
      })
    }
  }
}

// TODO: Integration in:
// - generateImage() → single image upload
// - generate4Images() → batch upload 4 images  
// - generate10Images() → batch upload 10 images
```

#### 2. FTP Upload Function ✅ IMPLEMENTIERT
```javascript
const uploadToBoertlay = async (file, modelId) => {
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substr(2, 9)
  const filename = `${modelId}_${timestamp}_${randomId}.png`
  
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const remotePath = `/httpdocs/user_pics/generated/${modelId}/${year}/${month}/`
  
  const formData = new FormData()
  formData.append('file', file)
  formData.append('path', remotePath)
  formData.append('filename', filename)
  
  const response = await fetch('/api/upload-image', {
    method: 'POST',
    body: formData
  })
  
  const result = await response.json()
  return result.url // Returns: https://boertlay.de/user_pics/generated/{model}/{year}/{month}/{filename}
}

// ✅ GETESTET: Funktioniert mit allen 5 Models
// Models: emilia-berlin, emilia-ivanova, jessy-germany, tyra-foxi, selina
```
```

#### 3. Gallery Component
```javascript
// New component: UserGallery.jsx
const UserGallery = () => {
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const loadUserImages = async () => {
      const { data } = await supabase
        .from('user_images')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)
      
      setImages(data)
      setLoading(false)
    }
    
    loadUserImages()
  }, [])
  
  return (
    <div className="user-gallery">
      <h2>Meine Bilder</h2>
      <div className="image-grid">
        {images.map(image => (
          <ImageCard key={image.id} image={image} />
        ))}
      </div>
    </div>
  )
}
```

#### 4. Recent Images Verlauf Component ✅ DETAILLIERTE SPEZIFIKATION
```javascript
// Add to NonoBananaPage.jsx - ganz unten nach den Generation Results
const RecentImagesHistory = ({ currentUser }) => {
  const [recentImages, setRecentImages] = useState([])
  const [selectedImage, setSelectedImage] = useState(null)
  
  useEffect(() => {
    const loadRecent = async () => {
      const { data } = await supabase
        .from('user_images')
        .select('*')
        .eq('model_id', currentUser.modelId)  // Model-spezifisch!
        .order('created_at', { ascending: false })
        .limit(20)
      
      setRecentImages(data)
    }
    
    loadRecent()
  }, [currentUser.modelId])
  
  const openImageModal = (image) => {
    setSelectedImage(image)
  }
  
  const closeModal = () => {
    setSelectedImage(null)
  }
  
  const downloadImage = (imageUrl, filename) => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = filename || 'generated-image.png'
    link.click()
  }
  
  return (
    <>
      <div className="recent-images-history">
        <h3>Letzte 20 Bilder</h3>
        <div className="thumbnails-scroll">
          {recentImages.map(img => (
            <img 
              key={img.id}
              src={img.image_url} 
              className="thumbnail"
              onClick={() => openImageModal(img)}
              loading="lazy"
              alt="Recent generated image"
            />
          ))}
        </div>
      </div>
      
      {/* Modal für großes Bild */}
      {selectedImage && (
        <div className="image-modal" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <img src={selectedImage.image_url} alt="Generated Image" />
            <div className="modal-actions">
              <button onClick={() => downloadImage(selectedImage.image_url, selectedImage.original_filename)}>
                📥 Download
              </button>
              <button onClick={closeModal}>✖ Schließen</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Integration in NonoBananaPage:
// Ganz unten, nach allen Generation Results
<RecentImagesHistory currentUser={currentUser} />
```

#### CSS Styling für Recent Images History:
```css
.recent-images-history {
  margin-top: 40px;
  border-top: 1px solid #e0e0e0;
  padding-top: 20px;
}

.recent-images-history h3 {
  margin-bottom: 15px;
  color: #333;
  font-size: 1.2rem;
}

.thumbnails-scroll {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 10px 0;
  scrollbar-width: thin;
}

.thumbnail {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s ease;
  flex-shrink: 0;
  border: 2px solid transparent;
}

.thumbnail:hover {
  transform: scale(1.05);
  border-color: #007bff;
}

.image-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 12px;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.modal-content img {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  border-radius: 8px;
}

.modal-actions {
  margin-top: 20px;
  display: flex;
  gap: 15px;
}

.modal-actions button {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.modal-actions button:first-child {
  background: #007bff;
  color: white;
}

.modal-actions button:first-child:hover {
  background: #0056b3;
}

.modal-actions button:last-child {
  background: #6c757d;
  color: white;
}

.modal-actions button:last-child:hover {
  background: #545b62;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .thumbnail {
    width: 60px;
    height: 60px;
  }
  
  .modal-content {
    padding: 15px;
  }
  
  .modal-actions button {
    padding: 8px 16px;
    font-size: 12px;
  }
}
```

## Testing Plan

### Phase 1: FTP Upload Test
```javascript
// Simple Node.js test script
const testBoertlayUpload = async () => {
  const testImage = "data:image/png;base64,iVBORw0KG..." // Small test image
  const result = await uploadToBoertlay(testImage, 'test-user')
  
  console.log('Upload successful:', result)
  console.log('URL accessible:', await fetch(result).then(r => r.ok))
}
```

### Phase 2: Integration Test
1. Generate single image → Auto-save to Boertlay
2. Check database entry created
3. Verify URL is accessible
4. Test 4x and 10x batch uploads

### Phase 3: UI Testing
1. Gallery page loads user images
2. Recent images sidebar updates after generation
3. Download functionality works
4. Mobile responsive design

## File Organization

### New Files to Create
```
src/
  components/
    UserGallery.jsx           # Main gallery component
    ImageCard.jsx             # Individual image display
    RecentImages.jsx          # Sidebar with recent images
  utils/
    imageUpload.js            # FTP upload utilities
    imageStorage.js           # Database operations
  pages/
    UserGalleryPage.jsx       # Full gallery page
api/
  upload-image.js             # Backend FTP handler
```

## Configuration

### Environment Variables
```env
# Boertlay FTP Settings
BOERTLAY_FTP_HOST=your-host
BOERTLAY_FTP_USER=your-username
BOERTLAY_FTP_PASSWORD=your-password
BOERTLAY_FTP_PORT=21
BOERTLAY_BASE_URL=https://boertlay.com
```

### Security Considerations
- ✅ **User Isolation**: Each user's images in separate folders
- ✅ **RLS Enabled**: Database-level access control
- ✅ **File Validation**: Only PNG/JPEG uploads
- ✅ **Size Limits**: Max file size restrictions
- ✅ **Rate Limiting**: Prevent spam uploads

## Rollout Strategy

### Phase 1: Basic Upload (Week 1)
- Implement FTP upload for single images
- Database schema and basic storage
- Simple testing interface

### Phase 2: Multi-Image Support (Week 2)
- Support 4x and 10x batch uploads
- Batch grouping in database
- Error handling and retry logic

### Phase 3: Gallery UI (Week 3)
- User gallery page
- Recent images sidebar
- Mobile responsive design

### Phase 4: Advanced Features (Week 4)
- Image sharing functionality
- Bulk download options
- Search and filtering

## Cost Analysis

### Storage Requirements
- **Average Image**: 2-3MB per generated image
- **Active User**: ~50 images/month = 150MB
- **1000 Users**: 150GB/month additional storage
- **Boertlay Cost**: Depends on hosting plan (likely minimal)

### Implementation Time
- **FTP Upload Setup**: 1-2 days
- **Database Schema**: 1 day
- **Basic Gallery**: 2-3 days
- **Recent Images Integration**: 1 day
- **Testing & Polish**: 2-3 days
- **Total**: ~1-2 weeks

## Success Metrics

### User Retention
- **Reduced Download Anxiety**: Users don't panic about losing images
- **Increased Usage**: Users experiment more knowing images are saved
- **Session Length**: Longer sessions with gallery browsing

### Technical Success
- **Upload Success Rate**: >95% successful uploads
- **Load Times**: Gallery loads in <2 seconds
- **Storage Efficiency**: Proper file organization and cleanup

## Conclusion

This image storage system solves the critical UX issue of lost generated images while providing valuable user engagement features. Using Boertlay as storage is the most practical solution given existing infrastructure.

**Next Steps:**
1. Test FTP upload to Boertlay
2. Implement basic storage for single images
3. Extend to 4x/10x support
4. Build gallery UI
5. Integrate recent images sidebar

The system is designed for scalability and can handle thousands of users with proper organization and cleanup processes.