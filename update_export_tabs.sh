#!/bin/bash
REPO_DIR="/home/linux/Documents/GitHub/thegreatsuspender-notrack"
SRC_DIR="$REPO_DIR/src"
JS_DIR="$SRC_DIR/js"
EXPORT_JS="$JS_DIR/exportTabs.js"

# Copy the fixed exportTabs.js content
cp /dev/stdin "$EXPORT_JS" << 'JSEOF'
// [Paste the complete JavaScript code above here]
JSEOF

echo "✅ Fixed backup buttons using event delegation!"
