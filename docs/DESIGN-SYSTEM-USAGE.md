# DESIGN SYSTEM USAGE GUIDE

## Übersicht
Das neue Design-System ersetzt inline styles durch wiederverwendbare CSS-Klassen für konsistentes Design.

## Problem Gelöst
**VORHER (Chaos):**
```jsx
// Jede Seite hatte eigene inline styles
<div style={{
  minHeight: '100vh',
  background: 'hsl(var(--background))',
  padding: '20px',
  color: 'hsl(var(--foreground))'
}}>
  <div style={{
    background: 'hsl(var(--card))',
    borderRadius: '24px',
    padding: '20px',
    border: '2px solid hsl(var(--border))'
  }}>
    <h1 style={{
      fontSize: isMobile ? '18px' : '22px',
      fontWeight: '600',
      color: 'hsl(0 0% 50%)'
    }}>
      neuronalworks
    </h1>
  </div>
</div>
```

**NACHHER (Design-System):**
```jsx
// Saubere, wiederverwendbare Klassen
<div className="page-container page-container--centered">
  <div className="content-wrapper">
    <h1 className="app-brand">
      neuronalworks
    </h1>
  </div>
</div>
```

## Verfügbare Component-Klassen

### 🏗️ Layout Components
```jsx
// Page Container (Ersetzt: minHeight, background, padding)
<div className="page-container page-container--centered">

// Content Wrapper (Ersetzt: card background, border, shadow)  
<div className="content-wrapper content-wrapper--glass">

// Page Header (Ersetzt: header flex layout)
<div className="page-header">
```

### 🎨 Typography Components
```jsx
// App Branding
<h1 className="app-brand">neuronalworks</h1>

// Page Title mit Gradient
<h2 className="page-title">Hallo {user}! 🍌</h2>

// Subtitle
<p className="page-subtitle">Wähle dein AI Tool</p>
```

### 🎯 Button Components
```jsx
// Primary Button (Gradient)
<button className="btn btn--primary">
  <Settings size={18} />
  Einstellungen
</button>

// Secondary Button
<Link to="/settings" className="btn btn--secondary btn--mobile">
  Settings
</Link>

// Destructive Button
<button className="btn btn--destructive" onClick={logout}>
  Abmelden  
</button>
```

### 🃏 Card Components
```jsx
// Tool Card
<Link to="/qwen" className="tool-card tool-card--qwen">
  <h3>Qwen</h3>
  <p>AI Image Editor</p>
</Link>

// Stat Card
<div className="stat-card">
  <div className="stat-header">
    <span>📊</span>
    <h3 className="stat-title">Heute</h3>
  </div>
</div>
```

### 📝 Form Components
```jsx
<div className="form-group">
  <label className="form-label">Prompt</label>
  <textarea className="form-textarea" placeholder="Beschreibe dein Bild..."/>
</div>
```

## CSS Custom Properties (Design Tokens)

### 🎨 Farben Ändern
```css
/* Um die Background-Farbe GLOBAL zu ändern: */
:root {
  --background: 240 15% 5%;  /* Dunkler */
  --background: 240 8% 12%;  /* Heller */
}

/* Tool-spezifische Farben: */
:root {
  --nano-banana: #yellow-new-color;
  --qwen: #blue-new-color;
}
```

### 📏 Spacing & Größen
```css
:root {
  --container-padding: 30px;    /* Mehr Padding */
  --radius-card: 30px;          /* Rundere Cards */
  --text-4xl: 32px;            /* Größere Titel */
}
```

### 🎭 Tool-Card Farben
```css
.tool-card--nano-banana {
  background: var(--nano-banana);
}

.tool-card--qwen {
  background: var(--qwen);
}
```

## Migration Guide

### Schritt 1: Inline Style identifizieren
```jsx
// VORHER: Inline Style
<div style={{
  background: 'hsl(var(--card))',
  borderRadius: '25px',
  padding: '20px 30px'
}}>
```

### Schritt 2: Entsprechende Klasse finden
```jsx
// NACHHER: Design-System Klasse
<div className="card">
```

