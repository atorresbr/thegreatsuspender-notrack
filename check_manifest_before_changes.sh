#!/bin/bash
echo "🔍 Checking manifest.json before making changes..."

MANIFEST_FILE="/home/linux/Documents/GitHub/thegreatsuspender-notrack/src/manifest.json"

if [ ! -f "$MANIFEST_FILE" ]; then
    echo "❌ ERROR: manifest.json not found!"
    exit 1
fi

if python3 -m json.tool "$MANIFEST_FILE" >/dev/null 2>&1; then
    echo "✅ manifest.json syntax OK"
else
    echo "❌ JSON SYNTAX ERROR in manifest.json:"
    python3 -m json.tool "$MANIFEST_FILE"
    exit 1
fi

echo "✅ Manifest check complete."
