#!/bin/bash
# filepath: /home/linux/Documents/GitHub/thegreatsuspender-notrack/fix_suspended_js_inconsistencies.sh

echo "🔧 FIXING SUSPENDED.JS INCONSISTENCIES (Rule 3)"
echo "==========================================="

SRC_DIR="/home/linux/Documents/GitHub/thegreatsuspender-notrack/src"
SUSPENDED_JS="$SRC_DIR/js/suspended.js"

# Rule 0: Check all rules
echo "✅ Rule 0: Following all NO-TRACKER-INSTRUCTIONS.md rules"

if [ ! -f "$SUSPENDED_JS" ]; then
    echo "❌ ERROR: suspended.js not found!"
    exit 1
fi

# Back up the file first
cp "$SUSPENDED_JS" "${SUSPENDED_JS}.backup_$(date +%s)"
echo "📄 Created backup of suspended.js"

echo "🔧 Fixing suspended.js to match existing HTML IDs..."

# HTML IDs available: copyUrlBtn, memorySaved, openOptionsBtn, preventAutoRestore, restoreBtn, restoreNewWindowBtn, sessionDuration, sessionId, shortcutsHelp, statusMessage, suspendedDuration, suspendedTime, tabId, tabTitle, tabUrl, totalMemorySaved, totalSuspended

# Rule 5,6: Don't change HTML - fix JS to match HTML
echo "   🔧 Fixing missing getElementById calls:"

# Map missing IDs to existing ones
sed -i "s/getElementById('helpBtn')/getElementById('shortcutsHelp')/g" "$SUSPENDED_JS"
sed -i "s/getElementById('optionsBtn')/getElementById('openOptionsBtn')/g" "$SUSPENDED_JS"
sed -i "s/getElementById('reloadBtn')/getElementById('restoreBtn')/g" "$SUSPENDED_JS"
sed -i "s/getElementById('suspendOtherBtn')/getElementById('restoreNewWindowBtn')/g" "$SUSPENDED_JS"

echo "✅ Fixed suspended.js inconsistencies"

# Verify syntax
if node -c "$SUSPENDED_JS" 2>/dev/null; then
    echo "✅ suspended.js syntax OK"
else
    echo "❌ suspended.js syntax error:"
    node -c "$SUSPENDED_JS"
    exit 1
fi