### Schritt 3: Mobile Varianten nutzen  
```jsx
// VORHER: Conditional inline styles
<div style={{
  padding: isMobile ? '16px 20px' : '20px 30px',
  borderRadius: isMobile ? '16px' : '25px'
}}>

// NACHHER: CSS Media Queries automatisch
<div className={`card ${isMobile ? 'card--mobile' : ''}`}>
```

## Häufige Patterns

### Dashboard Header
```jsx
// Alt: 50+ Zeilen inline styles
// Neu: 
<div className="page-header">
  <div>
    <h1 className="app-brand">neuronalworks</h1>
    <h2 className="page-title">Hallo {getFirstName(user?.username)}! 🍌</h2>
    <p className="page-subtitle">Wähle dein AI Tool und ab gehts</p>
  </div>
  
  <div className="flex gap-3">
    <Link to="/settings" className="btn btn--secondary btn--mobile">
      <Settings size={18} />
      <span className="desktop-only">Einstellungen</span>
    </Link>
    <button onClick={handleLogout} className="btn btn--destructive btn--mobile">
      <LogOut size={18} />
      <span className="desktop-only">Abmelden</span>  
    </button>
  </div>
</div>
```

### Tool Cards Grid
```jsx
<div className="grid">
  {tools.map((tool) => (
    <Link
      key={tool.id}
      to={tool.path}
      className={`tool-card tool-card--${tool.id} ${isMobile ? 'tool-card--mobile' : ''}`}
    >
      <h3>{tool.title}</h3>
      <p>{tool.subtitle}</p>
    </Link>
  ))}
</div>
```

### Stats Container
```jsx
<div className="stats-container">
  <div className="stat-card">
    <div className="stat-header">
      <span>📊</span>
      <h3 className="stat-title">Heute</h3>
    </div>
    {/* Stats content */}
  </div>
</div>
```

## Vorteile

### 🎯 Für Entwickler
- **Weniger Code**: `className="btn btn--primary"` statt 15 Zeilen inline styles
- **Konsistenz**: Alle Buttons sehen gleich aus
- **Wartbarkeit**: Eine Änderung wirkt global
- **Mobile-ready**: Responsive automatisch inkludiert

### 🎨 Für Design
- **Globale Änderungen**: Background-Farbe in tokens.css → alle Seiten update
- **Theme-Support**: Einfach neue Color-Themes erstellen
- **Konsistente Abstände**: Alle Cards haben gleiche border-radius

### 🚀 Für Performance  
- **CSS Caching**: Styles werden gecacht, nicht neu berechnet
- **Kleinere Bundle**: Weniger duplicate inline styles
- **Bessere DevTools**: CSS Classes sind im Inspector sichtbar

## Quick Reference

### Layout
- `page-container` - Main page wrapper
- `content-wrapper` - Card container
- `page-header` - Header section

### Typography  
- `app-brand` - App name
- `page-title` - Main title with gradient  
- `page-subtitle` - Subtitle text

### Buttons
- `btn btn--primary` - Primary action
- `btn btn--secondary` - Secondary action
- `btn btn--destructive` - Delete/logout

### Cards
- `card` - Basic card
- `tool-card tool-card--{toolname}` - Tool cards
- `stat-card` - Statistics card

### Utilities
- `flex`, `items-center`, `justify-between` - Flexbox
- `gap-2`, `gap-3`, `gap-4` - Spacing
- `mobile-only`, `desktop-only` - Responsive visibility
- `mb-2`, `mt-3` - Margins

## Migration Priority

### 1. Hochfrequente Components (Sofort)
- DashboardPage Header
- Tool Cards
- Button Components

### 2. Form Components (Nächste)
- Input Fields
- Textareas  
- Form Groups

### 3. Spezifische Pages (Später)
- Tool-spezifische Styling
- Complex Layouts
- Animations

---

**🔥 RESULTAT:** Anstelle von hunderten Zeilen inline styles pro Page, hast du jetzt saubere, wiederverwendbare CSS-Klassen die ALLES vereinheitlichen!

**🎯 NEXT STEPS:**
1. Teste die neuen Klassen in DashboardPage
2. Migriere weitere Pages schrittweise  
3. Passe Design Tokens nach deinen Wünschen an