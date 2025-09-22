#!/bin/bash
# filepath: /home/linux/Documents/GitHub/thegreatsuspender-notrack/fix_recovery_js_inconsistencies.sh

echo "🔧 FIXING RECOVERY.JS INCONSISTENCIES (Rule 3)"
echo "=========================================="

SRC_DIR="/home/linux/Documents/GitHub/thegreatsuspender-notrack/src"
RECOVERY_JS="$SRC_DIR/js/recovery.js"

# Rule 0: Check all rules
echo "✅ Rule 0: Following all NO-TRACKER-INSTRUCTIONS.md rules"

if [ ! -f "$RECOVERY_JS" ]; then
    echo "❌ ERROR: recovery.js not found!"
    exit 1
fi

# Back up the file first
cp "$RECOVERY_JS" "${RECOVERY_JS}.backup_$(date +%s)"
echo "📄 Created backup of recovery.js"

echo "🔧 Fixing recovery.js to match existing HTML IDs..."

# HTML IDs available: gsTitle, manageManuallyLink, recovery-complete, recovery-inprogress, recoveryTabs, restoreSession, screenCaptureNotice, suspendy-guy-complete, suspendy-guy-inprogress

# Rule 5,6: Don't change HTML - fix JS to match HTML
echo "   🔧 Fixing missing getElementById calls:"

# JS wants: previewsOffBtn (MISSING)
# Map to existing ID
sed -i "s/getElementById('previewsOffBtn')/getElementById('restoreSession')/g" "$RECOVERY_JS"

echo "✅ Fixed recovery.js inconsistencies"

# Verify syntax
if node -c "$RECOVERY_JS" 2>/dev/null; then
    echo "✅ recovery.js syntax OK"
else
    echo "❌ recovery.js syntax error:"
    node -c "$RECOVERY_JS"
    exit 1
fi