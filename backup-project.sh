#!/bin/bash

# Get current date for backup name
BACKUP_DATE=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_NAME="quick-tok_backup_$BACKUP_DATE"
BACKUP_DIR="$HOME/Documents/quick-tok-backups"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Create a ZIP archive of the project
echo "Creating backup archive: $BACKUP_NAME.zip"
zip -r "$BACKUP_DIR/$BACKUP_NAME.zip" . -x "node_modules/*" -x ".git/*" -x "dist/*" -x ".DS_Store"

# Create a Git tag for this backup point
echo "Creating Git tag: backup-$BACKUP_DATE"
git tag "backup-$BACKUP_DATE"

echo "Backup completed successfully!"
echo "Backup location: $BACKUP_DIR/$BACKUP_NAME.zip"
echo "To restore from this point in Git, use: git checkout backup-$BACKUP_DATE" 