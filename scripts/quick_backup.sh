#!/bin/bash
echo "🚀 QUICK BACKUP SCRIPT"
echo "====================="

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="/home/linux/Documents/GitHub/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="thegreatsuspender-notrack_backup_${TIMESTAMP}"

mkdir -p "$BACKUP_DIR"
cp -r "$REPO_DIR" "${BACKUP_DIR}/${BACKUP_NAME}"
cd "$BACKUP_DIR"
tar -czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"

echo "✅ Quick backup created: ${BACKUP_DIR}/${BACKUP_NAME}"
echo "🗜️ Compressed: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
echo "🕒 Timestamp: $TIMESTAMP"
