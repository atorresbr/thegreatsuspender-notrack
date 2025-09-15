#!/bin/bash
# filepath: /home/linux/Documents/GitHub/thegreatsuspender-notrack/check_all_files_after_fix.sh

echo "🔍 Checking all src folder files after fix..."

SRC_DIR="/home/linux/Documents/GitHub/thegreatsuspender-notrack/src"

echo "📂 Checking all JavaScript files for syntax errors:"
find "$SRC_DIR" -name "*.js" -type f | while read -r file; do
    echo "   📄 $file"
    if node -c "$file" 2>/dev/null; then
        echo "   ✅ Syntax OK"
    else
        echo "   ❌ SYNTAX ERROR in $file"
        node -c "$file"
        exit 1
    fi
done

echo ""
echo "📂 Checking manifest.json:"
MANIFEST_FILE="$SRC_DIR/manifest.json"
if python3 -m json.tool "$MANIFEST_FILE" >/dev/null 2>&1; then
    echo "✅ manifest.json syntax OK"
else
    echo "❌ JSON SYNTAX ERROR in manifest.json"
    exit 1
fi

echo "✅ All files check passed"