#!/bin/bash
echo "🔍 Checking background-wrapper.js syntax..."

BG_FILE="/home/linux/Documents/GitHub/thegreatsuspender-notrack/src/js/background-wrapper.js"

if [ ! -f "$BG_FILE" ]; then
    echo "❌ ERROR: background-wrapper.js not found!"
    exit 1
fi

echo "📄 File: $BG_FILE"

if node -c "$BG_FILE" 2>/dev/null; then
    echo "✅ JavaScript syntax is valid"
else
    echo "❌ SYNTAX ERRORS found:"
    node -c "$BG_FILE"
    echo ""
    echo "🔍 Showing problematic lines:"
    echo "Lines 820-830:"
    sed -n '820,830p' "$BG_FILE" | nl -v820
    echo ""
    echo "Lines 895-905:"
    sed -n '895,905p' "$BG_FILE" | nl -v895
    exit 1
fi
