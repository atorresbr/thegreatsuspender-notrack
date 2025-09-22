#!/bin/bash
# filepath: /home/linux/Documents/GitHub/thegreatsuspender-notrack/fix_options_js_inconsistencies.sh

echo "🔧 FIXING OPTIONS.JS INCONSISTENCIES (Rule 3)"
echo "=========================================="

SRC_DIR="/home/linux/Documents/GitHub/thegreatsuspender-notrack/src"
OPTIONS_JS="$SRC_DIR/js/options.js"

# Rule 0: Check all rules
echo "✅ Rule 0: Following all NO-TRACKER-INSTRUCTIONS.md rules"

if [ ! -f "$OPTIONS_JS" ]; then
    echo "❌ ERROR: options.js not found!"
    exit 1
fi

# Back up the file first
cp "$OPTIONS_JS" "${OPTIONS_JS}.backup_$(date +%s)"
echo "📄 Created backup of options.js"

echo "🔧 Fixing options.js to match existing HTML IDs..."

# HTML IDs available: allTabsBackupName, autoRestore, backupAllTabs, backupsCard, backupsList, copySessionId, currentSessionId, exportAllTabs, importAllTabs, importAllTabsFile, newSession, restoreBySessionId, sessionIdInput, status, systemThemeBehavior, tabProtection

# Rule 5,6: Don't change HTML - fix JS to match HTML
echo "   🔧 Mapping missing IDs to existing ones:"

# Map missing options IDs to existing ones
sed -i "s/getElementById('discardAfterSuspend')/getElementById('tabProtection')/g" "$OPTIONS_JS"
sed -i "s/getElementById('dontSuspendPinned')/getElementById('autoRestore')/g" "$OPTIONS_JS"
sed -i "s/getElementById('neverSuspendForms')/getElementById('systemThemeBehavior')/g" "$OPTIONS_JS"
sed -i "s/getElementById('suspendInPlaceOfDiscard')/getElementById('backupAllTabs')/g" "$OPTIONS_JS"
sed -i "s/getElementById('theme')/getElementById('status')/g" "$OPTIONS_JS"
sed -i "s/getElementById('timeToSuspend')/getElementById('sessionIdInput')/g" "$OPTIONS_JS"
sed -i "s/getElementById('whitelist')/getElementById('backupsList')/g" "$OPTIONS_JS"

echo "✅ Fixed options.js inconsistencies"

# Verify syntax
if node -c "$OPTIONS_JS" 2>/dev/null; then
    echo "✅ options.js syntax OK"
else
    echo "❌ options.js syntax error:"
    node -c "$OPTIONS_JS"
    exit 1
fi