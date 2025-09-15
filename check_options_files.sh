#!/bin/bash
echo "🔍 Checking options.html and options.js together..."

OPTIONS_HTML="/home/linux/Documents/GitHub/thegreatsuspender-notrack/src/options.html"
OPTIONS_JS="/home/linux/Documents/GitHub/thegreatsuspender-notrack/src/js/options.js"

if [ -f "$OPTIONS_HTML" ]; then
    echo "✅ options.html exists"
    if grep -q "backupAllTabs" "$OPTIONS_HTML"; then
        echo "✅ Found backupAllTabs button in options.html"
    else
        echo "❌ backupAllTabs button NOT found in options.html"
    fi
else
    echo "❌ ERROR: options.html not found!"
    exit 1
fi

if [ -f "$OPTIONS_JS" ]; then
    echo "✅ options.js exists"
    if node -c "$OPTIONS_JS" 2>/dev/null; then
        echo "✅ options.js syntax OK"
    else
        echo "❌ SYNTAX ERROR in options.js:"
        node -c "$OPTIONS_JS"
        exit 1
    fi
    
    if grep -q "backupAllTabs" "$OPTIONS_JS"; then
        echo "✅ Found backupAllTabs function in options.js"
    else
        echo "❌ backupAllTabs function NOT found in options.js"
    fi
else
    echo "❌ ERROR: options.js not found!"
    exit 1
fi

echo "✅ Options files check complete."
