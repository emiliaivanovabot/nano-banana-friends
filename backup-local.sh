#!/bin/bash

# Nano Banana Friends - Lokales Backup Script
# Dieses Script erstellt automatische lokale Backups ohne GitHub Push

set -e

PROJECT_NAME="nano-banana-friends"
BACKUP_DIR="../nano-banana-backups"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
MONTH_DIR="$(date +%Y-%m)"

echo "🍌 Starte lokales Backup für $PROJECT_NAME..."

# 1. Aktuellen Git Status prüfen
echo "📊 Git Status prüfen..."
git status --short

# 2. Ungespeicherte Änderungen committen (falls gewünscht)
if [ "$1" = "--commit" ]; then
    echo "💾 Committe aktuelle Änderungen..."
    git add .
    read -p "Commit Nachricht eingeben: " commit_msg
    git commit -m "$commit_msg

🤖 Automatisches lokales Backup
Erstellt am: $(date)"
fi

# 3. Backup Verzeichnisse erstellen
mkdir -p "$BACKUP_DIR/$MONTH_DIR"
mkdir -p "$BACKUP_DIR/bare-repos"

# 4. Vollständiges Projektbackup
echo "📁 Erstelle Vollbackup..."
cp -r . "$BACKUP_DIR/$MONTH_DIR/${PROJECT_NAME}-${DATE}"

# 5. Bare Repository Update (für effiziente Backups)
BARE_REPO="$BACKUP_DIR/bare-repos/${PROJECT_NAME}-backup.git"
if [ ! -d "$BARE_REPO" ]; then
    echo "🔄 Erstelle Bare Repository..."
    git clone --bare . "$BARE_REPO"
else
    echo "🔄 Update Bare Repository..."
    cd "$BARE_REPO"
    git fetch origin
    cd - > /dev/null
fi

# 6. Backup in ZIP-Archiv (optional für externe Speicherung)
if [ "$2" = "--zip" ]; then
    echo "📦 Erstelle ZIP-Archiv..."
    cd "$BACKUP_DIR/$MONTH_DIR"
    zip -r "${PROJECT_NAME}-${DATE}.zip" "${PROJECT_NAME}-${DATE}" -x "*/node_modules/*" "*/.next/*" "*/.git/*"
    cd - > /dev/null
fi

# 7. Backup-Größe anzeigen
echo "📏 Backup-Größen:"
du -sh "$BACKUP_DIR/$MONTH_DIR/${PROJECT_NAME}-${DATE}"
if [ -f "$BACKUP_DIR/$MONTH_DIR/${PROJECT_NAME}-${DATE}.zip" ]; then
    du -sh "$BACKUP_DIR/$MONTH_DIR/${PROJECT_NAME}-${DATE}.zip"
fi

# 8. Alte Backups aufräumen (behalte nur die letzten 10)
echo "🧹 Räume alte Backups auf..."
cd "$BACKUP_DIR/$MONTH_DIR"
ls -t | grep "^${PROJECT_NAME}-" | tail -n +11 | xargs -r rm -rf
cd - > /dev/null

echo "✅ Lokales Backup erfolgreich erstellt!"
echo "📍 Backup Ort: $BACKUP_DIR/$MONTH_DIR/${PROJECT_NAME}-${DATE}"
echo "📍 Bare Repo: $BARE_REPO"

# 9. Backup-Status anzeigen
echo ""
echo "📊 Backup Übersicht:"
ls -la "$BACKUP_DIR/$MONTH_DIR/" | grep "$PROJECT_NAME"
echo ""
echo "🔧 Verwendung:"
echo "  ./backup-local.sh                    # Nur Backup ohne Commit"
echo "  ./backup-local.sh --commit           # Mit Commit vor Backup"
echo "  ./backup-local.sh --commit --zip     # Mit ZIP-Archiv"