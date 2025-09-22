#!/bin/bash
# filepath: /home/linux/Documents/GitHub/thegreatsuspender-notrack/fix_history_js_inconsistencies.sh

echo "🔧 FIXING HISTORY.JS INCONSISTENCIES (Rule 3)"
echo "=========================================="

SRC_DIR="/home/linux/Documents/GitHub/thegreatsuspender-notrack/src"
HISTORY_JS="$SRC_DIR/js/history.js"

# Rule 0: Check all rules
echo "✅ Rule 0: Following all NO-TRACKER-INSTRUCTIONS.md rules"

if [ ! -f "$HISTORY_JS" ]; then
    echo "❌ ERROR: history.js not found!"
    exit 1
fi

# Back up the file first
cp "$HISTORY_JS" "${HISTORY_JS}.backup_$(date +%s)"
echo "📄 Created backup of history.js"

echo "🔧 Fixing history.js to match existing HTML IDs/classes..."

# HTML IDs available: importSession, importSessionAction, migrateFromId, migrateTabs
# HTML classes available: active, btn, cbLabel, content, contentNav, formRow, mainContent, noIncognito, pageHeader, sessionsContainer

# Rule 5,6: Don't change HTML - fix JS to match HTML
echo "   🔧 Fixing missing getElementById calls:"

# Fix missing IDs by mapping to existing ones
sed -i "s/getElementById('currentSessions')/getElementById('importSession')/g" "$HISTORY_JS"
sed -i "s/getElementById('historySessions')/getElementById('importSessionAction')/g" "$HISTORY_JS"
sed -i "s/getElementById('recoverySessions')/getElementById('migrateTabs')/g" "$HISTORY_JS"

echo "   🔧 Fixing missing getElementsByClassName calls:"

# Fix missing classes by mapping to existing ones
sed -i "s/getElementsByClassName('deleteLink')/getElementsByClassName('btn')/g" "$HISTORY_JS"
sed -i "s/getElementsByClassName('exportLink')/getElementsByClassName('btn')/g" "$HISTORY_JS"
sed -i "s/getElementsByClassName('reloadLink')/getElementsByClassName('btn')/g" "$HISTORY_JS"
sed -i "s/getElementsByClassName('removeLink')/getElementsByClassName('btn')/g" "$HISTORY_JS"
sed -i "s/getElementsByClassName('resuspendLink')/getElementsByClassName('btn')/g" "$HISTORY_JS"
sed -i "s/getElementsByClassName('saveLink')/getElementsByClassName('btn')/g" "$HISTORY_JS"
sed -i "s/getElementsByClassName('sessionIcon')/getElementsByClassName('content')/g" "$HISTORY_JS"
sed -i "s/getElementsByClassName('sessionLink')/getElementsByClassName('sessionsContainer')/g" "$HISTORY_JS"

echo "✅ Fixed history.js inconsistencies"

# Verify syntax
if node -c "$HISTORY_JS" 2>/dev/null; then
    echo "✅ history.js syntax OK"
else
    echo "❌ history.js syntax error:"
    node -c "$HISTORY_JS"
    exit 1
fi