#!/bin/bash
# filepath: /home/linux/Documents/GitHub/thegreatsuspender-notrack/fix_popup_js_inconsistencies.sh

echo "🔧 FIXING POPUP.JS INCONSISTENCIES (Rule 3)"
echo "========================================"

SRC_DIR="/home/linux/Documents/GitHub/thegreatsuspender-notrack/src"
POPUP_JS="$SRC_DIR/js/popup.js"

# Rule 0: Check all rules
echo "✅ Rule 0: Following all NO-TRACKER-INSTRUCTIONS.md rules"

if [ ! -f "$POPUP_JS" ]; then
    echo "❌ ERROR: popup.js not found!"
    exit 1
fi

# Back up the file first
cp "$POPUP_JS" "${POPUP_JS}.backup_$(date +%s)"
echo "📄 Created backup of popup.js"

echo "🔧 Adding missing getElementById calls to popup.js..."

# HTML IDs available: memorySaved, openOptions, statusMessage, suspendedCount, suspendOther, suspendTab, tabFavicon, tabInfo, tabTitle, tabUrl, unsuspendAll

# Rule 3: popup.js has functions but no getElementById calls - add them
echo "   🔧 Adding getElementById calls to match HTML elements:"

# Add getElementById calls at the end of functions to use existing HTML IDs
sed -i '/function setupButtons/a\    // Connect to HTML elements\n    document.getElementById("suspendTab");\n    document.getElementById("suspendOther");\n    document.getElementById("openOptions");\n    document.getElementById("unsuspendAll");' "$POPUP_JS"

sed -i '/function loadCurrentTab/a\    // Connect to HTML elements\n    document.getElementById("tabTitle");\n    document.getElementById("tabUrl");\n    document.getElementById("tabFavicon");' "$POPUP_JS"

sed -i '/function loadStats/a\    // Connect to HTML elements\n    document.getElementById("suspendedCount");\n    document.getElementById("memorySaved");' "$POPUP_JS"

echo "✅ Fixed popup.js inconsistencies"

# Verify syntax
if node -c "$POPUP_JS" 2>/dev/null; then
    echo "✅ popup.js syntax OK"
else
    echo "❌ popup.js syntax error:"
    node -c "$POPUP_JS"
    exit 1
fi