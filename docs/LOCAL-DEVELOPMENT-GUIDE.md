# 🍌 Nano Banana Friends - Lokaler Development Guide

## Übersicht
Dieses Projekt befindet sich in der lokalen Entwicklungsphase. Alle Backups und Versionskontrolle erfolgen lokal, OHNE GitHub Push.

## 📁 Backup-Struktur

```
../nano-banana-backups/
├── 2025-11/                     # Monatliche Ordner
│   ├── nano-banana-friends-2025-11-24_13-28-45/  # Vollbackups mit Zeitstempel
│   ├── nano-banana-friends-2025-11-24_15-30-12/
│   └── nano-banana-friends-2025-11-24.zip        # Optional: ZIP-Archive
├── bare-repos/                  # Effiziente Git-Backups
│   └── nano-banana-friends-backup.git/
└── README.md                    # Backup-Dokumentation
```

## 🔧 Verfügbare Commands

### Backup Commands
```bash
# Einfaches Backup ohne Commit
./backup-local.sh

# Backup mit vorherigem Commit
./backup-local.sh --commit

# Backup mit ZIP-Archiv für externe Speicherung
./backup-local.sh --commit --zip

# Git Aliases (nach Setup)
git backup          # Einfaches Backup
git backup-commit   # Backup mit Commit
git backup-zip      # Backup mit ZIP
```

### Development Commands
```bash
# Aktuellen Status prüfen
git st              # Alias für git status
git local-status    # Porcelain Status

# Branch Management
git br              # Alias für git branch
git local-branches  # Detaillierte Branch-Info

# Commit History
git local-log       # Grafische Log-Anzeige
git changes-since-backup  # Änderungen seit letztem Backup
```

## 🌿 Branch-Strategie

### Hauptbranches
- `main` - Stabile Hauptversion
- `development` - Aktive Entwicklung
- `experimental` - Tests und Experimente

### Feature Branches
- `feature/auth-enhancements` - Authentication-Verbesserungen
- `feature/ui-redesign` - UI/UX Verbesserungen
- `feature/performance` - Performance-Optimierungen

### Workflow
1. **Neue Features**: `git checkout -b feature/feature-name`
2. **Entwicklung**: Arbeiten auf Feature Branch
3. **Backup**: Regelmäßig `./backup-local.sh --commit`
4. **Merge**: `git checkout development && git merge feature/feature-name`
5. **Release**: `git checkout main && git merge development`

## 🛡️ Sicherheitsmaßnahmen

### Git-Schutz
- Push zu Origin ist deaktiviert (`pushurl = "PUSH_DISABLED"`)
- Automatische Backups bei jedem wichtigen Commit
- Bare Repository für effiziente Versionskontrolle

### Datenschutz
- Alle Backups bleiben lokal
- Keine sensitive Daten in Git (siehe `.gitignore`)
- Environment Variables nicht getrackt

## 📊 Entwicklungsstatus Tracking

### Tägliche Routine
1. **Start**: `git st` - Status prüfen
2. **Arbeit**: Features entwickeln
3. **Zwischenspeicher**: `git add . && git commit -m "WIP: beschreibung"`
4. **Backup**: `./backup-local.sh`
5. **Ende**: Finalen Commit mit `./backup-local.sh --commit`

### Wöchentliche Wartung
1. **Backup-Größe prüfen**: `du -sh ../nano-banana-backups/`
2. **Alte Backups aufräumen**: Automatisch durch Script
3. **Branch-Cleanup**: Nicht mehr benötigte Feature-Branches löschen
4. **Projektgröße prüfen**: `du -sh . --exclude=node_modules`

## 🚀 Ready für GitHub? (Zukunft)

Wenn das Projekt bereit für GitHub ist:

1. **Cleanup**: Sensitive Daten entfernen
2. **Documentation**: README und Docs vervollständigen
3. **Testing**: Alle Features testen
4. **Remote Setup**: 
   ```bash
   git remote set-url origin https://github.com/username/nano-banana-friends.git
   git config --unset-all remote.origin.pushurl
   git push -u origin main
   ```

## 📞 Troubleshooting

### Backup Problems
```bash
# Backup-Verzeichnis prüfen
ls -la ../nano-banana-backups/

# Backup Script testen
./backup-local.sh --help

# Git Status reset
git reset --soft HEAD~1  # Letzten Commit rückgängig (VORSICHTIG!)
```

### Git Issues
```bash
# Branch-Status prüfen
git branch -vv

# Uncommitted Changes stashen
git stash push -m "Temporärer Stash"
git stash pop

# Bare Repo neu erstellen
rm -rf ../nano-banana-backups/bare-repos/nano-banana-friends-backup.git
./backup-local.sh  # Erstellt automatisch neues Bare Repo
```

## 💡 Best Practices

1. **Häufige Backups**: Mindestens bei jedem Feature-Abschluss
2. **Beschreibende Commits**: Klare Commit-Messages
3. **Branch-Hygiene**: Feature-Branches nach Merge löschen
4. **Dokumentation**: Wichtige Änderungen dokumentieren
5. **Testing**: Vor jedem Backup testen

---
*Erstellt am: 2025-11-24*
*Letztes Update: Backup System Setup*