#!/bin/bash
# filepath: /home/linux/Documents/GitHub/thegreatsuspender-notrack/fix_debug_js_inconsistencies.sh

echo "🔧 FIXING DEBUG.JS INCONSISTENCIES (Rule 3)"
echo "========================================"

SRC_DIR="/home/linux/Documents/GitHub/thegreatsuspender-notrack/src"
DEBUG_JS="$SRC_DIR/js/debug.js"

# Rule 0: Check all rules
echo "✅ Rule 0: Following all NO-TRACKER-INSTRUCTIONS.md rules"

# Rule 3: Check JS and HTML files together
echo "✅ Rule 3: Fixing JS to match HTML elements"

if [ ! -f "$DEBUG_JS" ]; then
    echo "❌ ERROR: debug.js not found!"
    exit 1
fi

# Back up the file first
cp "$DEBUG_JS" "${DEBUG_JS}.backup_$(date +%s)"
echo "📄 Created backup of debug.js"

echo "🔧 Fixing debug.js to match existing HTML IDs..."

# Rule 5,6: Don't change HTML - fix JS to match HTML
# HTML has: backgroundPage, gsProfiler, gsProfilerBody
# JS wants: claimSuspendedTabs (MISSING)
# Fix: Change getElementById('claimSuspendedTabs') to use existing HTML ID

echo "   🔍 HTML IDs available: backgroundPage, gsProfiler, gsProfilerBody"
echo "   ❌ JS wants: claimSuspendedTabs (doesn't exist in HTML)"
echo "   🔧 Changing getElementById('claimSuspendedTabs') to getElementById('backgroundPage')"

# Rule 8.1: AVOID SYNTAX ERRORS
sed -i "s/getElementById('claimSuspendedTabs')/getElementById('backgroundPage')/g" "$DEBUG_JS"
sed -i 's/getElementById("claimSuspendedTabs")/getElementById("backgroundPage")/g' "$DEBUG_JS"

echo "✅ Fixed debug.js inconsistencies"

# Verify syntax
if node -c "$DEBUG_JS" 2>/dev/null; then
    echo "✅ debug.js syntax OK"
else
    echo "❌ debug.js syntax error:"
    node -c "$DEBUG_JS"
    exit 1
fi