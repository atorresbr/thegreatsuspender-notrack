#!/bin/bash
echo "🔍 Checking all files before making changes..."

SRC_DIR="/home/linux/Documents/GitHub/thegreatsuspender-notrack/src"

if [ ! -d "$SRC_DIR" ]; then
    echo "❌ ERROR: src folder not found!"
    exit 1
fi

echo "📂 Checking all files in src folder..."
find "$SRC_DIR" -name "*.js" -type f | while read -r file; do
    echo "   📄 $file"
    if ! node -c "$file" 2>/dev/null; then
        echo "   ❌ SYNTAX ERROR in $file"
        node -c "$file"
        exit 1
    else
        echo "   ✅ Syntax OK"
    fi
done

find "$SRC_DIR" -name "*.html" -type f | while read -r file; do
    echo "   📄 $file (HTML)"
    echo "   ✅ HTML exists"
done

find "$SRC_DIR" -name "*.json" -type f | while read -r file; do
    echo "   📄 $file"
    if python3 -m json.tool "$file" >/dev/null 2>&1; then
        echo "   ✅ JSON syntax OK"
    else
        echo "   ❌ JSON SYNTAX ERROR in $file"
        python3 -m json.tool "$file"
        exit 1
    fi
done

echo "✅ General file check complete."
